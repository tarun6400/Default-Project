/* ============================================================================
 * api.js — FarmDirect domain layer
 *
 * Sits on top of supabase.js and gives the page a stable interface:
 *   API.listings.search({ category, q, district })
 *   API.orders.place({ listing_id, quantity, address })
 *   API.forecasts.for(crop, district, horizon)
 *   API.impact.summary()
 *
 * Every method falls back to the bundled sample dataset when Supabase is not
 * configured or a request fails, so the page always renders. Check
 * `API.mode` to know which path is live: "live" | "demo".
 * ========================================================================== */
(function (global) {
  "use strict";

  const SB = global.SB;

  /* ------------------------------------------------------------- sample data */
  /* Kept in sync with supabase/seed.sql so the page is demoable offline. */
  const SAMPLE = {
    listings: [
      { id: "l1",  crop: "Paddy (Sona Masoori)",     emoji: "🌾", category: "grain", grade: "Grade A",
        seller_name: "Venkateswarlu", org: "Kaza Rice Growers FPO", is_fpo: true, seller_verified: true,
        district: "Guntur, Andhra Pradesh", state: "Andhra Pradesh",
        quantity: 120, unit: "qtl", price: 2180, mrp: 2900, tag: "FPO listed", harvest_days: 3,
        description: "Milled paddy from this season's Kaza harvest. Moisture below 14%, cleaned and sun-dried." },
      { id: "l2",  crop: "Tomato",                    emoji: "🍅", category: "veg", grade: "Fresh, 2-day",
        seller_name: "Ramesh Naidu", org: "Bapatla farms", is_fpo: false, seller_verified: true,
        district: "Bapatla, Andhra Pradesh", state: "Andhra Pradesh",
        quantity: 40, unit: "crates", price: 1150, mrp: 1900, tag: "Harvested today", harvest_days: 0,
        description: "Picked at dawn, delivered same day. Ripened on the vine for flavour." },
      { id: "l3",  crop: "Tur / Arhar Dal",           emoji: "🫘", category: "grain", grade: "Polished",
        seller_name: "Anjaneyulu", org: "Kukunoor Oilseed FPO", is_fpo: true, seller_verified: true,
        district: "Nadia, West Bengal", state: "West Bengal",
        quantity: 60, unit: "qtl", price: 9120, mrp: 11200, tag: "FPO listed", harvest_days: 6,
        description: "Machine-polished tur from Kukunoor member farms. Uniform grain, no admixture." },
      { id: "l4",  crop: "Chilli (Guntur Sannam)",    emoji: "🌶️", category: "spice", grade: "Export pick",
        seller_name: "Srinivas Reddy", org: "Mangalagiri farms", is_fpo: false, seller_verified: true,
        district: "Guntur, Andhra Pradesh", state: "Andhra Pradesh",
        quantity: 25, unit: "qtl", price: 21400, mrp: 26500, tag: "High demand", harvest_days: 7,
        description: "Export-grade Guntur Sannam. Colour and pungency run high this season." },
      { id: "l5",  crop: "Cotton",                    emoji: "🌿", category: "grain", grade: "Long staple",
        seller_name: "Mohammed Yasin", org: "Kaza Rice Growers FPO", is_fpo: true, seller_verified: true,
        district: "Kurnool, Andhra Pradesh", state: "Andhra Pradesh",
        quantity: 85, unit: "qtl", price: 7310, mrp: 8100, tag: "FPO listed", harvest_days: 9,
        description: "Medium-staple cotton, ginned. Sold directly from the ginning unit at Kurnool." },
      { id: "l6",  crop: "Mango (Banganapalli)",      emoji: "🥭", category: "fruit", grade: "Ripened",
        seller_name: "Gopal Reddy", org: "Bapatla orchards", is_fpo: false, seller_verified: true,
        district: "Bapatla, Andhra Pradesh", state: "Andhra Pradesh",
        quantity: 3, unit: "tons", price: 4200, mrp: 6200, tag: "Seasonal", harvest_days: 5,
        description: "Tree-ripened Banganapalli. Safe to pack, no chemical ripening." },
      { id: "l7",  crop: "Groundnut",                 emoji: "🥜", category: "oil", grade: "Shelled",
        seller_name: "Kiran Kumar", org: "Kukunoor Oilseed FPO", is_fpo: true, seller_verified: true,
        district: "Nadia, West Bengal", state: "West Bengal",
        quantity: 70, unit: "qtl", price: 6890, mrp: 7900, tag: "FPO listed", harvest_days: 4,
        description: "Shelled groundnut, cleaned and graded. Good for oil pressing and snacks." },
      { id: "l8",  crop: "Brinjal",                   emoji: "🍆", category: "veg", grade: "Grade B",
        seller_name: "Lakshmi Devi", org: "Kharibari farms", is_fpo: false, seller_verified: true,
        district: "Malda, West Bengal", state: "West Bengal",
        quantity: 30, unit: "crates", price: 1250, mrp: 1900, tag: "Harvested today", harvest_days: 0,
        description: "Long purple brinjal. Minor surface marks, ideal for cooking and curry." },
      { id: "l9",  crop: "Onion",                     emoji: "🧅", category: "veg", grade: "Medium",
        seller_name: "Prakash Rao", org: "Shiggaon farms", is_fpo: false, seller_verified: true,
        district: "Hubballi, Karnataka", state: "Karnataka",
        quantity: 150, unit: "qtl", price: 1450, mrp: 2400, tag: "Bulk discount", harvest_days: 10,
        description: "Red onion, medium size, cured and stored. Bulk rate applies over 50 qtl." },
      { id: "l10", crop: "Cold-Pressed Mustard Oil",  emoji: "🫗", category: "oil", grade: "Cold pressed",
        seller_name: "Sunita Devi", org: "Bareilly Cold-Press FPO", is_fpo: true, seller_verified: true,
        district: "Bareilly, Uttar Pradesh", state: "Uttar Pradesh",
        quantity: 2, unit: "KL", price: 20500, mrp: 26000, tag: "FPO listed", harvest_days: 12,
        description: "Wood-pressed mustard oil from the Bareilly cluster, no chemicals, unadulterated." },
      { id: "l11", crop: "Banana (Robusta)",          emoji: "🍌", category: "fruit", grade: "Green",
        seller_name: "Naresh Babu", org: "Tenali farms", is_fpo: false, seller_verified: true,
        district: "Guntur, Andhra Pradesh", state: "Andhra Pradesh",
        quantity: 1.2, unit: "tons", price: 1850, mrp: 2800, tag: "Bulk discount", harvest_days: 2,
        description: "Green robusta, best for wholesale ripening and processing." },
      { id: "l12", crop: "Turmeric",                  emoji: "🟡", category: "spice", grade: "Sun-dried",
        seller_name: "Fatima Begum", org: "Dharwad Pulse Producers", is_fpo: true, seller_verified: true,
        district: "Dharwad, Karnataka", state: "Karnataka",
        quantity: 45, unit: "qtl", price: 15400, mrp: 18800, tag: "FPO listed", harvest_days: 14,
        description: "Sun-dried finger turmeric, high curcumin. Whole finger form, A grade." },
      { id: "l13", crop: "Wheat",                     emoji: "🌾", category: "grain", grade: "Grade A",
        seller_name: "Ramesh Naidu", org: "Bapatla farms", is_fpo: false, seller_verified: true,
        district: "Guntur, Andhra Pradesh", state: "Andhra Pradesh",
        quantity: 90, unit: "qtl", price: 2620, mrp: 3150, tag: "FPO listed", harvest_days: 8,
        description: "Sharbati wheat, cleaned, suitable for chapati flour." },
      { id: "l14", crop: "Maize",                     emoji: "🌽", category: "grain", grade: "Feed grade",
        seller_name: "Lakshmi Devi", org: "Kharibari farms", is_fpo: false, seller_verified: true,
        district: "Malda, West Bengal", state: "West Bengal",
        quantity: 200, unit: "qtl", price: 1980, mrp: 2400, tag: "Bulk discount", harvest_days: 1,
        description: "Feed-grade maize, dried to 14% moisture. Bulk lots available weekly." },
    ],
    forecasts: {
      "guntur": [
        { crop: "Paddy",      horizon: 7,  price: 2271, low: 2140, high: 2402, demand: 412,  confidence: 0.82, signal: "tight" },
        { crop: "Chilli",     horizon: 7,  price: 25980, low: 24500, high: 27460, demand: 96,  confidence: 0.71, signal: "volatile" },
        { crop: "Banana",     horizon: 7,  price: 1902, low: 1810, high: 1994, demand: 305,  confidence: 0.77, signal: "balanced" },
        { crop: "Wheat",      horizon: 14, price: 2480, low: 2395, high: 2565, demand: 610,  confidence: 0.68, signal: "balanced" },
        { crop: "Tomato",     horizon: 7,  price: 1190, low: 1040, high: 1340, demand: 540,  confidence: 0.61, signal: "volatile" },
      ],
      "bapatla": [
        { crop: "Tomato",  horizon: 7,  price: 1310, low: 1130, high: 1490, demand: 620, confidence: 0.58, signal: "volatile" },
        { crop: "Mango",   horizon: 14, price: 9100, low: 8400, high: 9800, demand: 88,  confidence: 0.74, signal: "tight" },
      ],
    },
  };

  const EMOJI = {
    paddy: "🌾", rice: "🌾", wheat: "🌾", maize: "🌽", tur: "🫘", dal: "🫘",
    tomato: "🍅", brinjal: "🍆", onion: "🧅", chilli: "🌶️", mango: "🥭",
    banana: "🍌", groundnut: "🥜", turmeric: "🟡", oil: "🫗", cotton: "🌿",
  };

  const emojiFor = (crop = "") => {
    const key = crop.toLowerCase();
    const hit = Object.keys(EMOJI).find((k) => key.includes(k));
    return hit ? EMOJI[hit] : "🌿";
  };

  /* --------------------------------------------------------------- state */
  let mode = SB && SB.isConfigured ? "live" : "demo";
  const demoState = { listings: SAMPLE.listings.map((l) => ({ ...l })), orders: [], messages: {} };

  const onModeChange = new Set();
  const setMode = (next, reason) => {
    if (mode === next) return;
    mode = next;
    onModeChange.forEach((cb) => cb(next, reason));
  };
  onModeChange.add((m) => console.info(`[api] mode = ${m}`));

  /* ------------------------------------------------------------- normalise */
  const num = (v) => (v === null || v === undefined ? null : Number(v));

  /** Map a listing_catalogue row to the shape the UI renders. */
  function shapeListing(row) {
    return {
      id: row.id,
      crop: row.crop,
      variety: row.variety,
      emoji: emojiFor(row.crop),
      category: row.category,
      grade: row.grade,
      description: row.description,
      seller_name: row.seller_name,
      org: row.fpo_name || `${row.seller_district || row.district} farm`,
      is_fpo: !!row.fpo_name,
      seller_verified: !!row.seller_verified,
      seller_id: row.seller_id,
      district: [row.district, row.state].filter(Boolean).join(", "),
      state: row.state,
      quantity: num(row.quantity),
      unit: row.unit,
      price: num(row.price_per_unit),
      mrp: num(row.mrp_per_unit),
      savings_pct: num(row.savings_pct),
      harvest_days: row.harvest_date
        ? Math.max(0, Math.round((Date.now() - new Date(row.harvest_date)) / 86400000))
        : null,
      image_url: row.image_url,
      status: row.status,
      tag: row.fpo_name ? "FPO listed" : "Direct farm",
    };
  }

  /* ------------------------------------------------------------- listings */
  const listings = {
    async search({ category = "all", q = "", limit = 60 } = {}) {
      // ---- live
      if (mode === "live") {
        try {
          let qb = SB.from("listing_catalogue").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(limit);
          if (category && category !== "all") qb = qb.eq("category", category);
          if (q) {
            const safe = q.replace(/[%,()]/g, " ");
            qb = qb.or(`crop.ilike.%${safe}%,district.ilike.%${safe}%,seller_name.ilike.%${safe}%`);
          }
          const rows = await qb;
          return (rows || []).map(shapeListing);
        } catch (e) {
          console.warn("[api] listings live fetch failed, using sample data", e.message);
          setMode("demo", e.message);
        }
      }

      // ---- demo
      return demoState.listings.filter((l) => {
        if (category !== "all" && l.category !== category) return false;
        if (!q) return true;
        const hay = `${l.crop} ${l.district} ${l.seller_name} ${l.org}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      });
    },

    async byId(id) {
      if (mode === "live") {
        try {
          const row = await SB.from("listing_catalogue").select("*").eq("id", id).maybeSingle();
          return row ? shapeListing(row) : null;
        } catch (e) {
          console.warn("[api] listing lookup failed", e.message);
        }
      }
      return demoState.listings.find((l) => l.id === id) || null;
    },

    async create(payload) {
      if (mode !== "live") {
        const { user } = await SB.auth.getUser().catch(() => ({ user: null }));
        const mine = {
          id: `demo-${Date.now()}`,
          crop: payload.crop,
          variety: payload.variety,
          emoji: emojiFor(payload.crop),
          category: payload.category || "other",
          grade: payload.grade,
          description: payload.description,
          seller_id: user?.id || null,
          seller_name: "You (demo)",
          org: payload.fpo_id ? "Your FPO" : "Your farm",
          is_fpo: !!payload.fpo_id,
          seller_verified: true,
          district: payload.district,
          state: payload.state,
          quantity: Number(payload.quantity),
          unit: payload.unit || "qtl",
          price: Number(payload.price_per_unit),
          mrp: Number(payload.mrp_per_unit) || null,
          tag: payload.fpo_id ? "FPO listed" : "Direct farm",
          harvest_days: 0,
        };
        demoState.listings.unshift(mine);
        return mine;
      }
      const row = await SB.from("listings").insert(payload).select().single();
      return shapeListing(row);
    },

    async update(id, patch) {
      if (mode !== "live") {
        const i = demoState.listings.findIndex((l) => l.id === id);
        if (i > -1) demoState.listings[i] = { ...demoState.listings[i], ...patch };
        return demoState.listings[i] || null;
      }
      const row = await SB.from("listings").update(patch).eq("id", id).select().single();
      return shapeListing(row);
    },

    async remove(id) {
      if (mode !== "live") {
        demoState.listings = demoState.listings.filter((l) => l.id !== id);
        return true;
      }
      await SB.from("listings").delete().eq("id", id);
      return true;
    },
  };

  /* --------------------------------------------------------------- orders */
  const orders = {
    /**
     * Places a direct order. In live mode this calls the place_order RPC so
     * pricing, fees, savings and stock draw-down all happen server-side.
     */
    async place({ listing_id, quantity, address }) {
      if (mode !== "live") {
        const listing = demoState.listings.find((l) => l.id === listing_id);
        if (!listing) throw new Error("Listing not found.");
        if (quantity <= 0) throw new Error("Quantity must be greater than zero.");
        if (quantity > listing.quantity) {
          throw new Error(`Only ${listing.quantity} ${listing.unit} available, you asked for ${quantity}.`);
        }
        const fee = round(listing.price * quantity * 0.02);
        const order = {
          id: `FD26-${String(demoState.orders.length + 1).padStart(4, "0")}`,
          order_ref: `FD26-${String(demoState.orders.length + 1).padStart(4, "0")}`,
          listing_id,
          crop: listing.crop,
          quantity,
          unit_price: listing.price,
          total_amount: round(listing.price * quantity + fee),
          farmer_earnings: round(listing.price * quantity),
          consumer_savings: listing.mrp ? round((listing.mrp - listing.price) * quantity) : 0,
          platform_fee: fee,
          status: "pending",
          payment_status: "held",
          created_at: new Date().toISOString(),
        };
        listing.quantity -= quantity;
        demoState.orders.unshift(order);
        return order;
      }

      const order = await SB.rpc("place_order", {
        p_listing_id: listing_id,
        p_quantity: Number(quantity),
        p_delivery_address: address,
      });
      return order;
    },

    async mine() {
      if (mode !== "live") return demoState.orders;
      const { user } = await SB.auth.getUser();
      if (!user) return [];
      const bought = await SB.from("orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false });
      const sold = await SB.from("orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
      return {
        buying: bought || [],
        selling: sold || [],
      };
    },

    async setStatus(id, status) {
      if (mode !== "live") {
        const o = demoState.orders.find((x) => x.id === id);
        if (o) o.status = status;
        return o;
      }
      return SB.from("orders").update({ status }).eq("id", id).select().single();
    },
  };

  /* ----------------------------------------------------------- shipments */
  const shipments = {
    async forOrder(orderId) {
      if (mode !== "live") {
        return {
          id: `shp-${orderId}`,
          order_id: orderId,
          consolidation_group: "FPO-17 · Route 3",
          vehicle_no: "AP 16 T 4412",
          driver_name: "Demo Driver",
          driver_phone: "+91 90000 00000",
          from_location: "Kaza village, Guntur",
          to_location: "Ramesh Store, Guntur",
          load_kg: 6200,
          distance_km: 42,
          cost_per_kg: 2.14,
          status: "in_transit",
          departs_at: new Date().toISOString(),
          arrives_at: new Date(Date.now() + 5 * 3600e3).toISOString(),
          tracking_note: "Picked up at farm gate, heading to district hub.",
        };
      }
      return SB.from("shipments").select("*").eq("order_id", orderId).maybeSingle();
    },

    async updateStatus(id, status, patch = {}) {
      if (mode !== "live") return { id, status, ...patch };
      return SB.from("shipments").update({ status, ...patch }).eq("id", id).select().single();
    },
  };

  /* ----------------------------------------------------------- forecasting */
  const forecasts = {
    async for(district, horizon = 7) {
      const key = String(district || "guntur").toLowerCase();
      if (mode === "live") {
        try {
          const rows = await SB.from("forecasts")
            .select("*")
            .eq("district", district)
            .eq("horizon_days", Number(horizon))
            .order("generated_at", { ascending: false })
            .limit(20);
          if (rows && rows.length) return rows.map(shapeForecast);
        } catch (e) {
          console.warn("[api] forecasts live fetch failed, using sample data", e.message);
        }
      }
      const list = SAMPLE.forecasts[key] || [];
      return list.filter((f) => f.horizon === Number(horizon) || horizon === "all");
    },

    async compute(crop, district, horizon = 7) {
      if (mode !== "live") {
        const list = SAMPLE.forecasts[String(district).toLowerCase()] || [];
        const key = String(crop).toLowerCase();
        // match loosely: "Paddy (Sona Masoori)" should find the "Paddy" forecast
        const hit = list.find(
          (f) => key.includes(f.crop.toLowerCase()) || f.crop.toLowerCase().includes(key)
        );
        return hit ? shapeForecast({ ...hit, crop, district, horizon: hit.horizon }) : null;
      }
      const rows = await SB.rpc("forecast", { p_crop: crop, p_district: district, p_horizon: Number(horizon) });
      return Array.isArray(rows) && rows.length ? shapeForecast(rows[0]) : null;
    },
  };

  function shapeForecast(r) {
    return {
      crop: r.crop,
      district: r.district,
      horizon: r.horizon_days ?? r.horizon,
      price: num(r.predicted_price ?? r.price),
      low: num(r.price_low ?? r.low),
      high: num(r.price_high ?? r.high),
      demand: num(r.predicted_demand ?? r.demand),
      confidence: num(r.confidence),
      signal: r.supply_signal ?? r.signal,
      model: r.model_version || "baseline-v1",
      sample_size: r.sample_size ?? null,
    };
  }

  /* ------------------------------------------------------------- reference */
  const reference = {
    async impact() {
      if (mode === "live") {
        try {
          return await SB.rpc("platform_impact");
        } catch (e) {
          console.warn("[api] impact failed, using page defaults", e.message);
        }
      }
      return {
        total_listings: demoState.listings.length,
        total_sellers: new Set(demoState.listings.map((l) => l.seller_name)).size,
        total_orders: demoState.orders.length,
        delivered_orders: 0,
        gmv: 0,
        farmer_income: 0,
        consumer_savings: 0,
        avg_chain_removed: 4,
        districts: new Set(demoState.listings.map((l) => l.state)).size,
      };
    },

    /** Price history for the sparkline on a listing detail. */
    async history(crop, district, days = 90) {
      if (mode !== "live") {
        const out = [];
        let v = 2000;
        for (let i = days; i >= 0; i -= 7) {
          v += Math.sin(i / 9) * 22 + (Math.random() - 0.45) * 30;
          out.push({ recorded_on: new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), mandi_rate: round(v) });
        }
        return out;
      }
      const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
      return (
        (await SB.from("price_history")
          .select("recorded_on,mandi_rate,retail_rate")
          .eq("crop", crop)
          .eq("district", district)
          .gte("recorded_on", since)
          .order("recorded_on", { ascending: true })) || []
      );
    },

    fpos: async () => {
      if (mode !== "live") return [];
      return (await SB.from("fpos").select("*").eq("is_verified", true).order("name")) || [];
    },
  };

  /* ------------------------------------------------------------ calculator */
  /** Local mirror of the estimate_savings SQL function. */
  const savings = {
    async estimate({ budget, share = 100, hops = 5 }) {
      if (mode === "live") {
        try {
          return await SB.rpc("estimate_savings", {
            p_budget: Number(budget),
            p_chain_share: Number(share),
            p_hops: Number(hops),
          });
        } catch (e) {
          console.warn("[api] estimate_savings failed, computing locally", e.message);
        }
      }
      const b = Math.max(Number(budget) || 0, 0);
      const s = Math.min(Math.max(Number(share) || 0, 0), 100) / 100;
      const h = Math.min(Math.max(Number(hops) || 1, 1), 6);
      const frac = (0.01 + h * 0.06) * s;
      const saved = round(b * frac);
      return {
        spend_today: round(b),
        spend_direct: round(b - saved),
        saved,
        saved_pct: round(frac * 100, 1),
        to_farmers: round(saved * 0.72),
        annual_to_farmers: round(saved * 12 * 0.72),
        extra_quintals: round((saved * 12 * 0.72) / 2180, 1),
        hops: h,
      };
    },
  };

  /* ------------------------------------------------------------------ auth */
  const auth = {
    signUp({ email, password, fullName, phone, district, state, village, role }) {
      return SB.auth.signUp({
        email,
        password,
        data: {
          full_name: fullName,
          phone,
          district,
          state,
          village,
          role: role || "buyer",
        },
      });
    },

    signIn: (creds) => SB.auth.signIn(creds),
    signOut: () => SB.auth.signOut(),
    session: () => SB.auth.getSession(),

    async profile() {
      const { user } = await SB.auth.getUser();
      if (!user) return null;

      // local sandbox session (no Supabase project) — trust the stored record
      if (!SB.isConfigured || !SB.isConfigured) {
        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.user_metadata?.full_name || (user.email || "").split("@")[0],
          role: user.role || user.user_metadata?.role || "buyer",
          district: user.district ?? null,
          state: user.state ?? null,
          village: user.village ?? null,
          phone: user.phone ?? null,
          is_verified: !!user.is_verified,
          is_local: true,
        };
      }

      try {
        const row = await SB.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (row) return row;
      } catch (e) {
        console.warn("[api] profile lookup failed, falling back to auth metadata", e.message);
      }

      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || (user.email || "").split("@")[0],
        role: user.user_metadata?.role || "buyer",
        district: user.user_metadata?.district || null,
        state: user.user_metadata?.state || null,
        village: user.user_metadata?.village || null,
        phone: user.user_metadata?.phone || null,
        is_verified: false,
      };
    },

    onChange(cb) {
      return SB.auth.onAuthStateChange(async (event) => {
        let profile = null;
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          profile = await auth.profile().catch(() => null);
        }
        cb(event === "USER_UPDATED" ? "SIGNED_IN" : event, profile);
      });
    },

    async updateProfile(patch) {
      const { user } = await SB.auth.getUser();
      if (!user) throw new Error("Not signed in.");
      if (!SB.isConfigured) {
        await SB.auth.updateUser({ data: patch });
        return auth.profile();
      }
      const row = await SB.from("profiles").update(patch).eq("id", user.id).select().single();
      const meta = {};
      if (patch.full_name !== undefined) meta.full_name = patch.full_name;
      if (patch.phone !== undefined) meta.phone = patch.phone;
      if (Object.keys(meta).length) await SB.auth.updateUser({ data: meta }).catch(() => {});
      return row;
    },
  };

  /* ------------------------------------------------------------- messages */
  const demoThread = (listingId) => {
    if (!demoState.messages[listingId]) {
      demoState.messages[listingId] = [
        { id: "m1", listing_id: listingId, sender_id: "seller", body: "Yes, that quantity is available. We can deliver to Guntur town in 2 days.", created_at: new Date(Date.now() - 36e5).toISOString() },
        { id: "m2", listing_id: listingId, sender_id: "buyer", body: "Great. What is the rate for 20 qtl?", created_at: new Date(Date.now() - 34e5).toISOString() },
        { id: "m3", listing_id: listingId, sender_id: "seller", body: "₹2,180/qtl with free loading. Pooled truck from the FPO, so freight is shared.", created_at: new Date(Date.now() - 32e5).toISOString() },
      ];
    }
    return demoState.messages[listingId];
  };

  const messages = {
    async forListing(listingId) {
      if (mode !== "live") return demoThread(listingId).slice();
      return (
        (await SB.from("messages").select("*").eq("listing_id", listingId).order("created_at", { ascending: true }).limit(100)) || []
      );
    },

    async send(listingId, body) {
      const text = String(body || "").trim();
      if (!text) throw new Error("Type a message first.");
      if (text.length > 2000) throw new Error("Message is too long.");

      const { user } = await SB.auth.getUser();
      if (!user) throw new Error("Sign in to send a message.");

      const msg = {
        id: `m${Date.now()}`,
        listing_id: listingId,
        sender_id: user.id,
        body: text,
        created_at: new Date().toISOString(),
      };

      if (mode !== "live") {
        demoThread(listingId).push(msg);
        return msg;
      }
      return SB.from("messages").insert({ listing_id: listingId, sender_id: user.id, body: text }).select().single();
    },
  };

  /* ---------------------------------------------------------------- utils */
  const round = (n, dp = 0) => {
    const f = 10 ** dp;
    return Math.round((Number(n) || 0) * f) / f;
  };
  const inr = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

  /* --------------------------------------------------------------- export */
  global.API = {
    get mode() { return mode; },
    /** true when Supabase keys are present in config.js */
    get isConfigured() { return !!(SB && SB.isConfigured); },
    /** true when data is *currently* coming from the database (a failure flips mode to "demo") */
    get isLive() { return mode === "live"; },
    onModeChange: (cb) => { onModeChange.add(cb); return () => onModeChange.delete(cb); },
    listings, orders, shipments, forecasts, reference, savings, auth, messages,
    utils: { round, inr, emojiFor },
    _sample: SAMPLE,
  };
})(window);
