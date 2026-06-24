# Shared Beta Foundation

## Player Goal

Prepare Neon Fabs for a real friends-only shared beta without breaking the current local prototype.

## Scope

- Add a Cloudflare Worker API skeleton.
- Add D1 schema for beta accounts, inventories, fabs, outputs, markets, patterns, shipments, and logs.
- Add manual tester creation and wipe endpoints.
- Add first server-owned action endpoints for state, collection, pattern creation, market listing/buying/selling, bids, and shipment creation.
- Add API tests that run without a live D1 database.
- Keep the static local prototype working as-is.

## Out Of Scope

- Switching the browser client to server mode.
- Open sign-up or OAuth.
- Payment or monetization.
- Full route combat and routejack beta gameplay.
- Production D1 database creation.

## Likely Files Touched

- `worker/index.mjs`
- `worker/schema.sql`
- `wrangler.jsonc`
- `package.json`
- `tests/beta-api.test.mjs`
- `docs/BACKEND_PLAN.md`
- `docs/BETA_RELEASE_PLAN.md`

## Playtest Checklist

- Run `npm test`.
- Confirm the normal static prototype still opens.
- Confirm `/api/admin/tester` can create a manual tester in Worker dev.
- Confirm `/api/state` returns a beta state with wipe notice.
- Confirm output collection writes inventory server-side.
- Confirm listing reserves items and buying transfers items/credits.
- Confirm shipment creation reserves vehicle and cargo.

## Completion Notes

- This is milestone 1 of the shared beta plan: backend skeleton plus executable API contracts.
- The client is not yet consuming the beta API.
- D1 schema exists, but production database setup still requires Cloudflare-side database creation and config replacement.
