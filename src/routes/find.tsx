import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTitle, Panel } from "@/components/pm/ui";
import { cn } from "@/lib/utils";
import { BRANDS, BUYER_LABEL, NEIGHBORHOODS, type BuyerType } from "@/lib/pm/types";
import { createRequest, isSafetyCritical } from "@/lib/pm/logic";
import { commit } from "@/lib/pm/store";

export const Route = createFileRoute("/find")({
  head: () => ({
    meta: [
      { title: "Request a part — Meda Garage PartMatch" },
      { name: "description", content: "Request a compatible car part in three short steps." },
      { property: "og:title", content: "Request a part — Meda Garage PartMatch" },
      { property: "og:description", content: "Request a compatible car part in three short steps." },
    ],
  }),
  component: Find,
});

const STEPS = ["Your car", "The part", "Contact & pickup", "Review"];
const THIS_YEAR = 2026;
const MAX_PHOTO = 3 * 1024 * 1024;

type ErrKey = "buyer" | "brand" | "otherBrand" | "model" | "year" | "partName" | "photo" | "hood" | "phone" | "consent";
type Errors = Partial<Record<ErrKey, string>>;

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block text-base">{label}</Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}

async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, 800 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.75);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Find() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [buyerType, setBuyerType] = useState<BuyerType | "">("");
  const [garageName, setGarageName] = useState("");
  const [brand, setBrand] = useState("");
  const [otherBrand, setOtherBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [partName, setPartName] = useState("");
  const [desc, setDesc] = useState("");
  const [partNo, setPartNo] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [hood, setHood] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finalBrand = brand === "Other" ? otherBrand.trim() : brand;
  const safety = isSafetyCritical(`${partName} ${desc}`);

  function validate(s: number): Errors {
    const e: Errors = {};
    if (s === 0) {
      if (!buyerType) e.buyer = "Choose who is requesting.";
      if (!brand) e.brand = "Choose a brand.";
      if (brand === "Other" && !otherBrand.trim()) e.otherBrand = "Type the brand name.";
      if (!model.trim()) e.model = "Enter the model, e.g. Vitz or Swift.";
      const y = Number(year);
      if (!/^\d{4}$/.test(year) || y < 1980 || y > THIS_YEAR + 1) e.year = `Enter a year between 1980 and ${THIS_YEAR + 1}.`;
    }
    if (s === 1) {
      if (partName.trim().length < 3) e.partName = "Describe the part in a few words.";
      if (safety) e.partName = "Brakes, steering and other safety-critical parts are not accepted in this prototype.";
    }
    if (s === 2) {
      if (!hood) e.hood = "Choose where you would like to pick up.";
      if (!anonymous) {
        if (!phone.trim() && !name.trim()) e.phone = "Add a name or phone, or switch back to anonymous.";
        if (phone.trim() && !/^\+?[\d\s-]{9,15}$/.test(phone.trim())) e.phone = "Enter a valid phone number.";
        if (!consent) e.consent = "Please agree before sharing contact details.";
      }
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0])?.focus();
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onPhoto(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return setErrors({ photo: "Use a JPG, PNG or WEBP photo." });
    }
    if (file.size > MAX_PHOTO) return setErrors({ photo: "Photo must be under 3 MB." });
    try {
      setPhoto(await shrinkImage(file));
      setErrors({});
    } catch {
      setErrors({ photo: "Could not read this photo. Try another one." });
    }
  }

  function submit() {
    setSubmitting(true);
    try {
      const { request } = (() => {
        let out: ReturnType<typeof createRequest> | undefined;
        commit((s) => {
          out = createRequest(s, {
            buyer: { type: buyerType as BuyerType, garageName: garageName.trim() || undefined },
            vehicle: { brand: finalBrand, model: model.trim(), year: Number(year), engine: engine.trim() || undefined },
            part: { name: partName.trim(), description: desc.trim() || undefined, partNumber: partNo.trim() || undefined, photo },
            contact: anonymous ? { anonymous: true, consent: false } : { anonymous: false, name: name.trim() || undefined, phone: phone.trim() || undefined, consent },
            neighborhood: hood,
          });
          return out.state;
        });
        return out!;
      })();
      toast.success(`Request ${request.id} sent`);
      navigate({ to: "/requests/$id", params: { id: request.id } });
    } catch (err) {
      toast.error((err as Error).message);
      setSubmitting(false);
    }
  }

  const err = (k: ErrKey) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl">
      <PageTitle title="Request a part" back={{ to: "/", label: "Home" }} />

      <div className="mb-6" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        <div className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
          <span className="font-medium">{STEPS[step]}</span>
          <span className="text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i <= step ? "bg-primary" : "bg-border")} />
          ))}
        </div>
      </div>

      <Panel>
        <form onSubmit={(e) => { e.preventDefault(); if (step < 3) next(); else submit(); }} className="space-y-6" noValidate>
          {step === 0 && (
            <>
              <fieldset>
                <legend className="mb-2 text-base font-medium">Who is requesting?</legend>
                <div className="grid gap-2 sm:grid-cols-2" id="buyer" tabIndex={-1}>
                  {(Object.keys(BUYER_LABEL) as BuyerType[]).map((b) => (
                    <button key={b} type="button" aria-pressed={buyerType === b} onClick={() => setBuyerType(b)}
                      className={cn("min-h-12 rounded-xl border px-2 text-sm transition-colors sm:text-base", buyerType === b ? "border-primary bg-primary-soft font-medium text-accent-foreground" : "border-border bg-card hover:border-primary/50")}>
                      {BUYER_LABEL[b]}
                    </button>
                  ))}
                </div>
                {errors.buyer && <p className="mt-1.5 text-sm text-destructive">{errors.buyer}</p>}
              </fieldset>
              {buyerType === "mechanic" && (
                <Field id="garageName" label="Garage name (optional)">
                  <Input id="garageName" className="h-12 text-base" maxLength={60} value={garageName} onChange={(e) => setGarageName(e.target.value)} />
                </Field>
              )}
              <fieldset>
                <legend className="mb-2 text-base font-medium">Brand</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" id="brand" tabIndex={-1}>
                  {BRANDS.map((b) => (
                    <button key={b} type="button" aria-pressed={brand === b} onClick={() => setBrand(b)}
                      className={cn("h-12 rounded-xl border text-base transition-colors", brand === b ? "border-primary bg-primary-soft font-medium text-accent-foreground" : "border-border bg-card hover:border-primary/50")}>
                      {b}
                    </button>
                  ))}
                </div>
                {errors.brand && <p className="mt-1.5 text-sm text-destructive">{errors.brand}</p>}
              </fieldset>
              {brand === "Other" && (
                <Field id="otherBrand" label="Brand name" error={errors.otherBrand}>
                  <Input id="otherBrand" className="h-12 text-base" maxLength={40} value={otherBrand} onChange={(e) => setOtherBrand(e.target.value)} {...err("otherBrand")} />
                </Field>
              )}
              <div className="grid gap-6 sm:grid-cols-2">
                <Field id="model" label="Model" error={errors.model}>
                  <Input id="model" className="h-12 text-base" placeholder="e.g. Vitz" maxLength={40} value={model} onChange={(e) => setModel(e.target.value)} {...err("model")} />
                </Field>
                <Field id="year" label="Model year" error={errors.year}>
                  <Input id="year" inputMode="numeric" className="h-12 text-base" placeholder="e.g. 2010" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} {...err("year")} />
                </Field>
              </div>
              <Field id="engine" label="Engine or trim (optional)" hint="Found on your registration or under the hood. Helps the specialist.">
                <Input id="engine" className="h-12 text-base" placeholder="e.g. 1.3L petrol" maxLength={60} value={engine} onChange={(e) => setEngine(e.target.value)} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field id="partName" label="What part do you need?" error={errors.partName} hint="Simple words are fine, e.g. “cabin air filter” or “side mirror glass”.">
                <Input id="partName" className="h-12 text-base" maxLength={80} value={partName} onChange={(e) => setPartName(e.target.value)} {...err("partName")} />
              </Field>
              {safety && !errors.partName && (
                <p className="flex gap-2 rounded-xl bg-warning-soft p-3 text-sm text-warning"><AlertTriangle className="h-4 w-4 shrink-0" /> Non-safety-critical demo only: brakes, steering and similar parts are not accepted.</p>
              )}
              <Field id="desc" label="Describe it (optional)" hint="Where is it on the car? What is wrong with the old one?">
                <Textarea id="desc" className="min-h-24 text-base" maxLength={400} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </Field>
              <Field id="partNo" label="Part number (optional)" hint="Often printed on the old part. Skip if you don't know.">
                <Input id="partNo" className="h-12 text-base" maxLength={40} value={partNo} onChange={(e) => setPartNo(e.target.value)} />
              </Field>
              <div>
                <p className="mb-2 text-base font-medium">Photo of the old part (optional)</p>
                {photo ? (
                  <div className="flex items-center gap-4">
                    <img src={photo} alt="Your part" className="h-24 w-24 rounded-xl border border-border object-cover" />
                    <Button type="button" variant="outline" size="sm" onClick={() => setPhoto(undefined)}><Trash2 /> Remove</Button>
                  </div>
                ) : (
                  <label className="flex min-h-12 cursor-pointer flex-wrap items-center gap-3 rounded-xl border border-dashed border-input p-4 text-muted-foreground hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring">
                    <ImagePlus className="h-5 w-5" /> Add a photo · JPG, PNG or WEBP, up to 3 MB
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
                  </label>
                )}
                {errors.photo && <p className="mt-1.5 text-sm text-destructive">{errors.photo}</p>}
                <p className="mt-1.5 text-sm text-muted-foreground">Photos stay on this device. A person looks at them; there is no automatic recognition.</p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Field id="hood" label="Preferred pickup area" error={errors.hood}>
                <select id="hood" className="field" value={hood} onChange={(e) => setHood(e.target.value)} {...err("hood")}>
                  <option value="">Choose a neighborhood</option>
                  {NEIGHBORHOODS.map((n) => <option key={n}>{n}</option>)}
                </select>
              </Field>
              <fieldset>
                <legend className="mb-2 text-base font-medium">How should we reach you?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[{ v: true, t: "Stay anonymous", d: "Recommended for this demo. Track with your request ID." }, { v: false, t: "Add contact details", d: "Optional. Saved only on this device." }].map((o) => (
                    <button key={String(o.v)} type="button" aria-pressed={anonymous === o.v} onClick={() => setAnonymous(o.v)}
                      className={cn("min-h-16 rounded-xl border p-4 text-left", anonymous === o.v ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50")}>
                      <span className="block font-medium">{o.t}</span>
                      <span className="text-sm text-muted-foreground">{o.d}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              {!anonymous && (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field id="name" label="First name (optional)">
                      <Input id="name" className="h-12 text-base" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
                    </Field>
                    <Field id="phone" label="Phone (optional)" error={errors.phone}>
                      <Input id="phone" type="tel" className="h-12 text-base" placeholder="+251 9…" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} {...err("phone")} />
                    </Field>
                  </div>
                  <div>
                    <label className="flex items-start gap-3 rounded-xl bg-secondary p-4 text-sm">
                      <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
                      <span>I agree my contact details are stored on this device for this research demo. They are not shared.</span>
                    </label>
                    {errors.consent && <p className="mt-1.5 text-sm text-destructive">{errors.consent}</p>}
                  </div>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <dl className="divide-y divide-border">
              {[
                ["Requested by", buyerType ? `${BUYER_LABEL[buyerType]}${garageName.trim() ? ` · ${garageName.trim()}` : ""}` : "—", 0],
                ["Car", `${finalBrand} ${model} ${year}${engine ? ` · ${engine}` : ""}`, 0],
                ["Part", `${partName}${partNo ? ` · #${partNo}` : ""}`, 1],
                ["Details", desc || "—", 1],
                ["Photo", photo ? "Added" : "None", 1],
                ["Pickup", hood, 2],
                ["Contact", anonymous ? "Anonymous" : [name, phone].filter(Boolean).join(" · "), 2],
              ].map(([k, v, s]) => (
                <div key={k as string} className="flex min-w-0 items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <dt className="text-sm text-muted-foreground">{k}</dt>
                    <dd className="break-words font-medium">{v}</dd>
                  </div>
                  <button type="button" className="inline-flex min-h-11 shrink-0 items-center text-sm text-primary hover:underline" onClick={() => setStep(s as number)}>Edit</button>
                </div>
              ))}
            </dl>
          )}

          <div className="flex flex-wrap gap-3 pt-2 sm:flex-nowrap">
            {step > 0 && <Button type="button" variant="outline" size="lg" className="min-h-12 flex-1 sm:flex-none" onClick={() => setStep(step - 1)}>Back</Button>}
            <Button type="submit" size="lg" className="min-h-12 min-w-0 flex-1" disabled={submitting}>
              {step < 3 ? "Continue" : submitting ? "Sending…" : "Send request"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}