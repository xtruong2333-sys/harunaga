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
  gap: 12px;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
}

.filter-bar-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 260px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 240px;
  flex: 1;
  max-width: 420px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  min-height: 40px;
  padding: 8px 34px 8px 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-muted);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
}

.search-input:focus {
  border-color: #7EA5ED;
  background: var(--surface);
  box-shadow: 0 0 0 3px rgba(37,99,235,.10);
}

.clear-search-btn {
  position: absolute;
  right: 9px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 7px;
}

.clear-search-btn:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.filter-controls,
.filter-actions,
.filter-bar-aside {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-bar-aside {
  gap: 10px;
}

.btn-clear-filters {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 6px 10px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.btn-clear-filters:hover {
  color: #B42323;
  border-color: #E7B8B8;
  background: #FFF3F3;
}

.results-count {
  font-size: 12.5px;
  color: var(--text-muted);
  white-space: nowrap;
}

.count-val {
  font-weight: 750;
  color: var(--text-primary);
}

.count-total {
  color: var(--text-muted);
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
