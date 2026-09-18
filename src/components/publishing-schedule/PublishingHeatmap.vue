<template>
  <div class="publishing-heatmap card">
    <div class="heatmap-header">
      <div>
        <h3 class="heatmap-title">MA TRẬN TẦN SUẤT XUẤT BẢN (7 NGÀY × 24 GIỜ)</h3>
        <p class="heatmap-sub">
          Mỗi ô thể hiện tổng số video được xuất bản trong khung 1 giờ (Múi giờ Việt Nam UTC+7).
          <span v-if="channelName">Đang xem dữ liệu của kênh: <strong>{{ channelName }}</strong></span>
        </p>
      </div>

      <!-- Legend -->
      <div class="heatmap-legend">
        <span class="legend-text">0 video</span>
        <span class="legend-cell level-0">·</span>
        <span class="legend-cell level-1"></span>
        <span class="legend-cell level-2"></span>
        <span class="legend-cell level-3"></span>
        <span class="legend-cell level-4"></span>
        <span class="legend-text">Nhiều nhất</span>
      </div>
    </div>

    <!-- Heatmap Scroll Container -->
    <div class="heatmap-scroll-wrap">
      <div class="heatmap-grid" role="grid" aria-label="Ma trận phân bố thời gian đăng video">
        <!-- Top Row: Hours 00 to 23 -->
        <div class="grid-row header-row" role="row">
          <div class="grid-cell weekday-header-cell" role="columnheader">Thứ / Giờ</div>
          <div
            v-for="h in 24"
            :key="'h-' + (h - 1)"
            class="grid-cell hour-header-cell mono"
            role="columnheader"
          >
            {{ formatHourLabel(h - 1) }}
          </div>
        </div>

        <!-- 7 Weekday Rows -->
        <div
          v-for="(row, wIdx) in cells"
          :key="'w-' + wIdx"
          class="grid-row"
          role="row"
        >
          <!-- Sticky Weekday Label -->
          <div class="grid-cell weekday-col-cell" role="rowheader">
            {{ WEEKDAY_NAMES[wIdx] }}
          </div>

          <!-- 24 Hour Data Cells -->
          <div
            v-for="cell in row"
            :key="'cell-' + cell.weekday + '-' + cell.hour"
            class="grid-cell data-cell"
            :class="[getCellLevelClass(cell.count, maxCount), { 'is-selected': isCellSelected(cell.weekday, cell.hour) }]"
            :role="'gridcell'"
            :aria-label="getCellAriaLabel(cell)"
            :title="getCellTitle(cell)"
            tabindex="0"
            @click="$emit('select-cell', { weekday: cell.weekday, hour: cell.hour, count: cell.count })"
          >
            <span v-if="cell.count > 0" class="cell-count mono">{{ cell.count }}</span>
            <span v-else class="cell-zero">·</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Heatmap Footer Factual Note -->
    <div class="heatmap-footer">
      <div class="peak-summary-fact">
        <span class="fact-title">Khung giờ có nhiều video nhất:</span>
        <span class="fact-val"><strong>{{ peakText }}</strong></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PublishingHeatmapCell } from '@/types/publishing-schedule';
import { WEEKDAY_NAMES, findPeakBuckets } from '@/services/publishing-schedule-service';

const props = defineProps<{
  cells: PublishingHeatmapCell[][];
  maxCount: number;
  channelName?: string | null;
  selectedCell?: { weekday: number; hour: number } | null;
}>();

defineEmits<{
  (e: 'select-cell', payload: { weekday: number; hour: number; count: number }): void;
}>();

function formatHourLabel(h: number): string {
  return h < 10 ? `0${h}` : `${h}`;
}

function getCellLevelClass(count: number, max: number): string {
  if (count === 0) return 'level-0';
  if (max <= 1) return 'level-4';
  const ratio = count / max;
  if (ratio <= 0.25) return 'level-1';
  if (ratio <= 0.5) return 'level-2';
  if (ratio <= 0.75) return 'level-3';
  return 'level-4';
}

function getCellTitle(cell: PublishingHeatmapCell): string {
  const hh = formatHourLabel(cell.hour);
  const chInfo = props.channelName ? ` (${props.channelName})` : '';
  return `${cell.weekdayName} • ${hh}:00–${hh}:59 • ${cell.count} video${chInfo}`;
}

function getCellAriaLabel(cell: PublishingHeatmapCell): string {
  const hh = formatHourLabel(cell.hour);
  return `${cell.weekdayName}, ${hh} giờ, ${cell.count} video`;
}

function isCellSelected(weekday: number, hour: number): boolean {
  if (!props.selectedCell) return false;
  return props.selectedCell.weekday === weekday && props.selectedCell.hour === hour;
}

const peakText = computed(() => {
  const items: { label: string; count: number }[] = [];
  for (const row of props.cells) {
    for (const cell of row) {
      if (cell.count > 0) {
        const hh = formatHourLabel(cell.hour);
        items.push({
          label: `${cell.weekdayName} lúc ${hh}:00–${hh}:59`,
          count: cell.count,
        });
      }
    }
  }
  return findPeakBuckets(items);
});
</script>

<style scoped>
.publishing-heatmap {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.heatmap-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.heatmap-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.heatmap-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.heatmap-sub strong {
  color: #0f172a;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.legend-text {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
}

.legend-cell {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
}

/* Intensity level classes */
.level-0 {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
}

.level-1 {
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.level-2 {
  background: #93c5fd;
  border: 1px solid #60a5fa;
  color: #1e3a8a;
}

.level-3 {
  background: #3b82f6;
  border: 1px solid #2563eb;
  color: #ffffff;
}

.level-4 {
  background: #1d4ed8;
  border: 1px solid #1e40af;
  color: #ffffff;
}

.heatmap-scroll-wrap {
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.heatmap-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 780px;
}

.grid-row {
  display: grid;
  grid-template-columns: 85px repeat(24, 1fr);
  gap: 4px;
  align-items: center;
}

.grid-cell {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  user-select: none;
}

.header-row .grid-cell {
  height: 24px;
}

.weekday-header-cell {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  justify-content: flex-start;
  padding-left: 4px;
}

.hour-header-cell {
  font-size: 0.68rem;
  color: #64748b;
}

.weekday-col-cell {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
  justify-content: flex-start;
  padding-left: 4px;
}

.data-cell {
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.data-cell:hover {
  transform: scale(1.15);
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.data-cell.is-selected {
  outline: 2px solid #0f172a;
  outline-offset: 1px;
}

.cell-zero {
  color: #cbd5e1;
  font-size: 0.9rem;
}

.cell-count {
  font-weight: 800;
}

.heatmap-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.peak-summary-fact {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
}

.fact-title {
  color: #64748b;
  font-weight: 600;
}

.fact-val {
  color: #0f172a;
}
</style>
