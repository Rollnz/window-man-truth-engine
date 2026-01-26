import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  FileSearch, 
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react';
import { ClaimDocument } from '@/data/claimSurvivalData';
import { ClaimVaultSyncButton } from './ClaimVaultSyncButton';
import type { AnalysisResult } from '@/hooks/useEvidenceAnalysis';

interface EvidenceAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ClaimDocument[];
  progress: Record<string, boolean>;
  files: Record<string, string>;
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  onAnalyze: () => void;
}

export function EvidenceAnalysisModal({
  isOpen,
  onClose,
  documents,
  progress,
  files,
  isAnalyzing,
  analysisResult,
  onAnalyze,
}: EvidenceAnalysisModalProps) {
  const completedCount = documents.filter(doc => 
    progress[doc.id] || files[doc.id]
  ).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'missing':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'weak':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getOverallStatusStyles = (status: string) => {
    switch (status) {
      case 'ready':
        return 'border-primary/50 bg-primary/10 text-primary';
      case 'warning':
        return 'border-warning/50 bg-warning/10 text-warning';
      case 'critical':
        return 'border-destructive/50 bg-destructive/10 text-destructive';
      default:
        return 'border-border bg-muted';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono uppercase tracking-wider">
            <FileSearch className="w-5 h-5 text-primary" />
            CLAIM READINESS ANALYSIS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pre-analysis state */}
          {!isAnalyzing && !analysisResult && (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  AI-Powered Evidence Analysis
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Our system will analyze your {completedCount}/{documents.length} documents 
                  and generate a claim readiness report with specific recommendations.
                </p>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4 text-left">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  DOCUMENTS TO ANALYZE
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {documents.map(doc => (
                    <div 
                      key={doc.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {(progress[doc.id] || files[doc.id]) ? (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                      )}
                      <span className={
                        (progress[doc.id] || files[doc.id]) 
                          ? '' 
                          : 'text-muted-foreground'
                      }>
                        {doc.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={onAnalyze} size="lg" className="font-mono uppercase">
                <FileSearch className="mr-2 h-4 w-4" />
                Analyze Evidence
              </Button>
            </div>
          )}

          {/* Analyzing state */}
          {isAnalyzing && (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center animate-pulse">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2 font-mono uppercase">
                  ANALYZING EVIDENCE...
                </h3>
                <p className="text-muted-foreground text-sm">
                  Scanning documentation completeness and claim readiness
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-2">
                <Progress value={66} className="h-2" />
                <p className="text-xs text-muted-foreground font-mono">
                  Processing {completedCount} documents...
                </p>
              </div>
            </div>
          )}

          {/* Results state */}
          {analysisResult && !isAnalyzing && (
            <div className="space-y-6">
              {/* Timestamp */}
              {analysisResult.analyzedAt && (
                <div className="text-center text-xs text-muted-foreground font-mono">
                  LAST ANALYZED: {new Date(analysisResult.analyzedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}

              {/* Overall Score */}
              <div className={`rounded-lg border-2 p-6 text-center ${getOverallStatusStyles(analysisResult.status)}`}>
                <div className="text-5xl font-bold font-mono mb-2">
                  {analysisResult.overallScore}%
                </div>
                <div className="text-sm font-mono uppercase tracking-wider">
                  CLAIM READINESS SCORE
                </div>
                <p className="mt-3 text-sm opacity-80">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Document Status */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                  DOCUMENT STATUS BREAKDOWN
                </h4>
                <div className="space-y-2">
                  {analysisResult.documentStatus.map((item) => {
                    const doc = documents.find(d => d.id === item.docId);
                    return (
                      <div 
                        key={item.docId}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        {getStatusIcon(item.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {doc?.title || item.docId}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] uppercase ${
                                item.status === 'complete' 
                                  ? 'border-primary/50 text-primary' 
                                  : item.status === 'missing'
                                  ? 'border-destructive/50 text-destructive'
                                  : 'border-warning/50 text-warning'
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.recommendation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Steps */}
              {analysisResult.nextSteps.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                    PRIORITY ACTIONS
                  </h4>
                  <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                    {analysisResult.nextSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-mono">{index + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save to Vault CTA */}
              <ClaimVaultSyncButton analysis={analysisResult} variant="primary" />

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={onAnalyze} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Re-Analyze
                </Button>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Close Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
