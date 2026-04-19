<template>
  <div class="workspace">
    <!-- 平台简介 -->
    <el-card class="welcome-card" shadow="never">
      <h1 class="title">g2rain 开源 SaaS 平台</h1>
      <p class="subtitle">面向企业级场景的可持续交付 SaaS 开源平台</p>

      <p class="description">
        g2rain 是一个面向企业级应用的开源 SaaS 平台，围绕
        <strong>统一认证与授权</strong>、 <strong>微前端架构</strong>、
        <strong>统一管理后台</strong> 等核心能力， 提供从
        <strong>网关、SSO、主应用壳、子应用</strong> 到
        <strong>工程化规范</strong> 的一整套解决方案， 帮助企业持续、低成本地交付 SaaS 产品。
      </p>
    </el-card>

    <!-- 底部内容区域 -->
    <div class="bottom-content">
      <!-- 平台特性 -->
      <el-row :gutter="16" class="feature-row">
        <el-col :span="8">
          <el-card shadow="never">
            <h3>🔐 统一认证与授权</h3>
            <p>内置 SSO、Token 生命周期管理、多应用统一身份体系， 支持多租户与复杂企业权限场景。</p>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never">
            <h3>🧩 微前端架构</h3>
            <p>基于 qiankun 构建的主应用 + 子应用体系， 支持按租户、按权限动态加载业务模块。</p>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never">
            <h3>♻️ 可持续交付</h3>
            <p>
              从工程模板、运行时能力到平台规范， 帮助 SaaS 产品在长期演进中保持可维护性与可扩展性。
            </p>
          </el-card>
        </el-col>
      </el-row>

      <!-- 平台资源与联系方式 -->
      <el-card class="link-card" shadow="never">
        <el-row :gutter="24">
          <el-col :span="12">
            <h3 class="section-title">📚 平台资源</h3>
            <ul class="link-list">
              <li>
                <span>项目主页：</span>
                <a href="https://github.com/g2rain" target="_blank" rel="noopener noreferrer">
                  https://github.com/g2rain
                </a>
              </li>
              <li>
                <span>官方文档：</span>
                <a
                  href="https://github.com/g2rain/g2rain"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://github.com/g2rain/g2rain
                </a>
              </li>
              <li>
                <span>讨论区：</span>
                <a
                  href="https://github.com/g2rain/g2rain/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Discussions
                </a>
              </li>
              <li>
                <span>官方网站：</span>
                <a href="http://www.g2rain.com" target="_blank" rel="noopener noreferrer">
                  http://www.g2rain.com
                </a>
              </li>
            </ul>
          </el-col>
          <el-col :span="12">
            <h3 class="section-title">📮 联系我们</h3>
            <ul class="link-list">
              <li>
                <span>联系邮箱：</span>
                <a href="mailto:g2rain_developer@163.com"> g2rain_developer@163.com </a>
              </li>
              <li>
                <span>微信公众号：</span>
                <strong>谷雨开源SaaS</strong>
              </li>
            </ul>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
// 平台介绍页，无业务逻辑
</script>

<style scoped>
.workspace {
  padding: var(--spacing-md);
  background-color: var(--bg-color-page);
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.welcome-card {
  margin-bottom: var(--spacing-md);
  background-color: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  box-shadow: var(--card-shadow) !important;
  flex-shrink: 0;
}

.welcome-card :deep(.el-card__body) {
  background-color: var(--card-bg);
  color: var(--text-color-primary);
}

.title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
  color: var(--text-color-primary);
}

.subtitle {
  color: var(--text-color-secondary);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.description {
  line-height: var(--line-height-relaxed);
  color: var(--text-color-primary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.bottom-content {
  margin-top: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.feature-row {
  margin-bottom: var(--spacing-md);
}

.feature-row :deep(.el-card) {
  padding: var(--spacing-md);
  background-color: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  box-shadow: var(--card-shadow) !important;
}

.feature-row :deep(.el-card__body) {
  background-color: var(--card-bg);
  color: var(--text-color-primary);
}

.feature-row :deep(.el-card h3) {
  font-size: var(--font-size-md);
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-color-primary);
  font-weight: var(--font-weight-semibold);
}

.feature-row :deep(.el-card p) {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-relaxed);
  margin: 0;
  color: var(--text-color-secondary);
}

.link-card {
  padding: var(--spacing-md);
  background-color: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  box-shadow: var(--card-shadow) !important;
}

.link-card :deep(.el-card__body) {
  background-color: var(--card-bg);
  color: var(--text-color-primary);
}

.section-title {
  font-size: var(--font-size-md);
  margin: 0 0 var(--spacing-md) 0;
  font-weight: var(--font-weight-semibold);
  color: var(--text-color-primary);
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.link-list li {
  line-height: var(--line-height-relaxed);
  color: var(--text-color-primary);
  font-size: var(--font-size-xs);
  margin-bottom: var(--spacing-xs);
}

.link-list li:last-child {
  margin-bottom: 0;
}

.link-list span {
  color: var(--text-color-secondary);
  display: inline-block;
  min-width: 80px;
}

.link-list a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-duration-fast) var(--transition-timing-function);
}

.link-list a:hover {
  color: var(--color-primary-light-3);
  text-decoration: underline;
}
</style>
