/**
 * Docs sidebar: collapse on desktop, drawer on mobile, remember both.
 * The edge chevron (.docs-rail) is the open/close control. No wallet connect.
 */
(() => {
  const root = document.getElementById("docs-nav");
  if (!root) return;

  const html = document.documentElement;
  html.classList.add("has-nav-js");

  const rail = document.querySelector("[data-docs-toggle]");
  const openers = document.querySelectorAll("[data-docs-open]");
  const backdrop = document.querySelector("[data-docs-backdrop]");
  const railText = rail?.querySelector(".visually-hidden");
  const KEY_COLLAPSED = "pond-docs-nav-collapsed";
  const KEY_GROUPS = "pond-docs-nav-groups";
  const mq = window.matchMedia("(max-width: 780px)");

  const isMobile = () => mq.matches;

  function setRail(open) {
    if (!rail) return;
    rail.setAttribute("aria-expanded", String(open));
    rail.title = open ? "Collapse documentation menu" : "Open documentation menu";
    if (railText) railText.textContent = open ? "Collapse documentation menu" : "Open documentation menu";
  }

  function setDesktopCollapsed(collapsed, persist) {
    root.classList.toggle("is-collapsed", collapsed);
    html.classList.toggle("docs-collapsed", collapsed);
    setRail(!collapsed);
    if (persist) {
      try {
        localStorage.setItem(KEY_COLLAPSED, collapsed ? "1" : "0");
      } catch {
        /* private mode */
      }
    }
  }

  function setMobileOpen(open) {
    root.classList.toggle("is-open", open);
    document.body.classList.toggle("docs-open", open);
    openers.forEach((b) => b.setAttribute("aria-expanded", String(open)));
    setRail(open);
  }

  function applyViewport() {
    if (isMobile()) {
      root.classList.remove("is-collapsed");
      html.classList.remove("docs-collapsed");
      setMobileOpen(false);
    } else {
      setMobileOpen(false);
      setDesktopCollapsed(localStorage.getItem(KEY_COLLAPSED) === "1", false);
    }
  }

  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY_GROUPS) || "{}") || {};
  } catch {
    stored = {};
  }

  root.querySelectorAll("details[data-nav-group]").forEach((details) => {
    const id = details.dataset.navGroup;
    const hasActive = Boolean(details.querySelector("a.active"));
    if (hasActive) details.open = true;
    else if (Object.prototype.hasOwnProperty.call(stored, id)) details.open = Boolean(stored[id]);
    else details.open = id === "start-here";

    details.addEventListener("toggle", () => {
      stored[id] = details.open;
      try {
        localStorage.setItem(KEY_GROUPS, JSON.stringify(stored));
      } catch {
        /* private mode */
      }
    });
  });

  applyViewport();
  mq.addEventListener("change", applyViewport);

  rail?.addEventListener("click", () => {
    if (isMobile()) setMobileOpen(!root.classList.contains("is-open"));
    else setDesktopCollapsed(!root.classList.contains("is-collapsed"), true);
  });

  openers.forEach((button) => {
    button.addEventListener("click", () => setMobileOpen(!root.classList.contains("is-open")));
  });

  backdrop?.addEventListener("click", () => setMobileOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isMobile()) setMobileOpen(false);
      else setDesktopCollapsed(true, true);
    }
  });
})();
