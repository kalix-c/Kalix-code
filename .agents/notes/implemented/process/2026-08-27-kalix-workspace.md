# Agent Note: Kalix workspace

Status: implemented

English | [中文](2026-08-27-kalix-workspace.zh.md)

## Problem

Kalix Code needs a durable place for product direction and feature intake without creating a second source hierarchy beside the established plugin monorepo. Planning mixed into package documentation would obscure source ownership, while unrecorded feature work would make later review and delivery inconsistent.

## Decision

The repository keeps Kalix-level product planning in the root `.kalix/` directory. `ROADMAP.md` orders outcomes, `FEATURE_BRIEF.md` defines the intake questions for meaningful features, and `DECISIONS.md` records current repository-level choices and deferred questions. The directory does not own runtime code, applications, generated files, package interfaces, or build outputs.

The existing monorepo topology remains the source ownership model. New implementation work continues in the relevant established package, application, example, script, documentation, Python, native, or vendor location. The inherited `dsh` package, command, import, configuration, and data vocabulary stays intact during ordinary feature work. Kalix Code is the repository-level product identity; a complete technical rename is a separate decision with repository-wide scope.

`.env.example` documents the optional local values used for real-API tests and demos. It contains no credential values and keeps `.env` as the local secret location.

## Alternatives considered

**A parallel `kalix/` source tree** would duplicate package ownership and split build, testing, and documentation responsibilities. The established workspace already provides appropriate source homes.

**Adding planning material to the root `README.md`** would make project onboarding carry volatile product-management detail and would enlarge the paired public documentation surface for internal workflow changes.

**Renaming packages and commands during setup** would create a mixed technical vocabulary without the coordinated changes required across manifests, imports, configuration, generated references, tests, fixtures, documentation, and release metadata.

## Consequences

Maintainers have one discoverable location for Kalix-specific planning, and feature proposals begin from a consistent set of design and validation questions. The repository remains build-compatible with its inherited technical vocabulary while the future distribution, provider, compatibility, and release decisions remain explicit.

The workspace adds a small maintained documentation surface. Meaningful changes to its direction or to source ownership still require the repository’s ordinary documentation, testing, and Agent Note practices.
