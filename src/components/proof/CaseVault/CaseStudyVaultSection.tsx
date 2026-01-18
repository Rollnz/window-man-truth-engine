import { useState } from 'react';
import { FolderOpen, MapPin, AlertCircle, CheckCircle2, DollarSign, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionFrame } from '../SectionFrame';
import { caseStudies, scenarioTypeLabels, counties, type CaseStudy } from '@/data/proof/proofData';
import { cn } from '@/lib/utils';

interface CaseStudyVaultSectionProps {
  onSeeHowMyHomeCompares: () => void;
  onSectionView?: (sectionId: string) => void;
  onDossierOpen?: (caseId: string, county: string, scenarioType: string) => void;
  onFilterChange?: (filters: { county?: string; scenarioType?: string }) => void;
}

/**
 * CaseStudyVaultSection - Dossier-style case studies
 * Lie/Truth/Outcome schema with "unsealing" interaction
 */
export function CaseStudyVaultSection({ 
  onSeeHowMyHomeCompares,
  onSectionView,
  onDossierOpen,
  onFilterChange,
}: CaseStudyVaultSectionProps) {
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [countyFilter, setCountyFilter] = useState<string | 'all'>('all');
  const [scenarioFilter, setScenarioFilter] = useState<CaseStudy['scenarioType'] | 'all'>('all');

  const filteredCases = caseStudies.filter(c => {
    if (countyFilter !== 'all' && c.county !== countyFilter) return false;
    if (scenarioFilter !== 'all' && c.scenarioType !== scenarioFilter) return false;
    return true;
  });

  const handleCaseToggle = (caseStudy: CaseStudy) => {
    const isExpanding = expandedCase !== caseStudy.id;
    setExpandedCase(isExpanding ? caseStudy.id : null);
    
    if (isExpanding) {
      onDossierOpen?.(caseStudy.id, caseStudy.county, caseStudy.scenarioType);
    }
  };

  const handleFilterChange = (type: 'county' | 'scenario', value: string) => {
    if (type === 'county') {
      setCountyFilter(value);
    } else {
      setScenarioFilter(value as CaseStudy['scenarioType'] | 'all');
    }
    onFilterChange?.({ 
      county: type === 'county' ? value : countyFilter,
      scenarioType: type === 'scenario' ? value : scenarioFilter,
    });
  };

  return (
    <SectionFrame
      id="case-vault"
      eyebrow="The Case Study Vault"
      title={
        <>
          Where Belief Becomes <span className="text-primary">Certainty</span>
        </>
      }
      subtitle="Each case follows the same forensic structure: The Lie, The Truth, The Outcome."
      onInView={onSectionView}
    >
      {/* Filters */}
      <div className="wm-reveal wm-stagger-0 wm-sweep max-w-4xl mx-auto mb-8">
        <div className="flex flex-wrap items-center gap-4 justify-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>
          
          {/* County Filter */}
          <select
            value={countyFilter}
            onChange={(e) => handleFilterChange('county', e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="all">All Counties</option>
            {counties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>

          {/* Scenario Filter */}
          <select
            value={scenarioFilter}
            onChange={(e) => handleFilterChange('scenario', e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="all">All Scenarios</option>
            {(Object.keys(scenarioTypeLabels) as CaseStudy['scenarioType'][]).map(type => (
              <option key={type} value={type}>{scenarioTypeLabels[type]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Case Study Grid */}
      <div className="max-w-4xl mx-auto space-y-4 mb-12">
        {filteredCases.map((caseStudy, index) => {
          const isExpanded = expandedCase === caseStudy.id;
          
          return (
            <Card 
              key={caseStudy.id}
              className={cn(
                "wm-reveal overflow-hidden transition-opacity transition-transform duration-300",
                'hover:border-primary/30',
                isExpanded && 'border-primary/50 shadow-md',
                index === 0 && "wm-stagger-1",
                index === 1 && "wm-stagger-2",
                index === 2 && "wm-stagger-3",
                index >= 3 && "wm-stagger-4"
              )}
            >
              <CardContent className="p-0">
                {/* Dossier Header - Always visible */}
                <button
                  className="w-full p-4 md:p-6 flex items-start gap-4 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => handleCaseToggle(caseStudy)}
                >
                  {/* Case Number */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-semibold">
                        Case {String(index + 1).padStart(2, '0')}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {caseStudy.county}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {scenarioTypeLabels[caseStudy.scenarioType]}
                      </Badge>
                      {caseStudy.verified && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    {/* Preview - The Lie */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <span className="font-medium text-amber-600 dark:text-amber-400">The Lie:</span>{' '}
                      {caseStudy.lie}
                    </p>
                    
                    {/* Outcome Preview */}
                    {(caseStudy.savingsAmount || caseStudy.premiumReduction) && (
                      <div className="flex items-center gap-2 mt-2">
                        {caseStudy.savingsAmount && (
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            <DollarSign className="w-4 h-4 inline" />
                            {caseStudy.savingsAmount.toLocaleString()} saved
                          </span>
                        )}
                        {caseStudy.premiumReduction && (
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {caseStudy.premiumReduction} premium reduction
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Content - Lie/Truth/Outcome */}
                {isExpanded && (
                  <div className="px-4 md:px-6 pb-6 border-t border-border">
                    <div className="grid gap-4 mt-6">
                      {/* The Lie */}
                      <div 
                        className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                        style={{ animation: 'fadeSlideIn 300ms ease-out forwards' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <span className="font-semibold text-amber-800 dark:text-amber-200">The Lie</span>
                        </div>
                        <p className="text-amber-900 dark:text-amber-100 italic">
                          {caseStudy.lie}
                        </p>
                      </div>

                      {/* The Truth */}
                      <div 
                        className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                        style={{ animation: 'fadeSlideIn 300ms ease-out forwards', animationDelay: '120ms' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-blue-800 dark:text-blue-200">The Truth</span>
                        </div>
                        <p className="text-blue-900 dark:text-blue-100">
                          {caseStudy.truth}
                        </p>
                      </div>

                      {/* The Outcome */}
                      <div 
                        className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                        style={{ animation: 'fadeSlideIn 300ms ease-out forwards', animationDelay: '240ms' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-green-800 dark:text-green-200">The Outcome</span>
                        </div>
                        <p className="text-green-900 dark:text-green-100 font-medium">
                          {caseStudy.outcome}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredCases.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No case studies match your filters. Try adjusting your selection.
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="wm-reveal wm-stagger-4 text-center">
        <Button 
          size="lg" 
          onClick={onSeeHowMyHomeCompares}
          className="gap-2 wm-btn-press"
        >
          See How My Home Compares
        </Button>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </SectionFrame>
  );
}
