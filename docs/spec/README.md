# Pond Protocol specification

**Status: skeleton. Not normative yet.**

This directory is the intended home of the Pond Protocol specification. It is currently a scaffold: it records what is already true and verifiable on the XRP Ledger, and marks everything else as an open question rather than guessing at it. No section here should be cited as a commitment until this page says the spec is normative.

Because the protocol's core mechanics are undecided ([OQ-01](../open-questions.md#oq-01), [OQ-03](../open-questions.md#oq-03)), most sections are short. That is deliberate. Length will come from decisions, not from prose.

## Sections

| Section | Covers | State |
| --- | --- | --- |
| [01 — Tokens](01-tokens.md) | $PND and $rPND definitions, identity, holder opt-in | Mostly documented |
| [02 — Accounts and roles](02-accounts-and-roles.md) | Issuer, operational, holder; authority held by each | Mostly documented |
| [03 — Issuance and supply](03-issuance-and-supply.md) | Transaction sequence, supply parameters, distribution | Partly documented |
| [04 — Token relationship](04-token-relationship.md) | How $PND and $rPND relate | Open |
| [05 — Metadata and discovery](05-metadata-and-discovery.md) | XLS-26 and XLS-89 publication | Mostly documented |
| [06 — Governance and change control](06-governance-and-change-control.md) | Who may change what, and how | Open |
| [07 — Security considerations](07-security-considerations.md) | Trust assumptions, custody, failure modes | Partly documented |

## Conventions

**Normative language.** Once a section is marked normative, the key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). Until then, treat descriptive text as a report on current behavior, not a requirement.

**Three labels, used consistently across sections:**

- **Documented** — true today and verifiable in a cited file or on ledger.
- **Open** — a design decision nobody has made. Always carries an `OQ-nn` link. Never write an open item as settled fact, and never write a guess as a default.
- **TODO** — decided or mechanical, just not done. Always carries a `TD-nn` link.

**Citations.** On-ledger and configuration facts cite the file they come from, normally [`rpnd/config/tokens.json`](https://github.com/PondProtocol/rPND/blob/main/config/tokens.json) or `rpnd/src/issuance.ts`. Uncited claims about ledger behavior are bugs in this spec.

**Versioning.** Undecided — [OQ-18](../open-questions.md#oq-18). For now the spec is whatever is on `main`, and there are no numbered releases.
