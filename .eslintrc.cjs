module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    // 平台级建议：不要过度约束业务
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    // 提示级规则（不阻断构建）
    'no-console': 'off',
    'no-debugger': 'warn',

    // g2rain 风格建议
    'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
  },
};
