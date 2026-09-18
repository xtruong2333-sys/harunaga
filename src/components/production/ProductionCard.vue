<template>
  <article
    class="production-card"
    :class="[
      `priority-${item.priority}`,
      `status-${item.status}`,
      { 'is-busy': isBusy }
    ]"
  >
    <!-- Busy Loading Overlay -->
    <div v-if="isBusy" class="card-busy-overlay" aria-live="polite">
      <AppIcon name="refresh" :size="20" class="spin-anim" />
      <span>Đang cập nhật...</span>
    </div>

    <!-- 1. Thumbnail Header -->
    <div class="card-thumb-wrap">
      <VideoThumbnail
        v-if="item.sourceVideo"
        :src="item.sourceVideo.thumbnailUrl"
        :youtube-video-id="item.sourceVideo.youtubeVideoId || undefined"
        :detail-url="`/videos/${item.sourceVideo.id}`"
        :alt="item.sourceVideo.title"
        ratio="16-9"
        class="card-thumb"
      />
      <div v-else class="source-missing-placeholder">
        <AppIcon name="alert" :size="22" class="missing-icon" />
        <span class="missing-text">Video nguồn không còn trong hệ thống.</span>
      </div>

      <!-- Priority Badge (Top-right) -->
      <span class="priority-tag" :class="`priority-${item.priority}`">
        {{ PRIORITY_LABELS[item.priority] }}
      </span>
    </div>

    <!-- 2. Content Body -->
    <div class="card-content-body">
      <!-- Channel & Time Meta -->
      <div class="card-meta-row">
        <span v-if="item.sourceVideo" class="channel-name-tag" :title="item.sourceVideo.channelName">
          <AppIcon name="tv" :size="13" />
          <span>{{ item.sourceVideo.channelName }}</span>
        </span>
        <span class="updated-time font-mono" :title="`Cập nhật: ${formatExactDate(item.updatedAt)}`">
          {{ formatRelativeTime(item.updatedAt) }}
        </span>
      </div>

      <!-- Working Title (Main) -->
      <h3 class="working-title" :title="displayTitle">
        {{ displayTitle }}
      </h3>

      <!-- Source Video Reference -->
      <div v-if="item.sourceVideo" class="source-video-reference">
        <span class="source-ref-label">Gốc:</span>
        <a
          v-if="item.sourceVideo.url"
          :href="item.sourceVideo.url"
          target="_blank"
          rel="noopener noreferrer"
          class="source-video-link"
          :title="item.sourceVideo.title"
        >
          <span>{{ item.sourceVideo.title }}</span>
          <AppIcon name="external" :size="11" class="ext-icon" />
        </a>
        <span v-else class="source-video-static" :title="item.sourceVideo.title">
          {{ item.sourceVideo.title }}
        </span>
      </div>

      <!-- Notes Preview -->
      <p v-if="item.notes && item.notes.trim()" class="card-notes-preview">
        {{ item.notes }}
      </p>

      <!-- Published Info Band -->
      <div v-if="item.status === 'published'" class="published-info-band">
        <div class="published-tag">
          <AppIcon name="check-circle" :size="13" />
          <span>Đã xuất bản</span>
        </div>
        <div v-if="item.publishedAt" class="published-date font-mono">
          {{ formatExactDate(item.publishedAt) }}
        </div>
        <a
          v-if="item.publishedUrl"
          :href="item.publishedUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="published-link-btn"
          title="Mở video đã xuất bản"
        >
          <span>Xem bài đăng</span>
          <AppIcon name="external" :size="12" />
        </a>
      </div>
    </div>

    <!-- 3. Card Footer: Stage Selector & Actions -->
    <div class="card-footer-bar">
      <!-- Stage Control Select -->
      <div class="stage-control-wrap">
        <label :for="`stage-select-${item.id}`" class="sr-only">Giai đoạn</label>
        <select
          :id="`stage-select-${item.id}`"
          :value="item.status"
          class="stage-select-control"
          :disabled="isControlsDisabled"
          @change="onStageChange"
        >
          <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">
            {{ label }}
          </option>
        </select>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions-cluster">
        <!-- Edit Button -->
        <button
          type="button"
          class="action-btn edit-btn"
          title="Chỉnh sửa chi tiết"
          :disabled="isControlsDisabled"
          @click="$emit('edit', item)"
        >
          <AppIcon name="settings" :size="14" />
        </button>

        <!-- Archive or Restore Button -->
        <button
          v-if="item.status === 'archived'"
          type="button"
          class="action-btn restore-btn"
          title="Khôi phục về Ý tưởng"
          :disabled="isControlsDisabled"
          @click="$emit('restore', item.id)"
        >
          <AppIcon name="restore" :size="14" />
        </button>
        <button
          v-else
          type="button"
          class="action-btn archive-btn"
          title="Lưu trữ mục này"
          :disabled="isControlsDisabled"
          @click="$emit('archive', item.id)"
        >
          <AppIcon name="archive" :size="14" />
        </button>

        <!-- Delete Button -->
        <button
          type="button"
          class="action-btn delete-btn"
          title="Xóa khỏi Tiến Độ Sản Xuất"
          :disabled="isControlsDisabled"
          @click="$emit('delete', item)"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProductionItem, ProductionStatus } from '@/types/production';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types/production';
