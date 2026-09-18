<template>
  <div class="channels-page">
    <!-- 1. Page Header -->
    <PageHeader
      kicker="COMPETITOR NETWORK"
      title="Kênh Theo Dõi"
      description="Quản lý mạng lưới đối thủ và theo dõi tín hiệu tăng trưởng theo từng kênh."
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isCollecting || channelStore.loading"
          title="Kiểm tra dữ liệu video mới nhất của các kênh đang theo dõi"
          @click="handleTriggerCollection"
        >
          <AppIcon name="refresh" size="15" :class="{ 'spin-anim': isCollecting }" />
          <span>{{ isCollecting ? 'Đang kiểm tra...' : 'Kiểm Tra Dữ Liệu' }}</span>
        </button>

        <button
          type="button"
          class="btn btn-secondary"
          @click="showBulkAddModal = true"
        >
          <AppIcon name="list-plus" size="15" />
          <span>Thêm Nhiều Kênh</span>
        </button>

        <button
          type="button"
          class="btn btn-primary"
          @click="showAddModal = true"
        >
          <AppIcon name="plus" size="15" />
          <span>+ Thêm Kênh</span>
        </button>
      </template>
    </PageHeader>

    <!-- 2. Notice Banners -->
    <div v-if="collectNotification" class="collect-banner">
      <AppIcon name="check-circle" size="18" />
      <span>{{ collectNotification }}</span>
    </div>

    <div v-if="channelStore.notConfigured" class="config-alert">
      <div class="config-alert-icon">
        <AppIcon name="alert" size="20" />
      </div>
      <div class="config-alert-text">
        <div class="config-alert-title">Chưa kết nối cơ sở dữ liệu</div>
        <div class="config-alert-desc">
          Ứng dụng đang hoạt động ở chế độ chờ cấu hình Supabase. Vui lòng thiết lập <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
        </div>
      </div>
    </div>

    <!-- Error State component if error -->
    <ErrorState
      v-else-if="channelStore.error"
      title="Không thể tải danh sách kênh"
      :message="channelStore.error"
      action-text="Thử lại"
      @retry="loadData"
    />

    <!-- Main Workspace Content -->
    <template v-else>
      <!-- 3. Summary Strip -->
      <ChannelSummaryStrip
        :total-count="channelStore.totalCount"
        :active-count="channelStore.activeCount"
        :rising-videos-count="totalRisingVideos"
        :max-vph="maxNetworkVph"
        :loading="channelStore.loading"
      />

      <!-- When zero channels in database -->
      <EmptyState
        v-if="!channelStore.loading && channelStore.totalCount === 0"
        title="Chưa có đối thủ nào"
        description="Thêm kênh YouTube đầu tiên để bắt đầu theo dõi tín hiệu và tốc độ tăng trưởng."
        action-text="Thêm Kênh Đầu Tiên"
        action-icon="plus"
        @action="showAddModal = true"
        @add-channel="showAddModal = true"
      />

      <!-- When channels exist: FilterBar & Dynamic View -->
      <template v-else>
        <!-- 4. Filter Bar & View Mode Switcher -->
        <FilterBar
          :search="rawSearchQuery"
          search-placeholder="Tìm theo tên kênh, handle..."
          :total-count="channelStore.totalCount"
          :filtered-count="filteredChannels.length"
          :has-active-filters="hasActiveFilters"
          @update:search="handleSearchInput"
          @clear="resetFilters"
        >
          <template #filters>
            <div class="status-filter-pills" role="tablist">
              <button
                type="button"
                class="pill-btn"
                :class="{ 'is-active': currentFilter === 'all' }"
                @click="currentFilter = 'all'"
              >
                Tất cả ({{ channelStore.totalCount }})
              </button>
              <button
                type="button"
                class="pill-btn"
                :class="{ 'is-active': currentFilter === 'active' }"
                @click="currentFilter = 'active'"
              >
                Đang theo dõi ({{ channelStore.activeCount }})
              </button>
              <button
                type="button"
                class="pill-btn"
                :class="{ 'is-active': currentFilter === 'paused' }"
                @click="currentFilter = 'paused'"
              >
                Tạm dừng ({{ channelStore.pausedCount }})
              </button>
              <button
                type="button"
                class="pill-btn"
                :class="{ 'is-active': currentFilter === 'rising' }"
                @click="currentFilter = 'rising'"
              >
                Đang tăng
              </button>
              <button
                type="button"
                class="pill-btn"
                :class="{ 'is-active': currentFilter === 'archived' }"
                @click="currentFilter = 'archived'"
              >
                Đã lưu trữ ({{ channelStore.archivedCount }})
              </button>
            </div>

            <div class="sort-select-wrap">
              <select v-model="currentSort" class="sort-select" aria-label="Sắp xếp danh sách">
                <option value="newest">Mới thêm nhất</option>
                <option value="name">Tên kênh (A - Z)</option>
                <option value="last_scan">Quét gần nhất</option>
                <option value="max_vph">Max VPH cao nhất</option>
                <option value="rising_count">Nhiều video tăng nhất</option>
              </select>
            </div>
          </template>

          <template #actions>
            <ViewModeSwitcher
              v-model="viewMode"
              :modes="viewModes"
              storage-key="bbdt_channels_view_mode"
              size="sm"
            />
          </template>
        </FilterBar>

        <!-- 5. Loading Skeleton -->
        <div v-if="channelStore.loading" class="channels-skeleton-wrap">
          <div v-if="viewMode === 'large-grid'" class="large-grid-layout">
            <div v-for="n in 6" :key="n" class="skeleton-large-card"></div>
          </div>
          <div v-else-if="viewMode === 'grid'" class="medium-grid-layout">
            <div v-for="n in 8" :key="n" class="skeleton-med-card"></div>
          </div>
          <div v-else class="list-layout">
            <div v-for="n in 5" :key="n" class="skeleton-row-item"></div>
          </div>
        </div>

        <!-- 6. View Renderers -->
        <template v-else>
          <!-- No search results -->
          <div v-if="filteredChannels.length === 0" class="no-results-card surface-card">
            <div class="no-results-icon">
              <AppIcon name="search" size="24" />
            </div>
            <div class="no-results-title">Không tìm thấy kênh phù hợp</div>
            <div class="no-results-desc">
              Không có kênh nào khớp với từ khóa "{{ debouncedSearchQuery }}" hoặc điều kiện lọc hiện tại.
            </div>
            <button type="button" class="btn btn-secondary btn-sm" @click="resetFilters">
              Xóa bộ lọc
            </button>
          </div>

          <!-- Mode 1: Large Grid (Default) -->
          <div v-else-if="viewMode === 'large-grid'" class="large-grid-layout">
            <ChannelLargeCard
              v-for="ch in filteredChannels"
              :key="ch.id"
              :channel="ch"
              @edit="handleOpenEdit"
              @pause="handlePause"
              @resume="handleResume"
              @archive="handleRequestArchive"
              @restore="handleRestore"
            />
          </div>

          <!-- Mode 2: Medium Grid -->
          <div v-else-if="viewMode === 'grid'" class="medium-grid-layout">
            <ChannelMediumCard
              v-for="ch in filteredChannels"
              :key="ch.id"
              :channel="ch"
              @edit="handleOpenEdit"
              @pause="handlePause"
              @resume="handleResume"
              @archive="handleRequestArchive"
              @restore="handleRestore"
            />
          </div>

          <!-- Mode 3: List View -->
          <div v-else-if="viewMode === 'list'" class="list-layout">
            <ChannelListRow
              v-for="ch in filteredChannels"
              :key="ch.id"
              :channel="ch"
              @edit="handleOpenEdit"
              @pause="handlePause"
              @resume="handleResume"
              @archive="handleRequestArchive"
              @restore="handleRestore"
            />
          </div>

          <!-- Mode 4: Table View -->
          <ChannelTableView
            v-else-if="viewMode === 'table'"
            :channels="filteredChannels"
            @edit="handleOpenEdit"
            @pause="handlePause"
            @resume="handleResume"
            @archive="handleRequestArchive"
            @restore="handleRestore"
          />
        </template>
      </template>
    </template>

    <!-- Modals -->
    <AddChannelModal
      v-model="showAddModal"
      :existing-channels="channelStore.channels"
      @added="handleChannelAdded"
      @resumed="handleResume"
      @restored="handleRestore"
      @access-key-required="handleAccessKeyRequired"
    />

    <BulkAddChannelsModal
      v-model="showBulkAddModal"
      :existing-channels="channelStore.channels"
      @bulk-added="handleBulkAdded"
      @access-key-required="handleAccessKeyRequired"
    />

    <EditChannelModal
      v-model="showEditModal"
      :channel="editingChannel"
      @save="handleSaveEdit"
    />

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast-notification">
      {{ toastMessage }}
    </div>

    <AccessKeyPromptModal
      :model-value="showAccessKeyModal"
      @update:model-value="handleAccessModalChange"
      :initial-error="accessKeyError"
      @confirmed="handleAccessKeyConfirmed"
    />

    <ChannelDeleteModal
      v-model="showDeleteModal"
      :channel="channelToDelete"
      @confirm="handleConfirmArchive"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import FilterBar from '@/components/ui/FilterBar.vue';
