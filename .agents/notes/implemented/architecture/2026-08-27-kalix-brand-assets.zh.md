# Agent Note: Kalix brand assets

Status: implemented

[English](2026-08-27-kalix-brand-assets.md) | 中文

## 问题

仓库通过公开站点资源、浏览器和 PWA 图标、嵌入式文档图片以及远程 README 图片暴露了继承的产品标志。让这些图片来源与 Kalix Code 品牌并存会使可见产品身份不一致，也会让文档的品牌展示依赖外部主机。

## 决定

Kalix Code 拥有 Web 应用、文档站点、README、文档插图和随软件包分发的 skill 徽章所使用的面向产品的图稿。提供的 Kalix Code 吉祥物成为浏览器、PWA 和文档站点图标。提供的 Kalix Code 组合标志成为文档站点导航标志、README 标志图片和 skill 徽章源图。

Web 应用提供 `apps/web/public/kalix-code-mascot.png`，并从浏览器文档和 PWA 清单中声明它。文档站点提供 `website/public/kalix-code-mascot.png` 与 `website/public/kalix-code-wordmark.png`。README 图片元素引用这些仓库本地文件。提供方指南图片文件保留原有文档路径，以保持已发布链接稳定，但其内容改为 Kalix Code 图像。

继承的 favicon 和文字标志文件不再存在。面向产品的图片引用不再从继承的远程 CDN 加载图片。为验证 Markdown 渲染而使用 `example.com` 图片 URL 的测试夹具仍是中立测试数据，不属于产品图稿。

## 考虑过的替代方案

**保留旧资源名称并只替换文件内容** 会在源码控制中掩盖产品身份，也会让配置仍然暗示继承的视觉系统。

**从外部主机加载 Kalix 图稿** 会为项目展示增加网络依赖，使本地、离线和派生文档的可靠性降低。

**修改通用 Markdown 图片夹具** 会在不替换产品图片的情况下改变行为测试。它们的中立 URL 仍可独立验证 URL 处理行为。

## 后果

应用和文档展示使用仓库拥有的 Kalix Code 图片，浏览器和安装元数据引用新的吉祥物。源码树包含一小组栅格品牌资源，必须持续与已批准的 Kalix Code 图稿保持一致。

这次视觉更新不会重命名源码软件包词汇、命令、配置键或协议标识符。覆盖整个仓库的技术迁移仍是一项独立决定。
