import type { HonorableMention } from '@/data/fastWinData';

interface HonorableMentionsProps {
  mentions: HonorableMention[];
}

export function HonorableMentions({ mentions }: HonorableMentionsProps) {
  if (!mentions.length) return null;

  return (
    <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
      <p className="text-sm font-medium text-muted-foreground mb-3">
        HONORABLE MENTIONS
      </p>
      <div className="space-y-2">
        {mentions.map((mention, index) => (
          <div key={index} className="flex items-start gap-2 text-sm">
            <span className="text-primary">•</span>
            <div>
              <span className="font-medium text-foreground">{mention.name}</span>
              <span className="text-muted-foreground"> — {mention.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
