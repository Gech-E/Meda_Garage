import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel } from "@/components/pm/ui";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the PartMatch prototype" },
      { name: "description", content: "What is real and what is simulated in this research prototype." },
      { property: "og:title", content: "About the PartMatch prototype" },
      { property: "og:description", content: "What is real and what is simulated in this research prototype." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle eyebrow="About" title="Meda Garage">A practical way to test spare-part sourcing with real customer requests.</PageTitle>
      <Panel>
        <h2 className="text-lg font-semibold">This is a research prototype</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>There are no preloaded requests or supplier quotes. Participants enter information during the pilot; stock data is not connected to live shop systems.</li>
          <li>Fitment is reviewed by a person in the specialist workspace. There is no AI identification and no automatic approval.</li>
          <li>“Reserve” records your intent only. No payment, booking or delivery happens.</li>
          <li>Data is saved only in this browser. Phone numbers are optional and never sent anywhere.</li>
          <li>Safety-critical parts (brakes, steering, airbags) are excluded.</li>
          <li>English only for now. An Amharic version will be added once translations are reviewed.</li>
        </ul>
      </Panel>
      <p className="text-sm text-muted-foreground">Pilot area: Addis Ababa.</p>
    </div>
  );
}