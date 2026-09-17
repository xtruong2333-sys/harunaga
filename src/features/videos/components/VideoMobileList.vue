<template>
  <div class="mobile-signal-list">
    <div v-for="video in videos" :key="video.id" class="mobile-signal-card">
      <!-- Card Header: Thumbnail + Title -->
      <div class="card-hero-row">
        <router-link
          :to="'/videos/' + video.id"
          class="mobile-thumb-wrap"
          title="Xem chi tiết video"
        >
          <img
            v-if="video.thumbnailUrl"
            :src="video.thumbnailUrl"
            :alt="video.title"
            class="mobile-thumb-img"
            loading="lazy"
            @error="handleThumbError"
          />
          <div v-else class="thumb-fallback">
            <AppIcon name="video" size="22" />
          </div>
        </router-link>

        <div class="hero-text-wrap">
          <router-link :to="'/videos/' + video.id" class="mobile-video-title">
            {{ video.title }}
          </router-link>

          <div class="mobile-channel-line">
            <div class="avatar-circle">
              <img
                v-if="video.channel.avatarUrl"
                :src="video.channel.avatarUrl"
                :alt="video.channel.name"
                class="avatar-img"
                loading="lazy"
                @error="handleAvatarError"
              />
              <div v-else class="avatar-char">
                {{ video.channel.name.charAt(0).toUpperCase() }}
              </div>
            </div>
            <span class="channel-title">{{ video.channel.name }}</span>
          </div>

          <div class="mobile-sub-meta">
            <span class="video-id mono">{{ video.youtubeVideoId }}</span>
            <span class="meta-dot">•</span>
            <span class="pub-time">{{ videoService.formatRelativeTime(video.publishedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Hero VPH Signal -->
      <div class="mobile-vph-hero">
        <div class="vph-hero-top">
          <span class="hero-label">VPH ĐO ĐƯỢC</span>
          <span v-if="video.isOverThreshold" class="badge-threshold">
            Vượt ngưỡng
          </span>
        </div>
        <div class="hero-val-line">
          <span
            v-if="video.latestMeasuredVph !== null && video.latestMeasuredVph > 0"
            class="pulse-dot"
          />
          <span
            class="hero-vph-val mono"
            :class="{
              'vph-rising': video.latestMeasuredVph !== null && video.latestMeasuredVph > 0,
              'vph-muted': video.latestMeasuredVph === null || video.latestMeasuredVph === 0,
            }"
          >
            {{ videoService.formatVph(video.latestMeasuredVph) }}
          </span>
        </div>
      </div>

      <!-- Metrics Grid 2x2 -->
      <div class="mobile-metrics-grid">
        <div class="m-metric">
          <span class="m-label">Lượt xem</span>
          <span class="m-val mono">{{ videoService.formatViews(video.latestViewCount) }}</span>
        </div>

        <div class="m-metric">
          <span class="m-label">Tăng gần nhất</span>
          <span
            class="m-val mono"
            :class="{
              'delta-pos': video.latestDeltaViews !== null && video.latestDeltaViews > 0,
              'delta-neutral': video.latestDeltaViews === null || video.latestDeltaViews <= 0,
            }"
          >
            {{ videoService.formatViewDelta(video.latestDeltaViews) }}
          </span>
        </div>

        <div class="m-metric">
          <span class="m-label">Cảnh báo</span>
          <span
            class="m-badge-alert"
            :class="`tag-${videoService.getAlertBadge(video.alert).tone}`"
          >
            {{ videoService.getAlertBadge(video.alert).label }}
          </span>
        </div>

        <div class="m-metric">
          <span class="m-label">Đo lần cuối</span>
          <span class="m-val m-val-sm">
            {{ video.latestSnapshot?.checkedAt ? videoService.formatRelativeTime(video.latestSnapshot.checkedAt) : 'Chưa có' }}
          </span>
        </div>
      </div>

      <!-- Action Footer (>= 44px tap target) -->
      <div class="mobile-card-actions">
        <router-link :to="'/videos/' + video.id" class="m-action-btn m-btn-detail">
          <span>Chi tiết video</span>
          <AppIcon name="arrow-right" size="14" />
        </router-link>
        <a
          :href="video.url"
          target="_blank"
          rel="noopener noreferrer"
          class="m-action-btn m-btn-yt"
          title="Xem trên YouTube"
        >
          <span>YouTube</span>
          <AppIcon name="external" size="14" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { videoService } from '@/services/video-service';
import type { VideoListItem } from '@/types/video';

defineProps<{
  videos: VideoListItem[];
}>();

function handleThumbError(e: Event) {
  const target = e.target as HTMLElement;
  target.style.display = 'none';
  const fallback = target.nextElementSibling as HTMLElement;
  if (fallback) fallback.style.display = 'flex';
}

function handleAvatarError(e: Event) {
  const target = e.target as HTMLElement;
  target.style.display = 'none';
  const fallback = target.nextElementSibling as HTMLElement;
  if (fallback) fallback.style.display = 'flex';
}
</script>

<style scoped>
.mobile-signal-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  display: none;
}

@media (max-width: 900px) {
  .mobile-signal-list {
    display: flex;
  }
}

.mobile-signal-card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  backdrop-filter: blur(10px);
}

.card-hero-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.mobile-thumb-wrap {
  position: relative;
  width: 100px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #090d16;
}

.mobile-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.hero-text-wrap {
  flex: 1;
  min-width: 0;
}

.mobile-video-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.35;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}

.mobile-channel-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.avatar-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-char {
  width: 100%;
  height: 100%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
}

.channel-title {
  font-size: 12px;
  color: #cbd5e1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-sub-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
}

.meta-dot {
  opacity: 0.5;
}

/* VPH Hero Box */
.mobile-vph-hero {
  background: rgba(10, 16, 28, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.vph-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.hero-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.badge-threshold {
  font-size: 10px;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
  padding: 1px 6px;
  border-radius: 4px;
}

.hero-val-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.8); }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-dot {
    animation: none !important;
  }
}

.hero-vph-val {
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.vph-rising {
  color: #38bdf8;
}

.vph-muted {
  color: #64748b;
}

/* 2x2 Grid */
.mobile-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  margin-bottom: 14px;
}

.m-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.m-val {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  font-variant-numeric: tabular-nums;
}

.m-val-sm {
  font-size: 11px;
  color: #94a3b8;
}

.delta-pos {
  color: #34d399;
}

.delta-neutral {
  color: #64748b;
}

.m-badge-alert {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
}

.tag-success {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.tag-warning {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.tag-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.tag-neutral {
  background: rgba(255, 255, 255, 0.05);
  color: #64748b;
}

/* Action Buttons (>= 44px tap target) */
.mobile-card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.m-action-btn {
  flex: 1;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}

.m-btn-detail {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38bdf8;
}

.m-btn-detail:hover {
  background: rgba(56, 189, 248, 0.2);
}

.m-btn-yt {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

.m-btn-yt:hover {
  color: #f8fafc;
}
</style>
