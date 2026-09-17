<template>
  <div class="table-controls">
    <!-- Top row: Search, Channel filter & Refresh button -->
    <div class="controls-top">
      <div class="search-and-channel">
        <div class="search-box">
          <AppIcon name="search" size="16" class="search-icon" />
          <input
            type="text"
            :value="searchQuery"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            placeholder="Tìm theo tiêu đề video hoặc tên kênh..."
            class="form-input search-input"
          />
          <button
            v-if="searchQuery"
            class="clear-search-btn"
            @click="$emit('update:searchQuery', '')"
            title="Xóa tìm kiếm"
          >
            <AppIcon name="x" size="14" />
          </button>
        </div>

        <div class="channel-filter-box">
          <select
            :value="selectedChannelId"
            @change="$emit('update:selectedChannelId', ($event.target as HTMLSelectElement).value)"
            class="form-select channel-select"
          >
            <option value="all">Tất cả kênh</option>
            <option v-for="c in channels" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="action-buttons">
        <button
          class="btn btn-secondary"
          :disabled="loading"
          @click="$emit('refresh')"
          title="Tải lại dữ liệu mới nhất từ hệ thống"
        >
          <AppIcon name="refresh" size="16" :class="{ 'spin-icon': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </div>
    </div>

    <!-- Bottom row: Status filter tabs & Sort selector -->
    <div class="controls-bottom">
      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ 'tab-btn-active': currentFilter === tab.value }"
          @click="$emit('update:currentFilter', tab.value as VideoFilterOption)"
        >
          {{ tab.label }}
          <span class="tab-count">({{ tab.count }})</span>
        </button>
      </div>

      <div class="sort-selector">
        <span class="sort-label">Sắp xếp:</span>
        <select
          :value="currentSort"
          @change="$emit('update:currentSort', ($event.target as HTMLSelectElement).value as VideoSortOption)"
          class="form-select sort-select"
        >
          <option value="vph_desc">VPH cao nhất</option>
          <option value="views_desc">Lượt xem cao nhất</option>
          <option value="published_desc">Mới đăng nhất</option>
          <option value="delta_desc">Tăng nhiều nhất</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { VideoSortOption, VideoFilterOption } from '@/types/video';

const props = defineProps<{
  searchQuery: string;
  currentFilter: VideoFilterOption;
  selectedChannelId: string;
  currentSort: VideoSortOption;
  channels: { id: string; name: string }[];
  counts: {
    all: number;
    rising: number;
    alerted: number;
    unalerted: number;
  };
  loading: boolean;
}>();

defineEmits<{
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:currentFilter', value: VideoFilterOption): void;
  (e: 'update:selectedChannelId', value: string): void;
  (e: 'update:currentSort', value: VideoSortOption): void;
  (e: 'refresh'): void;
}>();

const filterTabs = computed(() => [
  { value: 'all', label: 'Tất cả', count: props.counts.all },
  { value: 'rising', label: 'Video đang tăng', count: props.counts.rising },
  { value: 'alerted', label: 'Đã cảnh báo', count: props.counts.alerted },
  { value: 'unalerted', label: 'Chưa cảnh báo', count: props.counts.unalerted },
]);
</script>

<style scoped>
.table-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.controls-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-and-channel {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 280px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  padding-left: 40px;
  padding-right: 36px;
  width: 100%;
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-hover);
}

.channel-filter-box {
  min-width: 170px;
}

.channel-select {
  width: 100%;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.controls-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-surface);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  overflow-x: auto;
}

.tab-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-hover);
}

.tab-btn-active {
  color: var(--accent);
  background-color: var(--accent-subtle);
  font-weight: 600;
}

.tab-count {
  font-size: 11px;
  opacity: 0.8;
}

.sort-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.sort-select {
  font-size: 13px;
  padding: 6px 12px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
}

@media (max-width: 768px) {
  .controls-top {
    flex-direction: column;
    align-items: stretch;
  }

  .search-and-channel {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .sort-selector {
    justify-content: flex-end;
  }
}
</style>
