# dsh-ui-visibility

[![CI](https://github.com/hatsuyuki280/dsh-ui-visibility/actions/workflows/ci.yml/badge.svg)](https://github.com/hatsuyuki280/dsh-ui-visibility/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-ui-visibility.svg)](https://www.npmjs.com/package/dsh-ui-visibility)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![DSH](https://img.shields.io/badge/DSH-%3E%3D0.2.1--rc.2%20%3C0.3.0-6f42c1)](./package.json)

> 非官方社区插件，与 DeepSeek 官方无隶属关系。Unofficial community plugin; not affiliated with DeepSeek.

按视口（桌面 / 手机）隐藏 DeepSeek Harness Web UI 中插件的前端元素，并提供逐规则开关。每条规则独立控制「启用 / 桌面显示 / 手机显示」，桌面端与手机端互不影响。

![插件显示与隐藏设置页](https://raw.githubusercontent.com/hatsuyuki280/dsh-ui-visibility/main/docs/images/settings.png)

## 功能

- 任意 CSS 选择器规则；支持逗号列表，**每个分支**都会加上视口门控。
- 桌面 / 手机独立开关；默认示例在手机端隐藏 Token 吉祥物、Memory 浮窗、Live2D/VRM 桌宠，桌面端按你的偏好保留。
- 设置页实时保存，无需刷新；Host Config 持久化。
- 手机端把 better-sidebar 的 `[data-dsh-dock-fallback]` 下移，并加 `env(safe-area-inset-top)` 安全区偏移，避免盖住 `dsh-web-mobile` 抽屉按钮。
- 保护 UI 护栏：不能隐藏 DSH 根节点、审批对话框、设置页或侧栏。
- 紧急恢复：地址后加 `?uivis=off` 暂停所有隐藏，设置页仍可访问。

## 默认示例

| 元素 | 来源 | 选择器 | 桌面 | 手机 |
|---|---|---|---|---|
| Token 吉祥物 | `dsh-token-viewer` | `[data-token-pet="true"]` | 显示 | 隐藏 |
| Memory 浮窗 | `dsh-memento` | `#mem-open` | 显示 | 隐藏 |
| Live2D 桌宠 | `dsh-pet-live2d` | `[data-dsh-live2d-pet-root]` | 显示 | 隐藏 |
| VRM 桌宠 | `dsh-plugin-vrmpet3d` | `[data-vrmpet3d="1"]` | 显示 | 隐藏 |

默认值只是示例；你的 profile 可在 **Settings → 插件显示与隐藏** 按偏好覆盖。

## 安装

npm 包发布后：

```bash
dsh plugin --profile web add dsh-ui-visibility
```

当前也可从本地目录安装：

```bash
git clone https://github.com/hatsuyuki280/dsh-ui-visibility.git
dsh plugin --profile web add ./dsh-ui-visibility
```

安装后重启 `dsh web`，刷新页面；在 **Plugins** 确认 `dsh-ui-visibility` 已启用。

## 配置

**Settings → 插件显示与隐藏**：

- 「启用 / 桌面显示 / 手机显示」逐条开关；
- 「添加规则」填写任意 CSS 选择器；
- 可修改手机判定媒体查询，默认 `(pointer: coarse) and (max-width: 1023px)`；
- 可开关 dock 入口下移修复；
- 保存后立即生效。

### 限制与安全护栏

- 最多 **200** 条规则；选择器最多 **500** 字符；媒体查询最多 **300** 字符。
- 拒绝 `{ } <`、CSS 注释、控制字符、未闭合引号/括号/方括号、结尾转义；允许 `>` 子组合器。
- 不能隐藏 `html`、`body`、`#root`、`[data-approval-*]`、`[role=dialog]`、`.uivis-page`、`[data-slot="sidebar"]`。
- 隐藏只是视觉层，插件逻辑仍在运行；这不是安全边界。
- 界面异常时用 `?uivis=off` 恢复。

## 兼容性

- DSH `>=0.2.1-rc.2 <0.3.0`（`package.json` 的 `engines.dsh`）
- Node.js `>=22.19`
- 宿主提供 `@deepseek-ai/schemastery >=3.18.3 <4`
- Web profile；设置页依赖 `settings.section` 与 `configForms`

## 同类插件

没有发现**行为等价**的插件。最接近的几个是：

| 插件 | 差异 |
|---|---|
| [dsh-element-inspector](https://github.com/muyuanjin/dsh-element-inspector) | 可拾取并持久隐藏任意元素，但**没有桌面/手机分别控制**，且 peer 范围不兼容当前 DSH 0.2.x |
| [dsh-ui-hub](https://github.com/Han-1413141/dsh-ui-hub) | 枚举插件 UI 做显示/隐藏/布局，**没有视口维度** |
| [dsh-hide-ui](https://github.com/xiaoman2234/dsh-hide-ui) | 右键隐藏固定界面区域，**不是任意元素/选择器，也没有桌面/手机差异** |
| [dsh-layout-control](https://github.com/LzqSuShi/dsh-layout-control) | 固定布局预设与过滤，**不是逐元素规则** |
| [dsh-model-visibility](https://github.com/Lzh3070/dsh-model-visibility) / [dsh-workspace-visibility](https://github.com/adamcjm/dsh-workspace-visibility) | 只处理模型/工作区，不是通用 UI 元素 |

本次检索范围与时间见 [Wiki: 同类对比](https://github.com/hatsuyuki280/dsh-ui-visibility/wiki)（2026-10-24 市场索引 3,444 条 + GitHub/npm 搜索）。市场和仓库会变化，欢迎 issue 补充。

## 开发

```bash
npm ci --ignore-scripts
npm test          # 19 tests: schema, gating, protected UI, media, save/mutate, lifecycle
npm pack --dry-run
```

CI 在 Node 22/24 上运行，并校验 tarball 的 7 个文件与 `0644` 权限。

## 发布

维护者打 `vX.Y.Z` tag 后，`.github/workflows/publish.yml` 使用 `NPM_TOKEN`（或 npm trusted publishing）带 provenance 发布，并创建 GitHub Release。发布前确保 `package.json` 版本与 tag 一致。

## 安全

请通过 [GitHub Security Advisories](https://github.com/hatsuyuki280/dsh-ui-visibility/security/advisories/new) 私密报告漏洞，不要开公开 issue。细节见 [SECURITY.md](./SECURITY.md)。

## 文档

- [Wiki](https://github.com/hatsuyuki280/dsh-ui-visibility/wiki)
- [选择器契约](./docs/SELECTORS.md)
- [贡献指南](./CONTRIBUTING.md)
- [AGENTS.md](./AGENTS.md)

## 许可

MIT。见 [LICENSE](./LICENSE)。
