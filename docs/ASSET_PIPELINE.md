# Asset Pipeline

This project can use external open game art, but each asset needs a clean source and license trail.

## Current Policy

1. Prefer original Neon Fabs art or CC0 assets.
2. Keep third-party assets in `assets/`.
3. Record every third-party asset in `ASSET_CREDITS.md`.
4. Preserve source URLs, author names, license names, and change notes.
5. Do not use ripped commercial game art, fan art of existing IP, no-commercial-use assets, or unclear licenses.

## Good Sources To Start

- Kenney assets: broad CC0 game asset packs.
- OpenGameArt: useful, but check each asset license and attribution instructions.
- itch.io asset packs: useful, but each creator chooses their own license, so read the page and included license file.

## Practical Workflow

1. Pick an asset candidate.
2. Verify the license on the original page.
3. Download into `assets/<category>/`.
4. Add an `ASSET_CREDITS.md` entry.
5. Use the asset in the app only after the credit entry exists.

## Preferred First Asset Targets

- City splash/background loops.
- Fab/printer sprite animation.
- Vehicle route sprites.
- Item icons for starter components.
- Simple UI audio cues.
