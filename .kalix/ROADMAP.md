# Kalix Code roadmap

This roadmap orders work by outcome rather than by repository directory. It is a planning aid, not a promise of release dates. Move an item forward only when its feature brief identifies an owner, acceptance evidence, and any effect on the session, configuration, or public interfaces.

## Foundation

The foundation track makes everyday development reproducible. It keeps the workspace installable, the build and focused validation commands documented, credentials out of version control, and the repository’s existing hooks and continuous checks intact.

| Outcome | First deliverable | Evidence of completion |
|---|---|---|
| A contributor can begin local work reliably. | Versioned Node and pnpm baseline plus `.env.example`. | A clean checkout installs dependencies and builds with the documented commands. |
| Product work has a visible home. | This Kalix workspace and a feature brief template. | New work records its outcome, source owner, risks, and validation before implementation. |
| Existing automation stays trustworthy. | No changes to the workspace topology or CI policy during setup. | Existing focused checks remain usable without modified source ownership. |

## Product evolution

The product-evolution track turns proposed functionality into independently reviewable capabilities. New behavior belongs at the documented extension points, normally as a complete service definition, provider, and consumer arrangement rather than a direct change to the core agent loop.

| Track | Questions to answer before implementation | Typical repository areas |
|---|---|---|
| Agent experience | What new user or model outcome exists, and what is its transcript or snapshot evidence? | `packages/core/`, `packages/session/`, `packages/client/`, `apps/` |
| Tools and integrations | What capability is exposed, which provider implements it, and how is permission or failure handled? | `packages/*/`, `packages/extensions/`, `packages/web/` |
| Configuration and persistence | Which values are configurable, and is a new event, schema, or durable format required? | owning package, `packages/settings/`, `packages/session/`, `docs/` |
| User experience | Which screen or command changes, and which accessibility and UI tests establish the behavior? | `apps/web/`, `packages/client/`, `apps/cli/` |

## Brand migration

A full migration from the inherited DeepSeek Harness technical vocabulary to Kalix Code is a separate program. It must not be mixed with unrelated feature work because package scopes, imports, commands, configuration names, documentation, generated references, tests, fixtures, and release metadata must change together.

| Preparation item | Decision required | Completion condition |
|---|---|---|
| Public package scope | The npm scope and package naming policy. | All workspace manifests and imports use one published vocabulary. |
| Command-line identity | The future executable name and compatibility position. | CLI help, examples, scripts, tests, and release metadata agree. |
| User-facing identity | Product names, manifest metadata, icons, website, and documentation. | Every visible surface uses the approved Kalix Code identity. |
| Migration policy | Whether older data, commands, or packages are rejected or supported. | The policy is explicit, tested, and documented before release. |

## Release readiness

A release candidate begins only after intended features have a recorded decision, focused automated coverage, updated documentation, and a clean build from a fresh dependency installation. The release workflow and package publication checks remain the source of truth for final packaging.
