<template>
  <div class="intelligence-brief-section">
    <!-- Header Bar with Copy All -->
    <div class="brief-header-bar">
      <div class="brief-title-group">
        <h3 class="brief-title">Kết quả phân tích</h3>
        <span class="brief-sub">Được tạo từ video nguồn đang chọn</span>
      </div>

      <button
        type="button"
        class="btn btn-secondary btn-copy-all"
        :class="{ 'is-copied': copiedAll }"
        @click="$emit('copy-all')"
      >
        <AppIcon :name="copiedAll ? 'check' : 'copy'" :size="15" />
        <span>{{ copiedAll ? 'Đã sao chép!' : 'Sao chép toàn bộ' }}</span>
      </button>
    </div>

    <!-- Editorial Block: 2 columns -->
    <div class="brief-editorial-card">
      <div class="editorial-col">
        <div class="col-kicker">Tóm tắt chủ đề</div>
        <p class="col-content">{{ summary }}</p>
      </div>

      <div class="editorial-col">
        <div class="col-kicker">Góc tiếp cận của đối thủ</div>
        <p class="col-content">{{ contentAngle }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  summary: string;
  contentAngle: string;
  copiedAll: boolean;
}>();

defineEmits<{
  (e: 'copy-all'): void;
}>();
</script>

<style scoped>
.intelligence-brief-section {
  margin-top: 24px;
}

.brief-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.brief-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brief-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0;
  letter-spacing: -0.01em;
}

.brief-sub {
  font-size: 12.5px;
  color: var(--text-muted, #94a3b8);
}

.btn-copy-all {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #cbd5e1);
  color: var(--text-primary, #0f172a);
  cursor: pointer;
  transition: all 0.15s ease;
}

[data-theme="dark"] .btn-copy-all {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(71, 85, 105, 0.8);
  color: #f8fafc;
}

.btn-copy-all:hover {
  background: #f1f5f9;
}

[data-theme="dark"] .btn-copy-all:hover {
  background: rgba(51, 65, 85, 0.8);
}

.btn-copy-all.is-copied {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.4);
  color: #059669;
}

.brief-editorial-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .brief-editorial-card {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.7);
}

@media (max-width: 768px) {
  .brief-editorial-card {
    grid-template-columns: 1fr;
  }
}

.editorial-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.col-kicker {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #2563eb;
}

[data-theme="dark"] .col-kicker {
  color: #60a5fa;
}

.col-content {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--text-primary, #0f172a);
  margin: 0;
}
</style>
