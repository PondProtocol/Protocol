(() => {
  const html = document.documentElement;
  const KEY_COLLAPSED = "pond-docs-nav-collapsed";
  const mq = window.matchMedia("(max-width: 780px)");
  const isMobile = () => mq.matches;

  function setRail(root, open) {
    const rail = document.querySelector("[data-docs-toggle]");
    if (!rail) return;
    rail.setAttribute("aria-expanded", String(open));
    rail.title = open ? "Collapse documentation menu" : "Open documentation menu";
    const railText = rail.querySelector(".visually-hidden");
    if (railText) {
      railText.textContent = open ? "Collapse documentation menu" : "Open documentation menu";
    }
  }

  function openAllGroups(root) {
    root.querySelectorAll("details[data-nav-group]").forEach((details) => {
      details.open = true;
    });
  }

  function setDesktopCollapsed(root, collapsed, persist) {
    root.classList.toggle("is-collapsed", collapsed);
    html.classList.toggle("docs-collapsed", collapsed);
    if (!collapsed) openAllGroups(root);
    setRail(root, !collapsed);
    if (persist) {
      try {
        localStorage.setItem(KEY_COLLAPSED, collapsed ? "1" : "0");
      } catch {
        /* private mode */
      }
    }
  }

  function setMobileOpen(root, open) {
    root.classList.toggle("is-open", open);
    document.body.classList.toggle("docs-open", open);
    if (open) openAllGroups(root);
    document.querySelectorAll("[data-docs-open]").forEach((button) => {
      button.setAttribute("aria-expanded", String(open));
    });
    setRail(root, open);
  }

  function setupSearch() {
    const form = document.querySelector("[data-site-search]");
    const input = form?.querySelector("input");
    if (!form || !input) return;

    const pages = [...document.querySelectorAll("#site-search-pages option")].map((option) => ({
      title: option.value,
      url: option.dataset.url,
    }));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim().toLowerCase();
      if (!query) {
        input.focus();
        return;
      }

      const match =
        pages.find((page) => page.title.toLowerCase() === query || page.url === query) ||
        pages.find((page) => page.title.toLowerCase().includes(query));

      if (!match) {
        input.setAttribute("aria-invalid", "true");
        input.title = "No matching page found";
        return;
      }

      input.removeAttribute("aria-invalid");
      input.removeAttribute("title");
      navigate(match.url);
    });

    input.addEventListener("input", () => {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("title");
    });
  }

  function setupNavigation() {
    const root = document.getElementById("docs-nav");
    if (!root) return;
    html.classList.add("has-nav-js");
    setupSearch();
    openAllGroups(root);
    if (isMobile()) {
      root.classList.remove("is-collapsed");
      html.classList.remove("docs-collapsed");
      setMobileOpen(root, false);
    } else {
      setMobileOpen(root, false);
      let collapsed = false;
      try {
        collapsed = localStorage.getItem(KEY_COLLAPSED) === "1";
      } catch {
        /* private mode */
      }
      setDesktopCollapsed(root, collapsed, false);
    }
    const rail = document.querySelector("[data-docs-toggle]");
    rail?.addEventListener("click", () => {
      if (isMobile()) setMobileOpen(root, !root.classList.contains("is-open"));
      else setDesktopCollapsed(root, !root.classList.contains("is-collapsed"), true);
    });
    document.querySelectorAll("[data-docs-open]").forEach((button) => {
      button.addEventListener("click", () => setMobileOpen(root, !root.classList.contains("is-open")));
    });
    document.querySelector("[data-docs-backdrop]")?.addEventListener("click", () => setMobileOpen(root, false));
  }

  function updateHead(nextDocument) {
    document.title = nextDocument.title;
    ["description", "og:title", "og:description"].forEach((key) => {
      const selector = key.startsWith("og:") ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      const current = document.head.querySelector(selector);
      const next = nextDocument.head.querySelector(selector);
      if (current && next) current.setAttribute("content", next.getAttribute("content") || "");
    });
    const currentCanonical = document.head.querySelector('link[rel="canonical"]');
    const nextCanonical = nextDocument.head.querySelector('link[rel="canonical"]');
    if (currentCanonical && nextCanonical) {
      currentCanonical.href = nextCanonical.href;
    }
  }

  async function navigate(url, pushState = true) {
    if (html.classList.contains("is-navigating")) return;
    html.classList.add("is-navigating");
    try {
      const response = await fetch(url, { headers: { Accept: "text/html" } });
      if (!response.ok) throw new Error(`Navigation failed: ${response.status}`);
      const nextDocument = new DOMParser().parseFromString(await response.text(), "text/html");
      const nextView = nextDocument.querySelector("#site-view");
      const currentView = document.querySelector("#site-view");
      if (!nextView || !currentView) throw new Error("Navigation view missing");

      let swapped = false;
      const swap = () => {
        if (swapped) return;
        swapped = true;
        document.body.className = nextDocument.body.className;
        updateHead(nextDocument);
        currentView.replaceWith(nextView);
        if (pushState) history.pushState({}, "", url);
        window.scrollTo(0, 0);
        setupNavigation();
        window.PondTrade?.init?.();
        window.PondXaman?.init?.();
      };

      if (document.startViewTransition) {
        try {
          const transition = document.startViewTransition(swap);
          await transition.finished.catch(() => {});
        } catch {
          swap();
        }
      } else {
        swap();
      }
    } catch {
      window.location.assign(url);
    } finally {
      html.classList.remove("is-navigating");
    }
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.hash) return;
    event.preventDefault();
    navigate(`${url.pathname}${url.search}`);
  });

  window.addEventListener("popstate", () => navigate(`${window.location.pathname}${window.location.search}`, false));
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      const input = document.querySelector("#site-search-input");
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
    }
  });
  mq.addEventListener("change", setupNavigation);
  setupNavigation();
})();
