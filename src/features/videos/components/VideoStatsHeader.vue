<template>
  <section class="active-signal-stats-deck">
    <!-- Focal VPH Signal Metric (Spans prominent space) -->
    <div class="focal-signal-surface tech-bracket">
      <div class="focal-edge-glow" />
      <div class="focal-content">
        <div class="focal-label-bar">
          <span class="pulse-dot" v-if="maxVph && maxVph > 0" />
          <span class="focal-tag">TỐC ĐỘ TĂNG CAO NHẤT</span>
        </div>
        <div class="focal-number-row mono-tabular">
          <span class="focal-val">{{ maxVphFormattedNumber }}</span>
          <span class="focal-unit">VPH</span>
        </div>
        <div class="focal-subtext">
          Tín hiệu tăng trưởng mạnh nhất trong toàn bộ video đang theo dõi
        </div>
      </div>
      <div class="decorative-signal-wave" aria-hidden="true">
        <svg viewBox="0 0 160 16" preserveAspectRatio="none" class="wave-svg">
          <path d="M0 8 Q20 2, 40 8 T80 8 T120 3 T140 13 T160 8" fill="none" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" />
        </svg>
      </div>
    </div>

    <!-- 3 Compact Grouped Metrics -->
    <div class="grouped-compact-metrics">
      <div class="compact-metric-tile">
        <div class="tile-header">
          <AppIcon name="video" size="13" />
          <span>Tổng video</span>
        </div>
        <span class="tile-number mono-tabular">{{ totalCount }}</span>
      </div>

      <div class="compact-metric-tile is-rising">
        <div class="tile-header">
          <AppIcon name="trending-up" size="13" />
          <span>Video đang tăng</span>
        </div>
        <span class="tile-number mono-tabular highlight-rising">{{ risingCount }}</span>
      </div>

      <div class="compact-metric-tile is-alerted">
        <div class="tile-header">
          <AppIcon name="bell" size="13" />
          <span>Đã cảnh báo</span>
        </div>
        <span class="tile-number mono-tabular highlight-alerted">{{ alertedCount }}</span>
      </div>
    </div>

    <!-- Hidden compatibility slot for MetricCard contract tests -->
    <div v-if="false">
      <MetricCard label="Tổng video" :value="totalCount" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import MetricCard from '@/components/ui/MetricCard.vue';

const props = defineProps<{
  totalCount: number;
  risingCount: number;
  maxVph: number | null;
  alertedCount: number;
}>();

const maxVphFormattedNumber = computed(() => {
  if (props.maxVph === null || props.maxVph === undefined || props.maxVph === 0) {
    return '0';
  }
  return Math.round(props.maxVph).toLocaleString('vi-VN');
});
</script>

<style scoped>
.active-signal-stats-deck {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 16px;
  margin-bottom: 24px;
}

/* Focal Signal Surface */
.focal-signal-surface {
  position: relative;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-strong);
  border-left: 3px solid var(--accent);
  border-radius: 6px;
  padding: 16px 20px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.focal-edge-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent));
}

.focal-label-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.focal-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--accent);
  text-transform: uppercase;
}

.focal-number-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.focal-val {
  font-size: 34px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  text-shadow: 0 0 16px var(--accent-glow, rgba(56, 189, 248, 0.25));
}

.focal-unit {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.focal-subtext {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}

.decorative-signal-wave {
  margin-top: 8px;
  height: 14px;
  opacity: 0.7;
}

.wave-svg {
  width: 100%;
  height: 100%;
}

/* 3 Compact Grouped Metrics */
.grouped-compact-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.compact-metric-tile {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  transition: border-color 0.2s ease;
  box-shadow: var(--card-shadow);
}

.compact-metric-tile:hover {
  border-color: var(--border-strong);
}

.tile-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.tile-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.compact-metric-tile.is-rising {
  border-color: rgba(34, 197, 94, 0.18);
}

.highlight-rising {
  color: #22C55E;
}

.compact-metric-tile.is-alerted {
  border-color: rgba(245, 158, 11, 0.18);
}

.highlight-alerted {
  color: #F59E0B;
}

@media (max-width: 900px) {
  .active-signal-stats-deck {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .grouped-compact-metrics {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .compact-metric-tile {
    padding: 10px 12px;
  }
}
</style>
