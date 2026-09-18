<template>
  <article class="recent-video-list-row surface-card" :class="{ 'is-rising': isRising }">
    <!-- Left: 220px-240px 16:9 Thumbnail -->
    <div class="row-thumbnail-wrap">
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

    <!-- Center: Title & Channel info -->
    <div class="row-content">
      <div class="row-channel-meta">
        <router-link :to="'/kenh-theo-doi/' + video.channelId" class="channel-avatar-link">
          <img
            v-if="video.channelAvatarUrl && !avatarError"
            :src="video.channelAvatarUrl"
            :alt="video.channelName"
            class="channel-avatar"
            loading="lazy"
            @error="avatarError = true"
          />
          <div v-else class="avatar-fallback">
            {{ (video.channelName || 'C').charAt(0).toUpperCase() }}
          </div>
        </router-link>

        <router-link
          :to="'/kenh-theo-doi/' + video.channelId"
          class="channel-name"
          :title="video.channelName"
        >
          {{ video.channelName }}
        </router-link>

        <span class="meta-dot">•</span>
        <span class="publish-time">{{ formatVideoAge(video.publishedAt) }}</span>
      </div>

      <h2 class="video-title">
        <router-link :to="'/videos/' + video.id" class="title-link" :title="video.title">
          {{ video.title }}
        </router-link>
      </h2>
    </div>

    <!-- Right: Metrics Cluster & Actions -->
    <div class="row-metrics-actions">
      <div class="metrics-column">
        <!-- VPH -->
        <div class="metric-row-item" :title="'Số lượt xem tăng trung bình mỗi giờ giữa hai lần hệ thống đo gần nhất.'">
          <span class="metric-tag-label">VPH:</span>
          <span class="metric-tag-val mono text-accent">{{ formattedVph }}</span>
        </div>

        <!-- Views -->
        <div class="metric-row-item">
          <span class="metric-tag-label">Views:</span>
          <span class="metric-tag-val mono">{{ formattedViews }}</span>
        </div>

        <!-- Delta -->
        <div class="metric-row-item">
          <span class="metric-tag-label">Tăng:</span>
          <span class="metric-tag-val mono" :class="{ 'text-positive': hasPositiveDelta }">{{ formattedDelta }}</span>
        </div>
      </div>

      <div class="action-buttons">
        <router-link :to="'/videos/' + video.id" class="btn-icon-link" title="Xem chi tiết video">
          <AppIcon name="info" size="14" />
          <span>Chi tiết</span>
        </router-link>

        <a
          :href="`https://www.youtube.com/watch?v=${video.youtubeVideoId}`"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-icon-link btn-yt-link"
          title="Mở video trên YouTube"
        >
          <AppIcon name="external" size="14" />
          <span>YouTube</span>
        </a>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import { formatVideoAge, getFreshBadge, formatViewDelta } from '@/services/new-videos-service';
import type { NewVideoItem } from '@/types/new-videos';

const props = defineProps<{
  video: NewVideoItem;
}>();

const avatarError = ref(false);

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
.recent-video-list-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(30, 60, 90, 0.04));
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.recent-video-list-row:hover {
  transform: translateY(-1px);
  border-color: #BFDBFE;
  box-shadow: var(--shadow-md, 0 6px 18px rgba(37, 99, 235, 0.06));
}

[data-theme="dark"] .recent-video-list-row:hover {
  border-color: rgba(56, 189, 248, 0.3);
}

.row-thumbnail-wrap {
  width: 220px;
  flex-shrink: 0;
}

.row-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.row-channel-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
}

.channel-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #EFF6FF;
  color: #2563EB;
  font-size: 10px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.channel-name {
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
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
  font-size: 14.5px;
  font-weight: 650;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-link {
  color: var(--text-primary);
  text-decoration: none;
}

.title-link:hover {
  color: var(--primary, #2563EB);
}

.row-metrics-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.metrics-column {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 130px;
}

.metric-row-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.metric-tag-label {
  color: var(--text-muted);
  font-weight: 500;
}

.metric-tag-val {
  font-weight: 700;
  color: var(--text-primary);
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

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-primary);
  border: 1px solid var(--border, #E3EBF3);
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-icon-link:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-yt-link:hover {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}

@media (max-width: 768px) {
  .recent-video-list-row {
    flex-direction: column;
    align-items: stretch;
  }
  .row-thumbnail-wrap {
    width: 100%;
  }
  .row-metrics-actions {
    justify-content: space-between;
  }
}
</style>
