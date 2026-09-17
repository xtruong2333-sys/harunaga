<template>
  <AppModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Thêm kênh theo dõi"
    description="Dán đường dẫn hoặc @tênkênh YouTube."
  >
    <div class="add-form">
      <div class="form-group">
        <label class="form-label">Đường dẫn hoặc @tênkênh</label>
        <div class="input-with-button">
          <input
            v-model="inputQuery"
            type="text"
            placeholder="Dán URL hoặc @tênkênh..."
            class="form-input"
            @keyup.enter="handleResolve"
            :disabled="resolving || submitting"
          />
          <button
            class="btn btn-primary"
            @click="handleResolve"
            :disabled="!inputQuery.trim() || resolving || submitting"
          >
            <span v-if="resolving">Đang kiểm tra...</span>
            <span v-else>Kiểm Tra Kênh</span>
          </button>
        </div>
        <div class="input-help">
          Ví dụ: <code>@tenkenh</code> hoặc <code>youtube.com/@tenkenh</code>
        </div>
      </div>

      <!-- Lỗi giải quyết -->
      <div v-if="resolveError" class="alert-box alert-error">
        <AppIcon name="alert" size="16" />
        <span>{{ resolveError }}</span>
      </div>

      <!-- Kênh đã tồn tại trong danh sách -->
      <div v-if="existingChannel" class="alert-box alert-warning">
        <div class="existing-message">
          <AppIcon name="alert" size="16" />
          <span>Kênh này đã có trong danh sách theo dõi ({{ statusLabels[existingChannel.status] }}).</span>
        </div>
        <div class="existing-actions">
          <button
            v-if="existingChannel.status === 'paused'"
            class="btn btn-primary btn-sm"
            @click="handleResumeExisting"
            :disabled="submitting"
          >
            Bật Theo Dõi Lại
          </button>
          <button
            v-else-if="existingChannel.status === 'archived'"
            class="btn btn-primary btn-sm"
            @click="handleRestoreExisting"
            :disabled="submitting"
          >
            Khôi Phục Kênh
          </button>
        </div>
      </div>

      <!-- Preview kết quả giải quyết kênh -->
      <div v-if="resolvedPreview && !existingChannel" class="preview-card">
        <div class="preview-header">
          <div class="avatar-wrap">
            <img
              v-if="resolvedPreview.avatarUrl"
              :src="resolvedPreview.avatarUrl"
              :alt="resolvedPreview.name"
              class="avatar-img"
            />
            <div v-else class="avatar-fallback">
              {{ resolvedPreview.name.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="preview-meta">
            <div class="preview-name">{{ resolvedPreview.name }}</div>
            <div v-if="resolvedPreview.handle" class="preview-handle">
              {{ resolvedPreview.handle }}
            </div>
            <div class="preview-id">ID: {{ resolvedPreview.youtubeChannelId }}</div>
          </div>
        </div>

        <!-- Tùy chỉnh thiết lập ban đầu -->
        <div class="settings-row">
          <div class="setting-col">
            <label class="setting-label">Số video kiểm tra</label>
            <input
              v-model.number="scanLimit"
              type="number"
              min="1"
              max="50"
              class="form-input"
            />
          </div>
          <div class="setting-col">
            <label class="setting-label">Ngưỡng cảnh báo VPH</label>
            <input
              v-model.number="alertThreshold"
              type="number"
              min="100"
              step="500"
              class="form-input"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="close" :disabled="submitting">
        Hủy Bỏ
      </button>
      <button
        v-if="resolvedPreview && !existingChannel"
        class="btn btn-primary"
        @click="handleAdd"
        :disabled="submitting"
      >
        <span v-if="submitting">Đang thêm...</span>
        <span v-else>Thêm Vào Danh Sách</span>
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { channelService, AccessKeyRequiredError } from '@/services/channel-service';
import { Channel, ResolvedChannelPreview, STATUS_LABELS } from '@/types/channel';

const props = defineProps<{
  modelValue: boolean;
  existingChannels: Channel[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'added', channel: Channel): void;
  (e: 'resumed', id: string): void;
  (e: 'restored', id: string): void;
  (e: 'access-key-required', retryAction: () => Promise<any>, errorMsg?: string): void;
}>();

const statusLabels = STATUS_LABELS;

const inputQuery = ref('');
const resolving = ref(false);
const resolveError = ref<string | null>(null);
const resolvedPreview = ref<ResolvedChannelPreview | null>(null);
const existingChannel = ref<Channel | null>(null);

const scanLimit = ref(15);
const alertThreshold = ref(5000);
const submitting = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      reset();
    }
  }
);

