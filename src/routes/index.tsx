import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Car, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/pm/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PartMatch — Find a compatible part before you buy" },
      { name: "description", content: "Tell us your car and the part you need. A specialist checks fitment, then local suppliers in Addis Ababa reply with offers." },
      { property: "og:title", content: "PartMatch — Find a compatible part before you buy" },
      { property: "og:description", content: "Research prototype for Addis Ababa car owners, mechanics and parts suppliers." },
    ],
  }),
  component: Home,
});

const STEPS = [
  { icon: Car, title: "Tell us your car and part", text: "Brand, model, year and the part you need. A photo helps." },
  { icon: ShieldCheck, title: "A specialist checks fitment", text: "A person reviews compatibility. Nothing is auto-approved." },
  { icon: Store, title: "Compare local offers", text: "Suppliers reply with price in ETB, stock and pickup area." },
];

function Home() {
  return (
    <div className="space-y-20">
      <section className="max-w-3xl pt-4">
        <Pill tone="sample">Research prototype · example offers only</Pill>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Find a compatible, in-stock part before you buy.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">
          No more trips across Addis with the wrong part. Ask once, get checked offers.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link to="/find">Find my part <ArrowRight /></Link>
          </Button>
          <Link to="/requests/$id" params={{ id: "SAMPLE-VITZ" }} className="px-2 text-base text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            See a sample request
          </Link>
        </div>
      </section>

      <section aria-labelledby="steps">
        <h2 id="steps" className="mb-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <s.icon className="h-6 w-6 text-primary" />
                <span className="text-sm text-muted-foreground">{i + 1}/3</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}