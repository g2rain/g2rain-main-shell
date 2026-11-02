<template>
  <router-view
    v-if="$route.path.endsWith('/sso_callback') || $route.path.endsWith('/logout')"
  />

  <div v-else class="app-container">
    <!-- 头部 -->
    <Header />

    <div class="app-main">
      <!-- 侧边栏 -->
      <Sidebar />

      <!-- 主内容区：外层不滚，Tab 固定，滚动在 Tab 内容 pane -->
      <div class="app-content">
        <TabBar class="app-tab-host" />
      </div>
    </div>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue';
import Sidebar from './Sidebar.vue';
import TabBar from './TabBar.vue';
import Footer from './Footer.vue';
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-main {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.app-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-tab-host {
  flex: 1;
  min-height: 0;
  height: 100%;
}
</style>
