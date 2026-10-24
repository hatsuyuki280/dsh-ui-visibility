# dsh-ui-visibility

按视口（桌面 / 手机）隐藏 DeepSeek Harness Web UI 元素，并提供逐规则开关。

> 非官方社区插件，与 DeepSeek 官方无隶属关系。

## 能做什么

- 每条规则独立控制「启用 / 桌面显示 / 手机显示」。
- 默认示例：Token 吉祥物、Memory 浮窗、Live2D 桌宠、VRM 桌宠在手机端隐藏，桌面端按你的偏好设置。
- 手机端把 better-sidebar 的 dock 入口下移，并用 `env(safe-area-inset-top)` 避开刘海屏上的抽屉按钮。
- 设置页实时保存，无需刷新。

## 快速开始

1. [安装](Installation)
2. 打开 **Settings → 插件显示与隐藏**
3. 按行调整开关；需要新目标时点「添加规则」
4. 保存后立即生效

## 遇到问题

- 看不到设置页：先硬刷新，再确认插件开关开启。
- 隐藏不生效：检查选择器、是否被保护 UI 规则拒绝、是否在 Shadow DOM。
- 界面被误隐藏：在地址后加 `?uivis=off` 刷新。

## 文档

- [配置与规则](Configuration)
- [选择器契约](Selectors)
- [开发与测试](Development)
- [安全模型](Security)
- [故障排查](Troubleshooting)
- [仓库](https://github.com/hatsuyuki280/dsh-ui-visibility)
