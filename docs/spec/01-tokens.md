# 01 — Tokens

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

Pond Protocol involves two XRP Ledger assets. They are different object types and are not interchangeable on ledger.

## 1.1 $PND — IOU

**Documented** (`rpnd/config/tokens.json`, `rpnd/src/issuance.ts`, `rpnd/docs/tokens.md`):

| Property | Value |
| --- | --- |
| Kind | Issued currency (IOU) on trust lines |
| Currency code | `PND` (standard 3-character XRPL code) |
| Asset identity | The pair (code `PND`, issuer classic address). A different issuer using `PND` is a different token. |
| Amount form | `{ currency: "PND", issuer, value }` |
| Display decimals | 6 |
| Tick size | 5 |
| Transfer rate | 0 |
| Default Ripple | Enabled on the issuer |
| Disallow XRP | Set on the issuer |
| Require Destination Tag | Not set |
| Holder opt-in | `TrustSet` to the issuer, required before receiving |
| Default operational trust limit | `1000000000` |

**Open:** whether $PND represents a claim on anything off ledger, and against whom — [OQ-05](../open-questions.md#oq-05). Asset class is currently `other` rather than `rwa`, but that is a config default, not a decision.

**Open:** whether trust lines stay permissionless or become authorization-gated — [OQ-09](../open-questions.md#oq-09).

**Open:** whether the issuer should set No Freeze, permanently giving up the ability to freeze $PND lines, or retain default freeze capability — [OQ-08](../open-questions.md#oq-08).

## 1.2 $rPND — MPT

**Documented** (same sources):

| Property | Value |
| --- | --- |
| Kind | Multi-Purpose Token |
| Ticker (XLS-89) | `RPND` |
| Display name | `rPND` |
| Asset identity | `MPTokenIssuanceID`, assigned by the ledger at `MPTokenIssuanceCreate` |
| Amount form | `{ mpt_issuance_id, value }`, value in fractional units |
| Asset scale | 6 (one whole rPND = 1,000,000 units) |
| Maximum amount | `1000000000000000` units = 1,000,000,000 rPND, fixed for the life of the issuance |
| Transfer fee | 0 |
| Create flags | `tfMPTCanTransfer`, `tfMPTCanLock` |
| Flags not set | `canTrade`, `canClawback`, `requireAuth` |
| Immutable flags | `tifMPTCanClawback` — clawback permanently foreclosed |
| Holder opt-in | `MPTokenAuthorize`, required before receiving |

The ticker is metadata; the issuance id is identity. Consumers keying off `RPND` alone are matching a label, not an asset.

**Open:** whether `canTrade: false` is intended, given any trading venue plans — [OQ-14](../open-questions.md#oq-14).

**Open:** the intended use of the lock capability — [OQ-08](../open-questions.md#oq-08).

**Open:** whether metadata should later be marked immutable — [OQ-10](../open-questions.md#oq-10).

## 1.3 Asymmetries to keep in mind

Documented consequences of the two object types, worth stating because they surprise people:

- $rPND has a hard on-ledger supply cap. $PND does not; the trust limit bounds one line, not total issuance.
- $rPND can never be clawed back. $PND has no freeze policy recorded either way.
- $rPND opt-in is one transaction with no limit. $PND opt-in carries a per-holder limit the holder chooses.
- $rPND amounts are integers in fractional units. $PND amounts are decimal strings.

## 1.4 Canonical parameter source

**Documented:** `rpnd/config/tokens.json` is the single machine-readable definition, and the `rpnd` README claims source-of-truth status for it. This section restates those values for readers and must not be treated as a second source.

**Open:** whether canonical config should move here — [OQ-17](../open-questions.md#oq-17).
