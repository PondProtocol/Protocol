(() => {
  const WALLETCONNECT_PROJECT_ID = "89408e9bcaa385da1a1867c446cfb7b2";
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
        <button type="button" class="trade-network-button" data-network="testnet" aria-pressed="false">Testnet</button>
        <button type="button" class="trade-network-button is-active" data-network="production" aria-pressed="true">Production</button>
      </div>
      <div class="trade-terminal-actions">
        <button type="button" class="trade-icon-button" aria-label="Refresh ledger" data-refresh>↻</button>
        <span class="trade-wallet-status" data-wallet-status>Wallet not connected</span>
        <div class="trade-connect" data-trade-connect>
          <button type="button" class="trade-connect-top" data-connect-toggle aria-haspopup="menu" aria-expanded="false" aria-controls="trade-connect-menu">Connect wallet</button>
          <div class="trade-connect-menu" id="trade-connect-menu" data-connect-menu hidden role="menu">
            <button type="button" class="trade-connect-option" data-wallet-connect role="menuitem">WalletConnect</button>
            <div data-xaman-app data-xaman-compact data-return="/trade/"></div>
          </div>
        </div>
      </div>
    </header>

    <div class="trade-disclaimer-backdrop" data-disclaimer hidden>
      <section class="trade-disclaimer-dialog" role="dialog" aria-modal="true" aria-labelledby="trade-disclaimer-title">
        <p class="trade-disclaimer-kicker">Before you continue</p>
        <h2 id="trade-disclaimer-title">Pond is verification-first.</h2>
        <p class="trade-disclaimer-copy">This terminal never needs your seed, private key, or recovery phrase. $PND has not been issued and no verified market is live yet.</p>
        <p class="trade-disclaimer-copy">This terminal uses official WalletConnect or Xaman connect only. Pond never stores keys, seeds, or passwords, and never asks for a seed. After you connect, a session cookie remembers the XRPL address you signed in with.</p>
        <a class="trade-disclaimer-legal" href="/legal/">Read the disclaimer</a>
        <button type="button" class="trade-disclaimer-confirm" data-disclaimer-confirm aria-pressed="false"><span aria-hidden="true">✓</span><span>I understand the safety disclaimer</span></button>
        <div class="trade-disclaimer-actions">
          <a href="/start/" class="trade-disclaimer-new" data-disclaimer-new aria-disabled="true">I'm new to Pond Protocol</a>
          <button type="button" class="trade-disclaimer-known" data-disclaimer-known disabled>I Understand Pond Protocol</button>
        </div>
      </section>
    </div>
    <xrpl-wallet-connector id="pond-wallet-connector" background-color="#111315" theme-mode="dark"></xrpl-wallet-connector>

    <div class="trade-stat-strip">
      <div><span>Price</span><strong data-price>—</strong><em>Awaiting pool</em></div>
      <div><span>24h volume</span><strong>—</strong><em>Not configured</em></div>
      <div><span>Liquidity</span><strong>—</strong><em>AMM gated</em></div>
      <div><span>Network</span><strong data-network-label>XRPL Production</strong><em data-ledger-status>Checking ledger…</em></div>
      <div><span>Issuer</span><strong data-issuer-short>Verified pending</strong><em>PND identity</em></div>
    </div>

      <nav class="trade-mode-tabs" aria-label="Trading mode" data-tab-group="mode">
       <button type="button" class="is-active" data-tab="chart" aria-selected="true">Chart</button>
       <button type="button" data-tab="dex" aria-selected="false">DEX</button>
       <button type="button" data-tab="amm" aria-selected="false">AMM</button>
       <button type="button" data-tab="data" aria-selected="false">Data</button>
        <span class="trade-mode-note"><span class="trade-pulse" data-network-dot></span> <span data-mode-note>Chart route gated</span></span>
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
      </aside>
    </div>

    <section class="trade-mode-view trade-mode-workspace trade-dex-view" data-mode-view="dex" aria-label="DEX workspace" hidden>
      <section class="trade-market-pane trade-dex-chart-pane" aria-label="PND market chart">
        <div class="trade-chart-toolbar">
          <div class="trade-chart-tools"><span class="is-active">$PND / XRP</span><span>XRPL DEX</span></div>
          <div class="trade-range-tools"><button type="button" class="is-active">1H</button><button type="button">1D</button><button type="button">1W</button><button type="button">All</button></div>
        </div>
        <div class="trade-market-panels">
          <div class="trade-panel is-active">
            <div class="trade-chart-empty trade-dex-chart-empty">
              <div class="trade-chart-grid"></div>
              <span class="trade-chart-mark">P</span>
              <strong>$PND / XRP chart activates after market verification</strong>
              <span>Validated XRPL DEX prices and volume will appear here after $PND is issued and the market is verified.</span>
            </div>
          </div>
        </div>
        <div class="trade-market-footer"><span>Data source: XRPL validated ledger</span><span>PND market verification required</span></div>
      </section>

      <aside class="trade-action-pane" aria-label="DEX order actions">
        <div class="trade-action-card">
          <nav class="trade-action-tabs" aria-label="DEX order type" data-tab-group="dex-order">
            <button type="button" class="is-active" data-tab="buy" aria-selected="true">Buy</button>
            <button type="button" data-tab="sell" aria-selected="false">Sell</button>
          </nav>
          <div class="trade-action-panels" data-tab-panels="dex-order">
             <div class="trade-panel is-active" data-panel="buy">
               <div class="trade-order-choice" data-order-kind-group><button type="button" class="is-active" data-order-kind="limit">Limit</button><button type="button" data-order-kind="market">Market</button></div>
               <div class="trade-order-grid">
                 <label class="trade-action-field trade-input-field"><span>Price</span><div><input data-dex-price inputmode="decimal" autocomplete="off" placeholder="0.000000" aria-label="Price in XRP per PND"><b>XRP</b></div></label>
                 <label class="trade-action-field trade-input-field"><span>Amount</span><div><input data-dex-amount inputmode="decimal" autocomplete="off" placeholder="0.00" aria-label="PND amount"><b>PND</b></div></label>
               </div>
               <div class="trade-action-field"><span>Total</span><div><strong data-dex-total>—</strong><b>XRP</b></div><small>Price × amount · Time in force · GTC</small></div>
               <p class="trade-order-status" data-dex-order-status role="status">Connect a WalletConnect wallet to review this order.</p>
               <button type="button" class="trade-connect-button" data-wallet-connect data-dex-submit>Connect wallet to review order</button>
            </div>
            <div class="trade-panel" data-panel="sell" hidden><div class="trade-empty-panel"><strong>Sell order ticket</strong><span>Signing stays disabled until a verified $PND or $rPND market exists.</span></div></div>
          </div>
        </div>
      </aside>
    </section>

    <section class="trade-mode-view trade-mode-workspace trade-overview-view" data-mode-view="chart" aria-label="Market chart" hidden>
      <section class="trade-overview-chart">
        <div class="trade-chart-market-controls">
          <div class="trade-chart-pair-tabs" data-control-group="chart-pair" aria-label="Chart pair">
            <button type="button" data-chart-pair="xrp-usd">XRP / USD</button>
            <button type="button" class="is-active" data-chart-pair="pnd-xrp">PND / XRP</button>
            <button type="button" data-chart-pair="pnd-usd">PND / USD</button>
          </div>
          <button type="button" class="trade-chart-overlay" data-chart-overlay aria-pressed="false">Overlay charts</button>
        </div>
        <div class="trade-chart-symbol-bar">
          <div class="trade-chart-symbol"><span class="trade-chart-symbol-mark" data-chart-symbol-mark>P</span><strong data-chart-symbol>PND / XRP</strong><span data-chart-timeframe>1H</span><span class="trade-chart-symbol-source" data-chart-symbol-source>Verification gated</span></div>
          <div class="trade-chart-readout"><strong data-chart-symbol-price>—</strong><span data-chart-symbol-change>—</span></div>
        </div>
        <div class="trade-chart-ohlc" aria-label="Chart price details">
          <span><b>O</b><strong data-chart-ohlc-open>—</strong></span>
          <span><b>H</b><strong data-chart-ohlc-high>—</strong></span>
          <span><b>L</b><strong data-chart-ohlc-low>—</strong></span>
          <span><b>C</b><strong data-chart-ohlc-close>—</strong></span>
          <span class="trade-chart-ohlc-change"><b>24H</b><strong data-chart-ohlc-change>—</strong></span>
        </div>
        <div class="trade-overview-toolbar">
          <div><p class="trade-kicker">Market chart</p><strong data-chart-pair-label>PND / XRP · Verification required</strong></div>
          <div class="trade-overview-controls" data-control-group="overview-range"><button type="button" class="is-active" data-chart-range="1h">1H</button><button type="button" data-chart-range="4h">4H</button><button type="button" data-chart-range="1d">1D</button><button type="button" data-chart-range="1w">1W</button><button type="button" data-chart-range="all">All</button></div>
        </div>
        <div class="trade-overview-tools">
          <div class="trade-chart-tools"><span>Crosshair</span><span class="is-active">Candles</span><span>Line</span><span>Volume</span></div>
          <div class="trade-indicator-tools" data-control-group="overview-indicators"><button type="button" data-chart-indicator="sma">SMA</button><button type="button" data-chart-indicator="ema">EMA</button><button type="button" data-chart-indicator="rsi">RSI</button><button type="button" data-chart-indicator="macd">MACD</button><button type="button" class="is-active" data-chart-indicator="bollinger">Bollinger Bands</button></div>
        </div>
        <div class="trade-overview-plot">
          <div class="trade-chart-live" data-chart-live hidden>
            <svg class="trade-chart-svg" data-chart-svg viewBox="0 0 1000 480" role="img" aria-label="Live XRP price chart"></svg>
            <span class="trade-chart-source" data-chart-source>Source: CoinGecko public market data</span>
          </div>
          <div class="trade-chart-empty-state" data-chart-empty-state>
            <div class="trade-chart-grid"></div>
            <span class="trade-chart-mark">P</span>
            <strong data-chart-empty-title>PND / XRP chart activates after verification</strong>
            <span data-chart-empty-copy>Verified $PND market data will appear after the issuer and market are confirmed.</span>
          </div>
        </div>
        <div class="trade-overview-legend"><span><i class="trade-legend-dot"></i><span data-chart-legend-primary>PND / XRP</span></span><span><i class="trade-legend-bar"></i>Volume</span><span data-chart-legend-indicator>Bollinger Bands</span><span data-chart-legend-overlay>Overlay off</span><span data-chart-source-label>Verification gated</span></div>
      </section>
      <aside class="trade-overview-sidebar">
          <div class="trade-overview-card"><p class="trade-kicker">Market snapshot</p><div class="trade-overview-stat"><span>Last price</span><strong data-chart-stat-price>—</strong></div><div class="trade-overview-stat"><span>24h change</span><strong data-chart-stat-change>—</strong></div><div class="trade-overview-stat"><span>24h volume</span><strong data-chart-stat-volume>—</strong></div><div class="trade-overview-stat"><span>Market cap</span><strong data-chart-stat-market-cap>—</strong></div><div class="trade-overview-stat"><span>Market status</span><strong class="is-gated" data-chart-stat-status>Not verified</strong></div></div>
          <div class="trade-overview-card"><p class="trade-kicker">Indicators</p><div class="trade-overview-stat"><span>SMA 20</span><strong data-chart-stat-sma>—</strong></div><div class="trade-overview-stat"><span>RSI 14</span><strong data-chart-stat-rsi>—</strong></div><div class="trade-overview-stat"><span>MACD</span><strong data-chart-stat-macd>—</strong></div><span class="trade-overview-note" data-chart-indicator-note>Indicators will appear after verified $PND market data is available.</span></div>
        <div class="trade-overview-card trade-overview-risk"><p class="trade-kicker">Data integrity</p><strong>Verification-first view</strong><span>Issuer, asset identity, market, liquidity, and ledger reads must agree before analytics or trading can activate.</span></div>
      </aside>
    </section>

    <section class="trade-mode-view trade-data-view" data-mode-view="data" aria-label="Market data" hidden>
      <header class="trade-data-header">
        <div>
          <p class="trade-kicker">Data explorer</p>
          <h2>Everything about the selected asset.</h2>
          <p>Market, supply, holder, and ledger statistics will be read from verified XRPL data. No pre-launch values are estimated.</p>
        </div>
        <div class="trade-data-assets" data-control-group="data-asset" aria-label="Asset">
          <button type="button" class="is-active">PND</button>
          <button type="button">rPND</button>
        </div>
      </header>
      <div class="trade-data-periods" data-control-group="data-period" aria-label="Time period">
        <span>Range</span>
        <button type="button" class="is-active">1 minute</button>
        <button type="button">1 hour</button>
        <button type="button">4 hour</button>
        <button type="button">Daily</button>
        <button type="button">Weekly</button>
        <button type="button">Monthly</button>
        <button type="button">Yearly</button>
        <button type="button">All time</button>
      </div>
      <div class="trade-data-stats">
        <div class="trade-data-stat"><span>Market cap</span><strong>—</strong><em>Awaiting verified price</em></div>
        <div class="trade-data-stat"><span>Price</span><strong>—</strong><em>Pool not verified</em></div>
        <div class="trade-data-stat"><span>Volume</span><strong>—</strong><em>No market history</em></div>
        <div class="trade-data-stat"><span>Liquidity</span><strong>—</strong><em>AMM not configured</em></div>
        <div class="trade-data-stat"><span>Holders</span><strong>—</strong><em>Ledger read gated</em></div>
        <div class="trade-data-stat"><span>Transactions</span><strong>—</strong><em>Validated history required</em></div>
        <div class="trade-data-stat"><span>Trust lines</span><strong>—</strong><em>Ledger read gated</em></div>
        <div class="trade-data-stat"><span>Supply</span><strong>—</strong><em>Issued supply not live</em></div>
      </div>
      <div class="trade-data-columns">
        <section class="trade-data-card">
          <div class="trade-data-card-head"><div><p class="trade-kicker">Asset facts</p><h3>Identity and supply</h3></div><span>Verified ledger only</span></div>
          <dl class="trade-data-list">
            <div><dt>Currency</dt><dd>PND / rPND</dd></div>
            <div><dt>Issuer / asset id</dt><dd>Verification required</dd></div>
            <div><dt>Network</dt><dd data-network-label>XRPL Testnet</dd></div>
            <div><dt>Total supply</dt><dd>Not issued</dd></div>
            <div><dt>Circulating supply</dt><dd>Not issued</dd></div>
            <div><dt>Owner reserve impact</dt><dd>Calculated after launch</dd></div>
          </dl>
        </section>
        <section class="trade-data-card">
          <div class="trade-data-card-head"><div><p class="trade-kicker">Activity</p><h3>Participation and flow</h3></div><span>Awaiting data</span></div>
          <dl class="trade-data-list">
            <div><dt>Holder count</dt><dd>—</dd></div>
            <div><dt>Trust line count</dt><dd>—</dd></div>
            <div><dt>Transaction count</dt><dd>—</dd></div>
            <div><dt>AMM pools</dt><dd>Not configured</dd></div>
            <div><dt>DEX offers</dt><dd>Not verified</dd></div>
            <div><dt>Last validated ledger</dt><dd>—</dd></div>
          </dl>
        </section>
      </div>
      <div class="trade-data-integrity"><span class="trade-check-icon" data-state="error">!</span><div><strong>Data is gated until the asset and market are verified.</strong><span>When live, this view will combine XRPL ledger state, verified AMM data, DEX offers, holder counts, and time-based market statistics.</span></div></div>
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

  function wsRpc(endpoint, command, params = {}, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException("The request was cancelled", "AbortError"));
        return;
      }
      let settled = false;
      const socket = new WebSocket(endpoint);
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        try {
          socket.close();
        } catch {
          /* The browser may already have closed the socket. */
        }
        callback(value);
      };
      const abort = () => finish(reject, new DOMException("The request was cancelled", "AbortError"));
      const timer = window.setTimeout(() => {
        finish(reject, new Error("XRPL endpoint timed out"));
      }, 9000);
      signal?.addEventListener("abort", abort, { once: true });
      socket.addEventListener("open", () => {
        if (!settled) socket.send(JSON.stringify({ id: 1, command, ...params }));
      });
      socket.addEventListener("message", (event) => {
        try {
          const body = JSON.parse(event.data);
          if (body.status === "error" || body.error) {
            throw new Error(body.error_message || body.error || "XRPL request failed");
          }
          finish(resolve, body);
        } catch (error) {
          finish(reject, error);
        }
      });
      socket.addEventListener("error", () => {
        finish(reject, new Error("Could not reach the selected XRPL network"));
      });
      socket.addEventListener("close", () => {
        if (!settled) finish(reject, new Error("The selected XRPL network closed the connection"));
      });
    });
  }

  const DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
  const MAX_XRP_DROPS = 100000000000000000n;

  function parseDecimal(value, label = "Amount") {
    const text = String(value ?? "").trim();
    if (!DECIMAL_PATTERN.test(text)) throw new Error(`${label} must be a positive decimal number.`);
    const [whole, fraction = ""] = text.split(".");
    const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, "") || "0";
    return {
      digits,
      scale: fraction.length,
      value: BigInt(digits),
      text,
    };
  }

  function decimalMultiply(left, right, scale = 6) {
    const a = parseDecimal(left, "Price");
    const b = parseDecimal(right, "Amount");
    const numerator = a.value * b.value;
    const denominator = 10n ** BigInt(a.scale + b.scale);
    const factor = 10n ** BigInt(scale);
    const rounded = (numerator * factor + denominator / 2n) / denominator;
    return rounded;
  }

  function decimalCompare(left, right) {
    const a = parseDecimal(left, "Amount");
    const b = parseDecimal(right, "Amount");
    const scale = Math.max(a.scale, b.scale);
    const aValue = a.value * 10n ** BigInt(scale - a.scale);
    const bValue = b.value * 10n ** BigInt(scale - b.scale);
    return aValue === bValue ? 0 : aValue > bValue ? 1 : -1;
  }

  function decimalSubtract(left, right) {
    const a = parseDecimal(left, "Amount");
    const b = parseDecimal(right, "Amount");
    const scale = Math.max(a.scale, b.scale);
    const aValue = a.value * 10n ** BigInt(scale - a.scale);
    const bValue = b.value * 10n ** BigInt(scale - b.scale);
    if (aValue < bValue) return "0";
    const digits = (aValue - bValue).toString().padStart(scale + 1, "0");
    if (!scale) return digits;
    return `${digits.slice(0, -scale)}.${digits.slice(-scale)}`.replace(/\.?0+$/, "");
  }

  function decimalToDrops(value) {
    const parsed = parseDecimal(value, "XRP total");
    if (parsed.scale > 6) {
      const rounded = decimalMultiply(value, "1", 6);
      if (rounded <= 0n || rounded > MAX_XRP_DROPS) throw new Error("The XRP total is outside the safe transaction range.");
      return rounded.toString();
    }
    const drops = parsed.value * 10n ** BigInt(6 - parsed.scale);
    if (drops <= 0n || drops > MAX_XRP_DROPS) throw new Error("The XRP total is outside the safe transaction range.");
    return drops.toString();
  }

  function formatDrops(drops) {
    const value = BigInt(String(drops));
    const whole = value / 1000000n;
    const fraction = (value % 1000000n).toString().padStart(6, "0").replace(/0+$/, "");
    return fraction ? `${whole}.${fraction}` : whole.toString();
  }

  function isAbortError(error) {
    return error?.name === "AbortError";
  }

  function init() {
    const root = document.getElementById("trade-app");
    if (!root || root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    root.innerHTML = terminalMarkup;
    const issuer = root.dataset.issuer && !root.dataset.issuer.includes("{{")
      ? root.dataset.issuer
      : "";
    const state = {
      network: "production",
      wallet: null,
      walletNetwork: null,
      requestGeneration: 0,
      verification: {
        issuer: false,
        issued: false,
        orderBook: false,
        amm: false,
        market: false,
        ledger: null,
        server: null,
        account: null,
        pndLines: [],
        offers: [],
        ammInfo: null,
      },
    };
    let refreshController = null;
    let walletGeneration = 0;
    let chartController = null;
    let walletController = null;
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

    function isCurrent(generation) {
      return generation === state.requestGeneration;
    }

    function setVerificationMessage(message, kind = "neutral") {
      setText("[data-issuer-status]", message);
      const status = $("[data-issuer-status]");
      if (status) status.dataset.state = kind;
    }

    function setMarketState(verification) {
      const verified = Boolean(verification.market);
      root.dataset.marketVerified = String(verified);
      root.dataset.issuerVerified = String(Boolean(verification.issuer));
      root.dataset.marketState = verified ? "verified" : "gated";
      setText("[data-issuer-short]", verification.issuer ? `${issuer.slice(0, 6)}…${issuer.slice(-4)}` : "Not verified");
      setText("[data-issuer-status]", verified ? "Market verified" : verification.issued ? "Issuer verified · market pending" : "PND not issued");
      setText("[data-issuer-detail]", verified
        ? "Validated XRPL market data passed issuer, order-book, and liquidity checks."
        : "Signing and analytics remain disabled until a validated $PND market is found.");
      setText("[data-mode-note]", verified ? "Verified market live" : "Verification gated");
      setText("[data-chart-source-label]", verified ? "XRPL validated ledger" : "Verification gated");
      setText("[data-chart-symbol-source]", verified ? "XRPL validated ledger" : "Verification gated");
      setText("[data-issuer-value]", issuer || "Issuer address not configured");
      setText("[data-price]", verified ? getMarketPrice(verification) : "—");
      setText("[data-chart-stat-status]", verified ? "Verified XRPL market" : "Not verified");
      const status = $("[data-chart-stat-status]");
      if (status) {
        status.classList.toggle("is-gated", !verified);
        status.classList.toggle("is-live", verified);
      }
      updateMarketPanels();
    }

    function getMarketPrice(verification = state.verification) {
      const offer = verification.offers?.[0];
      if (!offer) return "—";
      const gets = typeof offer.TakerGets === "string" ? BigInt(offer.TakerGets) : null;
      const pays = offer.TakerPays && typeof offer.TakerPays.value === "string"
        ? Number(offer.TakerPays.value)
        : null;
      if (gets == null || !Number.isFinite(pays) || pays <= 0) return "—";
      return `${(Number(gets) / 1000000 / pays).toFixed(8)} XRP`;
    }

    function updateMarketPanels() {
      const { ammInfo, offers, market, pndLines = [] } = state.verification;
      const pool = root.querySelector(".trade-liquidity-preview");
      if (pool && ammInfo) {
        const reserves = ammInfo.amm ?? ammInfo;
        pool.innerHTML = `<div><strong>$PND / XRP AMM</strong><span>Validated reserves</span><b>${formatAssetAmount(reserves.amount)} XRP · ${formatAssetAmount(reserves.amount2)} PND</b></div><div><strong>Market</strong><span>Validated ledger</span><b>${market ? "Verified" : "Pending"}</b></div>`;
      }
      const emptyRows = root.querySelectorAll(".trade-empty-row");
      emptyRows.forEach((row) => {
        if (market && offers.length) {
          row.textContent = `${offers.length} validated XRPL offer${offers.length === 1 ? "" : "s"} found for the selected market.`;
        }
      });
      setText("[data-issuer-detail]", market
        ? "Validated order-book or AMM liquidity is available for the selected network."
        : state.verification.issued
          ? "The issuer is reachable, but no validated PND/XRP market is available."
          : "The issuer account is reachable, but PND has not been issued on this network.");
      const stats = root.querySelectorAll(".trade-data-stat");
      const reserves = ammInfo?.amm ?? ammInfo;
      const price = getMarketPrice(state.verification);
      const values = [
        [market ? "—" : "—", market ? "Validated supply and price required" : "Awaiting verified price"],
        [price, market ? "Validated XRPL market" : "Pool not verified"],
        [offers.length ? `${offers.length}` : "—", offers.length ? "Validated book offers" : "No validated market history"],
        [reserves ? `${formatAssetAmount(reserves.amount)} XRP` : "—", reserves ? "Validated AMM reserves" : "AMM not configured"],
        [pndLines.filter((line) => Number(line.balance || 0) !== 0).length || "—", pndLines.length ? "Issuer trust lines" : "Ledger read gated"],
        [offers.length ? `${offers.length}` : "—", offers.length ? "Validated offers read" : "Validated history required"],
        [pndLines.length || "—", pndLines.length ? "Validated PND trust lines" : "Ledger read gated"],
        [state.verification.issued ? "Issued" : "Not issued", state.verification.issued ? "Issuer lines found" : "Issued supply not live"],
      ];
      stats.forEach((stat, index) => {
        const [value, note] = values[index] || ["—", "Verification required"];
        const strong = stat.querySelector("strong");
        const em = stat.querySelector("em");
        if (strong) strong.textContent = value;
        if (em) em.textContent = note;
      });
    }

    function formatAssetAmount(value) {
      if (value == null) return "—";
      if (typeof value === "string") return formatDrops(value);
      if (typeof value.value === "string") return value.value;
      return "—";
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
        chart: "Chart route gated",
        data: "Data route gated",
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
      if (mode === "chart") chartController?.load();
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

    function setupDataControls() {
      const assetButtons = $$("[data-control-group='data-asset'] button");
      const periodButtons = $$("[data-control-group='data-period'] button");
      const dataView = $("[data-mode-view='data']");
      const setDataSelection = (asset, period) => {
        root.dataset.dataAsset = asset;
        root.dataset.dataPeriod = period;
        const suffix = state.verification.market
          ? `Validated ${asset} ledger snapshot · ${period}`
          : `${asset} data remains gated · ${period}`;
        const integrity = dataView?.querySelector(".trade-data-integrity strong");
        const detail = dataView?.querySelector(".trade-data-integrity span:not(.trade-check-icon)");
        if (integrity) integrity.textContent = state.verification.market
          ? "Data is sourced from the validated XRPL ledger."
          : "Data is gated until the asset and market are verified.";
        if (detail) detail.textContent = suffix;
      };
      assetButtons.forEach((button, index) => {
        button.addEventListener("click", () => {
          const asset = index === 0 ? "PND" : "rPND";
          setDataSelection(asset, root.dataset.dataPeriod || "1 minute");
        });
      });
      periodButtons.forEach((button) => {
        button.addEventListener("click", () => {
          setDataSelection(root.dataset.dataAsset || "PND", button.textContent.trim());
        });
      });
      setDataSelection("PND", "1 minute");
    }

    function setOrderStatus(message, kind = "neutral") {
      const status = $("[data-dex-order-status]");
      if (!status) return;
      status.dataset.state = kind;
      status.textContent = message;
    }

    function shortAccount(addr) {
      return addr && addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr || "";
    }

    function xamanAccount() {
      try {
        return JSON.parse(sessionStorage.getItem("pond-xaman-session") || "null")?.account || "";
      } catch {
        return "";
      }
    }

    function setConnectMenuOpen(open) {
      const toggle = $("[data-connect-toggle]");
      const menu = $("[data-connect-menu]");
      if (!toggle || !menu) return;
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    }

    function setupConnectMenu() {
      const wrap = $("[data-trade-connect]");
      const toggle = $("[data-connect-toggle]");
      const menu = $("[data-connect-menu]");
      if (!wrap || !toggle || !menu) return;
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        setConnectMenuOpen(menu.hidden);
      });
      menu.addEventListener("click", (event) => {
        if (event.target.closest("[data-wallet-connect]")) setConnectMenuOpen(false);
      });
      document.addEventListener("click", (event) => {
        if (!document.body.contains(wrap)) return;
        if (!wrap.contains(event.target)) setConnectMenuOpen(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setConnectMenuOpen(false);
      });
    }

    function syncConnectLabel() {
      const account = state.wallet?.address || xamanAccount();
      const connected = Boolean(account);
      const toggle = $("[data-connect-toggle]");
      if (toggle) {
        toggle.textContent = connected ? shortAccount(account) : "Connect wallet";
        toggle.classList.toggle("is-connected", connected);
      }
      setText("[data-wallet-status]", connected ? shortAccount(account) : "Wallet not connected");
    }

    function setWalletUi(account) {
      state.wallet = account || null;
      const connected = Boolean(account?.address);
      if (connected) {
        window.PondSession?.login?.({ method: "walletconnect", address: account.address });
      }
      syncConnectLabel();
      $$("[data-wallet-connect][data-dex-submit]").forEach((button) => {
        button.textContent = connected ? "Review buy order" : "Connect wallet to review order";
        button.classList.toggle("is-connected", connected);
      });
      if (connected) {
        setOrderStatus("Wallet connected. Enter a price and amount to review the order.", "ready");
      } else {
        setOrderStatus("Connect a WalletConnect wallet to review this order.");
      }
    }

    function setupWallet() {
      const connectButtons = $$("[data-wallet-connect]");
      const connector = $("#pond-wallet-connector");
      const api = window.XRPLConnect;
      if (!connectButtons.length) return null;
      if (!connector || !api?.WalletManager || !api?.WalletConnectAdapter) {
        setText("[data-wallet-status]", "WalletConnect unavailable");
        setOrderStatus("WalletConnect could not load. Refresh and try again.", "error");
        connectButtons.forEach((button) => {
          button.disabled = true;
        });
        return null;
      }

      let manager = null;
      let managerNetwork = null;
      let generation = 0;

      const createManager = () => {
        const adapter = new api.WalletConnectAdapter({
          projectId: WALLETCONNECT_PROJECT_ID,
          metadata: {
            name: "Pond Protocol",
            description: "Non-custodial XRPL market access for Pond Protocol.",
            url: window.location.origin,
            icons: [],
          },
          themeMode: "dark",
        });
        const network = state.network === "production" ? "mainnet" : "testnet";
        const nextManager = new api.WalletManager({
          adapters: [adapter],
          network,
          autoConnect: false,
        });
        manager = nextManager;
        managerNetwork = network;
        const currentGeneration = ++generation;
        nextManager.on("connect", (account) => {
          if (currentGeneration !== generation) return;
          const connectedNetwork = account?.network || account?.chain || network;
          if (connectedNetwork !== network) {
            setWalletUi(null);
            setOrderStatus(`Wallet is connected to ${connectedNetwork}, not ${network}. Reconnect on the selected network.`, "error");
            return;
          }
          state.walletNetwork = network;
          setWalletUi(account);
        });
        nextManager.on("accountChanged", (account) => {
          if (currentGeneration === generation) setWalletUi(account);
        });
        nextManager.on("disconnect", () => {
          if (currentGeneration !== generation) return;
          setWalletUi(null);
          state.walletNetwork = null;
          window.PondSession?.logoutIf?.({ method: "walletconnect" });
          window.dispatchEvent(new CustomEvent("pond:wallet-disconnected"));
        });
        nextManager.on("error", (error) => {
          if (currentGeneration === generation) setOrderStatus(error?.message || "The wallet reported an error.", "error");
        });
        connector.setWalletManager(nextManager);
        return nextManager;
      };

      const ensureNetwork = async () => {
        const expected = state.network === "production" ? "mainnet" : "testnet";
        if (manager && managerNetwork === expected) return manager;
        const previous = manager;
        manager = null;
        managerNetwork = null;
        generation += 1;
        setWalletUi(null);
        if (previous?.disconnect) {
          try {
            await previous.disconnect();
          } catch {
            /* A disconnected adapter is safe to replace. */
          }
        }
        return createManager();
      };

      const connect = async () => {
        setConnectMenuOpen(false);
        connectButtons.forEach((button) => { button.disabled = true; });
        setText("[data-wallet-status]", "Connecting…");
        setOrderStatus("Approve the XRPL account connection in your wallet.", "loading");
        try {
          await ensureNetwork();
          await connector.open();
        } catch (error) {
          setWalletUi(null);
          setOrderStatus(error.message || "Wallet connection was cancelled.", "error");
        } finally {
          connectButtons.forEach((button) => { button.disabled = false; });
        }
      };

      connectButtons.forEach((button) => button.addEventListener("click", connect));
      createManager();
      return {
        get manager() { return manager; },
        connect,
        switchNetwork: ensureNetwork,
        disconnect: async () => {
          generation += 1;
          if (manager?.disconnect) await manager.disconnect();
          setWalletUi(null);
          state.walletNetwork = null;
          window.PondSession?.logoutIf?.({ method: "walletconnect" });
        },
      };
    }

    function setupDexOrder() {
      const price = $("[data-dex-price]");
      const amount = $("[data-dex-amount]");
      const total = $("[data-dex-total]");
      const submit = $("[data-dex-submit]");
      const orderKindButtons = $$("[data-order-kind]");
      if (!price || !amount || !total || !submit) return;

      let orderKind = "limit";
      const updateTotal = () => {
        if (orderKind === "market") {
          price.disabled = true;
          price.value = "";
          setText("[data-dex-total]", "Best available");
        } else {
          price.disabled = false;
          try {
            const drops = decimalMultiply(price.value, amount.value, 6);
            setText("[data-dex-total]", drops > 0n ? `${formatDrops(drops)} XRP` : "—");
          } catch {
            setText("[data-dex-total]", "—");
          }
        }
      };
      price.addEventListener("input", updateTotal);
      amount.addEventListener("input", updateTotal);
      orderKindButtons.forEach((button) => {
        button.addEventListener("click", () => {
          orderKind = button.dataset.orderKind || "limit";
          orderKindButtons.forEach((item) => item.classList.toggle("is-active", item === button));
          updateTotal();
          setOrderStatus(
            orderKind === "market"
              ? "Market orders use the verified best ask and remain unavailable until the order book is live."
              : state.wallet
                ? "Wallet connected. Enter a price and amount to review the order."
                : "Connect a WalletConnect wallet to review this order.",
          );
        });
      });

      submit.addEventListener("click", async () => {
        if (!state.wallet) {
          walletController?.connect();
          return;
        }
        if (orderKind === "market") {
          setOrderStatus("Market orders stay disabled until a verified XRPL order book is available.", "gated");
          return;
        }
        let amountValue;
        let totalDrops;
        try {
          const parsedAmount = parseDecimal(amount.value, "PND amount");
          if (parsedAmount.value <= 0n) throw new Error("PND amount must be greater than zero.");
          totalDrops = decimalToDrops(formatDrops(decimalMultiply(price.value, amount.value, 6)));
          amountValue = parsedAmount.text;
        } catch (error) {
          setOrderStatus(error.message || "Enter valid price and amount values.", "error");
          return;
        }
        if (!issuer || state.network !== "production" || !state.verification.market) {
          setOrderStatus("PND/XRP is still pre-launch or unverified. No order was signed or submitted.", "gated");
          return;
        }
        if (!state.walletNetwork || state.walletNetwork !== "mainnet") {
          setOrderStatus("Reconnect the wallet to XRPL Production before reviewing an order.", "gated");
          return;
        }
        setOrderStatus("Checking your account, reserve, fee, and PND trust line before wallet review.", "loading");
        try {
          const controller = new AbortController();
          const preflight = await readOrderPreflight(totalDrops, amountValue, controller.signal);
          if (decimalCompare(amountValue, preflight.trustLineCapacity) > 0) {
            throw new Error("Your PND trust line does not have enough remaining capacity for this order.");
          }
          if (BigInt(preflight.balanceDrops) <= BigInt(totalDrops) + BigInt(preflight.feeDrops)) {
            throw new Error("Your XRP balance does not cover the order total and transaction fee.");
          }
          const transaction = {
            TransactionType: "OfferCreate",
            Account: state.wallet.address,
            TakerGets: totalDrops,
            TakerPays: {
              currency: "PND",
              issuer,
              value: amountValue,
            },
            Flags: 0,
            Sequence: preflight.sequence,
            Fee: preflight.feeDrops,
            LastLedgerSequence: preflight.lastLedgerSequence,
            Expiration: Math.floor(Date.now() / 1000) + 900,
          };
          setOrderStatus("Review the OfferCreate transaction in your wallet.", "loading");
          const result = await walletController.manager.signAndSubmit(transaction);
          setOrderStatus(`Buy submitted to XRPL · ${result.hash}`, "success");
        } catch (error) {
          if (isAbortError(error)) return;
          setOrderStatus(error.message || "The wallet rejected or could not submit the order.", "error");
        }
      });
      updateTotal();
    }

    async function readOrderPreflight(totalDrops, pndAmount, signal) {
      const endpoint = networks[state.network].endpoint;
      const [server, account, lines] = await Promise.all([
        wsRpc(endpoint, "server_info", {}, signal),
        wsRpc(endpoint, "account_info", {
          account: state.wallet.address,
          ledger_index: "validated",
        }, signal),
        wsRpc(endpoint, "account_lines", {
            account: state.wallet.address,
            peer: issuer,
            ledger_index: "validated",
        }, signal),
      ]);
      const info = server.result?.info || server.info;
      const accountInfo = account.result?.account_data;
      const trustLine = lines.result?.lines?.find((line) => line.account === issuer || line.peer === issuer);
      if (!accountInfo) throw new Error("Your wallet account is not available on the validated ledger.");
      if (!trustLine || Number(trustLine.limit || trustLine.limit_peer || 0) <= 0) {
        throw new Error("Add a PND trust line before placing a buy order.");
      }
      const feeDrops = String(info?.validated_ledger?.base_fee_xrp
        ? decimalToDrops(String(info.validated_ledger.base_fee_xrp))
        : info?.validated_ledger?.base_fee_drops || info?.fee_base || "12");
      const reserveBase = Number(info?.validated_ledger?.reserve_base_xrp ?? 1);
      const reserveIncrement = Number(info?.validated_ledger?.reserve_inc_xrp ?? 0.2);
      const ownerCount = Number(accountInfo.OwnerCount || 0);
      const reserveDrops = decimalToDrops(String(reserveBase + reserveIncrement * (ownerCount + 1)));
      const balanceDrops = String(accountInfo.Balance || "0");
      const limit = String(trustLine.limit || trustLine.limit_peer || "0");
      const balance = String(trustLine.balance || "0");
      const trustLineCapacity = decimalSubtract(limit, balance);
      if (decimalCompare(pndAmount, "0") <= 0) throw new Error("PND amount must be greater than zero.");
      if (BigInt(balanceDrops) <= BigInt(reserveDrops) + BigInt(totalDrops) + BigInt(feeDrops)) {
        throw new Error("This order would leave the account below its XRPL reserve.");
      }
      return {
        sequence: accountInfo.Sequence,
        feeDrops,
        balanceDrops,
        reserveDrops,
        trustLineCapacity,
        lastLedgerSequence: Number(info?.validated_ledger?.seq || 0) + 4,
      };
    }

    function setupChartControls() {
      const pairLabels = {
        "xrp-usd": "XRP / USD",
        "pnd-xrp": "PND / XRP",
        "pnd-usd": "PND / USD",
      };
      const rangeDays = { "1h": 1, "4h": 2, "1d": 7, "1w": 7, all: 365 };
      const rangePoints = { "1h": 48, "4h": 96, "1d": 168, "1w": 336, all: 365 };
      const rangeLabels = { "1h": "1H", "4h": "4H", "1d": "1D", "1w": "1W", all: "All" };
       const chartState = { pair: "pnd-xrp", range: "1h", indicator: "bollinger", data: null };
      let chartLoadController = null;
      let chartLoadGeneration = 0;
      const pairButtons = $$("[data-chart-pair]");
      const rangeButtons = $$("[data-chart-range]");
      const indicatorButtons = $$("[data-chart-indicator]");
      const overlay = $("[data-chart-overlay]");
       const symbolMark = $("[data-chart-symbol-mark]");
       const symbolSource = $("[data-chart-symbol-source]");
      const liveChart = $("[data-chart-live]");
      const emptyChart = $("[data-chart-empty-state]");
      const svg = $("[data-chart-svg]");
      if (!pairButtons.length || !overlay || !liveChart || !emptyChart || !svg) return null;

      const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
      const compactFormat = new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
      });
      const formatUsd = (value) => {
        if (!Number.isFinite(value)) return "—";
        return `$${numberFormat.format(value)}`;
      };
      const formatVolume = (value) => (Number.isFinite(value) ? `$${compactFormat.format(value)}` : "—");
      const formatPercent = (value) => {
        if (!Number.isFinite(value)) return "—";
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
      };
      const setChartEmpty = (title, copy) => {
        setText("[data-chart-empty-title]", title);
        setText("[data-chart-empty-copy]", copy);
        liveChart.hidden = true;
        emptyChart.hidden = false;
      };
      const setLiveStatus = (live) => {
        const status = $("[data-chart-stat-status]");
        if (!status) return;
        status.classList.toggle("is-gated", !live);
        status.classList.toggle("is-live", live);
        status.textContent = live ? "Live XRP market" : "Not verified";
      };
      const resetChartStats = () => {
        setText("[data-chart-stat-price]", "—");
        setText("[data-chart-stat-change]", "—");
        setText("[data-chart-stat-volume]", "—");
       setText("[data-chart-stat-market-cap]", "—");
        setText("[data-chart-stat-sma]", "—");
        setText("[data-chart-stat-rsi]", "—");
        setText("[data-chart-stat-macd]", "—");
        setText("[data-chart-symbol-price]", "—");
        setText("[data-chart-symbol-change]", "—");
       setText("[data-chart-ohlc-open]", "—");
       setText("[data-chart-ohlc-high]", "—");
       setText("[data-chart-ohlc-low]", "—");
       setText("[data-chart-ohlc-close]", "—");
       setText("[data-chart-ohlc-change]", "—");
        setLiveStatus(false);
      };
      const movingAverage = (values, period) =>
        values.map((value, index) => {
          if (index < period - 1) return null;
          const slice = values.slice(index - period + 1, index + 1);
          return slice.reduce((sum, item) => sum + item, 0) / period;
        });
      const exponentialAverage = (values, period) => {
        const multiplier = 2 / (period + 1);
        let previous = values[0];
        return values.map((value, index) => {
          if (index === 0) return previous;
          previous = (value - previous) * multiplier + previous;
          return index < period - 1 ? null : previous;
        });
      };
      const relativeStrength = (values, period) =>
        values.map((_, index) => {
          if (index < period) return null;
          let gains = 0;
          let losses = 0;
          for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
            const change = values[cursor] - values[cursor - 1];
            if (change >= 0) gains += change;
            else losses -= change;
          }
          if (losses === 0) return 100;
          return 100 - 100 / (1 + gains / losses);
        });
      const pathFor = (series, x, y) => {
        let started = false;
        return series
          .map((value, index) => {
            if (value == null) return "";
            const command = started ? "L" : "M";
            started = true;
            return `${command} ${x(index)} ${y(value)}`;
          })
          .filter(Boolean)
          .join(" ");
      };
      const svgText = (x, y, text, className, anchor = "start") =>
        `<text x="${x}" y="${y}" class="${className}" text-anchor="${anchor}">${text}</text>`;

      pairButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const label = pairLabels[button.dataset.chartPair] || "XRP / USD";
          chartState.pair = button.dataset.chartPair;
          if (symbolMark) symbolMark.textContent = chartState.pair === "xrp-usd" ? "X" : "P";
          setText("[data-chart-symbol-source]", chartState.pair === "xrp-usd" ? "CoinGecko" : "Verification gated");
          setText("[data-chart-symbol]", label);
          setText("[data-chart-timeframe]", rangeLabels[chartState.range]);
          setText("[data-chart-pair-label]", chartState.pair === "xrp-usd" ? `${label} · Live market` : `${label} · Validated ledger`);
          setText("[data-chart-legend-primary]", label);
          if (chartState.pair === "xrp-usd") {
            loadXrpData();
          } else {
            chartState.data = null;
            resetChartStats();
            setChartEmpty(`${label} chart activates after verification`, "PND market data will appear after the issuer and market are verified.");
          }
        });
      });

      rangeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          chartState.range = button.dataset.chartRange || "1h";
          setText("[data-chart-timeframe]", rangeLabels[chartState.range]);
          if (chartState.pair === "xrp-usd") loadXrpData();
        });
      });

      indicatorButtons.forEach((button) => {
        button.addEventListener("click", () => {
          chartState.indicator = button.dataset.chartIndicator || "sma";
          setText("[data-chart-legend-indicator]", button.textContent.trim());
          if (chartState.data) renderChart();
        });
      });

      overlay.addEventListener("click", () => {
        const active = overlay.getAttribute("aria-pressed") !== "true";
        overlay.setAttribute("aria-pressed", String(active));
        overlay.classList.toggle("is-active", active);
        setText("[data-chart-legend-overlay]", active ? "Overlay on" : "Overlay off");
        setText(
          "[data-chart-empty-copy]",
          active
            ? "The selected pair and its comparison series will overlay after verified market data is available."
            : "Candles, volume, indicators, and crosshair data will come from the selected XRPL market.",
        );
        if (chartState.data) renderChart();
      });

      function renderChart() {
        const points = chartState.data?.points || [];
        if (points.length < 2) return;
        const values = points.map((point) => point.value);
        const volumes = points.map((point) => point.volume || 0);
        const width = 1000;
        const height = 480;
        const left = 58;
        const right = 18;
        const top = 18;
        const plotRight = width - right;
        const priceBottom = 246;
        const rsiTop = 264;
        const rsiBottom = 326;
        const macdTop = 344;
        const macdBottom = 410;
        const volumeTop = 428;
        const volumeBottom = 464;
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const padding = Math.max((maxValue - minValue) * 0.12, maxValue * 0.002);
        const low = minValue - padding;
        const high = maxValue + padding;
        const x = (index) => left + (index / Math.max(points.length - 1, 1)) * (plotRight - left);
        const y = (value) => priceBottom - ((value - low) / Math.max(high - low, 0.000001)) * (priceBottom - top);
        const pricePath = pathFor(values, x, y);
        const areaPath = `${pricePath} L ${x(values.length - 1)} ${priceBottom} L ${x(0)} ${priceBottom} Z`;
        const grid = [];
        for (let index = 0; index < 5; index += 1) {
          const gridY = top + (index / 4) * (priceBottom - top);
          const gridValue = high - (index / 4) * (high - low);
          grid.push(`<line class="trade-chart-grid-line" x1="${left}" x2="${plotRight}" y1="${gridY}" y2="${gridY}"/>`);
          grid.push(svgText(plotRight + 8, gridY + 3, formatUsd(gridValue), "trade-chart-axis-label"));
        }
        for (let index = 0; index <= 6; index += 1) {
          const gridX = left + (index / 6) * (plotRight - left);
          grid.push(`<line class="trade-chart-vertical-grid" x1="${gridX}" x2="${gridX}" y1="${top}" y2="${volumeBottom}"/>`);
        }
        const labelIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1];
        const labels = labelIndexes
          .map((index) => svgText(x(index), height - 3, new Date(points[index].time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }), "trade-chart-axis-label", index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"))
          .join("");
        const indicator = chartState.indicator;
        const sma = movingAverage(values, 20);
        const ema = exponentialAverage(values, 20);
        const macdFast = exponentialAverage(values, 12);
        const macdSlow = exponentialAverage(values, 26);
        const macd = values.map((_, index) => (macdFast[index] == null || macdSlow[index] == null ? null : macdFast[index] - macdSlow[index]));
        const firstMacdIndex = macd.findIndex((value) => value != null);
        const macdSignalValues = exponentialAverage(macd.filter((value) => value != null), 9);
        const macdSignal = macd.map((value, index) => (value == null ? null : macdSignalValues[index - firstMacdIndex]));
        const rsi = relativeStrength(values, 14);
        const mean = movingAverage(values, 20);
        const standardDeviation = values.map((_, index) => {
          if (index < 19) return null;
          const slice = values.slice(index - 19, index + 1);
          const average = mean[index];
          return Math.sqrt(slice.reduce((sum, value) => sum + (value - average) ** 2, 0) / 20);
        });
        const upper = mean.map((value, index) => (value == null || standardDeviation[index] == null ? null : value + standardDeviation[index] * 2));
        const lower = mean.map((value, index) => (value == null || standardDeviation[index] == null ? null : value - standardDeviation[index] * 2));
        const makeScale = (series, panelTop, panelBottom, fixedMin = null, fixedMax = null) => {
          const available = series.filter((value) => value != null);
          const seriesMin = fixedMin == null ? Math.min(...available, 0) : fixedMin;
          const seriesMax = fixedMax == null ? Math.max(...available, 0) : fixedMax;
          const span = Math.max(seriesMax - seriesMin, 0.000001);
          return (value) => panelBottom - ((value - seriesMin) / span) * (panelBottom - panelTop);
        };
        const rsiY = makeScale(rsi, rsiTop, rsiBottom, 0, 100);
        const macdY = makeScale([...macd, ...macdSignal], macdTop, macdBottom);
        const maxVolume = Math.max(...volumes, 1);
        const volumeBars = volumes
          .map((volume, index) => {
            const barWidth = Math.max(2, ((plotRight - left) / points.length) * 0.58);
            const barHeight = Math.max(1, (volume / maxVolume) * (volumeBottom - volumeTop - 5));
            const direction = index === 0 || values[index] >= values[index - 1] ? "is-up" : "is-down";
            return `<rect class="trade-chart-volume ${direction}" x="${x(index) - barWidth / 2}" y="${volumeBottom - barHeight}" width="${barWidth}" height="${barHeight}" rx="1"/>`;
          })
          .join("");
        const macdBars = macd
          .map((value, index) => {
            if (value == null) return "";
            const barWidth = Math.max(2, ((plotRight - left) / points.length) * 0.48);
            const zeroY = macdY(0);
            const valueY = macdY(value);
            return `<rect class="trade-chart-macd-bar ${value >= 0 ? "is-up" : "is-down"}" x="${x(index) - barWidth / 2}" y="${Math.min(zeroY, valueY)}" width="${barWidth}" height="${Math.max(1, Math.abs(zeroY - valueY))}" rx="0.8"/>`;
          })
          .join("");
        let indicatorPaths = "";
        if (indicator === "sma") indicatorPaths = `<path class="trade-chart-indicator" d="${pathFor(sma, x, y)}"/>`;
        if (indicator === "ema") indicatorPaths = `<path class="trade-chart-indicator is-secondary" d="${pathFor(ema, x, y)}"/>`;
        if (indicator === "bollinger") {
          indicatorPaths = `<path class="trade-chart-indicator" d="${pathFor(upper, x, y)}"/><path class="trade-chart-indicator is-secondary" d="${pathFor(lower, x, y)}"/>`;
        }
        const panelChrome = [
          `<line class="trade-chart-panel-divider" x1="${left}" x2="${plotRight}" y1="${rsiTop - 10}" y2="${rsiTop - 10}"/>`,
          `<line class="trade-chart-panel-divider" x1="${left}" x2="${plotRight}" y1="${macdTop - 10}" y2="${macdTop - 10}"/>`,
          `<line class="trade-chart-panel-divider" x1="${left}" x2="${plotRight}" y1="${volumeTop - 10}" y2="${volumeTop - 10}"/>`,
          `<line class="trade-chart-subgrid" x1="${left}" x2="${plotRight}" y1="${rsiY(70)}" y2="${rsiY(70)}"/>`,
          `<line class="trade-chart-subgrid" x1="${left}" x2="${plotRight}" y1="${rsiY(30)}" y2="${rsiY(30)}"/>`,
          `<line class="trade-chart-subgrid" x1="${left}" x2="${plotRight}" y1="${macdY(0)}" y2="${macdY(0)}"/>`,
          svgText(left, rsiTop + 11, "RSI 14", "trade-chart-panel-label"),
          svgText(left, macdTop + 11, "MACD 12 26 9", "trade-chart-panel-label"),
          svgText(left, volumeTop + 11, "VOLUME", "trade-chart-panel-label"),
          svgText(plotRight + 8, rsiY(70) + 3, "70", "trade-chart-axis-label"),
          svgText(plotRight + 8, rsiY(30) + 3, "30", "trade-chart-axis-label"),
        ].join("");
        const panelPaths = `<path class="trade-chart-rsi" d="${pathFor(rsi, x, rsiY)}"/><path class="trade-chart-macd" d="${pathFor(macd, x, macdY)}"/><path class="trade-chart-macd is-secondary" d="${pathFor(macdSignal, x, macdY)}"/>`;
        const overlayPath = overlay.getAttribute("aria-pressed") === "true"
          ? `<path class="trade-chart-overlay-line" d="${pathFor(sma, x, y)}"/>`
          : "";
        svg.innerHTML = `${grid.join("")}${panelChrome}<path class="trade-chart-area" d="${areaPath}"/><path class="trade-chart-price" d="${pricePath}"/>${indicatorPaths}${overlayPath}${panelPaths}${macdBars}${volumeBars}${labels}`;
        liveChart.hidden = false;
        emptyChart.hidden = true;
        setText("[data-chart-stat-sma]", formatUsd(sma[sma.length - 1]));
        setText("[data-chart-stat-rsi]", Number.isFinite(rsi[rsi.length - 1]) ? rsi[rsi.length - 1].toFixed(1) : "—");
        setText("[data-chart-stat-macd]", Number.isFinite(macd[macd.length - 1]) ? macd[macd.length - 1].toFixed(4) : "—");
        setText("[data-chart-symbol-price]", formatUsd(chartState.data.livePrice));
        setText("[data-chart-symbol-change]", formatPercent(chartState.data.change));
      }

      async function loadXrpData() {
        chartLoadController?.abort();
        chartLoadController = new AbortController();
        const loadGeneration = ++chartLoadGeneration;
        const { signal } = chartLoadController;
        const days = rangeDays[chartState.range] || 1;
        const limit = rangePoints[chartState.range] || 24;
        const label = pairLabels[chartState.pair];
        setText("[data-chart-symbol]", label);
        setText("[data-chart-timeframe]", rangeLabels[chartState.range]);
        setText("[data-chart-pair-label]", `${label} · Live market`);
        setText("[data-chart-empty-title]", "XRP / USD chart is loading");
        setText("[data-chart-empty-copy]", "Fetching live XRP market data…");
        setChartEmpty("XRP / USD chart is loading", "Fetching live XRP market data…");
        setLiveStatus(false);
        try {
          const [historyResponse, summaryResponse] = await Promise.all([
            fetch(`https://api.coingecko.com/api/v3/coins/ripple/market_chart?vs_currency=usd&days=${days}`, { signal }),
            fetch("https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_24hr_market_cap=true", { signal }),
          ]);
          if (!historyResponse.ok || !summaryResponse.ok) throw new Error("The public XRP market feed is unavailable.");
          const history = await historyResponse.json();
          const summary = await summaryResponse.json();
          const volumesByTime = new Map((history.total_volumes || []).map(([time, volume]) => [time, volume]));
          const allPoints = (history.prices || [])
            .map(([time, value]) => ({ time, value: Number(value), volume: Number(volumesByTime.get(time) || 0) }))
            .filter((point) => Number.isFinite(point.value));
          const points = allPoints.slice(-limit);
          if (points.length < 2) throw new Error("The public XRP market feed returned too little history.");
          if (loadGeneration !== chartLoadGeneration || signal.aborted) return;
          const livePrice = Number(summary.ripple?.usd) || points[points.length - 1].value;
          const change = Number(summary.ripple?.usd_24h_change);
          const volume = Number(summary.ripple?.usd_24h_vol);
           const marketCap = Number(summary.ripple?.usd_market_cap);
           const open = points[0].value;
           const high = Math.max(...points.map((point) => point.value));
           const low = Math.min(...points.map((point) => point.value));
           chartState.data = { points, livePrice, change, volume, marketCap, open, high, low };
          setText("[data-price]", formatUsd(livePrice));
          setText("[data-chart-stat-price]", formatUsd(livePrice));
          setText("[data-chart-stat-change]", formatPercent(change));
          setText("[data-chart-stat-volume]", formatVolume(volume));
           setText("[data-chart-stat-market-cap]", formatVolume(marketCap));
          setText("[data-chart-symbol-price]", formatUsd(livePrice));
          setText("[data-chart-symbol-change]", formatPercent(change));
           setText("[data-chart-ohlc-open]", formatUsd(open));
           setText("[data-chart-ohlc-high]", formatUsd(high));
           setText("[data-chart-ohlc-low]", formatUsd(low));
           setText("[data-chart-ohlc-close]", formatUsd(livePrice));
           setText("[data-chart-ohlc-change]", formatPercent(change));
           setText("[data-chart-symbol-source]", "CoinGecko");
          setText("[data-chart-source-label]", "CoinGecko live");
          setLiveStatus(true);
          renderChart();
        } catch (error) {
          if (isAbortError(error) || loadGeneration !== chartLoadGeneration) return;
          chartState.data = null;
          resetChartStats();
          setChartEmpty("XRP / USD chart unavailable", error.message || "The public market feed did not respond.");
        }
      }

      const load = () => {
        if (chartState.pair === "xrp-usd") loadXrpData();
      };
      window.setInterval(load, 60000);
      return { load };
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
      window.PondTrade = {
        ...(window.PondTrade || {}),
        showDisclaimer: () => window.PondDisclaimer?.open?.(),
      };
      if (window.PondDisclaimer?.init) {
        window.PondDisclaimer.init();
        return;
      }
      const modal = $("[data-disclaimer]");
      const confirm = $("[data-disclaimer-confirm]");
      const known = $("[data-disclaimer-known]");
      const newcomer = $("[data-disclaimer-new]");
      if (!modal || !confirm || !known || !newcomer) return;
      modal.hidden = false;
      document.body.classList.add("trade-disclaimer-open");
    }

    async function readMarketState(signal) {
      const endpoint = networks[state.network].endpoint;
      const [serverResponse, accountResponse, issuerLinesResponse] = await Promise.all([
        wsRpc(endpoint, "server_info", {}, signal),
        wsRpc(endpoint, "account_info", {
          account: issuer,
          ledger_index: "validated",
        }, signal),
        wsRpc(endpoint, "account_lines", {
          account: issuer,
          ledger_index: "validated",
          limit: 400,
        }, signal),
      ]);
      const server = serverResponse.result?.info || serverResponse.info || {};
      const account = accountResponse.result?.account_data;
      const issuerLines = issuerLinesResponse.result?.lines || [];
      const pndLines = issuerLines.filter((line) => line.currency === "PND");
      const issued = Boolean(account && pndLines.some((line) => Number(line.balance || 0) !== 0 || Number(line.limit || 0) !== 0));
      const marketParams = {
        ledger_index: "validated",
        taker_gets: { currency: "XRP" },
        taker_pays: { currency: "PND", issuer },
        limit: 50,
      };
      const reverseMarketParams = {
        ledger_index: "validated",
        taker_gets: { currency: "PND", issuer },
        taker_pays: { currency: "XRP" },
        limit: 50,
      };
      const [asks, bids, ammInfo] = await Promise.all([
        wsRpc(endpoint, "book_offers", marketParams, signal).catch(() => null),
        wsRpc(endpoint, "book_offers", reverseMarketParams, signal).catch(() => null),
        wsRpc(endpoint, "amm_info", {
          asset: { currency: "XRP" },
          asset2: { currency: "PND", issuer },
          ledger_index: "validated",
        }, signal).catch(() => null),
      ]);
      const offers = [
        ...(asks?.result?.offers || []),
        ...(bids?.result?.offers || []),
      ];
      const amm = ammInfo?.result?.amm || null;
      return {
        issuer: Boolean(account),
        issued,
        orderBook: offers.length > 0,
        amm: Boolean(amm),
        market: state.network === "production" && issued && (offers.length > 0 || Boolean(amm)),
        ledger: server.validated_ledger || null,
        server,
        account,
        offers,
        pndLines,
        ammInfo: ammInfo?.result || null,
      };
    }

    async function refresh() {
      const generation = ++state.requestGeneration;
      refreshController?.abort();
      refreshController = new AbortController();
      const { signal } = refreshController;
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
        state.verification = { ...state.verification, issuer: false, issued: false, market: false };
        setMarketState(state.verification);
        return;
      }
      try {
        const verification = await readMarketState(signal);
        if (!isCurrent(generation)) return;
        state.verification = verification;
        const ledgerIndex = verification.ledger?.seq || "available";
        setStatus("online", `Validated ledger ${ledgerIndex}`);
        setMarketState(verification);
        if (icon) icon.dataset.state = verification.issuer ? "ready" : "error";
        setText("[data-issuer-status]", verification.market
          ? "Market verified"
          : verification.issued
            ? "Issuer verified · market pending"
            : "PND not issued");
      } catch (error) {
        if (isAbortError(error) || !isCurrent(generation)) return;
        setStatus("offline", "Ledger unavailable");
        setText("[data-issuer-status]", "Issuer check unavailable");
        setText("[data-issuer-detail]", error.message || "The selected XRPL endpoint did not respond.");
        if (icon) icon.dataset.state = "error";
        state.verification = { ...state.verification, issuer: false, issued: false, orderBook: false, amm: false, market: false };
        setMarketState(state.verification);
      }
    }

    root.querySelectorAll("[data-network]").forEach((button) => {
      button.addEventListener("click", () => {
        state.network = button.dataset.network;
        setNetworkButtons();
        walletController?.switchNetwork();
        refresh();
      });
    });
    $("[data-refresh]")?.addEventListener("click", refresh);
    setupTabs();
    setupControlGroups();
    setupDataControls();
    setupConnectMenu();
    window.addEventListener("pond:xaman-change", () => {
      if (document.body.contains(root)) syncConnectLabel();
    });
    walletController = setupWallet();
    window.PondTrade = {
      ...(window.PondTrade || {}),
      init,
      connectWallet: () => walletController?.connect?.(),
    };
    setupDexOrder();
    chartController = setupChartControls();
    setupDisclaimer();
    const initialMode = window.location.hash === "#data"
        ? "data"
        : "chart";
    setMode(initialMode);
    setNetworkButtons();
    refresh();
    window.PondXaman?.init?.();
  }

  window.PondTrade = { ...(window.PondTrade || {}), init, connectWallet: () => {} };
  init();
})();