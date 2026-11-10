import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, Loading, PageTitle, Panel, Pill } from "@/components/pm/ui";
import { cn } from "@/lib/utils";
import { commit, useAppState } from "@/lib/pm/store";
import { addOffer, formatEtb, setOfferAvailability } from "@/lib/pm/logic";
import { AVAILABILITY_LABEL, CONDITION_LABEL, NEIGHBORHOODS, STATUS_LABEL, type Availability, type Condition, type PartRequest } from "@/lib/pm/types";

export const Route = createFileRoute("/supplier")({
  head: () => ({
    meta: [
      { title: "Supplier workspace — Meda Garage demo" },
      { name: "description", content: "Demo workspace for suppliers to confirm stock and propose offers in ETB." },
      { property: "og:title", content: "Supplier workspace — Meda Garage demo" },
      { property: "og:description", content: "Demo workspace for suppliers to confirm stock and propose offers in ETB." },
    ],
  }),
  component: Supplier,
});

function Supplier() {
  const state = useAppState();
  const [sel, setSel] = useState<string>();
  if (!state) return <Loading />;
  const list = state.requests.filter((r) => r.decision === "approved");
  const current = list.find((r) => r.id === sel) ?? list[0];
  return (
    <div>
      <PageTitle eyebrow="Pilot workspace" title="Supplier offers">
        Only specialist-approved requests appear here. You confirm stock and price; fitment was checked separately.
      </PageTitle>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-6">
        <ul className="grid min-w-0 max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:block lg:max-h-none lg:space-y-2 lg:overflow-visible">
          {list.length === 0 && <Empty title="No approved requests">Approve one in the specialist workspace first.</Empty>}
          {list.map((r) => (
            <li key={r.id}>
              <button onClick={() => setSel(r.id)} className={cn("w-full rounded-xl border bg-card p-4 text-left", current?.id === r.id ? "border-primary" : "border-border hover:border-primary/40")}>
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="min-w-0 break-words font-medium">{r.part.name}</span></div>
                <p className="text-sm text-muted-foreground">{r.vehicle.brand} {r.vehicle.model} {r.vehicle.year} · {r.neighborhood}</p>
                <div className="mt-2 flex flex-wrap gap-2"><Pill tone="accent">{STATUS_LABEL[r.status]}</Pill><Pill>{r.offers.length} offers</Pill></div>
              </button>
            </li>
          ))}
        </ul>
        {current && <OfferPanel key={current.id} r={current} />}
      </div>
    </div>
  );
}

function OfferPanel({ r }: { r: PartRequest }) {
  const [supplier, setSupplier] = useState("");
  const [price, setPrice] = useState("");
  const [availability, setAvailability] = useState<Availability>("in_stock");
  const [hood, setHood] = useState(r.neighborhood);
  const [condition, setCondition] = useState<Condition>("new");
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const locked = r.status === "reserved" || r.status === "outcome_recorded";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      commit((s) => addOffer(s, r.id, { supplierLabel: supplier, priceEtb: Math.round(Number(price)), availability, neighborhood: hood, condition, notes: notes.slice(0, 400), evidence, availabilityConfirmed: confirmed }));
      toast.success("Offer sent to customer");
      setPrice(""); setNotes(""); setEvidence(""); setConfirmed(false); setError("");
    } catch (err) { setError((err as Error).message); }
  }

  return (
    <Panel className="space-y-6">
      <div>
        <h2 className="break-words text-lg font-semibold sm:text-xl">{r.part.name}</h2>
        <p className="text-sm text-muted-foreground">{r.vehicle.brand} {r.vehicle.model} {r.vehicle.year}{r.vehicle.engine && ` · ${r.vehicle.engine}`} · {r.id}</p>
        <p className="mt-2 text-sm">Specialist note: {r.reviewNotes.at(-1)?.text}</p>
      </div>

      {r.offers.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">Offers on this request</h3>
          <ul className="space-y-2">
            {r.offers.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary p-3 text-sm">
                <div>
                  <p className="font-medium">{o.supplierLabel} · {formatEtb(o.priceEtb)}</p>
                  <p className="text-muted-foreground">{CONDITION_LABEL[o.condition]} · {o.neighborhood}{r.reservedOfferId === o.id && " · Reserved by customer"}</p>
                </div>
                <label className="flex items-center gap-2">
                  <span className="sr-only">Availability for {o.supplierLabel}</span>
                  <select className="field min-h-11 w-full text-base sm:w-auto sm:text-sm" value={o.availability}
                    onChange={(e) => { commit((s) => setOfferAvailability(s, r.id, o.id, e.target.value as Availability)); toast.success("Availability updated"); }}>
                    {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((a) => <option key={a} value={a}>{AVAILABILITY_LABEL[a]}</option>)}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {locked ? (
        <p className="border-t border-border pt-6 text-sm text-muted-foreground">Customer has reserved an offer. New offers are closed.</p>
      ) : (
        <form onSubmit={submit} className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2" noValidate>
          <h3 className="font-medium sm:col-span-2">Propose an offer</h3>
          <div>
            <Label htmlFor="sup" className="mb-2 block">Shop name *</Label>
            <Input id="sup" className="h-12 text-base" required maxLength={80} autoComplete="organization" placeholder="Enter your shop name" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="price" className="mb-2 block">Price (ETB) *</Label>
            <Input id="price" inputMode="numeric" className="h-12 text-base" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 7))} placeholder="e.g. 950" />
          </div>
          <div>
            <Label htmlFor="avail" className="mb-2 block">Availability</Label>
            <select id="avail" className="field" value={availability} onChange={(e) => setAvailability(e.target.value as Availability)}>
              <option value="in_stock">In stock</option><option value="can_source">Can source</option>
            </select>
          </div>
          <div>
            <Label htmlFor="cond" className="mb-2 block">Condition</Label>
            <select id="cond" className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
              {(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => <option key={c} value={c}>{CONDITION_LABEL[c]}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="phood" className="mb-2 block">Pickup neighborhood</Label>
            <select id="phood" className="field" value={hood} onChange={(e) => setHood(e.target.value)}>{NEIGHBORHOODS.map((n) => <option key={n}>{n}</option>)}</select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="snotes" className="mb-2 block">Notes (optional)</Label>
            <Textarea id="snotes" maxLength={400} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Can source in 2 days" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="sevidence" className="mb-2 block">Part identification / reference *</Label>
            <Input id="sevidence" className="h-12 text-base" maxLength={200} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="e.g. label 87139-52010, shelf B2" />
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-secondary p-4 text-sm sm:col-span-2">
            <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
            <span>I checked this item is available / can be sourced as stated. (This is not an authenticity or OEM certification.)</span>
          </label>
          {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <Button type="submit" className="min-h-12 w-full sm:col-span-2">Send offer</Button>
        </form>
      )}
    </Panel>
  );
}