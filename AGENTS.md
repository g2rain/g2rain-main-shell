# AGENTS.md

在本仓库执行评审或开发前，依次读取：

1. `docs/project.yaml`
2. `docs/architecture/deviations.md`
3. `docs/requirements/` 中唯一处于 `开发中` 的需求（若任务为需求开发）
4. 中央 `frontend-app 1.0.0` 与 `frontend-shell 1.0.0` Profile
5. 与任务有关的本地专题文档和 Git Diff

## 强制边界

- 本仓库是微前端主应用，负责全局布局、路由、菜单、Tab、子应用注册/生命周期和认证会话协调，不拥有子应用业务规则。
- `appKey`、`name`、`entry`、`activeRule` 和 `instanceId` 是跨应用契约；修改时必须同步文档并验证真实子应用。
- 不得将 Token 写入日志或 URL，不得把生产 Secret/私钥放入前端配置、Bundle 或仓库。
- 新增代码遵守 `shared → components → platform → runtime → views/shell` 的目标方向；已登记反向依赖不能作为新代码范例。
- 不覆盖用户已有改动；Profile 升级必须同步中央目录、本地元数据、偏差和验证结果。

## 验证

至少执行 `npm run build`。协议、路由、认证或部署变更还要完成浏览器联调；无法执行的验证必须明确报告。

需求选择只认 `docs/project.yaml` 的 `aiCoding.activeRequirement` 或唯一 `开发中` 文档；没有或不唯一时停止开发，不按文件名或修改时间猜测。
