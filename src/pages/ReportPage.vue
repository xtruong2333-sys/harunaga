<template>
  <div class="report-page">
    <!-- Page Header -->
    <PageHeader
      kicker="BÁO CÁO ĐIỀU HÀNH"
      title="Báo Cáo Tình Báo Đối Thủ"
      description="Bản tổng hợp số liệu thực tế về các chuyển động của đối thủ trong 24 giờ hoặc 7 ngày vừa qua."
    >
      <template #actions>
        <!-- Range Switcher -->
        <div class="range-switch-group" role="group" aria-label="Khoảng thời gian báo cáo">
          <button
            type="button"
            class="range-btn"
            :class="{ active: currentRange === '24h' }"
            :disabled="loading"
            @click="setRange('24h')"
          >
            24 Giờ
          </button>
          <button
            type="button"
            class="range-btn"
            :class="{ active: currentRange === '7d' }"
            :disabled="loading"
            @click="setRange('7d')"
          >
            7 Ngày
          </button>
        </div>

        <!-- View Mode Switcher -->
        <ViewModeSwitcher
          v-model="currentViewMode"
          :modes="REPORT_VIEW_MODES"
          storage-key="bbdt_report_view_mode"
        />

        <!-- Copy Summary Button -->
        <button
          type="button"
          class="btn btn-secondary btn-copy"
          :disabled="loading || !reportData"
          @click="copySummary"
          title="Sao chép tóm tắt số liệu báo cáo"
        >
          <AppIcon :name="copied ? 'check' : 'copy'" :size="14" />
          <span>{{ copied ? 'Đã sao chép' : 'Sao chép tóm tắt' }}</span>
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          class="btn btn-primary btn-refresh"
          :disabled="loading"
          @click="loadReport"
          title="Tải lại dữ liệu báo cáo"
        >
          <AppIcon name="refresh" :size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm mới' }}</span>
        </button>
      </template>
    </PageHeader>

    <!-- Timestamp Notice -->
    <div v-if="reportData" class="timestamp-bar">
      <AppIcon name="clock" :size="13" />
      <span>Thời điểm tạo báo cáo: <strong>{{ formattedGeneratedAt }}</strong> (Múi giờ Việt Nam)</span>
    </div>

    <!-- Error State -->
    <ErrorState
      v-if="error"
      title="Không thể tải dữ liệu báo cáo"
      :message="error"
      retry-text="Thử lại"
      :show-retry="true"
      @retry="loadReport"
    />

    <!-- Skeleton Loading -->
    <div v-if="loading && !reportData" class="report-skeleton">
      <div class="skeleton-rail">
        <div v-for="i in 6" :key="i" class="skeleton-item"></div>
      </div>
      <div class="skeleton-card is-large"></div>
      <div class="skeleton-grid">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="reportData" class="report-body">
      <!-- 1. Executive Metrics Rail (Always visible across all views) -->
      <ReportSummaryRail
        :summary="reportData.summary"
        :range="reportData.range"
      />

      <!-- Empty State if no data at all in range -->
      <EmptyState
        v-if="isEntireReportEmpty"
        icon="inbox"
        title="Chưa có dữ liệu trong khoảng thời gian này"
        :description="`Không có video mới, cảnh báo hoặc hoạt động thu thập nào trong ${currentRange === '24h' ? '24 giờ' : '7 ngày'} qua.`"
      />

      <!-- View Scoped Component -->
      <div v-else class="report-views">
        <!-- Brief View -->
        <ReportBriefView
          v-if="currentViewMode === 'brief'"
          :summary="reportData.summary"
          :scan-summary="reportData.scanSummary"
          :rising-videos="reportData.risingVideos"
          :new-videos="reportData.newVideos"
          :channel-activities="reportData.channelActivities"
          :recent-alerts="reportData.recentAlerts"
          :recent-scans="reportData.recentScans"
          :range="reportData.range"
          @change-view="currentViewMode = $event"
        />

        <!-- Videos View -->
        <ReportVideoSignals
          v-else-if="currentViewMode === 'videos'"
          :rising-videos="reportData.risingVideos"
          :new-videos="reportData.newVideos"
          :max-current-vph="reportData.summary.maxCurrentVph"
          :range="reportData.range"
        />

        <!-- Channels View -->
        <ReportChannelActivity
          v-else-if="currentViewMode === 'channels'"
          :channels="reportData.channelActivities"
          :range="reportData.range"
        />

        <!-- Operations View -->
        <ReportOperationsView
          v-else-if="currentViewMode === 'operations'"
          :alerts="reportData.recentAlerts"
          :scans="reportData.recentScans"
          :scan-summary="reportData.scanSummary"
          :range="reportData.range"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import ViewModeSwitcher from '@/components/ui/ViewModeSwitcher.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ReportSummaryRail from '@/components/report/ReportSummaryRail.vue';
import ReportBriefView from '@/components/report/ReportBriefView.vue';
import ReportVideoSignals from '@/components/report/ReportVideoSignals.vue';
import ReportChannelActivity from '@/components/report/ReportChannelActivity.vue';
import ReportOperationsView from '@/components/report/ReportOperationsView.vue';

