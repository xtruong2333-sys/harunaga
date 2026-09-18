<template>
  <div class="overview-performance section-container">
    <div class="section-header">
      <div class="section-title-wrap">
        <div class="section-kicker">PHÂN TÍCH TÍN HIỆU</div>
        <h2 class="section-title">Hiệu Suất Tổng Quan</h2>
      </div>
      <router-link to="/bao-cao" class="section-link">
        <span>Xem Báo Cáo</span>
        <AppIcon name="arrow-right" size="13" />
      </router-link>
    </div>

    <div class="performance-body">
      <!-- 1. Rising Ratio Progress -->
      <div class="telemetry-row">
        <div class="telemetry-info">
          <span class="telemetry-label">Tỷ lệ video đang tăng trưởng (VPH > 0)</span>
          <span class="telemetry-val mono">
            {{ risingRatio }}% ({{ summary?.risingVideosCount || 0 }} / {{ summary?.totalVideosCount || 0 }})
          </span>
        </div>
        <div class="progress-track-bar">
          <div class="progress-fill-bar" :style="{ width: `${risingRatio}%` }"></div>
        </div>
      </div>

      <!-- 2. Channel Success Ratio -->
      <div v-if="summary?.latestScan" class="telemetry-row">
        <div class="telemetry-info">
          <span class="telemetry-label">Tỷ lệ kênh quét thành công gần nhất</span>
          <span class="telemetry-val mono">
            {{ channelSuccessRatio }}% ({{ summary.latestScan.channelsSuccess }} / {{ summary.latestScan.channelsTotal }})
          </span>
        </div>
        <div class="progress-track-bar">
          <div
            class="progress-fill-bar bar-success"
            :style="{ width: `${channelSuccessRatio}%` }"
          ></div>
        </div>
      </div>

      <!-- 3. Key Telemetry Metrics Grid -->
      <div class="telemetry-grid">
        <div class="telemetry-box">
          <div class="t-box-lbl">SNAPSHOT THU THẬP</div>
          <div class="t-box-val mono">{{ summary?.latestScan?.snapshotsCreated || 0 }}</div>
          <div class="t-box-sub">Lần quét gần nhất</div>
        </div>

        <div class="telemetry-box">
          <div class="t-box-lbl">CẢNH BÁO ĐÃ PHÁT</div>
          <div class="t-box-val mono text-accent">{{ summary?.alertSummary?.sent || 0 }}</div>
          <div class="t-box-sub">Tới Discord webhook</div>
        </div>

        <div class="telemetry-box">
          <div class="t-box-lbl">NGƯỠNG ĐỘT PHÁ</div>
          <div class="t-box-val mono text-positive">
            {{ summary?.maxVph ? `${Math.round(summary.maxVph).toLocaleString('vi-VN')} VPH` : '—' }}
          </div>
          <div class="t-box-sub">Đỉnh tăng trưởng</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DashboardSummary } from '@/types/dashboard';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  summary: DashboardSummary | null;
}>();

const risingRatio = computed(() => {
  if (!props.summary || !props.summary.totalVideosCount || props.summary.totalVideosCount === 0) return 0;
  const ratio = (props.summary.risingVideosCount / props.summary.totalVideosCount) * 100;
  return Math.min(100, Math.round(ratio * 10) / 10);
});

const channelSuccessRatio = computed(() => {
  if (!props.summary?.latestScan || props.summary.latestScan.channelsTotal === 0) return 100;
  const ratio = (props.summary.latestScan.channelsSuccess / props.summary.latestScan.channelsTotal) * 100;
  return Math.min(100, Math.round(ratio));
});
</script>

<style scoped>
.overview-performance {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.performance-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.telemetry-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.telemetry-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
}

.telemetry-label {
  color: var(--text-secondary);
}

.telemetry-val {
  font-weight: 700;
  color: var(--text-primary);
}

.progress-track-bar {
  width: 100%;
  height: 7px;
  border-radius: 9999px;
  background: var(--bg-inset, #EEF4F8);
  overflow: hidden;
}

.progress-fill-bar {
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, #38BDF8, #2563EB);
  transition: width 0.4s ease;
}

.bar-success {
  background: linear-gradient(90deg, #34D399, #059669);
}

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 4px;
}

.telemetry-box {
  background: var(--bg-page-secondary, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

[data-theme="dark"] .telemetry-box {
  background: rgba(8, 14, 24, 0.65);
  border-color: rgba(125, 211, 252, 0.10);
}

.t-box-lbl {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.t-box-val {
  font-size: 16px;
  font-weight: 750;
  color: var(--text-primary);
}

.t-box-sub {
  font-size: 10px;
  color: var(--text-muted);
}

.text-accent {
  color: var(--primary, #2563EB);
}

[data-theme="dark"] .text-accent {
  color: #38BDF8;
}

.text-positive {
  color: #059669;
}

[data-theme="dark"] .text-positive {
  color: #34D399;
}

@media (max-width: 640px) {
  .telemetry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
