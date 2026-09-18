<template>
  <AppModal
    :model-value="!!item"
    title="Chi Tiết Cảnh Báo VPH"
    max-width="640px"
    @update:model-value="onModalClose"
  >
    <div v-if="item" class="alert-detail-content">
      <!-- 1. Video & Channel Header -->
      <div class="modal-video-header">
        <div class="header-thumb">
          <VideoThumbnail
            :src="item.videoThumbnailUrl"
            :alt="item.videoTitle"
            :detail-url="`/videos/${item.videoId}`"
            ratio="16-9"
          />
        </div>

        <div class="header-info">
          <router-link
            :to="`/videos/${item.videoId}`"
            class="video-main-link"
            title="Xem chi tiết video trên hệ thống"
          >
            {{ item.videoTitle }}
          </router-link>

          <div class="channel-detail-line">
            <router-link
              v-if="item.channelId"
              :to="`/kenh-theo-doi/${item.channelId}`"
              class="ch-detail-link"
            >
              <span class="avatar-fallback" v-if="!item.channelAvatarUrl">
                {{ item.channelName.charAt(0).toUpperCase() }}
              </span>
              <img
                v-else
                :src="item.channelAvatarUrl"
                :alt="item.channelName"
                class="ch-avatar"
                loading="lazy"
              />
              <span class="ch-name">{{ item.channelName }}</span>
            </router-link>
            <span v-else class="ch-name">{{ item.channelName }}</span>
            <span v-if="item.channelHandle" class="ch-handle mono">{{ item.channelHandle }}</span>
          </div>

          <div class="action-links-row">
            <router-link :to="`/videos/${item.videoId}`" class="sub-link link-internal">
              <AppIcon name="info" size="13" />
              Xem hồ sơ video
            </router-link>

            <a
              v-if="item.videoYoutubeId"
              :href="`https://www.youtube.com/watch?v=${item.videoYoutubeId}`"
              target="_blank"
              rel="noopener noreferrer"
              class="sub-link link-yt"
            >
              Xem trên YouTube
              <AppIcon name="external" size="12" />
            </a>
          </div>
        </div>
      </div>

      <!-- 2. Snapshot tại thời điểm cảnh báo -->
      <div class="metric-section">
        <div class="section-title-tag">
          <AppIcon name="clock" size="13" />
          <span>DỮ LIỆU TẠI THỜI ĐIỂM CẢNH BÁO</span>
        </div>

        <div class="metrics-grid">
          <div class="metric-box">
            <span class="mb-label">Thời điểm ghi nhận</span>
            <span class="mb-value mono">{{ formatFullDateTime(item.createdAt) }}</span>
          </div>

          <div class="metric-box">
            <span class="mb-label">VPH đo được</span>
            <span class="mb-value mono font-bold text-accent">{{ fmtVph(item.measuredVph) }}</span>
          </div>

          <div class="metric-box">
            <span class="mb-label">Ngưỡng VPH kênh</span>
            <span class="mb-value mono">{{ fmtVph(item.thresholdVph) }}</span>
          </div>

          <div class="metric-box">
            <span class="mb-label">Mức vượt ngưỡng</span>
            <span
              class="mb-value mono font-bold"
              :class="{
                'text-green': (item.thresholdExcessRatio ?? 0) > 0,
                'text-muted': item.thresholdExcessRatio === 0
              }"
            >
              {{ alertHistoryService.formatThresholdExcess(item.thresholdExcessRatio) }}
            </span>
          </div>

          <div class="metric-box">
            <span class="mb-label">Lượt xem lúc cảnh báo</span>
            <span class="mb-value mono">{{ fmtNum(item.viewCountAtAlert) }}</span>
          </div>

          <div class="metric-box">
            <span class="mb-label">Lượt xem tăng (view delta)</span>
            <span class="mb-value mono">{{ alertHistoryService.formatDelta(item.viewDeltaAtAlert) }}</span>
          </div>

          <div class="metric-box">
            <span class="mb-label">Khoảng thời gian đo</span>
            <span class="mb-value mono">{{ alertHistoryService.formatElapsedSeconds(item.elapsedSeconds) }}</span>
          </div>
        </div>
      </div>

      <!-- 3. Dữ liệu hiện tại của video -->
      <div class="metric-section is-current">
        <div class="section-title-tag title-current">
          <AppIcon name="zap" size="13" />
          <span>DỮ LIỆU HIỆN TẠI CỦA VIDEO (SNAPSHOT GẦN NHẤT)</span>
        </div>

        <div class="metrics-grid">
          <div class="metric-box">
            <span class="mb-label">VPH hiện tại</span>
            <span class="mb-value mono">{{ item.currentVph !== null ? fmtVph(item.currentVph) : 'Chưa có dữ liệu' }}</span>
          </div>

          <div class="metric-box">
            <span class="mb-label">Lượt xem hiện tại</span>
            <span class="mb-value mono">{{ item.currentViewCount !== null ? fmtNum(item.currentViewCount) : 'Chưa có dữ liệu' }}</span>
          </div>
        </div>
      </div>

      <!-- 4. Trạng thái phát chuyển (Delivery) -->
      <div class="metric-section is-delivery">
        <div class="section-title-tag title-delivery">
          <AppIcon name="send" size="13" />
          <span>TRẠNG THÁI PHÁT CHUYỂN DISCORD</span>
        </div>

        <div class="delivery-details-list">
          <div class="delivery-row">
            <span class="d-label">Trạng thái gửi</span>
            <div class="d-value">
              <AlertStatusBadge :status="item.status" :is-sending-stuck="item.isSendingStuck" />
            </div>
          </div>

          <div class="delivery-row">
            <span class="d-label">Số lần thử</span>
            <span class="d-value mono">{{ item.attempts }} lần</span>
          </div>

          <div class="delivery-row">
            <span class="d-label">Gửi thành công lúc</span>
            <span class="d-value mono">{{ item.sentAt ? formatFullDateTime(item.sentAt) : '—' }}</span>
          </div>

          <div class="delivery-row">
            <span class="d-label">Cập nhật lần cuối</span>
            <span class="d-value mono">{{ formatFullDateTime(item.updatedAt) }}</span>
          </div>

          <div v-if="item.discordMessageId" class="delivery-row">
            <span class="d-label">Discord Message ID</span>
            <span class="d-value mono text-code">{{ item.discordMessageId }}</span>
          </div>

          <!-- Sanitized Error (Full text) -->
          <div v-if="item.sanitizedLastError" class="delivery-error-box">
            <div class="deb-header">
              <AppIcon name="alert" size="14" />
              <span>Thông báo lỗi đã làm sạch:</span>
            </div>
            <pre class="deb-content mono">{{ item.sanitizedLastError }}</pre>
          </div>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import AppModal from '@/components/ui/AppModal.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import AlertStatusBadge from './AlertStatusBadge.vue';
