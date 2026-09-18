<template>
  <article class="growth-large-card surface-card">
    <div class="card-thumb-wrap">
      <VideoThumbnail
        :src="video.thumbnailUrl"
        :alt="video.title"
        ratio="16-9"
        :detail-url="'/videos/' + video.id"
        :youtube-video-id="video.youtubeVideoId"
        :vph-badge="video.latestMeasuredVph"
      />
    </div>

    <div class="card-body">
      <!-- Channel info -->
      <div class="channel-row">
        <router-link :to="'/kenh-theo-doi/' + video.channel.id" class="channel-name">
          {{ video.channel.name }}
        </router-link>
        <span class="meta-dot">•</span>
        <span class="video-age">{{ formatVideoAge(video.publishedAt) }}</span>
        <div class="status-badge-wrap">
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
      </div>

      <!-- Title -->
      <h3 class="video-title">
        <router-link :to="'/videos/' + video.id" class="title-link" :title="video.title">
          {{ video.title }}
        </router-link>
      </h3>

      <!-- Metrics Cluster -->
      <div class="metrics-cluster">
        <div class="metric-item vph-item" title="Số lượt xem tăng trung bình mỗi giờ giữa hai lần hệ thống đo gần nhất.">
          <span class="m-val mono text-accent">{{ formattedVph }}</span>
          <span class="m-lbl">TỐC ĐỘ VPH</span>
        </div>

        <div class="metric-sep"></div>

        <div class="metric-item">
          <span class="m-val mono">{{ formatNumber(video.latestViewCount) }}</span>
          <span class="m-lbl">LƯỢT XEM</span>
        </div>

        <div class="metric-sep"></div>

        <div class="metric-item">
          <span class="m-val mono" :class="{ 'text-positive': video.latestDeltaViews && video.latestDeltaViews > 0 }">
            {{ formatDelta(video.latestDeltaViews) }}
          </span>
          <span class="m-lbl">TĂNG GẦN NHẤT</span>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="card-footer-actions">
        <button
          type="button"
          class="btn-card-action btn-prod"
          :disabled="isAddingToProduction"
          @click="$emit('add-production', video)"
        >
          <AppIcon name="clipboard-list" size="13" />
          <span>Sản Xuất</span>
        </button>

        <router-link :to="'/tro-ly-noi-dung?video=' + video.id" class="btn-card-action btn-ai">
          <AppIcon name="sparkles" size="13" />
          <span>AI</span>
        </router-link>

        <router-link :to="'/videos/' + video.id" class="btn-card-action btn-detail">
          <span>Chi Tiết</span>
        </router-link>

        <a
          :href="video.url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-card-action btn-yt"
          title="Mở YouTube"
        >
          <AppIcon name="external" size="13" />
        </a>
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
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  return `${days} ngày`;
}
</script>

<style scoped>
.growth-large-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 4px 14px rgba(30, 60, 90, 0.05));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.growth-large-card:hover {
  transform: translateY(-2px);
  border-color: #BFDBFE;
  box-shadow: 0 8px 24px rgba(30, 60, 90, 0.09);
}

.card-thumb-wrap {
  width: 100%;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  flex: 1;
}

.channel-row {
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

.status-badge-wrap {
  margin-left: auto;
}

.video-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
  flex: 1;
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

/* Metrics Cluster */
.metrics-cluster {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 8px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-val {
  font-size: 13.5px;
  font-weight: 750;
  color: var(--text-primary);
}

.m-lbl {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.metric-sep {
  width: 1px;
  height: 24px;
  background: var(--border, #E3EBF3);
}

/* Footer Actions */
.card-footer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 4px;
}

.btn-card-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--surface, #FFFFFF);
  color: var(--text-secondary);
}

.btn-prod {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-prod:hover:not(:disabled) {
  background: var(--primary, #2563EB);
  color: #FFFFFF;
}

.btn-prod:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ai:hover {
  background: #FAF5FF;
  color: #9333EA;
  border-color: #E9D5FF;
}

.btn-detail:hover {
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-primary);
}

.btn-yt {
  padding: 6px 8px;
}

.btn-yt:hover {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}

.text-accent { color: #0284C7; }
.text-positive { color: #059669; }
</style>
