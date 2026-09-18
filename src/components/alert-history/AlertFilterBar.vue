<template>
  <div class="alert-filter-bar">
    <!-- Deep-link video active banner -->
    <div v-if="filter.videoId" class="deep-link-banner">
      <div class="banner-left">
        <AppIcon name="video" size="14" />
        <span>Đang lọc theo video cụ thể: <code class="mono">{{ filter.videoId }}</code></span>
      </div>
      <button type="button" class="btn-clear-deep-link" @click="$emit('clear-video-filter')">
        Xem tất cả video
      </button>
    </div>

    <!-- Status Tabs / Pills -->
    <div class="status-tabs-row" role="tablist" aria-label="Lọc trạng thái cảnh báo">
      <button
        v-for="st in statusOptions"
        :key="st.id"
        type="button"
        role="tab"
        :aria-selected="filter.status === st.id"
        class="status-tab-btn"
        :class="{ 'is-active': filter.status === st.id }"
        @click="updateStatus(st.id)"
      >
        <span>{{ st.label }}</span>
        <span v-if="st.count !== undefined" class="tab-count mono">{{ st.count }}</span>
      </button>

      <!-- Quick Stuck Toggle -->
      <button
        v-if="stuckCount > 0"
        type="button"
        class="stuck-toggle-btn"
        :class="{ 'is-active': filter.stuckOnly }"
        @click="toggleStuckOnly"
        title="Lọc các cảnh báo sending > 15 phút chưa cập nhật"
      >
        <AppIcon name="alert" size="12" />
        <span>Đang gửi lâu ({{ stuckCount }})</span>
      </button>
    </div>

    <!-- Filters Row -->
    <div class="filter-controls-grid">
      <!-- 1. Range Select -->
      <div class="control-group">
        <label class="control-label" for="alert-range-select">Khoảng thời gian tạo</label>
        <select
          id="alert-range-select"
          :value="filter.range"
          class="control-select"
          @change="onRangeChange($event)"
        >
          <option value="24h">24 giờ qua</option>
          <option value="7d">7 ngày qua</option>
          <option value="30d">30 ngày qua</option>
          <option value="all">Tất cả thời gian</option>
        </select>
      </div>

      <!-- 2. Channel Select -->
      <div class="control-group">
        <label class="control-label" for="alert-channel-select">Kênh đối thủ</label>
        <select
          id="alert-channel-select"
          :value="filter.channelId ?? ''"
          class="control-select"
          @change="onChannelChange($event)"
        >
          <option value="">Tất cả kênh ({{ channels.length }})</option>
          <option v-for="ch in channels" :key="ch.id" :value="ch.id">
            {{ ch.name }}
          </option>
        </select>
      </div>

      <!-- 3. Sort Select -->
      <div class="control-group">
        <label class="control-label" for="alert-sort-select">Sắp xếp theo</label>
        <select
          id="alert-sort-select"
          :value="sort"
          class="control-select"
          @change="onSortChange($event)"
        >
          <option value="newest">Mới nhất trước</option>
          <option value="vph_desc">VPH cao nhất</option>
          <option value="views_desc">Lượt xem cao nhất</option>
          <option value="attempts_desc">Nhiều lần thử nhất</option>
        </select>
      </div>

      <!-- 4. Search Input (Debounced) -->
      <div class="control-group search-group">
        <label class="control-label" for="alert-search-input">Tìm kiếm</label>
        <div class="search-input-wrap">
          <AppIcon name="search" size="14" iconClass="search-icon" />
          <input
            id="alert-search-input"
            v-model="searchInput"
            type="text"
            class="control-input"
            placeholder="Tìm theo tên video, kênh, handle..."
            @input="handleSearchInput"
          />
          <button
            v-if="searchInput"
            type="button"
            class="btn-clear-search"
            aria-label="Xóa từ khóa"
            @click="clearSearch"
          >
            <AppIcon name="x" size="12" />
          </button>
        </div>
      </div>

      <!-- Quick Reset Button -->
      <div class="control-group action-group" v-if="hasActiveFilter">
        <button type="button" class="btn-reset-filters" @click="$emit('reset-filters')">
          <AppIcon name="rotate-ccw" size="12" />
          <span>Đặt lại</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type {
  AlertStatus,
  TimeFilterRange,
  AlertHistorySort,
  AlertHistoryFilter,
} from '@/types/alert-history';

