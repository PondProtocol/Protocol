# Architecture overview

This document describes how the pieces of Pond Protocol fit together **as they exist today**. It is descriptive, not aspirational: where a layer is missing, it says so and links to the open question that would fill it.

Ground truth for every on-ledger statement here is [`rpnd/config/tokens.json`](https://github.com/PondProtocol/rPND/blob/main/config/tokens.json) and the transaction builders in `rpnd/src/issuance.ts`, with [`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md) and [`pnd/docs/token-spec.md`](https://github.com/PondProtocol/PND/blob/main/docs/token-spec.md) as the per-token references. If this document and those files disagree, they are right and this document is stale — please fix it.

## Live state

**The issuer account is funded on mainnet and completely unconfigured. Neither token exists on ledger.**

Config values describe what the operator *intends to submit*. None of them is on ledger until the corresponding transaction is validated, and every parameter section below separates the three: what the config intends, what is on ledger now, and what changes once applied. Treat any document in this organization that states a configured flag as a live property as a bug.

| | State |
| --- | --- |
| Issuer | `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` — **issues both $PND and $rPND** ([OQ-22](open-questions.md#oq-22), decided). Funded on **mainnet** only — `actNotFound` on Testnet and Devnet |
| Treasury | `rPNDcL2UrGtSoGwruWx6ocMQ6ey8uPZm2b` — holds the 90B $PND vesting escrow ([OQ-23](open-questions.md#oq-23), decided). **Not funded** — `account_info` returns `actNotFound` on mainnet |
| Operations | `rPNDAwFzgXzsjvUbVWz1ErB28v9SkcR2in` — holds the 10B circulating allocation, creates the AMM pool ([OQ-23](open-questions.md#oq-23), decided). **Not funded** — `account_info` returns `actNotFound` on mainnet |
| Issuer account flags | `Flags` is 0 and every flag reports false, so Default Ripple, Disallow XRP, Require Destination Tag, No Freeze, Global Freeze, and trust line clawback are all **unset** |
| Issuer `Domain`, `TransferRate`, `TickSize`, `RegularKey` | Absent — the account has no `AccountSet` applied at all |
| Issuer trust lines | None. `account_lines` is empty and `OwnerCount` is 0 |
| $PND outstanding | None. `gateway_balances` reports no obligations |
| $rPND | No issuance. `account_objects` is empty, so no `MPTokenIssuance` exists from the issuer |

Two consequences that expire, so worth acting on rather than noting:

- **`asfAllowTrustLineClawback` can still be set.** It is only settable on an account that has never had a trust line, and this account has none yet. The first `TrustSet` closes the option permanently — [OQ-08](open-questions.md#oq-08).
- **`AssetScale` and `MaximumAmount` are still free.** No `MPTokenIssuanceCreate` has happened, so the supply decision is still fully open — [OQ-21](open-questions.md#oq-21).

### Checking current state

Do not trust the table above — it was true when written and the whole point is that these values change the moment a transaction lands. Query the ledger:

```bash
ACCOUNT=rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc

# account flags, Domain, TransferRate, TickSize, RegularKey, OwnerCount
curl -s https://xrplcluster.com -H 'Content-Type: application/json' \
  -d "{\"method\":\"account_info\",\"params\":[{\"account\":\"$ACCOUNT\",\"ledger_index\":\"validated\"}]}"

# outstanding $PND (issuer obligations)
curl -s https://xrplcluster.com -H 'Content-Type: application/json' \
  -d "{\"method\":\"gateway_balances\",\"params\":[{\"account\":\"$ACCOUNT\",\"ledger_index\":\"validated\"}]}"

# trust lines, and objects including any MPTokenIssuance
curl -s https://xrplcluster.com -H 'Content-Type: application/json' \
  -d "{\"method\":\"account_lines\",\"params\":[{\"account\":\"$ACCOUNT\",\"ledger_index\":\"validated\"}]}"
curl -s https://xrplcluster.com -H 'Content-Type: application/json' \
  -d "{\"method\":\"account_objects\",\"params\":[{\"account\":\"$ACCOUNT\",\"ledger_index\":\"validated\"}]}"
```

`account_flags` in the `account_info` response is the readable form — check that rather than decoding the `Flags` bitfield by hand.

## Layers

### 1. XRP Ledger

Both assets are native XRPL objects. Nothing runs off ledger except the operator tooling and metadata hosting.

$rPND depends on the MPTokens amendment, which makes network capability part of the architecture rather than a deployment detail. `config/tokens.json` records per-network capability: Devnet `supportsMpt: true`, Testnet `supportsMpt: false`, mainnet `supportsMpt: true` (unverified — [TD-03](open-questions.md#td-03)). The `issue-rpnd` command refuses to run on a network not marked MPT-capable.

### 2. Assets

Two distinct on-ledger object types:

**$PND** is an issued currency (IOU) to be issued by `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`. Its identity is the pair (currency code `PND`, issuer classic address) — amounts are `{ currency, issuer, value }`, so the issuing account is inseparable from the asset. Balances live on trust lines, which means a holder must opt in with `TrustSet` before receiving any. Supply targets 100,000,000,000 by issuer policy, not as a ledger constraint — see [spec/03](spec/03-issuance-and-supply.md#32-supply-parameters).

Its issuer settings are config intent, not live state. None has been applied:

| Setting | Config intends | On ledger now | Effect once applied |
| --- | --- | --- | --- |
| Default Ripple | enabled | **not set** | Lets $PND ripple between holders' trust lines. Until it is set, holders cannot pay each other in $PND without each line's `NoRipple` default being overridden |
| Disallow XRP | set | **not set** | Advisory only, asking clients not to send XRP to the issuer; the ledger does not enforce it |
| Require Destination Tag | off | not set | No change; config and ledger agree |
| `TransferRate` | 0 | absent | Absent already means no transfer fee, so applying it changes nothing observable |
| `TickSize` | 5 | absent | Rounds order-book prices for $PND pairs to 5 significant digits. Absent means the ledger default applies |
| `Domain` | unset (website host is `pond.greenhead.io`) | absent | Would bind the issuer to the host serving `xrp-ledger.toml`. Absent means XLS-26 metadata cannot be verified against the account. Stays unset until CORS is verified live. Do not set Domain as part of attaching this host |

The `displayDecimals` value of 6 is XLS-26 presentation metadata, not an account setting, and never appears on the AccountRoot.

**$rPND** is a Multi-Purpose Token. **No issuance exists**, so everything here describes what `MPTokenIssuanceCreate` would submit, not an asset anyone can hold today. Its identity will be the `MPTokenIssuanceID` the ledger assigns when that transaction succeeds; the XLS-89 ticker `RPND` is metadata, not identity. Amounts are `{ mpt_issuance_id, value }` in base units at asset scale 6, so one whole rPND is 1,000,000 units. A holder must opt in with `MPTokenAuthorize`. Flags the create would set: `tfMPTCanTransfer` and `tfMPTCanLock`, with `canTrade`, `canClawback`, and `requireAuth` left off, and `ImmutableFlags` carrying `tifMPTCanClawback` to foreclose clawback permanently. The supply parameters — `assetScale`, `maximumAmount`, `initialIssuance` — are working defaults that `rpnd/docs/rpnd-spec.md` labels "not ratified economics."

Capability flags are one-way: `MPTokenIssuanceSet` can enable a flag but never disable one. Flags set at create would therefore be permanent, and flags left off could be added later but never withdrawn afterward. `MaximumAmount` bounds **circulating** supply rather than cumulative issuance — returning tokens to the issuer frees headroom to mint again.

The toolkit signs both assets' transactions with one configured issuer wallet, and that is now the confirmed production design, not just a description of the tooling: the owner has decided the $rPND issuance uses the same account as $PND — [OQ-22](open-questions.md#oq-22). A blackholed account can never sign again, so this decision creates an ordering constraint: `MPTokenIssuanceCreate` must happen before the issuer is ever blackholed, if $rPND is ever going to exist. That ordering is moot today because the current $rPND config cannot be created on mainnet — it sets `ImmutableFlags`, which requires the `DynamicMPT` amendment, not enabled on mainnet.

**The link between them is metadata only.** `paired_iou_currency: "PND"` in the $rPND blob tells indexers the two are related. The ledger enforces nothing: no shared supply, no conversion, no atomic anything. Any real relationship is undesigned — [OQ-03](open-questions.md#oq-03), [OQ-04](open-questions.md#oq-04).

### 3. Issuance and operations

Three roles, following standard XRPL cold/hot practice, extended with a treasury account for the escrow design; a fourth role for bot automation is recommended but not yet created:

| Role | Holds | Submits |
| --- | --- | --- |
| Issuer (cold) — `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` | issuing authority for both assets | `AccountSet`, `Payment` of $PND, `MPTokenIssuanceCreate`, `Payment` of $rPND |
| Treasury — `rPNDcL2UrGtSoGwruWx6ocMQ6ey8uPZm2b` | the 90B $PND vesting escrow | `EscrowCreate` (locking), never `Payment` of newly issued supply |
| Operations (hot) — `rPNDAwFzgXzsjvUbVWz1ErB28v9SkcR2in` | the 10B circulating/liquidity inventory of both assets | `TrustSet` for `PND`, `MPTokenAuthorize` for $rPND, `AMMCreate`, routine distribution payments |
| Bot-ops (recommended, not created) | at most a small XRP float for fees — no $PND trust line | whatever a deterministic allow-list permits a bot to sign; never a transaction from Issuer, Treasury, or Operations |

The cold seed is meant to stay offline in production; the toolkit reads seeds from `ISSUER_SEED` / `OPERATIONAL_SEED` and writes faucet output to a gitignored `var/` directory on dev networks only. `fund` refuses to run on mainnet. Custody beyond "keep it offline" is undecided — [OQ-11](open-questions.md#oq-11) — except for the narrower bot question, which is decided: a bot signs only from its own dedicated account, with a regular key, never a master seed, and never a key on Operations (which carries the 10B liquidity allocation) or on Treasury or the Issuer.

This is the procedure the tooling implements, though the tooling itself still only models one hot account (`OPERATIONAL_SEED`) and has no Treasury or bot-ops concept yet. The live deployment's topology is decided — Issuer, Treasury, and Operations are all named addresses — [OQ-23](open-questions.md#oq-23) — but none of the three non-issuer accounts is funded on ledger, and the toolkit needs extending before it can drive the Treasury role.

Local issuance state (issuer address, operational address, `rpndIssuanceId`) is cached per network in `var/<network>-issuance.json`. That file is convenience, not authority: the ledger is authoritative, and `status` re-reads the `MPTokenIssuance` ledger entry to decode published metadata.

### 4. Metadata and discovery

Discovery is split across two mechanisms, one off ledger and one on:

- **XLS-26, off ledger.** An `xrp-ledger.toml` served at
  `https://pond.greenhead.io/.well-known/xrp-ledger.toml`. That is the **website host** (Replit,
  custom domain). It is bound to the issuer only if the AccountRoot `Domain` field is set to the
  same host (`pond.greenhead.io`, lowercase, no scheme) — and that field is unset, and stays unset
  until CORS is verified on the live path. Do not set `Domain` as part of attaching this host.
  Binding `Domain` can only be changed while the issuer can still sign. The $rPND row is omitted
  pending a real issuance id.
- **XLS-89, on ledger.** A JSON blob (ticker, name, desc, icon, asset class, issuer name, URIs, `additional_info`) hex-encoded into `MPTokenMetadata`, currently 249 bytes against a 1024-byte cap, validated by the toolkit before submission. `MPTokenIssuanceSet` replaces the whole blob; `tifMPTMetadata` would freeze it permanently and is not set — [OQ-10](open-questions.md#oq-10). The published `issuer_name` still reads `rPND` rather than `Pond Protocol` — [OQ-24](open-questions.md#oq-24).

Both currently point at incomplete metadata: the website host is filled in for XLS-26, the $rPND
icon and URI are still `example.com` placeholders, and the on-ledger `Domain` is unset —
[OQ-12](open-questions.md#oq-12), [TD-01](open-questions.md#td-01), [TD-02](open-questions.md#td-02).

### 5. Specification

This repo. It carries no keys, holds no config the toolkit reads, and submits nothing. It exists so the protocol's intent is written down in one place rather than inferred from operator scripts.

## Issuance flow

The sequence the toolkit implements, in order:

```
configure-issuer   issuer   AccountSet          DefaultRipple, TickSize, TransferRate, [Domain]
issue-pnd          op       TrustSet            LimitAmount { PND, issuer, operationalTrustLimit }
                   issuer   Payment             { PND, issuer, initialIssuance } → operational
issue-rpnd         issuer   MPTokenIssuanceCreate  AssetScale, MaximumAmount, MPTokenMetadata, flags,
                                                   ImmutableFlags → yields MPTokenIssuanceID
                   op       MPTokenAuthorize    MPTokenIssuanceID          (skipped with --create-only)
                   issuer   Payment             { mpt_issuance_id, value } → operational
```

Every step is inspectable before it touches a network: `dry-run` prints all six unsigned transactions and `encode-metadata` prints the XLS-89 JSON with its hex encoding and byte count.

Downstream of this, distribution to actual holders is two CLI commands (`send-pnd`, `send-rpnd`) and no policy — [OQ-13](open-questions.md#oq-13).

## Trust boundaries

What a holder must trust today, stated plainly because the spec cannot yet soften it with guarantees:

1. **The issuer's discretion over supply.** $rPND circulation is capped on ledger at `MaximumAmount`, though burns free headroom, so the cap is not a lifetime issuance budget. $PND, as an IOU, has no on-ledger cap at all; the operational trust limit bounds one line, not total issuance. The 100B $PND target is operator policy the ledger will not enforce, verifiable only by reading issuer obligations via `gateway_balances` — [OQ-06](open-questions.md#oq-06). How the two figures relate is undecided — [OQ-21](open-questions.md#oq-21).
2. **The issuer's lock capability over $rPND.** `tfMPTCanLock` is set, and one-way flag semantics make it permanent — the issuer cannot renounce lock authority later. Clawback, by contrast, is permanently impossible. $PND has no freeze flags configured either way, so it retains the ledger's default freeze capability — [OQ-08](open-questions.md#oq-08).
3. **The issuer's control of metadata.** The $rPND blob is mutable, and the off-ledger toml is whatever the website host (`pond.greenhead.io`) serves. Both describe the asset; neither constrains it — [OQ-10](open-questions.md#oq-10). The on-ledger `Domain` is unset, so the TOML is not a completed XLS-26 bind.
4. **Off-ledger obligations, if any exist.** Nothing documents $PND as a claim against anyone — [OQ-05](open-questions.md#oq-05).
5. **Key custody.** A compromised cold key is a compromised protocol. There is no multi-sign or regular-key support in the toolkit today — [OQ-11](open-questions.md#oq-11).

## What is not in this architecture

Named explicitly so nobody assumes it exists:

- Any settlement, redemption, or conversion path between $PND and $rPND
- Any peg, price oracle, or reserve accounting
- Any smart-contract or hook logic (the design is plain XRPL transactions)
- Any holder-facing application or wallet (the documentation site at `pond.greenhead.io` is not one)
- Any trading venue, order book presence, or AMM pool
- Any governance mechanism, on ledger or off
- Any issued token. The issuer account is funded on mainnet, but it has no `AccountSet` applied, no trust lines, no obligations, and no MPT issuance — see [Live state](#live-state)
