import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ClipboardList, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meda Garage — Find the right spare part" },
      { name: "description", content: "Tell us which part you need. Review compatibility, compare shop-entered quotes, and keep track of your request." },
      { property: "og:title", content: "Meda Garage — Find the right spare part" },
      { property: "og:description", content: "An easier way to request and compare spare parts in Addis Ababa." },
    ],
  }),
  component: Home,
});

const steps = [
  { title: "Tell us what you need", description: "Share your car details and the part you're looking for." },
  { title: "Check the fit", description: "A specialist reviews the details before any quote is added." },
  { title: "Compare your options", description: "See shop-entered prices, availability, and pickup locations." },
];

function Home() {
  return (
    <div className="space-y-16 pb-4 sm:space-y-24">
      <section className="grid items-center gap-10 pt-5 md:grid-cols-[1.2fr_0.8fr] md:gap-16 md:pt-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-muted-foreground">Meda Garage · Addis Ababa</p>
          <h1 className="mt-5 max-w-2xl text-[clamp(2.6rem,6vw,4.7rem)] font-semibold leading-[1.08] tracking-[-0.045em]">
            The right spare part, without the runaround.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">
            Finding the right part shouldn't mean visiting shop after shop. Tell us what you need, have compatibility checked, and compare available offers in one place.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-12 rounded-xl px-7 shadow-none">
              <Link to="/find">Request a part <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-6 shadow-none">
              <Link to="/requests">Track my request</Link>
            </Button>
          </div>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">Early access pilot · No payment or confirmed reservation is made through this website.</p>
        </div>
        <div className="rounded-[1.75rem] border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Search className="size-6" /></div>
          <h2 className="mt-7 text-xl font-semibold tracking-tight">A simpler way to source parts</h2>
          <ul className="mt-6 space-y-6">
            <li className="flex items-start gap-3"><ClipboardList className="mt-0.5 size-5 shrink-0 text-primary" /><span><strong className="block font-medium">One clear request</strong><span className="mt-1 block text-sm leading-6 text-muted-foreground">Car, part, and pickup area together.</span></span></li>
            <li className="flex items-start gap-3"><Check className="mt-0.5 size-5 shrink-0 text-primary" /><span><strong className="block font-medium">Human fitment review</strong><span className="mt-1 block text-sm leading-6 text-muted-foreground">A person checks the part details, not an automatic guess.</span></span></li>
            <li className="flex items-start gap-3"><Store className="mt-0.5 size-5 shrink-0 text-primary" /><span><strong className="block font-medium">Clear shop offers</strong><span className="mt-1 block text-sm leading-6 text-muted-foreground">Price, condition, and stated availability side by side.</span></span></li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="how-heading" className="border-t border-border pt-10 sm:pt-14">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">The process</p><h2 id="how-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">How Meda Garage works</h2></div>
          <Link to="/how-it-works" className="text-sm font-medium text-primary underline-offset-4 hover:underline">See the full process</Link>
        </div>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t border-border pt-5">
              <span className="text-xs font-semibold text-primary">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
