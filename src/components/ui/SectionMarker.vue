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
  gap: 12px;
  margin-bottom: 12px;
  user-select: none;
}

.marker-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.marker-index {
  color: var(--accent);
  opacity: 0.9;
}

.marker-sep {
  color: var(--text-muted);
  opacity: 0.6;
}

.marker-title {
  color: var(--text-secondary);
  letter-spacing: 0.1em;
}

.marker-subtext {
  font-size: 11px;
  color: var(--text-muted);
  font-family: inherit;
  letter-spacing: 0.02em;
}

.marker-signal-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(56, 189, 248, 0.25) 0%,
    rgba(56, 189, 248, 0.08) 50%,
    transparent 100%
  );
  position: relative;
}

.marker-signal-line::after {
  content: '';
  position: absolute;
  left: 0;
  top: -1.5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--accent);
  opacity: 0.6;
}
</style>
