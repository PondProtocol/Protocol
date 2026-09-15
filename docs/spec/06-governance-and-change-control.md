# 06 — Governance and change control

Skeleton. This section is open in its entirety: no repo documents any governance process, on ledger or off.

See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

## 6.1 Current state

**Documented:** the only change control in existence is ordinary GitHub practice — `rpnd` merged its first milestone through a pull request with CI running typecheck and tests. There is no CODEOWNERS file, no recorded branch protection, no approval requirement for token-parameter changes, and no decision log.

**Documented:** on ledger, "governance" is whatever the issuer's keys can do. See [02 — Accounts and roles](02-accounts-and-roles.md#22-authority).

## 6.2 Open

- **Who approves what.** Changes to `config/tokens.json` alter real on-ledger parameters and deserve a heavier bar than documentation edits. No such distinction exists — [OQ-18](../open-questions.md#oq-18).
- **Spec versioning.** Numbered versions in the XLS style, or a rolling `main`? How does a consumer cite a specific version of Pond Protocol? — [OQ-18](../open-questions.md#oq-18).
- **Decision records.** Whether to adopt an ADR or decision-log convention so resolved open questions leave a durable trail rather than vanishing into commit history — [OQ-18](../open-questions.md#oq-18).
- **Normative promotion.** What has to be true before a section stops being a skeleton and becomes normative, and who declares it.
- **Irreversible changes.** Some decisions cannot be undone — `AssetScale`, `MaximumAmount`, the permanent clawback foreclosure, and metadata immutability if chosen. These deserve a stricter review path than reversible ones. No such path exists.
- **On-ledger governance.** Whether holders ever get a say in anything. Nothing suggests they do today.

## 6.3 Provisional convention

Until [OQ-18](../open-questions.md#oq-18) is decided, [CONTRIBUTING.md](../../CONTRIBUTING.md) holds the working rules: changes land through pull requests, undecided design is written as an open question rather than as fact, and on-ledger parameter claims cite their source file. Treat that as a placeholder for a real process, not as the answer.
