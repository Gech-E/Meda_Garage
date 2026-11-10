import type {
  AppState,
  Availability,
  BuyerType,
  Condition,
  Feedback,
  FitOutcome,
  Offer,
  PartRequest,
  ReviewDecision,
} from "./types";
import { PAIN_POINTS, STATUS_LABEL, TIME_RANGES, WOULD_PAY_LABEL, WOULD_TRY_LABEL } from "./types";

const SAFETY_CRITICAL =
  /\b(brake|brakes|caliper|rotor|steering|tie ?rod|ball ?joint|airbag|seat ?belt|abs)\b/i;

export function isSafetyCritical(text: string): boolean {
  return SAFETY_CRITICAL.test(text);
}

export function makeId(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${s}`;
}

const now = () => new Date().toISOString();
const clean = (s: string | undefined, max: number) => s?.trim().slice(0, max) || undefined;

function update(state: AppState, id: string, fn: (r: PartRequest) => PartRequest): AppState {
  const found = state.requests.some((r) => r.id === id);
  if (!found) throw new Error("Request not found");
  return { ...state, requests: state.requests.map((r) => (r.id === id ? fn(r) : r)) };
}

export interface NewRequestInput {
  buyer: { type: BuyerType; garageName?: string | undefined };
  vehicle: PartRequest["vehicle"];
  part: PartRequest["part"];
  contact: PartRequest["contact"];
  neighborhood: string;
}

export function createRequest(state: AppState, input: NewRequestInput, id = makeId("MG")) {
  if (input.buyer.type !== "mechanic" && input.buyer.type !== "car_owner") {
    throw new Error("Choose who is requesting the part.");
  }
  if (isSafetyCritical(`${input.part.name} ${input.part.description ?? ""}`)) {
    throw new Error("Safety-critical parts are excluded from this demo.");
  }
  if (!input.contact.anonymous && !input.contact.consent) {
    throw new Error("Consent is required when contact details are entered.");
  }
  if (!input.part.name.trim()) throw new Error("Part name is required.");
  if (!input.neighborhood) throw new Error("Pickup area is required.");
  const at = now();
  const req: PartRequest = {
    id,
    isSample: false,
    createdAt: at,
    ...input,
    buyer: {
      type: input.buyer.type,
      garageName: input.buyer.type === "mechanic" ? clean(input.buyer.garageName, 60) : undefined,
    },
    status: "received",
    decision: "pending",
    reviewNotes: [],
    offers: [],
    history: [{ at, label: STATUS_LABEL.received, note: "Request submitted." }],
  };
  return { state: { ...state, requests: [req, ...state.requests] }, request: req };
}

export function startReview(state: AppState, id: string): AppState {
  return update(state, id, (r) =>
    r.status !== "received"
      ? r
      : {
          ...r,
          status: "compatibility_review",
          history: [...r.history, { at: now(), label: STATUS_LABEL.compatibility_review, note: "Specialist started manual review." }],
        },
  );
}

export function recordReview(
  state: AppState,
  id: string,
  input: { decision: Exclude<ReviewDecision, "pending">; notes: string; evidence?: string | undefined },
): AppState {
  const notes = input.notes.trim();
  if (!notes) throw new Error("A written rationale is required for every decision.");
  if (input.decision === "approved" && !input.evidence?.trim()) {
    throw new Error("Approval requires compatibility evidence or a reference.");
  }
  return update(state, id, (r) => {
    if (r.status !== "received" && r.status !== "compatibility_review") {
      throw new Error("This request has already passed fitment review.");
    }
    const at = now();
    const note = { at, text: notes, evidence: input.evidence?.trim() || undefined, decision: input.decision };
    const approved = input.decision === "approved";
    return {
      ...r,
      decision: input.decision,
      status: approved ? "supplier_confirmation" : "compatibility_review",
      reviewNotes: [...r.reviewNotes, note],
      history: [
        ...r.history,
        approved
          ? { at, label: STATUS_LABEL.supplier_confirmation, note: "Fitment approved manually by specialist. Sent to shops." }
          : { at, label: input.decision === "mismatch" ? "Mismatch found" : "More info needed", note: notes },
      ],
    };
  });
}

export interface OfferInput {
  supplierLabel: string;
  priceEtb: number;
  availability: Availability;
  neighborhood: string;
  condition: Condition;
  /** Must be true: the shop explicitly confirms it checked availability. */
  availabilityConfirmed: boolean;
  evidence: string;
  notes?: string | undefined;
}

export function addOffer(state: AppState, id: string, input: OfferInput): AppState {
  if (!Number.isFinite(input.priceEtb) || input.priceEtb <= 0) throw new Error("Enter a price above 0 ETB.");
  if (!input.supplierLabel.trim()) throw new Error("Supplier label is required.");
  if (input.availability === "unavailable") throw new Error("Only quote items that are in stock or that you can source.");
  if (!input.availabilityConfirmed) throw new Error("Tick the box to confirm you checked availability.");
  const evidence = input.evidence.trim();
  if (evidence.length < 3) throw new Error("Add a short part identification or reference (e.g. label or part number).");
  return update(state, id, (r) => {
    if (r.decision !== "approved") throw new Error("Only specialist-approved requests can receive quotes.");
    if (r.status === "reserved" || r.status === "outcome_recorded") throw new Error("This request is already reserved.");
    const at = now();
    const offer: Offer = {
      id: makeId("OF"),
      createdAt: at,
      supplierLabel: input.supplierLabel.trim(),
      priceEtb: Math.round(input.priceEtb),
      availability: input.availability,
      neighborhood: input.neighborhood,
      condition: input.condition,
      notes: clean(input.notes, 400),
      availabilityConfirmed: true,
      evidence: evidence.slice(0, 200),
      confirmedAt: at,
    };
    return {
      ...r,
      offers: [...r.offers, offer],
      status: "offer_ready",
      history: [...r.history, { at, label: STATUS_LABEL.offer_ready, note: `${offer.supplierLabel} quoted ${formatEtb(offer.priceEtb)} (entered manually).` }],
    };
  });
}

/** A shop re-checks its shelf: updates status and the last-confirmed timestamp. */
export function setOfferAvailability(state: AppState, id: string, offerId: string, availability: Availability): AppState {
  const at = now();
  return update(state, id, (r) => ({
    ...r,
    offers: r.offers.map((o) => (o.id === offerId ? { ...o, availability, availabilityConfirmed: true, confirmedAt: at } : o)),
  }));
}

export function reserveOffer(state: AppState, id: string, offerId: string): AppState {
  return update(state, id, (r) => {
    const offer = r.offers.find((o) => o.id === offerId);
    if (!offer) throw new Error("Quote not found");
    if (r.decision !== "approved") throw new Error("Fitment has not been approved.");
    if (offer.availability === "unavailable") throw new Error("This quote is no longer available.");
    if (r.reservedOfferId) throw new Error("A quote is already reserved.");
    const at = now();
    return {
      ...r,
      reservedOfferId: offerId,
      status: "reserved",
      history: [...r.history, { at, label: STATUS_LABEL.reserved, note: `Reservation intent for ${offer.supplierLabel} (demo, no payment, shop not notified).` }],
    };
  });
}

export function recordOutcome(state: AppState, id: string, result: FitOutcome, notes?: string): AppState {
  return update(state, id, (r) => {
    if (!r.reservedOfferId) throw new Error("Reserve a quote before recording an outcome.");
    const at = now();
    const n = notes?.trim() || undefined;
    return {
      ...r,
      outcome: { result, notes: n, at },
      status: "outcome_recorded",
      history: [...r.history, { at, label: STATUS_LABEL.outcome_recorded, note: n }],
    };
  });
}

export function addFeedback(state: AppState, fb: Omit<Feedback, "id" | "createdAt">): AppState {
  if (!fb.consent) throw new Error("Research consent is required.");
  for (const k of ["easeOfUse", "confidence", "wouldUse"] as const) {
    if (!Number.isInteger(fb[k]) || fb[k] < 1 || fb[k] > 5) throw new Error("Ratings must be between 1 and 5.");
  }
  return { ...state, feedback: [...state.feedback, { ...fb, id: makeId("FB"), createdAt: now() }] };
}

// ---------- Migration ----------

/**
 * Accepts anything read from storage and returns a valid v2 state, or null if unusable.
 * v1 → v2: requests gain `buyer` (defaults to car owner — the v1 form only served car owners);
 * fabricated sample requests are removed; genuine requests, quotes and feedback are preserved.
 */
export function migrateState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as { version?: unknown; requests?: unknown; feedback?: unknown };
  if (!Array.isArray(s.requests) || !Array.isArray(s.feedback)) return null;
  // Remove legacy samples even for browsers that already saved the old v2 state.
  if (s.version === 2) return { ...(s as AppState), requests: (s.requests as PartRequest[]).filter((r) => !r.isSample) };
  if (s.version !== 1) return null;
  const legacy = s.requests as Array<Omit<PartRequest, "buyer"> & { buyer?: PartRequest["buyer"] }>;
  const real: PartRequest[] = legacy
    .filter((r) => !r.isSample)
    .map((r) => ({ ...r, buyer: r.buyer ?? { type: "car_owner" } }));
  return {
    version: 2,
    requests: real,
    feedback: s.feedback as Feedback[],
  };
}

// ---------- Metrics ----------

function countBy<T extends string>(keys: readonly T[], values: (T | undefined)[]) {
  return keys.map((k) => ({ key: k, count: values.filter((v) => v === k).length }));
}

export function computeMetrics(state: AppState) {
  const real = state.requests.filter((r) => !r.isSample);
  const fb = state.feedback;
  const avg = (k: "easeOfUse" | "confidence" | "wouldUse") => (fb.length ? fb.reduce((s, f) => s + f[k], 0) / fb.length : null);
  const realOffers = real.flatMap((r) => r.offers);
  return {
    requests: real.length,
    byBuyer: { mechanic: real.filter((r) => r.buyer.type === "mechanic").length, car_owner: real.filter((r) => r.buyer.type === "car_owner").length },
    reviewed: real.filter((r) => r.decision !== "pending").length,
    approved: real.filter((r) => r.decision === "approved").length,
    withOffers: real.filter((r) => r.offers.length > 0).length,
    withConfirmedOffers: real.filter((r) => r.offers.some((o) => o.availabilityConfirmed)).length,
    offers: realOffers.length,
    confirmedOffers: realOffers.filter((o) => o.availabilityConfirmed).length,
    reservations: real.filter((r) => r.reservedOfferId).length,
    outcomes: real.filter((r) => r.outcome).length,
    fits: real.filter((r) => r.outcome?.result === "fit").length,
    feedback: fb.length,
    avgEase: avg("easeOfUse"),
    avgConfidence: avg("confidence"),
    avgWouldUse: avg("wouldUse"),
    wouldUseHighShare: fb.length ? fb.filter((f) => f.wouldUse >= 4).length / fb.length : null,
    timeSpent: countBy(TIME_RANGES, fb.map((f) => f.timeSpent)),
    painPoints: PAIN_POINTS.map((p) => ({ key: p, count: fb.filter((f) => f.painPoints?.includes(p)).length })),
    wouldTry: countBy(Object.keys(WOULD_TRY_LABEL) as (keyof typeof WOULD_TRY_LABEL)[], fb.map((f) => f.wouldTry)),
    wouldPay: countBy(Object.keys(WOULD_PAY_LABEL) as (keyof typeof WOULD_PAY_LABEL)[], fb.map((f) => f.wouldPay)),
    sampleRequests: state.requests.length - real.length,
  };
}

export function formatEtb(n: number): string {
  return `ETB ${new Intl.NumberFormat("en-US").format(n)}`;
}

function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  const first = rows[0];
  if (!first) return "";
  const headers = Object.keys(first);
  return [headers.join(","), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(","))].join("\n");
}