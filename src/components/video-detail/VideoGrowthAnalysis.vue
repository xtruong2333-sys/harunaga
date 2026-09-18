<template>
  <section class="growth-analysis-section">
    <div class="section-title-bar">
      <div class="title-group">
        <h2 class="section-heading">PHÂN TÍCH TĂNG TRƯỞNG</h2>
        <p class="section-sub">Diễn biến lượt xem và tốc độ tăng được ghi nhận qua các snapshot.</p>
      </div>
    </div>

    <div class="analysis-grid-layout">
      <!-- Left: Charts Surface (65%) -->
      <div class="chart-column">
        <VideoGrowthCharts
          :snapshots="video.snapshots"
          :threshold="video.channel.alertVphThreshold"
        />
      </div>

      <!-- Right: Signal Summary Rail (35%) -->
      <div class="summary-column">
        <VideoSignalSummary :video="video" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import VideoGrowthCharts from '@/features/videos/components/VideoGrowthCharts.vue';
import VideoSignalSummary from './VideoSignalSummary.vue';
import type { VideoDetail } from '@/types/video';

defineProps<{
  video: VideoDetail;
}>();
</script>

<style scoped>
.growth-analysis-section {
  margin-bottom: 28px;
}

.section-title-bar {
  margin-bottom: 16px;
}

.section-heading {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-primary, #0F172A);
  margin: 0 0 4px 0;
}

.section-sub {
  font-size: 13px;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

.analysis-grid-layout {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 20px;
  align-items: stretch;
}

.chart-column {
  width: 100%;
}

.summary-column {
  width: 100%;
}

@media (max-width: 1024px) {
  .analysis-grid-layout {
    grid-template-columns: 1fr;
  }
}
</style>
