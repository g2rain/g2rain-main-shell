# 安全边界

- IAM 签发身份和 Token，Gateway/领域服务执行最终鉴权；Shell 的菜单和页面控制不是安全边界。
- Token 不进入 URL、持久日志或跨应用广播；消息接收方必须校验来源、appKey、实例和请求关联。
- 子应用 `entry` 只允许可信来源，禁止由未经验证的 URL 参数直接控制。
- 浏览器可见的 `VITE_*`、`window._env_`、Mock 和静态资源不能包含 Secret。
- OpenResty/Lua 签名端点需要输入限制、来源限制、算法约束、审计与密钥轮换。
- 当前被 Git 跟踪的 `lua/keys/private-key.pem` 是转正阻断项：必须确认它是否为不可用测试夹具；生产密钥必须从仓库和镜像构建上下文移除，改为运行时安全注入。
- CSP、CORS、Cookie、回调地址和代理 Header 需按部署域名共同审核，不能只在本地成功。
