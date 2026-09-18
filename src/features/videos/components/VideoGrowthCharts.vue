<template>
  <div class="charts-container">
    <!-- Chart 1: Lượt Xem Theo Thời Gian -->
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title-wrap">
          <div class="chart-title">Lượt Xem Theo Thời Gian</div>
          <div class="chart-subtitle">Tăng trưởng lượt xem qua từng lần quét snapshot</div>
        </div>
        <div v-if="latestView !== null" class="chart-badge">
          Hiện tại: <strong>{{ videoService.formatViews(latestView) }}</strong> lượt xem
        </div>
      </div>

      <div v-if="snapshots.length === 0" class="chart-empty">
        Chưa có dữ liệu snapshot để vẽ biểu đồ.
      </div>

      <div v-else class="svg-wrap">
        <svg
          class="growth-svg"
          viewBox="0 0 700 240"
          preserveAspectRatio="none"
          @mouseleave="hoveredViewPoint = null"
        >
          <!-- Grid lines -->
          <line
            v-for="(gridY, i) in viewsGridLines"
            :key="i"
            x1="50"
            :y1="gridY.y"
            x2="680"
            :y2="gridY.y"
            class="grid-line"
          />

          <!-- Y Axis Labels -->
          <text
            v-for="(gridY, i) in viewsGridLines"
            :key="`y-txt-${i}`"
            x="42"
            :y="gridY.y + 4"
            class="axis-label y-axis"
          >
            {{ gridY.label }}
          </text>

          <!-- Gradient area below line -->
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.0" />
            </linearGradient>
            <linearGradient id="vphGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#34D399" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#34D399" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <!-- Area fill -->
          <polygon :points="viewsAreaPoints" fill="url(#viewsGradient)" />

          <!-- Line -->
          <polyline :points="viewsPolyline" class="chart-line views-line" />

          <!-- Data Points -->
          <g
            v-for="(pt, idx) in viewsCoords"
            :key="`vp-${idx}`"
            class="node-group"
            @mouseenter="hoveredViewPoint = pt"
          >
            <circle
              :cx="pt.x"
              :cy="pt.y"
              :r="hoveredViewPoint?.id === pt.id ? 7 : 4.5"
              class="node-circle views-node"
            />
            <!-- X label on bottom -->
            <text :x="pt.x" y="230" class="axis-label x-axis">{{ pt.timeLabel }}</text>
          </g>
        </svg>

        <!-- Tooltip overlay -->
        <div
          v-if="hoveredViewPoint"
          class="chart-tooltip"
          :style="{ left: `${(hoveredViewPoint.x / 700) * 100}%`, top: `${(hoveredViewPoint.y / 240) * 100}%` }"
        >
          <div class="tooltip-time">{{ hoveredViewPoint.fullTime }}</div>
          <div class="tooltip-value">{{ videoService.formatViews(hoveredViewPoint.viewCount) }} lượt xem</div>
          <div v-if="hoveredViewPoint.viewDelta !== null" class="tooltip-sub">
            Tăng: <span class="text-positive">{{ videoService.formatViewDelta(hoveredViewPoint.viewDelta) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart 2: VPH Theo Thời Gian -->
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title-wrap">
          <div class="chart-title">Tốc Độ Tăng Trưởng (VPH)</div>
          <div class="chart-subtitle">Tốc độ xem mỗi giờ được đo giữa các lần quét liên tiếp</div>
        </div>
        <div v-if="threshold && threshold > 0" class="chart-badge badge-threshold">
          Ngưỡng cảnh báo: <strong>{{ threshold.toLocaleString('vi-VN') }}</strong> VPH
        </div>
      </div>

      <div v-if="snapshots.length === 0" class="chart-empty">
        Chưa có dữ liệu snapshot để vẽ biểu đồ.
      </div>

      <div v-else class="svg-wrap">
        <svg
          class="growth-svg"
          viewBox="0 0 700 240"
          preserveAspectRatio="none"
          @mouseleave="hoveredVphPoint = null"
        >
          <!-- Grid lines -->
          <line
            v-for="(gridY, i) in vphGridLines"
            :key="i"
            x1="50"
            :y1="gridY.y"
            x2="680"
            :y2="gridY.y"
            class="grid-line"
          />

          <!-- Threshold dashed line -->
          <template v-if="thresholdY !== null">
            <line
              x1="50"
              :y1="thresholdY"
              x2="680"
              :y2="thresholdY"
              class="threshold-line"
            />
            <text x="670" :y="thresholdY - 6" class="threshold-label">
              Ngưỡng: {{ threshold?.toLocaleString('vi-VN') }} VPH
            </text>
          </template>

          <!-- Y Axis Labels -->
          <text
            v-for="(gridY, i) in vphGridLines"
            :key="`vph-y-${i}`"
            x="42"
            :y="gridY.y + 4"
            class="axis-label y-axis"
          >
            {{ gridY.label }}
          </text>

          <!-- Area fill (for valid VPH points) -->
          <polygon v-if="vphAreaPoints" :points="vphAreaPoints" fill="url(#vphGradient)" />

          <!-- Polyline for valid VPH points -->
          <polyline v-if="vphPolyline" :points="vphPolyline" class="chart-line vph-line" />

          <!-- Nodes for all points -->
          <g
            v-for="(pt, idx) in vphCoords"
            :key="`vphp-${idx}`"
            class="node-group"
            @mouseenter="hoveredVphPoint = pt"
          >
            <circle
              :cx="pt.x"
              :cy="pt.y"
              :r="hoveredVphPoint?.id === pt.id ? 7 : 4.5"
              class="node-circle"
              :class="pt.measuredVph !== null ? 'vph-node' : 'vph-null-node'"
            />
            <!-- X label on bottom -->
            <text :x="pt.x" y="230" class="axis-label x-axis">{{ pt.timeLabel }}</text>
          </g>
        </svg>

        <!-- Tooltip overlay -->
        <div
          v-if="hoveredVphPoint"
          class="chart-tooltip"
          :style="{ left: `${(hoveredVphPoint.x / 700) * 100}%`, top: `${(hoveredVphPoint.y / 240) * 100}%` }"
        >
          <div class="tooltip-time">{{ hoveredVphPoint.fullTime }}</div>
          <div class="tooltip-value">
            {{ hoveredVphPoint.measuredVph !== null ? `${Math.round(hoveredVphPoint.measuredVph).toLocaleString('vi-VN')} VPH` : 'Chưa có VPH' }}
          </div>
          <div v-if="hoveredVphPoint.elapsedSeconds !== null" class="tooltip-sub">
            Khoảng cách: {{ videoService.formatElapsedSeconds(hoveredVphPoint.elapsedSeconds) }}
          </div>
          <div v-if="hoveredVphPoint.viewDelta !== null" class="tooltip-sub">
            Tăng: <span class="text-positive">{{ videoService.formatViewDelta(hoveredVphPoint.viewDelta) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { VideoSnapshotPoint } from '@/types/video';
import { videoService } from '@/services/video-service';

const props = defineProps<{
  snapshots: VideoSnapshotPoint[];
  threshold?: number | null;
}>();

const hoveredViewPoint = ref<any | null>(null);
const hoveredVphPoint = ref<any | null>(null);

const latestView = computed(() => {
  if (!props.snapshots.length) return null;
  return props.snapshots[props.snapshots.length - 1].viewCount;
});

function formatShortTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatFullTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ---------------- CHART 1: VIEWS OVER TIME ----------------
const viewsCoords = computed(() => {
  const list = props.snapshots;
  if (!list.length) return [];

  const minView = Math.min(...list.map(s => s.viewCount));
  const maxView = Math.max(...list.map(s => s.viewCount));
  const range = maxView === minView ? (maxView > 0 ? maxView : 100) : maxView - minView;
  const padding = range * 0.15;
  const effectiveMin = Math.max(0, minView - padding);
  const effectiveMax = maxView + padding;
  const effectiveRange = effectiveMax - effectiveMin;

  const startX = 65;
  const endX = 665;
  const topY = 30;
  const bottomY = 200;
  const height = bottomY - topY;

  return list.map((s, idx) => {
    const x = list.length === 1 ? (startX + endX) / 2 : startX + (idx / (list.length - 1)) * (endX - startX);
    const y = bottomY - ((s.viewCount - effectiveMin) / effectiveRange) * height;
    return {
      id: s.id,
      x,
      y,
      viewCount: s.viewCount,
      viewDelta: s.viewDelta,
      timeLabel: formatShortTime(s.checkedAt),
      fullTime: formatFullTime(s.checkedAt),
    };
  });
});

const viewsPolyline = computed(() => {
  return viewsCoords.value.map(pt => `${pt.x},${pt.y}`).join(' ');
});

const viewsAreaPoints = computed(() => {
  const coords = viewsCoords.value;
  if (coords.length === 0) return '';
  const first = coords[0];
  const last = coords[coords.length - 1];
  return `${first.x},210 ` + coords.map(pt => `${pt.x},${pt.y}`).join(' ') + ` ${last.x},210`;
});

const viewsGridLines = computed(() => {
  const list = props.snapshots;
  if (!list.length) return [];
  const minView = Math.min(...list.map(s => s.viewCount));
  const maxView = Math.max(...list.map(s => s.viewCount));
  const range = maxView === minView ? (maxView > 0 ? maxView : 100) : maxView - minView;
  const padding = range * 0.15;
  const effectiveMin = Math.max(0, minView - padding);
  const effectiveMax = maxView + padding;

  const steps = 3;
  const lines = [];
  for (let i = 0; i <= steps; i++) {
    const val = effectiveMin + ((effectiveMax - effectiveMin) / steps) * (steps - i);
    const y = 30 + (i / steps) * (200 - 30);
    lines.push({
      y,
      label: Math.round(val).toLocaleString('vi-VN'),
    });
  }
  return lines;
});

// ---------------- CHART 2: VPH OVER TIME ----------------
const vphCoords = computed(() => {
  const list = props.snapshots;
  if (!list.length) return [];

  const validVphs = list.map(s => s.measuredVph).filter((v): v is number => v !== null && v !== undefined);
  const thresholdVal = props.threshold || 0;
  const maxVal = Math.max(...validVphs, thresholdVal, 100);
  const effectiveMax = maxVal * 1.25;

  const startX = 65;
  const endX = 665;
  const topY = 30;
  const bottomY = 200;
  const height = bottomY - topY;

  return list.map((s, idx) => {
    const x = list.length === 1 ? (startX + endX) / 2 : startX + (idx / (list.length - 1)) * (endX - startX);
    const y = s.measuredVph !== null
      ? bottomY - (s.measuredVph / effectiveMax) * height
      : bottomY; // Anchor at bottom for null
    return {
      id: s.id,
      x,
      y,
      measuredVph: s.measuredVph,
      elapsedSeconds: s.elapsedSeconds,
      viewDelta: s.viewDelta,
      timeLabel: formatShortTime(s.checkedAt),
      fullTime: formatFullTime(s.checkedAt),
    };
  });
});

const thresholdY = computed(() => {
  if (!props.threshold || props.threshold <= 0 || !props.snapshots.length) return null;
  const validVphs = props.snapshots.map(s => s.measuredVph).filter((v): v is number => v !== null && v !== undefined);
  const maxVal = Math.max(...validVphs, props.threshold, 100);
  const effectiveMax = maxVal * 1.25;
  const topY = 30;
  const bottomY = 200;
  const height = bottomY - topY;
  return bottomY - (props.threshold / effectiveMax) * height;
});

const vphPolyline = computed(() => {
  const valid = vphCoords.value.filter(pt => pt.measuredVph !== null);
  if (valid.length < 2) return '';
  return valid.map(pt => `${pt.x},${pt.y}`).join(' ');
});

const vphAreaPoints = computed(() => {
  const valid = vphCoords.value.filter(pt => pt.measuredVph !== null);
  if (valid.length < 2) return '';
  const first = valid[0];
  const last = valid[valid.length - 1];
  return `${first.x},210 ` + valid.map(pt => `${pt.x},${pt.y}`).join(' ') + ` ${last.x},210`;
});

const vphGridLines = computed(() => {
  const validVphs = props.snapshots.map(s => s.measuredVph).filter((v): v is number => v !== null && v !== undefined);
  const thresholdVal = props.threshold || 0;
  const maxVal = Math.max(...validVphs, thresholdVal, 100);
  const effectiveMax = maxVal * 1.25;

  const steps = 3;
  const lines = [];
  for (let i = 0; i <= steps; i++) {
    const val = (effectiveMax / steps) * (steps - i);
    const y = 30 + (i / steps) * (200 - 30);
    lines.push({
      y,
      label: `${Math.round(val).toLocaleString('vi-VN')} VPH`,
    });
  }
  return lines;
});
</script>

<style scoped>
.charts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.chart-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.chart-badge {
  font-size: 12px;
  color: var(--text-secondary);
  background-color: var(--bg-surface-elevated);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
}

.chart-badge.badge-threshold {
  color: #F59E0B;
  background-color: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.25);
}

.chart-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  background-color: var(--bg-surface-elevated);
  border-radius: 8px;
}

.svg-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.growth-svg {
  width: 100%;
  height: 240px;
  overflow: visible;
  display: block;
}

.grid-line {
  stroke: var(--border-subtle);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.threshold-line {
  stroke: #F59E0B;
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
}

.threshold-label {
  fill: #F59E0B;
  font-size: 10px;
  font-weight: 600;
  text-anchor: end;
}

.axis-label {
  fill: var(--text-muted);
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.axis-label.y-axis {
  text-anchor: end;
}

.axis-label.x-axis {
  text-anchor: middle;
}

.chart-line {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.views-line {
  stroke: #38BDF8;
}

.vph-line {
  stroke: #34D399;
}

.node-group {
  cursor: pointer;
}

.node-circle {
  transition: r 0.15s ease, stroke-width 0.15s ease;
}

.views-node {
  fill: #0B0D10;
  stroke: #38BDF8;
  stroke-width: 2.5;
}

.vph-node {
  fill: #0B0D10;
  stroke: #34D399;
  stroke-width: 2.5;
}

.vph-null-node {
  fill: var(--bg-surface-elevated);
  stroke: var(--text-muted);
  stroke-width: 1.5;
}

.chart-tooltip {
  position: absolute;
  transform: translate(-50%, -125%);
  pointer-events: none;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 20;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tooltip-time {
  font-size: 11px;
  color: var(--text-secondary);
}

.tooltip-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.tooltip-sub {
  font-size: 11px;
  color: var(--text-secondary);
}

.text-positive {
  color: #34D399;
  font-weight: 600;
}
</style>
