<template>
  <div class="table-surface-card">
    <table class="obsidian-table">
      <thead>
        <tr>
          <th class="col-video">VIDEO</th>
          <th class="col-channel">KÊNH</th>
          <th class="col-vph">VPH ĐO ĐƯỢC</th>
          <th class="col-views">LƯỢT XEM</th>
          <th class="col-delta">TĂNG TỪ LẦN TRƯỚC</th>
          <th class="col-published">THỜI GIAN ĐĂNG</th>
          <th class="col-alert">CẢNH BÁO</th>
          <th class="col-actions">THAO TÁC</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="video in videos"
          :key="video.id"
          class="table-row"
          :class="{
            'row-rising': video.latestMeasuredVph !== null && video.latestMeasuredVph > 0,
            'row-alerted': video.alert && video.alert.status === 'sent'
          }"
        >
          <!-- 1. Video Column (Thumbnail + Title + ID) -->
          <td class="col-video">
            <div class="video-cell">
              <router-link
                :to="'/videos/' + video.id"
                class="thumb-box"
                title="Xem chi tiết video"
              >
                <img
                  v-if="video.thumbnailUrl"
                  :src="video.thumbnailUrl"
                  :alt="video.title"
                  class="video-thumb-img"
                  loading="lazy"
                  @error="handleThumbError"
                />
                <div v-else class="thumb-fallback">
                  <AppIcon name="video" size="18" />
                </div>
              </router-link>

              <div class="video-meta">
                <router-link
                  :to="'/videos/' + video.id"
                  class="video-title"
                  :title="video.title"
                >
                  {{ video.title }}
                </router-link>
                <div class="video-id mono">{{ video.youtubeVideoId }}</div>
              </div>
            </div>
          </td>

          <!-- 2. Channel Column -->
          <td class="col-channel">
            <div class="channel-cell">
              <div class="avatar-box">
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
              <span class="channel-name" :title="video.channel.name">
                {{ video.channel.name }}
              </span>
            </div>
          </td>

          <!-- 3. VPH đo được (Most Visually Noticeable) -->
          <td class="col-vph">
            <div class="vph-cell">
              <div class="vph-val-wrap">
                <span
                  v-if="video.latestMeasuredVph !== null && video.latestMeasuredVph > 0"
                  class="pulse-dot"
                />
                <span
                  class="vph-number mono"
                  :class="{
                    'vph-rising': video.latestMeasuredVph !== null && video.latestMeasuredVph > 0,
                    'vph-muted': video.latestMeasuredVph === null || video.latestMeasuredVph === 0,
                  }"
                >
                  {{ videoService.formatVph(video.latestMeasuredVph) }}
                </span>
              </div>
              <span v-if="video.isOverThreshold" class="badge-threshold" title="Vượt ngưỡng cảnh báo của kênh">
                Vượt ngưỡng
              </span>
            </div>
          </td>

          <!-- 4. Lượt xem -->
          <td class="col-views">
            <span class="views-value mono">{{ videoService.formatViews(video.latestViewCount) }}</span>
          </td>

          <!-- 5. Tăng từ lần trước -->
          <td class="col-delta">
            <span
              class="delta-value mono"
              :class="{
                'delta-pos': video.latestDeltaViews !== null && video.latestDeltaViews > 0,
                'delta-neutral': video.latestDeltaViews === null || video.latestDeltaViews <= 0,
              }"
            >
              {{ videoService.formatViewDelta(video.latestDeltaViews) }}
            </span>
          </td>

          <!-- 6. Thời gian đăng -->
          <td class="col-published">
            <span class="published-time" :title="video.publishedAt">
              {{ videoService.formatRelativeTime(video.publishedAt) }}
            </span>
          </td>

          <!-- 7. Cảnh báo -->
          <td class="col-alert">
            <span
              class="badge-alert-tag"
              :class="`tag-${videoService.getAlertBadge(video.alert).tone}`"
            >
              {{ videoService.getAlertBadge(video.alert).label }}
            </span>
          </td>

          <!-- 8. Thao tác -->
          <td class="col-actions">
            <div class="actions-group">
              <router-link
                :to="'/videos/' + video.id"
                class="btn-icon-action"
                title="Chi tiết video"
              >
                <AppIcon name="arrow-right" size="14" />
              </router-link>
              <a
                :href="video.url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-icon-action btn-yt"
                title="Xem trên YouTube"
              >
                <AppIcon name="external" size="14" />
              </a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
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
.table-surface-card {
  background: var(--bg-surface);
  border-top: 1px solid var(--border-strong);
  border-bottom: 1px solid var(--border-strong);
  border-left: 1px solid var(--border-line);
  border-right: 1px solid var(--border-line);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  margin-bottom: 30px;
}

.obsidian-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

thead th {
  background: var(--table-header-bg, var(--bg-inset));
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-strong);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-row {
  border-bottom: 1px solid var(--border-line);
  border-left: 2px solid transparent;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.table-row:hover {
  background: var(--bg-surface-hover);
}

.table-row.row-rising {
  border-left: 2px solid var(--accent);
}

.table-row.row-alerted {
  background: var(--accent-subtle);
}

td {
  padding: 15px 16px;
  vertical-align: middle;
}

/* Col Video */
.col-video {
  min-width: 320px;
  max-width: 440px;
}

.video-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.thumb-box {
  position: relative;
  width: 96px;
  height: 54px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-inset);
  border: 1px solid var(--border-line);
}

.video-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.table-row:hover .video-thumb-img {
  transform: scale(1.03);
}

.thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.video-meta {
  min-width: 0;
}

.video-title {
  color: var(--text-primary);
  font-weight: 600;
  line-height: 1.35;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s ease;
}

.video-title:hover {
  color: var(--accent);
}

.video-id {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Col Channel */
.col-channel {
  min-width: 160px;
}

.channel-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-box {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.channel-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}

.channel-name {
  color: #cbd5e1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

/* Col VPH (Focal Column) */
.col-vph {
  min-width: 140px;
}

.vph-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.vph-val-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.7);
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

.vph-number {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.vph-rising {
  color: #38bdf8;
}

.vph-muted {
  color: #64748b;
}

.badge-threshold {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.25);
  border-radius: 4px;
  padding: 1px 5px;
  width: fit-content;
}

/* Col Views & Delta */
.views-value {
  color: #e2e8f0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.delta-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.delta-pos {
  color: #34d399;
}

.delta-neutral {
  color: #64748b;
}

/* Col Published */
.published-time {
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
}

/* Col Alert */
.badge-alert-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 5px;
  white-space: nowrap;
}

.tag-success {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.tag-warning {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.25);
}

.tag-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.tag-neutral {
  background: rgba(255, 255, 255, 0.05);
  color: #64748b;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Col Actions */
.actions-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-icon-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--text-secondary);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-icon-action:hover {
  color: var(--accent);
  background: var(--accent-subtle);
  border-color: var(--accent);
}

.btn-yt:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
}
</style>
