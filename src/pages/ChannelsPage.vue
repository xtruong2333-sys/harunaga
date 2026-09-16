<template>
  <div class="channels-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">Kênh Theo Dõi</h1>
        <p class="page-description">
          Thêm và quản lý các kênh YouTube đối thủ mà hệ thống sẽ kiểm tra định kỳ.
        </p>
      </div>

      <div class="page-header-actions">
        <button class="btn btn-secondary" @click="showBulkAddModal = true">
          <AppIcon name="list-plus" size="16" />
          <span>Thêm Nhiều Kênh</span>
        </button>
        <button class="btn btn-primary" @click="showAddModal = true">
          <AppIcon name="plus" size="16" />
          <span>+ Thêm Kênh</span>
        </button>
      </div>
    </div>

    <!-- Thông báo chưa cấu hình cơ sở dữ liệu -->
    <div v-if="channelStore.notConfigured" class="config-alert">
      <div class="config-alert-icon">
        <AppIcon name="alert" size="20" />
      </div>
      <div class="config-alert-text">
        <div class="config-alert-title">Chưa kết nối cơ sở dữ liệu</div>
        <div class="config-alert-desc">
          Ứng dụng đang hoạt động ở chế độ chờ cấu hình Supabase. Vui lòng thiết lập <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code> trong cài đặt môi trường.
        </div>
      </div>
    </div>

    <!-- Thông báo lỗi kết nối -->
    <div v-else-if="channelStore.error" class="error-alert">
      <div class="error-alert-content">
        <AppIcon name="alert" size="18" />
        <span>{{ channelStore.error }}</span>
      </div>
      <button class="btn btn-secondary btn-sm" @click="channelStore.fetchChannels">
        <AppIcon name="refresh" size="14" />
        <span>Thử Lại</span>
      </button>
    </div>

    <!-- Thống kê đầu trang -->
    <ChannelStatsHeader
      :total-count="channelStore.totalCount"
      :active-count="channelStore.activeCount"
      :paused-count="channelStore.pausedCount"
    />

    <!-- Skeleton Loading -->
    <div v-if="channelStore.loading" class="skeleton-container">
      <div class="skeleton-row" v-for="n in 3" :key="n"></div>
    </div>

    <!-- Nội dung chính khi đã tải xong -->
    <template v-else>
      <!-- Khi chưa có bất kỳ kênh nào trong DB -->
      <EmptyState
        v-if="channelStore.totalCount === 0"
        @add-channel="showAddModal = true"
      />

      <!-- Khi đã có kênh: Bảng điều khiển & Danh sách -->
      <template v-else>
        <ChannelTableHeader
          v-model:search-query="searchQuery"
          v-model:current-filter="currentFilter"
          v-model:current-sort="currentSort"
          :counts="{
            all: channelStore.totalCount,
            active: channelStore.activeCount,
            paused: channelStore.pausedCount,
            archived: channelStore.archivedCount,
          }"
          @open-add-single="showAddModal = true"
          @open-bulk-add="showBulkAddModal = true"
        />

        <!-- Không có kết quả tìm kiếm/lọc -->
        <div v-if="filteredChannels.length === 0" class="no-results-card">
          <div class="no-results-text">
            Không tìm thấy kênh nào phù hợp với điều kiện lọc hiện tại.
          </div>
          <button
            class="btn btn-secondary btn-sm"
            @click="searchQuery = ''; currentFilter = 'all'"
          >
            Đặt lại bộ lọc
          </button>
        </div>

        <!-- Bảng Desktop -->
        <ChannelDesktopTable
          v-else
          :channels="filteredChannels"
          @edit="handleOpenEdit"
          @pause="handlePause"
          @resume="handleResume"
          @archive="handleArchive"
          @restore="handleRestore"
        />

        <!-- Danh sách Card Mobile -->
        <ChannelMobileList
          v-if="filteredChannels.length > 0"
          :channels="filteredChannels"
          @edit="handleOpenEdit"
          @pause="handlePause"
          @resume="handleResume"
          @archive="handleArchive"
          @restore="handleRestore"
        />
      </template>
    </template>

    <!-- Modal: Thêm Kênh Đơn -->
    <AddChannelModal
      v-model="showAddModal"
      :existing-channels="channelStore.channels"
      @added="handleChannelAdded"
      @resumed="handleResume"
      @restored="handleRestore"
    />

    <!-- Modal: Thêm Nhiều Kênh -->
    <BulkAddChannelsModal
      v-model="showBulkAddModal"
      :existing-channels="channelStore.channels"
      @bulk-added="handleBulkAdded"
    />

    <!-- Modal: Chỉnh Thiết Lập -->
    <EditChannelModal
      v-model="showEditModal"
      :channel="editingChannel"
      @save="handleSaveEdit"
    />

    <!-- Modal: Nhập Mã Truy Cập -->
    <AccessKeyPromptModal
      v-model="showAccessKeyModal"
      :initial-error="accessKeyError"
      @confirmed="handleAccessKeyConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ChannelStatsHeader from '@/features/channels/components/ChannelStatsHeader.vue';
