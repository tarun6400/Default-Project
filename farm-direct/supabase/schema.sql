-- ============================================================================
-- FarmDirect — SIH26033
-- Ministry of Consumer Affairs, Food & Public Distribution
-- Domain: Agriculture, FoodTech & Rural Development
--
-- Postgres schema, Row Level Security policies, RPCs, triggers and storage.
-- Run this in Supabase Studio > SQL Editor, or with `supabase db push`.
-- Idempotent: safe to re-run.
-- ============================================================================

begin;

create extension if not exists "pgcrypto";
create extension if not exists "moddatetime";

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role      as enum ('farmer','fpo','buyer','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.listing_status  as enum ('draft','active','reserved','sold_out','withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status    as enum ('pending','confirmed','in_transit','delivered','cancelled','disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status  as enum ('pending','held','released','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shipment_status as enum ('pending','picking_up','in_transit','delivered','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crop_category   as enum ('grain','veg','fruit','oil','spice','other');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------------

-- 2.1 profiles — one row per authenticated user, created by trigger
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  role          public.user_role     not null default 'buyer',
  full_name     text,
  phone         text,
  district      text,
  state         text,
  village       text,
  language      text not null default 'en',
  fpo_id        uuid,
  is_verified   boolean not null default false,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint profiles_phone_fmt check (phone is null or phone ~ '^\+?[0-9]{10,15}$')
);
create index if not exists profiles_role_idx    on public.profiles(role);
create index if not exists profiles_district_idx on public.profiles(district, state);

-- 2.2 fpos — Farmer Producer Organisations
create table if not exists public.fpos (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  registration_no  text unique,
  district         text not null,
  state            text not null,
  member_count     integer not null default 0 check (member_count >= 0),
  is_verified      boolean not null default false,
  verified_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists fpos_district_idx on public.fpos(district, state);

-- link profiles.fpo_id -> fpos.id (added after fpos exists)
do $$ begin
  alter table public.profiles
    drop constraint if exists profiles_fpo_id_fkey;
  alter table public.profiles
    add constraint profiles_fpo_id_fkey
    foreign key (fpo_id) references public.fpos(id) on delete set null;
exception when duplicate_object then null; end $$;

-- 2.3 price_history — the training signal for demand prediction
create table if not exists public.price_history (
  id            bigserial primary key,
  crop          text        not null,
  district      text        not null,
  state         text,
  msp_per_qtl   numeric(10,2),          -- government MSP where applicable
  mandi_rate    numeric(10,2) not null, -- what the farmer gets at the mandi
  retail_rate   numeric(10,2) not null, -- what a consumer pays
  recorded_on   date        not null default current_date,
  created_at    timestamptz not null default now(),
  constraint price_history_sane check (retail_rate >= mandi_rate)
);
create unique index if not exists price_history_unique
  on public.price_history(crop, district, recorded_on);
create index if not exists price_history_lookup
  on public.price_history(crop, district, recorded_on desc);

-- 2.4 listings — the direct marketplace
create table if not exists public.listings (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  fpo_id         uuid references public.fpos(id) on delete set null,
  crop           text not null,
  variety        text,
  category       public.crop_category not null default 'other',
  grade          text,
  description    text,
  quantity       numeric(12,2) not null check (quantity > 0),
  unit           text not null default 'qtl',
  price_per_unit numeric(12,2) not null check (price_per_unit > 0),
  mrp_per_unit   numeric(12,2) check (mrp_per_unit is null or mrp_per_unit >= price_per_unit),
  harvest_date   date,
  available_from date not null default current_date,
  district       text not null,
  state          text not null,
  image_url      text,
  status         public.listing_status not null default 'active',
  view_count     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  sold_at        timestamptz
);
create index if not exists listings_active_idx   on public.listings(status, category);
create index if not exists listings_crop_idx     on public.listings(crop);
create index if not exists listings_district_idx on public.listings(district, state);
create index if not exists listings_seller_idx  on public.listings(seller_id);

-- 2.5 orders
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_ref        text unique,
  buyer_id         uuid not null references public.profiles(id) on delete cascade,
  -- seller is derived from the single listing behind a direct order
  seller_id        uuid not null references public.profiles(id) on delete cascade,
  listing_id       uuid not null references public.listings(id) on delete restrict,
  quantity         numeric(12,2) not null check (quantity > 0),
  unit_price       numeric(12,2) not null check (unit_price > 0),
  mrp_total        numeric(12,2),
  total_amount     numeric(12,2) not null check (total_amount >= 0),
  farmer_earnings  numeric(12,2) not null check (farmer_earnings >= 0),
  consumer_savings numeric(12,2) not null default 0 check (consumer_savings >= 0),
  platform_fee     numeric(12,2) not null default 0 check (platform_fee >= 0),
  delivery_address text not null,
  district         text,
  state            text,
  status           public.order_status   not null default 'pending',
  payment_status   public.payment_status not null default 'pending',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  delivered_at     timestamptz,
  -- a buyer cannot order from themselves
  constraint orders_no_self_order check (buyer_id <> seller_id)
);
create index if not exists orders_buyer_idx  on public.orders(buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.orders(seller_id, created_at desc);
create index if not exists orders_status_idx on public.orders(status);

-- 2.6 shipments — consolidation + routing
create table if not exists public.shipments (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null unique references public.orders(id) on delete cascade,
  consolidation_group   text,          -- farms pooled into the same vehicle
  vehicle_no            text,
  driver_name           text,
  driver_phone          text,
  from_location         text not null,
  to_location           text not null,
  load_kg               numeric(10,2),
  distance_km           numeric(10,2),
  cost_per_kg           numeric(8,4),
  status                public.shipment_status not null default 'pending',
  departs_at            timestamptz,
  arrives_at            timestamptz,
  tracking_note         text,
  created_at            timestamptz not null default now()
);
create index if not exists shipments_group_idx on public.shipments(consolidation_group);
create index if not exists shipments_status_idx on public.shipments(status);

-- 2.7 forecasts — demand prediction output
create table if not exists public.forecasts (
  id                 bigserial primary key,
  crop               text    not null,
  district           text    not null,
  horizon_days       integer not null check (horizon_days in (7,14,30)),
  predicted_price    numeric(10,2) not null,
  price_low          numeric(10,2) not null,
  price_high         numeric(10,2) not null,
  predicted_demand   numeric(12,2) not null,  -- quintals expected in horizon
  confidence         numeric(4,3) not null check (confidence between 0 and 1),
  supply_signal      text,                    -- 'surplus' | 'tight' | 'balanced'
  model_version      text    not null default 'baseline-v1',
  generated_at       timestamptz not null default now(),
  unique (crop, district, horizon_days, generated_at)
);
create index if not exists forecasts_lookup
  on public.forecasts(crop, district, horizon_days, generated_at desc);

-- 2.8 messages — direct farmer <-> buyer chat on a listing
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body       text not null check (length(btrim(body)) > 0),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_listing_idx on public.messages(listing_id, created_at);

-- 2.9 reviews — only for delivered orders
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null unique references public.orders(id) on delete cascade,
  author_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);

-- 2.10 audit_log — tamper-evident trail for regulators
create table if not exists public.audit_log (
  id         bigserial primary key,
  actor_id   uuid,
  action     text not null,
  entity     text not null,
  entity_id  text,
  payload    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_entity_idx on public.audit_log(entity, entity_id);

-- ---------------------------------------------------------------------------
-- 3. TRIGGERS
-- ---------------------------------------------------------------------------

-- 3.1 updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_listings_touch on public.listings;
create trigger trg_listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- 3.2 auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, phone, district, state, village)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'buyer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'district',
    new.raw_user_meta_data ->> 'state',
    new.raw_user_meta_data ->> 'village'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.3 generate a human-readable order reference
create or replace function public.gen_order_ref()
returns trigger language plpgsql as $$
begin
  new.order_ref := 'FD' || to_char(now(), 'YYMM') || '-' ||
                   upper(substr(md5(random()::text), 1, 6));
  return new;
end $$;

drop trigger if exists trg_order_ref on public.orders;
create trigger trg_order_ref before insert on public.orders
  for each row execute function public.gen_order_ref();

-- 3.4 write to the audit trail
create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
begin
  insert into public.audit_log (actor_id, action, entity, entity_id, payload)
  values (
    v_actor,
    tg_op,
    tg_table_name,
    coalesce(new.id::text, old.id::text),
    to_jsonb(coalesce(new, old))
  );
  return coalesce(new, old);
end $$;

drop trigger if exists trg_orders_audit on public.orders;
create trigger trg_orders_audit after insert or update on public.orders
  for each row execute function public.log_audit();

-- 3.5 release payment + mark delivered on shipment completion
create or replace function public.settle_on_delivery()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'delivered' then
    update public.orders
       set status         = 'delivered',
           payment_status = 'released',
           delivered_at   = coalesce(new.arrives_at, now())
     where id = new.order_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_settle on public.shipments;
create trigger trg_settle after update on public.shipments
  for each row execute function public.settle_on_delivery();

-- 3.6 mark a listing sold_out when quantity hits zero
create or replace function public.close_listing_if_empty()
returns trigger language plpgsql as $$
begin
  if new.status = 'sold_out' then
    new.sold_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_listing_sold_out on public.listings;
create trigger trg_listing_sold_out before update on public.listings
  for each row execute function public.close_listing_if_empty();

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table public.profiles      enable row level security;
alter table public.fpos          enable row level security;
alter table public.listings      enable row level security;
alter table public.price_history enable row level security;
alter table public.orders        enable row level security;
alter table public.shipments     enable row level security;
alter table public.forecasts     enable row level security;
alter table public.messages      enable row level security;
alter table public.reviews       enable row level security;
alter table public.audit_log     enable row level security;

-- 4.1 profiles
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select using (true);            -- seller identity must be visible to buyers

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- 4.2 fpos
drop policy if exists fpos_select_all on public.fpos;
create policy fpos_select_all on public.fpos for select using (true);

drop policy if exists fpos_write_admin on public.fpos;
create policy fpos_write_admin on public.fpos
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  );

-- 4.3 listings — public catalogue, seller-owned writes
drop policy if exists listings_select_active on public.listings;
create policy listings_select_active on public.listings
  for select using (status in ('active','reserved') or seller_id = auth.uid());

drop policy if exists listings_insert_own on public.listings;
create policy listings_insert_own on public.listings
  for insert with check (
    seller_id = auth.uid()
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role in ('farmer','fpo','admin'))
  );

