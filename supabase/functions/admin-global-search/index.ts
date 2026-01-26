import { validateAdminRequest, corsHeaders } from "../_shared/adminAuth.ts";

/**
 * ============================================================================
 * ADMIN GLOBAL SEARCH - Production-Grade Unified Search
 * ============================================================================
 * 
 * PERFORMANCE CHECKLIST:
 * - Uses global_search_index table with GIN index on search_tsv (full-text)
 * - Uses GIN trigram index on keywords for fuzzy/partial matching
 * - Uses btree index on (entity_type, updated_at) for grouped pagination
 * - Single table query instead of N-table UNION
 * - Target: <300ms at 10k-100k rows
 */

const ENTITY_TYPE_LABELS: Record<string, string> = {
  lead: 'Lead',
  call: 'Call',
  pending_call: 'Pending Call',
  note: 'Note',
  session: 'Session',
  quote_upload: 'Quote Upload',
  consultation: 'Consultation',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = await validateAdminRequest(req);
    if (!validation.ok) {
      return validation.response;
    }
    const { supabaseAdmin } = validation;

    // Parse query params
    const url = new URL(req.url);
    const query = url.searchParams.get('q')?.trim() || '';
    const limitParam = parseInt(url.searchParams.get('limit') || '12', 10);
    const limit = Math.min(Math.max(1, limitParam), 50);

    // Parse filter params
    const entityTypeFilter = url.searchParams.get('entity_type')?.split(',').filter(Boolean) || [];
    const cursorUpdatedAt = url.searchParams.get('cursor_updated_at') || null;

    // If query too short, return empty
    if (query.length < 2) {
      return new Response(
        JSON.stringify({ 
          q: query, 
          items: [], 
          grouped: {},
          total_count: 0, 
          has_more: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    const startTime = Date.now();
    const digitsOnly = query.replace(/\D/g, '');
    const isUUID = /^[0-9a-f-]{8,36}$/i.test(query);
    const queryLower = query.toLowerCase();

    // Build search query using global_search_index
    // Uses ILIKE on keywords which leverages the trigram GIN index
    let searchQuery = supabaseAdmin
      .from('global_search_index')
      .select('id, entity_type, entity_id, lead_id, title, subtitle, keywords, payload, updated_at')
      .or(`keywords.ilike.%${queryLower}%,entity_id.eq.${isUUID ? query : '00000000-0000-0000-0000-000000000000'}`)
      .order('updated_at', { ascending: false })
      .limit(limit + 1);

    // Apply entity type filter
    if (entityTypeFilter.length > 0) {
      searchQuery = searchQuery.in('entity_type', entityTypeFilter);
    }

    // Apply cursor pagination
    if (cursorUpdatedAt) {
      searchQuery = searchQuery.lt('updated_at', cursorUpdatedAt);
    }

    const { data: indexResults, error: indexError } = await searchQuery;

    if (indexError) {
      console.error('[admin-global-search] Search index error:', indexError);
      throw new Error('Search query failed: ' + indexError.message);
    }

    const hasMore = (indexResults?.length || 0) > limit;
    const items = (indexResults || []).slice(0, limit);

    // Calculate match highlights for each result
    const enrichedItems = items.map(item => {
      const matchInfo = calculateMatchHighlight(item.keywords || '', item.title || '', item.subtitle || '', query, digitsOnly);
      
      // For lead-type entities, entity_id IS the wm_leads.id (canonical)
      // lead_id in the index refers to the associated leads.id (if any)
      const isLeadEntity = item.entity_type === 'lead';
      
      return {
        entity_type: item.entity_type,
        entity_type_label: ENTITY_TYPE_LABELS[item.entity_type] || item.entity_type,
        entity_id: item.entity_id,
        // === CANONICAL ID FIELDS FOR ROUTING ===
        // wm_lead_id: For lead entities, this is entity_id. For child entities (notes, calls), this is lead_id
        wm_lead_id: isLeadEntity ? item.entity_id : item.lead_id,
        lead_id: item.lead_id, // Public leads.id (for reference, not routing)
        title: item.title,
        subtitle: item.subtitle,
        updated_at: item.updated_at,
        payload: item.payload,
        match_reason: matchInfo.reason,
        match_field: matchInfo.field,
        match_snippet: matchInfo.snippet,
        match_positions: matchInfo.positions,
      };
    });

    // Group by entity type for UI
    const grouped: Record<string, typeof enrichedItems> = {};
    for (const item of enrichedItems) {
      if (!grouped[item.entity_type]) {
        grouped[item.entity_type] = [];
      }
      grouped[item.entity_type].push(item);
    }

    const executionTime = Date.now() - startTime;

    // Log search metrics (no PII)
    console.log(`[admin-global-search] query_len=${query.length} results=${items.length} has_more=${hasMore} time_ms=${executionTime} entity_types=${Object.keys(grouped).join(',')}`);

    return new Response(
      JSON.stringify({
        q: query,
        items: enrichedItems,
        grouped,
        total_count: items.length,
        has_more: hasMore,
        next_cursor: hasMore && items.length > 0 ? items[items.length - 1].updated_at : null,
        execution_time_ms: executionTime,
        filters_applied: {
          entity_type: entityTypeFilter,
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

/**
 * Calculate match highlight information for a result
 * Checks title, subtitle, and keywords to determine best match display
 */
function calculateMatchHighlight(
  keywords: string,
  title: string,
  subtitle: string,
  query: string,
  digitsOnly: string
): { reason: string; field: string; snippet: string; positions: Array<{ start: number; length: number }> } {
  const q = query.toLowerCase();

  // Check title first (most visible)
  const titleLower = (title || '').toLowerCase();
  const titleIndex = titleLower.indexOf(q);
  if (titleIndex !== -1) {
    return {
      reason: 'exact_match',
      field: 'title',
      snippet: title,
      positions: [{ start: titleIndex, length: query.length }],
    };
  }

  // Check subtitle (email, phone display)
  const subtitleLower = (subtitle || '').toLowerCase();
  const subtitleIndex = subtitleLower.indexOf(q);
  if (subtitleIndex !== -1) {
    return {
      reason: 'exact_match',
      field: 'subtitle',
      snippet: subtitle,
      positions: [{ start: subtitleIndex, length: query.length }],
    };
  }

  // Check for digit match in subtitle (phone numbers)
  if (digitsOnly.length >= 3 && subtitle) {
    const subtitleDigits = subtitle.replace(/\D/g, '');
    const digitIndex = subtitleDigits.indexOf(digitsOnly);
    if (digitIndex !== -1) {
      // Calculate visual position in formatted string
      let visualStart = -1;
      let visualEnd = -1;
      let digitCount = 0;
      
      for (let i = 0; i < subtitle.length; i++) {
        if (/\d/.test(subtitle[i])) {
          if (digitCount === digitIndex) {
            visualStart = i;
          }
          if (digitCount === digitIndex + digitsOnly.length - 1) {
            visualEnd = i + 1;
            break;
          }
          digitCount++;
        }
      }
      
      if (visualStart !== -1 && visualEnd !== -1) {
        return {
          reason: 'digits',
          field: 'phone',
          snippet: subtitle,
          positions: [{ start: visualStart, length: visualEnd - visualStart }],
        };
      }
    }
  }

  // Check keywords for match context
  const keywordsLower = keywords.toLowerCase();
  const matchIndex = keywordsLower.indexOf(q);
  if (matchIndex !== -1) {
    // Create a snippet around the match
    const snippetStart = Math.max(0, matchIndex - 20);
    const snippetEnd = Math.min(keywords.length, matchIndex + query.length + 30);
    let snippet = keywords.substring(snippetStart, snippetEnd);
    
    if (snippetStart > 0) snippet = '...' + snippet;
    if (snippetEnd < keywords.length) snippet = snippet + '...';
    
    // Adjust position for snippet offset
    const adjustedStart = matchIndex - snippetStart + (snippetStart > 0 ? 3 : 0);
    
    return {
      reason: 'keyword_match',
      field: 'keywords',
      snippet,
      positions: [{ start: adjustedStart, length: query.length }],
    };
  }

  // Fallback: partial/fuzzy match
  return {
    reason: 'partial',
    field: 'keywords',
    snippet: keywords.substring(0, 60) + (keywords.length > 60 ? '...' : ''),
    positions: [],
  };
}
