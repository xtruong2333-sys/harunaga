<template>
  <div class="selected-source-panel">
    <!-- Empty Workspace when no video is selected -->
    <div v-if="!video" class="empty-workspace">
      <div class="empty-icon-wrap">
        <AppIcon name="sparkles" :size="36" class="empty-icon" />
      </div>
      <h3 class="empty-title">Chọn một video để bắt đầu phân tích</h3>
      <p class="empty-desc">
        Chọn một video đối thủ từ danh sách bên trái để kiểm tra tốc độ tăng trưởng, lượt xem và tạo hướng nội dung phái sinh độc lập.
      </p>
    </div>

    <!-- Active Source Panel -->
    <div v-else class="hero-source-card">
      <div class="source-top-section">
        <!-- Thumbnail -->
        <div class="source-thumb-col">
          <VideoThumbnail
            :key="video.id"
            :src="video.thumbnail_url"
            :youtube-video-id="video.youtube_video_id || undefined"
            :detail-url="`/videos/${video.id}`"
            :alt="video.title"
            ratio="16-9"
            class="hero-thumbnail"
          />
        </div>

        <!-- Meta Info -->
        <div class="source-meta-col">
          <div class="source-channel-tag">
            <AppIcon name="tv" :size="14" />
            <span>{{ video.channel_name }}</span>
          </div>

          <h2 class="source-title">
            <router-link :to="'/videos/' + video.id" class="title-link" :title="video.title">
              {{ video.title }}
            </router-link>
          </h2>

          <div class="source-published">
            <AppIcon name="calendar" :size="13" />
            <span>Xuất bản: {{ formatDate(video.published_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Metric Strip: 4 clean boxes -->
      <div class="source-metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Lượt xem hiện tại</span>
          <span class="metric-value font-mono">
            {{ formatNullableNumber(video.latest_view_count) }}
          </span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Tốc độ tăng trưởng</span>
          <span class="metric-value font-mono" :class="getVphClass(video.latest_measured_vph, video.alert_vph_threshold)">
            {{ formatVph(video.latest_measured_vph) }}
          </span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Chênh lệch 2 lần quét gần nhất</span>
          <span class="metric-value font-mono" :class="getDeltaClass(video.view_delta)">
            {{ formatViewDelta(video.view_delta) }}
          </span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Ngưỡng cảnh báo</span>
          <span class="metric-value font-mono text-muted">
            {{ formatThreshold(video.alert_vph_threshold) }}
          </span>
        </div>
      </div>

      <!-- Action Controls Hierarchy -->
      <div class="source-actions-bar">
        <!-- Primary: Phân Tích Nội Dung -->
        <button
          type="button"
          class="btn btn-primary btn-analyze"
          :disabled="isAnalyzing"
          @click="$emit('analyze')"
        >
          <span v-if="isAnalyzing" class="spinner-sm"></span>
          <AppIcon v-else name="sparkles" :size="17" />
          <span>{{ isAnalyzing ? 'Đang phân tích nội dung...' : 'Phân Tích Nội Dung' }}</span>
        </button>

        <!-- Secondary: Đưa Vào Sản Xuất -->
        <button
          type="button"
          class="btn btn-secondary btn-production"
          :disabled="isAddingToProduction"
          title="Đưa video này vào Tiến Độ Sản Xuất"
          @click="$emit('add-to-production')"
        >
          <span v-if="isAddingToProduction" class="spinner-sm"></span>
          <AppIcon v-else name="clipboard-list" :size="16" />
          <span>{{ isAddingToProduction ? 'Đang thêm...' : 'Đưa Vào Sản Xuất' }}</span>
        </button>

        <!-- Tertiary: Xem Chi Tiết Video -->
        <router-link
          :to="'/videos/' + video.id"
          class="btn btn-ghost btn-detail"
        >
          <AppIcon name="activity" :size="15" />
          <span>Xem chi tiết</span>
        </router-link>

        <!-- YouTube Link: Only rendered if youtube_video_id is non-empty -->
        <a
          v-if="video.youtube_video_id"
          :href="'https://www.youtube.com/watch?v=' + video.youtube_video_id"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost yt-link"
          title="Mở video trên YouTube"
        >
          <AppIcon name="external" :size="14" />
          <span>Mở YouTube</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import type { AiVideoOption } from '@/types/ai-content';
import {
  formatNullableNumber,
  formatVph,
  formatViewDelta,
} from '@/services/ai-content-service';

defineProps<{
  video: AiVideoOption | null;
  isAnalyzing: boolean;
  isAddingToProduction: boolean;
}>();

defineEmits<{
  (e: 'analyze'): void;
  (e: 'add-to-production'): void;
}>();

function formatThreshold(th: number | null | undefined): string {
  if (th === null || th === undefined || isNaN(Number(th))) return '—';
  return `${Number(th).toLocaleString('vi-VN')} VPH`;
}

function getVphClass(vph: number | null, threshold: number | null) {
  if (vph === null || vph === undefined) return 'text-muted';
  if (threshold !== null && threshold > 0 && vph >= threshold) return 'text-alert-vph';
  if (vph > 0) return 'text-growth';
  return 'text-muted';
}

function getDeltaClass(delta: number | null | undefined) {
  if (delta === null || delta === undefined) return 'text-muted';
  if (delta > 0) return 'text-growth';
  if (delta < 0) return 'text-alert-vph';
  return 'text-muted';
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Không rõ';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.selected-source-panel {
  height: 100%;
}

.empty-workspace {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: var(--surface, #ffffff);
  border: 1px dashed var(--border, #cbd5e1);
  border-radius: 14px;
  padding: 40px 24px;
  text-align: center;
}

[data-theme="dark"] .empty-workspace {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.7);
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

[data-theme="dark"] .empty-icon-wrap {
  background: rgba(37, 99, 235, 0.18);
  color: #60a5fa;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0 0 8px;
}

.empty-desc {
  max-width: 440px;
  font-size: 13.5px;
  color: var(--text-secondary, #64748b);
  line-height: 1.55;
  margin: 0;
}

.hero-source-card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .hero-source-card {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.7);
}

.source-top-section {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
  align-items: start;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .source-top-section {
    grid-template-columns: 1fr;
  }
}

.source-thumb-col {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

.hero-thumbnail {
  width: 100%;
}

.source-meta-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-channel-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  background: var(--bg-inset, #f1f5f9);
  padding: 4px 10px;
  border-radius: 6px;
  width: fit-content;
}

[data-theme="dark"] .source-channel-tag {
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
}

.source-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--text-primary, #0f172a);
}

.title-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.15s ease;
}

.title-link:hover {
  color: #2563eb;
}

.source-published {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
}

.source-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .source-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .source-metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

[data-theme="dark"] .metric-card {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.7);
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.metric-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.text-growth {
  color: #059669 !important;
}

.text-alert-vph {
  color: #dc2626 !important;
}

.text-muted {
  color: var(--text-muted, #94a3b8) !important;
}

.source-actions-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--border, #e2e8f0);
}

[data-theme="dark"] .source-actions-bar {
  border-color: rgba(51, 65, 85, 0.7);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 9px;
  padding: 10px 18px;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-inset, #f1f5f9);
  color: var(--text-primary, #0f172a);
  border-color: var(--border, #cbd5e1);
}

[data-theme="dark"] .btn-secondary {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(71, 85, 105, 0.8);
  color: #f8fafc;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

[data-theme="dark"] .btn-secondary:hover:not(:disabled) {
  background: rgba(51, 65, 85, 0.8);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary, #475569);
  border-color: transparent;
}

.btn-ghost:hover {
  background: rgba(241, 245, 249, 0.7);
  color: var(--text-primary, #0f172a);
}

[data-theme="dark"] .btn-ghost:hover {
  background: rgba(30, 41, 59, 0.5);
  color: #f8fafc;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn-secondary .spinner-sm {
  border-color: rgba(15, 23, 42, 0.2);
  border-top-color: #0f172a;
}

[data-theme="dark"] .btn-secondary .spinner-sm {
  border-color: rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .btn:active {
    transform: none !important;
  }
}
</style>
