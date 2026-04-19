# g2rain-main-shell 架构说明（详细版）

> 侧重整体分层、关键职责、核心流程与交互关系，而非逐文件的“做什么”列表。

## 1. 分层与角色
- **Shell 壳层**：主布局（Header/Sidebar/TabBar/MainLayout）、菜单导航、标签页交互、微应用容器 DOM；负责把 Tab 激活转换为运行时实例操作。
- **Platform 平台层**：微应用管理抽象（AppManager/Adapter）、事件、Pinia stores、类型、主题与全局样式；为上层提供统一能力与单一数据源。
- **Runtime 运行时**：HTTP、认证、环境变量、Mock、错误处理、签名、启动器等实际业务运行支撑。
- **Router 路由层**：应用路由与认证守卫，壳层与业务路由映射。
- **Views 业务视图**：用户、角色等示例页面，验证壳层与运行时能力。
- **Deploy 支撑**：Nginx 模板、entrypoint、Lua 签名脚本/密钥，支撑容器化部署与接口签名。

## 2. 核心流程
### 2.1 应用启动
1) `main.ts` 创建 Vue 应用，注册 Pinia、Router、主题，挂载 `App.vue`。  
2) 启动器（`runtime/starter/*`）可预加载菜单/页面资源/微应用定义。  
3) 进入壳层路由后，菜单与 Tab 状态初始化，等待用户交互。

### 2.2 Tab 驱动的微应用生命周期
1) **Tab 创建/激活**：菜单点击或路由进入 -> `tab.store` 记录 tabs + activeTabKey。  
2) **监听激活**：`MainLayout.vue` / `TabBar.vue` 监听 `activeTabKey`，确定当前子应用 tab。  
3) **实例构建**：`runtime.store` 基于 Tab 构建/获取 `RuntimeInstance`（含 containerId、app 定义、props、status、lastActivePath）。  
4) **挂载/切换**：`BaseAppManager` 调用适配器（Qiankun）挂载；切走时记录 lastActivePath 并 unmount，切回 remount（或首次 mount）。  
5) **关闭**：destroy 实例并清理容器内容。

### 2.3 微应用适配（Qiankun）
- `app.qiankun.ts` 处理 single-spa 限制：同一 `app.name` 仅保留一个实例；挂载前卸载同名实例、清理容器残留。  
- `loadMicroApp` 使用 `containerId` 把子应用渲染进 `MicroAppPage` 的 DOM。  
- 对 single-spa #13/#31 做容错与状态检查。

### 2.4 认证与 SSO
- `runtime/auth/sso.ts` 负责登录跳转与回调；`token.store` 保存 token/kid/client。  
- `MainLayout` 在构建微应用 props 时注入 token 信息，子应用可从 props 获取。  
- HTTP 拦截器在非 Mock 模式下附加鉴权/签名（`runtime/http/interceptors.ts` + `runtime/sign`）。

### 2.5 环境变量与运行时配置
- `runtime/env/index.ts`：Proxy + `loadEnvConfig()`，优先 `window._env_`，回退 `import.meta.env`，占位符兜底；可从 `/env-config.json` 动态加载。  
- 容器启动：`nginx/docker-entrypoint.sh` 用 envsubst 渲染 Nginx 与前端 `env-config.json`（当前仅 SSO_BASE_URL）。

### 2.6 HTTP / Mock / 错误处理
- `runtime/http/axios.ts` 创建实例；`interceptors.ts` 处理 Mock、鉴权/签名、统一错误；`error-handler.ts` 兜底。  
- Mock 数据位于 `runtime/http/mock/data/*`，开关由 `VITE_MOCK_ENABLED` / `VITE_USE_MOCK` 控制。

## 3. 状态管理（Pinia）
- **app.store**：微应用定义（菜单初始化为唯一来源）。  
- **menu.store**：菜单数据与加载状态。  
- **tab.store**：标签页列表与激活状态。  
- **runtime.store**：RuntimeInstance 生命周期（create/mount/unmount/remount/destroy）、lastActivePath、currentInstanceId。  
- **theme.store**：主题名称与切换。  
- **token.store**：token/kid/client。  
- 聚合出口：`platform/stores/index.ts`；Pinia 创建于 `runtime/store/index.ts`，支持持久化插件。

## 4. 微应用模型与管理
- **AppDefinition**（`platform/types/app.type.ts`）：子应用 name/entry/activeRule 等。  
- **RuntimeInstance**（`platform/types/runtime.type.ts`）：instanceId/tabKey/app/containerId/status/props。  
- **单一数据源**：AppDefinition 由 `app.store` 管理；RuntimeInstance 由 `runtime.store` 管理；`BaseAppManager` 只做校验与适配器调用，不再维护本地 Map。

