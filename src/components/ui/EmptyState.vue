<template>
  <div class="empty-state-card surface-card">
    <div class="empty-icon-box">
      <slot name="icon">
        <AppIcon :name="icon || 'inbox'" :size="36" />
      </slot>
    </div>

    <div class="empty-content">
      <div class="empty-title">
        <slot name="title">{{ title }}</slot>
      </div>

      <p v-if="description || $slots.description" class="empty-desc">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <div v-if="actionText || $slots.action || $slots['secondary-action']" class="empty-actions">
      <slot name="action">
        <router-link v-if="actionTo" :to="actionTo" class="btn btn-primary">
          <AppIcon v-if="actionIcon" :name="actionIcon" size="16" />
          <span>{{ actionText }}</span>
        </router-link>
        <button v-else-if="actionText" type="button" class="btn btn-primary" @click="$emit('action')">
          <AppIcon v-if="actionIcon" :name="actionIcon" size="16" />
          <span>{{ actionText }}</span>
        </button>
      </slot>

      <slot name="secondary-action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

withDefaults(
  defineProps<{
    icon?: string;
    title: string;
    description?: string;
    actionText?: string;
    actionTo?: string;
    actionIcon?: string;
  }>(),
  {
    icon: 'inbox',
  }
);

defineEmits<{
  (e: 'action'): void;
}>();
</script>

<style scoped>
.empty-state-card {
  min-height: 260px;
  padding: 44px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.empty-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: var(--primary-soft);
  color: var(--primary);
  border: 1px solid #C6D7FA;
}

[data-theme="dark"] .empty-icon-box {
  border-color: rgba(96,165,250,.24);
}

.empty-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 460px;
}

.empty-title {
  font-size: 17px;
  font-weight: 740;
  color: var(--text-primary);
}

.empty-desc {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-secondary);
  line-height: 1.55;
}

.empty-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 3px;
}
</style>
