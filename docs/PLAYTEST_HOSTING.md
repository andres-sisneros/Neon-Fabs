# Playtest Hosting

## Current Prototype Level

Neon Fabs is still mostly a static browser prototype, with the first beta-server gameplay slice in progress. With the current setup:

- Each browser gets its own local playtest save.
- Friends can test the same build, but they do not share a market or world state yet.
- A connected beta test account can load server state and use server-backed Fabs / Print Bay collection.
- Shared markets, dispatch, and most other gameplay actions still come later.

## Local Phone Testing

For same-Wi-Fi testing:

```powershell
npm run serve:lan
```

Then open the printed LAN address from your phone. The save lives on that phone browser.

This only works while your phone is on the same network as the computer running the server.

## Testing Away From Home

Use an online static deployment when you want to test while away from home or share a link with friends.

Recommended first path: Cloudflare Pages connected to the GitHub repo. This gives you a normal web URL, automatic deploys after pushes, and preview URLs for branches.

Basic Cloudflare Pages flow:

1. Push the repo to GitHub.
2. In Cloudflare Pages, create a project from the GitHub repo.
3. Use no build command for this static prototype.
4. Use `/` as the output directory/root.
5. Deploy.

GitHub Pages can also work for this static phase, especially for a quick public demo. Cloudflare Pages is the better bridge toward Workers and D1 when accounts/shared economy become real.

Official references:

- Cloudflare Pages GitHub integration: https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
- GitHub Pages static site setup: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Playtest Privacy

Static browser playtests are easy to share but not private in the same way a backend game would be:

- Anyone with the URL can usually open the build unless the host adds access controls.
- Do not publish secret lore, private notes, credentials, or paid assets in the repo yet.
- The prototype save is still local to each browser, so friend playtests are parallel solo tests rather than one shared economy.

## Quick Decision

- Testing on your phone at home: run `npm run serve:lan`.
- Testing away from home: deploy the static site.
- Testing with friends in one shared world: wait for the backend phase.

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

## Shared Beta Backend Local Check

The first Worker/D1 foundation is now in the repo. The browser client switches the Fabs / Print Bay flow to server mode when a beta test account is connected.

Local setup:

1. In PowerShell, from the project folder, create a local-only admin secret:

```powershell
Set-Content .dev.vars "ADMIN_TOKEN=dev-admin"
```

2. Prepare the local beta database:

```powershell
npm run worker:schema
```

3. Start the Worker API and leave that terminal open:

```powershell
npm run worker:dev
```

4. In a second terminal, start the static game page and leave it open:

```powershell
npm run serve
```

5. Open `http://127.0.0.1:8765/index.html`.

The app's Admin page includes a Beta Test Account panel. Normal local/dev flow:

1. Open Admin.
2. Open Advanced Connection once.
3. Set Worker API Base to `http://127.0.0.1:8787`.
4. Set Admin Token to `dev-admin`.
5. Save Connection.
6. Choose a display name and home city.
7. Press Create & Connect Test Account.
8. Open Fabs and use the server-backed Print Bay flow.

Before real deployment, replace the placeholder D1 database id in `wrangler.jsonc` and set an `ADMIN_TOKEN` secret with Wrangler. Manual tester creation uses `POST /api/admin/tester` with the `x-admin-token` header.

Open Beta Shell from Admin to inspect the loaded server account. The normal Fabs tab now collects from `POST /api/fabs/collect` in beta mode; other player screens may still show local prototype data until their server slices land.

Manual tester token paste is still available inside Advanced Connection as a debugging fallback, but it should not be part of normal playtesting.
