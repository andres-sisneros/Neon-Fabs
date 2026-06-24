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
   - Local prototype mode remains the default until server mode is stable.
3. Server fab loop:
   - Server ticks battery, grams, output rolls, collection, and inventory writes.
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

The browser client still uses local prototype state. The next slice is a beta client mode that can authenticate with a manually issued token and read `/api/state`.

## Release Gates

- `npm test` passes.
- No admin controls in normal player navigation.
- Fresh tester can collect starter output, make first pattern, use market, and send one shipment.
- Two tester accounts can trade through the shared market.
- Beta wipe policy is visible before testers invest time.
