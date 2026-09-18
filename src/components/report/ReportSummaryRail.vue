<template>
  <div class="summary-rail" role="region" aria-label="Chỉ số báo cáo tổng quan">
    <div class="rail-item">
      <div class="rail-icon-wrap is-blue">
        <AppIcon name="clock" :size="16" />
      </div>
      <div class="rail-content">
        <span class="rail-label">Video mới</span>
        <span class="rail-value">{{ formatNumber(summary.newVideosCount) }}</span>
        <span class="rail-sub">Trong {{ range === '24h' ? '24 giờ' : '7 ngày' }}</span>
      </div>
    </div>

    <div class="rail-item">
      <div class="rail-icon-wrap is-indigo">
        <AppIcon name="tv" :size="16" />
      </div>
      <div class="rail-content">
        <span class="rail-label">Kênh có video mới</span>
        <span class="rail-value">{{ formatNumber(summary.channelsWithNewVideosCount) }}</span>
        <span class="rail-sub">Kênh hoạt động</span>
      </div>
    </div>

    <div class="rail-item">
      <div class="rail-icon-wrap is-emerald">
        <AppIcon name="trending-up" :size="16" />
      </div>
      <div class="rail-content">
        <span class="rail-label">Video mới đang tăng</span>
        <span class="rail-value">{{ formatNumber(summary.risingNewVideosCount) }}</span>
        <span class="rail-sub">VPH đo được &gt; 0</span>
      </div>
    </div>

    <div class="rail-item">
      <div class="rail-icon-wrap is-amber">
        <AppIcon name="bell" :size="16" />
      </div>
      <div class="rail-content">
        <span class="rail-label">Cảnh báo phát sinh</span>
        <span class="rail-value">{{ formatNumber(summary.alertsCount) }}</span>
        <span class="rail-sub">Vượt ngưỡng VPH</span>
      </div>
    </div>

    <div class="rail-item">
      <div class="rail-icon-wrap is-cyan">
        <AppIcon name="database" :size="16" />
      </div>
      <div class="rail-content">
        <span class="rail-label">Snapshot ghi nhận</span>
        <span class="rail-value">{{ formatNumber(summary.snapshotsCount) }}</span>
        <span class="rail-sub">Điểm đo snapshot</span>
      </div>
    </div>

    <div class="rail-item" :class="{ 'has-attention': summary.attentionScansCount > 0 }">
      <div class="rail-icon-wrap" :class="summary.attentionScansCount > 0 ? 'is-rose' : 'is-slate'">
        <AppIcon name="alert-circle" :size="16" />
      </div>
      <div class="rail-content">
        <span class="rail-label">Lần quét cần chú ý</span>
        <span class="rail-value" :class="{ 'text-rose': summary.attentionScansCount > 0 }">
          {{ formatNumber(summary.attentionScansCount) }}
        </span>
        <span class="rail-sub">{{ summary.attentionScansCount > 0 ? 'Thất bại/Một phần' : 'Hoạt động ổn định' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ReportSummary, ReportRange } from '@/types/report';
import { formatNumber } from '@/services/report-service';

defineProps<{
  summary: ReportSummary;
  range: ReportRange;
}>();
</script>

<style scoped>
.summary-rail {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.rail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

[data-theme="dark"] .rail-item {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.7);
}

.rail-item.has-attention {
  border-color: rgba(244, 63, 94, 0.35);
  background: rgba(254, 242, 242, 0.5);
}

[data-theme="dark"] .rail-item.has-attention {
  background: rgba(244, 63, 94, 0.08);
  border-color: rgba(244, 63, 94, 0.3);
}

.rail-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.rail-icon-wrap.is-blue {
  background: #eff6ff;
  color: #2563eb;
}
.rail-icon-wrap.is-indigo {
  background: #eef2ff;
  color: #4f46e5;
}
.rail-icon-wrap.is-emerald {
  background: #ecfdf5;
  color: #059669;
}
.rail-icon-wrap.is-amber {
  background: #fffbeb;
  color: #d97706;
}
.rail-icon-wrap.is-cyan {
  background: #ecfeff;
  color: #0891b2;
}
.rail-icon-wrap.is-rose {
  background: #fff1f2;
  color: #e11d48;
}
.rail-icon-wrap.is-slate {
  background: #f1f5f9;
  color: #64748b;
}

[data-theme="dark"] .rail-icon-wrap.is-blue {
  background: rgba(37, 99, 235, 0.2);
  color: #60a5fa;
}
[data-theme="dark"] .rail-icon-wrap.is-indigo {
  background: rgba(79, 70, 229, 0.2);
  color: #818cf8;
}
[data-theme="dark"] .rail-icon-wrap.is-emerald {
  background: rgba(5, 150, 105, 0.2);
  color: #34d399;
}
[data-theme="dark"] .rail-icon-wrap.is-amber {
  background: rgba(217, 119, 6, 0.2);
  color: #fbbf24;
}
[data-theme="dark"] .rail-icon-wrap.is-cyan {
  background: rgba(8, 145, 178, 0.2);
  color: #22d3ee;
}
[data-theme="dark"] .rail-icon-wrap.is-rose {
  background: rgba(225, 29, 72, 0.2);
  color: #fb7185;
}
[data-theme="dark"] .rail-icon-wrap.is-slate {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.rail-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rail-label {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.rail-value {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.text-rose {
  color: #e11d48 !important;
}

[data-theme="dark"] .text-rose {
  color: #fb7185 !important;
}

.rail-sub {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1200px) {
  .summary-rail {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .summary-rail {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .rail-item {
    padding: 10px 12px;
    gap: 8px;
  }
  .rail-value {
    font-size: 16px;
  }
}
</style>
