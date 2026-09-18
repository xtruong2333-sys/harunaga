<template>
  <div class="growth-radar-hero surface-card">
    <div class="hero-top-badge-row">
      <div class="featured-kicker">
        <span class="pulse-point"></span>
        <span>{{ isVphSelection ? 'TÍN HIỆU VPH CAO NHẤT' : 'TÍN HIỆU NỔI BẬT' }}</span>
      </div>
      <div class="badge-cluster">
        <GrowthStatusBadge
          type="rising"
          :measured-vph="video.latestMeasuredVph"
        />
        <GrowthStatusBadge
          v-if="video.alert && video.alert.status === 'sent'"
          type="alert"
          alert-status="sent"
        />
      </div>
    </div>

    <div class="hero-grid-layout">
      <!-- Left: 16:9 Media Frame -->
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

      <!-- Right: Analytical Metrics & Facts -->
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
            <span class="video-age">{{ formatVideoAge(video.publishedAt) }}</span>
          </div>
        </div>

        <!-- Title -->
        <h2 class="video-title">
          <router-link :to="'/videos/' + video.id" class="title-link" :title="video.title">
            {{ video.title }}
          </router-link>
        </h2>

        <!-- VPH Hero & Micro Metrics Cluster -->
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
              <span class="micro-val mono">{{ video.channel.alertVphThreshold !== null ? formatNumber(video.channel.alertVphThreshold) + ' VPH' : '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Facts Box -->
        <div class="growth-facts-box">
          <div class="facts-header">
            <AppIcon name="zap" size="13" class="text-accent" />
            <span>Tín hiệu quan sát</span>
          </div>
          <ul class="facts-list">
            <li class="fact-item">
              <span class="bullet-dot">•</span>
              <span>Tốc độ đo được: <strong>{{ formattedVph }}</strong></span>
            </li>
            <li v-if="video.latestDeltaViews !== null && video.latestDeltaViews !== undefined" class="fact-item">
              <span class="bullet-dot">•</span>
              <span>Tăng gần nhất: <strong>+{{ formatNumber(video.latestDeltaViews) }} lượt xem</strong></span>
            </li>
            <li v-if="video.isOverThreshold && video.channel.alertVphThreshold !== null" class="fact-item">
              <span class="bullet-dot text-positive">•</span>
              <span>Vượt ngưỡng cảnh báo kênh (Ngưỡng: <strong>{{ formatNumber(video.channel.alertVphThreshold) }} VPH</strong>)</span>
            </li>
            <li v-if="video.alert && video.alert.status === 'sent'" class="fact-item">
              <span class="bullet-dot text-positive">•</span>
              <span>Trạng thái cảnh báo: <strong>Đã phát cảnh báo tự động</strong></span>
            </li>
          </ul>
        </div>

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
            title="Xem chi tiết video"
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
import GrowthStatusBadge from '@/components/growth/GrowthStatusBadge.vue';
import type { VideoListItem } from '@/types/video';

const props = withDefaults(
  defineProps<{
    video: VideoListItem;
    isAddingToProduction?: boolean;
    isVphSelection?: boolean;
  }>(),
  {
    isVphSelection: true,
  }
);

defineEmits<{
  (e: 'add-production', video: VideoListItem): void;
}>();

const avatarError = ref(false);

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
.growth-radar-hero {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 16px;
  box-shadow: var(--shadow-sm, 0 4px 20px rgba(30, 60, 90, 0.05));
  margin-bottom: 24px;
}

.hero-top-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.featured-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--primary, #2563EB);
  text-transform: uppercase;
}

.pulse-point {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563EB;
  box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6);
  animation: pulsePoint 2s infinite;
}

@keyframes pulsePoint {
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6); }
  70% { box-shadow: 0 0 0 6px rgba(37, 99, 235, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
}

.badge-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-grid-layout {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 24px;
  align-items: start;
}

.hero-media-column {
  width: 100%;
}

.hero-info-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.channel-identity-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.channel-avatar-link {
  display: block;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-inset, #F1F5F9);
}

.channel-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--primary, #2563EB);
  background: #EFF6FF;
}

.channel-text-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-name {
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
}

.channel-name:hover {
  color: var(--primary, #2563EB);
}

.channel-handle, .video-age {
  color: var(--text-secondary);
  font-size: 12px;
}

.meta-dot {
  color: var(--text-muted);
}

.video-title {
  font-size: 18px;
  font-weight: 750;
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

/* Metric Cluster */
.hero-metric-cluster {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: center;
  padding: 14px 18px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
}

.hero-vph-box {
  display: flex;
  flex-direction: column;
  padding-right: 16px;
  border-right: 1px solid var(--border, #E3EBF3);
}

.hero-vph-val {
  font-size: 26px;
  font-weight: 850;
  line-height: 1;
}

.hero-vph-lbl {
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 4px;
}

.hero-micro-metrics {
  display: flex;
  justify-content: space-around;
  gap: 12px;
}

.micro-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.micro-lbl {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.micro-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Facts Box */
.growth-facts-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
}

.facts-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.06em;
  color: var(--primary, #2563EB);
  text-transform: uppercase;
}

.facts-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fact-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.bullet-dot {
  color: var(--primary, #2563EB);
  font-weight: 800;
}

/* Action Buttons */
.hero-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.btn-hero-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.btn-primary-action {
  background: var(--primary, #2563EB);
  color: #FFFFFF;
}

.btn-primary-action:hover:not(:disabled) {
  background: #1D4ED8;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.btn-primary-action:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-secondary-action {
  background: var(--surface, #FFFFFF);
  color: var(--text-primary);
  border-color: var(--border, #E3EBF3);
}

.btn-secondary-action:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-yt-action {
  background: var(--surface, #FFFFFF);
  color: var(--text-secondary);
  border-color: var(--border, #E3EBF3);
}

.btn-yt-action:hover {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}

.text-accent { color: #0284C7; }
.text-positive { color: #059669; }

@media (max-width: 1024px) {
  .hero-grid-layout {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}

@media (max-width: 640px) {
  .growth-radar-hero {
    padding: 16px;
  }
  .hero-metric-cluster {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .hero-vph-box {
    border-right: none;
    padding-right: 0;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border, #E3EBF3);
  }
  .hero-actions-row {
    flex-direction: column;
  }
  .btn-hero-action {
    justify-content: center;
    width: 100%;
  }
}
</style>
