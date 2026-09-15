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

Every claim about on-ledger behavior or token parameters cites its source, normally [`rpnd/config/tokens.json`](https://github.com/PondProtocol/rPND/blob/main/config/tokens.json), `rpnd/src/issuance.ts`, or `rpnd/docs/`. An uncited claim about the ledger is a bug in the spec.

`rpnd/config/tokens.json` is the source of truth for token parameters until [OQ-17](docs/open-questions.md#oq-17) is decided. Documents here restate values for readers; they do not define them. If you find a discrepancy between this repo and that file, the file is right — fix the document and open an issue about the drift.

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
