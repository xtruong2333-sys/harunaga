<template>
  <article class="recent-video-grid-card surface-card" :class="{ 'is-rising': isRising }">
    <!-- Thumbnail -->
    <div class="card-thumbnail-wrap">
      <VideoThumbnail
        :src="video.thumbnailUrl"
        :alt="video.title"
        ratio="16-9"
        :detail-url="'/videos/' + video.id"
        :youtube-video-id="video.youtubeVideoId"
        :fresh-badge="freshBadge"
        :vph-badge="video.latestMeasuredVph"
      />
    </div>

    <!-- Body -->
    <div class="card-body">
      <!-- Channel info -->
      <div class="channel-line">
        <router-link :to="'/kenh-theo-doi/' + video.channelId" class="channel-name" :title="video.channelName">
          {{ video.channelName }}
        </router-link>
        <span class="meta-dot">•</span>
        <span class="publish-time">{{ formatVideoAge(video.publishedAt) }}</span>
      </div>

      <!-- Title -->
      <h3 class="video-title">
        <router-link :to="'/videos/' + video.id" class="title-link" :title="video.title">
          {{ video.title }}
        </router-link>
      </h3>

      <!-- Compact Metrics -->
      <div class="metrics-row">
        <div class="metric-pill vph-pill" :title="'Số lượt xem tăng trung bình mỗi giờ giữa hai lần hệ thống đo gần nhất.'">
          <span class="vph-val mono text-accent">{{ formattedVph }}</span>
        </div>
        <div class="metric-pill views-pill">
          <span class="views-val mono">{{ formattedViews }} views</span>
        </div>
        <div v-if="hasPositiveDelta" class="metric-pill delta-pill">
          <span class="delta-val mono text-positive">{{ formattedDelta }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import { formatVideoAge, getFreshBadge, formatViewDelta } from '@/services/new-videos-service';
import type { NewVideoItem } from '@/types/new-videos';

const props = defineProps<{
  video: NewVideoItem;
}>();

const isRising = computed(() => {
  return props.video.latestMeasuredVph !== null && props.video.latestMeasuredVph > 0;
});

const freshBadge = computed(() => {
  return getFreshBadge(props.video.publishedAt);
});

const formattedVph = computed(() => {
  if (props.video.latestMeasuredVph !== null && props.video.latestMeasuredVph !== undefined) {
    if (props.video.latestMeasuredVph === 0) return '0 VPH';
    return `${formatNumber(Math.round(props.video.latestMeasuredVph))} VPH`;
  }
  return '—';
});

const formattedViews = computed(() => {
  if (props.video.latestViewCount !== null && props.video.latestViewCount !== undefined) {
    return formatNumber(props.video.latestViewCount);
  }
  return '—';
});

const hasPositiveDelta = computed(() => {
  return props.video.latestViewDelta !== null && props.video.latestViewDelta > 0;
});

const formattedDelta = computed(() => {
  return formatViewDelta(props.video.latestViewDelta);
});

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString('vi-VN');
}
</script>

<style scoped>
.recent-video-grid-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(30, 60, 90, 0.04));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.recent-video-grid-card:hover {
  transform: translateY(-2px);
  border-color: #BFDBFE;
  box-shadow: var(--shadow-md, 0 8px 20px rgba(37, 99, 235, 0.08));
}

[data-theme="dark"] .recent-video-grid-card:hover {
  border-color: rgba(56, 189, 248, 0.3);
}

.card-thumbnail-wrap {
  width: 100%;
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  gap: 8px;
  flex: 1;
}

.channel-line {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.channel-name {
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-name:hover {
  color: var(--primary, #2563EB);
}

.meta-dot {
  color: var(--text-muted);
}

.publish-time {
  color: var(--text-muted);
}

.video-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 38px;
}

.title-link {
  color: var(--text-primary);
  text-decoration: none;
}

.title-link:hover {
  color: var(--primary, #2563EB);
}

.metrics-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 4px;
}

.metric-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  background: var(--bg-inset, #F1F5F9);
}

.vph-pill {
  background: #EFF6FF;
}

[data-theme="dark"] .vph-pill {
  background: rgba(37, 99, 235, 0.15);
}

.text-accent {
  color: #0284C7;
}

.text-positive {
  color: #16A34A;
}

[data-theme="dark"] .text-accent {
  color: #38BDF8;
}

[data-theme="dark"] .text-positive {
  color: #4ADE80;
}
</style>
