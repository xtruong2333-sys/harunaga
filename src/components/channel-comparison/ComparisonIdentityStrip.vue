<template>
  <div class="comparison-identity-strip">
    <div
      v-for="ch in channels"
      :key="ch.id"
      class="channel-identity-card card"
      :style="{ '--ch-accent': ch.color }"
    >
      <div class="card-accent-line"></div>
      <div class="card-content">
        <div class="channel-main-row">
          <div class="avatar-wrap">
            <img
              v-if="ch.avatarUrl && !avatarErrors[ch.id]"
              :src="ch.avatarUrl"
              :alt="ch.name"
              class="ch-avatar"
              @error="avatarErrors[ch.id] = true"
            />
            <div v-else class="ch-avatar-fallback">
              {{ ch.name.charAt(0).toUpperCase() }}
            </div>
          </div>

          <div class="ch-info">
            <div class="name-row">
              <router-link :to="`/kenh-theo-doi/${ch.id}`" class="ch-name" :title="ch.name">
                {{ ch.name }}
              </router-link>
              <span class="badge-status" :class="`status-${ch.status}`">
                {{ ch.statusLabel }}
              </span>
            </div>
            <div class="handle-row">
              <span v-if="ch.handle" class="ch-handle">{{ ch.handle }}</span>
              <span class="dot-sep">•</span>
              <span class="scan-time">Quét {{ ch.relativeScanTime }}</span>
            </div>
          </div>
        </div>

        <div class="channel-quick-meta">
          <div class="meta-item">
            <span class="meta-label">Ngưỡng VPH:</span>
            <span class="meta-value mono">
              {{ ch.alertVphThreshold !== null ? `${ch.alertVphThreshold.toLocaleString('vi-VN')} VPH` : '—' }}
            </span>
          </div>
          <div class="meta-item">
            <router-link :to="`/kenh-theo-doi/${ch.id}`" class="detail-link">
              Hồ sơ kênh →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { ChannelComparisonItem } from '@/types/channel-comparison';

defineProps<{
  channels: ChannelComparisonItem[];
}>();

const avatarErrors = reactive<Record<string, boolean>>({});
</script>

<style scoped>
.comparison-identity-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.channel-identity-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.channel-identity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-accent-line {
  height: 4px;
  background: var(--ch-accent, #38bdf8);
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.channel-main-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: #e2e8f0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #334155;
  background: #e2e8f0;
}

.ch-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}

.ch-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ch-name:hover {
  color: #2563eb;
}

.handle-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #64748b;
}

.ch-handle {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot-sep {
  color: #cbd5e1;
}

.badge-status {
  padding: 2px 6px;
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 4px;
  white-space: nowrap;
}

.status-active {
  background: #ecfdf5;
  color: #059669;
}

.status-paused {
  background: #fffbeb;
  color: #d97706;
}

.status-archived {
  background: #f1f5f9;
  color: #64748b;
}

.channel-quick-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.8rem;
}

.meta-label {
  color: #64748b;
  margin-right: 4px;
}

.meta-value {
  font-weight: 600;
  color: #0f172a;
}

.detail-link {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.detail-link:hover {
  text-decoration: underline;
}
</style>