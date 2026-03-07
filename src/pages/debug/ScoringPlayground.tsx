import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Shield, FileText, DollarSign, AlertTriangle, Award,
  RotateCcw, Copy, Upload, Code, Beaker, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/utils/clipboard";

// Import the real engine
import {
  scoreFromSignals,
  generateSafePreview,
  generateForensicSummary,
  extractIdentity,
  DEFAULT_WEIGHTS,
} from "../../../scanner-brain/index";
import type { ExtractionSignals } from "../../../scanner-brain/schema";
import type { PillarWeights } from "../../../scanner-brain/scoring";

// ═══════════════════════════════════════════════════════════════════════════
// CURVE FUNCTION (mirrored from scoring.ts for X-Ray display)
// ═══════════════════════════════════════════════════════════════════════════
function applyCurveLocal(score: number): number {
  if (score <= 70) return score;
  const excess = score - 70;
  return Math.round(70 + (30 * Math.pow(excess / 30, 1.8)));
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT SIGNALS
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_SIGNALS: ExtractionSignals = {
  isValidQuote: true,
  validityReason: "Test scenario",
  totalPriceFound: true,
  totalPriceValue: 15000,
  openingCountEstimate: 10,
  hasComplianceKeyword: true,
  hasComplianceIdentifier: true,
  hasNOANumber: true,
  noaNumberValue: "NOA-21-1234.56",
  hasLaminatedMention: true,
  hasGlassBuildDetail: true,
  hasTemperedOnlyRisk: false,
  hasNonImpactLanguage: false,
  licenseNumberPresent: true,
  licenseNumberValue: "CGC1234567",
  hasOwnerBuilderLanguage: false,
  contractorNameExtracted: "Test Contractor LLC",
  hasPermitMention: true,
  hasDemoInstallDetail: true,
  hasSpecificMaterials: true,
  hasWallRepairMention: true,
  hasFinishDetail: true,
  hasCleanupMention: true,
  hasBrandClarity: true,
  hasDetailedScope: true,
  hasSubjectToChange: false,
  hasRepairsExcluded: false,
  hasStandardInstallation: false,
  depositPercentage: 20,
  hasFinalPaymentTrap: false,
  hasSafePaymentTerms: true,
  hasPaymentBeforeCompletion: false,
  hasContractTraps: false,
  contractTrapsList: [],
  hasManagerDiscount: false,
  hasWarrantyMention: true,
  hasLaborWarranty: true,
  warrantyDurationYears: 10,
  hasLifetimeWarranty: true,
  hasTransferableWarranty: true,
  hasPremiumIndicators: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════
const PRESETS: Record<string, { label: string; signals: Partial<ExtractionSignals> }> = {
  perfect: { label: "✅ Perfect", signals: {} },
  average: {
    label: "😐 Average",
    signals: {
      hasComplianceIdentifier: false, hasNOANumber: false, noaNumberValue: null,
      hasGlassBuildDetail: false, hasDemoInstallDetail: false, hasSpecificMaterials: false,
      hasWallRepairMention: false, hasFinishDetail: false, hasCleanupMention: false,
      hasDetailedScope: false, depositPercentage: 33,
      hasSafePaymentTerms: false, hasLaborWarranty: false,
      warrantyDurationYears: null, hasLifetimeWarranty: false, hasTransferableWarranty: false,
    },
  },
  noLicense: { label: "🚨 No License", signals: { licenseNumberPresent: false, licenseNumberValue: null } },
  scam: {
    label: "💀 Scam",
    signals: {
      licenseNumberPresent: false, licenseNumberValue: null,
      hasComplianceKeyword: false, hasComplianceIdentifier: false,
      hasNOANumber: false, hasLaminatedMention: false, hasGlassBuildDetail: false,
      hasTemperedOnlyRisk: true, hasNonImpactLanguage: true,
      hasPermitMention: false, hasDemoInstallDetail: false, hasSpecificMaterials: false,
      hasWallRepairMention: false, hasFinishDetail: false, hasCleanupMention: false,
      hasBrandClarity: false, hasDetailedScope: false,
      hasSubjectToChange: true, hasRepairsExcluded: true, hasStandardInstallation: true,
      depositPercentage: 60, hasFinalPaymentTrap: true, hasSafePaymentTerms: false,
      hasPaymentBeforeCompletion: true, hasContractTraps: true,
      contractTrapsList: ["arbitration clause", "lien waiver", "cancellation penalty"],
      hasManagerDiscount: true,
      hasWarrantyMention: false, hasLaborWarranty: false,
      warrantyDurationYears: null, hasLifetimeWarranty: false, hasTransferableWarranty: false,
    },
  },
  invalid: { label: "📄 Not a Quote", signals: { isValidQuote: false, validityReason: "Grocery receipt" } },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-green-400";
  if (grade.startsWith("B")) return "text-blue-400";
  if (grade.startsWith("C")) return "text-yellow-400";
  if (grade.startsWith("D")) return "text-orange-400";
  return "text-red-500";
}

function riskBadge(level: string) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    moderate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    acceptable: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return <Badge variant="outline" className={colors[level] || ""}>{level.toUpperCase()}</Badge>;
}

function PillarBar({ label, score, icon, weightPct }: { label: string; score: number; icon: React.ReactNode; weightPct: number }) {
  const pct = Math.min(score, 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label} ({weightPct}%)</span>
        <span className="font-mono font-bold">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, danger }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className={`text-sm ${danger ? "text-red-400" : "text-foreground"}`}>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WEIGHT SLIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function WeightSlider({ label, value, onChange, icon }: {
  label: string; value: number; onChange: (v: number) => void; icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
        <span className="font-mono font-bold text-primary">{Math.round(value * 100)}%</span>
      </div>
      <Slider
        aria-label={`${label} weight`}
        min={0}
        max={60}
        step={1}
        value={[Math.round(value * 100)]}
        onValueChange={([v]) => onChange(v / 100)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function ScoringPlayground() {
  const [signals, setSignals] = useState<ExtractionSignals>({ ...DEFAULT_SIGNALS });
  const [openingHint, setOpeningHint] = useState<number | null>(null);
  const [weights, setWeights] = useState<PillarWeights>({ ...DEFAULT_WEIGHTS });
  const [jsonInput, setJsonInput] = useState("");

  const update = useCallback(<K extends keyof ExtractionSignals>(key: K, val: ExtractionSignals[K]) => {
    setSignals(prev => ({ ...prev, [key]: val }));
  }, []);

  const applyPreset = useCallback((key: string) => {
    const preset = PRESETS[key];
    if (preset) setSignals({ ...DEFAULT_SIGNALS, ...preset.signals });
  }, []);

  const updateWeight = useCallback((pillar: keyof PillarWeights, val: number) => {
    setWeights(prev => {
      const others = Object.keys(prev).filter(k => k !== pillar) as (keyof PillarWeights)[];
      const otherSum = others.reduce((s, k) => s + prev[k], 0);
      const newWeights = { ...prev, [pillar]: val };
      // Proportionally redistribute remaining weight
      if (otherSum > 0) {
        const remaining = 1 0 - val;
        const scale = remaining / otherSum;
        others.forEach(k => { newWeights[k] = Math.max(0, prev[k] * scale); });
      }
      return newWeights;
    });
  }, []);

  const weightSum = useMemo(() => 
    Math.round((weights.safety + weights.scope + weights.price + weights.finePrint + weights.warranty) * 100), 
    [weights]
  );

  // Run engine with custom weights
  const scored = useMemo(() => scoreFromSignals(signals, openingHint, weights), [signals, openingHint, weights]);
  const defaultScored = useMemo(() => scoreFromSignals(signals, openingHint), [signals, openingHint]);
  const preview = useMemo(() => generateSafePreview(scored), [scored]);
  const forensic = useMemo(() => generateForensicSummary(signals, scored), [signals, scored]);
  const identity = useMemo(() => extractIdentity(signals), [signals]);

  // Math X-Ray calculations
  const xray = useMemo(() => {
    const w = weights;
    const pillars = [
      { name: "Safety", score: scored.safetyScore, weight: w.safety },
      { name: "Scope", score: scored.scopeScore, weight: w.scope },
      { name: "Price", score: scored.priceScore, weight: w.price },
      { name: "Fine Print", score: scored.finePrintScore, weight: w.finePrint },
      { name: "Warranty", score: scored.warrantyScore, weight: w.warranty },
    ];
    const weighted = pillars.map(p => ({ ...p, points: p.score * p.weight }));
    const rawTotal = Math.round(weighted.reduce((s, p) => s + p.points, 0));
    const curved = applyCurveLocal(rawTotal);
    const capped = scored.hardCap.applied ? Math.min(curved, scored.hardCap.ceiling) : curved;
    return { pillars: weighted, rawTotal, curved, capped };
  }, [scored, weights]);

  // JSON Importer
  const importJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      // Support both raw signals and wrapped objects
      const signalsObj = parsed.signals ?? parsed;
      if (typeof signalsObj.isValidQuote !== "boolean") {
        toast.error("Invalid JSON: missing isValidQuote field");
        return;
      }
      setSignals({ ...DEFAULT_SIGNALS, ...signalsObj });
      toast.success("Signals imported — toggles updated");
      setJsonInput("");
    } catch {
      toast.error("Invalid JSON — check your paste");
    }
  }, [jsonInput]);

  // Export Engine Settings
  const exportSettings = useCallback(() => {
    const code = `// Updated pillar weights — generated from Master Control Room
// Paste into scanner-brain/scoring.ts → DEFAULT_WEIGHTS
export const DEFAULT_WEIGHTS: PillarWeights = {
  safety: ${weights.safety.toFixed(2)},   // ${Math.round(weights.safety * 100)}%
  scope: ${weights.scope.toFixed(2)},    // ${Math.round(weights.scope * 100)}%
  price: ${weights.price.toFixed(2)},    // ${Math.round(weights.price * 100)}%
  finePrint: ${weights.finePrint.toFixed(2)}, // ${Math.round(weights.finePrint * 100)}%
  warranty: ${weights.warranty.toFixed(2)},  // ${Math.round(weights.warranty * 100)}%
};`;
    copyToClipboard(code);
    toast.success("TypeScript code copied to clipboard");
  }, [weights]);

  const copyFullState = () => {
    copyToClipboard(JSON.stringify({ signals, weights, scored, preview, forensic, identity }, null, 2));
    toast.success("Full state copied to clipboard");
  };

  const scoreDelta = scored.overallScore - defaultScored.overallScore;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Beaker className="h-6 w-6 text-primary" /> Master Control Room
            </h1>
            <p className="text-sm text-muted-foreground">Live rubric tuning • Math X-Ray • JSON import • Weight experiments</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PRESETS).map(([key, { label }]) => (
              <Button key={key} variant="outline" size="sm" onClick={() => applyPreset(key)}>{label}</Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => { setSignals({ ...DEFAULT_SIGNALS }); setWeights({ ...DEFAULT_WEIGHTS }); }}>
              <RotateCcw className="h-4 w-4 mr-1" />Reset All
            </Button>
            <Button variant="ghost" size="sm" onClick={copyFullState}>
              <Copy className="h-4 w-4 mr-1" />JSON
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COL: Signal Controls */}
          <div className="lg:col-span-3 space-y-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4 pr-4">
                {/* Document */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Document</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <ToggleRow label="isValidQuote" checked={signals.isValidQuote} onChange={v => update("isValidQuote", v)} />
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Total Price ($)</Label>
                      <Input type="number" value={signals.totalPriceValue ?? ""} onChange={e => update("totalPriceValue", e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Opening Count</Label>
                      <Input type="number" value={signals.openingCountEstimate ?? ""} onChange={e => update("openingCountEstimate", e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Opening Hint (override)</Label>
                      <Input type="number" value={openingHint ?? ""} onChange={e => setOpeningHint(e.target.value ? Number(e.target.value) : null)} />
                    </div>
                  </CardContent>
                </Card>

                {/* Safety */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Shield className="h-4 w-4" />Safety</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    <ToggleRow label="hasComplianceKeyword" checked={signals.hasComplianceKeyword} onChange={v => update("hasComplianceKeyword", v)} />
                    <ToggleRow label="hasComplianceIdentifier" checked={signals.hasComplianceIdentifier} onChange={v => update("hasComplianceIdentifier", v)} />
                    <ToggleRow label="hasNOANumber" checked={signals.hasNOANumber} onChange={v => update("hasNOANumber", v)} />
                    <ToggleRow label="hasLaminatedMention" checked={signals.hasLaminatedMention} onChange={v => update("hasLaminatedMention", v)} />
                    <ToggleRow label="hasGlassBuildDetail" checked={signals.hasGlassBuildDetail} onChange={v => update("hasGlassBuildDetail", v)} />
                    <ToggleRow label="hasTemperedOnlyRisk" checked={signals.hasTemperedOnlyRisk} onChange={v => update("hasTemperedOnlyRisk", v)} danger />
                    <ToggleRow label="hasNonImpactLanguage" checked={signals.hasNonImpactLanguage} onChange={v => update("hasNonImpactLanguage", v)} danger />
                  </CardContent>
                </Card>

                {/* Contractor Identity */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Contractor Identity</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    <ToggleRow label="licenseNumberPresent" checked={signals.licenseNumberPresent} onChange={v => update("licenseNumberPresent", v)} />
                    <ToggleRow label="hasOwnerBuilderLanguage" checked={signals.hasOwnerBuilderLanguage} onChange={v => update("hasOwnerBuilderLanguage", v)} danger />
                  </CardContent>
                </Card>

                {/* Scope */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><FileText className="h-4 w-4" />Scope</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    <ToggleRow label="hasPermitMention" checked={signals.hasPermitMention} onChange={v => update("hasPermitMention", v)} />
                    <ToggleRow label="hasDemoInstallDetail" checked={signals.hasDemoInstallDetail} onChange={v => update("hasDemoInstallDetail", v)} />
                    <ToggleRow label="hasSpecificMaterials" checked={signals.hasSpecificMaterials} onChange={v => update("hasSpecificMaterials", v)} />
                    <ToggleRow label="hasWallRepairMention" checked={signals.hasWallRepairMention} onChange={v => update("hasWallRepairMention", v)} />
                    <ToggleRow label="hasFinishDetail" checked={signals.hasFinishDetail} onChange={v => update("hasFinishDetail", v)} />
                    <ToggleRow label="hasCleanupMention" checked={signals.hasCleanupMention} onChange={v => update("hasCleanupMention", v)} />
                    <ToggleRow label="hasBrandClarity" checked={signals.hasBrandClarity} onChange={v => update("hasBrandClarity", v)} />
                    <ToggleRow label="hasDetailedScope" checked={signals.hasDetailedScope} onChange={v => update("hasDetailedScope", v)} />
                    <ToggleRow label="hasSubjectToChange" checked={signals.hasSubjectToChange} onChange={v => update("hasSubjectToChange", v)} danger />
                    <ToggleRow label="hasRepairsExcluded" checked={signals.hasRepairsExcluded} onChange={v => update("hasRepairsExcluded", v)} danger />
                    <ToggleRow label="hasStandardInstallation" checked={signals.hasStandardInstallation} onChange={v => update("hasStandardInstallation", v)} danger />
                  </CardContent>
                </Card>

                {/* Fine Print */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Fine Print</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Deposit % (null = not stated)</Label>
                      <Input type="number" value={signals.depositPercentage ?? ""} onChange={e => update("depositPercentage", e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <ToggleRow label="hasFinalPaymentTrap" checked={signals.hasFinalPaymentTrap} onChange={v => update("hasFinalPaymentTrap", v)} danger />
                    <ToggleRow label="hasSafePaymentTerms" checked={signals.hasSafePaymentTerms} onChange={v => update("hasSafePaymentTerms", v)} />
                    <ToggleRow label="hasPaymentBeforeCompletion" checked={signals.hasPaymentBeforeCompletion} onChange={v => update("hasPaymentBeforeCompletion", v)} danger />
                    <ToggleRow label="hasContractTraps" checked={signals.hasContractTraps} onChange={v => update("hasContractTraps", v)} danger />
                    <ToggleRow label="hasManagerDiscount" checked={signals.hasManagerDiscount} onChange={v => update("hasManagerDiscount", v)} danger />
                    <ToggleRow label="hasPremiumIndicators" checked={signals.hasPremiumIndicators} onChange={v => update("hasPremiumIndicators", v)} />
                  </CardContent>
                </Card>

                {/* Warranty */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Award className="h-4 w-4" />Warranty</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <ToggleRow label="hasWarrantyMention" checked={signals.hasWarrantyMention} onChange={v => update("hasWarrantyMention", v)} />
                    <ToggleRow label="hasLaborWarranty" checked={signals.hasLaborWarranty} onChange={v => update("hasLaborWarranty", v)} />
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Warranty Years</Label>
                      <Input type="number" value={signals.warrantyDurationYears ?? ""} onChange={e => update("warrantyDurationYears", e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <ToggleRow label="hasLifetimeWarranty" checked={signals.hasLifetimeWarranty} onChange={v => update("hasLifetimeWarranty", v)} />
                    <ToggleRow label="hasTransferableWarranty" checked={signals.hasTransferableWarranty} onChange={v => update("hasTransferableWarranty", v)} />
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>

          {/* CENTER COL: Results + X-Ray */}
          <div className="lg:col-span-5 space-y-4">
            {/* Grade Hero */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className={`text-6xl font-black ${gradeColor(scored.finalGrade)}`}>{scored.finalGrade}</div>
                    <div className="text-sm text-muted-foreground mt-1">Overall: {scored.overallScore}/100</div>
                    {scoreDelta !== 0 && (
                      <div className={`text-xs mt-1 font-mono ${scoreDelta > 0 ? "text-green-400" : "text-red-400"}`}>
                        {scoreDelta > 0 ? "+" : ""}{scoreDelta} vs default weights
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    {riskBadge(preview.riskLevel)}
                    <div className="text-sm text-muted-foreground">{scored.pricePerOpening}/opening</div>
                    {scored.hardCap.applied && (
                      <Badge variant="destructive" className="text-xs">
                        CAPPED @ {scored.hardCap.ceiling} — {scored.hardCap.statute || "No statute"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pillar Scores */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pillar Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <PillarBar label="Safety" score={scored.safetyScore} icon={<Shield className="h-3 w-3" />} weightPct={Math.round(weights.safety * 100)} />
                <PillarBar label="Scope" score={scored.scopeScore} icon={<FileText className="h-3 w-3" />} weightPct={Math.round(weights.scope * 100)} />
                <PillarBar label="Price" score={scored.priceScore} icon={<DollarSign className="h-3 w-3" />} weightPct={Math.round(weights.price * 100)} />
                <PillarBar label="Fine Print" score={scored.finePrintScore} icon={<AlertTriangle className="h-3 w-3" />} weightPct={Math.round(weights.finePrint * 100)} />
                <PillarBar label="Warranty" score={scored.warrantyScore} icon={<Award className="h-3 w-3" />} weightPct={Math.round(weights.warranty * 100)} />
              </CardContent>
            </Card>

            {/* Math X-Ray Panel */}
            <Accordion type="single" collapsible>
              <AccordionItem value="xray">
                <AccordionTrigger className="text-sm font-semibold">
                  <span className="flex items-center gap-1.5"><Eye className="h-4 w-4 text-primary" /> Math X-Ray</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <p className="text-muted-foreground font-sans text-xs font-semibold mb-2">Step 1: Weighted Pillar Sum</p>
                      {xray.pillars.map(p => (
                        <div key={p.name} className="flex justify-between">
                          <span>{p.name}: {p.score} × {(p.weight * 100).toFixed(0)}%</span>
                          <span className="text-primary">= {p.points.toFixed(1)} pts</span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Raw Total (rounded)</span>
                        <span>{xray.rawTotal}</span>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <p className="text-muted-foreground font-sans text-xs font-semibold mb-2">Step 2: Exponential Curve</p>
                      {xray.rawTotal <= 70 ? (
                        <p className="text-foreground">Score ≤ 70 → no curve applied → <span className="text-primary font-bold">{xray.curved}</span></p>
                      ) : (
                        <>
                          <p className="text-foreground">excess = {xray.rawTotal} - 70 = {xray.rawTotal - 70}</p>
                          <p className="text-foreground">curved = 70 + (30 × ({xray.rawTotal - 70}/30)^1.8)</p>
                          <p className="text-foreground">curved = <span className="text-primary font-bold">{xray.curved}</span></p>
                        </>
                      )}
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <p className="text-muted-foreground font-sans text-xs font-semibold mb-2">Step 3: Hard Cap</p>
                      {scored.hardCap.applied ? (
                        <>
                          <p className="text-red-400">Cap applied: ceiling = {scored.hardCap.ceiling}</p>
                          <p className="text-foreground">min({xray.curved}, {scored.hardCap.ceiling}) = <span className="text-red-400 font-bold">{xray.capped}</span></p>
                          <p className="text-red-400/70">{scored.hardCap.reason} {scored.hardCap.statute && `(${scored.hardCap.statute})`}</p>
                        </>
                      ) : (
                        <p className="text-green-400">No cap → final = <span className="font-bold">{xray.capped}</span></p>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Warnings + Missing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-red-400">⚠️ Warnings ({scored.warnings.length})</CardTitle></CardHeader>
                <CardContent>
                  {scored.warnings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None</p>
                  ) : (
                    <ul className="space-y-1">
                      {scored.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-red-300 leading-tight">• {w}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-400">📋 Missing ({scored.missingItems.length})</CardTitle></CardHeader>
                <CardContent>
                  {scored.missingItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None</p>
                  ) : (
                    <ul className="space-y-1">
                      {scored.missingItems.map((m, i) => (
                        <li key={i} className="text-xs text-yellow-300 leading-tight">• {m}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-foreground">{scored.summary}</p></CardContent>
            </Card>

            {/* Forensic */}
            <Accordion type="single" collapsible>
              <AccordionItem value="forensic">
                <AccordionTrigger className="text-sm font-semibold">Forensic Summary</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{forensic.headline}</p>
                    {forensic.statuteCitations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Statute Citations:</p>
                        {forensic.statuteCitations.map((c, i) => <p key={i} className="text-xs text-red-300">• {c}</p>)}
                      </div>
                    )}
                    {forensic.questionsToAsk.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Questions to Ask:</p>
                        {forensic.questionsToAsk.map((q, i) => <p key={i} className="text-xs text-foreground">• {q}</p>)}
                      </div>
                    )}
                    {forensic.positiveFindings.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Positive:</p>
                        {forensic.positiveFindings.map((p, i) => <p key={i} className="text-xs text-green-400">✓ {p}</p>)}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="identity">
                <AccordionTrigger className="text-sm font-semibold">Extracted Identity</AccordionTrigger>
                <AccordionContent>
                  <div className="text-xs space-y-1 font-mono">
                    <p>Contractor: {identity.contractorName ?? "—"}</p>
                    <p>License: {identity.licenseNumber ?? "—"}</p>
                    <p>NOA #s: {identity.noaNumbers.length > 0 ? identity.noaNumbers.join(", ") : "—"}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="hardcap">
                <AccordionTrigger className="text-sm font-semibold">Hard Cap Details</AccordionTrigger>
                <AccordionContent>
                  <div className="text-xs space-y-1 font-mono">
                    <p>Applied: {scored.hardCap.applied ? "YES" : "No"}</p>
                    <p>Ceiling: {scored.hardCap.ceiling}</p>
                    <p>Reason: {scored.hardCap.reason ?? "—"}</p>
                    <p>Statute: {scored.hardCap.statute ?? "—"}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* RIGHT COL: Weights + JSON Import + Export */}
          <div className="lg:col-span-4 space-y-4">
            {/* Weight Sliders */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Beaker className="h-4 w-4 text-primary" /> Pillar Weights
                  </CardTitle>
                  <Badge variant={weightSum === 100 ? "outline" : "destructive"} className="font-mono text-xs">
                    Σ = {weightSum}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <WeightSlider label="Safety" value={weights.safety} onChange={v => updateWeight("safety", v)} icon={<Shield className="h-3 w-3" />} />
                <WeightSlider label="Scope" value={weights.scope} onChange={v => updateWeight("scope", v)} icon={<FileText className="h-3 w-3" />} />
                <WeightSlider label="Price" value={weights.price} onChange={v => updateWeight("price", v)} icon={<DollarSign className="h-3 w-3" />} />
                <WeightSlider label="Fine Print" value={weights.finePrint} onChange={v => updateWeight("finePrint", v)} icon={<AlertTriangle className="h-3 w-3" />} />
                <WeightSlider label="Warranty" value={weights.warranty} onChange={v => updateWeight("warranty", v)} icon={<Award className="h-3 w-3" />} />
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}>
                    <RotateCcw className="h-3 w-3 mr-1" />Reset Weights
                  </Button>
                  <Button variant="default" size="sm" className="flex-1" onClick={exportSettings}>
                    <Code className="h-3 w-3 mr-1" />Export Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* JSON Importer */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-primary" /> Import AI JSON
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Paste a raw ExtractionSignals JSON from a failed scan or database record. Toggles update instantly.
                </p>
                <Textarea
                  placeholder='{"isValidQuote": true, "totalPriceFound": true, ...}'
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  className="font-mono text-xs h-40"
                />
                <Button variant="default" size="sm" className="w-full" onClick={importJson} disabled={!jsonInput.trim()}>
                  <Upload className="h-3 w-3 mr-1" />Import & Score
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
