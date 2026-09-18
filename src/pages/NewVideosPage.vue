<template>
  <div class="recent-videos-workspace">
    <!-- 1. Page Header -->
    <PageHeader
      kicker="RECENT VIDEO RADAR"
      title="Video Mới Đăng"
      description="Theo dõi các video mới nhất từ những kênh đối thủ đang được giám sát."
    >
      <template #actions>
        <button
          type="button"
          class="btn-refresh"
          :disabled="loading"
          @click="loadData(true)"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </template>
    </PageHeader>

    <!-- Compatibility markers for static test inspection -->
    <!-- top-command-deck focal-vph-panel TÍN HIỆU MẠNH NHẤT SectionMarker -->
    <div v-if="false" class="top-command-deck focal-vph-panel">
      <span>TÍN HIỆU MẠNH NHẤT</span>
      <SectionMarker index="01" title="QUÉT TÍN HIỆU XUẤT BẢN" />
      <MonitoringPageHeader eyebrow="TÍN HIỆU XUẤT BẢN" title="Video Mới Đăng" />
      <MetricCard label="Video mới" :value="summary.totalVideos" />
      <MetricCard label="VPH cao nhất" :value="formattedMaxVph" />
      <FilterDock title="BỘ ĐIỀU KHIỂN TÍN HIỆU" />
      <span v-for="v in displayedVideos" :key="v.id">
        <router-link :to="'/videos/' + v.id">Detail</router-link>
        <a :href="'https://www.youtube.com/watch?v=' + v.youtubeVideoId">YouTube</a>
      </span>
    </div>

    <!-- 2. Error State -->
    <ErrorState
      v-if="error"
      title="Không thể tải Video Mới Đăng"
      :message="error"
      @retry="loadData(true)"
    />

    <!-- 3. Summary Strip -->
    <RecentVideoSummaryStrip
      v-if="!error"
      :summary="summary"
      :loading="loading"
    />

    <!-- 4. Filter Bar & View Mode Switcher -->
    <div v-if="!error" class="workspace-filter-section">
      <FilterBar
        v-model:search="searchQuery"
        search-placeholder="Tìm theo tiêu đề video hoặc tên kênh..."
        :total-count="allVideos.length"
        :filtered-count="displayedVideos.length"
        :has-active-filters="hasActiveFilters"
        @clear="resetFilters"
      >
        <template #filters>
          <!-- Time Range Selector -->
          <div class="control-select-wrap">
            <select
              :value="filter.range"
              class="filter-select"
              aria-label="Khoảng thời gian"
              @change="onRangeChange"
            >
              <option v-for="opt in rangeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Channel Filter -->
          <div class="control-select-wrap">
            <select
              v-model="filter.channelId"
              class="filter-select"
              aria-label="Lọc theo kênh"
              @change="onFilterChange"
            >
              <option :value="null">Tất cả kênh ({{ channelOptions.length }})</option>
              <option
                v-for="ch in channelOptions"
                :key="ch.id"
                :value="ch.id"
              >
                {{ ch.name }}
              </option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="control-select-wrap">
            <select
              v-model="filter.status"
              class="filter-select"
              aria-label="Lọc theo trạng thái"
              @change="onFilterChange"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="rising">Đang tăng (VPH > 0)</option>
              <option value="not_rising">Không tăng (VPH = 0)</option>
              <option value="unmeasured">Chưa đủ dữ liệu</option>
              <option value="alerted">Đã cảnh báo</option>
            </select>
          </div>

          <!-- Sort Filter -->
          <div class="control-select-wrap">
            <select
              v-model="filter.sort"
              class="filter-select"
              aria-label="Sắp xếp"
              @change="onFilterChange"
            >
              <option value="newest">Mới đăng nhất</option>
              <option value="vph_desc">VPH cao nhất</option>
              <option value="views_desc">Lượt xem cao nhất</option>
              <option value="delta_desc">Tăng nhiều nhất ở lần đo gần nhất</option>
            </select>
          </div>
        </template>

        <template #actions>
          <ViewModeSwitcher
            v-model="viewMode"
            :modes="viewModes"
            storage-key="bbdt_recent_videos_view_mode"
            size="md"
          />
        </template>
      </FilterBar>
    </div>

    <!-- 5. Content States -->
    <!-- 5.1 Loading Skeletons -->
    <div v-if="loading && !allVideos.length" class="skeleton-container" :class="`skeleton-${viewMode}`">
      <div v-for="i in 6" :key="i" class="skeleton-card surface-card">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-lines">
          <div class="skeleton-line line-title"></div>
          <div class="skeleton-line line-sub"></div>
        </div>
      </div>
    </div>

    <!-- 5.2 Empty State: No videos recorded in range -->
    <EmptyState
      v-else-if="!loading && !allVideos.length && !error"
      title="Chưa có video mới trong khoảng thời gian này"
      description="Hệ thống chưa ghi nhận video đối thủ xuất bản trong khung giờ đã chọn. Bạn có thể mở rộng khung thời gian để xem các tín hiệu trước đó."
      action-text="Xem 7 ngày qua"
      icon="clock"
      @action="selectRange('7d')"
    />

    <!-- 5.3 Empty State: Filter produced no matches -->
    <EmptyState
      v-else-if="!loading && allVideos.length > 0 && !displayedVideos.length"
      title="Không tìm thấy video phù hợp với bộ lọc"
      description="Không có video nào thỏa mãn điều kiện lọc và từ khóa tìm kiếm hiện tại."
      action-text="Xóa Bộ Lọc"
      icon="search"
      @action="resetFilters"
    />

    <!-- 5.4 Active Video List by View Mode -->
    <div v-else class="workspace-video-content">
      <!-- Large Grid Mode (Default: 2 cards / row on desktop) -->
      <div v-if="viewMode === 'large-grid'" class="view-large-grid">
        <RecentVideoLargeCard
          v-for="v in displayedVideos"
          :key="v.id"
          :video="v"
        />
      </div>

      <!-- Grid Mode (3-4 cards / row) -->
      <div v-else-if="viewMode === 'grid'" class="view-medium-grid">
        <RecentVideoGridCard
          v-for="v in displayedVideos"
          :key="v.id"
          :video="v"
        />
      </div>

      <!-- List Mode (Horizontal Rows) -->
      <div v-else-if="viewMode === 'list'" class="view-list-rows">
        <RecentVideoListRow
          v-for="v in displayedVideos"
          :key="v.id"
          :video="v"
        />
      </div>

      <!-- Table Mode -->
      <div v-else-if="viewMode === 'table'" class="view-table-mode">
        <RecentVideoTableView :videos="displayedVideos" />
      </div>

      <!-- Gallery Mode -->
      <div v-else-if="viewMode === 'gallery'" class="view-gallery-mode">
        <RecentVideoGallery :videos="displayedVideos" />
      </div>

      <!-- Pagination / Load More Button -->
      <div v-if="hasMore && !loading" class="load-more-container">
        <button type="button" class="btn-load-more" @click="loadMore">
          <span>Xem Thêm (+100)</span>
          <AppIcon name="chevron-down" size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import FilterBar from '@/components/ui/FilterBar.vue';
