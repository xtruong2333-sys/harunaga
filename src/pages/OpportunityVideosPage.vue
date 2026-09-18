<template>
  <div class="opportunity-intelligence-workspace">
    <!-- 1. Page Header -->
    <PageHeader
      kicker="OPPORTUNITY RADAR"
      title="Video Tiềm Năng"
      description="Phát hiện các video đang có tín hiệu tăng trưởng đáng chú ý từ mạng lưới đối thủ."
    >
      <template #actions>
        <button
          type="button"
          class="btn-refresh"
          :disabled="loading"
          @click="loadData"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </template>
    </PageHeader>

    <!-- 2. Error State Banner -->
    <ErrorState
      v-if="error"
      title="Không thể tải Video Tiềm Năng"
      :message="error"
      @retry="loadData"
    />

    <!-- 3. Summary Strip -->
    <OpportunitySummaryStrip
      v-if="!error"
      :stats="stats"
      :loading="loading"
    />

    <!-- 4. Filter Bar & View Mode Switcher -->
    <div v-if="!error" class="workspace-filter-section">
      <FilterBar
        v-model:search="searchInput"
        search-placeholder="Tìm theo tiêu đề video hoặc tên kênh..."
        :total-count="allVideos.length"
        :filtered-count="displayedVideos.length"
        :has-active-filters="hasActiveFilters"
        @clear="resetFilters"
      >
        <template #filters>
          <!-- Time Window Selector -->
          <div class="control-select-wrap">
            <select
              v-model="filters.timeWindow"
              class="filter-select"
              aria-label="Khoảng thời gian"
            >
              <option v-for="tw in timeWindows" :key="tw.id" :value="tw.id">
                {{ tw.label }}
              </option>
            </select>
          </div>

          <!-- Channel Filter -->
          <div class="control-select-wrap">
            <select
              v-model="filters.channelId"
              class="filter-select"
              aria-label="Lọc theo kênh"
            >
              <option value="all">Tất cả kênh ({{ uniqueChannels.length }})</option>
              <option
                v-for="ch in uniqueChannels"
                :key="ch.id"
                :value="ch.id"
              >
                {{ ch.name }}
              </option>
            </select>
          </div>

          <!-- Quick Filter Status -->
          <div class="control-select-wrap">
            <select
              v-model="filters.quickFilter"
              class="filter-select"
              aria-label="Lọc trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="over_threshold">Vượt ngưỡng kênh</option>
              <option value="alerted">Đã cảnh báo</option>
              <option value="unalerted">Chưa cảnh báo</option>
            </select>
          </div>

          <!-- Sort Filter -->
          <div class="control-select-wrap">
            <select
              v-model="filters.sortOption"
              class="filter-select"
              aria-label="Sắp xếp"
            >
              <option value="vph_desc">VPH cao nhất</option>
              <option value="delta_desc">Tăng view nhiều nhất</option>
              <option value="published_desc">Mới nhất</option>
              <option value="threshold_ratio_desc">% Ngưỡng cao nhất</option>
            </select>
          </div>
        </template>

        <template #actions>
          <ViewModeSwitcher
            v-model="viewMode"
            :modes="viewModes"
            storage-key="bbdt_potential_videos_view_mode"
            size="md"
          />
        </template>
      </FilterBar>
    </div>

    <!-- 5. Content States -->
    <!-- 5.1 Loading Skeletons -->
    <div v-if="loading && allVideos.length === 0" class="skeleton-container">
      <div class="skeleton-hero-card surface-card">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-info">
          <div class="skeleton-line line-1"></div>
          <div class="skeleton-line line-2"></div>
          <div class="skeleton-line line-3"></div>
        </div>
      </div>
    </div>

    <!-- 5.2 Empty State: No videos recorded -->
    <EmptyState
      v-else-if="!loading && allVideos.length === 0 && !error"
      title="Chưa có video tiềm năng"
      description="Hệ thống chưa ghi nhận video nào có tín hiệu tăng trưởng phù hợp với điều kiện hiện tại."
      action-text="Xem Video Mới Đăng"
      icon="clock"
      action-route="/video-moi-dang"
    />

    <!-- 5.3 Empty State: Filter produced no matches -->
    <EmptyState
      v-else-if="!loading && allVideos.length > 0 && displayedVideos.length === 0"
      title="Không tìm thấy ứng viên phù hợp"
      description="Không có video nào thỏa mãn điều kiện lọc và từ khóa tìm kiếm hiện tại."
      action-text="Xóa Bộ Lọc"
      icon="search"
      @action="resetFilters"
    />

    <!-- 5.4 Active Video Content by View Mode -->
    <div v-else class="workspace-views-content">
      <!-- Mode 1: Featured Opportunity (Default) -->
      <div v-if="viewMode === 'featured'" class="view-featured-mode">
        <!-- Top Featured Hero -->
        <OpportunityFeaturedHero
          v-if="activeFeaturedVideo"
          :video="activeFeaturedVideo"
          :is-adding-to-production="addingVideoId === activeFeaturedVideo.id"
          @add-production="handleAddToProduction"
        />

        <!-- Other Candidates Rail -->
        <OpportunityCandidateRail
          v-if="otherCandidates.length > 0"
          :candidates="otherCandidates"
          :active-id="activeFeaturedVideo?.id"
          @select="selectedFeaturedVideo = $event"
        />
      </div>

      <!-- Mode 2: Large Grid -->
      <div v-else-if="viewMode === 'large-grid'" class="view-large-grid">
        <OpportunityLargeCard
          v-for="v in displayedVideos"
          :key="v.id"
          :video="v"
          :is-adding-to-production="addingVideoId === v.id"
          @add-production="handleAddToProduction"
        />
      </div>

      <!-- Mode 3: List -->
      <div v-else-if="viewMode === 'list'" class="view-list-rows">
        <OpportunityListRow
          v-for="v in displayedVideos"
          :key="v.id"
          :video="v"
          :is-adding-to-production="addingVideoId === v.id"
          @add-production="handleAddToProduction"
        />
      </div>

      <!-- Mode 4: Table -->
      <div v-else-if="viewMode === 'table'" class="view-table-mode">
        <OpportunityTableView
          :videos="displayedVideos"
          :is-adding-to-production="!!addingVideoId"
          @add-production="handleAddToProduction"
        />
      </div>

      <!-- Mode 5: Compare -->
      <div v-else-if="viewMode === 'compare'" class="view-compare-mode">
        <OpportunityCompareView
          :all-candidates="displayedVideos"
          @add-production="handleAddToProduction"
        />
      </div>

      <!-- Mode 6: Chart -->
      <div v-else-if="viewMode === 'chart'" class="view-chart-mode">
        <OpportunityChartView :videos="displayedVideos" />
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast-notification">
      {{ toastMessage }}
    </div>

    <!-- Access Key Prompt Modal -->
    <AccessKeyPromptModal
      v-model="showAccessKeyModal"
      :initial-error="accessKeyError"
      @confirmed="onAccessKeyConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import FilterBar from '@/components/ui/FilterBar.vue';
