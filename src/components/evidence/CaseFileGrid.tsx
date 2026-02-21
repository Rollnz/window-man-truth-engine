import { useEffect, useRef } from 'react';
import { CaseStudy, MissionType } from '@/data/evidenceData';
import { CaseFileCard } from './CaseFileCard';
import { FolderOpen } from 'lucide-react';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';

interface CaseFileGridProps {
  caseStudies: CaseStudy[];
  activeFilter: MissionType | 'all';
  onOpenCase: (caseId: string) => void;
  highlightedCaseId?: string;
}

export function CaseFileGrid({ 
  caseStudies, 
  activeFilter, 
  onOpenCase,
  highlightedCaseId 
}: CaseFileGridProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  
  const filteredCases = activeFilter === 'all'
    ? caseStudies
    : caseStudies.filter(c => c.missionType === activeFilter);

  useEffect(() => {
    if (highlightedCaseId && highlightRef.current) {
      const timer = setTimeout(() => {
        highlightRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightedCaseId]);

  if (filteredCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Matching Records Found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No case files match your current filter criteria. Try adjusting your search parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCases.map((caseStudy, index) => {
        const isHighlighted = caseStudy.id === highlightedCaseId;
        return (
          <AnimateOnScroll
            key={caseStudy.id}
            delay={index * 100}
            duration={500}
            threshold={0.15}
          >
            <div ref={isHighlighted ? highlightRef : undefined}>
              <CaseFileCard 
                caseStudy={caseStudy} 
                onOpenCase={onOpenCase}
                isHighlighted={isHighlighted}
              />
            </div>
          </AnimateOnScroll>
        );
      })}
    </div>
  );
}
