# 架构概览

`g2rain-main-shell` 是 G2rain 浏览器统一入口。它启动 Vue 主应用，初始化主题、状态、路由和认证，再从菜单提取子应用定义，通过 qiankun 为 Tab 创建独立实例。

## 核心责任

- Shell UI：Header、Sidebar、TabBar、Workspace 和微应用容器。
- 平台状态：菜单、Tab、应用定义、运行实例、Token、Locale 和主题。
- 生命周期：注册、挂载、更新、卸载、销毁及失败清理。
- 协议：Token 请求/响应、Token 失效和子应用路由变化。
- 边缘运行：Nginx/OpenResty 静态资源、代理、配置注入及 Lua 签名端点。

主应用不实现 Manager 等子应用的业务规则，也不替代 IAM/Gateway 的后端安全职责。
