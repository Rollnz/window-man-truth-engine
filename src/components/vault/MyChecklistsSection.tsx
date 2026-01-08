import { SessionData } from '@/hooks/useSessionData';
import { VaultSection } from './VaultSection';
import { CheckSquare, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/navigation';

interface MyChecklistsSectionProps {
  sessionData: SessionData;
}

const checklistItems = [
  { id: 'policy-dec', label: 'Policy Declaration Page' },
  { id: 'wind-mit', label: 'Wind Mitigation Report' },
  { id: 'product-approval', label: 'Product Approval Letters' },
  { id: 'install-photos', label: 'Installation Photos' },
  { id: 'permits', label: 'Permits & Inspections' },
  { id: 'warranty', label: 'Warranty Documents' },
  { id: 'receipts', label: 'Receipts & Invoices' }
];

export function MyChecklistsSection({ sessionData }: MyChecklistsSectionProps) {
  const progress = sessionData.claimVaultProgress || {};
  const completedCount = Object.values(progress).filter(Boolean).length;
  const isEmpty = completedCount === 0 && !sessionData.claimVaultViewed;
  const progressPercent = (completedCount / checklistItems.length) * 100;

  return (
    <VaultSection
      title="My Checklists"
      description="Track your claim readiness progress"
      icon={<CheckSquare className="w-5 h-5" />}
      isEmpty={isEmpty}
      emptyState={{
        message: "Start your claim readiness checklist to protect your investment",
        ctaText: "Start Claim Checklist",
        ctaPath: ROUTES.CLAIM_SURVIVAL
      }}
    >
      <div className="space-y-4">
        {/* Claim Readiness Checklist */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Claim Readiness Checklist</h4>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{checklistItems.length}
            </span>
          </div>
          
          <Progress value={progressPercent} className="h-2 mb-4" />

          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 text-sm"
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  progress[item.id] 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border border-border'
                }`}>
                  {progress[item.id] && <Check className="w-3 h-3" />}
                </div>
                <span className={progress[item.id] ? 'text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {completedCount < checklistItems.length && (
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link to={ROUTES.CLAIM_SURVIVAL}>
                Continue Checklist
              </Link>
            </Button>
          )}
        </div>

        {/* Unlocked Resources */}
        {sessionData.unlockedResources && sessionData.unlockedResources.length > 0 && (
          <div className="p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">Unlocked Resources</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {sessionData.unlockedResources.length} resource{sessionData.unlockedResources.length !== 1 ? 's' : ''} unlocked from Intel Library
            </p>
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.INTEL}>View Resources →</Link>
            </Button>
          </div>
        )}

        {/* Viewed Case Studies */}
        {sessionData.caseStudiesViewed && sessionData.caseStudiesViewed.length > 0 && (
          <div className="p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">Evidence Reviewed</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {sessionData.caseStudiesViewed.length} case{sessionData.caseStudiesViewed.length !== 1 ? 's' : ''} studied
            </p>
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.EVIDENCE}>View Evidence →</Link>
            </Button>
          </div>
        )}
      </div>
    </VaultSection>
  );
}