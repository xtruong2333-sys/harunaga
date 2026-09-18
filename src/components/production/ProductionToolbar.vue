<template>
  <div class="production-toolbar">
    <!-- Row 1: Search, Priority, Sort, View Mode Switcher -->
    <div class="toolbar-primary-row">
      <!-- Search Input -->
      <div class="search-wrap">
        <AppIcon name="search" :size="16" class="search-icon" />
        <input
          :value="filterState.searchQuery"
          type="text"
          placeholder="Tìm tiêu đề, video nguồn hoặc kênh…"
          class="search-input"
          aria-label="Tìm kiếm nội dung sản xuất"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="filterState.searchQuery"
          type="button"
          class="clear-search-btn"
          aria-label="Xóa tìm kiếm"
          @click="$emit('update:searchQuery', '')"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </div>

      <!-- Filters & Actions -->
      <div class="toolbar-actions-cluster">
        <!-- Status Select (Dropdown for quick filter) -->
        <div class="filter-item">
          <label for="status-filter-select" class="sr-only">Trạng thái</label>
          <select
            id="status-filter-select"
            :value="filterState.status"
            class="select-control status-select"
            @change="$emit('update:status', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Priority Select -->
        <div class="filter-item">
          <label for="priority-filter-select" class="sr-only">Mức ưu tiên</label>
          <select
            id="priority-filter-select"
            :value="filterState.priority"
            class="select-control"
            @change="$emit('update:priority', ($event.target as HTMLSelectElement).value)"
          >
            <option value="all">Tất cả mức ưu tiên</option>
            <option value="high">Ưu tiên cao</option>
            <option value="normal">Bình thường</option>
            <option value="low">Ưu tiên thấp</option>
          </select>
        </div>

        <!-- Sort Select -->
        <div class="filter-item">
          <label for="sort-filter-select" class="sr-only">Sắp xếp</label>
          <select
            id="sort-filter-select"
            :value="filterState.sortBy"
            class="select-control"
            @change="$emit('update:sortBy', ($event.target as HTMLSelectElement).value)"
          >
            <option value="updated_desc">Mới cập nhật</option>
            <option value="created_desc">Mới thêm</option>
            <option value="priority_desc">Ưu tiên cao</option>
          </select>
        </div>

        <!-- View Mode Switcher -->
        <div class="view-mode-toggle" role="radiogroup" aria-label="Chế độ hiển thị">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: viewMode === 'board' }"
            role="radio"
            :aria-checked="viewMode === 'board'"
            title="Xem bảng quy trình"
            @click="$emit('update:viewMode', 'board')"
          >
            <AppIcon name="columns" :size="15" />
            <span class="toggle-text">Bảng quy trình</span>
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: viewMode === 'list' }"
            role="radio"
            :aria-checked="viewMode === 'list'"
            title="Xem danh sách"
            @click="$emit('update:viewMode', 'list')"
          >
            <AppIcon name="list" :size="15" />
            <span class="toggle-text">Danh sách</span>
          </button>
        </div>

        <!-- Reset Filters Button -->
        <button
          v-if="isFiltered"
          type="button"
          class="btn-reset-filters"
          title="Đặt lại các bộ lọc về mặc định"
          @click="$emit('reset')"
        >
          <AppIcon name="rotate-ccw" :size="13" />
          <span>Đặt lại bộ lọc</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type {
  ProductionFilterState,
  ProductionStatus,
  ProductionViewMode,
} from '@/types/production';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  filterState: ProductionFilterState;
  viewMode: ProductionViewMode;
  nonArchivedCount: number;
  statusCounts: Record<ProductionStatus, number>;
}>();

defineEmits<{
  (e: 'update:searchQuery', val: string): void;
  (e: 'update:status', val: string): void;
  (e: 'update:priority', val: string): void;
  (e: 'update:sortBy', val: string): void;
  (e: 'update:viewMode', val: ProductionViewMode): void;
  (e: 'reset'): void;
}>();

const isFiltered = computed(() => {
  return (
    props.filterState.status !== 'all' ||
    props.filterState.priority !== 'all' ||
    props.filterState.searchQuery.trim().length > 0 ||
    props.filterState.sortBy !== 'updated_desc'
  );
});

const statusOptions = computed(() => [
  { value: 'all', label: `Tất cả quy trình (${props.nonArchivedCount})` },
  { value: 'idea', label: `Ý tưởng (${props.statusCounts.idea || 0})` },
  { value: 'research', label: `Đang nghiên cứu (${props.statusCounts.research || 0})` },
  { value: 'script', label: `Đang viết nội dung (${props.statusCounts.script || 0})` },
  { value: 'thumbnail', label: `Đang làm thumbnail (${props.statusCounts.thumbnail || 0})` },
  { value: 'production', label: `Đang sản xuất (${props.statusCounts.production || 0})` },
  { value: 'editing', label: `Đang chỉnh sửa (${props.statusCounts.editing || 0})` },
  { value: 'published', label: `Đã xuất bản (${props.statusCounts.published || 0})` },
  { value: 'archived', label: `Đã lưu trữ (${props.statusCounts.archived || 0})` },
]);
</script>

<style scoped>
.production-toolbar {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 22px;
  box-shadow: 0 1px 3px rgba(15, 31, 53, 0.03);
}

.toolbar-primary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 260px;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-tertiary, #94a3b8);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 34px 9px 36px;
  font-size: 0.875rem;
  color: var(--text-primary, #0f1f35);
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 9px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  background: var(--surface, #ffffff);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #94a3b8);
  border-radius: 50%;
  cursor: pointer;
}

.clear-search-btn:hover {
  color: var(--text-primary, #0f1f35);
}

.toolbar-actions-cluster {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
}

.select-control {
  padding: 8px 30px 8px 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary, #0f1f35);
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.select-control:focus {
  border-color: #2563eb;
}

.view-mode-toggle {
  display: inline-flex;
  align-items: center;
  background: var(--bg-inset, #f1f5f9);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--border, #e2e8f0);
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary, #64748b);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.toggle-btn.active {
  background: var(--surface, #ffffff);
  color: #2563eb;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(15, 31, 53, 0.08);
}

.btn-reset-filters {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  font-size: 0.8125rem;
  color: var(--text-secondary, #64748b);
  background: transparent;
  border: 1px dashed var(--border, #cbd5e1);
  border-radius: 7px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.btn-reset-filters:hover {
  color: #dc2626;
  border-color: #dc2626;
}

@media (max-width: 768px) {
  .toolbar-primary-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrap {
    flex: 1 1 100%;
  }

  .toolbar-actions-cluster {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
