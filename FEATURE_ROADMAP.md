# Neon Fabs Feature Roadmap

This is the working feature tracker for the MineThings-inspired cyberpunk economy game. The goal is to build in small playable slices while preserving the bigger strategy: fabs, batteries, meld progression, city inventories, markets, routes, vehicles, and professions.

## Core Design Rules

- Players can run a limited number of fabs at one time.
- Every player starts with one free starter fab.
- Fabs belong to specific cities.
- Players can view any city instantly, but items are stored per city.
- The player has one home city.
- Melds are created only from items stored in the home city.
- Each meld increases battery capacity by 1 hour.
- Battery drains in real time while fabs are active.
- Collecting fab output reveals the hidden results and recharges battery to max.
- Players can choose to fab items or generate currency.
- Other fabs should be acquired through premium purchase, rental, or player markets later.
- Fabs should accumulate output mass continuously, then roll for results when enough mass has accumulated.
- A result roll can produce no item; this should usually be the most common outcome.

## Proposed Fab Output Model

- Each fab has a production rate, expressed as mass over time.
- The displayed unit might be grams/hour, grams/minute, or grams/second. This still needs a final decision.
- Internally, fabs accumulate fractional grams while the battery is active.
- When accumulated mass reaches a threshold, the engine spends that mass and runs one result roll.
- Starting assumption: 1 gram equals 1 result roll.
- Result rolls use weighted odds, including a "no item" tier.
- Example odds target:
  - No item: 50%
  - Green: 38.15%
  - Blue: 7.65%
  - Gold: 3.8%
  - Purple: 0.4%
  - Orange: 0.05%
- Note: 120 grams/hour equals about 0.033 grams/second. A fab creating 2 grams/second would be 7,200 grams/hour.

## Current Implemented Slice

- [x] Modern single-page UI
- [x] Profile page
- [x] Fabs page
- [x] Inventory page
- [x] Melds page
- [x] Districts page
- [x] Admin test tools
- [x] Starter meld fab
- [x] Street Relics starter item set
- [x] Five rarity tiers
- [x] Admin-tunable drop rates
- [x] Hidden city Print Bay output
- [x] Print Bay reveal panel
- [x] Battery max recharge on collection
- [x] Basic starter fab gold-generation mode
- [x] One-day starting battery
- [x] Zero starting credits
- [x] City-specific inventories
- [x] Home city concept
- [x] Fabs tied to a city
- [x] Melds separated from local inventory
- [x] Admin route auto-battle simulator prototype
- [x] BoxBox-inspired route module design notes
- [x] Core route detection stat: Profile
- [x] Core patrol detection stat: Sensor
- [x] Simplified route auto-battler to fundamental initiative, impact, integrity, and escape layer
- [x] Added combat balance plan and spreadsheet model
- [x] Added scalable market filters for category, search, rarity, and empty order books
- [x] Added inventory filters, meld ingredient protection, and bulk sell/recycle/list actions
- [x] Replaced browser-native confirmation popups with in-app confirmation panels for mobile-friendly UX
- [x] Added Contracts page with claimable short-term goals and rewards
- [x] Converted early contracts into a sequential New Operator unlock chain
- [x] Added clearer empty-state guidance to Fabs, Inventory, Melds, Market, and Dispatch
- [x] Redesigned the app shell for desktop and phone browsers with sticky header, mobile bottom navigation, larger touch targets, and responsive cards/forms
- [x] Added market watchlist, meld shopping helper, cross-city price snapshots, and watched-item filtering
- [x] Added actionable meld recipe sourcing with local asks, best asks, owned locations, and move-prep shortcuts
- [x] Added richer Print Bay reveal results sorted by rarity with keep/sell/recycle follow-up actions
- [x] Reduced button density on meld ingredients and collection results with contextual action sheets
- [x] Added first Game Studio stabilization pass with a Profile command deck and architecture audit
- [x] Reworked the Fabs page around current-city operations before full owned-fab management
- [x] Removed Print Bay auto-sell/recycle so low-tier goods remain deliberate economy decisions
- [x] Added a named action dispatcher for common player verbs so UI buttons route through game systems
- [x] Tightened the phone-first command view by hiding duplicate account chrome and compacting the command deck
- [x] Converted Profile from next-action recommendations into a compact operator console
- [x] Trimmed early-loop explanatory UI copy and moved the design rule into the Wiki
- [x] Added `PLAYTEST_CHECKLIST.md` for first-session and phone-browser smoke runs
- [x] Removed Profile's persistent Print Bay results panel
- [x] Reset page scroll position on view and city navigation
- [x] Added Random as the default print pattern for multi-pattern fabs
- [x] Reworked Inventory into a compact backpack grid with advanced bulk actions below
- [x] Made the map the primary place to change viewed cities
- [x] Reduced the mobile top banner footprint for small phones

