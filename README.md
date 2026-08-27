# Kalix Code

English | [中文](README.zh.md)

Kalix Code (`kalix`) is an open-source, plugin-first agent environment. It uses [Cordis](https://github.com/cordiverse/cordis) for modular composition and stores its local configuration under `~/.kalix` by default.

## Developer preview

Kalix Code is in active developer preview. Interfaces and configuration may evolve between releases.

<a id="run"></a>

## Install and run

<a id="run-from-source"></a>

### Computer: macOS, Linux, or Windows

Install Node.js 22.19 or newer, Git, and pnpm. From PowerShell, Terminal, or a Linux shell, clone and build the repository:

```sh
git clone https://github.com/kalix-c/Kalix-code.git
cd Kalix-code
corepack enable
pnpm install
pnpm run build
pnpm kalix web
```

The command serves the local UI at `http://127.0.0.1:3080`. Add `--no-open` when a browser must not open automatically.

### Android: Termux

Install Termux from a current trusted source, then run the same local service from its terminal:

```sh
pkg update && pkg upgrade
pkg install git nodejs-lts
corepack enable
git clone https://github.com/kalix-c/Kalix-code.git
cd Kalix-code
pnpm install
pnpm run build
pnpm kalix web --background
```

`kalix web --background` starts the UI without opening a browser, writes logs to `$KALIX_HOME/logs/web.log`, and detaches the service from the terminal. Open `http://127.0.0.1:3080` in the device browser whenever needed; closing the tab does not stop the service. See the [Web UI guide](docs/user/guide/index.md).

## Community and support

- Submit feedback or bug reports through [Kalix Code Issues](https://github.com/kalix-c/Kalix-code/issues).
- Add the [`kalix-code`](https://github.com/topics/kalix-code) topic to related plugin repositories for discoverability.

<table>
  <thead>
    <tr>
      <th align="center">Kalix Code logo</th>
      <th align="center">Kalix Code mascot</th>
      <th align="center">Kalix Code logo</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="website/public/kalix-code-wordmark.png" alt="Kalix Code logo" width="360" height="95"></td>
      <td align="center"><img src="website/public/kalix-code-mascot.png" alt="Kalix Code mascot" width="180" height="180"></td>
      <td align="center"><img src="website/public/kalix-code-wordmark.png" alt="Kalix Code logo" width="360" height="95"></td>
    </tr>
  </tbody>
</table>

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

For agents, follow [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
