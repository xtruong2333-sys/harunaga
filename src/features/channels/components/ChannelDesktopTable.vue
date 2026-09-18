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
        <tr
          v-for="channel in channels"
          :key="channel.id"
          class="table-row"
          :class="`row-status-${channel.status}`"
        >
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
            <span class="metric-value">{{ channel.scanLimit !== null && channel.scanLimit !== undefined ? channel.scanLimit : '—' }}</span>
            <span v-if="channel.scanLimit !== null && channel.scanLimit !== undefined" class="metric-unit">video / lần</span>
          </td>

          <!-- Ngưỡng cảnh báo -->
          <td class="col-alert">
            <span class="metric-value text-threshold">{{ channel.alertVphThreshold !== null && channel.alertVphThreshold !== undefined ? channel.alertVphThreshold.toLocaleString('vi-VN') : '—' }}</span>
            <span v-if="channel.alertVphThreshold !== null && channel.alertVphThreshold !== undefined" class="metric-unit">VPH</span>
          </td>

          <!-- Cập nhật gần nhất -->
          <td class="col-date">
            <span v-if="channel.lastScanAt" class="date-text" :title="formatFullDate(channel.lastScanAt)">
              {{ formatRelativeTime(channel.lastScanAt) }}
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
                <AppIcon name="activity" size="15" />
              </router-link>

              <!-- So Sánh Kênh -->
              <router-link
                :to="'/so-sanh-kenh?channels=' + channel.id"
                class="icon-action-btn icon-action-compare"
                title="So Sánh Kênh"
              >
                <AppIcon name="bar-chart-2" size="15" />
              </router-link>

              <button
                class="icon-action-btn"
                @click="$emit('edit', channel)"
                title="Chỉnh Thiết Lập"
              >
                <AppIcon name="settings" size="15" />
              </button>

              <!-- Pause / Resume -->
              <button
                v-if="channel.status === 'active'"
                class="icon-action-btn icon-action-pause"
                @click="$emit('pause', channel.id)"
                title="Tạm Dừng"
              >
                <AppIcon name="pause" size="15" />
              </button>
              <button
                v-else-if="channel.status === 'paused'"
                class="icon-action-btn icon-action-play"
                @click="$emit('resume', channel.id)"
                title="Bật Theo Dõi"
              >
                <AppIcon name="play" size="15" />
              </button>

              <!-- Archive / Restore -->
              <button
                v-if="channel.status !== 'archived'"
                class="icon-action-btn icon-action-archive"
                @click="$emit('archive', channel.id)"
                title="Lưu Trữ"
              >
                <AppIcon name="archive" size="15" />
              </button>
              <button
                v-else
                class="icon-action-btn icon-action-restore"
                @click="$emit('restore', channel.id)"
                title="Bật Theo Dõi Lại"
              >
                <AppIcon name="restore" size="15" />
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

function formatFullDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatRelativeTime(iso: string): string {
  if (!iso) return '';
  const now = new Date();
  const past = new Date(iso);
  const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffSeconds < 60) return 'Vừa xong';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}
</script>

<style scoped>
.table-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
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
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  text-transform: uppercase;
}

td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.table-row {
  transition: background-color 0.15s ease;
  position: relative;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row:hover td {
  background-color: var(--bg-surface-hover);
}

.row-status-active {
  border-left: 3px solid var(--status-active, #10B981);
}

.row-status-paused {
  border-left: 3px solid var(--status-paused, #F59E0B);
}

.row-status-archived {
  border-left: 3px solid var(--text-muted);
  opacity: 0.85;
}

.channel-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-wrap {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.avatar-wrap:hover {
  transform: scale(1.05);
}

.channel-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-secondary);
}

.channel-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.channel-name-link {
  text-decoration: none;
}

.channel-name-link:hover {
  color: var(--accent);
}

.channel-link-icon {
  color: var(--text-muted);
  display: inline-flex;
  transition: color 0.15s ease;
}

.channel-link-icon:hover {
  color: var(--accent);
}

.channel-handle {
  font-size: 12px;
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.metric-value {
  font-weight: 700;
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.text-threshold {
  color: #F59E0B;
}

.metric-unit {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 4px;
}

.date-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.date-empty {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-action-btn {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  padding: 7px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  text-decoration: none;
}

.icon-action-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-hover);
  border-color: var(--border-strong, var(--border-subtle));
}

.icon-action-play:hover {
  color: var(--status-active, #10B981);
  border-color: var(--status-active, #10B981);
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

.icon-action-pause:hover {
  color: var(--status-paused, #F59E0B);
  border-color: var(--status-paused, #F59E0B);
}

.icon-action-archive:hover {
  color: var(--text-muted);
  border-color: var(--text-muted);
}

@media (max-width: 900px) {
  .table-card {
    display: none;
  }
}
</style>