## Game Studio Stabilization Track

- [x] Decide whether to restart or evolve the current prototype
- [x] Keep the current DOM-first browser app as the active prototype
- [x] Add `GAME_STUDIO_AUDIT.md` as the stabilization guide
- [x] Make Profile act more like a quick check-in command screen
- [x] Make Fabs prioritize current-city collection, storage pressure, and local machine status
- [x] Rename the collection surface to Print Bay and remove auto-removal behavior
- [x] Extract content/default definitions into `game-content.js`
- [x] Extract initial game-rule systems and player actions into `game-systems.js`
- [x] Add lightweight action wrappers so common buttons call named game actions instead of directly mutating state
- [x] Add a first-session playtest checklist
- [ ] Simplify route battle exposure until the core economy loop is easy to read
- [ ] Run recurring desktop and phone browser smoke tests after each UI pass

## Phase 1: Starter Fab Loop

- [x] Make battery timing feel complete
- [x] Replace interval-based output with gram accumulation
- [x] Use grams/hour as the displayed starter unit for now
- [x] Add a "no item" drop-result tier
- [x] Tune "no item" as the most common roll, currently 50%
- [x] Run item rolls whenever accumulated output reaches the roll threshold
- [x] Set the initial roll threshold to 1 gram per roll
- [x] Add clearer battery empty state
- [x] Keep collecting output as the main free recharge action for now
- [x] Refine starter fab gold-generation mode
- [x] Add first-pass starter relic values
- [x] Add first-pass starter fab grams-per-time rate
- [x] Add admin controls for battery, output rate, stored grams, and Print Bay output
- [x] Add a clearer collection history for recently revealed outputs
- [x] Show stored and still-sealed outcomes after opening the Print Bay with immediate item actions
- [x] Add first-pass meld fuse animation
- [x] Keep current starter meld duplicate recipe requirements for now
- [x] Add early contracts for collecting output, fusing melds, and learning core screens
- [x] Tune early contract rewards so a second fab rental is reachable from normal play

## Phase 2: City And Inventory Foundation

- [x] Add inventory slot limits per city
- [x] Show used/available inventory space by city
- [x] Add city detail page or city drawer
- [x] Define initial city map
- [x] Define city connections/routes
- [x] Show available fab types per city
- [x] Show home city boost on relevant screens
- [x] Decide if changing home city is disabled early or allowed with shipment risk
- [x] Add "view home city" shortcuts from inventory, melds, and fabs
- [x] Add city market price differences for starter relics
- [x] Add inventory category/search/rarity filters
- [x] Add protected meld ingredient hints and safer bulk inventory actions
- [x] Add meld-page move-prep shortcuts for components stored outside the home city

## Phase 3: Player Market

- [x] Add listings per city
- [x] Add bids per city
- [x] Add buy listing flow
- [x] Add sell/list item flow
- [x] Add cancel listing flow
- [x] Make city inventory determine what can be listed
- [x] Make purchased items land in the city where they were bought
- [x] Add transaction history
- [x] Add admin market seeding tools
- [x] Decide whether market prices are fully player-driven or partly NPC-seeded
- [x] Add market rarity filtering for future large item pools
- [x] Add market watchlist and cross-city item intelligence
- [x] Add meld shopping helper for missing home-city recipe parts
- [x] Surface home-city and best-visible asks directly inside meld recipes

## Phase 4: Vehicle Fab And Transport

- [x] Create Vehicle fab type
- [x] Define vehicle item set
- [x] Decide if vehicles have capacity, speed, route restrictions, and durability
- [x] Add vehicles to city inventory
- [x] Add shipment creation: choose item, choose vehicle, choose destination
- [x] Enforce item and vehicle must be in same city
- [x] Add real-time shipment duration
- [x] Add in-transit shipment page
- [x] On arrival, move item and vehicle to destination city inventory
- [x] Add admin tools to complete shipments instantly

