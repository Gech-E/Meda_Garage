import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, Loading, PageTitle, Pill } from "@/components/pm/ui";
import { useAppState } from "@/lib/pm/store";
import { STATUS_LABEL } from "@/lib/pm/types";

export const Route = createFileRoute("/requests/")({
  head: () => ({
    meta: [
      { title: "My requests — Meda Garage" },
      { name: "description", content: "Track your part requests and offers." },
      { property: "og:title", content: "My requests — Meda Garage" },
      { property: "og:description", content: "Track your part requests and offers." },
    ],
  }),
  component: Requests,
});

function Requests() {
  const state = useAppState();
  if (!state) return <Loading />;
  const mine = state.requests.filter((r) => !r.isSample);
  const Row = ({ r }: { r: (typeof state.requests)[number] }) => (
    <Link to="/requests/$id" params={{ id: r.id }} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:gap-4 sm:p-5 transition-colors hover:border-primary/40">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 break-words font-semibold">{r.part.name}</span>
        </div>
        <p className="text-sm text-muted-foreground">{r.vehicle.brand} {r.vehicle.model} {r.vehicle.year} · {r.id}</p>
      </div>
      <Pill tone="accent">{STATUS_LABEL[r.status]}</Pill>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
  return (
    <div className="min-w-0 max-w-3xl space-y-8 sm:space-y-10">
      <PageTitle eyebrow="Customer" title="My requests">Requests made on this device.</PageTitle>
      <section className="space-y-3">
        {mine.length ? mine.map((r) => <Row key={r.id} r={r} />) : (
          <Empty title="No requests yet">
            <Button asChild className="mt-4"><Link to="/find">Find my part</Link></Button>
          </Empty>
        )}
      </section>
    </div>
  );
}