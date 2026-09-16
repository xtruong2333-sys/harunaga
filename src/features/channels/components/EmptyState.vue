<template>
  <div class="empty-state-card">
    <div class="empty-icon-wrap">
      <AppIcon name="tv" size="32" />
    </div>
    <h3 class="empty-title">Chưa có kênh nào được theo dõi</h3>
    <p class="empty-desc">
      Thêm kênh đầu tiên để hệ thống bắt đầu theo dõi đối thủ của bạn.
    </p>
    <button class="btn btn-primary btn-lg" @click="$emit('addChannel')">
      <AppIcon name="plus" size="18" />
      <span>+ Thêm Kênh Đầu Tiên</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

defineEmits<{
  (e: 'addChannel'): void;
}>();
</script>

<style scoped>
.empty-state-card {
  background-color: var(--bg-surface);
  border: 1px dashed var(--border-strong);
  border-radius: 12px;
  padding: 64px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 560px;
  margin: 32px auto;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 380px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.btn-lg {
  padding: 10px 20px;
  font-size: 14px;
}
</style>
