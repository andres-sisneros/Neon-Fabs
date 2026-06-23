# Route Module Design Notes

These notes translate the BoxBox Dungeons item list into Neon Fabs route-combat language. The goal is inspiration, not a direct copy: keep the build logic, tier scaling, and combat texture, but rename and reshape everything for cyberpunk convoy combat.

Source reference used locally: `C:\Users\Andres\Downloads\Item List for Players - Items.csv`

## What The Reference Does Well

- Items usually combine a stat package with a behavioral hook.
- Higher rarity improves numbers and can unlock extra effects.
- Normal items are mostly passives, attack triggers, protection triggers, or minor cooldown loops.
- Ultimate items are high-cooldown actions that can swing a fight.
- Duplicate item tiering matters: two identical items of the same tier combine into a stronger tier.
- The strongest build choices are tradeoffs, not pure upgrades: self-damage for attack, speed loss for defense, protection that requires high health, delayed revive, or cooldown increases after use.

## Neon Translation

Vehicles and route units should eventually equip:

- 3 standard modules
- 1 overdrive module
- Tier levels, probably 1-9, upgraded by combining duplicate modules
- Existing game rarity colors still apply: green, blue, gold, purple, orange

Modules should work on route units, not normal fab equipment. Fab equipment boosts production rate; route modules change route auto-battle behavior.

## Core Module Archetypes

| Reference Pattern | Neon Route Module Direction | Combat Role |
| --- | --- | --- |
| Low-health scaling, lifesteal, armor | Redline Plating | Risky bruiser module for raiders or escorts |
| Big attack with self-damage | Overclock Cannon | High impact, wears down the vehicle |
| Summoned companions | Drone bays, decoy pucks, escort bots | Adds temporary units to the convoy/patrol |
| Cleansing/healing aura | Crew Patch Mesh | Team sustain and debuff removal |
| Curse/exhaustion | Route Debt Spike | Reduces enemy impact or next action |
| Attack drain | Leech Spike | Lowers enemy impact over time |
| Thorns/retaliation | Tollback Coil | Punishes attackers who hit this unit |
| Attack growth | Heat Blade | Scaling damage on repeated actions |
| Balanced attack/speed stat stick | Stabilized Lance | Simple, readable early module |
| Brave/protect items | Charter Cradle, Intercept Harness | Escorts jump in front of cargo attacks |
| Damage reduction on being attacked | Civic Umbrella | Chance-based mitigation |
| Initiative gifts | Dispatch Love Note | Speeds up allies after actions |
| Taunt/focus mark | Beacon Cape, Mock Signal | Forces or encourages targeting |
| Poison/damage over time | Spoilcode Canister | Route malware that ticks after enemy actions |
| Lowest-health targeting | Claim Trace | Finisher module |
| Splash/area damage | Shrapnel Rotor | Anti-swarm module |
| Stun after hit count | Riot Lock | Delayed control for defenders |
| Sacrifice/self-damage healing | Blood Battery | Support module with risk |
| Team attack buff | Crew Signal Bell | Party-wide scaling |
| Team max HP/heal | Feast Cache | Convoy endurance buff |
| Temporary item upgrade | Field Compiler | Mid-fight module tier boost |
| Self defense with speed penalty | Cryo Brake | Emergency mitigation with tempo loss |
| Mystery effect | Redacted Blackbox | Wildcard overdrive module |

## First Simulator Module Set

Start with a small simulator-only module set before touching live Dispatch:

- **Charter Cradle**: standard module, grants Brave chance and extra integrity.
- **Route Debt Spike**: standard module, on attack lowers target initiative and next impact.
- **Crew Patch Mesh**: standard module, cooldown heal/shield for lowest integrity ally.
- **Claim Trace**: standard module, attacks lowest integrity enemy and gains bonus impact against damaged targets.
- **Tollback Coil**: standard module, damages attackers when this unit is hit.
- **Spoilcode Canister**: standard module, applies damage-over-time stacks.
- **Crew Signal Bell**: overdrive module, cooldown team impact buff.
- **Soft-Border Lance**: overdrive module, large hit that ignores Brave once.
- **Field Compiler**: overdrive module, temporarily boosts one ally module tier for the run.
- **Redacted Blackbox**: overdrive module, random powerful route effect.

## Route Auto-Battle Rules To Add Next

- Modules can add flat stats: integrity, speed, impact, cooldown reduction.
- Modules can register triggers:
  - battle start
  - before attack
  - after attack
  - on damaged
  - on ally damaged
  - on cooldown special
  - on death/disable
- Brave should remain separate rolls per module, not one flattened chance.
- Initiative manipulation should use the same scale as combat: 1 initiative is 1% of a turn.
- Overdrive modules should use attack-count cooldowns, matching the current simulator's cooldown style.

## Revised Implementation Order

The first module prototype was useful, but the live design needs a simpler foundation before modules become balanceable.

1. Balance the core layer: Cargo, Speed, Integrity, Impact, Profile, Sensor, and Escape.
2. Add Shields as the first defensive mechanic.
3. Add Brave as an escort-only mechanic.
4. Reintroduce passive route modules that only change stats.
5. Add tier levels to passive modules.
6. Add triggered standard modules.
7. Add cooldown specials.
8. Add overdrive modules last.
9. Once fun, create a Route Module Fab that prints module items.
10. Add equip/unequip flow for modules on vehicles.
