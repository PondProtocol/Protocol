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
    <div class="trade-terminal-head">
      <div>
        <p class="trade-eyebrow">POND / XRPL TERMINAL</p>
        <h2>Trade with verified state</h2>
        <p class="trade-lede">
          Read the ledger first. Sign only what you can inspect.
        </p>
      </div>
      <div class="trade-network" role="group" aria-label="Trading network">
        <span class="trade-network-label">Network</span>
        <button type="button" class="trade-network-button is-active"
          data-network="testnet" aria-pressed="true">Testnet</button>
        <button type="button" class="trade-network-button"
          data-network="production" aria-pressed="false">Production</button>
      </div>
    </div>

    <div class="trade-statusbar" role="status" aria-live="polite">
      <span class="trade-pulse" data-network-dot></span>
      <strong data-network-label>XRPL Testnet</strong>
      <span data-ledger-status>Checking ledger…</span>
      <button type="button" class="trade-refresh" data-refresh>Refresh</button>
    </div>

    <div class="trade-grid">
      <section class="trade-card trade-swap-card"
        aria-labelledby="trade-swap-title">
        <div class="trade-card-head">
          <div>
            <p class="trade-kicker">Swap</p>
            <h3 id="trade-swap-title">Exchange assets</h3>
          </div>
          <span class="trade-badge trade-badge-muted">Market gated</span>
        </div>
        <div class="trade-fields">
          <label class="trade-field">
            <span>Sell</span>
            <span class="trade-input-row">
              <span class="trade-amount-placeholder"
                aria-label="Amount to sell">0.00</span>
              <select aria-label="Asset to sell" data-sell-asset>
                <option value="pnd">$PND</option>
                <option value="rpnd">$rPND</option>
              </select>
            </span>
          </label>
          <div class="trade-switch" aria-hidden="true">↓</div>
          <label class="trade-field">
            <span>Buy</span>
            <span class="trade-input-row">
              <span class="trade-amount-placeholder"
                aria-label="Estimated amount to receive">—</span>
              <select aria-label="Asset to buy" data-buy-asset>
                <option value="xrp">XRP</option>
                <option value="pnd">$PND</option>
                <option value="rpnd">$rPND</option>
              </select>
            </span>
          </label>
        </div>
        <div class="trade-quote">
          <div><span>Price impact</span><strong>—</strong></div>
          <div><span>Minimum received</span><strong>—</strong></div>
          <div>
            <span>Route</span>
            <strong>Awaiting verified pool</strong>
          </div>
        </div>
        <button type="button" class="trade-primary" disabled>
          Quote unavailable until market verification
        </button>
      </section>

      <section class="trade-card" aria-labelledby="trade-liquidity-title">
        <div class="trade-card-head">
          <div>
            <p class="trade-kicker">Liquidity</p>
            <h3 id="trade-liquidity-title">Verified markets</h3>
          </div>
          <span class="trade-badge trade-badge-muted">Read-only</span>
        </div>
        <div class="trade-market-list">
          <div class="trade-market-row">
            <div>
              <strong>$PND / XRP</strong>
              <span>XRPL AMM or order book</span>
            </div>
            <b>Not configured</b>
          </div>
          <div class="trade-market-row">
            <div>
              <strong>$rPND / XRP</strong>
              <span>MPT market after issuance</span>
            </div>
            <b>Not issued</b>
          </div>
        </div>
        <div class="trade-ledger-check">
          <span class="trade-check-icon" data-issuer-icon>!</span>
          <div>
            <strong data-issuer-status>Checking issuer account</strong>
            <span data-issuer-detail>
              Network state is read directly from XRPL.
            </span>
          </div>
        </div>
      </section>
    </div>

    <section class="trade-wallet-card" aria-labelledby="trade-wallet-title">
      <div>
        <p class="trade-kicker">Signing</p>
        <h3 id="trade-wallet-title">Self-custody only</h3>
        <p>
          Wallets sign the final XRPL transaction. This site never asks for
          private credentials or holds funds.
        </p>
      </div>
      <div class="trade-wallet-list">
        <button type="button" class="trade-wallet" disabled>
          Xaman <span>Pending setup</span>
        </button>
        <button type="button" class="trade-wallet" disabled>
          Wallet protocol <span>Pending setup</span>
        </button>
        <button type="button" class="trade-wallet" disabled>
          Joey Wallet <span>Pending setup</span>
        </button>
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
    const issuer = root.dataset.issuer;
    const state = { network: "testnet" };
    const $ = (selector) => root.querySelector(selector);

    function setText(selector, value) {
      const node = $(selector);
      if (node) node.textContent = value;
    }

    function setStatus(kind, message) {
      const dot = $("[data-network-dot]");
      if (dot) dot.dataset.state = kind;
      setText("[data-ledger-status]", message);
    }

    function setNetworkButtons() {
      root.querySelectorAll("[data-network]").forEach((button) => {
        const active = button.dataset.network === state.network;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      setText("[data-network-label]", networks[state.network].label);
    }

    async function refresh() {
      setStatus("loading", "Reading ledger…");
      setText("[data-issuer-status]", "Checking issuer account");
      setText("[data-issuer-detail]", "Network state is read directly from XRPL.");
      const icon = $("[data-issuer-icon]");
      if (icon) icon.dataset.state = "loading";
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
    setNetworkButtons();
    refresh();
  }

  window.PondTrade = { init };
  init();
})();