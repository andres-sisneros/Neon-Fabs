# Neon Fabs Wiki

This is the living rules page for the local prototype. It is intentionally practical: what the player can do, what each system means, and what is still a design sandbox.

The prototype now uses browser-local playtest saves. Refreshing keeps the current profile in that browser, while pressing New Test starts from a clean profile. Old incompatible browser saves are still intentionally ignored until the project reaches a release version.

## Interface Direction

The prototype is being shaped as a browser-first app that should also feel natural on phone browsers. Desktop uses a persistent side navigation and account panel for scanning. Phone layouts use a sticky header, horizontal stat chips, touch-sized controls, a fixed bottom navigation bar, and less duplicate account chrome as a stepping stone toward a future iOS/Android client.

Dense item rows should show one primary action whenever possible. Secondary choices should move into contextual action sheets so desktop and phone users can inspect information without being surrounded by buttons.

The UI should stay clean, tight, and minimal. Explanations, lore, and system teaching belong in Contracts and the Wiki more than in every screen header. Screens should prioritize status, local state, and player verbs.

The Profile page is a compact operator console. It shows status for the current city and neutral shortcuts into major systems, but it should not choose the player's next best move. Contracts handle early guidance; after that, exploration and strategy should come from the player.

Profile should not show persistent Print Bay result history. Print Bay results belong on the Fabs surface, where collection happened.

The Fabs page is organized around the city being viewed. Its first surface shows whether that city's Print Bay has sealed prints, whether storage blocks collection, how many prints fit now, how many will stay sealed, and which local machines are active. Full owned-fab management is still available, but it is secondary to the current-city operation.

The interface now uses progressive reveal. A new profile starts with only the surfaces needed to begin: Profile, Contracts, and Fabs after home selection. Inventory and Patterns unlock after the first Print Bay collection. Market, Map, and Roles unlock after the first pattern is completed. Dispatch and Fab Shop unlock later as the player touches route and expansion loops. Admin and Wiki remain visible during prototype development.

Future atmosphere should come from city-specific visual treatment, ambient state, and server-time effects such as day/night cycles rather than persistent explanatory paragraphs.

## Prototype Architecture

The current prototype is intentionally still a static browser app, but the direction is to separate game rules from rendering as the codebase stabilizes.

- Content data: items, fabs, cities, routes, contracts, roles, and lore definitions.
- Systems: fab production, inventory, market orders, melds, dispatch, combat, and contracts.
- UI: screen rendering, action sheets, confirmation panels, navigation, and replay views.
- Admin: test grants, time advance, balancing tools, and simulation tools.
- Persistence: browser-local playtest save for static testing; later accounts and server-authoritative state.

Content and default prototype definitions now live in `game-content.js`. Runtime systems and game actions live in `game-systems.js`. Rendering, browser event handling, and UI orchestration remain in `app.js` while the prototype is being stabilized. Author-facing lore and naming notes live in `design/`, and safe display overrides live in `content/creative-overrides.js`.

Common UI buttons now route through `runAction(action, payload)` before touching state. This keeps navigation, Print Bay collection, item detail, district switching, contracts, category filters, and common market or inventory verbs closer to the game systems. Admin tools and the route battle sandbox still use direct handlers because they are balance and debugging surfaces.

The working Game Studio rule is that simulation owns state and outcomes. UI should render that state and send player actions into the systems.

## Core Loop

The player runs a limited number of fabs. A starter player begins with one free Starter Fab and can eventually run up to three active fabs.

Battery drains in real time. While battery has charge, active fabs accumulate grams. Every full gram creates one output roll. A roll can produce no item or can produce the selected print pattern at one of the rarity tiers.

Fabs are tuned machines, not mystery boxes. The player chooses what kind of thing the fab is trying to print, and rarity represents print quality, defects, or material precision.

Random is the default print pattern for multi-pattern fabs. It prints across the whole fab pool so a new player can operate with fewer decisions. Focused patterns are a strategic option for players who want to target a specific component, boost, equipment slot, or vehicle class.

The Print Bay holds sealed fab output for each city. Opening the Print Bay moves prints into the city inventory when there is space and recharges the battery to max capacity. If inventory is full, the player should make space before opening it again.

## Reputation

Reputation is the long-term player goal. Credits, items, fabs, routes, and completed collections are all tools for becoming known in the world.

The current first slice awards reputation for completing meld patterns in the home city. Higher-rarity completions award more reputation. Total reputation gives the player a visible title on the Profile page and places the player on a local reputation board beside placeholder NPC operators.

Current reputation tracks:

- Collection Rep: completed meld patterns and future set-completion goals.
- Market Rep: planned for profitable trades, fulfilled bids, and supplying scarce goods.
- Route Rep: planned for completed deliveries, route clears, and successful routejack runs.
- Fab Rep: planned for equipment mastery, rare output records, and machine optimization.

The term "meld" is still provisional. Mechanically, these are completed collection patterns that turn printed components into permanent operator status, battery capacity, and reputation.

