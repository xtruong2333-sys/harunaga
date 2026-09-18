<template>
  <div class="overview-page">
    <!-- 1. Hero Command Center (Always visible, responsive) -->
    <OverviewHero
      :summary="summary"
      :loading="loading"
    />

    <!-- 2. Error State -->
    <ErrorState
      v-if="error"
      title="Không thể tải dữ liệu Tổng Quan"
      :message="error"
      @retry="loadData"
    />

    <!-- 3. Loading Skeleton -->
    <div v-else-if="loading && !summary" class="overview-skeleton">
      <div class="skeleton-row-2col">
        <div class="skeleton-panel"></div>
        <div class="skeleton-panel"></div>
      </div>
      <div class="skeleton-feed"></div>
      <div class="skeleton-row-3col">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>

    <!-- 4. Empty State (No Channels Monitored) -->
    <EmptyState
      v-else-if="summary && summary.activeChannelsCount === 0 && summary.totalVideosCount === 0"
      title="Chưa Có Tín Hiệu"
      description="Hệ thống chưa có nguồn dữ liệu đối thủ. Thêm kênh đầu tiên để bắt đầu quét và bắt tín hiệu tự động."
      action-text="Thêm Kênh Theo Dõi"
      action-to="/kenh-theo-doi"
      action-icon="plus"
    />

    <!-- 5. Main Command Center Content -->
    <template v-else-if="summary">
      <!-- Row A: Mid-Tier 2-Column: Hiệu Suất Tổng Quan & Hoạt Động Gần Đây -->
      <div class="overview-mid-grid">
        <OverviewPerformance :summary="summary" />
        <OverviewActivity :scans="summary.recentScans" />
      </div>

      <!-- Row B: Video Đáng Chú Ý / Opportunity Feed -->
      <OverviewOpportunityFeed :videos="summary.topVideos" />

      <!-- Row C: Triad 3-Column: Top Đối Thủ, Cảnh Báo Discord, Tình Trạng Dữ Liệu -->
      <div class="overview-triad-grid">
        <OverviewCompetitorList :channels="summary.topChannels" />
        <OverviewAlertPanel :alert-summary="summary.alertSummary" />
        <OverviewDataHealth :latest-scan="summary.latestScan" />
      </div>

      <!-- Row D: Nhật Ký Hệ Thống / Scan Log -->
      <OverviewScanLog :scans="summary.recentScans" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dashboardService } from '@/services/dashboard-service';
import { DashboardSummary } from '@/types/dashboard';

// Shared UI components
import ErrorState from '@/components/ui/ErrorState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';

// Modular Overview Components
import OverviewHero from '@/components/overview/OverviewHero.vue';
import OverviewPerformance from '@/components/overview/OverviewPerformance.vue';
import OverviewActivity from '@/components/overview/OverviewActivity.vue';
import OverviewOpportunityFeed from '@/components/overview/OverviewOpportunityFeed.vue';
import OverviewCompetitorList from '@/components/overview/OverviewCompetitorList.vue';
import OverviewAlertPanel from '@/components/overview/OverviewAlertPanel.vue';
import OverviewDataHealth from '@/components/overview/OverviewDataHealth.vue';
import OverviewScanLog from '@/components/overview/OverviewScanLog.vue';

// Page Title
document.title = 'Tổng Quan — Bắt Bài Đối Thủ';

const summary = ref<DashboardSummary | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const data = await dashboardService.fetchDashboardSummary();
    summary.value = data;
  } catch (err: any) {
    error.value = err?.message || 'Không thể kết nối đến máy chủ để tải dữ liệu Tổng Quan.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.overview-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Mid-Tier 2-Column Grid */
.overview-mid-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Triad 3-Column Grid */
.overview-triad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* Skeleton Loading State */
.overview-skeleton {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.skeleton-panel {
  height: 220px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  animation: pulse-smooth 1.6s infinite ease-in-out;
}

.skeleton-feed {
  height: 320px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  animation: pulse-smooth 1.6s infinite ease-in-out;
}

.skeleton-row-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.skeleton-card {
  height: 240px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  animation: pulse-smooth 1.6s infinite ease-in-out;
}

@keyframes pulse-smooth {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.45; }
}

@media (max-width: 1024px) {
  .overview-mid-grid,
  .skeleton-row-2col {
    grid-template-columns: 1fr;
  }

  .overview-triad-grid,
  .skeleton-row-3col {
    grid-template-columns: 1fr;
  }
}
</style>
