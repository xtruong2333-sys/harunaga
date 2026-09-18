<template>
  <div class="recent-video-summary-strip surface-card">
    <!-- Skeleton when loading -->
    <template v-if="loading">
      <div v-for="i in 4" :key="i" class="summary-metric-item skeleton-summary-item">
        <div class="skeleton-icon-box"></div>
        <div class="skeleton-content">
          <div class="skeleton-val"></div>
          <div class="skeleton-lbl"></div>
        </div>
      </div>
    </template>

    <!-- Real Summary Metrics -->
    <template v-else>
      <!-- 1. Total Videos in Range / Loaded -->
      <div class="summary-metric-item">
        <div class="metric-icon-wrap icon-videos">
          <AppIcon name="video" size="16" />
        </div>
        <div class="metric-content">
          <div class="metric-val mono">{{ formatNumber(summary.totalVideos) }}</div>
          <div class="metric-lbl">{{ hasMore ? 'VIDEO (ĐÃ TẢI)' : 'VIDEO MỚI' }}</div>
        </div>
      </div>

      <div class="metric-divider"></div>

      <!-- 2. Active Channels with New Videos -->
      <div class="summary-metric-item">
        <div class="metric-icon-wrap icon-channels">
          <AppIcon name="tv" size="16" />
        </div>
        <div class="metric-content">
          <div class="metric-val mono">{{ formatNumber(summary.totalChannels) }}</div>
          <div class="metric-lbl">{{ hasMore ? 'KÊNH (ĐÃ TẢI)' : 'KÊNH VỪA ĐĂNG' }}</div>
        </div>
      </div>

      <div class="metric-divider"></div>

      <!-- 3. Rising Videos Count -->
      <div class="summary-metric-item">
        <div class="metric-icon-wrap icon-rising">
          <AppIcon name="trending-up" size="16" />
        </div>
        <div class="metric-content">
          <div class="metric-val mono text-accent">{{ formatNumber(summary.risingVideos) }}</div>
          <div class="metric-lbl">{{ hasMore ? 'VIDEO ĐANG TĂNG (ĐÃ TẢI)' : 'ĐANG TĂNG (VPH > 0)' }}</div>
        </div>
      </div>

      <div class="metric-divider"></div>

      <!-- 4. Max Measured VPH -->
      <div class="summary-metric-item">
        <div class="metric-icon-wrap icon-vph">
          <AppIcon name="zap" size="16" />
        </div>
        <div class="metric-content">
          <div class="metric-val mono text-positive">
            {{ formattedMaxVph }}
          </div>
          <div class="metric-lbl">{{ hasMore ? 'MAX VPH (ĐÃ TẢI)' : 'MAX VPH KHUNG GIỜ' }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { NewVideoSummary } from '@/types/new-videos';

const props = withDefaults(
  defineProps<{
    summary: NewVideoSummary;
    loading?: boolean;
    hasMore?: boolean;
  }>(),
  {
    loading: false,
    hasMore: false,
  }
);

const formattedMaxVph = computed(() => {
  if (props.summary.maxVph !== null && props.summary.maxVph !== undefined && props.summary.maxVph > 0) {
    return `${formatNumber(Math.round(props.summary.maxVph))} VPH`;
  }
  return '—';
});

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
.recent-video-summary-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(30, 60, 90, 0.04));
  margin-bottom: 20px;
}

.summary-metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-icon-wrap {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.icon-videos {
  background: #EFF6FF;
  color: #2563EB;
}

.icon-channels {
  background: #F0FDF4;
  color: #16A34A;
}

.icon-rising {
  background: #EFF6FF;
  color: #0284C7;
}

.icon-vph {
  background: #FEF3C7;
  color: #D97706;
}

[data-theme="dark"] .icon-videos {
  background: rgba(37, 99, 235, 0.15);
  color: #60A5FA;
}

[data-theme="dark"] .icon-channels {
  background: rgba(22, 163, 74, 0.15);
  color: #4ADE80;
}

[data-theme="dark"] .icon-rising {
  background: rgba(2, 132, 199, 0.15);
  color: #38BDF8;
}

[data-theme="dark"] .icon-vph {
  background: rgba(217, 119, 6, 0.15);
  color: #FBBF24;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-val {
  font-size: 18px;
  font-weight: 750;
  color: var(--text-primary);
  line-height: 1.1;
}

.metric-lbl {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.metric-divider {
  display: none;
}

.text-accent {
  color: #0284C7;
}

.text-positive {
  color: #16A34A;
}

[data-theme="dark"] .text-accent {
  color: #38BDF8;
}

[data-theme="dark"] .text-positive {
  color: #4ADE80;
}

/* Skeleton Loading for Summary Strip */
.skeleton-summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skeleton-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(90deg, #EEF4F8 25%, #E2E8F0 50%, #EEF4F8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.skeleton-val {
  width: 60%;
  height: 18px;
  border-radius: 4px;
  background: #E2E8F0;
}

.skeleton-lbl {
  width: 80%;
  height: 11px;
  border-radius: 3px;
  background: #EEF4F8;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@media (max-width: 1024px) {
  .recent-video-summary-strip {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 640px) {
  .recent-video-summary-strip {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px 14px;
  }
}
</style>
