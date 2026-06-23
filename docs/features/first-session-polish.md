# First-Session Polish

## Player Goal

A new player should understand the first playable loop without reading a wall of explanation: choose a home city, open Print Bay output, manage a few items, and understand why melds matter.

## Scope

- Review the first five minutes on desktop and phone.
- Tighten home-city onboarding.
- Improve first Print Bay reveal clarity.
- Make the first meld milestone feel rewarding.
- Keep contracts as guidance, not persistent tutorial text.

## Out Of Scope

- Backend accounts.
- New item families.
- Route combat expansion.
- Major visual asset production.

## Design Notes

The player should feel like an operator learning a small machine economy. The UI should be compact and atmospheric, not instructional-heavy.

## Likely Files

- `app.js`
- `ui-scenes.js`
- `ui-first-session.js`
- `styles.css`
- `game-systems.js`
- `content/creative-overrides.js`
- `docs/PLAYTEST_CHECKLIST.md`

## Prep Done

- Extracted reusable pixel scenes and fab tiles into `ui-scenes.js`.
- Extracted first-run, Profile command deck, Print Bay command deck, and collection reveal rendering into `ui-first-session.js`.
- Left state, save shape, fab output, inventory, market, and dispatch behavior unchanged.

## Acceptance Checklist

- [ ] Fresh profile starts cleanly on GitHub Pages.
- [ ] Chrome Pier and Orchid home choices both make sense.
- [ ] First Print Bay collection is visible and satisfying.
- [ ] Inventory does not require long scrolling before seeing items.
- [ ] First meld path is understandable.
- [ ] Phone layout does not waste excessive header space.

## Playtest Notes

Run the Fresh Profile, Starter Fab Loop, Inventory And Market, and Melds sections from `docs/PLAYTEST_CHECKLIST.md`.
