-- ============================================================================
-- FarmDirect — SIH26033
-- Seed data: demo users, FPOs, price history, listings, forecasts.
-- Run AFTER schema.sql. Idempotent.
--
-- Demo password for every seeded account: farmdirect123
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. FPOs
-- ---------------------------------------------------------------------------
insert into public.fpos (id, name, registration_no, district, state, member_count, is_verified, verified_at)
values
  ('11111111-1111-4111-8111-111111111111', 'Kaza Rice Growers FPO',   'AP-FPO-00021', 'Guntur',   'Andhra Pradesh', 148, true, now()),
  ('22222222-2222-4222-8222-222222222222', 'Kukunoor Oilseed FPO',    'WB-FPO-00047', 'Nadia',    'West Bengal',      92, true, now()),
  ('33333333-3333-4333-8333-333333333333', 'Dharwad Pulse Producers', 'KA-FPO-00013', 'Dharwad',  'Karnataka',       211, true, now()),
  ('44444444-4444-4444-8444-444444444444', 'Bareilly Cold-Press FPO', 'UP-FPO-00008', 'Bareilly', 'Uttar Pradesh',   64, true, now())
on conflict (id) do update
  set name = excluded.name,
      member_count = excluded.member_count,
      is_verified = excluded.is_verified;

-- ---------------------------------------------------------------------------
-- 2. Demo auth users + profiles
--    The trigger on auth.users creates the profile row; the explicit
--    profiles upsert below fixes the role and demo details afterwards.
-- ---------------------------------------------------------------------------
do $$
declare
  u record;
  v_users constant text[][] := array[
    ['farmer@guntur.farm',   'Venkateswarlu',  'farmer', '+919876543210', 'Guntur',   'Andhra Pradesh', 'Kaza'],
    ['farmer@nadia.farm',    'Kiran Kumar',    'farmer', '+919811223344', 'Nadia',    'West Bengal',    'Kukunoor'],
    ['fpo@dharwad.farm',     'Anjaneyulu Patil','fpo',   '+919822334455', 'Dharwad',  'Karnataka',      'Toranur'],
    ['buyer@kirana.shop',    'Ramesh Store',   'buyer', '+919833445566', 'Guntur',   'Andhra Pradesh', null],
    ['buyer@hostelgroup.in', 'Sunita Catering','buyer', '+919844556677', 'Bareilly', 'Uttar Pradesh',  null],
    ['admin@farmdirect.gov', 'District Officer','admin', '+919855667788', 'Guntur',   'Andhra Pradesh', null]
  ];
begin
  for u in
    select * from unnest(v_users) as t(email, full_name, role, phone, district, state, village)
  loop
    -- skip if this email already has an auth user
    if not exists (select 1 from auth.users where email = u.email) then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) values (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated', 'authenticated',
        u.email,
        crypt('farmdirect123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object(
          'full_name', u.full_name, 'role', u.role, 'phone', u.phone,
          'district', u.district, 'state', u.state, 'village', u.village
        ),
        now(), now()
      );
    end if;

    -- backfill / correct the profile row the trigger created
    update public.profiles
       set role      = u.role::public.user_role,
           full_name = u.full_name,
           phone     = u.phone,
           district  = u.district,
           state     = u.state,
           village   = u.village,
           is_verified = (u.role <> 'buyer')
     where id = (select id from auth.users where email = u.email);
  end loop;
end $$;

-- link the FPO account to its organisation
update public.profiles p
   set fpo_id = '33333333-3333-4333-8333-333333333333'
 where p.full_name = 'Anjaneyulu Patil';

-- ---------------------------------------------------------------------------
-- 3. Sellers used by the seeded listings
-- ---------------------------------------------------------------------------
-- (reuses the demo farmers above; extra solo farmers are created so every
--  listing has a distinct, visible seller)

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  g.id, 'authenticated', 'authenticated',
  g.email, crypt('farmdirect123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', g.full_name, 'role', 'farmer', 'phone', g.phone,
                     'district', g.district, 'state', g.state, 'village', g.village),
  now(), now()
