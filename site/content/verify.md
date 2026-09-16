# Verify the real $PND

**Anyone can issue a token with the currency code `PND`.** The XRP Ledger does not reserve
currency codes, does not check them for uniqueness, and has no registry. A three-character code is
a label, not an identity.

The only thing that identifies a token on the XRP Ledger is the pair:

> **(currency code, issuer address)**

`PND` alone tells you nothing. `PND` issued by a specific account is a specific asset. Two accounts
can both issue `PND` and they are two unrelated tokens that cannot be exchanged for one another,
have separate supplies, and share nothing but three characters of text.

This is not a precaution about something that might happen later. **Multiple mainnet accounts already
issue tokens under the exact code `PND`, and others use the near-identical variants `Pnd`, `PNDN` and
`PNDC`.** Codes are case-sensitive, so `Pnd` and `PND` are different assets. Details below.

<div class="callout callout-critical">

## $PND has not been issued yet

The issuer account is funded but has no account settings, no `Domain`, and no issuance. There is no
$PND in circulation, there is no $PND liquidity pool, and there is nothing to buy.

**Therefore: every token currently trading under the code `PND` is not $PND.** If you find one and
buy it, you have bought an unrelated asset from an unrelated issuer. Come back to this page when
this notice is gone.

</div>

## The canonical issuer

| | |
| --- | --- |
| **Currency code** | `PND` |
| **Issuer address** | `{{issuerAddress}}` |
| **Status** | {{issuerAddressStatus}} |
| **Ledger type** | Issued currency (IOU), held on a trust line |

That address is the identity. Save it, and check it against this page — served over HTTPS from the
domain the issuer account itself points at — rather than against a ticker in a search box.

## Canonical links to the real $PND

<div class="callout callout-critical">

**Searching for $PND is not a reliable way to find it.** Use these links, from this page, or check
the issuer address on ledger. Nothing else.

</div>

On XRPL trading front-ends, having a token page and being *findable* are two different things.
Verified on 2026-09-15: a token with a market capitalisation around $649,000 and roughly 63,000
holders had a working, fully populated trading page that **could not be reached by searching for
it.** Searching its issuer address returned "No results." Searching its ticker returned a list of
unrelated sub-$300 tokens and not the real one. The page existed and worked, but only if you already
had the URL.

That token is 200 times larger than a new launch. So this is not something $PND grows out of — if a
$649k token with 63,000 holders is unfindable by search, a brand-new one certainly is. The practical
consequence is uncomfortable and worth stating plainly: **for a new token, a direct link from a
source you trust is the only dependable route to the real asset.** Search will show you something
else, and what it shows you may be an impostor with a matching ticker.

Hence this list. It is the most load-bearing thing on this page.

{{canonicalLinks}}

If you arrive at a $PND page by any other route — a search result, a message, an advertisement,
someone's reply — treat it as unrelated until you have checked the issuer address on it against the
address above.

## Check it yourself, in about ten seconds

You do not have to trust this page, and you should not have to. Every command below is
copy-pasteable against the real issuer address as it appears above — no placeholder to substitute,
nothing to fill in.

<div class="callout">

**If this page and the ledger ever disagree, the ledger wins.** This is a static site; it can be out
of date, it can be wrong, and — if someone has copied it — it might not even be ours. The account
below is public ledger data that anyone can query from anywhere. Believe that, not this.

</div>

### 1. An explorer

Open the account and read it directly:

- `https://livenet.xrpl.org/accounts/{{issuerAddress}}`

**What you should see right now:** an account that exists, is funded, and is otherwise empty. No
`Domain`, no flags set, no trust lines, no tokens issued. That is the expected pre-launch state, not
a fault. When the account is configured, `Domain` will read exactly the domain serving this page and
this section will say so.

### 2. Four queries against a public node

Nothing between you and the ledger. Each one answers a different question:

```
account_info     {{issuerAddress}}   # account flags, Domain, TransferRate, TickSize
account_lines    {{issuerAddress}}   # trust lines — who holds $PND
account_objects  {{issuerAddress}}   # MPT issuance objects — whether $rPND exists
gateway_balances {{issuerAddress}}   # outstanding obligations — how much $PND was issued
```

As a single runnable command:

```bash
curl -sS https://xrplcluster.com/ \
  -H 'Content-Type: application/json' \
  -d '{
    "method": "account_info",
    "params": [{
      "account": "{{issuerAddress}}",
      "ledger_index": "validated"
    }]
  }' | python3 -m json.tool
```

**As things stand, those four return an unconfigured account:** no flags set, no trust lines, no
objects, no obligations. Two fields to read once that changes:

- **`account_data.Flags`** — `lsfDefaultRipple` must be set before holders can pay each other in
  $PND. It is not set today, so holder-to-holder $PND payments do not work yet.
- **`account_data.Domain`** — stored as hex of the **lowercase** ASCII domain. Decode it and it must
  equal the domain serving this page exactly. A mixed-case value does not satisfy the match, so it
  breaks the link below even though it looks correct.

