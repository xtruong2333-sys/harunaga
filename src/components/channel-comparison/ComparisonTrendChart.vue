<template>
  <div class="comparison-trend-chart card">
    <div class="chart-header">
      <div class="title-wrap">
        <h3 class="chart-title">XU HƯỚNG VPH — 24 GIỜ GẦN NHẤT</h3>
        <p class="chart-sub">Không phụ thuộc bộ lọc thời gian đăng video phía trên. Biểu đồ phản ánh tốc độ tăng trưởng đo được theo từng giờ thực tế.</p>
      </div>

      <!-- Legend with Toggle Visibility -->
      <div class="chart-legend">
        <button
          v-for="ch in channels"
          :key="ch.id"
          type="button"
          class="legend-item-btn"
          :class="{ 'is-hidden': isChannelHidden(ch.id) }"
          @click="toggleChannel(ch.id)"
          :title="`Bật/tắt đường biểu diễn của ${ch.name}`"
        >
          <span class="legend-color-dot" :style="{ backgroundColor: ch.color }"></span>
          <span class="legend-name">{{ ch.name }}</span>
        </button>
      </div>
    </div>

    <!-- Chart Canvas / SVG Container -->
    <div v-if="hasTrendData" class="chart-wrapper">
      <svg
        viewBox="0 0 940 320"
        class="trend-svg"
        preserveAspectRatio="xMidYMid meet"
        @mouseleave="activeTooltip = null"
      >
        <!-- Grid Lines & Y-Axis Labels -->
        <g class="grid-lines">
          <g v-for="tick in yAxisTicks" :key="tick.value">
            <line
              x1="70"
              :y1="tick.y"
              x2="910"
              :y2="tick.y"
              stroke="#e2e8f0"
              stroke-dasharray="4 4"
            />
            <text
              x="60"
              :y="tick.y + 4"
              text-anchor="end"
              class="axis-text mono"
            >
              {{ tick.value.toLocaleString('vi-VN') }}
            </text>
          </g>
        </g>

        <!-- X-Axis Labels -->
        <g class="x-axis">
          <text
            v-for="xLab in xAxisLabels"
            :key="xLab.key"
            :x="xLab.x"
            y="295"
            text-anchor="middle"
            class="axis-text mono"
          >
            {{ xLab.text }}
          </text>
        </g>

        <!-- Channel Paths (Separate segments for gaps) -->
        <g v-for="ch in visibleChannelsList" :key="ch.id" class="channel-series">
          <path
            v-for="(segPath, segIdx) in getChannelSegmentPaths(ch)"
            :key="segIdx"
            :d="segPath"
            fill="none"
            :stroke="ch.color"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="trend-line"
          />

          <!-- Data Points -->
          <circle
            v-for="pt in getChannelPlotPoints(ch)"
            :key="pt.hourKey"
            :cx="pt.x"
            :cy="pt.y"
            r="4.5"
            :fill="ch.color"
            stroke="#ffffff"
            stroke-width="2"
            class="trend-point"
            @mouseenter="showTooltip($event, ch, pt)"
          />
        </g>
      </svg>

      <!-- Tooltip Overlay -->
      <div
        v-if="activeTooltip"
        class="chart-tooltip"
        :style="{ left: `${activeTooltip.pageX}px`, top: `${activeTooltip.pageY}px` }"
      >
        <div class="tooltip-header" :style="{ borderLeftColor: activeTooltip.channelColor }">
          <span class="tooltip-ch-name">{{ activeTooltip.channelName }}</span>
          <span class="tooltip-time">{{ activeTooltip.hourLabel }}</span>
        </div>
        <div class="tooltip-body">
          <div class="tooltip-row">
            <span class="tooltip-label">VPH Trung bình:</span>
            <span class="tooltip-val mono">{{ activeTooltip.avgVph.toLocaleString('vi-VN') }} VPH</span>
          </div>
          <div class="tooltip-row text-muted">
            <span class="tooltip-label">Số mẫu đo:</span>
            <span class="tooltip-val mono">{{ activeTooltip.sampleCount }} lần</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty Trend Placeholder -->
    <div v-else class="chart-empty">
      <AppIcon name="bar-chart-2" :size="32" class="empty-icon" />
      <p class="empty-title">Chưa có dữ liệu xu hướng VPH trong 24 giờ qua</p>
      <p class="empty-desc">Khi các tác vụ quét định kỳ ghi nhận các mốc snapshot mới, biểu đồ xu hướng 24h sẽ tự động hiển thị.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ChannelComparisonItem, ChannelComparisonTrendPoint } from '@/types/channel-comparison';

const props = defineProps<{
  channels: ChannelComparisonItem[];
  allTrendHourKeys: string[];
}>();

const hiddenChannelIds = ref<Set<string>>(new Set());

function isChannelHidden(id: string): boolean {
  return hiddenChannelIds.value.has(id);
}

function toggleChannel(id: string) {
  if (hiddenChannelIds.value.has(id)) {
    hiddenChannelIds.value.delete(id);
  } else {
    // Keep at least one visible
    if (hiddenChannelIds.value.size < props.channels.length - 1) {
      hiddenChannelIds.value.add(id);
    }
  }
}

const visibleChannelsList = computed(() => {
  return props.channels.filter(c => !hiddenChannelIds.value.has(c.id));
});

const hasTrendData = computed(() => {
  return props.channels.some(c => c.trendPoints.length > 0);
});

