export const BRANDS = ["Toyota", "Suzuki", "Hyundai", "Kia", "Isuzu", "BYD", "Other"] as const;

export const NEIGHBORHOODS = [
  "Bole",
  "Kazanchis",
  "Piassa",
  "Merkato",
  "Megenagna",
  "CMC",
  "Sarbet",
  "Lideta",
  "Mexico",
  "Ayat",
] as const;

export const STATUSES = [
  "received",
  "compatibility_review",
  "supplier_confirmation",
  "offer_ready",
  "reserved",
  "outcome_recorded",
] as const;
export type RequestStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  received: "Received",
  compatibility_review: "Fitment review",
  supplier_confirmation: "Waiting for shop quotes",
  offer_ready: "Quotes ready",
  reserved: "Reserved (intent)",
  outcome_recorded: "Outcome recorded",
};

export type BuyerType = "mechanic" | "car_owner";
export const BUYER_LABEL: Record<BuyerType, string> = {
  mechanic: "Mechanic / garage",
  car_owner: "Car owner",
};

export type ReviewDecision = "pending" | "approved" | "needs_info" | "mismatch";
export const DECISION_LABEL: Record<ReviewDecision, string> = {
  pending: "Not reviewed yet",
  approved: "Fitment approved (manual review)",
  needs_info: "More info needed",
  mismatch: "Mismatch — not compatible",
};

export type Availability = "in_stock" | "can_source" | "unavailable";
export const AVAILABILITY_LABEL: Record<Availability, string> = {
  in_stock: "In stock",
  can_source: "Can source",
  unavailable: "No longer available",
};

export type Condition = "new" | "oem_equivalent" | "used";
export const CONDITION_LABEL: Record<Condition, string> = {
  new: "New (as stated by shop)",
  oem_equivalent: "Aftermarket / OEM-equivalent",
  used: "Used",
};

export type FitOutcome = "fit" | "did_not_fit" | "not_purchased";
export const OUTCOME_LABEL: Record<FitOutcome, string> = {
  fit: "Yes, it fit",
  did_not_fit: "No, it did not fit",
  not_purchased: "Not purchased",
};

export interface HistoryEntry {
  at: string;
  label: string;
  note?: string | undefined;
}

export interface ReviewNote {
  at: string;
  text: string;
  evidence?: string | undefined;
  decision: ReviewDecision;
}

export interface Offer {
  id: string;
  supplierLabel: string;
  priceEtb: number;
  availability: Availability;
  neighborhood: string;
  condition: Condition;
  notes?: string | undefined;
  createdAt: string;
  /** Shop ticked "I checked this item is available / can source as stated". Missing on legacy offers. */
  availabilityConfirmed?: boolean | undefined;
  /** Short part identification / evidence typed by the shop (label, part no., shelf ref). */
  evidence?: string | undefined;
  /** When the shop last confirmed availability. */
  confirmedAt?: string | undefined;
}

export interface PartRequest {
  id: string;
  isSample: boolean;
  createdAt: string;
  buyer: { type: BuyerType; garageName?: string | undefined };
  vehicle: { brand: string; model: string; year: number; engine?: string | undefined };
  part: { name: string; description?: string | undefined; partNumber?: string | undefined; photo?: string | undefined };
  contact: { anonymous: boolean; name?: string | undefined; phone?: string | undefined; consent: boolean };
  neighborhood: string;
  status: RequestStatus;
  decision: ReviewDecision;
  reviewNotes: ReviewNote[];
  offers: Offer[];
  reservedOfferId?: string | undefined;
  outcome?: { result: FitOutcome; notes?: string | undefined; at: string } | undefined;
  history: HistoryEntry[];
}

export type Role = "car_owner" | "mechanic" | "supplier" | "other";
export const ROLE_LABEL: Record<Role, string> = {
  car_owner: "Car owner",
  mechanic: "Mechanic / garage",
  supplier: "Parts supplier",
  other: "Other",
};

export const PAIN_POINTS = [
  "Finding the exact compatible part",
  "Knowing if a shop really has it",
  "Fake / unclear part condition",
  "Time travelling between shops",
  "Unclear or changing prices",
  "Vague or low-intent buyer inquiries",
] as const;

export const TIME_RANGES = ["Under 1 hour", "1–3 hours", "Half a day", "A full day or more", "Not sure"] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

export type WouldTry = "yes" | "maybe" | "no";
export const WOULD_TRY_LABEL: Record<WouldTry, string> = { yes: "Yes", maybe: "Maybe", no: "No" };

export type WouldPay = "per_request" | "subscription" | "free_only" | "unsure";
export const WOULD_PAY_LABEL: Record<WouldPay, string> = {
  per_request: "Small fee per request",
  subscription: "Monthly subscription",
  free_only: "Only if free",
  unsure: "Not sure",
};

export interface Feedback {
  id: string;
  createdAt: string;
  role: Role;
  easeOfUse: number; // 1-5
  confidence: number; // 1-5
  wouldUse: number; // 1-5
  currentMethod: string;
  /** Added in v2; optional so earlier responses stay valid. */
  painPoints?: string[] | undefined;
  timeSpent?: TimeRange | undefined;
  wouldTry?: WouldTry | undefined;
  wouldPay?: WouldPay | undefined;
  confusing?: string | undefined;
  comments?: string | undefined;
  consent: true;
}

export interface AppState {
  version: 2;
  requests: PartRequest[];
  feedback: Feedback[];
}