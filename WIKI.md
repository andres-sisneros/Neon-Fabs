# Neon Fabs Wiki

This is the living rules page for the local prototype. It is intentionally practical: what the player can do, what each system means, and what is still a design sandbox.

The prototype currently uses session state only. Refreshing the browser or pressing New Test starts from a clean profile, and old browser saves are intentionally ignored until the project reaches a release version.

## Interface Direction

The prototype is being shaped as a browser-first app that should also feel natural on phone browsers. Desktop uses a persistent side navigation and account panel for scanning. Phone layouts use a sticky header, horizontal stat chips, touch-sized controls, a fixed bottom navigation bar, and less duplicate account chrome as a stepping stone toward a future iOS/Android client.

Dense item rows should show one primary action whenever possible. Secondary choices should move into contextual action sheets so desktop and phone users can inspect information without being surrounded by buttons.

The UI should stay clean, tight, and minimal. Explanations, lore, and system teaching belong in Contracts and the Wiki more than in every screen header. Screens should prioritize status, local state, and player verbs.

The Profile page is a compact operator console. It shows status for the current city and neutral shortcuts into major systems, but it should not choose the player's next best move. Contracts handle early guidance; after that, exploration and strategy should come from the player.

Profile should not show persistent Print Bay result history. Print Bay results belong on the Fabs surface, where collection happened.

The Fabs page is organized around the city being viewed. Its first surface shows whether that city's Print Bay has sealed prints, whether storage blocks collection, how many prints fit now, how many will stay sealed, and which local machines are active. Full owned-fab management is still available, but it is secondary to the current-city operation.

Future atmosphere should come from city-specific visual treatment, ambient state, and server-time effects such as day/night cycles rather than persistent explanatory paragraphs.

## Prototype Architecture

The current prototype is intentionally still a static browser app, but the direction is to separate game rules from rendering as the codebase stabilizes.

- Content data: items, fabs, cities, routes, contracts, roles, and lore definitions.
- Systems: fab production, inventory, market orders, melds, dispatch, combat, and contracts.
- UI: screen rendering, action sheets, confirmation panels, navigation, and replay views.
- Admin: test grants, time advance, balancing tools, and simulation tools.
- Persistence: currently session reset; later accounts and server-authoritative state.

Content and default prototype definitions now live in `game-content.js`. Runtime systems and game actions live in `game-systems.js`. Rendering, browser event handling, and UI orchestration remain in `app.js` while the prototype is being stabilized.

Common UI buttons now route through `runAction(action, payload)` before touching state. This keeps navigation, Print Bay collection, item detail, district switching, contracts, category filters, and common market or inventory verbs closer to the game systems. Admin tools and the route battle sandbox still use direct handlers because they are balance and debugging surfaces.

The working Game Studio rule is that simulation owns state and outcomes. UI should render that state and send player actions into the systems.

## Core Loop

The player runs a limited number of fabs. A starter player begins with one free Starter Fab and can eventually run up to three active fabs.

Battery drains in real time. While battery has charge, active fabs accumulate grams. Every full gram creates one output roll. A roll can produce no item or can produce the selected print pattern at one of the rarity tiers.

Fabs are tuned machines, not mystery boxes. The player chooses what kind of thing the fab is trying to print, and rarity represents print quality, defects, or material precision.

Random is the default print pattern for multi-pattern fabs. It prints across the whole fab pool so a new player can operate with fewer decisions. Focused patterns are a strategic option for players who want to target a specific component, boost, equipment slot, or vehicle class.

The Print Bay holds sealed fab output for each city. Opening the Print Bay moves prints into the city inventory when there is space and recharges the battery to max capacity. If inventory is full, the player should make space before opening it again.

## Contracts

Contracts are short operator jobs that reward normal play. They are not meant to replace the sandbox economy; they are a lightweight guidance layer so a new player has useful next steps while learning fabs, city inventories, markets, melds, equipment, and dispatch.

The first contract chain is New Operator. It reveals one job at a time, and claiming the current reward unlocks the next contract. Claimed contracts remain visible as history, while the next locked contract appears only as a teaser.

Current contract progress is tracked for collected output, active fab count, market buys and sells, recycled items, meld fusion, equipment installs, boost use, and shipments sent. Completed contracts can be claimed for credits or chips from the Contracts page. Early rewards are tuned so the first print-run payout can rent an early second fab.

## Rarities

Current placeholder rarity tiers:

- Common: green
- Uncommon: blue
- Rare: gold
- Epic: purple
- Legendary: orange

The output table also includes a No Item result, so fabs can run constantly without flooding inventory.

## Cities And Inventory

