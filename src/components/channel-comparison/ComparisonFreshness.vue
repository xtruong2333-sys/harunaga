<template>
  <div class="comparison-freshness card">
    <div class="freshness-header">
      <div class="title-wrap">
        <h3 class="freshness-title">ĐỘ MỚI DỮ LIỆU THU THẬP</h3>
        <p class="freshness-sub">Thời điểm kiểm tra số liệu mới nhất của từng kênh đối thủ.</p>
      </div>
    </div>

    <div class="freshness-grid" :style="{ gridTemplateColumns: `repeat(${channels.length}, 1fr)` }">
      <div
        v-for="ch in channels"
        :key="ch.id"
        class="freshness-card"
        :style="{ '--ch-color': ch.color }"
      >
        <div class="freshness-channel-row">
          <span class="ch-indicator" :style="{ backgroundColor: ch.color }"></span>
          <span class="ch-name" :title="ch.name">{{ ch.name }}</span>
        </div>

        <div class="freshness-metrics">
          <div class="f-item">
            <span class="f-label">Lần quét gần nhất:</span>
            <span class="f-val">{{ ch.relativeScanTime }}</span>
          </div>
          <div class="f-item">
            <span class="f-label">Thời điểm chính xác:</span>
            <span class="f-val mono text-muted">{{ formatDateTime(ch.lastScanAt) }}</span>
          </div>
          <div class="f-item">
            <span class="f-label">Ngưỡng cảnh báo:</span>
            <span class="f-val mono">
              {{ ch.alertVphThreshold !== null ? `${ch.alertVphThreshold.toLocaleString('vi-VN')} VPH` : 'Chưa thiết lập' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChannelComparisonItem } from '@/types/channel-comparison';

defineProps<{
  channels: ChannelComparisonItem[];
}>();

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Chưa có';
  try {
    const d = new Date(iso);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} ${date}`;
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.comparison-freshness {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.freshness-header {
  margin-bottom: 16px;
}

.freshness-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.freshness-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.freshness-grid {
  display: grid;
  gap: 16px;
}

.freshness-card {
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.freshness-channel-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ch-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ch-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.freshness-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
}

.f-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.f-label {
  color: #64748b;
}

.f-val {
  font-weight: 600;
  color: #0f172a;
  text-align: right;
}

.text-muted {
  color: #64748b;
}

@media (max-width: 900px) {
  .freshness-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>