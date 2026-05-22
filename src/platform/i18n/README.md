# 页面国际化用法

登录后由 `localeStore` 拉取文案包，Header 切换语言会自动重新拉包。

## 三种写法

| 场景 | 写法 |
|------|------|
| 模板 | `{{ $t('MESSAGE_CODE', '页面默认文案') }}` |
| JS 要一段文字 | `t('MESSAGE_CODE', '页面默认文案')` |
| JS 弹提示 | `ElMessage.success(t('MESSAGE_CODE', '保存成功'))` |
| 表格 / 表单 / 菜单 / Tab | 公共组件传 `labelCode` / `titleCode`（组件内 `$t`，待封装） |

## 约定

- 文案编码与后台 `i18n_message.message_code` 一致。
- 模板不要用 `useI18n`，已开启 `globalInjection`，直接用 `$t`。
- 样例见 `views/passport/index.vue`。

## 页面默认值

第二个参数写在**当前页面**即可：后台未配置（或文案为空）时显示该默认文案；后台有配置则用后台文案。不要单独维护 defaults 文件。

## 子应用（qiankun props）

主应用仅传入 `localeCode`（如 `zh-CN`）；子应用自行 parse 后拉包、设 Accept-Language。切换语言会自动 `update` 已挂载子应用。
