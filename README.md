# G2Rain Main Shell - 管理后台框架应用

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

一个基于 Vue3 + TypeScript + qiankun 的管理后台框架应用，提供 Token 管理、SSO 单点登录、微前端应用装载等核心功能。

**生态**：子应用官方模板见 [g2rain-app-template](https://github.com/g2rain/g2rain-app-template)；可使用脚手架 [create-g2rain-app](https://github.com/g2rain/g2rain-app-cli) 生成子应用工程。本仓库为 **qiankun 主壳**，负责布局、菜单与子应用装载等。

## 📋 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [业务开发指南](#业务开发指南)
- [Mock 数据开发](#mock-数据开发)
- [构建与部署](#构建与部署)
- [架构说明](#架构说明)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)
- [联系我们](#-联系我们)
- [致谢](#-致谢)

## 🎯 项目简介

G2Rain Main Shell 是一个企业级管理后台框架应用，主要提供以下核心能力：

- **Token 管理**：基于 JWT 和 DPoP 协议的 Token 生成、验证和刷新
- **SSO 单点登录**：集成 g2rain-iam 的 SSO 认证流程，支持授权码模式
- **微前端架构**：基于 qiankun 的微前端应用装载和管理
- **多 TabTypes 管理**：支持主应用和子应用的 TabTypes 页面管理
- **安全签名**：使用 ES256 算法进行请求签名，确保 API 安全

## 🛠 技术栈

### 前端技术栈

- **框架**：Vue 3.3.4 + TypeScript 5.4.5
- **构建工具**：Vite 5.0.0
- **微前端**：qiankun 2.10.14
- **UI 组件库**：Element Plus 2.4.3
- **状态管理**：Pinia 2.1.7 + pinia-plugin-persistedstate 3.2.1
- **路由**：Vue Router 4.2.5
- **HTTP 客户端**：Axios 1.12.2
- **加密库**：jose 6.1.0、crypto-js 4.2.0、elliptic 6.6.1
- **Mock 工具**：mockjs 1.1.0

### 后端技术栈

- **Web 服务器**：OpenResty (Nginx + Lua)
- **Lua 库**：lua-resty-openssl（ES256 签名支持）
- **签名算法**：ES256 (ECDSA P-256 + SHA-256)

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Docker（可选，用于部署）

### 安装依赖

```bash
npm install
```

### 本地开发

1. 创建 `.env` 文件（参考 [环境配置](#环境配置)）

2. 启动开发服务器：

```bash
npm run dev
```

3. 访问应用：

打开浏览器访问 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 常见命令

项目提供了以下常用命令：

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建产物 |
| `npm run lint` | 检查代码规范 |
| `npm run lint:fix` | 检查并自动修复代码规范问题 |
| `npm run format` | 格式化代码（使用 Prettier） |

#### 代码检查

检查代码是否符合 ESLint 规范：

```bash
npm run lint
```

自动修复可修复的代码规范问题：

```bash
npm run lint:fix
```

#### 代码格式化

使用 Prettier 格式化代码：

```bash
npm run format
```

这会格式化 `src/` 目录下的所有 TypeScript、Vue、JavaScript、CSS、SCSS 和 Markdown 文件。

## ⚙️ 环境配置

### 环境变量说明

在项目根目录创建 `.env` 文件，配置以下环境变量：

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `VITE_APPLICATION_CODE` | 应用编码 | `g2rain-main-shell` | 是 |
| `VITE_CONTEXT_PATH` | 应用基础路径 | `/` 或 `/main` | 是 |
| `VITE_SSO_BASE_URL` | SSO 跳转基础地址（不包含路径） | `https://sso.example.com` | 是 |
| `VITE_AUTH_END_POINT` | SSO 认证端点 | `/auth/authorize` | 是 |
| `VITE_REDIRECT_URI` | SSO 回调地址 | `/sso_callback` | 是 |
| `VITE_TOKEN_END_POINT` | Token 生成/刷新接口路径 | `/auth/token` | 否 |
| `VITE_MOCK_ENABLED` | 是否启用 Mock | `true` 或 `false` | 否 |

### 环境变量配置示例

**开发环境** (`.env`):

```env
VITE_APPLICATION_CODE=g2rain-main-shell
VITE_CONTEXT_PATH=/
VITE_SSO_BASE_URL=http://localhost:8080
VITE_AUTH_END_POINT=/auth/authorize
VITE_REDIRECT_URI=/sso_callback
VITE_MOCK_ENABLED=true
```

**生产环境** (`.env.production`):

```env
VITE_APPLICATION_CODE=g2rain-main-shell
VITE_CONTEXT_PATH=/main
VITE_SSO_BASE_URL=https://sso.example.com
VITE_AUTH_END_POINT=/auth/authorize
VITE_REDIRECT_URI=/sso_callback
VITE_MOCK_ENABLED=false
```

### 运行时环境变量配置

项目支持**运行时环境变量配置**，允许在 Docker 容器启动时动态配置环境变量，无需重新构建镜像。

#### 工作原理

1. **构建阶段**：
   - Vite 插件 `vite-plugin-env-config` 在构建完成后生成 `dist/env-config.js`
   - 文件包含占位符 `__CONTEXT_PATH__` 和 `__SSO_BASE_URL__`

2. **运行阶段**：
   - `docker-entrypoint.sh` 读取 Docker 环境变量
   - 替换 `env-config.js` 中的占位符为实际值

3. **应用启动**：
   - `index.html` 在应用脚本加载前加载 `env-config.js`
   - 代码优先使用 `window._env_`（运行时配置），如果没有则使用 `import.meta.env`（构建时配置）

#### Docker 运行时配置

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
  g2rain-main-shell
```

### 环境变量使用

在代码中通过 `@runtime/env` 访问环境变量：

```typescript
import { env } from '@runtime/env';

console.log(env.VITE_APPLICATION_CODE);
console.log(env.VITE_CONTEXT_PATH);
console.log(env.VITE_MOCK_ENABLED);
```

环境变量读取优先级：
1. **运行时配置** (`window._env_`) - 用于 Docker 容器运行时替换
2. **构建时配置** (`import.meta.env`) - 用于本地开发
3. **默认值** - 如果以上都不存在

## 💼 业务开发指南

`views` 目录是主要的业务开发目录，所有业务模块都在此目录下开发。

### 目录结构

```
views/
├── api/              # API 服务层
│   ├── user.api.ts  # 用户 API
│   ├── user.type.ts # 用户类型定义
│   ├── role.api.ts  # 角色 API
│   └── role.type.ts # 角色类型定义
├── user/             # 用户模块
│   └── UserList.vue # 用户列表页面
├── role/             # 角色模块
│   └── RoleList.vue # 角色列表页面
└── route-map.ts      # 路由映射配置
```

### 开发新模块示例

以 `User` 和 `Role` 模块为例，说明如何开发新模块：

#### 1. 创建类型定义文件

在 `views/api/` 目录下创建类型定义文件，例如 `user.type.ts`：

```typescript
/**
 * 用户信息类型定义
 */
export interface UserInfo {
  id: number;
  name: string;
  role: string;
  status: string;
}
```

#### 2. 创建 API 服务文件

在 `views/api/` 目录下创建 API 服务文件，例如 `user.api.ts`：

```typescript
/**
 * 用户相关 API 服务
 */
import { http } from '@runtime/http';
import type { UserInfo } from './user.type';

export class UserApi {
  /**
   * 获取用户列表
   */
  static async list(params?: Record<string, any>): Promise<UserInfo[]> {
    const res = await http.get<UserInfo[]>('/user/list', params, {
      headers: {
        'x-g2rain-mock': 'true'  // 开发时使用 Mock 数据
      }
    });
    return res.data || [];
  }
}
```

#### 3. 创建页面组件

在 `views/` 目录下创建模块目录和页面组件，例如 `views/user/UserList.vue`：

```vue
<template>
  <div class="user-container">
    <h2>用户管理</h2>
    <el-table :data="tableData" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="role" label="角色" />
      <el-table-column prop="status" label="状态" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { UserApi } from '../api/user.api';
import type { UserInfo } from '../api/user.type';

const tableData = ref<UserInfo[]>([]);

onMounted(async () => {
  try {
    tableData.value = await UserApi.list();
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }
});
</script>

<style scoped>
.user-container {
  padding: 20px;
}
</style>
```

#### 4. 配置路由映射

在 `views/route-map.ts` 中添加路由映射：

```typescript
export const routeComponentMap: Record<string, () => Promise<any>> = {
  // 系统管理
  '/system/user': () => import('@/views/user/UserList.vue'),
  '/system/role': () => import('@/views/role/RoleList.vue'),

  // 添加新模块路由
  '/system/your-module': () => import('@/views/your-module/YourModuleList.vue'),
};
```

#### 5. 完整示例参考

- **User 模块**：
  - 类型定义：`views/api/user.type.ts`
  - API 服务：`views/api/user.api.ts`
  - 页面组件：`views/user/UserList.vue`
  - Mock 数据：`runtime/http/mock/data/user.api.ts`

- **Role 模块**：
  - 类型定义：`views/api/role.type.ts`
  - API 服务：`views/api/role.api.ts`
  - 页面组件：`views/role/RoleList.vue`
  - Mock 数据：`runtime/http/mock/data/role.api.ts`

### 开发规范

1. **目录命名**：使用小写字母，多个单词用连字符分隔（如 `user-list`）
2. **文件命名**：
   - 类型定义：`*.type.ts`
   - API 服务：`*.api.ts`
   - 页面组件：`*.vue`（使用 PascalCase，如 `UserList.vue`）
3. **API 调用**：统一使用 `@runtime/http` 的 `http` 实例
4. **类型定义**：所有接口数据类型都应在 `views/api/*.type.ts` 中定义

## 🎭 Mock 数据开发

项目提供了灵活的 Mock 系统，支持在开发时使用 Mock 数据。

### Mock 启用方式

#### 方式一：环境变量控制

在 `.env` 文件中设置：

```env
VITE_MOCK_ENABLED=true
```

启用后，所有 API 请求都会优先使用 Mock 数据（如果存在）。

#### 方式二：请求头强制 Mock

在 API 调用时添加请求头：

```typescript
const res = await http.get('/user/list', params, {
  headers: {
    'x-g2rain-mock': 'true'  // 强制使用 Mock 数据
  }
});
```

**注意**：如果 `x-g2rain-mock` 为 `true` 但 Mock 数据不存在，会抛出错误。

### 创建 Mock 数据

#### 1. 创建 Mock 数据文件

在 `runtime/http/mock/data/` 目录下创建 Mock 数据文件，例如 `user.api.ts`：

```typescript
/**
 * 用户相关 Mock 接口
 */
import type { MockDataMap } from '../index';
import type { ResponseData } from '../../types';

/**
 * 用户列表 Mock 数据
 */
const userListMock: ResponseData = {
  requestId: 'mock-user-list-request-id',
  requestTime: new Date().toISOString(),
  status: 200,
  errorCode: '',
  errorMessage: '',
  data: [
    { id: 1, name: '张三', role: '管理员', status: '正常' },
    { id: 2, name: '李四', role: '普通用户', status: '正常' },
    { id: 3, name: '王五', role: '访客', status: '禁用' }
  ],
} as ResponseData;

/**
 * 用户相关 Mock 接口配置
 */
export const userMockDataMap: MockDataMap = {
  // GET /user/list - 获取用户列表
  '/user/list': userListMock,

  // 支持通配符格式（如 /main/user/list）
  '/*/user/list': userListMock,
};
```

#### 2. 注册 Mock 数据

在 `runtime/http/mock/data.ts` 中导入并注册：

```typescript
import { userMockDataMap } from './data/user.api';

export const mockDataMap: MockDataMap = {
  ...userMockDataMap,
  // 其他 Mock 数据...
};
```

### Mock 数据格式

Mock 数据需要符合 `ResponseData` 格式：

```typescript
interface ResponseData<T> {
  requestId: string;
  requestTime: string;
  status: number;
  errorCode: string | null;
  errorMessage: string | null;
  data: T;
}
```

### Mock 数据支持的功能

1. **静态数据**：直接返回固定的数据对象
2. **函数式 Mock**：根据请求参数动态生成数据
3. **通配符匹配**：支持 `/*` 通配符匹配 URL（如 `/main/user/list`）

### 示例：函数式 Mock

```typescript
export const userMockDataMap: MockDataMap = {
  '/user/list': (config) => {
    // 根据请求参数动态生成数据
    const params = config.params || {};
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;

    return {
      requestId: 'mock-request-id',
      requestTime: new Date().toISOString(),
      status: 200,
      errorCode: null,
      errorMessage: null,
      data: {
        page,
        pageSize,
        total: 100,
        records: [
          // 生成数据...
        ]
      }
    };
  }
};
```

## 🎨 主题系统

项目支持运行时主题切换，提供三种主题模式：

- **light**：亮色主题（默认）
- **dark**：暗色主题
- **g2rain**：品牌主题

### 主题切换

在 `Header.vue` 中提供了主题切换下拉菜单，用户可以随时切换主题。主题选择会自动保存到 `localStorage`，下次访问时会自动应用。

### 主题架构

主题系统采用 CSS 变量和 `data-theme` 属性实现：

- **`platform/theme/`**：主题核心（类型定义、主题 CSS、Element Plus 映射）
- **`platform/styles/`**：样式系统（基础样式、变量、入口）
- **`platform/stores/theme.store.ts`**：主题状态管理（Pinia）

详细说明请参考 [架构说明文档](./architecture.md#platform-目录)。

## 🐳 构建与部署

### Docker 构建

```bash
docker build --build-arg VITE_BUILD_MODE=production  -t g2rain/g2rain-main-shell .
```

### Docker 运行

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

**环境变量说明**：
- `CONTEXT_PATH`：应用基础路径（如 `/main`），会替换构建产物中的 `__CONTEXT_PATH__` 占位符
- `SSO_BASE_URL`：SSO 跳转基础地址（不包含路径），会替换构建产物中的 `__SSO_BASE_URL__` 占位符
- `GATEWAY_HOST`、`GATEWAY_PORT`：API 网关地址和端口
- `IAM_HOST`、`IAM_PORT`：IAM 服务地址和端口
- `SERVER_PORT`：Nginx 监听端口（默认 80）

详细部署说明请参考 [架构说明文档](./architecture.md)。

## 📚 架构说明

详细的架构说明请参考 [architecture.md](./architecture.md)，包括：

- 项目结构说明
- 核心目录详解（platform、runtime、shared、shell）
- 主题系统架构
- 应用生命周期管理（Loader）
- 运行时环境变量配置机制
- 数据流说明
- 关键设计模式

## 🤝 贡献指南

我们欢迎所有形式的贡献！

**Issue 与讨论**请统一到主仓库 [g2rain/g2rain](https://github.com/g2rain/g2rain/issues) 提交，便于集中跟踪；请在标题或正文中注明与 **g2rain-main-shell** 相关。

### 贡献流程

1. **Fork** 本仓库
2. **创建特性分支**：`git checkout -b feature/your-feature-name`
3. 本地修改后执行 `npm run build` 与 `npm run lint`，确保可通过编译与规范检查
4. **提交更改**：`git commit -m "Add some feature"`
5. **推送分支**：`git push origin feature/your-feature-name`
6. **提交 Pull Request**

维护者信息与 `package.json` 中 `contributors` 字段一致（与 [g2rain-spring-boot-starter](https://github.com/g2rain/g2rain-spring-boot-starter) 开发者信息对齐）。

安全相关问题请见 [SECURITY.md](SECURITY.md)。

## 📄 许可证

本项目基于 [Apache 2.0许可证](LICENSE) 开源。

## 📞 联系我们

- **Issues**: [GitHub Issues](https://github.com/g2rain/g2rain/issues)
- **讨论**: [GitHub Discussions](https://github.com/g2rain/g2rain/discussions)
- **邮箱**: g2rain_developer@163.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者们！

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！
