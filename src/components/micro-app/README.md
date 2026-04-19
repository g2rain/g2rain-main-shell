# Micro App 事件组件

微前端事件组件，提供类型安全的事件系统，用于主应用与子应用之间的通信。

## 使用方式

### 基本导入

```typescript
import {
  MicroAppEventType,
  MicroAppMessageFactory,
  type TokenRequestMessage,
  type RouteChangeMessage,
  isTokenRequestMessage,
} from '@/components/micro-app';
```

### 创建消息

```typescript
// 创建 Token 请求消息
const request = MicroAppMessageFactory.createTokenRequest(
  { someParam: 'value' },
  'req-123'
);

// 创建路由变化消息
const routeChange = MicroAppMessageFactory.createRouteChange({
  appKey: 'sub-app-1',
  activeRule: '/sub-app-1',
  routePath: '/test/dict',
  fullPath: '/sub-app-1/test/dict',
});
```

### 类型守卫使用

```typescript
function handleMessage(message: MicroAppMessageUnion) {
  if (isTokenRequestMessage(message)) {
    // TypeScript 知道这里是 TokenRequestMessage
    console.log(message.data); // 类型为 TokenRequestData
  } else if (isTokenResponseSuccessMessage(message)) {
    // TypeScript 知道这里是 TokenResponseSuccessMessage
    console.log(message.data.token); // 类型安全
  }
}
```

## 消息类型

### 事件类型枚举

- `REQUEST_TOKEN`: 子应用请求 token
- `TOKEN_RESPONSE`: 主应用返回 token
- `TOKEN_INVALID`: 子应用通知 token 失效
- `ROUTE_CHANGE`: 子应用路由变化

### 消息结构

所有消息都遵循统一的消息信封结构：

```typescript
interface MicroAppMessage<T extends MicroAppEventType, D = unknown> {
  type: T;              // 事件类型
  data: D;              // 消息数据
  requestId?: string;   // 请求 ID（用于匹配请求和响应）
  timestamp: number;    // 时间戳
  appKey?: string;      // 发送方应用标识
}
```

## 向后兼容

为了保持与旧代码的兼容性，组件提供了以下类型别名：

- `MICRO_APP_EVENT` - 兼容旧的事件名称常量

## 类型守卫函数

组件提供了以下类型守卫函数：

- `isTokenRequestMessage(message)` - 判断是否为 Token 请求消息
- `isTokenResponseSuccessMessage(message)` - 判断是否为 Token 响应成功消息
- `isTokenResponseErrorMessage(message)` - 判断是否为 Token 响应失败消息
- `isTokenInvalidMessage(message)` - 判断是否为 Token 失效消息
- `isRouteChangeMessage(message)` - 判断是否为路由变化消息

## 工厂函数

`MicroAppMessageFactory` 提供了以下工厂方法：

- `createTokenRequest(data, requestId?)` - 创建 Token 请求消息
- `createTokenResponseSuccess(data, requestId?)` - 创建 Token 响应成功消息
- `createTokenResponseError(data, requestId?)` - 创建 Token 响应失败消息
- `createTokenInvalid(data?)` - 创建 Token 失效消息
- `createRouteChange(data)` - 创建路由变化消息

