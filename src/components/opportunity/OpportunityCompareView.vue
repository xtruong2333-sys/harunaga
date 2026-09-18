<template>
  <div class="opportunity-compare-view">
    <!-- Candidate Selector Chips Header -->
    <div class="compare-selector-bar surface-card">
      <div class="selector-heading">
        <span class="selector-title">SO SÁNH ỨNG VIÊN (TỐI ĐA 4)</span>
        <span class="selector-counter">{{ selectedVideos.length }}/4 đã chọn</span>
      </div>

      <div class="selector-chips-row">
        <button
          v-for="v in allCandidates"
          :key="v.id"
          type="button"
          class="candidate-chip"
          :class="{ 'chip-active': isSelected(v.id) }"
          @click="toggleSelection(v)"
        >
          <span class="chip-name">{{ v.channel.name }} · {{ v.title.slice(0, 24) }}...</span>
          <span class="chip-vph mono">{{ formatNumber(Math.round(v.latestMeasuredVph)) }} VPH</span>
        </button>
      </div>
    </div>

    <!-- Comparison Columns Grid -->
    <div v-if="selectedVideos.length > 0" class="compare-grid" :style="{ gridTemplateColumns: `repeat(${selectedVideos.length}, 1fr)` }">
      <div
        v-for="v in selectedVideos"
        :key="v.id"
        class="compare-column surface-card"
      >
        <!-- Thumbnail -->
        <div class="col-thumbnail">
          <VideoThumbnail
            :src="v.thumbnailUrl"
            :alt="v.title"
            ratio="16-9"
            :show-overlay-actions="false"
            :vph-badge="v.latestMeasuredVph"
          />
        </div>

        <!-- Meta -->
        <div class="col-meta">
          <OpportunityStatusBadge
            type="threshold"
            :is-over-threshold="v.isOverThreshold"
          />
          <h4 class="col-title" :title="v.title">
            <router-link :to="'/videos/' + v.id" class="title-link">
              {{ v.title }}
            </router-link>
          </h4>
          <router-link :to="'/kenh-theo-doi/' + v.channel.id" class="col-channel-name">
            {{ v.channel.name }}
          </router-link>
        </div>

        <!-- Metrics Comparison Table -->
        <div class="col-metrics-table">
          <div class="compare-metric-row">
            <span class="c-lbl">TỐC ĐỘ VPH</span>
            <span class="c-val mono text-accent font-bold">{{ formatNumber(Math.round(v.latestMeasuredVph)) }} VPH</span>
          </div>

          <div class="compare-metric-row">
            <span class="c-lbl">LƯỢT XEM</span>
            <span class="c-val mono">{{ formatNumber(v.latestViewCount) }}</span>
          </div>

          <div class="compare-metric-row">
            <span class="c-lbl">TĂNG GẦN NHẤT</span>
            <span class="c-val mono" :class="{ 'text-positive': v.latestDeltaViews && v.latestDeltaViews > 0 }">
              {{ formatDelta(v.latestDeltaViews) }}
            </span>
          </div>

          <div class="compare-metric-row">
            <span class="c-lbl">TUỔI VIDEO</span>
            <span class="c-val">{{ v.videoAge }}</span>
          </div>

          <div class="compare-metric-row">
            <span class="c-lbl">NGƯỠNG KÊNH</span>
            <span class="c-val mono">{{ formatNumber(v.channel.alertVphThreshold) }} VPH</span>
          </div>

          <div class="compare-metric-row">
            <span class="c-lbl">TỶ LỆ / NGƯỠNG</span>
            <span class="c-val mono" :class="{ 'text-positive font-bold': v.isOverThreshold }">
              {{ v.thresholdRatio }}%
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="col-actions">
          <button
            type="button"
            class="btn-col-action btn-prod"
            @click="$emit('add-production', v)"
          >
            <AppIcon name="clipboard-list" size="13" />
            <span>Sản Xuất</span>
          </button>
          <router-link :to="'/videos/' + v.id" class="btn-col-action btn-detail">
            <span>Chi Tiết</span>
          </router-link>
          <a
            :href="v.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-col-action btn-yt"
            title="Mở YouTube"
          >
            <AppIcon name="external" size="13" />
          </a>
        </div>
      </div>
    </div>

    <!-- Empty comparison -->
    <div v-else class="empty-compare surface-card">
      <AppIcon name="columns" size="28" class="text-muted" />
      <p>Chọn ít nhất 1 ứng viên phía trên để bắt đầu so sánh dữ liệu trực quan.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import OpportunityStatusBadge from '@/components/opportunity/OpportunityStatusBadge.vue';
import type { OpportunityVideo } from '@/types/opportunity';

const props = defineProps<{
  allCandidates: OpportunityVideo[];
}>();

defineEmits<{
  (e: 'add-production', video: OpportunityVideo): void;
}>();

const selectedVideos = ref<OpportunityVideo[]>(
  props.allCandidates ? props.allCandidates.slice(0, 3) : []
);

watch(
  () => props.allCandidates,
  (newCandidates) => {
    if (selectedVideos.value.length === 0 && newCandidates && newCandidates.length > 0) {
      selectedVideos.value = newCandidates.slice(0, 3);
    }
  },
  { immediate: true }
);

function isSelected(id: string): boolean {
  return selectedVideos.value.some(v => v.id === id);
}

function toggleSelection(video: OpportunityVideo) {
  const idx = selectedVideos.value.findIndex(v => v.id === video.id);
  if (idx >= 0) {
    selectedVideos.value.splice(idx, 1);
  } else {
    if (selectedVideos.value.length < 4) {
      selectedVideos.value.push(video);
    }
  }
}

function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return '—';
  if (delta > 0) return `+${formatNumber(delta)}`;
  return formatNumber(delta);
}

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
.opportunity-compare-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.compare-selector-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
}

.selector-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selector-title {
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.selector-counter {
  font-size: 11.5px;
  color: var(--text-muted);
}

.selector-chips-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.candidate-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--bg-inset, #F8FAFC);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.candidate-chip:hover {
  border-color: #BFDBFE;
  color: var(--primary, #2563EB);
}

.candidate-chip.chip-active {
  background: var(--primary-soft, #EFF6FF);
  border-color: var(--primary, #2563EB);
  color: var(--primary, #2563EB);
  font-weight: 600;
}

.chip-vph {
  font-weight: 700;
  font-size: 11px;
}

.compare-grid {
  display: grid;
  gap: 16px;
}

.compare-column {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  padding: 14px;
  gap: 12px;
}

.col-thumbnail {
  width: 100%;
}

.col-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-title {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 38px;
}

.title-link {
  color: var(--text-primary);
  text-decoration: none;
}

.col-channel-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
}

.col-metrics-table {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border, #E3EBF3);
  padding-top: 8px;
  gap: 6px;
}

.compare-metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(227, 235, 243, 0.6);
}

.c-lbl {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 650;
  text-transform: uppercase;
}

.c-val {
  color: var(--text-primary);
  font-size: 12px;
}

.col-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
}

.btn-col-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-primary);
  border: 1px solid var(--border, #E3EBF3);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-prod {
  flex: 1;
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-prod:hover {
  background: #2563EB;
  color: #FFFFFF;
}

.btn-yt:hover {
  color: #DC2626;
  border-color: #FECACA;
  background: #FEF2F2;
}

.empty-compare {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
  border-radius: 12px;
  color: var(--text-muted);
}

.text-accent {
  color: #0284C7;
}

.text-positive {
  color: #059669;
}

.font-bold {
  font-weight: 750;
}

@media (max-width: 1024px) {
  .compare-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 640px) {
  .compare-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
