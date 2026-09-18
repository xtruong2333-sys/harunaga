<template>
  <div class="overview-activity section-container">
    <div class="section-header">
      <div class="section-title-wrap">
        <div class="section-kicker">NHẬT KÝ QUÉT TỰ ĐỘNG</div>
        <h2 class="section-title">Hoạt Động Gần Đây</h2>
      </div>
      <router-link to="/tinh-trang-du-lieu" class="section-link">
        <span>Sức Khỏe Dữ Liệu</span>
        <AppIcon name="arrow-right" size="13" />
      </router-link>
    </div>

    <div v-if="!scans || scans.length === 0" class="activity-empty">
      Chưa có phiên quét nào được ghi nhận.
    </div>

    <div v-else class="activity-timeline">
      <div
        v-for="scan in scans.slice(0, 5)"
        :key="scan.id"
        class="timeline-item"
      >
        <div class="timeline-bullet" :class="`bullet-${scan.status}`"></div>

        <div class="timeline-body">
          <div class="timeline-top">
            <span class="timeline-time mono">{{ formatTimeOnly(scan.startedAt) }}</span>
            <span class="trigger-tag" :class="`trigger-${scan.triggerSource}`">
              {{ scan.triggerSource === 'schedule' ? 'Tự động' : 'Thủ công' }}
            </span>
          </div>

          <div class="timeline-summary">
            <strong>{{ formatStatusLabel(scan.status) }}</strong>
            <span class="timeline-metrics-text">
              • {{ scan.channelsSuccess }}/{{ scan.channelsTotal }} kênh • {{ scan.videosFound }} video • {{ scan.alertsSent }} cảnh báo
            </span>
          </div>

          <div v-if="scan.errorSummary" class="timeline-error">
            <AppIcon name="alert-triangle" size="12" />
            <span>{{ scan.errorSummary }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DashboardScanRun } from '@/types/dashboard';
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  scans: DashboardScanRun[];
}>();

function formatTimeOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return iso;
  }
}

function formatStatusLabel(status: string): string {
  if (status === 'success') return 'Quét dữ liệu hoàn tất';
  if (status === 'running') return 'Đang thực hiện quét';
  if (status === 'partial') return 'Quét thành công một phần';
  if (status === 'failed') return 'Lỗi phiên quét';
  return 'Trạng thái phiên quét';
}
</script>

<style scoped>
.overview-activity {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  padding-left: 14px;
}

.activity-timeline::before {
  content: "";
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 4px;
  width: 2px;
  background: var(--border, #E3EBF3);
}

[data-theme="dark"] .activity-timeline::before {
  background: rgba(255, 255, 255, 0.08);
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.timeline-bullet {
  position: absolute;
  left: -14px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3B82F6;
  border: 2px solid var(--surface, #FFFFFF);
  box-shadow: 0 0 0 1px var(--border, #E3EBF3);
}

.bullet-success {
  background: #10B981;
}

.bullet-warning,
.bullet-partial {
  background: #F59E0B;
}

.bullet-failed,
.bullet-danger {
  background: #EF4444;
}

.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
}

.timeline-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-time {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary);
}

.trigger-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}

.trigger-schedule {
  background: #EFF6FF;
  color: #2563EB;
}

.trigger-manual {
  background: #F1F5F9;
  color: #64748B;
}

.timeline-summary {
  font-size: 12.5px;
  color: var(--text-primary);
  line-height: 1.4;
}

.timeline-metrics-text {
  color: var(--text-secondary);
  font-size: 12px;
}

.timeline-error {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #DC2626;
  background: #FEF2F2;
  padding: 3px 8px;
  border-radius: 5px;
  margin-top: 3px;
}

[data-theme="dark"] .timeline-error {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
}
</style>
