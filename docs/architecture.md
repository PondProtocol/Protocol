# Architecture overview

This document describes how the pieces of Pond Protocol fit together **as they exist today**. It is descriptive, not aspirational: where a layer is missing, it says so and links to the open question that would fill it.

Ground truth for every on-ledger statement here is [`rpnd/config/tokens.json`](https://github.com/PondProtocol/rPND/blob/main/config/tokens.json) and the transaction builders in `rpnd/src/issuance.ts`. If this document and those files disagree, the code is right and this document is stale — please fix it.

## Layers

### 1. XRP Ledger

Both assets are native XRPL objects. Nothing runs off ledger except the operator tooling and metadata hosting.

$rPND depends on the MPTokens amendment, which makes network capability part of the architecture rather than a deployment detail. `config/tokens.json` records per-network capability: Devnet `supportsMpt: true`, Testnet `supportsMpt: false`, mainnet `supportsMpt: true` (unverified — [TD-03](open-questions.md#td-03)). The `issue-rpnd` command refuses to run on a network not marked MPT-capable.

### 2. Assets

Two distinct on-ledger object types, issued from one cold account:

**$PND** is an issued currency (IOU). Its identity is the pair (currency code `PND`, issuer classic address) — amounts are `{ currency, issuer, value }`, so the issuing account is inseparable from the asset. Balances live on trust lines, which means a holder must opt in with `TrustSet` before receiving any. Configured on-ledger properties: Default Ripple enabled (so balances can ripple between trust lines), Disallow XRP set, Require Destination Tag off, transfer rate 0, tick size 5, 6 display decimals.

**$rPND** is a Multi-Purpose Token. Its identity is the `MPTokenIssuanceID` assigned by the ledger when `MPTokenIssuanceCreate` succeeds; the XLS-89 ticker `RPND` is metadata, not identity. Amounts are `{ mpt_issuance_id, value }` in fractional units at asset scale 6, so one whole rPND is 1,000,000 units. A holder must opt in with `MPTokenAuthorize`. Create-time flags: `tfMPTCanTransfer` and `tfMPTCanLock` set; `canTrade`, `canClawback`, and `requireAuth` unset. `ImmutableFlags` carries `tifMPTCanClawback`, which permanently forecloses clawback — this is the one irreversible protocol commitment already made on ledger.

**The link between them is metadata only.** `paired_iou_currency: "PND"` in the $rPND blob tells indexers the two are related. The ledger enforces nothing: no shared supply, no conversion, no atomic anything. Any real relationship is undesigned — [OQ-03](open-questions.md#oq-03), [OQ-04](open-questions.md#oq-04).

### 3. Issuance and operations

Two accounts, following standard XRPL cold/hot practice, both driven by the `rpnd` CLI:

| Role | Holds | Submits |
| --- | --- | --- |
| Issuer (cold) | issuing authority for both assets | `AccountSet`, `Payment` of $PND, `MPTokenIssuanceCreate`, `Payment` of $rPND |
| Operational (hot) | distributable inventory of both assets | `TrustSet` for `PND`, `MPTokenAuthorize` for $rPND |

The cold seed is meant to stay offline in production; the toolkit reads seeds from `ISSUER_SEED` / `OPERATIONAL_SEED` and writes faucet output to a gitignored `var/` directory on dev networks only. `fund` refuses to run on mainnet. Custody beyond "keep it offline" is undecided — [OQ-11](open-questions.md#oq-11).

Local issuance state (issuer address, operational address, `rpndIssuanceId`) is cached per network in `var/<network>-issuance.json`. That file is convenience, not authority: the ledger is authoritative, and `status` re-reads the `MPTokenIssuance` ledger entry to decode published metadata.

### 4. Metadata and discovery

Discovery is split across two mechanisms, one off ledger and one on:

- **XLS-26, off ledger.** An `xrp-ledger.toml` served at `https://<domain>/.well-known/xrp-ledger.toml`, listing `[[ACCOUNTS]]`, `[[CURRENCIES]]`, and `[[TOKENS]]`. It is bound to the issuer by setting the AccountRoot `Domain` field to the same host — the template's own notice says addresses are authoritative only once `Domain` matches. The $rPND row is commented out in the template pending a real issuance id.
- **XLS-89, on ledger.** A JSON blob (ticker, name, desc, icon, asset class, issuer name, URIs, `additional_info`) hex-encoded into `MPTokenMetadata`, capped at 1024 bytes and validated by the toolkit before submission. Replacing it later replaces the whole blob, unless metadata is marked immutable — [OQ-10](open-questions.md#oq-10).

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

1. **The issuer's discretion over supply.** $rPND is capped on ledger at `MaximumAmount`. $PND, as an IOU, has no on-ledger cap at all; the operational trust limit bounds one line, not total issuance. Any $PND supply discipline is operator policy that the ledger will not enforce — [OQ-06](open-questions.md#oq-06).
2. **The issuer's lock capability over $rPND.** `tfMPTCanLock` is set. Clawback, by contrast, is permanently impossible. $PND has no freeze flags configured either way, so it retains the ledger's default freeze capability — [OQ-08](open-questions.md#oq-08).
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