import ChannelTableHeader from '@/features/channels/components/ChannelTableHeader.vue';
import ChannelDesktopTable from '@/features/channels/components/ChannelDesktopTable.vue';
import ChannelMobileList from '@/features/channels/components/ChannelMobileList.vue';
import AddChannelModal from '@/features/channels/components/AddChannelModal.vue';
import BulkAddChannelsModal from '@/features/channels/components/BulkAddChannelsModal.vue';
import EditChannelModal from '@/features/channels/components/EditChannelModal.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';
import { AccessKeyRequiredError } from '@/services/channel-service';
import EmptyState from '@/features/channels/components/EmptyState.vue';
import { useChannelStore } from '@/stores/channel-store';
import { Channel, ChannelStatus } from '@/types/channel';

const channelStore = useChannelStore();

const searchQuery = ref('');
const currentFilter = ref<'all' | ChannelStatus>('all');
const currentSort = ref<'newest' | 'name' | 'last_scan'>('newest');

const showAddModal = ref(false);
const showBulkAddModal = ref(false);
const showEditModal = ref(false);
const editingChannel = ref<Channel | null>(null);
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
let pendingAction: (() => Promise<any>) | null = null;

onMounted(() => {
  channelStore.fetchChannels();
});

// Lọc và sắp xếp danh sách kênh
const filteredChannels = computed(() => {
  let result = [...channelStore.channels];

  // 1. Lọc theo trạng thái tab
  if (currentFilter.value !== 'all') {
    result = result.filter(c => c.status === currentFilter.value);
  }

  // 2. Tìm kiếm theo tên hoặc handle
  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    result = result.filter(c => {
      const matchName = c.name.toLowerCase().includes(query);
      const matchHandle = c.handle ? c.handle.toLowerCase().includes(query) : false;
      return matchName || matchHandle;
    });
  }

  // 3. Sắp xếp
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
  }

  return result;
});

function handleOpenEdit(channel: Channel) {
  editingChannel.value = channel;
  showEditModal.value = true;
}


async function executeWithAccessKey(action: () => Promise<any>) {
  try {
    await action();
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.name === 'AccessKeyRequiredError') {
      accessKeyError.value = err.message;
      pendingAction = action;
      showAccessKeyModal.value = true;
    } else {
      alert(err.message || 'Thao tác không thành công.');
    }
  }
}

async function handleAccessKeyConfirmed() {
  if (pendingAction) {
    const action = pendingAction;
    pendingAction = null;
    await executeWithAccessKey(action);
  }
}

async function handlePause(id: string) {
  await executeWithAccessKey(() => channelStore.pauseChannel(id));
}

async function handleResume(id: string) {
  await executeWithAccessKey(() => channelStore.resumeChannel(id));
}

async function handleArchive(id: string) {
  await executeWithAccessKey(() => channelStore.archiveChannel(id));
}

async function handleRestore(id: string) {
  await executeWithAccessKey(() => channelStore.restoreChannel(id));
}

async function handleSaveEdit(payload: { id: string; scanLimit: number; alertThreshold: number; notes: string }) {
  await executeWithAccessKey(() => channelStore.updateChannel(payload.id, {
    scanLimit: payload.scanLimit,
    alertVphThreshold: payload.alertThreshold,
    notes: payload.notes,
  }));
}

function handleChannelAdded() {
  channelStore.fetchChannels();
}

function handleBulkAdded() {
  channelStore.fetchChannels();
}
</script>

<style scoped>
.channels-page {
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.page-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
  max-width: 600px;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-alert {
  display: flex;
  gap: 14px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-left: 4px solid var(--status-paused);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.config-alert-icon {
  color: var(--status-paused);
  flex-shrink: 0;
  margin-top: 2px;
}

.config-alert-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.config-alert-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.5;
}

.config-alert-desc code {
  background-color: var(--bg-surface-elevated);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 12px;
}

.error-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background-color: var(--danger-bg);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 12px 18px;
  color: var(--danger);
  margin-bottom: 24px;
}

.error-alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.skeleton-row {
  height: 60px;
  background-color: var(--bg-surface);
  border-radius: 8px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.no-results-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 40px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.no-results-text {
  color: var(--text-secondary);
  font-size: 14px;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .page-header-actions {
    display: none;
  }
}
</style>
