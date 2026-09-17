(() => {
  const networks = {
    testnet: {
      label: "XRPL Testnet",
      endpoint: "wss://s.altnet.rippletest.net:51233/",
    },
    production: {
      label: "XRPL Production",
      endpoint: "wss://xrplcluster.com/",
    },
  };

  const terminalMarkup = `
    <header class="trade-terminal-head">
      <div class="trade-pair-lockup">
        <span class="trade-token-mark">P</span>
        <div>
          <div class="trade-pair-title"><strong>$PND / XRP</strong><span class="trade-live-dot"></span><em>PND</em></div>
          <div class="trade-pair-sub">Issued currency · XRPL · <span data-network-label>XRPL Testnet</span></div>
        </div>
      </div>
      <div class="trade-network" role="group" aria-label="Trading network">
        <span class="trade-network-label">Network</span>
        <button type="button" class="trade-network-button is-active" data-network="testnet" aria-pressed="true">Testnet</button>
        <button type="button" class="trade-network-button" data-network="production" aria-pressed="false">Production</button>
      </div>
      <div class="trade-terminal-actions">
        <button type="button" class="trade-icon-button" aria-label="Refresh ledger" data-refresh>↻</button>
        <button type="button" class="trade-connect-top" disabled>Connect wallet</button>
      </div>
    </header>

    <div class="trade-stat-strip">
      <div><span>Price</span><strong data-price>—</strong><em>Awaiting pool</em></div>
      <div><span>24h volume</span><strong>—</strong><em>Not configured</em></div>
      <div><span>Liquidity</span><strong>—</strong><em>AMM gated</em></div>
      <div><span>Network</span><strong data-network-label>XRPL Testnet</strong><em data-ledger-status>Checking ledger…</em></div>
      <div><span>Issuer</span><strong data-issuer-short>Verified pending</strong><em>PND identity</em></div>
    </div>

     <nav class="trade-mode-tabs" aria-label="Trading mode" data-tab-group="mode">
      <button type="button" class="is-active" data-tab="amm" aria-selected="true">AMM</button>
      <button type="button" data-tab="dex" aria-selected="false">DEX</button>
      <button type="button" data-tab="overview" aria-selected="false">Overview</button>
       <span class="trade-mode-note"><span class="trade-pulse" data-network-dot></span> <span data-mode-note>AMM route gated</span></span>
    </nav>

    <div class="trade-workspace">
      <section class="trade-market-pane" aria-label="Market view">
        <nav class="trade-subtabs" aria-label="Market detail" data-tab-group="market">
          <button type="button" class="is-active" data-tab="chart" aria-selected="true">Chart</button>
          <button type="button" data-tab="orderbook" aria-selected="false">Order book</button>
          <button type="button" data-tab="liquidity" aria-selected="false">Liquidity</button>
          <button type="button" data-tab="activity" aria-selected="false">Pool activity</button>
        </nav>
        <div class="trade-chart-toolbar">
          <div class="trade-chart-tools"><span>Price</span><span>Volume</span><span>Indicators</span></div>
          <div class="trade-range-tools"><button type="button" class="is-active">1W</button><button type="button">1M</button><button type="button">3M</button><button type="button">All</button></div>
        </div>
        <div class="trade-market-panels" data-tab-panels="market">
          <div class="trade-panel is-active" data-panel="chart">
            <div class="trade-chart-empty">
              <div class="trade-chart-grid"></div>
              <span class="trade-chart-mark">P</span>
              <strong>Chart activates after pool verification</strong>
              <span>Price candles and volume will be read from the selected XRPL market.</span>
            </div>
          </div>
          <div class="trade-panel" data-panel="orderbook" hidden>
            <div class="trade-empty-panel"><strong>Order book unavailable</strong><span>No verified $PND / XRP offers are configured for this network.</span></div>
          </div>
          <div class="trade-panel" data-panel="liquidity" hidden>
            <div class="trade-liquidity-preview"><div><strong>$PND / XRP AMM</strong><span>Pool reserves</span><b>Not configured</b></div><div><strong>$rPND / XRP AMM</strong><span>MPT market</span><b>Not issued</b></div></div>
          </div>
          <div class="trade-panel" data-panel="activity" hidden>
            <div class="trade-empty-panel"><strong>Pool activity will appear here</strong><span>Only verified ledger transactions will be shown.</span></div>
          </div>
        </div>
        <div class="trade-market-footer"><span>Data source: XRPL validated ledger</span><span data-issuer-status>Checking issuer account</span></div>
      </section>

      <aside class="trade-action-pane" aria-label="Trade actions">
        <div class="trade-position">
          <div class="trade-card-head"><div><p class="trade-kicker">My position</p><h3>Wallet balances</h3></div><span class="trade-badge trade-badge-muted">Not connected</span></div>
          <div class="trade-balance-row"><span>◈ <strong>XRP</strong></span><b>—</b></div>
          <div class="trade-balance-row"><span>✦ <strong>$PND</strong></span><b>—</b></div>
          <div class="trade-balance-row"><span>◉ <strong>LP_PND_XRP</strong></span><b>—</b></div>
          <div class="trade-position-total"><span>Share</span><strong>—</strong><span>Estimated value</span><strong>— XRP</strong></div>
        </div>
        <div class="trade-action-card">
          <nav class="trade-action-tabs" aria-label="AMM action" data-tab-group="action">
            <button type="button" class="is-active" data-tab="swap" aria-selected="true">Swap</button>
            <button type="button" data-tab="deposit" aria-selected="false">Deposit</button>
            <button type="button" data-tab="withdraw" aria-selected="false">Withdraw</button>
          </nav>
          <div class="trade-action-panels" data-tab-panels="action">
            <div class="trade-panel is-active" data-panel="swap">
              <div class="trade-action-field"><span>Sell</span><div><strong>0.00</strong><b>XRP⌄</b></div><small>—</small></div>
              <button type="button" class="trade-flip" aria-label="Flip assets">↕</button>
              <div class="trade-action-field"><span>Buy</span><div><strong>0.00</strong><b>$PND⌄</b></div><small>—</small></div>
              <div class="trade-summary-row"><span>Rate</span><strong>—</strong></div>
              <button type="button" class="trade-connect-button" disabled>Connect wallet to review</button>
            </div>
            <div class="trade-panel" data-panel="deposit" hidden><div class="trade-empty-panel"><strong>Deposit liquidity</strong><span>Pool creation and deposits unlock after a verified AMM exists.</span></div></div>
            <div class="trade-panel" data-panel="withdraw" hidden><div class="trade-empty-panel"><strong>Withdraw liquidity</strong><span>Connect a wallet after an LP position can be verified.</span></div></div>
          </div>
        </div>
        <div class="trade-gate-card"><span class="trade-check-icon" data-issuer-icon>!</span><div><strong>Trading is gated</strong><span>Issuer, market, reserves, and transaction route must pass verification.</span></div></div>
      </aside>
    </div>

    <section class="trade-detail-window">
      <nav class="trade-detail-tabs" aria-label="Token details" data-tab-group="detail">
        <button type="button" class="is-active" data-tab="transactions" aria-selected="true">Pool transactions</button>
        <button type="button" data-tab="history" aria-selected="false">Trade history</button>
        <button type="button" data-tab="token" aria-selected="false">Token information</button>
        <button type="button" data-tab="risk" aria-selected="false">Verification</button>
      </nav>
      <div class="trade-detail-panels" data-tab-panels="detail">
        <div class="trade-panel is-active" data-panel="transactions">
          <div class="trade-table-head"><span>Type</span><span>Amount</span><span>Market</span><span>Time</span></div>
          <div class="trade-empty-row">Verified pool transactions will appear here after liquidity is live.</div>
        </div>
        <div class="trade-panel" data-panel="history" hidden><div class="trade-empty-panel"><strong>No trade history yet</strong><span>Wallet activity will be shown only after a verified market is enabled.</span></div></div>
        <div class="trade-panel" data-panel="token" hidden>
          <div class="trade-token-grid">
            <div><span>Asset</span><strong>$PND · issued currency</strong></div>
            <div><span>Currency code</span><strong>PND</strong></div>
            <div><span>Issuer</span><strong class="trade-address" data-issuer-value>Loading issuer…</strong></div>
            <div><span>Launch</span><strong>Target 01 Oct 2026</strong></div>
            <div><span>Policy supply</span><strong>100B $PND</strong></div>
            <div><span>$rPND</span><strong>MPT not issued</strong></div>
          </div>
        </div>
        <div class="trade-panel" data-panel="risk" hidden>
          <div class="trade-verification-grid">
            <div><span>Issuer identity</span><strong>Exact code + address required</strong></div>
            <div><span>Market state</span><strong>Verified pool required</strong></div>
            <div><span>Signing</span><strong>Self-custody only</strong></div>
            <div><span>Network</span><strong data-network-label>XRPL Testnet</strong></div>
          </div>
        </div>
      </div>
    </section>
  `;

  function wsRpc(endpoint, command, params) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(endpoint);
      const timer = window.setTimeout(() => {
        socket.close();
        reject(new Error("XRPL endpoint timed out"));
      }, 9000);
      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ id: 1, command, ...params }));
      });
      socket.addEventListener("message", (event) => {
        try {
          const body = JSON.parse(event.data);
          if (body.status === "error" || body.error) {
            throw new Error(body.error_message || body.error || "XRPL request failed");
          }
          window.clearTimeout(timer);
          socket.close();
          resolve(body);
        } catch (error) {
          window.clearTimeout(timer);
          socket.close();
          reject(error);
        }
      });
      socket.addEventListener("error", () => {
        window.clearTimeout(timer);
        reject(new Error("Could not reach the selected XRPL network"));
      });
    });
  }

  function init() {
    const root = document.getElementById("trade-app");
    if (!root || root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    root.innerHTML = terminalMarkup;
    const issuer = root.dataset.issuer && !root.dataset.issuer.includes("{{")
      ? root.dataset.issuer
      : "";
    const state = { network: "testnet" };
    const $ = (selector) => root.querySelector(selector);
    const $$ = (selector) => root.querySelectorAll(selector);

    function setText(selector, value) {
      $$(selector).forEach((node) => {
        node.textContent = value;
      });
    }

    function setStatus(kind, message) {
      const dot = $("[data-network-dot]");
      if (dot) dot.dataset.state = kind;
      setText("[data-ledger-status]", message);
    }

    function setNetworkButtons() {
      $$("[data-network]").forEach((button) => {
        const active = button.dataset.network === state.network;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      setText("[data-network-label]", networks[state.network].label);
    }

    function setMode(mode) {
      const labels = {
        amm: "AMM route gated",
        dex: "Offers route gated",
        overview: "Verification-first overview",
      };
      $$("[data-tab-group='mode'] [data-tab]").forEach((button) => {
        const active = button.dataset.tab === mode;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      setText("[data-mode-note]", labels[mode] || labels.amm);
      root.dataset.mode = mode;
    }

    function setupTabs() {
      $$("[data-tab-group]").forEach((tabBar) => {
        const group = tabBar.dataset.tabGroup;
        if (group === "mode") {
          tabBar.querySelectorAll("[data-tab]").forEach((button) => {
            button.addEventListener("click", () => setMode(button.dataset.tab));
          });
          return;
        }
        const panels = $(`[data-tab-panels="${group}"]`);
        if (!panels) return;
        tabBar.querySelectorAll("[data-tab]").forEach((button) => {
          button.addEventListener("click", () => {
            const tab = button.dataset.tab;
            tabBar.querySelectorAll("[data-tab]").forEach((tabButton) => {
              const active = tabButton.dataset.tab === tab;
              tabButton.classList.toggle("is-active", active);
              tabButton.setAttribute("aria-selected", String(active));
            });
            panels.querySelectorAll("[data-panel]").forEach((panel) => {
              const active = panel.dataset.panel === tab;
              panel.classList.toggle("is-active", active);
              panel.hidden = !active;
            });
          });
        });
      });
    }

    async function refresh() {
      setStatus("loading", "Reading ledger…");
      setText("[data-issuer-status]", "Checking issuer account");
      setText("[data-issuer-detail]", "Network state is read directly from XRPL.");
      setText("[data-issuer-value]", issuer || "Issuer address not configured");
      setText(
        "[data-issuer-short]",
        issuer ? `${issuer.slice(0, 6)}…${issuer.slice(-4)}` : "Not configured",
      );
      const icon = $("[data-issuer-icon]");
      if (icon) icon.dataset.state = "loading";
      if (!issuer) {
        setStatus("offline", "Issuer unavailable");
        setText("[data-issuer-status]", "Issuer address unavailable");
        setText("[data-issuer-detail]", "The published issuer address is required before ledger checks can run.");
        if (icon) icon.dataset.state = "error";
        return;
      }
      try {
        const server = await wsRpc(networks[state.network].endpoint, "server_info", {});
        const account = await wsRpc(networks[state.network].endpoint, "account_info", {
          account: issuer,
          ledger_index: "validated",
        });
        const ledgerIndex = server.info?.validated_ledger?.seq || "available";
        setStatus("online", `Validated ledger ${ledgerIndex}`);
        setText("[data-issuer-status]", "Issuer account reachable");
        setText(
          "[data-issuer-detail]",
          state.network === "production"
            ? "PND issuance remains gated; no verified market is enabled."
            : "Testnet account state is readable; no test market is configured.",
        );
        if (icon) icon.dataset.state = account.result ? "ready" : "error";
      } catch (error) {
        setStatus("offline", "Ledger unavailable");
        setText("[data-issuer-status]", "Issuer check unavailable");
        setText("[data-issuer-detail]", error.message || "The selected XRPL endpoint did not respond.");
        if (icon) icon.dataset.state = "error";
      }
    }

    root.querySelectorAll("[data-network]").forEach((button) => {
      button.addEventListener("click", () => {
        state.network = button.dataset.network;
        setNetworkButtons();
        refresh();
      });
    });
    $("[data-refresh]")?.addEventListener("click", refresh);
    setupTabs();
    setMode("amm");
    setNetworkButtons();
    refresh();
  }

  window.PondTrade = { init };
  init();
})();