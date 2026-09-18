<template>
  <div class="data-health-observatory">
    <!-- Page Header -->
    <PageHeader
      kicker="DATA OPERATIONS OBSERVATORY"
      title="Tình Trạng Dữ Liệu"
      description="Trung tâm quan sát sức khỏe dữ liệu, chu kỳ thu thập tự động và hạ tầng cảnh báo đối thủ."
    >
      <template #actions>
        <div v-if="summary" class="last-fetched-meta">
          <AppIcon name="clock" size="13" />
          <span>Cập nhật lúc: <strong class="mono">{{ summary.lastFetchedAt }}</strong></span>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-refresh"
          :disabled="loading"
          @click="loadData"
          title="Tải lại dữ liệu quan sát mới nhất"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm mới' }}</span>
        </button>
      </template>
    </PageHeader>

    <!-- Error State (Chỉ khi chưa có dữ liệu ban đầu) -->
    <ErrorState
      v-if="initialLoadError && !summary"
      title="Không thể kết nối dữ liệu quan sát"
      :message="initialLoadError"
      retry-text="Thử lại"
      :show-retry="true"
      @retry="loadData"
    />

    <!-- Refresh Warning Band (Khi đã có dữ liệu nhưng refresh bị lỗi) -->
    <div v-if="summary && refreshError" class="refresh-warning-band" role="alert">
      <div class="warning-content">
        <AppIcon name="alert" size="16" class="text-warning" />
        <div class="warning-text">
          <strong>Không thể làm mới dữ liệu.</strong> Đang hiển thị lần tải thành công gần nhất.
          <span class="refresh-error-detail">({{ refreshError }})</span>
        </div>
      </div>
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="loading"
        @click="loadData"
      >
        <AppIcon name="refresh" size="13" :class="{ 'spin-anim': loading }" />
        <span>Thử lại</span>
      </button>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="loading && !summary" class="observatory-skeleton">
      <div class="skeleton-banner"></div>
      <div class="skeleton-rail">
        <div v-for="n in 4" :key="n" class="skeleton-card"></div>
      </div>
      <div class="skeleton-section is-large"></div>
      <div class="skeleton-section"></div>
      <div class="skeleton-section"></div>
    </div>

    <!-- Main Content -->
    <div v-else-if="summary" class="observatory-body">
      <!-- 1. System Status Banner -->
      <DataHealthStatusBanner :status="summary.systemStatus" />

      <!-- 2. Telemetry Metrics Rail -->
      <DataHealthTelemetryRail
        :latest-scan="summary.latestScan"
        :channels-need-attention-count="summary.channelsNeedAttentionCount"
        :stale-videos-count="summary.staleVideosCount"
        :active-videos-count="summary.activeVideosCount"
        :failed-alerts-count="summary.failedAlertsCount"
      />

      <!-- 3. Scan Operations -->
      <DataHealthScanOperations
        :latest-scheduled-scan="summary.latestScheduledScan"
        :scans="summary.recentScans"
        @view-scan-error="openScanError"
      />

      <!-- 4. Monitored Channels Freshness -->
      <DataHealthChannelFreshness
        :channels="summary.channels"
        :channels-need-attention-count="summary.channelsNeedAttentionCount"
      />

      <!-- 5. Video Freshness Surveillance -->
      <DataHealthVideoFreshness
        :stale-videos="summary.staleVideos"
        :stale-videos-count="summary.staleVideosCount"
        :active-videos-count="summary.activeVideosCount"
      />

      <!-- 6. Discord Alert Health & Monitoring -->
      <DataHealthAlertMonitoring
        :summary="summary.alertSummary"
        @view-alert-error="openAlertError"
      />
    </div>

    <!-- Modal Chi Tiết Lỗi Scan -->
    <AppModal
      :model-value="!!selectedErrorScan"
      title="Chi Tiết Lỗi Lần Quét"
      max-width="560px"
      @update:model-value="(val: boolean) => { if (!val) closeScanError(); }"
    >
      <div v-if="selectedErrorScan" class="modal-body-stack">
        <div class="modal-meta-row">
          <div>
            <span class="meta-label">Bắt đầu:</span>
            <span class="meta-val mono">{{ formatDateTime(selectedErrorScan.startedAt) }}</span>
          </div>
          <div>
            <span class="meta-label">Kiểu chạy:</span>
            <span class="meta-val">{{ selectedErrorScan.triggerLabel }}</span>
          </div>
          <div>
            <span class="meta-label">Trạng thái:</span>
            <span class="meta-val">{{ selectedErrorScan.statusLabel }}</span>
          </div>
        </div>

        <div class="error-box-wrap">
          <label class="error-box-label">Thông báo lỗi (đã ẩn thông tin bảo mật):</label>
          <pre class="error-pre">{{ selectedErrorScan.sanitizedError || 'Không có chi tiết lỗi ghi nhận.' }}</pre>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closeScanError">Đóng</button>
      </template>
    </AppModal>

    <!-- Modal Chi Tiết Lỗi Discord Alert -->
    <AppModal
      :model-value="!!selectedFailedAlert"
      title="Chi Tiết Lỗi Gửi Cảnh Báo Discord"
      max-width="560px"
      @update:model-value="(val: boolean) => { if (!val) closeAlertError(); }"
    >
      <div v-if="selectedFailedAlert" class="modal-body-stack">
        <div class="modal-meta-row">
          <div>
            <span class="meta-label">Video:</span>
            <span class="meta-val font-medium">{{ selectedFailedAlert.videoTitle }}</span>
          </div>
          <div>
            <span class="meta-label">Kênh:</span>
            <span class="meta-val">{{ selectedFailedAlert.channelName }}</span>
          </div>
          <div>
            <span class="meta-label">Số lần thử:</span>
            <span class="meta-val mono">{{ selectedFailedAlert.attempts }}</span>
          </div>
        </div>

        <div class="error-box-wrap">
          <label class="error-box-label">Thông báo lỗi (đã ẩn thông tin bảo mật):</label>
          <pre class="error-pre">{{ selectedFailedAlert.sanitizedError || 'Không có chi tiết lỗi ghi nhận.' }}</pre>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closeAlertError">Đóng</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppModal from '@/components/ui/AppModal.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import DataHealthStatusBanner from '@/components/data-health/DataHealthStatusBanner.vue';
