# Active Roadmap

This is the short current roadmap. Historical roadmap detail lives in `docs/archive/FEATURE_ROADMAP_LEGACY.md`.

## Now

1. Stabilize the first-session loop on GitHub Pages.
2. Make reputation the visible long-term player goal.
3. Keep early UI progressively revealed instead of showing every system at once.
4. Focus on game mechanics and systems before deeper creative writing.
5. Make content authoring easy through `content/creative-overrides.js` and `design/`, but do not block mechanics on final names or lore.
6. Reduce code/context sprawl before adding larger systems.
7. Keep Dispatch useful, but avoid making route combat the main learning burden.
8. Use Admin Test Lab scenarios for faster feature checks.
9. Keep player-facing docs clean while archiving older prototype notes.
10. Build shared beta backend in milestones without breaking local prototype mode.

## Next Build Slices

### 1. First-Session Polish

- Tighten home city selection.
- Make first Print Bay collection feel satisfying.
- Keep first inventory and market decisions obvious without over-explaining.
- Make first meld creation feel like a reputation milestone.

### 2. Reputation Progression

- Expand Collection Rep beyond the first pattern-completion slice.
- Add city and role boards without overwhelming first-session UI.
- Decide final canon name for "melds" before polishing public profile language.

### 3. Progressive Reveal

- Keep new surfaces hidden until their related contract or role milestone.
- Add a lightweight optional systems drawer later if playtesters want to know what exists.
- Keep public-release debug tools behind admin/debug mode; prototype Admin now starts with Test Lab scenarios.
- Let Admin become a desktop-first workbench instead of forcing it into the mobile player UI.

### 4. Dispatch Simplification

- Keep role-specific dispatch surfaces.
- Make Merchant route selection, vehicle selection, and cargo loading feel less form-like.
- Keep setup and active jobs visible first; tuck completed records and logs behind a records drawer.
- Keep route encounters PvE and readable.
- Move advanced battle tuning to Admin.

### 5. Economy And Inventory Systems

- Make market and inventory decisions clearer without adding more buttons.
- Keep city-local inventory and city-local markets central.
- Add Test Lab scenarios before changing any market, inventory, or route economy loop.
- Watch for places where automation removes strategic choice.

### 6. Code Modularization

- Market UI renderers have been extracted to `ui-market.js`; extract Market CSS once the layout settles.
- Extract low-risk pure helpers first.
- Avoid broad rewrites.
- Keep each extraction behavior-preserving and covered by smoke tests.

### 7. Creative Starter Set

Parked until core mechanics feel steadier.

- Rename Starter Fab components.
- Rename starter patterns or final replacement for "melds."
- Add city flavor hooks.
- Add item flavor only where it appears naturally in detail views.
- Grow the new player Wiki only after language and systems stabilize.

### 8. Shared Beta Backend

- Keep local prototype mode working while server mode is added behind an explicit beta path.
- Use Cloudflare Worker API and D1 for the friends-only shared beta.
- Server mode now owns the playable core loop slice: Profile, Fabs, Inventory, Patterns, Market, Map, and Merchant Dispatch render from beta server state when connected.
- Next backend slices should harden server mode instead of expanding unsupported systems too early: inventory capacity rules, clearer market review tray parity, beta account management, and D1 deployment checks.
- Keep beta progress wipeable until economy and schema are stable.

## Later

- Open sign-up and public shared economy.
- Server-authoritative route combat beyond Dispatch PvE lite.
- Route modules only after core route combat is understandable.
- Real asset pipeline for city atmosphere, fabs, vehicles, and item art.
