<template>
  <div class="growth-compact-grid">
    <article
      v-for="v in videos"
      :key="v.id"
      class="compact-card surface-card"
    >
      <div class="compact-thumb-wrap">
        <VideoThumbnail
          :src="v.thumbnailUrl"
          :alt="v.title"
          ratio="16-9"
          :detail-url="'/videos/' + v.id"
          :vph-badge="v.latestMeasuredVph"
        />
      </div>

      <div class="compact-body">
        <div class="compact-channel-row">
          <span class="compact-channel-name">{{ v.channel.name }}</span>
          <span class="meta-dot">•</span>
          <span class="compact-age">{{ formatVideoAge(v.publishedAt) }}</span>
        </div>

        <h4 class="compact-title" :title="v.title">
          <router-link :to="'/videos/' + v.id" class="compact-title-link">
            {{ v.title }}
          </router-link>
        </h4>

        <div class="compact-metrics-row">
          <span class="c-vph mono text-accent">{{ formatVph(v.latestMeasuredVph) }}</span>
          <span v-if="v.latestDeltaViews" class="c-delta mono text-positive">+{{ formatNumber(v.latestDeltaViews) }}</span>
          <GrowthStatusBadge
            v-if="v.alert && v.alert.status === 'sent'"
            type="alert"
            alert-status="sent"
          />
        </div>

        <div class="compact-actions-row">
          <button
            type="button"
            class="c-action-btn c-prod-btn"
            :disabled="isAddingToProduction"
            title="Sản Xuất"
            @click="$emit('add-production', v)"
          >
            <AppIcon name="clipboard-list" size="12" />
            <span>Sản Xuất</span>
          </button>
          <router-link :to="'/tro-ly-noi-dung?video=' + v.id" class="c-action-btn" title="AI">
            <AppIcon name="sparkles" size="12" />
          </router-link>
          <router-link :to="'/videos/' + v.id" class="c-action-btn" title="Chi Tiết">
            <AppIcon name="info" size="12" />
          </router-link>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import GrowthStatusBadge from '@/components/growth/GrowthStatusBadge.vue';
import type { VideoListItem } from '@/types/video';

defineProps<{
  videos: VideoListItem[];
  isAddingToProduction?: boolean;
}>();

defineEmits<{
  (e: 'add-production', video: VideoListItem): void;
}>();

function formatVph(vph: number | null | undefined): string {
  if (vph === null || vph === undefined) return '—';
  if (vph === 0) return '0 VPH';
  return `${formatNumber(Math.round(vph))} VPH`;
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
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
</script>

<style scoped>
.growth-compact-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.compact-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 1px 4px rgba(30, 60, 90, 0.04));
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.compact-card:hover {
  transform: translateY(-2px);
  border-color: #BFDBFE;
  box-shadow: 0 4px 12px rgba(30, 60, 90, 0.08);
}

.compact-thumb-wrap {
  width: 100%;
}

.compact-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  flex: 1;
}

.compact-channel-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
}

.compact-channel-name {
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-age {
  color: var(--text-secondary);
}

.meta-dot {
  color: var(--text-muted);
}

.compact-title {
  font-size: 13px;
  font-weight: 650;
  line-height: 1.3;
  margin: 0;
  flex: 1;
}

.compact-title-link {
  color: var(--text-primary);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compact-title-link:hover {
  color: var(--primary, #2563EB);
}

.compact-metrics-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 2px;
}

.c-vph {
  font-size: 12px;
  font-weight: 750;
}

.c-delta {
  font-size: 11px;
  font-weight: 700;
}

.compact-actions-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 4px;
}

.c-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--bg-inset, #F8FAFC);
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.c-action-btn:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.c-prod-btn {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
  flex: 1;
}

.c-prod-btn:hover:not(:disabled) {
  background: var(--primary, #2563EB);
  color: #FFFFFF;
}

.text-accent { color: #0284C7; }
.text-positive { color: #059669; }

@media (max-width: 1280px) {
  .growth-compact-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .growth-compact-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .growth-compact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
