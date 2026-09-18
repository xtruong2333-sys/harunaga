<template>
  <div class="card-section scan-operations-section">
    <!-- Header -->
    <div class="section-title-wrap">
      <div>
        <h2 class="section-title">Hoạt Động Quét Dữ Liệu</h2>
        <p class="section-subtitle">
          Giám sát chu kỳ quét tự động và lịch sử các lần thu thập dữ liệu từ YouTube.
        </p>
      </div>
    </div>

    <!-- Latest Scheduled Scan Box -->
    <div class="sub-card schedule-summary-card">
      <div class="sub-card-header">
        <div class="sub-card-title-group">
          <AppIcon name="clock" size="18" class="text-primary" />
          <h3 class="sub-card-title">Lần Quét Tự Động Gần Nhất</h3>
        </div>
        <span
          v-if="latestScheduledScan"
          class="badge-status"
          :class="`status-${latestScheduledScan.status}`"
        >
          {{ latestScheduledScan.statusLabel }}
        </span>
      </div>

      <div v-if="latestScheduledScan" class="schedule-details-grid">
        <div class="schedule-item">
          <span class="schedule-item-label">Bắt đầu lúc</span>
          <span class="schedule-item-val mono">{{ formatDateTime(latestScheduledScan.startedAt) }}</span>
          <span class="schedule-item-sub">({{ latestScheduledScan.relativeTime }})</span>
        </div>

        <div class="schedule-item">
          <span class="schedule-item-label">Thời lượng</span>
          <span class="schedule-item-val mono">{{ latestScheduledScan.durationText }}</span>
        </div>

        <div class="schedule-item">
          <span class="schedule-item-label">Kênh quét</span>
          <span class="schedule-item-val mono">
            {{ latestScheduledScan.channelsSuccess }}/{{ latestScheduledScan.channelsTotal }}
            <span v-if="latestScheduledScan.channelsFailed > 0" class="text-danger-sm">
              ({{ latestScheduledScan.channelsFailed }} lỗi)
            </span>
          </span>
        </div>

        <div class="schedule-item">
          <span class="schedule-item-label">Video phát hiện</span>
          <span class="schedule-item-val mono">{{ formatNumber(latestScheduledScan.videosFound) }}</span>
        </div>

        <div class="schedule-item">
          <span class="schedule-item-label">Snapshot tạo mới</span>
          <span class="schedule-item-val mono">{{ formatNumber(latestScheduledScan.snapshotsCreated) }}</span>
        </div>

        <div class="schedule-item">
          <span class="schedule-item-label">Cảnh báo gửi</span>
          <span class="schedule-item-val mono">
            {{ latestScheduledScan.alertsSent }} gửi
            <span v-if="latestScheduledScan.alertsFailed > 0" class="text-danger-sm">
              ({{ latestScheduledScan.alertsFailed }} lỗi)
            </span>
          </span>
        </div>
      </div>

      <div v-else class="empty-placeholder">
        Chưa có thông tin lần quét tự động nào trong hệ thống.
      </div>
    </div>

    <!-- Recent Scans History -->
    <div class="scans-history-wrap">
      <div class="history-header-flex">
        <div>
          <h3 class="subsection-title">Lịch Sử Quét (20 lần gần nhất)</h3>
          <span class="subsection-meta">Theo dõi tiến trình và nhật ký các phiên thu thập dữ liệu</span>
        </div>

        <!-- Filter Controls -->
        <div class="filter-bar">
          <div class="filter-group">
            <label class="filter-label">Kiểu chạy:</label>
            <select v-model="scanTypeFilter" class="filter-select">
              <option value="all">Tất cả kiểu</option>
              <option value="schedule">Tự động</option>
              <option value="manual">Thủ công</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Trạng thái:</label>
            <select v-model="scanStatusFilter" class="filter-select">
              <option value="all">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="partial">Một phần</option>
              <option value="failed">Thất bại</option>
              <option value="running">Đang chạy</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Scans Desktop Table -->
      <div v-if="filteredScans.length > 0" class="table-container desktop-only">
        <table class="data-table">
          <thead>
            <tr>
              <th>Thời Gian</th>
              <th>Kiểu Chạy</th>
              <th>Trạng Thái</th>
              <th>Thời Lượng</th>
              <th>Kênh Quét</th>
              <th>Video</th>
              <th>Snapshot</th>
              <th>Cảnh Báo</th>
              <th>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="scan in filteredScans" :key="scan.id">
              <td class="cell-nowrap">
                <div class="scan-time-main mono">{{ formatDateTime(scan.startedAt) }}</div>
                <div class="scan-time-sub">{{ scan.relativeTime }}</div>
              </td>
              <td>
                <span class="badge-trigger" :class="`trigger-${scan.triggerSource}`">
                  {{ scan.triggerLabel }}
                </span>
              </td>
              <td>
                <span class="badge-status" :class="`status-${scan.status}`">
                  {{ scan.statusLabel }}
                </span>
              </td>
              <td class="mono cell-nowrap">{{ scan.durationText }}</td>
              <td class="mono">
                <span>{{ scan.channelsSuccess }}/{{ scan.channelsTotal }}</span>
                <span v-if="scan.channelsFailed > 0" class="text-danger-sm"> ({{ scan.channelsFailed }} lỗi)</span>
              </td>
              <td class="mono">{{ formatNumber(scan.videosFound) }}</td>
              <td class="mono">{{ formatNumber(scan.snapshotsCreated) }}</td>
              <td class="mono">
                <span>{{ scan.alertsSent }} gửi</span>
                <span v-if="scan.alertsFailed > 0" class="text-danger-sm"> ({{ scan.alertsFailed }} lỗi)</span>
              </td>
              <td>
                <button
                  v-if="scan.sanitizedError"
                  class="btn-text-danger"
                  @click="$emit('view-scan-error', scan)"
                  title="Xem chi tiết thông báo lỗi"
                >
                  Xem lỗi
                </button>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Scans Mobile Cards -->
      <div v-if="filteredScans.length > 0" class="mobile-cards-list mobile-only">
        <div v-for="scan in filteredScans" :key="scan.id" class="mobile-item-card">
          <div class="card-top-row">
            <div>
              <div class="scan-time-main mono">{{ formatDateTime(scan.startedAt) }}</div>
              <div class="scan-time-sub">{{ scan.relativeTime }}</div>
            </div>
            <div class="badges-row">
              <span class="badge-trigger" :class="`trigger-${scan.triggerSource}`">
                {{ scan.triggerLabel }}
              </span>
              <span class="badge-status" :class="`status-${scan.status}`">
                {{ scan.statusLabel }}
              </span>
            </div>
          </div>

          <div class="card-metrics-grid">
            <div class="metric-block">
              <span class="metric-label">Thời lượng</span>
              <span class="metric-val mono">{{ scan.durationText }}</span>
            </div>
            <div class="metric-block">
              <span class="metric-label">Kênh quét</span>
              <span class="metric-val mono">{{ scan.channelsSuccess }}/{{ scan.channelsTotal }}</span>
            </div>
            <div class="metric-block">
              <span class="metric-label">Video / Snapshot</span>
              <span class="metric-val mono">{{ formatNumber(scan.videosFound) }} / {{ formatNumber(scan.snapshotsCreated) }}</span>
            </div>
            <div class="metric-block">
              <span class="metric-label">Cảnh báo</span>
              <span class="metric-val mono">{{ scan.alertsSent }} gửi</span>
            </div>
          </div>

          <div v-if="scan.sanitizedError" class="card-action-row">
            <button class="btn-text-danger" @click="$emit('view-scan-error', scan)">
              Xem thông tin lỗi
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty-placeholder">
        Không có lần quét nào phù hợp với bộ lọc được chọn.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { formatNumber, formatDateTime } from '@/services/data-health-service';
