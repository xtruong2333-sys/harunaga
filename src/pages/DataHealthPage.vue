<template>
  <div class="data-health-observatory">
    <!-- Page Header -->
    <PageHeader
      kicker="GIÁM SÁT HỆ THỐNG"
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

    <!-- Error State -->
    <ErrorState
      v-if="error"
      title="Không thể kết nối dữ liệu quan sát"
      :message="error"
      retry-text="Thử lại"
      :show-retry="true"
      @retry="loadData"
    />

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
    <div v-if="selectedErrorScan" class="modal-backdrop" @click="closeScanError">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <div class="modal-title-wrap">
            <AppIcon name="alert" size="20" class="text-danger" />
            <h3 class="modal-title">Chi Tiết Lỗi Lần Quét</h3>
          </div>
          <button class="btn-close" @click="closeScanError" aria-label="Đóng">✕</button>
        </div>
        <div class="modal-body">
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
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeScanError">Đóng</button>
        </div>
      </div>
    </div>

    <!-- Modal Chi Tiết Lỗi Discord Alert -->
    <div v-if="selectedFailedAlert" class="modal-backdrop" @click="closeAlertError">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <div class="modal-title-wrap">
            <AppIcon name="alert" size="20" class="text-danger" />
            <h3 class="modal-title">Chi Tiết Lỗi Gửi Cảnh Báo Discord</h3>
          </div>
          <button class="btn-close" @click="closeAlertError" aria-label="Đóng">✕</button>
        </div>
        <div class="modal-body">
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
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAlertError">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
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
const error = ref<string | null>(null);
const summary = ref<DataHealthSummary | null>(null);

const selectedErrorScan = ref<DataHealthScan | null>(null);
const selectedFailedAlert = ref<FailedAlertItem | null>(null);

let refreshInterval: number | undefined;

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    summary.value = await dataHealthService.fetchDataHealthSummary();
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải dữ liệu tình trạng hệ thống. Vui lòng thử lại.';
  } finally {
    loading.value = false;
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
  if (document.visibilityState === 'visible') {
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

/* Error Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 16px;
}

.modal-dialog {
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.1));
  border-radius: var(--radius-lg, 12px);
  width: 100%;
  max-width: 580px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="dark"] .modal-dialog {
  background: #1E293B;
  border-color: rgba(255, 255, 255, 0.1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.97) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
}

[data-theme="dark"] .modal-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
}

[data-theme="dark"] .modal-title {
  color: #F1F5F9;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--text-muted, #64748B);
  padding: 4px;
  border-radius: 4px;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary, #0F172A);
}

[data-theme="dark"] .btn-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #F1F5F9;
}

.modal-body {
  padding: 20px;
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
  word-break: break-word;
  max-height: 240px;
  overflow-y: auto;
}

[data-theme="dark"] .error-pre {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #FCA5A5;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  display: flex;
  justify-content: flex-end;
}

[data-theme="dark"] .modal-footer {
  border-top-color: rgba(255, 255, 255, 0.08);
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
