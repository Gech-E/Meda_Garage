import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Empty, Loading, PageTitle, Panel, fmtDate } from "@/components/pm/ui";
import { resetDemo, useAppState } from "@/lib/pm/store";
import { computeMetrics, toCsv } from "@/lib/pm/logic";
import { ROLE_LABEL } from "@/lib/pm/types";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Interview results — PartMatch research" },
      { name: "description", content: "Aggregate interview activity, funnel and feedback export." },
      { property: "og:title", content: "Interview results — PartMatch research" },
      { property: "og:description", content: "Aggregate interview activity, funnel and feedback export." },
    ],
  }),
  component: Research,
});

function download(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Research() {
  const state = useAppState();
  if (!state) return <Loading />;
  const m = computeMetrics(state);
  const real = state.requests.filter((r) => !r.isSample);
  const funnel = [
    ["Requests submitted", m.requests],
    ["Fitment approved", m.approved],
    ["Received an offer", m.withOffers],
    ["Reserved", m.reservations],
    ["Outcome recorded", m.outcomes],
  ] as const;
  const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1));

  return (
    <div className="space-y-8">
      <PageTitle eyebrow="Interviewer" title="Interview results">
        Counts include only activity from interviews on this device. The {m.sampleRequests} sample requests are excluded.
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Requests", m.requests], ["Offers quoted", m.offers], ["Reservations", m.reservations], ["Feedback responses", m.feedback]].map(([k, v]) => (
          <Panel key={k as string} className="p-5">
            <p className="text-sm text-muted-foreground">{k}</p>
            <p className="mt-1 text-3xl font-semibold">{v}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-semibold">Funnel</h2>
          <ul className="space-y-3">
            {funnel.map(([k, v]) => {
              const pct = m.requests ? Math.round((v / m.requests) * 100) : 0;
              return (
                <li key={k}>
                  <div className="mb-1 flex justify-between text-sm"><span>{k}</span><span className="text-muted-foreground">{v} · {pct}%</span></div>
                  <div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">Fit rate: {m.outcomes ? `${m.fits} of ${m.outcomes} recorded outcomes` : "no outcomes yet"}</p>
        </Panel>
        <Panel>
          <h2 className="mb-4 font-semibold">Feedback averages (1–5)</h2>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[["Ease", m.avgEase], ["Confidence", m.avgConfidence], ["Would use", m.avgWouldUse]].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-secondary p-4"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="text-2xl font-semibold">{fmt(v as number | null)}</dd></div>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel>
        <h2 className="mb-4 font-semibold">Responses</h2>
        {state.feedback.length === 0 ? <Empty title="No feedback yet">Use “Give feedback” at the end of a session.</Empty> : (
          <ul className="divide-y divide-border text-sm">
            {[...state.feedback].reverse().map((f) => (
              <li key={f.id} className="py-3">
                <p className="font-medium">{ROLE_LABEL[f.role]} · ease {f.easeOfUse} · confidence {f.confidence} · would use {f.wouldUse} <span className="font-normal text-muted-foreground">· {fmtDate(f.createdAt)}</span></p>
                <p className="text-muted-foreground">Today: {f.currentMethod}</p>
                {f.confusing && <p>Confusing: {f.confusing}</p>}
                {f.comments && <p>Comments: {f.comments}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" disabled={!state.feedback.length} onClick={() => download("partmatch-feedback.csv", toCsv(state.feedback.map(({ consent: _c, ...f }) => f)))}>
          <Download /> Export feedback CSV
        </Button>
        <Button variant="outline" disabled={!real.length} onClick={() => download("partmatch-requests.csv", toCsv(real.map((r) => ({
          id: r.id, createdAt: r.createdAt, brand: r.vehicle.brand, model: r.vehicle.model, year: r.vehicle.year, part: r.part.name,
          neighborhood: r.neighborhood, status: r.status, decision: r.decision, offers: r.offers.length, reserved: !!r.reservedOfferId, outcome: r.outcome?.result ?? "",
        }))))}>
          <Download /> Export requests CSV
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" className="text-destructive"><RotateCcw /> Reset demo</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
              <AlertDialogDescription>This deletes every request and feedback response on this device and restores the sample data. Export first if you need it.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { resetDemo(); toast.success("Demo reset"); }}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}