<template>
  <div class="channel-vph-chart-card">
    <div class="chart-card-header">
      <div class="chart-title-wrap">
        <div class="chart-title">Tốc Độ VPH Của Các Video</div>
        <div class="chart-subtitle">So sánh tốc độ tăng trưởng (VPH) giữa các video đang hoạt động tốt nhất của kênh</div>
      </div>
      <div v-if="threshold > 0" class="threshold-badge">
        Ngưỡng cảnh báo: <strong>{{ threshold.toLocaleString('vi-VN') }}</strong> VPH
      </div>
    </div>

    <!-- Empty State if no measurable VPH -->
    <div v-if="validVideos.length === 0" class="chart-empty-box">
      Chưa có video nào ghi nhận tốc độ tăng trưởng VPH lớn hơn 0.
    </div>

    <!-- Horizontal Bar Chart -->
    <div v-else class="bars-container">
      <div
        v-for="v in validVideos"
        :key="v.id"
        class="bar-row"
      >
        <!-- Video title link -->
        <div class="bar-label-col">
          <router-link
            :to="'/videos/' + v.id"
            class="bar-video-title"
            :title="v.title"
          >
            {{ v.title }}
          </router-link>
        </div>

        <!-- Bar visual & Value -->
        <div class="bar-visual-col">
          <div class="bar-track">
            <div
              class="bar-fill"
              :class="{ 'bar-over-threshold': v.isOverThreshold }"
              :style="{ width: `${Math.max(4, Math.min(100, (v.latestMeasuredVph! / effectiveMax) * 100))}%` }"
            ></div>
          </div>
          <div class="bar-val-wrap">
            <span
              class="bar-val mono"
              :class="v.isOverThreshold ? 'text-threshold' : 'text-accent'"
            >
              {{ Math.round(v.latestMeasuredVph!).toLocaleString('vi-VN') }} VPH
            </span>
            <span v-if="v.isOverThreshold" class="badge-threshold-tag">Vượt ngưỡng</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChannelVideoItem } from '@/types/channel-analysis';

const props = defineProps<{
  videos: ChannelVideoItem[];
  threshold: number;
}>();

const validVideos = computed(() => {
  return props.videos.filter(v => v.latestMeasuredVph !== null && v.latestMeasuredVph > 0);
});

const effectiveMax = computed(() => {
  if (validVideos.value.length === 0) return 100;
  const maxVph = Math.max(...validVideos.value.map(v => v.latestMeasuredVph || 0));
  const t = props.threshold || 0;
  return Math.max(maxVph, t, 100);
});
</script>

<style scoped>
.channel-vph-chart-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
}

.chart-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.chart-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chart-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.chart-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.threshold-badge {
  font-size: 12px;
  font-weight: 500;
  color: #F59E0B;
  background-color: rgba(245, 158, 11, 0.12);
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.chart-empty-box {
  padding: 36px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  background-color: var(--bg-surface-elevated);
  border-radius: 8px;
}

.bars-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bar-label-col {
  width: 280px;
  flex-shrink: 0;
}

.bar-video-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  transition: color 0.15s ease;
}

.bar-video-title:hover {
  color: var(--accent);
}

.bar-visual-col {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.bar-track {
  flex: 1;
  height: 12px;
  background-color: var(--bg-surface-elevated);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #0284C7 0%, #38BDF8 100%);
  transition: width 0.3s ease;
}

.bar-fill.bar-over-threshold {
  background: linear-gradient(90deg, #D97706 0%, #F59E0B 100%);
}

.bar-val-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 150px;
  flex-shrink: 0;
}

.bar-val {
  font-size: 13px;
  font-weight: 800;
}

.bar-val.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-accent {
  color: var(--signal-accent, #38BDF8);
}

.text-threshold {
  color: var(--signal-warning, #F59E0B);
}

.badge-threshold-tag {
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  background-color: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  text-transform: uppercase;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .bar-row {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
  .bar-label-col {
    width: 100%;
  }
}
</style>
