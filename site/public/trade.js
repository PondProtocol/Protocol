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

  const LEDGER_POLL_MS = 8000;

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

  function ticketPanelMarkup(side) {
    const isBuy = side === "buy";
    return `
             <div class="trade-panel${isBuy ? " is-active" : ""}" data-panel="${side}"${isBuy ? "" : " hidden"}>
               <div class="trade-ticket-wallet"><span>Signed-in wallet</span><strong data-ticket-wallet>—</strong></div>
               <div class="trade-order-choice" data-order-kind-group><button type="button" class="is-active" data-order-kind="limit">Limit</button><button type="button" data-order-kind="market">Market</button></div>
               <div class="trade-ticket-sizes" role="group" aria-label="Size presets"><button type="button" data-size-chip="25">25%</button><button type="button" data-size-chip="50">50%</button><button type="button" data-size-chip="75">75%</button><button type="button" data-size-chip="100">Max</button></div>
               <label class="trade-ticket-slider"><span>Size <em data-amount-slider-label>0%</em></span><input type="range" data-amount-slider min="0" max="100" step="1" value="0" aria-label="Size percent slider"></label>
               <label class="trade-ticket-slider"><span>Offset from last <em data-offset-label>0 bps</em></span><input type="range" data-price-offset min="-200" max="200" step="5" value="0" aria-label="Price offset in basis points"></label>
               <div class="trade-order-grid">
                 <label class="trade-action-field trade-input-field"><span>Price</span><div><button type="button" class="trade-ticket-step" data-price-step="-1" aria-label="Lower price">−</button><input data-dex-price inputmode="decimal" autocomplete="off" placeholder="Last print" aria-label="Price in XRP per PND"><button type="button" class="trade-ticket-step" data-price-step="1" aria-label="Raise price">+</button><b>XRP</b></div></label>
                 <label class="trade-action-field trade-input-field"><span data-ticket-amount-label>${isBuy ? "Buy" : "Sell"}</span><div><button type="button" class="trade-ticket-step" data-amount-step="-1" aria-label="Lower amount">−</button><input data-dex-amount inputmode="decimal" autocomplete="off" placeholder="0.00" aria-label="PND amount"><button type="button" class="trade-ticket-step" data-amount-step="1" aria-label="Raise amount">+</button><b>PND</b></div></label>
               </div>
               <div class="trade-ticket-tif" role="group" aria-label="Time in force"><button type="button" class="is-active" data-tif="gtc">GTC</button><button type="button" data-tif="ioc">IOC</button><button type="button" data-tif="fok">FOK</button></div>
               <label class="trade-ticket-check"><input type="checkbox" data-post-only> Post only · unsigned flag</label>
               <div class="trade-action-field"><span data-ticket-total-label>${isBuy ? "Pay" : "Receive"}</span><div><strong data-dex-total>—</strong><b>XRP</b></div><small data-ticket-vs-last>Unsigned · vs last —</small></div>
               <div class="trade-ticket-actions"><button type="button" data-follow-last aria-pressed="false">Follow last</button><button type="button" data-ticket-reset>Reset</button></div>
               <p class="trade-order-status" data-dex-order-status role="status">Unsigned preview. Official Xaman signs. This terminal does not submit OfferCreate.</p>
               <button type="button" class="trade-connect-button" data-dex-submit disabled>Unsigned preview — Xaman signs</button>
            </div>`;
  }

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
        <span class="trade-mode-note"><span class="trade-pulse" data-network-dot></span> <span data-mode-note>PND / XRP · Testnet ledger</span><span class="trade-poll-note" data-poll-note>Live · 8s</span></span>
    </nav>

    <section class="trade-mainnet-gate" data-mainnet-gate hidden>
      <div class="trade-mainnet-gate-card">
        <span class="trade-chart-mark">P</span>
        <p class="trade-kicker">XRPL Mainnet</p>
        <strong>We are not on Mainnet yet.</strong>
        <span>Mainnet still has no $PND issued. This terminal does not invent Mainnet candles or a Mainnet book. The live PND/XRP tape is Testnet only.</span>
        <button type="button" class="trade-mainnet-return" data-return-testnet>Return to Testnet</button>
      </div>
    </section>

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
        <div class="trade-action-card" data-order-ticket data-ticket-side="buy">
          <nav class="trade-action-tabs trade-ticket-sides" aria-label="DEX order type" data-tab-group="dex-order">
            <button type="button" class="is-active is-buy" data-tab="buy" aria-selected="true">Buy</button>
            <button type="button" class="is-sell" data-tab="sell" aria-selected="false">Sell</button>
          </nav>
          <div class="trade-ticket-quote" data-ticket-quote>
            <button type="button" data-quote-fill="last">Last <strong data-quote-last>—</strong></button>
            <button type="button" data-quote-fill="high">High <strong data-quote-high>—</strong></button>
            <button type="button" data-quote-fill="low">Low <strong data-quote-low>—</strong></button>
            <button type="button" data-quote-fill="vwap">VWAP <strong data-quote-vwap>—</strong></button>
          </div>
          <div class="trade-action-panels" data-tab-panels="dex-order">
${ticketPanelMarkup("buy")}
${ticketPanelMarkup("sell")}
          </div>
        </div>
      </aside>
    </section>

    <section class="trade-mode-view trade-mode-workspace trade-overview-view" data-mode-view="chart" aria-label="Market chart" hidden>
      <section class="trade-overview-chart">
        <div class="trade-chart-market-controls">
          <div class="trade-chart-tf-groups" data-control-group="overview-range">
            <div class="trade-overview-controls trade-chart-tf-intraday" role="group" aria-label="Intraday"><button type="button" class="is-active" data-chart-range="1m">1m</button><button type="button" data-chart-range="5m">5m</button><button type="button" data-chart-range="15m">15m</button><button type="button" data-chart-range="30m">30m</button></div>
            <div class="trade-overview-controls trade-chart-tf-higher" role="group" aria-label="Higher timeframes"><button type="button" data-chart-range="1h">1H</button><button type="button" data-chart-range="4h">4H</button><button type="button" data-chart-range="1d">1D</button></div>
          </div>
          <div class="trade-chart-tools">
            <button type="button" class="is-active" data-chart-style="candles" aria-pressed="true">Candles</button>
            <button type="button" data-chart-style="line" aria-pressed="false">Line</button>
            <button type="button" class="is-active" data-chart-volume aria-pressed="true">Volume</button>
          </div>
          <div class="trade-chart-plot-tools">
            <button type="button" data-chart-magnet aria-pressed="false">Magnet</button>
            <button type="button" data-chart-log aria-pressed="false">Log</button>
            <button type="button" class="is-active" data-chart-grid aria-pressed="true">Grid</button>
            <button type="button" data-chart-fit>Fit</button>
          </div>
          <div class="trade-chart-nav-tools" role="group" aria-label="Chart navigation">
            <button type="button" data-chart-zoom="-1" aria-label="Zoom out">−</button>
            <button type="button" data-chart-zoom="1" aria-label="Zoom in">+</button>
            <button type="button" data-chart-latest>Latest</button>
            <button type="button" class="is-active" data-chart-hl aria-pressed="true">H/L</button>
            <button type="button" class="is-active" data-chart-vol-sma aria-pressed="true">Vol MA</button>
            <button type="button" data-chart-compact aria-pressed="false">Compact</button>
            <button type="button" data-chart-tz aria-pressed="false">Local</button>
            <button type="button" data-chart-pin aria-pressed="false">Pin</button>
            <button type="button" data-chart-reset>Reset</button>
          </div>
          <div class="trade-indicator-tools" data-indicator-tools>
            <button type="button" class="is-active" data-chart-indicator="sma" aria-pressed="true"><i class="trade-ind-swatch is-sma"></i>SMA</button>
            <button type="button" class="is-active" data-chart-indicator="ema" aria-pressed="true"><i class="trade-ind-swatch is-ema"></i>EMA</button>
            <button type="button" class="is-active" data-chart-indicator="rsi" aria-pressed="true"><i class="trade-ind-swatch is-rsi"></i>RSI</button>
            <button type="button" class="is-active" data-chart-indicator="macd" aria-pressed="true"><i class="trade-ind-swatch is-macd"></i>MACD</button>
            <button type="button" class="is-active" data-chart-indicator="bollinger" aria-pressed="true"><i class="trade-ind-swatch is-bb"></i>BB</button>
            <span class="trade-indicator-periods" role="group" aria-label="Indicator period">
              <button type="button" data-chart-period="5">5</button>
              <button type="button" class="is-active" data-chart-period="8">8</button>
              <button type="button" data-chart-period="14">14</button>
              <button type="button" data-chart-period="21">21</button>
            </span>
          </div>
        </div>
        <div class="trade-chart-symbol-bar">
          <div class="trade-chart-symbol"><span class="trade-chart-symbol-mark" data-chart-symbol-mark>P</span><strong data-chart-symbol>PND / XRP</strong><span data-chart-timeframe>1m</span><span class="trade-chart-symbol-source" data-chart-symbol-source>XRPL Testnet</span></div>
          <div class="trade-chart-readout"><strong data-chart-symbol-price>—</strong><span data-chart-symbol-change>—</span><span class="trade-chart-print-age" data-chart-print-age>—</span></div>
        </div>
        <div class="trade-chart-ohlc">
          <span><b>O</b><strong data-chart-ohlc-open>—</strong></span>
          <span><b>H</b><strong data-chart-ohlc-high>—</strong></span>
          <span><b>L</b><strong data-chart-ohlc-low>—</strong></span>
          <span><b>C</b><strong data-chart-ohlc-close>—</strong></span>
          <span class="trade-chart-ohlc-change"><strong data-chart-ohlc-change>—</strong></span>
          <span class="trade-chart-bar-left"><b>Bar</b><strong data-chart-bar-left>—</strong></span>
          <span class="trade-chart-keys" data-chart-keys>1 5 Q W H 4 D · V S E R M B · L G F · − + . 0 U P · Esc</span>
        </div>
        <div class="trade-overview-plot">
          <div class="trade-chart-live" data-chart-live hidden>
            <div class="trade-chart-board" data-chart-board role="img" aria-label="PND / XRP Testnet chart"></div>
            <div class="trade-chart-hud" data-chart-hud hidden>
              <strong data-chart-hud-time>—</strong>
              <span data-chart-hud-ohlc>—</span>
              <span data-chart-hud-vol>—</span>
              <span data-chart-hud-prints>—</span>
              <span data-chart-hud-pin hidden>—</span>
              <span data-chart-hud-ind>—</span>
            </div>
            <span class="trade-chart-source" data-chart-source hidden>XRPL Testnet</span>
          </div>
          <div class="trade-chart-empty-state is-loading" data-chart-empty-state>
            <div class="trade-chart-grid"></div>
            <span class="trade-chart-mark">P</span>
            <strong data-chart-empty-title>Loading Testnet tape…</strong>
            <span data-chart-empty-copy>Reading the validated PND/XRP pool. Candles stay blank until prints arrive.</span>
          </div>
        </div>
        <div class="trade-overview-legend"><span><i class="trade-legend-dot"></i><span data-chart-legend-primary>PND / XRP</span></span><span data-chart-legend-volume><i class="trade-legend-bar"></i>Volume</span><span data-chart-legend-indicator>SMA · EMA · RSI · MACD · BB</span><span data-chart-source-label>XRPL Testnet</span></div>
      </section>
      <aside class="trade-overview-sidebar trade-overview-rail">
          <div class="trade-overview-card trade-chart-snapshot">
            <header class="trade-snapshot-head">
              <p class="trade-kicker">Market snapshot</p>
              <div class="trade-snapshot-head-actions">
                <button type="button" class="trade-snapshot-use-last" data-copy-last>Copy</button>
                <button type="button" class="trade-snapshot-use-last" data-use-last>Use last</button>
              </div>
            </header>
            <div class="trade-snapshot-hero">
              <span>Last print</span>
              <strong data-chart-stat-price>—</strong>
              <em data-chart-stat-change>—</em>
            </div>
            <div class="trade-snapshot-range" data-chart-range-meter>
              <span data-chart-stat-low>—</span>
              <div class="trade-snapshot-range-track" aria-hidden="true"><i data-chart-range-mark></i></div>
              <span data-chart-stat-high>—</span>
            </div>
            <div class="trade-snapshot-cluster">
              <p class="trade-snapshot-cluster-label">Tape</p>
              <div class="trade-overview-stat"><span>24h volume</span><strong data-chart-stat-volume>—</strong></div>
              <div class="trade-overview-stat"><span>VWAP</span><strong data-chart-stat-vwap>—</strong></div>
              <div class="trade-overview-stat"><span>AMM spot</span><strong data-chart-stat-spot>—</strong></div>
              <div class="trade-overview-stat"><span>Basis</span><strong data-chart-stat-basis>—</strong></div>
              <div class="trade-overview-stat"><span>Prints</span><strong data-chart-stat-prints>—</strong></div>
              <div class="trade-overview-stat"><span>Last print</span><strong data-chart-stat-print>—</strong></div>
              <div class="trade-overview-stat"><span>Your PND</span><strong data-chart-stat-wallet-pnd>—</strong></div>
              <div class="trade-overview-stat"><span>Your XRP</span><strong data-chart-stat-wallet-xrp>—</strong></div>
              <div class="trade-overview-stat"><span>Ledger poll</span><strong data-chart-stat-poll>8s · waiting</strong></div>
              <div class="trade-overview-stat"><span>Market status</span><strong data-chart-stat-status>Loading Testnet tape…</strong></div>
            </div>
            <ol class="trade-snapshot-prints" data-snapshot-prints></ol>
          </div>
        <div class="trade-action-card trade-overview-ticket" data-order-ticket data-ticket-side="buy">
          <nav class="trade-action-tabs trade-ticket-sides" aria-label="Chart order type" data-tab-group="chart-order">
            <button type="button" class="is-active is-buy" data-tab="buy" aria-selected="true">Buy</button>
            <button type="button" class="is-sell" data-tab="sell" aria-selected="false">Sell</button>
          </nav>
          <div class="trade-ticket-quote" data-ticket-quote>
            <button type="button" data-quote-fill="last">Last <strong data-quote-last>—</strong></button>
            <button type="button" data-quote-fill="high">High <strong data-quote-high>—</strong></button>
            <button type="button" data-quote-fill="low">Low <strong data-quote-low>—</strong></button>
            <button type="button" data-quote-fill="vwap">VWAP <strong data-quote-vwap>—</strong></button>
          </div>
          <div class="trade-action-panels" data-tab-panels="chart-order">
