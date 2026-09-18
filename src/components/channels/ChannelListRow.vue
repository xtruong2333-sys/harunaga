<template>
  <div class="channel-list-row surface-card" :class="`is-status-${channel.status}`">
    <div class="row-channel-info">
      <router-link :to="'/kenh-theo-doi/' + channel.id" class="row-avatar-link">
        <img
          v-if="channel.avatarUrl && !imgError"
          :src="channel.avatarUrl"
          :alt="channel.name"
          class="row-avatar"
          loading="lazy"
          @error="imgError = true"
        />
        <div v-else class="row-avatar-fallback">
          {{ (channel.name || 'C').charAt(0).toUpperCase() }}
        </div>
      </router-link>

      <div class="row-name-group">
        <div class="name-line">
          <router-link :to="'/kenh-theo-doi/' + channel.id" class="row-name" :title="channel.name">
            {{ channel.name }}
          </router-link>
          <a
            v-if="channel.url"
            :href="channel.url"
            target="_blank"
            rel="noopener noreferrer"
            class="row-yt-icon"
            title="Mở YouTube"
          >
            <AppIcon name="external" size="12" />
          </a>
        </div>
        <div v-if="channel.handle" class="row-handle">{{ channel.handle }}</div>
      </div>
    </div>

    <div class="row-status-col">
      <ChannelStatusBadge :status="channel.status" />
    </div>

    <div class="row-metrics-col">
      <div class="metric-item">
        <span class="m-title">Video:</span>
        <span class="mono">{{ channel.totalVideos !== undefined && channel.totalVideos !== null ? formatNumber(channel.totalVideos) : '—' }}</span>
      </div>
      <div class="metric-item">
        <span class="m-title">Đang tăng:</span>
        <span class="mono text-accent">{{ channel.risingVideoCount || 0 }}</span>
      </div>
      <div class="metric-item">
        <span class="m-title">Max VPH:</span>
        <span class="mono text-positive">
          {{ channel.maxVph !== null && channel.maxVph !== undefined && channel.maxVph > 0 ? `${formatNumber(Math.round(channel.maxVph))}` : '—' }}
        </span>
      </div>
    </div>

    <div class="row-actions-col">
      <router-link :to="'/kenh-theo-doi/' + channel.id" class="btn btn-secondary btn-xs">
        <span>Chi tiết</span>
      </router-link>

      <ChannelActionsMenu
        :channel="channel"
        @edit="$emit('edit', $event)"
        @pause="$emit('pause', $event)"
        @resume="$emit('resume', $event)"
        @archive="$emit('archive', $event)"
        @restore="$emit('restore', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Channel } from '@/types/channel';
import AppIcon from '@/components/ui/AppIcon.vue';
import ChannelStatusBadge from '@/components/channels/ChannelStatusBadge.vue';
import ChannelActionsMenu from '@/components/channels/ChannelActionsMenu.vue';

defineProps<{
  channel: Channel;
}>();

defineEmits<{
  (e: 'edit', channel: Channel): void;
  (e: 'pause', id: string): void;
  (e: 'resume', id: string): void;
  (e: 'archive', id: string): void;
  (e: 'restore', id: string): void;
}>();

const imgError = ref(false);

function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('vi-VN');
}
</script>

<style scoped>
.channel-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  padding: 0.75rem 1rem;
  gap: 1rem;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.channel-list-row:hover {
  background: var(--bg-surface-secondary, #F8FAFC);
  border-color: rgba(37, 99, 235, 0.3);
}

.row-channel-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 2;
  min-width: 180px;
}

.row-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border, #E2E8F0);
}

.row-avatar-fallback {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-surface-secondary, #F1F5F9);
  color: var(--brand-primary, #2563EB);
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border, #E2E8F0);
}

.row-name-group {
  min-width: 0;
}

.name-line {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.row-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-name:hover {
  color: var(--brand-primary, #2563EB);
}

.row-yt-icon {
  color: var(--text-muted, #94A3B8);
  display: inline-flex;
}

.row-handle {
  font-size: 0.6875rem;
  color: var(--text-tertiary, #64748B);
}

.row-status-col {
  flex: 1;
  min-width: 110px;
}

.row-metrics-col {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 2;
  font-size: 0.8125rem;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.m-title {
  color: var(--text-tertiary, #64748B);
  font-size: 0.75rem;
}

.text-accent {
  color: var(--brand-primary, #2563EB) !important;
}

.text-positive {
  color: var(--color-success-text, #059669) !important;
}

.row-actions-col {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
}

@media (max-width: 768px) {
  .channel-list-row {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .row-metrics-col {
    width: 100%;
    flex: unset;
  }
}
</style>
