# Admin Test Lab

## Player Goal

This is a developer-facing feature. It should make new feature testing faster by letting designers and testers jump to exact game moments instead of hand-building state every time.

## Scope

- Reorganize Admin into clear test surfaces:
  - Test Lab scenario presets
  - Player state/debug controls
  - Route and balance tools
  - Drop and economy tuning
- Preserve existing admin powers.
- Add scenario buttons for common feature checks.

## Out Of Scope

- Server-side admin tools.
- Live player support tooling.
- Removing existing encounter/battle tools.
- Rebuilding Admin as a separate app.

## Likely Files Touched

- `app.js`
- `styles.css`
- `index.html`
- `docs/WIKI.md`
- `docs/DESIGN_DECISIONS.md`
- `docs/ROADMAP.md`

## Acceptance Checklist

- Admin route activity still appears.
- Encounter Designer and raw JSON tools still work.
- Battle simulator still supports Merchant and Routejack testing.
- Test Lab scenarios can jump to first-session, market, dispatch, and equipment states.
- Smoke tests pass on desktop and phone layouts.

## Implementation Notes

- Admin now opens with Test Lab scenario cards.
- Scenario buttons load exact browser-local playtest states and navigate to the target screen.
- Existing tools are grouped into Debug Tools, Drop & Economy Tuning, and Route & Balance Lab.
- Route Activity, Encounter Designer, and Route Auto-Battle Simulator are preserved.

## Docs Touched

- `docs/WIKI.md`
- `docs/DESIGN_DECISIONS.md`
- `docs/ROADMAP.md`

## Remaining Risks

- Scenario coverage should grow as new features are added.
- Admin rendering still lives in `app.js`; extracting `ui-admin.js` is a good future hygiene pass.
