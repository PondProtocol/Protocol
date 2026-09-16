# $PND and $rPND

Two assets. Two ledger types. They share a naming family and one issuer.
They are not interchangeable, and neither is a claim on the other.

**$rPND is not launching on 1 October 2026.** That date is for $PND.

| | $PND | $rPND |
| --- | --- | --- |
| What it is | Issued currency (IOU) | Multi-Purpose Token (MPT) |
| How you name it | code `PND` + issuer address | an `MPTokenIssuanceID` the ledger assigns at create |
| Opt-in | trust line (`TrustSet`) | `MPTokenAuthorize` |
| Launch | target **2026-10-01** — not issued yet | not this launch; MPT DEX/AMM needs an amendment that is not enabled |
| Supply | 100B policy, not a ledger cap | a hard circulating cap *if* it is created, chosen at create time |

There is no peg, no wrap, no redemption button, and no conversion path. A
metadata field on $rPND may say it is paired with currency `PND`. That is a
note for indexers. The ledger does not enforce it.

Same issuer: `{{issuerAddress}}`. That is why this account must **not** be
blackholed before the $rPND MPT exists. A blackholed issuer can never create
the MPT.

The longer comparison, including numbers that are still working defaults on
the $rPND side, is [$PND and $rPND compared](/protocol/two-tokens/). This page
is the join-flow version: two tokens, one launch date, and it is not both.
