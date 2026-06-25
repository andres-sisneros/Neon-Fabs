# Read-Only Beta Shell

## Player Goal

Let the developer inspect a manual tester account from the shared beta Worker in a player-like layout before normal gameplay actions are connected to the server.

## Scope

- Add an Admin-launched Beta Shell view.
- Reuse `NeonBetaClient` and `GET /api/state`.
- Show tester identity, city inventories, owned fabs, pending Print Bay output, market orders, and shipments.
- Keep the shell read-only.
- Preserve local prototype gameplay as the normal app mode.

## Out Of Scope

- Server-backed collection, market actions, pattern creation, or dispatch actions.
- Tester-facing account creation.
- Cloudflare deployment setup.
- Replacing local saves.

## Playtest Checklist

- Load a mocked or live beta state from Admin.
- Open the Beta Shell from Admin.
- Confirm credits, chips, reputation, inventory, fabs, Print Bay, market orders, shipments, and wipe notice render.
- Confirm no gameplay action buttons are available in the shell.
- Confirm normal local prototype screens still work.
- Run `npm test`.

## Completion Notes

- This completes the read-only bridge between Admin beta connection and future player-facing server mode.
- The next server-owned slice should be Print Bay collection.
