import { QuoteFirstHero } from './components/QuoteFirstHero';
import { QuoteFirstFlow } from './QuoteFirstFlow';
import { useCallback, useState } from 'react';

/**
 * QuoteFirstStage — acquisition/handoff coordinator.
 *
 * Owns the single-stage swap between the pre-file Hero and the post-file Flow.
 * When no file is selected: renders QuoteFirstHero.
 * When a file is selected: replaces the Hero in the same visual stage with QuoteFirstFlow.
 *
 * QuoteFirstFlow does NOT know about QuoteFirstHero — it only accepts a File + onReset,
 * preserving the portable post-upload boundary for future landing pages.
 */
export function QuoteFirstStage() {
  const [file, setFile] = useState<File | null>(null);
  const onFileSelected = useCallback((f: File) => setFile(f), []);
  const onReset = useCallback(() => setFile(null), []);

  if (file) {
    return <QuoteFirstFlow file={file} onReset={onReset} />;
  }
  return <QuoteFirstHero onFileSelected={onFileSelected} />;
}
