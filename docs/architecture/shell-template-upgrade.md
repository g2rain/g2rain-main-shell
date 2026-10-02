# Main Shell 对齐 shell-template 升级总方案

状态：`开发中`（Phase 0–7 源码已落地；**member-app 联调通过**；manager-app / 深链待报）  
适用仓库：`g2rain-main-shell`  
对齐基线：`g2rain-shell-template`（`frontend-shell-template`，baseline `architecture-v1.2.0`）  
跨仓规范：中央 `frontend-shell 1.0.0`、appkit [Main Shell 生成契约](https://github.com/g2rain/g2rain-appkit/blob/main/docs/packages/main-shell-contract.md)、模板 [双协议兼容升级方案](https://github.com/g2rain/g2rain-shell-template/blob/main/docs/architecture/legacy-compatibility-upgrade.md)

> 本文是 **总方案**，不替代逐步改造中的专题文档。代码落地前只更新本方案与偏差登记；各 Phase 开工时再改源码与对应采纳说明。

## 1. 目标与非目标

### 1.1 目标

将 `g2rain-main-shell` 从「自建 HTTP / 主题 / 微应用协议」收敛到与 `g2rain-shell-template` 一致的目标架构形状：

1. 依赖并装配 `@g2rain/http`、`@g2rain/platform`（以及后续的 `@g2rain/theme`、`@g2rain/ui`）。
2. 组合根接线 `createMainPlatform` / `runtimePort`；公开 props **禁止**下发 Token / Token Kid / client。
3. AppKit 子应用经 Auth Bridge（定向消息）取票与失效刷新。
4. Legacy 子应用仅在 **边缘适配层** 保留 Token-in-props / 旧消息映射，核心 Definition / Workspace / Token Store / qiankun handle 表保持单套。
5. 保留 main-shell 作为生产权威参考实现的责任：真实菜单、SSO、OpenResty/Lua、存量联调与运维配置。

### 1.2 非目标

- 不用模板整仓覆盖 main-shell；不把脚手架占位符（`{{PROJECT_NAME}}` 等）写入本仓。
- 不把 Context Path 从 `/main` 改成模板默认 `/admin`。
- 不一次性切断 `manager-app` 等 legacy 接入。
- 不在本方案内统一或强制改写中央 Profile / appkit API（若需改契约，另提中央 ADR）。
- 不把子应用业务规则、IAM Token 签发或 Gateway 鉴权搬入 Shell。
- 不删除本仓已有生产能力（ESLint、Mock、远程 i18n tags、现网 Nginx/Lua 实践），除非某一 Phase 明确验收后收缩。

### 1.3 关系定位

| 角色 | 仓库 | 本方案中的用法 |
| --- | --- | --- |
| 目标架构形状 | `g2rain-shell-template` | 目录职责、组合根顺序、公开 props、Auth Bridge、adapter 边界的参照 |
| 生产行为事实源 | `g2rain-main-shell` | SSO、菜单、多子应用、OpenResty、现网键名与联调行为以本仓为准，向模板形状收敛 |
| 契约权威 | 中央 Profile + appkit 生成契约 | 跨仓不变式；本方案不得静默覆盖 |

## 2. 现状差距摘要

详细对照见实施时的源码 Diff；本表只固化决策所需的关键差距。

| 优先级 | 差距 | main-shell 现状 | template 目标 | 风险若不改 |
| --- | --- | --- | --- | --- |
| P0 | 平台依赖 | 未装 `@g2rain/*`；本地 `components/http` | `@g2rain/http` + `@g2rain/platform` | 无法对齐中央契约 |
| P0 | 公开 props | `buildInstanceFromTab` 含 Token/client | `buildPublicProps`，无敏感字段 | 与 AppKit / 安全边界冲突 |
| P0 | Auth Bridge | 无完整 REQUEST_TOKEN / TOKEN_INVALID 处理器 | 定向消息 + `shared-auth` | 新子应用无法按契约取票 |
| P1 | Legacy 模型 | `application-code.config` + 全量子应用 Token-in-props | AppKit 核心 + 可选 legacy 边缘 registry | 长期双维护、契约污染核心 |
| P1 | Theme / UI | 本地 CSS + `data-theme`（含 `g2rain`） | `@g2rain/theme` → `data-g2-theme`（仅 light/dark）+ `G2rainUi` | 品牌/变量不一致 |
| P2 | `loadMicroApp.name` | `` `${name}__${instanceId}` `` | 固定 `applicationCode`（TPL-008） | 多实例/插件生命周期分叉 |
| P2 | Token 落盘键 | `g2rain_token:${applicationCode}` | `g2rain-shell-token:${applicationCode}` | 升级导致会话中断 |
| P3 | Store / boot 结构 | `tab`+`app`+`boot/*` | `workspace` + 单文件 `boot.ts` 模式 | 可维护性，非功能阻塞 |

本仓采纳说明现状见 [platform-main-adoption.md](../development/platform-main-adoption.md)（未安装 / 未接线）。  
既有双模式说明见 [application-code-configuration.md](application-code-configuration.md)（升级过程中演进为 legacy registry，而非直接删除）。

## 3. 目标架构

### 3.1 运行链路（目标）

```text
菜单 API → Definition（核心事实，无协议字段）
        → Workspace / RuntimeStore
        → AdapterResolver
              ├─ AppKit adapter → Shared Loader → qiankun
              └─ Legacy adapter（仅 registry 命中）→ 同一 Shared Loader
        → Auth Bridge（AppKit）/ legacy-message-bridge（边缘）
```

硬约束（对齐模板 legacy 方案）：

- 禁止第二套 Tab、Router、实例表、Token Store、qiankun handle 或操作队列。
- 公开 props 路径永不写入 Token；legacy Token 只在 adapter 边缘注入。
- 协议选择只查 `applicationCode` registry，禁止按 URL / entry / 菜单名猜测。

### 3.2 身份字段（迁移期）

| 字段 | 含义 | 约束 |
| --- | --- | --- |
| `applicationCode` | 稳定应用身份 | 菜单与 registry 的主键 |
| `viewId` | 工作区视图身份 | 与 Tab 打开语义对应 |
| `instanceId` | 运行实例身份 | 卸载与消息定向主键 |
| `appKey` | 传统兼容标识 | 迁移期 `appKey === instanceId`；不得再当作 `applicationCode` |
| `contextPath`（公开 props） | **子应用** Context Path | 不得使用 Shell 自身 `VITE_CONTEXT_PATH` |

### 3.3 安全不变式

- Token / Kid / 私钥不得进入公开 props、URL、Header 展示或持久日志。
- Auth Bridge 可经定向消息下发 client 浅拷贝（同页可信微前端模型）；禁止 `console.log` 整包消息。
- 生产私钥与 Secret 不进 Git / 镜像层；既有 SHELL-005（`lua/keys`）不因本升级自动关闭。
- 跨应用消息须带目标绑定（instanceId / applicationCode）；推进关闭 SHELL-006。

## 4. 不可从模板盲拷的清单

实施时对照此表做 Review，禁止「整文件复制」后未改身份：

1. 脚手架占位符与 `package.json` 的 `{{PROJECT_NAME}}` / `private: false`。
2. Context Path、端口、空 SSO/Backend 默认值覆盖现网 `/main` 与环境配置。
3. 模板默认「仅壳内菜单」覆盖本仓菜单 API + DEV entry 行为。
4. 默认砍掉 legacy（生产至少保留 manager-app 兼容路径）。
5. Token 落盘键直接改名且无一次性迁移。
6. 在子应用与中央契约未统一前，单方面改 `loadMicroApp.name`。
7. 删除 ESLint / Mock / 远程 i18n 等生产能力（除非独立 Phase 验收后收缩）。
8. 将 `legacy-overlay/` 原样拷入本仓作为 CLI 覆盖层语义；本仓应落地**等价模块路径**，而非引入未使用的同步约定。

## 5. 分阶段实施计划

每阶段结束必须满足：**本阶段闸门通过**，且 **偏差表已更新**，才进入下一阶段。默认不并行开多个会改变运行时行为的 Phase。

### Phase 0 — 文档与偏差对齐（不改运行时行为）

**做什么**

- 维护本总方案；更新 `docs/index.md` 索引。
- 在 [deviations.md](deviations.md) 增补升级期偏差（建议 ID 见 §6）：未接 `@g2rain/*`、Token-in-props、命名分叉、Token 键名差异、Theme 未迁等。
- 将 [platform-main-adoption.md](../development/platform-main-adoption.md) 状态改为「计划中 / 进行中」，链到本方案。
- 规划专题文档草案位置（可先空链或占位，本 Phase 可不新建空文件）：
  - `docs/development/ui-theme-adoption.md`（Phase 5 填写）
  - `docs/architecture/legacy-compatibility-upgrade.md`（由本仓 application-code 文档演进，对齐模板语义）

**闸门**

- 文档链接可解析；`project.yaml` 与 index 索引一致。
- 无源码行为变更（或仅文档）。

**产出**

- 本文件 + 偏差登记 + adoption 状态更新。

---

### Phase 1 — 依赖落地（双轨）

**做什么**

- `package.json` 增加 `@g2rain/http@1.0.0`、`@g2rain/platform@1.0.0`（Theme/UI 可延后到 Phase 5）。
- 确认 Vite / TS 解析与 peer 约束；`npm` 锁文件更新。
- **暂保留**本地 `components/http`，不做流量切换。

**闸门**

- `npm run build` 通过。
- 现有 SSO / 菜单 / 子应用行为相对 Phase 0 **无可见回归**（冒烟即可）。

**回滚**

- 移除新增依赖与锁文件变更。

---

### Phase 2 — HTTP 装配切换

**做什么**

- 按模板模式新增/改写 `src/runtime/http`：business（`withAuth`）、auth、sign 三客户端装配。
- 将 `runtime/auth/sso.ts` 等切到 `@g2rain/http`（含 Application-DPoP / `/lua/sign_code` 路径）。
- 本地 `components/http` 仅保留未被替换的调用点，并登记删除计划。

**闸门**

- `npm run build`。
- 浏览器：未登录 → SSO 回调 → 带票请求 → Token 刷新 → 登出。
- OpenResty/Lua 签名路径在目标联调环境可用（若本机无容器，报告为未验证项）。

**回滚**

- 恢复 SSO/HTTP 导入到本地客户端；保留依赖但不接线。

---

### Phase 3 — Platform Main + 公开 props 去 Token

**做什么**

- 新增 `platform/main-platform.ts`；组合根 `createMainPlatform({ runtimePort })`。
- `buildInstanceFromTab` / `mountInstance` 改为 `buildPublicProps`；核心路径去掉 `token` / `tokenKid` / `client`。
- **并行**：legacy `applicationCode` 经 adapter/registry **边缘注入** Token（对齐模板 TPL-010；不得写回核心 Definition）。
- 演进 [application-code-configuration.md](application-code-configuration.md)：从「mode 写进 Definition」迁向「仅 legacy registry」。

**闸门**

- AppKit 代表（推荐 `g2rain-member-app`）：挂载后公开 props 无敏感字段，仍可通过后续 Auth Bridge（若 Phase 4 未完成，可临时登记偏差并限定本阶段仅测 legacy 不回归）。
- Legacy 代表（`g2rain-manager-app`）：挂载与既有 Token 行为不回归。
- 关 Tab 清理顺序：qiankun unmount → 删 handle → `releaseInstance` → 删 RuntimeInstance → 删 Tab。

**回滚**

- 恢复手写 props；关闭 `createMainPlatform` 接线；registry 注入关闭。

---

### Phase 4 — Auth Bridge（AppKit）

**做什么**

- 引入定向消息投递、`REQUEST_TOKEN`、`TOKEN_INVALID`、`shared-auth`、`openAuthBridge` / `closeAuthBridge`。
- 与现有 `message-handlers` / Window 事件适配合并或替换；补 instanceId / 来源绑定（推进 SHELL-006）。
- Legacy 旧消息经 `legacy-message-bridge`（若已建）归一化后复用同一刷新与响应路径。

**闸门**

- member-app：REQUEST_TOKEN → TOKEN_RESPONSE；失效刷新；卸载后不再向该 instance 回票。
- manager-app：legacy 路径不回归。
- 不得在日志中打印完整 Token / 消息整包。

**回滚**

- 关闭 Bridge 监听；AppKit 应用临时退回偏差登记的兼容策略（若有）。

---

### Phase 5 — Theme / UI

**做什么**

- 接入 `@g2rain/theme`、`@g2rain/ui`、`createThemeController`；根节点 `data-g2-theme` 仅 `light` / `dark`。
- 布局与组件样式迁到 `--g2-*`；淘汰或登记本地 `g2rain` 第三主题偏差。
- 补齐 `docs/development/ui-theme-adoption.md`。

**闸门**

- `npm run build`；亮/暗切换；主题不进入公开 props / URL / 日志。
- 关键壳布局目视回归。

**回滚**

- 恢复本地 theme store / CSS；卸载 `@g2rain/ui` 安装。

---

### Phase 6 — Runtime 结构收敛

**做什么**

- Tab / App 模型向 Workspace 收敛（可渐进改名，避免大爆改）。
- qiankun adapter 抽离、`instance-queue`、AdapterResolver（AppKit 默认 + legacy 边缘）。
- **单独决策** `loadMicroApp.name`：在中央 Profile / vite-plugin-qiankun / 多实例契约对齐前，默认 **保持** main-shell 现策略，并在偏差表保留「与模板 TPL-008 分叉」；不得静默改名。

**闸门**

- 多 Tab、同应用多实例（若现网支持）、深链刷新、F5。
- 菜单打开 → 挂载 → 切换 inactive（不 unmount）→ 关闭清理。

**回滚**

- 保留旧 store API 临时 re-export；adapter 切回单一路径。

---

### Phase 7 — 清理与文档收口

**做什么**

- 删除或收缩已替代的 `components/http`、本地 theme 冗余、无用 deep import。
- Token 存储：选定最终键策略 + **一次性迁移**（从 `g2rain_token:*` 读出并写入目标键，或明确保持本仓键并登记与模板差异为长期偏差）。
- 更新 `project.yaml`（`subAppContract`、collaborators、文档索引、adoption 状态）。
- 关闭已兑现的偏差行；遗留项给出退出条件。
- 联合冒烟：member-app（AppKit）+ manager-app（legacy）+ SSO + 深链 + 登出。

**闸门**

- 满足 [definition-of-done.md](../development/definition-of-done.md)。
- `platform-main-adoption.md` 状态与模板「已完成态」对齐（联合验收项如实填写）。

## 6. 建议偏差登记（升级期）

实施 Phase 0 时写入 [deviations.md](deviations.md)，示例：

| 建议 ID | 描述 | 退出条件 |
| --- | --- | --- |
| SHELL-008 | 未安装/未接线 `@g2rain/platform` 与 `@g2rain/http` | Phase 2–3 完成后关闭 |
| SHELL-009 | 公开 props 仍下发 Token/client（全量或未迁完的应用） | Phase 3 核心去 Token + legacy 仅边缘注入后关闭「全量」表述 |
| SHELL-010 | Auth Bridge 未完整落地 | Phase 4 与 member-app 联调后关闭 |
| SHELL-011 | `loadMicroApp.name` 与模板 TPL-008 分叉 | 中央契约统一并完成多实例验证后收敛 |
| SHELL-012 | Token localStorage 键与模板不一致 | 完成迁移策略或登记为有意长期偏差 |
| SHELL-013 | Theme/UI 仍本地实现 | Phase 5 完成后关闭 |
| SHELL-014 | Legacy 仍写在核心 Definition.mode（若尚未迁 registry） | 迁入 `platform/legacy/registry` 后关闭 |

既有 SHELL-001～007 不因本方案自动关闭；与消息校验、私钥跟踪相关的项在对应 Phase 中显式处理。

## 7. 跨仓与联调对象

| 对象 | 角色 |
| --- | --- |
| `g2rain-shell-template` | 结构与契约落地参照；不反向要求模板跟随本仓临时兼容 |
| `g2rain-appkit` | `/main`、`/http`、公开 props、消息类型权威 |
| `g2rain-member-app` | AppKit + `/sub` 主验收对象 |
| `g2rain-manager-app` | Legacy 回归对象 |
| `g2rain-iam` / `g2rain-gateway-webflux` | SSO、换票、业务 API 入口 |
| 中央 `g2rain` Profile | `loadMicroApp.name`、身份字段等跨仓变更的裁决处 |

## 8. 需求与执行约定

- 本文件是 **架构总方案**；真正改代码前，应另建或指定唯一 `docs/requirements/*.md` 且状态为 `开发中`，或将 `docs/project.yaml` 的 `aiCoding.activeRequirement` 指向该需求。
- 推荐按 Phase 拆需求（至少 Phase 1–2、3–4、5、6–7 可合并或拆分），避免单需求覆盖全部行为变更。
- Agent / 人工执行时：有意偏离中央 Profile 必须更新 `deviations.md`；不得把临时 Token-in-props 写回模板或生成范例。

## 9. 验收总清单（升级完成时）

- [x] `@g2rain/http`、`@g2rain/platform` 已接线；Theme/UI 已接入（旧本地 CSS 待删见 SHELL-013/015）
- [x] 公开 props 无 Token；legacy 仅边缘注入
- [x] Auth Bridge：member-app 经 main-shell 访问正常（2026-10-02）；卸载停回票细节可按需补测
- [ ] SSO 全链路与 Application-DPoP 签名路径单独报验（若本次访问已含登录则事实已覆盖）
- [x] member-app 冒烟通过；[ ] manager-app legacy 联合冒烟
- [ ] Tab 打开 / 切换 / 关闭清理顺序正确（按需补测）
- [ ] 深链与 F5（及生产 Nginx 微路径回退，若环境可测）
- [x] `npm run build`；文档索引、`project.yaml`、adoption、偏差表一致
- [x] 未验证项已写入文档（manager-app / 深链等）

## 10. 修订记录

| 日期 | 说明 |
| --- | --- |
| 2026-10-02 | 初稿：基于 shell-template 对齐差距与分阶段计划，不含源码改造 |
| 2026-10-02 | Phase 0–7 源码落地：`@g2rain/*`、HTTP、Platform Main、Auth Bridge、Theme/UI、instance-queue；浏览器联调未完成 |
| 2026-10-02 | 联调：main-shell 访问 member-app 验证通过；文档同步；manager-app / 深链仍待报 |
