import { SessionData } from '@/hooks/useSessionData';
import { VaultSection } from './VaultSection';
import { BarChart3, Shield, Zap, Brain, TrendingDown, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/navigation';

interface MyResultsSectionProps {
  sessionData: SessionData;
}

interface ResultCard {
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  getValue: (data: SessionData) => string | null;
  getLabel: (data: SessionData) => string;
  getStatus: (data: SessionData) => 'success' | 'warning' | 'danger' | 'neutral';
}

const resultCards: ResultCard[] = [
  {
    id: 'reality-check',
    name: 'Reality Check',
    path: ROUTES.REALITY_CHECK,
    icon: <AlertTriangle className="w-5 h-5" />,
    getValue: (data) => data.realityCheckScore !== undefined ? `${data.realityCheckScore}%` : null,
    getLabel: () => 'Readiness Score',
    getStatus: (data) => {
      const score = data.realityCheckScore || 0;
      if (score >= 70) return 'success';
      if (score >= 40) return 'warning';
      return 'danger';
    }
  },
  {
    id: 'cost-calculator',
    name: 'Cost of Inaction',
    path: ROUTES.COST_CALCULATOR,
    icon: <TrendingDown className="w-5 h-5" />,
    getValue: (data) => data.costOfInactionTotal ? `$${data.costOfInactionTotal.toLocaleString()}` : null,
    getLabel: () => '5-Year Cost',
    getStatus: () => 'danger'
  },
  {
    id: 'vulnerability-test',
    name: 'Window IQ',
    path: ROUTES.VULNERABILITY_TEST,
    icon: <Brain className="w-5 h-5" />,
    getValue: (data) => data.quizScore !== undefined ? `${data.quizScore}%` : null,
    getLabel: (data) => data.quizVulnerability || 'Score',
    getStatus: (data) => {
      if (data.quizVulnerability === 'LOW') return 'success';
      if (data.quizVulnerability === 'MODERATE') return 'warning';
      return 'danger';
    }
  },
  {
    id: 'risk-diagnostic',
    name: 'Risk Diagnostic',
    path: ROUTES.RISK_DIAGNOSTIC,
    icon: <Shield className="w-5 h-5" />,
    getValue: (data) => data.overallProtectionScore !== undefined ? `${data.overallProtectionScore}%` : null,
    getLabel: () => 'Protection Score',
    getStatus: (data) => {
      const score = data.overallProtectionScore || 0;
      if (score >= 70) return 'success';
      if (score >= 40) return 'warning';
      return 'danger';
    }
  },
  {
    id: 'fast-win',
    name: 'Fast Win',
    path: ROUTES.FAST_WIN,
    icon: <Zap className="w-5 h-5" />,
    getValue: (data) => data.fastWinResult || null,
    getLabel: () => 'Recommendation',
    getStatus: () => 'neutral'
  }
];

const statusColors = {
  success: 'border-green-500/50 bg-green-500/10',
  warning: 'border-yellow-500/50 bg-yellow-500/10',
  danger: 'border-red-500/50 bg-red-500/10',
  neutral: 'border-primary/50 bg-primary/10'
};

export function MyResultsSection({ sessionData }: MyResultsSectionProps) {
  const completedResults = resultCards.filter(card => card.getValue(sessionData) !== null);
  const isEmpty = completedResults.length === 0;

  return (
    <VaultSection
      title="My Results"
      description="Your assessment scores and recommendations"
      icon={<BarChart3 className="w-5 h-5" />}
      isEmpty={isEmpty}
      emptyState={{
        message: "Complete an assessment tool to see your results here",
        ctaText: "Start Reality Check",
        ctaPath: ROUTES.REALITY_CHECK
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedResults.map((card) => {
          const value = card.getValue(sessionData);
          const label = card.getLabel(sessionData);
          const status = card.getStatus(sessionData);

          return (
            <Link
              key={card.id}
              to={card.path}
              className={cn(
                "p-4 rounded-lg border-2 transition-all hover:scale-[1.02]",
                statusColors[status]
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {card.icon}
                <span className="text-sm font-medium text-foreground">{card.name}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </Link>
          );
        })}
      </div>

      {completedResults.length > 0 && completedResults.length < resultCards.length && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {resultCards.length - completedResults.length} more assessments available
        </p>
      )}
    </VaultSection>
  );
}