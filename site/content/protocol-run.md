# Protocol

This is the desk and ops page. It lists the master / feed wallet and
Bird Hunt 15. It is not the home page.

## Master / feed wallet

Tadpole's rPND… address. Nathan funds 50B $PND + liquidity XRP here. Not
one of the 15 desk seats.

<div class="desk-master">
  <p class="start-eyebrow">Master / feed</p>
  <p class="desk-master-addr"><code>rPND…</code></p>
  <p>Tadpole's rPND… address. Nathan funds 50B $PND + liquidity XRP here.
  Not one of the 15 desk seats.</p>
</div>

## Bird Hunt 15

Nest ×5 / Current ×5 / Perch ×5. They draw inventory from master under
Tadpole's ops rules; they are not the 50B treasury seat.

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

## Team Nest — Liquidity

<div class="desk-roster">
  <div class="desk-row"><code>nest_lp_core</code><strong>Core AMM LP</strong></div>
  <div class="desk-row"><code>nest_lp_aggro</code><strong>Aggressive AMM LP <span class="desk-gate">soft-gated</span></strong></div>
  <div class="desk-row"><code>nest_spread</code><strong>Tight two-sided spread maker</strong></div>
  <div class="desk-row"><code>nest_grid</code><strong>Grid ladder around mid</strong></div>
  <div class="desk-row"><code>nest_skew</code><strong>Inventory-aware skew</strong></div>
</div>

## Team Current — Flow

<div class="desk-roster">
  <div class="desk-row"><code>cur_twap</code><strong>TWAP iceberg <span class="desk-gate">soft-gated</span></strong></div>
  <div class="desk-row"><code>cur_dip</code><strong>Dip buyer</strong></div>
  <div class="desk-row"><code>cur_rip</code><strong>Rip / breakout harvester <span class="desk-gate">soft-gated</span></strong></div>
  <div class="desk-row"><code>cur_arb</code><strong>Cross-path arb</strong></div>
  <div class="desk-row"><code>cur_taker</code><strong>Net taker <span class="desk-gate desk-gate-hard">hard-gated / kill switch</span></strong></div>
</div>

## Team Perch — Holder

<div class="desk-roster">
  <div class="desk-row"><code>perch_treasury</code><strong>Treasury / ops payouts sleeve</strong></div>
  <div class="desk-row"><code>perch_rewards</code><strong>Rewards sleeve</strong></div>
  <div class="desk-row"><code>perch_buyback</code><strong>Fee buyback <span class="desk-gate">soft-gated</span></strong></div>
  <div class="desk-row"><code>perch_claim</code><strong>Claim / x402 path sleeve</strong></div>
  <div class="desk-row"><code>perch_backstop</code><strong>Emergency backstop</strong></div>
</div>
