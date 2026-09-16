<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Tổng số kênh</div>
      <div class="stat-value">{{ totalCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Đang theo dõi</div>
      <div class="stat-value stat-active">{{ activeCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Tạm dừng</div>
      <div class="stat-value stat-paused">{{ pausedCount }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  totalCount: number;
  activeCount: number;
  pausedCount: number;
}>();
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 6px;
  line-height: 1;
}

.stat-active {
  color: var(--status-active);
}

.stat-paused {
  color: var(--status-paused);
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .stat-card {
    padding: 12px 16px;
  }
  .stat-value {
    font-size: 22px;
  }
}
</style>
