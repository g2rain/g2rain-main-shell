#!/usr/bin/env sh
set -eu

# 设置默认值
export SERVER_PORT=${SERVER_PORT:-80}
# 须与镜像构建时 VITE_CONTEXT_PATH 一致（如 /main），否则深链刷新与静态资源路径会错位
export CONTEXT_PATH=${CONTEXT_PATH:-/}
export SSO_BASE_URL=${SSO_BASE_URL:-}

# 替换 nginx 配置中的环境变量
envsubst '${GATEWAY_HOST} ${GATEWAY_PORT} ${IAM_HOST} ${IAM_PORT} ${SERVER_PORT} ${CONTEXT_PATH}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

# 替换 env-config.js 中的占位符（只替换 SSO_BASE_URL，CONTEXT_PATH 已在构建时确定）
if [ -f /usr/local/openresty/nginx/html/env-config.js ]; then
  sed -i "s|__SSO_BASE_URL__|${SSO_BASE_URL}|g" /usr/local/openresty/nginx/html/env-config.js
  echo "✅ env-config.js 已更新: SSO_BASE_URL=${SSO_BASE_URL}"
else
  echo "⚠️ 警告: env-config.js 文件不存在，跳过运行时配置替换"
fi

exec "$@"