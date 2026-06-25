# Beta Client Mode Bridge

## Player Goal

Prepare the browser app to inspect shared beta server state without breaking local prototype play.

## Scope

- Add a browser-side beta API helper.
- Add an Admin-only Shared Beta Connection panel.
- Store Worker API base, manual tester token, optional admin token, and tester creation fields in local storage.
- Load `/api/state` and summarize server-owned state inside Admin.
- Keep all normal player actions in local prototype mode.

## Out Of Scope

- Replacing local gameplay state with server state.
- Server-backed market/fab/dispatch UI actions.
- Open sign-up.
- Production auth.

## Playtest Checklist

- Open Admin.
- Save a beta API base and tester token.
- Load beta state and confirm tester name, credits, inventory, fabs, Print Bay, market orders, and shipments summarize correctly.
- Create tester can be used later against a live Worker with an admin token.
- Confirm normal local prototype screens still work.
- Run `npm test`.

## Completion Notes

- `beta-client.js` now owns beta API connection storage and fetch helpers.
- Admin now exposes a desktop-only beta connection panel.
- The read-only Beta Shell now maps loaded server state into a player-like inspection view.
- The next slice is switching one action at a time to server calls, starting with Print Bay collection.
