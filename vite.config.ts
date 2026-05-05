import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { envConfigPlugin } from './vite-plugin-env-config';

/**
 * Vite 配置文件
 * 使用 env.d.ts 中定义的环境变量配置
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // 从 env.d.ts 中定义的配置读取环境变量
  // 确保 base 以 / 结尾
  const rawBase = env.VITE_CONTEXT_PATH || '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://localhost:8080';
  const serverPort = parseInt(env.VITE_SERVER_PORT || '3000', 10);

  return {
    base: base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@platform': path.resolve(__dirname, './src/platform'),
        '@runtime': path.resolve(__dirname, './src/runtime'),
        '@shared': path.resolve(__dirname, './src/shared'),
        // 确保使用 Vue 运行时构建版本，避免需要 unsafe-eval
        'vue': 'vue/dist/vue.runtime.esm-bundler.js'
      }
    },
    server: {
      host: '0.0.0.0',
      port: serverPort,
      open: true,
      cors: true,
      proxy: {
        // 将 /keys 路径代理到后端服务器
        [`${base}keys/iam-public-key`]: {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
        [`${base}keys/iam-key-id`]: {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
        // 将 /sign_code 路径代理到后端服务器
        [`${base}lua/sign_code`]: {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
        [`${base}auth/`]: {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
        // 将 /api 路径代理到后端服务器
        [`${base}api/`]: {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
      }
    },
    plugins: [
      vue(),
      envConfigPlugin(), // 生成运行时环境配置文件
    ],
    // esbuild 选项应该在顶层配置，而不是在 build 内
    esbuild: {
      // 移除 console 和 debugger
      // drop: ['console', 'debugger']
      drop: []
    },
    build: {
      // 使用 esbuild（默认，更快且不需要额外依赖）
      minify: 'esbuild'
    }
  };
});
