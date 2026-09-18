<template>
  <div class="alert-status-container">
    <span class="status-badge" :class="statusClass">
      <span class="status-dot" />
      {{ alertHistoryService.mapAlertStatus(status) }}
    </span>
    <span
      v-if="isSendingStuck"
      class="stuck-badge"
      title="Trạng thái sending chưa cập nhật trong hơn 15 phút."
      role="note"
    >
      <AppIcon name="alert" size="11" />
      Đang gửi lâu
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { alertHistoryService } from '@/services/alert-history-service';
import type { AlertStatus } from '@/types/alert-history';

const props = defineProps<{
  status: AlertStatus;
  isSendingStuck?: boolean;
}>();

const statusClass = computed(() => {
  switch (props.status) {
    case 'sent':
      return 'is-sent';
    case 'pending':
      return 'is-pending';
    case 'sending':
      return 'is-sending';
    case 'failed':
      return 'is-failed';
    case 'unknown':
      return 'is-unknown';
    default:
      return 'is-unknown';
  }
});
</script>

<style scoped>
.alert-status-container {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.is-sent {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.is-pending {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.is-sending {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.is-failed {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.is-unknown {
  background: rgba(100, 116, 139, 0.12);
  color: #64748b;
  border: 1px solid rgba(100, 116, 139, 0.25);
}

.stuck-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 9999px;
  background: rgba(249, 115, 22, 0.12);
  color: #ea580c;
  border: 1px solid rgba(249, 115, 22, 0.3);
  font-size: 10.5px;
  font-weight: 600;
  cursor: help;
  line-height: 1.2;
}
</style>
