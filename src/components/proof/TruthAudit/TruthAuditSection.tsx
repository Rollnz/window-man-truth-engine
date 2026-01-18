import { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle2, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SectionFrame } from '../SectionFrame';
import { EvidenceStat } from '../EvidenceStat';
import { cn } from '@/lib/utils';

interface TruthAuditSectionProps {
  onAuditQuote: () => void;
  onSectionView?: (sectionId: string) => void;
}

// Sample quote breakdown data
const contractorQuoteItems = [
  { item: 'Impact Windows (8 units)', price: '$12,400', status: 'flagged' as const },
  { item: 'Installation Labor', price: '$4,200', status: 'flagged' as const },
  { item: 'Permits & Inspections', price: '$850', status: 'ok' as const },
  { item: 'Structural Modifications', price: '$2,100', status: 'flagged' as const },
  { item: 'Disposal & Cleanup', price: '$450', status: 'ok' as const },
];

const aiBreakdownItems = [
  { item: 'Impact Windows (8 units)', fair: '$9,800', diff: '+$2,600', note: '26% above market' },
  { item: 'Installation Labor', fair: '$2,800', diff: '+$1,400', note: '50% markup' },
  { item: 'Permits & Inspections', fair: '$850', diff: '$0', note: 'Fair price' },
  { item: 'Structural Modifications', fair: '$1,200', diff: '+$900', note: 'Scope unclear' },
  { item: 'Disposal & Cleanup', fair: '$450', diff: '$0', note: 'Fair price' },
];

/**
 * TruthAuditSection - Explains how deception happens and how AI catches it
 * Visual: Quote comparison with "reveal" interaction
 */
export function TruthAuditSection({ onAuditQuote, onSectionView }: TruthAuditSectionProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <SectionFrame
      id="truth-audit"
      eyebrow="The AI Truth Audit"
      title={
        <>
          Why Window Man <span className="text-primary">Exists</span>
        </>
      }
      subtitle="Most window overpricing isn't obvious. It's buried."
      onInView={onSectionView}
    >
      {/* Deception Mechanics */}
      <div className="max-w-3xl mx-auto mb-12">
        <p className="wm-reveal wm-stagger-0 text-muted-foreground mb-6 text-center">
          Contractors rarely inflate prices directly. Instead, margin is hidden inside:
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            'Bundled labor + product pricing',
            'Ambiguous window series naming',
            'Spec substitutions that look equivalent—but aren\'t',
            'Overbuilt install scopes that don\'t improve performance',
          ].map((item, i) => (
            <div 
              key={i}
              className={cn(
                "wm-reveal flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800",
                i === 0 && "wm-stagger-1",
                i === 1 && "wm-stagger-2",
                i === 2 && "wm-stagger-3",
                i === 3 && "wm-stagger-4"
              )}
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-amber-900 dark:text-amber-100">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What AI Does Differently */}
      <div className="max-w-3xl mx-auto mb-12">
        <h3 className="text-xl font-semibold mb-4 text-center">
          What Window Man AI Does Differently
        </h3>
        <p className="text-muted-foreground mb-6 text-center">
          Our AI Quote Scanner <strong>deconstructs quotes line-by-line</strong>, separating:
        </p>
        
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Product cost vs labor', icon: FileText },
            { label: 'Structural vs cosmetic upgrades', icon: FileText },
            { label: 'Required code compliance vs optional upsells', icon: FileText },
          ].map((item, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20"
            >
              <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          Every scan is benchmarked against Florida market averages, ASTM impact standards, 
          and known manufacturer price bands.
        </p>
      </div>

      {/* Quote Comparison Showcase */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contractor Quote Card */}
          <Card className="wm-reveal wm-stagger-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold">Contractor Quote</h4>
                <span className="ml-auto text-sm text-muted-foreground">$20,000</span>
              </div>
              
              <div className="space-y-3">
                {contractorQuoteItems.map((item, i) => (
                  <div 
                    key={i}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg text-sm',
                      item.status === 'flagged' 
                        ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' 
                        : 'bg-muted/50'
                    )}
                  >
                    <span>{item.item}</span>
                    <span className="font-medium">{item.price}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Breakdown Card */}
          <Card className="wm-reveal wm-stagger-2 wm-sweep relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            {/* Scan sweep animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div 
                className={cn(
                  'absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-primary/10 to-transparent',
                  'motion-reduce:hidden',
                  showBreakdown && 'animate-scan-sweep'
                )}
                style={{ left: '-80px' }}
              />
            </div>
            
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">AI Analysis</h4>
                <span className="ml-auto text-sm text-green-600 font-medium">Fair: $15,100</span>
              </div>
              
              {!showBreakdown ? (
                <div className="space-y-3">
                  {contractorQuoteItems.map((_, i) => (
                    <div 
                      key={i}
                      className="h-12 rounded-lg bg-muted/50 animate-pulse"
                    />
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 gap-2"
                    onClick={() => setShowBreakdown(true)}
                  >
                    <Eye className="w-4 h-4" />
                    Reveal Line-Item Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiBreakdownItems.map((item, i) => (
                    <div 
                      key={i}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg text-sm',
                        'transition-all duration-300',
                        item.diff !== '$0' 
                          ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800' 
                          : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                      )}
                      style={{ 
                        animationDelay: `${i * 60}ms`,
                        opacity: 0,
                        animation: 'fadeSlideIn 300ms ease-out forwards'
                      }}
                    >
                      <div>
                        <span>{item.item}</span>
                        <span className="block text-xs text-muted-foreground">{item.note}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{item.fair}</span>
                        {item.diff !== '$0' && (
                          <span className="block text-xs text-red-600">{item.diff}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Stat */}
      <div className="max-w-md mx-auto mb-8">
        <EvidenceStat
          label="Average overpricing identified per scan"
          value={1847}
          prefix="$"
          variant="primary"
          showVerified
        />
      </div>

      {/* CTA */}
      <div className="wm-reveal wm-stagger-3 text-center">
        <Button 
          size="lg" 
          onClick={onAuditQuote}
          className="gap-2 wm-btn-press"
        >
          Audit My Quote Now
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes scan-sweep {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(100% + 160px)); }
        }
        .animate-scan-sweep {
          animation: scan-sweep 800ms ease-out forwards;
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(6px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </SectionFrame>
  );
}
