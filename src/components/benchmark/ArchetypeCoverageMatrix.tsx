import React from "react";
import { CheckCircle2, CircleDashed, AlertTriangle, ShieldCheck } from "lucide-react";
import { CORPUS_COVERAGE } from "@/data/corpusCoverage";
import { cn } from "@/lib/utils";

type CoverageStatus = "complete" | "partial" | "missing";

interface ArchetypeRow {
  archetype: string;
  required: boolean;
  count: number;
  coveredBy: string[];
  status: CoverageStatus;
}

/** Complete = required coverage met (>= 2 docs), partial = exactly 1, missing = 0. */
function statusFor(count: number): CoverageStatus {
  if (count >= 2) return "complete";
  if (count === 1) return "partial";
  return "missing";
}

const STATUS_STYLES: Record<CoverageStatus, { chip: string; label: string; Icon: typeof CheckCircle2 }> = {
  complete: {
    chip: "bg-primary/10 text-primary border-primary/30",
    label: "Complete",
    Icon: CheckCircle2,
  },
  partial: {
    chip: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    label: "Partial",
    Icon: CircleDashed,
  },
  missing: {
    chip: "bg-destructive/10 text-destructive border-destructive/30",
    label: "Missing",
    Icon: AlertTriangle,
  },
};

function buildRows(): ArchetypeRow[] {
  const required = new Set<string>(CORPUS_COVERAGE.required_archetypes as readonly string[]);
  const coverage = CORPUS_COVERAGE.archetype_coverage as Record<
    string,
    { covered_by: readonly string[]; count: number }
  >;

  return Object.entries(coverage)
    .map(([archetype, v]) => ({
      archetype,
      required: required.has(archetype),
      count: v?.count ?? 0,
      coveredBy: [...(v?.covered_by ?? [])],
      status: statusFor(v?.count ?? 0),
    }))
    .sort((a, b) =>
      Number(b.required) - Number(a.required) || a.archetype.localeCompare(b.archetype)
    );
}

const ArchetypeCoverageMatrix = React.forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    const rows = React.useMemo(buildRows, []);
    const requiredRows = rows.filter((r) => r.required);
    const complete = requiredRows.filter((r) => r.status === "complete").length;
    const partial = requiredRows.filter((r) => r.status === "partial").length;
    const missing = requiredRows.filter((r) => r.status === "missing").length;
    const pct = requiredRows.length
      ? Math.round((complete / requiredRows.length) * 100)
      : 0;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-border/60 bg-card/40 backdrop-blur-md p-5",
          className
        )}
      >
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Golden Corpus Archetype Coverage
            </h2>
            <p className="text-sm text-muted-foreground">
              Corpus <span className="font-mono">{CORPUS_COVERAGE.corpus_version}</span> ·{" "}
              {CORPUS_COVERAGE.totals.documents} documents ·{" "}
              {requiredRows.length} required archetypes
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {pct}% required complete
          </div>
        </header>

        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Complete", value: complete, tone: "text-primary" },
            { label: "Partial", value: partial, tone: "text-amber-400" },
            { label: "Missing", value: missing, tone: "text-destructive" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border/50 bg-background/40 px-3 py-2"
            >
              <div className={cn("text-2xl font-bold tabular-nums", s.tone)}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <ul className="space-y-2" aria-label="Archetype coverage matrix">
          {rows.map((row) => {
            const { chip, label, Icon } = STATUS_STYLES[row.status];
            return (
              <li
                key={row.archetype}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm text-foreground">
                      {row.archetype}
                    </span>
                    {row.required && (
                      <span className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {row.coveredBy.length > 0
                      ? row.coveredBy.join(", ")
                      : "No documents assigned"}
                  </div>
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                    chip
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label} · {row.count}
                </span>
              </li>
            );
          })}
        </ul>

        {CORPUS_COVERAGE.readiness_blockers.length > 0 && (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="text-xs font-bold uppercase tracking-widest text-destructive">
              Readiness blockers
            </div>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {CORPUS_COVERAGE.readiness_blockers.map((b) => (
                <li key={b} className="font-mono">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

ArchetypeCoverageMatrix.displayName = "ArchetypeCoverageMatrix";

export default ArchetypeCoverageMatrix;
export { ArchetypeCoverageMatrix };
