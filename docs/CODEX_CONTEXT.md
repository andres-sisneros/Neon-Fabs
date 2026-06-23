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

## Important Boundaries

- Do not rewrite the app into a framework yet.
- Do not move large code blocks unless the refactor has a narrow testable goal.
- Do not remove historical design notes unless they have been archived.
- Preserve static hosting compatibility.
- Keep phone-browser usability in mind for every UI change.
- Prefer terse UI copy; longer explanations belong in `docs/WIKI.md` or future contextual help.

## Current File Map

- `index.html`: static app shell and script order.
- `app.js`: rendering, event handling, admin panels, and most UI views.
- `game-systems.js`: game rules, player actions, markets, dispatch, route combat, and save logic.
- `game-content.js`: content catalogs, default state, cities, roles, items, fabs, encounters, and creative override hooks.
- `dispatch-flow.js`: dispatch wizard behavior.
- `content/creative-overrides.js`: author-facing names/flavor/art hooks.
- `design/`: rough lore, naming, and art direction.
- `docs/`: active planning, rules, playtest, backend, and archived notes.
- `tests/smoke.spec.js`: desktop and phone smoke tests.

## How To Work

For a new feature, create or update a file in `docs/features/` first. Keep it short:

- player goal
- scope
- out of scope
- files likely touched
- test checklist

Then implement the smallest playable slice and run `npm test` when behavior or UI changes.

## Current Refactor Rule

Simulation owns outcomes. UI renders state and sends actions into systems. Future extraction should move toward:

- `src/content/`
- `src/systems/`
- `src/ui/`
- `src/admin/`
- `src/persistence/`

See `docs/MODULARIZATION_PLAN.md`.
