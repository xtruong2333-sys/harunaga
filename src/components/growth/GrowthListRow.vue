<template>
  <article class="growth-list-row surface-card">
    <div class="row-thumb-wrap">
      <VideoThumbnail
        :src="video.thumbnailUrl"
        :alt="video.title"
        ratio="16-9"
        :detail-url="'/videos/' + video.id"
        :youtube-video-id="video.youtubeVideoId"
        :vph-badge="video.latestMeasuredVph"
      />
    </div>

    <div class="row-content">
      <div class="row-channel-meta">
        <router-link :to="'/kenh-theo-doi/' + video.channel.id" class="channel-name">
          {{ video.channel.name }}
        </router-link>
        <span class="meta-dot">•</span>
        <span class="video-age">{{ formatVideoAge(video.publishedAt) }}</span>
        <GrowthStatusBadge
          v-if="video.alert"
          type="alert"
          :alert-status="video.alert.status"
        />
        <template v-else>
          <GrowthStatusBadge
            v-if="video.latestMeasuredVph && video.latestMeasuredVph > 0"
            type="rising"
            :measured-vph="video.latestMeasuredVph"
          />
          <GrowthStatusBadge
            v-else
            type="alert"
            alert-status="unalerted"
          />
        </template>
      </div>

      <h3 class="video-title">
        <router-link :to="'/videos/' + video.id" class="title-link" :title="video.title">
          {{ video.title }}
        </router-link>
      </h3>
    </div>

    <div class="row-metrics-actions">
      <div class="metrics-column">
        <div class="metric-row-item">
          <span class="metric-tag-label">VPH:</span>
          <span class="metric-tag-val mono text-accent">{{ formattedVph }}</span>
        </div>
        <div class="metric-row-item">
          <span class="metric-tag-label">Views:</span>
          <span class="metric-tag-val mono">{{ formatNumber(video.latestViewCount) }}</span>
        </div>
        <div class="metric-row-item">
          <span class="metric-tag-label">Tăng:</span>
          <span class="metric-tag-val mono" :class="{ 'text-positive': video.latestDeltaViews && video.latestDeltaViews > 0 }">
            {{ formatDelta(video.latestDeltaViews) }}
          </span>
        </div>
      </div>

      <div class="actions-column">
        <button
          type="button"
          class="btn-row-action btn-prod"
          :disabled="isAddingToProduction"
          @click="$emit('add-production', video)"
        >
          <AppIcon name="clipboard-list" size="13" />
          <span>Sản Xuất</span>
        </button>

        <div class="actions-sub-row">
          <router-link :to="'/tro-ly-noi-dung?video=' + video.id" class="btn-row-action" title="Phân tích AI">
            <AppIcon name="sparkles" size="13" />
          </router-link>
          <router-link :to="'/videos/' + video.id" class="btn-row-action" title="Xem chi tiết">
            <AppIcon name="info" size="13" />
          </router-link>
          <a
            :href="video.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-row-action btn-yt"
            title="Mở YouTube"
          >
            <AppIcon name="external" size="13" />
          </a>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import GrowthStatusBadge from '@/components/growth/GrowthStatusBadge.vue';
import type { VideoListItem } from '@/types/video';

const props = defineProps<{
  video: VideoListItem;
  isAddingToProduction?: boolean;
}>();

defineEmits<{
  (e: 'add-production', video: VideoListItem): void;
}>();

const formattedVph = computed(() => {
  if (props.video.latestMeasuredVph === null || props.video.latestMeasuredVph === undefined) return '—';
  if (props.video.latestMeasuredVph === 0) return '0 VPH';
  return `${formatNumber(Math.round(props.video.latestMeasuredVph))} VPH`;
});

function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return '—';
  if (delta > 0) return `+${formatNumber(delta)}`;
  return formatNumber(delta);
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '—';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString('vi-VN');
}

function formatVideoAge(publishedAt: string): string {
  if (!publishedAt) return '—';
  const pubTime = new Date(publishedAt).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - pubTime) / 1000));
  if (diffSeconds < 60) return 'Vừa xong';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}
</script>

<style scoped>
.growth-list-row {
  display: grid;
  grid-template-columns: 230px 1fr 280px;
  gap: 20px;
  align-items: center;
  padding: 14px;
  border-radius: 12px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(30, 60, 90, 0.04));
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.growth-list-row:hover {
  transform: translateY(-2px);
  border-color: #BFDBFE;
  box-shadow: 0 6px 18px rgba(30, 60, 90, 0.08);
}

.row-thumb-wrap {
  width: 100%;
}

.row-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.row-channel-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
}

.channel-name {
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
}

.channel-name:hover {
  color: var(--primary, #2563EB);
}

.video-age {
  color: var(--text-secondary);
}

.meta-dot {
  color: var(--text-muted);
}

.video-title {
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
}

.title-link {
  color: var(--text-primary);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.title-link:hover {
  color: var(--primary, #2563EB);
}

/* Metrics + Actions */
.row-metrics-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-left: 16px;
  border-left: 1px solid var(--border, #E3EBF3);
}

.metrics-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-row-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12.5px;
}

.metric-tag-label {
  color: var(--text-muted);
  font-size: 11.5px;
}

.metric-tag-val {
  font-weight: 700;
}

.actions-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.actions-sub-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-row-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--surface, #FFFFFF);
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-row-action:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-prod {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
  width: 100%;
}

.btn-prod:hover:not(:disabled) {
  background: var(--primary, #2563EB);
  color: #FFFFFF;
}

.btn-prod:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-yt:hover {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}

.text-accent { color: #0284C7; }
.text-positive { color: #059669; }

@media (max-width: 1024px) {
  .growth-list-row {
    grid-template-columns: 180px 1fr;
    gap: 14px;
  }
  .row-metrics-actions {
    grid-column: 1 / -1;
    border-left: none;
    border-top: 1px solid var(--border, #E3EBF3);
    padding-left: 0;
    padding-top: 10px;
  }
}

@media (max-width: 640px) {
  .growth-list-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .row-metrics-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .actions-column {
    align-items: stretch;
  }
  .actions-sub-row {
    justify-content: space-between;
  }
}
</style>
