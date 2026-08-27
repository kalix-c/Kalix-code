# Kalix CLI

English | [中文](README.zh.md)

`kalix` is the Kalix Code launcher for profile-based agent environments. It starts only the selected profile, reports invalid commands and configuration errors with a nonzero exit code, and keeps local user data under `$KALIX_HOME` or `~/.kalix`.

## Entry modes

| Command | Purpose |
|---|---|
| `kalix --profile <name>` | Boot the named profile under `$KALIX_HOME/profiles/<name>`. |
| `kalix --profile headless "job"` | Run one fresh persisted session, print the final answer, and exit. |
| `kalix web` | Start the local Web UI; this is an alias for `kalix --profile web`. |
| `kalix web --background` | Start the Web UI as a detached local service without opening a browser. |
| `kalix plugin --profile <name> <pnpm args>` | Manage a profile's plugins by forwarding the remaining arguments to pnpm in the profile directory. |

The `web` and `headless` profiles initialize from their shipped templates on first use. Other profiles are created and extended through `kalix plugin`.

## Web UI and background mode

`kalix web` serves the local interface at `http://127.0.0.1:3080` unless another port is supplied. Use `kalix web --no-open` to suppress opening the default browser. Use `kalix web --background` for Termux, desktop terminals, and long-running local sessions; it detaches from the invoking terminal and records output in `$KALIX_HOME/logs/web.log`. Closing a browser tab does not stop this local service.

<a id="profiles"></a>

## Arguments and profiles

The launcher parses only its own flags and forwards the remaining arguments to the selected profile. Keep launcher flags first:

```sh
kalix web --port 8080
kalix --profile tui --resume <id>
kalix --profile headless "run the tests"
kalix web --help
kalix --help
```

Each profile has a `package.json`, a profile manifest, and a user-owned `cordis.patch.yml`. Use `kalix --profile <name> --dump-default-config` or `--dump-config` to inspect the assembled profile configuration without booting it.

## Development

From a repository checkout, install dependencies and build before starting the source launcher:

```sh
pnpm install
pnpm run build
pnpm kalix web
```

The built package publishes the `kalix` binary as `@kalix-code/kalix`.
