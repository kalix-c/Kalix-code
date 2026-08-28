# Kalix Code distribution architecture

## Decision

Kalix Code will ship its public command under `@kalix-code/kalix` and the
`kalix` executable. It will not publish the current workspace graph as a large
set of public `@kalix-code/*` packages in the first distribution release.

The workspace currently contains more than two hundred internal packages and
many runtime imports are selected from profile configuration. Renaming and
publishing that graph atomically would make one incomplete release unable to
install. It would also make the mobile installation download the development
workspace rather than a focused runtime.

The selected long-term design is a **standalone Kalix runtime artifact**:

| Layer | Public contract | Distribution responsibility |
| --- | --- | --- |
| CLI | `@kalix-code/kalix`, `kalix` | Stable command name, version, help, and profile dispatch. |
| Runtime artifact | Private payload inside the CLI package | Compiled Kalix modules, default profiles, browser assets, and the runtime module catalog. |
| Compatibility boundary | Internal during the transition | Resolves the existing `@deepseek-ai/*` module identifiers used by the inherited runtime without exposing them as the product API. |
| Platform adapter | Explicit per platform | Provides the Node/Termux launcher and handles optional native capabilities without blocking non-PTY startup. |

This shape means a user installs one public package while the installer receives
only a validated runtime payload. It avoids the source checkout, source maps,
test suites, and development tooling that caused the previous Termux install to
consume excessive storage and fail on weak networks.

## Compatibility policy

The existing internal package scope remains an implementation detail until a
later major-version migration. A scope-only replacement now would change package
names, import specifiers, lockfile links, release ordering, profile entries, and
plugin contracts across thousands of files in the same change. That is not a
safe way to create the first reliable Kalix distribution.

Instead, changes proceed in this order:

1. Keep `@kalix-code/kalix` as the only public CLI package and validate its
   complete production dependency boundary.
2. Build and verify a runtime artifact that includes all dynamic profile modules
   and default profile configuration.
3. Publish the artifact only after a clean install proves `kalix --help`,
   `kalix --version`, and a local web-server smoke test.
4. Introduce `@kalix-code/*` internal replacements behind compatibility aliases
   in a later major release, with both names accepted during the migration.
5. Remove legacy aliases only after plugin authors and stored profiles have an
   explicit upgrade path.

## Artifact acceptance gates

No npm version is published until every gate below passes from a fresh temporary
directory.

| Gate | Evidence required |
| --- | --- |
| Payload integrity | `npm pack --dry-run` contains no source workspace, test suites, package-manager links, or accidental credentials. |
| Runtime closure | The artifact starts with an empty `KALIX_HOME`; it must not rely on the developer's existing profiles or workspace paths. |
| Command contract | `kalix --version` reports the packed version and `kalix --help` exits successfully. |
| Local web mode | `kalix web --no-open --port 0` starts and answers an HTTP health request. |
| Termux compatibility | An Android ARM64 test uses Node 22 or newer and confirms optional PTY/native dependencies do not prevent normal web startup. |
| Supply-chain review | The packed manifest has exact runtime dependencies or a self-contained payload, and no authentication token is present. |

## Current foundation

The CLI now declares the non-optional dependencies required by the shared boot
layer as production dependencies. The corresponding release test reads the CLI
and boot manifests and prevents those dependencies from silently returning to
`devDependencies` or an undeclared peer-only state. A production-only deployment
of the CLI has been started in a clean Kalix home and successfully served the
web profile help contract.

This foundation does **not** mean that `npm install -g @kalix-code/kalix` is
available yet. The standalone artifact builder, its runtime module catalog, its
Termux acceptance test, and a review of the final tarball still need to be
implemented before publication.
