<template>
  <div class="technical-section-marker">
    <div class="marker-tag">
      <span class="marker-index">{{ index }}</span>
      <span class="marker-sep">/</span>
      <span class="marker-title">{{ title }}</span>
    </div>
    <span v-if="subtext" class="marker-subtext">{{ subtext }}</span>
    <div class="marker-signal-line" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  index: string;
  title: string;
  subtext?: string;
}>();
</script>

<style scoped>
.technical-section-marker {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 12px;
  user-select: none;
}

.marker-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 760;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.marker-index {
  color: var(--primary);
}

.marker-sep {
  color: var(--text-muted);
}

.marker-title {
  color: var(--text-secondary);
}

.marker-subtext {
  font-size: 11px;
  color: var(--text-muted);
}

.marker-signal-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(37,99,235,.22), rgba(37,99,235,.06), transparent);
}
</style>
