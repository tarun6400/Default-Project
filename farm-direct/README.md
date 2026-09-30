# FarmDirect — SIH26033

**Ministry of Consumer Affairs, Food & Public Distribution**
Theme: Agriculture, FoodTech & Rural Development

> Multiple intermediaries reduce farmers' earnings and increase consumer prices.
> FarmDirect cuts the unnecessary middlemen out of the food supply chain.

No build step. No npm install. Five `<script>` tags and a Postgres database.

---

## Run it

```bash
start index.html
# or serve it
npx serve .
```

Open **http://localhost:5173/**. The site boots in **demo mode** with bundled
sample data and every feature works. Add your Supabase keys to `config.js` to
switch to a real database — see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

### Signing in without a backend

A green bar along the bottom always tells you which mode you are in. With no
Supabase project it says **Demo mode**, and the sign-in dialog offers a pinned
bar at the bottom with one-click buttons for Farmer / FPO / Buyer / Admin plus
the **Sign in** button. Those create a **local sandbox session** in
`localStorage` — the order, chat and sell flows all work end to end, but nothing
leaves your browser. Add keys to `config.js` and the same dialog switches to
real Supabase auth automatically.

The dialog's action bar is pinned to the bottom of the panel, so the submit
button is always visible and clickable — the form scrolls inside the dialog
rather than pushing the button off-screen.

---

## The problem

Farmers sell through local traders, mandis, wholesalers, distributors and
retailers. Each layer adds a margin, so the farmer receives less and the consumer
pays more. Illustratively, a ₹2,900 retail paddy price leaves roughly ₹1,450 with
the farmer — about **50% of the shelf price never reaches the grower**.

## The solution

| Layer | Purpose |
| --- | --- |
| **Direct Marketplace** | Farmers/FPOs list produce with a visible price; households, kirana stores, hotels, hostels, caterers and exporters order directly. No agents, no commission. |
| **Demand Prediction Engine** | Forecasts 7/14/30-day demand and price bands per crop and district from mandi history, seasonality and district demand. |
| **Smart Logistics & Consolidation** | Pools nearby small lots into full-value vehicle loads, optimises routes, and splits deliveries across buyers. |

---

## Backend (Supabase)

```
supabase/
├── schema.sql    # enums, 10 tables, RLS policies, 5 RPCs, 2 views,
│                 # 6 triggers, order-ref + audit logic, storage bucket
├── seed.sql      # 6 demo users, 4 FPOs, ~2400 price-history rows,
│                 # 14 listings, generated forecasts
└── config.toml   # local dev via supabase start
```

Quick start:

```bash
cd supabase && supabase start && supabase db reset
# then paste your URL + anon key into ../config.js
```

Demo accounts (password `farmdirect123`): `farmer@guntur.farm`, `fpo@dharwad.farm`,
`buyer@kirana.shop`, `admin@farmdirect.gov`.

**Tables** — `profiles`, `fpos`, `listings`, `price_history`, `forecasts`, `orders`,
`shipments`, `messages`, `reviews`, `audit_log`

**RPCs** — `place_order()` (the whole transaction: locks the listing, computes the
2% fee, splits farmer earnings vs. consumer savings, draws down stock),
`estimate_savings()`, `forecast()`, `refresh_forecasts()`, `platform_impact()`

**Views** — `listing_catalogue` (listings + seller + FPO + `savings_pct`),
`farmer_earnings`

**Security** — RLS on every table. `anon` reads only the public catalogue,
forecasts and price history. Orders are visible to buyer and seller alone.
`place_order` is `SECURITY DEFINER`, revoked from `anon`, and enforces stock,
self-order and address rules in SQL. Every order write lands in `audit_log`.

---

## What the page does

| Section | Interaction |
| --- | --- |
| **Hero** | animated 6-hop chain vs 2-hop direct chain, count-up stats |
| **The Problem** | animated price cascade + 4 failure cards |
| **The Solution** | 3 platform layers with feature ticks |
| **How It Works** | list → forecast → match → consolidate → settle |
| **Live Marketplace** | 14 listings, category filters, text search, savings badges, skeleton loading |
| **Demand Forecast** | district + horizon picker, live table with price band, confidence bar, supply signal |
| **Savings Calculator** | 3 sliders wired to the `estimate_savings` RPC |
| **Technology** | low-bandwidth, multilingual/voice, forecasting, traceability, routing, gov rails |
| **Impact** | scroll-triggered counters + farmer testimonial |
| **Dialogs** | sign in / sign up (real Supabase auth), listing detail with farmer chat, order checkout, sell-your-produce form |

Every data-backed feature degrades gracefully: if Supabase is unconfigured or a
request fails, the page falls back to bundled sample data and says so in a toast.

---

## Files

```
farm-direct/
├── index.html              # all markup
├── styles.css              # design tokens, components, responsive, reduced-motion
├── script.js               # page controller
├── config.js               # ← put your Supabase URL + anon key here
├── js/
│   ├── supabase.js         # zero-dep PostgREST + GoTrue + storage client
│   │                        # + a local auth provider used when no project
│   │                        #   is configured
│   ├── api.js              # domain layer, with sample-data fallback
│   └── auth-ui.js          # sign in / sign up, quick demo accounts,
│                            # session chip, auth gating
├── supabase/
│   ├── schema.sql
│   ├── seed.sql
│   └── config.toml
├── SUPABASE_SETUP.md       # step-by-step backend setup + troubleshooting
└── .env.example
```

## Notes

- Fully responsive; mobile menu collapses under 760px.
- Respects `prefers-reduced-motion`.
- Only network request from the frontend is Google Fonts (plus Supabase once configured).
- All figures are **illustrative sample data** for a concept build.

## Next steps for a production version

- Train a real forecasting model in Python and write to `forecasts`; keep the SQL
  `forecast()` as a passthrough
- UPI/Razorpay settlement with FPO-level pooled payouts
- USSD/SMS fallback listing for feature phones
- Offline draft listings via a PWA service worker
- e-NAM, NAFED and FPO-registry sync jobs
