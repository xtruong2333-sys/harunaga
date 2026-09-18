<template>
  <div class="channel-summary-strip surface-card">
    <!-- 1. Tổng Kênh -->
    <div class="strip-item">
      <div v-if="loading" class="strip-skeleton"></div>
      <div v-else class="strip-value mono">{{ totalCount }}</div>
      <div class="strip-label">KÊNH THEO DÕI</div>
    </div>

    <div class="strip-divider"></div>

    <!-- 2. Đang hoạt động -->
    <div class="strip-item">
      <div v-if="loading" class="strip-skeleton"></div>
      <div v-else class="strip-value mono text-positive">{{ activeCount }}</div>
      <div class="strip-label">ĐANG HOẠT ĐỘNG</div>
    </div>

    <div class="strip-divider"></div>

    <!-- 3. Video đang tăng -->
    <div class="strip-item">
      <div v-if="loading" class="strip-skeleton"></div>
      <div v-else class="strip-value mono text-accent">{{ risingVideosCount }}</div>
      <div class="strip-label">VIDEO ĐANG TĂNG</div>
    </div>

    <div class="strip-divider"></div>

    <!-- 4. Max VPH -->
    <div class="strip-item">
      <div v-if="loading" class="strip-skeleton"></div>
      <div v-else class="strip-value mono text-accent">
        {{ maxVph !== null && maxVph > 0 ? `${formatNumber(Math.round(maxVph))} VPH` : '—' }}
      </div>
      <div class="strip-label">MAX VPH TOÀN MẠNG</div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    totalCount: number;
    activeCount: number;
    risingVideosCount: number;
    maxVph: number | null;
    loading?: boolean;
  }>(),
  {
    loading: false,
  }
);

function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('vi-VN');
}
</script>

<style scoped>
.channel-summary-strip {
  display: flex;
  align-items: center;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  padding: 0.875rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  margin-bottom: 1.25rem;
}

.strip-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 0.5rem;
}

.strip-skeleton {
  width: 42px;
  height: 22px;
  border-radius: 4px;
  background: var(--border, #E2E8F0);
  margin-bottom: 0.25rem;
  animation: pulse-skeleton 1.5s ease-in-out infinite alternate;
}

@keyframes pulse-skeleton {
  0% { opacity: 0.4; }
  100% { opacity: 0.85; }
}

.strip-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.strip-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-tertiary, #64748B);
  letter-spacing: 0.04em;
  margin-top: 0.25rem;
}

.strip-divider {
  width: 1px;
  height: 32px;
  background: var(--border, #E2E8F0);
  flex-shrink: 0;
}

.text-positive {
  color: var(--color-success-text, #059669) !important;
}

.text-accent {
  color: var(--brand-primary, #2563EB) !important;
}

@media (max-width: 768px) {
  .channel-summary-strip {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .strip-divider {
    display: none;
  }

  .strip-item {
    align-items: flex-start;
    text-align: left;
    padding: 0.25rem 0.5rem;
  }
}
</style>
