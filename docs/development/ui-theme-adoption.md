# UI / Theme 采纳说明

## 当前状态

| 项 | 状态 |
| --- | --- |
| `@g2rain/theme` | 已安装；由 ThemeController 驱动 CSS / `data-g2-theme` |
| `@g2rain/platform/theme` | `createThemeController` 在 `platform/theme/controller.ts` 单例化 |
| `@g2rain/ui` | `main.ts` 中 `app.use(G2rainUi, …)` |
| Element Plus | 全量注册 |
| 持久化 | `localStorage` 键 `g2rain-main-shell-theme`（仅 `light`/`dark`）；旧 `g2rain` 值迁移为 `light` |
| 第三主题 `g2rain` | 已移除；见偏差关闭 SHELL-013 |

## 规则

1. 主题 CSS 来自 `@g2rain/theme`；壳只负责初始值、切换与持久化。
2. 布局组件优先使用 `--g2-*` CSS 变量。
3. `@g2rain/ui` 的 `translate` / `locale` 由组合根注入。
4. 主题不得进入公开 props / URL / 日志。
5. 本地 `platform/theme` 旧 CSS / `data-theme` 路径不再作为运行时事实来源；`platform/styles/shell-token-bridge.css` 将历史壳变量映射到 `--g2-*`，供 Header/Sidebar 等尚未迁完的组件使用。

## 验证

- Header 可在 light/dark 间切换。
- 刷新后主题保持。
- `document.documentElement` 上为 `data-g2-theme`。
