# 03 — Issuance and supply

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

## 3.1 Issuance sequence

**Documented** (`rpnd/docs/issuance.md`, `rpnd/src/cli.ts`):

1. **Configure the issuer.** `AccountSet` setting Default Ripple, tick size, transfer rate, Disallow XRP, and optionally `Domain`.
2. **Issue $PND.** Operational account sends `TrustSet` for `PND` to the issuer; issuer sends a `Payment` of `PND` to the operational account.
3. **Create $rPND.** Issuer sends `MPTokenIssuanceCreate` with `AssetScale`, `MaximumAmount`, the XLS-89 metadata blob, create flags, and `ImmutableFlags`. The ledger returns the `MPTokenIssuanceID`.
4. **Authorize and mint $rPND.** Operational account sends `MPTokenAuthorize`; issuer sends a `Payment` of the MPT. Both are skipped when `--create-only` is passed.

All six transactions can be printed unsigned, without network access, via `dry-run`. Holders other than the operational account must submit their own opt-in before they can receive either asset.

## 3.2 Supply parameters

**Documented** (`rpnd/config/tokens.json`):

| Parameter | Value | Mutability |
| --- | --- | --- |
| $PND initial issuance | `1000000` (1,000,000 PND) | Issuer may issue more; no on-ledger cap |
| $PND operational trust limit | `1000000000` | Holder-set per trust line |
| $rPND asset scale | 6 | Fixed for the life of the issuance |
| $rPND maximum amount | `1000000000000000` units (1,000,000,000 rPND) | Fixed for the life of the issuance |
| $rPND initial issuance | `1000000000000` units (1,000,000 rPND) | Issuer may mint up to the maximum |

`rpnd/docs/issuance.md` warns explicitly that `AssetScale` and `MaximumAmount` must be reviewed before the create transaction because they cannot be changed afterward — [TD-09](../open-questions.md#td-09).

**Open:** whether these are launch parameters or scaffolding placeholders, and what bounds $PND supply given the ledger enforces none — [OQ-06](../open-questions.md#oq-06).

## 3.3 Fees

**Documented:** transfer rate 0 for $PND, transfer fee 0 for $rPND, tick size 5.

**Open:** whether zero fees are a permanent commitment or an unset default — [OQ-07](../open-questions.md#oq-07).

## 3.4 Distribution

**Documented:** the operational account holds inventory, and `send-pnd` / `send-rpnd` perform individual payments. That is the whole of it.

**Open:** the distribution mechanism, allocation schedule, vesting, and lockups. Nothing exists in any repo — [OQ-13](../open-questions.md#oq-13).

## 3.5 Networks and launch

**Documented:** Devnet is the default and has been exercised end to end, including a live check in `rpnd`'s test suite. Testnet is flagged `supportsMpt: false`, so $rPND cannot be created there. Mainnet has no faucet command, no deployment, and requires confirmed amendment support plus real metadata values.

**Open:** the mainnet launch checklist, sign-off authority, and whether the two tokens launch together — [OQ-15](../open-questions.md#oq-15).

**TODO:** verify mainnet MPT support against live amendment status, since the config asserts it and the README says to confirm it — [TD-03](../open-questions.md#td-03).

## 3.6 Redemption and burn

**Open:** nothing anywhere documents burning, retiring, or redeeming either asset. For $PND, sending balances back to the issuer extinguishes them as a matter of ledger mechanics, but no policy says whether that is a supported path. For $rPND, no burn path is documented at all. Related: [OQ-03](../open-questions.md#oq-03).
