<template>
  <div class="overview-metric-cluster">
    <!-- 1. Kênh theo dõi -->
    <div class="kpi-item">
      <div v-if="loading" class="kpi-skeleton"></div>
      <div v-else class="kpi-val mono">{{ activeChannels }}</div>
      <div class="kpi-label">KÊNH ĐANG THEO DÕI</div>
      <div class="kpi-sub">Đang quét định kỳ</div>
    </div>

    <div class="kpi-divider"></div>

    <!-- 2. Tổng video -->
    <div class="kpi-item">
      <div v-if="loading" class="kpi-skeleton"></div>
      <div v-else class="kpi-val mono">{{ formatNumber(totalVideos) }}</div>
      <div class="kpi-label">TỔNG VIDEO</div>
      <div class="kpi-sub">Lưu trong cơ sở dữ liệu</div>
    </div>

    <div class="kpi-divider"></div>

    <!-- 3. Đang tăng -->
    <div class="kpi-item is-rising">
      <div v-if="loading" class="kpi-skeleton"></div>
      <div v-else class="kpi-val mono text-accent">{{ risingVideos }}</div>
      <div class="kpi-label">ĐANG TĂNG</div>
      <div class="kpi-sub">VPH đo được > 0</div>
    </div>

    <div class="kpi-divider"></div>

    <!-- 4. Max VPH -->
    <div class="kpi-item is-max-vph">
      <div v-if="loading" class="kpi-skeleton"></div>
      <div v-else class="kpi-val mono text-positive">
        {{ maxVph !== null && maxVph > 0 ? `${formatNumber(Math.round(maxVph))} VPH` : '—' }}
      </div>
      <div class="kpi-label">MAX VPH</div>
      <div class="kpi-sub">Tốc độ đột phá cao nhất</div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    activeChannels: number;
    totalVideos: number;
    risingVideos: number;
    maxVph: number | null;
    loading?: boolean;
  }>(),
  {
    loading: false,
  }
);

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
  border-radius: var(--radius-md, 8px);
  padding: 0.875rem 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.kpi-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 0.5rem;
}

.kpi-skeleton {
  width: 48px;
  height: 24px;
  border-radius: 4px;
  background: var(--border, #E3EBF3);
  margin-bottom: 0.25rem;
  animation: pulse-skeleton 1.5s ease-in-out infinite alternate;
}

@keyframes pulse-skeleton {
  0% { opacity: 0.4; }
  100% { opacity: 0.85; }
}

.kpi-val {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary, #0F172A);
  letter-spacing: -0.02em;
}

.text-accent {
  color: var(--brand-primary, #2563EB) !important;
}

.text-positive {
  color: var(--color-success-text, #059669) !important;
}

.kpi-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-tertiary, #64748B);
  letter-spacing: 0.04em;
  margin-top: 0.25rem;
}

.kpi-sub {
  font-size: 0.625rem;
  color: var(--text-muted, #94A3B8);
  margin-top: 0.125rem;
}

.kpi-divider {
  width: 1px;
  height: 36px;
  background: var(--border, #E3EBF3);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .overview-metric-cluster {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .kpi-divider {
    display: none;
  }

  .kpi-item {
    align-items: flex-start;
    text-align: left;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px dashed var(--border, #E3EBF3);
  }

  .kpi-item:nth-last-child(-n+2) {
    border-bottom: none;
  }
}
</style>
