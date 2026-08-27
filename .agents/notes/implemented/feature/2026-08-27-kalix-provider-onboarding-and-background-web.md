# Agent Note: Kalix provider onboarding and background Web sessions

Status: implemented

English | [中文](2026-08-27-kalix-provider-onboarding-and-background-web.zh.md)

## Problem

Adding an OpenAI-compatible provider required users to choose a provider identifier and manually populate a model list before configuration could be saved. Local browser sessions also required the launching terminal to remain attached when users needed the Web UI to outlive a shell or a browser tab.

## Decision

The custom-provider card accepts a display name, HTTP or HTTPS base URL, API protocol, and optional API key. Kalix derives a stable internal provider identifier from the display name, validates the base URL before any request or write, and requests available models automatically after the fields form a usable probe. A failed or empty catalog remains visible as an actionable error and users can still add model IDs manually.

`kalix web --background` restarts the current CLI as a detached local process, forces `--no-open`, and writes combined output to `$KALIX_HOME/logs/web.log`. The process receives the same profile arguments and environment as a foreground launch, while browser tabs are not part of its lifetime.

The published CLI package is `@kalix-code/kalix`, its binary is `kalix`, and the default local home is `~/.kalix`, with `$KALIX_HOME` as the explicit override. Internal `@deepseek-ai/dsh-*` package identifiers remain compatibility implementation details while the public launcher surface transitions to Kalix.

## Provider connection behavior

The card trims the base URL before probing and persisting it. Automatic discovery is debounced, ignores stale request completions after input changes, sends the chosen protocol and the trimmed API key when present, and never probes an incomplete URL or invalid key. The create action is unavailable until a display name, valid base URL, valid model list, and valid key state are available.

## Alternatives considered

**Keeping the provider identifier editable** was rejected because it exposed a storage detail, produced invalid credential references, and made the primary setup form harder to complete. The display name remains user-owned while the internal identifier is deterministic and collision-safe.

**Making automatic discovery the only model path** was rejected because some compatible gateways do not expose a model catalog. Manual model entry remains available after a discovery failure.

**Making the browser tab own the background runtime** was rejected because it fails when mobile browsers suspend or close a tab. The detached process owns the session lifetime and the browser remains only a client.

**Renaming every internal package identifier in one release** was rejected because the monorepo has more than seventeen thousand cross-package implementation references. The current public-package migration exposes Kalix without creating an untestable global breaking change.

## Consequences

Users configure a typical custom provider with the fields they recognize and receive a model list without first saving an incomplete profile. Existing custom configuration remains readable through the compatibility internals. A background Web session persists after the caller exits, but it is intentionally local to the device and users stop it through the operating system when it is no longer needed.

## Verification

The provider-card client suite verifies derived identifiers, automatic discovery, failed discovery, malformed URLs, credential handling, and manual model entry. The background launcher suite verifies Web-only activation and child argument rewriting. A local runtime smoke starts `kalix web --background`, receives the Web response, and stops the test process.
