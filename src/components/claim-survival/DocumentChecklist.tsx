import { DocumentCard } from './DocumentCard';
import { ClaimDocument } from '@/data/claimSurvivalData';

interface DocumentChecklistProps {
  documents: ClaimDocument[];
  progress: Record<string, boolean>;
  files: Record<string, string>;
  onCheckboxToggle: (docId: string, checked: boolean) => void;
  onUploadClick: (docId: string) => void;
  onViewDocument: (docId: string) => void;
}

export function DocumentChecklist({
  documents,
  progress,
  files,
  onCheckboxToggle,
  onUploadClick,
  onViewDocument,
}: DocumentChecklistProps) {
  return (
    <div className="grid gap-4 md:gap-6">
      {documents.map((doc, index) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          index={index + 1}
          isChecked={progress[doc.id] || !!files[doc.id]}
          hasFile={!!files[doc.id]}
          onCheckboxToggle={(checked) => onCheckboxToggle(doc.id, checked)}
          onUploadClick={() => onUploadClick(doc.id)}
          onViewDocument={() => onViewDocument(doc.id)}
        />
      ))}
    </div>
  );
}
