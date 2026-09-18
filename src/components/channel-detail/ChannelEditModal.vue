<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
    <div class="modal-dialog surface-card">
      <div class="modal-header">
        <h3 class="modal-title">Chỉnh Sửa Thiết Lập Kênh</h3>
        <button type="button" class="btn-close" @click="$emit('update:modelValue', false)">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label">Tên kênh</label>
          <input
            type="text"
            class="form-input"
            :value="channel?.name || ''"
            disabled
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            Ngưỡng cảnh báo VPH
            <span class="label-hint">(Để trống hoặc 0 nếu không áp dụng ngưỡng)</span>
          </label>
          <input
            v-model="thresholdInput"
            type="number"
            min="0"
            step="100"
            placeholder="Ví dụ: 5000"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            Giới hạn video quét mỗi lần
            <span class="label-hint">(Để trống nếu không giới hạn)</span>
          </label>
          <input
            v-model="scanLimitInput"
            type="number"
            min="1"
            max="50"
            step="1"
            placeholder="Ví dụ: 15"
            class="form-input"
          />
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('update:modelValue', false)"
          >
            Hủy
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ChannelAnalysisHeader } from '@/types/channel-analysis';

const props = defineProps<{
  modelValue: boolean;
  channel: ChannelAnalysisHeader | null;
  isSubmitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'save', payload: { alertThreshold: number | null; scanLimit: number | null }): void;
}>();

const thresholdInput = ref<string>('');
const scanLimitInput = ref<string>('');

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.channel) {
    thresholdInput.value = props.channel.alertVphThreshold !== null ? String(props.channel.alertVphThreshold) : '';
    scanLimitInput.value = props.channel.scanLimit !== null ? String(props.channel.scanLimit) : '';
  }
}, { immediate: true });

function handleSubmit() {
  const tVal = thresholdInput.value.trim();
  const sVal = scanLimitInput.value.trim();

  const alertThreshold = tVal && !isNaN(Number(tVal)) && Number(tVal) > 0 ? Number(tVal) : null;
  const scanLimit = sVal && !isNaN(Number(sVal)) && Number(sVal) > 0 ? Number(sVal) : null;

  emit('save', { alertThreshold, scanLimit });
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-dialog {
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 22px;
  line-height: 1;
  color: var(--text-muted, #94A3B8);
  cursor: pointer;
}

.modal-body {
  padding: 20px;
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
  font-weight: 600;
  color: var(--text-primary, #0F172A);
}

.label-hint {
  font-weight: 400;
  color: var(--text-muted, #64748B);
  font-size: 11.5px;
}

.form-input {
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--bg-inset, #F8FAFC);
  font-size: 13.5px;
  color: var(--text-primary, #0F172A);
}

.form-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-input:focus {
  outline: none;
  border-color: #2563EB;
  background: #FFFFFF;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  color: var(--text-primary, #0F172A);
}

.btn-primary {
  background: var(--primary, #2563EB);
  border: 1px solid #1D4ED8;
  color: #FFFFFF;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
