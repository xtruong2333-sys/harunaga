<template>
  <div class="alert-timeline-view">
    <div v-if="groupedDays.length === 0" class="empty-timeline">
      <AppIcon name="inbox" size="24" />
      <span>Không có cảnh báo nào trong khoảng thời gian này.</span>
    </div>

    <div v-for="group in groupedDays" :key="group.dateKey" class="timeline-day-section">
      <div class="timeline-date-header">
        <span class="date-label-badge">{{ group.dateLabel }}</span>
        <span class="date-count mono">{{ group.items.length }} cảnh báo</span>
        <div class="date-line"></div>
      </div>

      <div class="timeline-items-stack">
        <div
          v-for="item in group.items"
          :key="item.id"
          class="timeline-card"
          tabindex="0"
          role="button"
          :aria-label="`Chi tiết cảnh báo video ${item.videoTitle}`"
          @click="$emit('select-item', item)"
          @keydown.enter="$emit('select-item', item)"
        >
          <!-- Left Time Pillar -->
          <div class="card-time-pillar">
            <span class="card-time mono">{{ formatTime(item.createdAt) }}</span>
            <AlertStatusBadge :status="item.status" :is-sending-stuck="item.isSendingStuck" />
          </div>

          <!-- Thumbnail -->
          <div class="card-thumb-wrap" @click.stop>
            <VideoThumbnail
              :src="item.videoThumbnailUrl"
              :alt="item.videoTitle"
              :youtube-video-id="item.videoYoutubeId || undefined"
              :detail-url="`/videos/${item.videoId}`"
              ratio="16-9"
            />
          </div>

          <!-- Video & Channel Info -->
          <div class="card-main-info">
            <div class="card-title-row">
              <router-link
                :to="`/videos/${item.videoId}`"
                class="video-link-title"
                :title="item.videoTitle"
                @click.stop
              >
                {{ item.videoTitle }}
              </router-link>
            </div>

            <div class="channel-line" @click.stop>
              <router-link
                v-if="item.channelId"
                :to="`/kenh-theo-doi/${item.channelId}`"
                class="channel-link"
              >
                <span class="avatar-fallback" v-if="!item.channelAvatarUrl">
                  {{ item.channelName.charAt(0).toUpperCase() }}
                </span>
                <img
                  v-else
                  :src="item.channelAvatarUrl"
                  :alt="item.channelName"
                  class="channel-avatar"
                  loading="lazy"
                />
                <span class="channel-name">{{ item.channelName }}</span>
              </router-link>
              <span v-else class="channel-name">{{ item.channelName }}</span>
              <span v-if="item.channelHandle" class="channel-handle mono">{{ item.channelHandle }}</span>
            </div>
          </div>

          <!-- Metric Stats Strip -->
          <div class="card-metrics-strip">
            <div class="metric-item">
              <span class="m-lbl">VPH cảnh báo</span>
              <span class="m-val mono">{{ fmtVph(item.measuredVph) }}</span>
            </div>
            <div class="metric-item">
              <span class="m-lbl">Ngưỡng kênh</span>
              <span class="m-val mono">{{ fmtVph(item.thresholdVph) }}</span>
            </div>
            <div class="metric-item">
              <span class="m-lbl">Vượt ngưỡng</span>
              <span
                class="m-val mono"
                :class="{
                  'is-excess-pos': (item.thresholdExcessRatio ?? 0) > 0,
                  'is-excess-zero': item.thresholdExcessRatio === 0
                }"
              >
                {{ alertHistoryService.formatThresholdExcess(item.thresholdExcessRatio) }}
              </span>
            </div>
            <div class="metric-item attempts-item">
              <span class="m-lbl">Lần thử</span>
              <span class="m-val mono">{{ item.attempts }}</span>
            </div>
          </div>
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
import { alertHistoryService, isValidTimestamp } from '@/services/alert-history-service';
import type { AlertHistoryItem } from '@/types/alert-history';

const props = defineProps<{
  items: AlertHistoryItem[];
}>();

defineEmits<{
  (e: 'select-item', item: AlertHistoryItem): void;
}>();

interface DayGroup {
  dateKey: string;
  dateLabel: string;
  items: AlertHistoryItem[];
}

const groupedDays = computed<DayGroup[]>(() => {
  const groups = new Map<string, AlertHistoryItem[]>();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const yestStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  for (const item of props.items) {
    let dateKey = 'unknown';
    if (isValidTimestamp(item.createdAt)) {
      const dt = new Date(item.createdAt);
      dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    }

    let list = groups.get(dateKey);
    if (!list) {
      list = [];
      groups.set(dateKey, list);
    }
    list.push(item);
  }

  const result: DayGroup[] = [];
  for (const [dateKey, dayItems] of groups.entries()) {
    let dateLabel = dateKey;
    if (dateKey === todayStr) {
      dateLabel = 'HÔM NAY';
    } else if (dateKey === yestStr) {
      dateLabel = 'HÔM QUA';
    } else if (dateKey !== 'unknown') {
      const [y, m, d] = dateKey.split('-');
      dateLabel = `${d}/${m}/${y}`;
    } else {
      dateLabel = 'KHÁC';
    }

    result.push({
      dateKey,
      dateLabel,
      items: dayItems,
    });
  }

  return result;
});

function formatTime(iso: string): string {
  if (!isValidTimestamp(iso)) return '—';
  const dt = new Date(iso);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function fmtVph(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return Math.round(v).toLocaleString('vi-VN') + ' VPH';
}
</script>

<style scoped>
.alert-timeline-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.empty-timeline {
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

.timeline-day-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-date-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-label-badge {
  font-size: 12px;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  border: 1px solid rgba(2, 132, 199, 0.2);
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.04em;
}

.date-count {
  font-size: 12px;
  color: #64748b;
}

.date-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.timeline-items-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  outline: none;
}

.timeline-card:hover,
.timeline-card:focus-visible {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
}

.card-time-pillar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 100px;
  flex-shrink: 0;
}

.card-time {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.card-thumb-wrap {
  width: 110px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
}

.card-main-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.video-link-title {
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

.video-link-title:hover {
  color: #0284c7;
  text-decoration: underline;
}

.channel-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.channel-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
}

.channel-link:hover .channel-name {
  color: #0284c7;
}

.channel-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-handle {
  font-size: 11px;
  color: #94a3b8;
}

.card-metrics-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: right;
  min-width: 80px;
}

.m-lbl {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.m-val {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.is-excess-pos {
  color: #16a34a;
}

.is-excess-zero {
  color: #64748b;
}

@media (max-width: 1024px) {
  .timeline-card {
    flex-wrap: wrap;
    gap: 12px;
  }
  .card-metrics-strip {
    width: 100%;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px dashed #f1f5f9;
  }
  .metric-item {
    text-align: left;
    min-width: unset;
  }
}

@media (max-width: 640px) {
  .card-thumb-wrap {
    width: 80px;
  }
}
</style>
