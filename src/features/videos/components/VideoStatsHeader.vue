<template>
  <section class="video-stats-strip">
    <MetricCard
      label="Tổng video"
      :value="totalCount"
      icon="video"
    />
    <MetricCard
      label="Video đang tăng"
      :value="risingCount"
      variant="accent"
      icon="trending-up"
    />
    <MetricCard
      label="VPH cao nhất"
      :value="formattedMaxVph"
      :focal="true"
      icon="zap"
      subtext="Tốc độ tăng cao nhất"
    />
    <MetricCard
      label="Đã cảnh báo"
      :value="alertedCount"
      variant="warning"
      icon="bell"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MetricCard from '@/components/ui/MetricCard.vue';

const props = defineProps<{
  totalCount: number;
  risingCount: number;
  maxVph: number | null;
  alertedCount: number;
}>();

const formattedMaxVph = computed(() => {
  if (props.maxVph === null || props.maxVph === undefined || props.maxVph === 0) {
    return 'Chưa có';
  }
  return `${Math.round(props.maxVph).toLocaleString('vi-VN')} VPH`;
});
</script>

<style scoped>
.video-stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .video-stats-strip {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .video-stats-strip {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
