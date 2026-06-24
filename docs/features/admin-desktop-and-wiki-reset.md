# Admin Desktop Workbench And Wiki Reset

## Player Goal

Players should eventually see a clean Wiki that teaches stable game systems, not prototype tuning notes or admin explanations.

## Developer Goal

Admin can become a desktop-first workbench experience that shares game systems and local state, without pretending it needs to fit the mobile player UI.

## Scope

- Archive the old prototype wiki.
- Start a fresh player-facing wiki shell.
- Simplify the in-app Wiki to match the new player-facing direction.
- Record the Admin direction as desktop workbench, not mobile player surface.

## Out Of Scope

- Building a separate `admin.html` app.
- Removing Admin from the prototype nav.
- Rewriting Admin into modules.
- Final public wiki content.

## Acceptance Checklist

- Old wiki content is preserved in `docs/archive/`.
- `docs/WIKI.md` is now player-facing and compact.
- In-app Wiki no longer exposes admin/balance/prototype details.
- Design docs explain Admin's desktop workbench direction.

## Implementation Notes

- Moved the old wiki to `docs/archive/WIKI_LEGACY.md`.
- Recreated `docs/WIKI.md` as a compact player-facing guide shell.
- Simplified the in-app Wiki renderer to remove admin, simulator, and prototype tuning content.
- Recorded that Admin/Test Lab can be desktop-first while player-facing UI remains mobile-aware.

## Docs Touched

- `docs/WIKI.md`
- `docs/archive/WIKI_LEGACY.md`
- `docs/archive/README.md`
- `docs/CODEX_CONTEXT.md`
- `docs/CHANGE_PROCESS.md`
- `docs/DESIGN_DECISIONS.md`
- `docs/ROADMAP.md`

## Remaining Risks

- The in-app Wiki is still rendered from `app.js`; later it should probably be extracted or fed by a smaller content file.
- More old docs may deserve archiving after you decide which planning notes still matter.
