<template>
  <div class="overview-data-health section-container">
    <div class="section-header">
      <div class="section-title-wrap">
        <div class="section-kicker">TIẾN ĐỘ THU THẬP</div>
        <h2 class="section-title">Tình Trạng Dữ Liệu</h2>
      </div>
      <router-link to="/tinh-trang-du-lieu" class="section-link">
        <span>Xem chi tiết</span>
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
          {{ triggerSourceLabel }}
        </span>
      </div>

      <div class="health-row">
        <span class="h-label">Kênh quét thành công:</span>
        <span class="h-val mono">
          {{ latestScan ? `${latestScan.channelsSuccess} / ${latestScan.channelsTotal} kênh` : '—' }}
        </span>
      </div>

      <div class="health-row">
        <span class="h-label">Video tìm thấy:</span>
        <span class="h-val mono">{{ latestScan ? `${latestScan.videosFound} video` : '—' }}</span>
      </div>

      <div class="health-row">
        <span class="h-label">Snapshot tạo mới:</span>
        <span class="h-val mono">{{ latestScan ? `${latestScan.snapshotsCreated} snapshot` : '—' }}</span>
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

const triggerSourceLabel = computed(() => {
  if (!props.latestScan) return 'Chưa có dữ liệu';
  return props.latestScan.triggerSource === 'schedule' ? 'Tự động định kỳ' : 'Kích hoạt thủ công';
});

const scanStatus = computed(() => {
  const status = props.latestScan?.status;
  if (status === 'success') return { label: 'Thành công', tone: 'success' };
  if (status === 'running') return { label: 'Đang quét...', tone: 'info' };
  if (status === 'partial') return { label: 'Có lỗi một phần', tone: 'warning' };
  if (status === 'failed') return { label: 'Thất bại', tone: 'danger' };
  return { label: 'Chưa có dữ liệu', tone: 'neutral' };
});
</script>

<style scoped>
.overview-data-health {
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: var(--radius-lg, 12px);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-kicker {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary, #64748B);
}

.section-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  margin: 0.125rem 0 0;
}

.section-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--brand-primary, #2563EB);
  text-decoration: none;
  transition: color 0.15s ease;
}

.section-link:hover {
  color: var(--brand-secondary, #0EA5E9);
}

.health-telemetry-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.health-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px dashed var(--border, #E3EBF3);
}

.health-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.h-label {
  color: var(--text-secondary, #475569);
  font-weight: 500;
}

.h-val {
  color: var(--text-primary, #0F172A);
  font-weight: 600;
}

.badge-mini {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.6875rem;
  font-weight: 600;
}

.badge-success {
  background: var(--color-success-bg, #ECFDF5);
  color: var(--color-success-text, #059669);
}

.badge-info {
  background: var(--color-info-bg, #EFF6FF);
  color: var(--color-info-text, #2563EB);
}

.badge-warning {
  background: var(--color-warning-bg, #FFFBEB);
  color: var(--color-warning-text, #D97706);
}

.badge-danger {
  background: var(--color-danger-bg, #FEF2F2);
  color: var(--color-danger-text, #DC2626);
}

.badge-neutral {
  background: var(--bg-surface-secondary, #F8FAFC);
  color: var(--text-tertiary, #64748B);
}
</style>
