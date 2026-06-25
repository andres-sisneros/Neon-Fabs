# Server-Backed Print Bay Collection

## Player Goal

When a beta tester account is connected, the normal Fabs page should open the real server-owned Print Bay, reveal collected output, and recharge battery from the Worker-backed account.

## Scope

- Treat a saved beta token as server runtime mode.
- Auto-load `/api/state` for beta account summaries.
- Render server-owned fabs and pending Print Bay output on the normal Fabs page.
- Collect city-scoped output with `POST /api/fabs/collect`.
- Show a reveal panel for the newly collected server items.
- Keep local Fabs collection as fallback when no beta token is configured.

## Out Of Scope

- Server-backed market, patterns, dispatch, equipment, or fab shop actions.
- Inventory capacity enforcement beyond what the server returns.
- Save migration from browser prototype state.
- Public account creation UX.

## Playtest Checklist

- Clear the beta token and confirm local Fabs collection still works.
- Save a beta token and open Fabs without visiting Admin first.
- Confirm header and side panel show server credits, reputation, battery, and sealed output.
- Collect Print Bay output in the viewed city.
- Confirm revealed items appear and battery shows recharged.
- Confirm another city with no server fabs shows an empty server state, not local fabs.
- Run `npm test`.

## Completion Notes

- This is the first normal player-facing server-owned gameplay action.
- Other tabs may still show local prototype data until their server slices land.
