# Kalix Code decisions

This record holds current, repository-level decisions that guide feature work. It is intentionally short. Decisions that alter shipped architecture, process, configuration, data, or public behavior also belong in the repository’s paired Agent Note system.

| ID | Decision | Status | Practical effect |
|---|---|---|---|
| KX-001 | Preserve the existing monorepo topology. | Active | New source belongs to the established `packages/`, `apps/`, `examples/`, `scripts/`, `docs/`, `python/`, or `native/` owner instead of a parallel Kalix subtree. |
| KX-002 | Treat `Kalix Code` as the product identity and inherited `dsh` vocabulary as the current technical identity. | Active | Routine features retain existing package scopes, imports, commands, data keys, and generated names. A full rebrand requires a dedicated repository-wide decision and coordinated migration. |
| KX-003 | Describe meaningful work before implementation. | Active | Features begin with the questions in [FEATURE_BRIEF.md](FEATURE_BRIEF.md), and non-trivial decisions receive the required Agent Note. |
| KX-004 | Keep local credentials untracked. | Active | Developers copy `.env.example` to `.env` and supply only their own development credentials. |

## Open decisions

The following questions are deliberately deferred until they are needed by an approved feature or release plan.

| Topic | Decision to make |
|---|---|
| Distribution | Whether Kalix Code is released as a renamed CLI and package family, an extension distribution, or both. |
| Provider strategy | Which model and external-service providers are supported by default, optional, or out of scope. |
| Compatibility | Whether existing command names, settings, session data, and package imports are rejected, migrated, or supported during brand migration. |
| Release policy | Versioning, changelog, support, and security-reporting policy for Kalix Code releases. |
