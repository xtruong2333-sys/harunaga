<template>
  <AppIntro
    v-if="showIntro"
    @enter="handleEnterDashboard"
  />
  <AppLayout>
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import AppIntro from '@/components/motion/AppIntro.vue';

const showIntro = ref(true);

function handleEnterDashboard() {
  showIntro.value = false;
}
</script>

