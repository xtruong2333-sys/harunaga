<template>
  <div class="operations-view-container">
    <!-- 1. Alert Operations Snapshot -->
    <section class="operations-section" aria-labelledby="alerts-snapshot-title">
      <div class="section-header">
        <div class="header-text">
          <div class="section-kicker">CẢNH BÁO TĂNG TRƯỞNG</div>
          <h2 id="alerts-snapshot-title" class="section-title">Cảnh Báo Phát Sinh Trong Kỳ</h2>
          <p class="section-desc">
            Lịch sử cảnh báo VPH được kích hoạt khi video đối thủ vượt ngưỡng trong {{ range === '24h' ? '24 giờ' : '7 ngày' }} qua.
          </p>
        </div>
        <div class="header-actions">
          <div class="alerts-count-pill">
            <AppIcon name="bell" :size="14" />
            <span>{{ alerts.length }} cảnh báo</span>
          </div>
          <router-link to="/lich-su-canh-bao" class="action-link-btn">
            Toàn bộ lịch sử ↗
          </router-link>
        </div>
      </div>

      <div v-if="alerts.length === 0" class="empty-ops-box">
        <AppIcon name="bell" :size="28" />
        <p>Không có cảnh báo phát sinh trong khoảng thời gian này.</p>
      </div>

      <div v-else class="table-card">
        <div class="table-responsive">
          <table class="ops-table">
            <thead>
              <tr>
                <th scope="col" class="th-video">Video & Kênh</th>
                <th scope="col" class="text-right th-vph">VPH lúc cảnh báo</th>
                <th scope="col" class="text-right th-threshold">Ngưỡng</th>
                <th scope="col" class="text-center th-status">Trạng thái</th>
                <th scope="col" class="th-time">Thời điểm tạo</th>
                <th scope="col" class="text-right th-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="alt in alerts" :key="alt.id">
                <td>
                  <div class="alert-video-cell">
                    <img
                      v-if="alt.videoThumbnailUrl"
                      :src="alt.videoThumbnailUrl"
                      :alt="alt.videoTitle"
                      class="alert-thumb"
                      loading="lazy"
                      @error="($event.target as HTMLElement).style.display = 'none'"
                    />
                    <div v-else class="alert-thumb-fallback">
                      <AppIcon name="video" :size="14" />
                    </div>
                    <div class="alert-info">
                      <router-link :to="`/videos/${alt.videoId}`" class="alert-v-title" :title="alt.videoTitle">
                        {{ alt.videoTitle }}
                      </router-link>
                      <router-link :to="`/kenh-theo-doi/${alt.channelId}`" class="alert-v-channel" :title="alt.channelName">
                        {{ alt.channelName }}
                      </router-link>
                    </div>
                  </div>
                </td>

                <td class="text-right font-mono text-emerald">
                  {{ formatVph(alt.measuredVph) }}
                </td>

                <td class="text-right font-mono text-muted">
                  {{ formatVph(alt.thresholdVph) }}
                </td>

                <td class="text-center">
                  <AlertStatusBadge :status="alt.status as any" />
                </td>

                <td class="text-secondary" :title="formatVietnamDateTime(alt.createdAt)">
                  {{ formatVietnamDateTime(alt.createdAt) }}
                </td>

                <td class="text-right">
                  <router-link
                    :to="`/lich-su-canh-bao?video=${alt.videoId}`"
                    class="detail-link"
                    title="Xem chi tiết lịch sử cảnh báo của video này"
                  >
                    Xem lịch sử
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- 2. Collection Operations Snapshot -->
    <section class="operations-section" aria-labelledby="scans-snapshot-title">
      <div class="section-header">
        <div class="header-text">
          <div class="section-kicker">HOẠT ĐỘNG THU THẬP DỮ LIỆU</div>
          <h2 id="scans-snapshot-title" class="section-title">Lịch Sử Phiên Quét & Snapshot</h2>
          <p class="section-desc">
            Chi tiết các phiên quét bot chạy định kỳ, tỷ lệ thành công và các lần quét cần chú ý.
          </p>
        </div>
        <router-link to="/tinh-trang-du-lieu" class="action-link-btn">
          Tình trạng dữ liệu ↗
        </router-link>
      </div>

      <!-- Scan Counters Metric Bar -->
      <div class="scan-metrics-bar">
        <div class="scan-metric-card">
          <span class="sm-label">Tổng lần quét</span>
          <span class="sm-value">{{ scanSummary.totalScans }}</span>
        </div>
        <div v-if="scanSummary.runningScans > 0" class="scan-metric-card is-running">
          <span class="sm-label">Đang chạy</span>
          <span class="sm-value text-blue">{{ scanSummary.runningScans }}</span>
        </div>
        <div class="scan-metric-card">
          <span class="sm-label">Thành công</span>
          <span class="sm-value text-emerald">{{ scanSummary.successScans }}</span>
        </div>
        <div class="scan-metric-card">
          <span class="sm-label">Một phần</span>
          <span class="sm-value text-amber">{{ scanSummary.partialScans }}</span>
        </div>
        <div class="scan-metric-card">
          <span class="sm-label">Thất bại</span>
          <span class="sm-value text-rose">{{ scanSummary.failedScans }}</span>
        </div>
        <div class="scan-metric-card">
          <span class="sm-label">Tổng snapshot</span>
          <span class="sm-value text-cyan">{{ formatNumber(scanSummary.totalSnapshots) }}</span>
        </div>
      </div>

      <div v-if="scans.length === 0" class="empty-ops-box">
        <AppIcon name="database" :size="28" />
        <p>Chưa có phiên quét nào được ghi nhận trong khoảng thời gian này.</p>
      </div>

      <div v-else class="table-card">
        <div class="table-responsive">
          <table class="ops-table">
            <thead>
              <tr>
                <th scope="col">Bắt đầu</th>
                <th scope="col">Kết thúc</th>
                <th scope="col">Nguồn</th>
                <th scope="col" class="text-center">Trạng thái</th>
                <th scope="col" class="text-center">Kênh quét</th>
                <th scope="col" class="text-right">Video</th>
                <th scope="col" class="text-right">Snapshot</th>
                <th scope="col" class="text-center">Cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="scan in scans" :key="scan.id">
                <tr>
                  <td class="font-mono text-secondary">{{ formatVietnamDateTime(scan.startedAt) }}</td>
                  <td class="font-mono text-secondary">{{ formatVietnamDateTime(scan.finishedAt) }}</td>
                  <td>
                    <span class="source-tag" :class="`is-${scan.triggerSource}`">
                      {{ scan.triggerLabel }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="status-pill" :class="`pill-${scan.status}`">
                      {{ scan.statusLabel }}
                    </span>
                    <button
                      v-if="(scan.status === 'partial' || scan.status === 'failed') && scan.sanitizedError"
                      type="button"
                      class="btn-toggle-error"
                      @click="toggleErrorView(scan.id)"
                      title="Xem thông tin lỗi (đã khử dữ liệu nhạy cảm)"
                    >
                      {{ expandedScanId === scan.id ? 'Đóng lỗi' : 'Xem lỗi' }}
                    </button>
                  </td>
                  <td class="text-center font-mono">
                    {{ scan.channelsSuccess }} / {{ scan.channelsTotal }}
                  </td>
                  <td class="text-right font-mono">{{ formatNumber(scan.videosFound) }}</td>
                  <td class="text-right font-mono text-cyan">{{ formatNumber(scan.snapshotsCreated) }}</td>
                  <td class="text-center font-mono">
                    <span v-if="scan.alertsSent > 0" class="text-emerald">{{ scan.alertsSent }} gửi</span>
                    <span v-else class="text-muted">0</span>
                    <span v-if="scan.alertsFailed > 0" class="text-rose"> ({{ scan.alertsFailed }} lỗi)</span>
                  </td>
                </tr>

                <!-- Accordion Error Row -->
                <tr v-if="expandedScanId === scan.id" class="error-detail-row">
                  <td colspan="8">
                    <div class="scan-error-card">
                      <div class="error-header">
                        <AppIcon name="alert-triangle" :size="14" />
                        <span>Chi tiết lỗi (đã loại bỏ mã bí mật và URL webhook):</span>
                      </div>
                      <pre class="error-pre">{{ scan.sanitizedError }}</pre>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AlertStatusBadge from '@/components/alert-history/AlertStatusBadge.vue';
import type { ReportAlert, ReportScan, ReportScanSummary, ReportRange } from '@/types/report';
import {
  formatVph,
  formatNumber,
  formatVietnamDateTime,
} from '@/services/report-service';

defineProps<{
  alerts: ReportAlert[];
  scans: ReportScan[];
  scanSummary: ReportScanSummary;
  range: ReportRange;
}>();

const expandedScanId = ref<string | null>(null);

function toggleErrorView(scanId: string) {
  if (expandedScanId.value === scanId) {
    expandedScanId.value = null;
  } else {
    expandedScanId.value = scanId;
  }
}
</script>

<style scoped>
.operations-view-container {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.operations-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #2563eb;
  margin-bottom: 2px;
}

[data-theme="dark"] .section-kicker {
  color: #38bdf8;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0 0 4px;
}

.section-desc {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  margin: 0;
  max-width: 720px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alerts-count-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--bg-inset, #f1f5f9);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}

.action-link-btn {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  background: var(--primary-soft, #eff6ff);
  color: var(--primary, #2563eb);
  text-decoration: none;
  border: 1px solid #bfdbfe;
  transition: all 0.15s ease;
}

.action-link-btn:hover {
  background: #dbeafe;
}

[data-theme="dark"] .action-link-btn {
  background: rgba(37, 99, 235, 0.15);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

/* Scan Metrics Bar */
.scan-metrics-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.scan-metric-card {
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .scan-metric-card {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.7);
}

.sm-label {
  font-size: 11px;
  color: var(--text-secondary, #64748b);
  margin-bottom: 2px;
}

.sm-value {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  font-variant-numeric: tabular-nums;
}

.empty-ops-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  background: var(--surface, #ffffff);
  border: 1px dashed var(--border, #cbd5e1);
  border-radius: 12px;
  color: var(--text-muted, #94a3b8);
  font-size: 13.5px;
  text-align: center;
}

[data-theme="dark"] .empty-ops-box {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.6);
}

.table-card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .table-card {
  background: rgba(15, 23, 42, 0.7);
  border-color: rgba(51, 65, 85, 0.7);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.ops-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.ops-table th {
  padding: 12px 16px;
  background: var(--bg-inset, #f8fafc);
  border-bottom: 1px solid var(--border, #e2e8f0);
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
}

[data-theme="dark"] .ops-table th {
  background: rgba(15, 23, 42, 0.9);
  border-bottom-color: rgba(51, 65, 85, 0.7);
  color: #94a3b8;
}

.ops-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border, #f1f5f9);
  vertical-align: middle;
}

[data-theme="dark"] .ops-table td {
  border-bottom-color: rgba(51, 65, 85, 0.4);
}

.ops-table tbody tr:last-child td {
  border-bottom: none;
}

.ops-table tbody tr:hover td {
  background: rgba(241, 245, 249, 0.5);
}

[data-theme="dark"] .ops-table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.alert-video-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
}

.alert-thumb {
  width: 60px;
  height: 34px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.alert-thumb-fallback {
  width: 60px;
  height: 34px;
  border-radius: 6px;
  background: #e2e8f0;
  color: #64748b;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.alert-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 320px;
}

.alert-v-title {
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-v-title:hover {
  color: #2563eb;
}

[data-theme="dark"] .alert-v-title:hover {
  color: #38bdf8;
}

.alert-v-channel {
  font-size: 11.5px;
  color: var(--text-secondary, #64748b);
  text-decoration: none;
}

.alert-v-channel:hover {
  color: #2563eb;
}

.source-tag {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.source-tag.is-schedule {
  background: #eef2ff;
  color: #4f46e5;
}

.source-tag.is-manual {
  background: #f1f5f9;
  color: #475569;
}

.source-tag.is-unknown {
  background: #f8fafc;
  color: #94a3b8;
}

.status-pill {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
}

.status-pill.pill-success {
  background: #ecfdf5;
  color: #059669;
}

.status-pill.pill-partial {
  background: #fffbeb;
  color: #d97706;
}

.status-pill.pill-failed {
  background: #fef2f2;
  color: #dc2626;
}

.status-pill.pill-running {
  background: #eff6ff;
  color: #2563eb;
}

.status-pill.pill-unknown {
  background: #f1f5f9;
  color: #64748b;
}

.btn-toggle-error {
  display: block;
  margin-top: 4px;
  font-size: 10.5px;
  color: #dc2626;
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.btn-toggle-error:hover {
  color: #b91c1c;
}

.error-detail-row td {
  padding: 0 16px 16px;
  background: #fff5f5;
}

[data-theme="dark"] .error-detail-row td {
  background: rgba(225, 29, 72, 0.05);
}

.scan-error-card {
  padding: 12px;
  background: #ffffff;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

[data-theme="dark"] .scan-error-card {
  background: #0f172a;
  border-color: rgba(244, 63, 94, 0.4);
}

.error-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 6px;
}

.error-pre {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: #991b1b;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 180px;
  overflow-y: auto;
}

[data-theme="dark"] .error-pre {
  color: #fca5a5;
}

.detail-link {
  font-size: 12px;
  font-weight: 500;
  color: #2563eb;
  text-decoration: none;
}

.detail-link:hover {
  text-decoration: underline;
}

[data-theme="dark"] .detail-link {
  color: #38bdf8;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-emerald {
  color: #059669;
}

.text-blue {
  color: #2563eb;
}

.text-amber {
  color: #d97706;
}

.text-rose {
  color: #dc2626;
}

.text-cyan {
  color: #0891b2;
}

.text-muted {
  color: var(--text-muted, #94a3b8);
}

.text-secondary {
  color: var(--text-secondary, #64748b);
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}
</style>
