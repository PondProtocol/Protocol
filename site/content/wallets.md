# Wallets, issuer settings, and $PND

This page is the public snapshot of Pond’s ledger accounts: who they are, what
they will do for $PND, and what the issuer has actually set. It is not the
identity check — that stays on [Verify the real $PND](/verify/). Use that page
to confirm the issuer address against a ticker. Use this one to see the rest
of the topology.

<div class="callout callout-critical">

## $PND has not been issued yet

Target launch date is **2026-10-01**. That is a date on a calendar, not a live
market. The issuer can sign, and some account settings are already on ledger,
but **no $PND exists today.** `gateway_balances` has no obligations. There is
no circulating supply, no vesting escrow, and no AMM. **Nothing here is for
sale.**

Any token trading under the code `PND` today is a different issuer’s asset.
Check the address on [Verify the real $PND](/verify/) before you trust a
ticker.

</div>

## Snapshot

Dated **2026-09-16**, read from `xrplcluster.com` `account_info` /
`gateway_balances` on validated ledger **107032683** (issuer) and
**107032684** (Treasury and Operations).

XRP balances move. Flags and `Domain` stay until another `AccountSet` lands.
If this page and the ledger disagree, **the ledger wins.** Re-query before you
rely on a number.

| Account | Live on that ledger |
| --- | --- |
| Issuer | Funded **1.538996 XRP**. `Domain` `pond.greenhead.io`. Default Ripple on. No Freeze on. Clawback off. Require Auth off. `OwnerCount` 0. Nothing issued. |
| Treasury | Funded **1.000010 XRP**. No $PND trust line yet. About **2 XRP** is enough without escrow; still light. |
| Operations | **Not funded** (`actNotFound`). Address is reserved. Will need about **52 XRP** (50 XRP AMM, treated as spent, plus ~2 XRP of reserve). |
| Bot-ops | **Not created.** The split is decided; there is no fourth address to publish. |

Policy supply is **100 billion**, issuer policy not a ledger cap. High-level
split: **10 billion public**, **10 billion team**, **80 billion to holders**
at **10 billion per month** from **2027-01-01** through **2027-08-01**,
**proportional to $PND held**. That is a **snapshot plus treasury payments**,
not TokenEscrow. Launch is **2026-10-01**; that date does not start the holder
monthly. Details: [Supply split](/vesting/). Issuance is independent — Pond
keeps the issuer keys. **Do not blackhole this issuer before the $rPND MPT
exists** on the same account.

## The accounts

Click an address to select the whole string, then copy.

<div class="wallets">

<div class="wallet">
  <div class="wallet-head">
    <span class="wallet-role">Issuer</span>
    <span class="status status-ok">funded</span>
  </div>
  <p><code class="addr">{{issuerAddress}}</code></p>
  <p class="wallet-links">
    <a href="https://bithomp.com/explorer/{{issuerAddress}}" target="_blank" rel="noopener noreferrer">Bithomp</a>
    ·
    <a href="https://livenet.xrpl.org/accounts/{{issuerAddress}}" target="_blank" rel="noopener noreferrer">livenet.xrpl.org</a>
  </p>
  <p>Cold issuing account for <strong>both</strong> $PND (IOU) and $rPND (MPT).
  Signs configuration and issuance only. Holds no bot-reachable key. After
  launch it should not sit on the public float or the holder monthly — those
  jobs belong to Operations and Treasury once the split is written down.</p>
</div>

<div class="wallet">
  <div class="wallet-head">
    <span class="wallet-role">Treasury</span>
    <span class="status status-ok">funded · needs more XRP</span>
  </div>
  <p><code class="addr">{{treasuryAddress}}</code></p>
  <p class="wallet-links">
    <a href="https://bithomp.com/explorer/{{treasuryAddress}}" target="_blank" rel="noopener noreferrer">Bithomp</a>
    ·
    <a href="https://livenet.xrpl.org/accounts/{{treasuryAddress}}" target="_blank" rel="noopener noreferrer">livenet.xrpl.org</a>
  </p>
  <p>Named account for supply that is not the trading wallet. At launch it is
  meant to keep the <strong>80 billion</strong> holder inventory and pay each
  month after a snapshot — see <a href="/vesting/">Supply split</a>. That is
  <strong>not TokenEscrow</strong>. Do not invent a claim flow from this
  address. About 2 XRP without escrow; still light today. No bot-reachable
  key.</p>
</div>

<div class="wallet">
  <div class="wallet-head">
    <span class="wallet-role">Operations</span>
    <span class="status status-warn">not funded</span>
  </div>
  <p><code class="addr">{{operationsAddress}}</code></p>
  <p class="wallet-links">
    <a href="https://bithomp.com/explorer/{{operationsAddress}}" target="_blank" rel="noopener noreferrer">Bithomp</a>
    ·
    <a href="https://livenet.xrpl.org/accounts/{{operationsAddress}}" target="_blank" rel="noopener noreferrer">livenet.xrpl.org</a>
  </p>
  <p>Hot inventory for the <strong>10 billion public</strong> slice: liquidity
  and day-to-day distribution. The owner set AMM capital at <strong>50 XRP,
  treated as spent</strong> (fund about <strong>52 XRP</strong>). It is
  <strong>not</strong> the bot wallet and not the monthly drop wallet. A
  Bithomp or explorer load today should show the account missing, not a funded
  wallet.</p>
