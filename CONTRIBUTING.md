# Contributing

This repo holds the Pond Protocol specification and design documents. It contains no keys, no token config the tooling reads, and no code that touches a network. Operator tooling lives in [`rpnd`](https://github.com/PondProtocol/rPND).

## The one rule that matters

**Do not write undecided design as settled fact.**

The protocol is early: the two tokens exist on ledger, but the mechanics relating them do not. It is tempting to fill gaps with a plausible default and move on. Don't. A guess that reads like a decision is worse than an empty section, because the next reader cannot tell them apart.

When you hit something undecided:

1. Add it to [docs/open-questions.md](docs/open-questions.md) with the next free `OQ-nn` (design decision) or `TD-nn` (decided or mechanical, just not done) id.
2. Record what the repos document *today*, with a file citation, and what is missing.
3. Link the id from the spec section it blocks.

When an open question gets answered: write the answer into the spec section, then replace the item in `open-questions.md` with a one-line pointer to where the answer now lives. Keep the id — other documents link to it.

## Citing facts

Every claim about on-ledger behavior or token parameters cites its source, normally [`rpnd/config/tokens.json`](https://github.com/PondProtocol/rPND/blob/main/config/tokens.json), `rpnd/src/issuance.ts`, [`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md), or [`pnd/docs/token-spec.md`](https://github.com/PondProtocol/PND/blob/main/docs/token-spec.md). An uncited claim about the ledger is a bug in the spec.

`rpnd/config/tokens.json` and `rpnd/src/issuance.ts` are authoritative on any config mismatch across the organization. Documents here restate values for readers; they do not define them. If you find a discrepancy between this repo and those files, they are right — fix the document, and see [OQ-17](docs/open-questions.md#oq-17) on detecting drift rather than merely adjudicating it.

When linking to another repo, link only files that exist on `main` today. Anything still in an open pull request gets described as such, with a link to the PR rather than to a path that will 404.

## Config intent is not on-ledger fact

A value in `config/tokens.json` describes a transaction someone intends to submit. It becomes a property of the ledger only when that transaction is validated, and right now almost none of them have been — the issuer account is funded and otherwise untouched.

So never write "Default Ripple is enabled" when the truth is "the config would enable Default Ripple." That phrasing misleads a holder into believing something about an account they can query, and this exact error has already been found and fixed in `pnd` and here. Separate the three:

1. **What the config intends** — cite the file.
2. **What is on ledger now** — cite the query, not a remembered value.
3. **What changes once applied** — the effect a holder would actually notice.

Give the query rather than the answer where you can. Do not pin balances, ledger indexes, or sequence numbers into prose; they are stale the moment they are written. The canonical snapshot and the queries that refresh it live in [docs/architecture.md](docs/architecture.md#live-state) — update that one place and link it.

## Labels

Sections use three labels consistently, defined in [docs/spec/README.md](docs/spec/README.md#conventions): **Documented** (verifiable, with a citation), **Open** (undecided, with an `OQ-nn` link), **TODO** (with a `TD-nn` link).

## Changes

Work on a branch and open a pull request. Two informal tiers:

- **Documentation and spec text** — normal review.
- **Anything that implies a change to on-ledger parameters** — needs the owner, because some parameters are irreversible once a token is created (`AssetScale`, `MaximumAmount`, the permanent clawback foreclosure). Say so in the PR description, and coordinate with `rpnd`.

There is no formal governance process yet — [OQ-18](docs/open-questions.md#oq-18). The above is a placeholder.

## Style

Markdown, one sentence per idea, no trailing whitespace. Prefer short declarative statements to hedged prose: "clawback is permanently disabled" rather than "clawback is expected to remain disabled." Where hedging is honest, hedge explicitly with an `Open` label rather than vague wording.

Do not add token addresses, seeds, or issuance ids for private or unlaunched deployments. Seeds never belong in any repo.

## License

Contributions are made under Apache-2.0, matching [LICENSE](LICENSE).
