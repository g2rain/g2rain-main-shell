# G2Rain Main Shell 架构说明文档

## 📋 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [核心目录说明](#核心目录说明)
  - [platform 目录](#platform-目录)
  - [runtime 目录](#runtime-目录)
  - [shared 目录](#shared-目录)
  - [shell 目录](#shell-目录)
  - [lua 目录](#lua-目录)
  - [nginx 目录](#nginx-目录)
  - [Dockerfile](#dockerfile)
- [核心架构设计](#核心架构设计)
  - [微前端生命周期管理](#微前端生命周期管理)
  - [状态管理架构](#状态管理架构)
  - [Tab 驱动的实例管理](#tab-驱动的实例管理)
- [数据流](#数据流)
- [关键设计模式](#关键设计模式)

## 🛠 技术栈

### 前端技术栈

- **框架**: Vue 3.3.4 + TypeScript 5.4.5
- **构建工具**: Vite 5.0.0
- **微前端**: qiankun 2.10.14
- **UI 组件库**: Element Plus 2.4.3
- **状态管理**: Pinia 2.1.7 + pinia-plugin-persistedstate 3.2.1
- **路由**: Vue Router 4.2.5
- **HTTP 客户端**: Axios 1.12.2
- **加密库**: jose 6.1.0、crypto-js 4.2.0、elliptic 6.6.1
- **Mock 工具**: mockjs 1.1.0

### 后端技术栈

- **Web 服务器**: OpenResty (Nginx + Lua)
- **Lua 库**: lua-resty-openssl（ES256 签名支持）
- **签名算法**: ES256 (ECDSA P-256 + SHA-256)

## 📁 项目结构

```
g2rain-main-shell/
├── src/
│   ├── platform/          # 平台层：可复用的平台能力
│   │   ├── apps/         # 微前端管理器（AppManager、Adapter）
│   │   ├── stores/       # Pinia 状态管理
│   │   ├── theme/        # 主题系统
│   │   ├── styles/       # 样式系统
│   │   └── types/        # 平台类型定义
│   ├── runtime/           # 运行时层：运行时服务
│   │   ├── api/          # API 接口封装
│   │   ├── auth/         # 认证服务（SSO、Token）
│   │   ├── env/          # 环境变量管理
│   │   ├── http/         # HTTP 客户端（Axios、Mock）
│   │   ├── sign/         # 签名服务
│   │   ├── starter/      # 启动器（统一管理服务生命周期）
│   │   └── store/        # Store 配置
│   ├── shared/           # 共享层：通用工具
│   │   └── utils/        # 工具函数（JWT、生成器）
│   ├── shell/            # 壳层：主应用 UI
│   │   ├── components/   # 壳层组件
│   │   ├── layout/       # 布局组件
│   │   ├── pages/        # 壳层页面
│   │   └── route-map.ts  # 壳层路由映射
│   ├── views/            # 业务层：业务页面
│   │   ├── auth/         # 认证页面
│   │   ├── user/         # 用户模块
│   │   ├── role/         # 角色模块
│   │   └── route-map.ts  # 业务路由映射
│   ├── router/           # 路由配置
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── lua/                  # Lua 脚本（签名服务）
│   ├── config.lua        # 密钥配置管理
│   ├── sign.lua          # 签名工具（ES256）
│   ├── sign_api.lua      # 签名 API 接口
│   └── keys/             # 密钥文件目录
├── nginx/                # Nginx 配置
│   ├── default.conf.template  # Nginx 配置模板
│   └── docker-entrypoint.sh   # Docker 启动脚本
└── Dockerfile            # Docker 多阶段构建文件
```

## 🏗 核心目录说明

### platform 目录

平台层提供可复用的平台能力，供主应用和子应用使用。

#### `platform/apps/` - 微前端管理器

- **`app-manager.type.ts`**: AppManager 接口定义
- **`app.base.ts`**: BaseAppManager 抽象基类，提供统一的实例管理接口
- **`app.qiankun.ts`**: QiankunManager 和 QiankunAdapter 实现
- **`event-adapter.type.ts`**: 事件适配器接口
- **`event.qiankun.ts`**: Qiankun 事件适配器实现
- **`event.ts`** / **`event.types.ts`**: 事件类型定义

**作用**: 提供微前端管理抽象层，支持适配器模式，便于替换不同的微前端框架。

**关键设计**:
- `BaseAppManager` 不再维护本地 Map，所有实例管理委托给 `runtime.store`
- `QiankunAdapter` 内部维护 `microApps: Map<string, MicroApp>`，处理 qiankun 的 single-spa 限制
- 同一 `app.name` 只能有一个实例运行，挂载前会自动卸载同名实例

#### `platform/stores/` - Pinia 状态管理

- **`index.ts`**: 导出所有 Store
- **`app.store.ts`**: 微应用定义管理（AppDefinition），菜单初始化时为唯一数据源
- **`menu.store.ts`**: 菜单状态管理（菜单项、初始化状态）
- **`tab.store.ts`**: Tab 标签页管理（标签页列表、激活状态）
- **`runtime.store.ts`**: 运行时实例生命周期管理（RuntimeInstance 的创建、挂载、卸载、销毁）
- **`theme.store.ts`**: 主题状态管理（当前主题、主题切换、持久化）
- **`token.store.ts`**: Token 状态管理（客户端密钥对、Token、登录状态）

**作用**: 集中管理应用的状态，采用单一数据源设计。

**单一数据源原则**:
- **AppDefinition**: 由 `app.store` 统一管理，通过菜单初始化，不支持运行时增删
- **RuntimeInstance**: 由 `runtime.store` 统一管理，所有实例操作都通过 store 进行
- **Tab**: 由 `tab.store` 管理，驱动运行时实例的创建和切换

#### `platform/theme/` - 主题系统

- **`index.ts`**: 主题切换入口（`applyTheme`、`initTheme`、`saveTheme`）
- **`types.ts`**: 主题类型定义（`ThemeMode`、`ThemeConfig`）
- **`element.ts`**: Element Plus 变量映射
- **`themes/`**: 主题 CSS 文件
  - **`light.css`**: 亮色主题
  - **`dark.css`**: 暗色主题
  - **`g2rain.css`**: 品牌主题

**作用**: 提供运行时主题切换能力，支持亮色、暗色和品牌主题，使用 CSS 变量和 `data-theme` 属性实现。

#### `platform/styles/` - 样式系统

- **`base.css`**: 基础样式（reset、布局）
- **`variables.css`**: 非主题公共变量（间距、圆角等）
- **`index.css`**: 样式系统入口（导入所有样式文件）

**作用**: 提供统一的样式系统，包括基础样式和公共变量。

#### `platform/types/` - 平台类型定义

- **`app.type.ts`**: 微应用定义类型（`AppDefinition`）
- **`runtime.type.ts`**: 运行时实例与适配器相关类型（`RuntimeInstance`、`RuntimeAdapter`）
- **`tab.types.ts`**: Tab/标签页类型（`TabClass`）
- **`menu.type.ts`**: 菜单数据类型
- **`http.types.ts`**: HTTP 相关类型定义

**作用**: 定义平台级别的类型，确保类型安全。

### runtime 目录

运行时层提供运行时服务，包括认证、HTTP、微前端等核心能力。

#### `runtime/auth/` - 认证服务

- **`index.ts`**: 导出认证服务
- **`sso.ts`**: SSO 单点登录服务（跳转、Token 生成、Token 刷新）

**作用**: 提供完整的认证流程，包括 SSO 跳转、Token 管理等。

#### `runtime/env/` - 环境变量管理

- **`index.ts`**: 环境变量读取和类型转换（Proxy + `loadEnvConfig()`）

**作用**: 统一管理环境变量，提供类型安全的访问方式。

**读取优先级**:
1. **运行时配置** (`window._env_`) - 从 `env-config.json` 异步加载，用于 Docker 容器运行时替换
2. **构建时配置** (`import.meta.env`) - Vite 构建时注入，用于本地开发
3. **默认值** - 如果以上都不存在

**运行时配置机制**:
- 构建时：Vite 插件生成 `public/env-config.json`，包含占位符 `${SSO_BASE_URL}`
- 运行时：`docker-entrypoint.sh` 使用 `envsubst` 替换占位符为实际环境变量值
- 应用启动：`runtime/env/index.ts` 的 `loadEnvConfig()` 异步加载 `/env-config.json`，合并到 `window._env_`
- 访问：通过 Proxy 动态读取，优先 `window._env_`，回退 `import.meta.env`

#### `runtime/http/` - HTTP 客户端

- **`index.ts`**: 导出 HTTP 客户端
- **`axios.ts`**: Axios 实例配置（自定义 Adapter 支持 Mock）
- **`axios.auth.ts`**: 认证专用 Axios 实例
- **`interceptors.ts`**: 请求/响应拦截器（Token 注入、Mock 处理、错误处理）
- **`error-handler.ts`**: 错误处理
- **`mock/`**: Mock 数据管理
  - **`index.ts`**: Mock 管理器（`MockManager`）
  - **`data.ts`**: Mock 数据汇总
  - **`data/`**: 各模块的 Mock 数据

**作用**: 提供统一的 HTTP 客户端，支持 Mock、Token 自动注入、错误处理等。

#### `runtime/sign/` - 签名服务

- **`index.ts`**: 签名工具（DPoP 签名生成）
- **`server.key.ts`**: 服务器密钥管理

**作用**: 提供请求签名能力，确保 API 安全。

#### `runtime/starter/` - 启动器

- **`index.ts`**: 启动器入口汇总（`start()`、`stop()`）
- **`micro-app.starter.ts`**: 微应用启动流程（监听菜单初始化，注册微应用）
- **`page.starter.ts`**: 页面资源启动流程（加载菜单数据）
- **`tab.starter.ts`**: Tab 初始化流程（Tab 路由同步）

**作用**: 统一管理所有服务的生命周期，确保按依赖顺序加载和卸载。

**服务加载顺序**:
1. **SSO Service** - 认证服务（最基础）
2. **Resource Service** - 资源服务（依赖 token，加载菜单）
3. **Micro App** - 微应用管理（依赖菜单，注册微应用定义）
4. **Tab Route Sync** - Tab 路由同步（依赖路由和 tab store）
5. **Micro App Event Listeners** - 微应用事件监听（依赖微应用）

**服务卸载顺序**（与加载顺序相反）:
1. Micro App Event Listeners
2. Tab Route Sync
3. Micro App
4. Resource Service
5. SSO Service

#### `runtime/store/` - Store 配置

- **`index.ts`**: Pinia 实例创建
- **`plugins/persisted.ts`**: 持久化插件配置

**作用**: 配置 Pinia 和持久化插件。

#### `runtime/api/` - API 接口封装

- **`menu.api.ts`**: 菜单接口调用封装
- **`page-resource.api.ts`**: 页面资源接口调用封装

**作用**: 封装后端 API 调用，提供类型安全的接口。

### shared 目录

共享层提供通用工具函数，可在主应用和子应用间共享。

#### `shared/utils/` - 工具函数

- **`jwt.util.ts`**: JWT 工具（密钥生成、Token 生成、DPoP 签名）
- **`generator.ts`**: 生成器工具（随机字符串、UUID）

**作用**: 提供通用的工具函数，如 JWT 处理、随机数生成等。

### shell 目录

壳层提供主应用的 UI 框架，包括布局、组件、页面等。

#### `shell/components/` - 壳层组件

- **`Menu.vue`**: 菜单组件（支持主应用和子应用菜单）
- **`MenuItem.vue`**: 菜单项组件
- **`ShellLoading.vue`**: 加载组件

**作用**: 提供主应用的通用 UI 组件。

#### `shell/layout/` - 布局组件

- **`MainLayout.vue`**: 主布局（Header、Sidebar、TabBar、Footer）
- **`Header.vue`**: 头部组件
- **`Sidebar.vue`**: 侧边栏组件（菜单、资源服务启动）
- **`TabBar.vue`**: Tab 标签页组件（**核心：监听 activeTabKey，驱动运行时实例创建/挂载/卸载**）
- **`Footer.vue`**: 页脚组件
- **`MicroAppPage.vue`**: 微应用容器 DOM（提供挂载点 `#sub-app-container-{tabKey}`）

**作用**: 提供主应用的布局框架。

**TabBar.vue 核心职责**:
- 监听 `tabStore.activeTabKey` 变化
- 旧 Tab 失去焦点：记录 `lastActivePath`，卸载实例（如果已挂载）
- 新 Tab 被激活：创建或恢复 `RuntimeInstance`，挂载或重新挂载
- Tab 关闭：销毁对应的 `RuntimeInstance`

#### `shell/pages/` - 壳层页面

- **`Workspace.vue`**: 工作台页面（首页）

**作用**: 提供主应用的页面组件。

#### `shell/route-map.ts` - 壳层路由映射

**作用**: 定义壳层路由到组件的映射（如 `/`、`/home` 映射到 `Workspace.vue`）。

## 🎯 核心架构设计

### 微前端生命周期管理

#### 架构分层

```
┌─────────────────────────────────────────┐
│         Shell Layer (壳层)              │
│  - TabBar.vue: 监听 activeTabKey        │
│  - MicroAppPage.vue: 提供容器 DOM      │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│      Platform Layer (平台层)             │
│  - runtime.store: 实例生命周期管理       │
│  - app.store: 微应用定义（单一数据源）   │
│  - BaseAppManager: 统一管理接口         │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│    Adapter Layer (适配器层)              │
│  - QiankunAdapter: qiankun 实现         │
│  - 处理 single-spa 限制                 │
└─────────────────────────────────────────┘
```

#### 生命周期流程

1. **Tab 创建/激活**
   - 用户点击菜单或路由进入 → `tab.store` 记录 tabs + `activeTabKey`
   - `TabBar.vue` 监听 `activeTabKey` 变化

2. **实例构建**
   - `runtime.store.buildInstanceFromTab(tab)` 构建 `RuntimeInstance`
   - 包含：`instanceId`、`tabKey`、`app`（AppDefinition）、`containerId`、`props`、`status`、`lastActivePath`

3. **挂载/切换**
   - `runtime.store.mountApp(instance)` → `BaseAppManager.mountInstance()` → `QiankunAdapter.mount()`
   - `QiankunAdapter` 处理 single-spa 限制：同一 `app.name` 只能有一个实例，挂载前卸载同名实例
   - 子应用挂载到 `MicroAppPage` 的容器 DOM（`#sub-app-container-{tabKey}`）

4. **卸载**
   - Tab 切换走：记录 `lastActivePath`，调用 `runtime.store.unmountApp(instanceId)`
   - 实例状态变为 `unmounted`，但保留在 store 中

5. **重新挂载**
   - Tab 切回：如果实例存在且状态为 `unmounted`，调用 `runtime.store.remountApp(instanceId)`
   - 恢复 `lastActivePath` 作为 `initialRoute`

6. **销毁**
   - Tab 关闭：调用 `runtime.store.destroyApp(instanceId)`
   - 清理容器内容，从 store 中移除实例

#### Qiankun 适配器特殊处理

- **single-spa 限制**: qiankun 使用 `app.name` 作为应用唯一标识，不允许同一应用同时有多个实例
- **解决方案**: `QiankunAdapter.mount()` 挂载前检查并卸载同名实例
- **容器清理**: 挂载前清理容器残留（`innerHTML = ''`，移除 qiankun wrapper）
- **错误容错**: 对 single-spa #13/#31 错误进行容错处理，检查实际挂载状态

### 状态管理架构

#### Store 职责划分

| Store | 职责 | 数据源 |
|-------|------|--------|
| `app.store` | 微应用定义（AppDefinition） | 菜单初始化（单一数据源） |
| `menu.store` | 菜单数据与加载状态 | 后端资源接口 |
| `tab.store` | Tab 列表与激活状态 | 用户交互（菜单点击、路由导航） |
| `runtime.store` | 运行时实例生命周期 | Tab 驱动 | Tab 驱动 |
| `theme.store` | 主题状态 | 用户选择 + localStorage |
| `token.store` | Token 状态 | SSO 认证 + localStorage（独立模式） |

#### 单一数据源原则

- **AppDefinition**: 由 `app.store` 统一管理，通过 `menu.store` 初始化，不支持运行时增删
- **RuntimeInstance**: 由 `runtime.store` 统一管理，所有实例操作都通过 store 进行
- **BaseAppManager**: 不再维护本地 Map，所有操作委托给 store

### Tab 驱动的实例管理

#### 核心流程

```
用户点击菜单
  ↓
tab.store.addTab(tab)
  ↓
tab.store.setActiveTab(tabKey)
  ↓
TabBar.vue 监听 activeTabKey 变化
  ↓
runtime.store.buildInstanceFromTab(tab)
  ↓
runtime.store.mountApp(instance)
  ↓
BaseAppManager.mountInstance()
  ↓
QiankunAdapter.mount()
  ↓
子应用挂载到 MicroAppPage 容器
```

#### 关键设计

1. **Tab 与实例一一对应**: 每个子应用 Tab 对应一个 `RuntimeInstance`，`instanceId = tabKey`
2. **路由恢复**: 切换 Tab 时记录 `lastActivePath`，切回时恢复为 `initialRoute`
3. **Token 传递**: `buildInstanceFromTab` 时从 `token.store` 获取 token/kid/client，注入到 props
4. **状态管理**: 实例状态（`created`、`mounted`、`unmounted`）由 `runtime.store` 统一管理

## 🔄 数据流

### 1. 应用启动流程

```
main.ts
  ├── 创建 Pinia 实例
  ├── 初始化主题系统（themeStore.initialize()）
  ├── 创建 Router 实例
  ├── 注册全局组件
  └── 挂载 App.vue
      └── MainLayout.vue
          └── runtime/starter/index.ts start()
              ├── sso.start()  # 启动 SSO 服务
              ├── pageStarter.start()  # 启动资源服务
              │   └── 监听 tokenStore.isLogin
              │       └── 加载菜单数据
              │           └── menuStore.setMenuItems()
              ├── microAppStarter.startMicroApp()  # 启动微应用监控
              │   └── 监听 menuStore.initialized
              │       └── app.store.initializeFromMenu()
              │           └── runtime.store.registerApps()
              ├── tabStarter.start()  # 启动 Tab 路由同步
              └── runtimeStore.initEventListeners()  # 初始化事件监听
```

### 2. Tab 驱动的微应用生命周期

```
用户点击菜单
  ↓
tab.store.addTab(tab)
  ↓
tab.store.setActiveTab(tabKey)
  ↓
TabBar.vue watch activeTabKey
  ↓
旧 Tab 失去焦点
  ├── 记录 lastActivePath
  └── runtime.store.unmountApp(instanceId)
  ↓
新 Tab 被激活
  ├── runtime.store.buildInstanceFromTab(tab)
  │   ├── 从 token.store 获取 token/kid/client
  │   ├── 恢复 lastActivePath 作为 initialRoute
  │   └── 构建 RuntimeInstance
  ├── runtime.store.mountApp(instance)
  │   └── BaseAppManager.mountInstance()
  │       └── QiankunAdapter.mount()
  │           ├── 检查并卸载同名实例
  │           ├── 清理容器残留
  │           └── loadMicroApp() + mount()
  └── 子应用挂载到 MicroAppPage 容器
```

### 3. 认证流程

```
用户访问受保护页面
  └── 检查 tokenStore.isLogin
      ├── 未登录 → sso.redirectToSSO()
      │   └── 跳转到 SSO 认证页面
      │       └── SSO 回调 (/sso_callback)
      │           └── sso.generateToken(code)
      │               └── 调用 /auth/token
      │                   └── tokenStore.setTokens()
      └── 已登录 → 继续访问
```

### 4. HTTP 请求流程

```
组件调用 API
  └── http.get/post()
      └── interceptors.ts (请求拦截器)
          ├── 检查是否需要 Mock
          │   ├── env.VITE_MOCK_ENABLED = true → 使用 Mock
          │   └── x-g2rain-mock = true → 强制使用 Mock
          ├── 注入 Token (DPoP Header)
          └── 发送请求
              └── interceptors.ts (响应拦截器)
                  ├── 处理错误
                  └── 返回数据
```

### 5. 环境变量加载流程

```
应用启动
  └── runtime/env/index.ts loadEnvConfig()
      ├── 检查 import.meta.env 是否完整
      │   └── 如果关键变量缺失或为占位符
      │       └── fetch('/env-config.json')
      │           └── 合并到 window._env_
      └── 通过 Proxy 动态读取
          ├── 优先 window._env_（运行时配置）
          └── 回退 import.meta.env（构建时配置）
```

## 🎨 关键设计模式

### 1. 分层架构

项目采用清晰的分层架构：

- **platform**: 平台层，提供可复用的平台能力
- **runtime**: 运行时层，提供运行时服务
- **shared**: 共享层，提供通用工具
- **shell**: 壳层，提供主应用 UI
- **views**: 业务层，提供业务页面

### 2. 单一数据源

采用单一数据源原则，避免状态冗余：

- **AppDefinition**: `app.store` 统一管理
- **RuntimeInstance**: `runtime.store` 统一管理
- **BaseAppManager**: 不再维护本地 Map，委托给 store

### 3. Tab 驱动设计

Tab 作为用户交互的入口，驱动微应用实例的创建和管理：

- Tab 创建 → 实例创建
- Tab 激活 → 实例挂载
- Tab 切换 → 实例卸载/重新挂载
- Tab 关闭 → 实例销毁

### 4. 适配器模式

使用适配器模式支持不同的微前端框架：

- `RuntimeAdapter` 接口定义统一的操作
- `QiankunAdapter` 实现 qiankun 特定逻辑
- 便于替换为其他微前端框架（如 single-spa、Module Federation）

### 5. 状态管理

使用 Pinia 进行状态管理，支持持久化：

- **token.store**: 认证状态（独立模式持久化，qiankun 模式不持久化）
- **theme.store**: 主题状态（持久化）
- 其他 store 不持久化，由业务逻辑管理

### 6. 路由映射

使用路由映射表（`route-map.ts`）实现动态路由：

- **shell/route-map.ts**: 壳层路由映射
- **views/route-map.ts**: 业务路由映射

### 7. Mock 系统

提供灵活的 Mock 系统：

- 支持环境变量控制（`VITE_MOCK_ENABLED`）
- 支持请求头强制 Mock（`x-g2rain-mock`）
- 支持通配符 URL 匹配
- 支持函数式 Mock 数据生成

### 8. 微前端通信

通过事件系统实现主应用与子应用通信：

- 使用 `CustomEvent` 进行跨应用通信
- 定义统一的事件类型（`MICRO_APP_EVENT`）
- 支持 Token 请求/响应、Token 失效通知等

### 9. 应用生命周期管理

通过 `runtime/starter` 统一管理所有服务的生命周期：

- **依赖顺序加载**：确保服务按正确的依赖顺序启动
- **统一卸载**：退出登录时统一卸载所有服务
- **状态清理**：清理所有 Pinia store 的状态

### 10. 运行时环境变量配置

支持在 Docker 容器启动时动态配置环境变量：

- **构建时**：Vite 插件生成包含占位符的 `public/env-config.json`
- **运行时**：`docker-entrypoint.sh` 使用 `envsubst` 替换占位符为实际值
- **应用启动**：`runtime/env/index.ts` 异步加载 `/env-config.json`，合并到 `window._env_`
- **访问**：通过 Proxy 动态读取，优先 `window._env_`（运行时配置），回退 `import.meta.env`（构建时配置）

### 11. 主题系统

支持运行时主题切换，使用 CSS 变量和 `data-theme` 属性：

- **CSS 变量**：定义主题相关的颜色、间距等变量
- **data-theme 属性**：通过 `document.documentElement.setAttribute('data-theme', mode)` 切换主题
- **Element Plus 映射**：将主题变量映射到 Element Plus CSS 变量
- **持久化**：主题选择保存到 `localStorage`

### lua 目录

Lua 脚本目录提供基于 OpenResty 的签名服务，用于生成应用级别的 DPoP Token。

#### `lua/config.lua` - 密钥配置管理

**作用**: 管理应用密钥配置，包括密钥加载、缓存和获取。

**主要功能**:
- 从文件系统加载 DER 格式的公钥和私钥
- 缓存密钥配置，避免重复读取文件
- 提供 `get_active_key()` 获取活动的密钥配置
- 支持密钥轮换（`reload_keys()`）

**密钥文件路径**:
- 公钥: `/usr/local/openresty/nginx/lua/keys/public-key.der`
- 私钥: `/usr/local/openresty/nginx/lua/keys/private-key.der`
- Key ID: `/usr/local/openresty/nginx/lua/keys/iam-key-id.txt`

#### `lua/sign.lua` - 签名工具

**作用**: 提供 ES256 签名功能，用于生成 DPoP JWT Token。

**主要功能**:
- **`calculate_pha(body)`**: 计算 Payload Hash Algorithm（SHA256 哈希的 Base64URL 编码）
- **`generate_jwt(payload, private_der, public_der, key_id)`**: 生成 DPoP JWT Token
  - 从 DER 格式的公钥提取 JWK（JSON Web Key）
  - 构建 JWT Header（包含 `typ`、`alg`、`ph_alg`、`jwk`、`kid`）
  - 使用私钥对 JWT 进行 ES256 签名
  - 返回完整的 JWT Token（`header.payload.signature`）

**技术细节**:
- 使用 `lua-resty-openssl` 库进行加密操作
- 支持 DER 格式的密钥（二进制格式）
- 实现 Base64URL 编码（用于 JWT）
- 支持从 SPKI DER 格式提取 EC 点坐标（X、Y）

#### `lua/sign_api.lua` - 签名 API 接口

**作用**: 提供 HTTP 接口，接收客户端请求并生成应用 DPoP Token。

**接口路径**: `/lua/sign_code`

**请求参数**:
- URL 参数: `jti` (JWT ID)
- 请求体: JSON 格式
  ```json
  {
    "code": "authorization_code",
    "grantType": "authorization_code"
  }
  ```

**处理流程**:
1. 验证请求方法（仅支持 POST）
2. 验证必要参数（`jti`、`code`、`grantType`）
3. 从配置中获取活动的密钥
4. 计算 PHA（Payload Hash Algorithm）
5. 构建 JWT Payload（包含 `htu`、`htm`、`acd`、`pha`、`jti`、`iat`、`exp`）
6. 调用 `sign.generate_jwt()` 生成 JWT Token
7. 返回 JSON 响应: `{ "token": "..." }`

#### `lua/keys/` - 密钥文件目录

**作用**: 存储应用密钥文件。

**文件说明**:
- `iam-key-id.txt`: IAM Key ID（纯文本）
- `iam-public-key.pem`: IAM 公钥（PEM 格式，用于前端验证）
- `public-key.der`: 应用公钥（DER 格式，用于 Lua 脚本）
- `private-key.der`: 应用私钥（DER 格式，用于 Lua 脚本签名）

**安全注意**: 私钥文件不应提交到版本控制系统，应通过挂载卷或密钥管理服务提供。

### nginx 目录

Nginx 配置目录提供 OpenResty 的配置文件模板和启动脚本。

#### `nginx/default.conf.template` - Nginx 配置模板

**作用**: Nginx 配置文件模板，使用环境变量占位符，运行时通过 `envsubst` 替换。

**主要配置**:

1. **Lua 脚本路径**:
   ```nginx
   lua_package_path '/usr/local/openresty/nginx/lua/?.lua;;';
   ```

2. **签名接口** (`${CONTEXT_PATH}/lua/sign_code`):
   - 处理 CORS 预检请求（OPTIONS）
   - 执行 Lua 脚本 `sign_api.lua`

3. **密钥接口**:
   - `${CONTEXT_PATH}/keys/iam-key-id`: 返回 IAM Key ID（纯文本）
   - `${CONTEXT_PATH}/keys/iam-public-key`: 返回 IAM 公钥（PEM 格式）

4. **API 代理**:
   - `${CONTEXT_PATH}/api/`: 代理到 API 网关
   - `${CONTEXT_PATH}/auth/`: 代理到 IAM 服务
   - `${CONTEXT_PATH}/doc/`: 代理到文档服务

5. **静态资源**:
   - JS/CSS 文件: 缓存 1 小时
   - 图片资源: 缓存 30 天
   - 字体文件: 添加 CORS 头

6. **SPA 路由支持**:
   ```nginx
   location / {
       rewrite ^${CONTEXT_PATH}(.*)$ /$1 break;
       try_files $uri $uri/ /index.html;
       root /usr/local/openresty/nginx/html/;
   }
   ```

**环境变量**:
- `${CONTEXT_PATH}`: 应用基础路径（如 `/main`）
- `${SERVER_PORT}`: Nginx 监听端口
- `${GATEWAY_HOST}`: API 网关主机
- `${GATEWAY_PORT}`: API 网关端口
- `${IAM_HOST}`: IAM 服务主机
- `${IAM_PORT}`: IAM 服务端口

#### `nginx/docker-entrypoint.sh` - Docker 启动脚本

**作用**: Docker 容器启动时执行的脚本，用于替换 Nginx 配置中的环境变量和运行时环境变量。

**执行流程**:
1. 设置默认值（`SERVER_PORT`、`CONTEXT_PATH`、`SSO_BASE_URL`）
2. 使用 `envsubst` 替换 Nginx 配置模板中的环境变量
3. 使用 `envsubst` 替换 `env-config.json` 中的占位符（`${SSO_BASE_URL}`）
4. 执行传入的命令（通常是 `nginx -g daemon off;`）

**运行时环境变量替换**:
- 只替换 `env-config.json` 文件中的 `${SSO_BASE_URL}` 占位符
- 更高效、更安全、更易维护
- 支持在容器启动时动态配置 `SSO_BASE_URL`，无需重新构建镜像

### Dockerfile

Dockerfile 采用多阶段构建，将前端构建和 OpenResty 运行时分离。

#### 阶段 1: 前端构建

**基础镜像**: `node:20-alpine`

**构建流程**:
1. 设置 npm 镜像源（国内加速）
2. 安装依赖（`npm install --legacy-peer-deps`）
3. 复制项目文件
4. 根据 `VITE_BUILD_MODE` 执行构建（`npx vite build --mode $VITE_BUILD_MODE`）
5. Vite 插件 `envConfigPlugin` 在构建完成后生成 `public/env-config.json`（包含占位符）

**构建参数**:
- `VITE_BUILD_MODE`: 构建模式（如 `production`、`development`）

**Vite 插件**:
- **`vite-plugin-env-config`**: 生成运行时环境配置文件 `public/env-config.json`，包含占位符 `${SSO_BASE_URL}`

**输出**: 构建产物输出到 `dist/` 目录，包括 `env-config.json` 文件

#### 阶段 2: OpenResty 运行时

**基础镜像**: `openresty/openresty:alpine`

**安装依赖**:
- 构建工具（`build-base`、`pkgconfig`）
- Lua 开发库（`lua5.1-dev`、`lua5.1`）
- OpenSSL 开发库（`openssl-dev`）
- LuaRocks（用于安装 Lua 包）

**安装 luaossl**:
- 从离线 tar.gz 文件安装 `luaossl`（ES256 签名支持）
- 安装到 OpenResty 的 Lua 路径

**复制文件**:
- 前端构建产物: `dist/` → `/usr/local/openresty/nginx/html/`
- Lua 脚本: `lua/` → `/usr/local/openresty/nginx/lua/`
- Nginx 配置模板: `nginx/default.conf.template` → `/etc/nginx/conf.d/`
- 启动脚本: `nginx/docker-entrypoint.sh` → `/`

**暴露端口**: 8080

**启动命令**:
- `ENTRYPOINT`: `/docker-entrypoint.sh`
- `CMD`: `nginx -g daemon off;`

### Docker 部署流程

1. **构建镜像**:
   ```bash
   docker build --build-arg VITE_BUILD_MODE=production -t g2rain-main-shell .
   ```

2. **运行容器**:
   ```bash
   docker run -d \
     -p 8080:8080 \
     -e CONTEXT_PATH=/main \
     -e SSO_BASE_URL=https://sso.example.com \
     -e GATEWAY_HOST=gateway.example.com \
     -e GATEWAY_PORT=8080 \
     -e IAM_HOST=iam.example.com \
     -e IAM_PORT=8080 \
     -e SERVER_PORT=8080 \
     -v ./lua/keys:/usr/local/openresty/nginx/lua/keys:ro \
     g2rain-main-shell
   ```

**运行时环境变量**:
- `CONTEXT_PATH`: 应用基础路径（如 `/main`），会替换 Nginx 配置中的 `${CONTEXT_PATH}` 占位符
- `SSO_BASE_URL`: SSO 跳转基础地址（不包含路径），会替换 `env-config.json` 中的 `${SSO_BASE_URL}` 占位符

3. **密钥文件挂载**:
   - 通过 `-v` 参数挂载密钥文件目录
   - 使用 `:ro` 只读模式，确保容器内无法修改密钥

## 📝 总结

G2Rain Main Shell 采用分层架构设计，通过清晰的目录结构实现了：

1. **平台能力复用**: platform 层提供可复用的平台能力
2. **运行时服务**: runtime 层提供认证、HTTP、微前端等核心服务
3. **通用工具**: shared 层提供通用工具函数
4. **主应用框架**: shell 层提供主应用的 UI 框架
5. **业务开发**: views 层提供业务页面开发空间
6. **签名服务**: lua 目录提供基于 OpenResty 的签名服务
7. **Web 服务器**: nginx 目录提供 Nginx 配置和代理服务
8. **容器化部署**: Dockerfile 提供多阶段构建和容器化部署方案

**核心设计亮点**:
- **单一数据源**: AppDefinition 和 RuntimeInstance 分别由 `app.store` 和 `runtime.store` 统一管理
- **Tab 驱动**: Tab 作为用户交互入口，驱动微应用实例的创建和管理
- **适配器模式**: 支持替换不同的微前端框架
- **运行时配置**: 支持 Docker 容器启动时动态配置环境变量

这种架构设计使得项目具有良好的可维护性、可扩展性和可测试性，同时支持灵活的部署方式。
