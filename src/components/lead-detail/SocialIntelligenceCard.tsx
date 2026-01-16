import { Facebook, Instagram, Globe, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SocialIntelligenceCardProps {
  facebookPageName: string | null;
  facebookAdId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export function SocialIntelligenceCard({
  facebookPageName,
  facebookAdId,
  utmSource,
  utmMedium,
  utmCampaign,
}: SocialIntelligenceCardProps) {
  const isPaid = utmMedium?.toLowerCase() === 'cpc' || utmMedium?.toLowerCase() === 'paid';
  const isFacebook = utmSource?.toLowerCase().includes('facebook') || 
                     utmSource?.toLowerCase().includes('fb') ||
                     utmSource?.toLowerCase().includes('instagram') ||
                     utmSource?.toLowerCase().includes('meta');
  
  const getSourceIcon = () => {
    if (isFacebook) {
      return utmSource?.toLowerCase().includes('instagram') ? Instagram : Facebook;
    }
    return Globe;
  };

  const SourceIcon = getSourceIcon();
  const sourceName = facebookPageName || utmSource || 'Direct';
  const hasAttribution = facebookPageName || facebookAdId || utmSource;

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <SourceIcon className="h-3 w-3" />
          Attribution Source
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4 space-y-2">
        {hasAttribution ? (
          <>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isFacebook ? 'default' : 'secondary'}
                className={isFacebook ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                {sourceName}
              </Badge>
              {isPaid && (
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  Paid
                </Badge>
              )}
            </div>
            
            {facebookAdId && (
              <div className="text-xs text-muted-foreground">
                Ad ID: <code className="bg-muted px-1 rounded">{facebookAdId}</code>
              </div>
            )}
            
            {utmCampaign && (
              <div className="text-xs text-muted-foreground">
                Campaign: <span className="font-medium">{utmCampaign}</span>
              </div>
            )}
            
            {utmMedium && (
              <div className="text-xs text-muted-foreground">
                Medium: <span className="font-medium">{utmMedium}</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            <Badge variant="secondary">Organic / Direct</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
