<template>
  <div class="table-card">
    <table class="channel-table">
      <thead>
        <tr>
          <th class="col-channel">KÊNH</th>
          <th class="col-status">TRẠNG THÁI</th>
          <th class="col-scan">VIDEO KIỂM TRA</th>
          <th class="col-alert">NGƯỠNG CẢNH BÁO</th>
          <th class="col-date">CẬP NHẬT GẦN NHẤT</th>
          <th class="col-actions">THAO TÁC</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="channel in channels" :key="channel.id" class="table-row">
          <!-- Kênh -->
          <td class="col-channel">
            <div class="channel-cell">
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
              <div class="channel-info">
                <div class="channel-name-row">
                  <router-link
                    :to="'/kenh-theo-doi/' + channel.id"
                    class="channel-name channel-name-link"
                    title="Xem phân tích kênh"
                  >
                    {{ channel.name }}
                  </router-link>
                  <a
                    :href="channel.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="channel-link-icon"
                    title="Mở kênh trên YouTube"
                  >
                    <AppIcon name="external" size="12" />
                  </a>
                </div>
                <div v-if="channel.handle" class="channel-handle">
                  {{ channel.handle }}
                </div>
              </div>
            </div>
          </td>

          <!-- Trạng thái -->
          <td class="col-status">
            <span class="badge" :class="`badge-${channel.status}`">
              {{ statusLabels[channel.status] }}
            </span>
          </td>

          <!-- Video kiểm tra -->
          <td class="col-scan">
            <span class="metric-value">{{ channel.scanLimit }}</span>
            <span class="metric-unit">video</span>
          </td>

          <!-- Ngưỡng cảnh báo -->
          <td class="col-alert">
            <span class="metric-value">{{ channel.alertVphThreshold.toLocaleString('vi-VN') }}</span>
            <span class="metric-unit">VPH</span>
          </td>

          <!-- Cập nhật gần nhất -->
          <td class="col-date">
            <span v-if="channel.lastScanAt" class="date-text">
              {{ formatDate(channel.lastScanAt) }}
            </span>
            <span v-else class="date-empty">Chưa kiểm tra</span>
          </td>

          <!-- Thao tác -->
          <td class="col-actions">
            <div class="actions-group">
              <!-- Phân Tích Kênh -->
              <router-link
                :to="'/kenh-theo-doi/' + channel.id"
                class="icon-action-btn icon-action-analytics"
                title="Phân Tích Kênh"
              >
                <AppIcon name="activity" size="16" />
              </router-link>

              <!-- So Sánh Kênh -->
              <router-link
                :to="'/so-sanh-kenh?channels=' + channel.id"
                class="icon-action-btn icon-action-compare"
                title="So Sánh Kênh"
              >
                <AppIcon name="bar-chart-2" size="16" />
              </router-link>

              <button
                class="icon-action-btn"
                @click="$emit('edit', channel)"
                title="Chỉnh Thiết Lập"
              >
                <AppIcon name="settings" size="16" />
              </button>

              <!-- Pause / Resume -->
              <button
                v-if="channel.status === 'active'"
                class="icon-action-btn"
                @click="$emit('pause', channel.id)"
                title="Tạm Dừng"
              >
                <AppIcon name="pause" size="16" />
              </button>
              <button
                v-else-if="channel.status === 'paused'"
                class="icon-action-btn icon-action-play"
                @click="$emit('resume', channel.id)"
                title="Bật Theo Dõi"
              >
                <AppIcon name="play" size="16" />
              </button>

              <!-- Archive / Restore -->
              <button
                v-if="channel.status !== 'archived'"
                class="icon-action-btn"
                @click="$emit('archive', channel.id)"
                title="Lưu Trữ"
              >
                <AppIcon name="archive" size="16" />
              </button>
              <button
                v-else
                class="icon-action-btn icon-action-restore"
                @click="$emit('restore', channel.id)"
                title="Bật Theo Dõi Lại"
              >
                <AppIcon name="restore" size="16" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
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
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.table-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
}

.channel-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  background-color: var(--bg-surface-elevated);
  padding: 14px 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row:hover td {
  background-color: var(--bg-surface-hover);
}

.channel-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrap {
  width: 40px;
  height: 40px;
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
  font-weight: 600;
  color: var(--text-secondary);
}

.channel-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.channel-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.channel-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.channel-link-icon {
  color: var(--text-muted);
  display: inline-flex;
}
.channel-link-icon:hover {
  color: var(--accent);
}

.channel-handle {
  font-size: 12px;
  color: var(--text-secondary);
}

.metric-value {
  font-weight: 600;
  color: var(--text-primary);
}

.metric-unit {
  font-size: 11px;
  color: var(--text-secondary);
  margin-left: 4px;
}

.date-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.date-empty {
  font-size: 12px;
  color: var(--text-muted);
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-action-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.icon-action-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-elevated);
  border-color: var(--border-strong);
}

.icon-action-play:hover {
  color: var(--status-active);
  border-color: var(--status-active);
}

.icon-action-restore:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.icon-action-analytics:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.icon-action-compare:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.channel-name-link {
  text-decoration: none;
}

.channel-name-link:hover {
  color: var(--accent);
}

@media (max-width: 900px) {
  .table-card {
    display: none;
  }
}
</style>
