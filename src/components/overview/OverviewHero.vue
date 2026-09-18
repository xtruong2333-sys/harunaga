<template>
  <div class="overview-hero surface-card">
    <div class="hero-left">
      <!-- Kicker & System Status Badge -->
      <div class="hero-status-row">
        <div class="hero-kicker">
          <span class="signal-beacon"></span>
          YOUTUBE INTELLIGENCE SYSTEM
        </div>

        <div class="status-badge" :class="`status-${scanStatusTone}`">
          <span class="pulse-dot"></span>
          <span>{{ scanStatusLabel }}</span>
        </div>
      </div>

      <!-- Main Headline -->
      <h1 class="hero-title">Bắt Bài Đối Thủ</h1>
      <div class="hero-subline">
        Theo dõi đối thủ • Phát hiện video tăng nhanh • Bắt tín hiệu sớm
      </div>
      <p class="hero-description">
        Tổng hợp tín hiệu từ các kênh đang theo dõi và phát hiện những video có chuyển động đáng chú ý.
      </p>

      <!-- KPI Cluster -->
      <div class="hero-kpis-wrap">
        <OverviewMetricCluster
          :active-channels="summary?.activeChannelsCount || 0"
          :total-videos="summary?.totalVideosCount || 0"
          :rising-videos="summary?.risingVideosCount || 0"
          :max-vph="summary?.maxVph || null"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Right: Reactive Intelligence Core 3D -->
    <div class="hero-right">
      <OverviewIntelligenceCore
        :active-channels="summary?.activeChannelsCount || 0"
        :rising-videos="summary?.risingVideosCount || 0"
        :max-vph="summary?.maxVph || null"
        :scan-status="summary?.latestScan?.status || null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DashboardSummary } from '@/types/dashboard';
import OverviewMetricCluster from '@/components/overview/OverviewMetricCluster.vue';
import OverviewIntelligenceCore from '@/components/overview/OverviewIntelligenceCore.vue';

const props = defineProps<{
  summary: DashboardSummary | null;
  loading?: boolean;
}>();

const scanStatusLabel = computed(() => {
  if (props.loading) return 'Đang đồng bộ dữ liệu...';
  const status = props.summary?.latestScan?.status;
  if (status === 'success') return 'Hệ thống đang hoạt động';
  if (status === 'running') return 'Đang quét dữ liệu';
  if (status === 'partial') return 'Có lỗi một phần';
  if (status === 'failed') return 'Có lỗi dữ liệu';
  return 'Chưa có dữ liệu quét';
});

const scanStatusTone = computed(() => {
  if (props.loading) return 'info';
  const status = props.summary?.latestScan?.status;
  if (status === 'success') return 'success';
  if (status === 'running') return 'info';
  if (status === 'partial') return 'warning';
  if (status === 'failed') return 'danger';
  return 'neutral';
});
</script>

<style scoped>
.overview-hero {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2rem;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: var(--radius-xl, 16px);
  padding: 2rem;
  box-shadow: 0 4px 20px -2px rgba(37, 99, 235, 0.04);
  overflow: hidden;
}

.hero-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;
}

.hero-status-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--brand-primary, #2563EB);
  background: var(--bg-surface-secondary, #F0F7FF);
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid rgba(37, 99, 235, 0.15);
}

.signal-beacon {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-primary, #2563EB);
  box-shadow: 0 0 8px var(--brand-primary, #2563EB);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full, 9999px);
}

.status-success {
  background: var(--color-success-bg, #ECFDF5);
  color: var(--color-success-text, #059669);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-info {
  background: var(--color-info-bg, #EFF6FF);
  color: var(--color-info-text, #2563EB);
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.status-warning {
  background: var(--color-warning-bg, #FFFBEB);
  color: var(--color-warning-text, #D97706);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.status-danger {
  background: var(--color-danger-bg, #FEF2F2);
  color: var(--color-danger-text, #DC2626);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-neutral {
  background: var(--bg-surface-secondary, #F8FAFC);
  color: var(--text-tertiary, #64748B);
  border: 1px solid var(--border, #E3EBF3);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse-dot-anim 2s infinite ease-in-out;
}

@keyframes pulse-dot-anim {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

.hero-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: var(--text-primary, #0F172A);
  letter-spacing: -0.03em;
  margin: 0 0 0.25rem;
  line-height: 1.15;
}

.hero-subline {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--brand-primary, #2563EB);
  margin-bottom: 0.5rem;
}

.hero-description {
  font-size: 0.875rem;
  color: var(--text-secondary, #475569);
  margin: 0 0 1.5rem;
  line-height: 1.5;
  max-width: 580px;
}

.hero-kpis-wrap {
  margin-top: auto;
}

.hero-right {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.04) 0%, transparent 70%);
  border-radius: var(--radius-lg, 12px);
}

@media (max-width: 1024px) {
  .overview-hero {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .hero-right {
    min-height: 220px;
  }
}
</style>
