(() => {
  const HOME_PATHS = new Set(["/", "/index.html", ""]);
  const TRADE_PATHS = new Set(["/trade", "/trade/"]);

  const dock = () => document.querySelector("[data-privacy-dock]");
  const fab = () => document.querySelector("[data-privacy-fab]");
  const notice = () => document.querySelector("[data-privacy-notice]");
  const vault = () => document.querySelector("[data-privacy-vault]");
  const stack = () => document.querySelector("[data-privacy-stack]");
  const gpcNote = () => document.querySelector("[data-privacy-gpc]");

  function pagePath(pathname) {
    return (pathname || "/").split("?")[0].split("#")[0];
  }

  function isHome(pathname) {
    return HOME_PATHS.has(pagePath(pathname));
  }

  function isTrade(pathname) {
    return TRADE_PATHS.has(pagePath(pathname));
  }

  function hasGpc(nav = typeof navigator === "undefined" ? undefined : navigator) {
    if (!nav) return false;
    return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
  }

  function mode() {
    const root = dock();
    if (root?.hidden || root?.dataset.privacyMode === "hidden") return "hidden";
    if (vault() && !vault().hidden) return "vault";
    if (notice() && !notice().hidden) return "notice";
    return "fab";
  }

  function hideOnTrade() {
    const root = dock();
    if (!root) return;
    root.hidden = true;
    if (fab()) fab().hidden = true;
    if (notice()) notice().hidden = true;
    if (vault()) vault().hidden = true;
    root.dataset.privacyMode = "hidden";
  }

  function syncHomePrivacyReserve() {
    if (!document.body?.classList.contains("page-index")) return;
    const card = notice();
    const raw = card && !card.hidden ? Math.ceil(card.offsetHeight) : 0;
    // Private Browsing is a popup overlay. Do not shrink the hero.
    document.body.style.setProperty("--privacy-reserve-h", "0px");
    document.body.dataset.homePrivacy = raw ? "open" : "closed";
  }

  function syncHomeScale() {
    if (!document.body?.classList.contains("page-index")) return;
    const board = document.querySelector(".page-index .hero-main");
    if (!board) return;
    // First paint is CSS-only. Do not measure or transform the hero.
    void board.offsetHeight;
    document.body.style.setProperty("--home-scale", "1");
  }

  function syncHomeFrame() {
    syncHomePrivacyReserve();
    syncHomeScale();
  }

  function setMode(next) {
    if (isTrade(window.location.pathname)) {
      hideOnTrade();
      return;
    }
    const root = dock();
    if (!root) return;
    root.hidden = false;
    if (fab()) fab().hidden = next !== "fab";
    if (notice()) notice().hidden = next !== "notice";
    if (vault()) vault().hidden = next !== "vault";
    root.dataset.privacyMode = next;
    syncHomeFrame();
  }

  function applyGpc() {
    if (gpcNote()) gpcNote().hidden = !hasGpc();
  }

  function closestAction(target, selector) {
    return target instanceof Element ? target.closest(selector) : null;
  }

  function onPathChange() {
    applyGpc();
    if (isTrade(window.location.pathname)) {
      hideOnTrade();
      return;
    }
    if (isHome(window.location.pathname)) {
      if (mode() === "fab" || mode() === "hidden") setMode("notice");
      return;
    }
    if (mode() === "notice" || mode() === "hidden") setMode("fab");
  }

  function setup() {
    const root = dock();
    if (!root || root.dataset.bound === "1") return;
    root.dataset.bound = "1";
    applyGpc();

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (closestAction(target, "[data-privacy-fab]")) {
        event.preventDefault();
        setMode("vault");
        return;
      }
      if (closestAction(target, "[data-privacy-open-vault]")) {
        event.preventDefault();
        setMode("vault");
        return;
      }
      if (closestAction(target, "[data-privacy-close-notice]")) {
        event.preventDefault();
        setMode("fab");
        return;
      }
      if (closestAction(target, "[data-privacy-close-vault]")) {
        event.preventDefault();
        setMode("fab");
        return;
      }
      if (closestAction(target, "[data-privacy-got-it]")) {
        event.preventDefault();
        setMode("fab");
        return;
      }
      if (closestAction(target, "[data-privacy-legal]")) {
        setMode("fab");
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (mode() !== "notice") return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (stack()?.contains(target)) return;
      if (closestAction(target, "[data-privacy-fab], [data-privacy-open-vault]")) return;
      setMode("fab");
    });

    window.addEventListener(
      "scroll",
      () => {
        if (mode() === "notice") setMode("fab");
      },
      { passive: true, capture: true },
    );

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (mode() === "vault" || mode() === "notice") {
        event.preventDefault();
        setMode("fab");
      }
    });

    if (isTrade(window.location.pathname)) {
      hideOnTrade();
    } else if (isHome(window.location.pathname)) {
      if (mode() !== "notice") setMode("notice");
    } else if (mode() !== "fab") {
      setMode("fab");
    }
    syncHomeFrame();
    window.addEventListener("resize", syncHomeFrame);
  }

  const pushState = history.pushState.bind(history);
  const replaceState = history.replaceState.bind(history);
  history.pushState = (...args) => {
    pushState(...args);
    onPathChange();
  };
  history.replaceState = (...args) => {
    replaceState(...args);
    onPathChange();
  };
  window.addEventListener("popstate", onPathChange);

  window.PondPrivacy = {
    openVault() {
      if (isTrade(window.location.pathname)) return;
      setMode("vault");
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
})();
