# g2rain-main-shell 文档

本目录记录当前源码的项目事实，并以中央 `frontend-app 1.0.0` 为基础，正式采用 `frontend-shell 1.0.0`。

## 导航

- [项目元数据](project.yaml)
- [架构概览](architecture/overview.md)
- [层次](architecture/layers.md)
- [依赖规则](architecture/dependencies.md)
- [运行流程](architecture/runtime-flows.md)
- [应用编码配置与双模式升级](architecture/application-code-configuration.md)
- [对齐 shell-template 升级总方案](architecture/shell-template-upgrade.md)
- [已知偏差](architecture/deviations.md)
- [本地开发](development/local-development.md)
- [测试策略](development/testing.md)
- [完成定义](development/definition-of-done.md)
- [Platform Main 采纳](development/platform-main-adoption.md)（对接 `@g2rain/platform/main` + `@g2rain/http`；规范见 appkit Main Shell 生成契约）
- [UI / Theme 采纳](development/ui-theme-adoption.md)
- [配置](operations/configuration.md)
- [部署](operations/deployment.md)
- [排障](operations/troubleshooting.md)
- [安全边界](security/security-boundaries.md)
- [需求入口](requirements/README.md)
- [对齐 shell-template 升级（开发中）](requirements/shell-template-alignment.md)

根目录 `architecture.md`、`architecture-detail.md` 和 `ARCHITECTURE_SPEC.md` 是已有详细资料；本目录负责版本化采用、项目边界和 Agent 工作入口，两者应保持一致。
