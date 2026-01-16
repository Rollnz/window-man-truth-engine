import { useMemo } from "react";
import { TrendingDown, Users, Zap, UserCheck, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FunnelData {
  traffic: number;
  engagement: number;
  leadGen: number;
  conversion: number;
}

interface ConversionFunnelProps {
  data: FunnelData;
  isLoading?: boolean;
}

interface FunnelStageProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  dropOffPercent?: number;
  isLast?: boolean;
}

function FunnelStage({ label, value, icon, color, dropOffPercent, isLast = false }: FunnelStageProps) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-[120px]">
      {/* Stage */}
      <div className={`flex-1 rounded-lg p-4 ${color} border`}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </div>
      
      {/* Arrow with drop-off */}
      {!isLast && (
        <div className="flex flex-col items-center px-2 min-w-[60px]">
          <div className="w-8 h-0.5 bg-border mb-1" />
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          {dropOffPercent !== undefined && (
            <span className="text-xs text-destructive font-medium mt-1">
              {dropOffPercent.toFixed(0)}% drop
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function ConversionFunnel({ data, isLoading = false }: ConversionFunnelProps) {
  // Calculate drop-off percentages
  const dropOffs = useMemo(() => {
    const engagementRate = data.traffic > 0 ? (data.engagement / data.traffic) * 100 : 0;
    const leadRate = data.engagement > 0 ? (data.leadGen / data.engagement) * 100 : 0;
    const conversionRate = data.leadGen > 0 ? (data.conversion / data.leadGen) * 100 : 0;

    return {
      trafficToEngagement: data.traffic > 0 ? 100 - engagementRate : 0,
      engagementToLead: data.engagement > 0 ? 100 - leadRate : 0,
      leadToConversion: data.leadGen > 0 ? 100 - conversionRate : 0,
    };
  }, [data]);

  // Calculate overall conversion rate
  const overallRate = useMemo(() => {
    if (data.traffic === 0) return 0;
    return ((data.conversion / data.traffic) * 100).toFixed(2);
  }, [data]);

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1 min-w-[120px]">
              <Skeleton className="h-24 flex-1 rounded-lg" />
              {i < 3 && <Skeleton className="h-8 w-16" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 mb-6 bg-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Conversion Overview</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Overall Rate:</span>
          <span className="font-bold text-primary">{overallRate}%</span>
        </div>
      </div>
      
      <div className="flex items-start gap-2 overflow-x-auto pb-2">
        <FunnelStage
          label="Traffic"
          value={data.traffic}
          icon={<Users className="h-4 w-4 text-blue-500" />}
          color="bg-blue-500/10 border-blue-500/30"
          dropOffPercent={dropOffs.trafficToEngagement}
        />
        <FunnelStage
          label="Engagement"
          value={data.engagement}
          icon={<Zap className="h-4 w-4 text-amber-500" />}
          color="bg-amber-500/10 border-amber-500/30"
          dropOffPercent={dropOffs.engagementToLead}
        />
        <FunnelStage
          label="Lead Gen"
          value={data.leadGen}
          icon={<UserCheck className="h-4 w-4 text-green-500" />}
          color="bg-green-500/10 border-green-500/30"
          dropOffPercent={dropOffs.leadToConversion}
        />
        <FunnelStage
          label="Conversion"
          value={data.conversion}
          icon={<Calendar className="h-4 w-4 text-primary" />}
          color="bg-primary/10 border-primary/30"
          isLast={true}
        />
      </div>
      
      <p className="text-xs text-muted-foreground mt-4">
        Traffic = Unique sessions • Engagement = Tool/Vault interactions • Lead Gen = Email captured • Conversion = Consultation booked
      </p>
    </div>
  );
}
