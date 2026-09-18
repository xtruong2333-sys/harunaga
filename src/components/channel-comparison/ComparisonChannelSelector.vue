<template>
  <div class="comparison-channel-selector card">
    <div class="selector-header">
      <div class="header-left">
        <div class="header-title-row">
          <AppIcon name="bar-chart-2" :size="18" class="text-primary" />
          <h2 class="header-title">Kênh Đối Chiếu ({{ selectedChannels.length }}/4)</h2>
        </div>
        <p class="header-guide" :class="{ 'text-warning': selectedChannels.length < 2 }">
          {{ guideText }}
        </p>
      </div>

      <div class="time-window-selector">
        <span class="window-label">Khoảng thời gian video được đăng:</span>
        <div class="window-pills">
          <button
            v-for="opt in timeWindowOptions"
            :key="opt.value"
            type="button"
            class="pill-btn"
            :class="{ 'is-active': timeWindow === opt.value }"
            @click="$emit('update:timeWindow', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 4 Comparison Slots -->
    <div class="slots-grid">
      <div
        v-for="slotIdx in 4"
        :key="slotIdx"
        class="slot-wrapper"
      >
        <!-- Slot Divider / VS Badge (for slots 2, 3, 4 when previous slot has channel) -->
        <span
          v-if="slotIdx > 1 && slotIdx <= selectedChannels.length"
          class="vs-badge"
        >
          VS
        </span>

        <!-- Filled Slot -->
        <div
          v-if="slotIdx <= selectedChannels.length"
          class="channel-slot filled-slot"
          :style="{ '--slot-accent': getChannelColor(slotIdx - 1) }"
        >
          <div class="slot-accent-bar"></div>
          <div class="slot-body">
            <div class="slot-avatar-wrap">
              <img
                v-if="selectedChannels[slotIdx - 1].avatarUrl && !avatarErrors[selectedChannels[slotIdx - 1].id]"
                :src="selectedChannels[slotIdx - 1].avatarUrl!"
                :alt="selectedChannels[slotIdx - 1].name"
                class="slot-avatar"
                @error="avatarErrors[selectedChannels[slotIdx - 1].id] = true"
              />
              <div v-else class="slot-avatar-fallback">
                {{ getInitial(selectedChannels[slotIdx - 1].name) }}
              </div>
            </div>

            <div class="slot-info">
              <div class="slot-name" :title="selectedChannels[slotIdx - 1].name">
                {{ selectedChannels[slotIdx - 1].name }}
              </div>
              <div class="slot-meta">
                <span v-if="selectedChannels[slotIdx - 1].handle" class="slot-handle">
                  {{ selectedChannels[slotIdx - 1].handle }}
                </span>
                <span
                  class="badge-status"
                  :class="`status-${selectedChannels[slotIdx - 1].status}`"
                >
                  {{ getStatusLabel(selectedChannels[slotIdx - 1].status) }}
                </span>
              </div>
            </div>

            <button
              type="button"
              class="slot-remove-btn"
              @click="$emit('remove', selectedChannels[slotIdx - 1].id)"
              title="Bỏ kênh khỏi đối chiếu"
              aria-label="Xóa kênh"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Empty / Add Slot -->
        <div
          v-else
          class="channel-slot empty-slot"
          :class="{ 'is-disabled': selectedChannels.length >= 4 }"
          @click="openPicker"
        >
          <div class="empty-content">
            <div class="plus-icon-wrap">
              <AppIcon name="plus" :size="18" />
            </div>
            <span class="empty-text">
              {{ slotIdx === 2 && selectedChannels.length === 1 ? '+ Chọn kênh đối chiếu' : '+ Thêm kênh' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Channel Search Picker Modal -->
    <AppModal
      :model-value="showPickerModal"
      title="Thêm Kênh Vào Bàn Đối Chiếu"
      description="Chọn từ danh sách đối thủ đang theo dõi để đặt vào bàn phân tích (tối đa 4 kênh)."
      @update:model-value="showPickerModal = $event"
    >
      <div class="picker-modal-content">
        <div class="search-input-wrap">
          <AppIcon name="search" :size="16" class="search-icon" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm theo tên kênh hoặc @handle..."
            class="picker-input"
            @input="handleSearchInput"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="clear-input-btn"
            @click="clearSearch"
          >
            ✕
          </button>
        </div>

        <div class="picker-list">
          <div
            v-for="ch in filteredAvailableChannels"
            :key="ch.id"
            class="picker-channel-item"
            @click="selectChannel(ch.id)"
          >
            <div class="picker-item-avatar-wrap">
              <img
                v-if="ch.avatarUrl && !avatarErrors[ch.id]"
                :src="ch.avatarUrl"
                :alt="ch.name"
                class="picker-item-avatar"
                @error="avatarErrors[ch.id] = true"
              />
              <div v-else class="picker-item-avatar-fallback">
                {{ getInitial(ch.name) }}
              </div>
            </div>

            <div class="picker-item-info">
              <div class="picker-item-name">{{ ch.name }}</div>
              <div class="picker-item-meta">
                <span v-if="ch.handle" class="picker-item-handle">{{ ch.handle }}</span>
                <span class="badge-status" :class="`status-${ch.status}`">
                  {{ getStatusLabel(ch.status) }}
                </span>
              </div>
            </div>

            <button type="button" class="btn btn-sm btn-primary add-btn">
              + Thêm
            </button>
          </div>

          <div v-if="filteredAvailableChannels.length === 0" class="picker-empty">
            <p v-if="searchQuery.trim()">Không tìm thấy kênh phù hợp với "{{ searchQuery }}".</p>
            <p v-else-if="availableChannels.length === 0">Tất cả các kênh khả dụng đã được chọn.</p>
            <p v-else>Không có kênh nào khả dụng.</p>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick, reactive } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppModal from '@/components/ui/AppModal.vue';
import type { ComparableChannelOption, ComparisonTimeWindow } from '@/types/channel-comparison';
import { COMPARISON_PALETTE, TIME_WINDOW_LABELS } from '@/types/channel-comparison';

const props = defineProps<{
  selectedChannels: ComparableChannelOption[];
  availableChannels: ComparableChannelOption[];
  timeWindow: ComparisonTimeWindow;
}>();

const emit = defineEmits<{
  (e: 'add', channelId: string): void;
  (e: 'remove', channelId: string): void;
  (e: 'update:timeWindow', val: ComparisonTimeWindow): void;
}>();

const avatarErrors = reactive<Record<string, boolean>>({});

const timeWindowOptions = (Object.keys(TIME_WINDOW_LABELS) as ComparisonTimeWindow[]).map(key => ({
  value: key,
  label: TIME_WINDOW_LABELS[key],
}));

const guideText = computed(() => {
  const count = props.selectedChannels.length;
  if (count === 0) return 'Chọn ít nhất 2 kênh để bắt đầu đối chiếu.';
  if (count === 1) return 'Hãy chọn thêm 1 kênh để bắt đầu so sánh đối đầu.';
  if (count >= 4) return 'Đã đạt giới hạn tối đa 4 kênh đối chiếu.';
  return `Đang so sánh ${count} kênh. Bạn có thể thêm ${4 - count} kênh nữa.`;
});

function getChannelColor(idx: number): string {
  return COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length];
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'K';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Đang theo dõi';
    case 'paused': return 'Tạm dừng';
    case 'archived': return 'Đã lưu trữ';
    default: return status;
  }
}

