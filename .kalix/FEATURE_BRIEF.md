# Feature brief template

Copy this template into the issue, pull request description, or proposed Agent Note that introduces a meaningful feature. Replace each prompt with project-specific facts before source changes begin.

## Outcome

State the user or model-facing result in one paragraph. Describe the observable behavior rather than the implementation method.

## Ownership and boundaries

| Question | Answer |
|---|---|
| Owning package or application | `<path>` |
| Capability role | `<service definition / provider / consumer / UI / CLI>` |
| Public names affected | `<packages, commands, configuration, events, tools, or APIs>` |
| Explicit non-goals | `<what this feature does not change>` |

## Design

Describe the chosen extension point, lifecycle, permissions, failure behavior, and disposal or teardown responsibilities. When a feature reaches a model request, identify the session event that makes the input reconstructable from the session log.

## Configuration, data, and compatibility

| Area | Decision |
|---|---|
| Configuration | `<new or changed fields, defaults, validation, and user control>` |
| Session or durable data | `<events, schema/version effects, migration, or none>` |
| External services | `<authentication, rate limits, availability, and degraded behavior>` |
| Compatibility | `<rejection, migration, or support policy>` |

## Validation

State the narrowest checks that demonstrate the changed behavior. Include focused unit tests for local behavior, a keyless snapshot for meaningful model or product output, UI or end-to-end coverage where relevant, and documentation validation for edited documentation.

| Surface | Command or evidence |
|---|---|
| Source behavior | `<focused test command>` |
| User or model output | `<snapshot fixture or command>` |
| Type and lint safety | `<relevant typecheck/lint command>` |
| Documentation | `<relevant documentation command>` |

## Documentation and decision record

List the README, JSDoc, user documentation, subsystem reference, or cookbook pages affected. A non-trivial behavior, architecture, process, configuration, wire, or durable-data decision needs an Agent Note in the same change.

## Risks and follow-up

Name the main failure modes, security or privacy considerations, feature flags or rollback needs, and the condition that would justify a separate follow-up.
