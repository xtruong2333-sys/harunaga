<template>
  <div
    class="data-health-avatar"
    :style="{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px` }"
  >
    <img
      v-if="avatarUrl && !imgError"
      :src="avatarUrl"
      :alt="name"
      class="avatar-img"
      loading="lazy"
      @error="imgError = true"
    />
    <div v-else class="avatar-fallback" :aria-label="name">
      {{ initial }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    avatarUrl?: string | null;
    name: string;
    size?: number;
  }>(),
  {
    avatarUrl: null,
    size: 36,
  }
);

const imgError = ref(false);

watch(
  () => props.avatarUrl,
  () => {
    imgError.value = false;
  }
);

const initial = computed(() => {
  if (!props.name) return '?';
  const clean = props.name.trim();
  return clean ? clean.charAt(0).toUpperCase() : '?';
});
</script>

<style scoped>
.data-health-avatar {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--bg-inset, #EEF4F8);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  user-select: none;
}

[data-theme="dark"] .data-health-avatar {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: calc(var(--size, 36px) * 0.42);
  color: var(--text-secondary, #475569);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.18));
}

[data-theme="dark"] .avatar-fallback {
  color: #CBD5E1;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(59, 130, 246, 0.2));
}
</style>
