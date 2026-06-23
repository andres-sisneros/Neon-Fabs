# Active Roadmap

This is the short current roadmap. Historical roadmap detail lives in `docs/archive/FEATURE_ROADMAP_LEGACY.md`.

## Now

1. Stabilize the first-session loop on GitHub Pages.
2. Make content authoring easy through `content/creative-overrides.js` and `design/`.
3. Reduce code/context sprawl before adding larger systems.
4. Keep Dispatch useful, but avoid making route combat the main learning burden.

## Next Build Slices

### 1. First-Session Polish

- Tighten home city selection.
- Make first Print Bay collection feel satisfying.
- Make first inventory/market decision obvious without over-explaining.
- Make first meld creation feel like a milestone.

### 2. Creative Starter Set

- Rename Starter Fab components.
- Rename starter melds.
- Add city flavor hooks.
- Add item flavor only where it appears naturally in detail views.

### 3. Dispatch Simplification

- Keep role-specific dispatch surfaces.
- Make Merchant route selection, vehicle selection, and cargo loading feel less form-like.
- Keep route encounters PvE and readable.
- Move advanced battle tuning to Admin.

### 4. Code Modularization

- Extract low-risk pure helpers first.
- Avoid broad rewrites.
- Keep each extraction behavior-preserving and covered by smoke tests.

## Later

- Backend accounts and shared economy.
- Server-authoritative fab output, markets, shipments, and encounters.
- Route modules only after core route combat is understandable.
- Real asset pipeline for city atmosphere, fabs, vehicles, and item art.
