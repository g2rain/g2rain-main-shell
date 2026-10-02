# 架构偏差

本文件记录正式基线下的已知差异，不代表新增代码可以复制这些做法。

| ID | 偏差 | 风险 | 计划 |
| --- | --- | --- | --- |
| SHELL-001 | `components/error` 与 HTTP 拦截器直接依赖 `platform/i18n`、`platform/locale` | components 反向依赖 platform，复用和测试边界变弱 | 后续以接口/组合根注入，并保留兼容出口 |
| SHELL-002 | `platform/i18n`、`platform/stores/locale.store` 直接调用 `runtime/api` | platform 与 runtime 形成反向依赖 | 将远程加载移动到 runtime Boot，platform 只保留状态与应用函数 |
| SHELL-003 | runtime auth router 直接懒加载 `views` | 与严格单向层次不一致 | 评估将路由定义移入 views/shell 后由组合根注册 |
| SHELL-004 | 多处跨模块深度导入内部文件 | 公共 API 难演进 | 新代码优先使用 `index.ts`，逐步收口 |
| SHELL-005 | 仓库跟踪 `lua/keys/private-key.pem`，Docker 构建会复制整个 `lua/` | 若不是明确的无效开发夹具，可能造成密钥泄露和镜像固化 | 立即确认用途；生产私钥改为部署时注入并轮换，完成安全审计 |
| SHELL-006 | 跨应用消息基于 window 事件；Auth Bridge 已按 instanceId 校验，旧 WindowEventAdapter 路径仍弱 | 任意同页脚本仍可能干扰旧处理器路径 | 收敛到仅 Auth Bridge / 定向信封后关闭；补安全测试 |
| SHELL-007 | 当前只有一个正式 Shell 实现 | 新环境或未来第二个 Shell 可能暴露未覆盖的兼容差异 | 跨应用协议变更时使用 Manager App + Member App 验证挂载、路由、Token、Locale、卸载和深链刷新 |
| SHELL-008 | ~~未安装/未接线 `@g2rain/platform` 与 `@g2rain/http`~~ | — | **已关闭**（Phase 1–3：依赖已装，`initHttpClient` + `initMainPlatform` 已接线） |
| SHELL-009 | ~~公开 props 全量下发 Token~~ → 核心 `buildPublicProps` 无 Token；仅 legacy 边缘注入 | legacy 路径仍有 Token-in-props | 存量应用迁出 legacy registry 后关闭剩余表述 |
| SHELL-010 | ~~Auth Bridge 未完整落地~~ | — | **已关闭**（实现 + **2026-10-02 member-app 经 main-shell 访问验证通过**） |
| SHELL-011 | `loadMicroApp.name` 使用 `` `${name}__${instanceId}` ``，与模板 TPL-008（固定 `applicationCode`）分叉 | 多实例/插件生命周期跨仓不一致 | **有意保持**直至中央契约统一 |
| SHELL-012 | Token localStorage 键为 `g2rain_token:${applicationCode}`（pinia persist），与模板 `g2rain-shell-token:*` 不一致 | 文档与生成壳键名分叉 | **有意长期偏差**：保留本仓键以免现网会话中断 |
| SHELL-013 | ~~Theme/UI 仍本地 `data-theme`（含 g2rain）~~ | — | **已关闭**（`@g2rain/theme` + `data-g2-theme` light/dark；旧 CSS 文件待删） |
| SHELL-014 | `application-code.config` 的 Definition.mode 与 `platform/legacy/registry` 双轨并存 | 协议字段仍可能写回核心 | 菜单解析改为只查 registry 后删除 Definition.mode 并关闭 |
| SHELL-015 | 本地 `src/components/http` 仍保留（Mock / 未迁类型）；业务与 SSO 已走 `@g2rain/http` | 双轨体积与维护成本 | Mock 迁出或删除后移除本地客户端 |
