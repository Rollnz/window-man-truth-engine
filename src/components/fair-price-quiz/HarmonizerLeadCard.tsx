import { PriceAnalysis } from '@/lib/fairPriceCalculations';
import { gradeConfig } from '@/data/fairPriceQuizData';
import { formatPhoneNumber } from '@/hooks/useFormValidation';
import { cn } from '@/lib/utils';

interface HarmonizerLeadCardProps {
  analysis: PriceAnalysis;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  errors: Record<string, string>;
  isLocked: boolean;
  tickerTotal: number;
  onFirstName: (v: string) => void;
  onLastName: (v: string) => void;
  onEmail: (v: string) => void;
  onPhone: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const inputCls =
  "w-full h-11 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 px-3 text-sm outline-none transition-colors focus:border-white/40";

const labelCls = "block mb-1.5 text-sm font-medium text-white/60";

export function HarmonizerLeadCard({
  analysis,
  firstName,
  lastName,
  email,
  phone,
  errors,
  isLocked,
  tickerTotal,
  onFirstName,
  onLastName,
  onEmail,
  onPhone,
  onSubmit,
}: HarmonizerLeadCardProps) {
  const gradeInfo = gradeConfig[analysis.grade];

  return (
    <div
      className="relative z-10 w-full max-w-lg mx-auto rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl p-6 md:p-8"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* Grade pill */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/[0.08] text-white text-sm font-semibold">
          <span className="text-base leading-none">{gradeInfo.emoji}</span>
          <span>{gradeInfo.label}</span>
        </div>
      </div>

      {/* Headline */}
      <h2 className="text-2xl font-bold text-white text-center mb-2 tracking-tight">
        🎯 Your Fair Price Analysis is Ready
      </h2>
      <p className="text-sm text-white/60 text-center mb-7">
        Enter your details to see your detailed breakdown
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* First / Last */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => onFirstName(e.target.value)}
              placeholder="First name"
              autoComplete="given-name"
              aria-required="true"
              aria-invalid={!!errors.firstName}
              className={cn(inputCls, errors.firstName && "border-red-400/60")}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => onLastName(e.target.value)}
              placeholder="Last name"
              autoComplete="family-name"
              className={cn(inputCls, errors.lastName && "border-red-400/60")}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={labelCls}>Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            className={cn(inputCls, errors.email && "border-red-400/60")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className={labelCls}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhone(formatPhoneNumber(e.target.value))}
            placeholder="(555) 123-4567"
            autoComplete="tel"
            className={cn(inputCls, errors.phone && "border-red-400/60")}
          />
          <p className="mt-1.5 text-xs text-white/40">
            Phone optional — only needed if you want a 5-minute callback
          </p>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
          )}
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={isLocked}
          className="w-full rounded-full bg-white text-black px-6 py-3 text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLocked ? 'Loading...' : 'See My Results →'}
        </button>
      </form>

      <p className="text-xs text-white/50 text-center mt-4">
        We'll also email you a copy for your records
      </p>

      <p className="text-xs text-white/50 text-center mt-5">
        ✓ {tickerTotal.toLocaleString()} homeowners analyzed their quotes this month
      </p>
    </div>
  );
}

export default HarmonizerLeadCard;
