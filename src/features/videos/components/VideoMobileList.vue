<template>
  <div class="mobile-video-list">
    <div v-for="video in videos" :key="video.id" class="mobile-card">
      <!-- Card Top: Thumbnail + Title -->
      <div class="card-video-header">
        <router-link
          :to="'/videos/' + video.id"
          class="thumb-wrap"
          title="Xem chi tiết video"
        >
          <img
            v-if="video.thumbnailUrl"
            :src="video.thumbnailUrl"
            :alt="video.title"
            class="video-thumb"
            loading="lazy"
            @error="handleThumbError"
          />
          <div v-else class="thumb-fallback">
            <AppIcon name="video" size="24" />
          </div>
        </router-link>

        <div class="video-meta">
          <router-link
            :to="'/videos/' + video.id"
            class="video-title"
          >
            {{ video.title }}
          </router-link>

          <!-- Channel Info Row -->
          <div class="channel-row">
            <div class="avatar-wrap">
              <img
                v-if="video.channel.avatarUrl"
                :src="video.channel.avatarUrl"
                :alt="video.channel.name"
                class="channel-avatar"
                loading="lazy"
                @error="handleAvatarError"
              />
              <div v-else class="avatar-fallback">
                {{ video.channel.name.charAt(0).toUpperCase() }}
              </div>
            </div>
            <span class="channel-name">{{ video.channel.name }}</span>
          </div>

          <div class="video-sub-row">
            <span class="video-id">{{ video.youtubeVideoId }}</span>
            <span class="dot-separator">•</span>
            <span class="published-text">{{ videoService.formatRelativeTime(video.publishedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Card Metrics Grid -->
      <div class="card-metrics">
        <!-- Lượt xem -->
        <div class="metric-item">
          <div class="metric-label">LƯỢT XEM</div>
          <div class="metric-val mono">{{ videoService.formatViews(video.latestViewCount) }}</div>
        </div>

        <!-- VPH đo được -->
        <div class="metric-item">
          <div class="metric-label">VPH ĐO ĐƯỢC</div>
          <div
            class="metric-val"
            :class="{
              'vph-rising': video.latestMeasuredVph !== null && video.latestMeasuredVph > 0,
              'vph-muted': video.latestMeasuredVph === null || video.latestMeasuredVph === 0,
            }"
          >
            {{ videoService.formatVph(video.latestMeasuredVph) }}
          </div>
          <span v-if="video.isOverThreshold" class="badge-threshold">
            Vượt ngưỡng
          </span>
        </div>

        <!-- Tăng từ lần trước -->
        <div class="metric-item">
          <div class="metric-label">TĂNG LẦN TRƯỚC</div>
          <div
            class="metric-val"
            :class="{
              'delta-positive': video.latestDeltaViews !== null && video.latestDeltaViews > 0,
              'delta-neutral': video.latestDeltaViews === null || video.latestDeltaViews <= 0,
            }"
          >
            {{ videoService.formatViewDelta(video.latestDeltaViews) }}
          </div>
        </div>

        <!-- Cảnh báo -->
        <div class="metric-item">
          <div class="metric-label">CẢNH BÁO</div>
          <div class="metric-val">
            <span class="badge-alert" :class="`alert-${videoService.getAlertBadge(video.alert).tone}`">
              {{ videoService.getAlertBadge(video.alert).label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Card Footer Action -->
      <div class="card-actions">
        <router-link
          :to="'/videos/' + video.id"
          class="btn btn-secondary btn-sm btn-half"
        >
          <span>Chi Tiết</span>
        </router-link>
        <a
          :href="video.url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-secondary btn-sm btn-half"
        >
          <span>Xem YouTube</span>
          <AppIcon name="external" size="14" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { VideoListItem } from '@/types/video';
import { videoService } from '@/services/video-service';

defineProps<{
  videos: VideoListItem[];
}>();

function handleThumbError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}

function handleAvatarError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}
</script>

<style scoped>
.mobile-video-list {
  display: none;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 900px) {
  .mobile-video-list {
    display: flex;
  }
}

.mobile-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-video-header {
  display: flex;
  gap: 12px;
}

.thumb-wrap {
  width: 120px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  color: var(--text-muted);
}

.video-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.video-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
}

.channel-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.avatar-wrap {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-secondary);
}

.channel-name {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-sub-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.video-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.dot-separator {
  opacity: 0.5;
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
  padding: 10px 12px;
  background-color: var(--bg-surface-elevated);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.metric-val {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-val.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.vph-rising {
  color: #38BDF8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.vph-muted {
  color: var(--text-muted);
  font-weight: 400;
}

.badge-threshold {
  display: inline-flex;
  align-self: flex-start;
  margin-top: 2px;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  background-color: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
  text-transform: uppercase;
}

.delta-positive {
  color: #34D399;
}

.delta-neutral {
  color: var(--text-muted);
  font-weight: 400;
}

.badge-alert {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
}

.alert-muted {
  background-color: rgba(100, 116, 139, 0.12);
  color: var(--text-secondary);
  border: 1px solid rgba(100, 116, 139, 0.25);
}

.alert-warning {
  background-color: rgba(234, 179, 8, 0.12);
  color: #EAB308;
  border: 1px solid rgba(234, 179, 8, 0.25);
}

.alert-success {
  background-color: rgba(34, 197, 94, 0.12);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.alert-danger {
  background-color: rgba(239, 68, 68, 0.12);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-half {
  flex: 1;
  justify-content: center;
  text-decoration: none;
}

.btn-full {
  width: 100%;
  justify-content: center;
  text-decoration: none;
}
</style>
