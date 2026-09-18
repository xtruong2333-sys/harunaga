<template>
  <div class="comparison-publishing-rhythm card">
    <div class="rhythm-header">
      <div class="title-wrap">
        <h3 class="rhythm-title">NHỊP ĐĂNG ĐỐI CHIẾU</h3>
        <p class="rhythm-sub">So sánh tần suất và thói quen xuất bản nội dung dựa trên toàn bộ video đã thu thập của từng kênh.</p>
      </div>
    </div>

    <div class="table-responsive">
      <table class="rhythm-table">
        <thead>
          <tr>
            <th class="col-metric">Chỉ số nhịp đăng</th>
            <th
              v-for="ch in channels"
              :key="ch.id"
              class="col-channel"
              :style="{ borderTopColor: ch.color }"
            >
              <div class="channel-th-wrap">
                <span class="ch-dot" :style="{ backgroundColor: ch.color }"></span>
                <span class="ch-th-name" :title="ch.name">{{ ch.name }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="cell-label">
              <div class="label-title">Video trong 7 ngày gần nhất</div>
              <div class="label-desc">Tốc độ xuất bản tuần vừa qua</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
            >
              {{ ch.publishing.publishedLast7d }} video
            </td>
          </tr>

          <tr>
            <td class="cell-label">
              <div class="label-title">Video trong 30 ngày gần nhất</div>
              <div class="label-desc">Quy mô sản lượng tháng qua</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
            >
              {{ ch.publishing.publishedLast30d }} video
            </td>
          </tr>

          <tr>
            <td class="cell-label">
              <div class="label-title">Khoảng cách đăng trung bình</div>
              <div class="label-desc">Thời gian trung bình giữa 2 lần lên video liên tiếp</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
            >
              {{ ch.publishing.avgDaysBetweenPosts !== null ? `${ch.publishing.avgDaysBetweenPosts} ngày` : '—' }}
            </td>
          </tr>

          <tr>
            <td class="cell-label">
              <div class="label-title">Ngày đăng phổ biến nhất</div>
              <div class="label-desc">Thứ trong tuần có tần suất xuất bản cao nhất</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val"
            >
              <span :class="{ 'text-muted': ch.publishing.mostCommonWeekday === 'Chưa đủ dữ liệu' }">
                {{ ch.publishing.mostCommonWeekday }}
              </span>
            </td>
          </tr>

          <tr>
            <td class="cell-label">
              <div class="label-title">Khung giờ đăng phổ biến</div>
              <div class="label-desc">Khung giờ đối thủ hay hẹn giờ phát sóng</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono"
            >
              <span :class="{ 'text-muted': ch.publishing.commonHourWindow === 'Chưa đủ dữ liệu' }">
                {{ ch.publishing.commonHourWindow }}
              </span>
            </td>
          </tr>

          <tr>
            <td class="cell-label">
              <div class="label-title">Số video làm mẫu phân tích</div>
              <div class="label-desc">Dữ liệu mẫu thu thập dùng để tính các nhịp đăng trên</div>
            </td>
            <td
              v-for="ch in channels"
              :key="ch.id"
              class="cell-val mono text-muted"
            >
              {{ ch.publishing.sampleCount }} video
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChannelComparisonItem } from '@/types/channel-comparison';

defineProps<{
  channels: ChannelComparisonItem[];
}>();
</script>

<style scoped>
.comparison-publishing-rhythm {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.rhythm-header {
  margin-bottom: 20px;
}

.rhythm-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.rhythm-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.table-responsive {
  overflow-x: auto;
}

.rhythm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.rhythm-table th,
.rhythm-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.rhythm-table thead th {
  background: #f8fafc;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  border-top: 3px solid transparent;
}

.col-metric {
  width: 320px;
}

.channel-th-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ch-dot {
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

.cell-label {
  vertical-align: top;
}

.label-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.label-desc {
  font-size: 0.75rem;
  color: #64748b;
}

.cell-val {
  font-weight: 600;
  color: #0f172a;
  vertical-align: middle;
}

.text-muted {
  color: #94a3b8;
  font-style: italic;
}
</style>