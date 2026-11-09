import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel } from "@/components/pm/ui";
import { STATUSES, STATUS_LABEL } from "@/lib/pm/types";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How PartMatch works" },
      { name: "description", content: "From request to pickup: manual fitment review, separate supplier confirmation, and your fit outcome." },
      { property: "og:title", content: "How PartMatch works" },
      { property: "og:description", content: "Manual fitment review, then local supplier offers in ETB." },
    ],
  }),
  component: How,
});

const EXPLAIN: Record<string, string> = {
  received: "We have your car and part details.",
  compatibility_review: "A specialist checks that the part fits your exact car. A person, not a computer, decides.",
  supplier_confirmation: "Approved requests go to suppliers. They confirm stock separately from the fitment check.",
  offer_ready: "You see each offer: price in ETB, stock, condition and pickup area.",
  reserved: "You mark the offer you want. In this prototype no money changes hands.",
  outcome_recorded: "After pickup, you tell us if the part fit. This is how we learn.",
};

function How() {
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow="How it works" title="Six clear steps, checked by people.">
        Fitment and stock are checked separately, so you know what was confirmed and by whom.
      </PageTitle>
      <Panel>
        <ol className="divide-y divide-border">
          {STATUSES.map((s, i) => (
            <li key={s} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-accent-foreground">{i + 1}</span>
              <div>
                <p className="font-semibold">{STATUS_LABEL[s]}</p>
                <p className="text-muted-foreground">{EXPLAIN[s]}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
      <p className="mt-6 text-sm text-muted-foreground">
        Brake, steering and other safety-critical parts are not accepted in this prototype.
      </p>
      <Button asChild size="lg" className="mt-6"><Link to="/find">Find my part</Link></Button>
    </div>
  );
}