<template>
  <div class="channel-large-card surface-card" :class="`is-status-${channel.status}`">
    <!-- Header: Avatar, Info, Status, Menu -->
    <div class="card-header">
      <router-link :to="'/kenh-theo-doi/' + channel.id" class="avatar-link" title="Xem chi tiết kênh">
        <img
          v-if="channel.avatarUrl && !imgError"
          :src="channel.avatarUrl"
          :alt="channel.name"
          class="channel-avatar"
          loading="lazy"
          @error="imgError = true"
        />
        <div v-else class="avatar-fallback">
          {{ (channel.name || 'C').charAt(0).toUpperCase() }}
        </div>
      </router-link>

      <div class="channel-meta">
        <div class="name-row">
          <router-link
            :to="'/kenh-theo-doi/' + channel.id"
            class="channel-name"
            :title="channel.name"
          >
            {{ channel.name }}
          </router-link>
          <a
            v-if="channel.url"
            :href="channel.url"
            target="_blank"
            rel="noopener noreferrer"
            class="yt-link-icon"
            title="Mở kênh trên YouTube"
            aria-label="Mở kênh trên YouTube"
          >
            <AppIcon name="external" size="12" />
          </a>
        </div>
        <div v-if="channel.handle" class="channel-handle">
          {{ channel.handle }}
        </div>
        <div class="status-row">
          <ChannelStatusBadge :status="channel.status" />
        </div>
      </div>

      <div class="card-actions">
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

    <!-- Body: Inline Micro-Metrics -->
    <div class="card-metrics-box">
      <div class="metric-col">
        <div class="m-val mono">
          {{ channel.totalVideos !== undefined && channel.totalVideos !== null ? formatNumber(channel.totalVideos) : '—' }}
        </div>
        <div class="m-lbl">TỔNG VIDEO</div>
      </div>

      <div class="metric-sep"></div>

      <div class="metric-col">
        <div class="m-val mono text-accent">{{ channel.risingVideoCount || 0 }}</div>
        <div class="m-lbl">ĐANG TĂNG</div>
      </div>

      <div class="metric-sep"></div>

      <div class="metric-col">
        <div class="m-val mono text-positive">
          {{ channel.maxVph !== null && channel.maxVph !== undefined && channel.maxVph > 0 ? `${formatNumber(Math.round(channel.maxVph))}` : '—' }}
        </div>
        <div class="m-lbl">MAX VPH</div>
      </div>
    </div>

    <!-- Real Ratio Signal Bar based on risingVideoCount / totalVideos -->
    <div class="signal-bar-wrap">
      <div class="signal-bar-meta">
        <span class="sig-label">Tỷ lệ video đang tăng</span>
        <span class="sig-val mono">
          {{ risingRatioDisplay }}
        </span>
      </div>
      <div class="sig-track">
        <div
          class="sig-fill"
          :style="{ width: `${risingRatioPercent}%` }"
        ></div>
      </div>
    </div>

    <!-- Footer: Link & Actions -->
    <div class="card-footer">
      <div class="scan-time-text">
        <span v-if="channel.lastScanAt">Quét: {{ formatRelativeTime(channel.lastScanAt) }}</span>
        <span v-else>Chưa quét dữ liệu</span>
      </div>

      <router-link :to="'/kenh-theo-doi/' + channel.id" class="btn btn-secondary btn-xs">
        <span>Chi tiết</span>
        <AppIcon name="arrow-right" size="12" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Channel } from '@/types/channel';
import AppIcon from '@/components/ui/AppIcon.vue';
import ChannelStatusBadge from '@/components/channels/ChannelStatusBadge.vue';
import ChannelActionsMenu from '@/components/channels/ChannelActionsMenu.vue';

const props = defineProps<{
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

const risingRatioPercent = computed(() => {
  const total = props.channel.totalVideos || 0;
  const rising = props.channel.risingVideoCount || 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((rising / total) * 100));
});

const risingRatioDisplay = computed(() => {
  const total = props.channel.totalVideos;
  const rising = props.channel.risingVideoCount || 0;
  if (total === undefined || total === null || total <= 0) {
    return rising > 0 ? `${rising} video` : '—';
  }
  const pct = Math.round((rising / total) * 100);
  return `${pct}% (${rising} / ${total})`;
});

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
.channel-large-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-lg, 14px);
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, border-color 0.18s ease;
}

.channel-large-card:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.3);
  box-shadow: 0 10px 20px -3px rgba(37, 99, 235, 0.06), 0 4px 6px -2px rgba(37, 99, 235, 0.02);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  margin-bottom: 1rem;
}

.avatar-link {
  flex-shrink: 0;
  text-decoration: none;
}

.channel-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border, #E2E8F0);
  transition: border-color 0.18s ease;
}

.channel-large-card:hover .channel-avatar {
  border-color: var(--brand-primary, #2563EB);
}

.avatar-fallback {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: var(--bg-surface-secondary, #F1F5F9);
  color: var(--brand-primary, #2563EB);
  font-size: 1.375rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border, #E2E8F0);
}

.channel-meta {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.channel-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.channel-name:hover {
  color: var(--brand-primary, #2563EB);
}

.yt-link-icon {
  color: var(--text-muted, #94A3B8);
  display: inline-flex;
  transition: color 0.15s ease;
}

.yt-link-icon:hover {
  color: #FF0000;
}

.channel-handle {
  font-size: 0.75rem;
  color: var(--text-tertiary, #64748B);
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-row {
  margin-top: 0.375rem;
}

.card-metrics-box {
  display: flex;
  align-items: center;
  background: var(--bg-surface-secondary, #F8FAFC);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  padding: 0.625rem 0.75rem;
  margin-bottom: 0.875rem;
}

.metric-col {
  flex: 1;
  text-align: center;
}

.m-val {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  line-height: 1.1;
}

.m-lbl {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-tertiary, #64748B);
  letter-spacing: 0.03em;
  margin-top: 0.125rem;
}

.metric-sep {
  width: 1px;
  height: 20px;
  background: var(--border, #E2E8F0);
}

.text-accent {
  color: var(--brand-primary, #2563EB) !important;
}

.text-positive {
  color: var(--color-success-text, #059669) !important;
}

.signal-bar-wrap {
  margin-bottom: 0.875rem;
}

.signal-bar-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.6875rem;
  margin-bottom: 0.25rem;
}

.sig-label {
  color: var(--text-tertiary, #64748B);
  font-weight: 500;
}

.sig-val {
  color: var(--text-secondary, #334155);
  font-weight: 600;
}

.sig-track {
  width: 100%;
  height: 4px;
  background: var(--border, #E2E8F0);
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
}

.sig-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563EB 0%, #0EA5E9 100%);
  border-radius: var(--radius-full, 9999px);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border, #E2E8F0);
  margin-top: auto;
}

.scan-time-text {
  font-size: 0.6875rem;
  color: var(--text-muted, #94A3B8);
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  gap: 0.25rem;
}
</style>
