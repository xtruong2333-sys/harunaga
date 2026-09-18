<template>
  <div class="source-explorer">
    <div class="explorer-header">
      <div class="header-titles">
        <h3 class="explorer-title">Chọn nguồn phân tích</h3>
        <span class="explorer-subtitle">Đang hiển thị {{ filteredVideos.length }} video</span>
      </div>
    </div>

    <!-- Search Input -->
    <div class="search-box">
      <AppIcon name="search" :size="16" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Tìm video hoặc kênh đối thủ…"
        class="search-input"
        aria-label="Tìm video hoặc kênh đối thủ"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="clear-search-btn"
        aria-label="Xóa tìm kiếm"
        @click="searchQuery = ''"
      >
        <AppIcon name="x" :size="14" />
      </button>
    </div>

    <!-- Video List Container -->
    <div class="source-list-wrap">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="skeleton-list">
        <div v-for="i in 5" :key="i" class="skeleton-item">
          <div class="skeleton-thumb"></div>
          <div class="skeleton-meta">
            <div class="skeleton-line sm"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line xs"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredVideos.length === 0" class="empty-matches">
        <AppIcon name="search" :size="24" class="empty-icon" />
        <p class="empty-text">
          {{ searchQuery ? 'Không tìm thấy video nào phù hợp với từ khóa.' : 'Chưa có dữ liệu video để phân tích.' }}
        </p>
      </div>

      <!-- Items List -->
      <div v-else class="source-items-list" role="listbox">
        <div
          v-for="video in filteredVideos"
          :key="video.id"
          class="source-item"
          :class="{ 'is-selected': video.id === selectedId }"
          role="option"
          :aria-selected="video.id === selectedId"
          tabindex="0"
          @click="$emit('select', video.id)"
          @keydown.enter.prevent="$emit('select', video.id)"
          @keydown.space.prevent="$emit('select', video.id)"
        >
          <div class="item-thumb-wrapper">
            <VideoThumbnail
              :src="video.thumbnail_url"
              :youtube-video-id="video.youtube_video_id || undefined"
              :alt="video.title"
              ratio="16-9"
              class="source-thumb"
            />
          </div>
          <div class="item-info">
            <span class="item-channel" :title="video.channel_name">{{ video.channel_name }}</span>
            <h4 class="item-title" :title="video.title">{{ video.title }}</h4>
            <div class="item-footer">
              <span class="vph-pill" :class="getVphClass(video.latest_measured_vph, video.alert_vph_threshold)">
                <AppIcon name="zap" :size="10" />
                <span>{{ formatVph(video.latest_measured_vph) }}</span>
              </span>
              <span class="item-date">{{ formatTimeAgo(video.published_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import type { AiVideoOption } from '@/types/ai-content';
import { formatVph } from '@/services/ai-content-service';

const props = defineProps<{
  videos: AiVideoOption[];
  selectedId: string | null;
  loading: boolean;
}>();

defineEmits<{
  (e: 'select', id: string): void;
}>();

const searchQuery = ref('');

const filteredVideos = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.videos;
  return props.videos.filter(
    v => v.title.toLowerCase().includes(q) || v.channel_name.toLowerCase().includes(q)
  );
});

function getVphClass(vph: number | null, threshold: number | null) {
  if (vph === null || vph === undefined) return 'is-muted';
  if (threshold !== null && threshold > 0 && vph >= threshold) return 'is-alert';
  if (vph > 0) return 'is-growth';
  return 'is-neutral';
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return '—';
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return '—';
  }
}
</script>

<style scoped>
.source-explorer {
  display: flex;
  flex-direction: column;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  overflow: hidden;
  height: 100%;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .source-explorer {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.7);
}

.explorer-header {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border, #e2e8f0);
}

[data-theme="dark"] .explorer-header {
  border-color: rgba(51, 65, 85, 0.7);
}

.header-titles {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.explorer-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  letter-spacing: -0.01em;
}

.explorer-subtitle {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  font-weight: 500;
}

.search-box {
  position: relative;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  background: var(--bg-inset, #f8fafc);
  display: flex;
  align-items: center;
}

[data-theme="dark"] .search-box {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.7);
}

.search-icon {
  position: absolute;
  left: 28px;
  color: var(--text-muted, #94a3b8);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 34px 9px 36px;
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 8px;
  background: var(--surface, #ffffff);
  color: var(--text-primary, #0f172a);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

[data-theme="dark"] .search-input {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(71, 85, 105, 0.8);
  color: #f8fafc;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 26px;
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
  border-radius: 4px;
}

.clear-search-btn:hover {
  color: var(--text-primary, #0f172a);
}

.source-list-wrap {
  flex: 1;
  overflow-y: auto;
  max-height: 650px;
  min-height: 380px;
}

.source-items-list {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 6px;
}

.source-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.source-item:hover {
  background: rgba(241, 245, 249, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
}

[data-theme="dark"] .source-item:hover {
  background: rgba(30, 41, 59, 0.5);
}

.source-item.is-selected {
  background: rgba(37, 99, 235, 0.06);
  border-color: rgba(37, 99, 235, 0.4);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}

[data-theme="dark"] .source-item.is-selected {
  background: rgba(37, 99, 235, 0.15);
  border-color: rgba(96, 165, 250, 0.5);
}

.item-thumb-wrapper {
  width: 106px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
}

.source-thumb {
  width: 100%;
  transition: transform 0.2s ease;
}

.source-item:hover .source-thumb {
  transform: scale(1.03);
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
}

.item-channel {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-title {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--text-primary, #0f172a);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 2px;
}

.vph-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.vph-pill.is-growth {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.vph-pill.is-alert {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.vph-pill.is-neutral {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.vph-pill.is-muted {
  background: transparent;
  color: var(--text-muted, #94a3b8);
  font-weight: 400;
}

.item-date {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
}

.empty-matches {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-muted, #94a3b8);
  gap: 12px;
}

.empty-icon {
  opacity: 0.5;
}

.empty-text {
  font-size: 13px;
  margin: 0;
}

.skeleton-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-item {
  display: flex;
  gap: 12px;
  padding: 8px;
}

.skeleton-thumb {
  width: 106px;
  height: 60px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

[data-theme="dark"] .skeleton-thumb {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
}

.skeleton-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: #e2e8f0;
  width: 90%;
}

[data-theme="dark"] .skeleton-line {
  background: #334155;
}

.skeleton-line.sm {
  width: 40%;
}

.skeleton-line.xs {
  width: 60%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .source-item, .source-thumb {
    transition: none !important;
    transform: none !important;
  }
  .skeleton-thumb {
    animation: none !important;
  }
}
</style>
