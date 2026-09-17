<template>
  <AppModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Thêm nhiều kênh cùng lúc"
    description="Mỗi dòng nhập một URL hoặc @tênkênh YouTube."
    max-width="600px"
  >
    <div class="bulk-form">
      <div v-if="!summary" class="input-step">
        <label class="form-label">Danh sách kênh</label>
        <textarea
          v-model="rawInput"
          class="form-textarea"
          rows="8"
          placeholder="@kenh1&#10;https://youtube.com/@kenh2&#10;https://youtube.com/channel/UCxxxxxx"
          :disabled="resolving"
        ></textarea>
        <div class="textarea-help">
          Số dòng hợp lệ: {{ inputLinesCount }} kênh
        </div>

        <div v-if="resolving" class="progress-box">
          <div class="progress-text">
            Đang kiểm tra {{ progressCurrent }}/{{ progressTotal }}...
          </div>
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Kết quả kiểm tra danh sách -->
      <div v-else class="summary-step">
        <div class="summary-stats">
          <div class="summary-badge summary-valid">
            {{ summary.valid.length }} kênh hợp lệ
          </div>
          <div class="summary-badge summary-duplicate">
            {{ summary.duplicates.length }} kênh đã tồn tại
          </div>
          <div class="summary-badge summary-error">
            {{ summary.errors.length }} kênh không tìm thấy
          </div>
        </div>

        <div v-if="summary.valid.length > 0" class="valid-channels-preview">
          <div class="preview-title">Danh sách sẽ thêm:</div>
          <div class="valid-items-list">
            <div
              v-for="item in summary.valid"
              :key="item.resolved?.youtubeChannelId"
              class="valid-item-row"
            >
              <div class="item-name">{{ item.resolved?.name }}</div>
              <div class="item-handle">{{ item.resolved?.handle || item.resolved?.youtubeChannelId }}</div>
            </div>
          </div>
        </div>

        <div v-if="summary.errors.length > 0" class="error-items-box">
          <div class="preview-title error-title">Kênh không tìm thấy hoặc lỗi:</div>
          <ul class="error-list">
            <li v-for="(item, idx) in summary.errors" :key="idx">
              <code>{{ item.input }}</code> — {{ item.error }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="close" :disabled="resolving || submitting">
        Hủy Bỏ
      </button>

      <button
        v-if="!summary"
        class="btn btn-primary"
        @click="handleCheck"
        :disabled="inputLinesCount === 0 || resolving"
      >
        <span v-if="resolving">Đang kiểm tra...</span>
        <span v-else>Kiểm Tra Danh Sách</span>
      </button>

      <div v-else class="summary-footer-actions">
        <button class="btn btn-secondary" @click="summary = null" :disabled="submitting">
          Nhập Lại
        </button>
        <button
          class="btn btn-primary"
          @click="handleSubmitBulk"
          :disabled="summary.valid.length === 0 || submitting"
        >
          <span v-if="submitting">Đang thêm...</span>
          <span v-else>Thêm {{ summary.valid.length }} Kênh</span>
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AppModal from '@/components/ui/AppModal.vue';
import { channelService, AccessKeyRequiredError } from '@/services/channel-service';
import { Channel, BulkResolveSummary } from '@/types/channel';

const props = defineProps<{
  modelValue: boolean;
  existingChannels: Channel[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'bulkAdded'): void;
  (e: 'access-key-required', retryAction: () => Promise<any>, errorMsg?: string): void;
}>();

const rawInput = ref('');
const resolving = ref(false);
const progressCurrent = ref(0);
const progressTotal = ref(0);
const summary = ref<BulkResolveSummary | null>(null);
const submitting = ref(false);

const inputLinesCount = computed(() => {
  return rawInput.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0).length;
});

const progressPercent = computed(() => {
  if (progressTotal.value === 0) return 0;
  return Math.round((progressCurrent.value / progressTotal.value) * 100);
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      reset();
    }
  }
);

function reset() {
  rawInput.value = '';
  resolving.value = false;
  progressCurrent.value = 0;
  progressTotal.value = 0;
  summary.value = null;
  submitting.value = false;
}

function close() {
  emit('update:modelValue', false);
}

async function handleCheck() {
  const lines = rawInput.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return;

  resolving.value = true;
  progressCurrent.value = 0;
  progressTotal.value = lines.length;

  try {
    const res = await channelService.bulkResolveChannels(
      lines,
      props.existingChannels,
      (current, total) => {
        progressCurrent.value = current;
        progressTotal.value = total;
      }
    );
    summary.value = res;
  } finally {
    resolving.value = false;
  }
}

async function handleSubmitBulk() {
  if (!summary.value || summary.value.valid.length === 0) return;
  submitting.value = true;

  try {
    for (const item of summary.value.valid) {
      if (item.resolved) {
        await channelService.createChannel({
          youtubeChannelId: item.resolved.youtubeChannelId,
          name: item.resolved.name,
          handle: item.resolved.handle,
          url: item.resolved.url,
          avatarUrl: item.resolved.avatarUrl,
          scanLimit: 15,
          alertVphThreshold: 5000,
        });
      }
    }
    emit('bulkAdded');
    close();
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.name === 'AccessKeyRequiredError') {
      emit('access-key-required', () => handleSubmitBulk(), err.message);
      throw err;
    }
    alert(`Lỗi khi thêm kênh: ${err.message}`);
    throw err;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.bulk-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
  display: block;
}

.textarea-help {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.progress-box {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
}

.progress-bar-bg {
  height: 6px;
  background-color: var(--bg-surface-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--accent);
  transition: width 0.2s ease;
}

.summary-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-badge {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.summary-valid {
  background-color: var(--status-active-bg);
  color: var(--status-active);
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.summary-duplicate {
  background-color: var(--status-paused-bg);
  color: var(--status-paused);
  border: 1px solid rgba(234, 179, 8, 0.25);
}

.summary-error {
  background-color: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.preview-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.valid-channels-preview {
  margin-top: 14px;
}

.valid-items-list {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background-color: var(--bg-surface-elevated);
}

.valid-item-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
}
.valid-item-row:last-child {
  border-bottom: none;
}

.item-name {
  font-weight: 500;
  color: var(--text-primary);
}

.item-handle {
  color: var(--text-muted);
  font-size: 12px;
}

.error-items-box {
  margin-top: 14px;
}

.error-title {
  color: var(--danger);
}

.error-list {
  list-style: none;
  font-size: 12px;
  color: var(--text-secondary);
  max-height: 100px;
  overflow-y: auto;
}
.error-list li {
  margin-bottom: 4px;
}

.summary-footer-actions {
  display: flex;
  gap: 10px;
}
</style>
