<template>
  <div class="table-controls">
    <!-- Top row: Search & Action Buttons -->
    <div class="controls-top">
      <div class="search-box">
        <AppIcon name="search" size="16" class="search-icon" />
        <input
          type="text"
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          placeholder="Tìm theo tên hoặc @tênkênh..."
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

      <div class="action-buttons">
        <button class="btn btn-secondary" @click="$emit('openBulkAdd')">
          <AppIcon name="list-plus" size="16" />
          <span>Thêm Nhiều Kênh</span>
        </button>
        <button class="btn btn-primary" @click="$emit('openAddSingle')">
          <AppIcon name="plus" size="16" />
          <span>+ Thêm Kênh</span>
        </button>
      </div>
    </div>

    <!-- Bottom row: Filter tabs & Sort Dropdown -->
    <div class="controls-bottom">
      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ 'tab-btn-active': currentFilter === tab.value }"
          @click="$emit('update:currentFilter', tab.value as ('all' | ChannelStatus))"
        >
          {{ tab.label }}
          <span class="tab-count">({{ tab.count }})</span>
        </button>
      </div>

      <div class="sort-selector">
        <span class="sort-label">Sắp xếp:</span>
        <select
          :value="currentSort"
          @change="$emit('update:currentSort', ($event.target as HTMLSelectElement).value as ('newest' | 'name' | 'last_scan'))"
          class="form-select sort-select"
        >
          <option value="newest">Mới thêm</option>
          <option value="name">Tên kênh</option>
          <option value="last_scan">Cập nhật gần nhất</option>
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
  (e: 'openAddSingle'): void;
  (e: 'openBulkAdd'): void;
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
  flex: 1;
  min-width: 260px;
  max-width: 480px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  padding-left: 36px;
  padding-right: 32px;
  font-size: 13px;
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
}
.clear-search-btn:hover {
  color: var(--text-primary);
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
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

.filter-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-elevated);
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
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.sort-select {
  padding: 6px 12px;
  font-size: 12px;
  width: auto;
}

@media (max-width: 640px) {
  .controls-top {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    max-width: 100%;
  }
  .action-buttons {
    justify-content: stretch;
  }
  .action-buttons .btn {
    flex: 1;
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
