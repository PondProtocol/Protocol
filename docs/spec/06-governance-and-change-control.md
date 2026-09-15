# 06 — Governance and change control

Skeleton. Cross-repo authority is settled; who may exercise it is not.

See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

## 6.1 Current state

**Documented:** authority between repos is settled. `rpnd/config/tokens.json` and `rpnd/src/issuance.ts` win any config mismatch across the organization; `rpnd/docs/rpnd-spec.md` is the reference for $rPND and `pnd` for $PND; this repo defines no parameters. `rpnd` treats any edit to `config/tokens.json` as a change to the token and documents a change-control table for what is impossible, what needs `MPTokenIssuanceSet`, and what needs a recorded reason. `.github` ships a dedicated token parameter change issue template.

**Documented:** process control is otherwise ordinary GitHub practice. There is no CODEOWNERS file, no recorded branch protection, no approval requirement or quorum for token-parameter changes, and no decision log.

**Documented:** on ledger, "governance" is whatever the issuer's keys can do. See [02 — Accounts and roles](02-accounts-and-roles.md#22-authority).

## 6.2 Open

- **Who approves what.** `rpnd` establishes that a config edit *is* a token change; what it does not establish is who may approve one, or with what quorum — [OQ-18](../open-questions.md#oq-18).
- **Drift detection.** Four documents across three repos restate the same config values by hand. Authority settles which one wins; nothing yet notices when they disagree — [OQ-17](../open-questions.md#oq-17).
- **Spec versioning.** Numbered versions in the XLS style, or a rolling `main`? How does a consumer cite a specific version of Pond Protocol? — [OQ-18](../open-questions.md#oq-18).
- **Decision records.** Whether to adopt an ADR or decision-log convention so resolved open questions leave a durable trail rather than vanishing into commit history — [OQ-18](../open-questions.md#oq-18).
- **Normative promotion.** What has to be true before a section stops being a skeleton and becomes normative, and who declares it.
- **Irreversible changes.** Some decisions cannot be undone — `AssetScale`, `MaximumAmount`, the permanent clawback foreclosure, and any frozen flag or frozen metadata. These deserve a stricter review path than reversible ones. No such path exists, and the pending supply decision ([OQ-21](../open-questions.md#oq-21)) is exactly this kind.
- **On-ledger governance.** Whether holders ever get a say in anything. Nothing suggests they do today.

## 6.3 Provisional convention

Until [OQ-18](../open-questions.md#oq-18) is decided, [CONTRIBUTING.md](../../CONTRIBUTING.md) holds the working rules: changes land through pull requests, undecided design is written as an open question rather than as fact, and on-ledger parameter claims cite their source file. Treat that as a placeholder for a real process, not as the answer.
