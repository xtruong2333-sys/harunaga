<template>
  <div class="mobile-channel-list">
    <div
      v-for="channel in channels"
      :key="channel.id"
      class="mobile-card"
      :class="`card-status-${channel.status}`"
    >
      <div class="card-top">
        <router-link
          :to="'/kenh-theo-doi/' + channel.id"
          class="avatar-wrap"
          title="Xem phân tích kênh"
        >
          <img
            v-if="channel.avatarUrl"
            :src="channel.avatarUrl"
            :alt="channel.name"
            class="channel-avatar"
            loading="lazy"
            @error="handleAvatarError"
          />
          <div v-else class="avatar-fallback">
            {{ channel.name.charAt(0).toUpperCase() }}
          </div>
        </router-link>

        <div class="channel-main-info">
          <div class="channel-title-row">
            <router-link
              :to="'/kenh-theo-doi/' + channel.id"
              class="channel-name"
              title="Xem phân tích kênh"
            >
              {{ channel.name }}
            </router-link>
            <a :href="channel.url" target="_blank" rel="noopener noreferrer" class="link-icon" title="Mở trên YouTube">
              <AppIcon name="external" size="12" />
            </a>
          </div>
          <div v-if="channel.handle" class="channel-handle">
            {{ channel.handle }}
          </div>
        </div>

        <span class="badge" :class="`badge-${channel.status}`">
          {{ statusLabels[channel.status] }}
        </span>
      </div>

      <div class="card-metrics">
        <div class="metric-item">
          <div class="metric-label">KIỂM TRA</div>
          <div class="metric-val mono">{{ channel.scanLimit !== null && channel.scanLimit !== undefined ? `${channel.scanLimit} video` : '—' }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">NGƯỠNG CẢNH BÁO</div>
          <div class="metric-val mono text-threshold">{{ channel.alertVphThreshold !== null && channel.alertVphThreshold !== undefined ? `${channel.alertVphThreshold.toLocaleString('vi-VN')} VPH` : '—' }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">QUÉT GẦN NHẤT</div>
          <div class="metric-val">{{ channel.lastScanAt ? formatRelativeTime(channel.lastScanAt) : 'Chưa quét' }}</div>
        </div>
      </div>

      <div class="card-actions">
        <router-link :to="'/kenh-theo-doi/' + channel.id" class="btn btn-secondary btn-sm action-btn">
          <AppIcon name="activity" size="14" />
          <span>Phân tích</span>
        </router-link>

        <router-link :to="'/so-sanh-kenh?channels=' + channel.id" class="btn btn-secondary btn-sm action-btn">
          <AppIcon name="bar-chart-2" size="14" />
          <span>So sánh</span>
        </router-link>

        <button class="btn btn-secondary btn-sm action-btn" @click="$emit('edit', channel)">
          <AppIcon name="settings" size="14" />
          <span>Thiết lập</span>
        </button>

        <button
          v-if="channel.status === 'active'"
          class="btn btn-secondary btn-sm action-btn"
          @click="$emit('pause', channel.id)"
        >
          <AppIcon name="pause" size="14" />
          <span>Tạm dừng</span>
        </button>
        <button
          v-else-if="channel.status === 'paused'"
          class="btn btn-secondary btn-sm action-btn text-active"
          @click="$emit('resume', channel.id)"
        >
          <AppIcon name="play" size="14" />
          <span>Bật theo dõi</span>
        </button>

        <button
          v-if="channel.status !== 'archived'"
          class="btn btn-secondary btn-sm action-btn"
          @click="$emit('archive', channel.id)"
        >
          <AppIcon name="archive" size="14" />
          <span>Lưu trữ</span>
        </button>
        <button
          v-else
          class="btn btn-secondary btn-sm action-btn"
          @click="$emit('restore', channel.id)"
        >
          <AppIcon name="restore" size="14" />
          <span>Bật lại</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { Channel, STATUS_LABELS } from '@/types/channel';

defineProps<{
  channels: Channel[];
}>();

defineEmits<{
  (e: 'edit', channel: Channel): void;
  (e: 'pause', id: string): void;
  (e: 'resume', id: string): void;
  (e: 'archive', id: string): void;
  (e: 'restore', id: string): void;
}>();

const statusLabels = STATUS_LABELS;

function handleAvatarError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}

function formatRelativeTime(iso: string): string {
  if (!iso) return '';
  const now = new Date();
  const past = new Date(iso);
  const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffSeconds < 60) return 'Vừa xong';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}p trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}
</script>

<style scoped>
.mobile-channel-list {
  display: none;
  flex-direction: column;
  gap: 14px;
}

.mobile-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  position: relative;
}

.card-status-active {
  border-left: 4px solid var(--status-active, #10B981);
}

.card-status-paused {
  border-left: 4px solid var(--status-paused, #F59E0B);
}

.card-status-archived {
  border-left: 4px solid var(--text-muted);
  opacity: 0.85;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-weight: 700;
  color: var(--text-secondary);
}

.channel-main-info {
  flex: 1;
  min-width: 0;
}

.channel-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.channel-name {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
}

.link-icon {
  color: var(--text-muted);
  display: inline-flex;
}

.channel-handle {
  font-size: 12px;
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background-color: var(--bg-surface-elevated);
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.metric-val {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-val.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-threshold {
  color: #F59E0B;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1 1 calc(50% - 4px);
  min-width: 120px;
  justify-content: center;
  gap: 6px;
}

.text-active {
  color: var(--status-active, #10B981);
}

@media (max-width: 900px) {
  .mobile-channel-list {
    display: flex;
  }
}
</style>
