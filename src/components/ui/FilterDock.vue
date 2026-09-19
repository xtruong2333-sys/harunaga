<template>
  <div class="filter-dock" :class="{ 'dock-active': activeCount > 0 }">
    <div class="dock-header" v-if="title || activeCount > 0 || $slots.header">
      <div class="dock-title-wrap">
        <span v-if="title" class="dock-title">{{ title }}</span>
        <span v-if="activeCount > 0" class="active-badge">
          <span class="active-dot" />
          {{ activeCount }} bộ lọc đang bật
        </span>
      </div>
      <div v-if="$slots.headerActions" class="dock-header-actions">
        <slot name="headerActions" />
      </div>
    </div>

    <div class="dock-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    activeCount?: number;
  }>(),
  {
    title: '',
    activeCount: 0,
  }
);
</script>

<style scoped>
.filter-dock {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 0;
  box-shadow: var(--shadow-sm);
  transition: border-color .15s ease, box-shadow .15s ease;
}

.dock-active {
  border-color: #A8C2F5;
  box-shadow: 0 0 0 3px rgba(37,99,235,.06), var(--shadow-sm);
}

.dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.dock-title-wrap,
.dock-header-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.dock-title {
  font-size: 11px;
  font-weight: 760;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.active-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  font-size: 10.8px;
  font-weight: 700;
  color: #1D4ED8;
  background: #E7EFFF;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid #C5D6FA;
}

.active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2563EB;
}

.dock-body {
  width: 100%;
}
</style>
