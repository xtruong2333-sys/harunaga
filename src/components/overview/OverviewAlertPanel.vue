<template>
  <div class="overview-alert-panel section-container">
    <div class="section-header">
      <div class="section-title-wrap">
        <div class="section-kicker">DISCORD WEBHOOK</div>
        <h2 class="section-title">Cảnh Báo Tín Hiệu</h2>
      </div>
      <router-link to="/lich-su-canh-bao" class="section-link">
        <span>Xem lịch sử</span>
        <AppIcon name="arrow-right" size="13" />
      </router-link>
    </div>

    <div class="alert-body">
      <!-- Segmented Bar -->
      <div class="segmented-bar">
        <div class="seg-fill seg-sent" :style="{ width: `${sentPct}%` }" title="Đã gửi"></div>
        <div class="seg-fill seg-pending" :style="{ width: `${pendingPct}%` }" title="Đang chờ"></div>
        <div class="seg-fill seg-failed" :style="{ width: `${failedPct}%` }" title="Gửi lỗi"></div>
      </div>

      <!-- Pipeline List -->
      <div class="pipeline-list">
        <div class="pipeline-row">
          <div class="p-label-group">
            <span class="p-dot dot-total"></span>
            <span class="p-label">Tổng cảnh báo</span>
          </div>
          <span class="p-val mono">{{ alertSummary?.total || 0 }}</span>
        </div>

        <div class="pipeline-row">
          <div class="p-label-group">
            <span class="p-dot dot-sent"></span>
            <span class="p-label">Đã gửi thành công</span>
          </div>
          <span class="p-val mono text-positive">{{ alertSummary?.sent || 0 }}</span>
        </div>

        <div class="pipeline-row">
          <div class="p-label-group">
            <span class="p-dot dot-pending"></span>
            <span class="p-label">Đang chờ xử lý</span>
          </div>
          <span class="p-val mono text-warning">{{ alertSummary?.pending || 0 }}</span>
        </div>

        <div class="pipeline-row">
          <div class="p-label-group">
            <span class="p-dot dot-failed"></span>
            <span class="p-label">Gửi thất bại / lỗi</span>
          </div>
          <span class="p-val mono text-danger">{{ alertSummary?.failed || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DashboardAlertSummary } from '@/types/dashboard';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  alertSummary: DashboardAlertSummary | null;
}>();

const total = computed(() => props.alertSummary?.total || 1);
const sentPct = computed(() => Math.round(((props.alertSummary?.sent || 0) / total.value) * 100));
const pendingPct = computed(() => Math.round(((props.alertSummary?.pending || 0) / total.value) * 100));
const failedPct = computed(() => Math.round(((props.alertSummary?.failed || 0) / total.value) * 100));
</script>

<style scoped>
.overview-alert-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.alert-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.segmented-bar {
  display: flex;
  height: 8px;
  width: 100%;
  border-radius: 9999px;
  background: var(--bg-inset, #EEF4F8);
  overflow: hidden;
  gap: 2px;
}

.seg-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.seg-sent {
  background: #10B981;
}

.seg-pending {
  background: #F59E0B;
}

.seg-failed {
  background: #EF4444;
}

.pipeline-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pipeline-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--bg-page-secondary, #F8FAFC);
  border-radius: 6px;
  font-size: 12.5px;
}

[data-theme="dark"] .pipeline-row {
  background: rgba(8, 14, 24, 0.65);
}

.p-label-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.p-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-total {
  background: var(--text-muted);
}

.dot-sent {
  background: #10B981;
}

.dot-pending {
  background: #F59E0B;
}

.dot-failed {
  background: #EF4444;
}

.p-label {
  color: var(--text-secondary);
}

.p-val {
  font-weight: 700;
  color: var(--text-primary);
}

.text-positive {
  color: #059669;
}

.text-warning {
  color: #D97706;
}

.text-danger {
  color: #DC2626;
}
</style>
