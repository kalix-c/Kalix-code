# Agent Note: Kalix provider onboarding and background Web sessions

Status: implemented

[English](2026-08-27-kalix-provider-onboarding-and-background-web.md) | 中文

## Problem

添加 OpenAI 兼容提供方曾要求用户选择提供方标识符并手动填写模型列表，配置才能保存。本地浏览器会话在用户需要 Web UI 脱离 shell 或浏览器标签页运行时，仍要求启动终端保持附着。

## Decision

自定义提供方卡片接受显示名称、HTTP 或 HTTPS base URL、API 协议和可选 API key。Kalix 根据显示名称推导稳定的内部提供方标识符，在任何请求或写入前验证 base URL，并在字段构成可用探测请求后自动获取可用模型。失败或空的目录会作为可处理错误保留显示，用户仍可手动添加模型 ID。

`kalix web --background` 会将当前 CLI 重新启动为分离的本地进程，强制传入 `--no-open`，并将合并输出写入 `$KALIX_HOME/logs/web.log`。该进程接收与前台启动相同的 profile 参数和环境，而浏览器标签页不参与其生命周期。

发布的 CLI 包是 `@kalix-code/kalix`，二进制命令是 `kalix`，默认本地目录为 `~/.kalix`，显式覆盖变量为 `$KALIX_HOME`。内部的 `@deepseek-ai/dsh-*` 包标识符在公共启动器切换到 Kalix 时继续作为兼容实现细节存在。

## Provider connection behavior

卡片在探测和持久化前会裁剪 base URL。自动发现经过防抖处理，在输入改变后会忽略过期请求完成结果，在提供时发送所选协议和已裁剪的 API key，并且绝不会探测不完整的 URL 或无效 key。只有显示名称、有效 base URL、有效模型列表和有效 key 状态均可用时，创建操作才可用。

## Alternatives considered

**保留可编辑的提供方标识符**被拒绝，因为它暴露了存储细节、会产生无效凭据引用，并使主要设置表单更难完成。显示名称仍由用户拥有，而内部标识符保持确定性并避免冲突。

**只允许自动发现模型**被拒绝，因为部分兼容网关不会暴露模型目录。在发现失败后，手动模型输入仍然可用。

**让浏览器标签页拥有后台运行时**被拒绝，因为移动浏览器可能挂起或关闭标签页。分离进程拥有会话生命周期，浏览器只作为客户端。

**在一个版本中重命名全部内部包标识符**被拒绝，因为该 monorepo 有超过一万七千处跨包实现引用。当前公共包迁移公开 Kalix，同时避免制造无法测试的全局破坏性变更。

## Consequences

用户可用熟悉的字段配置典型自定义提供方，并在保存不完整 profile 前获得模型列表。现有自定义配置仍可通过兼容内部实现读取。后台 Web 会话会在调用者退出后继续运行，但它有意只在本地设备上运行，用户可在不再需要时通过操作系统停止它。

## Verification

提供方卡片客户端测试覆盖推导标识符、自动发现、发现失败、错误 URL、凭据处理和手动模型输入。后台启动器测试覆盖仅 Web 激活和子进程参数重写。本地运行时 smoke 会启动 `kalix web --background`、接收 Web 响应并停止测试进程。
