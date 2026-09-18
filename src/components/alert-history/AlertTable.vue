<template>
  <div class="alert-table-card">
    <div class="table-scroll-wrapper">
      <table class="ops-table">
        <thead>
          <tr>
            <th class="col-video">Video</th>
            <th class="col-channel">Kênh</th>
            <th class="col-time">Tạo lúc</th>
            <th class="col-num">VPH cảnh báo</th>
            <th class="col-num">Ngưỡng VPH</th>
            <th class="col-num">Vượt ngưỡng</th>
            <th class="col-num">Views lúc alert</th>
            <th class="col-num">View tăng</th>
            <th class="col-status">Trạng thái</th>
            <th class="col-num">Lần thử</th>
            <th class="col-time">Gửi lúc</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            class="ops-row"
            tabindex="0"
            role="button"
            :aria-label="`Xem chi tiết cảnh báo video ${item.videoTitle}`"
            @click="$emit('select-item', item)"
            @keydown.enter="$emit('select-item', item)"
          >
            <!-- 1. Video -->
            <td class="col-video">
              <div class="video-cell-flex">
                <div class="mini-thumb" @click.stop>
                  <VideoThumbnail
                    :src="item.videoThumbnailUrl"
                    :alt="item.videoTitle"
                    :youtube-video-id="item.videoYoutubeId || undefined"
                    :detail-url="`/videos/${item.videoId}`"
                    ratio="16-9"
                  />
                </div>
                <router-link
                  :to="`/videos/${item.videoId}`"
                  class="tbl-video-title"
                  :title="item.videoTitle"
                  @click.stop
                >
                  {{ item.videoTitle }}
                </router-link>
              </div>
            </td>

            <!-- 2. Kênh -->
            <td class="col-channel" @click.stop>
              <router-link
                v-if="item.channelId"
                :to="`/kenh-theo-doi/${item.channelId}`"
                class="tbl-channel-link"
              >
                <span class="avatar-fallback" v-if="!item.channelAvatarUrl || (item.channelId && avatarErrors[item.channelId])">
                  {{ item.channelName.charAt(0).toUpperCase() }}
                </span>
                <img
                  v-else
                  :src="item.channelAvatarUrl"
                  :alt="item.channelName"
                  class="tbl-avatar"
                  loading="lazy"
                  @error="item.channelId && (avatarErrors[item.channelId] = true)"
                />
                <span class="tbl-channel-name">{{ item.channelName }}</span>
              </router-link>
              <span v-else class="tbl-channel-name">{{ item.channelName }}</span>
            </td>

            <!-- 3. Tạo lúc -->
            <td class="col-time time-val mono">{{ formatDateTime(item.createdAt) }}</td>

            <!-- 4. VPH lúc cảnh báo -->
            <td class="col-num mono font-bold">{{ fmtVph(item.measuredVph) }}</td>

            <!-- 5. Ngưỡng VPH -->
            <td class="col-num mono text-muted">{{ fmtVph(item.thresholdVph) }}</td>

            <!-- 6. Vượt ngưỡng -->
            <td class="col-num mono">
              <span
                class="excess-tag"
                :class="{
                  'is-pos': (item.thresholdExcessRatio ?? 0) > 0,
                  'is-zero': item.thresholdExcessRatio === 0
                }"
              >
                {{ alertHistoryService.formatThresholdExcess(item.thresholdExcessRatio) }}
              </span>
            </td>

            <!-- 7. Views lúc cảnh báo -->
            <td class="col-num mono">{{ fmtNum(item.viewCountAtAlert) }}</td>

            <!-- 8. View tăng -->
            <td class="col-num mono">{{ alertHistoryService.formatDelta(item.viewDeltaAtAlert) }}</td>

            <!-- 9. Trạng thái -->
            <td class="col-status">
              <AlertStatusBadge :status="item.status" :is-sending-stuck="item.isSendingStuck" />
            </td>

            <!-- 10. Lần thử -->
            <td class="col-num mono">{{ item.attempts }}</td>

            <!-- 11. Gửi lúc -->
            <td class="col-time time-val mono">{{ item.sentAt ? formatDateTime(item.sentAt) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import AlertStatusBadge from './AlertStatusBadge.vue';
import { alertHistoryService, isValidTimestamp } from '@/services/alert-history-service';
import type { AlertHistoryItem } from '@/types/alert-history';

const avatarErrors = ref<Record<string, boolean>>({});

defineProps<{
  items: AlertHistoryItem[];
}>();

defineEmits<{
  (e: 'select-item', item: AlertHistoryItem): void;
}>();

function fmtVph(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return Math.round(v).toLocaleString('vi-VN');
}

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('vi-VN');
}

function formatDateTime(iso: string): string {
  if (!isValidTimestamp(iso)) return '—';
  const dt = new Date(iso);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${hh}:${min} ${dd}/${mm}`;
}
</script>

<style scoped>
.alert-table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.table-scroll-wrapper {
  overflow-x: auto;
}

.ops-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
  font-size: 13px;
}

.ops-table thead {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 2;
}

.ops-table th {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: left;
  white-space: nowrap;
}

.col-num {
  text-align: right !important;
}

.ops-row {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.12s ease;
  outline: none;
}

.ops-row:hover,
.ops-row:focus-visible {
  background: #f8fafc;
}

.ops-table td {
  padding: 10px 14px;
  vertical-align: middle;
  color: #0f172a;
}

.col-video {
  max-width: 260px;
}

.video-cell-flex {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-thumb {
  width: 64px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
}

.tbl-video-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.35;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tbl-video-title:hover {
  color: #0284c7;
  text-decoration: underline;
}

.tbl-channel-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
}

.tbl-channel-link:hover .tbl-channel-name {
  color: #0284c7;
}

.tbl-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-val {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.font-bold {
  font-weight: 700;
}

.text-muted {
  color: #64748b;
}

.excess-tag {
  font-weight: 600;
}

.excess-tag.is-pos {
  color: #16a34a;
}

.excess-tag.is-zero {
  color: #64748b;
}
</style>
