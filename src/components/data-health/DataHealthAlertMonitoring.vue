<template>
  <div class="card-section alert-monitoring-section">
    <div class="section-header-flex">
      <div>
        <div class="title-with-pill">
          <h2 class="section-title">Sức Khỏe Cảnh Báo Discord</h2>
          <span class="sample-scope-pill">
            Mẫu tối đa 100 cảnh báo gần nhất
          </span>
        </div>
        <p class="section-subtitle">
          Theo dõi tiến trình gửi webhook cảnh báo khi video vượt ngưỡng VPH đã thiết lập (tính trên tập dữ liệu mẫu gần đây).
        </p>
      </div>

      <router-link to="/lich-su-canh-bao" class="btn btn-secondary btn-alert-history">
        <AppIcon name="bell" size="14" />
        <span>Xem Lịch Sử Cảnh Báo</span>
      </router-link>
    </div>

    <!-- Alert Summary Strip -->
    <div class="alert-stats-grid">
      <div class="alert-stat-box">
        <span class="alert-stat-label">Cảnh báo đã tải</span>
        <span class="alert-stat-num mono">{{ formatNumber(summary.total) }}</span>
      </div>
      <div class="alert-stat-box">
        <span class="alert-stat-label">Đã gửi thành công</span>
        <span class="alert-stat-num mono stat-normal">{{ formatNumber(summary.sent) }}</span>
      </div>
      <div class="alert-stat-box">
        <span class="alert-stat-label">Chờ gửi</span>
        <span class="alert-stat-num mono">{{ formatNumber(summary.pending) }}</span>
      </div>
      <div class="alert-stat-box">
        <span class="alert-stat-label">Đang gửi</span>
        <span class="alert-stat-num mono">{{ formatNumber(summary.sending) }}</span>
      </div>
      <div class="alert-stat-box">
        <span class="alert-stat-label">Gửi thất bại</span>
        <span
          class="alert-stat-num mono"
          :class="summary.failed > 0 ? 'stat-danger' : 'stat-normal'"
        >
          {{ formatNumber(summary.failed) }}
        </span>
      </div>
    </div>

    <!-- Stuck Sending Alert Warning -->
    <div v-if="summary.stuckSendingCount > 0" class="stuck-sending-alert">
      <AppIcon name="alert" size="18" class="text-warning" />
      <span>
        Có <strong>{{ summary.stuckSendingCount }}</strong> cảnh báo đang ở trạng thái gửi lâu hơn 15 phút. Hệ thống sẽ tự động thử lại ở phiên tiếp theo.
      </span>
    </div>

    <!-- Failed Alerts List (up to 10) -->
    <div v-if="summary.failedAlerts.length > 0" class="failed-alerts-wrap">
      <h3 class="subsection-title">Danh sách 10 cảnh báo lỗi gần nhất</h3>

      <!-- Desktop Table -->
      <div class="table-container desktop-only">
        <table class="data-table">
          <thead>
            <tr>
              <th>Video</th>
              <th>Kênh Đối Thủ</th>
              <th>VPH Ghi Nhận</th>
              <th>Số Lần Thử</th>
              <th>Thời Gian</th>
              <th>Chi Tiết Lỗi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in summary.failedAlerts" :key="alert.id">
              <td>
                <router-link :to="`/videos/${alert.videoId}`" class="video-link" :title="alert.videoTitle">
                  {{ alert.videoTitle }}
                </router-link>
              </td>
              <td class="cell-nowrap">{{ alert.channelName }}</td>
              <td class="mono cell-nowrap">
                {{ alert.measuredVph !== null ? `${formatNumber(alert.measuredVph)} VPH` : '—' }}
              </td>
              <td class="mono">{{ alert.attempts !== null ? alert.attempts : '—' }}</td>
              <td class="mono cell-nowrap">{{ formatDateTime(alert.updatedAt) }}</td>
              <td>
                <button class="btn-text-danger" @click="$emit('view-alert-error', alert)">
                  Xem lỗi
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="mobile-cards-list mobile-only">
        <div v-for="alert in summary.failedAlerts" :key="alert.id" class="mobile-item-card">
          <div class="card-top-row">
            <router-link :to="`/videos/${alert.videoId}`" class="video-link font-medium">
              {{ alert.videoTitle }}
            </router-link>
          </div>
          <div class="card-metrics-grid">
            <div class="metric-block">
              <span class="metric-label">Kênh</span>
              <span class="metric-val">{{ alert.channelName }}</span>
            </div>
            <div class="metric-block">
              <span class="metric-label">VPH / Số lần thử</span>
              <span class="metric-val mono">
                {{ alert.measuredVph !== null ? `${formatNumber(alert.measuredVph)} VPH` : '—' }} ({{ alert.attempts }} lần)
              </span>
            </div>
          </div>
          <div class="card-action-row">
            <button class="btn-text-danger" @click="$emit('view-alert-error', alert)">
              Xem chi tiết lỗi
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Clean Success State -->
    <div v-else class="alert-success-note">
      <AppIcon name="shield-check" size="18" class="text-success" />
      <span>Tất cả cảnh báo Discord trong mẫu đều gửi thành công hoặc đang chờ xử lý. Không có cảnh báo nào gặp lỗi.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { formatNumber, formatDateTime } from '@/services/data-health-service';
