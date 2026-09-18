<template>
  <div class="alert-failed-view">
    <div v-if="failedItems.length === 0" class="empty-failed">
      <div class="empty-icon-wrap">
        <AppIcon name="check-circle" size="32" />
      </div>
      <div class="empty-title">Không có cảnh báo gửi lỗi nào</div>
      <p class="empty-desc">
        Tất cả các cảnh báo trong phạm vi đang chọn đều đã được chuyển giao thành công hoặc đang chờ xử lý bình thường.
      </p>
    </div>

    <div v-else class="failed-cards-stack">
      <div
        v-for="item in failedItems"
        :key="item.id"
        class="failed-card"
        tabindex="0"
        role="button"
        :aria-label="`Chi tiết sự cố cảnh báo ${item.videoTitle}`"
        @click="$emit('select-item', item)"
        @keydown.enter="$emit('select-item', item)"
      >
        <div class="failed-card-header">
          <div class="header-left">
            <AlertStatusBadge status="failed" />
            <span class="attempts-tag mono">Đã thử {{ item.attempts }} lần</span>
          </div>
          <span class="failed-time mono">{{ formatDateTime(item.createdAt) }}</span>
        </div>

        <div class="failed-card-body">
          <div class="thumb-col" @click.stop>
            <VideoThumbnail
              :src="item.videoThumbnailUrl"
              :alt="item.videoTitle"
              :youtube-video-id="item.videoYoutubeId || undefined"
              :detail-url="`/videos/${item.videoId}`"
              ratio="16-9"
            />
          </div>

          <div class="info-col">
            <router-link
              :to="`/videos/${item.videoId}`"
              class="failed-video-title"
              :title="item.videoTitle"
              @click.stop
            >
              {{ item.videoTitle }}
            </router-link>
            <div class="failed-channel-line" @click.stop>
              <router-link
                v-if="item.channelId"
                :to="`/kenh-theo-doi/${item.channelId}`"
                class="f-ch-link"
              >
                {{ item.channelName }}
              </router-link>
              <span v-else>{{ item.channelName }}</span>
              <span v-if="item.channelHandle" class="mono text-muted">({{ item.channelHandle }})</span>
            </div>

            <!-- Sanitized Error Box (Clamped) -->
            <div v-if="item.sanitizedLastError" class="error-box">
              <span class="error-label">Lỗi ghi nhận:</span>
              <p class="error-text mono">{{ item.sanitizedLastError }}</p>
            </div>
          </div>
        </div>

        <div class="failed-card-footer">
          <div class="stat-cell">
            <span class="sc-lbl">VPH đo được</span>
            <span class="sc-val mono">{{ fmtVph(item.measuredVph) }}</span>
          </div>
          <div class="stat-cell">
            <span class="sc-lbl">Ngưỡng kênh</span>
            <span class="sc-val mono">{{ fmtVph(item.thresholdVph) }}</span>
          </div>
          <div class="stat-cell">
            <span class="sc-lbl">Cập nhật gần nhất</span>
            <span class="sc-val mono">{{ formatDateTime(item.updatedAt) }}</span>
          </div>
          <button type="button" class="btn-inspect" @click.stop="$emit('select-item', item)">
            <span>Xem chi tiết sự cố</span>
            <AppIcon name="chevron-right" size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import AlertStatusBadge from './AlertStatusBadge.vue';
import { isValidTimestamp } from '@/services/alert-history-service';
import type { AlertHistoryItem } from '@/types/alert-history';

const props = defineProps<{
  items: AlertHistoryItem[];
}>();

defineEmits<{
  (e: 'select-item', item: AlertHistoryItem): void;
}>();

const failedItems = computed(() => props.items.filter(i => i.status === 'failed'));

function fmtVph(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return Math.round(v).toLocaleString('vi-VN') + ' VPH';
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
.alert-failed-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-failed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 24px;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  gap: 12px;
}

.empty-icon-wrap {
  color: #16a34a;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.empty-desc {
  font-size: 13px;
  color: #64748b;
  max-width: 440px;
  margin: 0;
}

.failed-cards-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.failed-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  padding: 16px;
  gap: 14px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(239, 68, 68, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  outline: none;
}

.failed-card:hover,
.failed-card:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.08);
}

.failed-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.attempts-tag {
  font-size: 11px;
  font-weight: 600;
  color: #dc2626;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 2px 7px;
  border-radius: 9999px;
}

.failed-time {
  font-size: 12px;
  color: #64748b;
}

.failed-card-body {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.thumb-col {
  width: 110px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
}

.info-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.failed-video-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
  line-height: 1.35;
}

.failed-video-title:hover {
  color: #0284c7;
  text-decoration: underline;
}

.failed-channel-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.f-ch-link {
  color: #475569;
  text-decoration: none;
  font-weight: 500;
}

.f-ch-link:hover {
  color: #0284c7;
}

.error-box {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 2px;
}

.error-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #dc2626;
  text-transform: uppercase;
}

.error-text {
  font-size: 12px;
  color: #b91c1c;
  margin: 3px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.failed-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.stat-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sc-lbl {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
}

.sc-val {
  font-size: 12.5px;
  font-weight: 600;
  color: #0f172a;
}

.btn-inspect {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  margin-left: auto;
}

.btn-inspect:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

@media (max-width: 640px) {
  .failed-card-body {
    flex-direction: column;
  }
  .thumb-col {
    width: 100%;
  }
  .failed-card-footer {
    flex-wrap: wrap;
  }
}
</style>