## Phase 5: Routes And Risk

- [x] Define route graph between cities
- [x] Add route durations
- [x] Replace visible route danger levels with player/NPC route activity
- [x] Add shipment status tracking
- [x] Add designed NPC route encounter hooks
- [x] Add Profile/Sensor detection before route battles
- [ ] Add risk when moving melds or home-city assets
- [x] Add successful arrival notifications
- [x] Add failed/raided shipment notifications
- [x] Add role-specific Dispatch UI for Merchant cargo and Routejack raids

## Phase 6: Professions

- [x] Define profession list
- [x] Add profession unlock requirements
- [x] Add Merchant role for transport/trade
- [x] Add Routejack role for NPC route raids
- [x] Fold escort planning into Merchant convoy setup
- [x] Remove Bounty Hunter from active prototype roles while PvE route balance is tested
- [x] Add profession-specific vehicle/item restrictions
- [x] Add profession change rules
- [x] Show role benefits on Profile
- [x] Prototype route auto-battle combat in Admin

## Phase 7: Additional Fabs

- [x] Decide first paid/non-starter fab
- [x] Add fab ownership and city installation rules
- [x] Add fab purchase/rent flow
- [ ] Add player-to-player fab market
- [x] Add fab running limit
- [x] Add city-specific fab availability
- [x] Add fab categories:
  - [x] Meld fabs
  - [x] Route fabs
  - [x] Boost fabs
- [x] Add Vehicle fab
- [x] Add Boost/Explosives fab
- [x] Add Equipment fab
- [x] Add stable fab IDs and fab detail view
- [ ] Add future cyberpunk equivalent of Spices

## Phase 8: Boosts And Consumables

- [x] Add consumable item type
- [x] Add instant fab-result consumables
- [x] Add inventory expansion consumables
- [x] Add temporary fab output boosts
- [x] Add battery extension items
- [x] Add market demand for boosts
- [x] Add admin testing for consumable effects

## Phase 8B: Route Auto-Battler And Modules

- [x] Build Admin-only route auto-battle simulator
- [x] Add initiative tick model to simulator
- [x] Add route parties: raider/support units versus cargo/escort units
- [x] Add cooldown abilities to simulator
- [x] Add Brave-style escort protection to simulator
- [x] Analyze BoxBox-style item archetypes for route module design
- [x] Add simulator-only route modules and module slots
- [ ] Add route module tiers and duplicate-combine upgrade rules
- [x] Add Admin build comparison for two route party setups
- [ ] Create Route Module Fab
- [ ] Add route module items to market categories
- [ ] Add vehicle module equip/unequip workflow
- [x] Replace live route resolution with route auto-battle engine for Merchant and Routejack PvE
- [x] Add player-facing live replay controls for route battle records

## Phase 9: Economy And Persistence

- [x] Decide backend/storage approach
- [ ] Replace local browser save with persistent accounts
- [ ] Add login/profile persistence
- [x] Add real-time offline progress calculation
- [ ] Add server-authoritative batteries and shipments
- [x] Add anti-cheat boundaries for timers and markets
- [x] Add database models for cities, inventories, fabs, items, listings, shipments, and melds
- [x] Shape local fab records like future database rows
- [x] Attach Print Bay output records to fab IDs when possible

## Open Design Questions

- What is the final game name?
- Is "fab" the permanent term, or should starter systems use "mine" language?
- Should the starter fab create "grams" or another unit?
- Should players start in Lowline every time?
- How many active fabs should a new player be allowed to run?
- Can players recharge battery only by collecting output, or should there be a separate recharge button?
- Should gold-generation mode use the same fab timer as item generation?
- How risky should moving home city be?
- Are melds physical objects, account records, or home-city infrastructure?
- Should all meld categories grant battery capacity, or should later categories grant other bonuses?

## Near-Term Build Order

1. Stabilize the first-session command loop: Profile, Contracts, Fabs, Inventory, Melds.
2. Extract content definitions into dedicated files without changing behavior.
3. Extract core systems: fab production, inventory, market, melds, dispatch, combat.
4. Reduce route battle UI to a clearer fundamental layer while keeping the admin simulator.
5. Add risk when moving home-city assets.
6. Add route-specific market analytics.
