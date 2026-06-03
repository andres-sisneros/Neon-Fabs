# Playtest Hosting

## Current Prototype Level

Neon Fabs is still a static browser prototype. With the current setup:

- Each browser gets its own local playtest save.
- Friends can test the same build, but they do not share a market or world state yet.
- Real accounts, shared markets, and server-authoritative timers come later.

## Local Phone Testing

For same-Wi-Fi testing:

```powershell
npm run serve:lan
```

Then open the printed LAN address from your phone. The save lives on that phone browser.

## Online Static Playtest

Recommended first public-ish deployment: Cloudflare Pages.

Basic flow:

1. Push the repo to GitHub.
2. In Cloudflare Pages, create a project from the GitHub repo.
3. Use no build command.
4. Use `/` as the output directory.
5. Deploy.

GitHub Pages can also work for this static phase. Cloudflare Pages is the better bridge toward Workers and D1 when accounts/shared economy become real.

## What Static Hosting Cannot Do

Static hosting cannot safely run a shared economy:

- Player markets are not shared.
- Route events are resolved by each local browser.
- Local storage can be edited by the player.
- There is no real anti-cheat boundary.

## Backend Gate

Move to backend work when we want:

- shared player accounts
- shared market listings and bids
- server-authoritative fab output
- server-authoritative route encounters
- reliable friend playtests where everyone affects the same world

See `BACKEND_PLAN.md` for the future server model.
