# 07 — Security considerations

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

This section describes the risks that exist today. It does not offer mitigations that have not been decided.

## 7.1 Issuer key compromise

**Documented:** the cold/hot split is the only structural mitigation in place. The cold seed is meant to be offline; the toolkit reads seeds from environment variables, refuses to faucet-fund on mainnet, and writes dev-network seeds to a gitignored `var/` directory.

**Open:** custody mechanism, multi-sign or regular-key configuration, rotation policy, and compromise response — [OQ-11](../open-questions.md#oq-11). A compromised cold key means unbounded $PND issuance, $rPND minting up to `MaximumAmount`, locking of $rPND balances, and metadata rewrites. Clawback is the one thing an attacker could not do, because it is permanently foreclosed.

## 7.2 Supply risk

**Documented:** $rPND cannot exceed `MaximumAmount`. $PND has no on-ledger cap; the operational trust limit constrains a single line, not total issuance.

**Open:** whether $PND supply discipline exists as policy, and how it is made auditable — [OQ-06](../open-questions.md#oq-06). Absent that, a $PND holder's dilution risk is bounded only by issuer discretion.

## 7.3 Freeze and lock risk

**Documented:** $rPND is created with `tfMPTCanLock`, so the issuer can lock balances. $PND has no freeze-related flags configured, so the ledger's default freeze capability remains available to the issuer.

**Open:** intended use of lock, authorization required to invoke it, and whether $PND should adopt No Freeze — [OQ-08](../open-questions.md#oq-08).

## 7.4 Metadata trust

**Documented:** the on-ledger blob is mutable and replaced wholesale on update. The off-ledger TOML is whatever the domain serves, and is only meaningfully bound to the issuer while the AccountRoot `Domain` matches the host.

Consequence: an attacker controlling DNS or hosting for the issuer domain can misrepresent the tokens to any XLS-26 consumer without touching the ledger. Nothing detects that today — [OQ-10](../open-questions.md#oq-10), [5.5](05-metadata-and-discovery.md#55-consistency-between-the-two-mechanisms).

## 7.5 Impersonation

**Documented:** $PND's identity is (code, issuer address), so anyone may issue a token with the code `PND` from their own account. For $rPND, the ticker `RPND` is metadata and is likewise not unique; only the `MPTokenIssuanceID` is. Publishing the issuer address through a verified domain is the primary defense, which makes [TD-02](../open-questions.md#td-02) a security task and not just a polish task.

## 7.6 Network dependency

**Documented:** $rPND requires the MPTokens amendment. Testnet is flagged as lacking it; mainnet is flagged as having it, unverified — [TD-03](../open-questions.md#td-03). Devnet is periodically reset by Ripple, and `rpnd/docs/issuance.md` warns against reusing dev keys on mainnet.

## 7.7 Disclosure

**Open:** there is no SECURITY.md, no disclosure contact, and no documented response expectation in any repo — [OQ-19](../open-questions.md#oq-19), [TD-07](../open-questions.md#td-07).

**Open:** whether issuance procedures and key custody get an external review before mainnet — [OQ-19](../open-questions.md#oq-19).

## 7.8 Unquantified risk

**Open:** the relationship between the two assets is undefined ([OQ-03](../open-questions.md#oq-03)), so the risk a holder of one takes on with respect to the other cannot be described yet. This section stays incomplete until that decision lands.
