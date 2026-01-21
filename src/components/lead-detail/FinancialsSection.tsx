import { useLeadFinancials } from '@/hooks/useLeadFinancials';
import { OpportunitiesPanel } from './OpportunitiesPanel';
import { DealsPanel } from './DealsPanel';
import { LeadProfitSummary } from './LeadProfitSummary';

interface FinancialsSectionProps {
  wmLeadId: string;
}

export function FinancialsSection({ wmLeadId }: FinancialsSectionProps) {
  const {
    opportunities,
    deals,
    summary,
    isLoading,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    createDeal,
    updateDeal,
    deleteDeal,
  } = useLeadFinancials(wmLeadId);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Financials</h2>
      
      <LeadProfitSummary summary={summary} isLoading={isLoading} />
      
      <OpportunitiesPanel
        opportunities={opportunities}
        isLoading={isLoading}
        onCreate={createOpportunity}
        onUpdate={updateOpportunity}
        onDelete={deleteOpportunity}
      />
      
      <DealsPanel
        deals={deals}
        isLoading={isLoading}
        onCreate={createDeal}
        onUpdate={updateDeal}
        onDelete={deleteDeal}
      />
    </div>
  );
}
