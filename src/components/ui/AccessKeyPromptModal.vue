<template>
  <AppModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Mã truy cập"
    description="Nhập mã truy cập để thực hiện các thao tác thay đổi dữ liệu trên hệ thống."
    max-width="440px"
  >
    <div class="access-key-form">
      <div class="form-group">
        <label class="form-label">Mã truy cập quản trị</label>
        <input
          v-model="inputKey"
          type="password"
          placeholder="Nhập mã truy cập..."
          class="form-input"
          @keyup.enter="handleConfirm"
          autofocus
        />
        <div class="input-help">
          Mã truy cập chỉ được lưu trong phiên làm việc hiện tại (sessionStorage) và tự xóa khi đóng tab.
        </div>
      </div>

      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="close">
        Hủy Bỏ
      </button>
      <button class="btn btn-primary" @click="handleConfirm" :disabled="!inputKey.trim()">
        Xác Nhận
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppModal from '@/components/ui/AppModal.vue';
import { setStoredAccessKey } from '@/services/channel-service';

const props = defineProps<{
  modelValue: boolean;
  initialError?: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirmed', key: string): void;
}>();

const inputKey = ref('');
const errorMessage = ref<string | null>(null);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      inputKey.value = '';
      errorMessage.value = props.initialError || null;
    }
  }
);

function close() {
  emit('update:modelValue', false);
}

function handleConfirm() {
  const trimmed = inputKey.value.trim();
  if (!trimmed) {
    errorMessage.value = 'Vui lòng nhập mã truy cập.';
    return;
  }
  setStoredAccessKey(trimmed);
  emit('confirmed', trimmed);
  close();
}
</script>

<style scoped>
.access-key-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.input-help {
  font-size: 12px;
  color: var(--text-muted);
}

.error-box {
  padding: 10px 14px;
  background-color: var(--danger-bg);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--danger);
  border-radius: 8px;
  font-size: 13px;
}
</style>
