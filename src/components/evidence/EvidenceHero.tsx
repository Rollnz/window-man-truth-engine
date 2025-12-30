import { FolderSearch, Shield, DollarSign, Home } from 'lucide-react';
import { aggregateStats } from '@/data/evidenceData';

export function EvidenceHero() {
  return (
    <section className="py-12 md:py-20 relative">
      <div className="container px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <FolderSearch className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Declassified Reports</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Evidence Locker: <span className="text-primary text-glow">Verified Case Files</span>
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Don't take our word for it. Review the evidence from {aggregateStats.totalMissions} verified missions.
          </p>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <StatCard
            icon={<FolderSearch className="w-5 h-5" />}
            value={aggregateStats.totalMissions.toString()}
            label="Verified Missions"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            value={aggregateStats.totalSaved}
            label="Total Saved"
          />
          <StatCard
            icon={<Home className="w-5 h-5" />}
            value={aggregateStats.windowsUpgraded}
            label="Windows Upgraded"
          />
          <StatCard
            icon={<Shield className="w-5 h-5" />}
            value={aggregateStats.avgInsuranceSavings}
            label="Avg Insurance Savings"
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
}) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-card border border-border">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
        {icon}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-primary text-glow">{value}</div>
      <div className="text-xs md:text-sm text-muted-foreground text-center">{label}</div>
    </div>
  );
}
