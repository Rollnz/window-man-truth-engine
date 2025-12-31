import { Badge } from '@/components/ui/badge';
import { FileText, Camera, Receipt, Shield, Home, Filter } from 'lucide-react';

export type EvidenceTag = 'permit' | 'contract' | 'invoice' | 'warranty' | 'photos' | 'certificate';

interface EvidenceTagFilterProps {
  selectedTags: EvidenceTag[];
  onTagToggle: (tag: EvidenceTag) => void;
  documentTags?: Record<string, EvidenceTag[]>;
}

const tagConfig: { id: EvidenceTag; label: string; icon: React.ReactNode }[] = [
  { id: 'permit', label: 'PERMIT', icon: <Home className="w-3 h-3" /> },
  { id: 'contract', label: 'CONTRACT', icon: <FileText className="w-3 h-3" /> },
  { id: 'invoice', label: 'INVOICE', icon: <Receipt className="w-3 h-3" /> },
  { id: 'warranty', label: 'WARRANTY', icon: <Shield className="w-3 h-3" /> },
  { id: 'photos', label: 'PHOTOS', icon: <Camera className="w-3 h-3" /> },
  { id: 'certificate', label: 'CERT', icon: <Shield className="w-3 h-3" /> },
];

export function EvidenceTagFilter({
  selectedTags,
  onTagToggle,
  documentTags = {},
}: EvidenceTagFilterProps) {
  // Count documents per tag
  const tagCounts = tagConfig.reduce((acc, tag) => {
    acc[tag.id] = Object.values(documentTags).filter(tags => 
      tags?.includes(tag.id)
    ).length;
    return acc;
  }, {} as Record<EvidenceTag, number>);

  return (
    <div className="border border-border bg-card rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          FILTER BY CLASSIFICATION
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tagConfig.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          const count = tagCounts[tag.id];
          
          return (
            <Badge
              key={tag.id}
              variant={isSelected ? "default" : "outline"}
              className={`
                cursor-pointer font-mono text-xs uppercase tracking-wide
                transition-all duration-200 select-none
                ${isSelected 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'hover:border-primary/50 hover:text-primary'
                }
              `}
              onClick={() => onTagToggle(tag.id)}
            >
              {tag.icon}
              <span className="ml-1.5">{tag.label}</span>
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                  isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
                }`}>
                  {count}
                </span>
              )}
            </Badge>
          );
        })}
      </div>

      {/* Active filter indicator */}
      {selectedTags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <button 
            onClick={() => selectedTags.forEach(tag => onTagToggle(tag))}
            className="text-xs text-muted-foreground hover:text-foreground font-mono"
          >
            ✕ CLEAR FILTERS ({selectedTags.length})
          </button>
        </div>
      )}
    </div>
  );
}

// Helper to assign default tags based on document ID
export function getDefaultTagForDocument(docId: string): EvidenceTag {
  const mapping: Record<string, EvidenceTag> = {
    'purchase-invoice': 'invoice',
    'installation-contract': 'contract',
    'noa-certificate': 'certificate',
    'permit-record': 'permit',
    'warranty-document': 'warranty',
    'pre-storm-photos': 'photos',
    'post-storm-photos': 'photos',
  };
  return mapping[docId] || 'contract';
}