import ViewModeSwitcher, { ViewModeItem } from '@/components/ui/ViewModeSwitcher.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';

// Channels components
import ChannelSummaryStrip from '@/components/channels/ChannelSummaryStrip.vue';
import ChannelLargeCard from '@/components/channels/ChannelLargeCard.vue';
import ChannelMediumCard from '@/components/channels/ChannelMediumCard.vue';
import ChannelListRow from '@/components/channels/ChannelListRow.vue';
import ChannelTableView from '@/components/channels/ChannelTableView.vue';
import ChannelDeleteModal from '@/components/channels/ChannelDeleteModal.vue';

// Modals
import AddChannelModal from '@/features/channels/components/AddChannelModal.vue';
import BulkAddChannelsModal from '@/features/channels/components/BulkAddChannelsModal.vue';
import EditChannelModal from '@/features/channels/components/EditChannelModal.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';

import { AccessKeyRequiredError } from '@/services/channel-service';
import { collectorService } from '@/services/collector-service';
import { useChannelStore } from '@/stores/channel-store';
import { Channel, ChannelStatus } from '@/types/channel';
import { getSupabase, isSupabaseConfigured } from '@/services/supabase';

const channelStore = useChannelStore();

// View Modes definition
const viewModes: ViewModeItem[] = [
  { id: 'large-grid', label: 'Lưới lớn', icon: 'grid', title: 'Chế độ lưới lớn' },
  { id: 'grid', label: 'Lưới vừa', icon: 'layout-grid', title: 'Chế độ lưới vừa' },
  { id: 'list', label: 'Danh sách', icon: 'list', title: 'Chế độ danh sách' },
  { id: 'table', label: 'Bảng', icon: 'table', title: 'Chế độ bảng' },
];

