# Content Authoring

This folder is for game-facing creative content that can be edited without touching the simulation code.

## Current File

- `creative-overrides.js`: display labels, descriptions, flavor notes, and future art references.

The game still uses stable internal names such as `Common Starter Component A` for inventory, recipes, markets, and saves. The override file can change what players see without changing those internal keys.

## How To Use

1. Edit `creative-overrides.js`.
2. Refresh the game.
3. If the browser looks stale, press refresh once more. The script version in `index.html` may need to be bumped when changes are committed.

## Good Content Entries

Keep each entry short and practical:

- `label`: the player-facing name.
- `description`: functional or lore-facing object description.
- `flavor`: mood text for future detail panels, item cards, or wiki entries.
- `art`: optional path or note for future artwork.

Avoid changing internal item keys inside recipes or inventories unless we intentionally perform a migration.
