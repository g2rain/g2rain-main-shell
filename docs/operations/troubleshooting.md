# 排障

| 现象 | 优先检查 |
| --- | --- |
| 子应用无法加载 | `entry` 可达性、CORS、`activeRule`、容器 ID、qiankun 生命周期日志 |
| 刷新深链 404 | Vite base、`VITE_CONTEXT_PATH`、`CONTEXT_PATH`、Nginx rewrite/try_files |
| 菜单有但未注册 App | 菜单初始化状态、应用字段完整性、appKey/name 唯一性 |
| Tab 关闭后仍残留 | instanceId、unmount/destroy、DOM wrapper、监听器和 Store 清理 |
| 子应用拿不到 Token | 登录态、事件来源/appKey/requestId、Token store 和响应目标 |
| 反复 401 | Token 端点、刷新屏障、IAM/Gateway 配置与时钟 |
| 容器端口不可访问 | `SERVER_PORT`、Docker 端口映射及 EXPOSE 8080 与默认监听 80 的差异 |

排障日志不得输出完整 Token、私钥或敏感用户数据。
