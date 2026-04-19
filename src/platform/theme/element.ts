/**
 * Element Plus 变量映射
 * 将主题变量映射到 Element Plus 的 CSS 变量
 */

export const mapElementPlusVariables = (): void => {
  const root = document.documentElement;

  // 主色调映射
  root.style.setProperty('--el-color-primary', 'var(--color-primary)');
  root.style.setProperty('--el-color-primary-light-3', 'var(--color-primary-light-3)');
  root.style.setProperty('--el-color-primary-light-5', 'var(--color-primary-light)');
  root.style.setProperty('--el-color-primary-dark-2', 'var(--color-primary-dark)');

  // 文本色映射
  root.style.setProperty('--el-text-color-primary', 'var(--text-color-primary)');
  root.style.setProperty('--el-text-color-regular', 'var(--text-color-regular)');
  root.style.setProperty('--el-text-color-secondary', 'var(--text-color-secondary)');
  root.style.setProperty('--el-text-color-placeholder', 'var(--text-color-placeholder)');

  // 边框色映射
  root.style.setProperty('--el-border-color', 'var(--border-color-base)');
  root.style.setProperty('--el-border-color-light', 'var(--border-color-light)');
  root.style.setProperty('--el-border-color-lighter', 'var(--border-color-lighter)');
  root.style.setProperty('--el-border-color-extra-light', 'var(--border-color-extra-light)');

  // 背景色映射
  root.style.setProperty('--el-bg-color', 'var(--bg-color)');
  root.style.setProperty('--el-bg-color-page', 'var(--bg-color-page)');
  root.style.setProperty('--el-bg-color-overlay', 'var(--bg-color-overlay)');

  // 状态色映射
  root.style.setProperty('--el-color-success', 'var(--color-success)');
  root.style.setProperty('--el-color-warning', 'var(--color-warning)');
  root.style.setProperty('--el-color-danger', 'var(--color-danger)');
  root.style.setProperty('--el-color-info', 'var(--color-info)');

  // 卡片组件映射
  root.style.setProperty('--el-card-bg-color', 'var(--card-bg)');
  root.style.setProperty('--el-card-border-color', 'var(--card-border)');
  root.style.setProperty('--el-card-border-radius', 'var(--border-radius-md)');

  // 确保 Element Plus 组件使用主题背景色
  root.style.setProperty('--el-fill-color-blank', 'var(--bg-color)');
  root.style.setProperty('--el-fill-color', 'var(--bg-color-page)');
  
  // 下拉菜单组件映射
  root.style.setProperty('--el-bg-color-overlay', 'var(--dropdown-bg)');
  root.style.setProperty('--el-fill-color-light', 'var(--dropdown-bg-hover)');
};
