import type { AppState } from "./types";

// SAMPLE DATA ONLY. No real people, garages, suppliers or inventory.
// Quotes below were typed by the prototype team to illustrate the flow.
export function seedState(): AppState {
  return {
    version: 2,
    feedback: [],
    requests: [
      {
        id: "SAMPLE-VITZ",
        isSample: true,
        createdAt: "2026-11-02T08:30:00.000Z",
        buyer: { type: "mechanic", garageName: "Sample garage (demo)" },
        vehicle: { brand: "Toyota", model: "Vitz", year: 2008, engine: "1.3L 2SZ-FE" },
        part: { name: "Cabin air filter", description: "Behind the glove box. Old one is very dusty.", partNumber: "SAMPLE-87139" },
        contact: { anonymous: true, consent: false },
        neighborhood: "Bole",
        status: "offer_ready",
        decision: "approved",
        reviewNotes: [
          {
            at: "2026-11-02T10:05:00.000Z",
            decision: "approved",
            text: "Sample rationale: model year and engine match the filter size for this generation.",
            evidence: "Sample evidence: catalogue size reference for 2005–2010 Vitz, glove-box housing.",
          },
        ],
        offers: [
          {
            id: "SAMPLE-OF1",
            supplierLabel: "Demo supplier A",
            priceEtb: 850,
            availability: "in_stock",
            neighborhood: "Bole",
            condition: "oem_equivalent",
            notes: "Sample quote — not a real shop.",
            createdAt: "2026-11-02T13:00:00.000Z",
            availabilityConfirmed: true,
            evidence: "Sample: box label photo matched part number",
            confirmedAt: "2026-11-02T13:00:00.000Z",
          },
          {
            id: "SAMPLE-OF2",
            supplierLabel: "Demo supplier B",
            priceEtb: 1200,
            availability: "can_source",
            neighborhood: "Merkato",
            condition: "new",
            notes: "Sample quote — can source in about 2 days.",
            createdAt: "2026-11-02T15:20:00.000Z",
            availabilityConfirmed: true,
            evidence: "Sample: wholesaler confirmed by phone",
            confirmedAt: "2026-11-02T15:20:00.000Z",
          },
        ],
        history: [
          { at: "2026-11-02T08:30:00.000Z", label: "Received", note: "Sample request submitted." },
          { at: "2026-11-02T09:10:00.000Z", label: "Fitment review", note: "Specialist started manual review." },
          { at: "2026-11-02T10:05:00.000Z", label: "Waiting for shop quotes", note: "Fitment approved manually by specialist. Sent to shops." },
          { at: "2026-11-02T13:00:00.000Z", label: "Quotes ready", note: "Demo supplier A quoted ETB 850 (entered manually)." },
          { at: "2026-11-02T15:20:00.000Z", label: "Quotes ready", note: "Demo supplier B quoted ETB 1,200 (entered manually)." },
        ],
      },
      {
        id: "SAMPLE-SWIFT",
        isSample: true,
        createdAt: "2026-11-03T07:45:00.000Z",
        buyer: { type: "car_owner" },
        vehicle: { brand: "Suzuki", model: "Swift", year: 2012 },
        part: { name: "Front wiper blade (driver side)", description: "Rubber is cracked and streaking." },
        contact: { anonymous: true, consent: false },
        neighborhood: "Kazanchis",
        status: "compatibility_review",
        decision: "pending",
        reviewNotes: [],
        offers: [],
        history: [
          { at: "2026-11-03T07:45:00.000Z", label: "Received", note: "Sample request submitted." },
          { at: "2026-11-03T08:15:00.000Z", label: "Fitment review", note: "Specialist started manual review." },
        ],
      },
    ],
  };
}