# Meda Garage — PartMatch MVP

A focused **user-acceptance-testing prototype** for sourcing compatible spare parts in Ethiopia.

## Value proposition under test
Mechanics and car owners should be able to submit a detailed part request, get a manual fitment decision, compare shop-entered availability/price quotes in ETB, and record whether they would use the service.

## Demo flow (one browser/device only)
1. Open **Request a part**. Choose **Mechanic / garage** or **Car owner**. Enter Toyota Corolla / 2010 / cabin air filter / Bole, then submit.
2. In **Specialist review**, select the new request and enter an evidence-backed manual approval.
3. In **Supplier offers**, select the approved request; enter an ETB quote, part reference, and check the stock-confirmation box. Repeat with a second price to compare.
4. In **Buyer requests**, open the request, compare offers and choose **Reserve** (intent only).
5. Record an outcome if appropriate, then select **Give feedback** and visit **UAT dashboard** to view metrics and export CSV.
6. Before each interview, export data from Interview results if needed, then use **Clear pilot data**.

## What works
- Responsive UI for buyer request, specialist review, supplier demo quote, reservation intent, feedback, and research summary.
- Browser-local state with reload persistence, empty initial state, and backward migration that removes legacy fictitious records without removing genuine submissions.
- Manual review and stock confirmation rules. Safety-critical parts are excluded.

## Important limitations
- The same **browser profile and device** must be used across all demo roles; data does **not** sync between phones/computers. No authentication or production database.
- No preloaded suppliers or inventory. Participant-entered quotes are not connected to live stock feeds.
- Quotes are manually entered, not automatically sourced from real shops.
- No payment, actual physical fitment guarantee, binding reservation, delivery or authenticity certification.
- Interview feedback stays in the browser until manually exported as CSV. Do not use sensitive customer information during demo.

## Run locally
Use Bun: `bun install`, then `bun run dev`. Tests: `bun run test`. Build: `bun run build`.

## User acceptance criteria
Observe: request completion without help; ability to explain manual compatibility versus shop availability; quote comparison; task time; willingness to use/pay; and any confusion. No sample records are created; legacy sample records are removed during migration.