import {
  type ReportRange,
  type ReportViewMode,
  type ReportData,
  REPORT_VIEW_MODES,
} from '@/types/report';

import {
  fetchReportData,
  parseReportRange,
  formatVietnamDateTime,
  buildReportCopyText,
} from '@/services/report-service';

const route = useRoute();
const router = useRouter();

const currentRange = ref<ReportRange>('24h');
const currentViewMode = ref<ReportViewMode>('brief');
const loading = ref(false);
const error = ref<string | null>(null);
const reportData = ref<ReportData | null>(null);
const copied = ref(false);

let currentRequestId = 0;

const formattedGeneratedAt = computed(() => {
  if (!reportData.value) return '—';
  return formatVietnamDateTime(reportData.value.generatedAtIso);
});

const isEntireReportEmpty = computed(() => {
  if (!reportData.value) return false;
  return (
    reportData.value.summary.newVideosCount === 0 &&
    reportData.value.summary.alertsCount === 0 &&
    reportData.value.scanSummary.totalScans === 0
  );
});

async function loadReport() {
  const requestId = ++currentRequestId;
  loading.value = true;
  error.value = null;

  try {
    const data = await fetchReportData(currentRange.value);
    if (requestId !== currentRequestId) return;
    reportData.value = data;
  } catch (err: any) {
    if (requestId !== currentRequestId) return;
    error.value = err?.message || 'Lỗi không xác định khi tải dữ liệu báo cáo.';
  } finally {
    if (requestId === currentRequestId) {
      loading.value = false;
    }
  }
}

function setRange(newRange: ReportRange) {
  if (currentRange.value === newRange && reportData.value) return;
  currentRange.value = newRange;
  try {
    localStorage.setItem('bbdt_report_range', newRange);
  } catch {
    // Ignore storage error
  }
  router.replace({
    query: {
      ...route.query,
      range: newRange === '24h' ? undefined : newRange,
    },
  });
  loadReport();
}

async function copySummary() {
  if (!reportData.value) return;
  const text = buildReportCopyText(
    reportData.value.summary,
    reportData.value.range,
    new Date(reportData.value.generatedAtIso).getTime()
  );
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2500);
  } catch (e) {
    console.error('Không thể sao chép tóm tắt', e);
  }
}

// Watch URL query params to sync range safely
watch(
  () => route.query.range,
  (newVal) => {
    const parsed = parseReportRange(newVal);
    if (parsed !== currentRange.value) {
      currentRange.value = parsed;
      loadReport();
    }
  }
);

onMounted(() => {
  let initialRange: ReportRange = '24h';
  if (route.query.range) {
    initialRange = parseReportRange(route.query.range);
  } else {
    try {
      const savedRange = localStorage.getItem('bbdt_report_range');
      if (savedRange === '7d' || savedRange === '24h') {
        initialRange = savedRange;
      }
    } catch {
      // Ignore storage error
    }
  }
  currentRange.value = initialRange;
  loadReport();
});
</script>

<style scoped>
.report-page {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 0 3rem;
}

/* Range Switcher */
.range-switch-group {
  display: inline-flex;
  align-items: center;
  background: var(--bg-inset, #eef4f8);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 9px;
  padding: 3px;
  gap: 2px;
}

[data-theme="dark"] .range-switch-group {
  background: rgba(8, 14, 24, 0.75);
  border-color: rgba(125, 211, 252, 0.12);
}

.range-btn {
  padding: 5px 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-secondary, #64748b);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.range-btn:hover:not(:disabled) {
  color: var(--text-primary, #0f172a);
}

.range-btn.active {
  background: var(--surface, #ffffff);
  color: var(--primary, #2563eb);
  border-color: var(--border, #e2e8f0);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(30, 60, 90, 0.06);
}

[data-theme="dark"] .range-btn.active {
  background: rgba(20, 32, 54, 0.85);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.12);
}

.range-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn-secondary {
  background: var(--surface, #ffffff);
  border-color: var(--border, #cbd5e1);
  color: var(--text-secondary, #475569);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-inset, #f8fafc);
  color: var(--text-primary, #0f172a);
  border-color: #94a3b8;
}

[data-theme="dark"] .btn-secondary {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.8);
  color: #94a3b8;
}

[data-theme="dark"] .btn-secondary:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.9);
  color: #f1f5f9;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Timestamp Bar */
.timestamp-bar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  margin-bottom: 20px;
}

[data-theme="dark"] .timestamp-bar {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.7);
  color: #94a3b8;
}

.timestamp-bar strong {
  color: var(--text-primary, #0f172a);
}

[data-theme="dark"] .timestamp-bar strong {
  color: #f1f5f9;
}

/* Skeleton Loading */
.report-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.skeleton-rail {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.skeleton-item {
  height: 72px;
  background: var(--bg-inset, #e2e8f0);
  border-radius: 10px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-card {
  height: 180px;
  background: var(--bg-inset, #e2e8f0);
  border-radius: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-card.is-large {
  height: 100px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
}

.report-body {
  display: flex;
  flex-direction: column;
}

.report-views {
  display: flex;
  flex-direction: column;
}
</style>
