## HTTP 客户端重构说明

本目录是在不动现有 `src/runtime/http` 实现的前提下，对 HTTP 客户端能力进行**组件化和解耦重构**的实验性实现，后续可以逐步替换旧实现。

### 设计目标

- **解耦职责**：将拦截器、错误处理、参数序列化、请求体序列化拆分到独立文件，避免单文件过于膨胀。
- **统一类型定义**：通过集中定义 `HttpClient` 及实例类型，便于在业务层复用和约束。
- **可扩展实例工厂**：提供统一的工厂方法，可以按需创建不同用途的 HTTP 客户端实例（如默认客户端、认证客户端、无需 Token 的公共客户端等）。
- **兼容旧实现**：暂不删除 `src/runtime/http`，新旧实现可以并行存在，逐步迁移。

### 目录结构

- `README.md`：当前说明文档。
- `types.ts`：`HttpClient` 及实例、工厂相关类型定义。
- `params-serializer.ts`：GET 请求 `paramsSerializer` 的统一实现。
- `request-body.ts`：请求体序列化（`multipart/form-data`、`application/x-www-form-urlencoded` 等）实现。
- `interceptors.ts`：拦截器装配（目前复用 `src/runtime/http/interceptors`）。
- `error-handler.ts`：错误处理相关导出（目前复用 `src/runtime/http/error-handler`）。
- `index.ts`：默认导出入口，负责装配 Axios 实例、挂载拦截器与序列化逻辑，并提供获取不同类型客户端实例的工厂方法。

### 使用方式（示例）

```ts
import { getHttpClient } from '@/components/http';

const http = getHttpClient('default');

async function fetchUser() {
  const res = await http.get<User>('/api/user/profile');
  return res.data;
}
```

后续如果需要专门的认证客户端（例如自动携带特定 Header、走不同的拦截器配置），可以在 `index.ts` 中扩展新的 client 类型，而不影响现有调用方式。***
