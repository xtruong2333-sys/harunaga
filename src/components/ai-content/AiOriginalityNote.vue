<template>
  <div class="originality-band">
    <div class="band-icon-wrap">
      <AppIcon name="shield-check" :size="20" class="band-icon" />
    </div>
    <div class="band-content">
      <h5 class="band-title">Nguyên tắc tính nguyên bản</h5>
      <p class="band-text">{{ note }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  note: string;
}>();
</script>

<style scoped>
.originality-band {
  margin-top: 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

[data-theme="dark"] .originality-band {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(51, 65, 85, 0.7);
}

.band-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

[data-theme="dark"] .band-icon-wrap {
  background: rgba(37, 99, 235, 0.18);
  color: #60a5fa;
}

.band-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.band-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.band-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary, #475569);
}

[data-theme="dark"] .band-text {
  color: #94a3b8;
}
</style>
