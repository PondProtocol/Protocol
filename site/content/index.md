<section class="home-start" id="start-here">
<p class="start-eyebrow">Start here</p>
<h2>Start here</h2>
<p class="home-start-lede">Official Xaman is unchanged. Copy the issuer. Do not search the ticker. The Login button in the top bar opens Trade. After you sign in it says Launch.</p>
<div class="home-start-cards">
<a class="home-start-card" href="/Pond/"><span class="home-start-card-go">/Pond/</span><strong>Pond</strong><span>$PND / $rPND tokenomics, treasury, and escrow. Testnet 100B paid to treasury. Mainnet is unissued. Not the desk page.</span></a>
<a class="home-start-card" href="/Protocol/"><span class="home-start-card-go">/Protocol/</span><strong>Protocol</strong><span>Desk and ops. Master / feed and Bird Hunt 15. Nest ×5 / Current ×5 / Perch ×5. Not the home page.</span></a>
<a class="home-start-card" href="/trade/"><span class="home-start-card-go">/trade/</span><strong>Trade</strong><span>XRPL Testnet terminal. Reads the validated ledger. Does not sign or submit. Not a live mainnet DEX.</span></a>
<a class="home-start-card" href="/links/"><span class="home-start-card-go">/links/</span><strong>Official links</strong><span>Issuer, treasury, TOML, explorers. Nothing else is official. Copy the issuer from here.</span></a>
</div>
</section>

<section class="home-stop" id="pond-stop">
<header class="home-stop-head">
<p class="start-eyebrow">Pond</p>
<a class="home-stop-go" href="/Pond/">/Pond/</a>
</header>
<h2>This is the $PND / $rPND page.</h2>
<p>It states what the tokens are: tokenomics, treasury, and escrow. It is not the desk page. How the protocol is run is on <a href="/Protocol/">Protocol</a>.</p>
<h3>$PND</h3>
<p>Classic XRPL IOU. Identity is <strong>(PND, issuer address)</strong>, never the ticker alone. Other mainnet accounts already issue <code>PND</code>.</p>
<p><strong>Testnet.</strong> 100B $PND paid to treasury
<code class="addr">{{treasuryAddress}}</code> from issuer
<code class="addr">{{issuerAddress}}</code>.</p>
<p><strong>Mainnet.</strong> $PND is unissued. Nothing to buy.</p>
<div class="desk-master">
  <p class="start-eyebrow">Issuer</p>
  <p class="desk-master-addr"><code>{{issuerAddress}}</code></p>
  <p>The only identity that counts for $PND. Copy the address from
  <a href="/links/">Official links</a>, not a search box.</p>
</div>
<h3>Proposed split</h3>
<p>Working design. <strong>Not all confirmed.</strong> Policy supply is 100B $PND (issuer policy, not a ledger cap).</p>
<table class="desk-table">
  <thead>
    <tr>
      <th>Slice</th>
      <th>Amount</th>
      <th>When</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>public</code> Public</td>
      <td>10B</td>
      <td>Aimed at launch, via Operations (AMM + any launch distribution). <span class="desk-gate">proposed</span></td>
    </tr>
    <tr>
      <td><code>team</code> Team</td>
      <td>10B</td>
      <td>Same launch window, to an address the owner still names. <span class="desk-gate">proposed</span></td>
    </tr>
    <tr>
      <td><code>holders</code> Holder drops</td>
      <td>80B</td>
      <td>10B on the 1st, 2027-01-01 through 2027-08-01. <span class="desk-gate">proposed</span></td>
    </tr>
  </tbody>
</table>
<div class="desk-roster">
  <div class="desk-row"><code>public</code><strong>10B via Operations at launch <span class="desk-gate">proposed</span></strong></div>
  <div class="desk-row"><code>team</code><strong>10B to a destination the owner names <span class="desk-gate">proposed</span></strong></div>
  <div class="desk-row"><code>holders</code><strong>80B as eight 10B months in 2027 <span class="desk-gate">proposed</span></strong></div>