Inventory is local to each city. Buying an item in Chrome Pier places that item in Chrome Pier. Buying, selling, recycling, equipping, fusing, and dispatching all care about which city the item is in.

The inventory page should feel like a backpack first: compact item tiles at a glance, with item details one click away. Advanced filters and bulk actions are available, but they should not push the actual inventory far down the page. Bulk actions use the visible filtered set, so the player can narrow the page before selling, recycling, or listing. Meld ingredients are protected by default, which disables quick sell/recycle and keeps those items out of bulk actions until the protection toggle is turned off.

The city map is the primary place to change the city being viewed. Other screens can summarize cross-city prices or holdings, but shopping and managing a city should require deliberately switching to that city on the map.

Destructive or broad actions use in-app confirmation panels instead of browser popups. This keeps the flow consistent with a future mobile client.

The current cities are:

- Chrome Pier
- Orchid Sprawl
- Lowline
- Vanta Arcology
- Helix Quay

Each city has its own storage limit, market, fab availability, and route connections.

## Home City

The home city is where melds live and where home-city fab bonuses matter. Starter home choices are Chrome Pier and Orchid Sprawl.

Melds are not normal inventory items. The current design direction is that changing home city will require breaking melds into components, moving the components through routes, then rebuilding the melds in the new home city.

## Melds

Meld fabs create components. Components are not gear and are not directly equipped. Their main purpose is to be traded, transported, collected, and fused.

To create a meld, the required components must be in the home city. Each completed meld currently adds +1 hour to max battery capacity.

The Melds page now shows each recipe component with home-city progress, home market ask, best visible ask across cities, and where owned copies are stored. Buttons can open the order book, buy from the home city, buy the best visible listing, or jump to the source city inventory with the shipment form prepared for moving that ingredient home.

Current meld categories:

- Starter Melds from the Starter Fab
- Food Melds from the Food Meld Fab

## Fabs

Fabs are city-installed production sources. Players can buy or rent additional fabs, up to the active fab limit.

Each fab has a print pattern:

- Starter Fab: Starter Component A, Starter Component B, or Starter Component C.
- Food Meld Fab: Food Component A, Food Component B, or Food Component C.
- Vehicle Fab: Runner, Freighter, Interceptor, or Guardian.
- Aquatic Vehicle Fab: Water Runner, Water Freighter, Water Interceptor, or Water Guardian.
- Boost Fab: Battery Extension, Filament, or Scanner.
- Nethack Boost Fab: Gram Burst.
- Equipment Fab: Motherboard, Extruder, Print Bed, or Stepper Motors.

Current fab types:

- Starter Fab: produces Starter Meld components.
- Food Meld Fab: produces Food Meld components.
- Vehicle Fab: produces land route vehicles.
- Aquatic Vehicle Fab: produces water route vehicles.
- Boost Fab: produces battery, filament, and scanner consumables.
- Nethack Boost Fab: produces instant gram burst consumables.
- Equipment Fab: produces static fab upgrades.

## Equipment

Equipment is installed on individual fabs to increase grams per hour.

Current equipment slots:

- Motherboard
- Extruder
- Print Bed
- Stepper Motors

Each slot has one item per rarity tier. Better tiers give larger grams/hour bonuses. Equipment must be in the same city as the fab to equip it.

## Boosts

Boosts are consumable items.

- Battery Extension: permanently increases max battery capacity and fills the added charge.
- Filament: temporarily improves fab rarity pressure. It does not stack.
- Scanner: temporarily reveals route statistics.
- Gram Burst: applies instant grams to a chosen fab.

## Market

The market is order-driven. Sellers post listings, buyers post bids, and trades happen against those orders. Prices are not set by a global percentage slider.

The market page can be filtered by category, search text, rarity, watched items, and whether empty order books are visible. This is meant to scale to many more fab and item types without making the player scroll through every possible output.

Watched items appear in a market watchlist with best ask, best bid, and owned counts across all cities. Item order books also include a city-by-city price snapshot, so a player can see whether buying remotely is useful or whether they need to move goods.

The market also has a meld shopping helper. Pick an incomplete meld and it shows the missing home-city components, what is already owned in other cities, and the best visible listing for each missing part.

NPC orders currently seed the market for testing. Later, human player and NPC activity should drive liquidity and price discovery.

Items can also be recycled for credits when inventory space matters.

## Print Bay

Fab output stays sealed in the Print Bay until opened in the city where the fab is installed. Opening the Print Bay reveals results, recharges battery, sorts the reveal by rarity, and stores every print that fits in local inventory. If there is not enough room, the remaining prints stay sealed.

