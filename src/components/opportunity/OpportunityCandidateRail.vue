<template>
  <div class="opportunity-candidate-rail">
    <div class="rail-header">
      <h3 class="rail-title">ỨNG VIÊN TÍN HIỆU KHÁC</h3>
      <span class="rail-hint">Chọn để xem phân tích chi tiết ứng viên</span>
    </div>

    <div class="rail-cards-grid">
      <div
        v-for="v in candidates"
        :key="v.id"
        class="rail-card surface-card"
        :class="{ 'is-selected': v.id === activeId }"
        @click="$emit('select', v)"
      >
        <div class="rail-card-thumb">
          <VideoThumbnail
            :src="v.thumbnailUrl"
            :alt="v.title"
            ratio="16-9"
            :show-overlay-actions="false"
            :vph-badge="v.latestMeasuredVph"
          />
        </div>

        <div class="rail-card-body">
          <div class="rail-channel-line">
            <span class="rail-channel-name">{{ v.channel.name }}</span>
            <span class="meta-dot">•</span>
            <span class="rail-age">{{ v.videoAge }}</span>
          </div>

          <h4 class="rail-video-title" :title="v.title">
            {{ v.title }}
          </h4>

          <div class="rail-metrics-row">
            <span class="rail-vph mono text-accent">{{ formatNumber(Math.round(v.latestMeasuredVph)) }} VPH</span>
            <OpportunityStatusBadge
              v-if="v.isOverThreshold"
              type="threshold"
              :is-over-threshold="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import OpportunityStatusBadge from '@/components/opportunity/OpportunityStatusBadge.vue';
import type { OpportunityVideo } from '@/types/opportunity';

defineProps<{
  candidates: OpportunityVideo[];
  activeId?: string;
}>();

defineEmits<{
  (e: 'select', video: OpportunityVideo): void;
}>();

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString('vi-VN');
}
</script>

<style scoped>
.opportunity-candidate-rail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.rail-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.rail-title {
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin: 0;
}

.rail-hint {
  font-size: 11.5px;
  color: var(--text-muted);
}

.rail-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.rail-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-sm, 0 2px 6px rgba(30, 60, 90, 0.04));
  transition: all 0.15s ease;
}

.rail-card:hover {
  transform: translateY(-2px);
  border-color: #BFDBFE;
  box-shadow: var(--shadow-md, 0 6px 16px rgba(37, 99, 235, 0.08));
}

.rail-card.is-selected {
  border-color: var(--primary, #2563EB);
  background: #F8FAFC;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.rail-card-thumb {
  width: 100%;
}

.rail-card-body {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  gap: 6px;
  flex: 1;
}

.rail-channel-line {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
}

.rail-channel-name {
  font-weight: 600;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-dot {
  color: var(--text-muted);
}

.rail-age {
  white-space: nowrap;
}

.rail-video-title {
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--text-primary);
  min-height: 35px;
}

.rail-metrics-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 4px;
}

.rail-vph {
  font-size: 13px;
  font-weight: 750;
}

.text-accent {
  color: #0284C7;
}

[data-theme="dark"] .text-accent {
  color: #38BDF8;
}
</style>