drop policy if exists listings_update_own on public.listings;
create policy listings_update_own on public.listings
  for update using (seller_id = auth.uid()) with check (seller_id = auth.uid());

drop policy if exists listings_delete_own on public.listings;
create policy listings_delete_own on public.listings
  for delete using (seller_id = auth.uid());

-- 4.4 price_history
drop policy if exists price_history_select_all on public.price_history;
create policy price_history_select_all on public.price_history for select using (true);

drop policy if exists price_history_write_seller on public.price_history;
create policy price_history_write_seller on public.price_history
  for insert with check (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('farmer','fpo','admin'))
  );

-- 4.5 orders — only the two parties (and admins) can see them
drop policy if exists orders_select_parties on public.orders;
create policy orders_select_parties on public.orders
  for select using (
    auth.uid() in (buyer_id, seller_id)
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists orders_insert_buyer on public.orders;
create policy orders_insert_buyer on public.orders
  for insert with check (buyer_id = auth.uid() and auth.uid() <> seller_id);

drop policy if exists orders_update_parties on public.orders;
create policy orders_update_parties on public.orders
  for update using (auth.uid() in (buyer_id, seller_id))
  with check (auth.uid() in (buyer_id, seller_id));

-- 4.6 shipments — visible to the parties, mutable by the seller
drop policy if exists shipments_select_parties on public.shipments;
create policy shipments_select_parties on public.shipments
  for select using (
    exists (select 1 from public.orders o
            where o.id = shipments.order_id
              and auth.uid() in (o.buyer_id, o.seller_id))
  );

drop policy if exists shipments_update_seller on public.shipments;
create policy shipments_update_seller on public.shipments
  for update using (
    exists (select 1 from public.orders o
            where o.id = shipments.order_id and o.seller_id = auth.uid())
  ) with check (
    exists (select 1 from public.orders o
            where o.id = shipments.order_id and o.seller_id = auth.uid())
  );

-- 4.7 forecasts — public intelligence
drop policy if exists forecasts_select_all on public.forecasts;
create policy forecasts_select_all on public.forecasts for select using (true);

drop policy if exists forecasts_write_admin on public.forecasts;
create policy forecasts_write_admin on public.forecasts
  for insert with check (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  );

-- 4.8 messages — participants only
drop policy if exists messages_select_parties on public.messages;
create policy messages_select_parties on public.messages
  for select using (
    sender_id = auth.uid()
    or exists (select 1 from public.listings l where l.id = messages.listing_id and l.seller_id = auth.uid())
  );

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and (exists (select 1 from public.listings l
                 where l.id = messages.listing_id
                   and (l.seller_id = auth.uid() or l.status = 'active')))
  );

drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
  for update using (sender_id = auth.uid()) with check (sender_id = auth.uid());

-- 4.9 reviews — public read, order participant writes
drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all on public.reviews for select using (true);

drop policy if exists reviews_insert_participant on public.reviews;
create policy reviews_insert_participant on public.reviews
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from public.orders o
                where o.id = reviews.order_id
                  and o.buyer_id = auth.uid()
                  and o.status = 'delivered')
  );

-- 4.10 audit_log — admins only
drop policy if exists audit_select_admin on public.audit_log;
create policy audit_select_admin on public.audit_log
  for select using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- 5. VIEWS
-- ---------------------------------------------------------------------------

-- 5.1 catalogue with seller + fpo denormalised (what the marketplace reads)
create or replace view public.listing_catalogue
with (security_invoker = true) as
select
  l.*,
  p.full_name  as seller_name,
  p.phone      as seller_phone,
  p.district   as seller_district,
  p.is_verified as seller_verified,
  p.role       as seller_role,
  f.name       as fpo_name,
  f.member_count as fpo_member_count,
  case
    when l.mrp_per_unit is null or l.mrp_per_unit <= 0 then null
    else round(((l.mrp_per_unit - l.price_per_unit) / l.mrp_per_unit) * 100, 1)
  end as savings_pct
