<template>
  <article class="opportunity-large-card surface-card">
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
      <!-- Channel row -->
      <div class="channel-row">
        <router-link :to="'/kenh-theo-doi/' + video.channel.id" class="channel-name">
          {{ video.channel.name }}
        </router-link>
        <span class="meta-dot">•</span>
        <span class="video-age">{{ video.videoAge }}</span>
        <div class="status-badge-wrap">
          <OpportunityStatusBadge
            type="threshold"
            :is-over-threshold="video.isOverThreshold"
          />
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

      <!-- Threshold progress -->
      <div class="threshold-progress-wrap">
        <div class="progress-info">
          <span class="progress-lbl">Tiến độ ngưỡng</span>
          <span class="progress-val mono">{{ video.thresholdRatio }}% (Ngưỡng: {{ formatNumber(video.channel.alertVphThreshold) }})</span>
        </div>
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            :class="{ 'fill-over': video.isOverThreshold }"
            :style="{ width: `${Math.min(100, Math.max(2, video.thresholdRatio))}%` }"
          ></div>
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
.opportunity-large-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 4px 14px rgba(30, 60, 90, 0.05));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.opportunity-large-card:hover {
  transform: translateY(-2px);
  border-color: #BFDBFE;
  box-shadow: var(--shadow-md, 0 10px 25px rgba(37, 99, 235, 0.08));
}

[data-theme="dark"] .opportunity-large-card:hover {
  border-color: rgba(56, 189, 248, 0.3);
}

.card-thumb-wrap {
  width: 100%;
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  gap: 10px;
  flex: 1;
}

.channel-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.channel-name {
  font-weight: 650;
  color: var(--text-primary);
  text-decoration: none;
}

.channel-name:hover {
  color: var(--primary, #2563EB);
}

.meta-dot {
  color: var(--text-muted);
}

.video-age {
  color: var(--text-muted);
}

.status-badge-wrap {
  margin-left: auto;
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
  min-height: 40px;
}

.title-link {
  color: var(--text-primary);
  text-decoration: none;
}

.title-link:hover {
  color: var(--primary, #2563EB);
}

.metrics-cluster {
  display: grid;
  grid-template-columns: 1.2fr auto 1fr auto 1fr;
  align-items: center;
  padding: 8px 12px;
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
  font-size: 14px;
  font-weight: 750;
  color: var(--text-primary);
}

.m-lbl {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.metric-sep {
  width: 1px;
  height: 22px;
  background: var(--border, #E3EBF3);
  margin: 0 6px;
}

.threshold-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.progress-bar-track {
  width: 100%;
  height: 5px;
  background: var(--bg-inset, #E2E8F0);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #3B82F6;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-bar-fill.fill-over {
  background: #10B981;
}

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
  flex: 1;
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-prod:hover {
  background: #2563EB;
  color: #FFFFFF;
}

.btn-ai:hover {
  background: #FDF4FF;
  color: #C026D3;
  border-color: #F5D0FE;
}

.btn-detail:hover {
  color: var(--primary, #2563EB);
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
</style>
