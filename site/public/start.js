(() => {
  const STORAGE_KEY = "pond.start.progress";
  const COOKIE_KEY = "pond_progress";
  const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
  const STEPS = [
    { id: "begin", urls: ["/start/", "/start"] },
    { id: "what-is-pnd", urls: ["/start/pnd/", "/start/pnd"] },
    { id: "what-is-rpnd", urls: ["/start/rpnd/", "/start/rpnd"] },
    { id: "verify-issuer", urls: ["/verify/", "/verify"] },
    { id: "connect-wallet", urls: ["/start/wallet/", "/start/wallet"] },
    { id: "set-trust-lines", urls: ["/start/trust-lines/", "/start/trust-lines"] },
    { id: "ready-dex", urls: ["/start/dex/", "/start/dex"] },
  ];

  function currentPath() {
    const path = window.location.pathname;
    return path.endsWith("/") ? path : `${path}/`;
  }

  function readCookie(name) {
    const parts = `; ${document.cookie}`.split(`; ${name}=`);
    if (parts.length < 2) return "";
    return decodeURIComponent(parts.pop().split(";").shift() || "");
  }

  function writeCookie(name, value) {
    const secure = window.isSecureContext ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }

  function emptyStore() {
    return { v: 1, anon: {}, accounts: {} };
  }

  function asFlags(value) {
    if (Array.isArray(value)) {
      return Object.fromEntries(value.filter(Boolean).map((id) => [id, true]));
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const flags = {};
      for (const [key, on] of Object.entries(value)) {
        if (key === "v" || key === "anon" || key === "accounts") continue;
        if (on) flags[key] = true;
      }
      return flags;
    }
    return {};
  }

  function readRaw(text) {
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function absorb(store, raw) {
    if (!raw) return store;
    if (raw.v === 1) {
      store.anon = { ...asFlags(raw.anon), ...store.anon };
      const accounts = raw.accounts && typeof raw.accounts === "object" ? raw.accounts : {};
      for (const [addr, flags] of Object.entries(accounts)) {
        store.accounts[addr] = { ...asFlags(flags), ...(store.accounts[addr] || {}) };
      }
      return store;
    }
    store.anon = { ...asFlags(raw), ...store.anon };
    return store;
  }

  function loadStore() {
    const store = emptyStore();
    absorb(store, readRaw(readCookie(COOKIE_KEY)));
    try {
      absorb(store, readRaw(window.localStorage.getItem(STORAGE_KEY) || ""));
    } catch {
      /* private mode */
    }
    return store;
  }

  function persist(store) {
    const payload = JSON.stringify({
      v: 1,
      anon: store.anon,
      accounts: store.accounts,
    });
    writeCookie(COOKIE_KEY, payload);
    try {
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch {
      /* private mode or quota. Cookie still holds progress. */
    }
  }

  function sessionAddress() {
    return window.PondSession?.current?.()?.address || "";
  }

  function flagsFor(store) {
    const addr = sessionAddress();
    return addr ? { ...store.anon, ...(store.accounts[addr] || {}) } : { ...store.anon };
  }

  function mergeLogin(store) {
    const addr = sessionAddress();
    if (!addr) return store;
    store.accounts[addr] = { ...store.anon, ...(store.accounts[addr] || {}) };
    return store;
  }

  function markCurrent() {
    const path = currentPath();
    const step = STEPS.find((item) => item.urls.includes(path) || item.urls.includes(window.location.pathname));
    if (!step) return;
    const store = mergeLogin(loadStore());
    store.anon[step.id] = true;
    const addr = sessionAddress();
    if (addr) {
      store.accounts[addr] = { ...(store.accounts[addr] || {}), [step.id]: true };
    }
    persist(store);
    syncProfile(store);
  }

  function paint() {
    const roots = document.querySelectorAll("[data-start-progress]");
    if (!roots.length) return;
    const state = flagsFor(loadStore());
    let done = 0;
    STEPS.forEach((step) => {
      if (state[step.id]) done += 1;
    });
    roots.forEach((root) => {
      STEPS.forEach((step) => {
        const item = root.querySelector(`[data-start-step="${step.id}"]`);
        item?.classList.toggle("is-complete", Boolean(state[step.id]));
      });
      const count = root.querySelector("[data-start-progress-count]");
      if (count) count.textContent = `${done} / ${STEPS.length}`;
      root.classList.toggle("is-finished", done === STEPS.length);
    });
  }

  function init() {
    markCurrent();
    paint();
  }

  function flags() {
    return flagsFor(loadStore());
  }

  function syncProfile(store) {
    if (!sessionAddress()) return;
    window.PondProfile?.syncProgress?.(flagsFor(store));
  }

  window.PondStart = { init, flags, steps: STEPS };
  window.addEventListener("pond:session-change", () => {
    const store = mergeLogin(loadStore());
    persist(store);
    syncProfile(store);
    paint();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
