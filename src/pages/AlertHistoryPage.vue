<template>
  <div class="alert-history-page">
    <!-- Page Header -->
    <PageHeader
      kicker="ALERT OPERATIONS & SIGNAL HISTORY"
      title="Lịch Sử Cảnh Báo"
      description="Theo dõi toàn bộ vòng đời cảnh báo VPH, trạng thái gửi, số lần thử và dữ liệu video tại thời điểm cảnh báo."
    >
      <template #actions>
        <button
          type="button"
          class="btn-refresh"
          :disabled="loading"
          @click="reload"
        >
          <AppIcon name="refresh-cw" :class="{ 'spin-icon': loading }" size="14" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </template>
    </PageHeader>

    <!-- Error State -->
    <ErrorState
      v-if="error"
      title="Không thể tải lịch sử cảnh báo"
      :message="error"
      action-text="Thử lại"
      @action="reload"
    />

    <template v-else>
      <!-- Summary Strip -->
      <AlertSummaryStrip
        :summary="summary"
        :loading="loading && allItems.length === 0"
        :has-active-filter="hasActiveFilter"
      />

      <!-- View Mode Switcher + Results Info -->
      <div class="view-mode-bar">
        <ViewModeSwitcher
          :model-value="currentViewMode"
          :modes="ALERT_VIEW_MODES"
          storage-key="bbdt_alert_history_view_mode"
          @update:model-value="onViewModeChange"
        />

        <div class="results-count mono" v-if="allItems.length > 0">
          <span v-if="currentViewMode === 'video'">
            {{ videoGroups.length }} video có cảnh báo
          </span>
          <span v-else>
            Hiển thị {{ displayed.length }} / {{ filtered.length }} cảnh báo
          </span>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <AlertFilterBar
        :filter="filter"
        :sort="sort"
        :channels="channels"
        :stuck-count="stuckCount"
        :status-counts="statusCounts"
        @update:filter="onFilterUpdate"
        @update:sort="onSortUpdate"
        @clear-video-filter="clearVideoFilter"
        @reset-filters="resetFilters"
      />

      <!-- Loading State (Initial) -->
      <div v-if="loading && allItems.length === 0" class="loading-state">
        <div v-for="i in 5" :key="i" class="skeleton-row"></div>
      </div>

      <!-- Empty State: No alerts at all -->
      <EmptyState
        v-else-if="!loading && allItems.length === 0"
        title="Chưa có cảnh báo nào được ghi nhận."
        description="Hệ thống chưa ghi nhận cảnh báo VPH nào. Cảnh báo được tự động tạo khi video vượt ngưỡng VPH đã thiết lập cho từng kênh."
      />

      <!-- Empty State: Filter matched nothing -->
      <EmptyState
        v-else-if="!loading && displayed.length === 0"
        :title="currentViewMode === 'failed' ? 'Không có cảnh báo gửi lỗi' : 'Không có cảnh báo phù hợp'"
        :description="currentViewMode === 'failed' ? 'Không có cảnh báo gửi lỗi trong phạm vi hiện tại.' : 'Không có cảnh báo phù hợp với bộ lọc hiện tại.'"
      >
        <template #actions>
          <button type="button" class="btn-clear-filters" @click="resetFilters">
            Xóa tất cả bộ lọc
          </button>
        </template>
      </EmptyState>

      <!-- View Modes -->
      <div v-else class="content-view-area">
        <!-- MODE 1: TIMELINE (Default) -->
        <AlertTimeline
          v-if="currentViewMode === 'timeline'"
          :items="displayed"
          @select-item="openModal"
        />

        <!-- MODE 2: TABLE -->
        <AlertTable
          v-else-if="currentViewMode === 'table'"
          :items="displayed"
          @select-item="openModal"
        />

        <!-- MODE 3: VIDEO -->
        <AlertVideoGroups
          v-else-if="currentViewMode === 'video'"
          :groups="videoGroups"
          @filter-by-video="filterByVideo"
        />

        <!-- MODE 4: FAILED -->
        <AlertFailedList
          v-else-if="currentViewMode === 'failed'"
          :items="displayed"
          @select-item="openModal"
        />
      </div>

      <!-- Load More (Pagination slice) -->
      <div
        v-if="hasMore && currentViewMode !== 'video' && !loading"
        class="load-more-container"
      >
        <button type="button" class="btn-load-more" @click="loadMore">
          Xem thêm (còn {{ remaining.toLocaleString('vi-VN') }} cảnh báo)
        </button>
      </div>
    </template>

    <!-- Detail Modal -->
    <AlertDetailModal
      :item="modalItem"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import ViewModeSwitcher from '@/components/ui/ViewModeSwitcher.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

