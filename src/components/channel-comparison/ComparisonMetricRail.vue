<template>
  <div class="comparison-metric-rail card">
    <div class="rail-header">
      <div class="title-wrap">
        <h3 class="rail-title">ĐỐI CHIẾU CHỈ SỐ CỐT LÕI</h3>
        <p class="rail-sub">Đối sánh trực tiếp các đại lượng đo lường thực tế giữa các kênh đối thủ trong khoảng thời gian đã chọn.</p>
      </div>
    </div>

    <div class="metrics-list">
      <!-- Metric Item -->
      <div
        v-for="m in metricConfigs"
        :key="m.key"
        class="metric-compare-row"
      >
        <div class="metric-info-col">
          <div class="metric-name-wrap">
            <span class="metric-name">{{ m.label }}</span>
            <span v-if="m.unit" class="metric-unit-tag">{{ m.unit }}</span>
          </div>
          <p v-if="m.hint" class="metric-hint">{{ m.hint }}</p>
        </div>

        <div class="metric-channels-grid" :style="{ gridTemplateColumns: `repeat(${channels.length}, 1fr)` }">
          <div
            v-for="ch in channels"
            :key="ch.id"
            class="channel-metric-cell"
            :class="{ 'is-factual-max': isFactualMax(ch, m.key) }"
          >
            <div class="cell-top-row">
              <span class="cell-channel-dot" :style="{ backgroundColor: ch.color }"></span>
              <span class="cell-val mono">
                {{ formatCellVal(ch, m.key) }}
              </span>
              <span v-if="isFactualMax(ch, m.key)" class="max-badge" title="Giá trị lớn nhất trong nhóm so sánh">
                CAO NHẤT
              </span>
            </div>

            <!-- Proportional Bar Indicator -->
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width: `${getBarPercent(ch, m.key)}%`,
                  backgroundColor: ch.color
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChannelComparisonItem } from '@/types/channel-comparison';
import { formatDelta } from '@/services/channel-comparison-service';

const props = defineProps<{
  channels: ChannelComparisonItem[];
}>();

interface MetricConfig {
  key: keyof ChannelComparisonItem['metrics'];
  label: string;
  unit?: string;
  hint?: string;
}

const metricConfigs: MetricConfig[] = [
  {
    key: 'maxVph',
    label: 'VPH CAO NHẤT',
    unit: 'VPH',
    hint: 'Tốc độ tăng trưởng cao nhất từng đo được của một video.',
  },
  {
    key: 'risingVideoCount',
    label: 'VIDEO ĐANG TĂNG',
    unit: 'video',
    hint: 'Số lượng video có tốc độ tăng trưởng VPH > 0.',
  },
  {
    key: 'risingVideoRatio',
    label: 'TỶ LỆ ĐANG TĂNG',
    unit: '%',
    hint: 'Tỷ lệ video có VPH > 0 trên số video đã có dữ liệu VPH.',
  },
  {
    key: 'avgMeasuredVph',
    label: 'VPH TRUNG BÌNH ĐO ĐƯỢC',
    unit: 'VPH',
    hint: 'Trung bình VPH của các video đã đo (bao gồm 0, loại trừ null).',
  },
  {
    key: 'trackedViews',
    label: 'LƯỢT XEM ĐANG THEO DÕI',
    unit: 'lượt xem',
    hint: 'Tổng lượt xem tích lũy từ các video trong khoảng thời gian này.',
  },
  {
    key: 'latestViewDelta',
    label: 'DELTA GẦN NHẤT',
    unit: 'lượt xem',
    hint: 'Tổng lượt xem tăng thêm ở lần kiểm tra snapshot mới nhất.',
  },
  {
    key: 'videoCount',
    label: 'SỐ VIDEO XUẤT BẢN',
    unit: 'video',
    hint: 'Tổng số video của kênh được xuất bản trong khoảng thời gian lọc.',
  },
];

function formatCellVal(ch: ChannelComparisonItem, key: keyof ChannelComparisonItem['metrics']): string {
  const val = ch.metrics[key];
  if (val === null || val === undefined) return '—';

  if (key === 'latestViewDelta') {
    return formatDelta(val);
  }
  if (key === 'risingVideoRatio') {
    return `${val}%`;
  }
  return val.toLocaleString('vi-VN');
}

function getNumericVal(ch: ChannelComparisonItem, key: keyof ChannelComparisonItem['metrics']): number | null {
  const v = ch.metrics[key];
  if (v === null || v === undefined) return null;
  return Number(v);
}

function isFactualMax(ch: ChannelComparisonItem, key: keyof ChannelComparisonItem['metrics']): boolean {
  if (props.channels.length < 2) return false;
  const currentVal = getNumericVal(ch, key);
  if (currentVal === null || currentVal <= 0) return false;

  const validVals = props.channels
    .map(c => getNumericVal(c, key))
    .filter((v): v is number => v !== null && v > 0);

  if (validVals.length === 0) return false;
  const max = Math.max(...validVals);
  return currentVal === max;
}

function getBarPercent(ch: ChannelComparisonItem, key: keyof ChannelComparisonItem['metrics']): number {
  const currentVal = getNumericVal(ch, key);
  if (currentVal === null || currentVal <= 0) return 0;

  if (key === 'risingVideoRatio') {
    return Math.min(100, Math.max(0, currentVal));
  }

  const validVals = props.channels
    .map(c => getNumericVal(c, key))
    .filter((v): v is number => v !== null && v > 0);

  if (validVals.length === 0) return 0;
  const max = Math.max(...validVals);
  if (max === 0) return 0;
  return Math.round((currentVal / max) * 100);
}
</script>

<style scoped>
.comparison-metric-rail {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.rail-header {
  margin-bottom: 20px;
}

.rail-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.rail-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-compare-row {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  align-items: center;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.metric-info-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-name-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metric-name {
  font-size: 0.82rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: 0.02em;
}

.metric-unit-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  padding: 1px 5px;
  border-radius: 4px;
}

.metric-hint {
  font-size: 0.74rem;
  color: #64748b;
  margin: 0;
  line-height: 1.3;
}

.metric-channels-grid {
  display: grid;
  gap: 16px;
}

.channel-metric-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  transition: all 0.15s;
}

.channel-metric-cell.is-factual-max {
  border-color: #2563eb;
  background: #f0f7ff;
}

.cell-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cell-channel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cell-val {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.max-badge {
  margin-left: auto;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  background: #2563eb;
  color: #ffffff;
  border-radius: 4px;
}

.bar-track {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

@media (max-width: 900px) {
  .metric-compare-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>