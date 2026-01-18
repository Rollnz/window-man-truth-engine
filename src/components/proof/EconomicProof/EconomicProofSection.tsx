import { Zap, Shield, TrendingDown, ArrowRight, Home, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionFrame } from '../SectionFrame';
import { EvidenceStat } from '../EvidenceStat';
import { proofStats } from '@/data/proof/proofData';

interface EconomicProofSectionProps {
  onCalculateCostOfInaction: () => void;
  onSectionView?: (sectionId: string) => void;
}

/**
 * EconomicProofSection - Energy Efficiency + Insurance ROI
 * Where curiosity turns into conviction
 */
export function EconomicProofSection({ 
  onCalculateCostOfInaction,
  onSectionView,
}: EconomicProofSectionProps) {
  return (
    <SectionFrame
      id="economic-proof"
      eyebrow="Economic Proof"
      title={
        <>
          AI That <span className="text-primary">Pays for Itself</span>
        </>
      }
      subtitle="This is where curiosity turns into conviction."
      onInView={onSectionView}
    >
      {/* Two-Panel Proof Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
        {/* Energy Efficiency Panel */}
        <Card className="wm-reveal wm-stagger-0 wm-slide-left relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Energy Efficiency Outcomes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Across verified homes with properly specified windows:
            </p>
            
            <div className="space-y-4 mb-6">
              {[
                { icon: Thermometer, text: 'Reduced HVAC runtime' },
                { icon: Home, text: 'Lower solar heat gain' },
                { icon: Zap, text: 'Improved interior pressure balance' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Observed Outcomes
              </p>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Noticeable cooling efficiency improvements</li>
                <li>• Reduced strain on aging HVAC systems</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Insurance ROI Panel */}
        <Card className="wm-reveal wm-stagger-1 wm-slide-right relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Insurance ROI</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Using Window Man documentation:
            </p>
            
            <div className="space-y-4 mb-6">
              {[
                { icon: Shield, text: 'Carriers re-rated homes based on verified impact compliance' },
                { icon: TrendingDown, text: 'Wind mitigation discounts unlocked' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Verified Savings
              </p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                18–20% annual insurance premium reductions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Statement */}
      <div className="wm-reveal wm-stagger-2 max-w-3xl mx-auto text-center mb-12">
        <p className="text-lg text-muted-foreground">
          This is not theoretical efficiency.<br />
          It is <strong className="text-foreground">measurable household economics</strong>.
        </p>
      </div>

      {/* Key Stat */}
      <div className="max-w-md mx-auto mb-8">
        <EvidenceStat
          label="Verified insurance premium reductions"
          value={proofStats.insurancePremiumReduction}
          note="when documentation supports re-rating"
          variant="success"
          showVerified
          animate={false}
        />
      </div>

      {/* CTA */}
      <div className="wm-reveal wm-stagger-4 text-center">
        <Button 
          size="lg" 
          onClick={onCalculateCostOfInaction}
          className="gap-2 group wm-btn-press"
        >
          Calculate My Cost of Inaction
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </SectionFrame>
  );
}