</div>
<p>Each month is <strong>proportional to $PND on a trust line</strong> at a published ledger. Mechanism: snapshot, then Treasury <code>Payment</code>s. <strong>Not TokenEscrow.</strong> There is no claim button.</p>
<h3>$rPND</h3>
<p>Later, if the ledger can create it honestly. Multi-purpose token on the <strong>same</strong> issuer. <strong>No peg, no wrap, no guaranteed conversion</strong> with $PND. <strong>$rPND is not launching on 1 October 2026.</strong> That date is for $PND.</p>
<div class="desk-master">
  <p class="start-eyebrow">$rPND</p>
  <p class="desk-master-addr"><code>not issued</code></p>
  <p><strong>Deferred.</strong> <code>DynamicMPT</code> is not enabled on Mainnet. Do not invent an issuance id or r-address for it.</p>
</div>
<p><a class="home-stop-more" href="/Pond/">Open Pond <span aria-hidden="true">↗</span></a></p>
</section>

<section class="home-stop" id="protocol-stop">
<header class="home-stop-head">
<p class="start-eyebrow">Protocol</p>
<a class="home-stop-go" href="/Protocol/">/Protocol/</a>
</header>
<h2>This is the desk and ops page.</h2>
<p>It lists the master / feed wallet and Bird Hunt 15. It is not the home page.</p>
<h3>Master / feed wallet</h3>
<p>Tadpole's rPND… address. Nathan funds 50B $PND + liquidity XRP here. Not one of the 15 desk seats.</p>
<div class="desk-master">
  <p class="start-eyebrow">Master / feed</p>
  <p class="desk-master-addr"><code>rPND…</code></p>
  <p>Tadpole's rPND… address. Nathan funds 50B $PND + liquidity XRP here.
  Not one of the 15 desk seats.</p>
</div>
<h3>Bird Hunt 15</h3>
<p>Nest ×5 / Current ×5 / Perch ×5. They draw inventory from master under Tadpole's ops rules; they are not the 50B treasury seat.</p>
<table class="desk-table">
  <thead>
    <tr>
      <th>Team Nest — Liquidity</th>
      <th>Team Current — Flow</th>
      <th>Team Perch — Holder</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>nest_lp_core</code> Core AMM LP</td>
      <td><code>cur_twap</code> TWAP iceberg <span class="desk-gate">soft-gated</span></td>
      <td><code>perch_treasury</code> Treasury / ops payouts sleeve</td>
    </tr>
    <tr>
      <td><code>nest_lp_aggro</code> Aggressive AMM LP <span class="desk-gate">soft-gated</span></td>
      <td><code>cur_dip</code> Dip buyer</td>
      <td><code>perch_rewards</code> Rewards sleeve</td>
    </tr>
    <tr>
      <td><code>nest_spread</code> Tight two-sided spread maker</td>
      <td><code>cur_rip</code> Rip / breakout harvester <span class="desk-gate">soft-gated</span></td>
      <td><code>perch_buyback</code> Fee buyback <span class="desk-gate">soft-gated</span></td>
    </tr>
    <tr>
      <td><code>nest_grid</code> Grid ladder around mid</td>
      <td><code>cur_arb</code> Cross-path arb</td>
      <td><code>perch_claim</code> Claim / x402 path sleeve</td>
    </tr>
    <tr>
      <td><code>nest_skew</code> Inventory-aware skew</td>
      <td><code>cur_taker</code> Net taker <span class="desk-gate desk-gate-hard">hard-gated / kill switch</span></td>
      <td><code>perch_backstop</code> Emergency backstop</td>
    </tr>
  </tbody>
</table>
<p><a class="home-stop-more" href="/Protocol/">Open Protocol <span aria-hidden="true">↗</span></a></p>
</section>

<section class="home-stop home-stop-login" id="login-stop">
<header class="home-stop-head">
<p class="start-eyebrow">Login</p>
<a class="home-stop-go" href="/profile/">/profile/</a>
</header>
<h2>Sign in with official Xaman.</h2>
<p>The Login button in the top bar opens Trade. After you sign in it says Launch. The account page is <a href="/profile/">Profile</a>.</p>
<div class="home-stop-profile">
  <div class="profile-card">
    <p class="profile-kicker">Profile</p>
    <p>Sign in with official Xaman to open your account page. Logged-out visitors do not see handles or profile fields.</p>
  </div>
</div>
<p>Official connect is WalletConnect or Xaman only. We do not store seeds or private keys. After 24 hours with no activity, the session ends.</p>
<p><a class="home-stop-more" href="/profile/">Open Profile <span aria-hidden="true">↗</span></a></p>
</section>

