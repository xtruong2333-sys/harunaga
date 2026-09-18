<template>
  <div class="table-controls">
    <!-- Top row: Search Bar -->
    <div class="controls-top">
      <div class="search-box">
        <AppIcon name="search" size="16" class="search-icon" />
        <input
          type="text"
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          placeholder="Tìm kiếm kênh theo tên hoặc @handle..."
          class="form-input search-input"
        />
        <button
          v-if="searchQuery"
          class="clear-search-btn"
          @click="$emit('update:searchQuery', '')"
          title="Xóa tìm kiếm"
          aria-label="Xóa tìm kiếm"
        >
          <AppIcon name="x" size="14" />
        </button>
      </div>
    </div>

    <!-- Bottom row: Filter tabs & Sort Dropdown -->
    <div class="controls-bottom">
      <div class="filter-tabs-track">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          class="tab-pill"
          :class="{ 'tab-pill-active': currentFilter === tab.value }"
          @click="$emit('update:currentFilter', tab.value as ('all' | ChannelStatus))"
        >
          <span class="pill-label">{{ tab.label }}</span>
          <span class="pill-count">{{ tab.count }}</span>
        </button>
      </div>

      <div class="sort-selector-group">
        <span class="sort-label">Sắp xếp:</span>
        <select
          :value="currentSort"
          @change="$emit('update:currentSort', ($event.target as HTMLSelectElement).value as ('newest' | 'name' | 'last_scan'))"
          class="form-select sort-select"
        >
          <option value="newest">Mới thêm gần nhất</option>
          <option value="name">Tên kênh (A-Z)</option>
          <option value="last_scan">Lần quét gần nhất</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { ChannelStatus } from '@/types/channel';

const props = defineProps<{
  searchQuery: string;
  currentFilter: 'all' | ChannelStatus;
  currentSort: 'newest' | 'name' | 'last_scan';
  counts: {
    all: number;
    active: number;
    paused: number;
    archived: number;
  };
}>();

defineEmits<{
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:currentFilter', value: 'all' | ChannelStatus): void;
  (e: 'update:currentSort', value: 'newest' | 'name' | 'last_scan'): void;
}>();

const filterTabs = computed(() => [
  { value: 'all', label: 'Tất cả', count: props.counts.all },
  { value: 'active', label: 'Đang theo dõi', count: props.counts.active },
  { value: 'paused', label: 'Tạm dừng', count: props.counts.paused },
  { value: 'archived', label: 'Đã lưu trữ', count: props.counts.archived },
]);
</script>

<style scoped>
.table-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.controls-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  width: 100%;
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
  width: 100%;
  padding-left: 38px;
  padding-right: 36px;
  height: 40px;
  font-size: 13px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  transition: all 0.15s ease;
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
  outline: none;
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
}

.clear-search-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-elevated);
}

.controls-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 12px;
  flex-wrap: wrap;
}

.filter-tabs-track {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding: 2px;
}

.tab-pill {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tab-pill:hover {
  color: var(--text-primary);
  border-color: var(--border-strong, var(--border-subtle));
  background-color: var(--bg-surface-hover);
}

.tab-pill-active {
  color: var(--accent);
  background-color: var(--accent-subtle);
  border-color: var(--accent);
  font-weight: 600;
}

.pill-count {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
  background-color: var(--bg-surface-elevated);
  color: var(--text-secondary);
}

.tab-pill-active .pill-count {
  background-color: var(--accent);
  color: #FFFFFF;
}

.sort-selector-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}

.sort-select {
  padding: 6px 12px;
  font-size: 12px;
  height: 34px;
  width: auto;
  border-radius: 6px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .controls-top {
    flex-direction: column;
    align-items: stretch;
  }
  .controls-bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .sort-selector-group {
    justify-content: flex-end;
  }
}
</style>
