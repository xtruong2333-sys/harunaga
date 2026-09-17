<template>
  <div class="table-card">
    <table class="video-table">
      <thead>
        <tr>
          <th class="col-video">VIDEO</th>
          <th class="col-channel">KÊNH</th>
          <th class="col-views">LƯỢT XEM</th>
          <th class="col-vph">VPH ĐO ĐƯỢC</th>
          <th class="col-delta">TĂNG TỪ LẦN TRƯỚC</th>
          <th class="col-published">THỜI GIAN ĐĂNG</th>
          <th class="col-alert">CẢNH BÁO</th>
          <th class="col-actions">THAO TÁC</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="video in videos" :key="video.id" class="table-row">
          <!-- 1. Video (Thumbnail + Title + ID) -->
          <td class="col-video">
            <div class="video-cell">
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
                  <AppIcon name="video" size="20" />
                </div>
              </router-link>

              <div class="video-info">
                <router-link
                  :to="'/videos/' + video.id"
                  class="video-title"
                  :title="video.title"
                >
                  {{ video.title }}
                </router-link>
                <div class="video-id">{{ video.youtubeVideoId }}</div>
              </div>
            </div>
          </td>

          <!-- 2. Kênh -->
          <td class="col-channel">
            <div class="channel-cell">
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
              <span class="channel-name" :title="video.channel.name">
                {{ video.channel.name }}
              </span>
            </div>
          </td>

          <!-- 3. Lượt xem -->
          <td class="col-views">
            <span class="views-value">{{ videoService.formatViews(video.latestViewCount) }}</span>
          </td>

          <!-- 4. VPH đo được -->
          <td class="col-vph">
            <div class="vph-cell">
              <span
                class="vph-value"
                :class="{
                  'vph-rising': video.latestMeasuredVph !== null && video.latestMeasuredVph > 0,
                  'vph-muted': video.latestMeasuredVph === null || video.latestMeasuredVph === 0,
                }"
              >
                {{ videoService.formatVph(video.latestMeasuredVph) }}
              </span>
              <span v-if="video.isOverThreshold" class="badge-threshold" title="Vượt ngưỡng cảnh báo của kênh">
                Vượt ngưỡng
              </span>
            </div>
          </td>

          <!-- 5. Tăng từ lần trước -->
          <td class="col-delta">
            <span
              class="delta-value"
              :class="{
                'delta-positive': video.latestDeltaViews !== null && video.latestDeltaViews > 0,
                'delta-neutral': video.latestDeltaViews === null || video.latestDeltaViews <= 0,
              }"
            >
              {{ videoService.formatViewDelta(video.latestDeltaViews) }}
            </span>
          </td>

          <!-- 6. Thời gian đăng -->
          <td class="col-published">
            <span class="published-text" :title="video.publishedAt || ''">
              {{ videoService.formatRelativeTime(video.publishedAt) }}
            </span>
          </td>

          <!-- 7. Cảnh báo -->
          <td class="col-alert">
            <span class="badge-alert" :class="`alert-${videoService.getAlertBadge(video.alert).tone}`">
              {{ videoService.getAlertBadge(video.alert).label }}
            </span>
          </td>

          <!-- 8. Thao tác -->
          <td class="col-actions">
            <div class="actions-wrap">
              <router-link
                :to="'/videos/' + video.id"
                class="btn-detail"
                title="Xem chi tiết video và lịch sử snapshot"
              >
                <span>Chi Tiết</span>
              </router-link>
              <a
                :href="video.url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-youtube"
                title="Mở video trên YouTube"
              >
                <span>Xem YouTube</span>
                <AppIcon name="external" size="13" />
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
.table-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
}

.video-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  background-color: var(--bg-surface-elevated);
  padding: 14px 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row:hover td {
  background-color: var(--bg-surface-hover);
}

/* 1. Video cell */
.col-video {
  min-width: 280px;
  max-width: 420px;
}

.video-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.thumb-wrap {
  width: 100px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.thumb-wrap:hover {
  opacity: 0.85;
}

.video-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  color: var(--text-muted);
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.video-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
}

.video-title:hover {
  color: var(--accent);
}

.video-id {
  font-size: 11px;
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* 2. Channel cell */
.col-channel {
  min-width: 160px;
}

.channel-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
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
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.channel-name {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 3. Views cell */
.col-views {
  white-space: nowrap;
}

.views-value {
  font-weight: 600;
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

/* 4. VPH cell */
.col-vph {
  min-width: 150px;
}

.vph-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vph-value {
  font-weight: 600;
  font-size: 13px;
}

.vph-rising {
  color: #38BDF8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.vph-muted {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 12px;
}

.badge-threshold {
  display: inline-flex;
  align-self: flex-start;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background-color: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* 5. Delta cell */
.col-delta {
  white-space: nowrap;
}

.delta-value {
  font-size: 13px;
}

.delta-positive {
  color: #34D399;
  font-weight: 500;
}

.delta-neutral {
  color: var(--text-muted);
}

/* 6. Published cell */
.col-published {
  white-space: nowrap;
}

.published-text {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 7. Alert cell */
.col-alert {
  white-space: nowrap;
}

.badge-alert {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
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

/* 8. Actions cell */
.col-actions {
  white-space: nowrap;
  text-align: right;
}

.actions-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.btn-detail {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: var(--accent-subtle);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: var(--accent);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-detail:hover {
  background-color: var(--accent);
  color: #03111C;
}

.btn-youtube {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-youtube:hover {
  background-color: var(--bg-surface-hover);
  border-color: var(--border-strong);
  color: var(--accent);
}

@media (max-width: 900px) {
  .table-card {
    display: none;
  }
}
</style>
