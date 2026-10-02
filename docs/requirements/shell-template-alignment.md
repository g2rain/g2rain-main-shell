---
id: shell-template-alignment
title: 对齐 shell-template 升级
status: 开发中
owner: unassigned
---

# 对齐 shell-template 升级

## 目标

将 `g2rain-main-shell` 按 [shell-template-upgrade.md](../architecture/shell-template-upgrade.md) 分阶段收敛到 `g2rain-shell-template` 目标架构：接入 `@g2rain/http` / `@g2rain/platform`（及 Theme/UI）、Platform Main、Auth Bridge，以及 legacy 边缘兼容，同时保留 `/main`、生产菜单/SSO/Lua 与 manager-app legacy。

## 非目标

- 整仓用模板覆盖；引入脚手架占位符；改 Context Path 为 `/admin`。
- 一次性切断 legacy；静默改 `loadMicroApp.name`；强制改 Token 落盘键名。
- 把子应用业务、IAM 签发或 Gateway 鉴权搬入 Shell。

## 验收标准

- Phase 0–7 闸门见总方案；完成时满足 [definition-of-done.md](../development/definition-of-done.md)。
- 公开 props 无 Token；legacy 仅边缘注入。
- Auth Bridge 对 AppKit 子应用可用；manager-app legacy 不回归。
- `npm run build` 通过；偏差表与 adoption 文档与实现一致。

## 影响的跨应用契约

- 公开 props、Auth Bridge 消息、`applicationCode` / `viewId` / `instanceId`、legacy Token-in-props（边缘）。

## 安全与部署影响

- Token 不得进入公开 props / URL / 日志；Auth Bridge 同页可信模型见 TPL-009 对等偏差。
- OpenResty/Lua 签名路径保持；私钥跟踪风险（SHELL-005）不因本需求自动关闭。

## 测试计划

- 每阶段 `npm run build`；Phase 2+ SSO 全链路；Phase 3+ member-app / manager-app 冒烟；Phase 7 联合验收。

## 回滚方式

- 按总方案各 Phase 回滚说明；需求取消时恢复 `activeRequirement: null` 并将本文件标为 `已取消`。

## 状态

`开发中`（Phase 0–7 源码与文档已落地；`npm run build` 通过。**2026-10-02：main-shell 访问 member-app 验证通过。** 仍待：manager-app legacy 回归、深链/F5 等；全部闸门通过后改为 `已完成`）。
