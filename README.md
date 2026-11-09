# Verified Part Match MVP ("PartMatch" — working name)

Research prototype for moderated customer interviews in Addis Ababa. Value proposition under test:
**"Find a compatible, in-stock part before you buy."**

## What is real vs simulated
| Real (works end-to-end) | Simulated |
|---|---|
| 3-step request form + review, validation, photo preview | Suppliers are "Demo supplier A/B/C" — no real shops or inventory |
| Request ID, status tracking, history | No login; workspaces are open demo views |
| Manual specialist review (notes required; evidence required to approve) | Reservation = intent only, no payment/booking |
| Supplier offers in ETB, availability toggles | No AI part identification |
| Fit outcome, feedback survey, CSV export, reset | Data lives in this browser (localStorage) |

Safety-critical parts (brakes, steering, airbags, seat belts…) are blocked. English only; Amharic not yet included (no unreviewed translations).

Storage is behind `StorageAdapter` in `src/lib/pm/store.ts`; swap `localStorageAdapter` for a backend adapter later. Business rules live in `src/lib/pm/logic.ts` (tested in `logic.test.ts`).

## 5-minute demo script
1. **(0:30)** Home → explain disclosure pill. Click **Find my part**.
2. **(1:30)** Participant enters their own car (e.g. Toyota Corolla 2010), a part (e.g. "side mirror glass"), picks a neighborhood, stays anonymous, reviews, sends. Note the request ID.
3. **(1:00)** Interviewer: **Try as specialist** → select the request → "Approve fitment" with notes + evidence.
4. **(1:00)** **Try as supplier** → propose two offers (different price/availability).
5. **(0:45)** **Try as customer** → open request → compare offers → **Reserve** → record "Did the part fit?".
6. **(0:15)** Participant clicks **Give feedback**. Interviewer opens **View interview results**.

Sample journeys (Toyota Vitz cabin air filter, Suzuki Swift wiper blade) are tagged "Sample data" and excluded from all metrics.

## Acceptance metrics (per interview round, ≥ 8 participants)
- Task completion: ≥ 80% submit a request without moderator help, in ≤ 3 minutes.
- Offer comprehension: ≥ 80% correctly explain that fitment and stock are checked separately.
- Confidence in match: average ≥ 3.5 / 5.
- Willingness to use: average ≥ 3.5 / 5, and ≥ 50% answer 4 or 5.
- Reservation intent: ≥ 50% of participants reserve an offer.
- Zero participants believe a real payment or booking happened.

## Reset between sessions
Interview results → **Reset demo** (confirm). Export CSVs first.