# 部署

1. 使用 `npm ci` 安装锁定依赖，执行 `npm run build`。
2. 构建镜像：`docker build --build-arg VITE_BUILD_MODE=production -t g2rain/g2rain-main-shell:<tag> .`。
3. 运行时注入 Nginx 主机、端口和 Context Path；不在镜像内固化生产 Secret/私钥。
4. 发布前验证 `/main` 首页、静态资源、深链刷新、SSO 回调、API/Auth 代理和至少一个真实子应用。
5. 变更跨应用协议时先验证兼容版本，并保留上一镜像与配置用于回滚。

Dockerfile 暴露 `8080`，入口脚本的 `SERVER_PORT` 默认值为 `80`；部署清单必须显式设置端口并正确映射，不能只依赖 EXPOSE。
