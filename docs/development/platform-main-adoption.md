# Platform Main 采纳说明

本文件记录 `g2rain-main-shell` 对 `@g2rain/platform/main` 与 `@g2rain/http` 的**本仓采纳状态与改造锚点**。跨仓不变式以 appkit 的 [Main Shell 生成契约](https://github.com/g2rain/g2rain-appkit/blob/main/docs/packages/main-shell-contract.md) 为准。总体升级见 [shell-template-upgrade.md](../architecture/shell-template-upgrade.md)。

## 当前状态

| 项 | 状态 |
| --- | --- |
| 依赖 `@g2rain/platform` | 已安装 `@g2rain/platform@1.0.0`；`initMainPlatform` 在 `runtime/boot` |
| 依赖 `@g2rain/http` | 已安装；`runtime/http` 装配 business/auth/sign；SSO 已切换 |
| `createMainPlatform` / `runtimePort` | 已接线；`emit` → `emitDirectedMessage`；`updateInstanceProps` → RuntimeStore |
| 公开 props | `buildInstanceFromTab` 经 `buildPublicProps`；**核心无 Token**；legacy 边缘注入 |
| Auth Bridge | `startRequestTokenHandler` / `startTokenInvalidHandler` / `openAuthBridge` |
| Theme / UI | `@g2rain/theme` + `@g2rain/ui`；见 [ui-theme-adoption.md](ui-theme-adoption.md) |
| 联合验收 | **部分通过**：main-shell 访问 member-app（AppKit）已验证正常；manager-app legacy / 深链 F5 仍待报 |

## 改造锚点

| 职责 | 位置 |
| --- | --- |
| 组合根 | `src/main.ts`、`src/runtime/boot/index.ts` |
| Main 协调器 | `src/platform/main-platform.ts` |
| HTTP 装配 | `src/runtime/http/index.ts` |
| SSO / shared-auth | `src/runtime/auth/sso.ts`、`shared-auth.ts` |
| Legacy registry | `src/platform/legacy/registry.ts` |
| Auth Bridge | `src/components/micro-app/{emit-directed-message,request-token-handler,token-invalid-handler}.ts` |
| 实例队列 | `src/platform/apps/instance-queue.ts` |
| Adapter 类型 | `src/platform/apps/adapters/`（协议选择端口；QiankunManager 仍拥有 loader） |

## 安全约束

- Token / Kid / 私钥不得进入公开 props、URL 或持久日志。
- Auth Bridge 可经定向消息下发 client 浅拷贝；禁止 `console.log` 消息整包。
- Token 落盘键保持 `g2rain_token:*`（SHELL-012）。

## 联调对象

- AppKit：`g2rain-member-app`（`/sub`）— **2026-10-02 经 main-shell 访问验证通过**
- AppKit：`g2rain-knowledge-app`（`/sub`）— 已登记为 AppKit，浏览器联合验收待执行。
- Legacy：`g2rain-manager-app` — 待报

## 挂载身份保障

QiankunAdapter 在每次挂载（包括重新挂载）前，以 RuntimeInstance 的
`app.applicationCode`、`tabKey`、`instanceId` 重新调用 `buildPublicProps`，
并让生成的身份字段覆盖旧 props；`viewId = tabKey`、`appKey = instanceId`。
未登记应用默认采用 AppKit（协议版本 `1`）；接入模式配置与 Token props 分支共用 legacy registry，
只有显式登记的 manager、infra、department、cms 应用进入 legacy 兼容路径。knowledge-app 无需白名单。
若浏览器仍报告 `Host props require instanceId`，需核对部署中的 Shell 资源版本并更新 Shell；
仅更新子应用无法补齐旧 Shell 缺失的公开身份字段。