// Max VPH for Y scaling
const chartMaxVph = computed(() => {
  let max = 0;
  for (const ch of props.channels) {
    for (const pt of ch.trendPoints) {
      if (pt.avgVph > max) max = pt.avgVph;
    }
  }
  return max > 0 ? Math.ceil(max * 1.18) : 100;
});

// Y-Axis Ticks (4 divisions)
const yAxisTicks = computed(() => {
  const max = chartMaxVph.value;
  const ticks = [0, Math.round(max * 0.33), Math.round(max * 0.66), max];
  return ticks.map(val => ({
    value: val,
    y: 270 - (val / max) * 230,
  }));
});

// X-Axis Labels (up to 6 evenly spaced labels)
const xAxisLabels = computed(() => {
  const hours = props.allTrendHourKeys;
  if (hours.length === 0) return [];
  const count = hours.length;

  const indices = new Set<number>();
  indices.add(0);
  if (count > 2) indices.add(Math.floor(count * 0.25));
  if (count > 2) indices.add(Math.floor(count * 0.5));
  if (count > 2) indices.add(Math.floor(count * 0.75));
  if (count > 1) indices.add(count - 1);

  return Array.from(indices).sort((a, b) => a - b).map(idx => {
    const key = hours[idx];
    const x = 70 + (idx / Math.max(1, count - 1)) * 840;
    const parts = key.split(' ');
    const hourPart = parts[1] || '';
    return {
      key,
      x,
      text: hourPart,
    };
  });
});

interface PlotPoint extends ChannelComparisonTrendPoint {
  x: number;
  y: number;
  hourIndex: number;
}

function getChannelPlotPoints(ch: ChannelComparisonItem): PlotPoint[] {
  const hours = props.allTrendHourKeys;
  if (hours.length === 0) return [];
  const max = chartMaxVph.value;

  const points: PlotPoint[] = [];
  for (const pt of ch.trendPoints) {
    const hourIdx = hours.indexOf(pt.hourKey);
    if (hourIdx !== -1) {
      const x = 70 + (hourIdx / Math.max(1, hours.length - 1)) * 840;
      const y = 270 - (pt.avgVph / max) * 230;
      points.push({
        ...pt,
        x,
        y,
        hourIndex: hourIdx,
      });
    }
  }
  return points.sort((a, b) => a.hourIndex - b.hourIndex);
}

/**
 * Split into contiguous segments so missing hours create true gaps,
 * instead of plunging line down to 0 or joining non-consecutive hours.
 */
function getChannelSegmentPaths(ch: ChannelComparisonItem): string[] {
  const pts = getChannelPlotPoints(ch);
  if (pts.length === 0) return [];

  const segments: PlotPoint[][] = [];
  let currentSegment: PlotPoint[] = [pts[0]];

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    // If consecutive in hourIndex (diff === 1), same segment
    if (curr.hourIndex === prev.hourIndex + 1) {
      currentSegment.push(curr);
    } else {
      // Gap detected -> end current segment, start new
      segments.push(currentSegment);
      currentSegment = [curr];
    }
  }
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  // Convert each segment to an SVG path string
  return segments.map(seg => {
    if (seg.length === 1) {
      // Single isolated point -> draw small dot line
      return `M ${seg[0].x} ${seg[0].y} L ${seg[0].x + 0.1} ${seg[0].y}`;
    }
    return seg.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });
}

// Tooltip State
const activeTooltip = ref<{
  channelName: string;
  channelColor: string;
  hourLabel: string;
  avgVph: number;
  sampleCount: number;
  pageX: number;
  pageY: number;
} | null>(null);

function showTooltip(event: MouseEvent, ch: ChannelComparisonItem, pt: PlotPoint) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  activeTooltip.value = {
    channelName: ch.name,
    channelColor: ch.color,
    hourLabel: pt.hourLabel,
    avgVph: pt.avgVph,
    sampleCount: pt.sampleCount,
    pageX: rect.left + rect.width / 2,
    pageY: rect.top - 10,
  };
}
</script>

<style scoped>
.comparison-trend-chart {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
  position: relative;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.chart-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.chart-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.legend-item-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  transition: all 0.15s;
}

.legend-item-btn:hover {
  border-color: #cbd5e1;
}

.legend-item-btn.is-hidden {
  opacity: 0.4;
  text-decoration: line-through;
}

.legend-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-wrapper {
  width: 100%;
  overflow-x: auto;
}

.trend-svg {
  width: 100%;
  height: auto;
  max-height: 360px;
  display: block;
}

.axis-text {
  font-size: 11px;
  fill: #64748b;
}

.trend-line {
  transition: stroke-width 0.2s;
}

.trend-point {
  cursor: pointer;
  transition: transform 0.15s;
}

.trend-point:hover {
  transform: scale(1.4);
}

.chart-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  z-index: 1000;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  padding: 10px 14px;
  pointer-events: none;
  font-size: 0.8rem;
  min-width: 180px;
}

.tooltip-header {
  border-left: 3px solid #2563eb;
  padding-left: 6px;
  margin-bottom: 6px;
}

.tooltip-ch-name {
  display: block;
  font-weight: 700;
  color: #0f172a;
}

.tooltip-time {
  font-size: 0.72rem;
  color: #64748b;
}

.tooltip-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.tooltip-label {
  color: #64748b;
}

.tooltip-val {
  font-weight: 700;
  color: #0f172a;
}

.chart-empty {
  padding: 48px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
}

.empty-desc {
  font-size: 0.82rem;
  color: #64748b;
  max-width: 480px;
  margin: 0;
}
</style>