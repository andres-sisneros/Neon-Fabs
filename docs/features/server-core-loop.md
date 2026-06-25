# Server-Backed Core Loop

## Player Goal

Let a connected beta account play the first shared-economy loop from normal player screens: collect prints, view city inventory, create the first pattern, use the player market, and send a merchant shipment.

## Scope

- Normal server-mode screens render from `NeonBetaClient` state for Profile, Fabs, Inventory, Patterns, Market, Map, and Dispatch.
- Server actions are wired for pattern creation, market listing/bidding/buying/selling/canceling, recycling, and merchant shipping.
- Worker state owns the beta loop when connected.
- All beta accounts share one beta clock.
- Admin beta tools can grant a small test bundle and globally advance beta time.
- Dispatch beta v1 is merchant shipping with PvE-lite arrival notes and freight payout.

## Out Of Scope

- Routejack server gameplay.
- Full auto-battler route combat.
- Equipment, boosts, fab shop purchases, and role progression on the server.
- Public login or friend-facing account UX.
- NPC market orders.

## Files Touched

- `worker/index.mjs`
- `worker/schema.sql`
- `beta-client.js`
- `app.js`
- `tests/beta-api.test.mjs`
- `tests/smoke.spec.js`

## Playtest Checklist

- Connect/create a beta account in Admin.
- Use Fabs to collect server Print Bay output.
- Open Inventory and confirm city-local server items appear.
- Create the starter pattern from home-city items.
- List and recycle one current-city item from Market Sell.
- Use two beta accounts or API tests to verify a player-only listing purchase.
- Grant a test bundle, send a merchant shipment, advance global beta time, and confirm arrival plus freight payout.
- Clear beta account and confirm local prototype mode still works.

## Notes

- Tokens remain internal auth plumbing. The UI should talk about beta accounts, not tokens.
- Local prototype mode is now a fallback/design sandbox when no beta account is connected.
