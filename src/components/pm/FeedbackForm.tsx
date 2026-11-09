import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { commit } from "@/lib/pm/store";
import { addFeedback } from "@/lib/pm/logic";
import { ROLE_LABEL, type Role } from "@/lib/pm/types";

const METHODS = ["Visit Merkato / parts shops", "Ask my mechanic", "Phone or Telegram", "Social media", "Other"];

function Scale({ id, label, low, high, value, onChange }: { id: string; label: string; low: string; high: string; value: number; onChange: (n: number) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            id={`${id}-${n}`}
            onClick={() => onChange(n)}
            className={cn(
              "h-11 flex-1 rounded-xl border text-base font-medium transition-colors",
              value === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  );
}

export function FeedbackForm({ onDone }: { onDone?: () => void }) {
  const [role, setRole] = useState<Role | "">("");
  const [ease, setEase] = useState(0);
  const [conf, setConf] = useState(0);
  const [use, setUse] = useState(0);
  const [method, setMethod] = useState("");
  const [confusing, setConfusing] = useState("");
  const [comments, setComments] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !ease || !conf || !use || !method) return setError("Please answer all questions marked required.");
    if (!consent) return setError("Please tick the research consent box to save your answers.");
    try {
      commit((s) =>
        addFeedback(s, {
          role,
          easeOfUse: ease,
          confidence: conf,
          wouldUse: use,
          currentMethod: method,
          confusing: confusing.trim().slice(0, 500) || undefined,
          comments: comments.trim().slice(0, 1000) || undefined,
          consent: true,
        }),
      );
      toast.success("Thank you! Your feedback was saved.");
      onDone?.();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <fieldset>
        <legend className="mb-2 font-medium">I am a… *</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)}
              className={cn("rounded-full border px-4 py-2 text-sm", role === r ? "border-primary bg-primary-soft text-accent-foreground" : "border-border hover:border-primary/50")}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </fieldset>
      <Scale id="ease" label="How easy was it to request a part? *" low="Very hard" high="Very easy" value={ease} onChange={setEase} />
      <Scale id="conf" label="How confident are you in the match? *" low="Not confident" high="Very confident" value={conf} onChange={setConf} />
      <Scale id="use" label="Would you use this to find a part? *" low="Never" high="Definitely" value={use} onChange={setUse} />
      <div>
        <Label htmlFor="method" className="mb-2 block text-base">How do you find parts today? *</Label>
        <select id="method" className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="">Choose one</option>
          {METHODS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="confusing" className="mb-2 block text-base">What was confusing? (optional)</Label>
        <Textarea id="confusing" maxLength={500} value={confusing} onChange={(e) => setConfusing(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="comments" className="mb-2 block text-base">Anything else? (optional)</Label>
        <Textarea id="comments" maxLength={1000} value={comments} onChange={(e) => setComments(e.target.value)} />
      </div>
      <label className="flex items-start gap-3 rounded-xl bg-secondary p-4 text-sm">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
        <span>I agree that these anonymous answers are stored for research. No name or phone number is collected.</span>
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full">Save feedback</Button>
    </form>
  );
}