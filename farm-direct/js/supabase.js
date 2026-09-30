/* ============================================================================
 * supabase.js — minimal PostgREST + GoTrue client
 * No dependencies, no build step. Plain fetch.
 *
 * Exposes a global: window.SB  (Supabase-like surface)
 *   SB.from('listings').select('*').eq('status','active').order('created_at')
 *   SB.from('listings').insert({...}).select().single()
 *   SB.from('listings').update({...}).eq('id', id).select().single()
 *   SB.from('listings').delete().eq('id', id)
 *   SB.rpc('place_order', { p_listing_id, p_quantity, p_delivery_address })
 *   SB.auth.signUp({...}) / signIn / signOut / getSession / onAuthStateChange
 *   SB.storage.from('produce-images').upload(path, file)
 *
 * A chainable builder is used for the query builder: every filter returns the
 * same builder and the promise resolves on .then()/.single()/.maybeSingle().
 * ========================================================================== */
(function (global) {
  "use strict";

  const cfg = global.FARMDIRECT_CONFIG || {};
  const URL = (cfg.supabaseUrl || "").replace(/\/+$/, "");
  const KEY = cfg.supabaseAnonKey || "";

  const SESSION_KEY = "farmdirect.session";
  const listeners = new Set();

  /* ---------------------------------------------------------------- utils */
  const isConfigured = () => !!(URL && KEY && URL.startsWith("http"));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function refreshOnce() {
    const session = readSession();
    if (!session || !session.refresh_token) return null;

    const res = await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        apikey: KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const next = normaliseSession(data);
    writeSession(next);
    return next;
  }

  function normaliseSession(data) {
    if (!data || !data.access_token) return null;
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      user: data.user || null,
    };
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeSession(session) {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage unavailable (private mode) — session stays in memory only */
    }
    global.__fdSession = session;
  }

  let currentUser = null;
  let refreshPromise = null;
  let expiringSoon = null;

  /* Auto-refresh the access token a minute before it lapses. */
  function scheduleRefresh(session) {
    if (expiringSoon) clearTimeout(expiringSoon);
    if (!session || !session.expires_at) return;
    const ms = Math.max((session.expires_at - 60) * 1000 - Date.now(), 5000);
    expiringSoon = setTimeout(async () => {
      if (!refreshPromise) refreshPromise = refreshOnce().finally(() => (refreshPromise = null));
      const next = await refreshPromise;
      if (next) emit("TOKEN_REFRESHED", next.user);
    }, ms);
  }

  function emit(event, payload) {
    listeners.forEach((cb) => {
      try {
        cb(event, payload);
      } catch (e) {
        console.error("[supabase] auth listener failed", e);
      }
    });
  }

  async function accessToken() {
    const session = readSession() || global.__fdSession;
    if (!session) return null;
    if (session.expires_at && session.expires_at * 1000 - Date.now() < 60_000) {
      const next = await refreshOnce();
      if (next) return next.access_token;
    }
    return session.access_token;
  }

  /* ------------------------------------------------------------- fetch core */
  function headers(extra) {
    return {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      Accept: "application/json",
      ...extra,
    };
  }

  async function authedHeaders(extra) {
    const token = await accessToken();
    return headers(token ? { Authorization: `Bearer ${token}`, ...extra } : extra);
  }

  /** Retry once on 401 after refreshing the token. */
  async function request(url, options, attempt = 0) {
    const res = await fetch(url, options);

    if (res.status === 401 && attempt === 0) {
      const next = await refreshOnce();
      if (next) {
        const retryOptions = { ...options, headers: { ...options.headers } };
        retryOptions.headers.Authorization = `Bearer ${next.access_token}`;
        return request(url, retryOptions, 1);
      }
    }

    if (res.status === 204) return null;

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) throw toError(res.status, data);
    return data;
  }

  function toError(status, data) {
    const err = new Error(errorMessage(data) || `Request failed (${status})`);
    err.status = status;
    err.code = data && (data.code || data.error_code) || null;
    err.details = data && (data.details || data.hint) || null;
    return err;
  }

  function errorMessage(data) {
    if (!data) return null;
    if (typeof data === "string") return data.slice(0, 300);
    if (Array.isArray(data)) return data.map(errorMessage).filter(Boolean).join("; ");
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.error_description) return data.error_description;
    return null;
  }

  /* --------------------------------------------------------- query builder */
  class QueryBuilder {
    constructor(table) {
      this.table = table;
      this.params = new URLSearchParams();
      this.method = "GET";
      this.body = undefined;
      this.maybe = false;
      this.wantObject = false;
      this.isRpc = false;
    }

    _append(k, v) {
      const cur = this.params.get(k);
      this.params.set(k, cur ? `${cur},${v}` : v);
      return this;
    }

    select(columns = "*", { count } = {}) {
      this.params.set("select", columns);
      if (count) this.params.set("count", count);
      return this;
    }

    insert(rows) {
      this.method = "POST";
      this.body = Array.isArray(rows) ? rows : [rows];
      this.params.set("select", this.params.get("select") || "representation");
      return this;
    }

    upsert(rows, { onConflict } = {}) {
      this.method = "POST";
      this.body = Array.isArray(rows) ? rows : [rows];
      this.params.set("select", "representation");
      this.headers = { Prefer: "resolution=merge-duplicates,return=representation" };
      if (onConflict) this.params.set("on_conflict", onConflict);
      return this;
    }

    update(patch) {
      this.method = "PATCH";
      this.body = patch;
      this.params.set("select", this.params.get("select") || "representation");
      return this;
    }

    delete() {
      this.method = "DELETE";
      this.params.set("select", this.params.get("select") || "representation");
      return this;
    }

    eq(col, val) { return this._append(col, `eq.${val}`); }
    neq(col, val) { return this._append(col, `neq.${val}`); }
    gt(col, val) { return this._append(col, `gt.${val}`); }
    gte(col, val) { return this._append(col, `gte.${val}`); }
    lt(col, val) { return this._append(col, `lt.${val}`); }
    lte(col, val) { return this._append(col, `lte.${val}`); }
    like(col, pat) { return this._append(col, `like.${pat}`); }
    ilike(col, pat) { return this._append(col, `ilike.${pat}`); }
    is(col, val) { return this._append(col, val === null ? "is.null" : "is.not.null"); }
    in(col, vals) { return this._append(col, `in.(${vals.join(",")})`); }

    or(filters) { return this._append("or", `(${filters})`); }
    not(col, op, val) { return this._append(col, `not.${op}.${val}`); }

    order(col, { ascending = true, nullsFirst } = {}) {
      this.params.set("order", `${col}.${ascending ? "asc" : "desc"}${nullsFirst ? ".nullsfirst" : ""}`);
      return this;
    }

    limit(n) { this.params.set("limit", n); return this; }

    range(from, to) { this.params.set("offset", from).set("limit", to - from + 1); return this; }

    single() { this.wantObject = true; this.maybe = false; return this._resolve(); }
    maybeSingle() { this.wantObject = true; this.maybe = true; return this._resolve(); }

    then(onOk, onErr) { return this._resolve().then(onOk, onErr); }
    catch(onErr) { return this._resolve().catch(onErr); }
    finally(cb) { return this._resolve().finally(cb); }

    async _resolve() {
      if (!isConfigured()) {
        throw new Error(
          "Supabase is not configured. Set supabaseUrl and supabaseAnonKey in config.js"
        );
      }
      const qs = this.params.toString();
      const url = `${URL}/rest/v1/${this.table}${qs ? "?" + qs : ""}`;

      const opts = {
        method: this.method,
        headers: await authedHeaders({
          "Content-Type": "application/json",
          ...(this.headers || {}),
          // PostgREST only collapses to a single object on this media type
          ...(this.wantObject ? { Accept: "application/vnd.pgrst.object+json" } : {}),
        }),
      };
      if (this.body !== undefined) opts.body = JSON.stringify(this.body);

      let data;
      try {
        data = await request(url, opts);
      } catch (e) {
        if (this.maybe && isNoRowError(e)) return null;
        throw e;
      }

      if (!this.wantObject) return data;

      // tolerate a server that ignores the single-object header
      if (Array.isArray(data)) {
        if (!data.length) return this.maybe ? null : data;
        return data[0];
      }
      return this.maybe && data === null ? null : data;
    }
  }

  /** PostgREST signals "no rows" with 404 / PGRST116 and "many rows" with 406. */
  function isNoRowError(e) {
    if (e.status === 404 || e.status === 406) return true;
    const code = String(e.code || "");
    if (code === "PGRST116") return true;
    return /\b0 rows\b|no rows|multiple \(or no\) rows/i.test(e.message || "");
  }

  /* ------------------------------------------------------------------ auth */

  /* ---------------------------------------------------------------------
   * Local auth provider
   *
   * Used when no Supabase project is configured, so the whole app (order,
   * chat, sell) stays demonstrable offline. Sessions live in localStorage
   * under a separate key and are clearly flagged as local — they never touch
   * a server and grant no real access to anything.
   * ------------------------------------------------------------------- */
  const LOCAL_KEY = "farmdirect.localuser";

  const DEMO_ACCOUNTS = {
    "farmer@guntur.farm": { role: "farmer", full_name: "Venkateswarlu", district: "Guntur", state: "Andhra Pradesh", village: "Kaza" },
    "farmer@nadia.farm": { role: "farmer", full_name: "Kiran Kumar", district: "Nadia", state: "West Bengal", village: "Kukunoor" },
    "fpo@dharwad.farm": { role: "fpo", full_name: "Anjaneyulu Patil", district: "Dharwad", state: "Karnataka", village: "Toranur" },
    "buyer@kirana.shop": { role: "buyer", full_name: "Ramesh Store", district: "Guntur", state: "Andhra Pradesh" },
    "buyer@hostelgroup.in": { role: "buyer", full_name: "Sunita Catering", district: "Bareilly", state: "Uttar Pradesh" },
    "admin@farmdirect.gov": { role: "admin", full_name: "District Officer", district: "Guntur", state: "Andhra Pradesh" },
  };

  const localListeners = new Set();

  const readLocalUser = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const writeLocalUser = (u) => {
    try {
      if (u) localStorage.setItem(LOCAL_KEY, JSON.stringify(u));
      else localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* ignore */
    }
  };
  const emitLocal = (event, user) =>
    localListeners.forEach((cb) => {
      try { cb(event, user); } catch { /* ignore */ }
    });

  const localAuth = {
    isLocal: true,

    async getSession() {
      return { session: readLocalUser(), user: readLocalUser() };
    },

    async getUser() {
      const u = readLocalUser();
      return { user: u };
    },

    async signIn({ email, password }) {
      const addr = String(email || "").trim().toLowerCase();
      if (!addr || !password) throw new Error("Email and password are required.");

      const known = DEMO_ACCOUNTS[addr];
      const user = known
        ? { id: `local-${addr.replace(/[^a-z]/g, "")}`, email: addr, is_local: true, ...known }
        : null;

      if (!user) {
        throw new Error(
          `No local demo account for "${addr}". Use one of the listed demo accounts, or create an account below.`
        );
      }
      // the sandbox accepts any non-empty password so the flow is easy to try
      if (String(password).length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      writeLocalUser(user);
      emitLocal("SIGNED_IN", user);
      return { user, session: user, isLocal: true };
    },

    async signUp({ email, password, data = {} }) {
      const addr = String(email || "").trim().toLowerCase();
      if (!addr || !addr.includes("@")) throw new Error("Enter a valid email address.");
      if (String(password || "").length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }
      const user = {
        id: `local-${addr.replace(/[^a-z]/g, "")}`,
        email: addr,
        is_local: true,
        role: data.role || "buyer",
        full_name: data.full_name || addr.split("@")[0],
        district: data.district || null,
        state: data.state || null,
        village: data.village || null,
        phone: data.phone || null,
        is_verified: false,
      };
      writeLocalUser(user);
      emitLocal("SIGNED_IN", user);
      return { user, session: user, isLocal: true, needsConfirmation: false };
    },

    async signOut() {
      writeLocalUser(null);
      emitLocal("SIGNED_OUT", null);
    },

    async updateUser(patch) {
      const u = readLocalUser();
      if (!u) throw new Error("Not signed in.");
      const next = { ...u, ...(patch.data || {}), ...(patch.email ? { email: patch.email } : {}) };
      writeLocalUser(next);
      emitLocal("USER_UPDATED", next);
      return { user: next };
    },

    onAuthStateChange(cb) {
      localListeners.add(cb);
      const u = readLocalUser();
      setTimeout(() => cb(u ? "SIGNED_IN" : "SIGNED_OUT", u), 0);
      return { data: { subscription: { unsubscribe: () => localListeners.delete(cb) } } };
    },

    async resetPassword() {
      throw new Error("Password reset needs a connected Supabase project.");
    },
  };

  function authHeaders(extra) {
    return headers(extra);
  }

  const auth = {
    /** true when auth is running locally without a Supabase project */
    get isLocal() { return !isConfigured(); },

    async getSession() {
      return isConfigured() ? supabaseAuth.getSession() : localAuth.getSession();
    },

    async getUser() {
      return isConfigured() ? supabaseAuth.getUser() : localAuth.getUser();
    },

    async signUp(payload) {
      return isConfigured() ? supabaseAuth.signUp(payload) : localAuth.signUp(payload);
    },

    async signIn(payload) {
      return isConfigured() ? supabaseAuth.signIn(payload) : localAuth.signIn(payload);
    },

    async signOut() {
      return isConfigured() ? supabaseAuth.signOut() : localAuth.signOut();
    },

    onAuthStateChange(cb) {
      return isConfigured() ? supabaseAuth.onAuthStateChange(cb) : localAuth.onAuthStateChange(cb);
    },

    async updateUser(patch) {
      return isConfigured() ? supabaseAuth.updateUser(patch) : localAuth.updateUser(patch);
    },

    async resetPassword(email, redirectTo) {
      return isConfigured() ? supabaseAuth.resetPassword(email, redirectTo) : localAuth.resetPassword();
    },
  };

  const supabaseAuth = {
    async getSession() {
      const session = readSession() || global.__fdSession;
      return { session, user: session ? session.user : null };
    },

    async getUser() {
      const { session } = await auth.getSession();
      return { user: session ? session.user : null };
    },

    async signUp({ email, password, data = {} }) {
      if (!isConfigured()) throw new Error("Supabase is not configured.");
      const res = await request(`${URL}/auth/v1/signup`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email, password, data }),
      });

      const session = normaliseSession(res);
      if (session) {
        writeSession(session);
        scheduleRefresh(session);
        emit("SIGNED_IN", session.user);
      }
      // when email confirmation is on, res is a user with no session
      return { user: res.user || session?.user || null, session, needsConfirmation: !session };
    },

    async signIn({ email, password }) {
      if (!isConfigured()) throw new Error("Supabase is not configured.");
      const res = await request(`${URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email, password }),
      });

      const session = normaliseSession(res);
      writeSession(session);
      scheduleRefresh(session);
      emit("SIGNED_IN", session.user);
      return { user: session.user, session };
    },

    async signOut() {
      const token = await accessToken();
      if (token) {
        try {
          await request(`${URL}/auth/v1/logout`, {
            method: "POST",
            headers: { apikey: KEY, Authorization: `Bearer ${token}` },
          });
        } catch {
          /* logging out locally is enough */
        }
      }
      writeSession(null);
      currentUser = null;
      emit("SIGNED_OUT", null);
    },

    onAuthStateChange(cb) {
      listeners.add(cb);
      // replay the current state immediately
      const session = readSession() || global.__fdSession;
      setTimeout(() => cb(session ? "SIGNED_IN" : "SIGNED_OUT", session?.user ?? null), 0);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },

    async updateUser(patch) {
      const token = await accessToken();
      if (!token) throw new Error("Not signed in.");
      const res = await request(`${URL}/auth/v1/user`, {
        method: "PUT",
        headers: { apikey: KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const session = readSession();
      if (session) {
        session.user = res;
        writeSession(session);
      }
      return { user: res };
    },

    async resetPassword(email, redirectTo) {
      if (!isConfigured()) throw new Error("Supabase is not configured.");
      return request(`${URL}/auth/v1/recover`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email, ...(redirectTo ? { redirect_to: redirectTo } : {}) }),
      });
    },
  };

  /* ------------------------------------------------------------------ rpc */
  async function rpc(fn, params = {}) {
    if (!isConfigured()) throw new Error("Supabase is not configured.");
    const data = await request(`${URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: await authedHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(params),
    });
    return data;
  }

  /* --------------------------------------------------------------- storage */
  const storage = {
    from(bucket) {
      const upload = async (path, file, { upsert = false } = {}) => {
        if (!isConfigured()) throw new Error("Supabase is not configured.");
        const token = await accessToken();
        const res = await request(`${URL}/storage/v1/object/${bucket}/${path}`, {
          method: upsert ? "PUT" : "POST",
          headers: {
            apikey: KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": file.type || "application/octet-stream",
            ...(upsert ? { "x-upsert": "true" } : {}),
          },
          body: file,
        });
        return { path, publicUrl: getPublicUrl(bucket, path), data: res };
      };

      return {
        upload,
        async getPublicUrl(path) {
          return { data: { publicUrl: getPublicUrl(bucket, path) } };
        },
        async remove(paths) {
          const token = await accessToken();
          const list = (Array.isArray(paths) ? paths : [paths]).join(",");
          return request(`${URL}/storage/v1/object/${bucket}?names=${encodeURIComponent(list)}`, {
            method: "DELETE",
            headers: { apikey: KEY, Authorization: `Bearer ${token}` },
          });
        },
      };
    },
  };

  const getPublicUrl = (bucket, path) =>
    isConfigured()
      ? `${URL}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`
      : null;

  /* --------------------------------------------------------------- export */
  global.SB = {
    from: (table) => new QueryBuilder(table),
    rpc,
    auth,
    storage,
    get isConfigured() { return isConfigured(); },
    get url() { return URL || null; },
    sleep,
    // escape hatch for the raw REST API
    raw: (path, options) => request(`${URL}/rest/v1/${path}`, options),
  };

  /* Restore an existing session on page load. */
  (async () => {
    const session = readSession();
    if (!session) return;
    scheduleRefresh(session);
    if (session.expires_at * 1000 < Date.now()) {
      const next = await refreshOnce();
      if (!next) writeSession(null);
    }
  })();
})(window);
