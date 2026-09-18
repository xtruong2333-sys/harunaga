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
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border-radius: 14px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
}

.empty-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border: 1px solid #DBEAFE;
}

[data-theme="dark"] .empty-icon-box {
  background: rgba(14, 165, 233, 0.12);
  color: #38BDF8;
  border-color: rgba(56, 189, 248, 0.25);
}

.empty-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 440px;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
</style>
