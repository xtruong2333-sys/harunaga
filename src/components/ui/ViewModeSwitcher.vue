<template>
  <div
    class="view-mode-switcher"
    :class="[`size-${size || 'md'}`]"
    role="radiogroup"
    aria-label="Chế độ xem"
  >
    <button
      v-for="mode in modes"
      :key="mode.id"
      type="button"
      role="radio"
      :aria-checked="modelValue === mode.id"
      :aria-label="mode.label || mode.title || mode.id"
      class="mode-btn"
      :class="{ 'is-active': modelValue === mode.id }"
      :title="mode.title || mode.label"
      @click="selectMode(mode.id)"
    >
      <AppIcon v-if="mode.icon" :name="mode.icon" :size="size === 'sm' ? 14 : 16" />
      <span v-if="mode.label" class="mode-label">{{ mode.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';

export interface ViewModeItem {
  id: string;
  label?: string;
  icon?: string;
  title?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    modes: ViewModeItem[];
    storageKey?: string;
    size?: 'sm' | 'md';
  }>(),
  {
    size: 'md',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

function selectMode(id: string) {
  emit('update:modelValue', id);
  emit('change', id);
  if (props.storageKey && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(props.storageKey, id);
    } catch {
      // Ignore localStorage errors
    }
  }
}

onMounted(() => {
  if (props.storageKey && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(props.storageKey);
      if (saved && props.modes.some((m) => m.id === saved)) {
        if (saved !== props.modelValue) {
          emit('update:modelValue', saved);
          emit('change', saved);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }
});
</script>

<style scoped>
.view-mode-switcher {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: 11px;
  gap: 2px;
}

.mode-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all .15s ease;
  white-space: nowrap;
}

.size-sm .mode-btn {
  padding: 5px 8px;
  min-height: 28px;
}

.size-md .mode-btn {
  padding: 6px 11px;
  min-height: 32px;
}

.mode-btn:hover:not(.is-active) {
  color: var(--text-primary);
  background: rgba(255,255,255,.55);
}

[data-theme="dark"] .mode-btn:hover:not(.is-active) {
  background: rgba(255,255,255,.04);
}

.mode-btn.is-active {
  background: var(--surface);
  color: var(--primary);
  border-color: var(--border);
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(15,31,53,.07);
}

@media (max-width: 640px) {
  .mode-label { display: none; }
}
</style>