## 5. 壳层 UI 职责
- **MainLayout.vue**：监听激活 Tab，驱动实例 mount/unmount/remount，记录 lastActivePath。  
- **TabBar.vue**：标签交互、关闭、切换。  
- **MicroAppPage.vue**：提供微应用挂载容器 `#sub-app-container-{tabKey}`。  
- **Menu/MenuItem**：菜单渲染与 Tab 创建。  
- **Header/Sidebar/Footer/ShellLoading/Workspace**：布局骨架与状态反馈。

## 6. 路由
- `router/index.ts`：创建 Router、注册全局守卫。  
- `router/auth/index.ts`：认证校验与重定向。  
- `shell/route-map.ts`、`views/route-map.ts`：壳层与业务路由映射。

## 7. 运行时启动器
- `runtime/starter/micro-app.starter.ts`：微应用定义预处理/注册。  
- `runtime/starter/page.starter.ts`：页面资源加载。  
- `runtime/starter/tab.starter.ts`：默认标签初始化。  
- `runtime/starter/index.ts`：聚合启动入口。

## 8. 主题与样式
- 主题定义 `platform/theme/*.ts`，预设主题 CSS 在 `platform/theme/themes/*.css`。  
- 全局样式与变量在 `platform/styles/*.css`。

## 9. Mock 与本地开发
- Mock 数据 `runtime/http/mock/data/*`；拦截器按开关决定走 Mock 或真实后端，便于联调前的自洽演示。

## 10. 构建与部署
- **Vite 插件**：`vite-plugin-env-config.ts` 构建期生成 `dist/env-config.js`（占位符）。  
- **Docker/Nginx**：`Dockerfile` + `nginx/docker-entrypoint.sh` 构建镜像并在启动时渲染 Nginx 与 `env-config.json`。  
- **签名**：`lua/*` 与 `runtime/sign/*` 提供签名/密钥支持，供 HTTP 鉴权使用。

## 11. 关键交互速览
- Tab 激活 -> `runtime.store` 创建/选择实例 -> `BaseAppManager` -> `QiankunAdapter` -> 子应用挂载到 `MicroAppPage` 容器。  
- Token 变化 -> `MainLayout` 构建 props -> 传递到子应用（含 token/kid/client/initialRoute）。  
- 环境变量 -> `runtime/env` Proxy -> 业务/HTTP/SSO 读取；容器启动可覆盖 SSO_BASE_URL。  
- HTTP 请求 -> `interceptors` 决定 Mock/鉴权/签名 -> `error-handler` 兜底。  
- 主题切换 -> `theme.store` + 主题 CSS 动态应用。

## 12. 可扩展点
- 新增微应用：在菜单/资源接口声明 AppDefinition；无需修改 BaseAppManager。  
- 替换适配器：实现新的 RuntimeAdapter 并绑定 AppManager。  
- 扩展主题：新增 CSS 主题并注册到 `theme.store`。  
- 运行时配置：在 `env-config.json` 增占位符，entrypoint 用 envsubst 注入，`runtime/env` 自动读取。  
- Mock 扩展：在 `runtime/http/mock/data` 增加场景，拦截器自动匹配。
# g2rain-main-shell Architecture Detail

按文件逐项说明（排除 `dist/`、`node_modules/` 等产物）。

## 根目录与配置
- `.dockerignore`：Docker 构建忽略列表。
- `.editorconfig`：统一编辑器缩进/编码规则。
- `.env` / `.env.production`：运行/生产环境变量示例。
- `.eslintrc.cjs`：ESLint 配置。
- `.gitignore`：Git 忽略规则。
- `.prettierrc.cjs`：Prettier 格式化规则。
- `architecture.md`：项目架构高层概述。
- `Dockerfile`：主应用容器构建文件。
- `index.html`：Vite 入口 HTML。
- `LICENSE`：开源许可。
- `package.json` / `package-lock.json`：依赖与脚本。
- `README.md`：使用说明。
- `tsconfig.json`：TypeScript 配置。
- `vite-plugin-env-config.ts`：构建期生成 env-config 的 Vite 插件。
- `vite.config.ts`：Vite 主配置。

## IDE 元数据
- `.idea/*`：JetBrains IDE 项目配置。

## Nginx 与 Lua
- `nginx/default.conf.template`：Nginx 站点模板。
- `nginx/docker-entrypoint.sh`：容器启动时渲染 Nginx 与前端 env 配置。
- `lua/config.lua`：Lua 相关配置。
- `lua/sign.lua` / `lua/sign_api.lua`：签名脚本。
- `lua/luaossl-rel-20250929.tar.gz`：Lua SSL 依赖包。
- `lua/keys/*`：签名/加密相关密钥与说明。

## 应用入口
- `src/main.ts`：Vue 应用入口，注册路由/状态/主题。
- `src/App.vue`：根组件，挂载布局与路由视图。
- `src/env.d.ts`：前端环境变量类型声明。

