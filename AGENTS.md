# AGENTS.md

在本仓库执行评审或开发前，依次读取：

1. `docs/project.yaml`
2. `docs/architecture/deviations.md`
3. `docs/requirements/` 中唯一处于 `开发中` 的需求（若任务为需求开发）
4. 中央 `frontend-app 1.0.0` 与 `frontend-shell 1.0.0` Profile
5. 与任务有关的本地专题文档和 Git Diff
6. 涉及子应用编排、公开 props、跨应用消息、HTTP/Token 或 `@g2rain/platform/main` 时：appkit [Main Shell 生成契约](https://github.com/g2rain/g2rain-appkit/blob/main/docs/packages/main-shell-contract.md)，以及本仓 [Platform Main 采纳说明](docs/development/platform-main-adoption.md)

## 强制边界

- 本仓库是微前端主应用，负责全局布局、路由、菜单、Tab、子应用注册/生命周期和认证会话协调，不拥有子应用业务规则。
- `applicationCode`、`viewId`、`instanceId` 与迁移期 `appKey`（目标等于 `instanceId`）以及 `name`、`entry`、`activeRule` 是跨应用契约；修改时必须同步文档并验证真实子应用。
- 不得将 Token 写入日志、URL 或 `@g2rain/platform/main` 的公开 props；不得把生产 Secret/私钥放入前端配置、Bundle 或仓库。
- Platform Main 只做公开 props 与定向消息协调；`loadMicroApp`、RuntimeStore、qiankun handle 与操作队列仍由本仓拥有。
- HTTP 基线使用 `@g2rain/http`；Token Store、SSO 与刷新编排留在本仓 `runtime`，不得下沉公共包。
- 新增代码遵守 `shared → components → platform → runtime → views/shell` 的目标方向；已登记反向依赖不能作为新代码范例。
- 不覆盖用户已有改动；Profile 升级必须同步中央目录、本地元数据、偏差和验证结果。

## 验证

至少执行 `npm run build`。协议、路由、认证或部署变更还要完成浏览器联调；无法执行的验证必须明确报告。接入 `/main` 与 `@g2rain/http` 时按生成契约第 10 节清单自检，并用已接 `/sub` 的子应用（推荐 member-app）做联合冒烟。新建或补齐文档时遵守中央 `frontend-shell` 必填树与生成契约第 3 节，不得只交源码。

需求选择只认 `docs/project.yaml` 的 `aiCoding.activeRequirement` 或唯一 `开发中` 文档；没有或不唯一时停止开发，不按文件名或修改时间猜测。
