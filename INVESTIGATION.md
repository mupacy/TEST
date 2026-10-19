# odoobuhanga.com hotel dashboard — bug fix report

Date: 2026-10-19
Status: **Fixed and verified on the live instance**

## Reported problem

> Opening New booking or clicking any timeline dashboard button automatically
> opens the Cancellation window instead of creating a new booking in the normal
> steps.

## Root cause

The hotel dashboard is customised in the database by two `ir.asset` records:

- `buhanga_dashboard.css` (attachment 3108)
- `buhanga_dashboard.js` (attachment 3109, now superseded by 3110)

The JavaScript overrides the `custom_dashboard_tags` client action with the
`BuhangaDashboard` OWL component. In its `openCancelledBookings()` method the
action context contained:

```js
context: {
    'search_default_state_cancel': 1,
    'default_state': 'cancel'
}
```

`default_state` is inherited by the **New** button of the resulting
`room.booking` list. Every new record created from the **Cancelled
Reservations** list was therefore created with `state = 'cancel'`. Because the
form also contains the cancellation audit block, the user saw the
"Reservation Cancelled / Cancellation Details" form instead of a normal Draft
booking.

A normal New Booking from the timeline and from the other KPI lists was already
correct; the defect was specific to the Cancelled list opened from the
dashboard legend.

## Fix applied

1. Backed up the live asset to `odoo-fix/buhanga_dashboard.before.js`.
2. Removed `default_state: 'cancel'` from `openCancelledBookings()`; the
   `domain: [['state', '=', 'cancel']]` still filters the audit list correctly.
3. Uploaded the corrected file as a new public attachment
   `buhanga_dashboard_v2.js` (attachment **3110**) so the browser receives a
   new URL and cannot keep serving the old cached file.
4. Repointed `ir.asset` record **204** from
   `/web/content/3109/buhanga_dashboard.js` to
   `/web/content/3110/buhanga_dashboard_v2.js`.
5. Verified in a real headless browser against the live database.

The corrected file is stored in `odoo-fix/buhanga_dashboard.fixed.js`.

## Verification (live, authenticated browser)

| Flow | Result |
| --- | --- |
| Dashboard -> empty timeline cell | Opens normal **Draft** New Booking form; Reserve/Cancel buttons; no cancellation alert |
| Dashboard -> Check-In Requests -> New | Opens normal Draft New Booking form |
| Dashboard -> Check-Out Requests -> New | Opens normal Draft New Booking form |
| Dashboard -> Cancelled legend -> New | **Now opens normal Draft New Booking form** (previously opened the cancellation audit form) |
| Dashboard -> booking pill | Opens the existing booking normally |
| Dashboard -> guest list item | Opens the existing booking normally |

The browser loaded the new asset URL
`https://odoobuhanga.com/web/content/3110/buhanga_dashboard_v2.js` and the
dashboard initialised without console errors.

## Rollback

If needed, restore the original asset by updating `ir.asset` record 204:

```
path = /web/content/3109/buhanga_dashboard.js
```

The original file is also preserved at
`odoo-fix/buhanga_dashboard.before.js`.

## Notes

- The Odoo module itself is `hotel_management_odoo` (Cybrosys). The defect was
  in the database-level dashboard override, not in the module source.
- No application source repository was present in the workspace; the live
  asset was changed through the authenticated Odoo RPC API.
- No credentials are stored in this repository.
