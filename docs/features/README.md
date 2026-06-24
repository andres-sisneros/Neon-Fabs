# Feature Briefs

Use this folder for one-page feature briefs before implementation.

The goal is to reduce context size. A future Codex turn should be able to read:

1. `docs/CODEX_CONTEXT.md`
2. one feature brief
3. the relevant source file or module

Then it should not need to reread the whole roadmap or wiki.

## Required For

Create or update a brief for:

- new features
- meaningful UX redesigns
- systems or economy rule changes
- balance passes
- content set additions
- refactors that move responsibilities between files

Tiny bug fixes and copy-only tweaks can skip a brief when they do not change rules, player flow, architecture, or future priorities.

## Completion Rule

Before a feature is considered complete, update its brief with docs touched, tests run, and remaining risks. If the feature changes player-facing rules, also update `docs/WIKI.md`. If it locks a design direction, update `docs/DESIGN_DECISIONS.md`.