import type { AlertHealthSummary, FailedAlertItem } from '@/types/data-health';

defineProps<{
  summary: AlertHealthSummary;
}>();

defineEmits<{
  (e: 'view-alert-error', alert: FailedAlertItem): void;
}>();
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

.section-header-flex {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.title-with-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary, #0F172A);
}

.sample-scope-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: var(--bg-inset, #EEF4F8);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  color: var(--text-secondary, #475569);
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
}

[data-theme="dark"] .sample-scope-pill {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: #CBD5E1;
}

.section-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

[data-theme="dark"] .section-subtitle {
  color: #94A3B8;
}

.btn-alert-history {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: none;
  background: var(--bg-inset, #EEF4F8);
  color: var(--text-primary, #0F172A);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.1));
  transition: all 0.15s ease;
}

.btn-alert-history:hover {
  background: rgba(37, 99, 235, 0.08);
  color: #2563EB;
}

[data-theme="dark"] .btn-alert-history {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: #E2E8F0;
}

[data-theme="dark"] .btn-alert-history:hover {
  background: rgba(59, 130, 246, 0.15);
  color: #60A5FA;
}

.alert-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.alert-stat-box {
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

[data-theme="dark"] .alert-stat-box {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.alert-stat-label {
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted, #64748B);
}

[data-theme="dark"] .alert-stat-label {
  color: #94A3B8;
}

.alert-stat-num {
  font-size: 1.35rem;
  font-weight: 800;
}

.stat-normal { color: #10B981; }
.stat-danger { color: #EF4444; }

.stuck-sending-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--radius-md, 8px);
  font-size: 0.86rem;
  color: var(--text-primary, #0F172A);
  margin-bottom: 20px;
}

[data-theme="dark"] .stuck-sending-alert {
  background: rgba(245, 158, 11, 0.15);
  color: #F1F5F9;
}

.failed-alerts-wrap {
  margin-top: 10px;
}

.subsection-title {
  font-size: 0.98rem;
  font-weight: 700;
  margin: 0 0 12px 0;
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

.video-link {
  color: var(--text-primary, #0F172A);
  text-decoration: none;
  font-weight: 500;
}

.video-link:hover {
  color: #2563EB;
  text-decoration: underline;
}

[data-theme="dark"] .video-link {
  color: #F1F5F9;
}
[data-theme="dark"] .video-link:hover {
  color: #60A5FA;
}

.cell-nowrap {
  white-space: nowrap;
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

.alert-success-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-md, 8px);
  font-size: 0.88rem;
  color: #065F46;
  font-weight: 500;
}

[data-theme="dark"] .alert-success-note {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.25);
  color: #A7F3D0;
}

/* Mobile */
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
  margin-bottom: 10px;
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

.desktop-only { display: block; }
.mobile-only { display: none; }

@media (max-width: 900px) {
  .alert-stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-only { display: flex; }
  .alert-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
