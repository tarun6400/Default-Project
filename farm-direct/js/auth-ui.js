/* ============================================================================
 * auth-ui.js — sign in / sign up modal, session chip, "sell" action
 *
 * Replaces the old static enquiry modal with a real Supabase auth flow.
 * Exposes window.AuthUI with:
 *   AuthUI.requireAuth()        -> Promise<profile|null>  (prompts if signed out)
 *   AuthUI.session              -> current profile or null
 *   AuthUI.signOut()
 *   AuthUI.openSignUp(prefill)
 * ========================================================================== */
(function (global) {
  "use strict";

  const API = global.API;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let session = null;
  const watchers = new Set();
  const notify = () => watchers.forEach((cb) => cb(session));

  /* --------------------------------------------------------------- markup */
  const AUTH_HTML = `
  <div class="modal" id="authModal" hidden>
    <div class="modal__backdrop" data-auth-close></div>
    <div class="modal__panel modal__panel--auth" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="modal__close" data-auth-close aria-label="Close">&times;</button>

      <div class="auth__brand">
        <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="20" height="20"><path d="M16 3c5 4 8 8 8 13a8 8 0 0 1-16 0c0-5 3-9 8-13Z" fill="currentColor" opacity=".22"/><path d="M16 6v20M16 12c-2-1-4-1-6 0M16 17c2-1 4-1 6 0M16 9c1.5-1 3-1.5 4.5-1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>
        </span>
        <span class="brand__text">Farm<b>Direct</b></span>
      </div>

      <div class="auth__tabs" role="tablist">
        <button class="auth__tab is-active" data-auth-tab="signin" role="tab" aria-selected="true">Sign in</button>
        <button class="auth__tab" data-auth-tab="signup" role="tab" aria-selected="false">Create account</button>
      </div>

      <p class="auth__intro" id="authIntro">Sign in to place orders, list your produce and track deliveries.</p>

      <div class="auth__demo" id="authDemo">
        <p class="auth__demo-head">
          <strong>Quick sign-in</strong> — tap a role at the bottom of this dialog, no password needed.
          <span id="authDemoNote">Works without a backend, in a local sandbox.</span>
        </p>
        <details class="auth__more">
          <summary>Signing in with an email address?</summary>
          <p class="auth__demo-foot">
            Use the form below — password <code>farmdirect123</code>.
            <span id="authDemoBackend"></span>
          </p>
        </details>
      </div>

      <form id="authForm" novalidate>
        <div class="auth__pane" data-auth-pane="signin">
          <div class="field">
            <label for="aEmail">Email</label>
            <input class="input" id="aEmail" type="email" autocomplete="email" required placeholder="you@example.com" />
          </div>
          <div class="field">
            <div class="auth__labelrow">
              <label for="aPassword">Password</label>
              <button class="auth__link" type="button" data-auth-forgot>Forgot password?</button>
            </div>
            <input class="input" id="aPassword" type="password" autocomplete="current-password" required placeholder="••••••••" />
          </div>
        </div>

        <div class="auth__pane" data-auth-pane="signup" hidden>
          <div class="field">
            <label for="aRole">I am joining as</label>
            <div class="auth__roles" id="aRole">
              <label class="auth__role is-active"><input type="radio" name="role" value="buyer" checked /><span>🛒 Buyer</span></label>
              <label class="auth__role"><input type="radio" name="role" value="farmer" /><span>🌾 Farmer</span></label>
              <label class="auth__role"><input type="radio" name="role" value="fpo" /><span>🏭 FPO</span></label>
            </div>
          </div>
          <div class="field">
            <label for="aName">Full name</label>
            <input class="input" id="aName" autocomplete="name" placeholder="e.g. Venkateswarlu" />
          </div>
          <div class="field">
            <label for="aPhone">Phone (optional)</label>
            <input class="input" id="aPhone" type="tel" autocomplete="tel" placeholder="+91 98xxx xxxxx" />
          </div>
          <div class="field-row">
            <div class="field">
              <label for="aDistrict">District</label>
              <input class="input" id="aDistrict" placeholder="Guntur" />
            </div>
            <div class="field">
              <label for="aState">State</label>
              <input class="input" id="aState" placeholder="Andhra Pradesh" />
            </div>
          </div>
          <div class="field" data-role-farmer hidden>
            <label for="aVillage">Village / block</label>
            <input class="input" id="aVillage" placeholder="Kaza" />
          </div>
          <div class="field">
            <label for="aSignupEmail">Email</label>
            <input class="input" id="aSignupEmail" type="email" autocomplete="email" placeholder="you@example.com" />
          </div>
          <div class="field">
            <label for="aSignupPassword">Password</label>
            <input class="input" id="aSignupPassword" type="password" autocomplete="new-password" placeholder="At least 6 characters" />
          </div>
        </div>

        <p class="auth__error" id="authError" hidden></p>
        <p class="auth__done" id="authDone" hidden></p>
      </form>

      <!-- the submit lives outside the form and is pinned to the bottom of the
           dialog, so it is visible and clickable on any screen height -->
      <div class="auth__foot">
        <div class="auth__quick" id="authQuick">
          <button type="button" class="auth__quickbtn" data-quick="farmer@guntur.farm">🌾 Farmer</button>
          <button type="button" class="auth__quickbtn" data-quick="fpo@dharwad.farm">🏭 FPO</button>
          <button type="button" class="auth__quickbtn" data-quick="buyer@kirana.shop">🛒 Buyer</button>
          <button type="button" class="auth__quickbtn" data-quick="admin@farmdirect.gov">🏛️ Admin</button>
        </div>
        <button class="btn btn--primary btn--block" type="submit" form="authForm" id="authSubmit">Sign in</button>
        <p class="auth__foothint" id="authFootHint">Email + password, or tap a role above.</p>
      </div>
    </div>
  </div>`;

  /* --------------------------------------------------------------- setup */
  function mount() {
    const host = document.createElement("div");
    host.innerHTML = AUTH_HTML;
    document.body.appendChild(host.firstElementChild);
    wire();
  }

  const modal = () => $("#authModal");

  function wire() {
    const root = modal();

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-auth-close]")) close();
    });

    $$("[data-auth-tab]", root).forEach((tab) => {
      tab.addEventListener("click", () => switchTab(tab.dataset.authTab));
    });

    // role radio -> show the village field only for farmers
    $$('input[name="role"]', root).forEach((r) => {
      r.addEventListener("change", () => {
        $$(".auth__role", root).forEach((l) => l.classList.toggle("is-active", l.contains(r) && r.checked));
        $("[data-role-farmer]", root).hidden = r.value !== "farmer";
      });
    });

    $("[data-auth-forgot]", root).addEventListener("click", onForgot);

    // one-click demo sign-in
    $("#authQuick", root).addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-quick]");
      if (!btn) return;
      clearMessages();
      btn.disabled = true;
      try {
        await API.auth.signIn({ email: btn.dataset.quick, password: "farmdirect123" });
        await refreshSession();
        showDone("Signed in.");
        setTimeout(close, 450);
      } catch (err) {
        showError(friendly(err));
      } finally {
        btn.disabled = false;
      }
    });

    $("#authForm", root).addEventListener("submit", onSubmit);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && root && !root.hidden) close();
    });

    // tell the user which auth backend is actually running
    if (API.isConfigured) {
      $("#authDemoNote", root).textContent = "Signs in against your Supabase project.";
      $("#authDemoBackend", root).innerHTML =
        " Connected to <code>Supabase</code>.";
    } else {
      $("#authDemoNote", root).textContent =
        "No Supabase project connected — this is a local sandbox session, nothing is sent anywhere.";
      $("#authDemoBackend", root).innerHTML =
        ' To use a real database, add your keys to <code>config.js</code>.';
    }
  }

  function switchTab(name) {
    const root = modal();
    $$("[data-auth-tab]", root).forEach((t) => {
      const on = t.dataset.authTab === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    $$("[data-auth-pane]", root).forEach((p) => (p.hidden = p.dataset.authPane !== name));
    // the single submit button follows the active tab
    const submit = $("#authSubmit", root);
    if (submit) {
      submit.textContent = name === "signup" ? "Create account" : "Sign in";
      submit.dataset.authSubmit = name;
    }
    const hint = $("#authFootHint", root);
    if (hint) {
      hint.textContent = name === "signup"
        ? "Takes a moment — you can list produce and message farmers straight away."
        : "Email + password, or use a quick sign-in above.";
    }
    clearMessages();
  }

  function clearMessages() {
    $("#authError", modal()).hidden = true;
    $("#authDone", modal()).hidden = true;
  }

  function showError(msg) {
    const el = $("#authError", modal());
    el.textContent = msg;
    el.hidden = false;
    $("#authDone", modal()).hidden = true;
  }

  function showDone(msg) {
    const el = $("#authDone", modal());
    el.textContent = msg;
    el.hidden = false;
    $("#authError", modal()).hidden = true;
  }

  /* --------------------------------------------------------------- open/close */
  let lastFocused = null;

  function open(tab = "signin") {
    const root = modal();
    switchTab(tab);
    root.hidden = false;
    document.body.style.overflow = "hidden";
    lastFocused = document.activeElement;
    const first = tab === "signin" ? $("#aEmail", root) : $("#aName", root);
    setTimeout(() => first && first.focus(), 40);
  }

  function close() {
    const root = modal();
    root.hidden = true;
    document.body.style.overflow = "";
    $("#authForm", root).reset();
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    if (pendingAuth) {
      const done = pendingAuth;
      pendingAuth = null;
      done(session);
    }
  }

  /* ------------------------------------------------------------- handlers */
  async function onSubmit(e) {
    e.preventDefault();
    clearMessages();

    const root = modal();
    const pane = $$("[data-auth-pane]", root).find((p) => !p.hidden);
    const isSignup = pane && pane.dataset.authPane === "signup";
    const btn = e.submitter || $(isSignup ? '[data-auth-submit="signup"]' : '[data-auth-submit="signin"]', root);
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Please wait…";

    try {
      if (isSignup) {
        const email = $("#aSignupEmail", root).value.trim();
        const password = $("#aSignupPassword", root).value;
        const role = $('input[name="role"]:checked', root).value;

        if (!email || !password) return throwErr("Email and password are required.");
        if (password.length < 6) return throwErr("Password must be at least 6 characters.");

        const { needsConfirmation } = await API.auth.signUp({
          email,
          password,
          fullName: $("#aName", root).value.trim() || email.split("@")[0],
          phone: $("#aPhone", root).value.trim(),
          district: $("#aDistrict", root).value.trim(),
          state: $("#aState", root).value.trim(),
          village: $("#aVillage", root).value.trim(),
          role,
        });

        if (needsConfirmation) {
          showDone("Account created. Check your inbox to confirm the address, then sign in.");
          return;
        }
        await refreshSession();
        showDone("Welcome aboard — your account is ready.");
        setTimeout(close, 700);
        return;
      }

      const email = $("#aEmail", root).value.trim();
      const password = $("#aPassword", root).value;
      if (!email || !password) return throwErr("Email and password are required.");

      await API.auth.signIn({ email, password });
      await refreshSession();
      showDone("Signed in.");
      setTimeout(close, 500);
    } catch (err) {
      showError(friendly(err));
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }

    function throwErr(msg) {
      showError(msg);
      return new Error(msg);
    }
  }

  async function onForgot() {
    const root = modal();
    const email = $("#aEmail", root).value.trim();
    if (!email) return showError("Enter your email first, then tap forgot password.");
    try {
      await global.SB.auth.resetPassword(email, location.origin + location.pathname);
      showDone("If that address is registered, a reset link is on its way.");
    } catch (err) {
      showError(friendly(err));
    }
  }

  function friendly(err) {
    const msg = (err && err.message) || "Something went wrong.";
    if (/Invalid login credentials/i.test(msg)) return "That email and password combination did not match an account.";
    if (/already registered|already been registered/i.test(msg)) return "That email is already registered — try signing in instead.";
    if (/Password should be at least/i.test(msg)) return "Password must be at least 6 characters.";
    if (/not configured/i.test(msg)) return "Supabase is not configured. Add your URL and anon key in config.js.";
    if (/Failed to fetch|NetworkError/i.test(msg)) return "Could not reach Supabase. Check your connection and the URL in config.js.";
    return msg;
  }

  /* ------------------------------------------------------------- session */
  let pendingAuth = null;   // resolve fn waiting on a requireAuth() gate

  async function refreshSession() {
    try {
      session = await API.auth.profile();
    } catch {
      session = null;
    }
    renderSession();
    notify();
    if (session && pendingAuth) {
      const done = pendingAuth;
      pendingAuth = null;
      done(session);
    }
    return session;
  }

  function renderSession() {
    const chip = $("#sessionChip");
    if (!chip) return;
    if (!session) {
      chip.hidden = true;
      return;
    }
    chip.hidden = false;
    const initial = (session.full_name || session.email || "?").trim().charAt(0).toUpperCase();
    $("#chipAvatar", chip).textContent = initial;
    $("#chipName", chip).textContent = session.full_name || session.email;
    $("#chipRole", chip).textContent = session.role;
  }

  async function signOut() {
    await API.auth.signOut().catch(() => {});
    await refreshSession();
  }

  /** Gate an action behind sign-in. Resolves with the profile, or null if cancelled. */
  function requireAuth({ reason = "Sign in to continue." } = {}) {
    if (session) return Promise.resolve(session);
    $("#authIntro", modal()).textContent = reason;
    open("signin");
    return new Promise((resolve) => {
      pendingAuth = resolve;
    });
  }

  /* --------------------------------------------------------------- boot */
  function init() {
    mount();
    API.auth.onChange((event, profile) => {
      session = event === "SIGNED_IN" ? profile : null;
      renderSession();
      notify();
    });
    // both modes: a local sandbox session survives a reload, Supabase refreshes its token
    refreshSession();
  }

  global.AuthUI = {
    init,
    get session() { return session; },
    get isSignedIn() { return !!session; },
    onChange: (cb) => { watchers.add(cb); return () => watchers.delete(cb); },
    openSignIn: () => open("signin"),
    openSignUp: () => open("signup"),
    requireAuth,
    signOut,
    close,
    refreshSession,
  };
})(window);
