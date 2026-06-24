# Neon Fabs

Neon Fabs is a static browser prototype for an asynchronous cyberpunk economy game inspired by MineThings-style fabs, city inventories, markets, melds, and route dispatch.

## Start Here

- `docs/CODEX_CONTEXT.md`: compact project context for Codex and future contributors.
- `docs/CHANGE_PROCESS.md`: required feature and documentation workflow.
- `docs/ROADMAP.md`: current active roadmap only.
- `docs/DESIGN_DECISIONS.md`: locked design decisions and working assumptions.
- `docs/MODULARIZATION_PLAN.md`: how the large prototype files should be split over time.
- `docs/features/`: one-page briefs for planned feature work.
- `content/creative-overrides.js`: safe player-facing names, flavor, and lore overrides.
- `design/`: rough lore, naming, and art-direction workspace.
- `assets/` and `ASSET_CREDITS.md`: bundled art/audio and license tracking.
- `docs/ASSET_PIPELINE.md`: rules for adding open or third-party assets.

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
- `ui-scenes.js`: reusable pixel scene and static fab visual components.
- `ui-first-session.js`: first-run, Profile command deck, Print Bay, and collection reveal rendering helpers.
- `ui-intro.js`: first-load intro overlay and replay/bypass switches.
- `ui-market.js`: Market page rendering helpers.
- `app.js`: rendering, UI orchestration, action sheets, admin panels, and browser events.
- `dispatch-flow.js`: dispatch wizard interactions.
- `styles.css` and `dispatch-flow.css`: app styling.

The near-term goal is not a rewrite. It is to split responsibilities gradually while keeping the playable prototype stable.
