import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaultCTABlockProps {
  /** Mock callback for demo - will be replaced with real auth */
  onGoogleAuth?: () => void;
  onEmailSubmit?: (data: { firstName: string; lastName: string; email: string }) => void;
  isLoading?: boolean;
}

/**
 * VaultCTABlock
 * Primary conversion engine with "Memory Protection Active" status pixel,
 * Google OAuth button, and email fallback form.
 */
export function VaultCTABlock({ 
  onGoogleAuth, 
  onEmailSubmit,
  isLoading = false 
}: VaultCTABlockProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEmailSubmit?.(formData);
  };

  return (
    <div className="mt-10 text-center">
      {/* Simplicity Anchor */}
      <p className="text-sm text-muted-foreground mb-4">
        No decisions yet. Just saving your place.
      </p>

      {/* Memory Protection Status - "Smooth Criminal" trust pixel */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">Memory Protection Active</span>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-pulse-emerald absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      </div>

      {/* Primary CTA - Google OAuth */}
      <Button
        onClick={onGoogleAuth}
        disabled={isLoading}
        size="lg"
        className={cn(
          'w-full md:w-auto md:min-w-[320px] h-14 text-base font-semibold',
          'bg-primary hover:bg-primary/90 text-primary-foreground',
          'shadow-lg hover:shadow-xl transition-all duration-200'
        )}
      >
        <Lock className="w-5 h-5 mr-2" />
        ENTER MY WINDOW VAULT (GOOGLE)
      </Button>

      {/* Email Fallback Toggle */}
      <button
        onClick={() => setShowEmailForm(!showEmailForm)}
        className="flex items-center justify-center gap-1 mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Mail className="w-4 h-4" />
        Or continue with email
        {showEmailForm ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Email Fallback Form */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          showEmailForm ? 'max-h-[300px] opacity-100 mt-6' : 'max-h-0 opacity-0'
        )}
      >
        <form 
          onSubmit={handleEmailSubmit}
          className="max-w-md mx-auto space-y-4 p-6 rounded-xl border border-border/40 bg-card/50"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="firstName" className="text-foreground">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="bg-background border-border"
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="bg-background border-border"
                required
              />
            </div>
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-background border-border"
              placeholder="you@example.com"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            Continue with Email
          </Button>
        </form>
      </div>

      {/* Final Assurance */}
      <p className="text-xs text-muted-foreground/70 mt-6 max-w-sm mx-auto">
        Free forever. Takes 10 seconds. We never sell or share your data.
      </p>
    </div>
  );
}
