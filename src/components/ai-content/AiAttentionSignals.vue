<template>
  <div class="attention-signals-card">
    <div class="signals-header">
      <AppIcon name="check-circle" :size="18" class="signals-icon" />
      <h4 class="signals-title">Điểm thu hút có thể nhìn thấy</h4>
    </div>

    <ul class="signals-list">
      <li
        v-for="(item, idx) in signals"
        :key="idx"
        class="signal-item"
      >
        <span class="signal-bullet"></span>
        <span class="signal-text">{{ item }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  signals: string[];
}>();
</script>

<style scoped>
.attention-signals-card {
  margin-top: 16px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .attention-signals-card {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.7);
}

.signals-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.signals-icon {
  color: #059669;
}

.signals-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.signals-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.signal-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary, #0f172a);
}

.signal-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2563eb;
  margin-top: 7px;
  flex-shrink: 0;
}

[data-theme="dark"] .signal-bullet {
  background: #60a5fa;
}

.signal-text {
  flex: 1;
}
</style>
