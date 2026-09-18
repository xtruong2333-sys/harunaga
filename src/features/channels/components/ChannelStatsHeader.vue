<template>
  <div class="channel-stats-strip">
    <!-- Focal Stat: Đang theo dõi -->
    <div class="stat-item stat-focal">
      <div class="stat-header">
        <span class="pulse-indicator"></span>
        <span class="stat-label">Đang theo dõi</span>
      </div>
      <div class="stat-value text-active">{{ activeCount }}</div>
      <div class="stat-sub">Kênh đang quét định kỳ</div>
    </div>

    <div class="stat-divider"></div>

    <!-- Supporting Stat 1: Tổng số kênh -->
    <div class="stat-item">
      <div class="stat-header">
        <span class="stat-label">Tổng số kênh</span>
      </div>
      <div class="stat-value">{{ totalCount }}</div>
      <div class="stat-sub">Trong danh bạ đối thủ</div>
    </div>

    <div class="stat-divider"></div>

    <!-- Supporting Stat 2: Tạm dừng -->
    <div class="stat-item">
      <div class="stat-header">
        <span class="stat-label">Tạm dừng quét</span>
      </div>
      <div class="stat-value text-paused">{{ pausedCount }}</div>
      <div class="stat-sub">Không gửi request mới</div>
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
.channel-stats-strip {
  display: flex;
  align-items: stretch;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 24px;
  gap: 24px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.stat-focal {
  flex: 1.2;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--status-active, #10B981);
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-ring 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
  flex-shrink: 0;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  margin-top: 6px;
  line-height: 1.1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-active {
  color: var(--status-active, #10B981);
}

.text-paused {
  color: var(--status-paused, #F59E0B);
}

.stat-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  background-color: var(--border-subtle);
  align-self: stretch;
}

@media (max-width: 768px) {
  .channel-stats-strip {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  .stat-divider {
    width: 100%;
    height: 1px;
  }
  .stat-value {
    font-size: 24px;
  }
}
</style>
