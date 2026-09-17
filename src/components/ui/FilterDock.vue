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
  background: #080C12;
  border-top: 1px solid rgba(56, 189, 248, 0.14);
  border-bottom: 1px solid rgba(56, 189, 248, 0.14);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  padding: 14px 18px;
  margin-bottom: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 4px 16px rgba(0, 0, 0, 0.25);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.dock-active {
  border-top-color: rgba(56, 189, 248, 0.35);
  border-bottom-color: rgba(56, 189, 248, 0.35);
}

.dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.dock-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dock-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.active-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--accent);
  background: rgba(56, 189, 248, 0.08);
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.active-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
}

.dock-header-actions {
  display: flex;
  align-items: center;
}

.dock-body {
  width: 100%;
}
</style>