import type { DataHealthScan, ScanStatus } from '@/types/data-health';

const props = defineProps<{
  latestScheduledScan: DataHealthScan | null;
  scans: DataHealthScan[];
}>();

defineEmits<{
  (e: 'view-scan-error', scan: DataHealthScan): void;
}>();

const scanTypeFilter = ref<'all' | 'schedule' | 'manual'>('all');
const scanStatusFilter = ref<'all' | ScanStatus>('all');

const filteredScans = computed(() => {
  let list = props.scans;

  if (scanTypeFilter.value !== 'all') {
    list = list.filter(s => s.triggerSource === scanTypeFilter.value);
  }

  if (scanStatusFilter.value !== 'all') {
    list = list.filter(s => s.status === scanStatusFilter.value);
  }

  return list;
});
</script>

<style scoped>
.card-section {
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  border-radius: var(--radius-lg, 12px);
  padding: 20px 24px;
}

[data-theme="dark"] .card-section {
  background: var(--bg-card, #1E293B);
  border-color: rgba(255, 255, 255, 0.08);
}

.section-title-wrap {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--text-primary, #0F172A);
}

.section-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

[data-theme="dark"] .section-subtitle {
  color: #94A3B8;
}

.sub-card {
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 16px 18px;
  margin-bottom: 24px;
}

[data-theme="dark"] .sub-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.sub-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.sub-card-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-card-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary, #0F172A);
}