Print Bay collection never auto-sells or auto-recycles output. Low-tier goods can still be valuable for melds, market demand, or shipping to another city, so selling and recycling are deliberate inventory or market actions.

## Dispatch

Dispatch is the system for sending vehicles out to do route work. The screen is role-specific: Merchants see cargo shipping tools, while Routejacks see raid convoy tools.

Vehicle fabs print classes. A Runner is a fast light-cargo vehicle, a Freighter is slower with more slots, an Interceptor is built for Routejack raids, and a Guardian is built for escort and convoy pressure. Aquatic vehicle fabs mirror those roles for water routes.

Current vehicle balance stats:

- Cargo: how many item units fit.
- Speed: miles per hour for route travel and initiative speed in combat.
- Integrity: battle health, derived mostly from durability, cargo capacity, rarity, and role slot.
- Impact: battle attack strength.
- Profile: how easy the vehicle is to detect. Lower profile is safer for merchants.
- Sensor: how good the vehicle is at finding or reading route encounters. Higher sensor is better for Routejacks and scanner-style route play.

Normal shipment flow:

1. Choose a connected destination city.
2. Choose a vehicle in the same city.
3. Load cargo into the vehicle's available cargo slots.
5. The cargo manifest and vehicle travel in real time.
6. While traveling, the route rolls for NPC encounters using an hourly chance. If no encounter happens before arrival, the manifest and vehicle appear in the destination city's inventory.
7. If an NPC threat finds the convoy, the auto-battler resolves immediately and saves a replay. The player can watch it live or review it later.
8. Successful Merchant deliveries pay freight credits based on distance, cargo units, cargo value, and how efficiently the vehicle was filled.

Routes have distance in miles. Vehicles have speed in mph. Some routes are water-only and require aquatic vehicles.

Each cargo item unit uses one cargo slot. A Common Freighter currently has 6 cargo slots, so it can carry six total units such as 6x Common Starter Component A or a mixed manifest of several different items. The destination must have enough free storage for every cargo unit plus the returning vehicle, otherwise the shipment waits as a blocked arrival.

NPCs on routes are not live visible traffic. They are random route encounters, closer to a Pokemon-style encounter roll: the route, vehicle profile, cargo load, and escort choice shape the chance that something finds the convoy. The admin route panel only shows player jobs currently in motion.

Route risk is shown as an encounter chance per hour. This is not a fixed route danger percentage; it is calculated from the encounter catalog, route kind, route length, cargo pressure, and any temporary route stabilization.

## Professions

The player has one active profession at a time. A profession cannot be changed while related route work is active.

Current roles:

- Drifter: non-route role with increased credit gain from fab credit output.
- Merchant: primary shipping role. Merchants send cargo convoys, get better market selling, move shipments faster, and earn freight pay on delivery.
- Routejack: raid role. Routejacks send attack convoys onto routes to steal from designed NPC merchant targets.
- Fabricator: improves non-starter fab output.

Only two roles currently dispatch route work:

- Merchant ships cargo.
- Routejack raids NPC merchant targets.

Drifter and Fabricator do not dispatch route jobs. Bounty Hunter is removed from the active prototype role list for now; anti-raider play can return later after PvE route balance feels good.

## Route PvE Direction

Route danger currently comes from designed NPC encounters, not a visible static danger percentage.

Routejacks send a lead vehicle plus up to two support vehicles onto a route. The convoy travels in real time and rolls for designed NPC merchant targets along the way. It keeps hunting until its hold is full, its encounter limit is reached, the travel window ends, or a defender repels it.

A Routejack convoy can only keep stolen cargo that fits the total cargo capacity of the vehicles it sent. With the default Upgrade Loot policy, a full hold can replace lower-rarity loot with higher-rarity loot; otherwise it keeps the first cargo it steals.

This creates the main PvE risk choice: send a cheap solo raider for low commitment and high failure risk, or commit a larger convoy that wins more often but ties up more vehicles and can still come home empty.

Route stabilization is the first Death Stranding-inspired delivery layer. When a Merchant convoy survives and clears certain NPC threats, that route can become safer for everyone for a limited time. The current prototype models this as a global encounter-rate reduction with a timer. Later versions can expand this into deliberate route-clearing jobs, public route projects, route infrastructure, and cooperative pushes to make dangerous corridors profitable.

## Encounter Catalog

Admin mode has an Encounter Designer panel. It edits the route encounter catalog and custom NPC unit catalog as JSON so encounters can be tuned without changing code. This is inspired by trial-maker tools: define an encounter, define waves, define the units that appear in those waves, then test the result through Dispatch or the battle simulator.

Important fields:

