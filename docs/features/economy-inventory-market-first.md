# Economy Inventory Market First Pass

## Player Goal

Let players quickly see what is in a city, then make deliberate economy decisions from the city market without turning low-tier items into automatic junk.

## Scope

- Inventory becomes a compact city backpack:
  - city name
  - storage capacity
  - filters
  - item grid
  - item action sheet
- Market Sell becomes the main economy workbench:
  - Has Local Bids
  - No Local Bids
  - Protected Pattern Parts
  - Review Tray for selected sell, list, and recycle actions
- Market Buy keeps the existing city-first landing page.
- The Review Tray previews selected quantity, expected credits or asking value, protected exclusions, and freed inventory slots before confirmation.

## Out Of Scope

- Dispatch redesign.
- Cross-city market intel in inventory.
- Auto-sell or auto-recycle.
- Backend account or multiplayer order matching.
- Creative naming and lore pass.

## Playtest Checklist

- Open Inventory on desktop and phone.
- Confirm Inventory has no visible bulk action panel.
- Search Inventory and make sure typing keeps focus.
- Tap an inventory item and open it in Market.
- In Market Sell, select items with bids and sell through Review Tray.
- Switch Review Tray to List and list no-bid items at item value.
- Switch Review Tray to Recycle and recycle selected items after confirmation.
- Confirm protected pattern parts are excluded while protection is on.
- Confirm Market Buy still opens as a city-local landing page.
- Run `npm test`.

## Completion Notes

- Inventory now acts as storage-first UI.
- Market Sell now owns intentional bulk economy actions.
- Review Tray state is local prototype UI state, not a backend schema.
