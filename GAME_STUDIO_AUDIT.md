# Game Studio Stabilization Audit

This audit applies the Game Studio plugin direction to the current Neon Fabs prototype. The decision is to evolve the current browser prototype instead of restarting in a canvas or game-engine stack.

## Recommendation

Keep the existing prototype as the playable design sandbox. Do not restart from scratch right now.

Neon Fabs is a text- and systems-heavy asynchronous economy game: fabs, city inventories, markets, contracts, dispatch, route battles, and admin balancing tools. A DOM-first browser app is the correct near-term surface. Phaser, Three.js, or another canvas engine would add rendering complexity without improving the core loop.

## What Is Already Worth Keeping

- Battery to fab output to Print Bay to market/meld progression.
- City-specific inventory and home-city rules.
- Player-driven listing and bid market model.
- Fabs as city-installed machines with print patterns.
- Equipment, boosts, contracts, dispatch, and route battle simulator.
- Wiki, roadmap, lore notes, and balance spreadsheet.
- Desktop and phone browser direction.

## Prototype Debt

- `app.js` currently mixes content data, simulation rules, rendering, event handling, admin tools, and balance sandbox logic.
- UI screens can still feel like equal-weight panels instead of a prioritized game command surface.
- Route battle design has more complexity than the core economy can currently explain to a new player.
- There is no server-authoritative account, market, timer, shipment, or combat state yet.
- The current session-only state is good for design speed but not release-ready persistence.

## Stabilization Target

The next development track should focus on a small, polished vertical slice:

1. Pick home city.
2. Run one starter fab.
3. Open the city Print Bay.
4. Store, sell, recycle, ship, or buy missing items.
5. Fuse the first meld.
6. Rent or buy one second fab.
7. Move one item through a route.

Route battles, advanced modules, and deeper professions should stay visible as simulator/admin systems until this loop feels natural on desktop and phone.

## Architecture Direction

Keep the current static prototype for now, but start separating by responsibility:

- `content`: item, fab, city, route, contract, role, and lore definitions.
- `systems`: fab production, market orders, inventory, melds, dispatch, combat, contracts.
- `ui`: screen rendering, action sheets, confirmation panels, mobile navigation, replay views.
- `admin`: testing tools, time advance, grants, balance simulator.
- `persistence`: currently session reset; later server/account state.

The key Game Studio rule is that simulation owns state and rules, while UI renders state and sends actions.

## UI Direction

The Profile page should act as a compact operator console. It should show status for the current city and a small number of neutral destinations, but it should not recommend the next best action. Contracts provide early guidance; later play should leave room for exploration and strategy.

Keep active UI copy terse. Longer explanations, lore, and system rules belong in Contracts, Wiki, or future contextual help instead of persistent screen paragraphs.

Inventory should read like a backpack: items first, details on demand, advanced bulk controls below the main grid. City changes should be intentional through the map, with other screens summarizing remote markets rather than quietly teleporting the player between cities.

The Fabs page should start with the current city operation: Print Bay output, storage pressure, local fab rate, and active local machines. Broader owned-fab fleet management belongs below that first action surface.

Print Bay collection should not auto-sell or auto-recycle. Low-tier output is part of the economy puzzle, so disposal and market actions stay deliberate.

## Next Refactor Pass

1. Extract content constants into dedicated data files without changing behavior. Done first with `game-content.js`.
2. Extract pure game-rule helpers from render functions. Initial pass done with `game-systems.js`.
3. Add lightweight action wrappers so buttons call named game actions instead of directly mutating state. Initial pass done with `runAction()` for navigation, Print Bay, item detail, city switching, market filters, contracts, and common inventory/market verbs.
4. Keep admin tools working as the verification surface for each extraction.
5. Use browser smoke tests after each slice.
