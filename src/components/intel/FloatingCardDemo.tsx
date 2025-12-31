import { FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FloatingCardDemo() {
  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-center mb-12 text-muted-foreground">
          Floating Image Card Mockup
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Card WITH floating image */}
          <div className="relative pt-16">
            {/* Floating Book Image */}
            <div className="absolute -top-4 right-4 md:-top-8 md:-right-8 z-20 transition-all duration-300 hover:scale-105 hover:rotate-3">
              <img 
                src="/images/claim-kit-book.webp" 
                alt="Claim Survival Kit"
                className="w-24 md:w-32 lg:w-36 h-auto drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 20px 40px rgba(0, 212, 255, 0.3))'
                }}
              />
            </div>
            
            {/* Card */}
            <div className="relative flex flex-col p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 overflow-visible z-10">
              {/* Classified stamp */}
              <div className="absolute top-4 left-4 px-2 py-1 rounded text-xs font-bold tracking-wider bg-destructive/20 text-destructive">
                CLASSIFIED
              </div>
              
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mt-6 bg-muted text-muted-foreground">
                <FileText className="w-6 h-6" />
              </div>
              
              {/* Tagline */}
              <span className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
                Stop Leaving Money on the Table
              </span>
              
              {/* Title */}
              <h3 className="text-lg font-semibold mb-2">The Claim Survival Kit</h3>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">
                The complete documentation & photo guide that turns your claim from "denied" to "approved."
              </p>
              
              {/* Preview points */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  <span>12-Point Photo Checklist</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
                  <Lock className="w-3 h-3" />
                  <span className="blur-[2px]">Hidden content...</span>
                </div>
              </div>
              
              {/* Page count */}
              <p className="text-xs text-muted-foreground mb-4">
                18 pages • PDF format
              </p>
              
              {/* Action button */}
              <Button variant="outline" className="w-full group">
                <Lock className="mr-2 h-4 w-4" />
                Unlock File
              </Button>
            </div>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              ↑ With 3D floating image
            </p>
          </div>
          
          {/* Card WITHOUT floating image (original) */}
          <div className="relative pt-16">
            <div className="relative flex flex-col p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
              {/* Classified stamp */}
              <div className="absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold tracking-wider bg-destructive/20 text-destructive">
                CLASSIFIED
              </div>
              
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-muted text-muted-foreground">
                <FileText className="w-6 h-6" />
              </div>
              
              {/* Tagline */}
              <span className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
                Stop Leaving Money on the Table
              </span>
              
              {/* Title */}
              <h3 className="text-lg font-semibold mb-2">The Claim Survival Kit</h3>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">
                The complete documentation & photo guide that turns your claim from "denied" to "approved."
              </p>
              
              {/* Preview points */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  <span>12-Point Photo Checklist</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
                  <Lock className="w-3 h-3" />
                  <span className="blur-[2px]">Hidden content...</span>
                </div>
              </div>
              
              {/* Page count */}
              <p className="text-xs text-muted-foreground mb-4">
                18 pages • PDF format
              </p>
              
              {/* Action button */}
              <Button variant="outline" className="w-full group">
                <Lock className="mr-2 h-4 w-4" />
                Unlock File
              </Button>
            </div>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              ↑ Original (no image)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
