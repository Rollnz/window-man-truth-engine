import { type LucideIcon } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";

const SHADOW = '0 8px 24px -6px rgba(255,198,114,0.25), 0 18px 40px -22px rgba(255,198,114,0.15)';
const SHADOW_HOVER = '0 14px 40px -8px rgba(255,198,114,0.40), 0 30px 70px -30px rgba(255,198,114,0.25)';

export interface Finding {
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  icon: LucideIcon;
  source?: string;
}

export function FindingCard({ title, description, severity, icon: Icon, source }: Finding) {
  return (
    <div
      className="group bg-card backdrop-blur-sm border border-border/20 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: SHADOW }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = SHADOW_HOVER; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = SHADOW; }}
    >
      <div className="flex items-start justify-between mb-4">
        <SeverityBadge level={severity} />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

      {source && (
        <p className="mt-4 text-xs text-muted-foreground font-mono border-t border-border/10 pt-3">
          Source: {source}
        </p>
      )}
    </div>
  );
}
