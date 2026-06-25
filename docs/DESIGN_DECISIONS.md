# Design Decisions

This file tracks decisions that should not be reopened casually.

## Product Direction

- Neon Fabs evolves the current DOM-first browser prototype.
- Do not restart in Phaser, Three.js, or a framework while the game is still systems/UI heavy.
- Static hosting is valid for solo and friend playtests, but not for shared multiplayer economy.
- A future mobile app is a real goal, so phone-browser ergonomics matter now.

## Core Loop

- Players start with one free Starter Fab.
- Players can run up to three active fabs.
- Additional fabs are bought or rented.
- Fabs belong to cities.
- Inventory is city-local.
- Players can view any city, but changing the viewed city should feel intentional, primarily through the map.
- Melds are created only in the home city.
- Each meld currently adds one hour of battery capacity.
- Print Bay collection reveals sealed output and recharges battery.
- If city inventory is full, collection should be blocked or leave output sealed until there is room.

## Fabs

- Fabs are controlled printers, not mystery boxes.
- Players choose a print pattern.
- `Random` is the default for multi-pattern fabs to reduce early micromanagement.
- Rarity means print quality, defects, material precision, or civic permission quality.
- Output rate is grams/hour.
- The current target is low output volume, closer to a few meaningful items per hour than constant loot spam.

## Economy

- Markets should be listing/bid driven, not top-down percentage pricing.
- Shared beta markets are player-only by default. NPC orders should be explicit test/admin content, not hidden market seeding.
- Market UX should be city-first. The landing page should answer what can be sold, bought, or managed in the current city rather than dumping the full item catalog.
- The Buy surface should use curated shelves and category drilldowns. Full order-book depth belongs in item detail views.
- Market Sell is the main economy action surface for owned goods.
- Inventory is storage-first: city capacity, filters, compact item grid, and item-level handoffs.
- Low-tier items should not be treated as automatic junk.
- Auto-sell/recycle from Print Bay was removed so players make deliberate economy choices.
- Recycling exists as a fallback for clearing inventory.

## Roles

- One active profession at a time.
- Drifter: simpler credit-oriented baseline.
- Merchant: primary shipping role.
- Routejack: PvE raid role against designed NPC targets.
- Fabricator: fab efficiency role.
- Bounty Hunter is removed from active prototype scope for now.

## Routes

- Route encounters are PvE for now.
- Route danger should come from designed encounter rates, not visible arbitrary danger percentages.
- Dispatch should prioritize the current role's launch flow and active jobs. Completed records, logs, and replays should remain available without being always-open dashboard clutter.
- Encounter rates are tuned per mile.
- Designed encounters should be editable without digging through combat code.
- Winning a route encounter may reduce route pressure later, but the current prototype should stay readable.

## UI

- Keep UI clean, tight, and minimal.
- Do not put long system explanations in every screen.
- Use contracts, wiki, and contextual detail panels for teaching.
- Keep actions contextual. Avoid huge button walls.
- Prefer intent-first surfaces over database views, especially on mobile.
- Use in-app panels instead of browser-native popups.

## Prototype Testing

- Admin should behave like a small QA studio, not one flat tool drawer.
- Admin may become an almost separate desktop-first workbench experience, even while it still shares the same static app, local state, and game systems.
- Admin does not need to satisfy the same mobile ergonomics as the player game while it remains a developer-only surface.
- Test Lab scenarios should be the first Admin surface for new feature testing.
- Raw debug powers, balance tools, encounter editors, and save tools should remain available but grouped by purpose.
- Player-facing wiki content should stay compact and stable. Prototype-era rules dumps belong in archive, feature briefs, design decisions, or system docs.

## Shared Beta Runtime

- When a beta account is connected, supported player screens should render from server state and call server actions instead of mutating browser-local prototype state.
- Local prototype mode remains a design/testing fallback when no beta account is connected.
- All connected beta accounts share one server beta clock.
- Admin time tools advance that shared beta clock globally.
- Beta progress is wipeable until schema, economy, and account rules stabilize.
