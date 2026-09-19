(() => {
  const WC_SCRIPTS = [{ src: "/vendor/xrpl-latest-min.js" }, { src: "/vendor/xrpl-connect.umd.js" }];

  let current = null;
  let wcManager = null;
  let scriptsPromise = null;
  let wcProjectId = "";
  let xamanStatus = { configured: false, reason: "" };

  const DEFAULT_ICON = "/greenhead-duck.png";
  const root = () => document.querySelector("[data-session-chip]");
  const menu = () => document.querySelector("[data-session-menu]");
  const toggle = () => document.querySelector("[data-session-toggle]");
  const guest = () => document.querySelector("[data-session-guest]");
  const authed = () => document.querySelector("[data-session-authed]");
  const profileLink = () => document.querySelector("[data-session-profile]");
  const avatarEl = () => document.querySelector("[data-session-avatar]");
  const nameEl = () => document.querySelector("[data-session-name]");

  function iconSrc(value) {
    const text = String(value || "").trim();
    if (/^https:\/\//i.test(text) || /^data:image\//i.test(text) || /^\/(?!\/)/.test(text)) {
      return text;
    }
    return DEFAULT_ICON;
  }

  function rememberExtras(data) {
    if (data?.walletconnect?.projectId) wcProjectId = data.walletconnect.projectId;
    if (data?.xaman) xamanStatus = data.xaman;
  }

  function fromSession(data) {
    rememberExtras(data);
    if (!data?.address) return null;
    return {
      address: data.address,
      method: data.method,
      handle: data.handle || "",
      admin: Boolean(data.admin),
      disclaimerAccepted: Boolean(data.disclaimerAccepted),
      icon: data.icon || "",
      displayName: data.displayName || "",
      signedInWith: data.signedInWith || "",
      expiresAt: data.expiresAt || null,
      activeAt: data.activeAt || null,
      idleMs: data.idleMs || 0,
    };
  }

  function profileLabel(session) {
    return session?.displayName || session?.handle || "Your profile";
  }

  function shortAddr(addr) {
    return addr && addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr || "";
  }

  function notify() {
    window.dispatchEvent(new CustomEvent("pond:session-change", { detail: current }));
  }

  function setMenuOpen(open) {
    const panel = menu();
    const button = toggle();
    if (!panel || !button) return;
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open) {
      window.PondXaman?.startSignIn?.(document.querySelector("[data-xaman-autostart]"));
    }
  }

  function paint() {
    const signedIn = Boolean(current?.address);
    if (guest()) guest().hidden = signedIn;
    if (authed()) authed().hidden = !signedIn;
    const link = profileLink();
    const label = profileLabel(current);
    if (link instanceof HTMLAnchorElement) {
      link.href = current?.handle ? `/profile/${current.handle}/` : "/profile/";
      link.setAttribute("aria-label", `Open ${label}`);
      link.title = label;
    }
    const avatar = avatarEl();
    if (avatar) avatar.src = iconSrc(current?.icon);
    const name = nameEl();
    if (name) name.textContent = signedIn ? label : "";
    document.querySelectorAll("[data-privacy-session]").forEach((el) => {
      el.hidden = !signedIn;
      el.textContent = signedIn
        ? `Signed in as ${shortAddr(current.address)} via ${current.method === "xaman" ? "Xaman" : "WalletConnect"}.`
        : "";
    });
    if (signedIn) setMenuOpen(false);
  }

  async function refresh() {
    try {
      const response = await fetch("/api/session", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      rememberExtras(data);
      current = fromSession(data);
    } catch {
      current = null;
    }
    paint();
    notify();
    refreshXamanNote();
    window.PondStart?.init?.();
    return current;
  }

  async function login(detail = {}) {
    const method = detail.method === "xaman" ? "xaman" : "walletconnect";
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        method,
        address: detail.address || "",
        uuid: detail.uuid || "",
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || "Sign in failed");
      error.status = response.status;
      throw error;
    }
    current = fromSession(data);
    paint();
    notify();
    window.PondStart?.init?.();
    return current;
  }

  async function logout() {
    try {
      await fetch("/api/session", {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
    } catch {
      /* still clear the chip */
    }
    try {
      sessionStorage.removeItem("pond-xaman-session");
      sessionStorage.removeItem("pond-xaman-qr");
    } catch {
      /* private mode */
    }
    current = null;
    paint();
    notify();
    window.PondXaman?.init?.();
    window.PondStart?.init?.();
  }

  function logoutIf(detail = {}) {
    if (detail.method && current?.method !== detail.method) return Promise.resolve(current);
    return logout();
  }

  function loadScript(entry) {
    const existing = [...document.scripts].find((node) => node.src === entry.src);
    if (existing) {
      return existing.dataset.loaded === "1" || window.XRPLConnect
        ? Promise.resolve()
        : new Promise((resolve, reject) => {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", () => reject(new Error("WalletConnect script failed to load.")), {
              once: true,
            });
          });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = entry.src;
      if (entry.integrity) {
        script.integrity = entry.integrity;
        script.crossOrigin = "anonymous";
      }
      script.defer = true;
      script.addEventListener(
        "load",
        () => {
          script.dataset.loaded = "1";
          resolve();
        },
        { once: true },
      );
      script.addEventListener("error", () => reject(new Error("WalletConnect script failed to load.")), { once: true });
      document.head.appendChild(script);
    });
  }

  function ensureScripts() {
    if (window.XRPLConnect?.WalletManager) return Promise.resolve();
    if (!scriptsPromise) {
      scriptsPromise = WC_SCRIPTS.reduce((chain, entry) => chain.then(() => loadScript(entry)), Promise.resolve());
    }
    return scriptsPromise;
  }

  async function connectWalletConnect() {
    if (document.getElementById("trade-app") && typeof window.PondTrade?.connectWallet === "function") {
      setMenuOpen(false);
      window.PondTrade.connectWallet();
      return;
    }
    if (!wcProjectId) await refresh();
    if (!wcProjectId) throw new Error("WalletConnect is not configured.");
    await ensureScripts();
    const api = window.XRPLConnect;
    const connector = document.getElementById("pond-session-connector");
    if (!api?.WalletManager || !api?.WalletConnectAdapter || !connector) {
      throw new Error("WalletConnect could not load. Open Trade and connect there.");
    }
    if (!wcManager) {
      const adapter = new api.WalletConnectAdapter({
        projectId: wcProjectId,
        metadata: {
          name: "Pond Protocol",
          description: "Non-custodial XRPL login for Pond Protocol.",
          url: window.location.origin,
          icons: [],
        },
        themeMode: "dark",
      });
      wcManager = new api.WalletManager({
        adapters: [adapter],
        network: "mainnet",
        autoConnect: false,
      });
      wcManager.on("connect", (account) => {
        if (account?.address) login({ method: "walletconnect", address: account.address });
      });
      wcManager.on("accountChanged", (account) => {
        if (account?.address) login({ method: "walletconnect", address: account.address });
      });
      wcManager.on("disconnect", () => {
        logoutIf({ method: "walletconnect" });
      });
      connector.setWalletManager(wcManager);
    }
    setMenuOpen(false);
    await connector.open();
  }

  function refreshXamanNote() {
    const note = document.querySelector("[data-session-xaman-note]");
    if (!note) return;
    if (document.querySelector("[data-xaman-autostart]")) {
      note.hidden = true;
      return;
    }
    if (xamanStatus.configured) {
      note.hidden = true;
      return;
    }
    note.hidden = false;
    note.textContent =
      xamanStatus.reason ||
      "Xaman is disabled until Autoscale has XUMM_API_KEY and XUMM_API_SECRET.";
  }

  function setup() {
    const chip = root();
    if (!chip || chip.dataset.bound === "1") return;
    chip.dataset.bound = "1";

    toggle()?.addEventListener("click", (event) => {
      event.stopPropagation();
      const panel = menu();
      setMenuOpen(Boolean(panel?.hidden));
    });
    document.querySelector("[data-session-wc]")?.addEventListener("click", async (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await connectWalletConnect();
      } catch (error) {
        const note = document.querySelector("[data-session-wc-error]");
        if (note) {
          note.hidden = false;
          note.textContent = error.message || "WalletConnect was cancelled.";
        }
      } finally {
        button.disabled = false;
      }
    });
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (chip.contains(target)) return;
      setMenuOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    });

    refresh();
  }

  function patch(fields = {}) {
    if (!current) return current;
    current = { ...current, ...fields };
    paint();
    return current;
  }

  window.PondSession = {
    init: setup,
    refresh,
    login,
    logout,
    logoutIf,
    patch,
    current: () => current,
    connectWalletConnect,
    walletConnectProjectId: () => wcProjectId,
    xaman: () => xamanStatus,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
