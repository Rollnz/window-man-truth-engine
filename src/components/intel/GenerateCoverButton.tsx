import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelResource } from '@/data/intelData';

interface GenerateCoverButtonProps {
  resource: IntelResource;
  hasExistingCover: boolean;
  isGenerating: boolean;
  onGenerate: (regenerate: boolean) => void;
}

export function GenerateCoverButton({
  resource,
  hasExistingCover,
  isGenerating,
  onGenerate,
}: GenerateCoverButtonProps) {
  // Don't show button if resource has a static bookImageUrl
  if (resource.bookImageUrl) {
    return null;
  }

  if (isGenerating) {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled
        className="absolute top-4 left-4 text-xs gap-1.5"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Generating...
      </Button>
    );
  }

  if (hasExistingCover) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onGenerate(true)}
        className="absolute top-4 left-4 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Regenerate cover with AI"
      >
        <RefreshCw className="w-3 h-3" />
        Regenerate
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => onGenerate(false)}
      className="absolute top-4 left-4 text-xs gap-1.5"
      title="Generate cover with AI"
    >
      <Sparkles className="w-3 h-3" />
      Generate Cover
    </Button>
  );
}
