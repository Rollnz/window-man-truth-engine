import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin email whitelist (same as other admin functions)
const ADMIN_EMAILS = [
  'vansiclenp@gmail.com',
  'mongoloyd@protonmail.com',
];

/**
 * Admin Global Search Edge Function
 * 
 * Searches across:
 * - wm_leads: email, phone, first_name, last_name, id, lead_id, city, notes, original_source_tool
 * - lead_notes: content (joined back to wm_leads)
 * - phone_call_logs: ai_notes (joined back to wm_leads via lead_id)
 * 
 * Supports filters:
 * - status: comma-separated list of statuses
 * - quality: comma-separated list of quality levels
 * - match_type: lead_fields, notes, call_notes
 * - date_from, date_to: ISO date strings for created_at range
 * 
 * Returns suggestions with match highlighting data and total count for "View all" feature
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Auth check using anon client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin whitelist
    const userEmail = user.email?.toLowerCase();
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query params
    const url = new URL(req.url);
    const query = url.searchParams.get('q')?.trim() || '';
    const limitParam = parseInt(url.searchParams.get('limit') || '8', 10);
    const limit = Math.min(Math.max(1, limitParam), 50);

    // Parse filter params
    const statusFilter = url.searchParams.get('status')?.split(',').filter(Boolean) || [];
    const qualityFilter = url.searchParams.get('quality')?.split(',').filter(Boolean) || [];
    const matchTypeFilter = url.searchParams.get('match_type')?.split(',').filter(Boolean) || [];
    const dateFrom = url.searchParams.get('date_from') || null;
    const dateTo = url.searchParams.get('date_to') || null;

    // Determine which sources to search based on match_type filter
    const searchLeadFields = matchTypeFilter.length === 0 || matchTypeFilter.includes('lead_fields');
    const searchNotes = matchTypeFilter.length === 0 || matchTypeFilter.includes('notes');
    const searchCallNotes = matchTypeFilter.length === 0 || matchTypeFilter.includes('call_notes');

    // If query too short, return empty
    if (query.length < 2) {
      return new Response(
        JSON.stringify({ q: query, suggestions: [], results: [], total_count: 0, has_more: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client for actual queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const searchPattern = `%${query}%`;
    const digitsOnly = query.replace(/\D/g, '');
    const isUUID = /^[0-9a-f-]{8,36}$/i.test(query);

    // Results map to deduplicate (key = wm_leads.id)
    const resultsMap = new Map<string, any>();
    
    // Track total potential matches for "has_more" indicator
    let totalPotentialMatches = 0;

    // Helper to apply filters to a query
    const applyFilters = (queryBuilder: any) => {
      if (statusFilter.length > 0) {
        queryBuilder = queryBuilder.in('status', statusFilter);
      }
      if (qualityFilter.length > 0) {
        queryBuilder = queryBuilder.in('lead_quality', qualityFilter);
      }
      if (dateFrom) {
        queryBuilder = queryBuilder.gte('created_at', dateFrom);
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        queryBuilder = queryBuilder.lt('created_at', endDate.toISOString().split('T')[0]);
      }
      return queryBuilder;
    };

    // 1. Search wm_leads directly (if searchLeadFields)
    if (searchLeadFields) {
      let orConditions: string[] = [
        `email.ilike.${searchPattern}`,
        `phone.ilike.${searchPattern}`,
        `first_name.ilike.${searchPattern}`,
        `last_name.ilike.${searchPattern}`,
        `city.ilike.${searchPattern}`,
        `notes.ilike.${searchPattern}`,
        `original_source_tool.ilike.${searchPattern}`,
      ];

      // Add phone digit matching if query has 3+ digits
      if (digitsOnly.length >= 3) {
        orConditions.push(`phone.ilike.%${digitsOnly}%`);
      }

      // Get count first for total
      let countQuery = supabaseAdmin
        .from('wm_leads')
        .select('id', { count: 'exact', head: true })
        .or(orConditions.join(','));
      countQuery = applyFilters(countQuery);
      const { count: leadCount } = await countQuery;
      
      totalPotentialMatches += leadCount || 0;

      let dataQuery = supabaseAdmin
        .from('wm_leads')
        .select('id, email, phone, first_name, last_name, status, engagement_score, city, notes, lead_id, original_source_tool, lead_quality, created_at')
        .or(orConditions.join(','))
        .limit(limit);
      dataQuery = applyFilters(dataQuery);
      
      const { data: leadMatches, error: leadError } = await dataQuery;

      if (leadError) {
        console.error('Lead search error:', leadError);
      }

      // Process lead matches and determine match_field
      if (leadMatches) {
        for (const lead of leadMatches) {
          const matchInfo = determineMatchField(lead, query, digitsOnly);
          resultsMap.set(lead.id, {
            type: 'lead',
            id: lead.id,
            title: formatName(lead.first_name, lead.last_name, lead.email),
            subtitle: formatSubtitle(lead.email, lead.phone),
            status: lead.status,
            engagement_score: lead.engagement_score,
            ...matchInfo,
          });
        }
      }

      // 2. Search UUID match if applicable
      if (isUUID && resultsMap.size < limit) {
        let uuidQuery = supabaseAdmin
          .from('wm_leads')
          .select('id, email, phone, first_name, last_name, status, engagement_score, city, notes, lead_id, lead_quality, created_at')
          .or(`id.eq.${query},lead_id.eq.${query}`)
          .limit(limit - resultsMap.size);
        uuidQuery = applyFilters(uuidQuery);
        
        const { data: uuidMatches } = await uuidQuery;

        if (uuidMatches) {
          for (const lead of uuidMatches) {
            if (!resultsMap.has(lead.id)) {
              resultsMap.set(lead.id, {
                type: 'lead',
                id: lead.id,
                title: formatName(lead.first_name, lead.last_name, lead.email),
                subtitle: formatSubtitle(lead.email, lead.phone),
                status: lead.status,
                engagement_score: lead.engagement_score,
                match_field: 'id',
                match_snippet: lead.id,
                match_positions: [{ start: 0, length: query.length }],
              });
            }
          }
        }
      }
    }

    // 3. Search lead_notes content (if searchNotes)
    if (searchNotes && resultsMap.size < limit) {
      let notesQuery = supabaseAdmin
        .from('lead_notes')
        .select('lead_id, content', { count: 'exact' })
        .ilike('content', searchPattern)
        .limit(limit);

      // Apply date filters to notes search
      if (dateFrom) {
        notesQuery = notesQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        notesQuery = notesQuery.lt('created_at', endDate.toISOString().split('T')[0]);
      }

      const { data: noteMatches, count: noteCount, error: noteError } = await notesQuery;

      // Add unique note matches to total (approximate)
      if (noteCount) {
        totalPotentialMatches += noteCount;
      }

      if (noteError) {
        console.error('Note search error:', noteError);
      }

      if (noteMatches && noteMatches.length > 0) {
        const noteLeadIds = noteMatches
          .map(n => n.lead_id)
          .filter(id => !resultsMap.has(id));

        if (noteLeadIds.length > 0) {
          let noteLeadsQuery = supabaseAdmin
            .from('wm_leads')
            .select('id, email, phone, first_name, last_name, status, engagement_score, lead_quality, created_at')
            .in('id', noteLeadIds)
            .limit(limit - resultsMap.size);
          noteLeadsQuery = applyFilters(noteLeadsQuery);
          
          const { data: noteLeads } = await noteLeadsQuery;

          if (noteLeads) {
            for (const lead of noteLeads) {
              const noteContent = noteMatches.find(n => n.lead_id === lead.id)?.content || '';
              const snippetInfo = createSnippet(noteContent, query, 'notes');
              
              resultsMap.set(lead.id, {
                type: 'lead',
                id: lead.id,
                title: formatName(lead.first_name, lead.last_name, lead.email),
                subtitle: formatSubtitle(lead.email, lead.phone),
                status: lead.status,
                engagement_score: lead.engagement_score,
                match_field: 'notes',
                match_snippet: snippetInfo.snippet,
                match_positions: snippetInfo.positions,
              });
            }
          }
        }
      }
    }

    // 4. Search phone_call_logs.ai_notes (if searchCallNotes)
    if (searchCallNotes && resultsMap.size < limit) {
      const { data: callMatches, count: callCount, error: callError } = await supabaseAdmin
        .from('phone_call_logs')
        .select('lead_id, ai_notes, source_tool, call_status', { count: 'exact' })
        .not('lead_id', 'is', null)
        .ilike('ai_notes', searchPattern)
        .limit(limit);

      // Add unique call log matches to total
      if (callCount) {
        totalPotentialMatches += callCount;
      }

      if (callError) {
        console.error('Call log search error:', callError);
      }

      if (callMatches && callMatches.length > 0) {
        // Get unique lead_ids not already in results
        const callLeadIds = [...new Set(callMatches.map(c => c.lead_id))]
          .filter(id => id && !resultsMap.has(id));

        if (callLeadIds.length > 0) {
          // phone_call_logs.lead_id references leads.id, need to find corresponding wm_leads
          let wmLeadsQuery = supabaseAdmin
            .from('wm_leads')
            .select('id, lead_id, email, phone, first_name, last_name, status, engagement_score, lead_quality, created_at')
            .in('lead_id', callLeadIds)
            .limit(limit - resultsMap.size);
          wmLeadsQuery = applyFilters(wmLeadsQuery);
          
          const { data: wmLeads } = await wmLeadsQuery;

          if (wmLeads) {
            for (const lead of wmLeads) {
              const callLog = callMatches.find(c => c.lead_id === lead.lead_id);
              if (callLog && callLog.ai_notes) {
                const snippetInfo = createSnippet(callLog.ai_notes, query, 'call_notes');
                
                resultsMap.set(lead.id, {
                  type: 'lead',
                  id: lead.id,
                  title: formatName(lead.first_name, lead.last_name, lead.email),
                  subtitle: formatSubtitle(lead.email, lead.phone),
                  status: lead.status,
                  engagement_score: lead.engagement_score,
                  match_field: 'call_notes',
                  match_snippet: snippetInfo.snippet,
                  match_positions: snippetInfo.positions,
                });
              }
            }
          }
        }
      }
    }

    const suggestions = Array.from(resultsMap.values()).slice(0, limit);
    const totalCount = resultsMap.size;
    const hasMore = totalPotentialMatches > limit;

    // Log search (masked PII)
    console.log(`[admin-global-search] query_len=${query.length} results=${suggestions.length} total_potential=${totalPotentialMatches} filters={status:${statusFilter.length},quality:${qualityFilter.length},match:${matchTypeFilter.length}}`);

    return new Response(
      JSON.stringify({ 
        q: query, 
        suggestions, 
        results: suggestions,
        total_count: totalCount,
        has_more: hasMore,
        filters_applied: {
          status: statusFilter,
          quality: qualityFilter,
          match_type: matchTypeFilter,
          date_from: dateFrom,
          date_to: dateTo,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Global search error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Format display name
function formatName(firstName: string | null, lastName: string | null, email: string): string {
  const name = `${firstName || ''} ${lastName || ''}`.trim();
  return name || email.split('@')[0];
}

// Helper: Format subtitle with email and phone
function formatSubtitle(email: string, phone: string | null): string {
  if (phone) {
    return `${email} | ${phone}`;
  }
  return email;
}

// Helper: Determine which field matched and compute positions
function determineMatchField(
  lead: any,
  query: string,
  digitsOnly: string
): { match_field: string; match_snippet: string; match_positions: Array<{ start: number; length: number }> } {
  const q = query.toLowerCase();

  // Check email
  if (lead.email?.toLowerCase().includes(q)) {
    const pos = lead.email.toLowerCase().indexOf(q);
    return {
      match_field: 'email',
      match_snippet: lead.email,
      match_positions: [{ start: pos, length: query.length }],
    };
  }

  // Check phone (both raw and digits-only)
  if (lead.phone) {
    const phoneLower = lead.phone.toLowerCase();
    if (phoneLower.includes(q)) {
      const pos = phoneLower.indexOf(q);
      return {
        match_field: 'phone',
        match_snippet: lead.phone,
        match_positions: [{ start: pos, length: query.length }],
      };
    }
    // Digits-only match - calculate position in the FORMATTED phone string
    const phoneDigits = lead.phone.replace(/\D/g, '');
    if (digitsOnly.length >= 3 && phoneDigits.includes(digitsOnly)) {
      const digitMatchStart = phoneDigits.indexOf(digitsOnly);
      
      // Walk through the original phone to find the visual position
      let visualStart = -1;
      let visualEnd = -1;
      let digitCount = 0;
      
      for (let i = 0; i < lead.phone.length; i++) {
        if (/\d/.test(lead.phone[i])) {
          if (digitCount === digitMatchStart) {
            visualStart = i;
          }
          if (digitCount === digitMatchStart + digitsOnly.length - 1) {
            visualEnd = i + 1;
            break;
          }
          digitCount++;
        }
      }
      
      if (visualStart !== -1 && visualEnd !== -1) {
        return {
          match_field: 'phone',
          match_snippet: lead.phone,
          match_positions: [{ start: visualStart, length: visualEnd - visualStart }],
        };
      }
    }
  }

  // Check first_name
  if (lead.first_name?.toLowerCase().includes(q)) {
    const pos = lead.first_name.toLowerCase().indexOf(q);
    return {
      match_field: 'name',
      match_snippet: lead.first_name,
      match_positions: [{ start: pos, length: query.length }],
    };
  }

  // Check last_name
  if (lead.last_name?.toLowerCase().includes(q)) {
    const pos = lead.last_name.toLowerCase().indexOf(q);
    return {
      match_field: 'name',
      match_snippet: lead.last_name,
      match_positions: [{ start: pos, length: query.length }],
    };
  }

  // Check city
  if (lead.city?.toLowerCase().includes(q)) {
    const pos = lead.city.toLowerCase().indexOf(q);
    return {
      match_field: 'city',
      match_snippet: lead.city,
      match_positions: [{ start: pos, length: query.length }],
    };
  }

  // Check notes (on lead itself)
  if (lead.notes?.toLowerCase().includes(q)) {
    const snippetInfo = createSnippet(lead.notes, query, 'notes');
    return {
      match_field: snippetInfo.match_field,
      match_snippet: snippetInfo.snippet,
      match_positions: snippetInfo.positions,
    };
  }

  // Check source tool
  if (lead.original_source_tool?.toLowerCase().includes(q)) {
    const pos = lead.original_source_tool.toLowerCase().indexOf(q);
    return {
      match_field: 'source',
      match_snippet: lead.original_source_tool,
      match_positions: [{ start: pos, length: query.length }],
    };
  }

  // Fallback
  return {
    match_field: 'unknown',
    match_snippet: '',
    match_positions: [],
  };
}

// Helper: Create a snippet around the match for long text
function createSnippet(
  text: string,
  query: string,
  field: string = 'notes'
): { match_field: string; snippet: string; positions: Array<{ start: number; length: number }> } {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const pos = lowerText.indexOf(lowerQuery);

  if (pos === -1) {
    return { match_field: field, snippet: text.slice(0, 60), positions: [] };
  }

  const snippetRadius = 30;
  const start = Math.max(0, pos - snippetRadius);
  const end = Math.min(text.length, pos + query.length + snippetRadius);
  
  let snippet = text.slice(start, end);
  const newPos = pos - start;

  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  const adjustedPos = start > 0 ? newPos + 3 : newPos; // account for ellipsis

  return {
    match_field: field,
    snippet,
    positions: [{ start: adjustedPos, length: query.length }],
  };
}
