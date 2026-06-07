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
  readonly VITE_DINGTALK_BIND_MODE?: string; // 钉钉绑定接入形态，默认 INTERNAL
  readonly VITE_I18N_TAGS?: string; // 国际化文案包 tags（逗号分隔）
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}