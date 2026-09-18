<template>
  <div class="publishing-week-pattern card">
    <div class="pattern-header">
      <div>
        <h3 class="pattern-title">CHU KỲ XUẤT BẢN THEO THỨ</h3>
        <p class="pattern-sub">
          Phân bố số lượng video thực tế được xuất bản theo từng ngày trong tuần trong khoảng thời gian đã chọn.
        </p>
      </div>
      <div v-if="maxCount > 0" class="pattern-badge-wrap">
        <span class="max-badge-summary">
          Ghi nhận nhiều nhất: <strong>{{ maxDaysText }}</strong> ({{ maxCount }} video)
        </span>
      </div>
    </div>

    <!-- 7 Day Pattern Columns -->
    <div class="week-columns-grid">
      <div
        v-for="day in days"
        :key="day.weekday"
        class="week-col"
        :class="{ 'is-max-day': day.isMax, 'is-selected': selectedWeekday === day.weekday }"
        @click="$emit('select-weekday', day.weekday)"
      >
        <div class="col-top">
          <span class="day-short">{{ day.weekdayName }}</span>
          <span v-if="day.isMax" class="max-tag">NHIỀU VIDEO NHẤT</span>
        </div>

        <div class="col-middle">
          <div class="count-wrap">
            <span class="video-count mono">{{ day.count }}</span>
            <span class="count-unit">video</span>
          </div>
          <span class="pct-val mono">({{ day.percentage }}%)</span>
        </div>

        <div class="col-track-wrap">
          <div
            class="col-track-fill"
            :style="{ height: `${maxCount > 0 ? (day.count / maxCount) * 100 : 0}%` }"
          ></div>
        </div>

        <div class="col-bottom">
          <span class="hour-label">Giờ ghi nhận nhiều:</span>
          <span class="hour-val mono">{{ day.peakHour }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PublishingWeekPatternDay } from '@/types/publishing-schedule';

const props = defineProps<{
  days: PublishingWeekPatternDay[];
  selectedWeekday?: number | null;
}>();

defineEmits<{
  (e: 'select-weekday', weekday: number): void;
}>();

const maxCount = computed(() => {
  if (!props.days.length) return 0;
  return Math.max(...props.days.map(d => d.count));
});

const maxDaysText = computed(() => {
  const matching = props.days.filter(d => d.isMax);
  return matching.map(d => d.weekdayName).join(', ');
});
</script>

<style scoped>
.publishing-week-pattern {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.pattern-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pattern-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.pattern-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.max-badge-summary {
  font-size: 0.8rem;
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.max-badge-summary strong {
  font-weight: 700;
}

.week-columns-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.week-col {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.week-col:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.week-col.is-max-day {
  background: #f0fdf4;
  border-color: #86efac;
}

.week-col.is-selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.col-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.day-short {
  font-size: 0.9rem;
  font-weight: 800;
  color: #0f172a;
}

.max-tag {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: #10b981;
  color: #ffffff;
  padding: 2px 5px;
  border-radius: 4px;
  white-space: nowrap;
}

.col-middle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.count-wrap {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.video-count {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.count-unit {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.pct-val {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.col-track-wrap {
  width: 100%;
  height: 60px;
  background: #e2e8f0;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.col-track-fill {
  width: 100%;
  background: #3b82f6;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.is-max-day .col-track-fill {
  background: #10b981;
}

.col-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
  border-top: 1px dashed #e2e8f0;
  padding-top: 8px;
}

.hour-label {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.hour-val {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
}

@media (max-width: 1024px) {
  .week-columns-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 640px) {
  .week-columns-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