import AlertSummaryStrip from '@/components/alert-history/AlertSummaryStrip.vue';
import AlertFilterBar from '@/components/alert-history/AlertFilterBar.vue';
import AlertTimeline from '@/components/alert-history/AlertTimeline.vue';
import AlertTable from '@/components/alert-history/AlertTable.vue';
import AlertVideoGroups from '@/components/alert-history/AlertVideoGroups.vue';
import AlertFailedList from '@/components/alert-history/AlertFailedList.vue';
import AlertDetailModal from '@/components/alert-history/AlertDetailModal.vue';

import { alertHistoryService } from '@/services/alert-history-service';
import { DatabaseNotConfiguredError } from '@/services/channel-service';
import {
  ALERT_VIEW_MODES,
  type AlertViewMode,
  type AlertHistoryItem,
  type AlertHistoryFilter,
  type AlertHistorySort,
  type AlertHistorySummary,
  type AlertVideoGroup,
} from '@/types/alert-history';

const STORAGE_VIEW_MODE_KEY = 'bbdt_alert_history_view_mode';
const STORAGE_STATUS_KEY = 'bbdt_alert_status_filter';
const STORAGE_RANGE_KEY = 'bbdt_alert_range_filter';
const STORAGE_CHANNEL_KEY = 'bbdt_alert_channel_filter';
const STORAGE_SORT_KEY = 'bbdt_alert_sort';

const route = useRoute();
const router = useRouter();

const allItems = ref<AlertHistoryItem[]>([]);
const displayLimit = ref(50);
const loading = ref(false);
const error = ref<string | null>(null);
const modalItem = ref<AlertHistoryItem | null>(null);

// View Mode
const currentViewMode = ref<AlertViewMode>('timeline');

// Sort & Filter
const sort = ref<AlertHistorySort>('newest');
const filter = ref<AlertHistoryFilter>({
  status: 'all',
  range: '30d',
  channelId: null,
  search: '',
  videoId: null,
  stuckOnly: false,
});

// Channels list derived from allItems
const channels = computed(() => {
  const map = new Map<string, { id: string; name: string }>();
  for (const item of allItems.value) {
    if (item.channelId && item.channelName && !map.has(item.channelId)) {
      map.set(item.channelId, { id: item.channelId, name: item.channelName });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
});

// Stuck count in all loaded alerts
const stuckCount = computed(() => {
  return allItems.value.filter(i => i.isSendingStuck).length;
});

// Status counts for tabs
const statusCounts = computed(() => {
  let sent = 0;
  let pending = 0;
  let sending = 0;
  let failed = 0;

  for (const item of allItems.value) {
    if (item.status === 'sent') sent++;
    else if (item.status === 'pending') pending++;
    else if (item.status === 'sending') sending++;
    else if (item.status === 'failed') failed++;
  }

  return {
    all: allItems.value.length,
    sent,
    pending,
    sending,
    failed,
  };
});

// Filtered items
const filtered = computed(() => {
  return alertHistoryService.filterAndSortAlerts(allItems.value, filter.value, sort.value);
});

// Display slice
const displayed = computed(() => {
  return filtered.value.slice(0, displayLimit.value);
});

const hasMore = computed(() => filtered.value.length > displayLimit.value);
const remaining = computed(() => Math.max(0, filtered.value.length - displayLimit.value));

// Summary: computed from filtered dataset (Section 6 recommendation)
const summary = computed<AlertHistorySummary>(() => {
  return alertHistoryService.computeAlertSummary(filtered.value);
});

// Video groups for video view mode
const videoGroups = computed<AlertVideoGroup[]>(() => {
  return alertHistoryService.groupAlertsByVideo(filtered.value);
});

const hasActiveFilter = computed(() => {
  return (
    filter.value.status !== 'all' ||
    filter.value.range !== '30d' ||
    filter.value.channelId !== null ||
    filter.value.videoId !== null ||
    filter.value.stuckOnly === true ||
    filter.value.search.trim().length > 0
  );
});

onMounted(async () => {
  initFromStorageAndUrl();
  await reload();
});

watch(
  () => route.query,
  () => {
    readUrlParams();
  }
);

function initFromStorageAndUrl() {
  if (typeof localStorage !== 'undefined') {
    try {
      const savedMode = localStorage.getItem(STORAGE_VIEW_MODE_KEY);
      if (savedMode && ['timeline', 'table', 'video', 'failed'].includes(savedMode)) {
        currentViewMode.value = savedMode as AlertViewMode;
      }
      const savedStatus = localStorage.getItem(STORAGE_STATUS_KEY);
      if (savedStatus && ['pending', 'sending', 'sent', 'failed', 'all'].includes(savedStatus)) {
        filter.value.status = savedStatus as AlertHistoryFilter['status'];
      }
      const savedRange = localStorage.getItem(STORAGE_RANGE_KEY);
      if (savedRange && ['24h', '7d', '30d', 'all'].includes(savedRange)) {
        filter.value.range = savedRange as AlertHistoryFilter['range'];
      }
      const savedSort = localStorage.getItem(STORAGE_SORT_KEY);
      if (savedSort && ['newest', 'vph_desc', 'views_desc', 'attempts_desc'].includes(savedSort)) {
        sort.value = savedSort as AlertHistorySort;
      }
      const savedCh = localStorage.getItem(STORAGE_CHANNEL_KEY);
      if (savedCh) {
        filter.value.channelId = savedCh;
      }
    } catch {}
  }

  // URL overrides storage
  readUrlParams();
}

function readUrlParams() {
  const q = route.query;
  if (q.status && ['pending', 'sending', 'sent', 'failed', 'all'].includes(q.status as string)) {
    filter.value.status = q.status as AlertHistoryFilter['status'];
  }
  if (q.range && ['24h', '7d', '30d', 'all'].includes(q.range as string)) {
    filter.value.range = q.range as AlertHistoryFilter['range'];
  }
  if (q.channel && typeof q.channel === 'string' && q.channel.trim()) {
    filter.value.channelId = q.channel.trim();
  }
  if (q.video && typeof q.video === 'string' && q.video.trim()) {
    filter.value.videoId = q.video.trim();
  }
  if (q.view && ['timeline', 'table', 'video', 'failed'].includes(q.view as string)) {
    currentViewMode.value = q.view as AlertViewMode;
  }
}

function persistAndSync() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_VIEW_MODE_KEY, currentViewMode.value);
      localStorage.setItem(STORAGE_STATUS_KEY, filter.value.status);
      localStorage.setItem(STORAGE_RANGE_KEY, filter.value.range);
      localStorage.setItem(STORAGE_SORT_KEY, sort.value);
      if (filter.value.channelId) {
        localStorage.setItem(STORAGE_CHANNEL_KEY, filter.value.channelId);
      } else {
        localStorage.removeItem(STORAGE_CHANNEL_KEY);
      }
    } catch {}
  }

  const q: Record<string, string> = {};
  if (filter.value.status !== 'all') q.status = filter.value.status;
  if (filter.value.range !== '30d') q.range = filter.value.range;
  if (filter.value.channelId) q.channel = filter.value.channelId;
  if (filter.value.videoId) q.video = filter.value.videoId;
  if (currentViewMode.value !== 'timeline') q.view = currentViewMode.value;

  router.replace({ query: q });
}

