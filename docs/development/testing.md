# 测试策略

## 每次变更

- `npm run build`：TypeScript/Vue 类型检查与生产构建。
- `npm run lint`：源码规则检查；若存量问题导致失败，必须区分本次新增与既有问题。
- 检查文档链接、`docs/project.yaml`、环境变量和 Git Diff。

## Shell 专项

涉及应用注册、路由、认证、消息、Tab 或部署时，使用至少一个真实子应用验证：首次挂载、重复打开、多实例、内部跳转、Token 请求/失效、Locale、关闭卸载、entry 失败、深链刷新和重新登录。

密钥、Token 或代理变更需要负向安全验证，不能只验证成功路径。
