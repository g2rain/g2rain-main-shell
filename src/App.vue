<template>
  <el-config-provider :locale="elementPlusLocale">
    <MainLayout />
  </el-config-provider>
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue';
import { ElConfigProvider } from 'element-plus';
import type { Language } from 'element-plus/es/locale';
import { storeToRefs } from 'pinia';
import { MainLayout } from '@/shell';
import { useLocaleStore } from '@platform/stores/locale.store';
import { loadElementPlusLocaleByCode } from '@platform/locale';

const { locale: userLocale } = storeToRefs(useLocaleStore());
const elementPlusLocale = shallowRef<Language>();

watch(
  userLocale,
  (code) => {
    void loadElementPlusLocaleByCode(code || 'zh-CN').then((loc) => {
      elementPlusLocale.value = loc;
    });
  },
  { immediate: true },
);
</script>
