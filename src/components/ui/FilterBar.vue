<template>
  <div class="filter-bar surface-card">
    <div class="filter-bar-main">
      <!-- Search Box -->
      <div v-if="showSearch" class="search-box">
        <AppIcon name="search" size="15" class="search-icon" />
        <input
          type="text"
          class="search-input"
          :value="search"
          :placeholder="searchPlaceholder || 'Tìm kiếm...'"
          @input="onSearchInput"
        />
        <button
          v-if="search"
          type="button"
          class="clear-search-btn"
          aria-label="Xóa tìm kiếm"
          @click="clearSearch"
        >
          <AppIcon name="x" size="13" />
        </button>
      </div>

      <!-- Filters Slot -->
      <div class="filter-controls">
        <slot name="filters" />
      </div>
    </div>

    <!-- Actions & Stats Row / Section -->
    <div class="filter-bar-aside">
      <div v-if="hasActiveFilters" class="clear-filters-wrap">
        <button
          type="button"
          class="btn-clear-filters"
          @click="$emit('clear')"
        >
          <AppIcon name="rotate-ccw" size="12" />
          <span>Đặt lại lọc</span>
        </button>
      </div>

      <div v-if="totalCount !== undefined" class="results-count">
        <span class="count-val mono">{{ filteredCount !== undefined ? filteredCount : totalCount }}</span>
        <span v-if="filteredCount !== undefined && filteredCount !== totalCount" class="count-total">
          / {{ totalCount }}
        </span>
        <span class="count-label">kết quả</span>
      </div>

      <div class="filter-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

withDefaults(
  defineProps<{
    search?: string;
    searchPlaceholder?: string;
    showSearch?: boolean;
    totalCount?: number;
    filteredCount?: number;
    hasActiveFilters?: boolean;
  }>(),
  {
    search: '',
    searchPlaceholder: 'Tìm kiếm...',
    showSearch: true,
    hasActiveFilters: false,
  }
);

const emit = defineEmits<{
  (e: 'update:search', query: string): void;
  (e: 'clear'): void;
}>();

function onSearchInput(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:search', target.value);
}

function clearSearch() {
  emit('update:search', '');
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  box-shadow: var(--shadow-sm, 0 4px 14px rgba(30, 60, 90, 0.05));
  flex-wrap: wrap;
}

.filter-bar-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 260px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 220px;
  flex: 1;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 11px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 7px 32px 7px 34px;
  border-radius: 8px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--bg-inset, #F8FAFC);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: all 0.15s ease;
}

.search-input:focus {
  border-color: var(--primary, #2563EB);
  background: var(--surface, #FFFFFF);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 50%;
}

.clear-search-btn:hover {
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.06);
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-bar-aside {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-clear-filters {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--border, #E3EBF3);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-clear-filters:hover {
  color: var(--danger, #EF4444);
  border-color: rgba(239, 68, 68, 0.25);
  background: var(--danger-soft, #FEF2F2);
}

.results-count {
  font-size: 12.5px;
  color: var(--text-muted);
  white-space: nowrap;
}

.count-val {
  font-weight: 700;
  color: var(--text-primary);
}

.count-total {
  color: var(--text-muted);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    max-width: none;
  }
  .filter-bar-aside {
    justify-content: space-between;
  }
}
</style>
