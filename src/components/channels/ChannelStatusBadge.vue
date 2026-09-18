<template>
  <span class="channel-status-badge" :class="`status-${status}`">
    <span class="status-dot"></span>
    <span class="status-text">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChannelStatus } from '@/types/channel';

const props = defineProps<{
  status: ChannelStatus;
}>();

const label = computed(() => {
  if (props.status === 'active') return 'Đang theo dõi';
  if (props.status === 'paused') return 'Tạm dừng';
  if (props.status === 'archived') return 'Đã lưu trữ';
  return props.status;
});
</script>

<style scoped>
.channel-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.1875rem 0.5rem;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.status-active {
  background: var(--color-success-bg, #ECFDF5);
  color: var(--color-success-text, #059669);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-paused {
  background: var(--color-warning-bg, #FFFBEB);
  color: var(--color-warning-text, #D97706);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.status-archived {
  background: var(--bg-surface-secondary, #F1F5F9);
  color: var(--text-tertiary, #64748B);
  border: 1px solid var(--border, #E2E8F0);
}
</style>
