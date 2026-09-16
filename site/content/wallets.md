# Wallets, issuer settings, and $PND

This page is the public snapshot of Pond’s ledger accounts: who they are, what
they will do for $PND, and what the issuer has actually set. It is not the
identity check — that stays on [Verify the real $PND](/verify/). Use that page
to confirm the issuer address against a ticker. Use this one to see the rest
of the topology.

<div class="callout callout-critical">

## $PND has not been issued yet

The issuer can sign, and some account settings are live, but **no $PND exists
on ledger.** `gateway_balances` has no obligations. There is no circulating
supply, no vesting escrow, and no AMM. **Nothing here is for sale.**

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
| Treasury | Funded **1.000010 XRP**. No $PND trust line yet. Needs about **3.2 XRP** before the launch escrows. |
| Operations | **Not funded** (`actNotFound`). Address is reserved. Will need about **52 XRP** (50 XRP AMM, treated as spent, plus ~2 XRP of reserve). |
| Bot-ops | **Not created.** The split is decided; there is no fourth address to publish. |

Policy supply for $PND is **100 billion**, by issuer policy, not a ledger cap:
**10 billion** unlocked at issuance, **90 billion** locked as ten **9 billion**
self-escrows from Treasury, finishing after the 1st of each month. First
rehearsed date **2027-01-01**. Issuance is independent — Pond keeps the issuer
keys. **Do not blackhole this issuer before the $rPND MPT exists** on the same
account. A shared issuer makes that trade cost $rPND forever.

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
  launch it should not hold the circulating or escrowed $PND — those go to
  Operations and Treasury.</p>
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
  <p>Will hold the <strong>90 billion</strong> vesting lock. After issuance it
  receives the full 100 billion, keeps 10 billion unescrowed long enough to
  move that slice to Operations, and locks the rest as ten dated 9 billion
  escrows back to itself. Holders can read the schedule on ledger. Releasing
  a matured escrow is permissionless — anyone can submit <code>EscrowFinish</code>
  — so Treasury does not need a bot key for releases.</p>
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
  <p>Will receive the <strong>10 billion unlocked</strong> $PND and provide the
  XRP side of the first PND/XRP AMM. The owner set that XRP at
  <strong>50 XRP, treated as spent</strong>. This is the hot inventory account
  for liquidity and day-to-day distribution. It is <strong>not</strong> the
  bot wallet. A Bithomp or explorer load today should show the account missing,
  not a funded wallet.</p>
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

Two jobs, two accounts. Mixing them is how a hot key ends up sitting on the
locked supply.

**Treasury is for holders’ supply schedule.** The 90 billion is not “in the
market.” It sits in dated escrows that become finishable on a public calendar.
That is what makes the 100 billion policy checkable later: the locked slice is
on ledger, not in a spreadsheet. Treasury is not the trading wallet and is not
meant to seed the AMM.

**Operations is for liquidity and the unlocked float.** The 10 billion is the
slice that can actually move at launch. The AMM deposit is what a DEX market
buy has to fill against. Without that pool, a holder who opened a trust line
still has nothing to trade into. Operations also makes ordinary distribution
payments. It should never hold the 90 billion lock.

Until those payments and escrows exist, both roles are intent. Live today:
Treasury exists and is under-funded for ten escrows; Operations does not exist
on ledger yet.

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
| Allow Trust Line Locking | off | Treasury **cannot** escrow $PND until the issuer sets this. A later launch step, not live today. |
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
