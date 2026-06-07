<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-links">
        <span class="copyright">{{ $t('MS_FTR_COPY', '© 2026 谷雨开源SaaS(G2rain)') }}</span>
        <span class="divider">|</span>
        <a
          href="http://www.g2rain.com"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >
          {{ $t('MS_FTR_SITE', 'G2rain官网') }}
        </a>
        <span class="divider">|</span>
        <a
          href="https://github.com/g2rain"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >
          {{ $t('MS_FTR_HOME', '项目主页') }}
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Footer 组件，包含版权信息和相关链接
</script>

<style scoped>
.app-footer {
  height: var(--footer-height);
  background-color: var(--footer-bg);
  border-top: 1px solid var(--footer-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 var(--spacing-lg);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--footer-text);
}

.copyright {
  color: var(--footer-text-secondary);
}

.divider {
  color: var(--border-color-base);
  margin: 0 var(--spacing-xs);
}

.footer-link {
  color: var(--footer-link);
  text-decoration: none;
  transition: color var(--transition-duration-fast) var(--transition-timing-function);
}

.footer-link:hover {
  color: var(--footer-link-hover);
  text-decoration: underline;
}
</style>
