# Supabase setup for FarmDirect

Everything below is the backend. The site ships with the same features working
in **demo mode** (bundled sample data), so you only need this if you want real
persistence, real auth and real order records.

---

## 1. Create the project

Either hosted or local.

**Hosted (easiest)**
1. <https://supabase.com> → New project
2. Pick a region close to your users (Mumbai / Singapore for India)
3. Save the database password somewhere safe

**Local (needs the [Supabase CLI](https://supabase.com/docs/guides/cli))**
```bash
cd farm-direct/supabase
supabase start
supabase db reset        # runs schema.sql then seed.sql
```
`supabase start` prints the local URL and anon key. Skip to step 3.

---

## 2. Run the schema and seed

**Hosted:** open **SQL Editor → New query**, then run, in order:

1. `supabase/schema.sql` — tables, enums, RLS policies, RPCs, triggers, views, storage
2. `supabase/seed.sql` — demo users, FPOs, 3 years of price history, 14 listings, forecasts

Both are idempotent, so re-running is safe. The seed ends with a row count you
can check:

```
profiles | fpos | listings | price_rows | forecasts
```

Expect roughly `16 · 4 · 14 · 2400 · 45`.

---

## 3. Point the site at it

**Project Settings → API** → copy *Project URL* and *anon public* key.

Edit `config.js` in the project root:

```js
window.FARMDIRECT_CONFIG = {
  supabaseUrl: "https://xxxxxxxx.supabase.co",
  supabaseAnonKey: "eyJhbGciOi...",
  ...
};
```

Reload the page. The status pill at the bottom of the screen stops saying
"Demo mode" and the marketplace reads from Postgres.

> The **anon** key is designed to be public — access is controlled by the RLS
> policies in `schema.sql`, not by hiding the key. Never paste the
> `service_role` key into frontend code.

---

## 4. Demo accounts

Created by `seed.sql`. Password for all of them: `farmdirect123`

| Email | Role | Notes |
| --- | --- | --- |
| `farmer@guntur.farm` | farmer | Venkateswarlu, Kaza, Guntur |
| `farmer@nadia.farm` | farmer | Kiran Kumar, Kukunoor, Nadia |
| `fpo@dharwad.farm` | fpo | Anjaneyulu Patil, Dharwad Pulse Producers |
| `buyer@kirana.shop` | buyer | Ramesh Store, Guntur |
| `buyer@hostelgroup.in` | buyer | Sunita Catering, Bareilly |
| `admin@farmdirect.gov` | admin | District officer |

If you cannot sign in, make sure **Email confirmation is off**
(Authentication → Providers → Email) or confirm each address manually.

---

## What is in the database

| Table | Purpose | Who can read |
| --- | --- | --- |
| `profiles` | one row per user, holds the role | everyone (sellers must be visible) |
| `fpos` | Farmer Producer Organisations | everyone |
| `listings` | the marketplace catalogue | anyone for `active`; owner for the rest |
| `price_history` | mandi + retail observations, the model input | everyone |
| `forecasts` | model output per crop/district/horizon | everyone |
| `orders` | direct trades, with fee and savings split out | buyer + seller only |
| `shipments` | consolidation groups, vehicle, route, tracking | buyer + seller only |
| `messages` | buyer ↔ farmer chat on a listing | participants only |
| `reviews` | post-delivery rating | everyone |
| `audit_log` | tamper-evident trail for regulators | admins only |

### RPC functions

| Function | Called by | Purpose |
| --- | --- | --- |
| `place_order(listing_id, quantity, address)` | Order button | the whole transaction in one round trip: validates stock, locks the row, computes the 2% fee, splits farmer earnings vs. consumer savings, writes the order, draws down the listing |
| `estimate_savings(budget, share, hops)` | savings calculator | removable-margin model, 6 points per hop |
| `forecast(crop, district, horizon)` | forecast table | recency-weighted mandi mean with a dispersion band |
| `refresh_forecasts()` | cron / admin | materialises forecasts for every crop-district pair |
| `platform_impact()` | impact section | GMV, farmer income, consumer savings, counts |

### Views

- `listing_catalogue` — listings joined to seller and FPO, with `savings_pct` computed
- `farmer_earnings` — per-farmer rollup of delivered orders

---

## Security model

- Every table has RLS enabled; `anon` can only read the public catalogue,
  forecasts and price history.
- `place_order` is `SECURITY DEFINER` and revoked from `anon`, so pricing and
  stock can never be forged from the browser.
- A buyer cannot order their own listing, cannot read someone else's orders, and
  cannot exceed available quantity — all enforced in SQL, not in the client.
- Trigger `trg_orders_audit` writes every order insert/update into `audit_log`.

---

## Wiring the remaining pieces

**Photo upload** — `produce-images` bucket already exists.

```js
const { publicUrl } = await SB.storage
  .from("produce-images")
  .upload(`${user.id}/${crypto.randomUUID()}.jpg`, file, { upsert: true });
// then set image_url on the listing
```

**Scheduled forecasts** — call `refresh_forecasts()` nightly:

```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/refresh_forecasts" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

**A real model** — replace the body of `forecast()` in `schema.sql`. The current
one is a deterministic baseline so the page has meaningful numbers without any
Python service. For a trained model, run it in Python, write to `forecasts`,
and leave the SQL function as a passthrough.

---

## Troubleshooting

**"I can't log in" — work through this list first.**

| Symptom | Cause | Fix |
| --- | --- | --- |
| **The submit button is missing from the sign-in dialog** | an older `styles.css` without `max-height` + `overflow-y:auto` on `.modal__panel` — the dialog was taller than the screen and the button was pushed out of view with no way to scroll | re-copy the current `styles.css` / `js/auth-ui.js`, then hard-reload with `Ctrl+Shift+R`. The current build pins the action bar to the bottom of the dialog |
| Green bar says **Demo mode**, and you want real sign-in | `config.js` has blank values | Paste the URL + anon key (§3), then hard-reload with `Ctrl+Shift+R` |
| Green bar says **Demo mode** and sign-in offers 1-click buttons | working as designed — no backend, so a **local sandbox session** is created in `localStorage` | nothing to fix; add keys to use a real database |
| "Supabase is not configured" | `supabaseUrl` or `supabaseAnonKey` still empty, or the URL is missing `https://` | check `config.js`; the value must start with `https://` and end in `.supabase.co` |
| Bar says **Supabase configured, offline** | keys are present but every request failed | your project may be paused, or the anon key is wrong. Open the URL in a new tab — it should return JSON |
| "Could not reach Supabase" | wrong URL, or the project is paused | check the project is active in the dashboard |
| "Invalid login credentials" | the seed users do not exist | re-run `seed.sql`. It prints the rows it created — check the output |
| "Email not confirmed" | **Email confirmation** is ON in Authentication → Sign In / Providers | either confirm the addresses, or turn Email confirmation **off** for a demo project |
| "User already registered" on sign-up | that address is one of the seed accounts | sign in instead, or use a different address |
| Sign-in succeeds but the chip stays hidden | `profiles` row is missing so `profile()` returned null | the `handle_new_user` trigger creates it; re-run `schema.sql`, then `select * from public.profiles;` |
| Listings load but the forecast table is empty | `refresh_forecasts()` has not run | run `select public.refresh_forecasts();` or re-run `seed.sql` |
| `permission denied for table listings` | RLS is doing its job — no user token on the request | check `await SB.auth.getSession()` in the console |
| "new row violates row-level security policy" on insert | the account role is `buyer`; only `farmer`, `fpo` and `admin` may publish | `update public.profiles set role='farmer' where id = '<user id>';` |
| Publishing a listing fails with a not-null error | an older `schema.sql` without `default auth.uid()` on `listings.seller_id` | re-run the current `schema.sql` — the default is now set |
| Cached old files after editing | browser cached the JS | `Ctrl+Shift+R` (hard reload) |