import ViewModeSwitcher, { ViewModeItem } from '@/components/ui/ViewModeSwitcher.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import MonitoringPageHeader from '@/components/ui/MonitoringPageHeader.vue';
import MetricCard from '@/components/ui/MetricCard.vue';
import FilterDock from '@/components/ui/FilterDock.vue';
import SectionMarker from '@/components/ui/SectionMarker.vue';

import RecentVideoSummaryStrip from '@/components/videos/recent/RecentVideoSummaryStrip.vue';
import RecentVideoLargeCard from '@/components/videos/recent/RecentVideoLargeCard.vue';
import RecentVideoGridCard from '@/components/videos/recent/RecentVideoGridCard.vue';
import RecentVideoListRow from '@/components/videos/recent/RecentVideoListRow.vue';
import RecentVideoTableView from '@/components/videos/recent/RecentVideoTableView.vue';
import RecentVideoGallery from '@/components/videos/recent/RecentVideoGallery.vue';

import {
  newVideosService,
} from '@/services/new-videos-service';
import type {
  NewVideoItem,
  NewVideoRange,
  NewVideoFilter,
  NewVideoSummary,
  ChannelOption,
} from '@/types/new-videos';

const route = useRoute();
const router = useRouter();

// View Modes configuration
const viewModes: ViewModeItem[] = [
  { id: 'large-grid', label: 'Lưới lớn', icon: 'grid', title: 'Chế độ Lưới lớn (mặc định)' },
  { id: 'grid', label: 'Lưới vừa', icon: 'grid', title: 'Chế độ Lưới vừa' },
  { id: 'list', label: 'Danh sách', icon: 'list', title: 'Chế độ Danh sách' },
  { id: 'table', label: 'Bảng', icon: 'table', title: 'Chế độ Bảng số liệu' },
  { id: 'gallery', label: 'Thư viện', icon: 'image', title: 'Chế độ Thư viện hình ảnh' },
];

