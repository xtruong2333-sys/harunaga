<template>
  <div class="command-filter-deck">
    <!-- Top Row: Search, Channel Filter & Refresh Button -->
    <div class="deck-top-row">
      <div class="search-channel-group">
        <!-- Search Input -->
        <div class="deck-search-box">
          <AppIcon name="search" size="15" class="search-icon" />
          <input
            type="text"
            :value="searchQuery"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            placeholder="Tìm theo tiêu đề video hoặc tên kênh..."
            class="deck-input search-input"
          />
          <button
            v-if="searchQuery"
            class="clear-btn"
            @click="$emit('update:searchQuery', '')"
            title="Xóa tìm kiếm"
          >
            ✕
          </button>
        </div>

        <!-- Channel Select -->
        <div class="deck-select-wrap channel-select-wrap">
          <select
            :value="selectedChannelId"
            @change="$emit('update:selectedChannelId', ($event.target as HTMLSelectElement).value)"
            class="deck-select"
          >
            <option value="all">Tất cả kênh ({{ channels.length }})</option>
            <option v-for="c in channels" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Action Refresh -->
      <div class="deck-actions">
        <button
          class="btn-deck-refresh"
          :disabled="loading"
          @click="$emit('refresh')"
          title="Tải lại dữ liệu mới nhất từ hệ thống"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </div>
    </div>

    <!-- Bottom Row: Filter Tabs & Sort -->
    <div class="deck-bottom-row">
      <!-- Segmented Filter Pills -->
      <div class="filter-pills" role="tablist">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          role="tab"
          :aria-selected="currentFilter === tab.value"
          class="pill-btn"
          :class="{ 'pill-active': currentFilter === tab.value }"
          @click="$emit('update:currentFilter', tab.value as VideoFilterOption)"
        >
          <span class="pill-dot" v-if="currentFilter === tab.value" />
          <span class="pill-label">{{ tab.label }}</span>
          <span class="pill-count">({{ tab.count }})</span>
        </button>
      </div>

      <!-- Sort Selector -->
      <div class="sort-control">
        <span class="sort-prefix">Sắp xếp:</span>
        <select
          :value="currentSort"
          @change="$emit('update:currentSort', ($event.target as HTMLSelectElement).value as VideoSortOption)"
          class="deck-select sort-select"
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
.command-filter-deck {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-strong);
  border-bottom: 1px solid var(--border-strong);
  border-left: 1px solid var(--border-line);
  border-right: 1px solid var(--border-line);
  border-radius: 6px;
  padding: 14px 18px;
  margin-bottom: 20px;
  box-shadow: var(--card-shadow);
}

.deck-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.search-channel-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 280px;
}

.deck-search-box {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.deck-input {
  width: 100%;
  padding: 9px 34px 9px 36px;
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.18s ease;
}

.deck-input:focus {
  border-color: var(--accent);
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 6px;
}

.clear-btn:hover {
  color: var(--text-primary);
}

.channel-select-wrap {
  min-width: 180px;
}

.deck-select {
  width: 100%;
  padding: 9px 12px;
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.deck-select:focus {
  border-color: var(--accent);
}

.btn-deck-refresh {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  background: var(--accent-subtle);
  border: 1px solid var(--border-strong);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-deck-refresh:hover:not(:disabled) {
  background: var(--accent-subtle);
  border-color: var(--accent);
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.deck-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid var(--border-line);
}

.filter-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-inset);
  padding: 3px;
  border-radius: 9px;
  border: 1px solid var(--border-subtle);
  overflow-x: auto;
}

.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
}

.pill-btn:hover {
  color: var(--text-primary);
  background: var(--bg-surface-hover);
}

.pill-active {
  color: var(--accent) !important;
  background: var(--accent-subtle) !important;
  border: 1px solid var(--border-strong);
  font-weight: 600;
}

.pill-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
}

.pill-count {
  font-size: 11px;
  opacity: 0.8;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-prefix {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.sort-select {
  padding: 6px 10px;
  font-size: 12px;
  min-width: 140px;
}

@media (max-width: 768px) {
  .deck-top-row,
  .search-channel-group,
  .deck-bottom-row {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-control {
    justify-content: flex-end;
  }
}
</style>
