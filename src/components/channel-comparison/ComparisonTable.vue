<template>
  <div class="comparison-table-view card">
    <div class="table-header-title">
      <h3 class="t-title">BẢNG ĐỐI SOÁT TẤT CẢ CHỈ SỐ</h3>
      <p class="t-sub">Toàn bộ thông số đo lường thực tế và cấu hình giám sát được đặt cạnh nhau để kiểm tra toàn diện.</p>
    </div>

    <div class="table-wrapper">
      <table class="benchmark-table">
        <thead>
          <tr>
            <th class="th-metric-header sticky-col">Chỉ số so sánh</th>
            <th
              v-for="ch in channels"
              :key="ch.id"
              class="th-channel-header"
              :style="{ borderTopColor: ch.color }"
            >
              <div class="ch-th-box">
                <span class="ch-th-dot" :style="{ backgroundColor: ch.color }"></span>
                <span class="ch-th-name">{{ ch.name }}</span>
                <span class="badge-status" :class="`status-${ch.status}`">
                  {{ ch.statusLabel }}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- VPH Cao Nhất -->
          <tr class="highlight-row">
            <td class="cell-name sticky-col">
              <div class="metric-title">VPH CAO NHẤT</div>
              <div class="metric-hint">Tốc độ tăng cao nhất đo được của 1 video</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
              :class="{ 'is-max': isMaxMetric(ch, 'maxVph') }"
            >
              <div class="val-wrap">
                <span>{{ ch.metrics.maxVph !== null ? `${ch.metrics.maxVph.toLocaleString('vi-VN')} VPH` : '—' }}</span>
                <span v-if="isMaxMetric(ch, 'maxVph')" class="max-badge">CAO NHẤT</span>
              </div>
            </td>
          </tr>

          <!-- Video Đang Tăng -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Video Đang Tăng</div>
              <div class="metric-hint">Số video có VPH đo được > 0</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
              :class="{ 'is-max': isMaxMetric(ch, 'risingVideoCount') }"
            >
              <div class="val-wrap">
                <span>{{ ch.metrics.risingVideoCount }} video</span>
                <span v-if="isMaxMetric(ch, 'risingVideoCount')" class="max-badge">CAO NHẤT</span>
              </div>
            </td>
          </tr>

          <!-- Tỷ Lệ Video Đang Tăng -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Tỷ Lệ Đang Tăng</div>
              <div class="metric-hint">Tỷ lệ video tăng trên số video đã đo VPH</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
              :class="{ 'is-max': isMaxMetric(ch, 'risingVideoRatio') }"
            >
              <div class="val-wrap">
                <span>{{ ch.metrics.risingVideoRatio !== null ? `${ch.metrics.risingVideoRatio}%` : '—' }}</span>
                <span v-if="isMaxMetric(ch, 'risingVideoRatio')" class="max-badge">CAO NHẤT</span>
              </div>
            </td>
          </tr>

          <!-- VPH Trung Bình Đo Được -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">VPH Trung Bình Đo Được</div>
              <div class="metric-hint">Trung bình các video đã có VPH (bao gồm 0)</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
              :class="{ 'is-max': isMaxMetric(ch, 'avgMeasuredVph') }"
            >
              <div class="val-wrap">
                <span>{{ ch.metrics.avgMeasuredVph !== null ? `${ch.metrics.avgMeasuredVph.toLocaleString('vi-VN')} VPH` : '—' }}</span>
                <span v-if="isMaxMetric(ch, 'avgMeasuredVph')" class="max-badge">CAO NHẤT</span>
              </div>
            </td>
          </tr>

          <!-- Lượt Xem Đang Theo Dõi -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Lượt Xem Đang Theo Dõi</div>
              <div class="metric-hint">Tổng lượt xem các video trong cửa sổ lọc</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
              :class="{ 'is-max': isMaxMetric(ch, 'trackedViews') }"
            >
              <div class="val-wrap">
                <span>{{ ch.metrics.trackedViews !== null ? ch.metrics.trackedViews.toLocaleString('vi-VN') : '—' }}</span>
                <span v-if="isMaxMetric(ch, 'trackedViews')" class="max-badge">CAO NHẤT</span>
              </div>
            </td>
          </tr>

          <!-- Delta Gần Nhất -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Delta Lượt Xem Gần Nhất</div>
              <div class="metric-hint">Lượt xem tăng thêm ở snapshot mới nhất</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
              :class="{ 'is-max': isMaxMetric(ch, 'latestViewDelta') }"
            >
              <div class="val-wrap">
                <span>{{ formatDelta(ch.metrics.latestViewDelta) }}</span>
                <span v-if="isMaxMetric(ch, 'latestViewDelta')" class="max-badge">CAO NHẤT</span>
              </div>
            </td>
          </tr>

          <!-- Số Video Xuất Bản -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Số Video Xuất Bản</div>
              <div class="metric-hint">Tổng video được đăng trong khoảng thời gian này</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
            >
              {{ ch.metrics.videoCount }} video
            </td>
          </tr>

          <!-- Ngưỡng Cảnh Báo -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Ngưỡng Cảnh Báo Kênh</div>
              <div class="metric-hint">Mức VPH kích hoạt cảnh báo Discord</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono text-muted"
            >
              {{ ch.alertVphThreshold !== null ? `${ch.alertVphThreshold.toLocaleString('vi-VN')} VPH` : '—' }}
            </td>
          </tr>

          <!-- Lần Quét Cuối -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Cập Nhật Kênh Gần Nhất</div>
              <div class="metric-hint">Thời gian hệ thống quét kênh lần cuối</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val"
            >
              {{ ch.relativeScanTime }}
            </td>
          </tr>

          <!-- Nhịp 7 Ngày -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Số Video Trong 7 Ngày</div>
              <div class="metric-hint">Tần suất xuất bản tuần gần nhất</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
            >
              {{ ch.publishing.publishedLast7d }} video
            </td>
          </tr>

          <!-- Nhịp 30 Ngày -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Số Video Trong 30 Ngày</div>
              <div class="metric-hint">Quy mô xuất bản tháng gần nhất</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
            >
              {{ ch.publishing.publishedLast30d }} video
            </td>
          </tr>

          <!-- Thao Tác -->
          <tr>
            <td class="cell-name sticky-col">
              <div class="metric-title">Hồ Sơ Kênh</div>
              <div class="metric-hint">Xem chi tiết toàn bộ hồ sơ đối thủ</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val"
            >
              <router-link :to="`/kenh-theo-doi/${ch.id}`" class="table-link">
                Xem chi tiết →
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChannelComparisonItem } from '@/types/channel-comparison';
import { formatDelta } from '@/services/channel-comparison-service';

