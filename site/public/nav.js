(() => {
  const html = document.documentElement;

  function docsNav() {
    return document.getElementById("docs-nav");
  }

  function searchForm() {
    return document.querySelector("[data-site-search]");
  }

  function searchInput() {
    return document.querySelector("#site-search-input");
  }

  function topnavMenus() {
    return [...document.querySelectorAll("[data-topnav-menu]")];
  }

  function closeTopnavMenus(except) {
    topnavMenus().forEach((menu) => {
      if (menu !== except) menu.open = false;
    });
  }

  function openAllGroups(root) {
    root.querySelectorAll("details[data-nav-group]").forEach((details) => {
      details.open = true;
    });
  }

  function setIndexOpen(open) {
    const root = docsNav();
    const form = searchForm();
    const input = searchInput();
    if (!root || !form) return;
    root.hidden = !open;
    root.classList.toggle("is-open", open);
    form.classList.toggle("is-open", open);
    input?.setAttribute("aria-expanded", String(open));
    if (open) {
      closeTopnavMenus();
      openAllGroups(root);
    }
  }

  function filterIndex(query) {
    const root = docsNav();
    if (!root) return;
    const q = query.trim().toLowerCase();
    let any = false;
    root.querySelectorAll("details[data-nav-group]").forEach((group) => {
      const groupTitle = (group.querySelector(".nav-group-title")?.textContent || "").toLowerCase();
      const groupHit = Boolean(q) && groupTitle.includes(q);
      let itemHit = false;
      group.querySelectorAll(":scope > ul > li").forEach((li) => {
        const text = (li.textContent || "").toLowerCase();
        const href = (li.querySelector("a")?.getAttribute("href") || "").toLowerCase();
        const match = !q || groupHit || text.includes(q) || href.includes(q);
        li.hidden = !match;
        if (match) itemHit = true;
      });
      const show = !q || groupHit || itemHit;
      group.hidden = !show;
      if (show) {
        group.open = true;
        any = true;
      }
    });
    const empty = root.querySelector("[data-docs-empty]");
    if (empty) empty.hidden = any || !q;
  }

  function visiblePages(root) {
    return [...root.querySelectorAll("details[data-nav-group]:not([hidden]) li:not([hidden]) a[href]")].map((anchor) => ({
      title: (anchor.textContent || "").replace(/\bimportant\b/i, "").trim(),
      url: anchor.getAttribute("href"),
    }));
  }

  function setupTopnav() {
    topnavMenus().forEach((menu) => {
      if (menu.dataset.bound === "1") return;
      menu.dataset.bound = "1";
      menu.addEventListener("toggle", () => {
        if (!menu.open) return;
        closeTopnavMenus(menu);
        setIndexOpen(false);
      });
    });
  }

  function setupSearch() {
    const form = searchForm();
    const input = form?.querySelector("input");
    const root = docsNav();
    if (!form || !input || !root || form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    const open = () => {
      setIndexOpen(true);
      filterIndex(input.value);
    };

    input.addEventListener("focus", open);
    input.addEventListener("click", open);
    input.addEventListener("input", () => {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("title");
      open();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim().toLowerCase();
      if (!query) {
        open();
        input.focus();
        return;
      }

      const pages = visiblePages(root);
      const match =
        pages.find((page) => page.title.toLowerCase() === query || page.url === query) ||
        pages.find((page) => page.title.toLowerCase().includes(query));

      if (!match?.url) {
        input.setAttribute("aria-invalid", "true");
        input.title = "No matching page found";
        open();
        return;
      }

      input.removeAttribute("aria-invalid");
      input.removeAttribute("title");
      setIndexOpen(false);
      navigate(match.url);
    });

    form.addEventListener("focusout", (event) => {
      const next = event.relatedTarget;
      if (next instanceof Node && form.contains(next)) return;
      if (next == null) return;
      setIndexOpen(false);
    });
  }

  function setupNavigation() {
    const root = docsNav();
    if (!root) return;
    html.classList.add("has-nav-js");
    setupTopnav();
    setupSearch();
    openAllGroups(root);
    setIndexOpen(false);
    closeTopnavMenus();
    filterIndex("");
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
        window.PondSession?.init?.();
        window.PondStart?.init?.();
        window.PondProfile?.init?.();
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
    if (link.closest("#docs-nav")) setIndexOpen(false);
    if (link.closest("[data-topnav-menu]")) closeTopnavMenus();
    event.preventDefault();
    navigate(`${url.pathname}${url.search}`);
  });

  document.addEventListener("pointerdown", (event) => {
    const form = searchForm();
    const target = event.target;
    if (!(target instanceof Node)) return;
    const menu = target instanceof Element ? target.closest("[data-topnav-menu]") : null;
    if (menu) {
      closeTopnavMenus(menu);
      setIndexOpen(false);
      return;
    }
    if (form && form.contains(target)) {
      closeTopnavMenus();
      return;
    }
    setIndexOpen(false);
    closeTopnavMenus();
  });

  window.addEventListener("popstate", () => navigate(`${window.location.pathname}${window.location.search}`, false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const root = docsNav();
      const openMenu = topnavMenus().find((menu) => menu.open);
      if (openMenu) {
        event.preventDefault();
        closeTopnavMenus();
        openMenu.querySelector("summary")?.focus();
        return;
      }
      if (!root || root.hidden) return;
      event.preventDefault();
      setIndexOpen(false);
      searchInput()?.blur();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      const input = searchInput();
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
    }
  });
  setupNavigation();
})();