import { alertHistoryService, isValidTimestamp } from '@/services/alert-history-service';
import type { AlertHistoryItem } from '@/types/alert-history';

defineProps<{
  item: AlertHistoryItem | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function onModalClose(val: boolean) {
  if (!val) emit('close');
}

function fmtVph(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return Math.round(v).toLocaleString('vi-VN') + ' VPH';
}

function fmtNum(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('vi-VN');
}

function formatFullDateTime(iso: string): string {
  if (!isValidTimestamp(iso)) return '—';
  const dt = new Date(iso);
  return dt.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
</script>

<style scoped>
.alert-detail-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.modal-video-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.header-thumb {
  width: 140px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.video-main-link {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  text-decoration: none;
}

.video-main-link:hover {
  color: #0284c7;
  text-decoration: underline;
}

.channel-detail-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ch-detail-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

.ch-detail-link:hover .ch-name {
  color: #0284c7;
}

.ch-avatar {
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

.ch-handle {
  font-size: 12px;
  color: #94a3b8;
}

.action-links-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.sub-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
}

.link-internal {
  color: #0284c7;
}

.link-internal:hover {
  text-decoration: underline;
}

.link-yt {
  color: #dc2626;
}

.link-yt:hover {
  text-decoration: underline;
}

.metric-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
}

.metric-section.is-current {
  background: #f0fdf4;
  border-color: rgba(34, 197, 94, 0.25);
}

.metric-section.is-delivery {
  background: #ffffff;
  border-color: #cbd5e1;
}

.section-title-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.04em;
}

.title-current {
  color: #16a34a;
}

.title-delivery {
  color: #0284c7;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.metric-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
}

.metric-section.is-current .metric-box {
  border-color: rgba(34, 197, 94, 0.2);
}

.mb-label {
  font-size: 11px;
  color: #64748b;
}

.mb-value {
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
}

.font-bold {
  font-weight: 700;
}

.text-accent {
  color: #0284c7;
}

.text-green {
  color: #16a34a;
}

.text-muted {
  color: #64748b;
}

.delivery-details-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.delivery-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed #f1f5f9;
}

.d-label {
  font-size: 12.5px;
  color: #64748b;
}

.d-value {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  text-align: right;
}

.text-code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.delivery-error-box {
  margin-top: 6px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 10px 12px;
}

.deb-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 700;
  color: #dc2626;
  text-transform: uppercase;
}

.deb-content {
  margin: 6px 0 0;
  font-size: 11.5px;
  color: #991b1b;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 640px) {
  .modal-video-header {
    flex-direction: column;
  }
  .header-thumb {
    width: 100%;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
