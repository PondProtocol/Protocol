# Pond

This is the $PND / $rPND page. It states what the tokens are: tokenomics,
treasury, and escrow. It is not the desk page. How the protocol is run
is on [Protocol](/Protocol/).

## $PND

Classic XRPL IOU. Identity is **(PND, issuer address)**, never the ticker
alone. Other mainnet accounts already issue `PND`.

**Testnet.** 100B $PND paid to treasury
<code class="addr">{{treasuryAddress}}</code> from issuer
<code class="addr">{{issuerAddress}}</code>.

**Mainnet.** $PND is unissued. Nothing to buy.

<div class="desk-master">
  <p class="start-eyebrow">Issuer</p>
  <p class="desk-master-addr"><code>{{issuerAddress}}</code></p>
  <p>The only identity that counts for $PND. Same issuer later creates
  $rPND if that create can happen honestly. Copy the address from
  <a href="/links/">Official links</a>, not a search box.</p>
</div>

## Accounts

Named wallets. Team destination is not named.

<table class="desk-table">
  <thead>
    <tr>
      <th>Account</th>
      <th>Role</th>
      <th>Live fact</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>issuer</code> Issuer</td>
      <td>Mints $PND once. Never holds it.</td>
      <td><code>{{issuerAddress}}</code> Funded. Mainnet has not issued.</td>
    </tr>
    <tr>
      <td><code>treasury</code> Treasury</td>
      <td>Testnet inventory. Planned warehouse for the 80B holder months.</td>
      <td><code>{{treasuryAddress}}</code> Holds Testnet 100B $PND.</td>
    </tr>
    <tr>
      <td><code>operations</code> Operations</td>
      <td>Planned 10B public slice and AMM seed.</td>
      <td><code>{{operationsAddress}}</code> Named. Not the drop signer.</td>
    </tr>
    <tr>
      <td><code>team</code> Team</td>
      <td>Planned 10B at launch.</td>
      <td>Address not named. <span class="desk-gate">owner decision</span></td>
    </tr>
  </tbody>
</table>

## Proposed split

Working design. **Not all confirmed.** Policy supply is 100B $PND (issuer
policy, not a ledger cap).

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

## Holder drops

Each month is **proportional to $PND on a trust line** at a published
ledger: the more you hold, the more of that month you get. Mechanism:
snapshot, then Treasury `Payment`s. **Not TokenEscrow.** There is no
claim button.

Timezone: **00:00:00 UTC** on the 1st. Eight months. No September or
October tranche.

<table class="desk-table">
  <thead>
    <tr>
      <th>#</th>
      <th>Drop date</th>
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>1</code></td>
      <td>2027-01-01</td>
      <td>10B <span class="desk-gate">proposed</span></td>
    </tr>
    <tr>
      <td><code>2–8</code></td>
      <td>2027-02-01 through 2027-08-01</td>
      <td>10B each <span class="desk-gate">proposed</span></td>
    </tr>
  </tbody>
</table>

Whether the team 10B is **in** the snapshot is still an
**owner decision**. Including it and holding compounds the team share.
Recommended default: team, Treasury, issuer, Operations, AMM pool, and
LP tokens **out**. That default is not signed.

You need a **trust line** before you can receive $PND. A drop to an
address without one fails. Remainder stays in Treasury unless the owner
picks another rule.

## Escrow

TokenEscrow cannot pay every holder. One escrow has one `Destination`.
An earlier 9B×10 dated escrow schedule is **not** the plan.

`asfAllowTrustLineLocking` (flag 17) stays **unset**. Without it,
`EscrowCreate` of $PND fails. Optional dated lockups of Treasury
inventory would not pay holders either — they would only stop Treasury
from spending before a date. Default: do not lock.

Holder months are a **public promise**, not an on-ledger vesting
contract. If Treasury does not sign, holders are not paid.

`TransferRate` stays **0** so each 10B month can deliver 10B. Permanent
**No Freeze** is set. Clawback is off. The issuer cannot freeze a line
or take $PND back.

## $rPND

Later, if the ledger can create it honestly. Multi-purpose token on the
**same** issuer. **No peg, no wrap, no guaranteed conversion** with $PND.

**Deferred.** `DynamicMPT` is not enabled on Mainnet. A create that
needs `ImmutableFlags` fails `temDISABLED`. Do not treat $rPND as
issued, and do not invent an issuance id or r-address for it.

<div class="desk-master">
  <p class="start-eyebrow">$rPND</p>
  <p class="desk-master-addr"><code>not issued</code></p>
  <p>Same issuer as $PND, later. Flags chosen at create are one-way until
  DynamicMPT exists. This page will not invent a cap, a schedule, or a
  market for it.</p>
</div>

## Membership

Planned overlay: 1000 XLS-20 NFTs sold at 5 XRP. First possible perk is
**2027-01-01**. Permanent No Freeze means membership **cannot** restrict
who may `Payment` $PND.

**Perk vs required is still an owner decision.** Recommended reading:
perk on top of $PND holdings, not a gate. Required-without-also-needing
$PND would rewrite “the more you hold, the more you get.” Minting
account is not named.

## Open owner decisions

<div class="desk-roster">
  <div class="desk-row"><code>team_snapshot</code><strong>Team 10B in or out of each drop snapshot <span class="desk-gate desk-gate-hard">owner decision</span></strong></div>
  <div class="desk-row"><code>membership</code><strong>Perk vs required for the 1000 × 5 XRP seats <span class="desk-gate desk-gate-hard">owner decision</span></strong></div>
</div>

How desks draw inventory is on [Protocol](/Protocol/). Official addresses
are on [Official links](/links/). Trade is a Testnet terminal, not a
live Mainnet DEX.
