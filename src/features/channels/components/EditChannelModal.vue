<template>
  <AppModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Thiết lập theo dõi"
    :description="channel ? `Kênh: ${channel.name}` : ''"
  >
    <div v-if="channel" class="edit-form">
      <div class="form-group">
        <label class="form-label">Số video kiểm tra mỗi lần</label>
        <input
          v-model.number="scanLimit"
          type="number"
          min="1"
          max="50"
          class="form-input"
        />
        <span class="field-help">Số lượng video mới nhất cần quét lượt xem (mặc định: 15, từ 1 đến 50).</span>
      </div>

      <div class="form-group">
        <label class="form-label">Ngưỡng cảnh báo VPH</label>
        <input
          v-model.number="alertThreshold"
          type="number"
          min="100"
          step="500"
          class="form-input"
        />
        <span class="field-help">
          Cảnh báo khi video tăng từ {{ alertThreshold.toLocaleString('vi-VN') }} lượt xem/giờ (VPH) trở lên.
        </span>
      </div>

      <div class="form-group">
        <label class="form-label">Ghi chú</label>
        <textarea
          v-model="notes"
          rows="3"
          placeholder="Thêm ghi chú về kênh đối thủ này..."
          class="form-textarea"
        ></textarea>
      </div>

      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="close" :disabled="saving">
        Hủy Bỏ
      </button>
      <button class="btn btn-primary" @click="handleSave" :disabled="saving">
        <span v-if="saving">Đang lưu...</span>
        <span v-else>Lưu Thay Đổi</span>
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppModal from '@/components/ui/AppModal.vue';
import { Channel } from '@/types/channel';

const props = defineProps<{
  modelValue: boolean;
  channel: Channel | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', payload: { id: string; scanLimit: number; alertThreshold: number; notes: string }): void;
}>();

const scanLimit = ref(15);
const alertThreshold = ref(5000);
const notes = ref('');
const saving = ref(false);
const errorMessage = ref<string | null>(null);

watch(
  () => props.channel,
  (c) => {
    if (c) {
      scanLimit.value = c.scanLimit;
      alertThreshold.value = c.alertVphThreshold;
      notes.value = c.notes || '';
      errorMessage.value = null;
    }
  },
  { immediate: true }
);

function close() {
  emit('update:modelValue', false);
}

function handleSave() {
  if (!props.channel) return;
  if (scanLimit.value < 1 || scanLimit.value > 50) {
    errorMessage.value = 'Số video kiểm tra phải từ 1 đến 50.';
    return;
  }
  if (alertThreshold.value < 100) {
    errorMessage.value = 'Ngưỡng cảnh báo VPH tối thiểu là 100.';
    return;
  }

  emit('save', {
    id: props.channel.id,
    scanLimit: scanLimit.value,
    alertThreshold: alertThreshold.value,
    notes: notes.value,
  });
  close();
}
</script>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.field-help {
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
