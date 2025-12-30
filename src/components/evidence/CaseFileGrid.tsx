import { CaseStudy, MissionType } from '@/data/evidenceData';
import { CaseFileCard } from './CaseFileCard';
import { FolderOpen } from 'lucide-react';

interface CaseFileGridProps {
  caseStudies: CaseStudy[];
  activeFilter: MissionType | 'all';
  onOpenCase: (caseId: string) => void;
}

export function CaseFileGrid({ caseStudies, activeFilter, onOpenCase }: CaseFileGridProps) {
  const filteredCases = activeFilter === 'all'
    ? caseStudies
    : caseStudies.filter(c => c.missionType === activeFilter);

  if (filteredCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Matching Records Found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No case files match your current filter criteria. Try adjusting your search parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCases.map((caseStudy, index) => (
        <div 
          key={caseStudy.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <CaseFileCard 
            caseStudy={caseStudy} 
            onOpenCase={onOpenCase}
          />
        </div>
      ))}
    </div>
  );
}
