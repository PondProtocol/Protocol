# Architecture overview

This document describes how the pieces of Pond Protocol fit together **as they exist today**. It is descriptive, not aspirational: where a layer is missing, it says so and links to the open question that would fill it.

Ground truth for every on-ledger statement here is [`rpnd/config/tokens.json`](https://github.com/PondProtocol/rPND/blob/main/config/tokens.json) and the transaction builders in `rpnd/src/issuance.ts`, with [`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md) and [`pnd/docs/token-spec.md`](https://github.com/PondProtocol/PND/blob/main/docs/token-spec.md) as the per-token references. If this document and those files disagree, they are right and this document is stale — please fix it.

## Layers

### 1. XRP Ledger

Both assets are native XRPL objects. Nothing runs off ledger except the operator tooling and metadata hosting.

$rPND depends on the MPTokens amendment, which makes network capability part of the architecture rather than a deployment detail. `config/tokens.json` records per-network capability: Devnet `supportsMpt: true`, Testnet `supportsMpt: false`, mainnet `supportsMpt: true` (unverified — [TD-03](open-questions.md#td-03)). The `issue-rpnd` command refuses to run on a network not marked MPT-capable.

### 2. Assets

Two distinct on-ledger object types:

**$PND** is an issued currency (IOU), issued by `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`. Its identity is the pair (currency code `PND`, issuer classic address) — amounts are `{ currency, issuer, value }`, so the issuing account is inseparable from the asset. Balances live on trust lines, which means a holder must opt in with `TrustSet` before receiving any. Configured on-ledger properties: Default Ripple enabled (so balances can ripple between trust lines), Disallow XRP set, Require Destination Tag off, transfer rate 0, tick size 5, 6 display decimals. Supply targets 100,000,000,000 by issuer policy, not as a ledger constraint — see [spec/03](spec/03-issuance-and-supply.md#32-supply-parameters).

**$rPND** is a Multi-Purpose Token. Its identity is the `MPTokenIssuanceID` assigned by the ledger when `MPTokenIssuanceCreate` succeeds; the XLS-89 ticker `RPND` is metadata, not identity. Amounts are `{ mpt_issuance_id, value }` in base units at asset scale 6, so one whole rPND is 1,000,000 units. A holder must opt in with `MPTokenAuthorize`. Create-time flags: `tfMPTCanTransfer` and `tfMPTCanLock` set; `canTrade`, `canClawback`, and `requireAuth` unset. `ImmutableFlags` carries `tifMPTCanClawback`, which permanently forecloses clawback. Its supply parameters — `assetScale`, `maximumAmount`, `initialIssuance` — are working defaults that have never been issued on ledger, and `rpnd/docs/rpnd-spec.md` labels them "not ratified economics."

Capability flags are one-way: `MPTokenIssuanceSet` can enable a flag but never disable one. Flags set at create are therefore permanent, and flags left off can be added later but never withdrawn afterward. `MaximumAmount` bounds **circulating** supply rather than cumulative issuance — returning tokens to the issuer frees headroom to mint again.

The toolkit signs both assets' transactions with one configured issuer wallet, and `rpnd`'s own docs describe the two as sharing an issuing account. Whether the production $rPND issuance actually uses the $PND account is still an owner decision — [OQ-22](open-questions.md#oq-22).

**The link between them is metadata only.** `paired_iou_currency: "PND"` in the $rPND blob tells indexers the two are related. The ledger enforces nothing: no shared supply, no conversion, no atomic anything. Any real relationship is undesigned — [OQ-03](open-questions.md#oq-03), [OQ-04](open-questions.md#oq-04).

### 3. Issuance and operations

Two roles, following standard XRPL cold/hot practice, both driven by the `rpnd` CLI:

| Role | Holds | Submits |
| --- | --- | --- |
| Issuer (cold) | issuing authority for both assets | `AccountSet`, `Payment` of $PND, `MPTokenIssuanceCreate`, `Payment` of $rPND |
| Operational (hot) | distributable inventory of both assets | `TrustSet` for `PND`, `MPTokenAuthorize` for $rPND |

The cold seed is meant to stay offline in production; the toolkit reads seeds from `ISSUER_SEED` / `OPERATIONAL_SEED` and writes faucet output to a gitignored `var/` directory on dev networks only. `fund` refuses to run on mainnet. Custody beyond "keep it offline" is undecided — [OQ-11](open-questions.md#oq-11).

This is the procedure the tooling implements. Whether the live deployment behind `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` actually separates a hot account, and what its public address is, is open — [OQ-23](open-questions.md#oq-23).

Local issuance state (issuer address, operational address, `rpndIssuanceId`) is cached per network in `var/<network>-issuance.json`. That file is convenience, not authority: the ledger is authoritative, and `status` re-reads the `MPTokenIssuance` ledger entry to decode published metadata.

### 4. Metadata and discovery

Discovery is split across two mechanisms, one off ledger and one on:

- **XLS-26, off ledger.** An `xrp-ledger.toml` served at `https://<domain>/.well-known/xrp-ledger.toml`, listing `[[ACCOUNTS]]`, `[[CURRENCIES]]`, and `[[TOKENS]]`. It is bound to the issuer by setting the AccountRoot `Domain` field to the same host — the template's own notice says addresses are authoritative only once `Domain` matches. The $rPND row is commented out in the template pending a real issuance id.
- **XLS-89, on ledger.** A JSON blob (ticker, name, desc, icon, asset class, issuer name, URIs, `additional_info`) hex-encoded into `MPTokenMetadata`, currently 249 bytes against a 1024-byte cap, validated by the toolkit before submission. `MPTokenIssuanceSet` replaces the whole blob; `tifMPTMetadata` would freeze it permanently and is not set — [OQ-10](open-questions.md#oq-10). The published `issuer_name` still reads `rPND` rather than `Pond Protocol` — [OQ-24](open-questions.md#oq-24).

Both currently point at `example.com` placeholders, so neither is publishable yet — [OQ-12](open-questions.md#oq-12), [TD-01](open-questions.md#td-01), [TD-02](open-questions.md#td-02).

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
3. **The issuer's control of metadata.** The $rPND blob is mutable, and the off-ledger toml is whatever the domain serves. Both describe the asset; neither constrains it — [OQ-10](open-questions.md#oq-10).
4. **Off-ledger obligations, if any exist.** Nothing documents $PND as a claim against anyone — [OQ-05](open-questions.md#oq-05).
5. **Key custody.** A compromised cold key is a compromised protocol. There is no multi-sign or regular-key support in the toolkit today — [OQ-11](open-questions.md#oq-11).

## What is not in this architecture

Named explicitly so nobody assumes it exists:

- Any settlement, redemption, or conversion path between $PND and $rPND
- Any peg, price oracle, or reserve accounting
- Any smart-contract or hook logic (the design is plain XRPL transactions)
- Any holder-facing application, wallet, or website
- Any trading venue, order book presence, or AMM pool
- Any governance mechanism, on ledger or off
- Any mainnet deployment