async function reload() {
  loading.value = true;
  error.value = null;
  displayLimit.value = 50;

  try {
    // Option A: Batch fetch-all loop
    allItems.value = await alertHistoryService.fetchAllAlertHistory(1000);
  } catch (e: unknown) {
    if (e instanceof DatabaseNotConfiguredError) {
      error.value = 'Chưa cấu hình kết nối Supabase. Vui lòng kiểm tra cài đặt.';
    } else {
      error.value = e instanceof Error ? e.message : 'Không thể tải dữ liệu cảnh báo.';
    }
  } finally {
    loading.value = false;
  }
}

function onFilterUpdate(newFilter: AlertHistoryFilter) {
  filter.value = newFilter;
  displayLimit.value = 50;
  persistAndSync();
}

function onSortUpdate(newSort: AlertHistorySort) {
  sort.value = newSort;
  persistAndSync();
}

function onViewModeChange(newMode: string) {
  currentViewMode.value = newMode as AlertViewMode;
  persistAndSync();
}

function clearVideoFilter() {
  filter.value.videoId = null;
  displayLimit.value = 50;
  persistAndSync();
}

function filterByVideo(videoId: string) {
  filter.value.videoId = videoId;
  currentViewMode.value = 'timeline';
  displayLimit.value = 50;
  persistAndSync();
}

function resetFilters() {
  filter.value = {
    status: 'all',
    range: '30d',
    channelId: null,
    search: '',
    videoId: null,
    stuckOnly: false,
  };
  displayLimit.value = 50;
  persistAndSync();
}

function loadMore() {
  displayLimit.value += 50;
}

function openModal(item: AlertHistoryItem) {
  modalItem.value = item;
}

function closeModal() {
  modalItem.value = null;
}
</script>

<style scoped>
.alert-history-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: none;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.view-mode-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.results-count {
  font-size: 12.5px;
  color: #64748b;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  height: 60px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.content-view-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  padding-bottom: 20px;
}

.btn-load-more {
  padding: 10px 24px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.15s ease;
}

.btn-load-more:hover {
  background: #f8fafc;
  border-color: #0284c7;
  color: #0284c7;
}

.btn-clear-filters {
  padding: 8px 18px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-clear-filters:hover {
  background: #0369a1;
}
</style>