```bash
python3 -c "import sys; print(bytes.fromhex(sys.argv[1]).decode())" <DOMAIN_HEX_FROM_RESPONSE>
```

Balances, ledger indexes and sequence numbers are deliberately quoted nowhere on this page, because
they go stale within minutes. Run the queries against a current validated ledger instead.

### 3. The two-way link

Neither half of the identity claim proves anything on its own. Anyone can host a file claiming to
own any account, and any account can set its `Domain` to any string. What matters is that **both
halves agree**:

1. The issuer account's `Domain` field points at `{{domain}}`.
2. `https://{{domain}}/.well-known/xrp-ledger.toml` names that same issuer address.

Only the holder of the issuer's keys can do the first. Only whoever controls the domain can do the
second. When they match, the same entity did both. That is the strongest identity claim an XRP
Ledger token issuer can make, and it is the one thing a squatter reusing the ticker cannot forge.

See [xrp-ledger.toml](/xrp-ledger-toml/) for the file itself and what is in it.

## Why this page exists

Ticker collision on the XRP Ledger is not a theoretical risk. It is the normal state of affairs,
and the tools most people use do not resolve it for them.

### Search by ticker returns several different tokens

On a widely used XRPL trading front-end, checked on 2026-09-15, a search by ticker returned
**four different tokens using the code `XPM`**, **five variants of `CORE`**, and a token calling
itself **"RLUSDM / RIPPLE USD MEME"** listed alongside Ripple's actual `RLUSD` stablecoin.

The interface offers market capitalisation and holder count as the way to tell them apart. For an
established token with nine-figure liquidity, that heuristic works. **For a token that launched
last week it is useless** — a new legitimate token and a new impostor look identical on both
numbers, and the impostor can trade first.

### The `PND` namespace is already crowded

Queried against mainnet token metadata on 2026-09-15. This is the pattern, and it is worth reading
twice:

- **Other accounts already issue tokens under the exact code `PND`.** More than one.
- **Others issue near-identical variants: `Pnd`, `PNDN`, `PNDC`.**
- **At least one same-code token is permanently broken** — see below.

**The variants are the part that catches people.** XRPL currency codes are **case-sensitive**, so
`Pnd` and `PND` are two different, unrelated assets that render almost identically in a wallet list,
a token dropdown, or a search result. `PNDN` and `PNDC` differ by a single trailing character. None
of these differences is one you will notice while skimming.

**Deliberately not listed here: the other issuers' addresses.** Some of those projects may be
entirely legitimate, their holder counts and liquidity change constantly, and naming them would be an
accusation this page has no basis to make. The pattern is what matters, and the pattern is enough:
**a `PND`-like code, on its own, does not tell you which asset you are looking at.** Only the issuer
address does.

### One same-code token is broken beyond repair

One of the accounts issuing the exact code `PND` was launched through a token platform and then
*blackholed* — its master key disabled and its regular key set to the null address, so **it can never
sign a transaction again.** Its `Domain` field still points at a metadata host that now returns HTTP
404, which means its name, icon, description and links are gone and **nobody can ever restore them.**
Not the project that launched it, not the platform that hosted it, not anyone. That is not an outage;
it is the permanent end state.

Two things follow for you. First, a `PND` token with missing or broken metadata is a thing that
genuinely exists on mainnet, so encountering one is not evidence of anything unusual. Second, the
reverse also holds: **complete, polished metadata is not evidence of authenticity** — names, icons and
descriptions are trivially copied.

### What that means for you

$PND does not enter a clean namespace. It enters one that already contains multiple same-code
tokens, several near-identical case and character variants, and at least one permanently broken
token sharing its exact ticker. So checking the issuer address is not optional hygiene — **it is the
only mechanism that distinguishes $PND from all of that.**

There is one asymmetry in your favour, and it is permanent. A blackholed account can never change its
`Domain` field, so it can never publish the verified `Domain` ↔ TOML link described below. $PND's
issuer can still sign, so it can. That is a claim the broken incumbents are permanently unable to
make.

## Rules of thumb

- **Check the issuer address, every time.** Not the ticker, not the name, not the icon. The identity
  is the pair (currency code, issuer address), and the code half is not exclusive to us.
- **Read the code character by character.** `PND`, `Pnd`, `PNDN` and `PNDC` all exist on mainnet and
  are unrelated assets. Codes are case-sensitive and the differences are one character wide.
- **Never trust a ticker search result** on any front-end without confirming the issuer address. A
  token can have a working page and still be unfindable by search, so what search *does* return is
  not necessarily the one you want.
- **A matching name and icon prove nothing.** Metadata is trivially copied, and at least one real
  `PND` token has none at all. Neither polish nor its absence tells you anything.
- **Believe the ledger over any page, including this one.** If this site and `account_info`
  disagree, the ledger is right and this page is stale or fake.
- **Trust this domain over any other.** If something claims to be Pond Protocol and is not on
  `{{domain}}`, treat it as unrelated until you have checked the issuer address on ledger.
- **Nobody from Pond Protocol will ever ask for your seed or private key,** or ask you to import a
  wallet into a site. There is no situation in which that request is legitimate.
