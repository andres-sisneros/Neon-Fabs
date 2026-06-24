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
- Market UX should be city-first. The landing page should answer what can be sold, bought, or managed in the current city rather than dumping the full item catalog.
- The Buy surface should use curated shelves and category drilldowns. Full order-book depth belongs in item detail views.
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
