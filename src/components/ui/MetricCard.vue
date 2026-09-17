<template>
  <div
    class="signal-metric-card"
    :class="[
      `variant-${variant || 'default'}`,
      { 'is-focal': focal, 'is-loading': loading }
    ]"
  >
    <div class="card-glow" v-if="focal" />
    <div class="card-inner">
      <div class="metric-top">
        <span class="metric-label">{{ label }}</span>
        <AppIcon v-if="icon" :name="icon" size="14" class="metric-icon" />
      </div>

      <div class="metric-value-wrap mono">
        <template v-if="loading">
          <span class="loading-pulse">...</span>
        </template>
        <template v-else>
          <span class="metric-main-value">{{ value !== null && value !== undefined ? value : '—' }}</span>
          <span v-if="unit" class="metric-unit">{{ unit }}</span>
        </template>
      </div>

      <div v-if="subtext" class="metric-subtext">
        {{ subtext }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

withDefaults(
  defineProps<{
    label: string;
    value: string | number | null;
    unit?: string;
    subtext?: string;
    icon?: string;
    variant?: 'default' | 'accent' | 'positive' | 'warning' | 'muted';
    focal?: boolean;
    loading?: boolean;
  }>(),
  {
    unit: '',
    subtext: '',
    icon: '',
    variant: 'default',
    focal: false,
    loading: false,
  }
);
</script>

<style scoped>
.signal-metric-card {
  position: relative;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 16px 18px;
  backdrop-filter: blur(12px);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.signal-metric-card:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.5);
}

.card-inner {
  position: relative;
  z-index: 1;
}

.is-focal {
  background: linear-gradient(145deg, rgba(15, 28, 48, 0.85) 0%, rgba(10, 18, 32, 0.9) 100%);
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 20px -5px rgba(56, 189, 248, 0.15);
}

.card-glow {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 90px;
  height: 90px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%);
  pointer-events: none;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.metric-icon {
  color: #64748b;
}

.metric-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.metric-main-value {
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
}

.is-focal .metric-main-value {
  color: #38bdf8;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

.variant-positive .metric-main-value {
  color: #34d399;
}

.variant-warning .metric-main-value {
  color: #fbbf24;
}

.variant-muted .metric-main-value {
  color: #64748b;
}

.metric-unit {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.is-focal .metric-unit {
  color: #38bdf8;
  opacity: 0.8;
}

.metric-subtext {
  font-size: 11px;
  color: #64748b;
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-pulse {
  color: #64748b;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .signal-metric-card:hover {
    transform: none;
  }
}
</style>
