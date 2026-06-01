# Backend Plan

## Recommended Approach

Use a server-authoritative web app with a relational database. The browser should become a client only; timers, batteries, shipments, markets, raids, and fab output should be resolved by the server.

Good prototype stack:

- App: Node/Express or Next.js
- Database: PostgreSQL
- Auth: session or OAuth provider
- Jobs: server cron/queue for shipment arrivals and lease expiration

## Core Tables

- `users`: account, display name, credits, chips, role, home city, battery seconds
- `cities`: city definitions, storage base limits
- `items`: item definitions, rarity, category, fab source, effects
- `inventories`: user, city, item, quantity
- `melds`: user, meld id, home city
- `fabs`: stable fab id, user, type, city, rate, mode, stored grams, owned/rented, installed at, rented until
- `fab_equipment`: fab id, equipment slot, item id
- `fab_outputs`: output id, fab id, city, item id, hidden/revealed state, created at
- `market_listings`: city, item, seller, quantity, price
- `market_bids`: city, item, buyer, quantity, price, reserved credits
- `shipments`: user, from city, to city, cargo, vehicle, status, timestamps, risk
- `stolen_goods`: item, quantity, victim, raider, route, timestamp
- `transactions`: market and admin audit log

## Anti-Cheat Boundaries

- Client never decides item drops, shipment results, credit payouts, market fills, or battery drain.
- Server calculates elapsed time from trusted timestamps.
- Market bids reserve credits server-side.
- Listings reserve items server-side.
- Shipment cargo and vehicles leave inventory immediately.
- Raided cargo moves to a stolen-goods record instead of disappearing.

## Offline Progress

On login or refresh, server computes elapsed time since the last trusted tick:

- Drain battery up to available capacity.
- Accumulate fab grams.
- Roll item output server-side.
- Resolve shipments whose arrival time has passed.
- Expire rented fabs.

## Current Local Prototype Mapping

The current browser save mirrors these concepts in `localStorage`. It is useful for design testing, but not secure for multiplayer or real economies.

- Local `state.fabs` now behaves like future `fabs` rows: each fab has a stable `id`, type, city, rate, stored grams, equipment, ownership status, and lease timestamp.
- Local queued output records can store `fabId`, `cityId`, and `fabType`, matching the future `fab_outputs` table.
- Local city inventories already map cleanly to `inventories`.
- Local market listings and bids already reserve goods/credits in the same way the server should.

## Account Migration Path

1. Keep the local prototype schema close to the future database rows.
2. Add a backend endpoint that can import/export one local save for a signed-in user.
3. Move server-authoritative systems one at a time: markets first, then shipments, then fab ticking.
4. Once server ticking owns fab output, the browser should only request collection and display revealed results.
