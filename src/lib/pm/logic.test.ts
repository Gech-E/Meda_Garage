import { describe, expect, it } from "vitest";
import {
  addFeedback,
  addOffer,
  computeMetrics,
  createRequest,
  isSafetyCritical,
  migrateState,
  recordReview,
  reserveOffer,
  setOfferAvailability,
  type NewRequestInput,
  type OfferInput,
} from "./logic";
import { seedState } from "./seed";

const input: NewRequestInput = {
  buyer: { type: "mechanic", garageName: "  Test garage  " },
  vehicle: { brand: "Toyota", model: "Corolla", year: 2010 },
  part: { name: "Cabin air filter" },
  contact: { anonymous: true, consent: false },
  neighborhood: "Bole",
};

const offer: OfferInput = {
  supplierLabel: "Test shop",
  priceEtb: 500,
  availability: "in_stock",
  neighborhood: "Bole",
  condition: "new",
  availabilityConfirmed: true,
  evidence: "Label 87139",
};

function approved(id: string) {
  const { state } = createRequest(seedState(), input, id);
  return recordReview(state, id, { decision: "approved", notes: "ok", evidence: "catalogue" });
}

describe("Meda Garage PartMatch rules", () => {
  it("excludes brake and steering parts", () => {
    expect(isSafetyCritical("front brake pads")).toBe(true);
    expect(isSafetyCritical("steering rack")).toBe(true);
    expect(isSafetyCritical("cabin air filter")).toBe(false);
    expect(() => createRequest(seedState(), { ...input, part: { name: "Brake pads" } })).toThrow();
  });

  it("stores buyer type per request, and garage name only for mechanics", () => {
    const { request } = createRequest(seedState(), input, "MG-B1");
    expect(request.buyer).toEqual({ type: "mechanic", garageName: "Test garage" });
    const owner = createRequest(seedState(), { ...input, buyer: { type: "car_owner", garageName: "x" } }, "MG-B2").request;
    expect(owner.buyer).toEqual({ type: "car_owner", garageName: undefined });
  });

  it("requires consent when contact details are entered", () => {
    expect(() => createRequest(seedState(), { ...input, contact: { anonymous: false, phone: "x", consent: false } })).toThrow();
  });

  it("requires a rationale for every decision and evidence to approve", () => {
    const { state, request } = createRequest(seedState(), input, "MG-T1");
    expect(() => recordReview(state, request.id, { decision: "mismatch", notes: "  " })).toThrow();
    expect(() => recordReview(state, request.id, { decision: "approved", notes: "ok" })).toThrow();
    expect(state.requests[0]?.decision).toBe("pending");
    const s2 = recordReview(state, request.id, { decision: "approved", notes: "ok", evidence: "catalogue" });
    expect(s2.requests[0]?.status).toBe("supplier_confirmation");
    expect(s2.requests[0]?.decision).toBe("approved");
  });

  it("blocks quotes on requests that are not approved", () => {
    const { state, request } = createRequest(seedState(), input, "MG-T2");
    expect(() => addOffer(state, request.id, offer)).toThrow();
  });

  it("requires the shop to tick availability confirmation and give a part reference", () => {
    const s = approved("MG-T4");
    expect(() => addOffer(s, "MG-T4", { ...offer, availabilityConfirmed: false })).toThrow(/confirm/);
    expect(() => addOffer(s, "MG-T4", { ...offer, evidence: " " })).toThrow();
    expect(() => addOffer(s, "MG-T4", { ...offer, availability: "unavailable" })).toThrow();
    const ok = addOffer(s, "MG-T4", offer).requests[0]?.offers[0];
    expect(ok?.availabilityConfirmed).toBe(true);
    expect(ok?.confirmedAt).toBe(ok?.createdAt);
  });

  it("re-checking availability updates the last-confirmed time", async () => {
    let s = addOffer(approved("MG-T5"), "MG-T5", offer);
    const o = s.requests[0]!.offers[0]!;
    await new Promise((r) => setTimeout(r, 5));
    s = setOfferAvailability(s, "MG-T5", o.id, "unavailable");
    const after = s.requests[0]!.offers[0]!;
    expect(after.availability).toBe("unavailable");
    expect(after.confirmedAt! > o.confirmedAt!).toBe(true);
    expect(() => reserveOffer(s, "MG-T5", o.id)).toThrow();
  });

  it("starts with no fabricated activity and counts genuine submissions", () => {
    const seeded = seedState();
    expect(seeded.requests).toEqual([]);
    expect(seeded.feedback).toEqual([]);
    expect(computeMetrics(seeded).requests).toBe(0);
    expect(computeMetrics(seeded).offers).toBe(0);
    let state = addOffer(approved("MG-T3"), "MG-T3", offer);
    state = reserveOffer(state, "MG-T3", state.requests[0]!.offers[0]!.id);
    const m = computeMetrics(state);
    expect(m.requests).toBe(1);
    expect(m.byBuyer.mechanic).toBe(1);
    expect(m.offers).toBe(1);
    expect(m.confirmedOffers).toBe(1);
    expect(m.reservations).toBe(1);
  });

  it("feedback captures sourcing time, pain points, try and pay intent", () => {
    const s = addFeedback(seedState(), {
      role: "mechanic", easeOfUse: 4, confidence: 4, wouldUse: 5, currentMethod: "Ask my mechanic",
      painPoints: ["Knowing if a shop really has it"], timeSpent: "Half a day", wouldTry: "yes", wouldPay: "per_request", consent: true,
    });
    const m = computeMetrics(s);
    expect(m.timeSpent.find((t) => t.key === "Half a day")?.count).toBe(1);
    expect(m.wouldTry.find((t) => t.key === "yes")?.count).toBe(1);
    expect(m.wouldUseHighShare).toBe(1);
    expect(() => addFeedback(seedState(), { role: "other", easeOfUse: 7, confidence: 1, wouldUse: 1, currentMethod: "x", consent: true })).toThrow();
  });

  it("migrates v1 data: keeps real requests and feedback, defaults buyer to car owner", () => {
    const v1 = {
      version: 1,
      feedback: [{ id: "FB-1", createdAt: "2026-01-01", role: "car_owner", easeOfUse: 3, confidence: 3, wouldUse: 3, currentMethod: "Other", consent: true }],
      requests: [
        { ...createRequest(seedState(), input, "PM-OLD").request, buyer: undefined },
        { id: "SAMPLE-VITZ", isSample: true },
      ],
    };
    const m = migrateState(v1);
    expect(m?.version).toBe(2);
    expect(m?.feedback).toHaveLength(1);
    expect(m?.requests.find((r) => r.id === "PM-OLD")?.buyer.type).toBe("car_owner");
    expect(m?.requests.filter((r) => r.isSample)).toHaveLength(0);
    const savedV2 = { ...seedState(), requests: [createRequest(seedState(), input, "MG-REAL").request, { id: "SAMPLE-VITZ", isSample: true }] };
    expect(migrateState(savedV2)?.requests.map((r) => r.id)).toEqual(["MG-REAL"]);
    expect(migrateState({ nope: true })).toBeNull();
  });
});