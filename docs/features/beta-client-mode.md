# Beta Client Mode Bridge

## Player Goal

Prepare the browser app to inspect shared beta server state without breaking local prototype play.

## Scope

- Add a browser-side beta API helper.
- Add an Admin-only Beta Test Account panel.
- Store Worker API base, optional admin token, tester creation fields, and internal tester auth in local storage.
- Load `/api/state` and summarize server-owned state inside Admin.
- Keep all normal player actions in local prototype mode.

## Out Of Scope

- Replacing local gameplay state with server state.
- Server-backed market/fab/dispatch UI actions.
- Open sign-up.
- Production auth.

## Playtest Checklist

- Open Admin.
- Open Advanced Connection and save the beta API base/admin token if needed.
- Create & Connect Test Account without manually copying a tester token.
- Load beta state and confirm tester name, credits, inventory, fabs, Print Bay, market orders, and shipments summarize correctly.
- Confirm manual tester token entry remains available only as an advanced fallback.
- Confirm normal local prototype screens still work.
- Run `npm test`.

## Completion Notes

- `beta-client.js` now owns beta API connection storage and fetch helpers.
- Admin now exposes a desktop-only Beta Test Account panel.
- The read-only Beta Shell now maps loaded server state into a player-like inspection view.
- The next slice is switching one action at a time to server calls, starting with Print Bay collection.
