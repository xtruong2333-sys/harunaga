<template>
  <div class="recent-video-gallery-grid">
    <article
      v-for="v in videos"
      :key="v.id"
      class="gallery-item-card surface-card"
    >
      <router-link :to="'/videos/' + v.id" class="gallery-thumb-link" :title="v.title">
        <VideoThumbnail
          :src="v.thumbnailUrl"
          :alt="v.title"
          ratio="16-9"
          :fresh-badge="getFreshBadge(v.publishedAt)"
          :vph-badge="v.latestMeasuredVph"
          :show-overlay-actions="false"
        />
      </router-link>

      <div class="gallery-meta">
        <h4 class="gallery-title">
          <router-link :to="'/videos/' + v.id" class="gallery-title-link" :title="v.title">
            {{ v.title }}
          </router-link>
        </h4>
        <div class="gallery-channel-row">
          <router-link :to="'/kenh-theo-doi/' + v.channelId" class="gallery-channel-name">
            {{ v.channelName }}
          </router-link>
          <span class="gallery-time">{{ formatVideoAge(v.publishedAt) }}</span>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import { formatVideoAge, getFreshBadge } from '@/services/new-videos-service';
import type { NewVideoItem } from '@/types/new-videos';

defineProps<{
  videos: NewVideoItem[];
}>();
</script>

<style scoped>
.recent-video-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.gallery-item-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(30, 60, 90, 0.04));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.gallery-item-card:hover {
  transform: translateY(-2px);
  border-color: #BFDBFE;
  box-shadow: var(--shadow-md, 0 6px 18px rgba(37, 99, 235, 0.08));
}

[data-theme="dark"] .gallery-item-card:hover {
  border-color: rgba(56, 189, 248, 0.3);
}

.gallery-thumb-link {
  display: block;
}

.gallery-meta {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  gap: 4px;
}

.gallery-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-title-link {
  color: var(--text-primary);
  text-decoration: none;
}

.gallery-title-link:hover {
  color: var(--primary, #2563EB);
}

.gallery-channel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-muted);
}

.gallery-channel-name {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-channel-name:hover {
  color: var(--primary, #2563EB);
}

.gallery-time {
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