// Picker Modal & Debounce Search
const showPickerModal = ref(false);
const searchQuery = ref('');
const debouncedQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function handleSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = searchQuery.value.trim().toLowerCase();
  }, 200); // 200ms debounce
}

function clearSearch() {
  searchQuery.value = '';
  debouncedQuery.value = '';
}

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
});

function openPicker() {
  if (props.selectedChannels.length >= 4) return;
  searchQuery.value = '';
  debouncedQuery.value = '';
  showPickerModal.value = true;
  nextTick(() => {
    searchInputRef.value?.focus();
  });
}

function selectChannel(id: string) {
  emit('add', id);
  showPickerModal.value = false;
}

const filteredAvailableChannels = computed(() => {
  const selectedSet = new Set(props.selectedChannels.map(c => c.id));
  const unselected = props.availableChannels.filter(c => !selectedSet.has(c.id));

  if (!debouncedQuery.value) {
    return unselected.slice(0, 15);
  }

  return unselected.filter(c => {
    const q = debouncedQuery.value;
    const nameMatch = c.name.toLowerCase().includes(q);
    const handleMatch = c.handle ? c.handle.toLowerCase().includes(q) : false;
    return nameMatch || handleMatch;
  }).slice(0, 15);
});
</script>

<style scoped>
.comparison-channel-selector {
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.selector-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.header-guide {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.text-warning {
  color: #d97706;
  font-weight: 600;
}

.time-window-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.window-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.window-pills {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.pill-btn {
  border: none;
  background: transparent;
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-btn:hover {
  color: #0f172a;
}

.pill-btn.is-active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Slots Grid */
.slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  align-items: stretch;
}

.slot-wrapper {
  position: relative;
  display: flex;
}

.vs-badge {
  position: absolute;
  left: -18px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 6px;
  border-radius: 6px;
  pointer-events: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.channel-slot {
  flex: 1;
  min-height: 84px;
  border-radius: 10px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
}

.filled-slot {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.filled-slot:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
}

.slot-accent-bar {
  width: 5px;
  background: var(--slot-accent, #38bdf8);
}

.slot-body {
  flex: 1;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.slot-avatar-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #e2e8f0;
}

.slot-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slot-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #334155;
  font-weight: 700;
  font-size: 1rem;
}

.slot-info {
  flex: 1;
  min-width: 0;
}

.slot-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}

.slot-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
}

.slot-handle {
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-status {
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
  white-space: nowrap;
}

.status-active {
  background: #ecfdf5;
  color: #059669;
}

.status-paused {
  background: #fffbeb;
  color: #d97706;
}

.status-archived {
  background: #f1f5f9;
  color: #64748b;
}

.slot-remove-btn {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 0.85rem;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.slot-remove-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Empty Slot */
.empty-slot {
  background: #ffffff;
  border: 2px dashed #cbd5e1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-slot:not(.is-disabled):hover {
  border-color: #2563eb;
  background: #f8faff;
  transform: translateY(-2px);
}

.empty-slot.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
}

.plus-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

/* Picker Modal Styles */
.picker-modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.picker-input {
  width: 100%;
  padding: 10px 36px 10px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
}

.picker-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.clear-input-btn {
  position: absolute;
  right: 10px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
}

.picker-list {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-channel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.picker-channel-item:hover {
  background: #f8fafc;
  border-color: #2563eb;
}

.picker-item-avatar-wrap {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #e2e8f0;
}

.picker-item-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picker-item-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: #475569;
}

.picker-item-info {
  flex: 1;
  min-width: 0;
}

.picker-item-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
}

.picker-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.picker-item-handle {
  color: #64748b;
}

.add-btn {
  flex-shrink: 0;
}

.picker-empty {
  padding: 24px 12px;
  text-align: center;
  color: #64748b;
  font-size: 0.88rem;
}

@media (max-width: 1024px) {
  .slots-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .slots-grid {
    grid-template-columns: 1fr;
  }
  .vs-badge {
    display: none;
  }
}
</style>