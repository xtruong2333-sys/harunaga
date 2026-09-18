<template>
  <div class="channel-publishing-rhythm surface-card">
    <div class="rhythm-header">
      <div class="header-left">
        <h3 class="rhythm-title">NHỊP ĐĂNG GẦN ĐÂY</h3>
        <span class="rhythm-sub">Phân tích thực tế từ lịch sử xuất bản của {{ videos.length }} video</span>
      </div>
    </div>

    <!-- Insufficient data state (< 3 videos) -->
    <div v-if="validVideos.length < 3" class="rhythm-empty">
      <AppIcon name="calendar" size="28" class="empty-icon" />
      <div class="empty-txt">Chưa đủ dữ liệu</div>
      <div class="empty-sub">Cần ít nhất 3 video có mốc xuất bản để phân tích quy luật đăng bài.</div>
    </div>

    <!-- Factual Rhythm Analysis -->
    <div v-else class="rhythm-content">
      <!-- 3 Quick Highlight Cards -->
      <div class="rhythm-highlights">
        <div class="highlight-box">
          <span class="hl-lbl">TẦN SUẤT GẦN ĐÂY</span>
          <span class="hl-val mono">{{ cadence7d }} video / 7 ngày</span>
          <span class="hl-sub">{{ cadence30d }} video trong 30 ngày</span>
        </div>

        <div class="highlight-box">
          <span class="hl-lbl">ĐĂNG NHIỀU NHẤT</span>
          <span class="hl-val text-accent">{{ peakWeekday }}</span>
          <span class="hl-sub">{{ peakWeekdayCount }} video xuất bản</span>
        </div>

        <div class="highlight-box">
          <span class="hl-lbl">KHUNG GIỜ PHỔ BIẾN</span>
          <span class="hl-val mono">{{ peakHourWindow }}</span>
          <span class="hl-sub">{{ peakHourCount }} video</span>
        </div>
      </div>

      <!-- Weekday Distribution Bar Visual -->
      <div class="weekday-distribution-wrap">
        <div class="wd-title">PHÂN BỐ THEO NGÀY TRONG TUẦN</div>
        <div class="weekday-bars">
          <div
            v-for="day in weekdayBars"
            :key="day.label"
            class="wd-col"
          >
            <div class="bar-track">
              <div
                class="bar-fill"
                :class="{ 'is-peak': day.isPeak }"
                :style="{ height: `${Math.max(6, (day.count / maxWeekdayCount) * 100)}%` }"
              ></div>
            </div>
            <span class="day-val mono">{{ day.count }}</span>
            <span class="day-name" :class="{ 'text-peak': day.isPeak }">{{ day.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ChannelVideoItem } from '@/types/channel-analysis';

const props = defineProps<{
  videos: ChannelVideoItem[];
}>();

const validVideos = computed(() => {
  return props.videos.filter(v => Boolean(v.publishedAt));
});

// 1. Cadence (7 days & 30 days)
const cadence7d = computed(() => {
  const cutoff = Date.now() - 7 * 86400 * 1000;
  return validVideos.value.filter(v => new Date(v.publishedAt).getTime() >= cutoff).length;
});

const cadence30d = computed(() => {
  const cutoff = Date.now() - 30 * 86400 * 1000;
  return validVideos.value.filter(v => new Date(v.publishedAt).getTime() >= cutoff).length;
});

// 2. Weekday distribution (0: Sun, 1: Mon, ..., 6: Sat)
const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const weekdayFullNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const weekdayCounts = computed(() => {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  validVideos.value.forEach(v => {
    const d = new Date(v.publishedAt).getDay();
    counts[d]++;
  });
  return counts;
});

const maxWeekdayCount = computed(() => {
  return Math.max(...weekdayCounts.value, 1);
});

const peakWeekdayIdx = computed(() => {
  let bestIdx = 0;
  let max = -1;
  weekdayCounts.value.forEach((cnt, idx) => {
    if (cnt > max) {
      max = cnt;
      bestIdx = idx;
    }
  });
  return bestIdx;
});

const peakWeekday = computed(() => {
  if (validVideos.value.length === 0) return '—';
  return weekdayFullNames[peakWeekdayIdx.value];
});

const peakWeekdayCount = computed(() => {
  return weekdayCounts.value[peakWeekdayIdx.value] || 0;
});

// Weekday bars ordered Monday (T2) -> Sunday (CN)
const weekdayBars = computed(() => {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map(idx => ({
    label: weekdayNames[idx],
    count: weekdayCounts.value[idx],
    isPeak: idx === peakWeekdayIdx.value && weekdayCounts.value[idx] > 0,
  }));
});

// 3. Peak Hour Window
const peakHourWindow = computed(() => {
  if (validVideos.value.length === 0) return '—';
  const hourBuckets = [
    { label: '06:00 – 09:00', start: 6, end: 9, count: 0 },
    { label: '09:00 – 12:00', start: 9, end: 12, count: 0 },
    { label: '12:00 – 15:00', start: 12, end: 15, count: 0 },
    { label: '15:00 – 18:00', start: 15, end: 18, count: 0 },
    { label: '18:00 – 21:00', start: 18, end: 21, count: 0 },
    { label: '21:00 – 24:00', start: 21, end: 24, count: 0 },
    { label: '00:00 – 06:00', start: 0, end: 6, count: 0 },
  ];

  validVideos.value.forEach(v => {
    const h = new Date(v.publishedAt).getHours();
    const bucket = hourBuckets.find(b => h >= b.start && h < b.end);
    if (bucket) bucket.count++;
  });

  let best = hourBuckets[0];
  hourBuckets.forEach(b => {
    if (b.count > best.count) best = b;
  });

  return best.count > 0 ? best.label : 'Chưa xác định';
});

const peakHourCount = computed(() => {
  if (validVideos.value.length === 0) return 0;
  const hourBuckets = [
    { start: 6, end: 9, count: 0 },
    { start: 9, end: 12, count: 0 },
    { start: 12, end: 15, count: 0 },
    { start: 15, end: 18, count: 0 },
    { start: 18, end: 21, count: 0 },
    { start: 21, end: 24, count: 0 },
    { start: 0, end: 6, count: 0 },
  ];
  validVideos.value.forEach(v => {
    const h = new Date(v.publishedAt).getHours();
    const bucket = hourBuckets.find(b => h >= b.start && h < b.end);
    if (bucket) bucket.count++;
  });
  return Math.max(...hourBuckets.map(b => b.count));
});
</script>

<style scoped>
.channel-publishing-rhythm {
  padding: 24px;
  border-radius: 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: 0 1px 4px rgba(30, 60, 90, 0.04);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rhythm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rhythm-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary, #0F172A);
  margin: 0;
  text-transform: uppercase;
}

.rhythm-sub {
  font-size: 12.5px;
  color: var(--text-secondary, #64748B);
}

.rhythm-empty {
  padding: 36px 20px;
  text-align: center;
  background: var(--bg-inset, #F8FAFC);
  border-radius: 12px;
  border: 1px dashed var(--border, #E3EBF3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  color: var(--text-muted, #94A3B8);
}

.empty-txt {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
}

.empty-sub {
  font-size: 12.5px;
  color: var(--text-secondary, #64748B);
}

.rhythm-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rhythm-highlights {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.highlight-box {
  padding: 14px 16px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hl-lbl {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted, #64748B);
  text-transform: uppercase;
}

.hl-val {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-primary, #0F172A);
}

.hl-sub {
  font-size: 11px;
  color: var(--text-secondary, #64748B);
}

.weekday-distribution-wrap {
  padding: 16px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wd-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted, #64748B);
  text-transform: uppercase;
}

.weekday-bars {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  align-items: flex-end;
  height: 110px;
}

.wd-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}

.bar-track {
  width: 24px;
  height: 70px;
  background: #E2E8F0;
  border-radius: 6px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: #94A3B8;
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}

.is-peak {
  background: #2563EB;
}

.day-val {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
}

.day-name {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary, #64748B);
}

.text-peak {
  color: #2563EB;
}

.text-accent {
  color: #2563EB;
}

@media (max-width: 768px) {
  .rhythm-highlights {
    grid-template-columns: 1fr;
  }
}
</style>
