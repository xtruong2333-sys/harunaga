<template>
  <AppModal
    :model-value="modelValue"
    title="Chỉnh Sửa Mục Sản Xuất"
    description="Cập nhật tiêu đề dự kiến, mức ưu tiên, ghi chú hoặc liên kết bài đăng."
    max-width="540px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Modal Error Banner (Non-auth validation errors) -->
    <div v-if="modalError" class="modal-error-banner" role="alert">
      <AppIcon name="alert-circle" :size="16" />
      <span>{{ modalError }}</span>
    </div>

    <form v-if="item" class="edit-form" @submit.prevent="handleSubmit">
      <!-- Source Video Info Card (Read-only reference) -->
      <div v-if="item.sourceVideo" class="source-ref-card">
        <span class="source-ref-badge">Video nguồn đối thủ</span>
        <div class="source-ref-title">{{ item.sourceVideo.title }}</div>
        <div class="source-ref-channel">{{ item.sourceVideo.channelName }}</div>
      </div>

      <!-- Working Title -->
      <div class="form-group">
        <label for="edit-working-title" class="form-label">Tiêu đề dự kiến</label>
        <input
          id="edit-working-title"
          v-model="formWorkingTitle"
          type="text"
          class="form-input"
          placeholder="Nhập tiêu đề triển khai cho video của bạn..."
          :disabled="isSaving"
        />
      </div>

      <!-- Priority -->
      <div class="form-group">
        <label for="edit-priority" class="form-label">Mức độ ưu tiên</label>
        <select
          id="edit-priority"
          v-model="formPriority"
          class="form-select"
          :disabled="isSaving"
        >
          <option value="high">Cao — Cần triển khai sớm</option>
          <option value="normal">Bình thường — Theo kế hoạch</option>
          <option value="low">Thấp — Ý tưởng dự phòng</option>
        </select>
      </div>

      <!-- Published URL -->
      <div class="form-group">
        <label for="edit-published-url" class="form-label">
          Liên kết bài đăng / video đã xuất bản
          <span class="label-hint">(Bắt đầu bằng http:// hoặc https://)</span>
        </label>
        <input
          id="edit-published-url"
          v-model="formPublishedUrl"
          type="url"
          class="form-input"
          placeholder="https://www.youtube.com/watch?v=..."
          :disabled="isSaving"
        />
      </div>

      <!-- Notes -->
      <div class="form-group">
        <label for="edit-notes" class="form-label">Ghi chú kịch bản / hướng tiếp cận</label>
        <textarea
          id="edit-notes"
          v-model="formNotes"
          class="form-textarea"
          rows="4"
          placeholder="Ghi lại góc nhìn khác biệt, dàn ý nội dung, các điểm nhấn cần chú ý..."
          :disabled="isSaving"
        ></textarea>
      </div>
    </form>

    <template #footer>
      <div class="modal-footer-actions">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="isSaving"
          @click="$emit('update:modelValue', false)"
        >
          Hủy
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="isSaving"
          @click="handleSubmit"
        >
          <AppIcon v-if="isSaving" name="refresh" :size="14" class="spin-anim" />
          <span>{{ isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi' }}</span>
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ProductionItem, ProductionPriority, ProductionUpdateInput } from '@/types/production';
import AppModal from '@/components/ui/AppModal.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  modelValue: boolean;
  item: ProductionItem | null;
  isSaving: boolean;
  modalError: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'save', payload: ProductionUpdateInput): void;
}>();

const formWorkingTitle = ref('');
const formPriority = ref<ProductionPriority>('normal');
const formPublishedUrl = ref('');
const formNotes = ref('');

watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      formWorkingTitle.value = newItem.workingTitle || '';
      formPriority.value = newItem.priority || 'normal';
      formPublishedUrl.value = newItem.publishedUrl || '';
      formNotes.value = newItem.notes || '';
    }
  },
  { immediate: true }
);

function handleSubmit() {
  if (!props.item) return;

  // Snapshot payload BEFORE sending to parent / pending action
  const updateInput: ProductionUpdateInput = {
    id: props.item.id,
    workingTitle: formWorkingTitle.value.trim() || undefined,
    priority: formPriority.value,
    notes: formNotes.value.trim() || undefined,
    publishedUrl: formPublishedUrl.value.trim() || undefined,
  };

  emit('save', updateInput);
}
</script>

<style scoped>
.modal-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.8125rem;
  color: #dc2626;
  margin-bottom: 16px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.source-ref-card {
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  padding: 10px 12px;
}

.source-ref-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #2563eb;
  letter-spacing: 0.03em;
  display: block;
  margin-bottom: 4px;
}

.source-ref-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #0f1f35);
  line-height: 1.3;
}

.source-ref-channel {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  margin-top: 2px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary, #0f1f35);
}

.label-hint {
  font-weight: 400;
  color: var(--text-tertiary, #94a3b8);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 9px 12px;
  font-size: 0.875rem;
  color: var(--text-primary, #0f1f35);
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
</style>
