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

    <div class="trade-disclaimer-backdrop" data-disclaimer hidden>
      <section class="trade-disclaimer-dialog" role="dialog" aria-modal="true" aria-labelledby="trade-disclaimer-title">
        <p class="trade-kicker">Before you continue</p>
        <h2 id="trade-disclaimer-title">Pond is verification-first.</h2>
        <p class="trade-disclaimer-copy">This terminal never needs your seed, private key, or recovery phrase. $PND has not been issued and no verified market is live yet.</p>
        <button type="button" class="trade-disclaimer-confirm" data-disclaimer-confirm aria-pressed="false"><span aria-hidden="true">✓</span><span>I understand the safety disclaimer</span></button>
        <div class="trade-disclaimer-actions">
          <a href="/start/" data-disclaimer-new aria-disabled="true">I'm new to Pond Protocol</a>
          <button type="button" data-disclaimer-known disabled>I know Pond Protocol</button>
        </div>
      </section>
    </div>

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
      <button type="button" data-tab="agent" aria-selected="false">Agent</button>
       <span class="trade-mode-note"><span class="trade-pulse" data-network-dot></span> <span data-mode-note>AMM route gated</span></span>
    </nav>

    <div class="trade-workspace trade-mode-view" data-mode-view="amm" aria-label="AMM workspace">
      <section class="trade-market-pane" aria-label="Market view">
        <nav class="trade-subtabs" aria-label="AMM market detail" data-tab-group="amm-market">
          <button type="button" class="is-active" data-tab="chart" aria-selected="true">Chart</button>
          <button type="button" data-tab="pools" aria-selected="false">Pools</button>
          <button type="button" data-tab="activity" aria-selected="false">Activity</button>
        </nav>
        <div class="trade-chart-toolbar">
          <div class="trade-chart-tools"><span>Price</span><span>Volume</span><span>Indicators</span></div>
          <div class="trade-range-tools"><button type="button" class="is-active">1W</button><button type="button">1M</button><button type="button">3M</button><button type="button">All</button></div>
        </div>
        <div class="trade-market-panels" data-tab-panels="amm-market">
          <div class="trade-panel is-active" data-panel="chart">
            <div class="trade-chart-empty">
              <div class="trade-chart-grid"></div>
              <span class="trade-chart-mark">P</span>
              <strong>Chart activates after pool verification</strong>
              <span>Price candles and volume will be read from the selected XRPL market.</span>
            </div>
          </div>
          <div class="trade-panel" data-panel="pools" hidden>
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
          <nav class="trade-action-tabs" aria-label="AMM action" data-tab-group="amm-action">
            <button type="button" class="is-active" data-tab="swap" aria-selected="true">Swap</button>
            <button type="button" data-tab="liquidity" aria-selected="false">Liquidity</button>
          </nav>
          <div class="trade-action-panels" data-tab-panels="amm-action">
            <div class="trade-panel is-active" data-panel="swap">
              <div class="trade-action-field"><span>Sell</span><div><strong>0.00</strong><b>XRP⌄</b></div><small>—</small></div>
              <button type="button" class="trade-flip" aria-label="Flip assets">↕</button>
              <div class="trade-action-field"><span>Buy</span><div><strong>0.00</strong><b>$PND⌄</b></div><small>—</small></div>
              <div class="trade-summary-row"><span>Rate</span><strong>—</strong></div>
              <button type="button" class="trade-connect-button" disabled>Connect wallet to review</button>
            </div>
            <div class="trade-panel" data-panel="liquidity" hidden>
              <div class="trade-inline-tabs" aria-label="Liquidity action" data-tab-group="amm-liquidity">
                <button type="button" class="is-active" data-tab="add" aria-selected="true">Add</button>
                <button type="button" data-tab="remove" aria-selected="false">Remove</button>
              </div>
              <div data-tab-panels="amm-liquidity">
                <div class="trade-panel is-active" data-panel="add"><div class="trade-empty-panel"><strong>Add liquidity</strong><span>Pool creation and deposits unlock after a verified AMM exists.</span></div></div>
                <div class="trade-panel" data-panel="remove" hidden><div class="trade-empty-panel"><strong>Remove liquidity</strong><span>Connect a wallet after an LP position can be verified.</span></div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="trade-gate-card"><span class="trade-check-icon" data-issuer-icon>!</span><div><strong>Trading is gated</strong><span>Issuer, market, reserves, and transaction route must pass verification.</span></div></div>
      </aside>
    </div>

    <section class="trade-mode-view trade-mode-workspace trade-dex-view" data-mode-view="dex" aria-label="DEX workspace" hidden>
      <section class="trade-market-pane">
        <nav class="trade-subtabs" aria-label="DEX market detail" data-tab-group="dex-market">
          <button type="button" class="is-active" data-tab="dex-book" aria-selected="true">Order book</button>
          <button type="button" data-tab="dex-depth" aria-selected="false">Depth</button>
          <button type="button" data-tab="dex-trades" aria-selected="false">Recent trades</button>
          <button type="button" data-tab="dex-offers" aria-selected="false">My offers</button>
        </nav>
        <div class="trade-chart-toolbar">
          <div class="trade-chart-tools trade-market-pairs" data-control-group="dex-pair"><button type="button" class="is-active">PND / XRP</button><button type="button">PND / rPND</button><button type="button">rPND / XRP</button></div>
          <div class="trade-range-tools"><button type="button" class="is-active">Live</button><button type="button">1D</button><button type="button">1W</button></div>
        </div>
        <div class="trade-market-panels" data-tab-panels="dex-market">
          <div class="trade-panel is-active" data-panel="dex-book">
            <div class="trade-order-book">
              <div class="trade-order-book-head"><span>Price (XRP)</span><span>Amount</span><span>Total</span></div>
              <div class="trade-order-book-side"><span>Asks</span><b>Offers unavailable until a verified market exists.</b></div>
              <div class="trade-order-book-spread"><span>Spread</span><strong>—</strong></div>
              <div class="trade-order-book-side is-bids"><span>Bids</span><b>Offers unavailable until a verified market exists.</b></div>
            </div>
          </div>
          <div class="trade-panel" data-panel="dex-depth" hidden><div class="trade-empty-panel"><strong>Depth chart unavailable</strong><span>Verified XRPL offers are required before bid and ask depth can be plotted.</span></div></div>
          <div class="trade-panel" data-panel="dex-trades" hidden><div class="trade-empty-panel"><strong>Recent trades unavailable</strong><span>Validated ledger executions will appear after a market is verified.</span></div></div>
          <div class="trade-panel" data-panel="dex-offers" hidden><div class="trade-empty-panel"><strong>No offers to show</strong><span>Connect a self-custody wallet only after the issuer, market, and signing route pass verification.</span></div></div>
        </div>
        <div class="trade-market-footer"><span>Data source: XRPL offers and validated ledger</span><span>DEX route gated</span></div>
      </section>

      <aside class="trade-action-pane" aria-label="DEX order actions">
        <div class="trade-position">
          <div class="trade-card-head"><div><p class="trade-kicker">My position</p><h3>Wallet balances</h3></div><span class="trade-badge trade-badge-muted">Not connected</span></div>
          <div class="trade-balance-row"><span>◈ <strong>XRP</strong></span><b>—</b></div>
          <div class="trade-balance-row"><span>✦ <strong>$PND</strong></span><b>—</b></div>
          <div class="trade-balance-row"><span>◇ <strong>$rPND</strong></span><b>—</b></div>
        </div>
        <div class="trade-action-card">
          <nav class="trade-action-tabs" aria-label="DEX order type" data-tab-group="dex-order">
            <button type="button" class="is-active" data-tab="buy" aria-selected="true">Buy</button>
            <button type="button" data-tab="sell" aria-selected="false">Sell</button>
          </nav>
          <div class="trade-action-panels" data-tab-panels="dex-order">
            <div class="trade-panel is-active" data-panel="buy">
              <div class="trade-order-choice"><button type="button" class="is-active">Limit</button><button type="button">Market</button></div>
              <div class="trade-order-grid"><div class="trade-action-field"><span>Price</span><div><strong>—</strong><b>XRP</b></div></div><div class="trade-action-field"><span>Amount</span><div><strong>0.00</strong><b>PND</b></div></div></div>
              <div class="trade-action-field"><span>Total</span><div><strong>—</strong><b>XRP</b></div><small>Time in force · GTC</small></div>
              <button type="button" class="trade-connect-button" disabled>Connect wallet to review order</button>
            </div>
            <div class="trade-panel" data-panel="sell" hidden><div class="trade-empty-panel"><strong>Sell order ticket</strong><span>Signing stays disabled until a verified $PND or $rPND market exists.</span></div></div>
          </div>
        </div>
        <div class="trade-gate-card"><span class="trade-check-icon">!</span><div><strong>DEX trading is gated</strong><span>Issuer, offer book, market pair, and wallet signing must pass verification.</span></div></div>
      </aside>
    </section>

    <section class="trade-mode-view trade-mode-workspace trade-overview-view" data-mode-view="overview" aria-label="Market overview" hidden>
      <section class="trade-overview-chart">
        <div class="trade-overview-toolbar">
          <div><p class="trade-kicker">Market overview</p><strong>$PND / XRP · Validated ledger</strong></div>
          <div class="trade-overview-controls" data-control-group="overview-range"><button type="button" class="is-active">1H</button><button type="button">4H</button><button type="button">1D</button><button type="button">1W</button><button type="button">All</button></div>
        </div>
        <div class="trade-overview-tools">
          <div class="trade-chart-tools"><span>Crosshair</span><span class="is-active">Candles</span><span>Line</span><span>Volume</span></div>
          <div class="trade-indicator-tools" data-control-group="overview-indicators"><button type="button" class="is-active">SMA</button><button type="button">EMA</button><button type="button">RSI</button><button type="button">MACD</button><button type="button">Bollinger</button></div>
        </div>
        <div class="trade-overview-plot">
          <div class="trade-chart-grid"></div>
          <span class="trade-chart-mark">P</span>
          <strong>TradingView-style analytics activate after verification</strong>
          <span>Candles, volume, indicators, and crosshair data will come from the selected XRPL market.</span>
        </div>
        <div class="trade-overview-legend"><span><i class="trade-legend-dot"></i>Price</span><span><i class="trade-legend-bar"></i>Volume</span><span>Indicators unavailable</span></div>
      </section>
      <aside class="trade-overview-sidebar">
        <div class="trade-overview-card"><p class="trade-kicker">Market snapshot</p><div class="trade-overview-stat"><span>Last price</span><strong>—</strong></div><div class="trade-overview-stat"><span>24h change</span><strong>—</strong></div><div class="trade-overview-stat"><span>24h volume</span><strong>—</strong></div><div class="trade-overview-stat"><span>Market status</span><strong class="is-gated">Not verified</strong></div></div>
        <div class="trade-overview-card"><p class="trade-kicker">Indicators</p><div class="trade-overview-stat"><span>SMA 20</span><strong>—</strong></div><div class="trade-overview-stat"><span>RSI 14</span><strong>—</strong></div><div class="trade-overview-stat"><span>MACD</span><strong>—</strong></div><span class="trade-overview-note">Choose indicators above to prepare the view. No values are shown until market data is verified.</span></div>
        <div class="trade-overview-card trade-overview-risk"><p class="trade-kicker">Data integrity</p><strong>Verification-first view</strong><span>Issuer, asset identity, market, liquidity, and ledger reads must agree before analytics or trading can activate.</span></div>
      </aside>
    </section>

    <section class="trade-mode-view trade-mode-workspace trade-agent-view" data-mode-view="agent" aria-label="Agent trading workspace" hidden>
      <section class="trade-agent-main">
        <div class="trade-agent-heading">
          <div>
            <p class="trade-kicker">Agent trading</p>
            <h2>Non-custodial execution for software agents.</h2>
            <p>Connect with a classic address, read verified market state, and prepare unsigned XRPL transactions for signing inside your own agent.</p>
          </div>
          <span class="trade-agent-status"><i></i> Staged until market verification</span>
        </div>
        <div class="trade-agent-flow">
          <div><b>01</b><strong>Challenge</strong><span>Request a short-lived address-bound session.</span></div>
          <div><b>02</b><strong>Sign locally</strong><span>Keep the seed or private key in the agent's secret store.</span></div>
          <div><b>03</b><strong>Prepare</strong><span>Receive an unsigned TrustSet or limit offer.</span></div>
          <div><b>04</b><strong>Submit</strong><span>Verify and broadcast the signed transaction.</span></div>
        </div>
        <div class="trade-agent-api">
          <div class="trade-agent-api-head"><div><p class="trade-kicker">Agent API</p><h3>Small surface, predictable flow.</h3></div><span>Bearer session</span></div>
          <div class="trade-agent-endpoints">
            <div><code>POST /api/trade/auth/challenge</code><span>Address-bound challenge</span></div>
            <div><code>POST /api/trade/auth/verify</code><span>Short-lived session</span></div>
            <div><code>GET /api/trade/book?pair=PND_XRP</code><span>Public order book</span></div>
            <div><code>POST /api/trade/prepare/offer</code><span>Unsigned limit offer</span></div>
            <div><code>POST /api/trade/prepare/cancel</code><span>Unsigned cancellation</span></div>
            <div><code>POST /api/trade/submit</code><span>Signed blob submission</span></div>
          </div>
          <div class="trade-agent-command"><code>curl -X POST https://pond.greenhead.io/api/trade/auth/challenge -H 'content-type: application/json' -d '{"address":"r..."}'</code><button type="button" data-copy-value="curl -X POST https://pond.greenhead.io/api/trade/auth/challenge -H 'content-type: application/json' -d '{&quot;address&quot;:&quot;r...&quot;}'">Copy</button></div>
        </div>
      </section>
      <aside class="trade-agent-sidebar">
        <div class="trade-agent-card">
          <p class="trade-kicker">Agent session</p>
          <h3>Connect by address</h3>
          <div class="trade-agent-session"><span>Status</span><strong>Not connected</strong></div>
          <button type="button" class="trade-connect-button" disabled>Connect agent</button>
          <small>No seed, private key, or mnemonic is accepted here.</small>
        </div>
        <div class="trade-agent-card">
          <p class="trade-kicker">Transaction boundary</p>
          <div class="trade-agent-check"><span>✓</span><strong>Unsigned preparation only</strong></div>
          <div class="trade-agent-check"><span>✓</span><strong>Allowlisted transaction types</strong></div>
          <div class="trade-agent-check"><span>✓</span><strong>Issuer and amount checks</strong></div>
          <div class="trade-agent-check"><span>✓</span><strong>Self-custody signing</strong></div>
        </div>
      </aside>
    </section>

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
        agent: "Agent route gated",
      };
      $$("[data-tab-group='mode'] [data-tab]").forEach((button) => {
        const active = button.dataset.tab === mode;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      $$("[data-mode-view]").forEach((view) => {
        const active = view.dataset.modeView === mode;
        view.classList.toggle("is-active", active);
        view.hidden = !active;
        view.setAttribute("aria-hidden", String(!active));
      });
      setText("[data-mode-note]", labels[mode] || labels.amm);
      root.dataset.mode = mode;
    }

    function setupControlGroups() {
      $$("[data-control-group]").forEach((group) => {
        group.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            group.querySelectorAll("button").forEach((item) => {
              item.classList.toggle("is-active", item === button);
            });
          });
        });
      });
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

    function setupDisclaimer() {
      const modal = $("[data-disclaimer]");
      const confirm = $("[data-disclaimer-confirm]");
      const known = $("[data-disclaimer-known]");
      const newcomer = $("[data-disclaimer-new]");
      if (!modal || !confirm || !known || !newcomer) return;

      const open = () => {
        modal.hidden = false;
        document.body.classList.add("trade-disclaimer-open");
        confirm.focus();
      };
      const close = () => {
        modal.hidden = true;
        document.body.classList.remove("trade-disclaimer-open");
      };
      const setConfirmed = (confirmed) => {
        confirm.setAttribute("aria-pressed", String(confirmed));
        confirm.classList.toggle("is-confirmed", confirmed);
        known.disabled = !confirmed;
        newcomer.setAttribute("aria-disabled", String(!confirmed));
      };

      confirm.addEventListener("click", () => {
        setConfirmed(confirm.getAttribute("aria-pressed") !== "true");
      });
      known.addEventListener("click", close);
      newcomer.addEventListener("click", (event) => {
        if (newcomer.getAttribute("aria-disabled") === "true") event.preventDefault();
      });
      modal.addEventListener("click", (event) => {
        if (event.target === modal) open();
      });
      window.addEventListener("pond:wallet-disconnected", open);
      window.PondTrade = { ...(window.PondTrade || {}), showDisclaimer: open };
      open();
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
    setupControlGroups();
    setupDisclaimer();
    setMode(window.location.hash === "#agent" ? "agent" : "amm");
    setNetworkButtons();
    refresh();
  }

  window.PondTrade = { init };
  init();
})();