import ViewModeSwitcher, { ViewModeItem } from '@/components/ui/ViewModeSwitcher.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';

import OpportunitySummaryStrip from '@/components/opportunity/OpportunitySummaryStrip.vue';
import OpportunityFeaturedHero from '@/components/opportunity/OpportunityFeaturedHero.vue';
import OpportunityCandidateRail from '@/components/opportunity/OpportunityCandidateRail.vue';
import OpportunityLargeCard from '@/components/opportunity/OpportunityLargeCard.vue';
import OpportunityListRow from '@/components/opportunity/OpportunityListRow.vue';
import OpportunityTableView from '@/components/opportunity/OpportunityTableView.vue';
import OpportunityCompareView from '@/components/opportunity/OpportunityCompareView.vue';
import OpportunityChartView from '@/components/opportunity/OpportunityChartView.vue';

import { opportunityService } from '@/services/opportunity-service';
import {
  productionService,
  setStoredAccessKey,
  getStoredAccessKey,
  AccessKeyRequiredError,
} from '@/services/production-service';
import {
  OpportunityVideo,
  OpportunityFilterState,
  OpportunityTimeWindow,
} from '@/types/opportunity';

// View Modes configuration (6 Modes)
const viewModes: ViewModeItem[] = [
  { id: 'featured', label: 'Nổi bật', icon: 'zap', title: 'Chế độ Nổi bật (mặc định)' },
  { id: 'large-grid', label: 'Lưới lớn', icon: 'grid', title: 'Chế độ Lưới lớn' },
  { id: 'list', label: 'Danh sách', icon: 'list', title: 'Chế độ Danh sách' },
  { id: 'table', label: 'Bảng', icon: 'table', title: 'Chế độ Bảng số liệu' },
  { id: 'compare', label: 'So sánh', icon: 'columns', title: 'Chế độ So sánh đa ứng viên' },
  { id: 'chart', label: 'Biểu đồ', icon: 'bar-chart', title: 'Chế độ Biểu đồ phân tích' },
];