${ticketPanelMarkup("buy")}
${ticketPanelMarkup("sell")}
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
        <div class="trade-data-stat"><span>Ledger poll</span><strong data-data-poll>—</strong><em data-data-poll-note>validated · 8s</em></div>
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
        poolTxComplete: false,
        tapeLoading: true,
        tapeMarker: null,
        treasuryPnd: null,
        treasuryXrpDrops: null,
        treasuryAccount: null,
        walletPnd: null,
        walletXrpDrops: null,
        walletAccount: "",
      },
    };
    let refreshController = null;
    let pollTimer = 0;
    let pollInFlight = false;
    let lastPollAt = 0;
    const ticketQuotes = { last: NaN, high: NaN, low: NaN, vwap: NaN, spot: NaN };
    let followLast = false;
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
      const pollLabel = `${onTestnet ? "XRPL Testnet" : "XRPL Mainnet"} · live ${LEDGER_POLL_MS / 1000}s`;
      setText("[data-chart-source-label]", pollLabel);
      setText("[data-chart-symbol-source]", liveMarket ? `XRPL validated ledger · live ${LEDGER_POLL_MS / 1000}s` : pollLabel);
      setText("[data-chart-stat-status]", liveMarket ? "Live PND/XRP market" : "No AMM or DEX book");
      const status = $("[data-chart-stat-status]");
      if (status) {
        status.classList.toggle("is-gated", !liveMarket);
        status.classList.toggle("is-live", liveMarket);
      }
      updateMarketPanels();
      paintWalletStats();
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

    function poolTxHash(item) {
      return item?.hash || item?.tx?.hash || item?.tx_json?.hash || "";
    }

    function mergePoolHistory(previous = {}, incoming = {}) {
      const seen = new Set();
      const merged = [];
      for (const item of [...(incoming.poolTxs || []), ...(previous.poolTxs || [])]) {
        const hash = poolTxHash(item);
        const key = hash || `${item?.ledger_index || ""}:${item?.tx?.Sequence || item?.tx_json?.Sequence || merged.length}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
      return {
        ...incoming,
        poolTxs: merged,
        trades: ledgerTrades(merged),
        tapeMarker: previous.poolTxComplete ? null : (previous.tapeMarker || incoming.tapeMarker),
        poolTxComplete: Boolean(previous.poolTxComplete || incoming.poolTxComplete),
        tapeLoading: previous.poolTxComplete ? false : Boolean(incoming.tapeLoading),
      };
    }

    function countNewPrints(previous = {}, next = {}) {
      const before = new Set((previous.trades || []).map((trade) => trade.hash).filter(Boolean));
      return (next.trades || []).filter((trade) => trade.hash && !before.has(trade.hash)).length;
    }

    function volume24hXrp(trades = []) {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return trades.reduce((sum, trade) => sum + (trade.time && trade.time >= cutoff ? trade.xrp : 0), 0);
    }

    function tapeVwap(prints = []) {
      let notional = 0;
      let weight = 0;
      prints.forEach((print) => {
        const price = Number(print.price);
        const xrp = Number(print.xrp) || 0;
        if (!(price > 0) || !(xrp > 0)) return;
        notional += price * xrp;
        weight += xrp;
      });
      return weight > 0 ? notional / weight : NaN;
    }

    function ammSpotNumber(verification = state.verification) {
      const amm = verification.ammInfo?.amm;
      const { xrp, iou } = splitAmmAssets(amm);
      const spot = Number(formatDrops(xrp || "0")) / Number(iou?.value);
      return Number.isFinite(spot) && spot > 0 ? spot : NaN;
    }

    function formatQuotePrice(value) {
      if (!Number.isFinite(value) || value <= 0) return "";
      return value >= 1 ? value.toFixed(4) : value.toFixed(6);
    }

    function setSignedText(selector, value, numeric) {
      $$(selector).forEach((node) => {
        node.textContent = value;
        node.classList.toggle("is-up", Number.isFinite(numeric) && numeric > 0);
        node.classList.toggle("is-down", Number.isFinite(numeric) && numeric < 0);
      });
    }

    function paintRangeMeter(last, high, low) {
      const mark = $("[data-chart-range-mark]");
      if (!mark) return;
      const span = high - low;
      const pct = Number.isFinite(last) && Number.isFinite(span) && span > 0
        ? Math.min(100, Math.max(0, ((last - low) / span) * 100))
        : 50;
      mark.style.left = `${pct}%`;
    }

    function syncTicketQuotes(quotes = ticketQuotes) {
      const last = formatQuotePrice(quotes.last) || "—";
      const high = formatQuotePrice(quotes.high) || "—";
      const low = formatQuotePrice(quotes.low) || "—";
      const vwap = formatQuotePrice(quotes.vwap) || "—";
      setText("[data-quote-last]", last);
      setText("[data-quote-high]", high);
      setText("[data-quote-low]", low);
      setText("[data-quote-vwap]", vwap);
    }

    function paintWalletStats() {
      const pnd = state.verification.walletPnd;
      const xrpDrops = state.verification.walletXrpDrops;
      const signedIn = Boolean(state.verification.walletAccount);
      const pndText = signedIn && pnd != null ? `${formatIou(pnd)} PND` : "—";
      const xrpText = signedIn && xrpDrops != null ? `${formatDrops(xrpDrops)} XRP` : "—";
      setText("[data-chart-stat-wallet-pnd]", pndText);
      setText("[data-chart-stat-wallet-xrp]", xrpText);
      $$("[data-ticket-wallet]").forEach((node) => {
        node.textContent = signedIn ? `${pndText} · ${xrpText}` : "Sign in with Xaman to size from balances";
      });
    }

    function paintSnapshotPrints(prints = []) {
      const list = $("[data-snapshot-prints]");
      if (!list) return;
      const rows = [...prints].filter((print) => print.time && print.price > 0).sort((a, b) => b.time - a.time).slice(0, 6);
      list.innerHTML = rows.length
        ? rows.map((print) => {
            const clock = new Date(print.time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });
            return `<li><button type="button" data-print-fill="${escText(String(print.price))}"><strong>${escText(formatQuotePrice(print.price) || String(print.price))}</strong><span>${escText(formatIou(print.xrp || 0))} XRP</span><time>${escText(clock)}</time></button></li>`;
          }).join("")
        : "<li>No validated prints in this window.</li>";
    }

    function fillTicketPrices(value, force = false) {
      const text = formatQuotePrice(value);
      if (!text) return;
      $$("[data-dex-price]").forEach((input) => {
        if (!force && input.dataset.userEdited === "1") return;
        input.dataset.autofill = "1";
        input.dataset.userEdited = "";
        input.value = text;
        input.dispatchEvent(new Event("input"));
        input.dataset.autofill = "";
      });
    }

    const CANDLE_MS = { "1m": 60_000, "5m": 5 * 60_000, "15m": 15 * 60_000, "30m": 30 * 60_000, "1h": 60 * 60_000, "4h": 4 * 60 * 60_000, "1d": 24 * 60 * 60_000 };

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

    function applyMainnetGate() {
      const onMainnet = state.network === "production";
      root.dataset.network = state.network;
      const gate = $("[data-mainnet-gate]");
      if (gate) gate.hidden = !onMainnet;
      if (onMainnet) {
        $("[data-chart-live]")?.setAttribute("hidden", "");
        $("[data-chart-empty-state]")?.setAttribute("hidden", "");
        setText("[data-honesty]", "XRPL Mainnet · $PND is not issued · we are not on Mainnet yet");
        setText("[data-mode-note]", "Mainnet · not issued yet");
        setText("[data-poll-note]", "Off");
        setStatus("online", "Mainnet · not issued yet");
      }
    }

    function returnToTestnet() {
      if (state.network === "testnet") return;
      state.network = "testnet";
      setNetworkButtons();
      walletController?.switchNetwork();
      refresh();
    }

    function setNetworkButtons() {
      $$("[data-network]").forEach((button) => {
        const active = button.dataset.network === state.network;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      setText("[data-network-label]", networks[state.network].label);
      applyMainnetGate();
    }

    function setMode(mode) {
      const liveNote = `live ${LEDGER_POLL_MS / 1000}s`;
      const labels = {
        amm: `AMM · ${liveNote}`,
        dex: (state.verification.offers || []).length || (state.verification.trades || []).length
          ? `DEX · live book · ${liveNote}`
          : `DEX · empty book · ${liveNote}`,
        chart: `PND / XRP · ${liveNote}`,
        data: `Data · ${liveNote}`,
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
      const bumpValue = (raw, direction) => {
        const current = Number(raw);
        if (!Number.isFinite(current) || current <= 0) {
          const fallback = Number.isFinite(ticketQuotes.last) && ticketQuotes.last > 0 ? ticketQuotes.last : 1;
          return formatQuotePrice(direction > 0 ? fallback : fallback / 2) || "1";
        }
        const step = current >= 1 ? 0.01 : current >= 0.1 ? 0.001 : 0.0001;
        const next = Math.max(step, current + direction * step);
        return formatQuotePrice(next) || String(next);
      };
      const sizePreset = (side, pct) => {
        const last = ticketQuotes.last;
        if (side === "sell") {
          const walletPnd = Number(state.verification.walletPnd);
          if (Number.isFinite(walletPnd) && walletPnd > 0) return String(walletPnd * (pct / 100));
        } else if (Number.isFinite(last) && last > 0) {
          const walletXrp = Number(formatDrops(state.verification.walletXrpDrops || "0"));
          if (Number.isFinite(walletXrp) && walletXrp > 0) return String((walletXrp * (pct / 100)) / last);
        }
        return String({ 25: 10, 50: 100, 75: 1000, 100: 10000 }[pct] || 10);
      };
      tickets.forEach((ticket) => {
        const panels = [...ticket.querySelectorAll("[data-panel]")];
        const bindPanel = (panel) => {
          const side = panel.dataset.panel;
          const price = panel.querySelector("[data-dex-price]");
          const amount = panel.querySelector("[data-dex-amount]");
          const total = panel.querySelector("[data-dex-total]");
          const submit = panel.querySelector("[data-dex-submit]");
          const vsLast = panel.querySelector("[data-ticket-vs-last]");
          const orderKindButtons = [...panel.querySelectorAll("[data-order-kind]")];
          if (!price || !amount || !total || !submit) return;
          let orderKind = "limit";
          let tif = "gtc";
          let postOnly = false;
          const amountSlider = panel.querySelector("[data-amount-slider]");
          const amountSliderLabel = panel.querySelector("[data-amount-slider-label]");
          const offsetSlider = panel.querySelector("[data-price-offset]");
          const offsetLabel = panel.querySelector("[data-offset-label]");
          const previewFlags = () => {
            const flags = [`TIF ${tif.toUpperCase()}`];
            if (postOnly) flags.push("post-only");
            return `Unsigned · ${flags.join(" · ")} · Xaman signs, no OfferCreate here.`;
          };
          const updateTotal = () => {
            if (orderKind === "market") {
              price.disabled = true;
              price.value = "";
              total.textContent = "Best available";
              if (vsLast) vsLast.textContent = "No Testnet book to take · unsigned";
              return;
            }
            price.disabled = false;
            try {
              const drops = decimalMultiply(price.value, amount.value, 6);
              total.textContent = drops > 0n ? `${formatDrops(drops)} XRP` : "—";
            } catch {
              total.textContent = "—";
            }
            const quoted = Number(price.value);
            const last = ticketQuotes.last;
            if (vsLast && Number.isFinite(quoted) && quoted > 0 && Number.isFinite(last) && last > 0) {
              const basis = ((quoted - last) / last) * 100;
              vsLast.textContent = `Unsigned · vs last ${basis >= 0 ? "+" : ""}${basis.toFixed(2)}% · ${tif.toUpperCase()}${postOnly ? " · post" : ""}`;
              vsLast.classList.toggle("is-up", basis > 0);
              vsLast.classList.toggle("is-down", basis < 0);
            } else if (vsLast) {
              vsLast.textContent = "Unsigned · vs last —";
              vsLast.classList.remove("is-up", "is-down");
            }
          };
          const applyOffset = () => {
            const last = ticketQuotes.last;
            const bps = Number(offsetSlider?.value || 0);
            if (offsetLabel) offsetLabel.textContent = `${bps > 0 ? "+" : ""}${bps} bps`;
            if (!Number.isFinite(last) || last <= 0) return;
            price.dataset.userEdited = "1";
            price.value = formatQuotePrice(last * (1 + bps / 10000)) || String(last);
            updateTotal();
          };
          const applySizePct = (pct) => {
            amount.value = sizePreset(side, pct);
            if (amountSlider) amountSlider.value = String(pct);
            if (amountSliderLabel) amountSliderLabel.textContent = `${pct}%`;
            updateTotal();
          };
          price.addEventListener("input", () => {
            if (price.dataset.autofill !== "1") price.dataset.userEdited = "1";
            updateTotal();
          });
          amount.addEventListener("input", () => {
            if (amountSlider && amountSliderLabel) {
              amountSliderLabel.textContent = "custom";
              panel.querySelectorAll("[data-size-chip]").forEach((chip) => chip.classList.remove("is-active"));
            }
            updateTotal();
          });
          amountSlider?.addEventListener("input", () => applySizePct(Number(amountSlider.value) || 0));
          offsetSlider?.addEventListener("input", applyOffset);
          panel.querySelectorAll("[data-tif]").forEach((button) => {
            button.addEventListener("click", () => {
              tif = button.dataset.tif || "gtc";
              panel.querySelectorAll("[data-tif]").forEach((item) => item.classList.toggle("is-active", item === button));
              updateTotal();
              setOrderStatus(previewFlags());
            });
          });
          panel.querySelector("[data-post-only]")?.addEventListener("change", (event) => {
            postOnly = Boolean(event.target.checked);
            updateTotal();
            setOrderStatus(previewFlags());
          });
          panel.querySelector("[data-follow-last]")?.addEventListener("click", (event) => {
            followLast = !followLast;
            $$("[data-follow-last]").forEach((button) => {
              button.classList.toggle("is-active", followLast);
              button.setAttribute("aria-pressed", String(followLast));
            });
            if (followLast) fillTicketPrices(ticketQuotes.last, true);
            setOrderStatus(followLast ? "Follow last is on. New validated prints refill price. Unsigned only." : previewFlags(), followLast ? "ready" : "neutral");
            event.currentTarget.classList.toggle("is-active", followLast);
          });
          panel.querySelector("[data-ticket-reset]")?.addEventListener("click", () => {
            orderKind = "limit";
            tif = "gtc";
            postOnly = false;
            followLast = false;
            panel.querySelectorAll("[data-order-kind]").forEach((item) => item.classList.toggle("is-active", item.dataset.orderKind === "limit"));
            panel.querySelectorAll("[data-tif]").forEach((item) => item.classList.toggle("is-active", item.dataset.tif === "gtc"));
            panel.querySelectorAll("[data-size-chip]").forEach((chip) => chip.classList.remove("is-active"));
            $$("[data-follow-last]").forEach((button) => {
              button.classList.remove("is-active");
              button.setAttribute("aria-pressed", "false");
            });
            const post = panel.querySelector("[data-post-only]");
            if (post) post.checked = false;
            if (amountSlider) amountSlider.value = "0";
            if (amountSliderLabel) amountSliderLabel.textContent = "0%";
            if (offsetSlider) offsetSlider.value = "0";
            if (offsetLabel) offsetLabel.textContent = "0 bps";
            amount.value = "";
            price.dataset.userEdited = "";
            fillTicketPrices(ticketQuotes.last, true);
            updateTotal();
            setOrderStatus("Ticket reset. Unsigned preview. Official Xaman signs.");
          });
          orderKindButtons.forEach((button) => {
            button.addEventListener("click", () => {
              orderKind = button.dataset.orderKind || "limit";
              orderKindButtons.forEach((item) => item.classList.toggle("is-active", item === button));
              updateTotal();
              setOrderStatus(
                orderKind === "market"
                  ? "No Testnet book to take. Market preview stays blank. Official Xaman would sign; this terminal does not submit."
                  : "Unsigned preview. Official Xaman signs. Nothing is submitted here.",
              );
            });
          });
          panel.querySelectorAll("[data-price-step]").forEach((button) => {
            button.addEventListener("click", (event) => {
              event.preventDefault();
              price.dataset.userEdited = "1";
              price.value = bumpValue(price.value, Number(button.dataset.priceStep) || 1);
              updateTotal();
            });
          });
          panel.querySelectorAll("[data-amount-step]").forEach((button) => {
            button.addEventListener("click", (event) => {
              event.preventDefault();
              const current = Number(amount.value);
              const step = Number.isFinite(current) && current >= 100 ? 100 : Number.isFinite(current) && current >= 10 ? 10 : 1;
              const next = Math.max(0, (Number.isFinite(current) ? current : 0) + (Number(button.dataset.amountStep) || 1) * step);
              amount.value = String(next);
              updateTotal();
            });
          });
          panel.querySelectorAll("[data-size-chip]").forEach((button) => {
            button.addEventListener("click", () => {
              panel.querySelectorAll("[data-size-chip]").forEach((chip) => chip.classList.toggle("is-active", chip === button));
              applySizePct(Number(button.dataset.sizeChip) || 25);
            });
          });
          submit.addEventListener("click", () => {
            setOrderStatus("Unsigned preview. Official Xaman signs. This terminal does not submit.", "gated");
          });
          updateTotal();
        };
        panels.forEach(bindPanel);
        ticket.querySelectorAll("[data-quote-fill]").forEach((button) => {
          button.addEventListener("click", () => {
            const key = button.dataset.quoteFill;
            fillTicketPrices(ticketQuotes[key], true);
          });
        });
        ticket.querySelectorAll("[data-tab]").forEach((button) => {
          button.addEventListener("click", () => {
            if (button.dataset.tab === "buy" || button.dataset.tab === "sell") {
              ticket.dataset.ticketSide = button.dataset.tab;
            }
          });
        });
      });
      $("[data-use-last]")?.addEventListener("click", () => {
        fillTicketPrices(ticketQuotes.last, true);
        setOrderStatus("Filled from the last validated print. Unsigned preview only.", "ready");
      });
      $("[data-copy-last]")?.addEventListener("click", async () => {
        const text = formatQuotePrice(ticketQuotes.last);
        if (!text || !navigator.clipboard?.writeText) {
          setOrderStatus("Nothing to copy yet.", "gated");
          return;
        }
        try {
          await navigator.clipboard.writeText(text);
          setOrderStatus(`Copied last print ${text} XRP. Unsigned preview only.`, "ready");
        } catch {
          setOrderStatus("Clipboard is blocked in this browser.", "gated");
        }
      });
      $("[data-snapshot-prints]")?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-print-fill]");
        if (!button) return;
        fillTicketPrices(Number(button.dataset.printFill), true);
        setOrderStatus("Filled from a validated print. Unsigned preview only.", "ready");
      });
    }

    function prefillDexPrices(spot) {
      fillTicketPrices(spot, false);
    }

    function setupChartControls() {
      const pairLabels = {
        "xrp-usd": "XRP / USD",
        "pnd-xrp": "PND / XRP",
        "pnd-usd": "PND / USD",
      };
      const rangeDays = { "1m": 1, "5m": 1, "15m": 1, "30m": 1, "1h": 14, "4h": 30, "1d": 90 };
      const rangePoints = { "1m": 288, "5m": 288, "15m": 96, "30m": 48, "1h": 336, "4h": 180, "1d": 90 };
      const rangeLabels = { "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m", "1h": "1H", "4h": "4H", "1d": "1D" };
      const chartState = { pair: "pnd-xrp", range: "1m", volume: true, style: "candles", magnet: false, log: false, grid: true, hl: true, volSma: true, compact: false, utc: false, pin: false, pinPrice: null, period: 8, indicator: "sma", indicators: { sma: true, ema: true, rsi: true, macd: true, bollinger: true }, data: null, hoverIndex: null, lastPrintTime: null, printByTime: null, layout: null };
      let chartLoadController = null;
      let chartLoadGeneration = 0;
      const rangeButtons = $$("[data-chart-range]");
      const indicatorButtons = $$("[data-chart-indicator]");
      const volumeToggle = $("[data-chart-volume]");
      const symbolMark = $("[data-chart-symbol-mark]");
      const liveChart = $("[data-chart-live]");
      const emptyChart = $("[data-chart-empty-state]");
      const board = $("[data-chart-board]");
      if (!liveChart || !emptyChart || !board) return null;

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
      const setChartEmpty = (title, copy, loading = false) => {
        setText("[data-chart-empty-title]", title);
        setText("[data-chart-empty-copy]", copy);
        emptyChart.classList.toggle("is-loading", loading);
        liveChart.hidden = true;
        emptyChart.hidden = false;
        hideChartHud();
      };
      const setChartLoading = (title = "Loading Testnet tape…", copy = "Reading validated PND/XRP prints. This is not an empty market.") => {
        setChartEmpty(title, copy, true);
        const status = $("[data-chart-stat-status]");
        if (status) {
          status.classList.add("is-live");
          status.classList.remove("is-gated");
          status.textContent = "Fetching tape…";
        }
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
        setSignedText("[data-chart-stat-change]", "—", NaN);
        setText("[data-chart-stat-volume]", "—");
       setText("[data-chart-stat-market-cap]", "—");
        setText("[data-chart-stat-sma]", "—");
        setText("[data-chart-stat-high]", "—");
        setText("[data-chart-stat-low]", "—");
        setText("[data-chart-stat-print]", "—");
        setText("[data-chart-stat-vwap]", "—");
        setText("[data-chart-stat-spot]", "—");
        setSignedText("[data-chart-stat-basis]", "—", NaN);
        setText("[data-chart-stat-prints]", "—");
        setText("[data-chart-stat-wallet-pnd]", "—");
        setText("[data-chart-stat-wallet-xrp]", "—");
        paintSnapshotPrints([]);
        setText("[data-chart-stat-rsi]", "—");
        setText("[data-chart-stat-macd]", "—");
        setText("[data-chart-symbol-price]", "—");
        setSignedText("[data-chart-symbol-change]", "—", NaN);
        setText("[data-chart-print-age]", "—");
        hideChartHud();
       setText("[data-chart-ohlc-open]", "—");
       setText("[data-chart-ohlc-high]", "—");
       setText("[data-chart-ohlc-low]", "—");
       setText("[data-chart-ohlc-close]", "—");
       setSignedText("[data-chart-ohlc-change]", "—", NaN);
        setText("[data-chart-bar-left]", "—");
        paintRangeMeter(NaN, NaN, NaN);
        ticketQuotes.last = ticketQuotes.high = ticketQuotes.low = ticketQuotes.vwap = ticketQuotes.spot = NaN;
        syncTicketQuotes();
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
            if (value == null) {
              started = false;
              return "";
            }
            const command = started ? "L" : "M";
            started = true;
            return `${command} ${x(index)} ${y(value)}`;
          })
          .filter(Boolean)
          .join(" ");
      };
      const hud = $("[data-chart-hud]");
      const formatCompact = (value) => {
        if (!Number.isFinite(value)) return "—";
        if (value >= 10) return value.toFixed(2);
        if (value >= 1) return value.toFixed(3);
        if (value >= 0.1) return value.toFixed(4);
        if (value >= 0.01) return value.toFixed(5);
        return value.toFixed(6);
      };
      const formatPrintAge = (ms) => {
        if (!Number.isFinite(ms) || ms < 0) return "—";
        const sec = Math.floor(ms / 1000);
        if (sec < 60) return `${sec}s ago`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}m ago`;
        return `${Math.floor(min / 60)}h ago`;
      };
      const hideChartHud = () => {
        chartState.hoverIndex = null;
        if (hud) hud.hidden = true;
      };
      const updatePrintAge = () => {
        const stamp = chartState.lastPrintTime;
        if (!stamp) {
          setText("[data-chart-print-age]", "—");
          setText("[data-chart-stat-print]", "—");
          return;
        }
        const age = formatPrintAge(Date.now() - stamp);
        setText("[data-chart-print-age]", `${formatHudTime(stamp)} · ${age}`);
        setText("[data-chart-stat-print]", age);
      };
      const updateBarLeft = () => {
        const interval = CANDLE_MS[chartState.range];
        const last = chartState.data?.candles?.[chartState.data.candles.length - 1];
        if (!interval || !last?.time) {
          setText("[data-chart-bar-left]", "—");
          return;
        }
        const remain = Math.max(0, interval - (Date.now() - last.time));
        const sec = Math.ceil(remain / 1000);
        if (sec >= 3600) setText("[data-chart-bar-left]", `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`);
        else if (sec >= 60) setText("[data-chart-bar-left]", `${Math.floor(sec / 60)}m ${sec % 60}s`);
        else setText("[data-chart-bar-left]", `${sec}s`);
      };
      const seriesPoints = (times, values) =>
        values
          .map((value, index) => (value == null || !Number.isFinite(value) ? null : { time: times[index], value }))
          .filter(Boolean);
      const loadVendorScript = (src) => {
        const existing = [...document.scripts].find((node) => node.getAttribute("src") === src);
        if (existing) {
          return window.LightweightCharts?.createChart
            ? Promise.resolve()
            : new Promise((resolve, reject) => {
                existing.addEventListener("load", resolve, { once: true });
                existing.addEventListener("error", () => reject(new Error("Chart library failed to load.")), { once: true });
              });
        }
        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.addEventListener("load", resolve, { once: true });
          script.addEventListener("error", () => reject(new Error("Chart library failed to load.")), { once: true });
          document.head.appendChild(script);
        });
      };
      const ensureTvLib = () => {
        if (window.LightweightCharts?.createChart) return Promise.resolve();
        return loadVendorScript("/vendor/lightweight-charts.standalone.production.js");
      };

      rangeButtons.forEach((button) => {
        button.addEventListener("click", () => setRange(button.dataset.chartRange || "1m"));
      });

      volumeToggle?.addEventListener("click", () => {
        chartState.volume = !chartState.volume;
        volumeToggle.classList.toggle("is-active", chartState.volume);
        volumeToggle.setAttribute("aria-pressed", String(chartState.volume));
        const legendVolume = $("[data-chart-legend-volume]");
        if (legendVolume) legendVolume.hidden = !chartState.volume;
        if (chartState.data) renderChart();
      });

      const applyPlotChrome = () => {
        const tv = chartState.tv;
        const LC = window.LightweightCharts;
        if (!tv || !LC) return;
        tv.chart.applyOptions({
          crosshair: { mode: chartState.magnet ? LC.CrosshairMode.Magnet : LC.CrosshairMode.Normal },
          grid: {
            vertLines: { color: "#1d2024", visible: chartState.grid !== false },
            horzLines: { color: "#25292e", visible: chartState.grid !== false },
          },
        });
        const logMode = chartState.log && LC.PriceScaleMode ? LC.PriceScaleMode.Logarithmic : LC.PriceScaleMode?.Normal;
        if (logMode != null) tv.candles.priceScale().applyOptions({ mode: logMode });
        const showLine = chartState.style === "line";
        tv.candles.applyOptions({ visible: !showLine });
        tv.closeLine?.applyOptions({ visible: showLine });
      };

      const setRange = (range) => {
        if (!rangeLabels[range]) return;
        chartState.range = range;
        rangeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.chartRange === range));
        setText("[data-chart-timeframe]", rangeLabels[range]);
        paintLedgerChart();
      };

      $$("[data-chart-style]").forEach((button) => {
        button.addEventListener("click", () => {
          chartState.style = button.dataset.chartStyle || "candles";
          $$("[data-chart-style]").forEach((item) => {
            const active = item === button;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-pressed", String(active));
          });
          applyPlotChrome();
          if (chartState.data) renderChart();
        });
      });
      const magnetToggle = $("[data-chart-magnet]");
      magnetToggle?.addEventListener("click", () => {
        chartState.magnet = !chartState.magnet;
        magnetToggle.classList.toggle("is-active", chartState.magnet);
        magnetToggle.setAttribute("aria-pressed", String(chartState.magnet));
        applyPlotChrome();
      });
      const logToggle = $("[data-chart-log]");
      logToggle?.addEventListener("click", () => {
        chartState.log = !chartState.log;
        logToggle.classList.toggle("is-active", chartState.log);
        logToggle.setAttribute("aria-pressed", String(chartState.log));
        applyPlotChrome();
        if (chartState.data) renderChart();
      });
      const gridToggle = $("[data-chart-grid]");
      gridToggle?.addEventListener("click", () => {
        chartState.grid = !chartState.grid;
        gridToggle.classList.toggle("is-active", chartState.grid);
        gridToggle.setAttribute("aria-pressed", String(chartState.grid));
        applyPlotChrome();
      });
      const syncNavButtons = () => {
        const hlToggle = $("[data-chart-hl]");
        hlToggle?.classList.toggle("is-active", chartState.hl !== false);
        hlToggle?.setAttribute("aria-pressed", String(chartState.hl !== false));
        const volSmaToggle = $("[data-chart-vol-sma]");
        volSmaToggle?.classList.toggle("is-active", chartState.volSma !== false);
        volSmaToggle?.setAttribute("aria-pressed", String(chartState.volSma !== false));
        const compactToggle = $("[data-chart-compact]");
        compactToggle?.classList.toggle("is-active", Boolean(chartState.compact));
        compactToggle?.setAttribute("aria-pressed", String(Boolean(chartState.compact)));
        const tzToggle = $("[data-chart-tz]");
        if (tzToggle) {
          tzToggle.classList.toggle("is-active", Boolean(chartState.utc));
          tzToggle.setAttribute("aria-pressed", String(Boolean(chartState.utc)));
          tzToggle.textContent = chartState.utc ? "UTC" : "Local";
        }
        const pinToggle = $("[data-chart-pin]");
        pinToggle?.classList.toggle("is-active", Boolean(chartState.pin));
        pinToggle?.setAttribute("aria-pressed", String(Boolean(chartState.pin)));
      };

      const formatHudTime = (timeMs) => {
        if (!Number.isFinite(timeMs)) return "—";
        const options = { hour: "numeric", minute: "2-digit", second: "2-digit" };
        if (chartState.utc) {
          return `${new Date(timeMs).toLocaleTimeString("en-GB", { ...options, timeZone: "UTC" })} UTC`;
        }
        return new Date(timeMs).toLocaleTimeString(undefined, options);
      };

      const applyHlRails = () => {
        const tv = chartState.tv;
        if (!tv) return;
        const show = chartState.hl !== false;
        tv.highLine?.applyOptions({ lineVisible: show, axisLabelVisible: show });
        tv.lowLine?.applyOptions({ lineVisible: show, axisLabelVisible: show });
      };

      const applyPinLine = () => {
        const tv = chartState.tv;
        if (!tv?.pinLine) return;
        const price = Number(chartState.pinPrice);
        const show = Boolean(chartState.pin) && Number.isFinite(price) && price > 0;
        tv.pinLine.applyOptions({
          price: show ? price : 0,
          lineVisible: show,
          axisLabelVisible: show,
        });
        const pinHud = $("[data-chart-hud-pin]");
        if (pinHud) {
          pinHud.hidden = !show;
          pinHud.textContent = show ? `Pin ${formatTick(price)}` : "";
        }
      };

      const zoomTimeScale = (direction) => {
        const ts = chartState.tv?.chart.timeScale();
        if (!ts?.getVisibleLogicalRange || !ts.setVisibleLogicalRange) return;
        const range = ts.getVisibleLogicalRange();
        if (!range || !Number.isFinite(range.from) || !Number.isFinite(range.to)) return;
        const factor = direction > 0 ? 0.72 : 1.38;
        const mid = (range.from + range.to) / 2;
        const half = Math.max(((range.to - range.from) / 2) * factor, 1.5);
        ts.setVisibleLogicalRange({ from: mid - half, to: mid + half });
      };

      const scrollToLatest = () => {
        const ts = chartState.tv?.chart.timeScale();
        if (ts?.scrollToRealTime) ts.scrollToRealTime();
        else if (ts?.scrollToPosition) ts.scrollToPosition(0, false);
      };

      const currentPlotRows = () => (chartState.data?.candles || chartState.data?.points || []).map((point) => ({
        ...point,
        close: point.close ?? point.value,
        high: point.high ?? point.value,
        low: point.low ?? point.value,
      }));

      const refitCurrent = () => {
        const rows = currentPlotRows();
        if (chartState.tv && rows.length) fitTvViewport(chartState.tv, rows, chartState.data?.livePrice ?? rows[rows.length - 1].close);
      };

      const resetChartView = () => {
        chartState.compact = false;
        chartState.pin = false;
        chartState.pinPrice = null;
        syncNavButtons();
        sizeTvPanes();
        applyPinLine();
        refitCurrent();
        scrollToLatest();
      };

      $("[data-chart-fit]")?.addEventListener("click", () => {
        if (!chartState.tv || !chartState.data) return;
        const rows = currentPlotRows();
        if (rows.length) fitTvViewport(chartState.tv, rows, chartState.data.livePrice ?? rows[rows.length - 1].close);
      });
      $$("[data-chart-zoom]").forEach((button) => {
        button.addEventListener("click", () => zoomTimeScale(Number(button.dataset.chartZoom) || 1));
      });
      $("[data-chart-latest]")?.addEventListener("click", scrollToLatest);
      $("[data-chart-hl]")?.addEventListener("click", () => {
        chartState.hl = chartState.hl === false;
        syncNavButtons();
        applyHlRails();
      });
      $("[data-chart-vol-sma]")?.addEventListener("click", () => {
        chartState.volSma = chartState.volSma === false;
        syncNavButtons();
        if (chartState.data) renderChart();
      });
      $("[data-chart-compact]")?.addEventListener("click", () => {
        chartState.compact = !chartState.compact;
        syncNavButtons();
        sizeTvPanes();
        refitCurrent();
      });
      $("[data-chart-tz]")?.addEventListener("click", () => {
        chartState.utc = !chartState.utc;
        syncNavButtons();
        updatePrintAge();
      });
      $("[data-chart-pin]")?.addEventListener("click", () => {
        chartState.pin = !chartState.pin;
        if (!chartState.pin) chartState.pinPrice = null;
        syncNavButtons();
        applyPinLine();
      });
      $("[data-chart-reset]")?.addEventListener("click", resetChartView);
      syncNavButtons();
      $$("[data-chart-period]").forEach((button) => {
        button.addEventListener("click", () => {
          chartState.period = Number(button.dataset.chartPeriod) || 8;
          $$("[data-chart-period]").forEach((item) => item.classList.toggle("is-active", item === button));
          if (chartState.data) renderChart();
        });
      });

      const indicatorOn = (name) => chartState.indicators?.[name] !== false;
      const syncIndicatorLegend = () => {
        const names = ["sma", "ema", "rsi", "macd", "bollinger"]
          .filter(indicatorOn)
          .map((name) => ({ sma: "SMA", ema: "EMA", rsi: "RSI", macd: "MACD", bollinger: "BB" }[name]));
        setText("[data-chart-legend-indicator]", names.join(" · ") || "Off");
      };
      indicatorButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.dataset.chartIndicator || "sma";
          chartState.indicators[name] = !indicatorOn(name);
          chartState.indicator = name;
          button.classList.toggle("is-active", indicatorOn(name));
          button.setAttribute("aria-pressed", String(indicatorOn(name)));
          syncIndicatorLegend();
          if (chartState.data) renderChart();
        });
      });

      function recentPriceDomain(points, livePrice) {
        const last = points[points.length - 1];
        const lastPrice = Number.isFinite(livePrice) ? livePrice : (last.close ?? last.value);
        const window = points.slice(-Math.min(points.length, 48));
        const lows = window.map((point) => (Number.isFinite(point.low) ? point.low : point.value));
        const highs = window.map((point) => (Number.isFinite(point.high) ? point.high : point.value));
        const closes = window.map((point) => point.close ?? point.value);
        let minValue = Math.min(lastPrice, ...lows);
        let maxValue = Math.max(lastPrice, ...highs);
        const sorted = [...closes].filter(Number.isFinite).sort((a, b) => a - b);
        const mid = sorted[Math.floor(sorted.length / 2)] || lastPrice;
        if (Number.isFinite(lastPrice) && lastPrice > 0 && (maxValue > mid * 8 || minValue < mid / 8 || maxValue > lastPrice * 2.2 || minValue < lastPrice * 0.45)) {
          const near = window.filter((point) => {
            const close = point.close ?? point.value;
            return close >= mid * 0.35 && close <= Math.max(mid * 2.8, lastPrice * 1.15);
          });
          const use = near.length >= 3 ? near : window;
          minValue = Math.min(lastPrice, ...use.map((point) => (Number.isFinite(point.low) ? point.low : point.value)));
          maxValue = Math.max(lastPrice, ...use.map((point) => (Number.isFinite(point.high) ? point.high : point.value)));
        }
        minValue = Math.min(minValue, lastPrice);
        maxValue = Math.max(maxValue, lastPrice);
        const pad = Math.max((maxValue - minValue) * 0.08, Math.abs(lastPrice) * 0.04, 1e-5);
        return { minValue: minValue - pad, maxValue: maxValue + pad, lastPrice };
      }

      function fitTvViewport(tv, rows, livePrice) {
        const width = Math.floor(board.clientWidth);
        const height = Math.floor(board.clientHeight);
        if (width > 40 && height > 80) tv.chart.resize(width, height);
        const showVolume = chartState.volume !== false;
        const showRsi = indicatorOn("rsi");
        const showMacd = indicatorOn("macd");
        const panes = tv.chart.panes?.() || [];
        const paneBudget = Math.max(height, 220);
        const compact = Boolean(chartState.compact);
        if (panes[1]?.setHeight) panes[1].setHeight(showVolume ? Math.max(compact ? 48 : 72, Math.round(paneBudget * (compact ? 0.12 : 0.2))) : 0);
        if (panes[2]?.setHeight) panes[2].setHeight(showRsi ? Math.max(compact ? 40 : 56, Math.round(paneBudget * (compact ? 0.1 : 0.16))) : 0);
        if (panes[3]?.setHeight) panes[3].setHeight(showMacd ? Math.max(compact ? 44 : 64, Math.round(paneBudget * (compact ? 0.11 : 0.18))) : 0);
        tv.chart.timeScale().fitContent();
        const domain = recentPriceDomain(rows.map((row) => ({ ...row, value: row.close })), livePrice);
        const range = { minValue: domain.minValue, maxValue: domain.maxValue };
        tv.candles.applyOptions({
          lastValueVisible: true,
          priceLineVisible: true,
          autoscaleInfoProvider: () => ({ priceRange: range }),
        });
        tv.overlay.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: range }) });
        tv.emaLine?.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: range }) });
        tv.bandHigh.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: range }) });
        tv.bandLow.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: range }) });
        const scale = tv.candles.priceScale();
        if (chartState.log) {
          scale.applyOptions({ autoScale: true, scaleMargins: { top: 0.08, bottom: 0.06 } });
        } else {
          scale.applyOptions({ autoScale: false, scaleMargins: { top: 0.08, bottom: 0.06 } });
          if (scale.setVisibleRange) scale.setVisibleRange({ from: domain.minValue, to: domain.maxValue });
        }
      }

      function renderChart() {
        const allCandles = chartState.data?.candles || [];
        const allPoints = allCandles.length ? allCandles : (chartState.data?.points || []);
        if (!allPoints.length) return;
        ensureTvBoard().then(applyTvData).catch(() => {
          setChartEmpty("Chart library unavailable", "TradingView Lightweight Charts did not load. The tape is still read from Testnet.");
        });
      }

      function sizeTvPanes() {
        const panes = chartState.tv?.chart.panes?.() || [];
        const compact = Boolean(chartState.compact);
        if (panes[1]?.setStretchFactor) panes[1].setStretchFactor(chartState.volume !== false ? (compact ? 0.16 : 0.28) : 0);
        if (panes[2]?.setStretchFactor) panes[2].setStretchFactor(indicatorOn("rsi") ? (compact ? 0.12 : 0.2) : 0);
        if (panes[3]?.setStretchFactor) panes[3].setStretchFactor(indicatorOn("macd") ? (compact ? 0.14 : 0.22) : 0);
      }

      function ensureTvBoard() {
        if (chartState.tv) return Promise.resolve(chartState.tv);
        if (chartState.tvReady) return chartState.tvReady;
        chartState.tvReady = ensureTvLib().then(() => {
          if (chartState.tv) return chartState.tv;
          const LC = window.LightweightCharts;
          const chart = LC.createChart(board, {
            autoSize: true,
            layout: {
              background: { type: LC.ColorType.Solid, color: "#101214" },
              textColor: "#c5ccd4",
              fontSize: 12,
              fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
            },
            grid: {
              vertLines: { color: "#1d2024" },
              horzLines: { color: "#25292e" },
            },
            crosshair: {
              mode: LC.CrosshairMode.Normal,
              vertLine: { color: "#787b86", labelBackgroundColor: "#2b2f36" },
              horzLine: { color: "#787b86", labelBackgroundColor: "#2b2f36" },
            },
            rightPriceScale: { borderColor: "#2b2f36", scaleMargins: { top: 0.08, bottom: 0.04 } },
            timeScale: { borderColor: "#2b2f36", timeVisible: true, secondsVisible: false, rightOffset: 6 },
            localization: { priceFormatter: (price) => formatTick(price) },
          });
          const candles = chart.addSeries(LC.CandlestickSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
            borderUpColor: "#26a69a",
            borderDownColor: "#ef5350",
            priceLineVisible: true,
            lastValueVisible: true,
            priceLineColor: "#26a69a",
            priceLineWidth: 1,
            priceFormat: { type: "price", precision: 5, minMove: 0.00001 },
          });
          const volume = chart.addSeries(LC.HistogramSeries, {
            priceFormat: { type: "volume" },
            priceLineVisible: false,
            lastValueVisible: false,
          }, 1);
          volume.priceScale().applyOptions({ scaleMargins: { top: 0.16, bottom: 0 } });
          const lineOpts = (color, width = 2) => ({
            color,
            lineWidth: width,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          const overlay = chart.addSeries(LC.LineSeries, lineOpts("#f7c66a"));
          const closeLine = chart.addSeries(LC.LineSeries, { ...lineOpts("#4a90d9", 2), lastValueVisible: true, priceLineVisible: true });
          closeLine.applyOptions({ visible: false });
          const emaLine = chart.addSeries(LC.LineSeries, lineOpts("#ff8a4c"));
          const bandHigh = chart.addSeries(LC.LineSeries, lineOpts("#d78cff", 1));
          const bandLow = chart.addSeries(LC.LineSeries, lineOpts("#d78cff", 1));
          const volumeSma = chart.addSeries(LC.LineSeries, lineOpts("#8be9fd", 1), 1);
          const rsi = chart.addSeries(LC.LineSeries, lineOpts("#b687f0"), 2);
          const osc = rsi;
          rsi.createPriceLine({ price: 70, color: "#ef5350", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "70" });
          rsi.createPriceLine({ price: 30, color: "#26a69a", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "30" });
          const macdLine = chart.addSeries(LC.LineSeries, lineOpts("#26a69a"), 3);
          const macdSignal = chart.addSeries(LC.LineSeries, lineOpts("#ef5350", 1), 3);
          const macdHist = chart.addSeries(LC.HistogramSeries, {
            priceLineVisible: false,
            lastValueVisible: false,
          }, 3);
          const highLine = candles.createPriceLine({ price: 0, color: "#74d3a0", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "H" });
          const lowLine = candles.createPriceLine({ price: 0, color: "#ef9a9a", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "L" });
          const pinLine = candles.createPriceLine({ price: 0, color: "#f7c66a", lineWidth: 1, lineStyle: 0, axisLabelVisible: false, title: "Pin", lineVisible: false });
          const hudPrintsFor = (time) => {
            const count = chartState.printByTime?.get(time);
            return Number.isFinite(count) && count > 0 ? `${count} print${count === 1 ? "" : "s"}` : "—";
          };
          chart.subscribeCrosshairMove((param) => {
            const candle = param.seriesData?.get(candles);
            if (!candle || param.time == null) {
              hideChartHud();
              return;
            }
            const timeMs = typeof param.time === "number" ? param.time * 1000 : Date.parse(param.time);
            const volumePoint = param.seriesData.get(volume);
            const smaPoint = param.seriesData.get(overlay);
            const emaPoint = param.seriesData.get(emaLine);
            const rsiPoint = param.seriesData.get(rsi);
            const macdPoint = param.seriesData.get(macdLine);
            const parts = [];
            if (indicatorOn("sma") && smaPoint) parts.push(`SMA ${formatTick(smaPoint.value)}`);
            if (indicatorOn("ema") && emaPoint) parts.push(`EMA ${formatTick(emaPoint.value)}`);
            if (indicatorOn("rsi") && rsiPoint) parts.push(`RSI ${Number(rsiPoint.value).toFixed(1)}`);
            if (indicatorOn("macd") && macdPoint) parts.push(`MACD ${formatTick(macdPoint.value)}`);
            setText("[data-chart-hud-time]", formatHudTime(timeMs));
            setText("[data-chart-hud-ohlc]", `O ${formatTick(candle.open)}  H ${formatTick(candle.high)}  L ${formatTick(candle.low)}  C ${formatTick(candle.close)}`);
            setText("[data-chart-hud-vol]", `${formatIou(volumePoint?.value || 0)} XRP`);
            setText("[data-chart-hud-prints]", hudPrintsFor(param.time));
            setText("[data-chart-hud-ind]", parts.join("  ") || "—");
            setText("[data-chart-ohlc-open]", formatAxis(candle.open));
            setText("[data-chart-ohlc-high]", formatAxis(candle.high));
            setText("[data-chart-ohlc-low]", formatAxis(candle.low));
            setText("[data-chart-ohlc-close]", formatAxis(candle.close));
            if (hud) hud.hidden = false;
          });
          chart.subscribeClick((param) => {
            const candle = param.seriesData?.get(candles);
            if (!candle || !Number.isFinite(candle.close)) return;
            fillTicketPrices(candle.close, true);
            if (chartState.pin) {
              chartState.pinPrice = candle.close;
              applyPinLine();
            }
          });
          chartState.tv = { chart, candles, volume, overlay, closeLine, emaLine, bandHigh, bandLow, volumeSma, rsi, osc, macdLine, macdSignal, macdHist, highLine, lowLine, pinLine };
          sizeTvPanes();
          applyPlotChrome();
          const refit = () => {
            if (!chartState.tv || !chartState.data) return;
            const rows = (chartState.data.candles || chartState.data.points || []).map((point) => ({
              ...point,
              close: point.close ?? point.value,
              high: point.high ?? point.value,
              low: point.low ?? point.value,
            }));
            if (rows.length) fitTvViewport(chartState.tv, rows, chartState.data.livePrice ?? rows[rows.length - 1].close);
          };
          window.addEventListener("resize", refit);
          if (typeof ResizeObserver === "function") new ResizeObserver(refit).observe(board);
          return chartState.tv;
        });
        return chartState.tvReady;
      }

      function applyTvData() {
        const tv = chartState.tv;
        const allCandles = chartState.data?.candles || [];
        const allPoints = allCandles.length ? allCandles : (chartState.data?.points || []);
        if (!tv || !allPoints.length) return;
        const rows = allPoints.map((point) => {
          const close = point.close ?? point.value;
          const open = Number.isFinite(point.open) ? point.open : close;
          const high = Number.isFinite(point.high) ? point.high : close;
          const low = Number.isFinite(point.low) ? point.low : close;
          return {
            time: Math.floor(point.time / 1000),
            open,
            high,
            low,
            close,
            volume: point.volume || 0,
            prints: Number(point.prints) || 0,
          };
        }).filter((row, index, list) => Number.isFinite(row.time) && (index === 0 || row.time > list[index - 1].time));
        if (!rows.length) return;
        chartState.printByTime = new Map(rows.map((row) => [row.time, row.prints]));
        const values = rows.map((row) => row.close);
        const times = rows.map((row) => row.time);
        const maPeriod = Math.min(Math.max(chartState.period || 8, 2), Math.max(2, values.length));
        tv.closeLine?.setData(rows.map((row) => ({ time: row.time, value: row.close })));
        tv.closeLine?.applyOptions({ visible: chartState.style === "line" });
        tv.candles.applyOptions({ visible: chartState.style !== "line" });
        const sma = movingAverage(values, maPeriod);
        const ema = exponentialAverage(values, maPeriod);
        const mean = movingAverage(values, maPeriod);
        const standardDeviation = values.map((_, index) => {
          if (index < maPeriod - 1) return null;
          const slice = values.slice(index - maPeriod + 1, index + 1);
          const average = mean[index];
          return Math.sqrt(slice.reduce((sum, value) => sum + (value - average) ** 2, 0) / maPeriod);
        });
        const upper = mean.map((value, index) => (value == null || standardDeviation[index] == null ? null : value + standardDeviation[index] * 2));
        const lower = mean.map((value, index) => (value == null || standardDeviation[index] == null ? null : value - standardDeviation[index] * 2));
        const rsi = relativeStrength(values, Math.min(14, Math.max(5, values.length - 1)));
        const macdFast = exponentialAverage(values, Math.min(12, values.length));
        const macdSlow = exponentialAverage(values, Math.min(26, Math.max(12, values.length)));
        const macd = values.map((_, index) => (macdFast[index] == null || macdSlow[index] == null ? null : macdFast[index] - macdSlow[index]));
        const macdFilled = macd.map((value) => (value == null ? 0 : value));
        const macdSignal = exponentialAverage(macdFilled, Math.min(9, Math.max(3, values.length)));
        const macdSignalSafe = macd.map((value, index) => (value == null || macdSignal[index] == null ? null : macdSignal[index]));
        const showVolume = chartState.volume !== false;
        const showSma = indicatorOn("sma") || indicatorOn("bollinger");
        const volSma = movingAverage(rows.map((row) => row.volume), maPeriod);
        tv.candles.setData(rows.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
        tv.volume.setData(rows.map((row) => ({
          time: row.time,
          value: row.volume,
          color: row.close >= row.open ? "rgba(38, 166, 154, 0.62)" : "rgba(239, 83, 80, 0.62)",
        })));
        tv.volume.applyOptions({ visible: showVolume });
        const showVolSma = showVolume && chartState.volSma !== false;
        tv.volumeSma?.setData(showVolSma ? seriesPoints(times, volSma) : []);
        tv.volumeSma?.applyOptions({ visible: showVolSma });
        tv.overlay.setData(showSma ? seriesPoints(times, sma) : []);
        tv.emaLine?.setData(indicatorOn("ema") ? seriesPoints(times, ema) : []);
        tv.bandHigh.setData(indicatorOn("bollinger") ? seriesPoints(times, upper) : []);
        tv.bandLow.setData(indicatorOn("bollinger") ? seriesPoints(times, lower) : []);
        tv.rsi.setData(indicatorOn("rsi") ? seriesPoints(times, rsi) : []);
        tv.rsi.applyOptions({ visible: indicatorOn("rsi") });
        if (indicatorOn("rsi")) {
          tv.rsi.priceScale().applyOptions({ autoScale: false });
          tv.rsi.priceScale().setVisibleRange?.({ from: 0, to: 100 });
        }
        tv.macdLine?.setData(indicatorOn("macd") ? seriesPoints(times, macd) : []);
        tv.macdSignal?.setData(indicatorOn("macd") ? seriesPoints(times, macdSignalSafe) : []);
        tv.macdHist?.setData(indicatorOn("macd") ? rows.map((row, index) => {
          const value = macd[index] == null || macdSignalSafe[index] == null ? 0 : macd[index] - macdSignalSafe[index];
          return { time: row.time, value, color: value >= 0 ? "rgba(38, 166, 154, 0.55)" : "rgba(239, 83, 80, 0.55)" };
        }) : []);
        const last = rows[rows.length - 1];
        const lastUp = last.close >= last.open;
        const windowHigh = Math.max(...rows.map((row) => row.high));
        const windowLow = Math.min(...rows.map((row) => row.low));
        tv.highLine?.applyOptions({ price: windowHigh });
        tv.lowLine?.applyOptions({ price: windowLow });
        applyHlRails();
        applyPinLine();
        tv.candles.applyOptions({
          priceLineColor: lastUp ? "#26a69a" : "#ef5350",
          lastValueVisible: chartState.style !== "line",
          priceLineVisible: chartState.style !== "line",
          visible: chartState.style !== "line",
        });
        applyPlotChrome();
        sizeTvPanes();
        syncIndicatorLegend();
        liveChart.hidden = false;
        emptyChart.hidden = true;
        emptyChart.classList.remove("is-loading");
        const livePrice = chartState.data.livePrice ?? last.close;
        fitTvViewport(tv, rows, livePrice);
        requestAnimationFrame(() => fitTvViewport(tv, rows, livePrice));
        setText("[data-chart-stat-sma]", formatAxis(sma[sma.length - 1]));
        setText("[data-chart-stat-high]", formatAxis(Math.max(...rows.map((row) => row.high))));
        setText("[data-chart-stat-low]", formatAxis(Math.min(...rows.map((row) => row.low))));
        setText("[data-chart-symbol-price]", formatAxis(chartState.data.livePrice ?? last.close));
        setText("[data-chart-symbol-change]", formatPercent(chartState.data.change));
      }

      const formatTick = (value) => {
        if (!Number.isFinite(value)) return "—";
        if (chartState.data?.quote === "XRP") return formatCompact(value);
        return formatUsd(value);
      };
      const formatAxis = (value) => {
        if (!Number.isFinite(value)) return "—";
        if (chartState.data?.quote === "XRP") return `${formatCompact(value)} XRP`;
        return formatUsd(value);
      };

      function paintLedgerChart() {
        if (state.network === "production") {
          liveChart.hidden = true;
          emptyChart.hidden = true;
          hideChartHud();
          return;
        }
        const label = pairLabels[chartState.pair] || "PND / XRP";
        const trades = state.verification.trades || [];
        const offers = state.verification.offers || [];
        const hasMarket = Boolean(state.verification.market) || trades.length > 0 || offers.length > 0;
        const tapeLoading = state.verification.tapeLoading !== false && !state.verification.poolTxComplete;
        setText("[data-chart-symbol]", label);
        setText("[data-chart-timeframe]", rangeLabels[chartState.range]);
        setText("[data-chart-legend-primary]", label);
        setText("[data-chart-symbol-source]", `XRPL Testnet · live ${LEDGER_POLL_MS / 1000}s`);
        setText("[data-chart-source-label]", `XRPL Testnet · live ${LEDGER_POLL_MS / 1000}s`);
        setText("[data-chart-source]", `Source: XRPL Testnet · live ${LEDGER_POLL_MS / 1000}s`);
        if (!hasMarket && (tapeLoading || state.verification.tapeLoading)) {
          setChartLoading();
          return;
        }
        if (!hasMarket) {
          chartState.data = null;
          resetChartStats();
          setChartEmpty(
            `No ${label} candles on Testnet`,
            "There is no AMM or DEX book to plot. Last price, volume, and candles stay blank.",
          );
          return;
        }
        const windows = { "1m": 6 * 60 * 60 * 1000, "5m": 24 * 60 * 60 * 1000, "15m": 3 * 24 * 60 * 60 * 1000, "30m": 7 * 24 * 60 * 60 * 1000, "1h": 14 * 24 * 60 * 60 * 1000, "4h": 30 * 24 * 60 * 60 * 1000, "1d": 90 * 24 * 60 * 60 * 1000 };
        const windowMs = windows[chartState.range];
        const cutoff = windowMs ? Date.now() - windowMs : 0;
        let used = trades.filter((trade) => trade.time && trade.time >= cutoff).sort((a, b) => a.time - b.time);
        if (!used.length) used = [...trades].filter((trade) => trade.time).sort((a, b) => a.time - b.time);
        if (!used.length) {
          if (hasMarket) {
            const spot = Number(String(getMarketPrice()).replace(" XRP", ""));
            if (Number.isFinite(spot) && spot > 0) {
              setText("[data-chart-stat-price]", formatAxis(spot));
              setText("[data-chart-symbol-price]", formatAxis(spot));
            }
          }
          if (tapeLoading || state.verification.tapeLoading) {
            setChartLoading("Fetching validated prints…", "The PND/XRP pool is live. Candles appear when the first prints arrive.");
            return;
          }
          chartState.data = null;
          resetChartStats();
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
        const lastPrint = [...used].sort((a, b) => b.time - a.time)[0];
        const vwap = tapeVwap(used);
        const spot = ammSpotNumber();
        const basis = Number.isFinite(spot) && spot > 0 && Number.isFinite(livePrice) && livePrice > 0
          ? ((livePrice - spot) / spot) * 100
          : NaN;
        chartState.data = { points, candles, livePrice, change, volume, open, high, low, vwap, spot, basis, quote: "XRP", intervalMs };
        chartState.lastPrintTime = lastPrint?.time || null;
        updatePrintAge();
        ticketQuotes.last = livePrice;
        ticketQuotes.high = high;
        ticketQuotes.low = low;
        ticketQuotes.vwap = vwap;
        ticketQuotes.spot = spot;
        syncTicketQuotes();
        setText("[data-chart-stat-price]", formatAxis(livePrice));
        setSignedText("[data-chart-stat-change]", formatPercent(change), change);
        setText("[data-chart-stat-volume]", volume > 0 ? `${formatIou(volume)} XRP` : "—");
        setText("[data-chart-stat-vwap]", Number.isFinite(vwap) ? formatAxis(vwap) : "—");
        setText("[data-chart-stat-spot]", Number.isFinite(spot) ? formatAxis(spot) : "—");
        setSignedText("[data-chart-stat-basis]", Number.isFinite(basis) ? formatPercent(basis) : "—", basis);
        setText("[data-chart-stat-prints]", String(used.length));
        setText("[data-chart-stat-market-cap]", state.verification.treasuryPnd != null ? `${formatIou(state.verification.treasuryPnd)} PND` : "—");
        setText("[data-chart-ohlc-open]", formatAxis(open));
        setText("[data-chart-ohlc-high]", formatAxis(high));
        setText("[data-chart-ohlc-low]", formatAxis(low));
        setText("[data-chart-ohlc-close]", formatAxis(livePrice));
        setSignedText("[data-chart-ohlc-change]", formatPercent(change), change);
        setSignedText("[data-chart-symbol-change]", formatPercent(change), change);
        paintRangeMeter(livePrice, high, low);
        paintWalletStats();
        paintSnapshotPrints(used);
        if (followLast) fillTicketPrices(livePrice, true);
        const status = $("[data-chart-stat-status]");
        if (status) {
          status.classList.toggle("is-gated", false);
          status.classList.toggle("is-live", true);
          status.textContent = candles.length
            ? `${candles.length} candle${candles.length === 1 ? "" : "s"} · ${used.length} trade${used.length === 1 ? "" : "s"}`
            : `${used.length} trade${used.length === 1 ? "" : "s"}`;
        }
        prefillDexPrices(livePrice);
        updateBarLeft();
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
           chartState.data = { points, candles, livePrice, change, volume, marketCap, open, high, low, intervalMs };
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
        paintLedgerChart();
      };
      window.setInterval(() => {
        updatePrintAge();
        updateBarLeft();
      }, 1000);
      const toggleIndicator = (name) => {
        [...indicatorButtons].find((item) => item.dataset.chartIndicator === name)?.click();
      };
      window.addEventListener("keydown", (event) => {
        if (root.dataset.mode !== "chart") return;
        if (event.target.closest("input, textarea, select, [contenteditable]")) return;
        const key = event.key.toLowerCase();
        const ranges = { 1: "1m", 5: "5m", q: "15m", w: "30m", h: "1h", 4: "4h", d: "1d" };
        if (ranges[key]) {
          event.preventDefault();
          setRange(ranges[key]);
          return;
        }
        if (key === "v") {
          event.preventDefault();
          volumeToggle?.click();
        } else if (key === "s") toggleIndicator("sma");
        else if (key === "e") toggleIndicator("ema");
        else if (key === "r") toggleIndicator("rsi");
        else if (key === "m") toggleIndicator("macd");
        else if (key === "b") toggleIndicator("bollinger");
        else if (key === "l") $("[data-chart-log]")?.click();
        else if (key === "g") $("[data-chart-grid]")?.click();
        else if (key === "f") $("[data-chart-fit]")?.click();
        else if (key === "-" || key === "_") zoomTimeScale(-1);
        else if (key === "+" || key === "=") zoomTimeScale(1);
        else if (key === "." || key === "end") scrollToLatest();
        else if (key === "0") resetChartView();
        else if (key === "u") $("[data-chart-tz]")?.click();
        else if (key === "p") $("[data-chart-pin]")?.click();
        else if (key === "c") $("[data-chart-compact]")?.click();
        else if (key === "y") $("[data-chart-hl]")?.click();
        else if (key === "k") $("[data-chart-vol-sma]")?.click();
        else if (key === "escape") hideChartHud();
      });
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
      let tapeLoading = false;
      let tapeMarker = null;
      if (amm?.account) {
        const history = await wsRpc(endpoint, "account_tx", {
          account: amm.account,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 80,
          forward: false,
        }, signal).catch(() => null);
        poolTxs = history?.result?.transactions || [];
        tapeMarker = history?.result?.marker || null;
        poolTxComplete = !tapeMarker;
        tapeLoading = Boolean(tapeMarker);
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
        tapeLoading,
        tapeMarker,
        trades,
        treasuryPnd,
        treasuryXrpDrops,
        treasuryAccount: treasuryLinesResponse?.result?.account || null,
        walletPnd,
        walletXrpDrops,
        walletAccount,
      };
    }

    async function continuePoolTape(signal, generation) {
      const ammAccount = state.verification.ammInfo?.amm?.account;
      if (!ammAccount || !state.verification.tapeMarker) return;
      const endpoint = networks[state.network].endpoint;
      let poolTxs = [...(state.verification.poolTxs || [])];
      let marker = state.verification.tapeMarker;
      for (let page = 0; page < 3 && poolTxs.length < 200 && marker; page += 1) {
        const history = await wsRpc(endpoint, "account_tx", {
          account: ammAccount,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 80,
          forward: false,
          marker,
        }, signal).catch(() => null);
        if (!isCurrent(generation) || signal.aborted) return;
        const batch = history?.result?.transactions || [];
        poolTxs.push(...batch);
        marker = history?.result?.marker || null;
        state.verification = {
          ...state.verification,
          poolTxs,
          trades: ledgerTrades(poolTxs),
          tapeMarker: marker,
          poolTxComplete: !marker,
          tapeLoading: Boolean(marker),
        };
        setMarketState(state.verification);
        if (!marker || !batch.length) break;
      }
      if (!isCurrent(generation)) return;
      state.verification = { ...state.verification, tapeLoading: false, poolTxComplete: !state.verification.tapeMarker };
      setMarketState(state.verification);
    }

    function setPollChrome({ busy = false, at = lastPollAt, ledger = state.verification.ledger?.seq, added = 0 } = {}) {
      const refreshBtn = $("[data-refresh]");
      if (refreshBtn) {
        refreshBtn.classList.toggle("is-busy", Boolean(busy));
        refreshBtn.setAttribute("aria-busy", String(Boolean(busy)));
      }
      const seconds = LEDGER_POLL_MS / 1000;
      const hidden = document.hidden;
      root.dataset.poll = busy ? "busy" : hidden ? "paused" : "live";
      const clock = at
        ? new Date(at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })
        : "waiting";
      const remain = at
        ? Math.max(0, Math.ceil((LEDGER_POLL_MS - (Date.now() - at)) / 1000))
        : seconds;
      const pollText = hidden ? "Paused" : busy ? "Polling…" : `Live · ${remain}s`;
      setText("[data-poll-note]", added > 0 ? `${pollText} · +${added}` : pollText);
      setText("[data-chart-stat-poll]", busy ? `now · ${clock}` : `${remain}s · ${clock}`);
      setText("[data-data-poll]", clock);
      setText("[data-data-poll-note]", ledger ? `validated ${ledger} · ${seconds}s` : `validated · ${seconds}s`);
    }

    function flashNewPrints(count) {
      if (!(count > 0)) return;
      root.dataset.freshPrints = String(count);
      $$("[data-price], [data-chart-stat-price], [data-chart-symbol-price]").forEach((node) => {
        node.classList.remove("is-fresh");
        void node.offsetWidth;
        node.classList.add("is-fresh");
      });
      $("[data-dex-tape]")?.classList.add("is-fresh");
      window.setTimeout(() => {
        root.querySelectorAll(".is-fresh").forEach((node) => node.classList.remove("is-fresh"));
        delete root.dataset.freshPrints;
      }, 1600);
    }

    async function pollLedger() {
      return refresh({ quiet: true });
    }

    function startLedgerPoll() {
      if (pollTimer) window.clearInterval(pollTimer);
      pollTimer = window.setInterval(pollLedger, LEDGER_POLL_MS);
      if (!root.dataset.pollTick) {
        root.dataset.pollTick = "1";
        window.setInterval(() => {
          if (!pollInFlight && lastPollAt) setPollChrome({ busy: false, at: lastPollAt, ledger: state.verification.ledger?.seq });
        }, 1000);
      }
      document.addEventListener("visibilitychange", onTradeVisibility);
      setPollChrome({ busy: false });
    }

    function onTradeVisibility() {
      setPollChrome({ busy: pollInFlight });
      if (!document.hidden) pollLedger();
    }

    async function refresh(options = {}) {
      const quiet = Boolean(options.quiet);
      if (state.network === "production") {
        refreshController?.abort();
        applyMainnetGate();
        pollInFlight = false;
        setPollChrome({ busy: false });
        return;
      }
      if (quiet && (document.hidden || pollInFlight)) return;
      const generation = ++state.requestGeneration;
      refreshController?.abort();
      refreshController = new AbortController();
      const { signal } = refreshController;
      pollInFlight = true;
      setPollChrome({ busy: true });
      if (!quiet) {
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
      }
      const icon = $("[data-issuer-icon]");
      if (!issuer) {
        setStatus("offline", "Issuer unavailable");
        setText("[data-issuer-status]", "Issuer address unavailable");
        setText("[data-issuer-detail]", "The published issuer address is required before ledger checks can run.");
        if (icon) icon.dataset.state = "error";
        state.verification = { ...state.verification, issuer: false, issued: false, market: false, tapeLoading: false };
        setMarketState(state.verification);
        pollInFlight = false;
        setPollChrome({ busy: false });
        return;
      }
      try {
        const previous = state.verification;
        let verification = await readMarketState(signal);
        if (!isCurrent(generation)) return;
        if (quiet) verification = mergePoolHistory(previous, verification);
        const added = countNewPrints(previous, verification);
        state.verification = verification;
        lastPollAt = Date.now();
        const ledgerIndex = verification.ledger?.seq || "available";
        setStatus("online", quiet ? `Live · ledger ${ledgerIndex}` : `Validated ledger ${ledgerIndex}`);
        setMarketState(verification);
        setPollChrome({ busy: false, at: lastPollAt, ledger: verification.ledger?.seq, added });
        flashNewPrints(added);
        if (!quiet && verification.tapeMarker) await continuePoolTape(signal, generation);
        if (icon) icon.dataset.state = verification.issuer ? "ready" : "error";
        if (!quiet) {
          setText("[data-issuer-status]", verification.market
            ? "PND/XRP market on this network"
            : verification.issued
              ? "Issued · no AMM or DEX book"
              : state.network === "testnet"
                ? "Testnet issuer check"
                : "Mainnet $PND not issued");
        }
      } catch (error) {
        if (isAbortError(error) || !isCurrent(generation)) return;
        if (!quiet) {
          setStatus("offline", "Ledger unavailable");
          setText("[data-issuer-status]", "Issuer check unavailable");
          setText("[data-issuer-detail]", error.message || "The selected XRPL endpoint did not respond.");
          if (icon) icon.dataset.state = "error";
          state.verification = { ...state.verification, issuer: false, issued: false, orderBook: false, amm: false, market: false, tapeLoading: false };
          setMarketState(state.verification);
        }
      } finally {
        if (isCurrent(generation)) {
          pollInFlight = false;
          setPollChrome({ busy: false, at: lastPollAt });
        }
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
    $("[data-return-testnet]")?.addEventListener("click", returnToTestnet);
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
    refresh().finally(() => startLedgerPoll());
    window.PondXaman?.init?.();
  }

  window.PondTrade = { ...(window.PondTrade || {}), init, connectWallet: () => {} };
  init();
})();