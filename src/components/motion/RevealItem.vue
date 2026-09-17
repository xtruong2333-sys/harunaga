<template>
  <component
    :is="tag || 'div'"
    class="reveal-item"
    :style="computedStyle"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    tag?: string;
    delay?: number;
    index?: number;
  }>(),
  {
    tag: 'div',
    delay: 0,
    index: 0,
  }
);

const computedStyle = computed(() => {
  const ms = props.delay > 0 ? props.delay : props.index * 60;
  return {
    animationDelay: `${ms}ms`,
  };
});
</script>

<style scoped>
.reveal-item {
  animation: reveal-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal-item {
    animation: none !important;
    opacity: 1;
    transform: none;
  }
}
</style>
