# Verify the real $PND

**Anyone can issue a token with the currency code `PND`.** The XRP Ledger does not reserve
currency codes, does not check them for uniqueness, and has no registry. A three-character code is
a label, not an identity.

The only thing that identifies a token on the XRP Ledger is the pair:

> **(currency code, issuer address)**

`PND` alone tells you nothing. `PND` issued by a specific account is a specific asset. Two accounts
can both issue `PND` and they are two unrelated tokens that cannot be exchanged for one another,
have separate supplies, and share nothing but four characters of text.

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

## How to check it yourself

You do not have to trust this page. Three independent ways to confirm, in increasing order of
effort:

### 1. An explorer

Open the account on a block explorer and read the `Domain` field:

- `https://livenet.xrpl.org/accounts/{{issuerAddress}}`

The `Domain` field should read exactly **`{{domain}}`**. If the explorer shows a different domain,
or no domain at all, the two-way link described below is not in place and you should not treat any
metadata you see as authoritative.

### 2. `account_info` over JSON-RPC

Ask a public node directly. Nothing between you and the ledger:

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

Read two fields in the response:

- **`account_data.Domain`** — hex. Decode it and it must equal `{{domain}}` exactly, in lowercase.
  `AccountSet` stores `Domain` as the hex of the lowercase ASCII domain, so a mixed-case value does
  not satisfy the match.
- **`account_data.Flags`** — must have `lsfDefaultRipple` set for balances to move between holders.

Decode the domain hex with:

```bash
python3 -c "import sys; print(bytes.fromhex(sys.argv[1]).decode())" <DOMAIN_HEX_FROM_RESPONSE>
```

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

### There is already a broken `PND` on mainnet

Verified against XRP Ledger mainnet on 2026-09-15, these accounts issue a token with a
`PND`-family code. Listing them is disambiguation, not an accusation — most look abandoned rather
than malicious:

| Issuer address | Code | State |
| --- | --- | --- |
| `r9uQt7Y34SwSyKqdb5sMmAqk37rh3Y4V7` | `PND` | Blackholed, no `Domain`, dormant |
| `rBNwehxTwcSwwC7eBv6WmYVpSKA7Zx65mU` | `PND` | Blackholed, `Domain` points at a host that returns HTTP 404 |
| `rBWtDSmg6sxrV1bfEYRYFtMvarRn44VDpK` | `Pnd` | Blackholed, has real holders and a live liquidity pool |

The second row is worth understanding, because it is permanent. That account was blackholed — its
master key is disabled and its regular key is set to the null address — so **it can never sign a
transaction again.** Its `Domain` field still points at a metadata host that now returns 404, which
means its name, icon, description and links are gone and **nobody can ever repair them.** Not the
project that launched it, not the platform that hosted it, not anyone. That is the terminal state.

The third row is a *different* currency code: XRPL currency codes are case-sensitive, so `Pnd` and
`PND` are distinct assets. It has holders and tradable liquidity, which makes it the collision most
likely to be mistaken for $PND by someone searching a ticker.

### What that means for you

$PND does not enter a clean namespace. It enters one that already contains a same-ticker token in a
permanently broken state and a similar-ticker token with real liquidity. So checking the issuer
address is not optional hygiene — **it is the only mechanism that distinguishes $PND from what is
already there.**

There is one asymmetry in your favour, and it is permanent: every account in that table is
blackholed, so none of them can ever publish a verified `Domain` ↔ TOML link. $PND can.

## Rules of thumb

- **Check the issuer address, every time.** Not the ticker, not the name, not the icon.
- **Never trust a ticker search result** on any front-end without confirming the issuer address.
- **A matching name and icon prove nothing.** Metadata is copied trivially; only the address is
  hard to fake.
- **Trust this domain over any other.** If a link claims to be Pond Protocol and is not on
  `{{domain}}`, treat it as unrelated until you have checked the issuer address on ledger.
- **Nobody from Pond Protocol will ever ask for your seed or private key,** or ask you to import a
  wallet into a site. There is no situation in which that request is legitimate.
