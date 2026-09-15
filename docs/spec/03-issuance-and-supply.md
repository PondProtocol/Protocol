# 03 — Issuance and supply

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

## 3.1 Issuance sequence

**None of these steps has been run on mainnet.** The issuer account is funded and otherwise untouched — see [architecture Live state](../architecture.md#live-state). Step 1 is where the live deployment currently sits, before it.

**Documented** (`rpnd/docs/issuance.md`, `rpnd/src/cli.ts`):

1. **Configure the issuer.** `AccountSet` setting Default Ripple, tick size, transfer rate, Disallow XRP, and optionally `Domain`.
2. **Issue $PND.** Operational account sends `TrustSet` for `PND` to the issuer; issuer sends a `Payment` of `PND` to the operational account.
3. **Create $rPND.** Issuer sends `MPTokenIssuanceCreate` with `AssetScale`, `MaximumAmount`, the XLS-89 metadata blob, create flags, and `ImmutableFlags`. The ledger returns the `MPTokenIssuanceID`.
4. **Authorize and mint $rPND.** Operational account sends `MPTokenAuthorize`; issuer sends a `Payment` of the MPT. Both are skipped when `--create-only` is passed.

All six transactions can be printed unsigned, without network access, via `dry-run`. Holders other than the operational account must submit their own opt-in before they can receive either asset.

## 3.2 Supply parameters

**Documented — $PND supply is policy, not a ledger field.** The target is **100,000,000,000**, set as issuer policy. The XRP Ledger stores no supply figure for an IOU, so outstanding supply is the sum of the issuer's obligations across trust lines, read via the `gateway_balances` API call. Nothing on ledger enforces the target — [OQ-06](../open-questions.md#oq-06). No $PND is outstanding today: the issuer reports no obligations and has no trust lines.

**Documented — $rPND circulating supply is capped on ledger.** `MaximumAmount` is enforced: once circulating supply reaches it, further mints fail. It bounds circulation rather than cumulative issuance, so returning tokens to the issuer frees headroom and the lifetime total minted can exceed the cap.

| Parameter | Value | Mutability |
| --- | --- | --- |
| $PND target supply | 100,000,000,000 | Policy target; ledger enforces nothing |
| $PND initial issuance (config) | `1000000` | Devnet rehearsal default, never a supply figure |
| $PND operational trust limit | `1000000000` | Holder-set per trust line |
| $rPND asset scale | 6 | **Permanent** once created |
| $rPND maximum amount | `1000000000000000` base units (1,000,000,000 rPND in circulation) | **Permanent** once created |
| $rPND initial issuance | `1000000000000` base units (1,000,000 rPND) | Issuer may mint up to the circulating cap |

The three $rPND values are working defaults, "not ratified economics" per [`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md), and no issuance exists on ledger. Changing either permanent field after create requires destroying the issuance and creating a new one with a different `MPTokenIssuanceID` — [TD-09](../open-questions.md#td-09). [`pnd/docs/token-spec.md`](https://github.com/PondProtocol/PND/blob/main/docs/token-spec.md) makes the parallel point for the IOU: `initialIssuance` is a rehearsal value and must never be quoted as supply.

**Open — and blocking:** the 100B $PND target and the 1B $rPND default differ by 100:1 with nothing documenting a relationship between them. This is an unresolved design decision rather than a committed conflict, and it needs an answer before any create transaction — [OQ-21](../open-questions.md#oq-21).

## 3.3 Fees

**Documented:** transfer rate 0 for $PND, transfer fee 0 for $rPND, tick size 5. The create transaction omits `TransferFee` entirely while it is zero. `tifMPTTransferFee` would freeze the field and is not set.

**Open:** whether zero fees are a permanent commitment or an unset default — [OQ-07](../open-questions.md#oq-07).

## 3.4 Distribution

**Documented:** the operational account holds inventory, and `send-pnd` / `send-rpnd` perform individual payments. That is the whole of it.

**Open:** the distribution mechanism, allocation schedule, vesting, and lockups. Nothing exists in any repo — [OQ-13](../open-questions.md#oq-13).

## 3.5 Networks and launch

**Documented:** the toolkit defaults to Devnet and has been exercised there end to end, including a live check in `rpnd`'s test suite, though Devnet resets and the issuer address does not exist there now. Testnet is flagged `supportsMpt: false`, so $rPND cannot be created there, and the issuer address does not exist there either. Mainnet is where the issuer account is funded, has no faucet command, and requires confirmed amendment support plus real metadata values before any issuance.

**Documented:** **$PND launches first**; $rPND design work follows — [OQ-15](../open-questions.md#oq-15). The MPT-specific parameter decisions therefore do not gate the first launch.

**Open:** the mainnet launch checklist, sign-off authority, and the issuance date — [OQ-15](../open-questions.md#oq-15).

**TODO:** verify mainnet MPT support against live amendment status, since the config asserts it and the README says to confirm it — [TD-03](../open-questions.md#td-03).

## 3.6 Redemption and burn

**Documented:** for $rPND, returning tokens to the issuer removes them from circulation and frees headroom under `MaximumAmount`, so the cap is not a lifetime issuance budget. `MPTokenIssuanceDestroy` can remove an issuance entirely, but only while no holder holds a balance, and it is not exposed in the CLI. For $PND, sending balances back to the issuer extinguishes them as a matter of ledger mechanics.

**Open:** whether any of these is a supported path, and whether redemption exists as policy rather than mechanics. No repo documents a burn or retirement policy for either asset. Related: [OQ-03](../open-questions.md#oq-03).
