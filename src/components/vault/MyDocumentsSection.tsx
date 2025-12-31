import { SessionData } from '@/hooks/useSessionData';
import { VaultSection } from './VaultSection';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface MyDocumentsSectionProps {
  sessionData: SessionData;
}

const documentLabels: Record<string, string> = {
  'policy-dec': 'Policy Declaration Page',
  'wind-mit': 'Wind Mitigation Report',
  'product-approval': 'Product Approval Letters',
  'install-photos': 'Installation Photos',
  'permits': 'Permits & Inspections',
  'warranty': 'Warranty Documents',
  'receipts': 'Receipts & Invoices'
};

export function MyDocumentsSection({ sessionData }: MyDocumentsSectionProps) {
  const uploadedDocs = sessionData.claimVaultFiles || {};
  const docEntries = Object.entries(uploadedDocs).filter(([_, url]) => url);
  const isEmpty = docEntries.length === 0;

  return (
    <VaultSection
      title="My Documents"
      description="Your uploaded claim and protection documents"
      icon={<FileText className="w-5 h-5" />}
      isEmpty={isEmpty}
      emptyState={{
        message: "Upload your first document to start building your claim-ready file",
        ctaText: "Go to Claim Survival Vault",
        ctaPath: "/claim-survival"
      }}
    >
      <div className="space-y-3">
        {docEntries.map(([docId, url]) => (
          <div
            key={docId}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {documentLabels[docId] || docId}
                </p>
                <p className="text-xs text-muted-foreground">Uploaded</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {docEntries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="outline" size="sm" asChild>
            <Link to="/claim-survival">
              Upload More Documents
            </Link>
          </Button>
        </div>
      )}
    </VaultSection>
  );
}
