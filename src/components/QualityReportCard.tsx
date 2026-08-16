import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, ShieldCheck, Circle as XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { QualityReport } from "@/lib/project-types";

type Props = {
  report: QualityReport | null;
};

export function QualityReportCard({ report }: Props) {
  if (!report) return null;

  const scoreColor =
    report.score >= 80
      ? "text-primary"
      : report.score >= 50
        ? "text-yellow-500"
        : "text-destructive";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI Quality Check</span>
        </div>
        <span className={cn("text-2xl font-bold", scoreColor)}>{report.score}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {report.checks.map((check, i) => (
          <div key={i} className="flex items-start gap-2">
            {check.status === "pass" ? (
              <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-primary" />
            ) : check.status === "warn" ? (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-yellow-500" />
            ) : (
              <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
            )}
            <div className="flex flex-col">
              <span className="text-xs text-foreground">{check.label}</span>
              <span className="text-[11px] text-muted-foreground">{check.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
