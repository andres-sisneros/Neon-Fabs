# Modularization Plan

The app currently works as a static prototype with a few large files. The goal is to reduce cognitive load without destabilizing the playable build.

## Current Hotspots

- `app.js`: rendering, event wiring, admin UI, action sheets, view state, and some formatting.
- `game-systems.js`: most rules and state transitions, including market, dispatch, combat, inventory, persistence, and contracts.
- `game-content.js`: content catalogs, default state, creative overrides, items, fabs, roles, cities, and encounter data.
- `styles.css`: global app styles for every surface.
- `ui-scenes.js`: reusable visual scene renderers extracted from `app.js`.
- `ui-first-session.js`: first-session Profile and Print Bay renderers extracted from `app.js`.

## Target Shape

```text
src/
  main.js
  content/
    items.js
    fabs.js
    cities.js
    roles.js
    encounters.js
  systems/
    state.js
    inventory.js
    fabs.js
    market.js
    melds.js
    dispatch.js
    combat.js
    contracts.js
    persistence.js
  ui/
    render.js
    shell.js
    views/
      profile.js
      fabs.js
      inventory.js
      market.js
      melds.js
      dispatch.js
      admin.js
    components/
      action-sheet.js
      item-card.js
      fab-card.js
      map.js
  admin/
    balance-tools.js
    encounter-editor.js
  utils/
    format.js
    random.js
```

This is a direction, not a single refactor.

## Extraction Order

### Pass 1: Content Data

Move stable data tables out of `game-content.js` once script loading can support modules or generated bundles.

Good candidates:

- rarity metadata
- city definitions
- fab catalog
- item catalogs
- role definitions
- route encounter defaults

### Pass 2: Pure Formatters

Extract helpers that do not mutate state.

Good candidates:

- credit formatting
- time formatting
- rarity labels
- item labels
- route labels
- capacity summaries

### Pass 3: Inventory And Market Systems

Extract inventory and market actions from `game-systems.js` behind stable functions.

Success criteria:

- existing UI calls the same named actions
- tests still pass
- no change to save shape

### Pass 4: Fab Production

Extract fab ticking, output rolls, Print Bay collection, and boost/equipment application.

Success criteria:

- battery behavior unchanged
- sealed output behavior unchanged
- admin time advance still works

### Pass 5: Dispatch And Combat

Split dispatch setup, route travel, encounter rolling, and combat simulation.

Success criteria:

- Merchant shipment tests pass
- Routejack encounter tests pass
- Admin simulator still runs designed encounters

### Pass 6: UI Views

Only split UI views after systems are smaller. UI extraction should happen one screen at a time.

Initial extraction done:

- `ui-scenes.js` owns reusable pixel scene and fab tile renderers.
- `ui-first-session.js` owns first-run, Profile command deck, collection reveal, and city Print Bay command renderers.

Start with lower-risk screens:

- contracts
- wiki
- profile

Leave Dispatch/Admin for later because they are still changing quickly.

## Rules For Refactor PRs

- One responsibility per PR/commit.
- Behavior-preserving unless the feature brief says otherwise.
- Update `docs/CODEX_CONTEXT.md` when the file map changes.
- Run `npm test` after code movement.
- Keep GitHub Pages static deployment working.