<section class="home-stop" id="links-stop">
<header class="home-stop-head">
<p class="start-eyebrow">Official links</p>
<a class="home-stop-go" href="/links/">/links/</a>
</header>
<h2>These are the only Pond Protocol URLs this site will ask you to use before $PND exists.</h2>
<p>There is no official Telegram. There is no official DEX trade link. A guessed FirstLedger or XPMarket URL would be a fake.</p>
<div class="callout">
<p><strong>$PND has not launched.</strong> Target <strong>1 October 2026</strong> (<code>2026-10-01</code>). Links below are identity and explorers, not a market.</p>
</div>
<h3>Issuer and treasury</h3>
<p><code class="addr">{{issuerAddress}}</code></p>
<p>Issuer status: {{issuerAddressStatus}}. Treasury
<code class="addr">{{treasuryAddress}}</code> is the Testnet inventory
account. Operations <code class="addr">{{operationsAddress}}</code> is the
named operations account. Live flags on the issuer: Domain
<code>{{domain}}</code>, Default Ripple on, permanent No Freeze, clawback
off.</p>
{{canonicalLinks}}
<div class="wallets">
<div class="wallet">
  <div class="wallet-head"><span class="wallet-role">This site</span></div>
  <p><a href="https://{{domain}}/">https://{{domain}}/</a></p>
  <p>The docs host. If a page claims to be Pond Protocol and is not here, treat
  it as unrelated until you have checked the issuer on ledger.</p>
</div>
<div class="wallet">
  <div class="wallet-head"><span class="wallet-role">xrp-ledger.toml</span></div>
  <p><a href="https://{{domain}}/.well-known/xrp-ledger.toml">https://{{domain}}/.well-known/xrp-ledger.toml</a></p>
  <p>XLS-26 metadata. The issuer’s on-ledger <code>Domain</code> is
  <code>{{domain}}</code>.</p>
</div>
</div>
<p><a class="home-stop-more" href="/links/">Open Official links <span aria-hidden="true">↗</span></a></p>
</section>

<section class="home-stop" id="trade-stop">
<header class="home-stop-head">
<p class="start-eyebrow">Trade</p>
<a class="home-stop-go" href="/trade/">/trade/</a>
</header>
<h2>XRPL Testnet terminal.</h2>
<p>This page reads the validated ledger. It does not sign or submit. Not a live mainnet DEX.</p>
<div class="home-stop-trade">
  <p class="start-eyebrow">Trade $PND</p>
  <p>XRPL Testnet. $PND is issued here: issuer
  <code class="addr">{{issuerAddress}}</code> (same r-address as mainnet).
  Treasury <code class="addr">{{treasuryAddress}}</code> holds 100,000,000,000 PND.
  Testnet XRP is faucet-issued and worthless. Mainnet still has no $PND issued.</p>
</div>
<p><a class="home-stop-more" href="/trade/">Open Trade <span aria-hidden="true">↗</span></a></p>
</section>

<section class="home-stop home-stop-legal" id="legal-stop">
<header class="home-stop-head">
<p class="start-eyebrow">Legal &amp; privacy</p>
<a class="home-stop-go" href="/legal/">/legal/</a>
</header>
<h2>This page is for pond.greenhead.io.</h2>
<p>The Pond Protocol / $PND documentation site. It is not the Greenhead Labs agent product, and it is not <a href="https://greenhead.io">greenhead.io</a>’s legal page.</p>
<div class="home-stop-legal-block">
<p>We use cookies. That is intentional. Official <strong>WalletConnect</strong> or <strong>Xaman SignIn</strong> sets a session cookie with the XRPL address you signed in with. After 24 hours with no activity, the session ends.</p>
<p>We do not sell personal data. We do not run ads. We never ask for a seed, mnemonic, private key, or password.</p>
<p>Documentation on this site is licensed Apache-2.0. It is not an offer to sell $PND, not investment advice, and not a claim that $PND has been issued until <a href="/links/">Official links</a> says it has.</p>
</div>
<p><a class="home-stop-more" href="/legal/">Open Legal &amp; privacy <span aria-hidden="true">↗</span></a></p>
</section>
