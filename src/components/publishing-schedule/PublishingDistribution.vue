<template>
  <div class="publishing-distribution">
    <div class="dist-grid">
      <!-- 1. Weekday Distribution -->
      <div class="dist-card card">
        <div class="card-header">
          <div>
            <h4 class="card-title">PHÂN BỐ THEO THỨ TRONG TUẦN</h4>
            <p class="card-sub">Tổng số video và tỷ lệ phần trăm theo từng ngày.</p>
          </div>
          <span v-if="peakWeekdayText !== '—'" class="peak-pill">
            Nhiều nhất: <strong>{{ peakWeekdayText }}</strong>
          </span>
        </div>

        <div v-if="totalVideos < 3 && totalVideos > 0" class="sample-note">
          <AppIcon name="info" :size="14" />
          <span>Mẫu dữ liệu còn ít ({{ totalVideos }} video). Chưa đủ để xác lập thói quen xuất bản rõ rệt.</span>
        </div>

        <div class="weekday-bars-list">
          <div
            v-for="item in weekdayDist"
            :key="item.label"
            class="bar-row"
            :class="{ 'is-peak': isWeekdayPeak(item.count) }"
          >
            <span class="bar-label">{{ item.label }}</span>
            <div class="bar-track">
              <div
                class="bar-fill fill-weekday"
                :style="{ width: `${item.percentage}%` }"
              ></div>
            </div>
            <div class="bar-stat mono">
              <span class="stat-count">{{ item.count }}</span>
              <span class="stat-pct">({{ item.percentage }}%)</span>
              <span v-if="isWeekdayPeak(item.count)" class="peak-tag">NHIỀU NHẤT</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Hourly Distribution (24h Detail + 4 Macro Time Blocks) -->
      <div class="dist-card card">
        <div class="card-header">
          <div>
            <h4 class="card-title">PHÂN BỐ THEO KHUNG GIỜ (00–23H)</h4>
            <p class="card-sub">Chi tiết 24 giờ và 4 ca xuất bản trong ngày.</p>
          </div>
          <span v-if="peakHourText !== '—'" class="peak-pill">
            Nhiều nhất: <strong>{{ peakHourText }}</strong>
          </span>
        </div>

        <!-- 4 Macro Blocks -->
        <div class="macro-blocks-row">
          <div
            v-for="block in macroBlocks"
            :key="block.label"
            class="macro-block"
            :class="{ 'is-macro-peak': block.isMax }"
          >
            <span class="macro-label">{{ block.label }}</span>
            <span class="macro-count mono">{{ block.count }} video</span>
            <span class="macro-pct mono">({{ block.percentage }}%)</span>
          </div>
        </div>

        <!-- Detailed 24h Column Chart -->
        <div class="hourly-chart-wrap">
          <div class="hourly-chart-grid">
            <div
              v-for="item in hourlyDist"
              :key="item.label"
              class="hourly-bar-col"
              :title="`${item.label}–${item.label.slice(0, 2)}:59: ${item.count} video (${item.percentage}%)`"
            >
              <span class="bar-col-count mono" :class="{ 'has-val': item.count > 0 }">
                {{ item.count > 0 ? item.count : '' }}
              </span>
              <div class="bar-col-track">
                <div
                  class="bar-col-fill"
                  :class="{ 'is-max-hour': maxHourlyCount > 0 && item.count === maxHourlyCount }"
                  :style="{ height: `${maxHourlyCount > 0 ? (item.count / maxHourlyCount) * 100 : 0}%` }"
                ></div>
              </div>
              <span class="bar-col-hour mono">{{ item.label.slice(0, 2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { PublishingDistributionItem } from '@/types/publishing-schedule';
import { findPeakBuckets } from '@/services/publishing-schedule-service';

const props = defineProps<{
  weekdayDist: PublishingDistributionItem[];
  hourlyDist: PublishingDistributionItem[];
  totalVideos: number;
}>();

const maxWeekdayCount = computed(() => {
  if (!props.weekdayDist.length) return 0;
  return Math.max(...props.weekdayDist.map(w => w.count));
});

function isWeekdayPeak(count: number): boolean {
  return maxWeekdayCount.value > 0 && count === maxWeekdayCount.value;
}

const peakWeekdayText = computed(() => {
  return findPeakBuckets(props.weekdayDist);
});

const maxHourlyCount = computed(() => {
  if (!props.hourlyDist.length) return 0;
  return Math.max(...props.hourlyDist.map(h => h.count));
});

const peakHourText = computed(() => {
  const formatted = props.hourlyDist.map(h => ({
    label: `${h.label}–${h.label.slice(0, 2)}:59`,
    count: h.count,
  }));
  return findPeakBuckets(formatted);
});

// 4 Macro Time Blocks (00-06, 06-12, 12-18, 18-24)
const macroBlocks = computed(() => {
  const blocks = [
    { label: 'Đêm (00–06h)', start: 0, end: 5 },
    { label: 'Sáng (06–12h)', start: 6, end: 11 },
    { label: 'Chiều (12–18h)', start: 12, end: 17 },
    { label: 'Tối (18–24h)', start: 18, end: 23 },
  ];

  const total = props.totalVideos;
  const list = blocks.map(b => {
    let count = 0;
    for (let h = b.start; h <= b.end; h++) {
      if (props.hourlyDist[h]) count += props.hourlyDist[h].count;
    }
    const percentage = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
    return {
      label: b.label,
      count,
      percentage,
      isMax: false,
    };
  });

  const maxC = Math.max(...list.map(b => b.count));
  if (maxC > 0) {
    for (const b of list) {
      if (b.count === maxC) b.isMax = true;
    }
  }

  return list;
});
</script>

<style scoped>
.publishing-distribution {
  margin-bottom: 24px;
}

.dist-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dist-card {
  padding: 22px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.card-title {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.card-sub {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.peak-pill {
  font-size: 0.78rem;
  background: #f1f5f9;
  color: #334155;
  padding: 3px 8px;
  border-radius: 6px;
}

.peak-pill strong {
  color: #0f172a;
}

.sample-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 0.78rem;
  color: #92400e;
}

.weekday-bars-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bar-row {
  display: grid;
  grid-template-columns: 75px 1fr 140px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
}

.bar-track {
  width: 100%;
  height: 10px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.fill-weekday {
  height: 100%;
  background: #3b82f6;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.is-peak .fill-weekday {
  background: #10b981;
}

.bar-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
  font-size: 0.82rem;
}

.stat-count {
  font-weight: 800;
  color: #0f172a;
}

.stat-pct {
  color: #64748b;
  font-size: 0.76rem;
}

.peak-tag {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: #10b981;
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 4px;
}

/* Macro Blocks */
.macro-blocks-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.macro-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.macro-block.is-macro-peak {
  background: #eff6ff;
  border-color: #93c5fd;
}

.macro-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
}

.macro-count {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.macro-pct {
  font-size: 0.72rem;
  color: #64748b;
}

/* Hourly 24h chart */
.hourly-chart-wrap {
  overflow-x: auto;
  padding-top: 10px;
}

.hourly-chart-grid {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 3px;
  align-items: flex-end;
  min-width: 480px;
  height: 130px;
}

.hourly-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 3px;
}

.bar-col-count {
  font-size: 0.65rem;
  font-weight: 700;
  color: transparent;
  height: 14px;
  line-height: 14px;
}

.bar-col-count.has-val {
  color: #0f172a;
}

.bar-col-track {
  width: 100%;
  flex: 1;
  background: #f1f5f9;
  border-radius: 3px 3px 0 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-col-fill {
  width: 100%;
  background: #3b82f6;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
}

.bar-col-fill.is-max-hour {
  background: #10b981;
}

.bar-col-hour {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .dist-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .bar-row {
    grid-template-columns: 60px 1fr 100px;
  }
  .macro-blocks-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
