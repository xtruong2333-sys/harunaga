<template>
  <div class="alert-video-groups-view">
    <div v-if="groups.length === 0" class="empty-groups">
      <AppIcon name="video" size="24" />
      <span>Không có dữ liệu video nào phù hợp với bộ lọc.</span>
    </div>

    <div class="video-cards-grid">
      <div
        v-for="group in groups"
        :key="group.videoId"
        class="video-alert-card"
        tabindex="0"
        role="button"
        :aria-label="`Xem cảnh báo của video ${group.videoTitle}`"
        @click="$emit('filter-by-video', group.videoId)"
      >
        <!-- Thumbnail -->
        <div class="group-thumb-wrap" @click.stop>
          <VideoThumbnail
            :src="group.videoThumbnailUrl"
            :alt="group.videoTitle"
            :youtube-video-id="group.videoYoutubeId || undefined"
            :detail-url="`/videos/${group.videoId}`"
            ratio="16-9"
          />
        </div>

        <!-- Details -->
        <div class="group-card-body">
          <div class="body-top">
            <AlertStatusBadge :status="group.latestStatus" />
            <span class="count-badge mono">Cảnh báo ghi nhận</span>
          </div>

          <router-link
            :to="`/videos/${group.videoId}`"
            class="group-video-title"
            :title="group.videoTitle"
            @click.stop
          >
            {{ group.videoTitle }}
          </router-link>

          <div class="group-channel-line" @click.stop>
            <router-link
              v-if="group.channelId"
              :to="`/kenh-theo-doi/${group.channelId}`"
              class="ch-link"
            >
              {{ group.channelName }}
            </router-link>
            <span v-else>{{ group.channelName }}</span>
            <span v-if="group.channelHandle" class="ch-handle mono">{{ group.channelHandle }}</span>
          </div>

          <div class="group-metrics-row">
            <div class="gm-item">
              <span class="gm-lbl">VPH đo được</span>
              <span class="gm-val mono">{{ fmtVph(group.maxMeasuredVph) }}</span>
            </div>
            <div class="gm-item">
              <span class="gm-lbl">Thời điểm cảnh báo</span>
              <span class="gm-val mono">{{ formatDateTime(group.latestAlertAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import AlertStatusBadge from './AlertStatusBadge.vue';
import { isValidTimestamp } from '@/services/alert-history-service';
import type { AlertVideoGroup } from '@/types/alert-history';

defineProps<{
  groups: AlertVideoGroup[];
}>();

defineEmits<{
  (e: 'filter-by-video', videoId: string): void;
}>();

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
.alert-video-groups-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-groups {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
  font-size: 14px;
}

.video-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.video-alert-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  outline: none;
}

.video-alert-card:hover,
.video-alert-card:focus-visible {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.group-thumb-wrap {
  width: 100%;
}

.group-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  flex: 1;
}

.body-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.count-badge {
  font-size: 11px;
  color: #0284c7;
  background: #f0f9ff;
  border: 1px solid rgba(2, 132, 199, 0.2);
  padding: 2px 7px;
  border-radius: 9999px;
}

.group-video-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.35;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.group-video-title:hover {
  color: #0284c7;
  text-decoration: underline;
}

.group-channel-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.ch-link {
  text-decoration: none;
  color: #475569;
  font-weight: 500;
}

.ch-link:hover {
  color: #0284c7;
}

.ch-handle {
  font-size: 11px;
  color: #94a3b8;
}

.group-metrics-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  margin-top: auto;
  border-top: 1px dashed #f1f5f9;
}

.gm-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gm-lbl {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
}

.gm-val {
  font-size: 12.5px;
  font-weight: 600;
  color: #0f172a;
}

@media (max-width: 1024px) {
  .video-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .video-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
