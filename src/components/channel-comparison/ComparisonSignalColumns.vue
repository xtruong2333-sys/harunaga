<template>
  <div class="comparison-signal-columns card">
    <div class="signals-header">
      <div class="title-wrap">
        <h3 class="signals-title">TÍN HIỆU VIDEO NỔI BẬT THEO VPH</h3>
        <p class="signals-sub">Top 3–5 video có tốc độ tăng trưởng VPH cao nhất đo được của mỗi kênh trong khoảng thời gian đã chọn.</p>
      </div>
    </div>

    <div class="channels-columns-grid" :style="{ gridTemplateColumns: `repeat(${channels.length}, 1fr)` }">
      <div
        v-for="ch in channels"
        :key="ch.id"
        class="channel-signal-col"
        :style="{ '--col-color': ch.color }"
      >
        <!-- Column Channel Header -->
        <div class="col-channel-header">
          <span class="col-accent-dot" :style="{ backgroundColor: ch.color }"></span>
          <div class="col-title-wrap">
            <h4 class="col-ch-name" :title="ch.name">{{ ch.name }}</h4>
            <span class="col-ch-count">{{ ch.topVideos.length }} video đo được</span>
          </div>
        </div>

        <!-- Video Cards List -->
        <div v-if="ch.topVideos.length > 0" class="videos-stack">
          <div
            v-for="v in ch.topVideos"
            :key="v.id"
            class="compare-video-card"
          >
            <!-- Thumbnail using VideoThumbnail.vue -->
            <div class="card-thumb-wrap">
              <VideoThumbnail
                :src="v.thumbnailUrl"
                :alt="v.title"
                :youtube-video-id="v.youtubeVideoId"
                :detail-url="`/chi-tiet-video/${v.id}`"
                ratio="16-9"
              />
            </div>

            <!-- Video Metadata -->
            <div class="card-meta">
              <router-link
                :to="`/chi-tiet-video/${v.id}`"
                class="video-title"
                :title="v.title"
              >
                {{ v.title }}
              </router-link>

              <div class="video-metrics-bar">
                <div class="metric-pill vph-pill" :class="{ 'is-rising': v.latestMeasuredVph !== null && v.latestMeasuredVph > 0 }">
                  <span class="m-label">VPH:</span>
                  <span class="m-val mono">{{ formatVph(v.latestMeasuredVph) }}</span>
                </div>

                <div class="metric-pill">
                  <span class="m-label">Views:</span>
                  <span class="m-val mono">{{ v.latestViewCount !== null ? v.latestViewCount.toLocaleString('vi-VN') : '—' }}</span>
                </div>

                <div class="metric-pill" v-if="v.latestViewDelta !== null">
                  <span class="m-label">Delta:</span>
                  <span class="m-val mono">{{ formatDelta(v.latestViewDelta) }}</span>
                </div>
              </div>

              <div class="video-footer">
                <span class="published-time">{{ v.relativePublishedAt }}</span>
                <span
                  v-if="v.alertStatus && v.alertStatus !== 'no_alert'"
                  class="alert-badge"
                  :class="`alert-${v.alertStatus}`"
                >
                  {{ v.alertStatusLabel }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty Videos in Channel -->
        <div v-else class="col-empty">
          <p>Chưa có video đang tăng trong khoảng thời gian này.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import type { ChannelComparisonItem } from '@/types/channel-comparison';
import { formatDelta } from '@/services/channel-comparison-service';

defineProps<{
  channels: ChannelComparisonItem[];
}>();

function formatVph(vph: number | null): string {
  if (vph === null || vph === undefined) return '—';
  return vph.toLocaleString('vi-VN');
}
</script>

<style scoped>
.comparison-signal-columns {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.signals-header {
  margin-bottom: 20px;
}

.signals-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.signals-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.channels-columns-grid {
  display: grid;
  gap: 16px;
  align-items: start;
}

.channel-signal-col {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.col-channel-header {
  padding: 12px 14px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.col-accent-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.col-title-wrap {
  flex: 1;
  min-width: 0;
}

.col-ch-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-ch-count {
  font-size: 0.72rem;
  color: #64748b;
}

.videos-stack {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compare-video-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.15s ease;
}

.compare-video-card:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
}

.card-thumb-wrap {
  width: 100%;
}

.card-meta {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-title:hover {
  color: #2563eb;
}

.video-metrics-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.metric-pill {
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.vph-pill.is-rising {
  background: #ecfdf5;
  color: #059669;
  font-weight: 700;
}

.m-label {
  color: #64748b;
}

.m-val {
  font-weight: 700;
}

.video-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #64748b;
  border-top: 1px solid #f8fafc;
  padding-top: 6px;
}

.alert-badge {
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.68rem;
}

.alert-sent {
  background: #ecfdf5;
  color: #059669;
}

.alert-pending,
.alert-sending {
  background: #fffbeb;
  color: #d97706;
}

.alert-failed {
  background: #fef2f2;
  color: #dc2626;
}

.col-empty {
  padding: 32px 14px;
  text-align: center;
  color: #64748b;
  font-size: 0.82rem;
}

@media (max-width: 1024px) {
  .channels-columns-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 640px) {
  .channels-columns-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>