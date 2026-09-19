(() => {
  const WC_SCRIPTS = [{ src: "/vendor/xrpl-latest-min.js" }, { src: "/vendor/xrpl-connect.umd.js" }];
  let wcScriptsPromise = null;

  function loadWcScript(entry) {
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

  function ensureWcScripts() {
    if (window.XRPLConnect?.WalletManager) return Promise.resolve();
    if (!wcScriptsPromise) {
      wcScriptsPromise = WC_SCRIPTS.reduce((chain, entry) => chain.then(() => loadWcScript(entry)), Promise.resolve());
    }
    return wcScriptsPromise;
  }

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
          <div class="trade-pair-sub">Issued currency · <span data-network-label>XRPL Testnet</span></div>
        </div>
      </div>
      <div class="trade-network" role="group" aria-label="Trading network">
        <span class="trade-network-label">Network</span>
        <button type="button" class="trade-network-button is-active" data-network="testnet" aria-pressed="true">Testnet</button>
        <button type="button" class="trade-network-button" data-network="production" aria-pressed="false">Mainnet</button>
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

    <xrpl-wallet-connector id="pond-wallet-connector" background-color="#111315" theme-mode="dark"></xrpl-wallet-connector>

    <p class="trade-honesty" data-honesty>XRPL Testnet · $PND issued · 100B at treasury · faucet XRP is worthless · Mainnet not issued</p>

    <div class="trade-stat-strip">
      <div><span>Price</span><strong data-price>—</strong><em data-price-note>No AMM or DEX book</em></div>
      <div><span>24h volume</span><strong data-volume>—</strong><em data-volume-note>No trades to count</em></div>
      <div><span>Liquidity</span><strong data-liquidity>—</strong><em data-liquidity-note>No AMM pool</em></div>
      <div><span>Network</span><strong data-network-label>XRPL Testnet</strong><em data-ledger-status>Reading Testnet…</em></div>
      <div><span>Treasury</span><strong data-treasury-balance>—</strong><em>100B PND issued here</em></div>
    </div>

      <nav class="trade-mode-tabs" aria-label="Trading mode" data-tab-group="mode">
       <button type="button" class="is-active" data-tab="chart" aria-selected="true">Chart</button>
       <button type="button" data-tab="dex" aria-selected="false">DEX</button>
       <button type="button" data-tab="amm" aria-selected="false">AMM</button>
       <button type="button" data-tab="data" aria-selected="false">Data</button>
        <span class="trade-mode-note"><span class="trade-pulse" data-network-dot></span> <span data-mode-note>PND / XRP · Testnet ledger</span></span>
    </nav>

    <div class="trade-workspace trade-mode-view" data-mode-view="amm" aria-label="AMM workspace">
      <section class="trade-market-pane" aria-label="Market view">
        <nav class="trade-subtabs" aria-label="AMM market detail" data-tab-group="amm-market">
          <button type="button" class="is-active" data-tab="pools" aria-selected="true">Pools</button>
          <button type="button" data-tab="activity" aria-selected="false">Activity</button>
        </nav>
        <div class="trade-market-panels" data-tab-panels="amm-market">
          <div class="trade-panel is-active" data-panel="pools">
            <div class="trade-amm-pools" data-amm-pools>
              <p class="trade-amm-pools-empty">Reading validated ledger…</p>
            </div>
          </div>
          <div class="trade-panel" data-panel="activity" hidden>
            <div class="trade-amm-activity" data-amm-activity>
              <p class="trade-amm-pools-empty">Reading validated ledger…</p>
            </div>
          </div>
        </div>
        <div class="trade-market-footer"><span>Data source: XRPL validated ledger</span><span data-issuer-status>Checking issuer account</span></div>
      </section>

      <aside class="trade-action-pane" aria-label="Trade actions">
        <div class="trade-action-card">
          <nav class="trade-action-tabs" aria-label="AMM action" data-tab-group="amm-action">
            <button type="button" class="is-active" data-tab="liquidity" aria-selected="true">Liquidity</button>
            <button type="button" data-tab="swap" aria-selected="false">Swap</button>
          </nav>
          <div class="trade-action-panels" data-tab-panels="amm-action">
            <div class="trade-panel" data-panel="swap" hidden>
              <div class="trade-action-field"><span>Sell</span><div><strong>0.00</strong><b>XRP⌄</b></div><small>—</small></div>
              <button type="button" class="trade-flip" aria-label="Flip assets">↕</button>
              <div class="trade-action-field"><span>Buy</span><div><strong>0.00</strong><b>$PND⌄</b></div><small>—</small></div>
              <div class="trade-summary-row"><span>Rate</span><strong>—</strong></div>
              <button type="button" class="trade-connect-button" disabled>Unsigned preview — this terminal does not sign or submit</button>
            </div>
            <div class="trade-panel is-active" data-panel="liquidity">
              <div class="trade-inline-tabs" aria-label="Liquidity action" data-tab-group="amm-liquidity">
                <button type="button" class="is-active" data-tab="add" aria-selected="true">Add</button>
                <button type="button" data-tab="remove" aria-selected="false">Remove</button>
              </div>
              <div data-tab-panels="amm-liquidity">
                <div class="trade-panel is-active" data-panel="add">
                  <div class="trade-amm-create" data-amm-create data-amm-deposit>
                    <p class="trade-amm-create-kicker">Testnet AMMDeposit</p>
                    <p class="trade-amm-create-copy">Official Xaman. Unsigned AMMDeposit into the live PND/XRP pool — not a second AMMCreate. This server never signs. Xaman submits after you sign.</p>
                    <div class="trade-amm-pool-stats" data-amm-pool-stats hidden>
                      <div class="trade-amm-stat"><span>Pool</span><strong data-amm-stat-pool>No AMM pool</strong><em data-amm-stat-pool-note>amm_info</em></div>
                      <div class="trade-amm-stat"><span>DEX</span><strong data-amm-stat-dex>—</strong><em>book_offers</em></div>
                      <div class="trade-amm-stat"><span>Treasury PND</span><strong data-amm-live-pnd>—</strong><em>validated line</em></div>
                      <div class="trade-amm-stat"><span>Treasury XRP</span><strong data-amm-live-xrp>—</strong><em>account_info</em></div>
                      <div class="trade-amm-stat"><span>Price</span><strong data-amm-stat-price>—</strong><em data-amm-stat-price-note>No AMM or DEX book</em></div>
                      <div class="trade-amm-stat"><span>Ledger</span><strong data-amm-stat-ledger>—</strong><em>validated</em></div>
                    </div>
                    <p class="trade-amm-create-balances" hidden>Pool <code data-amm-pool-account>—</code></p>
                    <p class="trade-amm-create-session" data-amm-session>Sign in with Xaman to deposit from that wallet.</p>
                    <div class="trade-amm-deposit-meta">
                      <div class="trade-amm-wallet" data-amm-wallet>
                        <div><span>Your PND</span><strong data-amm-wallet-pnd>—</strong><em>signed-in line</em></div>
                        <div><span>Your XRP</span><strong data-amm-wallet-xrp>—</strong><em>account_info</em></div>
                      </div>
                      <div class="trade-amm-shape">
                        <div class="trade-amm-sides" role="group" aria-label="Deposit shape">
                          <button type="button" class="is-active" data-amm-side="two">Even-sided</button>
                          <button type="button" data-amm-side="single">Single-sided</button>
                        </div>
                        <p class="trade-amm-side-note" data-amm-side-note>tfTwoAsset · both assets</p>
                        <div class="trade-amm-single" data-amm-single hidden>
                          <button type="button" class="is-active" data-amm-single-asset="PND">PND</button>
                          <button type="button" data-amm-single-asset="XRP">XRP</button>
                        </div>
                      </div>
                    </div>
                    <div class="trade-amm-amounts">
                      <label class="trade-amm-slider" data-amm-pnd-row>
                        <span>PND amount</span>
                        <input type="range" data-amm-pnd-range min="0" max="0" step="any" value="0" aria-label="PND amount slider">
                        <div><input data-amm-pnd inputmode="decimal" autocomplete="off" value="0" aria-label="PND amount for AMMDeposit"><b>PND</b></div>
                      </label>
                      <label class="trade-amm-slider" data-amm-xrp-row>
                        <span>XRP amount</span>
                        <input type="range" data-amm-xrp-range min="0" max="0" step="any" value="0" aria-label="XRP amount slider">
                        <div><input data-amm-xrp inputmode="decimal" autocomplete="off" value="0" aria-label="XRP amount for AMMDeposit"><b>XRP</b></div>
                      </label>
                    </div>
                    <label class="trade-amm-slider">
                      <span>Trading fee</span>
                      <input type="range" data-amm-fee-range min="0" max="1000" step="1" value="0" aria-label="Trading fee slider">
                      <div><input data-amm-fee inputmode="numeric" autocomplete="off" value="0" aria-label="Trading fee units"><b data-amm-fee-label>0%</b></div>
                      <small>Starts at 0. Pool fee is live on the ledger. AMMDeposit does not send TradingFee.</small>
                    </label>
                    <p class="trade-order-status" data-amm-create-status>Testnet only. Mainnet AMMDeposit is disabled.</p>
                    <button type="button" class="trade-connect-button" data-amm-send>Send AMMDeposit to Xaman</button>
                    <div data-amm-xaman></div>
                  </div>
                </div>
                <div class="trade-panel" data-panel="remove" hidden><div class="trade-empty-panel"><strong>Remove liquidity</strong><span>No LP position to read. This terminal does not sign or submit.</span></div></div>
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
        </div>
        <div class="trade-market-panels">
          <div class="trade-panel is-active">
            <div class="trade-dex-market" data-dex-market>
              <div class="trade-chart-empty trade-dex-chart-empty" data-dex-empty>
                <div class="trade-chart-grid"></div>
                <span class="trade-chart-mark">P</span>
                <strong>PND / XRP DEX book is empty</strong>
                <span>No validated Testnet offers. The chart stays blank until the ledger has a book or AMM.</span>
              </div>
              <div class="trade-dex-live" data-dex-live hidden>
                <section class="trade-dex-book-wrap" data-dex-book-wrap>
                  <p class="trade-kicker">Validated book</p>
                  <div class="trade-dex-book-head"><span>Price</span><span>PND</span><span>XRP</span></div>
                  <ol class="trade-dex-book" data-dex-book></ol>
                </section>
                <section class="trade-dex-tape-wrap">
                  <p class="trade-kicker">Trade tape</p>
                  <div class="trade-dex-tape-head"><span>Side</span><span>Price</span><span>Size</span><span>Time</span></div>
                  <ol class="trade-dex-tape" data-dex-tape></ol>
                </section>
              </div>
            </div>
          </div>
        </div>
        <div class="trade-market-footer"><span>Data source: XRPL Testnet validated ledger</span><span>Unsigned display only</span></div>
      </section>

      <aside class="trade-action-pane" aria-label="DEX order actions">
        <div class="trade-action-card" data-order-ticket>
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
               <p class="trade-order-status" data-dex-order-status role="status">Unsigned preview. This terminal does not sign or submit OfferCreate.</p>
               <button type="button" class="trade-connect-button" data-dex-submit disabled>Unsigned preview — no submit</button>
            </div>
            <div class="trade-panel" data-panel="sell" hidden>
               <div class="trade-order-choice" data-order-kind-group><button type="button" class="is-active" data-order-kind="limit">Limit</button><button type="button" data-order-kind="market">Market</button></div>
               <div class="trade-empty-panel"><strong>Sell ticket</strong><span data-dex-sell-note>Display only. No signing. The Testnet PND/XRP book is empty.</span></div>
            </div>
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
          <div class="trade-overview-controls" data-control-group="overview-range"><button type="button" class="is-active" data-chart-range="1m">1m</button><button type="button" data-chart-range="5m">5m</button><button type="button" data-chart-range="15m">15m</button><button type="button" data-chart-range="30m">30m</button><button type="button" data-chart-range="1h">1H</button><button type="button" data-chart-range="4h">4H</button><button type="button" data-chart-range="1d">1D</button><button type="button" data-chart-range="1w">1W</button><button type="button" data-chart-range="all">All</button></div>
          <button type="button" class="trade-chart-overlay" data-chart-overlay aria-pressed="false">Overlay charts</button>
        </div>
        <div class="trade-chart-symbol-bar">
          <div class="trade-chart-symbol"><span class="trade-chart-symbol-mark" data-chart-symbol-mark>P</span><strong data-chart-symbol>PND / XRP</strong><span data-chart-timeframe>1m</span><span class="trade-chart-symbol-source" data-chart-symbol-source>XRPL Testnet</span><strong class="trade-chart-pair-label" data-chart-pair-label hidden>PND / XRP · Testnet ledger</strong></div>
          <div class="trade-chart-ohlc" aria-label="Chart price details">
            <span><b>O</b><strong data-chart-ohlc-open>—</strong></span>
            <span><b>H</b><strong data-chart-ohlc-high>—</strong></span>
            <span><b>L</b><strong data-chart-ohlc-low>—</strong></span>
            <span><b>C</b><strong data-chart-ohlc-close>—</strong></span>
            <span class="trade-chart-ohlc-change"><b>24H</b><strong data-chart-ohlc-change>—</strong></span>
          </div>
          <div class="trade-chart-readout"><strong data-chart-symbol-price>—</strong><span data-chart-symbol-change>—</span></div>
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
            <strong data-chart-empty-title>No PND/XRP candles on Testnet</strong>
            <span data-chart-empty-copy>There is no AMM or DEX book to plot. Last price, volume, and candles stay blank.</span>
          </div>
        </div>
        <div class="trade-overview-legend"><span><i class="trade-legend-dot"></i><span data-chart-legend-primary>PND / XRP</span></span><span><i class="trade-legend-bar"></i>Volume</span><span data-chart-legend-indicator>Bollinger Bands</span><span data-chart-legend-overlay>Overlay off</span><span data-chart-source-label>XRPL Testnet</span></div>
      </section>
      <aside class="trade-overview-sidebar">
          <div class="trade-overview-card"><p class="trade-kicker">Market snapshot</p><div class="trade-overview-stat"><span>Last price</span><strong data-chart-stat-price>—</strong></div><div class="trade-overview-stat"><span>24h change</span><strong data-chart-stat-change>—</strong></div><div class="trade-overview-stat"><span>24h volume</span><strong data-chart-stat-volume>—</strong></div><div class="trade-overview-stat"><span>Treasury PND</span><strong data-chart-stat-market-cap>—</strong></div><div class="trade-overview-stat"><span>Market status</span><strong data-chart-stat-status>No AMM or DEX book</strong></div></div>
          <div class="trade-overview-card"><p class="trade-kicker">Indicators</p><div class="trade-overview-stat"><span>SMA 20</span><strong data-chart-stat-sma>—</strong></div><div class="trade-overview-stat"><span>RSI 14</span><strong data-chart-stat-rsi>—</strong></div><div class="trade-overview-stat"><span>MACD</span><strong data-chart-stat-macd>—</strong></div><span class="trade-overview-note" data-chart-indicator-note>Indicators need a live PND/XRP book or AMM. None on Testnet yet.</span></div>
        <div class="trade-overview-card trade-overview-risk"><p class="trade-kicker">Honesty</p><strong>Testnet faucet XRP is worthless.</strong><span>100B PND sits at the Testnet treasury. Mainnet still has no $PND issued. This terminal does not sign or submit.</span></div>
        <div class="trade-action-card trade-overview-ticket" data-order-ticket>
          <nav class="trade-action-tabs" aria-label="Chart order type" data-tab-group="chart-order">
            <button type="button" class="is-active" data-tab="buy" aria-selected="true">Buy</button>
            <button type="button" data-tab="sell" aria-selected="false">Sell</button>
          </nav>
          <div class="trade-action-panels" data-tab-panels="chart-order">
             <div class="trade-panel is-active" data-panel="buy">
               <div class="trade-order-choice" data-order-kind-group><button type="button" class="is-active" data-order-kind="limit">Limit</button><button type="button" data-order-kind="market">Market</button></div>
               <div class="trade-order-grid">
                 <label class="trade-action-field trade-input-field"><span>Price</span><div><input data-dex-price inputmode="decimal" autocomplete="off" placeholder="0.000000" aria-label="Price in XRP per PND"><b>XRP</b></div></label>
                 <label class="trade-action-field trade-input-field"><span>Amount</span><div><input data-dex-amount inputmode="decimal" autocomplete="off" placeholder="0.00" aria-label="PND amount"><b>PND</b></div></label>
               </div>
               <div class="trade-action-field"><span>Total</span><div><strong data-dex-total>—</strong><b>XRP</b></div><small>Price × amount · Time in force · GTC</small></div>
               <p class="trade-order-status" data-dex-order-status role="status">Unsigned preview. This terminal does not sign or submit OfferCreate.</p>
               <button type="button" class="trade-connect-button" data-dex-submit disabled>Unsigned preview — no submit</button>
            </div>
            <div class="trade-panel" data-panel="sell" hidden>
               <div class="trade-order-choice" data-order-kind-group><button type="button" class="is-active" data-order-kind="limit">Limit</button><button type="button" data-order-kind="market">Market</button></div>
               <div class="trade-empty-panel"><strong>Sell ticket</strong><span data-dex-sell-note>Display only. No signing. The Testnet PND/XRP book is empty.</span></div>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <section class="trade-mode-view trade-data-view" data-mode-view="data" aria-label="Market data" hidden>
      <header class="trade-data-header">
        <div>
          <p class="trade-kicker">Data explorer</p>
          <h2>Testnet $PND ledger read.</h2>
          <p>Issuer, treasury, AMM, and DEX book come from the validated XRPL Testnet. Blank fields mean the ledger has no market yet — not a guessed price.</p>
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
        <div class="trade-data-stat"><span>Treasury PND</span><strong data-data-treasury>—</strong><em data-data-treasury-note>Reading Testnet…</em></div>
        <div class="trade-data-stat"><span>Price</span><strong data-data-price>—</strong><em data-data-price-note>No AMM or DEX book</em></div>
        <div class="trade-data-stat"><span>DEX offers</span><strong data-data-offers>—</strong><em data-data-offers-note>book_offers</em></div>
        <div class="trade-data-stat"><span>AMM</span><strong data-data-amm>—</strong><em data-data-amm-note>amm_info</em></div>
        <div class="trade-data-stat"><span>Issuer lines</span><strong data-data-holders>—</strong><em data-data-holders-note>account_lines</em></div>
        <div class="trade-data-stat"><span>Ledger</span><strong data-data-ledger>—</strong><em data-data-ledger-note>validated</em></div>
        <div class="trade-data-stat"><span>Network</span><strong data-data-network>XRPL Testnet</strong><em>Default for this page</em></div>
        <div class="trade-data-stat"><span>Mainnet $PND</span><strong>Not issued</strong><em>Same issuer r-address</em></div>
      </div>
      <div class="trade-data-columns">
        <section class="trade-data-card">
          <div class="trade-data-card-head"><div><p class="trade-kicker">Asset facts</p><h3>Identity and supply</h3></div><span>Validated Testnet</span></div>
          <dl class="trade-data-list">
            <div><dt>Currency</dt><dd>PND</dd></div>
            <div><dt>Issuer</dt><dd class="trade-address" data-issuer-value>rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc</dd></div>
            <div><dt>Treasury</dt><dd class="trade-address" data-treasury-value>rPNDcL2UrGtSoGwruWx6ocMQ6ey8uPZm2b</dd></div>
            <div><dt>Network</dt><dd data-network-label>XRPL Testnet</dd></div>
            <div><dt>Treasury balance</dt><dd data-data-treasury-detail>Reading…</dd></div>
            <div><dt>Mainnet</dt><dd>No $PND issued</dd></div>
          </dl>
        </section>
        <section class="trade-data-card">
          <div class="trade-data-card-head"><div><p class="trade-kicker">Markets</p><h3>AMM and DEX</h3></div><span>Live ledger</span></div>
          <dl class="trade-data-list">
            <div><dt>PND holders (issuer lines)</dt><dd data-data-holders-detail>—</dd></div>
            <div><dt>AMM PND/XRP</dt><dd data-data-amm-detail>—</dd></div>
            <div><dt>DEX offers</dt><dd data-data-offers-detail>—</dd></div>
            <div><dt>$rPND</dt><dd>MPT not issued</dd></div>
            <div><dt>Signing</dt><dd>Off — display only</dd></div>
            <div><dt>Last validated ledger</dt><dd data-data-ledger-detail>—</dd></div>
          </dl>
        </section>
      </div>
      <div class="trade-data-integrity"><span class="trade-check-icon" data-state="ok">✓</span><div><strong data-data-integrity-title>Reading the XRPL Testnet validated ledger.</strong><span data-data-integrity-copy>Faucet XRP is worthless. 100B PND is at the Testnet treasury. Mainnet is not issued.</span></div></div>
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
          <div class="trade-empty-row">No AMM or DEX fills on Testnet yet.</div>
        </div>
        <div class="trade-panel" data-panel="history" hidden><div class="trade-empty-panel"><strong>No trade history</strong><span>The Testnet PND/XRP book is empty. Nothing to list.</span></div></div>
        <div class="trade-panel" data-panel="token" hidden>
          <div class="trade-token-grid">
            <div><span>Asset</span><strong>$PND · issued currency</strong></div>
            <div><span>Currency code</span><strong>PND</strong></div>
            <div><span>Issuer</span><strong class="trade-address" data-issuer-value>Loading issuer…</strong></div>
            <div><span>Testnet treasury</span><strong class="trade-address" data-treasury-value>rPNDcL2UrGtSoGwruWx6ocMQ6ey8uPZm2b</strong></div>
            <div><span>Testnet issued</span><strong>100,000,000,000 PND</strong></div>
            <div><span>$rPND</span><strong>MPT not issued</strong></div>
          </div>
        </div>
        <div class="trade-panel" data-panel="risk" hidden>
          <div class="trade-verification-grid">
            <div><span>Network</span><strong data-network-label>XRPL Testnet</strong></div>
            <div><span>Testnet XRP</span><strong>Faucet-issued, worthless</strong></div>
            <div><span>Mainnet $PND</span><strong>Not issued</strong></div>
            <div><span>Signing</span><strong>Off — this page does not submit</strong></div>
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
    const treasury = root.dataset.treasury && !root.dataset.treasury.includes("{{")
      ? root.dataset.treasury
      : "";
    const state = {
      network: "testnet",
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
        poolTxs: [],
        trades: [],
        poolTxComplete: true,
        treasuryPnd: null,
        treasuryXrpDrops: null,
        treasuryAccount: null,
        walletPnd: null,
        walletXrpDrops: null,
        walletAccount: "",
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
      const liveMarket = Boolean(verification.market);
      const onTestnet = state.network === "testnet";
      root.dataset.marketVerified = String(liveMarket);
      root.dataset.issuerVerified = String(Boolean(verification.issuer));
      root.dataset.marketState = liveMarket ? "live" : "empty";
      const price = liveMarket ? getMarketPrice(verification) : "—";
      setText("[data-issuer-short]", issuer ? shortAccount(issuer) : "Not configured");
      setText("[data-issuer-value]", issuer || "Issuer address not configured");
      setText("[data-treasury-value]", treasury || "Treasury address not configured");
      setText("[data-price]", price);
      setText("[data-price-note]", liveMarket ? "Validated book or AMM" : "No AMM or DEX book");
      const volumeXrp = volume24hXrp(verification.trades || []);
      setText("[data-volume]", volumeXrp > 0 ? `${formatIou(volumeXrp)} XRP` : "—");
      setText("[data-volume-note]", volumeXrp > 0 ? "24h AMM/DEX tape" : liveMarket ? "No 24h tape yet" : "No trades to count");
      setText("[data-chart-source-label]", onTestnet ? "XRPL Testnet" : "XRPL Mainnet");
      setText("[data-chart-symbol-source]", liveMarket ? "XRPL validated ledger" : onTestnet ? "XRPL Testnet" : "XRPL Mainnet");
      setText("[data-chart-stat-status]", liveMarket ? "Live PND/XRP market" : "No AMM or DEX book");
      const status = $("[data-chart-stat-status]");
      if (status) {
        status.classList.toggle("is-gated", !liveMarket);
        status.classList.toggle("is-live", liveMarket);
      }
      updateMarketPanels();
    }

    function getMarketPrice(verification = state.verification) {
      const offer = verification.offers?.[0];
      if (offer) {
        const gets = typeof offer.TakerGets === "string" ? Number(offer.TakerGets) : null;
        const pays = offer.TakerPays && typeof offer.TakerPays.value === "string"
          ? Number(offer.TakerPays.value)
          : null;
        if (Number.isFinite(gets) && Number.isFinite(pays) && pays > 0) {
          return `${(gets / 1000000 / pays).toFixed(8)} XRP`;
        }
      }
      const last = verification.trades?.[0];
      if (last?.price > 0) return `${last.price.toFixed(8)} XRP`;
      const amm = verification.ammInfo?.amm;
      const { xrp, iou } = splitAmmAssets(amm);
      const spot = Number(formatDrops(xrp || "0")) / Number(iou?.value);
      if (Number.isFinite(spot) && spot > 0) return `${spot.toFixed(8)} XRP`;
      return "—";
    }

    function updateMarketPanels() {
      const { ammInfo, offers, market, pndLines = [], issued, treasuryPnd, ledger } = state.verification;
      const onTestnet = state.network === "testnet";
      const treasuryText = treasuryPnd != null ? `${formatIou(treasuryPnd)} PND` : issued ? "Issued" : "Not issued";
      const reserves = ammInfo?.amm ?? ammInfo;
      const ammLabel = reserves
        ? `${formatAssetAmount(reserves.amount)} XRP · ${formatAssetAmount(reserves.amount2)} PND`
        : "No AMM pool";
      setText("[data-treasury-balance]", treasuryText);
      setText("[data-liquidity]", reserves ? formatAssetAmount(reserves.amount) : "—");
      setText("[data-liquidity-note]", reserves ? "Validated AMM reserves" : "No AMM pool");
      setText("[data-amm-status]", ammLabel);
      setText("[data-chart-stat-market-cap]", treasuryText);
      setText("[data-data-treasury]", treasuryText);
      setText("[data-data-treasury-note]", onTestnet ? "gateway_balances / treasury line" : "Mainnet has no $PND issued");
      setText("[data-data-treasury-detail]", treasury ? `${treasuryText} at ${treasury}` : treasuryText);
      setText("[data-data-price]", market ? getMarketPrice(state.verification) : "—");
      setText("[data-data-price-note]", market ? "Validated book or AMM" : "No AMM or DEX book");
      setText("[data-data-offers]", String(offers.length));
      setText("[data-data-offers-note]", "book_offers");
      setText("[data-data-offers-detail]", offers.length ? `${offers.length} validated offer${offers.length === 1 ? "" : "s"}` : "Empty book");
      setText("[data-data-amm]", reserves ? "Pool found" : "None");
      setText("[data-data-amm-note]", "amm_info");
      setText("[data-data-amm-detail]", ammLabel);
      setText("[data-data-holders]", String(pndLines.length));
      setText("[data-data-holders-note]", "issuer account_lines");
      setText("[data-data-holders-detail]", `${pndLines.length} PND line${pndLines.length === 1 ? "" : "s"}`);
      const ledgerIndex = ledger?.seq ? String(ledger.seq) : "—";
      setText("[data-data-ledger]", ledgerIndex);
      setText("[data-data-ledger-detail]", ledgerIndex);
      setText("[data-data-network]", networks[state.network].label);
      setText("[data-honesty]", onTestnet
        ? "XRPL Testnet · $PND issued · 100B at treasury · faucet XRP is worthless · Mainnet not issued"
        : "XRPL Mainnet · $PND is not issued · switch to Testnet to see the issued treasury balance");
      setText("[data-data-integrity-title]", onTestnet
        ? "Reading the XRPL Testnet validated ledger."
        : "Reading XRPL Mainnet. $PND is not issued here.");
      setText("[data-data-integrity-copy]", onTestnet
        ? "Faucet XRP is worthless. 100B PND is at the Testnet treasury. Mainnet is not issued."
        : "Same issuer r-address. No mainnet obligations. Testnet holds the issued 100B.");
      paintAmmCreateBalances();
      paintAmmPools();
      paintDexMarket();
      chartController?.paintLedger?.();
      const emptyRows = root.querySelectorAll(".trade-empty-row");
      const trades = state.verification.trades || [];
      emptyRows.forEach((row) => {
        row.textContent = trades.length
          ? `${trades.length} validated PND/XRP print${trades.length === 1 ? "" : "s"} on ${networks[state.network].label}.`
          : offers.length
            ? `${offers.length} validated XRPL offer${offers.length === 1 ? "" : "s"} on ${networks[state.network].label}.`
            : "No AMM or DEX fills on this network yet.";
      });
    }

    function formatIou(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return String(value ?? "—");
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(n);
    }

    function formatAssetAmount(value) {
      if (value == null) return "—";
      if (typeof value === "string") return formatDrops(value);
      if (typeof value.value === "string") return value.value;
      return "—";
    }

    function escText(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function rippleDate(seconds) {
      const n = Number(seconds);
      if (!Number.isFinite(n)) return "—";
      const iso = new Date((n + 946684800) * 1000).toISOString();
      return `${iso.slice(0, 19).replace("T", " ")} UTC`;
    }

    function tradingFeeLabel(fee) {
      const n = Number(fee);
      if (!Number.isFinite(n)) return "—";
      return `${(n / 1000).toFixed(n % 10 ? 3 : 1)}% · ${n}`;
    }

    function splitAmmAssets(amm) {
      const a = amm?.amount;
      const b = amm?.amount2;
      const isXrp = (value) => typeof value === "string";
      return {
        xrp: isXrp(a) ? a : isXrp(b) ? b : null,
        iou: !isXrp(a) && a ? a : !isXrp(b) && b ? b : null,
      };
    }

    function reserveRatio(xrpDrops, iouValue) {
      try {
        const xrp = Number(formatDrops(xrpDrops));
        const iou = Number(iouValue);
        if (!Number.isFinite(xrp) || !Number.isFinite(iou) || iou <= 0) return "—";
        return `${(xrp / iou).toFixed(8)} XRP / PND`;
      } catch {
        return "—";
      }
    }

    function liveAmmReservePair() {
      const reserves = state.verification.ammInfo?.amm ?? state.verification.ammInfo;
      if (!reserves) return null;
      const { xrp, iou } = splitAmmAssets(reserves);
      let xrpReserve = NaN;
      try {
        xrpReserve = xrp != null ? Number(formatDrops(xrp)) : NaN;
      } catch {
        xrpReserve = NaN;
      }
      const pndReserve = iou?.value != null ? Number(iou.value) : NaN;
      if (!Number.isFinite(xrpReserve) || !Number.isFinite(pndReserve) || xrpReserve <= 0 || pndReserve <= 0) {
        return null;
      }
      return { xrpReserve, pndReserve, xrpPerPnd: xrpReserve / pndReserve };
    }

    function isEvenDeposit() {
      return Boolean($("[data-amm-side='two']")?.classList.contains("is-active"));
    }

    function writeAmmAmount(kind, value) {
      const decimals = kind === "xrp" ? 6 : 6;
      const n = Number(value);
      const text = Number.isFinite(n) && n > 0 ? String(Number(n.toFixed(decimals))) : "0";
      const input = $(kind === "pnd" ? "[data-amm-pnd]" : "[data-amm-xrp]");
      const range = $(kind === "pnd" ? "[data-amm-pnd-range]" : "[data-amm-xrp-range]");
      if (input) input.value = text;
      if (range) range.value = text;
    }

    function ammWalletMaxes() {
      const signedPnd = Number(state.verification.walletPnd);
      let signedXrp = NaN;
      try {
        signedXrp = state.verification.walletXrpDrops != null ? Number(formatDrops(state.verification.walletXrpDrops)) : NaN;
      } catch {
        signedXrp = NaN;
      }
      const rangePnd = Number($("[data-amm-pnd-range]")?.max || 0);
      const rangeXrp = Number($("[data-amm-xrp-range]")?.max || 0);
      return {
        pnd: Number.isFinite(signedPnd) && signedPnd > 0 ? signedPnd : (Number.isFinite(rangePnd) ? rangePnd : 0),
        xrp: Number.isFinite(signedXrp) && signedXrp > 0 ? signedXrp : (Number.isFinite(rangeXrp) ? rangeXrp : 0),
      };
    }

    function coupleEvenDeposit(driver) {
      if (!isEvenDeposit()) return;
      const pair = liveAmmReservePair();
      if (!pair) return;
      const maxes = ammWalletMaxes();
      const clampToMax = (value, max) => {
        const n = Math.max(0, Number(value) || 0);
        if (Number.isFinite(max) && max > 0 && n > max) return max;
        return n;
      };
      let pnd = Number($("[data-amm-pnd]")?.value) || 0;
      let xrp = Number($("[data-amm-xrp]")?.value) || 0;
      if (driver === "xrp") {
        xrp = clampToMax(xrp, maxes.xrp);
        pnd = xrp / pair.xrpPerPnd;
        if (maxes.pnd > 0 && pnd > maxes.pnd) {
          pnd = maxes.pnd;
          xrp = pnd * pair.xrpPerPnd;
        }
      } else {
        pnd = clampToMax(pnd, maxes.pnd);
        xrp = pnd * pair.xrpPerPnd;
        if (maxes.xrp > 0 && xrp > maxes.xrp) {
          xrp = maxes.xrp;
          pnd = xrp / pair.xrpPerPnd;
        }
      }
      writeAmmAmount("pnd", pnd);
      writeAmmAmount("xrp", xrp);
    }

    function txRecord(item) {
      const tx = item?.tx || item?.tx_json || {};
      const meta = item?.meta || {};
      return {
        type: tx.TransactionType || "—",
        date: tx.date,
        result: meta.TransactionResult || "—",
        hash: tx.hash || item?.hash || "",
        ledger: item?.ledger_index || tx.ledger_index,
      };
    }

    const RIPPLE_EPOCH = 946684800;

    function parseLedgerAmount(value) {
      if (value == null) return null;
      if (typeof value === "string") {
        const drops = Number(value);
        if (!Number.isFinite(drops)) return null;
        return { asset: "XRP", xrp: drops / 1_000_000 };
      }
      if (value.currency === "PND" && value.value != null) {
        const n = Number(value.value);
        if (!Number.isFinite(n)) return null;
        return { asset: "PND", value: n };
      }
      return null;
    }

    function ledgerTrade(item) {
      const tx = item?.tx || item?.tx_json || {};
      const meta = item?.meta || {};
      if (meta.TransactionResult && meta.TransactionResult !== "tesSUCCESS") return null;
      if (tx.TransactionType !== "Payment") return null;
      const delivered = parseLedgerAmount(meta.delivered_amount ?? meta.DeliveredAmount ?? tx.Amount);
      const sendMax = parseLedgerAmount(tx.SendMax);
      let xrp = 0;
      let pnd = 0;
      let side = "buy";
      if (delivered?.asset === "XRP" && sendMax?.asset === "PND") {
        xrp = delivered.xrp;
        pnd = sendMax.value;
        side = "sell";
      } else if (delivered?.asset === "PND" && sendMax?.asset === "XRP") {
        pnd = delivered.value;
        xrp = sendMax.xrp;
        side = "buy";
      } else {
        return null;
      }
      if (!(xrp > 0) || !(pnd > 0)) return null;
      const date = Number(tx.date);
      return {
        type: "Payment",
        side,
        xrp,
        pnd,
        price: xrp / pnd,
        date,
        time: Number.isFinite(date) ? (date + RIPPLE_EPOCH) * 1000 : null,
        hash: tx.hash || item?.hash || "",
      };
    }

    function ledgerTrades(items = []) {
      return items.map(ledgerTrade).filter(Boolean);
    }

    function volume24hXrp(trades = []) {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return trades.reduce((sum, trade) => sum + (trade.time && trade.time >= cutoff ? trade.xrp : 0), 0);
    }

    const CANDLE_MS = { "1m": 60_000, "5m": 5 * 60_000, "15m": 15 * 60_000, "30m": 30 * 60_000 };

    function printsToCandles(prints = [], intervalMs) {
      if (!intervalMs || !prints.length) return [];
      const buckets = new Map();
      [...prints]
        .filter((print) => print.time && Number.isFinite(print.price ?? print.value))
        .sort((a, b) => a.time - b.time)
        .forEach((print) => {
          const start = Math.floor(print.time / intervalMs) * intervalMs;
          const price = Number(print.price ?? print.value);
          const volume = Number(print.xrp ?? print.volume) || 0;
          const bucket = buckets.get(start);
          if (!bucket) {
            buckets.set(start, {
              time: start,
              open: price,
              high: price,
              low: price,
              close: price,
              volume,
              prints: 1,
              value: price,
            });
            return;
          }
          bucket.high = Math.max(bucket.high, price);
          bucket.low = Math.min(bucket.low, price);
          bucket.close = price;
          bucket.value = price;
          bucket.volume += volume;
          bucket.prints += 1;
        });
      return [...buckets.values()].sort((a, b) => a.time - b.time);
    }

    function paintAmmPools() {
      const list = $("[data-amm-pools]");
      const activity = $("[data-amm-activity]");
      if (!list) return;
      const { ammInfo, poolTxs = [], poolTxComplete = true, ledger } = state.verification;
      const amm = ammInfo?.amm || null;
      const networkLabel = networks[state.network].label;
      if (!amm) {
        list.innerHTML = `
          <p class="trade-amm-pools-empty">No PND/XRP AMM on ${escText(networkLabel)} yet. This page will not invent a pool or a last price.</p>
          <p class="trade-amm-pools-note">$rPND is not issued. No rPND pool.</p>`;
        if (activity) {
          activity.innerHTML = `<p class="trade-amm-pools-empty">No validated AMM transactions on ${escText(networkLabel)}.</p>`;
        }
        return;
      }
      const { xrp, iou } = splitAmmAssets(amm);
      const pndValue = iou?.value;
      const created = poolTxs.map(txRecord).find((row) => row.type === "AMMCreate") || poolTxs.map(txRecord)[0];
      const txCount = poolTxComplete ? String(poolTxs.length) : `${poolTxs.length}+`;
      const lp = amm.lp_token;
      const auction = amm.auction_slot;
      const votes = Array.isArray(amm.vote_slots) ? amm.vote_slots : [];
      const voteHtml = votes.length
        ? votes.map((vote) => `${escText(shortAccount(vote.account))} · fee ${escText(tradingFeeLabel(vote.trading_fee))} · weight ${escText(vote.vote_weight)}`).join("<br>")
        : "—";
      list.innerHTML = `
        <article class="trade-amm-pool-card">
          <header class="trade-amm-pool-head">
            <div>
              <strong>$PND / XRP</strong>
              <span>${escText(networkLabel)} · validated amm_info</span>
            </div>
            <code class="trade-amm-pool-account">${escText(amm.account || "—")}</code>
          </header>
          <dl class="trade-amm-pool-hero">
            <div><dt>Total locked</dt><dd>${escText(pndValue != null ? `${formatIou(pndValue)} PND` : "—")} + ${escText(xrp != null ? `${formatDrops(xrp)} XRP` : "—")}</dd></div>
            <div><dt>XRP worth</dt><dd>${escText(xrp != null ? `${formatDrops(xrp)} XRP` : "—")}<em>XRP reserve, not a USD print</em></dd></div>
            <div><dt>Date created</dt><dd>${escText(created ? rippleDate(created.date) : "—")}<em>AMMCreate close time</em></dd></div>
            <div><dt>Transactions</dt><dd>${escText(txCount)}<em>account_tx${poolTxComplete ? "" : " · truncated"}</em></dd></div>
          </dl>
          <dl class="trade-amm-pool-facts">
            <div><dt>PND reserve</dt><dd>${escText(pndValue != null ? formatIou(pndValue) : "—")}</dd></div>
            <div><dt>XRP reserve</dt><dd>${escText(xrp != null ? formatDrops(xrp) : "—")}</dd></div>
            <div><dt>Reserve ratio</dt><dd>${escText(reserveRatio(xrp, pndValue))}</dd></div>
            <div><dt>Trading fee</dt><dd>${escText(tradingFeeLabel(amm.trading_fee))}</dd></div>
            <div><dt>LP tokens</dt><dd>${escText(lp?.value != null ? formatIou(lp.value) : "—")}</dd></div>
            <div><dt>LP issuer</dt><dd>${escText(lp?.issuer || "—")}</dd></div>
            <div><dt>Pool account</dt><dd>${escText(amm.account || "—")}</dd></div>
            <div><dt>PND issuer</dt><dd>${escText(iou?.issuer || issuer || "—")}</dd></div>
            <div><dt>Asset2 frozen</dt><dd>${amm.asset2_frozen ? "Yes" : "No"}</dd></div>
            <div><dt>Ledger</dt><dd>${escText(ammInfo.ledger_index || ledger?.seq || "—")}</dd></div>
            <div><dt>Auction</dt><dd>${escText(auction?.account ? `${shortAccount(auction.account)} · exp ${String(auction.expiration || "—").replace("T", " ").replace("+0000", " UTC")}` : "—")}</dd></div>
            <div><dt>Vote slots</dt><dd>${voteHtml}</dd></div>
          </dl>
          <p class="trade-amm-pools-note">$rPND is not issued. No rPND pool.</p>
        </article>`;
      if (activity) {
        const rows = poolTxs.map(txRecord);
        activity.innerHTML = rows.length
          ? `<ol class="trade-amm-tx-list">${rows.map((row) => `<li><strong>${escText(row.type)}</strong><span>${escText(rippleDate(row.date))}</span><em>${escText(row.result)}</em>${row.hash ? `<code>${escText(row.hash)}</code>` : ""}</li>`).join("")}</ol>`
          : `<p class="trade-amm-pools-empty">Pool ${escText(amm.account)} has no account_tx rows yet.</p>`;
      }
    }

    function paintDexMarket() {
      const empty = $("[data-dex-empty]");
      const live = $("[data-dex-live]");
      const bookWrap = $("[data-dex-book-wrap]");
      const book = $("[data-dex-book]");
      const tape = $("[data-dex-tape]");
      if (!empty || !live) return;
      const { offers = [], trades = [] } = state.verification;
      const hasMarket = offers.length > 0 || trades.length > 0;
      empty.hidden = hasMarket;
      live.hidden = !hasMarket;
      live.classList.toggle("is-tape-only", offers.length === 0);
      if (bookWrap) bookWrap.hidden = offers.length === 0;
      if (book) {
        book.innerHTML = offers.length
          ? offers.map((offer) => {
              const gets = typeof offer.TakerGets === "string" ? Number(offer.TakerGets) / 1_000_000 : Number(offer.TakerGets?.value);
              const pays = typeof offer.TakerPays === "string" ? Number(offer.TakerPays) / 1_000_000 : Number(offer.TakerPays?.value);
              const xrp = typeof offer.TakerGets === "string" ? gets : pays;
              const pnd = typeof offer.TakerGets === "string" ? pays : gets;
              const price = pnd > 0 && Number.isFinite(xrp) ? xrp / pnd : null;
              return `<li><strong>${escText(price != null ? `${price.toFixed(8)} XRP` : "—")}</strong><span>${escText(Number.isFinite(pnd) ? `${formatIou(pnd)} PND` : "—")}</span><em>${escText(Number.isFinite(xrp) ? `${formatIou(xrp)} XRP` : "—")}</em></li>`;
            }).join("")
          : "";
      }
      if (tape) {
        tape.innerHTML = trades.length
          ? trades.slice(0, 24).map((trade) => `<li data-side="${escText(trade.side === "buy" ? "buy" : "sell")}"><strong>${escText(trade.side === "buy" ? "Buy" : "Sell")}</strong><span>${escText(`${trade.price.toFixed(8)} XRP`)}</span><em>${escText(`${formatIou(trade.pnd)} PND · ${formatIou(trade.xrp)} XRP`)}</em><time>${escText(rippleDate(trade.date))}</time></li>`).join("")
          : "<li>No validated AMM/DEX prints yet.</li>";
      }
      $$("[data-dex-sell-note]").forEach((sellNote) => {
        sellNote.textContent = hasMarket
          ? "Display only. No signing. Live Testnet book and AMM tape are on the left."
          : "Display only. No signing. The Testnet PND/XRP book is empty.";
      });
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
        amm: "AMM · Testnet ledger",
        dex: (state.verification.offers || []).length || (state.verification.trades || []).length
          ? "DEX · live book"
          : "DEX · empty book",
        chart: "PND / XRP · Testnet ledger",
        data: "Data · live Testnet read",
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
        const suffix = asset === "rPND"
          ? `rPND is not issued. Period ${period} has no MPT tape.`
          : `${asset} snapshot from the validated ${networks[state.network].label} · ${period}`;
        const integrity = dataView?.querySelector("[data-data-integrity-title]");
        const detail = dataView?.querySelector("[data-data-integrity-copy]");
        if (integrity) {
          integrity.textContent = state.network === "testnet"
            ? "Reading the XRPL Testnet validated ledger."
            : "Reading XRPL Mainnet. $PND is not issued here.";
        }
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
      $$("[data-dex-order-status]").forEach((status) => {
        status.dataset.state = kind;
        status.textContent = message;
      });
    }

    function shortAccount(addr) {
      return addr && addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr || "";
    }

    function xamanAccount() {
      const session = window.PondSession?.current?.();
      return session?.method === "xaman" ? session.address || "" : "";
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
      if (connected) {
        setOrderStatus("Wallet connected for display. This terminal still does not sign or submit.", "ready");
      } else {
        setOrderStatus("Unsigned preview. This terminal does not sign or submit OfferCreate.");
      }
    }

    function setupWallet() {
      const connectButtons = $$("[data-wallet-connect]");
      const connector = $("#pond-wallet-connector");
      if (!connectButtons.length || !connector) return null;

      let manager = null;
      let managerNetwork = null;
      let generation = 0;

      const createManager = () => {
        const api = window.XRPLConnect;
        if (!api?.WalletManager || !api?.WalletConnectAdapter) {
          throw new Error("WalletConnect could not load. Try again.");
        }
        const projectId = window.PondSession?.walletConnectProjectId?.();
        if (!projectId) throw new Error("WalletConnect is not configured.");
        const adapter = new api.WalletConnectAdapter({
          projectId,
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
          if (!window.PondSession?.walletConnectProjectId?.()) {
            await window.PondSession?.refresh?.();
          }
          await ensureWcScripts();
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

    function paintAmmCreateBalances() {
      const onTestnet = state.network === "testnet";
      const pnd = state.verification.treasuryPnd;
      const xrpDrops = state.verification.treasuryXrpDrops;
      setText("[data-amm-live-pnd]", pnd != null ? `${formatIou(pnd)} PND` : "Reading…");
      setText("[data-amm-live-xrp]", xrpDrops != null ? `${formatDrops(xrpDrops)} XRP` : "Reading…");
      const session = window.PondSession?.current?.();
      const signed = session?.method === "xaman" ? session.address || "" : "";
      const sessionEl = $("[data-amm-session]");
      if (sessionEl) {
        if (!onTestnet) {
          sessionEl.textContent = "AMMDeposit is Testnet only. Switch back to Testnet.";
        } else if (!signed) {
          sessionEl.textContent = "Sign in with Xaman to deposit from that wallet.";
        } else {
          sessionEl.textContent = `Signed in as ${shortAccount(signed)}. AMMDeposit.Account will be this address.`;
        }
      }
      const walletPnd = state.verification.walletPnd;
      const walletXrp = state.verification.walletXrpDrops;
      setText("[data-amm-wallet-pnd]", !signed ? "Sign in to read" : walletPnd != null ? `${formatIou(walletPnd)} PND` : "Reading…");
      setText("[data-amm-wallet-xrp]", !signed ? "Sign in to read" : walletXrp != null ? `${formatDrops(walletXrp)} XRP` : "Reading…");
      const send = $("[data-amm-send]");
      if (send) send.disabled = !onTestnet;
      const { ammInfo, offers = [], market, ledger } = state.verification;
      const reserves = ammInfo?.amm ?? ammInfo;
      setText("[data-amm-stat-pool]", reserves ? "Pool found" : "No AMM pool");
      setText(
        "[data-amm-stat-pool-note]",
        reserves
          ? `${formatAssetAmount(reserves.amount)} · ${formatAssetAmount(reserves.amount2)}`
          : "amm_info · no pool yet",
      );
      setText("[data-amm-pool-account]", reserves?.account || "—");
      setText("[data-amm-stat-dex]", String(offers.length));
      setText("[data-amm-stat-price]", market ? getMarketPrice(state.verification) : "—");
      setText("[data-amm-stat-price-note]", market ? "Validated book or AMM" : "No AMM or DEX book");
      setText("[data-amm-stat-ledger]", ledger?.seq ? String(ledger.seq) : "—");
      syncAmmSliders();
    }

    function syncAmmSliders() {
      const pndRange = $("[data-amm-pnd-range]");
      const xrpRange = $("[data-amm-xrp-range]");
      const pndInput = $("[data-amm-pnd]");
      const xrpInput = $("[data-amm-xrp]");
      const pndMax = Number(state.verification.walletPnd);
      const xrpMax = state.verification.walletXrpDrops != null ? Number(formatDrops(state.verification.walletXrpDrops)) : 0;
      if (pndRange) pndRange.max = Number.isFinite(pndMax) && pndMax > 0 ? String(pndMax) : "0";
      if (xrpRange) xrpRange.max = Number.isFinite(xrpMax) && xrpMax > 0 ? String(xrpMax) : "0";
      const cap = (input, range, max) => {
        if (!input) return;
        const n = Number(input.value);
        if (Number.isFinite(n) && Number.isFinite(max) && max >= 0 && n > max) input.value = String(max);
        if (range) range.value = input.value || "0";
      };
      cap(pndInput, pndRange, Number(pndRange?.max || 0));
      cap(xrpInput, xrpRange, Number(xrpRange?.max || 0));
      if (isEvenDeposit()) coupleEvenDeposit(Number(pndInput?.value) > 0 ? "pnd" : "xrp");
    }

    function setupAmmCreate() {
      const mount = $("[data-amm-xaman]");
      const send = $("[data-amm-send]");
      const status = $("[data-amm-create-status]");
      if (!send || !mount) return;
      let pollTimer = 0;
      let side = "two";
      let singleAsset = "PND";
      const esc = (value) =>
        String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      const setAmmStatus = (message, kind = "neutral") => {
        if (!status) return;
        status.dataset.state = kind;
        status.textContent = message;
      };
      const stopPoll = () => {
        if (pollTimer) window.clearInterval(pollTimer);
        pollTimer = 0;
      };
      const paintSide = () => {
        $$("[data-amm-side]").forEach((button) => {
          button.classList.toggle("is-active", button.dataset.ammSide === side);
        });
        const single = $("[data-amm-single]");
        if (single) single.hidden = side !== "single";
        $$("[data-amm-single-asset]").forEach((button) => {
          button.classList.toggle("is-active", button.dataset.ammSingleAsset === singleAsset);
        });
        const note = $("[data-amm-side-note]");
        if (note) {
          const pair = liveAmmReservePair();
          note.textContent = side === "two"
            ? pair
              ? `tfTwoAsset · paired at ${pair.xrpPerPnd.toFixed(8)} XRP / PND`
              : "tfTwoAsset · both assets"
            : `tfSingleAsset · ${singleAsset} only`;
        }
        const pndRow = $("[data-amm-pnd-row]");
        const xrpRow = $("[data-amm-xrp-row]");
        const pndOn = side === "two" || singleAsset === "PND";
        const xrpOn = side === "two" || singleAsset === "XRP";
        if (pndRow) pndRow.classList.toggle("is-off", !pndOn);
        if (xrpRow) xrpRow.classList.toggle("is-off", !xrpOn);
        ["data-amm-pnd", "data-amm-pnd-range"].forEach((key) => {
          const node = $(`[${key}]`);
          if (node) node.disabled = !pndOn;
        });
        ["data-amm-xrp", "data-amm-xrp-range"].forEach((key) => {
          const node = $(`[${key}]`);
          if (node) node.disabled = !xrpOn;
        });
        if (!pndOn) {
          if ($("[data-amm-pnd]")) $("[data-amm-pnd]").value = "0";
          if ($("[data-amm-pnd-range]")) $("[data-amm-pnd-range]").value = "0";
        }
        if (!xrpOn) {
          if ($("[data-amm-xrp]")) $("[data-amm-xrp]").value = "0";
          if ($("[data-amm-xrp-range]")) $("[data-amm-xrp-range]").value = "0";
        }
        if (side === "two") {
          const pnd = Number($("[data-amm-pnd]")?.value) || 0;
          const xrp = Number($("[data-amm-xrp]")?.value) || 0;
          if (pnd > 0) coupleEvenDeposit("pnd");
          else if (xrp > 0) coupleEvenDeposit("xrp");
        }
      };
      let coupling = false;
      const bindPairedSlider = (rangeSel, inputSel, driver) => {
        const range = $(rangeSel);
        const input = $(inputSel);
        if (!range || !input) return;
        const paint = (fromRange) => {
          if (coupling) return;
          coupling = true;
          if (fromRange) input.value = range.value;
          else range.value = input.value || "0";
          coupleEvenDeposit(driver);
          coupling = false;
        };
        range.addEventListener("input", () => paint(true));
        input.addEventListener("input", () => paint(false));
      };
      const bindSlider = (rangeSel, inputSel, labelSel, format) => {
        const range = $(rangeSel);
        const input = $(inputSel);
        if (!range || !input) return;
        const paint = (fromRange) => {
          if (fromRange) input.value = range.value;
          else range.value = input.value || "0";
          if (labelSel) setText(labelSel, format(input.value));
        };
        range.addEventListener("input", () => paint(true));
        input.addEventListener("input", () => paint(false));
      };
      bindPairedSlider("[data-amm-pnd-range]", "[data-amm-pnd]", "pnd");
      bindPairedSlider("[data-amm-xrp-range]", "[data-amm-xrp]", "xrp");
      bindSlider("[data-amm-fee-range]", "[data-amm-fee]", "[data-amm-fee-label]", (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? `${(n / 1000).toFixed(n % 10 ? 3 : 1)}%` : "0%";
      });
      $$("[data-amm-side]").forEach((button) => {
        button.addEventListener("click", () => {
          side = button.dataset.ammSide === "single" ? "single" : "two";
          paintSide();
        });
      });
      $$("[data-amm-single-asset]").forEach((button) => {
        button.addEventListener("click", () => {
          singleAsset = button.dataset.ammSingleAsset === "XRP" ? "XRP" : "PND";
          paintSide();
        });
      });
      const paintPayload = (payload) => {
        const form = mount.closest(".trade-amm-create");
        if (form) form.dataset.ammWait = "1";
        mount.innerHTML = `
          <div class="session-xaman-panel" data-amm-wait>
            <p class="session-xaman-heading">Sign Testnet AMMDeposit in Xaman</p>
            ${
              payload.qr
                ? `<img class="session-xaman-qr" src="${esc(payload.qr)}" width="148" height="148" alt="Xaman official AMMDeposit QR">`
                : `<p class="session-xaman-pending">Preparing official Xaman payload…</p>`
            }
            <p class="session-xaman-actions">
              ${payload.next ? `<a class="session-xaman-open" href="${esc(payload.next)}" target="_blank" rel="noopener noreferrer">Open in Xaman</a>` : ""}
            </p>
            <p class="session-xaman-fine">Official Xaman. Pond never asks for a seed. Xaman submits after you sign.</p>
          </div>`;
        mount.querySelector("[data-amm-wait]")?.scrollIntoView({ block: "nearest", inline: "nearest" });
      };
      const pollPayload = (payload) => {
        stopPoll();
        const expiresAt = Number(payload.expiresAt) || Date.now() + 15 * 60 * 1000;
        pollTimer = window.setInterval(async () => {
          if (Date.now() > expiresAt) {
            stopPoll();
            setAmmStatus("AMMDeposit request expired. Start again.", "error");
            return;
          }
          try {
            const response = await fetch(`/api/xaman/payload/${encodeURIComponent(payload.uuid)}`, {
              headers: { Accept: "application/json" },
              credentials: "same-origin",
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) return;
            if (data.dispatchedResult === "tesSUCCESS") {
              stopPoll();
              setAmmStatus("tesSUCCESS. Refreshing amm_info.", "ready");
              refresh();
              return;
            }
            if (data.signed) {
              stopPoll();
              setAmmStatus(
                data.dispatchedResult
                  ? `Signed. Xaman result ${data.dispatchedResult}. Refreshing amm_info.`
                  : "Signed. Waiting for Xaman to submit on Testnet. Refreshing amm_info.",
                "ready",
              );
              refresh();
              return;
            }
            if (data.cancelled || data.expired) {
              stopPoll();
              setAmmStatus(data.cancelled ? "AMMDeposit cancelled in Xaman." : "AMMDeposit expired.", "error");
            }
          } catch {
            /* keep QR; next tick retries */
          }
        }, 2500);
      };
      send.addEventListener("click", async () => {
        if (state.network !== "testnet") {
          setAmmStatus("AMMDeposit is Testnet only. No mainnet AMMDeposit.", "error");
          return;
        }
        if (xamanAccount() === "") {
          setAmmStatus("Sign in with official Xaman first. WalletConnect cannot send AMMDeposit.", "error");
          return;
        }
        if (!state.verification.amm) {
          setAmmStatus("No PND/XRP pool to deposit into. This Add form does not AMMCreate.", "error");
          return;
        }
        send.disabled = true;
        setAmmStatus("Creating official Xaman AMMDeposit payload…", "loading");
        try {
          const response = await fetch("/api/xaman/ammdeposit", {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              network: "testnet",
              returnTo: "/trade/",
              side,
              asset: singleAsset,
              pnd: $("[data-amm-pnd]")?.value || "0",
              xrp: $("[data-amm-xrp]")?.value || "0",
            }),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.message || "Xaman did not create AMMDeposit.");
          paintPayload(data);
          setAmmStatus("Scan the QR or Open in Xaman. Unsigned AMMDeposit. Xaman submits after you sign.", "ready");
          pollPayload(data);
        } catch (error) {
          mount.innerHTML = "";
          mount.closest(".trade-amm-create")?.removeAttribute("data-amm-wait");
          setAmmStatus(error.message || "Could not start AMMDeposit.", "error");
        } finally {
          send.disabled = state.network !== "testnet";
        }
      });
      window.addEventListener("pond:session-change", () => {
        if (document.body.contains(root)) {
          paintAmmCreateBalances();
          refresh();
        }
      });
      paintSide();
      paintAmmCreateBalances();
    }

    function setupDexOrder() {
      const tickets = $$("[data-order-ticket]");
      if (!tickets.length) return;
      tickets.forEach((root) => {
        const price = root.querySelector("[data-dex-price]");
        const amount = root.querySelector("[data-dex-amount]");
        const total = root.querySelector("[data-dex-total]");
        const submit = root.querySelector("[data-dex-submit]");
        const orderKindButtons = [...root.querySelectorAll("[data-order-kind]")];
        if (!price || !amount || !total || !submit) return;
        let orderKind = "limit";
        const updateTotal = () => {
          if (orderKind === "market") {
            price.disabled = true;
            price.value = "";
            total.textContent = "Best available";
          } else {
            price.disabled = false;
            try {
              const drops = decimalMultiply(price.value, amount.value, 6);
              total.textContent = drops > 0n ? `${formatDrops(drops)} XRP` : "—";
            } catch {
              total.textContent = "—";
            }
          }
        };
        price.addEventListener("input", updateTotal);
        amount.addEventListener("input", updateTotal);
        orderKindButtons.forEach((button) => {
          button.addEventListener("click", () => {
            orderKind = button.dataset.orderKind || "limit";
            const group = button.closest("[data-order-kind-group]");
            (group ? [...group.querySelectorAll("[data-order-kind]")] : orderKindButtons)
              .forEach((item) => item.classList.toggle("is-active", item === button));
            updateTotal();
            setOrderStatus(
              orderKind === "market"
                ? "No Testnet book to take. Market preview stays blank. This terminal does not sign or submit."
                : "Unsigned preview. Enter numbers to size a ticket. Nothing is signed or submitted.",
            );
          });
        });
        submit.addEventListener("click", () => {
          setOrderStatus("Unsigned preview. This terminal does not sign or submit.", "gated");
        });
        updateTotal();
      });
    }

    function setupChartControls() {
      const pairLabels = {
        "xrp-usd": "XRP / USD",
        "pnd-xrp": "PND / XRP",
        "pnd-usd": "PND / USD",
      };
      const rangeDays = { "1m": 1, "5m": 1, "15m": 1, "30m": 1, "1h": 1, "4h": 2, "1d": 7, "1w": 7, all: 365 };
      const rangePoints = { "1m": 288, "5m": 288, "15m": 96, "30m": 48, "1h": 48, "4h": 96, "1d": 168, "1w": 336, all: 365 };
      const rangeLabels = { "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m", "1h": "1H", "4h": "4H", "1d": "1D", "1w": "1W", all: "All" };
       const chartState = { pair: "pnd-xrp", range: "1m", indicator: "bollinger", data: null };
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
        status.textContent = live ? "Live XRP / USD (CoinGecko)" : "No AMM or DEX book";
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
          setText("[data-chart-symbol-source]", chartState.pair === "xrp-usd" ? "CoinGecko · XRP only" : "XRPL Testnet");
          setText("[data-chart-symbol]", label);
          setText("[data-chart-timeframe]", rangeLabels[chartState.range]);
          setText("[data-chart-pair-label]", chartState.pair === "xrp-usd" ? `${label} · CoinGecko (not PND)` : `${label} · Testnet ledger`);
          setText("[data-chart-legend-primary]", label);
          if (chartState.pair === "xrp-usd") {
            loadXrpData();
          } else {
            paintLedgerChart();
          }
        });
      });

      rangeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          chartState.range = button.dataset.chartRange || "1h";
          setText("[data-chart-timeframe]", rangeLabels[chartState.range]);
          if (chartState.pair === "xrp-usd") loadXrpData();
          else paintLedgerChart();
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
            ? "Overlay is a moving average of validated PND/XRP prints, not invented candles."
            : "PND/XRP plots validated AMM/DEX prints. No invented candles.",
        );
        if (chartState.data) renderChart();
      });

      function renderChart() {
        const candles = chartState.data?.candles || [];
        const points = candles.length ? candles : (chartState.data?.points || []);
        if (!points.length) return;
        const values = points.map((point) => point.value);
        const volumes = points.map((point) => point.volume || 0);
        const width = 1000;
        const height = 480;
        const left = 58;
        const right = 18;
        const top = 14;
        const plotRight = width - right;
        const volumeTop = 408;
        const volumeBottom = 458;
        const priceBottom = 392;
        const lows = points.map((point) => Number.isFinite(point.low) ? point.low : point.value);
        const highs = points.map((point) => Number.isFinite(point.high) ? point.high : point.value);
        const minValue = Math.min(...lows, ...values);
        const maxValue = Math.max(...highs, ...values);
        const padding = Math.max((maxValue - minValue) * 0.08, maxValue * 0.002, 0.000001);
        const low = minValue - padding;
        const high = maxValue + padding;
        const count = Math.max(points.length, 1);
        const slot = (plotRight - left) / count;
        const x = (index) => left + slot * index + slot / 2;
        const y = (value) => priceBottom - ((value - low) / Math.max(high - low, 0.000001)) * (priceBottom - top);
        const pricePath = values.length > 1 ? pathFor(values, x, y) : "";
        const areaPath = values.length > 1 ? `${pricePath} L ${x(values.length - 1)} ${priceBottom} L ${x(0)} ${priceBottom} Z` : "";
        const grid = [];
        for (let index = 0; index < 5; index += 1) {
          const gridY = top + (index / 4) * (priceBottom - top);
          const gridValue = high - (index / 4) * (high - low);
          grid.push(`<line class="trade-chart-grid-line" x1="${left}" x2="${plotRight}" y1="${gridY}" y2="${gridY}"/>`);
          grid.push(svgText(plotRight + 8, gridY + 3, formatAxis(gridValue), "trade-chart-axis-label"));
        }
        for (let index = 0; index <= 6; index += 1) {
          const gridX = left + (index / 6) * (plotRight - left);
          grid.push(`<line class="trade-chart-vertical-grid" x1="${gridX}" x2="${gridX}" y1="${top}" y2="${volumeBottom}"/>`);
        }
        const labelIndexes = points.length === 1 ? [0] : [0, Math.floor((points.length - 1) / 2), points.length - 1];
        const labels = labelIndexes
          .map((index) => svgText(x(index), height - 3, new Date(points[index].time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }), "trade-chart-axis-label", index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"))
          .join("");
        const indicator = chartState.indicator;
        const sma = movingAverage(values, 20);
        const ema = exponentialAverage(values, 20);
        const macdFast = exponentialAverage(values, 12);
        const macdSlow = exponentialAverage(values, 26);
        const macd = values.map((_, index) => (macdFast[index] == null || macdSlow[index] == null ? null : macdFast[index] - macdSlow[index]));
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
        const maxVolume = Math.max(...volumes, 1);
        const volumeBars = volumes
          .map((volume, index) => {
            const barWidth = Math.max(2, slot * 0.62);
            const barHeight = Math.max(1, (volume / maxVolume) * (volumeBottom - volumeTop - 5));
            const direction = index === 0 || values[index] >= values[index - 1] ? "is-up" : "is-down";
            return `<rect class="trade-chart-volume ${direction}" x="${x(index) - barWidth / 2}" y="${volumeBottom - barHeight}" width="${barWidth}" height="${barHeight}" rx="1"/>`;
          })
          .join("");
        let indicatorPaths = "";
        if (values.length > 1) {
          if (indicator === "sma") indicatorPaths = `<path class="trade-chart-indicator" d="${pathFor(sma, x, y)}"/>`;
          if (indicator === "ema") indicatorPaths = `<path class="trade-chart-indicator is-secondary" d="${pathFor(ema, x, y)}"/>`;
          if (indicator === "bollinger") {
            indicatorPaths = `<path class="trade-chart-indicator" d="${pathFor(upper, x, y)}"/><path class="trade-chart-indicator is-secondary" d="${pathFor(lower, x, y)}"/>`;
          }
        }
        const candleBodies = candles.map((candle, index) => {
          const cx = x(index);
          const barWidth = Math.max(3, slot * 0.58);
          const up = candle.close >= candle.open;
          const bodyTop = y(Math.max(candle.open, candle.close));
          const bodyBot = y(Math.min(candle.open, candle.close));
          const direction = up ? "is-up" : "is-down";
          return `<line class="trade-chart-wick ${direction}" x1="${cx}" x2="${cx}" y1="${y(candle.high)}" y2="${y(candle.low)}"/><rect class="trade-chart-candle ${direction}" x="${cx - barWidth / 2}" y="${bodyTop}" width="${barWidth}" height="${Math.max(1.2, bodyBot - bodyTop)}" rx="0.7"/>`;
        }).join("");
        const overlayPath = overlay.getAttribute("aria-pressed") === "true" && values.length > 1
          ? `<path class="trade-chart-overlay-line" d="${pathFor(sma, x, y)}"/>`
          : "";
        const lineLayer = candles.length
          ? candleBodies
          : `${areaPath ? `<path class="trade-chart-area" d="${areaPath}"/>` : ""}${pricePath ? `<path class="trade-chart-price" d="${pricePath}"/>` : ""}`;
        const volumeLabel = svgText(left, volumeTop + 11, "VOLUME", "trade-chart-panel-label");
        const divider = `<line class="trade-chart-panel-divider" x1="${left}" x2="${plotRight}" y1="${volumeTop - 8}" y2="${volumeTop - 8}"/>`;
        svg.innerHTML = `${grid.join("")}${divider}${volumeLabel}${lineLayer}${indicatorPaths}${overlayPath}${volumeBars}${labels}`;
        liveChart.hidden = false;
        emptyChart.hidden = true;
        setText("[data-chart-stat-sma]", formatAxis(sma[sma.length - 1]));
        setText("[data-chart-stat-rsi]", Number.isFinite(rsi[rsi.length - 1]) ? rsi[rsi.length - 1].toFixed(1) : "—");
        setText("[data-chart-stat-macd]", Number.isFinite(macd[macd.length - 1]) ? macd[macd.length - 1].toFixed(4) : "—");
        setText("[data-chart-symbol-price]", formatAxis(chartState.data.livePrice));
        setText("[data-chart-symbol-change]", formatPercent(chartState.data.change));
      }

      const formatAxis = (value) => {
        if (!Number.isFinite(value)) return "—";
        if (chartState.data?.quote === "XRP") {
          return `${value.toFixed(value >= 1 ? 4 : 8)} XRP`;
        }
        return formatUsd(value);
      };

      function paintLedgerChart() {
        const label = pairLabels[chartState.pair] || "PND / XRP";
        const trades = state.verification.trades || [];
        const offers = state.verification.offers || [];
        const hasMarket = Boolean(state.verification.market) || trades.length > 0 || offers.length > 0;
        setText("[data-chart-symbol]", label);
        setText("[data-chart-timeframe]", rangeLabels[chartState.range]);
        setText("[data-chart-pair-label]", `${label} · Testnet ledger`);
        setText("[data-chart-legend-primary]", label);
        setText("[data-chart-symbol-source]", "XRPL validated ledger");
        setText("[data-chart-source-label]", "XRPL Testnet prints");
        setText("[data-chart-source]", "Source: XRPL Testnet validated prints");
        setText("[data-chart-indicator-note]", "Indicators are computed from validated PND/XRP prints. Not invented candles.");
        if (!hasMarket) {
          chartState.data = null;
          resetChartStats();
          setChartEmpty(
            `No ${label} candles on Testnet`,
            "There is no AMM or DEX book to plot. Last price, volume, and candles stay blank.",
          );
          return;
        }
        const windows = { "1m": 6 * 60 * 60 * 1000, "5m": 24 * 60 * 60 * 1000, "15m": 3 * 24 * 60 * 60 * 1000, "30m": 7 * 24 * 60 * 60 * 1000, "1h": 60 * 60 * 1000, "4h": 4 * 60 * 60 * 1000, "1d": 24 * 60 * 60 * 1000, "1w": 7 * 24 * 60 * 60 * 1000 };
        const windowMs = windows[chartState.range];
        const cutoff = windowMs ? Date.now() - windowMs : 0;
        let used = trades.filter((trade) => trade.time && trade.time >= cutoff).sort((a, b) => a.time - b.time);
        if (!used.length) used = [...trades].filter((trade) => trade.time).sort((a, b) => a.time - b.time);
        if (!used.length) {
          chartState.data = null;
          resetChartStats();
          if (hasMarket) {
            const spot = Number(String(getMarketPrice()).replace(" XRP", ""));
            if (Number.isFinite(spot) && spot > 0) {
              setText("[data-chart-stat-price]", formatAxis(spot));
              setText("[data-chart-symbol-price]", formatAxis(spot));
            }
            setText("[data-chart-stat-volume]", volume24hXrp(trades) > 0 ? `${formatIou(volume24hXrp(trades))} XRP` : "—");
          }
          setChartEmpty(
            `No validated ${label} prints to candle`,
            "Candles are built only from validated AMM/DEX prints. Empty minutes stay blank.",
          );
          return;
        }
        const intervalMs = CANDLE_MS[chartState.range];
        const candles = intervalMs ? printsToCandles(used, intervalMs) : [];
        const points = candles.length
          ? candles
          : used.map((trade) => ({ time: trade.time, value: trade.price, volume: trade.xrp || 0 }));
        const last = candles.length ? candles[candles.length - 1] : points[points.length - 1];
        const open = candles.length ? candles[0].open : points[0].value;
        const high = candles.length ? Math.max(...candles.map((candle) => candle.high)) : Math.max(...points.map((point) => point.value));
        const low = candles.length ? Math.min(...candles.map((candle) => candle.low)) : Math.min(...points.map((point) => point.value));
        const livePrice = last.close ?? last.value;
        const change = open ? ((livePrice - open) / open) * 100 : 0;
        const volume = volume24hXrp(trades);
        chartState.data = { points, candles, livePrice, change, volume, open, high, low, quote: "XRP" };
        setText("[data-chart-stat-price]", formatAxis(livePrice));
        setText("[data-chart-stat-change]", formatPercent(change));
        setText("[data-chart-stat-volume]", volume > 0 ? `${formatIou(volume)} XRP` : "—");
        setText("[data-chart-stat-market-cap]", state.verification.treasuryPnd != null ? `${formatIou(state.verification.treasuryPnd)} PND` : "—");
        setText("[data-chart-ohlc-open]", formatAxis(open));
        setText("[data-chart-ohlc-high]", formatAxis(high));
        setText("[data-chart-ohlc-low]", formatAxis(low));
        setText("[data-chart-ohlc-close]", formatAxis(livePrice));
        setText("[data-chart-ohlc-change]", formatPercent(change));
        const status = $("[data-chart-stat-status]");
        if (status) {
          status.classList.toggle("is-gated", false);
          status.classList.toggle("is-live", true);
          status.textContent = candles.length
            ? `${candles.length} print candle${candles.length === 1 ? "" : "s"} · ${used.length} print${used.length === 1 ? "" : "s"}`
            : `${used.length} validated print${used.length === 1 ? "" : "s"}`;
        }
        renderChart();
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
          const intervalMs = CANDLE_MS[chartState.range];
          const candles = intervalMs
            ? printsToCandles(allPoints.map((point) => ({ time: point.time, price: point.value, volume: point.volume })), intervalMs)
            : [];
          const points = candles.length ? candles : allPoints.slice(-limit);
          if (!points.length) throw new Error("The public XRP market feed returned too little history.");
          if (loadGeneration !== chartLoadGeneration || signal.aborted) return;
          const livePrice = Number(summary.ripple?.usd) || points[points.length - 1].value;
          const change = Number(summary.ripple?.usd_24h_change);
          const volume = Number(summary.ripple?.usd_24h_vol);
           const marketCap = Number(summary.ripple?.usd_market_cap);
           const open = candles.length ? candles[0].open : points[0].value;
           const high = candles.length ? Math.max(...candles.map((candle) => candle.high)) : Math.max(...points.map((point) => point.value));
           const low = candles.length ? Math.min(...candles.map((candle) => candle.low)) : Math.min(...points.map((point) => point.value));
           chartState.data = { points, candles, livePrice, change, volume, marketCap, open, high, low };
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
        else paintLedgerChart();
      };
      window.setInterval(load, 60000);
      return { load, paintLedger: paintLedgerChart };
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
            panels.querySelectorAll(":scope > [data-panel]").forEach((panel) => {
              const active = panel.dataset.panel === tab;
              panel.classList.toggle("is-active", active);
              panel.hidden = !active;
            });
          });
        });
      });
    }

    async function readMarketState(signal) {
      const endpoint = networks[state.network].endpoint;
      const [serverResponse, accountResponse, treasuryInfoResponse, issuerLinesResponse, treasuryLinesResponse, gatewayResponse] = await Promise.all([
        wsRpc(endpoint, "server_info", {}, signal),
        wsRpc(endpoint, "account_info", {
          account: issuer,
          ledger_index: "validated",
        }, signal),
        treasury
          ? wsRpc(endpoint, "account_info", {
              account: treasury,
              ledger_index: "validated",
            }, signal).catch(() => null)
          : Promise.resolve(null),
        wsRpc(endpoint, "account_lines", {
          account: issuer,
          ledger_index: "validated",
          limit: 400,
        }, signal),
        treasury
          ? wsRpc(endpoint, "account_lines", {
              account: treasury,
              peer: issuer,
              ledger_index: "validated",
            }, signal).catch(() => null)
          : Promise.resolve(null),
        wsRpc(endpoint, "gateway_balances", {
          account: issuer,
          ledger_index: "validated",
          ...(treasury ? { hotwallet: [treasury] } : {}),
        }, signal).catch(() => null),
      ]);
      const server = serverResponse.result?.info || serverResponse.info || {};
      const account = accountResponse.result?.account_data;
      const issuerLines = issuerLinesResponse.result?.lines || [];
      const pndLines = issuerLines.filter((line) => line.currency === "PND");
      const treasuryLine = (treasuryLinesResponse?.result?.lines || []).find((line) => line.currency === "PND");
      const gatewayHeld = gatewayResponse?.result?.balances?.[treasury]?.find((row) => row.currency === "PND");
      const treasuryPnd = treasuryLine?.balance ?? gatewayHeld?.value ?? null;
      const treasuryXrpDrops = treasuryInfoResponse?.result?.account_data?.Balance || null;
      const issued = Boolean(
        treasuryPnd != null && Number(treasuryPnd) !== 0
        || pndLines.some((line) => Number(line.balance || 0) !== 0),
      );
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
      let poolTxs = [];
      let poolTxComplete = true;
      if (amm?.account) {
        let marker;
        for (let page = 0; page < 4 && poolTxs.length < 200; page += 1) {
          const history = await wsRpc(endpoint, "account_tx", {
            account: amm.account,
            ledger_index_min: -1,
            ledger_index_max: -1,
            limit: 50,
            forward: false,
            ...(marker ? { marker } : {}),
          }, signal).catch(() => null);
          const batch = history?.result?.transactions || [];
          poolTxs.push(...batch);
          marker = history?.result?.marker;
          if (!marker || !batch.length) break;
        }
        poolTxComplete = !marker;
      }
      const trades = ledgerTrades(poolTxs);
      let walletPnd = null;
      let walletXrpDrops = null;
      const walletAccount = xamanAccount();
      if (walletAccount) {
        const [walletInfo, walletLines] = await Promise.all([
          wsRpc(endpoint, "account_info", {
            account: walletAccount,
            ledger_index: "validated",
          }, signal).catch(() => null),
          issuer
            ? wsRpc(endpoint, "account_lines", {
                account: walletAccount,
                peer: issuer,
                ledger_index: "validated",
              }, signal).catch(() => null)
            : Promise.resolve(null),
        ]);
        walletXrpDrops = walletInfo?.result?.account_data?.Balance ?? null;
        const walletLine = (walletLines?.result?.lines || []).find((line) => line.currency === "PND");
        walletPnd = walletLine?.balance ?? (walletInfo?.result?.account_data ? "0" : null);
      }
      return {
        issuer: Boolean(account),
        issued,
        orderBook: offers.length > 0,
        amm: Boolean(amm),
        market: issued && (offers.length > 0 || Boolean(amm)),
        ledger: server.validated_ledger || null,
        server,
        account,
        offers,
        pndLines,
        ammInfo: ammInfo?.result || null,
        poolTxs,
        poolTxComplete,
        trades,
        treasuryPnd,
        treasuryXrpDrops,
        treasuryAccount: treasuryLinesResponse?.result?.account || null,
        walletPnd,
        walletXrpDrops,
        walletAccount,
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
          ? "PND/XRP market on this network"
          : verification.issued
            ? "Issued · no AMM or DEX book"
            : state.network === "testnet"
              ? "Testnet issuer check"
              : "Mainnet $PND not issued");
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
    setupAmmCreate();
    chartController = setupChartControls();
    const initialMode = window.location.hash === "#data"
        ? "data"
        : window.location.hash === "#amm"
          ? "amm"
        : "chart";
    setMode(initialMode);
    setNetworkButtons();
    refresh();
    window.PondXaman?.init?.();
  }

  window.PondTrade = { ...(window.PondTrade || {}), init, connectWallet: () => {} };
  init();
})();