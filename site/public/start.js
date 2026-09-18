(() => {
  const STORAGE_KEY = "pond.start.progress";
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

  function load() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function save(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private mode or quota. Progress still paints for this visit.
    }
  }

  function markCurrent() {
    const path = currentPath();
    const step = STEPS.find((item) => item.urls.includes(path) || item.urls.includes(window.location.pathname));
    if (!step) return;
    const state = load();
    if (state[step.id]) return;
    state[step.id] = true;
    save(state);
  }

  function paint() {
    const roots = document.querySelectorAll("[data-start-progress]");
    if (!roots.length) return;
    const state = load();
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

  window.PondStart = { init };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
