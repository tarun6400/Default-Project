/* ============================================================
   FarmDirect — SIH26033
   Page controller: nav, reveal, counters, marketplace, forecast,
   savings calculator, order + sell dialogs.
   Data comes from window.API (js/api.js), which falls back to
   bundled sample data when Supabase is not configured.
   ============================================================ */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const inr = (n) => "₹" + (Math.round(Number(n) || 0)).toLocaleString("en-IN");
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );

  /* ------------------------------------------------------------------ API */
  const API = window.API;
  const AuthUI = window.AuthUI;
  const DEMO = !API || !API.isLive;

  /* ============================================================ NAV ==== */
  const nav = $("#nav");
  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");

  const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.addEventListener("click", (e) => {
    const link = e.target.closest("a[href^='#']");
    if (!link || link.getAttribute("href") === "#") return;
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });

  // active section highlighting
  const sections = $$("main section[id]");
  const linkMap = new Map(
    $$(".nav__links a[href^='#']").map((a) => [a.getAttribute("href").slice(1), a])
  );
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = linkMap.get(entry.target.id);
        if (!link || !entry.isIntersecting) return;
        $$(".nav__links a[href^='#']").forEach((a) => a.classList.remove("is-active"));
        link.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ======================================================== REVEAL ==== */
  const revealTargets = $$(
    ".pcard, .layer, .step, .fcard, .imp, .listing, .chain-viz, .quote-strip, .calc__box, .fc, .fc__note"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
        el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 6) * 65}ms`;
        el.classList.add("is-in");
        revealIO.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealTargets.forEach((el) => revealIO.observe(el));

  /* ======================================================= COUNTERS ==== */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const t0 = performance.now();
    const dur = 1500;

    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const val = target * (1 - Math.pow(1 - p, 3));
      el.textContent =
        prefix +
        (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-IN")) +
        (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        countIO.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* =================================================== BACKEND BAR ==== */
  const bar = $("#backendBar");
  function paintBackendBar() {
    if (!bar) return;
    const configured = API && API.isConfigured;
    const live = API && API.isLive;
    bar.hidden = false;
    bar.classList.toggle("is-live", !!live);
    $("#backendBarTitle").textContent = live
      ? "Connected to Supabase"
      : configured
      ? "Supabase configured, offline"
      : "Demo mode";
    $("#backendBarText").textContent = live
      ? "Live data from your database. Orders, messages and listings persist."
      : configured
      ? `Keys found in config.js, but the database is not responding (${
          API.mode === "live" ? "starting up" : "showing sample data"
        }). Showing sample data.`
      : "No backend configured — sample data, and sign-in is a local sandbox session. Nothing is sent anywhere.";
    $("#backendBarLink").hidden = !!configured;
    document.body.classList.add("has-backend-bar");
  }
  if (bar) {
    paintBackendBar();
    if (API && API.onModeChange) API.onModeChange(paintBackendBar);
    $("#backendBarClose").addEventListener("click", () => {
      bar.hidden = true;
      document.body.classList.remove("has-backend-bar");
    });
  }

  /* ======================================================= TOAST ==== */
  const toastEl = $("#appStatus");
  let toastTimer = null;
  const toast = (msg, kind = "") => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = "app-status" + (kind ? ` app-status--${kind}` : "");
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.hidden = true), 4200);
  };

  /* ================================================== MARKETPLACE ==== */
  const listingsEl = $("#listings");
  const emptyEl = $("#listingsEmpty");
  let allListings = [];
  let activeFilter = "all";
  let query = "";
  let searchTimer = null;

  async function loadListings() {
    if (!listingsEl) return;
    listingsEl.innerHTML = skeleton(6);
    try {
      allListings = await API.listings.search({ category: "all" });
      renderListings();
    } catch (e) {
      listingsEl.innerHTML = "";
      emptyEl.textContent = "Could not load listings. Please try again.";
      emptyEl.hidden = false;
      console.error(e);
    }
  }

  const skeleton = (n) =>
    Array.from({ length: n }, () => '<div class="listing listing--skeleton"></div>').join("");

  function visible() {
    return allListings.filter((l) => {
      if (activeFilter !== "all" && l.category !== activeFilter) return false;
      if (!query) return true;
      const hay = `${l.crop} ${l.district} ${l.seller_name} ${l.org}`.toLowerCase();
      return hay.includes(query);
    });
  }

  function renderListings() {
    if (!listingsEl) return;
    const rows = visible();
    if (!rows.length) {
      listingsEl.innerHTML = "";
      emptyEl.textContent = "No listings match that search. Try a different crop or district.";
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    listingsEl.innerHTML = rows.map(listingCard).join("");
  }

  function listingCard(l) {
    const save = l.mrp ? Math.round(((l.mrp - l.price) / l.mrp) * 100) : l.savings_pct;
    const fresh = l.harvest_days === 0;
    const tag = fresh ? "Harvested today" : l.tag;
    const tagClass = fresh ? "" : l.is_fpo ? " listing__tag--fpo" : "";
    const fpoName = l.is_fpo ? ` · ${esc(l.org)}` : "";

    return `
      <article class="listing" data-id="${esc(l.id)}">
        <div class="listing__top">
          <span class="listing__emoji" aria-hidden="true">${l.emoji}</span>
          <span class="listing__tag${tagClass}">${esc(tag)}</span>
        </div>
        <h3>${esc(l.crop)}</h3>
        <div class="listing__meta">
          <span>${esc(l.seller_name)}${fpoName}${l.seller_verified ? " ✓" : ""}</span>
          <span>${esc(l.district)} · ${esc(l.grade || "Ungraded")} · ${esc(l.quantity)} ${esc(l.unit)}</span>
        </div>
        <div class="listing__price">
          <b>${inr(l.price)}</b>
          ${l.mrp ? `<s>${inr(l.mrp)}</s>` : ""}
          ${save ? `<span class="listing__save">Save ${save}%</span>` : ""}
        </div>
        <div class="listing__actions">
          <button class="btn btn--sm btn--primary" data-act="order" data-id="${esc(l.id)}">Order</button>
          <button class="btn btn--sm btn--ghost" data-act="sell-desc" data-id="${esc(l.id)}">Details</button>
        </div>
      </article>`;
  }

  $("#filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    $$(".chip", $("#filters")).forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeFilter = btn.dataset.filter;
    renderListings();
  });

  $("#searchInput").addEventListener("input", (e) => {
    query = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderListings, 120);
  });

  listingsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === "order") openOrder(id);
    else openDetails(id);
  });

  loadListings();

  /* ====================================================== FORECAST ==== */
  const fcBody = $("#fcBody");
  const fcEmpty = $("#fcEmpty");
  let horizon = 7;

  async function loadForecast() {
    if (!fcBody) return;
    const district = $("#fcDistrict").value;
    fcBody.innerHTML = skeletonRows();
    fcEmpty.hidden = true;

    let rows = [];
    try {
      rows = await API.forecasts.for(district, horizon);
    } catch (err) {
      console.warn("[forecast] failed", err);
    }

    if (!rows.length) {
      fcBody.innerHTML = "";
      fcEmpty.hidden = false;
      $("#fcModelText").textContent = DEMO ? "baseline-v1 · sample district" : "no model output";
      return;
    }

    const model = rows[0].model || "baseline-v1";
    const n = rows[0].sample_size;
    $("#fcModelText").textContent =
      `${model} · ${n ? `${n} observations` : "recency-weighted mandi mean"} · ${horizon}-day horizon`;

    fcBody.innerHTML = rows
      .map(
        (f) => `
        <tr>
          <td><span class="fc__crop">${API.utils.emojiFor(f.crop)} ${esc(f.crop)}</span></td>
          <td class="fc__price">${inr(f.price)}<small style="font-size:.68rem;color:var(--ink-400);font-weight:500">/qtl</small></td>
          <td class="fc__range">${inr(f.low)} – ${inr(f.high)}</td>
          <td>${Number(f.demand).toLocaleString("en-IN")} qtl</td>
          <td>
            <span class="fc__conf">
              <span class="fc__confbar"><i style="width:${Math.round(f.confidence * 100)}%"></i></span>
              <span class="fc__conftxt">${Math.round(f.confidence * 100)}%</span>
            </span>
          </td>
          <td><span class="pill-signal pill-signal--${esc(f.signal || "balanced")}">${esc(f.signal || "balanced")}</span></td>
        </tr>`
      )
      .join("");
  }

  const skeletonRows = () =>
    Array.from({ length: 4 }, () => `<tr><td colspan="6"><div class="fc__skel"></div></td></tr>`).join("");

  $("#fcDistrict").addEventListener("change", loadForecast);
  $("#fcHorizon").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-horizon]");
    if (!btn) return;
    $$("#fcHorizon .seg__btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    horizon = Number(btn.dataset.horizon);
    loadForecast();
  });
  loadForecast();

  /* ==================================================== CALCULATOR ==== */
  const budget = $("#budgetRange");
  const share = $("#shareRange");
  const hops = $("#hopsRange");
  const outBar = $("#outBar");
  let calcSeq = 0;

  async function updateCalc() {
    const b = +budget.value;
    const s = +share.value;
    const h = +hops.value;

    $("#budgetOut").textContent = inr(b);
    $("#shareOut").textContent = s + "%";
    $("#hopsOut").textContent = h + (h === 1 ? " hop" : " hops");

    const seq = ++calcSeq;
    let r;
    try {
      r = await API.savings.estimate({ budget: b, share: s, hops: h });
    } catch {
      return;
    }
    if (seq !== calcSeq) return; // a newer keystroke won

    $("#outToday").textContent = inr(r.spend_today);
    $("#outDirect").textContent = inr(r.spend_direct);
    $("#outSave").innerHTML = inr(r.saved) + "<small>/month</small>";
    $("#outFrac").textContent = inr(r.saved);

    const pct = Math.max((r.spend_direct / r.spend_today) * 100, 12);
    outBar.style.setProperty("--v", pct + "%");
    outBar.querySelector("span").textContent = "FarmDirect · " + Math.round(pct) + "%";
    outBar.classList.add("is-in");

    $("#outFarmers").textContent = "~" + r.extra_quintals + " extra quintals";
  }

  [budget, share, hops].forEach((el) => el.addEventListener("input", updateCalc));
  updateCalc();

  /* =================================================== ORDER MODAL ==== */
  const orderModal = $("#orderModal");
  let activeListing = null;

  async function openOrder(id) {
    const l = await API.listings.byId(id);
    if (!l) return toast("That listing is no longer available.", "err");

    const profile = await AuthUI.requireAuth({
      reason: "Sign in to place a direct order — your details are shared with the farm for delivery.",
    });
    if (!profile) return;

    activeListing = l;
    $("#orderEmoji").textContent = l.emoji;
    $("#orderTitle").textContent = `Order ${l.crop}`;
    $("#orderSub").textContent = `Direct from ${l.seller_name}${l.is_fpo ? " · " + l.org : ""}. No trader margin in between.`;
    $("#oUnit").textContent = l.unit;
    $("#oAvail").textContent = `${l.quantity} ${l.unit} available in ${l.district}`;

    $("#oAddr").value = [profile.village, profile.district, profile.state].filter(Boolean).join(", ");
    $("#oQty").max = l.quantity;
    $("#oQty").value = Math.min(1, l.quantity);

    $("#orderFacts").innerHTML = `
      <div class="order__facts-row"><span>Seller</span><b>${esc(l.seller_name)}${l.seller_verified ? " ✓ verified" : ""}</b></div>
      <div class="order__facts-row"><span>Grade</span><b>${esc(l.grade || "Ungraded")}</b></div>
      <div class="order__facts-row"><span>From</span><b>${esc(l.district)}</b></div>
      <div class="order__facts-row"><span>Farmer price</span><b>${inr(l.price)} / ${esc(l.unit)}</b></div>`;

    $("#orderError").hidden = true;
    $("#orderDone").hidden = true;
    $("#orderSubmit").disabled = false;
    $("#orderSubmit").textContent = "Confirm direct order";

    calcOrderTotals();
    show(orderModal);
    setTimeout(() => $("#oQty").focus(), 50);
  }

  function calcOrderTotals() {
    if (!activeListing) return;
    const qty = Number($("#oQty").value) || 0;
    const price = activeListing.price;
    const mrp = activeListing.mrp;
    const subtotal = qty * price;
    const fee = Math.round(subtotal * 0.02 * 100) / 100;
    const save = mrp ? (mrp - price) * qty : 0;

    $("#orderTotals").innerHTML = `
      <div class="order__totals-row"><span>${qty} ${esc(activeListing.unit)} × ${inr(price)}</span><span>${inr(subtotal)}</span></div>
      <div class="order__totals-row"><span>Platform + logistics fee (2%)</span><span>${inr(fee)}</span></div>
      ${save ? `<div class="order__totals-row order__totals-row--save"><span>You save vs retail</span><span>${inr(save)}</span></div>` : ""}
      <div class="order__totals-row order__totals-row--total"><span>Total</span><span>${inr(subtotal + fee)}</span></div>
      <div class="order__totals-row" style="font-size:.78rem;color:var(--green-700)"><span>Farmer receives</span><span>${inr(subtotal)} in full</span></div>`;
  }

  $("#oQty").addEventListener("input", calcOrderTotals);

  $("#orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeListing) return;

    const qty = Number($("#oQty").value) || 0;
    const addr = $("#oAddr").value.trim();
    const err = $("#orderError");
    err.hidden = true;

    if (qty <= 0) {
      err.textContent = "Enter a quantity greater than zero.";
      err.hidden = false;
      return;
    }
    if (qty > Number(activeListing.quantity)) {
      err.textContent = `Only ${activeListing.quantity} ${activeListing.unit} available.`;
      err.hidden = false;
      return;
    }
    if (!addr) {
      err.textContent = "A delivery address is required.";
      err.hidden = false;
      return;
    }

    const btn = $("#orderSubmit");
    btn.disabled = true;
    btn.textContent = "Placing order…";

    try {
      const order = await API.orders.place({
        listing_id: activeListing.id,
        quantity: qty,
        address: addr,
      });
      $("#orderDone").innerHTML = `
        <b>Order ${esc(order.order_ref || order.id)} confirmed.</b><br>
        The farm has been notified. ${inr(order.farmer_earnings)} goes to the farmer and
        ${inr(order.consumer_savings || 0)} is saved against retail.`;
      $("#orderDone").hidden = false;
      btn.textContent = "Order placed";
      btn.classList.replace("btn--primary", "btn--white");
      toast(`Order ${order.order_ref || ""} placed directly with ${activeListing.seller_name}.`, "live");
      loadListings(); // stock changed
      setTimeout(closeOrder, 2600);
    } catch (err2) {
      err.textContent = (err2 && err2.message) || "Could not place the order.";
      err.hidden = false;
      btn.disabled = false;
      btn.textContent = "Confirm direct order";
    }
  });

  function closeOrder() {
    hide(orderModal);
    activeListing = null;
    const btn = $("#orderSubmit");
    btn.classList.replace("btn--white", "btn--primary");
  }

  /* =============================================== DETAILS DRAWER ==== */
  let detailEl = null;
  function ensureDetailsModal() {
    if (detailEl) return detailEl;
    detailEl = document.createElement("div");
    detailEl.className = "modal";
    detailEl.id = "detailsModal";
    detailEl.hidden = true;
    detailEl.innerHTML = `
      <div class="modal__backdrop" data-details-close></div>
      <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="dTitle">
        <button class="modal__close" data-details-close aria-label="Close">✕</button>
        <div id="dBody"></div>
      </div>`;
    document.body.appendChild(detailEl);
    detailEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-details-close]")) hide(detailEl);
      if (e.target.closest("[data-act=order]")) {
        const id = e.target.dataset.id;
        hide(detailEl);
        openOrder(id);
      }
    });
    return detailEl;
  }

  async function openDetails(id) {
    const l = await API.listings.byId(id);
    if (!l) return toast("Listing not found.", "err");

    let fc = null;
    try {
      fc = await API.forecasts.compute(l.crop, l.district.split(",")[0], 7);
    } catch {
      /* forecast is a nice-to-have */
    }

    const save = l.mrp ? Math.round(((l.mrp - l.price) / l.mrp) * 100) : null;
    const el = ensureDetailsModal();

    $("#dBody", el).innerHTML = `
      <span class="order__emoji">${l.emoji}</span>
      <h3 id="dTitle">${esc(l.crop)}</h3>
      <p>${esc(l.description || "No description provided.")}</p>

      <div class="order__facts">
        <div class="order__facts-row"><span>Seller</span><b>${esc(l.seller_name)}${l.is_fpo ? " · " + esc(l.org) : ""}</b></div>
        <div class="order__facts-row"><span>Grade</span><b>${esc(l.grade || "Ungraded")}</b></div>
        <div class="order__facts-row"><span>Available</span><b>${esc(l.quantity)} ${esc(l.unit)}</b></div>
        <div class="order__facts-row"><span>Location</span><b>${esc(l.district)}</b></div>
        <div class="order__facts-row"><span>Farmer price</span><b>${inr(l.price)} / ${esc(l.unit)}</b></div>
        ${l.mrp ? `<div class="order__facts-row"><span>Retail reference</span><b>${inr(l.mrp)} (you save ${save}%)</b></div>` : ""}
      </div>

      ${
        fc
          ? `<div class="fc__model" style="margin-bottom:16px">
               <span class="fc__model-dot"></span>
               <span>7-day forecast for ${esc(fc.crop)} in ${esc(fc.district)}:
               <b>${inr(fc.price)}/qtl</b> (${inr(fc.low)}–${inr(fc.high)}), ${Math.round(fc.confidence * 100)}% confidence</span>
             </div>`
          : ""
      }

      <div class="detail__chat">
        <h4>Ask the farmer</h4>
        <div class="detail__msgs" id="dMsgs"></div>
        <form class="detail__form" id="dChatForm">
          <input class="input" id="dChatInput" placeholder="Ask about grade, delivery, bulk rates…" />
          <button class="btn btn--sm btn--primary" type="submit">Send</button>
        </form>
      </div>

      <button class="btn btn--primary btn--block" data-act="order" data-id="${esc(l.id)}" style="margin-top:18px">
        Order ${esc(l.crop)} directly
      </button>`;

    show(el);
    loadChat(l);
  }

  async function loadChat(listing) {
    const box = $("#dMsgs");
    if (!box) return;
    box.innerHTML = '<p class="detail__empty">Loading conversation…</p>';
    let msgs = [];
    try {
      msgs = await API.messages.forListing(listing.id);
    } catch {
      /* offline */
    }
    if (!msgs.length) {
      box.innerHTML = '<p class="detail__empty">No messages yet. Start the conversation.</p>';
      return;
    }
    const me = AuthUI.session?.id;
    box.innerHTML = msgs
      .map((m) => {
        const mine = m.sender_id === me || m.sender_id === "me";
        return `<p class="detail__msg ${mine ? "is-mine" : ""}">${esc(m.body)}</p>`;
      })
      .join("");
    box.scrollTop = box.scrollHeight;

    $("#dChatForm", detailEl).onsubmit = async (e) => {
      e.preventDefault();
      const input = $("#dChatInput");
      const body = input.value.trim();
      if (!body) return;
      const profile = await AuthUI.requireAuth({ reason: "Sign in to message the farmer." });
      if (!profile) return;
      input.value = "";
      box.insertAdjacentHTML("beforeend", `<p class="detail__msg is-mine">${esc(body)}</p>`);
      box.scrollTop = box.scrollHeight;
      API.messages.send(listing.id, body).catch((err) => console.warn("[chat] send failed", err));
    };
  }

  /* =================================================== SELL MODAL ==== */
  const sellModal = $("#sellModal");

  async function openSell() {
    const profile = await AuthUI.requireAuth({
      reason: "Sign in to list your produce — buyers order directly, and you keep the full price.",
    });
    if (!profile) return;

    if (profile.role === "buyer") {
      toast("Buyer accounts can browse but not list produce. Sign up as a farmer or FPO to sell.", "err");
      return;
    }

    $("#sellError").hidden = true;
    $("#sellDone").hidden = true;
    $("#sellSubmit").disabled = false;
    $("#sellSubmit").textContent = "Publish listing";
    show(sellModal);
    setTimeout(() => $("#sCrop").focus(), 50);
  }

  $("#sellForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#sellError");
    err.hidden = true;

    const payload = {
      crop: $("#sCrop").value.trim(),
      variety: null,
      category: $("#sCategory").value,
      grade: $("#sGrade").value.trim() || null,
      description: $("#sDesc").value.trim() || null,
      quantity: Number($("#sQty").value),
      unit: $("#sUnit").value,
      price_per_unit: Number($("#sPrice").value),
      mrp_per_unit: Number($("#sMrp").value) || null,
      harvest_date: new Date().toISOString().slice(0, 10),
      district: AuthUI.session?.district || "Unknown",
      state: AuthUI.session?.state || "Unknown",
    };

    if (!payload.crop || !(payload.quantity > 0) || !(payload.price_per_unit > 0)) {
      err.textContent = "Crop, quantity and price are required.";
      err.hidden = false;
      return;
    }
    if (payload.mrp_per_unit && payload.mrp_per_unit < payload.price_per_unit) {
      err.textContent = "Retail reference cannot be lower than your price.";
      err.hidden = false;
      return;
    }

    const btn = $("#sellSubmit");
    btn.disabled = true;
    btn.textContent = "Publishing…";

    try {
      const created = await API.listings.create(payload);
      $("#sellDone").innerHTML = `<b>Published.</b> ${esc(created.crop)} is live at ${inr(created.price)} per ${esc(created.unit)}.`;
      $("#sellDone").hidden = false;
      $("#sellSubmit").textContent = "Listed";
      btn.classList.replace("btn--primary", "btn--white");
      toast(`${created.crop} is now live on the marketplace.`, "live");
      loadListings();
      setTimeout(() => {
        hide(sellModal);
        $("#sellForm").reset();
        btn.classList.replace("btn--white", "btn--primary");
        btn.disabled = false;
        btn.textContent = "Publish listing";
      }, 2200);
    } catch (err2) {
      err.textContent = (err2 && err2.message) || "Could not publish the listing.";
      err.hidden = false;
      btn.disabled = false;
      btn.textContent = "Publish listing";
    }
  });

  /* ================================================== MODAL PLUMBING ==== */
  function show(el) {
    el.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function hide(el) {
    el.hidden = true;
    if ($$(".modal").every((m) => m.hidden)) document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-order-close]")) closeOrder();
    if (e.target.closest("[data-sell-close]")) {
      hide(sellModal);
      const btn = $("#sellSubmit");
      btn.classList.replace("btn--white", "btn--primary");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (detailEl && !detailEl.hidden) return hide(detailEl);
    if (sellModal && !sellModal.hidden) return hide(sellModal);
    if (orderModal && !orderModal.hidden) closeOrder();
  });

  /* =================================================== ENTRY POINTS ==== */
  const AUTH_CTA = {
    farmer: {
      role: "farmer",
      intro: "Create a farmer account to list your produce and sell direct to consumers and bulk buyers.",
    },
    buyer: {
      role: "buyer",
      intro: "Create a buyer account to order straight from farms and FPOs at the source price.",
    },
    govt: {
      role: "admin",
      intro: "District and state officers can request a pilot and see aggregated impact for the region.",
    },
    sell: {
      role: "farmer",
      intro: "Sign in to list your produce — buyers order directly and you keep the full price.",
    },
  };

  document.addEventListener("click", async (e) => {
    const cta = e.target.closest("[data-auth]");
    if (!cta) return;
    e.preventDefault();
    const kind = cta.dataset.auth;

    if (kind === "sell") return openSell();

    if (AuthUI.isSignedIn) {
      // already signed in — jump to the relevant action
      if (kind === "farmer") return openSell();
      return document.querySelector("#market")?.scrollIntoView({ behavior: "smooth" });
    }

    const cfg = AUTH_CTA[kind] || AUTH_CTA.buyer;
    AuthUI.openSignUp();
    const radio = $(`input[name="role"][value="${cfg.role}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const intro = $("#authIntro");
    if (intro) intro.textContent = cfg.intro;
  });

  $("#navAuth").addEventListener("click", (e) => {
    e.preventDefault();
    if (AuthUI.isSignedIn) document.querySelector("#market")?.scrollIntoView({ behavior: "smooth" });
    else AuthUI.openSignIn();
  });

  $("#chipSignOut").addEventListener("click", async () => {
    await AuthUI.signOut();
    toast("Signed out.");
    renderNavAuth();
  });

  function renderNavAuth() {
    const btn = $("#navAuth");
    if (!btn) return;
    btn.textContent = AuthUI.isSignedIn ? "Open marketplace" : "Sign in";
  }

  AuthUI.onChange(() => {
    renderNavAuth();
    // re-render so seller-only affordances reflect the new role
    loadListings();
  });

  /* ==================================================== BAR ANIMATION ==== */
  const barIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        barIO.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );
  $$(".chain-viz .bar").forEach((el) => barIO.observe(el));

  /* ============================================================ BOOT ==== */
  AuthUI.init();
  renderNavAuth();

  if (DEMO) {
    toast("Demo mode — sample data. Add your Supabase keys in config.js for live data.", "");
  } else {
    API.onModeChange((m) => toast(m === "live" ? "Connected to Supabase." : `Falling back to sample data: ${m}`, m === "live" ? "live" : "err"));
  }

  // expose for the console / debugging
  window.__farmdirect = { API, AuthUI, reloadListings: loadListings, loadForecast };
})();
