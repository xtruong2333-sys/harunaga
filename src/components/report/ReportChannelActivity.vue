<template>
  <div class="channel-activity-container">
    <div class="section-header">
      <div class="header-text">
        <div class="section-kicker">NHỊP ĐĂNG ĐỐI THỦ</div>
        <h2 class="section-title">Kênh Có Hoạt Động Mới</h2>
        <p class="section-desc">
          Thống kê số lượng video mới và video mới nhất của từng kênh đối thủ trong {{ range === '24h' ? '24 giờ' : '7 ngày' }} qua.
        </p>
      </div>
      <div class="total-channels-pill">
        <AppIcon name="tv" :size="14" />
        <span>{{ channels.length }} kênh có video mới</span>
      </div>
    </div>

    <div v-if="channels.length === 0" class="empty-channel-box">
      <AppIcon name="tv" :size="28" />
      <p>Chưa có kênh đối thủ nào đăng video trong khoảng thời gian này.</p>
    </div>

    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="channel-table">
          <thead>
            <tr>
              <th scope="col" class="th-channel">Kênh đối thủ</th>
              <th scope="col" class="text-center th-count">Số video mới</th>
              <th scope="col" class="th-latest">Video mới nhất</th>
              <th scope="col" class="text-right th-vph">VPH cao nhất hiện tại</th>
              <th scope="col" class="text-center th-rising">Video đang tăng</th>
              <th scope="col" class="text-right th-actions">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ch in channels" :key="ch.channelId">
              <td>
                <div class="channel-info-cell">
                  <img
                    v-if="ch.channelAvatarUrl"
                    :src="ch.channelAvatarUrl"
                    :alt="ch.channelName"
                    class="channel-avatar"
                    loading="lazy"
                    @error="($event.target as HTMLElement).style.display = 'none'"
                  />
                  <div v-else class="channel-avatar-fallback">
                    {{ ch.channelName.slice(0, 1) }}
                  </div>
                  <div class="channel-meta">
                    <router-link
                      :to="`/kenh-theo-doi/${ch.channelId}`"
                      class="channel-link"
                      :title="ch.channelName"
                    >
                      {{ ch.channelName }}
                    </router-link>
                    <span v-if="ch.channelHandle" class="channel-handle">
                      {{ ch.channelHandle }}
                    </span>
                  </div>
                </div>
              </td>

              <td class="text-center">
                <span class="count-badge">
                  {{ ch.newVideosCount }}
                </span>
              </td>

              <td>
                <div class="latest-video-cell">
                  <router-link
                    v-if="ch.latestVideoId"
                    :to="`/videos/${ch.latestVideoId}`"
                    class="latest-video-title"
                    :title="ch.latestVideoTitle"
                  >
                    {{ ch.latestVideoTitle }}
                  </router-link>
                  <span v-else class="latest-video-title">
                    {{ ch.latestVideoTitle }}
                  </span>
                  <span class="latest-video-time" :title="formatVietnamDateTime(ch.latestPublishedAt)">
                    <AppIcon name="clock" :size="11" />
                    {{ formatRelativeTime(ch.latestPublishedAt) }}
                  </span>
                </div>
              </td>

              <td class="text-right font-mono">
                <span :class="{ 'text-emerald font-semibold': ch.maxCurrentVph !== null && ch.maxCurrentVph > 0 }">
                  {{ ch.maxCurrentVph !== null ? formatVph(ch.maxCurrentVph) : '—' }}
                </span>
              </td>

              <td class="text-center">
                <span
                  class="rising-pill"
                  :class="ch.risingCount > 0 ? 'is-rising' : 'is-neutral'"
                >
                  <AppIcon v-if="ch.risingCount > 0" name="trending-up" :size="11" />
                  {{ ch.risingCount }} video
                </span>
              </td>

              <td class="text-right">
                <router-link
                  :to="`/kenh-theo-doi/${ch.channelId}`"
                  class="view-detail-btn"
                  title="Xem chi tiết kênh đối thủ"
                >
                  Chi tiết kênh
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ReportChannelActivity, ReportRange } from '@/types/report';
import {
  formatVph,
  formatRelativeTime,
  formatVietnamDateTime,
} from '@/services/report-service';

defineProps<{
  channels: ReportChannelActivity[];
  range: ReportRange;
}>();
</script>

<style scoped>
.channel-activity-container {
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

.total-channels-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-inset, #f1f5f9);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 9999px;
  color: var(--text-secondary, #475569);
  font-size: 12px;
  font-weight: 600;
}

[data-theme="dark"] .total-channels-pill {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(51, 65, 85, 0.7);
  color: #94a3b8;
}

.empty-channel-box {
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

[data-theme="dark"] .empty-channel-box {
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

.channel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.channel-table th {
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

[data-theme="dark"] .channel-table th {
  background: rgba(15, 23, 42, 0.9);
  border-bottom-color: rgba(51, 65, 85, 0.7);
  color: #94a3b8;
}

.channel-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border, #f1f5f9);
  vertical-align: middle;
}

[data-theme="dark"] .channel-table td {
  border-bottom-color: rgba(51, 65, 85, 0.4);
}

.channel-table tbody tr:last-child td {
  border-bottom: none;
}

.channel-table tbody tr:hover td {
  background: rgba(241, 245, 249, 0.5);
}

[data-theme="dark"] .channel-table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.channel-info-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
}

.channel-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.channel-avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.channel-meta {
  display: flex;
  flex-direction: column;
}

.channel-link {
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  text-decoration: none;
}

.channel-link:hover {
  color: #2563eb;
}

[data-theme="dark"] .channel-link:hover {
  color: #38bdf8;
}

.channel-handle {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 700;
  border-radius: 6px;
  font-size: 12.5px;
}

[data-theme="dark"] .count-badge {
  background: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
}

.latest-video-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 360px;
}

.latest-video-title {
  font-weight: 500;
  color: var(--text-primary, #0f172a);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.latest-video-title:hover {
  color: #2563eb;
}

[data-theme="dark"] .latest-video-title:hover {
  color: #38bdf8;
}

.latest-video-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
}

.rising-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 600;
}

.rising-pill.is-rising {
  background: #ecfdf5;
  color: #059669;
}

[data-theme="dark"] .rising-pill.is-rising {
  background: rgba(5, 150, 105, 0.15);
  color: #34d399;
}

.rising-pill.is-neutral {
  background: var(--bg-inset, #f1f5f9);
  color: var(--text-muted, #94a3b8);
}

[data-theme="dark"] .rising-pill.is-neutral {
  background: rgba(255, 255, 255, 0.05);
}

.text-emerald {
  color: #059669;
}

[data-theme="dark"] .text-emerald {
  color: #34d399;
}

.font-semibold {
  font-weight: 600;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.view-detail-btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: var(--bg-inset, #f1f5f9);
  color: var(--text-secondary, #475569);
  text-decoration: none;
  transition: all 0.15s ease;
}

.view-detail-btn:hover {
  background: #e2e8f0;
  color: var(--text-primary, #0f172a);
}

[data-theme="dark"] .view-detail-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

[data-theme="dark"] .view-detail-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}
</style>
