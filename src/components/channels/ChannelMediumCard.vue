<template>
  <div class="channel-medium-card surface-card">
    <div class="med-top">
      <router-link :to="'/kenh-theo-doi/' + channel.id" class="avatar-link">
        <img
          v-if="channel.avatarUrl && !imgError"
          :src="channel.avatarUrl"
          :alt="channel.name"
          class="med-avatar"
          loading="lazy"
          @error="imgError = true"
        />
        <div v-else class="med-avatar-fallback">
          {{ (channel.name || 'C').charAt(0).toUpperCase() }}
        </div>
      </router-link>

      <div class="med-info">
        <router-link :to="'/kenh-theo-doi/' + channel.id" class="med-name" :title="channel.name">
          {{ channel.name }}
        </router-link>
        <div v-if="channel.handle" class="med-handle">{{ channel.handle }}</div>
        <div class="med-status">
          <ChannelStatusBadge :status="channel.status" />
        </div>
      </div>

      <ChannelActionsMenu
        :channel="channel"
        @edit="$emit('edit', $event)"
        @pause="$emit('pause', $event)"
        @resume="$emit('resume', $event)"
        @archive="$emit('archive', $event)"
        @restore="$emit('restore', $event)"
      />
    </div>

    <div class="med-metrics">
      <div class="med-m-item">
        <span class="med-m-lbl">Đang tăng</span>
        <span class="med-m-val mono text-accent">{{ channel.risingVideoCount || 0 }}</span>
      </div>
      <div class="med-m-item">
        <span class="med-m-lbl">Max VPH</span>
        <span class="med-m-val mono text-positive">
          {{ channel.maxVph !== null && channel.maxVph !== undefined && channel.maxVph > 0 ? `${formatNumber(Math.round(channel.maxVph))}` : '—' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Channel } from '@/types/channel';
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
.channel-medium-card {
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.channel-medium-card:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.3);
}

.med-top {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}

.med-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--border, #E2E8F0);
}

.med-avatar-fallback {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-surface-secondary, #F1F5F9);
  color: var(--brand-primary, #2563EB);
  font-size: 1.125rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--border, #E2E8F0);
}

.med-info {
  flex: 1;
  min-width: 0;
}

.med-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.med-name:hover {
  color: var(--brand-primary, #2563EB);
}

.med-handle {
  font-size: 0.6875rem;
  color: var(--text-tertiary, #64748B);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.med-status {
  margin-top: 0.25rem;
}

.med-metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface-secondary, #F8FAFC);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-sm, 6px);
  padding: 0.375rem 0.625rem;
}

.med-m-item {
  display: flex;
  flex-direction: column;
}

.med-m-lbl {
  font-size: 0.625rem;
  color: var(--text-tertiary, #64748B);
  font-weight: 600;
}

.med-m-val {
  font-size: 0.8125rem;
  font-weight: 700;
}

.text-accent {
  color: var(--brand-primary, #2563EB) !important;
}

.text-positive {
  color: var(--color-success-text, #059669) !important;
}
</style>
