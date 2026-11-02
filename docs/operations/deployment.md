# 构建与部署

## 本地构建与检查

本地构建使用锁文件，不发布镜像：

```bash
npm ci
npm run build
```

`npm run build` 执行 Vue/TypeScript 类型检查和 Vite 生产构建，产物为 `dist/`。本仓没有独立 `npm test` 脚本；这不等同于浏览器联调或部署验收。

## 容器构建与运行

本地容器构建与 CI 复用根目录 `Dockerfile`，其构建阶段为 Node 22 Alpine，运行阶段为 OpenResty Alpine。构建时应传入版本与提交元数据：

```bash
docker build --build-arg VITE_BUILD_MODE=production --build-arg IMAGE_VERSION=1.0.0 --build-arg VCS_REF=<完整提交SHA> -t ghcr.io/g2rain/g2rain-main-shell:1.0.0 .
```

镜像入口为 `/docker-entrypoint.sh`。它声明端口 `8080`，但 Nginx 由 `SERVER_PORT` 控制且默认监听 `80`；部署清单必须显式设置 `SERVER_PORT` 并映射对应端口。`CONTEXT_PATH` 必须与构建期 `/main` 一致。

最终镜像只复制 `dist/`、`lua/sign.lua`、`lua/sign_api.lua`、`lua/config.lua`、Nginx 模板和入口脚本；`lua/keys/` 被 Docker 构建上下文排除。生产环境应以只读 volume、Docker/Kubernetes Secret 或等效密钥管理方式挂载到 `/usr/local/openresty/nginx/lua/keys/`：`private-key.pem`、`public-key.pem`、`iam-public-key.pem` 与 `iam-key-id.txt`。

不要以浏览器可见的 `VITE_*`、`SSO_BASE_URL` 或镜像层传递生产 Secret。仓库仍跟踪上述密钥路径中的 PEM/ID 文件；即使它们不进入镜像，也须在公开源码前确认其仅为可公开样例。若是实际或曾复用凭据，维护者必须迁移、替换并轮换；`.dockerignore` 无法治理 Git 历史或仓库可见性。

## GitHub Container Registry（GHCR）发布

`.github/workflows/image.yml` 仅响应推送的稳定 Git tag；普通分支推送、Pull Request 和手动触发均不发布。工作流要求 tag 精确符合 `v<major>.<minor>.<patch>`，其提交已进入 `origin/main`，标签提交中存在非空 `docs/releases/v<版本>.md`，且根 `package.json` 版本一致。随后执行 `npm ci`、`npm run build`，再构建并推送：

```text
ghcr.io/g2rain/g2rain-main-shell:<版本>
ghcr.io/g2rain/g2rain-main-shell:sha-<完整提交SHA>
```

工作流不创建 GitHub Release、不部署服务、不更新 `latest`。认证使用 GitHub 自动提供的 `GITHUB_TOKEN`，权限仅为 `contents: read` 和 `packages: write`。只有两个标签都推送成功后，Actions Summary 才显示完整地址；登录、构建或单个标签上传成功都不是发布成功。

按实际分支流程 `feature/* → develop → main`：先将发布改动、同名发布说明和验证结果合入 `main`，再在已验证的 main 提交创建并推送 tag：

```bash
git tag v1.0.0
git push origin v1.0.0
```

首次成功推送后，如需匿名拉取，进入 GitHub Packages 的 **Package settings → Change visibility → Public**。若组织管理员禁止修改，请联系管理员。已有 GHCR 包还可能需要在 **Package settings → Actions access** 授予 `g2rain/g2rain-main-shell` 写权限；出现 `denied` 时优先检查该项和组织 Packages 策略，而非仅假定 `packages: write` 足够。

公开后才可匿名拉取：

```bash
docker pull ghcr.io/g2rain/g2rain-main-shell:1.0.0
```

## 部署验收边界

在线演示、镜像构建、GHCR 推送、匿名拉取、容器启动和实际部署验证彼此独立。生产部署前还需验证 `/main`、静态资源、深链刷新、SSO 回调、API/Auth 代理和至少一个真实子应用；并确认 IAM/Gateway 地址、Nginx `CONTEXT_PATH` 和子应用 `entry`/`activeRule` 一致。
