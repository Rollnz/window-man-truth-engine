import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email whitelist - must be lowercase for comparison
const ADMIN_EMAILS = [
  "admin@windowtruth.com",
  "tim@impactwindowexperts.com",
  "tim@itswindowman.com",
  "vansiclenp@gmail.com",
  "mongoloyd@protonmail.com",
];

interface QuoteFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  session_id: string;
  lead_id: string | null;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  deleted_at: string | null;
}

interface QuoteWithLead extends QuoteFile {
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  signed_url: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = user.email?.toLowerCase() || "";
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const method = req.method;

    // GET - Fetch quote files with lead info and signed URLs
    if (method === "GET") {
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const hasLead = url.searchParams.get("hasLead");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // Fetch quote files
      let query = supabase
        .from("quote_files")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", `${endDate}T23:59:59`);
      }
      if (hasLead === "true") {
        query = query.not("lead_id", "is", null);
      } else if (hasLead === "false") {
        query = query.is("lead_id", null);
      }

      const { data: quoteFiles, error: queryError } = await query;

      if (queryError) {
        console.error("Query error:", queryError);
        return new Response(JSON.stringify({ error: "Failed to fetch quote files" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get total count
      let countQuery = supabase
        .from("quote_files")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);

      if (startDate) {
        countQuery = countQuery.gte("created_at", startDate);
      }
      if (endDate) {
        countQuery = countQuery.lte("created_at", `${endDate}T23:59:59`);
      }
      if (hasLead === "true") {
        countQuery = countQuery.not("lead_id", "is", null);
      } else if (hasLead === "false") {
        countQuery = countQuery.is("lead_id", null);
      }

      const { count: totalCount } = await countQuery;

      // Fetch lead info for linked quotes
      const leadIds = [...new Set((quoteFiles || []).filter(q => q.lead_id).map(q => q.lead_id))];
      let leadMap: Record<string, { name: string | null; email: string; phone: string | null }> = {};

      if (leadIds.length > 0) {
        const { data: leads } = await supabase
          .from("leads")
          .select("id, name, email, phone")
          .in("id", leadIds);

        if (leads) {
          leadMap = leads.reduce((acc, lead) => {
            acc[lead.id] = { name: lead.name, email: lead.email, phone: lead.phone };
            return acc;
          }, {} as Record<string, { name: string | null; email: string; phone: string | null }>);
        }
      }

      // Generate signed URLs for each file (24-hour expiry)
      const quotesWithUrls: QuoteWithLead[] = await Promise.all(
        (quoteFiles || []).map(async (file: QuoteFile) => {
          let signedUrl: string | null = null;
          
          try {
            const { data: urlData } = await supabase.storage
              .from("quotes")
              .createSignedUrl(file.file_path, 60 * 60 * 24); // 24 hours
            signedUrl = urlData?.signedUrl || null;
          } catch (e) {
            console.error(`Failed to generate signed URL for ${file.file_path}:`, e);
          }

          const lead = file.lead_id ? leadMap[file.lead_id] : null;

          return {
            ...file,
            lead_name: lead?.name || null,
            lead_email: lead?.email || null,
            lead_phone: lead?.phone || null,
            signed_url: signedUrl,
          };
        })
      );

      return new Response(
        JSON.stringify({
          quotes: quotesWithUrls,
          total: totalCount || 0,
          limit,
          offset,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin quotes error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
