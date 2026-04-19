# ARCHITECTURE_SPEC.md

## 0. 目标

建立可持续扩展的分层架构，防止业务侵蚀平台能力，保证单向依赖与长期演进稳定性。

---

## 1. 技术栈（强制）

- Vue 3（Composition API）、TypeScript（禁止 any）、Element Plus、Vite、Pinia、Vue Router 4
- **必须遵守**：使用 `<script setup lang="ts">`，禁止 Options API，禁止 JavaScript 文件，类型必须显式声明，禁止隐式 any

---

## 2. 目录层次与依赖约束（强制）

### 目录角色

- `shared`：更底层的简单工具能力层，仅包含与业务无关的通用工具函数、常量等，可被任意上层复用
- `components`：纯组件层，所有项目公用，无业务耦合的 UI 组件、通用工具组件
- `platform`：平台能力层，同类型项目公用，权限、资源管理、应用编排、微前端、统一 HTTP 等平台级能力
- `runtime`：运行时组合层，当前项目的业务组合与适配层，路由装配、页面资源装配、业务初始化流程
- `shell`：与 `views` 同级的页面框架层，负责整体布局、导航框架、主应用壳组件，不承载具体业务逻辑
- `views`：业务页面层，具体的业务页面、路由视图，仅本项目内使用

### 单向依赖原则

- **允许**：`views -> runtime -> platform -> components`
- **禁止反向依赖**：
  - `components` 不得引用 `platform` / `runtime` / `views`
  - `platform` 不得引用 `runtime` / `views`
  - `runtime` 不得引用 `views`
- 任何违反单向依赖的 import（直接或间接）均视为架构违规

### 职责边界

- 业务域模型、业务 API、业务逻辑只能出现在 `runtime` / `views` 中，禁止下沉到 `platform` / `components`
- `platform` 只能提供领域无关的通用能力，不得依赖具体业务字段或业务流程
- `components` 中不得出现后端接口地址、业务 DTO、业务枚举等，只能通过 props / 事件与上层交互

### 模块对外单一出口（Public API）

- **强制要求**：每个模块（`components`、`platform`、`runtime` 下的子目录）必须通过统一的 `index.ts` 文件对外导出
- **禁止直接导入**：外部模块不得直接导入模块内部文件（如 `from './module/internal.ts'`），必须通过 `index.ts` 导出（如 `from './module'`）
- **导出规范**：
  - `index.ts` 只导出模块的公共接口（类型、函数、类、组件等）
  - 内部实现细节（工具函数、私有类型等）不得导出
  - 导出内容应保持稳定，避免频繁变更导致依赖方破坏
- **示例**：
  ```typescript
  // ✅ 正确：通过 index.ts 导出
  export { RemoteSelect } from './RemoteSelect';
  export type { FetchDataFunction } from './types';
  
  // ❌ 错误：直接导入内部文件
  import { RemoteSelect } from './RemoteSelect/index.vue';
  import type { FetchDataFunction } from './RemoteSelect/types';
  ```

### 复用与演进

- `views` / `runtime` 中的能力被多个项目复用时，应优先下沉到 `platform`（前提：去除业务耦合）
- `platform` 中出现业务强相关逻辑时，应及时上移到 `runtime`
- 引入新模块时，必须先判断所属层级，确保无反向依赖和跨层耦合

---

## 3. Views 层组织规范（强制）

### 3.1 目录结构

```
views/{module-name}/
  ├── index.vue    # 主页面组件（必需）
  ├── api.ts       # API 服务类（必需）
  ├── type.ts      # 类型定义（必需）
  └── mock.ts      # Mock 数据（可选）
```

### 3.2 API 服务类（`api.ts`）

- **类命名**：`{ModuleName}Api`（PascalCase）
- **方法规范**：所有方法必须是 `static`，使用 `getHttpClient('default')`，命名遵循 RESTful：`list`、`page`、`getById`、`save`、`remove`
- **类型约束**：使用 `@platform/types/api.type` 中的 `PageData`、`PageSelectListDto`，业务类型从同目录 `type.ts` 导入
- **Mock 集成**：文件顶部副作用导入 `import './mock';`

```typescript
import { getHttpClient } from '@/components/http';
import type { Passport, PassportPayload, PassportQuery } from './type';
import type { PageData, PageSelectListDto } from '@platform/types/api.type';
import './mock';

export class PassportApi {
  private static http = getHttpClient('default');
  static async page(params: PassportQuery & PageSelectListDto): Promise<PageData<Passport>> {
    const res = await this.http.get<PageData<Passport>>('/passport/page', params);
    return res.data;
  }
}
```

### 3.3 类型定义（`type.ts`）

- **命名规范**：实体类型 `{ModuleName}`、负载类型 `{ModuleName}Payload`、查询类型 `{ModuleName}Query`
- **继承约束**：实体类型继承 `BaseVo`，查询类型继承 `BaseSelectListDto`（均来自 `@platform/types/api.type`）
- **字段规范**：实体类型包含业务字段和审计字段（id、version、createTime、updateTime），Payload 不包含审计字段，`id` 可选（有 id 为更新，无 id 为新增）

```typescript
import type { BaseSelectListDto, BaseVo } from '@platform/types/api.type';

export interface Passport extends BaseVo {
  username: string;
  realName: string;
}

export interface PassportPayload {
  id?: number;
  username?: string;
  realName?: string;
}

export interface PassportQuery extends BaseSelectListDto {
  username?: string;
  realName?: string;
}
```

### 3.4 页面组件（`index.vue`）

- 使用 `<script setup lang="ts">`，导入同目录的 `api.ts` 和 `type.ts`
- 禁止在组件中直接定义业务类型或 API 调用逻辑
- 可导入 `@/components`、`@platform`、`@runtime`，禁止导入其他 `views` 目录下的模块

### 3.5 Mock 数据（`mock.ts`，可选）

- 使用 `mockManager`（来自 `@/components/http/mock-data`）注册，数据符合 `Result<T>` 格式
- 使用 `Mock.js` 生成随机数据，确保与 `type.ts` 类型一致
- 仅开发环境生效

```typescript
import { mockManager } from '@/components/http/mock-data';
import Mock from 'mockjs';

mockManager.register('/passport/list', 'get', (config) => {
  return { data: Mock.mock({ 'list|10': [/* ... */] }).list };
});
```

### 3.6 路由注册

- 所有页面在 `views/route-map.ts` 中注册
- 路由路径格式：`/main/{module}/{page}`（必须以 `/` 开头）
- 使用动态导入实现代码分割：`() => import('@/views/{module}/index.vue')`

```typescript
export const routeComponentMap: Record<string, () => Promise<any>> = {
  '/main/system/passport': () => import('@/views/passport/index.vue'),
};
```
