import * as React from 'react';
import { cn } from '@/lib/utils';

interface HighlightMatchProps {
  text: string;
  positions?: Array<{ start: number; length: number }>;
  highlightClassName?: string;
}

/**
 * Highlights matched text portions based on position data.
 * Used for search result highlighting in global search.
 */
export function HighlightMatch({ 
  text, 
  positions,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800/60 rounded px-0.5',
}: HighlightMatchProps) {
  if (!positions || positions.length === 0 || !text) {
    return <span>{text}</span>;
  }

  // Sort positions by start
  const sortedPositions = [...positions].sort((a, b) => a.start - b.start);
  
  const segments: Array<{ text: string; highlight: boolean }> = [];
  let lastEnd = 0;

  for (const pos of sortedPositions) {
    // Validate position bounds
    if (pos.start < 0 || pos.start >= text.length) continue;
    if (pos.start < lastEnd) continue; // Skip overlapping

    const actualLength = Math.min(pos.length, text.length - pos.start);
    
    // Add non-highlighted segment before this match
    if (pos.start > lastEnd) {
      segments.push({ text: text.slice(lastEnd, pos.start), highlight: false });
    }
    
    // Add highlighted segment
    segments.push({ 
      text: text.slice(pos.start, pos.start + actualLength), 
      highlight: true 
    });
    
    lastEnd = pos.start + actualLength;
  }

  // Add remaining non-highlighted text
  if (lastEnd < text.length) {
    segments.push({ text: text.slice(lastEnd), highlight: false });
  }

  // If no valid segments were created, just return the text
  if (segments.length === 0) {
    return <span>{text}</span>;
  }

  return (
    <>
      {segments.map((seg, i) => 
        seg.highlight 
          ? <mark key={i} className={cn('text-foreground', highlightClassName)}>{seg.text}</mark>
          : <span key={i}>{seg.text}</span>
      )}
    </>
  );
}
