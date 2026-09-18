<template>
  <div class="channel-table-view surface-card">
    <div class="table-scroll-wrap">
      <table class="channel-table">
        <thead>
          <tr>
            <th class="col-channel">KÊNH</th>
            <th class="col-status">TRẠNG THÁI</th>
            <th class="col-videos">VIDEO THEO DÕI</th>
            <th class="col-rising">ĐANG TĂNG</th>
            <th class="col-vph">MAX VPH</th>
            <th class="col-date">QUÉT GẦN NHẤT</th>
            <th class="col-actions">THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ch in channels"
            :key="ch.id"
            class="channel-table-row"
            :class="`row-${ch.status}`"
          >
            <!-- Channel Info -->
            <td class="col-channel">
              <div class="table-chan-cell">
                <router-link :to="'/kenh-theo-doi/' + ch.id" class="table-avatar-link">
                  <img
                    v-if="ch.avatarUrl"
                    :src="ch.avatarUrl"
                    :alt="ch.name"
                    class="table-avatar"
                    loading="lazy"
                    @error="handleImgError"
                  />
                  <div v-else class="table-avatar-fallback">
                    {{ (ch.name || 'C').charAt(0).toUpperCase() }}
                  </div>
                </router-link>

                <div class="table-chan-meta">
                  <div class="name-line">
                    <router-link :to="'/kenh-theo-doi/' + ch.id" class="table-name" :title="ch.name">
                      {{ ch.name }}
                    </router-link>
                    <a
                      v-if="ch.url"
                      :href="ch.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="yt-icon"
                      title="Mở YouTube"
                    >
                      <AppIcon name="external" size="12" />
                    </a>
                  </div>
                  <div v-if="ch.handle" class="table-handle">{{ ch.handle }}</div>
                </div>
              </div>
            </td>

            <!-- Status -->
            <td class="col-status">
              <ChannelStatusBadge :status="ch.status" />
            </td>

            <!-- Videos -->
            <td class="col-videos mono">
              {{ ch.totalVideos !== undefined ? ch.totalVideos : ch.scanLimit }}
            </td>

            <!-- Rising Videos -->
            <td class="col-rising mono text-accent">
              {{ ch.risingVideoCount || 0 }}
            </td>

            <!-- Max VPH -->
            <td class="col-vph mono text-positive">
              {{ ch.maxVph !== null && ch.maxVph !== undefined && ch.maxVph > 0 ? `${formatNumber(Math.round(ch.maxVph))} VPH` : '—' }}
            </td>

            <!-- Date -->
            <td class="col-date mono">
              <span v-if="ch.lastScanAt" :title="ch.lastScanAt">{{ formatRelativeTime(ch.lastScanAt) }}</span>
              <span v-else class="text-muted">Chưa quét</span>
            </td>

            <!-- Actions -->
            <td class="col-actions">
              <div class="table-actions-group">
                <router-link :to="'/kenh-theo-doi/' + ch.id" class="btn btn-secondary btn-xs" title="Xem phân tích">
                  <span>Chi tiết</span>
                </router-link>
                <ChannelActionsMenu
                  :channel="ch"
                  @edit="$emit('edit', $event)"
                  @pause="$emit('pause', $event)"
                  @resume="$emit('resume', $event)"
                  @archive="$emit('archive', $event)"
                  @restore="$emit('restore', $event)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Channel } from '@/types/channel';
import AppIcon from '@/components/ui/AppIcon.vue';
import ChannelStatusBadge from '@/components/channels/ChannelStatusBadge.vue';
import ChannelActionsMenu from '@/components/channels/ChannelActionsMenu.vue';

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

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}

function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('vi-VN');
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
  return `${diffDays}d trước`;
}
</script>

<style scoped>
.channel-table-view {
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.table-scroll-wrap {
  width: 100%;
  overflow-x: auto;
}

.channel-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.8125rem;
}

.channel-table th {
  background: var(--bg-surface-secondary, #F8FAFC);
  color: var(--text-tertiary, #64748B);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border, #E2E8F0);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}

.channel-table-row {
  border-bottom: 1px solid var(--border, #E2E8F0);
  transition: background-color 0.12s ease;
}

.channel-table-row:last-child {
  border-bottom: none;
}

.channel-table-row:hover {
  background: var(--bg-surface-secondary, #F8FAFC);
}

.channel-table td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
}

.table-chan-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 220px;
}

.table-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border, #E2E8F0);
}

.table-avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-surface-secondary, #F1F5F9);
  color: var(--brand-primary, #2563EB);
  font-size: 0.9375rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border, #E2E8F0);
}

.name-line {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.table-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
}

.table-name:hover {
  color: var(--brand-primary, #2563EB);
}

.yt-icon {
  color: var(--text-muted, #94A3B8);
  display: inline-flex;
}

.table-handle {
  font-size: 0.6875rem;
  color: var(--text-tertiary, #64748B);
}

.text-accent {
  color: var(--brand-primary, #2563EB) !important;
}

.text-positive {
  color: var(--color-success-text, #059669) !important;
}

.text-muted {
  color: var(--text-muted, #94A3B8);
}

.table-actions-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
}
</style>
