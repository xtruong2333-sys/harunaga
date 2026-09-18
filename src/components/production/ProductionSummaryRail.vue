<template>
  <section class="production-summary-rail" aria-label="Tóm tắt tiến độ sản xuất">
    <div class="summary-rail-grid">
      <!-- 1. Đang làm (Active / In-flight) -->
      <div class="summary-metric-card metric-active">
        <div class="metric-icon-wrap">
          <AppIcon name="activity" :size="20" />
        </div>
        <div class="metric-body">
          <span class="metric-label">Đang làm</span>
          <span class="metric-value font-mono">{{ stats.activeCount }}</span>
        </div>
      </div>

      <!-- 2. Ý tưởng (Idea stage) -->
      <div class="summary-metric-card metric-idea">
        <div class="metric-icon-wrap">
          <AppIcon name="sparkles" :size="20" />
        </div>
        <div class="metric-body">
          <span class="metric-label">Ý tưởng</span>
          <span class="metric-value font-mono">{{ stats.ideaCount }}</span>
        </div>
      </div>

      <!-- 3. Đang sản xuất (Production + Editing) -->
      <div class="summary-metric-card metric-production">
        <div class="metric-icon-wrap">
          <AppIcon name="video" :size="20" />
        </div>
        <div class="metric-body">
          <span class="metric-label">Đang sản xuất</span>
          <span class="metric-value font-mono">{{ stats.inProductionCount }}</span>
        </div>
      </div>

      <!-- 4. Đã xuất bản (Published) -->
      <div class="summary-metric-card metric-published">
        <div class="metric-icon-wrap">
          <AppIcon name="check-circle" :size="20" />
        </div>
        <div class="metric-body">
          <span class="metric-label">Đã xuất bản</span>
          <span class="metric-value font-mono">{{ stats.publishedCount }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ProductionStats } from '@/types/production';
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  stats: ProductionStats;
}>();
</script>

<style scoped>
.production-summary-rail {
  margin-bottom: 20px;
}

.summary-rail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.summary-metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 16px 18px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.summary-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 31, 53, 0.05);
}

.metric-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  flex-shrink: 0;
}

.metric-active .metric-icon-wrap {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.metric-idea .metric-icon-wrap {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.metric-production .metric-icon-wrap {
  background: rgba(147, 51, 234, 0.1);
  color: #9333ea;
}

.metric-published .metric-icon-wrap {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.metric-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.metric-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary, #64748b);
  margin-bottom: 2px;
}

.metric-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary, #0f1f35);
  line-height: 1.2;
}

@media (max-width: 900px) {
  .summary-rail-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .summary-rail-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .summary-metric-card {
    padding: 12px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .summary-metric-card {
    transition: none !important;
  }
  .summary-metric-card:hover {
    transform: none !important;
  }
}
</style>
