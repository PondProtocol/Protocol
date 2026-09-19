(() => {
  const HOME_PATHS = new Set(["/", "/index.html", ""]);

  const dock = () => document.querySelector("[data-privacy-dock]");
  const fab = () => document.querySelector("[data-privacy-fab]");
  const notice = () => document.querySelector("[data-privacy-notice]");
  const vault = () => document.querySelector("[data-privacy-vault]");
  const stack = () => document.querySelector("[data-privacy-stack]");
  const gpcNote = () => document.querySelector("[data-privacy-gpc]");

  function isHome(pathname) {
    return HOME_PATHS.has((pathname || "/").split("?")[0].split("#")[0]);
  }

  function hasGpc(nav = typeof navigator === "undefined" ? undefined : navigator) {
    if (!nav) return false;
    return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
  }

  function mode() {
    if (vault() && !vault().hidden) return "vault";
    if (notice() && !notice().hidden) return "notice";
    return "fab";
  }

  function setMode(next) {
    const root = dock();
    if (!root) return;
    if (fab()) fab().hidden = next !== "fab";
    if (notice()) notice().hidden = next !== "notice";
    if (vault()) vault().hidden = next !== "vault";
    root.dataset.privacyMode = next;
  }

  function applyGpc() {
    if (gpcNote()) gpcNote().hidden = !hasGpc();
  }

  function closestAction(target, selector) {
    return target instanceof Element ? target.closest(selector) : null;
  }

  function onPathChange() {
    applyGpc();
    if (isHome(window.location.pathname)) {
      if (mode() === "fab") setMode("notice");
      return;
    }
    if (mode() === "notice") setMode("fab");
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

    if (isHome(window.location.pathname)) setMode("notice");
    else setMode("fab");
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
      setMode("vault");
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
})();
