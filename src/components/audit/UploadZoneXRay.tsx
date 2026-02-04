import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, Upload, CheckCircle2, AlertTriangle, Eye, FileText, Lock } from "lucide-react";
import type { DeterministicPhase, AuditAnalysisResult, ExplainScoreFormData } from "@/types/audit";
import { AnalyzingState, PartialResultsPanel, ExplainScoreGate, FullResultsPanel } from "./scanner-modal";
import { XRayScannerBackground } from "@/components/ui/XRayScannerBackground";

const XRAY_CALLOUTS = [
  {
    id: 1,
    title: "Price Warning:",
    text: "Price per opening is high for your area market.",
    color: "bg-amber-500",
    textColor: "text-amber-900",
    position: {
      top: "15%",
      right: "-10%",
    },
    delay: 0,
  },
  {
    id: 2,
    title: "Missing Scope:",
    text: "No clear mention of stucco repair or debris removal found.",
    color: "bg-red-500",
    textColor: "text-red-900",
    position: {
      top: "45%",
      left: "-15%",
    },
    delay: 0.5,
  },
  {
    id: 3,
    title: "Legal Alert:",
    text: '"Subject to remeasure" clause found in fine print.',
    color: "bg-orange-500",
    textColor: "text-orange-900",
    position: {
      bottom: "15%",
      right: "-5%",
    },
    delay: 1,
  },
];
const SCORE_CATEGORIES = [
  {
    label: "Safety & Code Match",
    score: 78,
    color: "bg-emerald-500",
  },
  {
    label: "Install & Scope Clarity",
    score: 42,
    color: "bg-amber-500",
  },
  {
    label: "Price Fairness",
    score: 39,
    color: "bg-red-500",
  },
  {
    label: "Fine Print & Transparency",
    score: 55,
    color: "bg-amber-500",
  },
  {
    label: "Warranty Value",
    score: 71,
    color: "bg-emerald-500",
  },
];
interface UploadZoneXRayProps {
  onFileSelect?: (file: File) => void;
  isAnalyzing?: boolean;
  // Scanner state props for in-page analysis
  scannerPhase?: DeterministicPhase;
  scannerResult?: AuditAnalysisResult | null;
  scannerError?: string | null;
  isLoading?: boolean;
  onShowGate?: () => void;
  onCaptureLead?: (data: ExplainScoreFormData) => Promise<void>;
  onReset?: () => void;
}
export function UploadZoneXRay({
  onFileSelect,
  isAnalyzing,
  scannerPhase = "idle",
  scannerResult = null,
  scannerError = null,
  isLoading = false,
  onShowGate,
  onCaptureLead,
  onReset,
}: UploadZoneXRayProps) {
  const [visibleCallouts, setVisibleCallouts] = useState<number[]>([]);
  const [isHoveringPreview, setIsHoveringPreview] = useState(false);
  useEffect(() => {
    // Only animate callouts when in idle phase
    if (scannerPhase !== "idle") return;
    const timers = XRAY_CALLOUTS.map((callout, index) => {
      return setTimeout(
        () => {
          setVisibleCallouts((prev) => [...prev, callout.id]);
        },
        800 + index * 600,
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [scannerPhase]);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && onFileSelect) onFileSelect(file);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
  };

  // Render the right panel based on scanner phase
  const renderRightPanel = () => {
    switch (scannerPhase) {
      case "analyzing":
        return (
          <Card className="relative bg-slate-900/80 border-slate-700/50 p-6 min-h-[500px] overflow-hidden flex items-center justify-center">
            <AnalyzingState />
          </Card>
        );
      case "partial":
        return (
          <Card className="relative bg-slate-900/80 border-slate-700/50 p-6 min-h-[500px] overflow-hidden">
            {scannerResult && <PartialResultsPanel result={scannerResult} onUnlockClick={onShowGate || (() => {})} />}
          </Card>
        );
      case "gated":
        return (
          <Card className="relative bg-slate-900/80 border-slate-700/50 p-6 min-h-[500px] overflow-hidden">
            <ExplainScoreGate onSubmit={onCaptureLead || (async () => {})} isLoading={isLoading} />
          </Card>
        );
      case "unlocked":
        return (
          <Card className="relative bg-slate-900/80 border-slate-700/50 p-6 min-h-[500px] overflow-auto">
            {scannerResult && <FullResultsPanel result={scannerResult} />}
          </Card>
        );

      // idle phase - show blurred preview
      default:
        return (
          <Card
            className="relative bg-slate-900/80 border-slate-700/50 p-6 min-h-[500px] overflow-hidden"
            onMouseEnter={() => setIsHoveringPreview(true)}
            onMouseLeave={() => setIsHoveringPreview(false)}
          >
            <div className={cn("transition-all duration-300", isHoveringPreview ? "blur-[6px]" : "blur-[8px]")}>
              <div className="mb-6 text-lg text-slate-400">
                <p className="text-xs text-primary uppercase tracking-wider mb-1">Overall Assessment</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Quote Safety Score</h3>
                  <div className="w-16 h-16 rounded-xl bg-orange-500/20 border-2 border-orange-500/50 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-orange-400">62</span>
                    <span className="text-[10px] text-orange-400/70 uppercase">out of 100</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {SCORE_CATEGORIES.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={cn(
                            "w-4 h-4",
                            category.score >= 70
                              ? "text-emerald-400"
                              : category.score >= 50
                                ? "text-orange-400"
                                : "text-red-400",
                          )}
                        />
                        <span className="text-sm text-primary">{category.label}</span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          category.score >= 70
                            ? "text-emerald-400"
                            : category.score >= 50
                              ? "text-orange-400"
                              : "text-red-400",
                        )}
                      >
                        {category.score}/100
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", category.color)}
                        style={{
                          width: `${category.score}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lock Overlay */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300",
                isHoveringPreview ? "opacity-100" : "opacity-90",
              )}
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-full bg-slate-800/80 border-2 border-primary/30 flex items-center justify-center mb-4 transition-transform duration-300",
                  isHoveringPreview && "scale-110",
                )}
              >
                <Eye className="w-10 h-10 text-primary" />
              </div>
              <p className="text-white font-semibold text-lg">See Your Gradecard</p>
              <p className="text-slate-400 text-sm mb-6">Upload your quote to reveal your score</p>
              <Button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-orange-500/25">
                <Upload className="w-5 h-5 mr-2" />
                Upload Quote for Free Gradecard
              </Button>
              <p className="text-xs mt-3 flex items-center gap-1 text-primary-foreground">
                <Lock className="w-3 h-3" />
                Instant analysis via Gemini 3 OCR Flash
              </p>
            </div>
          </Card>
        );
    }
  };
  return (
    <XRayScannerBackground
      className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      padding="py-16 md:py-24"
    >
      <div className="absolute inset-0 opacity-20 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="container relative px-4 mx-auto max-w-7xl z-10">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Analysis
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            Unmask the Truth Hiding in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
              Your Quote
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Stop guessing. Our AI-assisted quote scanner reads the fine print, flags hidden risks, and shows you where
            you're overpaying — before you sign.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-slate-400">
            <FileText className="w-5 h-5 text-slate-500" />
            <span className="text-sm uppercase tracking-wider text-destructive font-semibold">
              Before: A Confusing Estimate
            </span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">After: Your AI Gradecard</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* LEFT: Quote with Callouts / Upload Zone */}
          <div className="relative">
            <Card
              className="relative bg-slate-900/80 border-slate-700/50 p-6 min-h-[500px] overflow-visible cursor-pointer group"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* AI Scanner Background */}
              <div
                className="absolute inset-0 rounded-lg overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%)",
                  opacity: 0.8,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent rounded-lg" />
              <div className="absolute inset-0 bg-cyan-500/5 rounded-lg mix-blend-overlay" />

              {/* Callouts - only show in idle phase */}
              {scannerPhase === "idle" &&
                XRAY_CALLOUTS.map((callout) => (
                  <div
                    key={callout.id}
                    className={cn(
                      "absolute z-20 transform transition-all duration-500",
                      visibleCallouts.includes(callout.id)
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-75 translate-y-4",
                    )}
                    style={{
                      ...callout.position,
                      transitionDelay: `${callout.delay}s`,
                    }}
                  >
                    <div
                      className={cn(
                        "relative p-3 rounded-lg shadow-xl max-w-[200px] transform -rotate-2 hover:rotate-0 transition-transform",
                        callout.color,
                      )}
                    >
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-black/10 rounded-bl-lg" />
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-black" />
                        <div>
                          <p className="font-bold text-sm text-black">{callout.title}</p>
                          <p className="text-xs mt-1 leading-tight text-slate-900">
                            {callout.text}
                          </p>
                        </div>
                      </div>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-amber-200/60 rounded-sm transform rotate-2" />
                    </div>
                  </div>
                ))}

              {/* Upload Overlay */}
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-10 bg-slate-900/60 hover:bg-slate-900/80 transition-colors rounded-lg">
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileInput} />
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-cyan-500/50">
                  <Upload className="w-8 h-8 text-cyan-400" />
                </div>
                <p className="font-semibold text-primary-foreground">Drop your quote here</p>
                <p className="text-sm text-primary-foreground">PDF, JPEG, PNG up to 10mb</p>
              </label>
            </Card>
            <p className="mt-4 italic text-lg text-[#f0f0f0]">
              Contractors often hand you numbers, jargon, and tiny fine print. You're expected to just trust it.
            </p>
          </div>

          {/* RIGHT: Phase-based Results Panel */}
          <div className="relative">{renderRightPanel()}</div>
        </div>

        {/* Error display */}
        {scannerError && (
          <div className="mt-6 max-w-6xl mx-auto">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
              <p className="text-destructive font-medium">{scannerError}</p>
              {onReset && (
                <Button variant="outline" className="mt-2" onClick={onReset}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </XRayScannerBackground>
  );
}
