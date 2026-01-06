import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Home, Leaf, ShieldCheck, Sparkles, Wand2, X } from 'lucide-react';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useSessionData } from '@/hooks/useSessionData';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { getAttributionData, buildAIContextFromSession } from '@/lib/attribution';
import { logEvent } from '@/lib/windowTruthClient';
import { trackFormSubmit, trackLeadCapture } from '@/lib/gtm';
import { cn } from '@/lib/utils';

type CalculatorInputs = {
  projectCost: number;
  termYears: number;
  aprPercent: number;
  estimatedMonthlySavings: number;
};

type TrueCostCalculatorProps = {
  defaults?: CalculatorInputs;
};

const DEFAULT_INPUTS: CalculatorInputs = {
  projectCost: 28000,
  termYears: 15,
  aprPercent: 8.99,
  estimatedMonthlySavings: 160,
};

type SavingsHighlight = {
  title: string;
  icon: JSX.Element;
  borderClass: string;
  badgeClass: string;
  points: string[];
};

const SAVINGS_HIGHLIGHTS: SavingsHighlight[] = [
  {
    title: 'Energy Bill Savings',
    borderClass: 'border-emerald-100',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    icon: <Leaf className="h-5 w-5" />, // conveys efficiency
    points: [
      'Energy-efficient impact windows can cut cooling energy use by roughly 12–25% in hot climates.',
      'Your AC runs shorter, gentler cycles all summer.',
      'Over 15–20 years, that can add up to thousands of dollars in avoided utility costs.',
    ],
  },
  {
    title: 'Insurance Discounts',
    borderClass: 'border-sky-100',
    badgeClass: 'bg-sky-100 text-sky-700',
    icon: <ShieldCheck className="h-5 w-5" />, // coverage and protection
    points: [
      'Florida insurers offer wind-mitigation credits when you harden all openings.',
      'Many homeowners see meaningful savings on the hurricane portion of their premium.',
      'Lower risk of major damage means less chance of a huge hurricane deductible.',
    ],
  },
  {
    title: 'Tax Credits & Grants',
    borderClass: 'border-amber-100',
    badgeClass: 'bg-amber-100 text-amber-700',
    icon: <Sparkles className="h-5 w-5" />, // incentive/bonus
    points: [
      'Federal energy-efficiency incentives can offset part of your upgrade cost.',
      'State programs like My Safe Florida Home offer grants for hardening upgrades.',
      'Some utilities add extra rebates for high-efficiency products.',
    ],
  },
  {
    title: 'Home Value & Less Hassle',
    borderClass: 'border-violet-100',
    badgeClass: 'bg-violet-100 text-violet-700',
    icon: <Home className="h-5 w-5" />, // property value
    points: [
      'Impact windows boost resale appeal and make your home stand out.',
      'No more buying plywood or paying someone to board up every storm.',
      'Less chance of costly interior damage from blown-out glass.',
    ],
  },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function sanitizePositiveNumber(value: number, fallback: number) {
  if (Number.isFinite(value) && value >= 0) {
    return value;
  }
  return fallback;
}

function calculateMonthlyPayment({ projectCost, termYears, aprPercent }: CalculatorInputs) {
  if (projectCost <= 0 || termYears <= 0) return 0;

  const totalMonths = termYears * 12;
  const monthlyRate = Math.max(aprPercent, 0) / 100 / 12;

  if (monthlyRate === 0) {
    return projectCost / totalMonths;
  }

  const growth = Math.pow(1 + monthlyRate, totalMonths);
  // Standard amortization formula: payment = P * r * (1+r)^n / ((1+r)^n - 1)
  return (projectCost * monthlyRate * growth) / (growth - 1);
}

function parseScenarioPrompt(prompt: string): Partial<CalculatorInputs> {
  const normalized = prompt.toLowerCase();
  const updates: Partial<CalculatorInputs> = {};

  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) {
    updates.projectCost = parseFloat(kMatch[1]) * 1000;
  }

  const explicitCostMatch = normalized.match(/(?:cost|project|price|total)\D*(\d{4,6})/);
  if (!updates.projectCost && explicitCostMatch) {
    updates.projectCost = parseFloat(explicitCostMatch[1]);
  }

  const termMatch = normalized.match(/(\d{1,2})\s*(?:year|yr|y)[s]?/);
  if (termMatch) {
    updates.termYears = parseInt(termMatch[1], 10);
  }

  const aprMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|apr|rate)/);
  if (aprMatch) {
    updates.aprPercent = parseFloat(aprMatch[1]);
  }

  const savingsMatch = normalized.match(/(?:save|savings)\D*(\d{1,4})/);
  if (savingsMatch) {
    updates.estimatedMonthlySavings = parseFloat(savingsMatch[1]);
  }

  return updates;
}