</div>

<div class="wallet">
  <div class="wallet-head">
    <span class="wallet-role">Bot-ops</span>
    <span class="status status-warn">not created</span>
  </div>
  <p>No address. Do not invent one, and do not treat Operations as a stand-in.
  When created, this account gets a small XRP float (about 5–10 XRP) and
  <strong>no $PND trust line</strong>. A bot may hold a regular key here only
  — never a master seed, and never a key on Issuer, Treasury, or Operations.</p>
</div>

</div>

## How Treasury and Operations support $PND

Two jobs, two accounts. Mixing them is how a hot key ends up sitting on
supply that is not meant to trade.

**Treasury is not the AMM wallet.** It is the named account for the 80 billion
holder inventory and the launch 10 billion team payment (team destination is
not published). Monthly drops are snapshot plus treasury `Payment`s. This page
does **not** say those 80 billion sit in dated escrows, and it does not offer
a claim.

**Operations is for liquidity.** The AMM deposit is what a DEX market buy has
to fill against after launch. Without that pool, a holder who opened a trust
line still has nothing to trade into. Operations also makes ordinary
distribution payments. It is not a 90 billion lock, and it is not a bot.

Until issuance, both roles are intent. Live today: Treasury exists and is
light on XRP; Operations does not exist on ledger yet. High-level numbers:
[Supply split](/vesting/).

## Issuer flags, in plain language

Read from `account_flags` on the issuer in the snapshot above. These are
**on-ledger facts**, not TOML comments.

| Setting | Live | What it means |
| --- | --- | --- |
| `Domain` | `pond.greenhead.io` | The account names this docs host (hex of lowercase ASCII, no scheme). Together with `/.well-known/xrp-ledger.toml` on that host, that is the XLS-26 two-way link. |
| Default Ripple | on | Once $PND exists, holders can pay each other across trust lines. Without this flag, `AMMCreate` also fails. |
| No Freeze | on | The issuer **cannot freeze** a holder’s $PND, individually or globally in a way it can later lift. This is permanent. It also **rules out clawback**. |
| Clawback | off | The issuer cannot seize $PND from a trust line. |
| Require Auth | off | Anyone can open a $PND trust line. Issuer approval is not required. Turning this on would break issuance and the AMM. |
| Global freeze | off | Not frozen. With No Freeze on, the issuer cannot use freeze as a later brake. |
| Allow Trust Line Locking | off | Live fact. The holder monthly does **not** use TokenEscrow, so this flag is not part of that path. |
| Master key disabled | off | The issuer can still sign. **Keep it that way until $rPND exists** on this account. Blackholing now would delete $rPND. |

`TransferRate` and `TickSize` are **absent** on the AccountRoot (ledger
defaults). Do not read intended config as live just because a repo file names
a number.

No Freeze is an account flag. It does not belong in `xrp-ledger.toml`. The
TOML file names the issuer and the token; this page is where the flags are
stated.

## Check it yourself

Explorers for each funded address are in the cards above. Bithomp is an
explorer, not a DEX. There is **no** $PND trade URL to publish — the token
does not exist, and a guessed DEX path would be a fake.

Against a public node, no explorer required. Copy one of these. Each is the
same `account_info` call with a different address.

Issuer:

```bash
curl -sS https://xrplcluster.com/ \
  -H 'Content-Type: application/json' \
  -d '{
    "method": "account_info",
    "params": [{
      "account": "{{issuerAddress}}",
      "ledger_index": "validated"
    }]
  }'
```

Treasury: same body, account `{{treasuryAddress}}`.

Operations: same body, account `{{operationsAddress}}`. Expect
`actNotFound` until it is funded.

To confirm nothing has been issued:

```bash
curl -sS https://xrplcluster.com/ \
  -H 'Content-Type: application/json' \
  -d '{
    "method": "gateway_balances",
    "params": [{
      "account": "{{issuerAddress}}",
      "ledger_index": "validated"
    }]
  }'
```

No `obligations` field means no $PND outstanding. Empty `account_objects` on
the issuer means no $rPND MPT either.

Decode `Domain` if you want to see the host as text:

```bash
python3 -c "import sys; print(bytes.fromhex(sys.argv[1]).decode())" HEX
```

Put the `account_data.Domain` hex in place of `HEX`. On the snapshot that
value is `706F6E642E677265656E686561642E696F` (`pond.greenhead.io`).

## What this page is not

- **Not a buy link.** See the banner. $PND is not issued.
- **Not the ticker-collision briefing.** That is [Verify](/verify/).
- **Not a seed, key, or signing ceremony.** Nobody from Pond Protocol will
  ask for a seed or a private key.
- **Not a live DEX listing.** Front-end trade URLs wait until an AMM or book
  exists *and* a human has loaded the page.
