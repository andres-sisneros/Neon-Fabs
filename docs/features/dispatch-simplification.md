# Dispatch Simplification

## Player Goal

Players should understand Dispatch as a focused route job flow, not a dense logistics dashboard. Merchant players should see cargo shipping. Routejack players should see raid convoy setup. Completed records should be available without crowding the launch flow.

## Scope

- Keep the existing role-specific dispatch wizard.
- Make the primary page focus on current job setup and active vehicles.
- Move completed arrivals, raid results, battle history, and logs into one clearer records area.
- Preserve current merchant and routejack mechanics.

## Out Of Scope

- New combat mechanics.
- New route encounter tuning.
- Rewriting the dispatch wizard from scratch.
- Multiplayer route visibility.

## Likely Files Touched

- `app.js`
- `dispatch-flow.js`
- `dispatch-flow.css`
- `docs/ROADMAP.md`
- `docs/WIKI.md`

## Acceptance Checklist

- Merchant Dispatch still sends mixed cargo.
- Routejack Dispatch still launches raids.
- Active jobs remain visible immediately after launch.
- Battle results remain discoverable and replayable.
- Mobile Dispatch has fewer always-open panels.

## Implementation Notes

- The primary Dispatch page now keeps setup and active jobs open.
- Completed arrivals, raid returns, stolen goods, route battle records, replays, and route logs are grouped into Records & Replays.
- Records & Replays opens automatically when there are completed jobs or selected battle replays.

## Docs Touched

- `docs/WIKI.md`
- `docs/DESIGN_DECISIONS.md`
- `docs/ROADMAP.md`

## Remaining Risks

- The wizard itself still feels more like form setup than a map-led journey.
- Cargo loading still needs a deeper mobile-first redesign once route combat balance settles.
