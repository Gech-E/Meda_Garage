import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Loading, PageTitle, Panel, Pill, decisionTone, fmtDate } from "@/components/pm/ui";
import { cn } from "@/lib/utils";
import { commit, useAppState } from "@/lib/pm/store";
import { recordReview, startReview } from "@/lib/pm/logic";
import { DECISION_LABEL, STATUS_LABEL, type PartRequest, type ReviewDecision } from "@/lib/pm/types";

export const Route = createFileRoute("/specialist")({
  head: () => ({
    meta: [
      { title: "Specialist workspace — PartMatch demo" },
      { name: "description", content: "Demo workspace for manual compatibility review." },
      { property: "og:title", content: "Specialist workspace — PartMatch demo" },
      { property: "og:description", content: "Demo workspace for manual compatibility review." },
    ],
  }),
  component: Specialist,
});

const FILTERS = [
  { k: "open", label: "To review" },
  { k: "approved", label: "Approved" },
  { k: "flagged", label: "Info / mismatch" },
  { k: "all", label: "All" },
] as const;
type F = (typeof FILTERS)[number]["k"];

function matches(r: PartRequest, f: F) {
  if (f === "all") return true;
  if (f === "approved") return r.decision === "approved";
  if (f === "flagged") return r.decision === "needs_info" || r.decision === "mismatch";
  return r.decision === "pending" || r.decision === "needs_info";
}

function Specialist() {
  const state = useAppState();
  const [filter, setFilter] = useState<F>("open");
  const [sel, setSel] = useState<string>();
  if (!state) return <Loading />;
  const list = state.requests.filter((r) => matches(r, filter));
  const current = state.requests.find((r) => r.id === sel) ?? list[0];

  return (
    <div>
      <PageTitle eyebrow="Pilot workspace" title="Specialist review">
        Check fitment manually. Notes are required for every decision. Safety-critical parts are excluded.
      </PageTitle>
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.k} role="tab" aria-selected={filter === f.k} onClick={() => { setFilter(f.k); setSel(undefined); }}
            className={cn("min-h-11 rounded-full border px-4 py-2 text-sm", filter === f.k ? "border-primary bg-primary-soft text-accent-foreground font-medium" : "border-border hover:border-primary/50")}>
            {f.label} <span className="text-muted-foreground">({state.requests.filter((r) => matches(r, f.k)).length})</span>
          </button>
        ))}
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-6">
        <ul className="grid min-w-0 max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:block lg:max-h-none lg:space-y-2 lg:overflow-visible">
          {list.length === 0 && <Empty title="Nothing here">No requests match this filter.</Empty>}
          {list.map((r) => (
            <li key={r.id}>
              <button onClick={() => setSel(r.id)}
                className={cn("w-full rounded-xl border bg-card p-4 text-left transition-colors", current?.id === r.id ? "border-primary" : "border-border hover:border-primary/40")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 break-words font-medium">{r.part.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{r.vehicle.brand} {r.vehicle.model} {r.vehicle.year}</p>
                <div className="mt-2"><Pill tone={decisionTone(r.decision)}>{DECISION_LABEL[r.decision]}</Pill></div>
              </button>
            </li>
          ))}
        </ul>
        {current ? <ReviewPanel key={current.id} r={current} /> : <Empty title="Select a request" />}
      </div>
    </div>
  );
}

function ReviewPanel({ r }: { r: PartRequest }) {
  const [decision, setDecision] = useState<Exclude<ReviewDecision, "pending">>("approved");
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState("");
  const reviewable = r.status === "received" || r.status === "compatibility_review";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      commit((s) => recordReview(s, r.id, { decision, notes: notes.slice(0, 1000), evidence: evidence.slice(0, 500) }));
      toast.success(decision === "approved" ? "Approved. Sent to suppliers." : "Decision saved.");
      setNotes(""); setEvidence(""); setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Panel className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 break-words text-lg font-semibold sm:text-xl">{r.part.name}</h2>
          <Pill tone="accent">{STATUS_LABEL[r.status]}</Pill>
        </div>
        <p className="text-sm text-muted-foreground">{r.id} · submitted {fmtDate(r.createdAt)}</p>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Vehicle</dt><dd className="font-medium">{r.vehicle.brand} {r.vehicle.model} {r.vehicle.year}</dd></div>
        <div><dt className="text-muted-foreground">Engine / trim</dt><dd>{r.vehicle.engine || "—"}</dd></div>
        <div><dt className="text-muted-foreground">Part number</dt><dd>{r.part.partNumber || "—"}</dd></div>
        <div><dt className="text-muted-foreground">Pickup</dt><dd>{r.neighborhood}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted-foreground">Description</dt><dd>{r.part.description || "—"}</dd></div>
      </dl>
      {r.part.photo && <img src={r.part.photo} alt="Customer photo of part" className="h-40 w-40 rounded-xl border border-border object-cover" />}

      {r.reviewNotes.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">Verification notes</h3>
          <ul className="space-y-2">
            {r.reviewNotes.map((n, i) => (
              <li key={i} className="rounded-xl bg-secondary p-3 text-sm">
                <Pill tone={decisionTone(n.decision)}>{DECISION_LABEL[n.decision]}</Pill>
                <p className="mt-2">{n.text}</p>
                {n.evidence && <p className="text-muted-foreground">Evidence: {n.evidence}</p>}
                <p className="text-xs text-muted-foreground">Manual review · {fmtDate(n.at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.decision === "mismatch" ? (
        <p className="text-sm text-muted-foreground">Closed as mismatch. You can still add a corrected decision below if new info arrives.</p>
      ) : null}

      {reviewable ? (
        <form onSubmit={submit} className="space-y-4 border-t border-border pt-6" noValidate>
          {r.status === "received" && (
            <Button type="button" variant="outline" size="sm" onClick={() => { commit((s) => startReview(s, r.id)); toast.success("Review started"); }}>
              Mark as in review
            </Button>
          )}
          <fieldset>
            <legend className="mb-2 font-medium">Decision</legend>
            <div className="flex flex-wrap gap-2">
              {(["approved", "needs_info", "mismatch"] as const).map((d) => (
                <button key={d} type="button" aria-pressed={decision === d} onClick={() => setDecision(d)}
                  className={cn("min-h-11 rounded-full border px-4 py-2 text-sm", decision === d ? "border-primary bg-primary-soft text-accent-foreground font-medium" : "border-border hover:border-primary/50")}>
                  {d === "approved" ? "Approve fitment" : d === "needs_info" ? "More info needed" : "Mismatch"}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <Label htmlFor="vnotes" className="mb-2 block">Verification notes *</Label>
            <Textarea id="vnotes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you check?" />
          </div>
          <div>
            <Label htmlFor="evidence" className="mb-2 block">Compatibility evidence {decision === "approved" ? "*" : "(optional)"}</Label>
            <Textarea id="evidence" maxLength={500} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="e.g. catalogue reference, part number cross-check, photo comparison" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="min-h-11 w-full sm:w-auto">Save decision</Button>
        </form>
      ) : (
        <p className="border-t border-border pt-6 text-sm text-muted-foreground">Review complete. Stock and price are confirmed separately in the supplier workspace.</p>
      )}
    </Panel>
  );
}