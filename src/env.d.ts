declare module '*.css';
interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_APPLICATION_CODE: string; // 应用编码
  readonly VITE_CONTEXT_PATH: string; // 上下文路径（替代 VITE_BASE_URL）
  readonly VITE_BACKEND_ORIGIN: string; // 后端服务器地址
  readonly VITE_TOKEN_END_POINT: string; // token路径（用于刷新和创建token）
  readonly VITE_SSO_BASE_URL: string; // SSO跳转基础地址（不包含路径）
  readonly VITE_AUTH_END_POINT: string; // sso的认证URL
  readonly VITE_REDIRECT_URI: string; // sso回调页面
  readonly VITE_MOCK_ENABLED?: string; // 是否启用 mock（'true' 或 'false'）
  readonly VITE_SERVER_PORT?: string; // 开发服务器端口号
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
