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
  padding: 15px 17px;
  border-radius: 13px;
  background: #FEF1F1;
  border: 1px solid #F1C4C4;
  color: #B42323;
  flex-wrap: wrap;
}

[data-theme="dark"] .error-state-box {
  background: rgba(239,68,68,.10);
  border-color: rgba(248,113,113,.24);
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
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #C53030;
  background: rgba(255,255,255,.55);
  border-radius: 10px;
}

.error-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-title {
  font-size: 13.5px;
  font-weight: 740;
  color: #9F1D1D;
}

[data-theme="dark"] .error-title {
  color: #FCA5A5;
}

.error-message {
  font-size: 12.5px;
  color: inherit;
  line-height: 1.45;
}

.error-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-btn {
  background: #FFF;
  border-color: #EAB1B1;
  color: #9F1D1D;
}
</style>