- `role`: `merchant` encounters attack Merchant convoys. `routejack` encounters are NPC merchant targets for Routejacks.
- `ratePerHour`: base hourly encounter rate before route stabilization and cargo pressure.
- `weight`: relative chance of this encounter when multiple eligible encounters can trigger.
- `routeKinds`: `land`, `water`, or both.
- `minMiles` / `maxMiles`: distance range for eligible routes.
- `difficulty`: rough combat difficulty from 0 to 4.
- `rarityCeiling`: highest rarity vehicle the NPC can roll from.
- `attackerClasses`: NPC raider classes used against Merchant convoys.
- `vehicleClasses`: NPC target vehicle classes used against Routejacks.
- `supportChance` / `escortChance`: chance to add support vehicles.
- `cargoUnits`: how much cargo the encounter is carrying or threatening.
- `clearHours` / `clearReduction`: optional route stabilization reward after clearing the threat.
- `failureMode`: `steal` means the enemy steals cargo if it wins. `destroy` means the enemy disables or ruins the convoy without creating stolen cargo.
- `waves`: optional list of enemy or target layouts under the same encounter. Each wave can override label, weight, difficulty, rarity ceiling, vehicle classes, support or escort chance, cargo units, failure mode, and authored NPC units.

Wave unit fields:

- `attackerUnits`: authored NPC units that attack Merchant convoys. If present, they replace the generic NPC raider vehicle party.
- `defenderUnits`: authored NPC cargo and escort units that Routejacks attack. If present, they replace the generic NPC merchant vehicle party.

Custom NPC unit fields:

- `id`: stable unit key used by waves.
- `label`: display name in logs and replays.
- `role`: `raider`, `support`, `cargo`, or `escort`.
- `rarity`, `iconName`: visual metadata.
- `maxHp`, `speed`, `impact`: core auto-battler stats.
- `braveChance`: escort interception chance.
- `escapeDrag`: pressure that reduces cargo escape progress while this enemy is alive.
- `targetMode`: `cargo`, `highest-impact`, or `weakest`.
- `triggers`: future-facing trigger data inspired by Lurker-style custom trials. The prototype preserves trigger JSON now, but only core stats, targeting, brave, and escape drag are active in combat.

Example hazard direction:

- A slow route anomaly can be authored as a `raider` with low `speed`, high `maxHp`, high `impact`, `escapeDrag`, and `failureMode: "destroy"`. This creates an encounter that is not a Routejack theft event; it is a route danger that tries to disable the convoy.

## Live Route Battles

Route battles now happen from Dispatch, not only in the Admin sandbox.

Merchant shipment resolution:

1. A Merchant sends cargo with a vehicle from one city to a connected city.
2. During travel, the route checks elapsed time and rolls against the current encounter chance per hour.
3. If no encounter triggers before arrival, the cargo arrives safely and pays freight credits.
4. If an NPC raider encounter triggers, the route creates an NPC Raider vs Merchant auto-battle.
5. If cargo escapes, survives, or the Routejack side is disabled, the shipment continues toward its destination.
6. If the NPC raider disables the cargo vehicle, it steals only what fits in its hold. Any unstolen cargo returns with the Merchant vehicle.
7. The battle is saved in Dispatch as a Route Battle. The player can watch the live replay if they are present, or open the replay later from route history.

Routejack raid resolution:

1. A Routejack chooses a route, lead vehicle, up to two support vehicles, a tactic, and a loot hold policy from Dispatch.
2. The convoy travels in real time.
3. During travel, the route rolls for designed NPC merchant targets using the current encounter chance per hour.
4. Each triggered target creates a Routejack vs NPC Merchant auto-battle.
5. If the Routejack convoy wins, it keeps as much cargo as its hold allows.
6. If the defender repels the raid, the convoy stops and returns with any loot already taken.
7. If the hold fills, the encounter limit is reached, or the route timer ends, the convoy returns.
8. If the convoy returns empty, it pays a heat cost. Vehicles are not permanently destroyed in this prototype layer.

## Route Auto-Battler Sandbox

The Admin Route Auto-Battle Simulator is the balance sandbox for live route PvE. Dispatch uses the same basic engine, while Admin keeps instant and batch simulation tools for balance testing.

Battle terms:

- Integrity: vehicle health. At 0, the vehicle is disabled.
- Speed: initiative gained each tick.
- Initiative: reaches 100 to take an action, then spends 100.
- Impact: base attack strength.
- Escape: cargo progress. Cargo escapes at 100%.
- Profile: detection footprint before battle.
- Sensor: detection strength before battle.

Advanced terms planned for later:

