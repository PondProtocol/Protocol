(() => {
  const SESSION_KEY = "pond-xaman-session";
  const issuer = () => window.POND?.issuer || "";
  const mounts = () => [...document.querySelectorAll("[data-xaman-app]")];
  const isCompact = (root) => root?.hasAttribute("data-xaman-compact");
  const returnTo = (root) => {
    const requested = root?.dataset.return;
    if (requested === "/trade/" || requested === "/connect/") return requested;
    if (window.location.pathname.startsWith("/trade")) return "/trade/";
    return "/connect/";
  };

  function session() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveSession(next) {
    try {
      if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* private mode */
    }
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shortAddr(addr) {
    return addr && addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr || "";
  }

  function issuerLinks() {
    const r = issuer();
    return `
      <div class="xaman-issuer">
        <p class="xaman-kicker">Canonical issuer — check this, not the ticker</p>
        <code class="addr">${esc(r)}</code>
        <p class="xaman-actions">
          <a href="https://xumm.app/detect/xrpl?to=${esc(r)}" target="_blank" rel="noopener noreferrer">Open issuer in Xaman</a>
          <a href="https://bithomp.com/explorer/${esc(r)}" target="_blank" rel="noopener noreferrer">Bithomp</a>
          <a href="https://livenet.xrpl.org/accounts/${esc(r)}" target="_blank" rel="noopener noreferrer">livenet.xrpl.org</a>
        </p>
      </div>`;
  }

  function payloadCard(payload, heading) {
    return `
      <div class="xaman-payload">
        <p class="xaman-kicker">${esc(heading)}</p>
        ${payload.qr ? `<img class="xaman-qr" src="${esc(payload.qr)}" width="180" height="180" alt="Xaman sign request QR">` : ""}
        <p class="xaman-actions">
          ${payload.next ? `<a class="button" href="${esc(payload.next)}" target="_blank" rel="noopener noreferrer">Open in Xaman</a>` : ""}
        </p>
        <p class="xaman-note">Scan the QR or use the deep link. Pond never asks for a seed.</p>
      </div>`;
  }

  function notifyChange() {
    window.dispatchEvent(new CustomEvent("pond:xaman-change", { detail: session() }));
  }

  function unavailableHtml(reason, compact) {
    if (compact) {
      return `<button type="button" class="trade-connect-option" disabled title="${esc(reason)}">Xaman · keys unset</button>`;
    }
    return `
      <div class="xaman-card xaman-unavailable" role="status">
        <p class="xaman-kicker">Xaman</p>
        <h2>Connect unavailable until Xaman app keys are set</h2>
        <p>${esc(reason)}</p>
        <p>This is not a fake connect. The owner adds <code>XUMM_API_KEY</code> and <code>XUMM_API_SECRET</code> on Replit Autoscale, then Publishes. Pond never asks for a seed.</p>
        ${issuerLinks()}
      </div>`;
  }

  function idleHtml(compact) {
    if (compact) {
      return `<button type="button" class="trade-connect-option" data-xaman-signin role="menuitem">Xaman</button>`;
    }
    return `
      <div class="xaman-card">
        <p class="xaman-kicker">Xaman · official SignIn</p>
        <h2>Connect the wallet you already control</h2>
        <p>$PND has not been issued. Connecting shows your r-address and lets you verify the Pond issuer. It is not a claim, not a trade, and not a seed import.</p>
        <button type="button" class="button" data-xaman-signin>Connect with Xaman</button>
        ${issuerLinks()}
      </div>`;
  }

  function connectedHtml(state, compact) {
    if (compact) {
      return `
      <p class="trade-connect-xaman-status" title="${esc(state.account)}">${esc(shortAddr(state.account))}</p>
      <button type="button" class="trade-connect-option" data-xaman-trustset role="menuitem">Trust line</button>
      <button type="button" class="trade-connect-option" data-xaman-disconnect role="menuitem">Disconnect Xaman</button>`;
    }
    return `
      <div class="xaman-card">
        <p class="xaman-kicker">Connected · SignIn only</p>
        <h2>Your account</h2>
        <p><code class="addr">${esc(state.account)}</code></p>
        <p class="xaman-note">This address came from a Xaman SignIn signature. It was never submitted to the ledger. Pond does not have your seed.</p>
        ${issuerLinks()}
        <div class="xaman-trust">
          <h3>Optional trust line</h3>
          <p>$PND is not issued yet. A TrustSet only opens a line to this issuer so you are ready after launch. It does not send you tokens.</p>
          <button type="button" class="button button-quiet" data-xaman-trustset>Open $PND trust line in Xaman</button>
        </div>
        <p class="xaman-actions"><button type="button" class="xaman-text-button" data-xaman-disconnect>Disconnect this browser</button></p>
      </div>`;
  }

  function waitingHtml(payload, heading, compact) {
    if (compact) {
      return `
      <div class="trade-connect-xaman-wait">
        <p class="xaman-kicker">${esc(heading)}</p>
        ${payload.qr ? `<img class="xaman-qr" src="${esc(payload.qr)}" width="140" height="140" alt="Xaman sign request QR">` : ""}
        <p class="xaman-actions">
          ${payload.next ? `<a href="${esc(payload.next)}" target="_blank" rel="noopener noreferrer">Open in Xaman</a>` : ""}
        </p>
        <p class="xaman-note">Never a seed.</p>
      </div>`;
    }
    return `<div class="xaman-card">${payloadCard(payload, heading)}</div>`;
  }

  function setNav(state, health) {
    document.querySelectorAll("[data-xaman-nav]").forEach((el) => {
      if (state?.account) {
        el.textContent = shortAddr(state.account);
        el.dataset.connected = "1";
        el.title = state.account;
      } else if (health && !health.xaman?.configured) {
        el.textContent = "Xaman";
        el.dataset.connected = "0";
        el.title = "Connect unavailable until Xaman app keys are set";
      } else {
        el.textContent = "Xaman";
        el.dataset.connected = "0";
        el.title = "Connect Xaman";
      }
    });
  }

  async function fetchHealth() {
    const response = await fetch("/health", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("health failed");
    return response.json();
  }

  async function post(path, body = {}) {
    const response = await fetch(path, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || "Xaman request failed");
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }

  async function getPayload(uuid) {
    const response = await fetch(`/api/xaman/payload/${encodeURIComponent(uuid)}`, {
      headers: { Accept: "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || "Payload lookup failed");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function render(root, html) {
    root.innerHTML = html;
  }

  function showError(root, health, message) {
    const compact = isCompact(root);
    render(
      root,
      compact
        ? `<p class="trade-connect-xaman-error" role="alert">${esc(message)}</p>${idleHtml(true)}`
        : `<div class="xaman-card"><p class="xaman-kicker">Xaman</p><p class="xaman-error" role="alert">${esc(message)}</p>${idleHtml(false)}</div>`,
    );
    bind(root, health);
  }

  let pollTimer = 0;

  function stopPoll() {
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = 0;
  }

  function revealCompactMenu(root) {
    const wrap = root.closest("[data-trade-connect]");
    const menu = wrap?.querySelector("[data-connect-menu]");
    const toggle = wrap?.querySelector("[data-connect-toggle]");
    if (!menu || !toggle) return;
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  function pollUntilResolved(root, health, payload, heading) {
    render(root, waitingHtml(payload, heading, isCompact(root)));
    if (isCompact(root)) revealCompactMenu(root);
    bind(root, health);
    stopPoll();
    pollTimer = window.setInterval(async () => {
      try {
        const status = await getPayload(payload.uuid);
        if (status.signed && status.account) {
          stopPoll();
          saveSession({ account: status.account, uuid: payload.uuid });
          paint(root, health);
          return;
        }
        if (status.cancelled || status.expired) {
          stopPoll();
          showError(root, health, status.cancelled ? "Sign request cancelled." : "Sign request expired. Start again.");
        }
      } catch {
        /* keep the QR up; next tick retries */
      }
    }, 2500);
  }

  function bind(root, health) {
    root.querySelector("[data-xaman-signin]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const payload = await post("/api/xaman/signin", { returnTo: returnTo(root) });
        pollUntilResolved(root, health, payload, "Sign in with Xaman");
      } catch (error) {
        if (error.status === 503) {
          render(root, unavailableHtml(error.payload?.message || health.xaman?.reason || "Connect unavailable.", isCompact(root)));
          return;
        }
        showError(root, health, error.message);
      }
    });
    root.querySelector("[data-xaman-trustset]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const payload = await post("/api/xaman/trustset", { returnTo: returnTo(root) });
        pollUntilResolved(root, health, payload, "Confirm the $PND trust line in Xaman — nothing is issued yet");
      } catch (error) {
        showError(root, health, error.message);
      }
    });
    root.querySelector("[data-xaman-disconnect]")?.addEventListener("click", () => {
      stopPoll();
      saveSession(null);
      paint(root, health);
    });
  }

  async function resumePayload(root, health, uuid) {
    render(
      root,
      isCompact(root)
        ? `<p class="trade-connect-xaman-status">Checking Xaman…</p>`
        : `<div class="xaman-card"><p>Checking the Xaman sign request…</p></div>`,
    );
    if (isCompact(root)) revealCompactMenu(root);
    try {
      const status = await getPayload(uuid);
      if (status.signed && status.account) {
        saveSession({ account: status.account, uuid });
        paint(root, health);
        return;
      }
      if (status.cancelled || status.expired) {
        showError(root, health, status.cancelled ? "Sign request cancelled." : "Sign request expired. Start again.");
        return;
      }
      pollUntilResolved(root, health, { uuid, next: `https://xumm.app/sign/${uuid}` }, "Finish signing in Xaman");
    } catch (error) {
      showError(root, health, error.message);
    }
  }

  function paint(root, health) {
    const current = session();
    const compact = isCompact(root);
    setNav(current, health);
    notifyChange();
    if (!health.xaman?.configured) {
      render(root, unavailableHtml(health.xaman?.reason || "Connect unavailable until Xaman app keys are set.", compact));
      return;
    }
    if (current?.account) {
      render(root, connectedHtml(current, compact));
      bind(root, health);
      return;
    }
    const returning = new URLSearchParams(window.location.search).get("payload");
    if (returning) {
      resumePayload(root, health, returning);
      return;
    }
    render(root, idleHtml(compact));
    bind(root, health);
  }

  async function init() {
    stopPoll();
    const roots = mounts();
    let health;
    try {
      health = await fetchHealth();
    } catch {
      health = {
        xaman: {
          configured: false,
          reason: "Connect unavailable until the site process answers /health. Publish on Autoscale with serve.mjs.",
        },
      };
    }
    setNav(session(), health);
    notifyChange();
    roots.forEach((root) => paint(root, health));
  }

  window.PondXaman = { init, session };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
