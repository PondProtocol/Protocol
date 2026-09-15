# 04 — Token relationship

Skeleton, and the emptiest section in the spec. This is where Pond Protocol's actual mechanics belong, and none of them have been decided.

See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

## 4.1 What links the tokens today

**Documented** (`rpnd/src/metadata.ts`, `rpnd/docs/tokens.md`):

The $rPND XLS-89 metadata blob carries `additional_info.paired_iou_currency = "PND"`. It is written on every metadata encode, so it is on ledger as soon as $rPND is created.

Its meaning is documented and deliberately narrow. Quoting `rpnd/docs/tokens.md` in full, because paraphrase tends to overstate it:

> `additional_info.paired_iou_currency` on $rPND is `PND`. That is documentation for indexers and operators. The ledger does not atomically bind the IOU and the MPT.

Two sibling repos say the same in stronger terms. [`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md): "A $PND balance confers no claim on $rPND or the reverse," and the ledger "enforces no ratio, no peg, and no atomic conversion." [`pnd/docs/pnd-vs-rpnd.md`](https://github.com/PondProtocol/PND/blob/main/docs/pnd-vs-rpnd.md) lists what the field does not create — no peg, no atomic conversion or redemption path, no shared supply accounting, and no guarantee the two are even issued by the same account — and warns that treating $rPND as a wrapped or redeemable form of $PND "is asserting a mechanism that does not exist on ledger today."

Beyond that field, the assets may share an issuing account, though that is itself open ([OQ-22](../open-questions.md#oq-22)).

## 4.2 What is not defined

**Open — all of the following.** None of it appears in any repo, and none of it may be written into this spec as fact until an owner decides it. Primary trackers: [OQ-03](../open-questions.md#oq-03), [OQ-04](../open-questions.md#oq-04), and [OQ-21](../open-questions.md#oq-21). `rpnd/docs/rpnd-spec.md` carries the same question as an owner TODO, and until it is answered nothing in that repo "may be presented as a redemption promise."

- **Scale.** $PND targets 100B as policy; $rPND's provisional cap is 1B in circulation. Should those figures relate, and how? `MaximumAmount` is permanent from the create transaction onward, so this must be settled before any $rPND create — though not before the $PND launch, which comes first — [OQ-21](../open-questions.md#oq-21).
- **Rate.** Is there a fixed rate or peg between $PND and $rPND? 1:1, or something else? Floating?
- **Convertibility.** Can a holder convert one into the other? One-way, two-way, or not at all?
- **Execution.** If conversion exists, who performs it — an operator process, an on-ledger mechanism, a manual desk — and what are the settlement expectations?
- **Supply invariant.** Is there a rule tying the two supplies together, such as $rPND outstanding never exceeding $PND outstanding? If so, what enforces it, given the ledger does not?
- **Direction of dependency.** Does one asset derive its value from the other, or are they independent assets that merely share an issuer?
- **Lifecycle.** Do both persist indefinitely, or is one a migration path toward the other?
- **Reserve or backing.** If $rPND is backed by held $PND (or anything else), where are reserves held, and how is the position reported?

## 4.3 Why the pairing field is not enough

**Documented:** a metadata field is a label. It is not read by the ledger, not enforced at transaction time, and rewritable via `MPTokenIssuanceSet` while the blob remains unfrozen ([OQ-10](../open-questions.md#oq-10)). Anyone relying on it is relying on the issuer's continued honesty and on their own indexer, not on XRPL consensus. The one guarantee that does hold is internal: the toolkit always overwrites the field with the configured IOU code at build time, so it cannot drift from $PND's actual currency code.

Stated here so the field is never mistaken for a mechanism.

## 4.4 Liquidity and price discovery

**Documented:** $rPND is created without `tfMPTCanTrade`, which `rpnd/docs/rpnd-spec.md` identifies as the flag permitting DEX and AMM use. Flags are one-way, so it can be enabled after create but never disabled again. [rPND PR #1](https://github.com/PondProtocol/rPND/pull/1) lists DEX listings as out of scope.

**Open:** whether the protocol intends order-book listings, an XRPL AMM pool, or no venue at all, and how price discovery is meant to work between the two assets — [OQ-14](../open-questions.md#oq-14).

## 4.5 Naming implication

**Open:** the `r` prefix in `rPND` resembles conventions used elsewhere for wrapped or receipt tokens. No repo states that intent, so this spec does not assert it. If the prefix is meant to carry meaning, say so explicitly here once decided — [OQ-04](../open-questions.md#oq-04).
