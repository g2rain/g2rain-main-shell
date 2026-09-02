# 需求文档

每个需求使用独立 Markdown 文件，并至少包含：目标、非目标、验收标准、影响的跨应用契约、安全与部署影响、测试计划、回滚方式和状态。

允许状态：`待开发`、`开发中`、`已完成`、`已取消`。执行 `develop` 时优先读取 `docs/project.yaml` 的 `aiCoding.activeRequirement`；该字段为空时只允许选择唯一的 `开发中` 需求。没有或存在多个候选时必须停止，不按文件名或修改时间猜测。

示例头部：

```yaml
---
id: shell-example
title: 示例需求
status: 待开发
owner: unassigned
---
```
