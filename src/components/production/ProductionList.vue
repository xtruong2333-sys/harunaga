<template>
  <div class="production-list-container" aria-label="Danh sách tiến độ sản xuất">
    <div class="production-list-grid">
      <div
        v-for="item in items"
        :key="item.id"
        class="list-item-row"
        :class="[
          `status-${item.status}`,
          `priority-${item.priority}`,
          { 'is-busy': busyItemIds.has(item.id) }
        ]"
      >
        <!-- Busy Overlay -->
        <div v-if="busyItemIds.has(item.id)" class="row-busy-overlay" aria-live="polite">
          <AppIcon name="refresh" :size="16" class="spin-anim" />
          <span>Đang xử lý...</span>
        </div>

        <!-- 1. Thumbnail Column -->
        <div class="row-thumb-cell">
          <VideoThumbnail
            v-if="item.sourceVideo"
            :src="item.sourceVideo.thumbnailUrl"
            :youtube-video-id="item.sourceVideo.youtubeVideoId || undefined"
            :detail-url="`/videos/${item.sourceVideo.id}`"
            :alt="item.sourceVideo.title"
            ratio="16-9"
            class="list-thumb"
          />
          <div v-else class="source-missing-cell">
            <AppIcon name="alert-triangle" :size="18" class="missing-icon" />
            <span class="missing-text">Video nguồn không còn trong hệ thống.</span>
          </div>
        </div>

        <!-- 2. Main Details Cell -->
        <div class="row-details-cell">
          <div class="details-top-meta">
            <span v-if="item.sourceVideo" class="channel-pill">
              <AppIcon name="tv" :size="12" />
              <span>{{ item.sourceVideo.channelName }}</span>
            </span>

            <span class="priority-badge" :class="`priority-${item.priority}`">
              {{ PRIORITY_LABELS[item.priority] }}
            </span>

            <span class="updated-time font-mono">
              {{ formatRelativeTime(item.updatedAt) }}
            </span>
          </div>

          <h3 class="row-working-title" :title="item.workingTitle || item.sourceVideo?.title || 'Chưa đặt tiêu đề'">
            {{ item.workingTitle || item.sourceVideo?.title || 'Chưa đặt tiêu đề' }}
          </h3>

          <!-- Source Video Title & Link -->
          <div v-if="item.sourceVideo" class="source-ref-line">
            <span class="ref-label">Gốc:</span>
            <a
              v-if="item.sourceVideo.url"
              :href="item.sourceVideo.url"
              target="_blank"
              rel="noopener noreferrer"
              class="source-link"
              :title="item.sourceVideo.title"
            >
              <span>{{ item.sourceVideo.title }}</span>
              <AppIcon name="external-link" :size="11" />
            </a>
            <span v-else class="source-static" :title="item.sourceVideo.title">
              {{ item.sourceVideo.title }}
            </span>
          </div>

          <!-- Notes -->
          <p v-if="item.notes && item.notes.trim()" class="row-notes">
            {{ item.notes }}
          </p>

          <!-- Published Info if Published -->
          <div v-if="item.status === 'published'" class="published-row-band">
            <span class="pub-badge">
              <AppIcon name="check-circle" :size="12" />
              <span>Đã xuất bản</span>
            </span>
            <span v-if="item.publishedAt" class="pub-date font-mono">
              {{ formatExactDate(item.publishedAt) }}
            </span>
            <a
              v-if="item.publishedUrl"
              :href="item.publishedUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="pub-link"
            >
              <span>Xem video</span>
              <AppIcon name="external-link" :size="11" />
            </a>
          </div>
        </div>

        <!-- 3. Stage Selector Cell -->
        <div class="row-stage-cell">
          <label :for="`list-stage-${item.id}`" class="stage-label">Giai đoạn</label>
          <select
            :id="`list-stage-${item.id}`"
            :value="item.status"
            class="list-stage-select"
            :disabled="busyItemIds.has(item.id) || anyMutationBusy"
            @change="onStageChange($event, item)"
          >
            <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>

        <!-- 4. Actions Cell -->
        <div class="row-actions-cell">
          <button
            type="button"
            class="btn-action edit"
            title="Chỉnh sửa chi tiết"
            :disabled="busyItemIds.has(item.id) || anyMutationBusy"
            @click="$emit('edit', item)"
          >
            <AppIcon name="edit-3" :size="15" />
          </button>

          <button
            v-if="item.status === 'archived'"
            type="button"
            class="btn-action restore"
            title="Khôi phục về Ý tưởng"
            :disabled="busyItemIds.has(item.id) || anyMutationBusy"
            @click="$emit('restore', item.id)"
          >
            <AppIcon name="rotate-ccw" :size="15" />
          </button>
          <button
            v-else
            type="button"
            class="btn-action archive"
            title="Lưu trữ mục này"
            :disabled="busyItemIds.has(item.id) || anyMutationBusy"
            @click="$emit('archive', item.id)"
          >
            <AppIcon name="archive" :size="15" />
          </button>

          <button
            type="button"
            class="btn-action delete"
            title="Xóa khỏi Tiến Độ Sản Xuất"
            :disabled="busyItemIds.has(item.id) || anyMutationBusy"
            @click="$emit('delete', item)"
          >
            <AppIcon name="trash-2" :size="15" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductionItem, ProductionStatus } from '@/types/production';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types/production';
