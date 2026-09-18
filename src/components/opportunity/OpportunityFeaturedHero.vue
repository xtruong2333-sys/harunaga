<template>
  <div class="opportunity-featured-hero surface-card">
    <div class="hero-top-badge-row">
      <div class="featured-kicker">
        <span class="pulse-point"></span>
        <span>TÍN HIỆU NỔI BẬT #1</span>
      </div>
      <OpportunityStatusBadge
        type="threshold"
        :is-over-threshold="video.isOverThreshold"
      />
    </div>

    <div class="hero-grid-layout">
      <!-- Left: Large 16:9 Media Showcase -->
      <div class="hero-media-column">
        <VideoThumbnail
          :src="video.thumbnailUrl"
          :alt="video.title"
          ratio="16-9"
          loading="eager"
          :detail-url="'/videos/' + video.id"
          :youtube-video-id="video.youtubeVideoId"
          :vph-badge="video.latestMeasuredVph"
        />
      </div>

      <!-- Right: Analytical Info & Signal Facts -->
      <div class="hero-info-column">
        <!-- Channel & Timing -->
        <div class="channel-identity-row">
          <router-link :to="'/kenh-theo-doi/' + video.channel.id" class="channel-avatar-link">
            <img
              v-if="video.channel.avatarUrl && !avatarError"
              :src="video.channel.avatarUrl"
              :alt="video.channel.name"
              class="channel-avatar"
              loading="lazy"
              @error="avatarError = true"
            />
            <div v-else class="avatar-fallback">
              {{ (video.channel.name || 'C').charAt(0).toUpperCase() }}
            </div>
          </router-link>

          <div class="channel-text-meta">
            <router-link
              :to="'/kenh-theo-doi/' + video.channel.id"
              class="channel-name"
              :title="video.channel.name"
            >
              {{ video.channel.name }}
            </router-link>
            <span v-if="video.channel.handle" class="channel-handle">{{ video.channel.handle }}</span>
            <span class="meta-dot">•</span>
            <span class="video-age">{{ video.videoAge }}</span>
          </div>
        </div>

        <!-- Video Title -->
        <h2 class="video-title">
          <router-link :to="'/videos/' + video.id" class="title-link" :title="video.title">
            {{ video.title }}
          </router-link>
        </h2>

        <!-- Hero Metric Cluster (VPH Hero + Quick Metrics) -->
        <div class="hero-metric-cluster">
          <div class="hero-vph-box" title="Số lượt xem tăng trung bình mỗi giờ giữa hai lần hệ thống đo gần nhất.">
            <div class="hero-vph-val mono text-accent">{{ formattedVph }}</div>
            <div class="hero-vph-lbl">TỐC ĐỘ TĂNG TRƯỞNG</div>
          </div>

          <div class="hero-micro-metrics">
            <div class="micro-cell">
              <span class="micro-lbl">LƯỢT XEM</span>
              <span class="micro-val mono">{{ formatNumber(video.latestViewCount) }}</span>
            </div>
            <div class="micro-cell">
              <span class="micro-lbl">TĂNG GẦN NHẤT</span>
              <span class="micro-val mono" :class="{ 'text-positive': video.latestDeltaViews && video.latestDeltaViews > 0 }">
                {{ formatDelta(video.latestDeltaViews) }}
              </span>
            </div>
            <div class="micro-cell">
              <span class="micro-lbl">NGƯỠNG KÊNH</span>
              <span class="micro-val mono">{{ formatNumber(video.channel.alertVphThreshold) }} VPH</span>
            </div>
          </div>
        </div>

        <!-- Factual Rule Reasons -->
        <OpportunitySignalReason :video="video" />

        <!-- Actions Row -->
        <div class="hero-actions-row">
          <button
            type="button"
            class="btn-hero-action btn-primary-action"
            :disabled="isAddingToProduction"
            @click="$emit('add-production', video)"
            title="Đưa vào Tiến Độ Sản Xuất"
          >
            <AppIcon name="clipboard-list" size="14" />
            <span>{{ isAddingToProduction ? 'Đang thêm...' : 'Đưa Vào Sản Xuất' }}</span>
          </button>

          <router-link
            :to="'/tro-ly-noi-dung?video=' + video.id"
            class="btn-hero-action btn-secondary-action"
            title="Phân tích nội dung AI"
          >
            <AppIcon name="sparkles" size="14" />
            <span>Phân Tích AI</span>
          </router-link>

          <router-link
            :to="'/videos/' + video.id"
            class="btn-hero-action btn-secondary-action"
            title="Xem chi tiết phân tích video"
          >
            <AppIcon name="info" size="14" />
            <span>Chi Tiết</span>
          </router-link>

          <a
            :href="video.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-hero-action btn-yt-action"
            title="Mở video trên YouTube"
          >
            <AppIcon name="external" size="14" />
            <span>YouTube</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import OpportunityStatusBadge from '@/components/opportunity/OpportunityStatusBadge.vue';
import OpportunitySignalReason from '@/components/opportunity/OpportunitySignalReason.vue';
import type { OpportunityVideo } from '@/types/opportunity';

const props = defineProps<{
  video: OpportunityVideo;
  isAddingToProduction?: boolean;
}>();

defineEmits<{
  (e: 'add-production', video: OpportunityVideo): void;
}>();

const avatarError = ref(false);

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
.opportunity-featured-hero {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: var(--shadow-sm, 0 4px 14px rgba(30, 60, 90, 0.05));
  margin-bottom: 24px;
}

.hero-top-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.featured-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.1em;
  color: var(--primary, #2563EB);
  text-transform: uppercase;
}

[data-theme="dark"] .featured-kicker {
  color: #38BDF8;
}

.pulse-point {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2563EB;
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.6);
}

[data-theme="dark"] .pulse-point {
  background: #38BDF8;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
}

.hero-grid-layout {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 24px;
  align-items: flex-start;
}

.hero-media-column {
  width: 100%;
}

.hero-info-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Channel Row */
.channel-identity-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.channel-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #EFF6FF;
  color: #2563EB;
  font-size: 10px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.channel-text-meta {
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

.channel-handle {
  color: var(--text-muted);
}

.meta-dot {
  color: var(--text-muted);
}

.video-age {
  color: var(--text-muted);
}

/* Title */
.video-title {
  font-size: 17px;
  font-weight: 700;
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
  transition: color 0.15s ease;
}

.title-link:hover {
  color: var(--primary, #2563EB);
}

/* Metric cluster */
.hero-metric-cluster {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
  flex-wrap: wrap;
}

.hero-vph-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-vph-val {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}

.hero-vph-lbl {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.hero-micro-metrics {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.micro-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.micro-val {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
}

.micro-lbl {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
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

/* Actions Row */
.hero-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.btn-hero-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary-action {
  background: var(--primary, #2563EB);
  color: #FFFFFF;
  border: 1px solid var(--primary, #2563EB);
}

.btn-primary-action:hover:not(:disabled) {
  background: #1D4ED8;
  transform: translateY(-1px);
}

.btn-secondary-action {
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-primary);
  border: 1px solid var(--border, #E3EBF3);
}

.btn-secondary-action:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-yt-action {
  background: var(--surface, #FFFFFF);
  color: var(--text-secondary);
  border: 1px solid var(--border, #E3EBF3);
}

.btn-yt-action:hover {
  color: #DC2626;
  border-color: #FECACA;
  background: #FEF2F2;
}

@media (max-width: 1024px) {
  .hero-grid-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