const viewMode = ref<string>('large-grid');

// Search & Debounce (180ms)
const rawSearchQuery = ref('');
const debouncedSearchQuery = ref('');
let searchDebounceTimer: any = null;

function handleSearchInput(val: string) {
  rawSearchQuery.value = val;
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = val;
  }, 180);
}

// Filters & Sort
const currentFilter = ref<'all' | ChannelStatus | 'rising'>('all');
const currentSort = ref<'newest' | 'name' | 'last_scan' | 'max_vph' | 'rising_count'>('newest');

// Modals & State
const showAddModal = ref(false);
const showBulkAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const editingChannel = ref<Channel | null>(null);
const channelToDelete = ref<Channel | null>(null);

const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
const isCollecting = ref(false);
const collectNotification = ref<string | null>(null);
let pendingAction: (() => Promise<any>) | null = null;
const accessActionRunning = ref(false);

const toastMessage = ref<string | null>(null);
let toastTimer: any = null;

function showToast(msg: string) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
}

function handleAccessModalChange(isOpen: boolean) {
  showAccessKeyModal.value = isOpen;
  if (!isOpen) {
    pendingAction = null;
    accessKeyError.value = null;
  }
}

// Telemetry Stats Map
const channelStatsMap = ref<Record<string, { totalVideos: number; risingCount: number; maxVph: number | null }>>({});

async function loadChannelTelemetry() {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .from('channel_video_current_stats')
      .select('channel_id, total_videos, rising_video_count, max_vph');

    if (!error && data) {
      const statsObj: Record<string, { totalVideos: number; risingCount: number; maxVph: number | null }> = {};
      for (const row of data) {
        statsObj[row.channel_id] = {
          totalVideos: Number(row.total_videos) || 0,
          risingCount: Number(row.rising_video_count) || 0,
          maxVph: row.max_vph !== null && row.max_vph !== undefined ? Number(row.max_vph) : null,
        };
      }
      channelStatsMap.value = statsObj;
    }
  } catch {
    // Fail-open for telemetry stats
  }
}

async function loadData() {
  await channelStore.fetchChannels();
  await loadChannelTelemetry();
}

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('bbdt_channels_view_mode');
    if (saved && ['large-grid', 'grid', 'list', 'table'].includes(saved)) {
      viewMode.value = saved;
    }
  }
  loadData();
});

// Enriched Channels with stats
const enrichedChannels = computed<Channel[]>(() => {
  return channelStore.channels.map(ch => {
    const stats = channelStatsMap.value[ch.id];
    if (stats) {
      return {
        ...ch,
        totalVideos: stats.totalVideos,
        risingVideoCount: stats.risingCount,
        maxVph: stats.maxVph,
      };
    }
    return ch;
  });
});

