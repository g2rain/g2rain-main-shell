# g2rain-main-shell

## 1. 徽标与状态标识
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![qiankun](https://img.shields.io/badge/qiankun-2.x-1f6feb)](https://qiankun.umijs.org/)

## 2. 项目简介
`g2rain-main-shell` 是 G2rain 平台的主壳前端仓库，负责承载平台控制台主应用、子应用装载、统一导航与运行时交互能力，并与交互接入侧安全链路协同工作。

## 3. 平台定位

在 G2rain“企业级 AI 原生开源 SaaS 平台”体系中，`g2rain-main-shell` 位于交互接入层，是平台“应用化接入模式”的核心承载仓库之一。

它主要承担以下角色：
- 作为主应用承载平台控制台统一入口
- 作为子应用装载容器承载微前端编排
- 作为统一交互入口承载菜单、路由、Tab、SSO 与运行时状态
- 作为交互接入层安全协同节点，与网关、OpenResty、Lua、IAM 共同形成前端与 API 的身份管理与安全链路

它与 `g2rain-iam`、`g2rain-basis`、`g2rain-infra` 等仓库协同，共同构成平台统一身份、统一交互、统一资源权限呈现与统一应用接入体系。

## 4. 核心能力

- 主壳入口与微前端装载编排：解决“平台如何把多个子应用组织成一个统一入口”的问题，通过 `qiankun`、`single-spa`、`src/platform/apps` 与 `src/components/micro-app` 统一装载子应用、传递运行时上下文、承接壳层布局和工作区容器，是整个平台前端应用化落地的装载中枢。
- SSO、Token 与登录回调主链路：解决主壳与 IAM 之间的单点登录、令牌建立、回调跳转和登录态持久化问题，通过 `src/runtime/auth`、`src/runtime/boot`、`src/platform/stores` 形成从登录入口到运行期状态恢复的统一认证链路，是子应用共享身份能力的前提。
- 菜单、路由、Tab 与导航工作区：解决“多应用、多页面场景下如何保持一致交互体验”的问题，通过 `src/runtime/router`、`src/runtime/navigation`、`src/shell/layout`、`src/shell/pages` 管理菜单、标签页、工作区和重定向逻辑，让用户在主壳内完成跨应用切换而不失去上下文。
- 前端与 API 安全协同链路：解决主壳请求如何与网关、OpenResty、Lua、IAM 协同完成签名和安全访问的问题，通过 `src/components/http`、`lua/`、`nginx/`、运行时环境变量与签名脚本协同工作，让前端请求不仅能发出去，还能进入平台既定的身份与安全链路。
- 平台运行时状态与共享能力底座：解决主题、国际化、平台应用模型、共享状态和轻量工具能力分散的问题，通过 `src/platform`、`src/shared`、`src/runtime/store` 把主壳需要长期复用的状态、类型和工具沉淀下来，为子应用接入与壳层演进提供稳定基础。
- 运行模式、Mock 与环境注入：解决开发环境、测试环境、容器环境之间配置差异大、联调成本高的问题，通过 `.env*`、`env-config.js`、`docker-entrypoint.sh`、Mock 数据与 Vite 代理能力，把“本地开发、联调验证、容器部署”三种运行方式拉到统一工程模型中。
- 容器化交付与接入侧部署支撑：解决主壳如何以平台标准方式进入部署环境的问题，通过 `Dockerfile`、`build.sh`、`nginx/default.conf.template` 与 OpenResty 运行环境，把前端产物、运行时变量和安全脚本打包成可部署单元。

## 5. 技术栈

- 前端框架：`Vue 3`、`TypeScript`
- 构建工具：`Vite`
- 微前端能力：`qiankun`、`single-spa`
- UI 与状态管理：`Element Plus`、`Pinia`
- 路由与网络：`Vue Router`、`Axios`
- 安全相关：`jose`、`elliptic`、`crypto-js`
- 交互接入协同：`OpenResty`、`Lua`、`Nginx`
- 环境要求：`Node 22+`

## 6. 快速开始
### 环境要求

- `Node.js >= 22`
- `npm >= 9`
- `Docker`（可选，用于容器化交付）

### 环境变量

仓库当前同时使用构建时环境变量与运行时环境变量：
- 构建时变量主要来自 `.env`、`.env.production`
- 运行时变量通过 `env-config.js` 与 `nginx/docker-entrypoint.sh` 注入，用于容器部署后的动态替换

当前主要变量如下：

| 变量名 | 说明 | 典型用途 |
| --- | --- | --- |
| `VITE_BUILD_MODE` | 前端构建模式 | 区分 `development` / `production` 构建 |
| `VITE_APPLICATION_CODE` | 应用编码 | 主壳身份标识、请求头与应用协同 |
| `VITE_CONTEXT_PATH` | 上下文路径 | 控制 `base`、路由前缀、静态资源路径 |
| `VITE_BACKEND_ORIGIN` | 后端服务地址 | 本地 `vite` 开发代理目标 |
| `VITE_TOKEN_END_POINT` | Token 接口路径 | Token 创建与刷新 |
| `VITE_SSO_BASE_URL` | SSO 基础地址 | 登录跳转与回调协同 |
| `VITE_AUTH_END_POINT` | SSO 认证路径 | 拼接认证地址 |
| `VITE_REDIRECT_URI` | SSO 回调路径 | 认证回跳页面 |
| `VITE_MOCK_ENABLED` | 是否启用 Mock | 本地联调与模拟数据开关 |
| `VITE_SERVER_PORT` | 本地开发端口 | `vite dev` 端口配置 |
| `VITE_DINGTALK_BIND_MODE` | 钉钉绑定模式 | 绑定流程切换 |
| `VITE_I18N_TAGS` | 国际化文案包标签 | 拉取平台文案包 |

运行时部署时还会使用以下非 `VITE_` 变量：

| 变量名 | 说明 | 典型用途 |
| --- | --- | --- |
| `SSO_BASE_URL` | 运行时 SSO 地址 | 替换容器内 `env-config.js` 占位符 |
| `CONTEXT_PATH` | 运行时上下文路径 | 渲染 Nginx / OpenResty 配置 |
| `SERVER_PORT` | 容器监听端口 | 控制容器内服务端口 |
| `GATEWAY_HOST` / `GATEWAY_PORT` | 网关地址 | 渲染网关转发配置 |
| `IAM_HOST` / `IAM_PORT` | IAM 地址 | 渲染认证相关转发配置 |

建议：
- `VITE_CONTEXT_PATH` 在构建期与部署期保持一致
- 生产环境优先通过运行时注入方式覆盖敏感或易变配置
- README 仅说明变量职责，不公开真实生产密钥与内部安全细节

### 安装依赖

```bash
npm install
```

### 本地开发
```bash
npm run dev
```

默认可通过 `http://localhost:3000` 访问。

### 生产构建

```bash
npm run build
```

构建产物默认输出到 `dist/` 目录。

### 直接使用 `Dockerfile` 构建镜像

```bash
docker build -t g2rain/g2rain-main-shell:latest .
docker build --build-arg VITE_BUILD_MODE=production -t g2rain/g2rain-main-shell:latest .
```

### 使用 `build.sh` 构建镜像

仓库根目录提供了 `build.sh`，用于一键构建前端镜像。

```bash
./build.sh
./build.sh --image g2rain/g2rain-main-shell --tag latest --build-mode production
```

脚本支持：
- 自定义镜像名 `--image`
- 自定义标签 `--tag`
- 自定义构建模式 `--build-mode`

## 7. 项目结构

```text
g2rain-main-shell/
├── src/                   # 主壳应用源码、运行时、平台与组件能力
├── public/                # 公共静态资源
├── lua/                   # 前端/API 安全协同相关 Lua 脚本与密钥文件
├── nginx/                 # Nginx / OpenResty 启动与模板配置
├── build.sh               # 一键构建 Docker 镜像
├── Dockerfile             # 主壳容器化构建文件
├── vite.config.ts         # Vite 构建与代理配置
└── package.json           # 前端依赖与脚本入口
```

### `src` 模块说明

- `src/assets`：品牌资源与静态素材，如主壳 Logo 等。
- `src/components`：可复用基础组件与通用能力，重点承载 `http`、`micro-app`、`loading`、`error` 等底层能力。
- `src/platform`：平台级抽象能力，包括应用模型、主题、国际化、类型定义与状态管理，是主壳长期复用的壳层能力底座。
- `src/runtime`：主壳运行时装配层，负责启动流程、路由、认证、导航、接口访问与 mock 引导，是主壳真正“跑起来”的流程中心。
- `src/shared`：跨层共享工具与轻量封装，例如环境变量、URL、JWT、HTTP 辅助方法。
- `src/shell`：主壳界面与布局实现，包括主框架、菜单、页签、工作区与壳层组件。
- `src/views`：具体页面视图与业务型前端页面，包括认证回调、跳转、租户开通、通行证等页面。

### 关键子模块

- `src/components/http`：统一 HTTP 客户端、拦截器、签名、Mock 数据与错误处理，是主壳请求链路与安全协同的落点。
- `src/components/micro-app`：微前端通信、事件适配与子应用消息处理，是主壳与子应用运行期协作的桥接层。
- `src/platform/apps`：平台应用模型与 `qiankun` 子应用接入抽象。
- `src/platform/stores`：平台核心状态仓库，如菜单、主题、Token、Tab、运行时信息。
- `src/runtime/auth`：SSO 登录、回调、Token 建立与刷新链路。
- `src/runtime/navigation`：导航跳转与子应用重定向逻辑。
- `src/runtime/router`：主壳路由注册、鉴权与历史路由基座。
- `src/shell/layout`：主壳布局骨架，如 `Header`、`Sidebar`、`TabBar`、`MicroAppPage`。
- `src/views/auth`、`src/views/redirect`、`src/views/passport`、`src/views/tenant_provision`：承载登录回调、跳转、通行证与租户开通等平台关键页面。

### 核心业务流程介绍

#### 1. 主壳装载与子应用编排主线
- 主壳先启动自身布局、菜单、路由和运行时状态
- 再根据平台资源与应用配置，决定子应用何时被装载到工作区
- 子应用不是独立乱入，而是由主壳统一承接路径、容器、上下文与消息通道
- 这一主线保证了“平台是一个统一入口，子应用是受控接入”这套应用化模式能够稳定落地

#### 2. SSO 登录与 Token 建立主线
- 用户进入主壳后，由 `src/runtime/auth` 判断当前登录态与回调状态
- 主壳与 IAM 协同完成登录跳转、授权回调、Token 建立与持久化
- 后续子应用不需要各自独立重复整套登录入口，而是优先复用主壳已建立的身份上下文
- 这一主线是平台统一身份体验成立的前提

#### 3. 菜单、Tab 与工作区导航主线
- 主壳基于资源和权限结果组织菜单与页面入口
- 页面访问并不只是路由跳转，还会同步影响 Tab、面包屑、工作区与子应用装载状态
- 因此主壳承担的是“统一交互编排器”角色，而不只是一个普通 Vue 容器

#### 4. 前端与 API 安全协同主线
- 主壳请求链路通过 `src/components/http` 承接请求封装、错误处理、签名协同与 Mock 切换
- `lua/` 与 `nginx/` 配合 OpenResty 在运行环境中处理 IAM 公钥、应用私钥、签名能力与转发配置
- 这一主线解决的是“主壳如何进入平台既定安全链路”，而不是单纯发起 HTTP 请求

## 8. 常用命令

```bash
# 启动本地开发环境
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 检查代码规范
npm run lint

# 自动修复规范问题
npm run lint:fix

# 格式化代码
npm run format

# 使用脚本构建镜像
./build.sh

# 自定义镜像参数构建
./build.sh --image g2rain/g2rain-main-shell --tag latest --build-mode production
```

## 9. 质量与测试
- 当前仓库已配置 `lint`、`lint:fix`、`format` 等前端质量命令，但当前扫描结果未识别到独立测试目录
- 当前质量保障主要依赖 TypeScript 编译、ESLint、主壳运行验证、子应用联调与容器部署验证
- 后续建议优先补充登录回调、子应用装载、导航重定向与安全链路相关的关键回归测试

## 10. 相关仓库

- `g2rain-app-template`：官方子应用模板仓库
- `g2rain-app-cli`：子应用初始化 CLI
- `g2rain-iam`：统一身份认证与令牌治理能力
- `g2rain-basis`：平台资源、应用与权限治理底座
- `g2rain-infra`：平台基础设施与共享服务能力

## 11. 使用建议

- 适合作为平台统一主入口与子应用装载壳层使用，而不是把业务页面长期堆在主壳内部
- 如果要新增子应用接入能力，建议优先理解“主壳装载、导航、认证、安全协同”四条主线
- 如果要新增壳层页面，建议仍保持 `runtime / platform / shell / views / shared` 的分层边界
- 生产环境部署时，应优先使用运行时配置注入方式管理易变地址与接入参数

## 12. 贡献指南

欢迎以 Issue、文档改进、测试补充、代码优化、功能增强等形式参与贡献。

建议流程：

1. Fork 本仓库
2. 创建特性分支
3. 提交修改
4. 推送分支
5. 提交 Pull Request

提交前请尽量确保：
- 遵循现有技术栈与代码规范
- 补充必要测试
- 更新相关文档
- 确保测试通过

## 13. 许可证

本项目基于 [Apache 2.0许可证](LICENSE) 开源。

## 14. 联系我们

- **站点**: https://www.g2rain.com/
- **Issues**: [GitHub Issues](https://github.com/g2rain/g2rain/issues)
- **讨论**: [GitHub Discussions](https://github.com/g2rain/g2rain/discussions)
- **邮箱**: g2rain_developer@163.com

## 15. 致谢

感谢所有为这个项目做出贡献的开发者们。

如果这个项目对您有帮助，欢迎 Star 支持。