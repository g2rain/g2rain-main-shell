# 层次

目标关系为 `shared → components → platform → runtime → views/shell`，其中 `views` 是 Shell 自带认证/租户页面，`shell` 是全局布局与组合层；`main.ts` 和 `App.vue` 是最终组合根。

| 目录 | 职责 |
| --- | --- |
| `shared` | 无业务状态的环境、URL、HTTP 和通用工具 |
| `components` | HTTP、错误、Loading、微应用消息等可复用能力 |
| `platform` | App/Runtime 模型、Stores、Locale、主题与 qiankun 适配 |
| `runtime` | 启动器、认证、API、路由和运行时装配 |
| `views` | Shell 自带页面及其页面 API/类型 |
| `shell` | 全局布局、菜单、Tab、Workspace 和容器 UI |

同层模块优先从 `index.ts` 公共出口引用。当前违反目标方向的依赖见[偏差](deviations.md)。
