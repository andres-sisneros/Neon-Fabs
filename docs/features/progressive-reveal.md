# Progressive Reveal

## Goal

Keep the first session focused. A new player should not see every system before they understand the basic loop.

## Current Reveal Path

1. Start: Profile only, then home-city choice.
2. Home chosen: Profile, Contracts, and Fabs.
3. First Print Bay collection: Inventory and Patterns.
4. First pattern completed: Market, Map, and Roles.
5. Merchant or Routejack selected: Dispatch.
6. First route job complete: Fab Shop expansion.

Admin and Wiki remain visible for prototype work.

## UI Rules

- Hidden systems should not appear in the side nav, phone nav, or contextual action rows.
- Direct test links may still render locked screens for development and smoke tests.
- Contracts carry early guidance. The Profile should stay neutral and avoid telling the player the single best next action.
- When a stale button targets a locked system, the action is ignored and a short feed entry records why.

## Later

- Add a small, optional "Systems" profile drawer that shows locked surfaces without turning them into action prompts.
- Use reputation and city status to unlock role-specific boards.
- Move Admin behind a debug flag before public release.