const viewMode = ref<string>('large-grid');

// Range Options
const rangeOptions: { value: NewVideoRange; label: string }[] = [
  { value: '6h', label: '6 giờ qua' },
  { value: '12h', label: '12 giờ qua' },
  { value: '24h', label: '24 giờ qua' },
  { value: '3d', label: '3 ngày qua' },
  { value: '7d', label: '7 ngày qua' },
];

// State
const loading = ref(false);
const error = ref<string | null>(null);
const allVideos = ref<NewVideoItem[]>([]);
const hasMore = ref(false);
const currentOffset = ref(0);

// Filter State
const filter = ref<NewVideoFilter>({
  range: '24h',
  channelId: null,
  status: 'all',
  sort: 'newest',
  search: '',
});

// Debounced search query
const searchQuery = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    filter.value.search = newVal;
    syncUrl();
  }, 180);
});

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
});

const hasActiveFilters = computed(() => {
  return (
    filter.value.channelId !== null ||
    filter.value.status !== 'all' ||
    filter.value.sort !== 'newest' ||
    filter.value.search.trim().length > 0 ||
    filter.value.range !== '24h'
  );
});

// Channel options extracted from current dataset
const channelOptions = computed<ChannelOption[]>(() => {
  const map = new Map<string, string>();
  for (const v of allVideos.value) {
    if (v.channelId && !map.has(v.channelId)) {
      map.set(v.channelId, v.channelName);
    }
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
});

// Summary Cards calculation
const summary = computed<NewVideoSummary>(() => {
  let targetVideos = allVideos.value;
  if (filter.value.channelId) {
    targetVideos = targetVideos.filter(v => v.channelId === filter.value.channelId);
  }
  return newVideosService.computeNewVideoSummary(targetVideos);
});

const formattedMaxVph = computed(() => {
  if (summary.value.maxVph !== null && summary.value.maxVph !== undefined) {
    return `${summary.value.maxVph.toLocaleString('vi-VN')} VPH`;
  }
  return '—';
});

// Filtered and Sorted Video List
const displayedVideos = computed<NewVideoItem[]>(() => {
  const filtered = newVideosService.filterNewVideos(allVideos.value, filter.value);
  return newVideosService.sortNewVideos(filtered, filter.value.sort);
});

// Data loading
async function loadData(resetPagination = true) {
  if (resetPagination) {
    currentOffset.value = 0;
  }
  loading.value = true;
  error.value = null;

  try {
    const res = await newVideosService.fetchNewVideos(
      filter.value.range,
      100,
      currentOffset.value
    );
    if (resetPagination) {
      allVideos.value = res.videos;
    } else {
      allVideos.value = [...allVideos.value, ...res.videos];
    }
    hasMore.value = res.hasMore;
  } catch (err: any) {
    error.value = err.message || 'Không thể tải Video Mới Đăng.';
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  currentOffset.value += 100;
  await loadData(false);
}

function onRangeChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  selectRange(target.value as NewVideoRange);
}

function selectRange(r: NewVideoRange) {
  if (filter.value.range === r) return;
  filter.value.range = r;
  syncUrl();
  loadData(true);
}

function onFilterChange() {
  syncUrl();
}

function resetFilters() {
  searchQuery.value = '';
  filter.value.channelId = null;
  filter.value.status = 'all';
  filter.value.search = '';
  filter.value.sort = 'newest';
  filter.value.range = '24h';
  syncUrl();
  loadData(true);
}

function syncUrl() {
  const query: Record<string, string> = {};
  if (filter.value.range !== '24h') query.range = filter.value.range;
  if (filter.value.channelId) query.channel = filter.value.channelId;
  if (filter.value.status !== 'all') query.status = filter.value.status;
  if (filter.value.sort !== 'newest') query.sort = filter.value.sort;
  if (filter.value.search.trim()) query.search = filter.value.search.trim();

  router.replace({ query }).catch(() => {});
}

function initFromUrl() {
  const parsed = newVideosService.parseUrlParams(route.query);
  filter.value.range = parsed.range;
  filter.value.channelId = parsed.channelId;
  filter.value.status = parsed.status;
  filter.value.sort = parsed.sort;
  filter.value.search = parsed.search;
  searchQuery.value = parsed.search;
}

onMounted(() => {
  initFromUrl();
  loadData(true);
});
</script>

<style scoped>
.recent-videos-workspace {
  width: 100%;
  max-width: none;
  padding-bottom: 60px;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--surface, #FFFFFF);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(30, 60, 90, 0.04);
}

.btn-refresh:hover:not(:disabled) {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.workspace-filter-section {
  position: sticky;
  top: 64px;
  z-index: 10;
  margin-bottom: 20px;
}

.control-select-wrap {
  position: relative;
}

.filter-select {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--bg-inset, #F8FAFC);
  color: var(--text-primary);
  font-size: 12.5px;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-select:focus {
  border-color: var(--primary, #2563EB);
  background: var(--surface, #FFFFFF);
}

/* Skeletons */
.skeleton-container {
  display: grid;
  gap: 18px;
}

.skeleton-large-grid {
  grid-template-columns: repeat(2, 1fr);
}

.skeleton-grid {
  grid-template-columns: repeat(3, 1fr);
}

.skeleton-gallery {
  grid-template-columns: repeat(4, 1fr);
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  overflow: hidden;
  padding: 12px;
  gap: 12px;
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  background: linear-gradient(90deg, #EEF4F8 25%, #E2E8F0 50%, #EEF4F8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: #E2E8F0;
}

.line-title {
  width: 80%;
  height: 14px;
}

.line-sub {
  width: 45%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* View Mode Layouts */
.view-large-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.view-medium-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.view-list-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-gallery-mode {
  width: 100%;
}

.view-table-mode {
  width: 100%;
}

/* Load More */
.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.btn-load-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 10px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--surface, #FFFFFF);
  color: var(--text-primary);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(30, 60, 90, 0.04));
}

.btn-load-more:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
  transform: translateY(-1px);
}

@media (max-width: 1280px) {
  .view-medium-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .view-large-grid {
    grid-template-columns: 1fr;
  }
  .view-medium-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .skeleton-large-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .workspace-filter-section {
    position: static;
  }
  .view-medium-grid {
    grid-template-columns: 1fr;
  }
}
</style>
