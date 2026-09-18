<template>
  <div class="growth-radar-stream">
    <div class="stream-header">
      <h3 class="stream-title">DÒNG TÍN HIỆU TIẾP THEO ({{ candidates.length }})</h3>
      <span class="stream-hint">Nhấp vào dòng để xem chi tiết hoặc đổi tiêu điểm nổi bật</span>
    </div>

    <div class="stream-list">
      <article
        v-for="v in candidates"
        :key="v.id"
        class="stream-row surface-card"
        :class="{ 'is-selected': v.id === activeId }"
        @click="$emit('select-featured', v)"
      >
        <!-- Thumbnail mini -->
        <div class="stream-thumb-wrap">
          <VideoThumbnail
            :src="v.thumbnailUrl"
            :alt="v.title"
            ratio="16-9"
            :show-overlay-actions="false"
            :vph-badge="v.latestMeasuredVph"
          />
        </div>

        <!-- Info Main -->
        <div class="stream-info-wrap">
          <div class="stream-channel-line">
            <span class="stream-channel-name">{{ v.channel.name }}</span>
            <span class="meta-dot">•</span>
            <span class="stream-time">{{ formatVideoAge(v.publishedAt) }}</span>
            <GrowthStatusBadge
              v-if="v.alert && v.alert.status === 'sent'"
              type="alert"
              alert-status="sent"
            />
          </div>

          <h4 class="stream-video-title" :title="v.title">
            {{ v.title }}
          </h4>
        </div>

        <!-- Metrics Column -->
        <div class="stream-metrics-wrap">
          <div class="stream-metric-cell">
            <span class="m-lbl">VPH:</span>
            <span class="m-val mono text-accent">{{ formatVph(v.latestMeasuredVph) }}</span>
          </div>
          <div class="stream-metric-cell">
            <span class="m-lbl">Lượt xem:</span>
            <span class="m-val mono">{{ formatNumber(v.latestViewCount) }}</span>
          </div>
          <div class="stream-metric-cell">
            <span class="m-lbl">Tăng gần nhất:</span>
            <span class="m-val mono" :class="{ 'text-positive': v.latestDeltaViews && v.latestDeltaViews > 0 }">
              {{ formatDelta(v.latestDeltaViews) }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="stream-actions-wrap" @click.stop>
          <button
            type="button"
            class="btn-s-action btn-prod"
            :disabled="isAddingToProduction"
            title="Đưa vào Sản Xuất"
            @click="$emit('add-production', v)"
          >
            <AppIcon name="clipboard-list" size="13" />
          </button>
          <router-link :to="'/tro-ly-noi-dung?video=' + v.id" class="btn-s-action" title="Phân tích AI">
            <AppIcon name="sparkles" size="13" />
          </router-link>
          <router-link :to="'/videos/' + v.id" class="btn-s-action" title="Xem chi tiết">
            <AppIcon name="info" size="13" />
          </router-link>
          <a
            :href="v.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-s-action btn-yt"
            title="Mở YouTube"
          >
            <AppIcon name="external" size="13" />
          </a>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import GrowthStatusBadge from '@/components/growth/GrowthStatusBadge.vue';
import type { VideoListItem } from '@/types/video';

defineProps<{
  candidates: VideoListItem[];
  activeId?: string;
  isAddingToProduction?: boolean;
}>();

defineEmits<{
  (e: 'select-featured', video: VideoListItem): void;
  (e: 'add-production', video: VideoListItem): void;
}>();

function formatVph(vph: number | null | undefined): string {
  if (vph === null || vph === undefined) return '—';
  if (vph === 0) return '0 VPH';
  return `${formatNumber(Math.round(vph))} VPH`;
}

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
  if (minutes < 60) return `${minutes}p trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  return `${days}d trước`;
}
</script>

<style scoped>
.growth-radar-stream {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stream-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.stream-title {
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin: 0;
}

.stream-hint {
  font-size: 11.5px;
  color: var(--text-muted);
}

.stream-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stream-row {
  display: grid;
  grid-template-columns: 190px 1fr auto auto;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  cursor: pointer;
  transition: all 0.15s ease;
}

.stream-row:hover {
  border-color: var(--primary, #2563EB);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(30, 60, 90, 0.06);
}

.stream-row.is-selected {
  border-color: var(--primary, #2563EB);
  background: #F8FAFC;
}

.stream-thumb-wrap {
  width: 100%;
}

.stream-info-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.stream-channel-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.stream-channel-name {
  font-weight: 700;
  color: var(--text-primary);
}

.stream-time {
  color: var(--text-secondary);
}

.stream-video-title {
  font-size: 14px;
  font-weight: 650;
  color: var(--text-primary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}

.stream-metrics-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 150px;
}

.stream-metric-cell {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.m-lbl {
  color: var(--text-muted);
}

.m-val {
  font-weight: 700;
}

.stream-actions-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-s-action {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-secondary);
  border: 1px solid var(--border, #E3EBF3);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-s-action:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-prod:hover {
  background: #2563EB;
  color: #FFFFFF;
}

.btn-yt:hover {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}

.text-accent { color: #0284C7; }
.text-positive { color: #059669; }

@media (max-width: 1024px) {
  .stream-row {
    grid-template-columns: 140px 1fr;
    gap: 12px;
  }
  .stream-metrics-wrap {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: space-between;
  }
  .stream-actions-wrap {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>
