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
  const status = props.summary?.latestScan?.status;
  if (status === 'success') return 'Hệ thống đang hoạt động';
  if (status === 'running') return 'Đang quét dữ liệu';
  if (status === 'partial') return 'Có lỗi một phần';
  if (status === 'failed') return 'Có lỗi dữ liệu';
  return 'Chưa có dữ liệu quét';
});

const scanStatusTone = computed(() => {
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
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  padding: 28px 32px;
  background: linear-gradient(135deg, #FFFFFF 0%, #F5F8FC 60%, #EFF6FF 100%);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 18px;
  box-shadow: var(--shadow-sm, 0 4px 14px rgba(30, 60, 90, 0.05));
  position: relative;
  overflow: hidden;
  align-items: center;
}

[data-theme="dark"] .overview-hero {
  background: linear-gradient(135deg, rgba(12, 20, 35, 0.88) 0%, rgba(8, 14, 24, 0.82) 100%);
  border-color: rgba(125, 211, 252, 0.12);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--primary, #2563EB);
  text-transform: uppercase;
}

[data-theme="dark"] .hero-kicker {
  color: #38BDF8;
}

.signal-beacon {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
}

.status-success {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
}

.status-info {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
}

.status-warning {
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid #FDE68A;
}

.status-danger {
  background: #FEF2F2;
  color: #EF4444;
  border: 1px solid #FECACA;
}

.status-neutral {
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.hero-title {
  font-size: clamp(24px, 2.5vw, 32px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  line-height: 1.15;
}

.hero-subline {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--primary, #2563EB);
}

[data-theme="dark"] .hero-subline {
  color: #38BDF8;
}

.hero-description {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  max-width: 680px;
  margin-bottom: 8px;
}

.hero-kpis-wrap {
  margin-top: 6px;
}

.hero-right {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 240px;
}

@media (max-width: 1024px) {
  .overview-hero {
    grid-template-columns: 1fr;
    padding: 24px 20px;
  }
  .hero-right {
    min-height: 200px;
    max-height: 220px;
  }
}
</style>
