# Kalix Code

[English](README.md) | 中文

Kalix Code（`kalix`）是一个开源、插件优先的智能体环境。它使用 [Cordis](https://github.com/cordiverse/cordis) 进行模块化组合，默认将本地配置存放在 `~/.kalix`。

## 开发者预览

Kalix Code 正处于积极迭代的开发者预览阶段；界面和配置可能在版本之间演进。

<a id="run"></a>

## 安装与运行

### 电脑：macOS、Linux 或 Windows

安装 Node.js 22.19 或更高版本、Git 和 pnpm。随后在 PowerShell、终端或 Linux shell 中克隆并构建仓库：

```sh
git clone https://github.com/kalix-c/Kalix-code.git
cd Kalix-code
corepack enable
pnpm install
pnpm run build
pnpm kalix web
```

该命令会在 `http://127.0.0.1:3080` 提供本地界面。如不需要自动打开浏览器，请添加 `--no-open`。

<a id="run-from-source"></a>

### Android：Termux

从受信任的当前来源安装 Termux，然后在终端中运行轻量级本地服务。Android 路径会有意跳过服务 Web UI 不需要的可选原生交互式终端支持：

```sh
pkg update -y && pkg upgrade -y
pkg install -y git nodejs-lts
git clone --depth 1 https://github.com/kalix-c/Kalix-code.git
cd Kalix-code
corepack enable
corepack install
pnpm install --frozen-lockfile --no-optional
pnpm kalix web --background
```

`kalix web --background` 不会打开浏览器，会将日志写入 `$KALIX_HOME/logs/web.log`，并把服务与终端分离。需要时在设备浏览器中打开 `http://127.0.0.1:3080`；关闭标签页不会停止服务。轻量级 Android 模式不提供交互式 PTY 功能；如需这些功能，请使用电脑构建。参见 [Termux 指南](docs/termux.md) 和 [Web UI 指南](docs/user/guide/index.zh.md)。

## 社区与支持

- 欢迎通过 [Kalix Code Issues](https://github.com/kalix-c/Kalix-code/issues) 提交反馈或 bug 报告。
- 为相关插件仓库添加 [`kalix-code`](https://github.com/topics/kalix-code) 话题，便于被发现。

<table>
  <thead>
    <tr>
      <th align="center">企微小助手</th>
      <th align="center">入群问卷</th>
      <th align="center">微信公众号</th>
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

## 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.zh.md)。

## 开发

请先阅读[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)。

面向 agent：请遵循 [AGENTS.md](AGENTS.md)。

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
