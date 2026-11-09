import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Car, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/pm/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meda Garage — PartMatch spare-parts sourcing" },
      { name: "description", content: "Tell us your car and the part you need. A specialist checks fitment, then local suppliers in Addis Ababa reply with offers." },
      { property: "og:title", content: "Meda Garage — PartMatch spare-parts sourcing" },
      { property: "og:description", content: "Research prototype for Addis Ababa car owners, mechanics and parts suppliers." },
    ],
  }),
  component: Home,
});

const STEPS = [
  { icon: Car, title: "Tell us your car and part", text: "Brand, model, year and the part you need. A photo helps." },
  { icon: ShieldCheck, title: "A specialist checks fitment", text: "A person reviews compatibility. Nothing is auto-approved." },
  { icon: Store, title: "Compare local offers", text: "Demo suppliers enter price, stated stock status and pickup area. No live supplier connection." },
];

function Home() {
  return (
    <div className="space-y-12 md:space-y-20">
      <section className="min-w-0 max-w-3xl pt-2 sm:pt-4">
        <Pill tone="sample">Research prototype · example offers only</Pill>
        <h1 className="mt-5 break-words text-4xl font-semibold leading-[1.08] tracking-tight sm:mt-6 sm:text-5xl lg:text-6xl">
          Find the right part. Confirm availability. Get back to work.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
          For mechanics, garages and car owners: describe the part, request a manual fitment review, and compare shop-entered quotes. Demo inventory only.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="min-h-12 w-full sm:w-auto">
            <Link to="/find">Request a part <ArrowRight /></Link>
          </Button>
          <Link to="/requests/$id" params={{ id: "SAMPLE-VITZ" }} className="inline-flex min-h-11 items-center justify-center px-2 text-center text-sm text-muted-foreground sm:text-base underline-offset-4 hover:text-foreground hover:underline">
            See a sample request
          </Link>
        </div>
      </section>

      <section aria-labelledby="steps">
        <h2 id="steps" className="mb-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <s.icon className="h-6 w-6 text-primary" />
                <span className="text-sm text-muted-foreground">{i + 1}/3</span>
              </div>
              <h3 className="mt-5 break-words text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}