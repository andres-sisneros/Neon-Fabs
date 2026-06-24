# Codex Context

Read this first before making changes.

## Project

Neon Fabs is a browser-first static prototype for an asynchronous cyberpunk economy game. Players run city-installed fabs, open Print Bay output, manage local city inventories, buy/sell through city markets, fuse melds in their home city, and dispatch vehicles on routes.

The prototype is deployed to GitHub Pages and still uses browser-local saves. It is not yet a shared multiplayer economy.

## Current Priority

Keep the first-session loop readable on desktop and phone:

1. Choose a home city.
2. Run the Starter Fab.
3. Open the current city's Print Bay.
4. Manage inventory and market actions.
5. Fuse a first meld.
6. Try route dispatch once the player has vehicles.

Do not let route combat complexity overwhelm the core economy loop.

Near-term work should prioritize mechanics, economy clarity, Dispatch, inventory, reputation, testing tools, and code hygiene. Creative writing, final item names, deeper lore, and player wiki expansion are intentionally parked until systems feel steadier.

## Important Boundaries

- Do not rewrite the app into a framework yet.
- Do not move large code blocks unless the refactor has a narrow testable goal.
- Do not remove historical design notes unless they have been archived.
- Preserve static hosting compatibility.
- Keep phone-browser usability in mind for every player-facing UI change.
- Admin/Test Lab is developer-only and may be desktop-first.
- Prefer terse UI copy; player-facing explanations belong in `docs/WIKI.md` or future contextual help. Prototype/design explanations belong in feature briefs, `docs/DESIGN_DECISIONS.md`, `docs/systems/`, or `docs/archive/`.

## Current File Map

- `index.html`: static app shell and script order.
- `app.js`: rendering, event handling, admin panels, and UI orchestration for views not yet extracted.
- `game-systems.js`: game rules, player actions, markets, dispatch, route combat, and save logic.
- `game-content.js`: content catalogs, default state, cities, roles, items, fabs, encounters, and creative override hooks.
- `dispatch-flow.js`: dispatch wizard behavior.
- `ui-scenes.js`: reusable pixel scene and static fab visual components.
- `ui-first-session.js`: first-run, Profile command deck, Print Bay, and collection reveal rendering helpers.
- `ui-intro.js`: first-load intro overlay that establishes the game world before the app UI.
- `ui-market.js`: Market page rendering helpers for Sell, Buy, Orders, and focused item/category browsing.
- `worker/index.mjs`: Cloudflare Worker API foundation for the future shared beta.
- `worker/schema.sql`: D1 schema for beta accounts, inventories, fabs, markets, patterns, shipments, and logs.
- `wrangler.jsonc`: Cloudflare Worker config with D1 binding placeholder.
- `content/creative-overrides.js`: author-facing names/flavor/art hooks.
- `assets/`: bundled art/audio assets.
- `ASSET_CREDITS.md`: required third-party asset license tracking.
- `design/`: rough lore, naming, and art direction.
- `docs/`: active planning, player wiki, playtest, backend, system notes, and archived notes.
- `docs/BETA_RELEASE_PLAN.md`: shared online beta target, milestones, and gates.
- `tests/smoke.spec.js`: desktop and phone smoke tests.
- `tests/beta-api.test.mjs`: Worker API contract tests.

## How To Work

For a new feature, UX redesign, systems change, balance pass, or refactor, follow `docs/CHANGE_PROCESS.md`.

Create or update a file in `docs/features/` before implementation when the change is meaningful. Keep it short:

- player goal
- scope
- out of scope
- files likely touched
- test checklist

Then implement the smallest playable slice and run `npm test` when behavior or UI changes.

Before finishing, update docs when the change affects:

- player-facing rules or terminology: `docs/WIKI.md`
- locked design choices: `docs/DESIGN_DECISIONS.md`
- current priorities: `docs/ROADMAP.md`
- file map or architecture: this file and `docs/MODULARIZATION_PLAN.md`
- content/lore/naming: `content/creative-overrides.js` or `design/`

In the final response, state which docs changed or why no doc update was needed.

## Current Refactor Rule

Simulation owns outcomes. UI renders state and sends actions into systems. Future extraction should move toward:

- `src/content/`
- `src/systems/`
- `src/ui/`
- `src/admin/`
- `src/persistence/`

See `docs/MODULARIZATION_PLAN.md`.
