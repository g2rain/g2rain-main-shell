# 配置

| 配置 | 当前值/用途 |
| --- | --- |
| `VITE_APPLICATION_CODE` | `g2rain-main-shell` |
| `VITE_CONTEXT_PATH` | `/main`；同时影响 Vite base 和 Router history |
| `VITE_TOKEN_END_POINT` | Token 端点 |
| `VITE_AUTH_END_POINT` | 授权端点 |
| `VITE_SSO_BASE_URL` | SSO 来源地址 |
| `VITE_REDIRECT_URI` | SSO 回调路径 |
| `VITE_I18N_TAGS` | `G2RAIN_SHARED,MAIN_SHELL` |
| `VITE_SERVER_PORT` | 本地端口，默认 `3000` |

容器还需要 `SERVER_PORT`、`CONTEXT_PATH`、`GATEWAY_HOST/PORT` 和 `IAM_HOST/PORT`。`VITE_*` 与 `window._env_` 对浏览器可见，禁止放置 Secret。

构建时 `/main` 与运行时 `CONTEXT_PATH` 必须一致；修改时同时检查 Vite、Router、Nginx、SSO 回调、子应用 `activeRule` 和部署入口。
