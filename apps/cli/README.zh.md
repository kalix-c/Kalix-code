# Kalix CLI

[English](README.md) | 中文

`kalix` 是 Kalix Code 的 profile 启动器。它只启动所选 profile，将无效命令和配置错误以非零退出码报告，并将本地用户数据保存在 `$KALIX_HOME` 或 `~/.kalix`。

## 入口模式

| 命令 | 用途 |
|---|---|
| `kalix --profile <name>` | 启动 `$KALIX_HOME/profiles/<name>` 下的指定 profile。 |
| `kalix --profile headless "job"` | 运行一个新的持久会话，输出最终回答后退出。 |
| `kalix web` | 启动本地 Web UI；这是 `kalix --profile web` 的别名。 |
| `kalix web --background` | 不打开浏览器，以分离的本地服务形式启动 Web UI。 |
| `kalix plugin --profile <name> <pnpm args>` | 在 profile 目录中将其余参数转发给 pnpm，以管理 profile 插件。 |

`web` 和 `headless` profile 会在首次使用时从内置模板初始化。其他 profile 可通过 `kalix plugin` 创建和扩展。

## Web UI 与后台模式

除非指定其他端口，`kalix web` 会在 `http://127.0.0.1:3080` 提供本地界面。使用 `kalix web --no-open` 可禁止打开默认浏览器。对于 Termux、桌面终端和持续运行的本地会话，请使用 `kalix web --background`；它会与调用终端分离，并将输出记录到 `$KALIX_HOME/logs/web.log`。关闭浏览器标签页不会停止该本地服务。

<a id="profiles"></a>

## 参数与 profile

启动器只解析自己的参数，然后将剩余参数转发给所选 profile。请将启动器参数放在前面：

```sh
kalix web --port 8080
kalix --profile tui --resume <id>
kalix --profile headless "run the tests"
kalix web --help
kalix --help
```

每个 profile 都包含一个 `package.json`、profile manifest 和由用户管理的 `cordis.patch.yml`。使用 `kalix --profile <name> --dump-default-config` 或 `--dump-config` 可在不启动 profile 的情况下检查组合后的配置。

## 开发

在仓库检出目录中，先安装依赖并构建，然后启动源码版本：

```sh
pnpm install
pnpm run build
pnpm kalix web
```

构建后的软件包将 `kalix` 二进制发布为 `@kalix-code/kalix`。