const props = defineProps<{
  filter: AlertHistoryFilter;
  sort: AlertHistorySort;
  channels: { id: string; name: string }[];
  stuckCount: number;
  statusCounts: {
    all: number;
    sent: number;
    pending: number;
    sending: number;
    failed: number;
  };
}>();

const emit = defineEmits<{
  (e: 'update:filter', filter: AlertHistoryFilter): void;
  (e: 'update:sort', sort: AlertHistorySort): void;
  (e: 'clear-video-filter'): void;
  (e: 'reset-filters'): void;
}>();

const searchInput = ref(props.filter.search);
let searchDebounceTimer: any = null;

watch(
  () => props.filter.search,
  newVal => {
    if (newVal !== searchInput.value) {
      searchInput.value = newVal;
    }
  }
);

onBeforeUnmount(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
});

function handleSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    emit('update:filter', { ...props.filter, search: searchInput.value });
  }, 200);
}

function clearSearch() {
  searchInput.value = '';
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  emit('update:filter', { ...props.filter, search: '' });
}

const statusOptions = computed(() => [
  { id: 'all' as const, label: 'Tất cả', count: props.statusCounts.all },
  { id: 'sent' as const, label: 'Đã cảnh báo', count: props.statusCounts.sent },
  { id: 'pending' as const, label: 'Chờ gửi', count: props.statusCounts.pending },
  { id: 'sending' as const, label: 'Đang gửi', count: props.statusCounts.sending },
  { id: 'failed' as const, label: 'Gửi lỗi', count: props.statusCounts.failed },
]);

function updateStatus(status: AlertStatus | 'all') {
  emit('update:filter', { ...props.filter, status });
}

function toggleStuckOnly() {
  emit('update:filter', { ...props.filter, stuckOnly: !props.filter.stuckOnly });
}

function onRangeChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value as TimeFilterRange;
  emit('update:filter', { ...props.filter, range: val });
}

function onChannelChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value;
  emit('update:filter', { ...props.filter, channelId: val ? val : null });
}

function onSortChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value as AlertHistorySort;
  emit('update:sort', val);
}

const hasActiveFilter = computed(() => {
  return (
    props.filter.status !== 'all' ||
    props.filter.range !== '30d' ||
    props.filter.channelId !== null ||
    props.filter.videoId !== null ||
    props.filter.stuckOnly === true ||
    props.filter.search.trim().length > 0
  );
});
</script>

<style scoped>
.alert-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

.deep-link-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid rgba(2, 132, 199, 0.25);
  border-radius: 8px;
  font-size: 12.5px;
  color: #0369a1;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.btn-clear-deep-link {
  padding: 3px 10px;
  background: #ffffff;
  border: 1px solid #0284c7;
  border-radius: 6px;
  color: #0284c7;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-clear-deep-link:hover {
  background: #0284c7;
  color: #ffffff;
}

.status-tabs-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
}

.status-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.status-tab-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.status-tab-btn.is-active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.tab-count {
  font-size: 11px;
  opacity: 0.85;
  background: rgba(0, 0, 0, 0.08);
  padding: 1px 5px;
  border-radius: 4px;
}

.status-tab-btn.is-active .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.stuck-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #ea580c;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.15s ease;
}

.stuck-toggle-btn:hover {
  background: rgba(249, 115, 22, 0.15);
}

.stuck-toggle-btn.is-active {
  background: #ea580c;
  color: #ffffff;
  border-color: #ea580c;
}

.filter-controls-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;
  gap: 12px;
  align-items: flex-end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.control-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.control-select,
.control-input {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s;
}

.control-select:focus,
.control-input:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

:deep(.search-icon) {
  position: absolute;
  left: 10px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input-wrap .control-input {
  padding-left: 32px;
  padding-right: 28px;
}

.btn-clear-search {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
}

.btn-clear-search:hover {
  color: #475569;
}

.btn-reset-filters {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
}

.btn-reset-filters:hover {
  background: #f1f5f9;
  color: #0f172a;
}

@media (max-width: 1024px) {
  .filter-controls-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stuck-toggle-btn {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .filter-controls-grid {
    grid-template-columns: 1fr;
  }
}
</style>
