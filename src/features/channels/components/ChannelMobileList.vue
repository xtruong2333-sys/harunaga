<template>
  <div class="mobile-channel-list">
    <div v-for="channel in channels" :key="channel.id" class="mobile-card">
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
            <a :href="channel.url" target="_blank" rel="noopener noreferrer" class="link-icon">
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
          <div class="metric-label">Video kiểm tra</div>
          <div class="metric-val">{{ channel.scanLimit }} video</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Ngưỡng cảnh báo</div>
          <div class="metric-val">{{ channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Cập nhật</div>
          <div class="metric-val">{{ channel.lastScanAt ? formatDate(channel.lastScanAt) : 'Chưa kiểm tra' }}</div>
        </div>
      </div>

      <div class="card-actions">
        <router-link :to="'/kenh-theo-doi/' + channel.id" class="btn btn-secondary btn-sm">
          <AppIcon name="activity" size="14" />
          <span>Phân tích</span>
        </router-link>

        <button class="btn btn-secondary btn-sm" @click="$emit('edit', channel)">
          <AppIcon name="settings" size="14" />
          <span>Thiết lập</span>
        </button>

        <button
          v-if="channel.status === 'active'"
          class="btn btn-secondary btn-sm"
          @click="$emit('pause', channel.id)"
        >
          <AppIcon name="pause" size="14" />
          <span>Tạm dừng</span>
        </button>
        <button
          v-else-if="channel.status === 'paused'"
          class="btn btn-secondary btn-sm"
          @click="$emit('resume', channel.id)"
        >
          <AppIcon name="play" size="14" />
          <span>Bật theo dõi</span>
        </button>

        <button
          v-if="channel.status !== 'archived'"
          class="btn btn-secondary btn-sm"
          @click="$emit('archive', channel.id)"
        >
          <AppIcon name="archive" size="14" />
          <span>Lưu trữ</span>
        </button>
        <button
          v-else
          class="btn btn-secondary btn-sm"
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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.mobile-channel-list {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.mobile-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  font-weight: 600;
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
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-icon {
  color: var(--text-muted);
}

.channel-handle {
  font-size: 12px;
  color: var(--text-secondary);
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background-color: var(--bg-surface-elevated);
  padding: 10px;
  border-radius: 8px;
}

.metric-label {
  font-size: 10px;
  color: var(--text-muted);
}

.metric-val {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 2px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
  flex: 1;
}

@media (max-width: 900px) {
  .mobile-channel-list {
    display: flex;
  }
}
</style>
