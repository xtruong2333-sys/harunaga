<template>
  <div class="overview-data-health section-container">
    <div class="section-header">
      <div class="section-title-wrap">
        <div class="section-kicker">TIẾN ĐỘ THU THẬP</div>
        <h2 class="section-title">Tình Trạng Dữ Liệu</h2>
      </div>
      <router-link to="/lich-dang-doi-thu" class="section-link">
        <span>Lịch Đăng</span>
        <AppIcon name="arrow-right" size="13" />
      </router-link>
    </div>

    <div class="health-telemetry-list">
      <div class="health-row">
        <span class="h-label">Trạng thái phiên quét:</span>
        <span class="h-val badge-mini" :class="`badge-${scanStatus.tone}`">
          {{ scanStatus.label }}
        </span>
      </div>

      <div class="health-row">
        <span class="h-label">Nguồn kích hoạt:</span>
        <span class="h-val">
          {{ latestScan?.triggerSource === 'schedule' ? 'Tự động định kỳ' : 'Kích hoạt thủ công' }}
        </span>
      </div>

      <div class="health-row">
        <span class="h-label">Kênh quét thành công:</span>
        <span class="h-val mono">
          {{ latestScan?.channelsSuccess || 0 }} / {{ latestScan?.channelsTotal || 0 }} kênh
        </span>
      </div>

      <div class="health-row">
        <span class="h-label">Video tìm thấy:</span>
        <span class="h-val mono">{{ latestScan?.videosFound || 0 }} video</span>
      </div>

      <div class="health-row">
        <span class="h-label">Snapshot tạo mới:</span>
        <span class="h-val mono">{{ latestScan?.snapshotsCreated || 0 }} snapshot</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DashboardScanRun } from '@/types/dashboard';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  latestScan: DashboardScanRun | null;
}>();

const scanStatus = computed(() => {
  const status = props.latestScan?.status;
  if (status === 'success') return { label: 'Thành công', tone: 'success' };
  if (status === 'running') return { label: 'Đang chạy', tone: 'info' };
  if (status === 'partial') return { label: 'Thành công 1 phần', tone: 'warning' };
  if (status === 'failed') return { label: 'Thất bại', tone: 'danger' };
  return { label: 'Chưa có', tone: 'neutral' };
});
</script>

<style scoped>
.overview-data-health {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.health-telemetry-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.health-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--bg-page-secondary, #F8FAFC);
  border-radius: 6px;
  font-size: 12.5px;
}

[data-theme="dark"] .health-row {
  background: rgba(8, 14, 24, 0.65);
}

.h-label {
  color: var(--text-secondary);
}

.h-val {
  font-weight: 600;
  color: var(--text-primary);
}

.badge-mini {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badge-success {
  background: #ECFDF5;
  color: #059669;
}

.badge-info {
  background: #EFF6FF;
  color: #2563EB;
}

.badge-warning {
  background: #FFFBEB;
  color: #D97706;
}

.badge-danger {
  background: #FEF2F2;
  color: #EF4444;
}

.badge-neutral {
  background: #F1F5F9;
  color: #64748B;
}
</style>
