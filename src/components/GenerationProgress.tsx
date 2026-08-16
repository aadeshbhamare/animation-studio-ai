import { Check, Loader as Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type PipelineStep = {
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
};

type Props = {
  steps: PipelineStep[];
  visible: boolean;
};

export function GenerationProgress({ steps, visible }: Props) {
  if (!visible) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">Directing your animation</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="flex w-4 items-center justify-center">
              {step.status === "done" ? (
                <Check className="size-3.5 text-primary" />
              ) : step.status === "active" ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <span className="size-2 rounded-full border border-border" />
              )}
            </div>
            <span
              className={cn(
                "text-xs",
                step.status === "done"
                  ? "text-muted-foreground line-through"
                  : step.status === "active"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/50",
              )}
            >
              {step.label}
            </span>
            {step.detail && step.status === "active" ? (
              <span className="text-[11px] text-muted-foreground">{step.detail}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
