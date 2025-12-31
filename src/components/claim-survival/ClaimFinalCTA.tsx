import { Button } from '@/components/ui/button';
import { Shield, Upload } from 'lucide-react';

interface ClaimFinalCTAProps {
  onCreateVaultClick: () => void;
  isUnlocked: boolean;
}

export function ClaimFinalCTA({ onCreateVaultClick, isUnlocked }: ClaimFinalCTAProps) {
  return (
    <div className="container px-4 text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">
        Don't Rebuild Your Claim From Memory
      </h2>
      <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
        Store proof now—before insurers ask for it. Your future self will thank you.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button 
          size="lg" 
          variant="high-contrast"
          onClick={onCreateVaultClick}
          className="w-full sm:w-auto"
        >
          <Shield className="mr-2 h-5 w-5" />
          {isUnlocked ? 'Return to My Vault' : 'Create Free Vault Account'}
        </Button>
        
        <Button 
          size="lg" 
          variant="outline"
          onClick={onCreateVaultClick}
          className="w-full sm:w-auto"
        >
          <Upload className="mr-2 h-5 w-5" />
          Upload My Documents
        </Button>
      </div>
    </div>
  );
}
