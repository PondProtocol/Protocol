(() => {
  const MARKUP = `<div class="trade-disclaimer-backdrop" data-disclaimer hidden>
      <section class="trade-disclaimer-dialog" role="dialog" aria-modal="true" aria-labelledby="trade-disclaimer-title">
        <p class="trade-disclaimer-kicker">Before you continue</p>
        <h2 id="trade-disclaimer-title">Pond is verification-first.</h2>
        <p class="trade-disclaimer-copy">This terminal never needs your seed, private key, or recovery phrase. $PND has not been issued and no verified market is live yet.</p>
        <p class="trade-disclaimer-copy">This terminal uses official WalletConnect or Xaman connect only. Pond never stores keys, seeds, or passwords, and never asks for a seed. After you connect, a session cookie remembers the XRPL address you signed in with.</p>
        <a class="trade-disclaimer-legal" href="/legal/">Read the disclaimer</a>
        <button type="button" class="trade-disclaimer-confirm" data-disclaimer-confirm aria-pressed="false"><span aria-hidden="true">✓</span><span>I understand the safety disclaimer</span></button>
        <div class="trade-disclaimer-actions">
          <a href="/Pond/" class="trade-disclaimer-new" data-disclaimer-new aria-disabled="true">I'm new to Pond Protocol</a>
          <button type="button" class="trade-disclaimer-known" data-disclaimer-known disabled>I Understand Pond Protocol</button>
        </div>
      </section>
    </div>`;

  let bound = false;
  let acceptedThisVisit = false;

  function modal() {
    return document.querySelector("[data-disclaimer]");
  }

  function ensureModal() {
    let root = modal();
    if (root) return root;
    const wrap = document.createElement("div");
    wrap.innerHTML = MARKUP.trim();
    root = wrap.firstElementChild;
    document.body.appendChild(root);
    bound = false;
    return root;
  }

  function session() {
    return window.PondSession?.current?.() || null;
  }

  function storedAccepted() {
    const current = session();
    return current?.method === "xaman" && Boolean(current.disclaimerAccepted);
  }

  function shouldSkipGate() {
    return storedAccepted() || (acceptedThisVisit && session()?.method === "xaman");
  }

  function setConfirmed(root, confirmed) {
    const confirm = root.querySelector("[data-disclaimer-confirm]");
    const known = root.querySelector("[data-disclaimer-known]");
    const newcomer = root.querySelector("[data-disclaimer-new]");
    if (!confirm || !known || !newcomer) return;
    confirm.setAttribute("aria-pressed", String(confirmed));
    confirm.classList.toggle("is-confirmed", confirmed);
    known.disabled = !confirmed;
    newcomer.setAttribute("aria-disabled", String(!confirmed));
  }

  function open() {
    const root = ensureModal();
    bind(root);
    setConfirmed(root, false);
    root.hidden = false;
    document.body.classList.add("trade-disclaimer-open");
    root.querySelector("[data-disclaimer-confirm]")?.focus();
  }

  function close() {
    const root = modal();
    if (root) root.hidden = true;
    document.body.classList.remove("trade-disclaimer-open");
  }

  async function persistAccepted() {
    acceptedThisVisit = true;
    const current = session();
    if (current?.method !== "xaman" || !current.address) return;
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ disclaimerAccepted: true }),
      });
      current.disclaimerAccepted = true;
    } catch {
      /* cookie/session still holds this visit */
    }
  }

  function bind(root) {
    if (!root || root.dataset.bound === "1") return;
    root.dataset.bound = "1";
    bound = true;
    const confirm = root.querySelector("[data-disclaimer-confirm]");
    const known = root.querySelector("[data-disclaimer-known]");
    const newcomer = root.querySelector("[data-disclaimer-new]");
    confirm?.addEventListener("click", () => {
      setConfirmed(root, confirm.getAttribute("aria-pressed") !== "true");
    });
    known?.addEventListener("click", async () => {
      close();
      await persistAccepted();
    });
    newcomer?.addEventListener("click", (event) => {
      if (newcomer.getAttribute("aria-disabled") === "true") event.preventDefault();
    });
    root.addEventListener("click", (event) => {
      if (event.target === root) open();
    });
  }

  async function gateTrade() {
    const root = modal();
    if (!root) return;
    bind(root);
    const ready = window.PondSession?.refresh ? window.PondSession.refresh() : Promise.resolve(session());
    await ready;
    if (shouldSkipGate()) {
      close();
      return;
    }
    open();
  }

  function onSessionChange() {
    if (!document.getElementById("trade-app")) return;
    if (shouldSkipGate()) {
      close();
      if (acceptedThisVisit && session()?.method === "xaman" && !storedAccepted()) {
        persistAccepted();
      }
      return;
    }
    if (!session()?.address) open();
  }

  window.addEventListener("pond:session-change", onSessionChange);
  window.addEventListener("pond:wallet-disconnected", () => {
    if (!shouldSkipGate()) open();
  });

  window.PondDisclaimer = {
    init: gateTrade,
    open,
    close,
    persistAccepted,
  };

  function boot() {
    if (document.getElementById("trade-app") || document.querySelector("[data-disclaimer]")) {
      gateTrade();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