## 平台层（platform）
- `src/platform/apps/app-manager.type.ts`：AppManager 接口定义。
- `src/platform/apps/app.base.ts`：AppManager 抽象基类，调用运行时 store/适配器。
- `src/platform/apps/app.qiankun.ts`：Qiankun 运行时适配器与 manager 实现。
- `src/platform/apps/event-adapter.type.ts`：事件适配器接口。
- `src/platform/apps/event.qiankun.ts` / `event.ts` / `event.types.ts`：事件分发适配与类型。
- `src/platform/stores/index.ts`：Pinia store 出口聚合。
- `src/platform/stores/app.store.ts`：微应用定义（菜单初始化）存储。
- `src/platform/stores/menu.store.ts`：菜单数据与加载状态。
- `src/platform/stores/runtime.store.ts`：运行时实例生命周期管理。
- `src/platform/stores/tab.store.ts`：标签页集合与激活状态。
- `src/platform/stores/theme.store.ts`：主题状态与切换。
- `src/platform/stores/token.store.ts`：认证 token 状态。
- `src/platform/styles/base.css` / `index.css` / `variables.css`：全局样式与变量。
- `src/platform/theme/element.ts` / `index.ts` / `types.ts`：主题配置与类型。
- `src/platform/theme/themes/*.css`：预设主题样式（dark/g2rain/light）。
- `src/platform/types/app.type.ts`：微应用定义类型。
- `src/platform/types/http.types.ts`：HTTP 相关类型定义。
- `src/platform/types/menu.type.ts`：菜单数据类型。
- `src/platform/types/runtime.type.ts`：运行时实例与适配器相关类型。
- `src/platform/types/tab.types.ts`：Tab/标签页类型。

## 路由
- `src/router/index.ts`：路由创建与全局守卫入口。
- `src/router/auth/index.ts`：认证路由/守卫相关逻辑。

## Runtime（运行时能力）
- `src/runtime/api/menu.api.ts`：菜单接口调用封装。
- `src/runtime/api/page-resource.api.ts`：页面资源接口调用封装。
- `src/runtime/auth/index.ts`：认证入口整合。
- `src/runtime/auth/sso.ts`：SSO 相关逻辑（登录跳转、回调处理）。
- `src/runtime/env/index.ts`：运行时环境变量读取（Proxy + env-config.json 处理）。
- `src/runtime/http/axios.ts`：Axios 初始化与请求适配。
- `src/runtime/http/error-handler.ts`：HTTP 层错误统一处理。
- `src/runtime/http/index.ts`：HTTP 模块出口。
- `src/runtime/http/interceptors.ts`：请求/响应拦截器与 mock 钩子。
- `src/runtime/http/mock/index.ts` / `data.ts` / `data/auth.data.ts` / `data/test.api.ts`：Mock 数据与生成逻辑。
- `src/runtime/sign/index.ts`：签名模块入口。
- `src/runtime/sign/server.key.ts`：签名所需 key 读取/占位。
- `src/runtime/starter/index.ts`：启动器入口汇总。
- `src/runtime/starter/micro-app.starter.ts`：微应用相关启动流程。
- `src/runtime/starter/page.starter.ts`：页面资源启动流程。
- `src/runtime/starter/tab.starter.ts`：Tab 初始化流程。
- `src/runtime/store/index.ts`：Pinia 创建及插件注入。
- `src/runtime/store/plugins/persisted.ts`：持久化插件配置。

## 共享工具
- `src/shared/utils/generator.ts`：通用生成器工具（ID/序列等）。
- `src/shared/utils/jwt.util.ts`：JWT 相关工具函数。

## Shell（主框架 UI）
- `src/shell/index.ts`：Shell 组件与导出入口。
- `src/shell/route-map.ts`：Shell 内部路由映射。
- `src/shell/components/Menu.vue` / `MenuItem.vue`：菜单渲染组件。
- `src/shell/components/ShellLoading.vue`：壳层加载态组件。
- `src/shell/layout/Footer.vue` / `Header.vue` / `Sidebar.vue`：布局骨架。
- `src/shell/layout/MainLayout.vue`：主布局，负责 tab 激活驱动运行时实例。
- `src/shell/layout/MicroAppPage.vue`：微应用容器 DOM（提供挂载点）。
- `src/shell/layout/TabBar.vue`：标签栏交互与切换。
- `src/shell/pages/Workspace.vue`：主工作台页面。

## 业务视图
- `src/views/route-map.ts`：业务路由映射。
- `src/views/auth/Logout.vue`：登出页面。
- `src/views/auth/SsoCallback.vue`：SSO 回调处理页面。
- `src/views/role/api.ts`：角色相关 API。
- `src/views/role/index.vue`：角色页面。
- `src/views/role/mock.ts` / `types.ts`：角色模块 mock 与类型。
- `src/views/user/api.ts`：用户相关 API。
- `src/views/user/index.vue`：用户页面。
- `src/views/user/mock.ts` / `types.ts`：用户模块 mock 与类型。

## 其他资源
- `src/platform/styles` / `src/platform/theme/themes`：全局/主题样式资源。
- `src/runtime/http/mock/data/*`：Mock 数据定义。
- `lua/*`、`nginx/*`：部署与签名支持脚本和密钥。
