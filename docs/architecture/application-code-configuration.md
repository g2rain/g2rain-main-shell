# 应用编码与挂载契约

## 目标

`main-shell` 对子应用只使用 **AppKit 单一协议**：公开 props + Auth Bridge。不再存在 `legacy` 模式、Token-in-props 或 `Definition.mode` 分叉。

模式识别不需要静态白名单：菜单里的 `applicationCode`（`AuthorityMenuVo.applicationCode` / 菜单 `name`）即稳定应用身份。

## 数据流

```text
菜单 AuthorityMenuVo.applicationCode
             |
             v
AppDefinition
  |- applicationCode / appKey / name / entry / activeRule
             |
             v
RuntimeInstance props（buildPublicProps，无 Token）
  |- applicationCode / viewId / instanceId
  |- appKey（迁移期 = instanceId，菜单兼容标识）
             |
             v
qiankun 挂载 + Auth Bridge（REQUEST_TOKEN / TOKEN_INVALID）
```

- `appKey`：菜单与 Tab 逻辑主键
- `applicationCode`：稳定应用身份
- `viewId`：工作区视图身份（现网 = tabKey）
- `instanceId`：运行实例身份

## 当前实现

1. `MicroAppStore.initializeFromMenu` 从菜单写入 `AppDefinition`，**无 mode / protocolVersion 字段**。
2. `RuntimeStore.buildInstanceFromTab` 经 `createMainPlatform().buildPublicProps` 构造公开 props（无 Token / Kid / client）。
3. 鉴权仅经 Auth Bridge：`REQUEST_TOKEN` / `TOKEN_INVALID` 定向取票与刷新。
4. 已删除 `application-code.config.ts` 与 `platform/legacy/`。

## 验收

- 子应用挂载后公开 props 无敏感字段；鉴权走 Auth Bridge。
- 多应用切换、关 Tab 清理、深链刷新按需联调。
- 不记录或打印完整 Token。
