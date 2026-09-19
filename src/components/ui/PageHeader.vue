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
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 6px;
  padding: 2px 0 10px;
  flex-wrap: wrap;
}

.page-header-text {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-width: 900px;
}

.page-kicker {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid #C8D9FF;
  background: #E8F0FF;
  color: #1D4ED8;
  font-size: 10.5px;
  font-weight: 780;
  line-height: 1.1;
  letter-spacing: .075em;
  text-transform: uppercase;
}

[data-theme="dark"] .page-kicker {
  color: #93C5FD;
  background: rgba(59,130,246,.14);
  border-color: rgba(96,165,250,.24);
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: clamp(28px, 2.4vw, 34px);
  font-weight: 780;
  letter-spacing: -.035em;
  color: var(--text-primary);
  line-height: 1.1;
}

.page-description {
  margin: 0;
  max-width: 780px;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.55;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 10.8px;
  font-weight: 700;
}

.badge-accent {
  background: #E7EFFF;
  color: #1D4ED8;
  border: 1px solid #C5D6FA;
}

.badge-success {
  background: #E0F4EA;
  color: #087A57;
  border: 1px solid #B8E3CF;
}

.badge-warning {
  background: #FFF0CA;
  color: #925600;
  border: 1px solid #F2D58B;
}

.badge-danger {
  background: #FBE2E2;
  color: #B42323;
  border: 1px solid #F0B9B9;
}

.badge-neutral {
  background: var(--surface-muted);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

@media (max-width: 760px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-actions {
    justify-content: flex-start;
  }
}
</style>