function FadeInSection({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target); // stop observing once visible to reduce work
          }
        });
      },
      { threshold: 0.1 }
    );

    const current = ref.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transform transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TrueCostCalculator({ defaults = DEFAULT_INPUTS }: TrueCostCalculatorProps) {
  usePageTracking('true-cost-calculator');
  const { sessionData, updateFields, markToolCompleted } = useSessionData();
  const { toast } = useToast();
  const [inputs, setInputs] = useState<CalculatorInputs>(defaults);
  const [scenarioPrompt, setScenarioPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [flashFields, setFlashFields] = useState<Set<keyof CalculatorInputs>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const { values: contactValues, setValue: setContactValue, validateAll, getError, hasError } = useFormValidation({
    initialValues: {
      firstName: sessionData.name?.split(' ')[0] || '',
      lastName: sessionData.name?.split(' ').slice(1).join(' ') || '',
      email: sessionData.email || '',
      phone: sessionData.phone || '',
    },
    schemas: {
      firstName: commonSchemas.name,
      lastName: commonSchemas.name,
      email: commonSchemas.email,
      phone: commonSchemas.phone,
    },
    formatters: {
      phone: formatPhoneNumber,
    },
  });

  const monthlyPayment = useMemo(() => calculateMonthlyPayment(inputs), [inputs]);
  const netCost = useMemo(
    () => Math.max(monthlyPayment - inputs.estimatedMonthlySavings, 0),
    [inputs.estimatedMonthlySavings, monthlyPayment]
  );
  const isDefault = useMemo(
    () =>
      inputs.projectCost === defaults.projectCost &&
      inputs.termYears === defaults.termYears &&
      Number(inputs.aprPercent.toFixed(2)) === Number(defaults.aprPercent.toFixed(2)) &&
      inputs.estimatedMonthlySavings === defaults.estimatedMonthlySavings,
    [defaults, inputs.aprPercent, inputs.estimatedMonthlySavings, inputs.projectCost, inputs.termYears]
  );
  const showSavingsNotice = netCost === 0 && monthlyPayment > 0;

  useEffect(() => {
    updateFields({
      sourceTool: 'true-cost-calculator',
      email: contactValues.email || sessionData.email,
      phone: contactValues.phone || sessionData.phone,
      name: `${contactValues.firstName} ${contactValues.lastName}`.trim() || sessionData.name,
    });
    // We only depend on contactValues because updateFields is stable
  }, [contactValues, sessionData.email, sessionData.name, sessionData.phone, updateFields]);

  useEffect(() => {
    if (flashFields.size === 0) return undefined;

    const timeout = setTimeout(() => setFlashFields(new Set()), 1200);
    return () => clearTimeout(timeout);
  }, [flashFields]);

  const updateField = (field: keyof CalculatorInputs, value: number) => {
    setInputs((prev) => {
      const nextValue = sanitizePositiveNumber(value, prev[field]);
      const next = { ...prev, [field]: nextValue } as CalculatorInputs;
      return next;
    });
  };

  const handleScenario = async () => {
    if (!scenarioPrompt.trim()) return;

    setAiFeedback(null);
    setIsAiLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const updates = parseScenarioPrompt(scenarioPrompt);

    if (Object.keys(updates).length === 0) {
      setAiFeedback("I didn't spot numbers to change. Try 'Term 25 years at 6%' or 'Project cost 35k'.");
      setIsAiLoading(false);
      return;
    }

    setInputs((prev) => {
      const next: CalculatorInputs = {
        ...prev,
        ...updates,
      };

      setFlashFields(new Set(Object.keys(updates) as (keyof CalculatorInputs)[]));
      return next;
    });

    setScenarioPrompt('');
    setIsAiLoading(false);
  };

  const handleReset = () => {
    setInputs(defaults);
    setScenarioPrompt('');
    setAiFeedback(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    trackFormSubmit('true-cost-calculator', { form_name: 'true_cost_calculator_modal' });

    if (!validateAll()) {
      toast({
        title: 'Check the form',
        description: getError('email') || getError('phone') || 'Please review your details.',
        variant: 'destructive',
      });
      return;
    }

    const name = `${contactValues.firstName} ${contactValues.lastName}`.trim();
    const email = contactValues.email.trim();
    const phone = contactValues.phone.trim();

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          email,
          name: name || sessionData.name || null,
          phone: phone || sessionData.phone || null,
          sourceTool: 'true-cost-calculator',
          sessionData,
          trueCostContext: {
            projectCost: inputs.projectCost,
            termYears: inputs.termYears,
            aprPercent: inputs.aprPercent,
            estimatedMonthlySavings: inputs.estimatedMonthlySavings,
            monthlyPayment,
            netCost,
          },
          chatHistory: [],
          attribution: getAttributionData(),
          aiContext: buildAIContextFromSession(sessionData, 'true-cost-calculator'),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save lead');
      }

      const data = await response.json();

      if (data.success && data.leadId) {
        updateFields({
          email,
          phone,
          name: name || sessionData.name,
          leadId: data.leadId,
        });
        markToolCompleted('true-cost-calculator');

        logEvent({
          event_name: 'tool_completed',
          tool_name: 'true-cost-calculator',
          params: {
            monthly_payment: monthlyPayment,
            net_cost: netCost,
          },
        });

        logEvent({
          event_name: 'lead_captured',
          tool_name: 'true-cost-calculator',
          params: {
            lead_id: data.leadId,
          },
        });

        trackLeadCapture({
          sourceTool: 'true-cost-calculator',
          email,
          hasPhone: !!phone,
        });

        setIsFormSubmitted(true);
        toast({
          title: 'Request sent!',
          description: 'We received your details and will follow up shortly.',
        });
      } else {
        throw new Error(data.error || 'Failed to save lead');
      }
    } catch (error) {
      console.error('Lead capture error:', error);
      toast({
        title: 'Unable to save',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsFormSubmitted(false);
  };

  useEffect(() => {
    if (!isModalOpen || !modalRef.current) return undefined;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(focusableSelector));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) {
      first.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || focusable.length === 0) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFormSubmitted, isModalOpen]);

  const renderHighlightCard = (highlight: SavingsHighlight, index: number) => (
    <FadeInSection key={highlight.title} delay={index * 100}>
      <div
        className={cn(
          'h-full rounded-xl border bg-white p-5 shadow-md transition-transform hover:scale-[1.02]',
          highlight.borderClass
        )}
      >
        <div className="mb-3 flex items-center">
          <div
            className={cn(
              'mr-3 flex h-9 w-9 items-center justify-center rounded-full',
              highlight.badgeClass
            )}
          >
            {highlight.icon}
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{highlight.title}</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          {highlight.points.map((point) => (
            <li key={point} className="flex gap-2">
              <span>•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </FadeInSection>
  );

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-gray-900">
        <FadeInSection className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            How Impact Windows Help Pay Their Own Way
          </h2>
          <p className="text-lg text-gray-700">
            When you factor in lower power bills, insurance discounts, and incentives, the real monthly cost is
            often much lower than the sticker payment.
          </p>
        </FadeInSection>

        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {SAVINGS_HIGHLIGHTS.slice(0, 2).map(renderHighlightCard)}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {SAVINGS_HIGHLIGHTS.slice(2).map(renderHighlightCard)}
            </div>
          </div>

          <FadeInSection delay={200}>
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60 lg:p-7">
              <h3 className="mb-3 text-2xl font-black tracking-tight text-gray-900">
                See What Your Windows Really Cost After Savings
              </h3>
              <p className="mb-6 text-sm text-gray-700">
                Adjust the numbers below to see how your estimated payment compares to your estimated monthly
                savings from energy and insurance.
              </p>

              <div className="mb-8 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="projectCost" className="block text-sm font-medium text-gray-700">
                    Estimated project cost
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-sm text-gray-500">$</span>
                    </div>
                    <input
                      id="projectCost"
                      type="number"
                      inputMode="decimal"
                      value={inputs.projectCost}
                      onChange={(event) => updateField('projectCost', parseFloat(event.target.value) || 0)}
                      className={cn(
                        'block w-full rounded-lg border border-gray-300 py-2 pl-7 pr-4 text-sm outline-none transition-all focus:border-sky-500 focus:ring-sky-500',
                        flashFields.has('projectCost') && 'border-emerald-500 bg-emerald-50'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="termYears" className="block text-sm font-medium text-gray-700">
                      Term (years)
                    </label>
                    <input
                      id="termYears"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={40}
                      value={inputs.termYears}
                      onChange={(event) => updateField('termYears', parseFloat(event.target.value) || 0)}
                      className={cn(
                        'block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition-all focus:border-sky-500 focus:ring-sky-500',
                        flashFields.has('termYears') && 'border-emerald-500 bg-emerald-50'
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="aprPercent" className="block text-sm font-medium text-gray-700">
                      Estimated APR (%)
                    </label>
                    <input
                      id="aprPercent"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={inputs.aprPercent}
                      onChange={(event) => updateField('aprPercent', parseFloat(event.target.value) || 0)}
                      className={cn(
                        'block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition-all focus:border-sky-500 focus:ring-sky-500',
                        flashFields.has('aprPercent') && 'border-emerald-500 bg-emerald-50'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="estimatedSavings" className="block text-sm font-medium text-gray-700">
                    Estimated monthly savings (energy + insurance)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-sm text-gray-500">$</span>
                    </div>
                    <input
                      id="estimatedSavings"
                      type="number"
                      inputMode="decimal"
                      value={inputs.estimatedMonthlySavings}
                      onChange={(event) => updateField('estimatedMonthlySavings', parseFloat(event.target.value) || 0)}
                      className={cn(
                        'block w-full rounded-lg border border-gray-300 py-2 pl-7 pr-4 text-sm outline-none transition-all focus:border-sky-500 focus:ring-sky-500',
                        flashFields.has('estimatedMonthlySavings') && 'border-emerald-500 bg-emerald-50'
                      )}
                    />
                  </div>
                  <p className="text-[11px] leading-tight text-gray-500">Conservative guess. Many homeowners land between $80–$200/mo.</p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-2 flex justify-between text-sm text-gray-700">
                  <span>Estimated payment</span>
                  <span className="font-bold text-gray-900">{formatCurrency(monthlyPayment)}/mo</span>
                </div>
                <div className="mb-3 flex justify-between text-sm text-gray-700">
                  <span>Estimated monthly savings</span>
                  <span className="font-bold text-emerald-600">-{formatCurrency(inputs.estimatedMonthlySavings)}/mo</span>
                </div>
                <div className="my-4 border-t border-blue-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">Net estimated cost</span>
                  <span className="text-2xl font-black text-blue-700">{formatCurrency(netCost)}/mo</span>
                </div>
                {showSavingsNotice && (
                  <div className="mt-3 text-[11px] font-medium text-emerald-700">
                    ✨ Your estimated savings could offset most or all of the payment.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-pink-500 font-black text-white shadow-[0_4px_20px_rgba(236,72,153,0.4)] transition-transform hover:scale-[1.02] active:scale-100"
              >
                GET MY EXACT NUMBERS
                <ArrowRight className="h-5 w-5" strokeWidth={3} />
              </button>

              <div className="mt-8 border-t border-blue-100 pt-6">
                <label
                  htmlFor="aiChat"
                  className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-600"
                >
                  <Wand2 className="h-3 w-3" fill="currentColor" strokeWidth={1.5} />
                  AI Scenario Tester
                </label>
                <div className="relative flex items-center gap-2">
                  <input
                    id="aiChat"
                    type="text"
                    value={scenarioPrompt}
                    placeholder="e.g., 'What if rate was 5%?'"
                    onChange={(event) => setScenarioPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleScenario();
                      }
                    }}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleScenario}
                    disabled={isAiLoading}
                    className="absolute right-1 rounded-md p-1.5 text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                  >
                    {!isAiLoading ? (
                      <Wand2 className="h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-start justify-between">
                  <p className="text-[10px] italic text-gray-400">Try: "30 year term at 6.5%" or "Project cost 35k"</p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className={cn(
                      'text-[10px] text-blue-400 underline transition-colors hover:text-blue-600',
                      isDefault && 'pointer-events-none opacity-0'
                    )}
                  >
                    Reset Default
                  </button>
                </div>
                {aiFeedback && <p className="mt-2 text-[11px] text-amber-600">{aiFeedback}</p>}
              </div>

              <p className="mt-4 text-center text-[10px] leading-relaxed text-gray-400">
                Estimates only. Actual payment depends on lender, credit profile, and final quote. Not a financing offer.
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div ref={modalRef} className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 id="quote-modal-title" className="text-2xl font-black text-gray-900">
                Request Your Quote
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={handleCloseModal}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {!isFormSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 px-8 py-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-500" htmlFor="firstName">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      value={contactValues.firstName}
                      onChange={(e) => setContactValue('firstName', e.target.value)}
                      required
                      aria-invalid={hasError('firstName')}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-sky-500"
                    />
                    {hasError('firstName') && (
                      <p className="text-xs text-destructive">{getError('firstName')}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-500" htmlFor="lastName">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      value={contactValues.lastName}
                      onChange={(e) => setContactValue('lastName', e.target.value)}
                      required
                      aria-invalid={hasError('lastName')}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-sky-500"
                    />
                    {hasError('lastName') && <p className="text-xs text-destructive">{getError('lastName')}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-500" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={contactValues.email}
                    onChange={(e) => setContactValue('email', e.target.value)}
                    required
                    aria-invalid={hasError('email')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-sky-500"
                  />
                  {hasError('email') && <p className="text-xs text-destructive">{getError('email')}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-500" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={contactValues.phone}
                    onChange={(e) => setContactValue('phone', e.target.value)}
                    required
                    aria-invalid={hasError('phone')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-sky-500"
                  />
                  {hasError('phone') && <p className="text-xs text-destructive">{getError('phone')}</p>}
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-sky-600 py-4 font-bold text-white shadow-lg shadow-sky-200 transition-colors hover:bg-sky-700"
                  >
                    Send My Request
                  </button>
                  <p className="mt-4 text-center text-[10px] text-gray-400">
                    By clicking, you agree to be contacted regarding your window estimate.
                  </p>
                </div>
              </form>
            ) : (
                <div className="px-8 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <ShieldCheck className="h-8 w-8" strokeWidth={3} />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900">Request Sent!</h3>
                  <p className="text-sm text-gray-600">We'll be in touch with your customized quote shortly.</p>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-6 text-sm font-bold text-sky-600"
                  >
                    Close
                  </button>
                </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
