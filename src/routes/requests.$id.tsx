import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Info, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Empty, Loading, PageTitle, Panel, Pill, StatusTrack, decisionTone, fmtDate } from "@/components/pm/ui";
import { cn } from "@/lib/utils";
import { commit, useAppState } from "@/lib/pm/store";
import { formatEtb, recordOutcome, reserveOffer } from "@/lib/pm/logic";
import { AVAILABILITY_LABEL, CONDITION_LABEL, DECISION_LABEL, OUTCOME_LABEL, type FitOutcome } from "@/lib/pm/types";

export const Route = createFileRoute("/requests/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Request ${params.id} — PartMatch` },
      { name: "description", content: "Track status, compare offers and record whether the part fit." },
      { property: "og:title", content: `Request ${params.id} — PartMatch` },
      { property: "og:description", content: "Track status, compare offers and record whether the part fit." },
    ],
  }),
  component: Detail,
});

function act(fn: () => void, ok: string) {
  try { fn(); toast.success(ok); } catch (e) { toast.error((e as Error).message); }
}

function Detail() {
  const { id } = Route.useParams();
  const state = useAppState();
  const [outcome, setOutcome] = useState<FitOutcome | "">("");
  const [notes, setNotes] = useState("");
  if (!state) return <Loading />;
  const r = state.requests.find((x) => x.id === id);
  if (!r) return (
    <div className="max-w-xl">
      <PageTitle title="Request not found" back={{ to: "/requests", label: "My requests" }}>
        This request ID is not saved on this device.
      </PageTitle>
    </div>
  );
  const lastReview = r.reviewNotes.at(-1);
  const cheapest = r.offers.length ? Math.min(...r.offers.map((o) => o.priceEtb)) : 0;

  return (
    <div>
      <PageTitle eyebrow={`Request ${r.id}`} title={r.part.name} back={{ to: "/requests", label: "My requests" }}>
        <div className="flex flex-wrap items-center gap-2 text-base">
          {r.vehicle.brand} {r.vehicle.model} {r.vehicle.year}{r.vehicle.engine && ` · ${r.vehicle.engine}`}
        </div>
      </PageTitle>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-6">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <Panel>
            <h2 className="mb-4 font-semibold">Status</h2>
            <StatusTrack request={r} />
          </Panel>
          <Panel>
            <h2 className="mb-3 font-semibold">History</h2>
            <ul className="space-y-3 text-sm">
              {[...r.history].reverse().map((h, i) => (
                <li key={i}>
                  <p className="font-medium">{h.label} <span className="font-normal text-muted-foreground">· {fmtDate(h.at)}</span></p>
                  {h.note && <p className="text-muted-foreground">{h.note}</p>}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="min-w-0 space-y-5 sm:space-y-6">
          <p className="flex gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 text-primary" />
            A specialist reviews compatibility manually. Shop offers are entered by participants and are not live inventory feeds.
          </p>

          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Compatibility review</h2>
              <Pill tone={decisionTone(r.decision)}>{DECISION_LABEL[r.decision]}</Pill>
            </div>
            {lastReview ? (
              <div className="mt-3 space-y-1 text-sm">
                <p>{lastReview.text}</p>
                {lastReview.evidence && <p className="text-muted-foreground">Evidence: {lastReview.evidence}</p>}
                <p className="text-xs text-muted-foreground">Manual review · {fmtDate(lastReview.at)}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Waiting for the compatibility review.</p>
            )}
          </Panel>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Offers</h2>
            </div>
            {r.offers.length === 0 ? (
              <Empty title="No offers yet">
                {r.decision === "approved" ? "Suppliers are confirming stock." : "Offers appear after the specialist approves fitment."}
              </Empty>
            ) : (
              <div className="grid min-w-0 gap-3 md:grid-cols-2">
                {r.offers.map((o) => {
                  const reserved = r.reservedOfferId === o.id;
                  const canReserve = !r.reservedOfferId && o.availability !== "unavailable";
                  return (
                    <div key={o.id} className={cn("min-w-0 rounded-2xl border bg-card p-4 shadow-soft sm:p-5", reserved ? "border-primary" : "border-border")}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 break-words font-medium">{o.supplierLabel}</p>
                        {o.priceEtb === cheapest && r.offers.length > 1 && <Pill tone="accent">Lowest price</Pill>}
                      </div>
                      <p className="mt-2 text-2xl font-semibold">{formatEtb(o.priceEtb)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Pill tone={o.availability === "in_stock" ? "success" : o.availability === "can_source" ? "warning" : "danger"}>{AVAILABILITY_LABEL[o.availability]}</Pill>
                        <Pill>{CONDITION_LABEL[o.condition]}</Pill>
                      </div>
                      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> Pickup: {o.neighborhood}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Fitment: specialist-reviewed (manual)</p>
                      {o.notes && <p className="mt-2 text-sm">{o.notes}</p>}
                      {reserved ? (
                        <p className="mt-4 flex items-center gap-1.5 font-medium text-primary"><CheckCircle2 className="h-5 w-5" /> Offer selected (intent only)</p>
                      ) : canReserve ? (
                        <Button className="mt-4 min-h-11 w-full" onClick={() => act(() => commit((s) => reserveOffer(s, r.id, o.id)), "Offer selected. No booking or payment was made.")}>
                          Reserve this offer
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            {r.offers.length > 0 && !r.reservedOfferId && (
              <p className="mt-3 text-sm text-muted-foreground">Reserving shows your intent only. No payment or booking is made.</p>
            )}
          </section>

          {r.reservedOfferId && (
            <Panel>
              <h2 className="font-semibold">Did the part fit?</h2>
              {r.outcome ? (
                <div className="mt-2 text-sm">
                  <Pill tone={r.outcome.result === "fit" ? "success" : r.outcome.result === "did_not_fit" ? "danger" : "neutral"}>{OUTCOME_LABEL[r.outcome.result]}</Pill>
                  {r.outcome.notes && <p className="mt-2">{r.outcome.notes}</p>}
                </div>
              ) : (
                <form className="mt-3 space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  if (!outcome) return toast.error("Choose an answer.");
                  act(() => commit((s) => recordOutcome(s, r.id, outcome, notes.slice(0, 500))), "Thanks — outcome recorded.");
                }}>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Did the part fit?">
                    {(Object.keys(OUTCOME_LABEL) as FitOutcome[]).map((k) => (
                      <button key={k} type="button" role="radio" aria-checked={outcome === k} onClick={() => setOutcome(k)}
                        className={cn("min-h-11 rounded-full border px-4 py-2", outcome === k ? "border-primary bg-primary-soft text-accent-foreground" : "border-border hover:border-primary/50")}>
                        {OUTCOME_LABEL[k]}
                      </button>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="onotes" className="mb-2 block">Notes (optional)</Label>
                    <Textarea id="onotes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                  <Button type="submit" className="min-h-11 w-full sm:w-auto">Save outcome</Button>
                </form>
              )}
            </Panel>
          )}

          <Panel>
            <h2 className="mb-3 font-semibold">Your request</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Details</dt><dd className="break-words">{r.part.description || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Part number</dt><dd>{r.part.partNumber || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Pickup area</dt><dd>{r.neighborhood}</dd></div>
              <div><dt className="text-muted-foreground">Contact</dt><dd>{r.contact.anonymous ? "Anonymous" : "Provided (stored on this device)"}</dd></div>
            </dl>
            {r.part.photo && <img src={r.part.photo} alt="Part photo" className="mt-4 h-32 w-32 rounded-xl border border-border object-cover" />}
          </Panel>
          <Link to="/find" className="inline-block text-sm text-primary hover:underline">Start another request</Link>
        </div>
      </div>
    </div>
  );
}