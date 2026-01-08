import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PriceAnalysis } from '@/lib/fairPriceCalculations';
import { gradeConfig } from '@/data/fairPriceQuizData';
import { z } from 'zod';

interface BlurGateProps {
  analysis: PriceAnalysis;
  onSubmit: (name: string, email: string) => void;
}

const formSchema = z.object({
  firstName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

export function BlurGate({ analysis, onSubmit }: BlurGateProps) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gradeInfo = gradeConfig[analysis.grade];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const result = formSchema.safeParse({ firstName, email });
    if (!result.success) {
      const fieldErrors: { firstName?: string; email?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'firstName') fieldErrors.firstName = err.message;
        if (err.path[0] === 'email') fieldErrors.email = err.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    onSubmit(firstName, email);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background relative">
      {/* Blurred results preview behind modal */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="max-w-lg w-full mx-auto p-8 blur-lg opacity-40 select-none">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-primary mb-2">
              {gradeInfo.label}
            </div>
            <p className="text-xl text-muted-foreground">{gradeInfo.verdict}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Your Quote</p>
              <p className="text-2xl font-bold">$XX,XXX</p>
            </div>
            <div className="bg-card rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Fair Market Value</p>
              <p className="text-2xl font-bold">$XX,XXX - $XX,XXX</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lead capture modal */}
      <div className="relative z-10 max-w-md w-full mx-auto bg-card border border-border rounded-xl p-8 shadow-2xl">
        {/* Grade preview (visible) */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="text-2xl">{gradeInfo.emoji}</span>
            <span className="text-lg font-bold text-primary">{gradeInfo.label}</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          🎯 Your Fair Price Analysis is Ready
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Enter your name and email to see your detailed breakdown
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              className={errors.firstName ? 'border-destructive' : ''}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full text-lg py-6 glow"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Loading...' : 'See My Results →'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          We'll also email you a copy for your records
        </p>

        {/* Social proof */}
        <p className="text-sm text-muted-foreground text-center mt-6">
          ✓ 2,847 homeowners analyzed their quotes this month
        </p>
      </div>
    </div>
  );
}
