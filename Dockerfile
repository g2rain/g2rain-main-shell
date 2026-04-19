# ------------------------------------------------------------
# 阶段 1：构建 Vue 前端
# ------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
# 声明构建参数
ARG VITE_BUILD_MODE=production
# 使用国内镜像加速
RUN npm config set registry https://registry.npmmirror.com/

# 复制依赖文件
COPY package*.json ./

# 安装依赖（使用 npm install 而非 ci）
RUN npm install --legacy-peer-deps

# 复制项目文件并构建
COPY . .

# 设置环境变量（在复制文件后设置，确保 .env 文件不被覆盖）
ENV VITE_BUILD_MODE=$VITE_BUILD_MODE
# 打印构建信息
RUN echo "🔨 构建模式: $VITE_BUILD_MODE"

# 检查是否存在 vite.config.ts
RUN echo "📁 检查配置文件:" && ls -la vite.config.* && \
    echo "📁 检查环境文件:" && ls -la .env*

# 根据构建模式执行构建命令
RUN if [ -n "$VITE_BUILD_MODE" ]; then \
        echo "🏗️ 使用指定的构建模式: $VITE_BUILD_MODE"; \
        npx vite build --mode $VITE_BUILD_MODE; \
        echo "✅ $VITE_BUILD_MODE 模式构建完成"; \
    else \
        echo "🚀 VITE_BUILD_MODE 未设置，使用默认模式: production"; \
        npx vite build --mode production; \
        echo "✅ production 模式构建完成"; \
    fi


# ------------------------------------------------------------
# 阶段 2：OpenResty + OpenSSL 3 + luaossl
# ------------------------------------------------------------
FROM openresty/openresty:alpine

# 使用阿里云镜像源并安装构建依赖（用于 luarocks / luaossl）
RUN set -eux; \
    sed -i 's|dl-cdn.alpinelinux.org|mirrors.aliyun.com|g' /etc/apk/repositories; \
    apk update; \
    apk add --no-cache \
        curl git perl gettext ca-certificates openssl openssl-dev \
        build-base bash unzip pkgconfig lua5.1-dev lua5.1 \
        luarocks \
    ; \
    echo "✅ Base system ready with OpenSSL:"; \
    openssl version || echo "⚠️ openssl not found (check PATH)"; \
    ln -sf /usr/bin/openssl /usr/local/bin/openssl || true

# Set Lua path env (keeps consistent with your previous Dockerfile)
ENV LUA_PATH="/usr/local/openresty/site/lualib/?.lua;/usr/local/openresty/site/lualib/?/init.lua;;"
ENV LUA_CPATH="/usr/local/openresty/site/lualib/?.so;;"

# ------------------------------------------------------------
# 将离线 tar.gz 文件复制到容器中
# ------------------------------------------------------------
COPY lua/luaossl-rel-20250929.tar.gz /tmp/luaossl-rel-20250929.tar.gz

# ------------------------------------------------------------
# 安装 luaossl (from tar.gz offline)
# ------------------------------------------------------------
RUN set -eux; \
    echo "🔍 Installing luaossl (offline from tar.gz)..."; \
    mkdir -p /tmp/luaossl-src; \
    tar -xzf /tmp/luaossl-rel-20250929.tar.gz -C /tmp/luaossl-src; \
    echo "📁 Listing directory structure:"; \
    ls -R /tmp/luaossl-src; \
    # 使用 Makefile 安装 luaossl
    cd /tmp/luaossl-src/luaossl-rel-20250929; \
    make install5.1 LUA51PATH=/usr/local/openresty/site/lualib; \
    make install5.2 LUA52PATH=/usr/local/openresty/site/lualib; \
    echo "✅ luaossl installed offline."; \
    /usr/local/openresty/luajit/bin/luajit -e 'local ok, m = pcall(require, "openssl"); print("luaossl load:", ok, m)'

# ------------------------------------------------------------
# 拷贝前端产物 + Lua 脚本 + 配置
# ------------------------------------------------------------
COPY --from=builder /app/dist /usr/local/openresty/nginx/html
COPY lua/ /usr/local/openresty/nginx/lua/
COPY nginx/default.conf.template /etc/nginx/conf.d/
COPY nginx/docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh || true

# 检查密钥文件（存在性验证）
RUN if [ ! -f /usr/local/openresty/nginx/lua/keys/private-key.der ] || [ ! -f /usr/local/openresty/nginx/lua/keys/public-key.der ]; then \
        echo "⚠️ Warning: missing key files under lua/keys (ignored in dev)"; \
    fi

# 暴露端口并设置启动命令
EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
