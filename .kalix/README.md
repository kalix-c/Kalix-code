# Kalix Code workspace

This directory is the maintainer workspace for Kalix Code. It keeps product direction, feature discovery, and local onboarding aids separate from the plugin source tree.

## Scope

The repository source layout remains authoritative: runtime packages live in `packages/`, applications live in `apps/`, examples live in `examples/`, automation lives in `scripts/`, and user or contributor documentation lives in `docs/`. This directory records Kalix-specific product work; it does not redefine package ownership, runtime APIs, or build outputs.

## Working files

| File | Purpose | Update when |
|---|---|---|
| [ROADMAP.md](ROADMAP.md) | Maintained view of product outcomes and the next development tracks. | A priority, milestone, or scope boundary changes. |
| [FEATURE_BRIEF.md](FEATURE_BRIEF.md) | Reusable intake template for a feature before implementation begins. | A new feature proposal is ready for technical discovery. |
| [DECISIONS.md](DECISIONS.md) | Current Kalix-level decisions and the questions that remain open. | A decision affecting more than one feature or package is made. |

## Development baseline

Use Node.js `22.19` or later and pnpm `11.7.0`. Install dependencies with `pnpm install`, build with `pnpm run build`, run the focused tests that cover the changed behavior, and use `pnpm run lint` or the narrowest relevant check before pushing a change. The repository hooks install during dependency setup.

## Identity boundary

Kalix Code is the repository-level product identity. Existing `dsh`, `@deepseek-ai/*`, and DeepSeek Harness names remain the current technical vocabulary until a dedicated, repository-wide rebrand changes every affected package, import, command, configuration key, generated reference, fixture, and user-facing string together. No compatibility aliases or mixed public naming are introduced in routine feature work.

## Start a feature

Copy the headings from [FEATURE_BRIEF.md](FEATURE_BRIEF.md) into an issue, pull request description, or design note. Identify the user outcome, the owning packages, configuration and persistence effects, the required documentation changes, and the narrowest validation commands before editing source.

For a capability that is intentionally accepted but not yet built, add a proposed Agent Note under `.agents/notes/proposed/` using the repository’s required structure. For a shipped architectural or process decision, record or update the owning implemented Agent Note in the same change.
