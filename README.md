# Neon Fabs

Neon Fabs is a static browser prototype for an asynchronous cyberpunk economy game inspired by MineThings-style fabs, city inventories, markets, melds, and route dispatch.

## Start Here

- `docs/CODEX_CONTEXT.md`: compact project context for Codex and future contributors.
- `docs/ROADMAP.md`: current active roadmap only.
- `docs/DESIGN_DECISIONS.md`: locked design decisions and working assumptions.
- `docs/MODULARIZATION_PLAN.md`: how the large prototype files should be split over time.
- `docs/features/`: one-page briefs for planned feature work.
- `content/creative-overrides.js`: safe player-facing names, flavor, and lore overrides.
- `design/`: rough lore, naming, and art-direction workspace.

## Local Testing

```powershell
npm run serve
```

For same-Wi-Fi phone testing:

```powershell
npm run serve:lan
```

For automated smoke tests:

```powershell
npm test
```

## Current Architecture

The current prototype is intentionally DOM-first and static:

- `game-content.js`: default data, catalogs, starting state, and content helpers.
- `game-systems.js`: simulation rules, state transitions, economy, dispatch, combat, and persistence.
- `app.js`: rendering, UI orchestration, action sheets, admin panels, and browser events.
- `dispatch-flow.js`: dispatch wizard interactions.
- `styles.css` and `dispatch-flow.css`: app styling.

The near-term goal is not a rewrite. It is to split responsibilities gradually while keeping the playable prototype stable.