## Contracts

Contracts are short operator jobs that reward normal play. They are not meant to replace the sandbox economy; they are a lightweight guidance layer so a new player has useful next steps while learning fabs, city inventories, markets, melds, equipment, and dispatch.

The first contract chain is New Operator. It reveals one job at a time, and claiming the current reward unlocks the next contract. Claimed contracts remain visible as history, while the next locked contract appears only as a teaser.

Current contract progress is tracked for collected output, active fab count, market buys and sells, recycled items, meld fusion, equipment installs, boost use, and shipments sent. Completed contracts can be claimed for credits or chips from the Contracts page. The New Operator chain now teaches first collection, first pattern creation, then market and route play.

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

Each completed meld also grants Collection Rep. This makes meld creation the first visible reputation path while later role systems are still being simplified.

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

The Market page is split into three player modes:

- Sell: shows items stored in the current city and lets the player sell into local bids or open details to list items.
- Buy: starts as a city-market landing page with search, pattern needs, local listings, watched items, and category tiles. It should not default to a full item catalog on mobile.
- Orders: shows the player's active listings and buy orders.

Searching or choosing a category opens focused Buy results. Item detail pages remain the deeper order-book surface with listings, bids, order placement, and city-by-city market snapshots.

Watched items can appear in the Buy landing page when relevant. Pattern needs show missing home-city components and local or visible listings when available.

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

Route risk is shown as expected encounters and chance across the full route. This is not a fixed route danger percentage; it is calculated per mile from the encounter catalog, route kind, route length, cargo pressure, and any temporary route stabilization.

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

Admin mode has an Encounter Designer panel. It edits the route encounter catalog and custom NPC unit catalog as JSON so encounters can be tuned without changing code. This is inspired by custom encounter-maker tools: define an encounter, define waves, define the units that appear in those waves, then test the result through Dispatch or the battle simulator.

Important fields:

- `role`: `merchant` encounters attack Merchant convoys. `routejack` encounters are NPC merchant targets for Routejacks.
- `encounterTier`: `common`, `uncommon`, or `rare`. Admin rate knobs define the base chance per mile for each tier.
- `rateMultiplier`: encounter-specific multiplier applied to that tier's per-mile rate.
- `weight`: relative chance of this encounter when multiple encounters share the same role and tier.
- `routeKinds`: preserved placement metadata for future regional tuning. The current live table does not use this to exclude encounters.
- `minMiles` / `maxMiles`: preserved placement metadata for future regional tuning. The current live table does not use this to exclude encounters.
- `difficulty`: rough combat difficulty from 0 to 4.
- `rarityCeiling`: highest rarity vehicle the NPC can roll from.
- `attackerClasses`: NPC raider classes used against Merchant convoys.
- `vehicleClasses`: NPC target vehicle classes used against Routejacks.
- `supportChance` / `escortChance`: chance to add support vehicles.
- `cargoUnits`: how much cargo the encounter is carrying or threatening.
- `clearHours` / `clearReduction`: optional route stabilization reward after clearing the threat.
- `waves`: optional list of enemy or target layouts under the same encounter. Each wave can override label, weight, difficulty, rarity ceiling, vehicle classes, support or escort chance, cargo units, and authored NPC units.

Wave unit fields:

- `attackerUnits`: authored NPC units that attack Merchant convoys. If present, they replace the generic NPC raider vehicle party.
- `defenderUnits`: authored NPC cargo and escort units that Routejacks attack. If present, they replace the generic NPC merchant vehicle party.

Custom NPC unit fields:

- `id`: stable unit key used by waves.
- `label`: display name in logs and replays.
- `role`: `raider`, `support`, `cargo`, or `escort`.
- `rarity`, `iconName`: visual metadata.
- `maxHp`, `attackMin`, `attackMax`, `speed`: core creator stats. The current combat engine uses the average of attack min and max as Impact, so attack ranges are a tuning UI convenience rather than a random-damage system.
- `braveChance`: escort interception chance.
- `triggers`: future-facing trigger data inspired by Lurker-style custom encounters. The prototype can preserve trigger JSON, but custom triggers are not active in combat yet.
- `futureHooks`: notes for mechanics we may add later, such as crits, harder route hazards, vehicle damage, status effects, item triggers, or non-theft hazards.

Future hazard direction:

- A slow route anomaly could later become a special encounter that is hard to survive and damages vehicles rather than stealing cargo. For now, that idea should be recorded in `futureHooks` or design notes, not implemented as active combat behavior.

## Encounter Rates

Route encounters use a per-mile model. Each mile traveled rolls against the encounter tiers for the player's current route role.

Current default tier rates:

- Common: 2% per mile
- Uncommon: 1% per mile
- Rare: 0.5% per mile

The Admin Route Auto-Battle Simulator includes an Encounter Rate Calculator. It shows expected encounters over the selected route, chance of at least one encounter, and per-tier live expectations. Live Dispatch rolls the role's global encounter table once per mile traveled. Longer routes create more rolls; vehicle speed, cargo load, escorts, one-shot risk reduction, and route stabilization feed into a route modifier.

