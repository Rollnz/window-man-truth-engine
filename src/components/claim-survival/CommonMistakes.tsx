import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield } from 'lucide-react';
import { claimMistakes } from '@/data/claimSurvivalData';

interface CommonMistakesProps {
  onCtaClick: () => void;
}

export function CommonMistakes({ onCtaClick }: CommonMistakesProps) {
  return (
    <div className="container px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10 mb-4">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">5 Mistakes That Kill Claims</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Don't let these common errors derail your insurance claim.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto mb-8">
        {claimMistakes.map((mistake, index) => (
          <Card key={mistake.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-destructive">{index + 1}</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{mistake.title}</h3>
                <p className="text-xs text-muted-foreground">{mistake.consequence}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button onClick={onCtaClick}>
          <Shield className="mr-2 h-4 w-4" />
          Avoid These With a Vault
        </Button>
      </div>
    </div>
  );
}
