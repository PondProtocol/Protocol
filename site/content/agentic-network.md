# Agent Network

Pond's agent network is a non-custodial interface for software that needs to
read XRPL market state and prepare trades. Agents connect with a classic
address, sign locally, and never send a seed or private key to this site.

<div class="agent-network-shell">
  <div class="agent-network-hero">
    <div>
      <p class="agent-eyebrow">Agent trading surface</p>
      <h2>Trade through Pond without giving up custody.</h2>
      <p>Use the same verified issuer and market checks as the human terminal,
      then let your agent prepare unsigned XRPL transactions for local signing.</p>
    </div>
    <div class="agent-status-card">
      <span class="agent-status-dot"></span>
      <div><strong>Staged for mainnet</strong><span>Live trading waits for issuance, liquidity, and route verification.</span></div>
    </div>
  </div>

  <div class="agent-network-grid">
    <section class="agent-card agent-card-primary">
      <p class="agent-eyebrow">The boundary</p>
      <h3>Address in. Unsigned transaction out.</h3>
      <ol class="agent-flow">
        <li><b>01</b><span>Request a short-lived challenge for the agent address.</span></li>
        <li><b>02</b><span>Sign the challenge inside the agent's own secret store.</span></li>
        <li><b>03</b><span>Prepare a TrustSet or offer without exposing signing material.</span></li>
        <li><b>04</b><span>Sign locally, then submit the signed blob or broadcast directly.</span></li>
      </ol>
      <div class="agent-safety-note"><strong>Never send</strong><span>Seeds, private keys, mnemonics, or family seeds. Requests containing those fields are rejected.</span></div>
    </section>

<section class="agent-card">
  <p class="agent-eyebrow">For agents</p>
  <h3>One market, small allowlist.</h3>
  <div class="agent-stat-list">
    <div><span>Network</span><strong>XRPL Mainnet</strong></div>
    <div><span>Market</span><strong>PND / XRP</strong></div>
    <div><span>Signing</span><strong>Agent-owned</strong></div>
    <div><span>Issuer</span><strong>Read-only reference</strong></div>
  </div>
  <p class="agent-muted">The issuer cold wallet is never used as an
  agent account. The service only prepares and validates transactions for
  the authenticated address.</p>
</section>
  </div>

  <section class="agent-card agent-api-card">
    <div class="agent-card-heading">
      <div><p class="agent-eyebrow">Agent API</p><h3>Small surface, predictable flow.</h3></div>
      <span class="agent-api-badge">Bearer session</span>
    </div>
    <div class="agent-endpoint-list">
      <div><code>POST /api/trade/auth/challenge</code><span>Bind a one-time challenge to an address.</span></div>
      <div><code>POST /api/trade/auth/verify</code><span>Exchange a local signature for a short-lived session.</span></div>
      <div><code>GET /api/trade/session</code><span>Read the session address and verified balances.</span></div>
      <div><code>GET /api/trade/book?pair=PND_XRP</code><span>Read the public order book snapshot.</span></div>
      <div><code>POST /api/trade/prepare/trustset</code><span>Prepare the PND trust line transaction.</span></div>
      <div><code>POST /api/trade/prepare/offer</code><span>Prepare an unsigned limit offer.</span></div>
      <div><code>POST /api/trade/prepare/cancel</code><span>Prepare an offer cancellation.</span></div>
      <div><code>POST /api/trade/submit</code><span>Validate and broadcast a locally signed blob.</span></div>
    </div>
  </section>

  <div class="agent-network-grid agent-network-grid-lower">
    <section class="agent-card">
      <div class="agent-card-heading"><div><p class="agent-eyebrow">Start here</p><h3>Challenge a session</h3></div><button type="button" class="agent-copy-button" data-copy-value="curl -X POST https://pond.greenhead.io/api/trade/auth/challenge -H 'content-type: application/json' -d '{&quot;address&quot;:&quot;r...&quot;}'">Copy</button></div>
      <pre><code>curl -X POST https://pond.greenhead.io/api/trade/auth/challenge \
  -H 'content-type: application/json' \
  -d '{"address":"r..."}'</code></pre>
      <p class="agent-muted">The response includes a deterministic message,
      nonce, address, and expiry. Sign that message locally.</p>
    </section>
    <section class="agent-card">
      <div class="agent-card-heading"><div><p class="agent-eyebrow">Prepare only</p><h3>Never sign on the service</h3></div><button type="button" class="agent-copy-button" data-copy-value="curl -X POST https://pond.greenhead.io/api/trade/prepare/offer -H 'authorization: Bearer SESSION' -H 'content-type: application/json' -d '{&quot;side&quot;:&quot;buy&quot;,&quot;taker_gets&quot;:{&quot;currency&quot;:&quot;PND&quot;,&quot;issuer&quot;:&quot;ISSUER&quot;,&quot;value&quot;:&quot;10&quot;},&quot;taker_pays&quot;:&quot;1000000&quot;}'">Copy</button></div>
      <pre><code>curl -X POST https://pond.greenhead.io/api/trade/prepare/offer \
  -H 'authorization: Bearer SESSION' \
  -d '{"side":"buy","taker_pays":"1000000"}'</code></pre>
      <p class="agent-muted">The transaction response is unsigned. The agent
      owns the signing step and may broadcast directly to XRPL.</p>
    </section>
  </div>

  <div class="agent-network-footer">
    <strong>Safety status</strong>
    <span>Issuer identity, asset state, market route, ledger reads, and signing
    checks remain required before any live action is enabled.</span>
    <a href="/trade/">Open the human terminal →</a>
  </div>
</div>

## Integration rules

- Authenticate with an XRPL classic address only.
- Keep the agent's seed or private key in its own secret store.
- Treat every prepared transaction as untrusted until the agent verifies the
  account, transaction type, issuer, destination, amount, fee, and expiry.
- Rate-limit challenge and submit calls per IP and per address.
- Use the public order book endpoint for reads; use a Bearer session for
  balances, open offers, and transaction preparation.

The API remains staged while $PND has not been issued and no verified market
exists. The [human terminal](/trade/) shows the same verification state.