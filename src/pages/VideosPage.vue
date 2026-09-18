<template>
  <div class="growth-videos-workspace">
    <!-- 1. Header Section -->
    <PageHeader
      kicker="GROWTH SIGNAL RADAR"
      title="Video Đang Tăng"
      description="Theo dõi các video đang ghi nhận tốc độ tăng trưởng đáng chú ý theo VPH và lượt xem mới nhất."
    >
      <template #actions>
        <button
          type="button"
          class="btn-refresh"
          :disabled="loading"
          @click="loadData"
          title="Tải lại dữ liệu mới nhất từ hệ thống"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang quét...' : 'Làm Mới' }}</span>
        </button>
      </template>
    </PageHeader>

    <!-- 2. Error State -->
    <ErrorState
      v-if="error"
      title="Không thể tải Video Đang Tăng"
      :message="error"
      @retry="loadData"
    />

    <!-- 3. Summary Strip -->
    <GrowthSummaryStrip
      v-if="!error"
      :stats="stats"
      :loading="loading"
    />

    <!-- 4. Filter Bar & View Mode Switcher -->
    <div v-if="!error" class="workspace-filter-section">
      <FilterBar
        v-model:search="searchInput"
        search-placeholder="Tìm tiêu đề video hoặc tên kênh..."
        :total-count="videos.length"
        :filtered-count="filteredAndSortedVideos.length"
        :has-active-filters="hasActiveFilters"
        @clear="resetFilters"
      >
        <template #filters>
          <!-- Status Filter -->
          <div class="control-select-wrap">
            <select
              v-model="currentFilter"
              class="filter-select"
              aria-label="Lọc trạng thái"
            >
              <option value="all">Tất cả video ({{ videos.length }})</option>
              <option value="rising">Đang tăng (VPH > 0)</option>
              <option value="alerted">Đã cảnh báo</option>
              <option value="unalerted">Chưa cảnh báo</option>
            </select>
          </div>

          <!-- Channel Filter -->
          <div class="control-select-wrap">
            <select
              v-model="selectedChannelId"
              class="filter-select"
              aria-label="Lọc theo kênh"
            >
              <option value="all">Tất cả kênh ({{ channelOptions.length }})</option>
              <option
                v-for="ch in channelOptions"
                :key="ch.id"
                :value="ch.id"
              >
                {{ ch.name }}
              </option>
            </select>
          </div>

          <!-- Sort Filter -->
          <div class="control-select-wrap">
            <select
              v-model="currentSort"
              class="filter-select"
              aria-label="Sắp xếp"
            >
              <option value="vph_desc">VPH cao nhất</option>
              <option value="delta_desc">Tăng gần nhất (Delta)</option>
              <option value="views_desc">Lượt xem nhiều nhất</option>
              <option value="published_desc">Mới đăng nhất</option>
            </select>
          </div>
        </template>

        <template #actions>
          <ViewModeSwitcher
            v-model="currentViewMode"
            :modes="viewModes"
            storage-key="bbdt_growth_videos_view_mode"
          />
        </template>
      </FilterBar>
    </div>

    <!-- 5. Main Content Area -->
    <main v-if="!error" class="workspace-main-content">
      <!-- Loading Skeletons -->
      <div v-if="loading && videos.length === 0" class="skeleton-container">
        <div class="skeleton-hero-card">
          <div class="skeleton-thumb"></div>
          <div class="skeleton-info">
            <div class="skeleton-line line-1"></div>
            <div class="skeleton-line line-2"></div>
            <div class="skeleton-line line-3"></div>
          </div>
        </div>
      </div>

      <!-- Empty / No Data State -->
      <EmptyState
        v-else-if="videos.length === 0"
        title="Chưa có video đang tăng"
        description="Hệ thống chưa ghi nhận video nào có VPH tăng trong điều kiện hiện tại."
        action-text="Xem Video Mới Đăng"
        action-url="/video-moi-dang"
      />

      <!-- No Filter Results State -->
      <EmptyState
        v-else-if="filteredAndSortedVideos.length === 0"
        title="Không tìm thấy video phù hợp"
        description="Không có video nào khớp với từ khóa tìm kiếm hoặc điều kiện lọc hiện tại."
        action-text="Xóa Bộ Lọc"
        @action="resetFilters"
      />

      <!-- View Modes -->
      <template v-else>
        <!-- 1. Radar Mode (Default Hero + Lanes + Stream) -->
        <div v-if="currentViewMode === 'radar'" class="view-radar-mode">
          <!-- Top Signal Hero -->
          <GrowthRadarHero
            v-if="featuredVideo"
            :video="featuredVideo"
            :is-vph-selection="currentSort === 'vph_desc'"
            :is-adding-to-production="addingVideoId === featuredVideo.id"
            @add-production="handleAddToProduction"
          />

          <!-- Radar Lanes -->
          <GrowthRadarLanes
            :videos="videos"
            :active-filter="currentFilter"
            @select-filter="onSelectLaneFilter"
          />

          <!-- Candidate Stream -->
          <GrowthRadarCandidateStream
            :candidates="streamCandidates"
            :active-id="featuredVideo?.id"
            :is-adding-to-production="addingVideoId !== null"
            @select-featured="onSelectFeaturedVideo"
            @add-production="handleAddToProduction"
          />
        </div>

        <!-- 2. Large Grid Mode -->
        <div v-else-if="currentViewMode === 'large-grid'" class="view-large-grid">
          <GrowthLargeCard
            v-for="v in filteredAndSortedVideos"
            :key="v.id"
            :video="v"
            :is-adding-to-production="addingVideoId === v.id"
            @add-production="handleAddToProduction"
          />
        </div>

        <!-- 3. List Mode -->
        <div v-else-if="currentViewMode === 'list'" class="view-list-rows">
          <GrowthListRow
            v-for="v in filteredAndSortedVideos"
            :key="v.id"
            :video="v"
            :is-adding-to-production="addingVideoId === v.id"
            @add-production="handleAddToProduction"
          />
        </div>

        <!-- 4. Table Mode -->
        <div v-else-if="currentViewMode === 'table'" class="view-table-mode">
          <GrowthTableView
            :videos="filteredAndSortedVideos"
            :is-adding-to-production="addingVideoId !== null"
            @add-production="handleAddToProduction"
          />
        </div>

        <!-- 5. Compact Mode -->
        <div v-else-if="currentViewMode === 'compact'" class="view-compact-mode">
          <GrowthCompactGrid
            :videos="filteredAndSortedVideos"
            :is-adding-to-production="addingVideoId !== null"
            @add-production="handleAddToProduction"
          />
        </div>
      </template>
    </main>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast-notification">
      {{ toastMessage }}
    </div>

    <!-- AccessKey Modal -->
    <AccessKeyPromptModal
      v-model="showAccessKeyModal"
      :initial-error="accessKeyError"
      @confirmed="onAccessKeyConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import FilterBar from '@/components/ui/FilterBar.vue';
