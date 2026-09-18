<template>
  <AppModal
    :model-value="modelValue"
    title="Xóa khỏi Tiến Độ Sản Xuất"
    max-width="480px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="item" class="delete-confirmation-content">
      <div class="delete-icon-wrap">
        <AppIcon name="trash-2" :size="28" class="trash-icon" />
      </div>

      <div class="delete-message">
        <p class="delete-main-text">
          Bạn có chắc chắn muốn xóa mục sản xuất này không?
        </p>
        <div class="delete-item-preview">
          <span class="preview-title">{{ displayTitle }}</span>
          <span v-if="item.sourceVideo" class="preview-channel">
            Kênh: {{ item.sourceVideo.channelName }}
          </span>
        </div>
        <p class="delete-safe-note">
          <AppIcon name="info" :size="14" />
          <span>Video nguồn đối thủ không bị xóa.</span>
        </p>
      </div>
    </div>

    <template #footer>
      <div class="delete-modal-actions">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="isDeleting"
          @click="$emit('update:modelValue', false)"
        >
          Hủy
        </button>
        <button
          type="button"
          class="btn btn-danger btn-sm"
          :disabled="isDeleting"
          @click="$emit('confirm')"
        >
          <AppIcon v-if="isDeleting" name="refresh" :size="14" class="spin-anim" />
          <span>{{ isDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa' }}</span>
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProductionItem } from '@/types/production';
import AppModal from '@/components/ui/AppModal.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  modelValue: boolean;
  item: ProductionItem | null;
  isDeleting: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'confirm'): void;
}>();

const displayTitle = computed(() => {
  return props.item?.workingTitle || props.item?.sourceVideo?.title || 'Mục sản xuất';
});
</script>

<style scoped>
.delete-confirmation-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 0 16px;
  gap: 16px;
}

.delete-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.delete-message {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.delete-main-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary, #0f1f35);
  margin: 0;
}

.delete-item-preview {
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  padding: 10px 14px;
}

.preview-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary, #0f1f35);
  line-height: 1.35;
}

.preview-channel {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
}

.delete-safe-note {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: #059669;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 6px;
  padding: 6px 12px;
  margin: 0;
}

.delete-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.btn-danger {
  background: #dc2626;
  color: #ffffff;
  border: 1px solid #dc2626;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}
</style>