import DataHealthTelemetryRail from '@/components/data-health/DataHealthTelemetryRail.vue';
import DataHealthScanOperations from '@/components/data-health/DataHealthScanOperations.vue';
import DataHealthChannelFreshness from '@/components/data-health/DataHealthChannelFreshness.vue';
import DataHealthVideoFreshness from '@/components/data-health/DataHealthVideoFreshness.vue';
import DataHealthAlertMonitoring from '@/components/data-health/DataHealthAlertMonitoring.vue';
import { dataHealthService, formatDateTime } from '@/services/data-health-service';
import type {
  DataHealthSummary,
  DataHealthScan,
  FailedAlertItem,
} from '@/types/data-health';

const loading = ref(true);
const initialLoadError = ref<string | null>(null);
const refreshError = ref<string | null>(null);
const summary = ref<DataHealthSummary | null>(null);

const selectedErrorScan = ref<DataHealthScan | null>(null);
const selectedFailedAlert = ref<FailedAlertItem | null>(null);

let loadRequestId = 0;
let refreshInterval: number | undefined;

async function loadData() {
  const requestId = ++loadRequestId;
  loading.value = true;

  try {
    const data = await dataHealthService.fetchDataHealthSummary();
    if (requestId !== loadRequestId) return;
    summary.value = data;
    initialLoadError.value = null;
    refreshError.value = null;
  } catch (err: any) {
    if (requestId !== loadRequestId) return;
    const msg = err?.message || 'Không thể tải dữ liệu tình trạng hệ thống. Vui lòng thử lại.';
    if (!summary.value) {
      initialLoadError.value = msg;
    } else {
      refreshError.value = msg;
    }
  } finally {
    if (requestId === loadRequestId) {
      loading.value = false;
    }
  }
}

