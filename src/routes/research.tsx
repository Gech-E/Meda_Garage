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
      { title: "Interview results — Meda Garage PartMatch" },
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
  const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1));

  return (
    <div className="space-y-8">
      <PageTitle eyebrow="Interviewer" title="Interview results">
        Only activity entered on this device is included. Nothing is preloaded.
      </PageTitle>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {[["Requests", m.requests], ["Offers quoted", m.offers], ["Reservations", m.reservations], ["Feedback responses", m.feedback]].map(([k, v]) => (
          <Panel key={k as string} className="min-w-0 p-3 sm:p-5">
            <p className="break-words text-xs text-muted-foreground sm:text-sm">{k}</p>
            <p className="mt-1 text-2xl font-semibold sm:text-3xl">{v}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-semibold">Request progress</h2>
          <dl className="space-y-3 text-sm">
            {([["Submitted", m.requests], ["Reviewed and approved", m.approved], ["Received a confirmed offer", m.withConfirmedOffers], ["Outcome recorded", m.outcomes]] as const).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-0"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold tabular-nums">{count}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">Fit confirmed: {m.outcomes ? `${m.fits} of ${m.outcomes} recorded outcomes` : "No outcomes recorded yet"}</p>
        </Panel>
        <Panel>
          <h2 className="mb-4 font-semibold">Feedback averages (1–5)</h2>
          <dl className="grid grid-cols-3 gap-1.5 text-center sm:gap-3">
            {[["Ease", m.avgEase], ["Confidence", m.avgConfidence], ["Would use", m.avgWouldUse]].map(([k, v]) => (
              <div key={k as string} className="min-w-0 rounded-xl bg-secondary p-2 sm:p-4"><dt className="break-words text-[11px] leading-tight text-muted-foreground sm:text-sm">{k}</dt><dd className="text-xl font-semibold sm:text-2xl">{fmt(v as number | null)}</dd></div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-semibold">Sourcing pain points reported</h2>
          <ul className="space-y-2 text-sm">
            {m.painPoints.map(({key, count}) => (
              <li key={key} className="flex justify-between gap-3"><span>{key}</span><strong>{count}</strong></li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h2 className="mb-4 font-semibold">Willingness to try / pay</h2>
          <p className="mb-2 text-xs text-muted-foreground">Self-reported intent only; not actual customer payments.</p>
          <div className="space-y-2 text-sm">
            {m.wouldTry.map(({key, count}) => (
              <div key={key} className="flex justify-between"><span>Try: {key}</span><strong>{count}</strong></div>
            ))}
            <hr className="border-border" />
            {m.wouldPay.map(({key, count}) => (
              <div key={key} className="flex justify-between"><span>Pay: {key.replaceAll("_"," ")}</span><strong>{count}</strong></div>
            ))}
          </div>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button className="min-h-11 w-full sm:w-auto" variant="outline" disabled={!state.feedback.length} onClick={() => download("partmatch-feedback.csv", toCsv(state.feedback.map(({ consent: _c, ...f }) => f)))}>
          <Download /> Export feedback CSV
        </Button>
        <Button className="min-h-11 w-full sm:w-auto" variant="outline" disabled={!real.length} onClick={() => download("partmatch-requests.csv", toCsv(real.map((r) => ({
          id: r.id, createdAt: r.createdAt, brand: r.vehicle.brand, model: r.vehicle.model, year: r.vehicle.year, part: r.part.name,
          neighborhood: r.neighborhood, status: r.status, decision: r.decision, offers: r.offers.length, reserved: !!r.reservedOfferId, outcome: r.outcome?.result ?? "",
        }))))}>
          <Download /> Export requests CSV
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" className="min-h-11 w-full text-destructive sm:w-auto"><RotateCcw /> Clear pilot data</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all pilot data from this device?</AlertDialogTitle>
              <AlertDialogDescription>This permanently removes all requests and feedback stored in this browser. It does not add any sample data back. Export first if you need a copy.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { resetDemo(); toast.success("Pilot data cleared"); }}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}