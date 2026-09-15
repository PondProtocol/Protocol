# Documentation

- **[architecture.md](architecture.md)** — how the pieces fit together today: layers, roles, the issuance flow, trust boundaries, and an explicit list of what does not exist yet.
- **[spec/](spec/README.md)** — the specification skeleton, one file per area. Not normative yet.
- **[open-questions.md](open-questions.md)** — every undecided design question (`OQ-nn`) and outstanding TODO (`TD-nn`). Start here if you are the one making decisions.
- **[glossary.md](glossary.md)** — XRPL and Pond Protocol terms.
- **[hosting-decision.md](hosting-decision.md)** — where to host the documentation site and the `/.well-known/xrp-ledger.toml` identity anchor. Verified per-host CORS behaviour, the dot-directory hazards that silently 404 that path, and the public-versus-private question. Awaiting an owner decision.

Working rule for all of it: on-ledger facts cite the file they come from, and undecided design is written as an open question rather than as settled fact. See [CONTRIBUTING.md](../CONTRIBUTING.md).