import ViewModeSwitcher, { ViewModeItem } from '@/components/ui/ViewModeSwitcher.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';

import GrowthSummaryStrip from '@/components/growth/GrowthSummaryStrip.vue';
import GrowthRadarHero from '@/components/growth/GrowthRadarHero.vue';
import GrowthRadarLanes from '@/components/growth/GrowthRadarLanes.vue';
import GrowthRadarCandidateStream from '@/components/growth/GrowthRadarCandidateStream.vue';
import GrowthLargeCard from '@/components/growth/GrowthLargeCard.vue';
import GrowthListRow from '@/components/growth/GrowthListRow.vue';
import GrowthTableView from '@/components/growth/GrowthTableView.vue';
import GrowthCompactGrid from '@/components/growth/GrowthCompactGrid.vue';

import { videoService } from '@/services/video-service';
import { productionService, AccessKeyRequiredError } from '@/services/production-service';
import { getStoredAccessKey, setStoredAccessKey } from '@/services/channel-service';
import type {
  VideoListItem,
  VideoSortOption,
  VideoFilterOption,
  VideoStatsSummary,
} from '@/types/video';

// View Modes Definition
const viewModes: ViewModeItem[] = [
  { id: 'radar', label: 'Radar', icon: 'zap' },
  { id: 'large-grid', label: 'Lưới lớn', icon: 'grid' },
  { id: 'list', label: 'Danh sách', icon: 'list' },
  { id: 'table', label: 'Bảng', icon: 'table' },
  { id: 'compact', label: 'Compact', icon: 'columns' },
];

const currentViewMode = ref<string>('radar');

// State
const videos = ref<VideoListItem[]>([]);
const stats = ref<VideoStatsSummary>({
  totalVideos: 0,
  risingVideos: 0,
  maxVph: null,
  totalDelta: null,
  alertedVideos: 0,
});
const loading = ref(false);
const error = ref<string | null>(null);

// Local Featured selection
const selectedFeaturedVideo = ref<VideoListItem | null>(null);

// Toast & Production State
const toastMessage = ref<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;
const addingVideoId = ref<string | null>(null);
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
const pendingVideoToAdd = ref<VideoListItem | null>(null);

function showToast(msg: string) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
}

