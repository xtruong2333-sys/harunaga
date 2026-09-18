<template>
  <div class="error-state-box" role="alert">
    <div class="error-main">
      <div class="error-icon-box">
        <AppIcon name="alert-triangle" size="20" />
      </div>

      <div class="error-info">
        <div class="error-title">{{ title || 'Không thể tải dữ liệu' }}</div>
        <div class="error-message">
          <slot name="message">{{ message }}</slot>
        </div>
      </div>
    </div>

    <div class="error-actions">
      <button
        v-if="showRetry"
        type="button"
        class="btn btn-secondary btn-sm retry-btn"
        @click="$emit('retry')"
      >
        <AppIcon name="refresh" size="14" />
        <span>{{ retryText || 'Thử Lại' }}</span>
      </button>

      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

withDefaults(
  defineProps<{
    title?: string;
    message: string;
    retryText?: string;
    showRetry?: boolean;
  }>(),
  {
    title: 'Không thể tải dữ liệu',
    retryText: 'Thử Lại',
    showRetry: true,
  }
);

defineEmits<{
  (e: 'retry'): void;
}>();
</script>

<style scoped>
.error-state-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 10px;
  background: var(--danger-soft, #FEF2F2);
  border: 1px solid #FECACA;
  color: #B91C1C;
  flex-wrap: wrap;
}

[data-theme="dark"] .error-state-box {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #FCA5A5;
}

.error-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 240px;
}

.error-icon-box {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #EF4444;
}

.error-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #991B1B;
}

[data-theme="dark"] .error-title {
  color: #F87171;
}

.error-message {
  font-size: 12.5px;
  color: inherit;
  line-height: 1.4;
}

.error-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-btn {
  background: #FFFFFF;
  border-color: #FCA5A5;
  color: #991B1B;
}

.retry-btn:hover {
  background: #FFF1F2;
  border-color: #EF4444;
}

[data-theme="dark"] .retry-btn {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #FCA5A5;
}
</style>