## Live Route Battles

Route battles now happen from Dispatch, not only in the Admin sandbox.

Merchant shipment resolution:

1. A Merchant sends cargo with a vehicle from one city to a connected city.
2. During travel, the route checks miles traveled and rolls against the current encounter chance per mile.
3. If no encounter triggers before arrival, the cargo arrives safely and pays freight credits.
4. If an NPC raider encounter triggers, the route creates an NPC Raider vs Merchant auto-battle.
5. If the Merchant convoy disables every NPC raider, the shipment continues toward its destination and convoy HP restores for now.
6. If the NPC raider disables every Merchant vehicle, the Merchant loses all loaded cargo and the vehicles are sent back home.
7. The battle is saved in Dispatch as a Route Battle. The player can watch the live replay if they are present, or open the replay later from route history.

Routejack raid resolution:

1. A Routejack chooses a route, lead vehicle, up to two support vehicles, and a loot hold policy from Dispatch.
2. The convoy travels in real time.
3. During travel, the route rolls for designed NPC merchant targets using the current encounter chance per mile.
4. Each triggered target creates a Routejack vs NPC Merchant auto-battle.
5. If the Routejack convoy wins, it keeps as much cargo as its hold allows.
6. If the defender repels the raid, the convoy stops and the Routejack vehicles are sent back home.
7. If the hold fills, the encounter limit is reached, or the route timer ends, the convoy returns.
8. If the convoy returns empty, it pays a heat cost. Vehicles are not permanently destroyed in this prototype layer.

## Route Auto-Battler Sandbox

The Admin Route Auto-Battle Simulator is the balance sandbox for live route PvE. Dispatch uses the same basic engine, while Admin keeps instant and batch simulation tools for balance testing.

The simulator can test either player-facing route role against designed encounters:

- Merchant Shipment: the player convoy is the defender. The selected encounter supplies NPC raiders.
- Routejack Raid: the player convoy is the attacker. The selected encounter supplies NPC cargo targets and escorts.
- The encounter dropdown shows every encounter for the selected role, not only encounters that naturally roll on the selected route. Off-route tests are labeled for balance work.
- Wave can be pinned to one encounter wave or set to Weighted Random for batch balance.

Current beginner merchant target: the first Chrome Pier to Lowline route should mostly teach route risk without being a wall. A Common Runner with a Common Guardian escort should reliably survive Static Skimmers, while skipping the escort should remain noticeably risky. Toll Hounds begin on longer beginner routes so the first short hop is not overly punishing.

Battle terms:

- Integrity: vehicle health. At 0, the vehicle is disabled.
- Speed: initiative gained each tick.
- Initiative: reaches 100 to take an action, then spends 100.
- Impact: base attack strength.
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

- Routejack vs Merchant: both sides fight until one side has no active vehicles.

Route parties:

- Attacker party: lead vehicle plus up to two support vehicles.
- Defender party: cargo vehicle plus up to two escorts.

Attackers win by disabling every defender. Defenders win by disabling every attacker.

Future item/module effect ideas:

- Cargo Focus: an Interceptor module that prioritizes cargo.
- Escort Scrambler: a Routejack tool that pressures escorts first.
- Speed Hunt: a scanner/sensor item that targets the fastest opposing vehicle.
- Cargo Bulwark: a Guardian module that protects cargo.
- Emergency Shield: a future defensive module that helps survive the fight without adding a second win condition.

Battle flow:

1. The simulator builds an attacker party and a defender party from selected vehicles.
2. Vehicle stats are derived from vehicle rarity, speed, durability, cargo capacity, role slot, route compatibility, and manual modifiers.
3. Every tick adds each live vehicle's Speed to its Initiative.
4. Vehicles act when Initiative reaches 100, then spend 100 Initiative. Overflow carries forward.
5. Every active vehicle attacks a target and reduces Integrity.
6. The log records action turns, attacks, disabled vehicles, and status snapshots.

Current win conditions:

- Attackers take cargo when every defending vehicle reaches 0 Integrity.
- Defenders keep cargo when every attacking vehicle reaches 0 Integrity.
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

1. Balance the core layer first: detection, cargo, speed, integrity, impact, and targeting.
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
- Survival Overdrive: gives cargo an emergency shield. Future route-avoidance effects should live outside the current HP-only battle layer.
- Slow Overdrive: slows and delays enemies.

## Admin Build Comparison

The Admin simulator can save the current route party as Build A or Build B. Comparing builds runs both saved setups with the same run count and reports cargo take rate, safe rate, average ticks, and average cargo integrity.

This is the preferred balance workflow before route modules become real inventory items.

## Admin Tools

Admin mode exists for testing. It can grant items, change credits, advance time globally, tune drop rates, run battle simulations, seed markets, and reset the current prototype session.

The battle simulator should be used to test route combat ideas before they affect live dispatch.
