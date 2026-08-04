# Voyage Ops — Travel Agency Management Dashboard

A frontend-only prototype for a single travel agency owner to search hotel offers,
create bookings, review customer booking history, and track vouchers sent to
suppliers. No backend, no authentication — everything runs in the browser and
persists to `localStorage`.

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

## What's inside

- **Hotel Search & Booking** (`/`) — search hotels, review one fixed offer per
  result, and walk through a two-step booking flow (offer details → guest
  information) that creates a new order.
- **Booking Records** (`/bookings`) — every order ever created, searchable by
  customer name, passport number, or phone, with a detail drawer and editable
  payment status.
- **Order Tracking & Voucher Management** (`/tracking`) — track supplier
  confirmation status, toggle auto-send, and simulate sending vouchers over
  WhatsApp.

All three pages read and write the same shared order list via React Context,
and changes are saved to `localStorage` automatically — refresh the page and
your bookings are still there. Use the "Reset" option in your browser's
developer tools (clearing `localStorage`) if you ever want to start over with
the original mock data.

## Notes

- Hotel images are pulled from Unsplash at runtime, so an internet connection
  is needed to see them load.
- "Sending via WhatsApp" is simulated in the UI only — no real message is sent.