const props = defineProps<{
  channels: ChannelComparisonItem[];
}>();

function isMaxMetric(ch: ChannelComparisonItem, key: keyof ChannelComparisonItem['metrics']): boolean {
  if (props.channels.length < 2) return false;
  const val = ch.metrics[key];
  if (val === null || val === undefined || Number(val) <= 0) return false;

  const allVals = props.channels
    .map(c => c.metrics[key])
    .filter((v): v is number => v !== null && v !== undefined && Number(v) > 0);

  if (allVals.length === 0) return false;
  const max = Math.max(...allVals);
  return Number(val) === max;
}
</script>

<style scoped>
.comparison-table-view {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.table-header-title {
  margin-bottom: 20px;
}

.t-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.t-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
}

.benchmark-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.88rem;
}

.benchmark-table th,
.benchmark-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.benchmark-table thead th {
  background: #f8fafc;
  border-top: 3px solid transparent;
  font-size: 0.8rem;
}

.th-metric-header {
  width: 280px;
  color: #475569;
  font-weight: 700;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: #ffffff;
  z-index: 2;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.02);
}

.benchmark-table thead .sticky-col {
  background: #f8fafc;
}

.ch-th-box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
}

.ch-th-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ch-th-name {
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-status {
  padding: 2px 6px;
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 4px;
}

.status-active {
  background: #ecfdf5;
  color: #059669;
}

.status-paused {
  background: #fffbeb;
  color: #d97706;
}

.status-archived {
  background: #f1f5f9;
  color: #64748b;
}

.metric-title {
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2px;
}

.metric-hint {
  font-size: 0.74rem;
  color: #64748b;
}

.cell-val {
  font-weight: 600;
  color: #0f172a;
}

.cell-val.is-max {
  color: #2563eb;
  background: #f0f7ff;
}

.val-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.max-badge {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  background: #2563eb;
  color: #ffffff;
  border-radius: 4px;
}

.highlight-row td {
  background: #fafcff;
}

.highlight-row td.is-max {
  background: #eef6ff;
}

.table-link {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.table-link:hover {
  text-decoration: underline;
}

.text-muted {
  color: #64748b;
}
</style>