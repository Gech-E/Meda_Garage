import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FeedbackForm } from "@/components/pm/FeedbackForm";
import { PageTitle, Panel } from "@/components/pm/ui";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Interview feedback — Meda Garage" },
      { name: "description", content: "Share anonymous feedback about the PartMatch prototype." },
      { property: "og:title", content: "Interview feedback — Meda Garage" },
      { property: "og:description", content: "Share anonymous feedback about the PartMatch prototype." },
    ],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-xl">
      <PageTitle eyebrow="Interview feedback" title="How was it?">Five short questions. Takes about a minute.</PageTitle>
      <Panel><FeedbackForm onDone={() => navigate({ to: "/" })} /></Panel>
    </div>
  );
}