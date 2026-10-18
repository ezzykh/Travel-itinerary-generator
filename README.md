# Itinerary Builder

A web app for travel agencies to build branded trip itineraries and download them as print-ready A4 PDFs, in **English, Arabic, or both**.

- **Sabre PNR import:** paste a `*I`, `*IA` or full `*R` display from Sabre Red 360. Flights, passenger names and the booking reference fill in automatically. Waitlisted, unconfirmed and codeshare segments are recognised.
- **White-label:** each agency adds its own logo, contact details, bank details (IBAN), payment terms, cancellation policy and terms. These print on every itinerary.
- **Templates:** five ready-made designs, plus custom templates built from the agency's own colour codes, with a warning when colours are hard to read.
- **Kuwait defaults:** KWD with 3 decimals (fils), no VAT unless you add one, Kuwait-style bank and payment wording. Other Gulf currencies are included.
- **Accounts:** agencies register and their trips are saved to a Supabase database. Without Supabase keys the app runs in local mode (no login, saved in the browser), which is handy for testing.

## Pages in the PDF

1. Cover: photo or colour cover, title, guest, duration, travellers, route, and the consultant's contact details
2. Trip overview: description, highlights, hotels, and a day-by-day summary
3. Flights: one boarding-pass strip per segment, with status, class, airline reference and baggage
4. Day-by-day plan, with optional photos (more pages are added for long trips)
5. Package price: price lines, discount, optional tax, total, per-person price, inclusions and exclusions
6. Payment and policies: payment terms, bank details, cancellation policy, terms, contact and signature

## Run it locally

It's a static site with no build step. Serve the folder with any web server, for example:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` straight from the file system won't work, because browsers block JavaScript modules on `file://`.

To make the PDF: click **Download PDF**, then choose **Save as PDF** in the print window. Chrome or Edge give the best result.

## Turn on accounts (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In the project's **SQL editor**, run `supabase/schema.sql`. It creates the `agencies` and `trips` tables, the security rules (each agency only sees its own data), and the agency ID numbering (AG1001, AG1002…).
3. In **Authentication → URL configuration**, set the Site URL to where the app will live, and add it under Redirect URLs.
4. Copy the project URL and the publishable (anon) key into `js/config.js`, and set `siteUrl`.
5. Before many agencies sign up, connect your own SMTP server under **Authentication → Emails**. Supabase's built-in email only sends a few messages per hour.

The publishable key is safe to ship in the browser; the row-level security rules in `schema.sql` are what protect the data.

## Deploy

Upload the folder to any static host: Vercel, Netlify, Cloudflare Pages, GitHub Pages, or your own server.

## Customise

| What | Where |
|---|---|
| App name | `js/config.js` |
| PDF wording in English and Arabic | `js/i18n.js` |
| Airport and airline names (EN/AR) | `js/codes.js` |
| Ready-made templates | `js/themes.js` |
| Currencies and decimals | `js/money.js` |
| PDF layout | `css/sheets.css` |
| Editor look | `css/app.css` |
| Default policies, sample trip | `js/model.js` |

## PNR importer tests

```sh
npm test
```

The tests include masked copies of real Sabre `*R` displays. Add new layouts there whenever an agency's screen looks different.

## Known limits

- Photos and logos are resized and stored inside the trip record. That's fine for normal use. For heavy use, move them to Supabase Storage.
- Booking-class letters mean different cabins on different airlines. Only unambiguous letters (F, J, C, D, Z, Y) are named automatically; agents choose the cabin on each flight otherwise.
- Hotel and car segments in a PNR are skipped; hotels are entered on the Hotels tab.