// Network summary totals
const totalRisingVideos = computed(() => {
  return enrichedChannels.value.reduce((acc, ch) => acc + (ch.risingVideoCount || 0), 0);
});

const maxNetworkVph = computed(() => {
  let max: number | null = null;
  for (const ch of enrichedChannels.value) {
    if (ch.maxVph !== null && ch.maxVph !== undefined) {
      if (max === null || ch.maxVph > max) {
        max = ch.maxVph;
      }
    }
  }
  return max;
});

const hasActiveFilters = computed(() => {
  return rawSearchQuery.value.trim() !== '' || currentFilter.value !== 'all' || currentSort.value !== 'newest';
});

function resetFilters() {
  rawSearchQuery.value = '';
  debouncedSearchQuery.value = '';
  currentFilter.value = 'all';
  currentSort.value = 'newest';
}

// Filtered and sorted channels
const filteredChannels = computed(() => {
  let result = [...enrichedChannels.value];

  // 1. Filter by status or rising
  if (currentFilter.value === 'rising') {
    result = result.filter(c => (c.risingVideoCount || 0) > 0);
  } else if (currentFilter.value !== 'all') {
    result = result.filter(c => c.status === currentFilter.value);
  }

  // 2. Search query (name or handle) with debounced search
  const query = debouncedSearchQuery.value.trim().toLowerCase();
  if (query) {
    result = result.filter(c => {
      const matchName = c.name.toLowerCase().includes(query);
      const matchHandle = c.handle ? c.handle.toLowerCase().includes(query) : false;
      return matchName || matchHandle;
    });
  }

  // 3. Sort
  if (currentSort.value === 'newest') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (currentSort.value === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } else if (currentSort.value === 'last_scan') {
    result.sort((a, b) => {
      const timeA = a.lastScanAt ? new Date(a.lastScanAt).getTime() : 0;
      const timeB = b.lastScanAt ? new Date(b.lastScanAt).getTime() : 0;
      return timeB - timeA;
    });
  } else if (currentSort.value === 'max_vph') {
    result.sort((a, b) => {
      const vphA = a.maxVph || 0;
      const vphB = b.maxVph || 0;
      return vphB - vphA;
    });
  } else if (currentSort.value === 'rising_count') {
    result.sort((a, b) => (b.risingVideoCount || 0) - (a.risingVideoCount || 0));
  }

  return result;
});

function handleOpenEdit(channel: Channel) {
  editingChannel.value = channel;
  showEditModal.value = true;
}

function handleRequestArchive(id: string) {
  const ch = channelStore.channels.find(c => c.id === id);
  channelToDelete.value = ch || null;
  showDeleteModal.value = true;
}

async function handleConfirmArchive(id: string) {
  await handleArchive(id);
}

function handleAccessKeyRequired(action: () => Promise<any>, errorMsg?: string) {
  pendingAction = action;
  if (errorMsg && (errorMsg.includes('không chính xác') || errorMsg.includes('truy cập') || errorMsg.includes('từ chối'))) {
    accessKeyError.value = 'Mã truy cập không chính xác. Vui lòng nhập lại.';
  } else {
    accessKeyError.value = errorMsg || 'Vui lòng nhập Mã truy cập để thực hiện thao tác.';
  }
  showAccessKeyModal.value = true;
}

async function executeWithAccessKey(action: () => Promise<any>) {
  try {
    await action();
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.name === 'AccessKeyRequiredError') {
      handleAccessKeyRequired(action, err.message);
    } else {
      showToast(err.message || 'Thao tác không thành công.');
    }
  }
}

async function handleAccessKeyConfirmed() {
  if (!pendingAction || accessActionRunning.value) return;
  const action = pendingAction;
  accessActionRunning.value = true;
  try {
    accessKeyError.value = null;
    await action();
    pendingAction = null;
    showAccessKeyModal.value = false;
    accessKeyError.value = null;
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.name === 'AccessKeyRequiredError') {
      pendingAction = action;
      accessKeyError.value = 'Mã truy cập không chính xác. Vui lòng nhập lại.';
      showAccessKeyModal.value = true;
    } else {
      pendingAction = null;
      showAccessKeyModal.value = false;
      showToast(err.message || 'Thao tác không thành công.');
    }
  } finally {
    accessActionRunning.value = false;
  }
}

async function handlePause(id: string) {
  if (showAccessKeyModal.value || pendingAction !== null || accessActionRunning.value) return;
  await executeWithAccessKey(() => channelStore.pauseChannel(id));
}

