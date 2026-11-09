import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { commit } from "@/lib/pm/store";
import { addFeedback } from "@/lib/pm/logic";
import { ROLE_LABEL, PAIN_POINTS, TIME_RANGES, WOULD_TRY_LABEL, WOULD_PAY_LABEL, type Role, type TimeRange, type WouldTry, type WouldPay } from "@/lib/pm/types";

const METHODS = ["Visit Merkato / parts shops", "Ask my mechanic", "Phone or Telegram", "Social media", "Other"];

function Scale({ id, label, low, high, value, onChange }: { id: string; label: string; low: string; high: string; value: number; onChange: (n: number) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="flex gap-1.5 sm:gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            id={`${id}-${n}`}
            onClick={() => onChange(n)}
            className={cn(
              "h-12 min-w-0 flex-1 rounded-xl border text-base font-medium transition-colors",
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
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [timeSpent, setTimeSpent] = useState<TimeRange | "">("");
  const [wouldTry, setWouldTry] = useState<WouldTry | "">("");
  const [wouldPay, setWouldPay] = useState<WouldPay | "">("");
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
          painPoints,
          timeSpent: timeSpent || undefined,
          wouldTry: wouldTry || undefined,
          wouldPay: wouldPay || undefined,
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
              className={cn("min-h-11 rounded-full border px-4 py-2 text-sm", role === r ? "border-primary bg-primary-soft text-accent-foreground" : "border-border hover:border-primary/50")}>
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
      <fieldset>
        <legend className="mb-2 font-medium">What is hardest about sourcing spare parts? (select any)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAIN_POINTS.map((pain) => (
            <label key={pain} className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm">
              <Checkbox checked={painPoints.includes(pain)} onCheckedChange={(checked) =>
                setPainPoints((current) => checked === true ? [...current, pain] : current.filter((x) => x !== pain))
              } />
              <span>{pain}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="timeSpent" className="mb-2 block text-base">How long do you normally spend finding a part?</Label>
        <select className="field" id="timeSpent" value={timeSpent} onChange={(e) => setTimeSpent(e.target.value as TimeRange | "")}>
          <option value="">Choose (optional)</option>
          {TIME_RANGES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="wouldTry" className="mb-2 block text-base">Would you try this kind of service?</Label>
        <select className="field" id="wouldTry" value={wouldTry} onChange={(e) => setWouldTry(e.target.value as WouldTry | "")}>
          <option value="">Choose (optional)</option>
          {(Object.keys(WOULD_TRY_LABEL) as WouldTry[]).map((x) => <option key={x} value={x}>{WOULD_TRY_LABEL[x]}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="wouldPay" className="mb-2 block text-base">Would you pay for a working version?</Label>
        <select className="field" id="wouldPay" value={wouldPay} onChange={(e) => setWouldPay(e.target.value as WouldPay | "")}>
          <option value="">Choose (optional)</option>
          {(Object.keys(WOULD_PAY_LABEL) as WouldPay[]).map((x) => <option key={x} value={x}>{WOULD_PAY_LABEL[x]}</option>)}
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