from (values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid, 'Ramesh Naidu',   'naidu@bapatla.farm',  '+919010001001', 'Bapatla',   'Andhra Pradesh', 'Bapatla'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid, 'Srinivas Reddy', 'reddy@guntur.farm',   '+919010001002', 'Guntur',   'Andhra Pradesh', 'Mangalagiri'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid, 'Gopal Reddy',    'gopal@bapatla.farm',  '+919010001003', 'Bapatla',   'Andhra Pradesh', 'Bapatla'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'::uuid, 'Lakshmi Devi',   'lakshmi@malda.farm',  '+919010001004', 'Malda',    'West Bengal',    'Kharibari'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5'::uuid, 'Prakash Rao',    'prakash@hubballi.farm','+919010001005','Hubballi', 'Karnataka',      'Shiggaon'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6'::uuid, 'Naresh Babu',    'naresh@guntur.farm',  '+919010001006', 'Guntur',   'Andhra Pradesh', 'Tenali'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7'::uuid, 'Fatima Begum',   'fatima@dharwad.farm', '+919010001007', 'Dharwad',  'Karnataka',      'Kalghatgi'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'::uuid, 'Mohammed Yasin', 'yasin@kurnool.farm',  '+919010001008', 'Kurnool',  'Andhra Pradesh', 'Kurnool'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9'::uuid, 'Anjaneyulu',     'anj@kukunoor.farm',   '+919010001009', 'Nadia',    'West Bengal',    'Kukunoor'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa0'::uuid, 'Sunita Devi',    'sunita@bareilly.farm','+919010001010', 'Bareilly', 'Uttar Pradesh',  'Bareilly')
) as g(id, full_name, email, phone, district, state, village)
on conflict do nothing;

update public.profiles p
   set full_name = g.full_name, phone = g.phone, is_verified = true
  from (values
    ('Ramesh Naidu',    '+919010001001'), ('Srinivas Reddy',  '+919010001002'),
    ('Gopal Reddy',     '+919010001003'), ('Lakshmi Devi',    '+919010001004'),
    ('Prakash Rao',     '+919010001005'), ('Naresh Babu',     '+919010001006'),
    ('Fatima Begum',    '+919010001007'), ('Mohammed Yasin',  '+919010001008'),
    ('Anjaneyulu',      '+919010001009'), ('Sunita Devi',     '+919010001010')
  ) as g(full_name, phone)
 where p.full_name = g.full_name;

-- ---------------------------------------------------------------------------
-- 4. Price history (36 months of weekly observations per crop/district)
-- ---------------------------------------------------------------------------
insert into public.price_history (crop, district, state, msp_per_qtl, mandi_rate, retail_rate, recorded_on)
select
  s.crop, s.district, s.state, s.msp,
  round((s.msp * s.mandi_ratio * seasonal)::numeric, 2),
  round((s.msp * s.retail_ratio * seasonal * drift)::numeric, 2),
  d.day
from (values
  -- crop, district, state, msp, mandi_ratio, retail_ratio, seasonal_amp, drift
  ('Paddy',            'Guntur',   'Andhra Pradesh', 2300::numeric, 0.63, 1.26, 0.06, 1.05),
  ('Paddy',            'Nadia',    'West Bengal',    2300,            0.61, 1.30, 0.06, 1.04),
  ('Tomato',           'Bapatla',  'Andhra Pradesh', 1250,            0.58, 1.52, 0.22, 1.10),
  ('Tur',              'Dharwad',  'Karnataka',      7525,            0.86, 1.19, 0.09, 1.06),
  ('Chilli',           'Guntur',   'Andhra Pradesh', 25500,           0.84, 1.12, 0.14, 1.12),
  ('Cotton',           'Kurnool',  'Andhra Pradesh', 7710,            0.95, 1.06, 0.08, 1.07),
  ('Mango',            'Bapatla',  'Andhra Pradesh', 8500,            0.68, 1.48, 0.30, 1.14),
  ('Groundnut',        'Nadia',    'West Bengal',    6783,            0.88, 1.17, 0.10, 1.05),
  ('Brinjal',          'Malda',    'West Bengal',    1500,            0.66, 1.44, 0.20, 1.09),
  ('Onion',            'Hubballi', 'Karnataka',      2450,            0.59, 1.66, 0.26, 1.18),
  ('Mustard Oil',      'Bareilly', 'Uttar Pradesh',  20000,           0.79, 1.30, 0.07, 1.03),
  ('Banana',           'Guntur',   'Andhra Pradesh', 1850,            0.70, 1.51, 0.19, 1.11),
  ('Turmeric',         'Dharwad',  'Karnataka',      17500,           0.82, 1.15, 0.11, 1.08),
  ('Maize',            'Malda',    'West Bengal',    2225,            0.64, 1.24, 0.07, 1.02),
  ('Wheat',            'Bareilly', 'Uttar Pradesh',  2425,            0.92, 1.11, 0.05, 1.04)
) as s(crop, district, state, msp, mandi_ratio, retail_ratio, seasonal_amp, drift)
cross join lateral (
  select (current_date - (w * 7))::date as day,
         1 + s.seasonal_amp * sin(2 * pi() * (w / 52.0)) as seasonal
  from generate_series(0, 155) as w
) d;

-- ---------------------------------------------------------------------------
-- 5. Marketplace listings
-- ---------------------------------------------------------------------------
insert into public.listings (
  seller_id, fpo_id, crop, variety, category, grade, description,
  quantity, unit, price_per_unit, mrp_per_unit, harvest_date,
  district, state, status
)
select
  s.seller_id, s.fpo_id, s.crop, s.variety, s.category::public.crop_category, s.grade, s.description,
  s.quantity, s.unit, s.price, s.mrp, current_date - s.harvest_days,
  s.district, s.state, 'active'
