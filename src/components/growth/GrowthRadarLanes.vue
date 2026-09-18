<template>
  <div class="growth-radar-lanes">
    <div
      v-for="lane in lanes"
      :key="lane.id"
      class="radar-lane-chip surface-card"
      :class="{ 'chip-active': activeFilter === lane.id }"
      @click="$emit('select-filter', lane.id)"
    >
      <div class="lane-icon-wrap" :class="`lane-icon-${lane.tone}`">
        <AppIcon :name="lane.icon" size="14" />
      </div>
      <div class="lane-text-meta">
        <span class="lane-label">{{ lane.label }}</span>
        <span class="lane-count mono">{{ lane.count }} video</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { VideoListItem } from '@/types/video';

const props = defineProps<{
  videos: VideoListItem[];
  activeFilter: string;
}>();

defineEmits<{
  (e: 'select-filter', filterId: string): void;
}>();

const lanes = computed(() => {
  let risingCount = 0;
  let alertedCount = 0;
  let unalertedCount = 0;

  for (const v of props.videos) {
    if (v.latestMeasuredVph !== null && v.latestMeasuredVph > 0) risingCount++;
    if (v.alert && v.alert.status === 'sent') alertedCount++;
    else unalertedCount++;
  }

  return [
    {
      id: 'rising',
      label: 'ĐANG TĂNG (VPH > 0)',
      count: risingCount,
      tone: 'accent',
      icon: 'trending-up',
    },
    {
      id: 'alerted',
      label: 'ĐÃ CẢNH BÁO',
      count: alertedCount,
      tone: 'success',
      icon: 'bell',
    },
    {
      id: 'unalerted',
      label: 'CHƯA CẢNH BÁO',
      count: unalertedCount,
      tone: 'neutral',
      icon: 'shield',
    },
  ];
});
</script>

<style scoped>
.growth-radar-lanes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.radar-lane-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.radar-lane-chip:hover {
  border-color: var(--primary, #2563EB);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 60, 90, 0.08);
}

.radar-lane-chip.chip-active {
  background: #EFF6FF;
  border-color: var(--primary, #2563EB);
  box-shadow: 0 0 0 1px var(--primary, #2563EB);
}

.lane-icon-wrap {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.lane-icon-accent {
  background: #EFF6FF;
  color: #2563EB;
}

.lane-icon-success {
  background: #ECFDF5;
  color: #059669;
}

.lane-icon-neutral {
  background: #F1F5F9;
  color: #64748B;
}

.lane-text-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lane-label {
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.lane-count {
  font-size: 14px;
  font-weight: 750;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .growth-radar-lanes {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
