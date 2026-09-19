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
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 17px 18px;
  transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.signal-metric-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.card-inner {
  position: relative;
  z-index: 1;
}

.is-focal {
  border-color: #B9CCF3;
  background: linear-gradient(180deg, #FFFFFF 0%, #F6F9FF 100%);
}

[data-theme="dark"] .is-focal {
  background: linear-gradient(180deg, #132033 0%, #0F1A2B 100%);
}

.card-glow {
  position: absolute;
  right: -25px;
  top: -34px;
  width: 110px;
  height: 110px;
  background: radial-gradient(circle, rgba(37,99,235,.12), transparent 68%);
  pointer-events: none;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 9px;
}

.metric-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: .035em;
}

.metric-icon {
  color: #5E7BA0;
}

.metric-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}

.metric-main-value {
  font-size: 25px;
  font-weight: 780;
  letter-spacing: -.03em;
  color: var(--text-primary);
}

.is-focal .metric-main-value {
  color: var(--primary);
  text-shadow: none;
}

.variant-positive .metric-main-value {
  color: #087A57;
}

.variant-warning .metric-main-value {
  color: #A45A00;
}

.variant-muted .metric-main-value {
  color: var(--text-secondary);
}

.metric-unit {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.metric-subtext {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-pulse {
  color: var(--text-muted);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: .4; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .signal-metric-card:hover { transform: none; }
}
</style>
