import { Lock } from 'lucide-react';

export function ClassifiedPlaceholder() {
  return (
    <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            hsl(var(--muted-foreground) / 0.1) 10px,
            hsl(var(--muted-foreground) / 0.1) 20px
          )`
        }} />
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)',
            height: '50%',
            animation: 'scan-line 3s linear infinite',
          }}
        />
      </div>

      {/* Classified watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase tracking-wider font-medium">
            Photo Pending Authorization
          </span>
        </div>
      </div>

      {/* Diagonal classified stamp */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12">
        <div className="border-2 border-dashed border-muted-foreground/30 px-4 py-1 rounded">
          <span className="text-muted-foreground/50 text-lg font-bold tracking-[0.3em]">
            CLASSIFIED
          </span>
        </div>
      </div>
    </div>
  );
}
