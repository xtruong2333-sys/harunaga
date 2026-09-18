<template>
  <div class="publishing-summary-strip">
    <div class="summary-cards-grid">
      <!-- 1. Video trong khoảng -->
      <div class="summary-card card">
        <div class="card-icon-wrap icon-blue">
          <AppIcon name="video" :size="18" />
        </div>
        <div class="card-body">
          <span class="card-label">VIDEO TRONG KHOẢNG</span>
          <div v-if="loading" class="skeleton-val"></div>
          <div v-else class="card-val mono">{{ summary.totalVideos.toLocaleString('vi-VN') }}</div>
        </div>
      </div>

      <!-- 2. Kênh có hoạt động -->
      <div class="summary-card card">
        <div class="card-icon-wrap icon-emerald">
          <AppIcon name="users" :size="18" />
        </div>
        <div class="card-body">
          <span class="card-label">KÊNH CÓ HOẠT ĐỘNG</span>
          <div v-if="loading" class="skeleton-val"></div>
          <div v-else class="card-val mono">{{ summary.totalChannels.toLocaleString('vi-VN') }}</div>
        </div>
      </div>

      <!-- 3. Trung bình video / ngày -->
      <div class="summary-card card">
        <div class="card-icon-wrap icon-amber">
          <AppIcon name="bar-chart-2" :size="18" />
        </div>
        <div class="card-body">
          <span class="card-label">TRUNG BÌNH VIDEO / NGÀY</span>
          <div v-if="loading" class="skeleton-val"></div>
          <div v-else class="card-val mono">
            {{ summary.avgVideosPerDay !== null ? summary.avgVideosPerDay.toLocaleString('vi-VN') : '—' }}
          </div>
        </div>
      </div>

      <!-- 4. Video đăng gần nhất -->
      <div class="summary-card card">
        <div class="card-icon-wrap icon-purple">
          <AppIcon name="clock" :size="18" />
        </div>
        <div class="card-body">
          <span class="card-label">VIDEO ĐĂNG GẦN NHẤT</span>
          <div v-if="loading" class="skeleton-val"></div>
          <div v-else class="card-val text-val" :title="summary.latestPublishedAt || ''">
            {{ relativeLatestText }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { PublishingScheduleSummary } from '@/types/publishing-schedule';
import { formatRelativeTime } from '@/services/publishing-schedule-service';

const props = defineProps<{
  summary: PublishingScheduleSummary;
  loading?: boolean;
}>();

const relativeLatestText = computed(() => {
  return formatRelativeTime(props.summary.latestPublishedAt);
});
</script>

<style scoped>
.publishing-summary-strip {
  margin-bottom: 20px;
}

.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue {
  background: #eff6ff;
  color: #2563eb;
}

.icon-emerald {
  background: #ecfdf5;
  color: #059669;
}

.icon-amber {
  background: #fffbeb;
  color: #d97706;
}

.icon-purple {
  background: #fbf5ff;
  color: #9333ea;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #64748b;
  text-transform: uppercase;
}

.card-val {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.text-val {
  font-size: 1.05rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skeleton-val {
  width: 80px;
  height: 24px;
  background: #e2e8f0;
  border-radius: 6px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (max-width: 1024px) {
  .summary-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .summary-cards-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