const viewMode = ref<string>('featured');

// State
const loading = ref(false);
const error = ref<string | null>(null);
const allVideos = ref<OpportunityVideo[]>([]);
const selectedFeaturedVideo = ref<OpportunityVideo | null>(null);

// Production integration
const addingVideoId = ref<string | null>(null);
const pendingVideoToAdd = ref<OpportunityVideo | null>(null);
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
const toastMessage = ref<string | null>(null);
let toastTimer: any = null;

function showToast(msg: string) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
}

async function handleAddToProduction(v: OpportunityVideo) {
  if (!v || addingVideoId.value) return;

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

// Filter State
const searchInput = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const filters = reactive<OpportunityFilterState>({
  timeWindow: '7d',
  channelId: 'all',
  searchQuery: '',
  quickFilter: 'all',
  sortOption: 'vph_desc',
});

watch(searchInput, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    filters.searchQuery = newVal;
  }, 180);
});

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
});

// Time Window Options
const timeWindows: { id: OpportunityTimeWindow; label: string }[] = [
  { id: '24h', label: '24 giờ' },
  { id: '3d', label: '3 ngày' },
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: 'all', label: 'Tất cả' },
];

const hasActiveFilters = computed(() => {
  return (
    filters.channelId !== 'all' ||
    filters.quickFilter !== 'all' ||
    filters.sortOption !== 'vph_desc' ||
    filters.searchQuery.trim().length > 0 ||
    filters.timeWindow !== '7d'
  );
});

// Load Data
async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    allVideos.value = await opportunityService.fetchOpportunityVideos();
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải danh sách Video Tiềm Năng.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

// Unique Channels list for dropdown
const uniqueChannels = computed(() => {
  const map = new Map<string, { id: string; name: string }>();
  for (const v of allVideos.value) {
    if (!map.has(v.channel.id)) {
      map.set(v.channel.id, { id: v.channel.id, name: v.channel.name });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
});

// Filtered videos based on current filters
const filteredVideos = computed(() => {
  return opportunityService.filterOpportunityVideos(allVideos.value, filters);
});

// Sorted & Displayed videos
const displayedVideos = computed(() => {
  return opportunityService.sortOpportunityVideos(filteredVideos.value, filters.sortOption);
});

// Active Featured candidate
const activeFeaturedVideo = computed(() => {
  if (selectedFeaturedVideo.value && displayedVideos.value.some(v => v.id === selectedFeaturedVideo.value?.id)) {
    return selectedFeaturedVideo.value;
  }
  return displayedVideos.value[0] || null;
});

// Other Candidates for candidate rail
const otherCandidates = computed(() => {
  if (!activeFeaturedVideo.value) return [];
  return displayedVideos.value.filter(v => v.id !== activeFeaturedVideo.value?.id).slice(0, 6);
});

// Top stats calculated over the filtered set
const stats = computed(() => {
  return opportunityService.calculateOpportunityStats(filteredVideos.value);
});

function resetFilters() {
  filters.timeWindow = '7d';
  filters.channelId = 'all';
  searchInput.value = '';
  filters.searchQuery = '';
  filters.quickFilter = 'all';
  filters.sortOption = 'vph_desc';
  selectedFeaturedVideo.value = null;
}
</script>

<style scoped>
.opportunity-intelligence-workspace {
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

.view-compare-mode {
  width: 100%;
}

.view-chart-mode {
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
