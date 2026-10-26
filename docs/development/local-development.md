# 本地开发

## 准备环境

- Node.js `>=22`
- npm
- 联调时需要可访问的 IAM、Gateway，以及至少一个真实子应用（如 `g2rain-manager-app` 或已接 `/sub` 的 `g2rain-member-app`）

使用锁文件安装：

```bash
npm ci
```

无依赖升级需求时不要用 `npm install` 重写锁文件。

## 启动 Shell

默认开发端口见 `docs/project.yaml` 的 `runtime.devServerPort`（当前 `3000`）。Context Path 为 `/main`。

```bash
npm run dev
```

主要环境变量见 [configuration.md](../operations/configuration.md)。浏览器可见的 `VITE_*` / `window._env_` 不得放置 Secret。

## 与子应用联调

1. 先启动本仓库 Shell（`npm run dev`）。
2. 再启动目标子应用的开发服务器；子应用 `entry` / `activeRule` 须与菜单或注册配置一致。
3. 从 Shell 菜单或深链进入子应用；验证挂载、内部路由、Locale、Token 失效与关闭卸载。
4. 协议或公开 props 变更时，优先用已接 `@g2rain/platform/sub` 的 Member 做联合验收；传统协议回归可用 Manager。

Appkit `/main` + HTTP 采纳状态与改造锚点见 [platform-main-adoption.md](platform-main-adoption.md)。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm ci` | 按锁文件安装 |
| `npm run dev` | 本地开发 |
| `npm run build` | 类型检查 + 生产构建（验证基线） |
| `npm run lint` | ESLint |
| `npm run preview` | 预览构建产物 |

## 文档约束

本仓 `docs/` 遵循中央 `frontend-shell` Profile 与生成规范；导航入口为 [docs/index.md](../index.md)。新增专题可追加文件，不得用平行目录替代必填路径。
