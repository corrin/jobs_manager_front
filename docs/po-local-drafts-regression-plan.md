# PO Local Drafts - Regression Test Plan

## Goal

Ensure local draft purchase orders behave like regular POs in the UI and persist across navigation, while only differing in status.

## Scope

- Draft creation, autosave, persistence, and resumption.
- Suggested PO number display and persistence.
- PO list visibility, sorting, search, and status display for local drafts.
- Publishing flow converts local draft into server PO.
- Pickup address flow still works with the new create route.

## Risks / Bugs We Want to Catch

- Drafts not persisted without edits or after refresh.
- Suggested PO number missing or not stored with draft.
- Drafts not showing in PO list, or showing in a different UI layout.
- Drafts not resumable from the list.
- Publish button disabled because line validation fails.
- Mixed routing between /purchasing/po/create and /purchasing/po/new.

## Regression Test Checklist (E2E)

1. Draft creation + persistence

   - Navigate to /purchasing/po/new.
   - Select supplier, add reference, add line (description + unit cost).
   - Verify PO # shows a suggested number.
   - Navigate to /purchasing/po and confirm draft appears as a row with status "Local Draft".

2. Draft resume

   - Click the draft row.
   - Confirm /purchasing/po/new?draft=... opens.
   - Verify the suggested PO # and line data are still present.

3. Draft publish

   - Click Publish PO.
   - Confirm POST /purchase-orders returns 200/201.
   - Verify redirect to /purchasing/po/{id}.
   - Confirm draft row no longer appears in the list.

4. Draft discard

   - Create a draft, then discard it.
   - Verify it no longer appears in the PO list.

5. Pickup address flow regression
   - Create and publish a PO via /purchasing/po/new.
   - Verify pickup address selector, modal, and CRUD behavior still work.

## Automation Notes

- Add data-automation-id hooks for publish/discard buttons, PO row, and status.
- Prefer stable selectors and avoid timing flakiness by waiting on network responses.

## Out of Scope

- Backend persistence of drafts (drafts remain local).
- Mobile-specific UI differences.

## Owners

- Frontend: update tests and selectors.
- QA: run Playwright suite and record screenshots.
