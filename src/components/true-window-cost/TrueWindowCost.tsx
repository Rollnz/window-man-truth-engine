import { useState, useMemo, lazy, Suspense } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/motion/FadeInSection";
import {
  Zap,
  ShieldCheck,
  PiggyBank,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const LazyWindowGuyQuoteForm = lazy(() => import("./WindowGuyQuoteForm"));

interface TrueWindowCostProps {
  onOpenQuoteForm?: () => void;
}

/**
 * Experience section that shows why impact windows often
 * offset their sticker price through savings and incentives.
 */
export default function TrueWindowCost({ onOpenQuoteForm }: TrueWindowCostProps) {
  const [projectCost, setProjectCost] = useState<number>(28000);
  const [termYears, setTermYears] = useState<number>(15);
  const [aprPercent, setAprPercent] = useState<number>(8.99);
  const [estimatedMonthlySavings, setEstimatedMonthlySavings] = useState<number>(160);
  const [showForm, setShowForm] = useState(false);

  const { monthlyPayment, netMonthlyCost } = useMemo(() => {
    const principal = isFinite(projectCost) && projectCost > 0 ? projectCost : 0;
    const years = isFinite(termYears) && termYears > 0 ? termYears : 1;
    const months = years * 12;
    const rate = isFinite(aprPercent) && aprPercent > 0 ? aprPercent / 100 / 12 : 0;

    let payment = 0;

    if (principal > 0) {
      if (rate === 0) {
        payment = principal / months;
      } else {
        // Standard amortization formula for fixed-rate loans.
        const pow = Math.pow(1 + rate, months);
        payment = (principal * rate * pow) / (pow - 1);
      }
    }

    const savings =
      isFinite(estimatedMonthlySavings) && estimatedMonthlySavings > 0
        ? estimatedMonthlySavings
        : 0;

    const net = Math.max(payment - savings, 0);

    return {
      monthlyPayment: payment,
      netMonthlyCost: net,
    };
  }, [projectCost, termYears, aprPercent, estimatedMonthlySavings]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const handleOpenForm = () => {
    if (onOpenQuoteForm) {
      onOpenQuoteForm();
    } else {
      setShowForm(true);
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeInSection>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-heading font-black text-3xl md:text-4xl text-gray-900 mb-4">
              How Impact Windows Help Pay Their Own Way
            </h2>
            <p className="text-lg text-gray-700">
              When you factor in lower power bills, insurance discounts, and incentives, the real
              monthly cost is often much lower than the sticker payment.
            </p>
          </div>
        </FadeInSection>

        <div className="grid gap-10 lg:grid-cols-2 items-start">
          {/* LEFT COLUMN – Savings blocks */}
          <FadeInSection delay={0.1}>
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Energy Savings */}
                <Card className="h-full p-5 shadow-md border border-emerald-100">
                  <div className="flex items-center mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mr-3">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Energy Bill Savings</h3>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                      Energy-efficient impact windows can cut cooling energy use by roughly 12–25%
                      in hot climates when properly installed.
                    </li>
                    <li>Your AC runs shorter, gentler cycles all summer.</li>
                    <li>
                      Over 15–20 years, that can add up to thousands of dollars in avoided utility
                      costs.
                    </li>
                  </ul>
                </Card>

                {/* Insurance Discounts */}
                <Card className="h-full p-5 shadow-md border border-sky-100">
                  <div className="flex items-center mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 mr-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Insurance Discounts</h3>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                      Florida insurers offer wind-mitigation credits when you harden all openings
                      with approved impact windows.
                    </li>
                    <li>Many homeowners see meaningful savings on the hurricane portion of their premium.</li>
                    <li>
                      Lower risk of major damage also means less chance of a huge hurricane deductible.
                    </li>
                  </ul>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Incentives & Grants */}
                <Card className="h-full p-5 shadow-md border border-amber-100">
                  <div className="flex items-center mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 mr-3">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Tax Credits & Grants</h3>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                      Federal energy-efficiency incentives can offset part of your upgrade cost when
                      products qualify.
                    </li>
                    <li>
                      State programs like My Safe Florida Home have offered grants for
                      hurricane-hardening upgrades when funded.
                    </li>
                    <li>Some utilities and local programs add extra rebates for high-efficiency windows.</li>
                  </ul>
                </Card>

                {/* Home Value & Prep */}
                <Card className="h-full p-5 shadow-md border border-violet-100">
                  <div className="flex items-center mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 mr-3">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Home Value & Less Hassle</h3>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                      Impact windows boost resale appeal and make your home stand out as truly
                      "storm-ready."
                    </li>
                    <li>No more buying plywood or paying someone to board up every time a storm spins up.</li>
                    <li>Less chance of costly interior damage from blown-out glass and water intrusion.</li>
                  </ul>
                </Card>
              </div>
            </div>
          </FadeInSection>

          {/* RIGHT COLUMN – Calculator */}
          <FadeInSection delay={0.2}>
            <Card className="p-6 lg:p-7 shadow-xl border border-blue-100">
              <h3 className="font-heading font-black text-2xl text-gray-900 mb-3">
                See What Your Windows Really Cost After Savings
              </h3>
              <p className="text-sm text-gray-700 mb-6">
                Adjust the numbers below to see how your estimated payment compares to your estimated
                monthly savings from energy and insurance.
              </p>

              <div className="space-y-4 mb-6">
                {/* Project cost */}
                <div className="space-y-1.5">
                  <Label htmlFor="projectCost">Estimated project cost</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">$</span>
                    <Input
                      id="projectCost"
                      type="number"
                      min={0}
                      value={projectCost.toString()}
                      onChange={(e) => setProjectCost(Math.max(0, Number(e.target.value) || 0))}
                    />
                  </div>
                </div>

                {/* Term */}
                <div className="space-y-1.5">
                  <Label htmlFor="termYears">Term length (years)</Label>
                  <Input
                    id="termYears"
                    type="number"
                    min={1}
                    max={30}
                    value={termYears.toString()}
                    onChange={(e) => setTermYears(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                  />
                </div>

                {/* APR */}
                <div className="space-y-1.5">
                  <Label htmlFor="aprPercent">Estimated APR</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="aprPercent"
                      type="number"
                      min={0}
                      step={0.01}
                      value={aprPercent.toString()}
                      onChange={(e) => setAprPercent(Math.max(0, Number(e.target.value) || 0))}
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>

                {/* Estimated savings */}
                <div className="space-y-1.5">
                  <Label htmlFor="estimatedSavings">Estimated monthly savings (energy + insurance)</Label>
                  <Input
                    id="estimatedSavings"
                    type="number"
                    min={0}
                    value={estimatedMonthlySavings.toString()}
                    onChange={(e) =>
                      setEstimatedMonthlySavings(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Start with a conservative guess. Many homeowners land between $80–$200/mo
                    depending on their home.
                  </p>
                </div>
              </div>

              {/* Results */}
              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 mb-6">
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>Estimated payment</span>
                  <span className="font-semibold">{formatCurrency(monthlyPayment || 0)}/mo</span>
                </div>

                <div className="flex justify-between text-sm text-gray-700 mb-2">
                  <span>Estimated monthly savings</span>
                  <span className="font-semibold">-{formatCurrency(estimatedMonthlySavings || 0)}/mo</span>
                </div>

                <div className="border-t border-blue-100 my-3" />

                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-800">Net estimated cost after savings</span>
                  <span className="font-heading font-black text-xl text-blue-700">
                    {formatCurrency(netMonthlyCost || 0)}/mo
                  </span>
                </div>

                {netMonthlyCost === 0 && monthlyPayment > 0 && (
                  <p className="mt-2 text-xs text-gray-600">
                    Your estimated savings could offset most or all of the payment.
                  </p>
                )}
              </div>

              <Button
                className="w-full font-black flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.6)] hover:brightness-110"
                onClick={handleOpenForm}
              >
                Get My Exact Numbers
                <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                This calculator is for estimates only. Your actual payment and savings will depend on
                your lender, credit profile, home, and final quote. This is not a financing offer or
                credit approval.
              </p>
            </Card>
          </FadeInSection>
        </div>
      </div>

      {/* Quote Form Modal (same pattern as PricingTransparencySection) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <Suspense fallback={<div>Loading form...</div>}>
                <LazyWindowGuyQuoteForm onSubmit={() => setShowForm(false)} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
