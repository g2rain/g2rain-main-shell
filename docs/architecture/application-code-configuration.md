# 应用编码配置与双模式升级方案

## 目标

`main-shell` 同时承载采用 AppKit 新契约的子应用和仍使用传统契约的子应用。模式识别以稳定的 `applicationCode` 为唯一依据：

- `g2rain-member-app`：`appkit`，作为新模式代表；
- `g2rain-manager-app`：`legacy`，作为传统模式代表；
- 未登记的既有应用：暂按 `legacy` 运行，避免升级切断现有 `infra-app` 等应用。

Shell 是兼容边界。业务子应用不得依应用名称、Shell 私有全局变量或菜单结构推断宿主模式。

## 配置文件

配置位于 [application-code.config.ts](../../src/platform/apps/application-code.config.ts)。它只维护应用编码与集成契约：

```ts
export const APPLICATION_CODE_CONFIG = {
  'g2rain-member-app': { mode: 'appkit', protocolVersion: '1' },
  'g2rain-manager-app': { mode: 'legacy', protocolVersion: 'legacy' },
};
```

菜单服务仍是应用入口、路由、菜单权限的事实来源。此配置不得写入 `entry`、Token、Secret、域名或业务权限，避免把环境和安全责任复制到前端静态代码。

新增应用时，必须显式增加一项配置；新应用默认采用 `appkit`。保留未登记应用的 `legacy` 回退仅用于存量兼容，不能作为新应用的接入方式。

## 数据流

```text
菜单 AuthorityMenuVo.applicationCode
             |
             v
application-code.config.ts --解析--> AppDefinition
                                      |- applicationCode
                                      |- mode
                                      |- appKey / name / entry / activeRule
             |
             v
RuntimeInstance props
  |- 新：applicationCode / viewId / instanceId
  |- 旧：appKey（保留兼容）
             |
             v
qiankun 子应用生命周期
```

`appKey` 是菜单与传统实例兼容标识；`applicationCode` 是稳定应用身份；`viewId` 是工作区视图身份；`instanceId` 是运行实例身份。迁移期 `appKey === instanceId`，但它们不能再被当作 `applicationCode` 使用。

## 当前实现（升级后）

1. 菜单解析为 `AppDefinition` 时，仍可从 `application-code.config` 取得 `mode`（SHELL-014 双轨）。
2. `RuntimeStore.buildInstanceFromTab` 经 `createMainPlatform().buildPublicProps` 构造公开 props（无 Token）。
3. `platform/legacy/registry` + `isLegacyApplication`：legacy 应用在边缘注入 `token`/`tokenKid`/`client`；AppKit（如 member-app）不注入。
4. Auth Bridge：`REQUEST_TOKEN` / `TOKEN_INVALID` 经定向消息取票与刷新。
5. `appKey` 继续保留到传统子应用完成迁移；迁移期 `appKey === instanceId`。

目标：菜单与挂载路径只查 legacy registry，删除 Definition 上的 `mode` 字段后关闭 SHELL-014。

## 迁移步骤

1. 以 legacy registry 登记仍需 Token-in-props 的应用（如 manager-app）；未登记且非 AppKit allow-list 的历史应用暂按 legacy。
2. 以 Member 验证 AppKit 字段、Auth Bridge、Locale、深链、多 Tab 和卸载。
3. 新建应用只走 AppKit，不得新增 Token-in-props。
4. 逐个迁出 legacy；全部完成后清空 registry 默认 legacy 回退。
5. 删除 `application-code.config` 的 mode 写入 Definition。

## 回滚与验收

- 单个应用问题：将该 `applicationCode` 加回 legacy registry / config；菜单与其他应用无需回滚。
- 变更后至少验证：Member Auth Bridge、Manager legacy 挂载、两应用切换、关 Tab 清理、深链刷新。
- 不记录或打印完整 Token。
