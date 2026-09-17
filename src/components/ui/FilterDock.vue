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
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  backdrop-filter: blur(12px);
  margin-bottom: 24px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dock-active {
  border-color: rgba(56, 189, 248, 0.25);
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.4);
}

.dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dock-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dock-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.active-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 2px 8px;
  border-radius: 9999px;
}

.active-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #38bdf8;
}

.dock-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
