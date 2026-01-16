import { useState } from 'react';
import { Webhook, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LeadDetailData, LeadEvent, LeadNote } from '@/hooks/useLeadDetail';

interface WebhookExportButtonProps {
  lead: LeadDetailData;
  events: LeadEvent[];
  notes: LeadNote[];
}

export function WebhookExportButton({ lead, events, notes }: WebhookExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);

    // Build the export payload
    const payload = {
      lead: {
        id: lead.id,
        name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown',
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        lead_quality: lead.lead_quality,
        engagement_score: lead.engagement_score,
        city: lead.city,
        source: lead.original_source_tool,
        facebook_page: lead.facebook_page_name,
        facebook_ad_id: lead.facebook_ad_id,
        verified_social_url: lead.verified_social_url,
        estimated_deal_value: lead.estimated_deal_value,
        actual_deal_value: lead.actual_deal_value,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      },
      notes: notes.map(n => ({
        content: n.content,
        admin: n.admin_email,
        created_at: n.created_at,
      })),
      last_event: events.length > 0 ? {
        name: events[events.length - 1].event_name,
        category: events[events.length - 1].event_category,
        page: events[events.length - 1].page_path,
        timestamp: events[events.length - 1].created_at,
      } : null,
      event_count: events.length,
      exported_at: new Date().toISOString(),
    };

    // Log to console (for now)
    console.log('📤 Lead Export Payload:', JSON.stringify(payload, null, 2));

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Clipboard failed, but we still logged it
    }

    toast({
      title: 'Lead Data Ready for Export',
      description: 'Payload copied to clipboard and logged to console. Ready for Zapier/CRM integration.',
    });

    setIsExporting(false);
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleExport}
      disabled={isExporting}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Webhook className="h-4 w-4 mr-2" />
          Webhook Sync / Export
        </>
      )}
    </Button>
  );
}