function reset() {
  inputQuery.value = '';
  resolving.value = false;
  resolveError.value = null;
  resolvedPreview.value = null;
  existingChannel.value = null;
  scanLimit.value = 15;
  alertThreshold.value = 5000;
  submitting.value = false;
}

function close() {
  emit('update:modelValue', false);
}

async function handleResolve() {
  if (!inputQuery.value.trim()) return;
  resolving.value = true;
  resolveError.value = null;
  resolvedPreview.value = null;
  existingChannel.value = null;

  try {
    const result = await channelService.resolveChannel(inputQuery.value);
    resolvedPreview.value = result;

    // Kiểm tra xem đã có trong danh sách chưa
    const found = props.existingChannels.find(
      c => c.youtubeChannelId === result.youtubeChannelId
    );
    if (found) {
      existingChannel.value = found;
    }
  } catch (err: any) {
    resolveError.value = err.message || 'Không tìm thấy kênh YouTube này.';
  } finally {
    resolving.value = false;
  }
}

async function handleAdd() {
  if (!resolvedPreview.value) return;
  submitting.value = true;
  resolveError.value = null;

  try {
    const created = await channelService.createChannel({
      youtubeChannelId: resolvedPreview.value.youtubeChannelId,
      name: resolvedPreview.value.name,
      handle: resolvedPreview.value.handle,
      url: resolvedPreview.value.url,
      avatarUrl: resolvedPreview.value.avatarUrl,
      scanLimit: scanLimit.value,
      alertVphThreshold: alertThreshold.value,
    });
    emit('added', created);
    close();
    return created;
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.name === 'AccessKeyRequiredError') {
      resolveError.value = null;
      emit('access-key-required', () => handleAdd(), err.message);
      throw err;
    }
    resolveError.value = err.message;
    throw err;
  } finally {
    submitting.value = false;
  }
}

async function handleResumeExisting() {
  if (!existingChannel.value) return;
  submitting.value = true;
  resolveError.value = null;
  try {
    const resumed = await channelService.resumeChannel(existingChannel.value.id);
    emit('resumed', existingChannel.value.id);
    close();
    return resumed;
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.name === 'AccessKeyRequiredError') {
      resolveError.value = null;
      emit('access-key-required', () => handleResumeExisting(), err.message);
      throw err;
    }
    resolveError.value = err.message;
    throw err;
  } finally {
    submitting.value = false;
  }
}

async function handleRestoreExisting() {
  if (!existingChannel.value) return;
  submitting.value = true;
  resolveError.value = null;
  try {
    const restored = await channelService.restoreChannel(existingChannel.value.id);
    emit('restored', existingChannel.value.id);
    close();
    return restored;
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.name === 'AccessKeyRequiredError') {
      resolveError.value = null;
      emit('access-key-required', () => handleRestoreExisting(), err.message);
      throw err;
    }
    resolveError.value = err.message;
    throw err;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.add-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.input-with-button {
  display: flex;
  gap: 10px;
}

.input-with-button input {
  flex: 1;
}

.input-help {
  font-size: 12px;
  color: var(--text-muted);
}

.input-help code {
  background-color: var(--bg-surface-elevated);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
}

.alert-error {
  background-color: var(--danger-bg);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--danger);
}

.alert-warning {
  background-color: var(--status-paused-bg);
  border: 1px solid rgba(234, 179, 8, 0.25);
  color: var(--status-paused);
  flex-direction: column;
  gap: 12px;
}

.existing-message {
  display: flex;
  align-items: center;
  gap: 8px;
}

.existing-actions {
  display: flex;
  gap: 8px;
}

.preview-card {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
}

.preview-meta {
  flex: 1;
}

.preview-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-handle {
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-id {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  font-family: monospace;
}

.settings-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}

.setting-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}
</style>
