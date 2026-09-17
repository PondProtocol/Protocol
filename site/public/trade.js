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
       <button type="button" class="is-active" data-tab="chart" aria-selected="true">Chart</button>
       <button type="button" data-tab="dex" aria-selected="false">DEX</button>
       <button type="button" data-tab="amm" aria-selected="false">AMM</button>
       <button type="button" data-tab="data" aria-selected="false">Data</button>
       <button type="button" data-tab="agent" aria-selected="false">Agent</button>
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

    <section class="trade-mode-view trade-mode-workspace trade-overview-view" data-mode-view="chart" aria-label="Market chart" hidden>
      <section class="trade-overview-chart">
        <div class="trade-chart-market-controls">
          <div class="trade-chart-pair-tabs" data-control-group="chart-pair" aria-label="Chart pair">
            <button type="button" class="is-active" data-chart-pair="xrp-usd">XRP / USD</button>
            <button type="button" data-chart-pair="pnd-xrp">PND / XRP</button>
            <button type="button" data-chart-pair="pnd-usd">PND / USD</button>
          </div>
          <button type="button" class="trade-chart-overlay" data-chart-overlay aria-pressed="false">Overlay charts</button>
        </div>
        <div class="trade-overview-toolbar">
          <div><p class="trade-kicker">Market chart</p><strong data-chart-pair-label>XRP / USD · Validated ledger</strong></div>
          <div class="trade-overview-controls" data-control-group="overview-range"><button type="button" class="is-active" data-chart-range="1h">1H</button><button type="button" data-chart-range="4h">4H</button><button type="button" data-chart-range="1d">1D</button><button type="button" data-chart-range="1w">1W</button><button type="button" data-chart-range="all">All</button></div>
        </div>
        <div class="trade-overview-tools">
          <div class="trade-chart-tools"><span>Crosshair</span><span class="is-active">Candles</span><span>Line</span><span>Volume</span></div>
          <div class="trade-indicator-tools" data-control-group="overview-indicators"><button type="button" class="is-active" data-chart-indicator="sma">SMA</button><button type="button" data-chart-indicator="ema">EMA</button><button type="button" data-chart-indicator="rsi">RSI</button><button type="button" data-chart-indicator="macd">MACD</button><button type="button" data-chart-indicator="bollinger">Bollinger Bands</button></div>
        </div>
        <div class="trade-overview-plot">
          <div class="trade-chart-live" data-chart-live hidden>
            <svg class="trade-chart-svg" data-chart-svg viewBox="0 0 1000 360" role="img" aria-label="Live XRP price chart"></svg>
            <span class="trade-chart-source" data-chart-source>Source: CoinGecko public market data</span>
          </div>
          <div class="trade-chart-empty-state" data-chart-empty-state>
            <div class="trade-chart-grid"></div>
            <span class="trade-chart-mark">P</span>
            <strong data-chart-empty-title>XRP / USD chart is loading</strong>
            <span data-chart-empty-copy>Fetching live XRP market data…</span>
          </div>
        </div>
        <div class="trade-overview-legend"><span><i class="trade-legend-dot"></i><span data-chart-legend-primary>XRP / USD</span></span><span><i class="trade-legend-bar"></i>Volume</span><span data-chart-legend-indicator>SMA</span><span data-chart-legend-overlay>Overlay off</span><span data-chart-source-label>CoinGecko data</span></div>
      </section>
      <aside class="trade-overview-sidebar">
        <div class="trade-overview-card"><p class="trade-kicker">Market snapshot</p><div class="trade-overview-stat"><span>Last price</span><strong data-chart-stat-price>—</strong></div><div class="trade-overview-stat"><span>24h change</span><strong data-chart-stat-change>—</strong></div><div class="trade-overview-stat"><span>24h volume</span><strong data-chart-stat-volume>—</strong></div><div class="trade-overview-stat"><span>Market status</span><strong class="is-gated" data-chart-stat-status>Loading</strong></div></div>
        <div class="trade-overview-card"><p class="trade-kicker">Indicators</p><div class="trade-overview-stat"><span>SMA 20</span><strong data-chart-stat-sma>—</strong></div><div class="trade-overview-stat"><span>RSI 14</span><strong data-chart-stat-rsi>—</strong></div><div class="trade-overview-stat"><span>MACD</span><strong data-chart-stat-macd>—</strong></div><span class="trade-overview-note" data-chart-indicator-note>Select an indicator to plot it over the live XRP series.</span></div>
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
    let chartController = null;
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
        chart: "Chart route gated",
        data: "Data route gated",
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

    function setupChartControls() {
      const pairLabels = {
        "xrp-usd": "XRP / USD",
        "pnd-xrp": "PND / XRP",
        "pnd-usd": "PND / USD",
      };
      const rangeDays = { "1h": 1, "4h": 2, "1d": 7, "1w": 7, all: 365 };
      const rangePoints = { "1h": 12, "4h": 24, "1d": 48, "1w": 168, all: 365 };
      const chartState = { pair: "xrp-usd", range: "1h", indicator: "sma", data: null };
      const pairButtons = $$("[data-chart-pair]");
      const rangeButtons = $$("[data-chart-range]");
      const indicatorButtons = $$("[data-chart-indicator]");
      const overlay = $("[data-chart-overlay]");
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
        setText("[data-chart-stat-sma]", "—");
        setText("[data-chart-stat-rsi]", "—");
        setText("[data-chart-stat-macd]", "—");
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
      const pathFor = (series, x, y) =>
        series
          .map((value, index) => (value == null ? "" : `${index ? "L" : "M"} ${x(index)} ${y(value)}`))
          .filter(Boolean)
          .join(" ");
      const svgText = (x, y, text, className, anchor = "start") =>
        `<text x="${x}" y="${y}" class="${className}" text-anchor="${anchor}">${text}</text>`;

      pairButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const label = pairLabels[button.dataset.chartPair] || "XRP / USD";
          chartState.pair = button.dataset.chartPair;
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
        const height = 360;
        const left = 58;
        const right = 18;
        const top = 18;
        const bottom = 38;
        const volumeHeight = 54;
        const plotRight = width - right;
        const plotBottom = height - bottom - volumeHeight;
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const padding = Math.max((maxValue - minValue) * 0.12, maxValue * 0.002);
        const low = minValue - padding;
        const high = maxValue + padding;
        const x = (index) => left + (index / Math.max(points.length - 1, 1)) * (plotRight - left);
        const y = (value) => plotBottom - ((value - low) / Math.max(high - low, 0.000001)) * (plotBottom - top);
        const maxVolume = Math.max(...volumes, 1);
        const volumeY = (value) => plotBottom + 8 + (1 - value / maxVolume) * volumeHeight;
        const pricePath = pathFor(values, x, y);
        const areaPath = `${pricePath} L ${x(values.length - 1)} ${plotBottom} L ${x(0)} ${plotBottom} Z`;
        const grid = [];
        for (let index = 0; index < 5; index += 1) {
          const gridY = top + (index / 4) * (plotBottom - top);
          const gridValue = high - (index / 4) * (high - low);
          grid.push(`<line class="trade-chart-grid-line" x1="${left}" x2="${plotRight}" y1="${gridY}" y2="${gridY}"/>`);
          grid.push(svgText(left - 8, gridY + 3, formatUsd(gridValue), "trade-chart-axis-label", "end"));
        }
        const bars = volumes
          .map((volume, index) => {
            const barWidth = Math.max(2, ((plotRight - left) / points.length) * 0.58);
            const barHeight = Math.max(1, (volume / maxVolume) * volumeHeight);
            return `<rect class="trade-chart-volume" x="${x(index) - barWidth / 2}" y="${plotBottom + volumeHeight - barHeight}" width="${barWidth}" height="${barHeight}" rx="1"/>`;
          })
          .join("");
        const labelIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1];
        const labels = labelIndexes
          .map((index) => svgText(x(index), height - 12, new Date(points[index].time).toLocaleDateString(undefined, { month: "short", day: "numeric" }), "trade-chart-axis-label", index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"))
          .join("");
        const indicator = chartState.indicator;
        const sma = movingAverage(values, 20);
        const ema = exponentialAverage(values, 20);
        const changes = values.map((value, index) => (index ? value - values[index - 1] : 0));
        const macdFast = exponentialAverage(values, 12);
        const macdSlow = exponentialAverage(values, 26);
        const macd = values.map((_, index) => (macdFast[index] == null || macdSlow[index] == null ? null : macdFast[index] - macdSlow[index]));
        const macdSignal = exponentialAverage(macd.filter((value) => value != null), 9);
        const macdAligned = macd.map((value, index) => (value == null ? null : macdSignal[Math.max(0, index - 25)]));
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
        let indicatorPaths = "";
        let indicatorClass = "trade-chart-indicator";
        if (indicator === "sma") indicatorPaths = `<path class="${indicatorClass}" d="${pathFor(sma, x, y)}"/>`;
        if (indicator === "ema") indicatorPaths = `<path class="${indicatorClass} is-secondary" d="${pathFor(ema, x, y)}"/>`;
        if (indicator === "bollinger") {
          indicatorPaths = `<path class="${indicatorClass}" d="${pathFor(upper, x, y)}"/><path class="${indicatorClass} is-secondary" d="${pathFor(lower, x, y)}"/>`;
        }
        const lowerSeries = indicator === "rsi" ? rsi : indicator === "macd" ? macd : null;
        if (lowerSeries) {
          const lowerValues = lowerSeries.filter((value) => value != null);
          const lowerMin = indicator === "rsi" ? 0 : Math.min(...lowerValues, 0);
          const lowerMax = indicator === "rsi" ? 100 : Math.max(...lowerValues, 0);
          const lowerTop = plotBottom + 8;
          const lowerBottom = height - bottom - 4;
          const lowerY = (value) => lowerBottom - ((value - lowerMin) / Math.max(lowerMax - lowerMin, 0.000001)) * (lowerBottom - lowerTop);
          indicatorPaths = `<line class="trade-chart-subgrid" x1="${left}" x2="${plotRight}" y1="${lowerY(indicator === "rsi" ? 70 : 0)}" y2="${lowerY(indicator === "rsi" ? 70 : 0)}"/><path class="${indicatorClass}" d="${pathFor(lowerSeries, x, lowerY)}"/>`;
          if (indicator === "macd") indicatorPaths += `<path class="${indicatorClass} is-secondary" d="${pathFor(macdAligned, x, lowerY)}"/>`;
        }
        const overlayPath = overlay.getAttribute("aria-pressed") === "true"
          ? `<path class="trade-chart-overlay-line" d="${pathFor(sma, x, y)}"/>`
          : "";
        svg.innerHTML = `${grid.join("")}<path class="trade-chart-area" d="${areaPath}"/><path class="trade-chart-price" d="${pricePath}"/>${indicatorPaths}${overlayPath}${bars}${labels}`;
        liveChart.hidden = false;
        emptyChart.hidden = true;
        setText("[data-chart-stat-sma]", formatUsd(sma[sma.length - 1]));
        setText("[data-chart-stat-rsi]", Number.isFinite(rsi[rsi.length - 1]) ? rsi[rsi.length - 1].toFixed(1) : "—");
        setText("[data-chart-stat-macd]", Number.isFinite(macd[macd.length - 1]) ? macd[macd.length - 1].toFixed(4) : "—");
      }

      async function loadXrpData() {
        const days = rangeDays[chartState.range] || 1;
        const limit = rangePoints[chartState.range] || 24;
        const label = pairLabels[chartState.pair];
        setText("[data-chart-pair-label]", `${label} · Live market`);
        setText("[data-chart-empty-title]", "XRP / USD chart is loading");
        setText("[data-chart-empty-copy]", "Fetching live XRP market data…");
        setChartEmpty("XRP / USD chart is loading", "Fetching live XRP market data…");
        setLiveStatus(false);
        try {
          const [historyResponse, summaryResponse] = await Promise.all([
            fetch(`https://api.coingecko.com/api/v3/coins/ripple/market_chart?vs_currency=usd&days=${days}`),
            fetch("https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true"),
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
          const livePrice = Number(summary.ripple?.usd) || points[points.length - 1].value;
          const change = Number(summary.ripple?.usd_24h_change);
          const volume = Number(summary.ripple?.usd_24h_vol);
          chartState.data = { points, livePrice, change, volume };
          setText("[data-price]", formatUsd(livePrice));
          setText("[data-chart-stat-price]", formatUsd(livePrice));
          setText("[data-chart-stat-change]", formatPercent(change));
          setText("[data-chart-stat-volume]", formatVolume(volume));
          setText("[data-chart-source-label]", "CoinGecko live");
          setLiveStatus(true);
          renderChart();
        } catch (error) {
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
    chartController = setupChartControls();
    setupDisclaimer();
    const initialMode = window.location.hash === "#agent"
      ? "agent"
      : window.location.hash === "#data"
        ? "data"
        : "chart";
    setMode(initialMode);
    setNetworkButtons();
    refresh();
  }

  window.PondTrade = { init };
  init();
})();