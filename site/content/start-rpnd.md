# What is $rPND

$rPND is the planned Multi-Purpose Token (MPT) companion to $PND. Same
issuer family. Separate ledger object. Not interchangeable.

<div class="callout callout-critical">
<p><strong>$rPND has not been created.</strong> Its
<code>MPTokenIssuanceID</code>, circulating supply, and final economics do
not exist on ledger yet. <strong>Not the 1 October 2026 launch.</strong>
That date is for $PND.</p>
</div>

## Scan this

- **Type:** MPT, not an issued-currency IOU.
- **How you will name it:** an `MPTokenIssuanceID` the ledger assigns at
  create — not the ticker `PND`.
- **How you will opt in:** `MPTokenAuthorize`, not a $PND trust line.
- **Issuer:** the same account as $PND. That is why this account must
  **not** be blackholed before the MPT exists.

<p><code class="addr">{{issuerAddress}}</code></p>

- **No peg.** No wrap. No redemption button. No conversion path. A metadata
  field may say it is paired with currency `PND`. That is a note for
  indexers. The ledger does not enforce it.
- **DEX / AMM for MPTs** needs a network amendment that is not enabled.
  Do not treat $rPND as tradeable on this site.

## Two assets, one launch date — and it is not both

| | $PND | $rPND |
| --- | --- | --- |
| What it is | Issued currency (IOU) | Multi-Purpose Token (MPT) |
| Launch | target **2026-10-01** — not issued | not this launch; not created |
| Opt-in | trust line (`TrustSet`) | `MPTokenAuthorize` |

The join-flow comparison is [$PND and $rPND](/pnd-and-rpnd/). Design pages
stay at [$rPND](/rpnd/).

Next: [Verify Issuer](/verify/).
