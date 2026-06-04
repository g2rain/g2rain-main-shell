# g2rain-main-shell 国际化用法
# 页面国际化用法

登录后由 `localeStore` 拉取文案包，Header 切换语言会自动重新拉包；HTTP 自动带 `Accept-Language`（当前 `localeStore.locale`，如 `zh-CN`）。
## 三种写法

## 三种写法

| 场景 | 写法 |
|------|------|
| 模板 | `{{ $t('MESSAGE_CODE', '页面默认文案') }}` |
| JS 要一段文字 | `t('MESSAGE_CODE', '页面默认文案')` |
| JS 弹提示 | `ElMessage.success(t('MESSAGE_CODE', '保存成功'))` |
| 菜单 / Tab | 使用 `menu_code` 作 key，`resolveMenuTitle()`（MenuItem / TabBar） |
## 约定

## Key 命名
## 页面默认值

| 前缀 | Tag | 说明 |
|------|-----|------|
| `G2_*` | G2RAIN_SHARED | 按钮、字段、占位、校验、前端错误码 |
| `MS_*` | MAIN_SHELL | 壳层与业务页专属文案 |
| `menu_code` | MAIN_SHELL（通常） | 菜单 / Tab 标题 |
## 子应用（qiankun props）

完整 key 清单见 [KEYS.md](./KEYS.md)。

## 文案包 tags（`.env`）

- 配置项：`VITE_I18N_TAGS`（见 `.env` / `.env.production`，逗号分隔）
- 本应用默认：`G2RAIN_SHARED,MAIN_SHELL`
- 顺序：**`G2RAIN_SHARED` 在前**（公共文案），**应用 tag 在后**（同名 `message_code` 由应用覆盖公共）
- 实现：`runtime/api/i18n.api.ts` 读取 `env.VITE_I18N_TAGS`，请求参数名为 **`tags`**
- 拉包：`GET /api/infra/i18n_message/locale?tags=G2RAIN_SHARED,MAIN_SHELL&locale=zh-CN`

## 约定

- 文案编码与后台 `i18n_message.message_code` 一致；页面 key 建议带应用/模块前缀，避免冲突。
- 模板不要用 `useI18n`，已开启 `globalInjection`，直接用 `$t`。
- 样例见 `views/passport/index.vue`。

## 页面默认值

第二个参数写在**当前页面**即可：后台未配置（或文案为空）时显示该默认文案；后台有配置则用后台文案。不要单独维护 defaults 文件。

## 子应用（qiankun props）

主应用仅传入 `locale`（如 `zh-CN`）；子应用据此拉包并设 `Accept-Language`。切换语言会自动 `update` 已挂载子应用。
