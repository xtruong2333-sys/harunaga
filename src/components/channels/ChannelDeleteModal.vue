<template>
  <div v-if="modelValue" class="modal-backdrop" @click="closeModal">
    <div class="modal-dialog surface-card" @click.stop>
      <div class="modal-header">
        <div class="modal-icon-wrap is-danger">
          <AppIcon name="alert-triangle" size="20" />
        </div>
        <div class="modal-title-group">
          <h3 class="modal-title">Ngừng theo dõi kênh?</h3>
          <p class="modal-subtitle">Xác nhận chuyển kênh vào danh sách lưu trữ</p>
        </div>
      </div>

      <div class="modal-body">
        <p class="warning-text">
          Bạn có chắc muốn ngừng theo dõi kênh
          <strong>"{{ channel?.name || 'này' }}"</strong>?
        </p>
        <p class="detail-text">
          Hệ thống sẽ tạm dừng quét và chuyển kênh này vào mục lưu trữ. Bạn luôn có thể khôi phục lại sau trong bộ lọc "Đã lưu trữ".
        </p>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" @click="closeModal">
          Hủy Bỏ
        </button>
        <button type="button" class="btn btn-danger btn-sm" @click="confirmArchive">
          <AppIcon name="archive" size="14" />
          <span>Ngừng Theo Dõi</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { Channel } from '@/types/channel';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  modelValue: boolean;
  channel: Channel | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', id: string): void;
}>();

function closeModal() {
  emit('update:modelValue', false);
}

function confirmArchive() {
  if (props.channel) {
    emit('confirm', props.channel.id);
  }
  closeModal();
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    closeModal();
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', handleKeyDown);
  }
});

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', handleKeyDown);
  }
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-dialog {
  width: 100%;
  max-width: 440px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  animation: modal-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-enter {
  from { opacity: 0; transform: scale(0.96) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1rem;
}

.modal-icon-wrap.is-danger {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-danger-bg, #FEF2F2);
  color: var(--color-danger-text, #DC2626);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  margin: 0;
}

.modal-subtitle {
  font-size: 0.75rem;
  color: var(--text-tertiary, #64748B);
  margin: 0.125rem 0 0;
}

.modal-body {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-secondary, #334155);
  margin-bottom: 1.5rem;
}

.warning-text {
  margin: 0 0 0.5rem;
}

.detail-text {
  font-size: 0.8125rem;
  color: var(--text-tertiary, #64748B);
  margin: 0;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-danger {
  background: var(--color-danger-text, #DC2626);
  color: #FFFFFF;
  border: 1px solid var(--color-danger-text, #DC2626);
}

.btn-danger:hover {
  background: #B91C1C;
}
</style>
