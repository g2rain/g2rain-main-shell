# 依赖规则

1. shared 不依赖 Vue 状态、platform、runtime、views 或 shell。
2. components 不应反向依赖 platform/runtime；需要 Locale 等能力时通过接口或组合根注入。
3. platform 不应直接调用 runtime API；平台模型与适配器保持可测试。
4. runtime 可装配 platform/components/shared，并通过路由懒加载 Shell 内建 views。
5. shell/views 可使用下层能力，但不把子应用业务规则搬入主应用。
6. `main.ts`/`App.vue` 负责跨层组合，跨模块使用稳定公共出口。
7. `entry` 和跨应用消息属于外部依赖，必须校验、超时、记录失败并清理状态。
