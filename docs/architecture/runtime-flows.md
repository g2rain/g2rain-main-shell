# 运行流程

## 启动

创建 Vue App → 安装 Store/i18n/UI → 注册 Shell 与内建页面路由 → 初始化主题 → 启动认证、菜单、Locale、Tab 和微应用 Boot → 挂载根应用。

## 子应用生命周期

菜单初始化 → 提取并校验 `appKey/name/entry/activeRule` → 注册 AppDefinition → 打开 Tab 创建 `instanceId` → 渲染容器 → qiankun `loadMicroApp` → 等待 mount → 路由/Token/Locale 协同 → 关闭时卸载并清理实例与 DOM。

## 认证与消息

Shell 处理 SSO 回调和 Token 刷新。子应用通过类型化消息请求 Token、报告失效或同步内部路由；Shell 应把响应绑定到请求和目标应用，并避免路由双向回写循环。

## 部署

Vite 以 `/main` 构建资源路径；容器入口将 Nginx 环境变量写入配置，并代理 `/api`、`/auth` 等路径。构建 Context Path 与容器 `CONTEXT_PATH` 必须一致。
