<template>
  <article class="recent-video-large-card surface-card" :class="{ 'is-rising': isRising }">
    <!-- Top: Large 16:9 Thumbnail -->
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

    <!-- Body: Channel identity, Title, Metrics, Actions -->
    <div class="card-body">
      <!-- Channel Meta Row -->
      <div class="channel-identity-row">
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

        <div class="channel-text-meta">
          <router-link
            :to="'/kenh-theo-doi/' + video.channelId"
            class="channel-name"
            :title="video.channelName"
          >
            {{ video.channelName }}
          </router-link>
          <span class="meta-dot">•</span>
          <span class="publish-time" :title="video.publishedAt">
            {{ formatVideoAge(video.publishedAt) }}
          </span>
        </div>
      </div>

      <!-- Video Title (2 lines max) -->
      <h2 class="video-title">
        <router-link :to="'/videos/' + video.id" class="title-link" :title="video.title">
          {{ video.title }}
        </router-link>
      </h2>

      <!-- Metrics Cluster -->
      <div class="metrics-cluster-box">
        <!-- VPH Metric -->
        <div class="metric-cell vph-cell" :title="'Số lượt xem tăng trung bình mỗi giờ giữa hai lần hệ thống đo gần nhất.'">
          <div class="cell-val mono text-accent">
            {{ formattedVph }}
          </div>
          <div class="cell-lbl">TỐC ĐỘ VPH</div>
        </div>

        <div class="cell-sep"></div>

        <!-- Views Metric -->
        <div class="metric-cell" :title="video.latestViewCount !== null ? `${video.latestViewCount.toLocaleString('vi-VN')} lượt xem` : 'Chưa có'">
          <div class="cell-val mono">
            {{ formattedViews }}
          </div>
          <div class="cell-lbl">LƯỢT XEM</div>
        </div>

        <div class="cell-sep"></div>

        <!-- Delta Views -->
        <div class="metric-cell" :title="video.latestViewDelta !== null ? `Tăng ${video.latestViewDelta.toLocaleString('vi-VN')} lượt xem` : 'Chưa có'">
          <div class="cell-val mono" :class="{ 'text-positive': hasPositiveDelta }">
            {{ formattedDelta }}
          </div>
          <div class="cell-lbl">TĂNG GẦN NHẤT</div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="card-footer-actions">
        <router-link :to="'/videos/' + video.id" class="btn-action btn-detail">
          <AppIcon name="info" size="14" />
          <span>Chi Tiết</span>
        </router-link>

        <a
          :href="`https://www.youtube.com/watch?v=${video.youtubeVideoId}`"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-action btn-yt"
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
.recent-video-large-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 4px 14px rgba(30, 60, 90, 0.05));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.recent-video-large-card:hover {
  transform: translateY(-2px);
  border-color: #BFDBFE;
  box-shadow: var(--shadow-md, 0 10px 25px rgba(37, 99, 235, 0.08));
}

[data-theme="dark"] .recent-video-large-card:hover {
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
}

.card-thumbnail-wrap {
  width: 100%;
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  flex: 1;
}

/* Channel Identity Row */
.channel-identity-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.channel-avatar-link {
  flex-shrink: 0;
  display: block;
}

.channel-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border, #E3EBF3);
}

.avatar-fallback {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #EFF6FF;
  color: #2563EB;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
  border: 1px solid #BFDBFE;
}

[data-theme="dark"] .avatar-fallback {
  background: rgba(37, 99, 235, 0.2);
  color: #60A5FA;
  border-color: rgba(37, 99, 235, 0.4);
}

.channel-text-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
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
  font-size: 12px;
}

/* Video Title */
.video-title {
  font-size: 15.5px;
  font-weight: 650;
  line-height: 1.45;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 44px;
}

.title-link {
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.title-link:hover {
  color: var(--primary, #2563EB);
}

[data-theme="dark"] .title-link:hover {
  color: #38BDF8;
}

/* Metrics Cluster Box */
.metrics-cluster-box {
  display: grid;
  grid-template-columns: 1.2fr auto 1fr auto 1fr;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
}

.metric-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cell-val {
  font-size: 14.5px;
  font-weight: 750;
  color: var(--text-primary);
}

.cell-lbl {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.cell-sep {
  width: 1px;
  height: 24px;
  background: var(--border, #E3EBF3);
  margin: 0 8px;
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

/* Action Footer */
.card-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-detail {
  flex: 1;
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border: 1px solid #BFDBFE;
}

.btn-detail:hover {
  background: #2563EB;
  color: #FFFFFF;
}

[data-theme="dark"] .btn-detail {
  background: rgba(37, 99, 235, 0.15);
  color: #60A5FA;
  border-color: rgba(37, 99, 235, 0.35);
}

[data-theme="dark"] .btn-detail:hover {
  background: #2563EB;
  color: #FFFFFF;
}

.btn-yt {
  background: var(--surface, #FFFFFF);
  color: var(--text-secondary);
  border: 1px solid var(--border, #E3EBF3);
}

.btn-yt:hover {
  color: #DC2626;
  border-color: rgba(220, 38, 38, 0.3);
  background: #FEF2F2;
}

[data-theme="dark"] .btn-yt:hover {
  background: rgba(220, 38, 38, 0.15);
}

@media (prefers-reduced-motion: reduce) {
  .recent-video-large-card {
    transition: none !important;
  }
  .recent-video-large-card:hover {
    transform: none !important;
  }
}
</style>
