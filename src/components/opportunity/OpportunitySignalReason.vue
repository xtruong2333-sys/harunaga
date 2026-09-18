<template>
  <div class="opportunity-signal-reason">
    <div class="reason-header">
      <AppIcon name="zap" size="13" class="reason-header-icon" />
      <span class="reason-title">Tín hiệu đang quan sát</span>
    </div>

    <ul class="reason-list">
      <!-- 1. VPH Fact -->
      <li class="reason-item">
        <span class="bullet-dot">•</span>
        <span>
          Tốc độ đo được: <strong>{{ formattedVph }}</strong>
        </span>
      </li>

      <!-- 2. Threshold Comparison Fact -->
      <li v-if="video.channel.alertVphThreshold > 0" class="reason-item">
        <span class="bullet-dot">•</span>
        <span v-if="video.isOverThreshold">
          Vượt ngưỡng kênh: <strong>+{{ formatNumber(video.latestMeasuredVph - video.channel.alertVphThreshold) }} VPH</strong> ({{ video.thresholdRatio }}%)
        </span>
        <span v-else>
          So với ngưỡng kênh: <strong>{{ video.thresholdRatio }}%</strong> (Ngưỡng: {{ formatNumber(video.channel.alertVphThreshold) }} VPH)
        </span>
      </li>

      <!-- 3. Recent View Delta Fact -->
      <li v-if="video.latestDeltaViews !== null && video.latestDeltaViews !== undefined" class="reason-item">
        <span class="bullet-dot">•</span>
        <span>
          Tăng gần nhất: <strong>+{{ formatNumber(video.latestDeltaViews) }} lượt xem</strong>
        </span>
      </li>

      <!-- 4. Video Age Fact -->
      <li class="reason-item">
        <span class="bullet-dot">•</span>
        <span>
          Thời gian xuất bản: <strong>{{ video.videoAge }}</strong>
        </span>
      </li>

      <!-- 5. Alert Status Fact -->
      <li v-if="video.alert && video.alert.status === 'sent'" class="reason-item">
        <span class="bullet-dot text-success">•</span>
        <span>
          Cảnh báo hệ thống: <strong>Đã phát cảnh báo tự động</strong>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { OpportunityVideo } from '@/types/opportunity';

const props = defineProps<{
  video: OpportunityVideo;
}>();

const formattedVph = computed(() => {
  if (props.video.latestMeasuredVph === 0) return '0 VPH';
  return `${formatNumber(Math.round(props.video.latestMeasuredVph))} VPH`;
});

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString('vi-VN');
}
</script>

<style scoped>
.opportunity-signal-reason {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
}

.reason-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--primary, #2563EB);
  font-size: 11.5px;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

[data-theme="dark"] .reason-header {
  color: #38BDF8;
}

.reason-header-icon {
  flex-shrink: 0;
}

.reason-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.reason-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary, #475569);
  line-height: 1.45;
}

.reason-item strong {
  color: var(--text-primary, #0F172A);
  font-weight: 650;
}

.bullet-dot {
  color: var(--primary, #2563EB);
  font-weight: bold;
  font-size: 14px;
  line-height: 1;
}

.bullet-dot.text-success {
  color: #10B981;
}

[data-theme="dark"] .bullet-dot {
  color: #38BDF8;
}
</style>