from public.listings l
join public.profiles p on p.id = l.seller_id
left join public.fpos f on f.id = l.fpo_id;

-- 5.2 farmer earnings rollup
create or replace view public.farmer_earnings
with (security_invoker = true) as
select
  o.seller_id,
  p.full_name,
  p.district,
  p.state,
  count(*)                        as order_count,
  sum(o.quantity)                 as total_quantity,
  sum(o.total_amount)             as gross_revenue,
  sum(o.farmer_earnings)          as net_earnings,
  round(avg(o.total_amount / nullif(o.quantity, 0)), 2) as avg_price_per_unit,
  avg(o.quantity * o.mrp_total / nullif(o.mrp_total, 0)) as baseline_mandi_earnings
from public.orders o
join public.profiles p on p.id = o.seller_id
where o.status = 'delivered'
group by o.seller_id, p.full_name, p.district, p.state;

-- ---------------------------------------------------------------------------
-- 6. RPC / FUNCTIONS
-- ---------------------------------------------------------------------------

-- 6.1 place_order — the core direct-trade transaction
create or replace function public.place_order(
  p_listing_id       uuid,
  p_quantity         numeric,
  p_delivery_address text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer   uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_order   public.orders%rowtype;
  v_fee     numeric;
begin
  if v_buyer is null then
    raise exception 'You must be signed in to place an order.' using errcode = '42501';
  end if;

  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then
    raise exception 'Listing not found.' using errcode = 'P0002';
  end if;
  if v_listing.status <> 'active' then
    raise exception 'This listing is no longer active (status: %).', v_listing.status;
  end if;
  if v_listing.seller_id = v_buyer then
    raise exception 'You cannot order your own listing.' using errcode = '22023';
  end if;
  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero.' using errcode = '22023';
  end if;
  if p_quantity > v_listing.quantity then
    raise exception 'Only % % available, you asked for %.', v_listing.quantity, v_listing.unit, p_quantity;
  end if;
  if btrim(coalesce(p_delivery_address, '')) = '' then
    raise exception 'A delivery address is required.' using errcode = '22023';
  end if;

  -- transparent 2% platform fee paid by the buyer, never deducted from the farmer
  v_fee := round(v_listing.price_per_unit * p_quantity * 0.02, 2);

  insert into public.orders (
    buyer_id, seller_id, listing_id, quantity, unit_price, mrp_total,
    total_amount, farmer_earnings, consumer_savings, platform_fee,
    delivery_address, district, state, status, payment_status
  ) values (
    v_buyer,
    v_listing.seller_id,
    v_listing.id,
    p_quantity,
    v_listing.price_per_unit,
    case when v_listing.mrp_per_unit is not null
         then v_listing.mrp_per_unit * p_quantity else null end,
    (v_listing.price_per_unit * p_quantity) + v_fee,
    v_listing.price_per_unit * p_quantity,
    case when v_listing.mrp_per_unit is not null
         then (v_listing.mrp_per_unit - v_listing.price_per_unit) * p_quantity
         else 0 end,
    v_fee,
    p_delivery_address,
    nullif(split_part(p_delivery_address, ',', 2), ''),
    nullif(split_part(p_delivery_address, ',', 3), ''),
    'pending',
    'held'
  ) returning * into v_order;

  -- draw down the listing
  update public.listings
     set quantity = quantity - p_quantity,
         status   = case when quantity - p_quantity <= 0 then 'sold_out'::public.listing_status
                         else status end
   where id = v_listing.id;

  return v_order;
end $$;

revoke all on function public.place_order(uuid, numeric, text) from public;
grant execute on function public.place_order(uuid, numeric, text) to authenticated;

-- 6.2 estimate_savings — powers the on-page savings calculator
create or replace function public.estimate_savings(
  p_budget numeric,
  p_chain_share numeric default 100,   -- % of basket bought through intermediaries
  p_hops integer default 5            -- intermediaries in the current chain
)
returns jsonb
language sql
stable
as $$
  with params as (
    select
      greatest(p_budget, 0) as budget,
      least(greatest(p_chain_share, 0), 100) / 100.0 as share,
      least(greatest(p_hops, 1), 6) as hops
  ),
  calc as (
    -- removable margin grows ~6 percentage points per extra hop
    select
      budget, share, hops,
      (0.01 + hops * 0.06) * share as frac
    from params
  )
  select jsonb_build_object(
    'spend_today',       round(budget),
    'spend_direct',      round(budget - budget * frac),
    'saved',             round(budget * frac),
    'saved_pct',         round(frac * 100, 1),
    'to_farmers',        round(budget * frac * 0.72),
    'annual_to_farmers', round(budget * frac * 12 * 0.72),
    'extra_quintals',    round((budget * frac * 12 * 0.72 / 2180)::numeric, 1),
    'hops',              hops
  )
  from calc;
$$;

grant execute on function public.estimate_savings(numeric, numeric, integer) to anon, authenticated;

-- 6.3 forecast — demand prediction from price history
--     Baseline model: recency-weighted mean of recent mandi rates with a
--     seasonal band. Swap this body for a trained model in production.
create or replace function public.forecast(
  p_crop text,
  p_district text,
  p_horizon integer default 7
)
returns table (
  crop text,
  district text,
  horizon_days integer,
  predicted_price numeric,
  price_low numeric,
  price_high numeric,
  predicted_demand numeric,
  confidence numeric,
  supply_signal text,
  model_version text,
  sample_size integer
)
language sql
stable
as $$
  with agg as (
    select
      count(*)::integer                                     as n,
      avg(mandi_rate)                                       as mean_rate,
      stddev_pop(mandi_rate)                                as sd_rate,
      -- recency weighting: most recent 90 days weighted double
      sum(mandi_rate * (case when recorded_on >= current_date - 90 then 2 else 1 end))
        / nullif(sum(case when recorded_on >= current_date - 90 then 2 else 1 end), 0) as weighted_rate,
      sum(retail_rate) / nullif(count(*), 0)                 as mean_retail
    from public.price_history
    where crop = p_crop and district = p_district
  ),
  horizon_boost as (
    select 1 + (greatest(least(p_horizon, 30), 1) * 0.004) as k
  )
  select
    p_crop,
    p_district,
    p_horizon,
    round((a.weighted_rate * (1 + 0.03 * h.k))::numeric, 2)                       as predicted_price,
    round((a.weighted_rate * (1 + 0.03 * h.k) - coalesce(a.sd_rate, 0) * 1.28)::numeric, 2) as price_low,
    round((a.weighted_rate * (1 + 0.03 * h.k) + coalesce(a.sd_rate, 0) * 1.28)::numeric, 2) as price_high,
    round((greatest(a.n, 1) * 8.0 * greatest(p_horizon, 1) / 30.0)::numeric, 2)       as predicted_demand,
    -- confidence rises with sample size, falls with dispersion
    least(0.95, 0.45 + least(a.n, 60) / 120.0 - coalesce(a.sd_rate, 0) / nullif(a.mean_rate, 0) * 0.5) as confidence,
    case
      when a.sd_rate is null then 'balanced'::text
      when a.sd_rate / a.mean_rate > 0.15 then 'volatile'::text
      else 'balanced'::text
    end                                                                          as supply_signal,
    'baseline-v1'::text,
    a.n
  from agg a cross join horizon_boost h
  where a.n > 0;
$$;

grant execute on function public.forecast(text, text, integer) to anon, authenticated;

-- 6.4 refresh_forecasts — materialise forecasts for every crop/district pair
create or replace function public.refresh_forecasts()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_pairs record;
  v_count integer := 0;
begin
  -- keep exactly one forecast per crop/district/horizon for today
  delete from public.forecasts where generated_at >= date_trunc('day', now());

  for v_pairs in
    select distinct crop, district from public.price_history
  loop
    insert into public.forecasts (
      crop, district, horizon_days, predicted_price, price_low, price_high,
      predicted_demand, confidence, supply_signal, model_version
    )
    select
      f.crop, f.district, h.horizon, f.predicted_price, f.price_low, f.price_high,
      f.predicted_demand, f.confidence, f.supply_signal, f.model_version
    from public.forecast(v_pairs.crop, v_pairs.district, h.horizon) f
    cross join (values (7), (14), (30)) as h(horizon);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

grant execute on function public.refresh_forecasts() to service_role;

-- 6.5 platform impact summary — feeds the Impact section
create or replace function public.platform_impact()
returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'total_listings',     (select count(*) from public.listings where status = 'active'),
    'total_sellers',      (select count(distinct seller_id) from public.listings),
    'total_orders',       (select count(*) from public.orders),
    'delivered_orders',   (select count(*) from public.orders where status = 'delivered'),
    'gmv',                (select coalesce(sum(total_amount), 0) from public.orders),
    'farmer_income',      (select coalesce(sum(farmer_earnings), 0) from public.orders),
    'consumer_savings',   (select coalesce(sum(consumer_savings), 0) from public.orders),
    'avg_chain_removed',  4,
    'districts',          (select count(distinct district) from public.listings)
  );
$$;

grant execute on function public.platform_impact() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. STORAGE (produce photos)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('produce-images', 'produce-images', true)
on conflict (id) do nothing;

drop policy if exists produce_images_read on storage.objects;
create policy produce_images_read on storage.objects
  for select using (bucket_id = 'produce-images');

drop policy if exists produce_images_insert on storage.objects;
create policy produce_images_insert on storage.objects
  for insert with check (
    bucket_id = 'produce-images'
    and auth.role() = 'authenticated'
  );

drop policy if exists produce_images_owner_delete on storage.objects;
create policy produce_images_owner_delete on storage.objects
  for delete using (
    bucket_id = 'produce-images'
    and owner = auth.uid()::text
  );

commit;
