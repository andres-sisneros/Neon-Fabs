# Code Hygiene: Market Extraction

## Player Goal

No direct player-facing change. This pass makes future market and dispatch work easier to understand, test, and change without rereading the largest app file.

## Scope

- Move Market view rendering helpers out of `app.js` into a dedicated UI file.
- Keep existing Market behavior and layout unchanged.
- Update script loading and project docs so future Codex sessions know where the Market surface lives.

## Out Of Scope

- Market rules, pricing, listings, bids, or player economy behavior.
- Large framework migration.
- CSS extraction unless it is a safe follow-up slice.

## Likely Files Touched

- `index.html`
- `app.js`
- `ui-market.js`
- `docs/CODEX_CONTEXT.md`
- `docs/MODULARIZATION_PLAN.md`
- `docs/ROADMAP.md`

## Acceptance Checklist

- Market still opens in Sell, Buy, and Orders modes.
- Item detail and order actions still route through existing handlers.
- Desktop and phone smoke tests pass.
- App remains static-host compatible.

## Implementation Notes

- Market render helpers moved from `app.js` to `ui-market.js`.
- `index.html` now loads `ui-market.js` before `app.js`.
- Market CSS remains in `styles.css` for a future low-risk extraction pass.

## Docs Touched

- `docs/CODEX_CONTEXT.md`
- `docs/MODULARIZATION_PLAN.md`
- `docs/ROADMAP.md`
- `README.md`

## Remaining Risks

- Market CSS is still part of the global stylesheet.
- Market event handlers still live in `app.js`.
