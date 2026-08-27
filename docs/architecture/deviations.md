# 架构偏差

本文件记录正式基线下的已知差异，不代表新增代码可以复制这些做法。

| ID | 偏差 | 风险 | 计划 |
| --- | --- | --- | --- |
| SHELL-001 | `components/error` 与 HTTP 拦截器直接依赖 `platform/i18n`、`platform/locale` | components 反向依赖 platform，复用和测试边界变弱 | 后续以接口/组合根注入，并保留兼容出口 |
| SHELL-002 | `platform/i18n`、`platform/stores/locale.store` 直接调用 `runtime/api` | platform 与 runtime 形成反向依赖 | 将远程加载移动到 runtime Boot，platform 只保留状态与应用函数 |
| SHELL-003 | runtime auth router 直接懒加载 `views` | 与严格单向层次不一致 | 评估将路由定义移入 views/shell 后由组合根注册 |
| SHELL-004 | 多处跨模块深度导入内部文件 | 公共 API 难演进 | 新代码优先使用 `index.ts`，逐步收口 |
| SHELL-005 | 仓库跟踪 `lua/keys/private-key.pem`，Docker 构建会复制整个 `lua/` | 若不是明确的无效开发夹具，可能造成密钥泄露和镜像固化 | 立即确认用途；生产私钥改为部署时注入并轮换，完成安全审计 |
| SHELL-006 | 跨应用消息基于 window 事件，当前文档未证明来源/目标绑定 | 任意同页脚本可能请求 Token 或伪造路由事件 | 增加来源、appKey、实例和 requestId 校验，补安全测试 |
| SHELL-007 | 当前只有一个正式 Shell 实现 | 新环境或未来第二个 Shell 可能暴露未覆盖的兼容差异 | 跨应用协议变更时使用 Manager App 验证挂载、路由、Token、Locale、卸载和深链刷新 |
