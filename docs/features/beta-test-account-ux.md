# Beta Test Account UX

## Player Goal

Make beta server testing feel like connecting a test account, not managing an auth token.

## Scope

- Rename the Admin beta panel to Beta Test Account.
- Make Create & Connect Test Account the primary path.
- Keep API base, admin token, and tester token inside Advanced Connection.
- Store tester tokens internally after account creation.
- Let normal Fabs enter server mode automatically when a connected beta account exists.
- Clear Account removes the stored token and returns the app to local prototype fallback.
- If setup is missing, Create & Connect should open Advanced Connection and show the missing requirement in-panel.

## Out Of Scope

- Public login.
- Friend-facing account creation.
- Worker endpoint or D1 schema changes.
- Server-backed Market, Patterns, Dispatch, or Inventory actions.

## Test Checklist

- Open Admin and see Beta Test Account.
- Open Advanced Connection and save API/admin details.
- Create & Connect Test Account without manually copying a tester token.
- Confirm Beta Shell opens from the connected account.
- Confirm Fabs uses server mode after connection.
- Clear Account and confirm Fabs returns to local prototype mode.
- Run `npm test`.

## Notes

Tester tokens still exist as internal Worker auth. Manual token paste is kept only as an advanced debugging/export fallback until real login exists.
