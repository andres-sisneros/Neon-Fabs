# Market V2

## Player Goal

Let a player quickly answer, "What can I sell here, what is useful to buy here, and what orders do I have open?" without browsing the entire item database.

## Scope

- Keep the market city-local by default.
- Keep the order-driven model: listings, bids, and player orders.
- Keep three player modes: Sell, Buy, Orders.
- Sell shows local inventory first.
- Buy opens as a city-market landing page instead of a full catalog:
  - Search Market
  - Needed For Patterns
  - Local Listings
  - Watched Items when relevant
  - Browse Categories
- Category tiles and search drill into focused result lists.
- Item Details remains the deeper order-book surface for listings, bids, cross-city snapshots, and order placement.

## Out Of Scope

- Shared multiplayer market.
- Server-authoritative order matching.
- Real price charts.
- Player-to-player fab market.
- Removing NPC-seeded liquidity.

## Likely Files Touched

- `app.js`
- `styles.css`
- `game-content.js`
- `game-systems.js`
- `docs/WIKI.md`
- `docs/DESIGN_DECISIONS.md`

## Doc Impact

- `docs/WIKI.md`: updated Market rules and current player-facing flow.
- `docs/DESIGN_DECISIONS.md`: locked city-first market UX and intent-first mobile surfaces.
- `docs/ROADMAP.md`: added Market UI/CSS extraction as a modularization follow-up.
- `docs/features/market-v2.md`: added this feature brief retroactively after the redesign landed.

## Playtest Checklist

- Open Market on desktop and phone.
- Sell mode shows only current-city holdings.
- Buy mode starts with curated sections, not a long full catalog.
- Search in Buy mode opens focused results.
- Category tiles open focused results.
- Orders mode shows active player listings and bids.
- Item Details still supports buying, selling, listing, and posting bids.
- Run `npm test`.

## Completion Notes

- Implemented Sell / Buy / Orders market modes.
- Reworked Buy into a city-market landing page with pattern needs, local listings, watched items, and category tiles.
- Preserved item detail as the deeper order-book surface.
- Tests run: `npm test` passed with 42 smoke tests.
- Remaining risk: Market UI and CSS now deserve extraction into dedicated files once the UX settles.
