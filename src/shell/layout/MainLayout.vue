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

      <!-- 主内容区 -->
      <div class="app-content">
        <!-- 多Tab组件 -->
        <TabBar />
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
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow-y: auto; /* 允许垂直滚动 */
  overflow-x: hidden; /* 水平方向隐藏溢出 */
  display: flex;
  flex-direction: column;
  min-height: 0; /* 确保 flex 子元素可以缩小 */
}
</style>