.schedule-details-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.schedule-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.schedule-item-label {
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted, #64748B);
}

[data-theme="dark"] .schedule-item-label {
  color: #94A3B8;
}

.schedule-item-val {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
}

.schedule-item-sub {
  font-size: 0.76rem;
  color: var(--text-muted, #64748B);
}

.scans-history-wrap {
  margin-top: 10px;
}

.history-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 2px 0;
}

.subsection-meta {
  font-size: 0.82rem;
  color: var(--text-muted, #64748B);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label {
  font-size: 0.82rem;
  color: var(--text-secondary, #64748B);
  font-weight: 500;
}

[data-theme="dark"] .filter-label {
  color: #94A3B8;
}

.filter-select {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, #CBD5E1);
  background: var(--bg-card, #FFFFFF);
  color: var(--text-primary, #0F172A);
  font-size: 0.82rem;
  cursor: pointer;
}

[data-theme="dark"] .filter-select {
  background: #0F172A;
  border-color: rgba(255, 255, 255, 0.15);
  color: #E2E8F0;
}

.table-container {
  overflow-x: auto;
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  border-radius: var(--radius-md, 8px);
}

[data-theme="dark"] .table-container {
  border-color: rgba(255, 255, 255, 0.08);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
  text-align: left;
}

.data-table th {
  padding: 10px 14px;
  background: var(--bg-inset, #F8FAFC);
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted, #64748B);
  border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
}

[data-theme="dark"] .data-table th {
  background: rgba(255, 255, 255, 0.04);
  border-bottom-color: rgba(255, 255, 255, 0.08);
  color: #94A3B8;
}

.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.04));
  color: var(--text-primary, #0F172A);
}

[data-theme="dark"] .data-table td {
  border-bottom-color: rgba(255, 255, 255, 0.04);
  color: #E2E8F0;
}

.data-table tbody tr:hover {
  background: rgba(0, 0, 0, 0.015);
}

[data-theme="dark"] .data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.cell-nowrap {
  white-space: nowrap;
}

.scan-time-main {
  font-weight: 600;
  font-size: 0.84rem;
}

.scan-time-sub {
  font-size: 0.74rem;
  color: var(--text-muted, #64748B);
}

[data-theme="dark"] .scan-time-sub {
  color: #94A3B8;
}

.badge-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-success {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}
[data-theme="dark"] .status-success { color: #34D399; }

.status-partial {
  background: rgba(245, 158, 11, 0.15);
  color: #D97706;
}
[data-theme="dark"] .status-partial { color: #FBBF24; }

.status-failed {
  background: rgba(239, 68, 68, 0.15);
  color: #DC2626;
}
[data-theme="dark"] .status-failed { color: #F87171; }

.status-running {
  background: rgba(59, 130, 246, 0.15);
  color: #2563EB;
}
[data-theme="dark"] .status-running { color: #60A5FA; }

.badge-trigger {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--bg-inset, #EEF4F8);
  color: var(--text-secondary, #475569);
}

[data-theme="dark"] .badge-trigger {
  background: rgba(255, 255, 255, 0.08);
  color: #CBD5E1;
}

.text-danger-sm {
  font-size: 0.76rem;
  color: #DC2626;
  font-weight: 600;
}

[data-theme="dark"] .text-danger-sm {
  color: #F87171;
}

.btn-text-danger {
  background: none;
  border: none;
  color: #DC2626;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

[data-theme="dark"] .btn-text-danger {
  color: #F87171;
}

.empty-placeholder {
  padding: 24px;
  text-align: center;
  font-size: 0.88rem;
  color: var(--text-muted, #94A3B8);
}

/* Mobile cards */
.mobile-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-item-card {
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 14px;
}

[data-theme="dark"] .mobile-item-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.card-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.badges-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.74rem;
  color: var(--text-muted, #64748B);
  font-weight: 500;
}

[data-theme="dark"] .metric-label {
  color: #94A3B8;
}

.metric-val {
  font-size: 0.85rem;
  font-weight: 700;
}

.card-action-row {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
}

.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 1024px) {
  .schedule-details-grid {
    grid-template-columns: repeat(3, 1fr);
    row-gap: 14px;
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  .mobile-only {
    display: flex;
  }
  .schedule-details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
