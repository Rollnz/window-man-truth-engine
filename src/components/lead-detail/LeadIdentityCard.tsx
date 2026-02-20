import { Phone, Mail, MessageCircle, MapPin, Calculator, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { LeadAvatar } from './LeadAvatar';
import { EngagementGauge } from './EngagementGauge';
import { SocialIntelligenceCard } from './SocialIntelligenceCard';
import { SocialSearchButtons } from './SocialSearchButtons';
import { LeadDetailData, LeadSession } from '@/hooks/useLeadDetail';
import { LeadStatus, LEAD_STATUS_CONFIG } from '@/types/crm';
import { format } from 'date-fns';

interface LeadIdentityCardProps {
  lead: LeadDetailData;
  session: LeadSession | null;
  onStatusChange: (status: LeadStatus) => Promise<boolean>;
  onSaveSocialUrl: (url: string) => Promise<boolean>;
}

export function LeadIdentityCard({ lead, session, onStatusChange, onSaveSocialUrl }: LeadIdentityCardProps) {
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown Lead';

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <LeadAvatar firstName={lead.first_name} lastName={lead.last_name} size="xl" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{fullName}</h1>
              <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
              {lead.phone && <p className="text-sm text-muted-foreground">{lead.phone}</p>}
            </div>
          </div>

          {/* Status Selector */}
          <div className="mt-4">
            <Select value={lead.status} onValueChange={(v) => onStatusChange(v as LeadStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                      {config.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Score */}
      <EngagementGauge score={lead.engagement_score || 0} />

      {/* Contact Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="flex-col h-auto py-3" asChild disabled={!lead.phone}>
              <a href={lead.phone ? `tel:${lead.phone}` : '#'}>
                <Phone className="h-5 w-5 mb-1" />
                <span className="text-xs">Call</span>
              </a>
            </Button>
            <Button variant="outline" className="flex-col h-auto py-3" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-5 w-5 mb-1" />
                <span className="text-xs">Email</span>
              </a>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-3"
              onClick={() => {
                if (!lead.phone) {
                  toast.error('Cannot open WhatsApp: No phone number on file for this lead.');
                  return;
                }
                const digits = lead.phone.replace(/\D/g, '');
                const e164 = digits.length === 10 ? `1${digits}` : digits;
                window.open(`https://wa.me/${e164}`, '_blank');
              }}
            >
              <MessageCircle className="h-5 w-5 mb-1" />
              <span className="text-xs">WhatsApp</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Intelligence */}
      <SocialIntelligenceCard
        facebookPageName={lead.facebook_page_name}
        facebookAdId={lead.facebook_ad_id}
        utmSource={session?.utm_source || null}
        utmMedium={session?.utm_medium || null}
        utmCampaign={session?.utm_campaign || null}
      />

      {/* Social Research */}
      <Card>
        <CardContent className="py-4">
          <SocialSearchButtons
            firstName={lead.first_name}
            lastName={lead.last_name}
            city={lead.city}
            verifiedUrl={lead.verified_social_url}
            onSaveUrl={onSaveSocialUrl}
          />
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Source:</span>
            <span className="font-medium">{lead.original_source_tool || 'Direct'}</span>
          </div>
          {lead.city && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">City:</span>
              <span className="font-medium">{lead.city}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
          </div>
          {lead.estimated_deal_value && lead.estimated_deal_value > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Est. Value:</span>
              <span className="font-medium text-green-600">${lead.estimated_deal_value.toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
