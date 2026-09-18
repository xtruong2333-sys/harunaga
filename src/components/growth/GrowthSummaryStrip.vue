<template>
  <div class="growth-summary-strip">
    <!-- Skeleton Loading State -->
    <template v-if="loading">
      <div v-for="n in 4" :key="n" class="summary-card skeleton-card">
        <div class="skeleton-line title-skel"></div>
        <div class="skeleton-line value-skel"></div>
      </div>
    </template>

    <!-- Loaded Real Metrics -->
    <template v-else>
      <!-- 1. Rising Videos Count -->
      <div class="summary-card surface-card">
        <div class="card-label">
          <AppIcon name="trending-up" size="14" class="text-accent" />
          <span>{{ hasMore ? 'VIDEO ĐANG TĂNG (ĐÃ TẢI)' : 'VIDEO ĐANG TĂNG' }}</span>
        </div>
        <div class="card-val-row">
          <span class="card-val mono text-accent">{{ formatNumber(stats.risingVideos) }}</span>
          <span class="card-sub">/ {{ formatNumber(stats.totalVideos) }} video</span>
        </div>
      </div>

      <!-- 2. Max VPH -->
      <div class="summary-card surface-card">
        <div class="card-label">
          <AppIcon name="zap" size="14" class="text-primary" />
          <span>{{ hasMore ? 'MAX VPH (ĐÃ TẢI)' : 'MAX VPH' }}</span>
        </div>
        <div class="card-val-row">
          <span class="card-val mono text-primary">{{ formatVph(stats.maxVph) }}</span>
          <span class="card-sub">tốc độ cao nhất</span>
        </div>
      </div>

      <!-- 3. Total Delta -->
      <div class="summary-card surface-card">
        <div class="card-label">
          <AppIcon name="chart" size="14" class="text-positive" />
          <span>{{ hasMore ? 'TỔNG DELTA GẦN NHẤT (ĐÃ TẢI)' : 'TỔNG DELTA GẦN NHẤT' }}</span>
        </div>
        <div class="card-val-row">
          <span class="card-val mono text-positive">{{ formatDelta(stats.totalDelta) }}</span>
          <span class="card-sub">lượt xem tăng thêm</span>
        </div>
      </div>

      <!-- 4. Alerted Count -->
      <div class="summary-card surface-card">
        <div class="card-label">
          <AppIcon name="bell" size="14" class="text-warning" />
          <span>{{ hasMore ? 'ĐÃ CẢNH BÁO (ĐÃ TẢI)' : 'ĐÃ CẢNH BÁO' }}</span>
        </div>
        <div class="card-val-row">
          <span class="card-val mono text-warning">{{ formatNumber(stats.alertedVideos) }}</span>
          <span class="card-sub">video phát tín hiệu</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import type { VideoStatsSummary } from '@/types/video';

defineProps<{
  stats: VideoStatsSummary;
  loading?: boolean;
  hasMore?: boolean;
}>();

function formatVph(vph: number | null | undefined): string {
  if (vph === null || vph === undefined) return '—';
  if (vph === 0) return '0 VPH';
  return `${formatNumber(Math.round(vph))} VPH`;
}

function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return '—';
  if (delta > 0) return `+${formatNumber(delta)}`;
  return formatNumber(delta);
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '—';
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
.growth-summary-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 12px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(30, 60, 90, 0.04));
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 60, 90, 0.08);
}

.card-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.card-val-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.card-val {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-primary);
}

.card-sub {
  font-size: 11.5px;
  color: var(--text-muted);
}

.text-primary { color: #2563EB; }
.text-accent { color: #0284C7; }
.text-positive { color: #059669; }
.text-warning { color: #D97706; }

/* Skeleton */
.skeleton-card {
  background: var(--surface, #FFFFFF);
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  border-radius: 4px;
  background: #E2E8F0;
}

.title-skel { width: 60%; height: 12px; }
.value-skel { width: 45%; height: 26px; }

@keyframes shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@media (max-width: 1024px) {
  .growth-summary-strip {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .growth-summary-strip {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .summary-card {
    padding: 12px 14px;
  }
  .card-val {
    font-size: 19px;
  }
}
</style>
