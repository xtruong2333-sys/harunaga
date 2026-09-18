<template>
  <span
    class="opportunity-status-badge"
    :class="[`badge-${type}`, `tone-${tone}`]"
  >
    <span class="badge-dot" v-if="showDot"></span>
    <span class="badge-text">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    type?: 'threshold' | 'rising' | 'alert';
    isOverThreshold?: boolean;
    measuredVph?: number | null;
    alertStatus?: string | null;
    customLabel?: string;
  }>(),
  {
    type: 'threshold',
    isOverThreshold: false,
  }
);

const label = computed(() => {
  if (props.customLabel) return props.customLabel;

  if (props.type === 'threshold') {
    return props.isOverThreshold ? 'VƯỢT NGƯỠNG' : 'CHƯA VƯỢT';
  }

  if (props.type === 'rising') {
    return props.measuredVph !== null && props.measuredVph !== undefined && props.measuredVph > 0
      ? 'ĐANG TĂNG'
      : 'CHƯA TĂNG';
  }

  if (props.type === 'alert') {
    switch (props.alertStatus) {
      case 'sent':
        return 'ĐÃ CẢNH BÁO';
      case 'pending':
        return 'CHỜ GỬI';
      case 'sending':
        return 'ĐANG GỬI';
      case 'failed':
        return 'GỬI LỖI';
      default:
        return 'CHƯA CẢNH BÁO';
    }
  }

  return 'TÍN HIỆU';
});

const tone = computed(() => {
  if (props.type === 'threshold') {
    return props.isOverThreshold ? 'success' : 'neutral';
  }
  if (props.type === 'rising') {
    return props.measuredVph && props.measuredVph > 0 ? 'accent' : 'neutral';
  }
  if (props.type === 'alert') {
    if (props.alertStatus === 'sent') return 'success';
    if (props.alertStatus === 'pending' || props.alertStatus === 'sending') return 'warning';
    if (props.alertStatus === 'failed') return 'danger';
    return 'neutral';
  }
  return 'neutral';
});

const showDot = computed(() => {
  return tone.value === 'success' || tone.value === 'accent' || tone.value === 'warning';
});
</script>

<style scoped>
.opportunity-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tone-success {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
}

.tone-success .badge-dot {
  background: #10B981;
}

[data-theme="dark"] .tone-success {
  background: rgba(16, 185, 129, 0.15);
  color: #34D399;
  border-color: rgba(16, 185, 129, 0.3);
}

.tone-accent {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
}

.tone-accent .badge-dot {
  background: #3B82F6;
}

[data-theme="dark"] .tone-accent {
  background: rgba(37, 99, 235, 0.15);
  color: #60A5FA;
  border-color: rgba(37, 99, 235, 0.35);
}

.tone-warning {
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid #FDE68A;
}

.tone-warning .badge-dot {
  background: #F59E0B;
}

[data-theme="dark"] .tone-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #FBBF24;
  border-color: rgba(245, 158, 11, 0.3);
}

.tone-danger {
  background: #FEF2F2;
  color: #EF4444;
  border: 1px solid #FECACA;
}

.tone-danger .badge-dot {
  background: #EF4444;
}

[data-theme="dark"] .tone-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.tone-neutral {
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-secondary, #64748B);
  border: 1px solid var(--border, #E3EBF3);
}
</style>
