<template>
  <div class="telemetry-rail">
    <!-- Card 1: Lần quét gần nhất -->
    <div class="telemetry-card">
      <div class="card-header">
        <span class="card-title">Lần Quét Gần Nhất</span>
        <AppIcon name="clock" size="16" class="card-icon" />
      </div>
      <div class="card-body">
        <div v-if="latestScan" class="scan-status-line">
          <span class="badge-status" :class="`status-${latestScan.status}`">
            {{ latestScan.statusLabel }}
          </span>
          <span class="badge-trigger" :class="`trigger-${latestScan.triggerSource}`">
            {{ latestScan.triggerLabel }}
          </span>
        </div>
        <div v-else class="empty-val">Chưa có dữ liệu</div>
      </div>
      <div class="card-footer">
        <span v-if="latestScan" class="card-subtext">{{ latestScan.relativeTime }}</span>
        <span v-else class="card-subtext">Hệ thống chưa ghi nhận lần quét</span>
      </div>
    </div>

    <!-- Card 2: Kênh cần chú ý -->
    <div class="telemetry-card">
      <div class="card-header">
        <span class="card-title">Kênh Cần Chú Ý</span>
        <AppIcon name="tv" size="16" class="card-icon" />
      </div>
      <div class="card-body">
        <div class="stat-number" :class="channelsNeedAttentionCount > 0 ? 'text-warning' : 'text-normal'">
          {{ channelsNeedAttentionCount }}
        </div>
      </div>
      <div class="card-footer">
        <span class="card-subtext">Chưa quét hoặc hơn 2 giờ chưa cập nhật</span>
      </div>
    </div>

    <!-- Card 3: Video cần cập nhật snapshot -->
    <div class="telemetry-card">
      <div class="card-header">
        <span class="card-title">Video Cần Chú Ý</span>
        <AppIcon name="video" size="16" class="card-icon" />
      </div>
      <div class="card-body">
        <div class="stat-number" :class="staleVideosCount > 0 ? 'text-warning' : 'text-normal'">
          {{ staleVideosCount }}
        </div>
      </div>
      <div class="card-footer">
        <span class="card-subtext">Trong tổng {{ activeVideosCount }} video đang theo dõi</span>
      </div>
    </div>

    <!-- Card 4: Cảnh báo lỗi gần đây -->
    <div class="telemetry-card">
      <div class="card-header">
        <span class="card-title">Cảnh Báo Lỗi Gần Đây</span>
        <AppIcon name="bell" size="16" class="card-icon" />
      </div>
      <div class="card-body">
        <div class="stat-number" :class="failedAlertsCount > 0 ? 'text-danger' : 'text-normal'">
          {{ failedAlertsCount }}
        </div>
      </div>
      <div class="card-footer">
        <span class="card-subtext scope-pill">Mẫu tối đa 100 bản ghi gần nhất</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import type { DataHealthScan } from '@/types/data-health';

defineProps<{
  latestScan: DataHealthScan | null;
  channelsNeedAttentionCount: number;
  staleVideosCount: number;
  activeVideosCount: number;
  failedAlertsCount: number;
}>();
</script>

<style scoped>
.telemetry-rail {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.telemetry-card {
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  border-radius: var(--radius-lg, 12px);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.telemetry-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .telemetry-card {
  background: var(--bg-card, #1E293B);
  border-color: rgba(255, 255, 255, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-title {
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted, #64748B);
}

[data-theme="dark"] .card-title {
  color: #94A3B8;
}

.card-icon {
  color: var(--text-muted, #94A3B8);
}

.card-body {
  margin-bottom: 8px;
}

.stat-number {
  font-size: 1.85rem;
  font-weight: 800;
  font-family: var(--font-mono, monospace);
  line-height: 1.1;
}

.text-normal {
  color: #10B981;
}

.text-warning {
  color: #F59E0B;
}

.text-danger {
  color: #EF4444;
}

.scan-status-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.badge-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-success {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}
[data-theme="dark"] .status-success {
  color: #34D399;
}

.status-partial {
  background: rgba(245, 158, 11, 0.15);
  color: #D97706;
}
[data-theme="dark"] .status-partial {
  color: #FBBF24;
}

.status-failed {
  background: rgba(239, 68, 68, 0.15);
  color: #DC2626;
}
[data-theme="dark"] .status-failed {
  color: #F87171;
}

.status-running {
  background: rgba(59, 130, 246, 0.15);
  color: #2563EB;
}
[data-theme="dark"] .status-running {
  color: #60A5FA;
}

.badge-trigger {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--bg-inset, #EEF4F8);
  color: var(--text-secondary, #475569);
}

[data-theme="dark"] .badge-trigger {
  background: rgba(255, 255, 255, 0.08);
  color: #CBD5E1;
}

.empty-val {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-muted, #94A3B8);
}

.card-footer {
  font-size: 0.78rem;
  color: var(--text-muted, #64748B);
  line-height: 1.3;
}

[data-theme="dark"] .card-footer {
  color: #94A3B8;
}

.scope-pill {
  display: inline-block;
  font-weight: 500;
  opacity: 0.9;
}

@media (max-width: 1024px) {
  .telemetry-rail {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .telemetry-rail {
    grid-template-columns: 1fr;
  }
}
</style>
