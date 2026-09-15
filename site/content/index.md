# Pond Protocol

{{tagline}}

Pond Protocol is the umbrella for two XRP Ledger assets. They are different kinds of on-ledger
object, they are not interchangeable, and neither confers a claim on the other:

| Token | Ledger type | Identifier |
| --- | --- | --- |
| **$PND** | Issued currency (IOU), held on trust lines | currency code `PND` |
| **$rPND** | Multi-Purpose Token (MPT) | ticker `RPND`, plus an `MPTokenIssuanceID` assigned at create time |

<div class="callout callout-critical">

## Start here: verify the issuer

Anyone can issue a token with the currency code `PND`, and several accounts already have. A ticker
is not an identity — only the pair **(currency code, issuer address)** is.

<p><a class="button" href="/verify/">Verify the real $PND &rarr;</a></p>

Checking the issuer address takes about thirty seconds and it is the only way to tell $PND from a
token that merely reuses its ticker.

</div>

## Where to go

**If you want to hold or trade $PND** — read [Verify the issuer](/verify/) first, then
[Holding $PND](/pnd/holding/) for how trust lines work and what they cost.

**If you are integrating** — [Integration guide](/pnd/integration/) covers displaying and moving
$PND, and [Token specification](/pnd/) is the parameter reference.

**If you are an indexer or wallet** — [xrp-ledger.toml](/xrp-ledger-toml/) explains the XLS-26
metadata this domain serves and how it links back to the issuer account.

**If you want the design** — [Architecture](/protocol/architecture/) describes what exists today,
the [specification](/spec/) is the (still skeletal) normative description, and
[open questions](/open-questions/) is the honest list of what has not been decided.

## Current status

The two tokens exist as working, tested issuance code. The **protocol that relates them does not
exist yet** — there is no peg, no redemption path, no conversion mechanism, and no supply invariant
across the two assets. The only on-ledger link is a metadata field on $rPND recording
`paired_iou_currency = "PND"`, which is documentation for indexers and nothing more.

$PND launches first. $rPND cannot trade anywhere on mainnet today: MPT DEX and AMM support arrives
with a ledger amendment that is not yet enabled, so $rPND can currently be held and sent but not
traded.

We would rather publish that plainly than imply a finished system. The
[open questions](/open-questions/) page is the full list, including the ones that are still owner
decisions.

## Source

Documentation on this site is generated from the project repositories, so the pages here and the
repository documents do not drift apart. Each page names the file it came from at the bottom.
