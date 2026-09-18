<template>
  <div class="page-header">
    <div class="page-header-text">
      <div v-if="kicker || $slots.kicker" class="page-kicker">
        <slot name="kicker">{{ kicker }}</slot>
      </div>

      <div class="page-title-row">
        <h1 class="page-title">
          <slot name="title">{{ title }}</slot>
        </h1>
        <span
          v-if="badge"
          class="badge"
          :class="`badge-${badgeTone || 'accent'}`"
        >
          {{ badge }}
        </span>
      </div>

      <p v-if="description || $slots.description" class="page-description">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <div v-if="$slots.actions" class="page-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    kicker?: string;
    title: string;
    description?: string;
    badge?: string;
    badgeTone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  }>(),
  {
    badgeTone: 'accent',
  }
);
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.page-header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 800px;
}

.page-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--primary, #2563EB);
  text-transform: uppercase;
}

[data-theme="dark"] .page-kicker {
  color: #38BDF8;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-title {
  font-size: clamp(22px, 2.2vw, 28px);
  font-weight: 750;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  line-height: 1.2;
}

.page-description {
  font-size: 13.5px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
}

.badge-accent {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border: 1px solid #BFDBFE;
}

.badge-success {
  background: var(--success-soft, #ECFDF5);
  color: #059669;
  border: 1px solid #A7F3D0;
}

.badge-warning {
  background: var(--warning-soft, #FFFBEB);
  color: #D97706;
  border: 1px solid #FDE68A;
}

.badge-danger {
  background: var(--danger-soft, #FEF2F2);
  color: #EF4444;
  border: 1px solid #FECACA;
}

.badge-neutral {
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-secondary);
  border: 1px solid var(--border, #E3EBF3);
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
