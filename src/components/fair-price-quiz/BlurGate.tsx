import { useState } from 'react';
import { PriceAnalysis } from '@/lib/fairPriceCalculations';
import { z } from 'zod';
import { useFormLock } from '@/hooks/forms';
import { useTickerStats } from '@/hooks/useTickerStats';
import { HarmonizerLeadCard } from './HarmonizerLeadCard';

interface BlurGateProps {
  analysis: PriceAnalysis;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) => Promise<void>;
}

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().max(50, 'Last name is too long').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().refine(
    (val) => val === '' || val.replace(/\D/g, '').length === 10,
    { message: 'Please enter a valid 10-digit phone number' }
  ),
});

export function BlurGate({ analysis, onSubmit }: BlurGateProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { isLocked, lockAndExecute } = useFormLock();
  const { total } = useTickerStats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse({ firstName, lastName, email, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = String(err.path[0]);
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    await lockAndExecute(async () => {
      await onSubmit({ firstName, lastName, email, phone });
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background relative">
      {/* Blurred results preview behind modal */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="max-w-lg w-full mx-auto p-8 blur-lg opacity-40 select-none">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-primary mb-2">B</div>
            <p className="text-xl text-muted-foreground">Analysis preview</p>
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

      <HarmonizerLeadCard
        analysis={analysis}
        firstName={firstName}
        lastName={lastName}
        email={email}
        phone={phone}
        errors={errors}
        isLocked={isLocked}
        tickerTotal={total}
        onFirstName={setFirstName}
        onLastName={setLastName}
        onEmail={setEmail}
        onPhone={setPhone}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
