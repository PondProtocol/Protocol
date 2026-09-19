# Legal & privacy

This page is for **pond.greenhead.io**, the Pond Protocol / $PND documentation
site. It is not the Greenhead Labs agent product, and it is not
[greenhead.io](https://greenhead.io)’s legal page.

## What this site is

Pond Protocol issues **$PND** on the XRP Ledger. This host publishes the docs,
the XLS-26 identity file, and the Trade terminal. Identity is the pair
**(PND, issuer address)**. Copy the issuer from [Verify](/verify/), not from a
search box.

## Cookies and login

We use cookies. That is intentional.

- **Login session.** After official **WalletConnect** or **Xaman SignIn**, we
  set a session cookie with the XRPL address you signed in with and the
  connect method. Activity on this host refreshes that cookie. After 24
  hours with no activity, the session ends and the next visit is signed
  out. You can also Sign out from your profile page. The cookie is
  `httpOnly` and `SameSite=Lax`
  when the site process can set it.
- **Start Here progress.** `/start/` stores checklist progress in a cookie
  (with a `localStorage` backup). Anonymous users keep progress in that
  cookie. After you sign in, progress is merged and keyed to that XRPL
  address.
- **Account profile.** After official **Xaman SignIn**, this host assigns
  a tadpole handle and stores handle, XRPL address, optional display
  name / bio / profile icon, and a Start Here progress pointer in a JSON
  file the site process can write. The profile also reads public XRPL
  wallet balances. That page is visible only while that Xaman session
  is logged in. WalletConnect on Trade does not open it. Logged-out
  visitors do not see handles or profile fields. We do not store seeds
  or private keys. Autoscale disk may be ephemeral, so that file can
  reset on a new deploy.

We remember the XRPL address you signed in with. We do not sell personal
data. We do not run ads. We never ask for a seed, mnemonic, private key, or
password in a form, pop-up, email, or chat. If a page that says Pond asks
for one, close it.

Official wallet connect is [Trade](/trade/) or the Sign in chip (same
WalletConnect and Xaman paths). That is a wallet you already control. It is
not a seed prompt and not a claim. Xaman stays unavailable until the owner
sets `XUMM_API_KEY` and `XUMM_API_SECRET` on Replit Autoscale.

## What we do not do

- **No ads.** There are no advertising scripts on this site.
- **No analytics scripts.** Nothing here measures you for a Pond visitor
  count or a browsing profile. We do not sell or share personal information.
- **No seeds.** Nobody from Pond Protocol will ask for a seed, mnemonic,
  private key, or password.

We do not fingerprint you for advertising. Session and progress cookies are
not that.

The host may also set infrastructure cookies (for example the reverse proxy
in front of the app).

## Legal

Documentation on this site is licensed Apache-2.0. It is not an offer to sell
$PND, not investment advice, and not a claim that $PND has been issued until
[Verify](/verify/) says it has.

Questions about this host: [Official links](/links/). For Greenhead Labs
company legal (Wyoming LLC, credentials, other products), use
[greenhead.io/legal](https://greenhead.io/legal) — that page is theirs, not
this site’s.