function openScanError(scan: DataHealthScan) {
  selectedErrorScan.value = scan;
}

function closeScanError() {
  selectedErrorScan.value = null;
}

function openAlertError(alert: FailedAlertItem) {
  selectedFailedAlert.value = alert;
}

function closeAlertError() {
  selectedFailedAlert.value = null;
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && !loading.value) {
    loadData();
  }
}

onMounted(() => {
  loadData();
  document.addEventListener('visibilitychange', handleVisibilityChange);
  // Auto refresh every 60s if active
  refreshInterval = window.setInterval(() => {
    if (document.visibilityState === 'visible' && !loading.value) {
      loadData();
    }
  }, 60000);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.data-health-observatory {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}

.last-fetched-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-secondary, #64748B);
  background: var(--bg-inset, #F1F5F9);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
}

[data-theme="dark"] .last-fetched-meta {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
  color: #94A3B8;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  background: #2563EB;
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.15s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: #1D4ED8;
}

.btn-refresh:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.observatory-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Skeleton Loading */
.observatory-skeleton {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-banner {
  height: 80px;
  background: var(--bg-card, #FFFFFF);
  border-radius: 12px;
  opacity: 0.6;
  animation: pulseSkeleton 1.5s ease-in-out infinite;
}

.skeleton-rail {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-card {
  height: 95px;
  background: var(--bg-card, #FFFFFF);
  border-radius: 12px;
  opacity: 0.6;
  animation: pulseSkeleton 1.5s ease-in-out infinite;
}

.skeleton-section {
  height: 260px;
  background: var(--bg-card, #FFFFFF);
  border-radius: 12px;
  opacity: 0.6;
  animation: pulseSkeleton 1.5s ease-in-out infinite;
}

.skeleton-section.is-large {
  height: 380px;
}

[data-theme="dark"] .skeleton-banner,
[data-theme="dark"] .skeleton-card,
[data-theme="dark"] .skeleton-section {
  background: #1E293B;
}

@keyframes pulseSkeleton {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* Refresh Warning Band */
.refresh-warning-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 8px;
  color: var(--text-primary, #0F172A);
  font-size: 0.85rem;
}

[data-theme="dark"] .refresh-warning-band {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.35);
  color: #FDE68A;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.warning-text {
  line-height: 1.4;
}

.refresh-error-detail {
  color: var(--text-muted, #64748B);
  margin-left: 4px;
}

[data-theme="dark"] .refresh-error-detail {
  color: #94A3B8;
}

.text-warning {
  color: #D97706;
}

[data-theme="dark"] .text-warning {
  color: #FBBF24;
}

.btn-sm {
  padding: 5px 12px;
  font-size: 0.78rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Modal Internal Stack & Content */
.modal-body-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-meta-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 0.84rem;
  padding: 10px 14px;
  background: var(--bg-inset, #F8FAFC);
  border-radius: 8px;
}

[data-theme="dark"] .modal-meta-row {
  background: rgba(255, 255, 255, 0.03);
}

.meta-label {
  color: var(--text-muted, #64748B);
  margin-right: 6px;
}

[data-theme="dark"] .meta-label {
  color: #94A3B8;
}

.meta-val {
  font-weight: 600;
  color: var(--text-primary, #0F172A);
}

[data-theme="dark"] .meta-val {
  color: #E2E8F0;
}

.error-box-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-box-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}

[data-theme="dark"] .error-box-label {
  color: #94A3B8;
}

.error-pre {
  margin: 0;
  padding: 14px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #DC2626;
  font-size: 0.82rem;
  font-family: var(--font-mono, monospace);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-height: 240px;
  overflow-y: auto;
}

[data-theme="dark"] .error-pre {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #FCA5A5;
}

.btn-secondary {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-primary, #0F172A);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.1));
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: #E2E8F0;
}

[data-theme="dark"] .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.14);
}
</style>
