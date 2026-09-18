<template>
  <article class="opportunity-list-row surface-card">
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
        <span class="video-age">{{ video.videoAge }}</span>
        <OpportunityStatusBadge
          type="threshold"
          :is-over-threshold="video.isOverThreshold"
        />
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
import OpportunityStatusBadge from '@/components/opportunity/OpportunityStatusBadge.vue';
import type { OpportunityVideo } from '@/types/opportunity';

const props = defineProps<{
  video: OpportunityVideo;
  isAddingToProduction?: boolean;
}>();

defineEmits<{
  (e: 'add-production', video: OpportunityVideo): void;
}>();

const formattedVph = computed(() => {
  if (props.video.latestMeasuredVph === 0) return '0 VPH';
  return `${formatNumber(Math.round(props.video.latestMeasuredVph))} VPH`;
});

function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return '—';
  if (delta > 0) return `+${formatNumber(delta)}`;
  return formatNumber(delta);
}

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
.opportunity-list-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(30, 60, 90, 0.04));
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.opportunity-list-row:hover {
  transform: translateY(-1px);
  border-color: #BFDBFE;
}

.row-thumb-wrap {
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
  color: var(--text-secondary);
}

.channel-name {
  font-weight: 650;
  color: var(--text-primary);
  text-decoration: none;
}

.meta-dot {
  color: var(--text-muted);
}

.video-age {
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
}

.metric-tag-val {
  font-weight: 700;
  color: var(--text-primary);
}

.actions-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  gap: 5px;
  padding: 6px 10px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-primary);
  border: 1px solid var(--border, #E3EBF3);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-prod {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-prod:hover {
  background: #2563EB;
  color: #FFFFFF;
}

.btn-yt:hover {
  color: #DC2626;
  border-color: #FECACA;
  background: #FEF2F2;
}

.text-accent {
  color: #0284C7;
}

.text-positive {
  color: #059669;
}

[data-theme="dark"] .text-accent {
  color: #38BDF8;
}

[data-theme="dark"] .text-positive {
  color: #34D399;
}

@media (max-width: 768px) {
  .opportunity-list-row {
    flex-direction: column;
    align-items: stretch;
  }
  .row-thumb-wrap {
    width: 100%;
  }
  .row-metrics-actions {
    justify-content: space-between;
  }
}
</style>
