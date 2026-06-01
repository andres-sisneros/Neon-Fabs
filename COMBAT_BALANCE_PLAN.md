# Combat Balance Plan

This file tracks the route-combat simplification plan. The goal is to make each balance knob understandable before adding more mechanics.

## Current Fundamental Layer

Route combat should currently be balanced around these stats only:

- Cargo: how many item units a vehicle can carry.
- Speed: route travel time and initiative gain in combat.
- Integrity: combat health.
- Impact: combat damage.
- Profile: how easy a vehicle is to detect before battle.
- Sensor: how good a patrol vehicle is at detecting route traffic.
- Escape: cargo progress during battle. At 100, cargo gets away.

## Current Core Loop

Merchant loop:

1. A Merchant sends cargo from the current city to a connected city.
2. On arrival, hidden NPC raider pressure may create an encounter.
3. If no NPC raider pressure is present, the shipment arrives and pays freight.
4. If an NPC raider is present, detection is rolled.
5. Detection considers NPC Sensor, Merchant Profile, cargo load, and relative speed.
6. If detection fails, the shipment arrives.
7. If detection succeeds, an auto-battle starts.
8. Cargo vehicles push Escape; attackers attack Integrity.
9. Attackers steal only cargo that fits their hold if cargo Integrity reaches 0.
10. Defenders keep cargo if cargo reaches 100 Escape, all attackers are disabled, or the tick limit expires.

Routejack loop:

1. A Routejack launches a lead vehicle plus up to two support vehicles on a route.
2. The raid travels in real time.
3. When the timer finishes, the route rolls designed NPC merchant targets.
4. Each target creates a Routejack vs NPC Merchant auto-battle.
5. The Routejack convoy keeps stolen cargo only up to its total cargo capacity.
6. The raid stops when the hold is full, the encounter limit is reached, or a defender repels the convoy.

## Mechanic Introduction Roadmap

### Layer 0: Core Balance

Balance target:

- Runners should feel safer but less profitable.
- Freighters should be profitable because they move meaningful volume, but easier to detect.
- Interceptors should be strong attackers with enough hold space to care about loot decisions.
- Guardians should be defensive escorts, not automatically best at shipping or raiding.
- Routejack solo raids should be possible but unreliable; supported raids should feel much more intentional.

Do not add new mechanics until these tradeoffs are readable.

### Layer 1: Shields

Add a temporary HP buffer.

Why first:

- Easy to understand.
- Creates defensive tuning without changing target logic.
- Good bridge toward Guardian identity.

### Layer 2: Brave

Escort vehicles can intercept attacks aimed at cargo.

Rules to test:

- Brave should be escort-only.
- Brave should require the escort to have more Integrity than the cargo.
- Brave should be separate rolls, not one flattened percentage.

### Layer 3: Passive Modules

Route modules become stat modifiers only.

Examples:

- +Integrity
- +Impact
- +Speed
- -Profile
- +Sensor

No triggered effects yet.

### Layer 4: Triggered Standard Modules

Add simple triggers after passives are balanced.

Safe first triggers:

- On battle start
- On attack
- On taking damage
- On cargo escape action

Avoid chain reactions until the log stays readable.

### Layer 5: Cooldown Specials

Vehicles or modules gain an action counter. When full, a special action fires.

Examples:

- Big attack
- Repair ally
- Slow enemy initiative
- Emergency escape burst

### Layer 6: Overdrive Modules

High-impact abilities with long cooldowns.

Overdrives should be rare, expensive, and visible in the battle replay so the player understands why the fight swung.

## Balance Workflow

1. Use the spreadsheet to set vehicle class stats.
2. Check detection odds before combat odds.
3. Run admin battle batches for the matchups that matter most.
4. Tune one knob at a time.
5. Record target outcomes before adding mechanics.

Useful first targets:

- Runner with light cargo vs NPC Interceptor: often slips through, but loses if caught.
- Freighter with full cargo vs NPC Interceptor: often detected, but may survive with a Guardian.
- Merchant Freighter plus Guardian: higher investment, safer delivery, stronger freight payout.
- Routejack Interceptor alone: high variance, often comes home empty.
- Routejack Interceptor plus support: stronger win rate, more loot capacity, more vehicles tied up.