from (values
  -- FPO-sourced
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid, '11111111-1111-4111-8111-111111111111',
   'Paddy (Sona Masoori)', 'Sona Masoori', 'grain', 'Grade A',
   'Milled paddy from this season''s Kaza harvest. Moisture below 14%, cleaned and sun-dried.',
   120::numeric, 'qtl', 2180::numeric, 2900::numeric, 3, 'Guntur', 'Andhra Pradesh'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', '22222222-2222-4222-8222-222222222222',
   'Tur / Arhar Dal', 'Arhar', 'grain', 'Polished',
   'Machine-polished tur from Kukunoor member farms. Uniform grain, no admixture.',
   60, 'qtl', 9120, 11200, 6, 'Nadia', 'West Bengal'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', '11111111-1111-4111-8111-111111111111',
   'Cotton', 'Long staple', 'grain', 'Long staple',
   'Medium-staple cotton, ginned. Sold directly from the ginning unit at Kurnool.',
   85, 'qtl', 7310, 8100, 9, 'Kurnool', 'Andhra Pradesh'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', '22222222-2222-4222-8222-222222222222',
   'Groundnut', 'Kukunoor select', 'oil', 'Shelled',
   'Shelled groundnut, cleaned and graded. Good for oil pressing and snacks.',
   70, 'qtl', 6890, 7900, 4, 'Nadia', 'West Bengal'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa0', '44444444-4444-4444-8444-444444444444',
   'Cold-Pressed Mustard Oil', 'Mustard', 'oil', 'Cold pressed',
   'Wood-pressed mustard oil from the Bareilly cluster, no chemicals, unadulterated.',
   2, 'KL', 20500, 26000, 12, 'Bareilly', 'Uttar Pradesh'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', '33333333-3333-4333-8333-333333333333',
   'Turmeric', 'Dharwad Finger', 'spice', 'Sun-dried',
   'Sun-dried finger turmeric, high curcumin. Whole finger form, A grade.',
   45, 'qtl', 15400, 18800, 14, 'Dharwad', 'Karnataka'),

  -- solo farmers
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', null,
   'Tomato', 'Hybrid', 'veg', 'Fresh, 2-day',
   'Picked at dawn, delivered same day. Ripened on the vine for flavour.',
   40, 'crates', 1150, 1900, 0, 'Bapatla', 'Andhra Pradesh'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', null,
   'Chilli (Guntur Sannam)', 'Sannam', 'spice', 'Export pick',
   'Export-grade Guntur Sannam. Colour and pungency run high this season.',
   25, 'qtl', 21400, 26500, 7, 'Guntur', 'Andhra Pradesh'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', null,
   'Mango (Banganapalli)', 'Banganapalli', 'fruit', 'Ripened',
   'Tree-ripened Banganapalli. Safe to pack, no chemical ripening.',
   3, 'tons', 4200, 6200, 5, 'Bapatla', 'Andhra Pradesh'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', null,
   'Brinjal', 'Purple long', 'veg', 'Grade B',
   'Long purple brinjal. Minor surface marks, ideal for cooking and curry.',
   30, 'crates', 1250, 1900, 0, 'Malda', 'West Bengal'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', null,
   'Onion', 'Red Nashik', 'veg', 'Medium',
   'Red onion, medium size, cured and stored. Bulk rate applies over 50 qtl.',
   150, 'qtl', 1450, 2400, 10, 'Hubballi', 'Karnataka'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', null,
   'Banana (Robusta)', 'Robusta', 'fruit', 'Green',
   'Green robusta, best for wholesale ripening and processing.',
   1.2, 'tons', 1850, 2800, 2, 'Guntur', 'Andhra Pradesh'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', null,
   'Wheat', 'Sharbati', 'grain', 'Grade A',
   'Sharbati wheat, cleaned, suitable for chapati flour.',
   90, 'qtl', 2620, 3150, 8, 'Guntur', 'Andhra Pradesh'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', null,
   'Maize', 'Hybrid', 'grain', 'Feed grade',
   'Feed-grade maize, dried to 14% moisture. Bulk lots available weekly.',
   200, 'qtl', 1980, 2400, 1, 'Malda', 'West Bengal')
) as s(seller_id, fpo_id, crop, variety, category, grade, description,
       quantity, unit, price, mrp, harvest_days, district, state);

-- ---------------------------------------------------------------------------
-- 6. Forecasts
-- ---------------------------------------------------------------------------
select public.refresh_forecasts();

commit;

-- ---------------------------------------------------------------------------
-- Sanity check
-- ---------------------------------------------------------------------------
select 'profiles'   as entity, count(*) from public.profiles
union all select 'fpos',        count(*) from public.fpos
union all select 'listings',    count(*) from public.listings
union all select 'price_rows',  count(*) from public.price_history
union all select 'forecasts',   count(*) from public.forecasts
order by 1;
