<template>
  <div class="overview-metric-cluster">
    <!-- 1. Kênh theo dõi -->
    <div class="kpi-item">
      <div class="kpi-val mono">{{ activeChannels }}</div>
      <div class="kpi-label">KÊNH ĐANG THEO DÕI</div>
      <div class="kpi-sub">Đang quét định kỳ</div>
    </div>

    <div class="kpi-divider"></div>

    <!-- 2. Tổng video -->
    <div class="kpi-item">
      <div class="kpi-val mono">{{ formatNumber(totalVideos) }}</div>
      <div class="kpi-label">TỔNG VIDEO</div>
      <div class="kpi-sub">Lưu trong cơ sở dữ liệu</div>
    </div>

    <div class="kpi-divider"></div>

    <!-- 3. Đang tăng -->
    <div class="kpi-item is-rising">
      <div class="kpi-val mono text-accent">{{ risingVideos }}</div>
      <div class="kpi-label">ĐANG TĂNG</div>
      <div class="kpi-sub">VPH đo được > 0</div>
    </div>

    <div class="kpi-divider"></div>

    <!-- 4. Max VPH -->
    <div class="kpi-item is-max-vph">
      <div class="kpi-val mono text-positive">
        {{ maxVph !== null && maxVph > 0 ? `${formatNumber(Math.round(maxVph))} VPH` : '—' }}
      </div>
      <div class="kpi-label">MAX VPH</div>
      <div class="kpi-sub">Tốc độ đột phá cao nhất</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeChannels: number;
  totalVideos: number;
  risingVideos: number;
  maxVph: number | null;
}>();

function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('vi-VN');
}
</script>

<style scoped>
.overview-metric-cluster {
  display: flex;
  align-items: center;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  padding: 16px 20px;
  box-shadow: var(--shadow-sm, 0 4px 14px rgba(30, 60, 90, 0.05));
  gap: 0;
  width: 100%;
}

[data-theme="light"] .overview-metric-cluster {
  background: rgba(255, 255, 255, 0.9);
  border-color: #E2E8F0;
}

[data-theme="dark"] .overview-metric-cluster {
  background: rgba(10, 17, 29, 0.72);
  border-color: rgba(125, 211, 252, 0.12);
}

.kpi-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0 16px;
}

.kpi-item:first-child {
  padding-left: 4px;
}

.kpi-item:last-child {
  padding-right: 4px;
}

.kpi-val {
  font-size: clamp(20px, 2.2vw, 26px);
  font-weight: 750;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.kpi-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.kpi-sub {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.kpi-divider {
  width: 1px;
  height: 38px;
  background: var(--border, #E3EBF3);
}

[data-theme="dark"] .kpi-divider {
  background: rgba(255, 255, 255, 0.08);
}

.text-accent {
  color: var(--primary, #2563EB);
}

[data-theme="dark"] .text-accent {
  color: #38BDF8;
}

.text-positive {
  color: #059669;
}

[data-theme="dark"] .text-positive {
  color: #34D399;
}

@media (max-width: 768px) {
  .overview-metric-cluster {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 16px;
  }
  .kpi-divider {
    display: none;
  }
  .kpi-item {
    padding: 0;
  }
}
</style>
