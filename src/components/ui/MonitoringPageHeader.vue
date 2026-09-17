<template>
  <header class="monitoring-header">
    <div class="header-main">
      <div class="header-meta-row" v-if="eyebrow || liveMarker">
        <span v-if="eyebrow" class="header-eyebrow">{{ eyebrow }}</span>
        <span v-if="eyebrow && liveMarker" class="header-divider">•</span>
        <div v-if="liveMarker" class="live-signal-badge">
          <span class="live-dot" />
          <span class="live-text">{{ typeof liveMarker === 'string' ? liveMarker : 'Dữ liệu theo dõi' }}</span>
        </div>
      </div>

      <h1 class="header-title">{{ title }}</h1>
      <p v-if="description" class="header-description">{{ description }}</p>
    </div>

    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    eyebrow?: string;
    description?: string;
    liveMarker?: boolean | string;
  }>(),
  {
    eyebrow: '',
    description: '',
    liveMarker: true,
  }
);
</script>

<style scoped>
.monitoring-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-main {
  flex: 1;
  min-width: 0;
}

.header-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.header-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #38bdf8;
}

.header-divider {
  color: rgba(255, 255, 255, 0.2);
  font-size: 10px;
}

.live-signal-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
  animation: pulse-signal 2.5s infinite;
}

@keyframes pulse-signal {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

@media (prefers-reduced-motion: reduce) {
  .live-dot {
    animation: none !important;
  }
}

.live-text {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
}

.header-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: #f8fafc;
  line-height: 1.2;
  margin: 0 0 6px 0;
}

.header-description {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
  max-width: 720px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .monitoring-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
  }

  .header-title {
    font-size: 22px;
  }

  .header-description {
    font-size: 13px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
