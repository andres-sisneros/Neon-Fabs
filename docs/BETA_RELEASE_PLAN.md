# Early Shared Beta Release Plan

## Target

Early beta means a real shared online test for manually approved friends. It should prove the core loop is fun before the game has every advanced system.

- Hosting: Cloudflare Pages client plus Cloudflare Worker API.
- Database: Cloudflare D1.
- Access: friends/manual tester accounts only.
- Progress: wipes expected.
- Success: testers understand the loop and want to check back later.

## Beta 1 Scope

- Manual tester accounts.
- Server-owned player state, city inventory, fabs, Print Bay output, patterns, reputation, markets, and shipments.
- Shared city-local markets with reserved listings and bids.
- Merchant shipping with light PvE route encounter placeholders.
- Desktop-only admin tools for testers, wipe/reset, economy inspection, and future encounter testing.
- Local static prototype remains available for design experiments.

## Milestones

1. Backend foundation:
   - Worker API.
   - D1 schema.
   - Manual tester endpoint.
   - API smoke tests.
2. Server state mode:
   - Browser can load a beta account from `/api/state`.
   - A connected beta test account now makes server runtime the primary path for supported screens.
3. Server fab loop:
   - Server ticks battery, grams, output rolls, collection, and inventory writes.
   - Normal Fabs / Print Bay collection now uses `POST /api/fabs/collect` when a beta test account is connected.
4. Shared market:
   - Server owns listings, bids, buys, sells, and transaction history.
5. Patterns and reputation:
   - Server owns pattern creation, battery capacity rewards, and basic beta boards.
6. Dispatch PvE lite:
   - Server owns shipments, arrivals, cargo transfers, and simple designed encounter outcomes.
7. Beta polish gate:
   - Mobile pass.
   - First-session pass.
   - Player-facing beta wiki.
   - Clear wipe warning.
   - Manual checklist plus automated tests.

## Current Implementation

The first foundation slice now exists:

- `worker/index.mjs`: Worker API and in-memory test repo.
- `worker/schema.sql`: D1 schema.
- `wrangler.jsonc`: Cloudflare Worker config with D1 binding placeholder.
- `tests/beta-api.test.mjs`: API contract tests.
- `beta-client.js`: browser-side beta API helper for connected test accounts, internal auth, and `/api/state` loading.

Admin has a Beta Test Account panel that can create and connect manual testers against a live Worker, then inspect server state from `/api/state`. A Beta Shell can open that loaded server state in a player-like layout. Normal Fabs / Print Bay collection now switches to server-owned state whenever a beta test account is connected; clearing the account returns to local prototype mode. Tester tokens remain internal auth and are only exposed inside Advanced Connection for debugging.

## Release Gates

- `npm test` passes.
- No admin controls in normal player navigation.
- Fresh tester can collect starter output, make first pattern, use market, and send one shipment.
- Two tester accounts can trade through the shared market.
- Beta wipe policy is visible before testers invest time.