- Shield: temporary damage buffer.
- Brave: escort chance to intercept attacks aimed at cargo.
- Cooldown: number of actions before a special or overdrive fires.
- Corrosion: damage over time after a vehicle acts.
- Modules: route-unit upgrades that add stats or trigger effects.
- Overdrive: high-impact module ability with cooldown.

Route matchup:

- Routejack vs Merchant: the Routejack side tries to disable the Merchant cargo vehicle and take the cargo.

Route parties:

- Attacker party: lead vehicle plus up to two support vehicles.
- Defender party: cargo vehicle plus up to two escorts.

Attackers win by disabling cargo. Defenders win by escaping, surviving the route timer, or disabling all attackers.

Current attacker tactics:

- Hit Cargo First: attackers focus the cargo vehicle whenever possible.
- Disable Escorts: attackers remove escorts before focusing cargo.
- Target Fastest: attackers pressure the fastest opposing unit.

Current defender tactics:

- Protect Cargo: escorts get stronger Brave chances and try to keep cargo alive.
- Counter Lead: defenders focus the attacker lead.
- Prioritize Escape: cargo gains escape pressure but gives up some attack power.

Battle flow:

1. The simulator builds an attacker party and a defender party from selected vehicles.
2. Vehicle stats are derived from vehicle rarity, speed, durability, cargo capacity, role slot, route compatibility, and manual modifiers.
3. Every tick adds each live vehicle's Speed to its Initiative.
4. Vehicles act when Initiative reaches 100, then spend 100 Initiative. Overflow carries forward.
5. Cargo vehicles use their action to gain Escape progress.
6. Non-cargo vehicles use their action to attack a target and reduce Integrity.
7. The log records action turns, attacks, escape pushes, disabled vehicles, and status snapshots.

Current win conditions:

- Attackers take cargo when the cargo vehicle reaches 0 Integrity.
- Defenders keep cargo by reaching 100 Escape, surviving the tick limit, or disabling every attacker.
- Cargo capacity matters in the live route design: Routejacks can only keep stolen cargo that fits their vehicle hold. The simulator models cargo load by making loaded cargo vehicles slower and tougher.

## Live Battle Replay

The battle replay supports two result modes:

- Instant simulation: resolves immediately and shows full metrics for balance testing.
- Live Battle View: reveals one turn frame every two seconds, inspired by the Lurker's Labyrinth replay format.

The player-facing battle result screen should prioritize comprehension over speed. The current prototype view advances by turn frames, not raw log lines. Each frame shows a clear turn header, the events that happened that turn, the full attacker and defender status board with current HP and status effects, reveal progress, a small timer until the next frame, and recent turn history.

This is now used by route battle records in Dispatch. Instant batch results should remain an admin-only balancing tool.

## Route Modules

Route modules are intentionally disabled in the current fundamental balance layer. They are not normal inventory items yet.

Planned introduction order:

1. Balance the core layer first: detection, cargo, speed, integrity, impact, and escape.
2. Add Shields as the first defensive mechanic.
3. Add Brave as an escort-only mechanic.
4. Add simple passive modules that only change stats.
5. Add triggered standard modules.
6. Add cooldown specials.
7. Add overdrive modules last.

Each simulator unit can use:

- Two standard modules
- One overdrive module

Current standard modules:

- Cargo Defense Module: adds integrity, starting shield, and Brave chance.
- Initiative Jam Module: reduces target initiative and weakens the next hit.
- Repair Module: repairs the most damaged ally after attacks.
- Targeting Module: targets weak enemies and hits damaged vehicles harder.
- Counterattack Module: damages attackers back when this unit takes damage.
- Damage Over Time Module: adds corrosion stacks.
- Shield Module: gives a chance to reduce incoming damage.

Current overdrive modules:

- Team Buff Overdrive: buffs allies with impact and shield.
- Cargo Strike Overdrive: hits cargo directly when used by an attacker lead.
- Stat Buff Overdrive: upgrades one ally at battle start.
- Random Effect Overdrive: rolls a random battle-start effect.
- Escape Overdrive: improves cargo escape and shield.
- Slow Overdrive: slows and delays enemies.

## Admin Build Comparison

The Admin simulator can save the current route party as Build A or Build B. Comparing builds runs both saved setups with the same run count and reports cargo take rate, safe rate, escape rate, average ticks, average cargo integrity, and average escape progress.

This is the preferred balance workflow before route modules become real inventory items.

## Admin Tools

Admin mode exists for testing. It can grant items, change credits, advance time globally, tune drop rates, run battle simulations, seed markets, and reset the current prototype session.

The battle simulator should be used to test route combat ideas before they affect live dispatch.
