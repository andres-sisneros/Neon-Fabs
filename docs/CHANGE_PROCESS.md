# Change Process

Use this checklist for every meaningful feature, systems change, UX redesign, balance pass, or refactor.

The goal is not paperwork. The goal is to keep future work small enough that Codex or a human can understand the current game without rereading the whole project.

## Before Implementation

1. Read `docs/CODEX_CONTEXT.md`.
2. Identify whether the request is:
   - feature
   - UX/design change
   - balance/content change
   - refactor
   - bug fix
   - tiny visual copy tweak
3. Create or update a short file in `docs/features/` for meaningful feature, UX, systems, balance, or refactor work.
4. Write the expected doc impact in that feature brief.
5. Keep scope narrow enough to test in one pass.

Tiny fixes do not require a feature brief when they do not change design direction, rules, player flows, content structure, or architecture.

## Doc Impact Rules

- `docs/features/<feature>.md`: feature scope, out-of-scope, touched files, acceptance checklist, playtest notes.
- `docs/DESIGN_DECISIONS.md`: locked product, economy, UI, role, route, or architecture decisions that should not be casually reopened.
- `docs/WIKI.md`: player-facing rules, mechanics, terms, and how systems currently work.
- `docs/ROADMAP.md`: current priority or sequence changes.
- `docs/CODEX_CONTEXT.md`: file map, current priority, major architecture boundary, or workflow changes.
- `docs/MODULARIZATION_PLAN.md`: extraction plans or new module boundaries.
- `docs/BACKEND_PLAN.md`: account, persistence, shared economy, server authority, or deployment architecture changes.
- `content/creative-overrides.js` and `design/`: player-facing naming, lore, flavor, and art direction changes.
- `ASSET_CREDITS.md`: every added third-party or open asset.

## Definition Of Done

A meaningful change is done only when:

- code/content changes are implemented
- relevant docs are updated or explicitly judged unnecessary
- cache-busting is updated when browser-loaded files changed
- `npm test` passes for behavior or UI changes
- screenshots are reviewed for mobile-heavy UI changes
- the final response names both implementation and docs touched

## Final Response Checklist

When finishing a feature, mention:

- what changed for the player
- which docs were updated
- what tests ran
- any remaining risks or follow-up slices

## Default Feature Brief Flow

For a new feature, create `docs/features/<short-name>.md` from `docs/FEATURE_TEMPLATE.md`.

For an iteration on an existing feature, update that feature brief instead of creating a duplicate.

Archive old feature briefs only when their decisions have been rolled into `docs/WIKI.md`, `docs/DESIGN_DECISIONS.md`, or `docs/ROADMAP.md`.
