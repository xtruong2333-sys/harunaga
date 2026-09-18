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
  background: var(--bg-inset, #EEF4F8);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 9px;
  gap: 2px;
}

[data-theme="light"] .view-mode-switcher {
  background: #EEF4F8;
  border-color: #E2E8F0;
}

[data-theme="dark"] .view-mode-switcher {
  background: rgba(8, 14, 24, 0.75);
  border-color: rgba(125, 211, 252, 0.12);
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
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.size-sm .mode-btn {
  padding: 4px 8px;
  min-height: 26px;
}

.size-md .mode-btn {
  padding: 6px 12px;
  min-height: 32px;
}

.mode-btn:hover:not(.is-active) {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.5);
}

[data-theme="dark"] .mode-btn:hover:not(.is-active) {
  background: rgba(255, 255, 255, 0.05);
}

.mode-btn.is-active {
  background: var(--surface, #FFFFFF);
  color: var(--primary, #2563EB);
  border-color: var(--border, #E3EBF3);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(30, 60, 90, 0.06);
}

[data-theme="dark"] .mode-btn.is-active {
  background: rgba(20, 32, 54, 0.85);
  color: #38BDF8;
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.12);
}

@media (max-width: 640px) {
  .mode-label {
    display: none;
  }
}
</style>