// Add to production
async function handleAddToProduction(v: VideoListItem) {
  const key = getStoredAccessKey();
  if (!key) {
    pendingVideoToAdd.value = v;
    accessKeyError.value = null;
    showAccessKeyModal.value = true;
    return;
  }

  addingVideoId.value = v.id;
  try {
    await productionService.createProductionItem(
      {
        sourceVideoId: v.id,
        workingTitle: v.title,
      },
      key
    );
    showToast(`Đã đưa "${v.title.slice(0, 32)}..." vào Tiến Độ Sản Xuất!`);
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError) {
      pendingVideoToAdd.value = v;
      accessKeyError.value = err.message;
      showAccessKeyModal.value = true;
    } else if (err?.message?.includes('đã có trong quy trình') || err?.message?.includes('409')) {
      showToast('Video này đã có trong Tiến Độ Sản Xuất!');
    } else {
      alert(err.message || 'Không thể đưa vào Tiến Độ Sản Xuất.');
    }
  } finally {
    addingVideoId.value = null;
  }
}

async function onAccessKeyConfirmed(key: string) {
  setStoredAccessKey(key);
  showAccessKeyModal.value = false;
  if (pendingVideoToAdd.value) {
    const v = pendingVideoToAdd.value;
    pendingVideoToAdd.value = null;
    await handleAddToProduction(v);
  }
}

// Controls State & Debounce
const searchInput = ref('');
const debouncedSearch = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const currentFilter = ref<VideoFilterOption>('all');
const selectedChannelId = ref('all');
const currentSort = ref<VideoSortOption>('vph_desc');

watch(searchInput, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = newVal;
  }, 180);
});

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (toastTimer) clearTimeout(toastTimer);
});

// Channel Options
const channelOptions = computed(() => {
  const map = new Map<string, string>();
  for (const v of videos.value) {
    if (v.channel.id && !map.has(v.channel.id)) {
      map.set(v.channel.id, v.channel.name);
    }
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
});

const hasActiveFilters = computed(() => {
  return (
    selectedChannelId.value !== 'all' ||
    currentFilter.value !== 'all' ||
    currentSort.value !== 'vph_desc' ||
    debouncedSearch.value.trim().length > 0
  );
});

// Filter & Sort Pipeline
const filteredAndSortedVideos = computed(() => {
  const filtered = videoService.filterVideos(
    videos.value,
    currentFilter.value,
    selectedChannelId.value,
    debouncedSearch.value
  );
  return videoService.sortVideos(filtered, currentSort.value);
});

// Featured Hero Video selection
const featuredVideo = computed(() => {
  if (selectedFeaturedVideo.value && filteredAndSortedVideos.value.some(v => v.id === selectedFeaturedVideo.value?.id)) {
    return selectedFeaturedVideo.value;
  }
  return filteredAndSortedVideos.value[0] || null;
});

// Stream candidates (all except current featured)
const streamCandidates = computed(() => {
  if (!featuredVideo.value) return [];
  return filteredAndSortedVideos.value.filter(v => v.id !== featuredVideo.value?.id);
});

function onSelectFeaturedVideo(v: VideoListItem) {
  selectedFeaturedVideo.value = v;
}

function onSelectLaneFilter(filterId: string) {
  if (currentFilter.value === filterId) {
    currentFilter.value = 'all';
  } else {
    currentFilter.value = filterId as VideoFilterOption;
  }
}

function resetFilters() {
  searchInput.value = '';
  debouncedSearch.value = '';
  currentFilter.value = 'all';
  selectedChannelId.value = 'all';
  currentSort.value = 'vph_desc';
  selectedFeaturedVideo.value = null;
}

// Data loading
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    const res = await videoService.fetchTrendingVideos();
    videos.value = res.videos;
    stats.value = res.stats;
  } catch (err: any) {
    error.value = err.message || 'Không thể tải danh sách video. Vui lòng thử lại sau.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.growth-videos-workspace {
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-hero-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  padding: 20px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  background: linear-gradient(90deg, #EEF4F8 25%, #E2E8F0 50%, #EEF4F8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  border-radius: 4px;
  background: #E2E8F0;
}

.line-1 { width: 50%; height: 16px; }
.line-2 { width: 85%; height: 24px; }
.line-3 { width: 100%; height: 80px; }

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

.view-list-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-table-mode {
  width: 100%;
}

.view-compact-mode {
  width: 100%;
}

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 10px;
  background: #0F172A;
  color: #FFFFFF;
  font-size: 13.5px;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: toastIn 0.2s ease;
}

@keyframes toastIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 1024px) {
  .view-large-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .workspace-filter-section {
    position: static;
  }
}
</style>
