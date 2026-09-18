<template>
  <div class="opportunity-chart-view">
    <!-- Chart 1: Top 8 Candidates VPH Rank -->
    <div class="chart-card surface-card">
      <div class="chart-header">
        <h3 class="chart-title">TỐC ĐỘ VPH CỦA TOP ỨNG VIÊN</h3>
        <span class="chart-subtitle">So sánh tốc độ tăng trưởng đo được giữa các video</span>
      </div>

      <div class="bar-chart-container">
        <div
          v-for="v in topVphVideos"
          :key="v.id"
          class="bar-chart-row"
        >
          <div class="bar-label-col" :title="v.channel.name + ' · ' + v.title">
            <span class="channel-name">{{ v.channel.name }}</span>
            <span class="video-snippet">{{ v.title.slice(0, 30) }}...</span>
          </div>

          <div class="bar-track-col">
            <div
              class="bar-fill"
              :style="{ width: `${getBarWidth(v.latestMeasuredVph, maxVph)}%` }"
              :class="{ 'is-over': v.isOverThreshold }"
            ></div>
          </div>

          <div class="bar-val-col mono">
            {{ formatNumber(Math.round(v.latestMeasuredVph)) }} VPH
          </div>
        </div>
      </div>
    </div>

    <!-- Chart 2: Top View Delta Rank -->
    <div class="chart-card surface-card">
      <div class="chart-header">
        <h3 class="chart-title">LƯỢT XEM TĂNG GẦN NHẤT (DELTA)</h3>
        <span class="chart-subtitle">Số lượt xem ghi nhận tăng giữa hai lần đo gần nhất</span>
      </div>

      <div class="bar-chart-container">
        <div
          v-for="v in topDeltaVideos"
          :key="v.id"
          class="bar-chart-row"
        >
          <div class="bar-label-col" :title="v.channel.name + ' · ' + v.title">
            <span class="channel-name">{{ v.channel.name }}</span>
            <span class="video-snippet">{{ v.title.slice(0, 30) }}...</span>
          </div>

          <div class="bar-track-col">
            <div
              class="bar-fill bar-fill-delta"
              :style="{ width: `${getBarWidth(v.latestDeltaViews || 0, maxDelta)}%` }"
            ></div>
          </div>

          <div class="bar-val-col mono text-positive">
            +{{ formatNumber(v.latestDeltaViews || 0) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OpportunityVideo } from '@/types/opportunity';

const props = defineProps<{
  videos: OpportunityVideo[];
}>();

const topVphVideos = computed(() => {
  return [...props.videos]
    .sort((a, b) => b.latestMeasuredVph - a.latestMeasuredVph)
    .slice(0, 8);
});

const maxVph = computed(() => {
  if (!topVphVideos.value.length) return 1;
  return Math.max(...topVphVideos.value.map(v => v.latestMeasuredVph), 1);
});

const topDeltaVideos = computed(() => {
  return [...props.videos]
    .filter(v => v.latestDeltaViews !== null && v.latestDeltaViews > 0)
    .sort((a, b) => (b.latestDeltaViews || 0) - (a.latestDeltaViews || 0))
    .slice(0, 8);
});

const maxDelta = computed(() => {
  if (!topDeltaVideos.value.length) return 1;
  return Math.max(...topDeltaVideos.value.map(v => v.latestDeltaViews || 0), 1);
});

function getBarWidth(val: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(3, Math.round((val / max) * 100)));
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString('vi-VN');
}
</script>

<style scoped>
.opportunity-chart-view {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  padding: 18px 20px;
  gap: 16px;
}

.chart-header {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chart-title {
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  text-transform: uppercase;
  margin: 0;
}

.chart-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

.bar-chart-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-chart-row {
  display: grid;
  grid-template-columns: 140px 1fr 80px;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.bar-label-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.channel-name {
  font-weight: 650;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-snippet {
  color: var(--text-muted);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-track-col {
  width: 100%;
  height: 12px;
  background: var(--bg-inset, #F1F5F9);
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #3B82F6;
  border-radius: 6px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.bar-fill.is-over {
  background: #10B981;
}

.bar-fill-delta {
  background: #0284C7;
}

.bar-val-col {
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}

.text-positive {
  color: #059669;
}

[data-theme="dark"] .text-positive {
  color: #34D399;
}

@media (max-width: 1024px) {
  .opportunity-chart-view {
    grid-template-columns: 1fr;
  }
}
</style>
