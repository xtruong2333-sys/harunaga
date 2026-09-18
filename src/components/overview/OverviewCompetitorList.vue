<template>
  <div class="overview-competitor-list section-container">
    <div class="section-header">
      <div class="section-title-wrap">
        <div class="section-kicker">MẠNG LƯỚI ĐỐI THỦ</div>
        <h2 class="section-title">Top Đối Thủ</h2>
      </div>
      <router-link to="/kenh-theo-doi" class="section-link">
        <span>Xem tất cả</span>
        <AppIcon name="arrow-right" size="13" />
      </router-link>
    </div>

    <div v-if="!channels || channels.length === 0" class="panel-empty">
      Chưa có kênh nào ghi nhận video tăng.
    </div>

    <div v-else class="channel-list">
      <router-link
        v-for="ch in channels.slice(0, 5)"
        :key="ch.channelId"
        :to="'/kenh-theo-doi/' + ch.channelId"
        class="channel-row"
        title="Xem phân tích chi tiết kênh"
      >
        <div class="ch-avatar-box">
          <img
            v-if="ch.avatarUrl"
            :src="ch.avatarUrl"
            :alt="ch.channelName"
            class="ch-avatar"
            @error="handleImgError"
          />
          <div v-else class="ch-avatar-fallback">
            {{ ch.channelName.charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="ch-info">
          <div class="ch-name">{{ ch.channelName }}</div>
          <div class="ch-sub">
            <span>{{ ch.totalVideos }} video</span>
            <span class="dot-sep">•</span>
            <span class="text-accent">{{ ch.risingVideoCount }} đang tăng</span>
          </div>
        </div>

        <div class="ch-vph-badge mono">
          {{ ch.maxVph !== null && ch.maxVph > 0 ? `${Math.round(ch.maxVph).toLocaleString('vi-VN')} VPH` : '—' }}
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DashboardChannelSummary } from '@/types/dashboard';
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  channels: DashboardChannelSummary[];
}>();

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}
</script>

<style scoped>
.overview-competitor-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-empty {
  padding: 24px 12px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12.5px;
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.channel-row:hover {
  border-color: #BFDBFE;
  background: var(--surface-hover, #F3F7FB);
  transform: translateY(-1px);
}

.ch-avatar-box {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-inset);
  flex-shrink: 0;
}

.ch-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ch-avatar-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  background: #E2E8F0;
  color: #475569;
}

.ch-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.ch-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ch-sub {
  font-size: 10.5px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot-sep {
  color: var(--text-muted);
}

.text-accent {
  color: var(--primary, #2563EB);
  font-weight: 600;
}

[data-theme="dark"] .text-accent {
  color: #38BDF8;
}

.ch-vph-badge {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--primary, #2563EB);
  padding: 3px 6px;
  background: var(--primary-soft, #EFF6FF);
  border-radius: 5px;
}

[data-theme="dark"] .ch-vph-badge {
  background: rgba(14, 165, 233, 0.12);
  color: #38BDF8;
}
</style>
