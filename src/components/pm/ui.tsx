import { cva, type VariantProps } from "class-variance-authority";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUSES, STATUS_LABEL, type PartRequest, type ReviewDecision } from "@/lib/pm/types";

const pill = cva("inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium break-words sm:whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-secondary text-muted-foreground border border-border",
      accent: "bg-primary-soft text-accent-foreground",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      danger: "bg-destructive/10 text-destructive",
      sample: "border border-dashed border-warning/60 bg-warning-soft text-warning",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Pill({ tone, className, children }: VariantProps<typeof pill> & { className?: string; children: ReactNode }) {
  return <span className={cn(pill({ tone }), className)}>{children}</span>;
}

export function SamplePill() {
  return <Pill tone="sample">Sample data</Pill>;
}

export function decisionTone(d: ReviewDecision) {
  return d === "approved" ? "success" : d === "mismatch" ? "danger" : d === "needs_info" ? "warning" : "neutral";
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7", className)}>{children}</section>;
}

export function PageTitle({ eyebrow, title, children, back }: { eyebrow?: string; title: string; children?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <div className="mb-6 min-w-0 sm:mb-8">
      {back && (
        <Link to={back.to} className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> {back.label}
        </Link>
      )}
      {eyebrow && <p className="mb-2 text-sm font-medium text-primary">{eyebrow}</p>}
      <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl break-words text-base text-muted-foreground sm:text-lg">{children}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 py-16 text-muted-foreground" role="status">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function StatusTrack({ request }: { request: PartRequest }) {
  const idx = STATUSES.indexOf(request.status);
  return (
    <ol className="space-y-0" aria-label="Request progress">
      {STATUSES.map((s, i) => {
        const done = i < idx || (i === idx && s === "outcome_recorded");
        const current = i === idx && !done;
        return (
          <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
            {i < STATUSES.length - 1 && (
              <span className={cn("absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px", i < idx ? "bg-primary" : "bg-border")} aria-hidden />
            )}
            <span
              className={cn(
                "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-primary bg-primary text-primary-foreground",
                current && "border-primary bg-primary-soft text-primary",
                !done && !current && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <div className="pt-0.5">
              <p className={cn("font-medium", !done && !current && "text-muted-foreground")}>
                {STATUS_LABEL[s]} {current && <span className="sr-only">(current)</span>}
              </p>
              {current && s === "compatibility_review" && request.decision === "needs_info" && (
                <p className="text-sm text-warning">Specialist needs more information.</p>
              )}
              {current && s === "compatibility_review" && request.decision === "mismatch" && (
                <p className="text-sm text-destructive">Specialist found a mismatch. Request closed.</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}