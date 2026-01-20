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
 * 
 * Returns suggestions with match highlighting data
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
    const limit = Math.min(Math.max(1, limitParam), 20);

    // If query too short, return empty
    if (query.length < 2) {
      return new Response(
        JSON.stringify({ q: query, suggestions: [], results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client for actual queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const searchPattern = `%${query}%`;
    const digitsOnly = query.replace(/\D/g, '');
    const isUUID = /^[0-9a-f-]{8,36}$/i.test(query);

    // Results map to deduplicate
    const resultsMap = new Map<string, any>();

    // 1. Search wm_leads directly
    // Build OR filter for multiple fields
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

    const { data: leadMatches, error: leadError } = await supabaseAdmin
      .from('wm_leads')
      .select('id, email, phone, first_name, last_name, status, engagement_score, city, notes, lead_id, original_source_tool')
      .or(orConditions.join(','))
      .limit(limit);

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
      const { data: uuidMatches } = await supabaseAdmin
        .from('wm_leads')
        .select('id, email, phone, first_name, last_name, status, engagement_score, city, notes, lead_id')
        .or(`id.eq.${query},lead_id.eq.${query}`)
        .limit(limit - resultsMap.size);

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

    // 3. Search lead_notes content
    if (resultsMap.size < limit) {
      const { data: noteMatches, error: noteError } = await supabaseAdmin
        .from('lead_notes')
        .select('lead_id, content')
        .ilike('content', searchPattern)
        .limit(limit);

      if (noteError) {
        console.error('Note search error:', noteError);
      }

      if (noteMatches && noteMatches.length > 0) {
        const noteLeadIds = noteMatches
          .map(n => n.lead_id)
          .filter(id => !resultsMap.has(id));

        if (noteLeadIds.length > 0) {
          const { data: noteLeads } = await supabaseAdmin
            .from('wm_leads')
            .select('id, email, phone, first_name, last_name, status, engagement_score')
            .in('id', noteLeadIds)
            .limit(limit - resultsMap.size);

          if (noteLeads) {
            for (const lead of noteLeads) {
              const noteContent = noteMatches.find(n => n.lead_id === lead.id)?.content || '';
              const snippetInfo = createSnippet(noteContent, query);
              
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

    const suggestions = Array.from(resultsMap.values()).slice(0, limit);

    // Log search (masked PII)
    console.log(`[admin-global-search] query_len=${query.length} results=${suggestions.length}`);

    return new Response(
      JSON.stringify({ q: query, suggestions, results: suggestions }),
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
    // Digits-only match
    const phoneDigits = lead.phone.replace(/\D/g, '');
    if (digitsOnly.length >= 3 && phoneDigits.includes(digitsOnly)) {
      // Find position in original phone string (approximate)
      const digitPos = phoneDigits.indexOf(digitsOnly);
      return {
        match_field: 'phone',
        match_snippet: lead.phone,
        match_positions: [{ start: digitPos, length: digitsOnly.length }],
      };
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
    return createSnippet(lead.notes, query, 'notes');
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
): { match_field: string; snippet: string; match_snippet: string; positions: Array<{ start: number; length: number }>; match_positions: Array<{ start: number; length: number }> } {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const pos = lowerText.indexOf(lowerQuery);

  if (pos === -1) {
    return { match_field: field, snippet: text.slice(0, 60), match_snippet: text.slice(0, 60), positions: [], match_positions: [] };
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
    match_snippet: snippet,
    positions: [{ start: adjustedPos, length: query.length }],
    match_positions: [{ start: adjustedPos, length: query.length }],
  };
}