import { productionService } from '@/services/production-service';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  item: ProductionItem;
  isBusy: boolean;
  anyMutationBusy?: boolean;
  interactionsLocked?: boolean;
}>();

const isControlsDisabled = computed(() => {
  return props.isBusy || !!props.interactionsLocked || !!props.anyMutationBusy;
});

const emit = defineEmits<{
  (e: 'change-status', payload: { id: string; status: ProductionStatus }): void;
  (e: 'edit', item: ProductionItem): void;
  (e: 'archive', id: string): void;
  (e: 'restore', id: string): void;
  (e: 'delete', item: ProductionItem): void;
}>();

const displayTitle = computed(() => {
  return props.item.workingTitle || props.item.sourceVideo?.title || 'Chưa đặt tiêu đề';
});

function formatRelativeTime(iso: string | null): string {
  return productionService.formatRelativeTime(iso);
}

function formatExactDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
}

function onStageChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const newStatus = target.value as ProductionStatus;
  if (newStatus !== props.item.status) {
    // Reset select back to current item.status visually immediately
    // so it only changes upon true server response
    target.value = props.item.status;
    emit('change-status', { id: props.item.id, status: newStatus });
  }
}
</script>

<style scoped>
.production-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  box-shadow: 0 1px 3px rgba(15, 31, 53, 0.04);
}

.production-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 31, 53, 0.07);
  border-color: var(--border-hover, #cbd5e1);
}

.production-card.priority-high {
  border-left: 3px solid #ef4444;
}

.production-card.priority-normal {
  border-left: 3px solid #3b82f6;
}

.production-card.priority-low {
  border-left: 3px solid #94a3b8;
}

.card-busy-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  z-index: 10;
}

:global([data-theme='dark']) .card-busy-overlay {
  background: rgba(15, 23, 42, 0.85);
  color: #60a5fa;
}

.card-thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--bg-inset, #f1f5f9);
  overflow: hidden;
}

.card-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.production-card:hover .card-thumb {
  transform: scale(1.03);
}

.source-missing-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 14px;
  text-align: center;
  background: var(--bg-inset, #f8fafc);
  color: var(--text-tertiary, #94a3b8);
  gap: 6px;
}

.missing-icon {
  color: #f59e0b;
}

.missing-text {
  font-size: 0.75rem;
  line-height: 1.3;
}

.priority-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.priority-tag.priority-high {
  background: #ef4444;
  color: #ffffff;
}

.priority-tag.priority-normal {
  background: #2563eb;
  color: #ffffff;
}

.priority-tag.priority-low {
  background: #64748b;
  color: #ffffff;
}

.card-content-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.card-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.channel-name-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.updated-time {
  font-size: 0.6875rem;
  color: var(--text-tertiary, #94a3b8);
  white-space: nowrap;
}

.working-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary, #0f1f35);
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.source-video-reference {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  overflow: hidden;
}

.source-ref-label {
  font-weight: 600;
  color: var(--text-tertiary, #94a3b8);
  flex-shrink: 0;
}

.source-video-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--text-secondary, #64748b);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-video-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.source-video-static {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ext-icon {
  flex-shrink: 0;
}

.card-notes-preview {
  font-size: 0.78125rem;
  color: var(--text-secondary, #64748b);
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  background: var(--bg-inset, #f8fafc);
  padding: 6px 8px;
  border-radius: 6px;
}

.published-info-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
}

.published-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #059669;
}

.published-date {
  font-size: 0.6875rem;
  color: var(--text-secondary, #64748b);
}

.published-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #059669;
  font-weight: 600;
  text-decoration: none;
}

.published-link-btn:hover {
  text-decoration: underline;
}

.card-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-inset, #f8fafc);
  border-top: 1px solid var(--border, #e2e8f0);
}

.stage-control-wrap {
  flex: 1;
}

.stage-select-control {
  width: 100%;
  padding: 5px 24px 5px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #0f1f35);
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: border-color 0.15s ease;
}

.stage-select-control:focus {
  border-color: #2563eb;
}

.card-actions-cluster {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover:not(:disabled) {
  background: var(--surface, #ffffff);
  border-color: var(--border, #cbd5e1);
  color: var(--text-primary, #0f1f35);
}

.action-btn.delete-btn:hover:not(:disabled) {
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.2);
  background: rgba(220, 38, 38, 0.06);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .production-card,
  .card-thumb {
    transition: none !important;
  }
  .production-card:hover {
    transform: none !important;
  }
  .production-card:hover .card-thumb {
    transform: none !important;
  }
  .spin-anim {
    animation: none !important;
  }
}
</style>
