<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Tổng video</div>
      <div class="stat-value">{{ totalCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Video đang tăng</div>
      <div class="stat-value stat-rising">{{ risingCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">VPH cao nhất</div>
      <div class="stat-value stat-highlight">{{ formattedMaxVph }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Đã cảnh báo</div>
      <div class="stat-value stat-alerted">{{ alertedCount }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  totalCount: number;
  risingCount: number;
  maxVph: number | null;
  alertedCount: number;
}>();

const formattedMaxVph = computed(() => {
  if (props.maxVph === null || props.maxVph === undefined || props.maxVph === 0) {
    return 'Chưa có';
  }
  return `${Math.round(props.maxVph).toLocaleString('vi-VN')} VPH`;
});
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px 20px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 6px;
  line-height: 1.1;
}

.stat-rising {
  color: var(--accent);
}

.stat-highlight {
  color: #38BDF8;
}

.stat-alerted {
  color: var(--status-active);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-value {
    font-size: 22px;
  }
}
</style>
