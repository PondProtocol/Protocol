# Official links

These are the only Pond Protocol URLs this site will ask you to use before
$PND exists. There is no official Telegram. There is no official DEX trade
link. A guessed FirstLedger or XPMarket URL would be a fake.

<div class="callout">

**$PND has not launched.** Target **1 October 2026** (`2026-10-01`). Links below are identity
and explorers, not a market.

</div>

## Issuer and treasury

<p><code class="addr">{{issuerAddress}}</code></p>

Issuer status: {{issuerAddressStatus}}. Treasury
<code class="addr">{{treasuryAddress}}</code> is the Testnet inventory
account. Operations <code class="addr">{{operationsAddress}}</code> is the
named operations account. Live flags on the issuer: Domain
<code>{{domain}}</code>, Default Ripple on, permanent No Freeze, clawback
off.

{{canonicalLinks}}

## The list

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
  <code>{{domain}}</code>. How wallets pick that up:
  <a href="/discovery/">How wallets learn the name</a>.</p>
</div>

<div class="wallet">
  <div class="wallet-head"><span class="wallet-role">Bithomp — issuer</span></div>
  <p><a href="https://bithomp.com/explorer/{{issuerAddress}}">https://bithomp.com/explorer/{{issuerAddress}}</a></p>
  <p>Explorer, not a DEX. Confirm the account, flags, and that nothing has
  been issued. Same address on
  <a href="https://livenet.xrpl.org/accounts/{{issuerAddress}}">livenet.xrpl.org</a>
  if you want a second explorer.</p>
</div>

<div class="wallet">
  <div class="wallet-head"><span class="wallet-role">Bithomp — treasury</span></div>
  <p><a href="https://bithomp.com/explorer/{{treasuryAddress}}">https://bithomp.com/explorer/{{treasuryAddress}}</a></p>
  <p>Explorer only. Not a place to trade.</p>
</div>

<div class="wallet">
  <div class="wallet-head"><span class="wallet-role">Bithomp — operations</span></div>
  <p><a href="https://bithomp.com/explorer/{{operationsAddress}}">https://bithomp.com/explorer/{{operationsAddress}}</a></p>
  <p>Explorer only. Not a place to trade.</p>
</div>

</div>

## Not on this list

- DEX or AMM trade URLs (FirstLedger, XPMarket, Magnetic, Sologenic, Xaman DEX)
- Telegram, Discord, or any chat invite this page does not print
- “Create token” / memepad / Token Hub flows
- Anything that asks you to paste a seed, or to connect a wallet to *claim*
  $PND. Official Xaman SignIn on [Trade](/trade/) is the exception; it is not
  a claim.

After issuance, marketplace links go here only once a human has loaded the
real page for issuer `{{issuerAddress}}`. Until then, absence is the honest
state.