import { productionService } from '@/services/production-service';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  items: ProductionItem[];
  busyItemIds: Set<string>;
  anyMutationBusy: boolean;
}>();

const emit = defineEmits<{
  (e: 'change-status', payload: { id: string; status: ProductionStatus }): void;
  (e: 'edit', item: ProductionItem): void;
  (e: 'archive', id: string): void;
  (e: 'restore', id: string): void;
  (e: 'delete', item: ProductionItem): void;
}>();

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

function onStageChange(event: Event, item: ProductionItem) {
  const target = event.target as HTMLSelectElement;
  const newStatus = target.value as ProductionStatus;
  if (newStatus !== item.status) {
    // Reset visually until true server response
    target.value = item.status;
    emit('change-status', { id: item.id, status: newStatus });
  }
}
</script>

<style scoped>
.production-list-container {
  width: 100%;
}

.production-list-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 1px 3px rgba(15, 31, 53, 0.03);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.list-item-row:hover {
  border-color: var(--border-hover, #cbd5e1);
  box-shadow: 0 4px 12px rgba(15, 31, 53, 0.05);
}

.list-item-row.priority-high {
  border-left: 3px solid #ef4444;
}

.list-item-row.priority-normal {
  border-left: 3px solid #3b82f6;
}

.list-item-row.priority-low {
  border-left: 3px solid #94a3b8;
}

.row-busy-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  z-index: 10;
  border-radius: 12px;
}

.row-thumb-cell {
  flex: 0 0 180px;
  width: 180px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-inset, #f1f5f9);
}

.list-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.source-missing-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 8px;
  text-align: center;
  gap: 4px;
  color: var(--text-tertiary, #94a3b8);
}

.missing-icon {
  color: #f59e0b;
}

.missing-text {
  font-size: 0.6875rem;
}

.row-details-cell {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.details-top-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.channel-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
}

.priority-badge {
  padding: 1px 7px;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 5px;
}

.priority-badge.priority-high {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.priority-badge.priority-normal {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.priority-badge.priority-low {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.updated-time {
  font-size: 0.75rem;
  color: var(--text-tertiary, #94a3b8);
  margin-left: auto;
}

.row-working-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary, #0f1f35);
  margin: 0;
  line-height: 1.35;
}

.source-ref-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  overflow: hidden;
}

.ref-label {
  font-weight: 600;
  color: var(--text-tertiary, #94a3b8);
  flex-shrink: 0;
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--text-secondary, #64748b);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.source-static {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-notes {
  font-size: 0.78125rem;
  color: var(--text-secondary, #64748b);
  background: var(--bg-inset, #f8fafc);
  padding: 5px 8px;
  border-radius: 6px;
  margin: 0;
}

.published-row-band {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  width: fit-content;
}

.pub-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #059669;
}

.pub-date {
  color: var(--text-secondary, #64748b);
}

.pub-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #059669;
  font-weight: 600;
  text-decoration: none;
}

.pub-link:hover {
  text-decoration: underline;
}

.row-stage-cell {
  flex: 0 0 170px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stage-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-tertiary, #94a3b8);
  text-transform: uppercase;
}

.list-stage-select {
  width: 100%;
  padding: 6px 26px 6px 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary, #0f1f35);
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 7px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.list-stage-select:focus {
  border-color: #2563eb;
}

.row-actions-cell {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 7px;
  background: transparent;
  border: 1px solid var(--border, #e2e8f0);
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action:hover:not(:disabled) {
  background: var(--bg-inset, #f8fafc);
  color: var(--text-primary, #0f1f35);
  border-color: var(--border-hover, #cbd5e1);
}

.btn-action.delete:hover:not(:disabled) {
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.25);
  background: rgba(220, 38, 38, 0.06);
}

.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .list-item-row {
    flex-direction: column;
    align-items: stretch;
  }

  .row-thumb-cell {
    width: 100%;
    flex: 1 1 auto;
  }

  .row-stage-cell {
    width: 100%;
    flex: 1 1 auto;
  }

  .row-actions-cell {
    justify-content: flex-end;
  }
}
</style>