async function handleResume(id: string) {
  if (showAccessKeyModal.value || pendingAction !== null || accessActionRunning.value) return;
  await executeWithAccessKey(() => channelStore.resumeChannel(id));
}

async function handleArchive(id: string) {
  if (showAccessKeyModal.value || pendingAction !== null || accessActionRunning.value) return;
  await executeWithAccessKey(() => channelStore.archiveChannel(id));
}

async function handleRestore(id: string) {
  if (showAccessKeyModal.value || pendingAction !== null || accessActionRunning.value) return;
  await executeWithAccessKey(() => channelStore.restoreChannel(id));
}

async function handleSaveEdit(payload: { id: string; scanLimit: number | null; alertThreshold: number | null; notes: string }) {
  if (showAccessKeyModal.value || pendingAction !== null || accessActionRunning.value) return;
  await executeWithAccessKey(() => channelStore.updateChannel(payload.id, {
    scanLimit: payload.scanLimit,
    alertVphThreshold: payload.alertThreshold,
    notes: payload.notes,
  }));
}

function handleChannelAdded() {
  loadData();
}

function handleBulkAdded() {
  loadData();
}

async function handleTriggerCollection() {
  if (isCollecting.value || showAccessKeyModal.value || pendingAction !== null || accessActionRunning.value) return;
  await executeWithAccessKey(async () => {
    isCollecting.value = true;
    collectNotification.value = null;
    try {
      const res = await collectorService.triggerCollection();
      if (res.skipped) {
        collectNotification.value = res.reason || 'Đang có phiên kiểm tra khác hoạt động.';
      } else if (res.success && res.run) {
        collectNotification.value = `Đã kiểm tra ${res.run.channelsSuccess} kênh và ${res.run.videosFound} video.`;
        await loadData();
      }
      setTimeout(() => {
        collectNotification.value = null;
      }, 6000);
    } finally {
      isCollecting.value = false;
    }
  });
}
</script>

<style scoped>
.channels-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1440px;
  margin: 0 auto;
}

.collect-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--color-success-bg, #ECFDF5);
  color: var(--color-success-text, #059669);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-md, 8px);
  font-size: 0.875rem;
  font-weight: 500;
  animation: banner-enter 0.2s ease-out;
}

@keyframes banner-enter {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.config-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: var(--color-warning-bg, #FFFBEB);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-md, 8px);
}

.config-alert-icon {
  color: var(--color-warning-text, #D97706);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.config-alert-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-warning-text, #D97706);
  margin-bottom: 0.25rem;
}

.config-alert-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary, #475569);
  line-height: 1.5;
}

/* Status Pills */
.status-filter-pills {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.pill-btn {
  padding: 0.3125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  background: var(--bg-surface-secondary, #F1F5F9);
  border: 1px solid transparent;
  border-radius: var(--radius-full, 9999px);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.pill-btn:hover {
  background: var(--border, #E2E8F0);
  color: var(--text-primary, #0F172A);
}

.pill-btn.is-active {
  background: var(--brand-primary, #2563EB);
  color: #FFFFFF;
}

.sort-select-wrap {
  margin-left: 0.25rem;
}

.sort-select {
  padding: 0.3125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #334155);
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  outline: none;
}

.sort-select:focus {
  border-color: var(--brand-primary, #2563EB);
}

/* Layouts */
.large-grid-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.medium-grid-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.list-layout {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

/* No results card */
.no-results-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
}

.no-results-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-surface-secondary, #F1F5F9);
  color: var(--text-tertiary, #64748B);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.no-results-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  margin-bottom: 0.375rem;
}

.no-results-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary, #475569);
  max-width: 360px;
  margin-bottom: 1.25rem;
}

/* Skeletons */
.channels-skeleton-wrap {
  width: 100%;
}

.skeleton-large-card {
  height: 240px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-lg, 14px);
  animation: pulse-skeleton 1.5s ease-in-out infinite alternate;
}

.skeleton-med-card {
  height: 140px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  animation: pulse-skeleton 1.5s ease-in-out infinite alternate;
}

.skeleton-row-item {
  height: 60px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  animation: pulse-skeleton 1.5s ease-in-out infinite alternate;
}

@keyframes pulse-skeleton {
  0% { opacity: 0.4; }
  100% { opacity: 0.85; }
}

@media (max-width: 1280px) {
  .medium-grid-layout {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .large-grid-layout {
    grid-template-columns: repeat(2, 1fr);
  }

  .medium-grid-layout {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .large-grid-layout {
    grid-template-columns: 1fr;
  }

  .medium-grid-layout {
    grid-template-columns: 1fr;
  }
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
</style>
