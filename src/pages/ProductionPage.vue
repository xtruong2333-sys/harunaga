<template>
  <div class="production-page">
    <!-- 1. Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">
          <AppIcon name="clipboard-list" size="26" class="title-icon" />
          <span>Tiến Độ Sản Xuất</span>
        </h1>
        <p class="page-description">
          Theo dõi các ý tưởng nội dung từ lúc chọn video nguồn đến khi xuất bản.
        </p>
      </div>

      <div class="page-header-actions">
        <button
          class="btn btn-secondary btn-sm"
          :disabled="loading"
          @click="loadItems"
          title="Tải lại danh sách tiến độ"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="alert-banner error-banner">
      <AppIcon name="alert" size="20" class="alert-icon" />
      <div class="alert-content">
        <div class="alert-title">Thông báo hệ thống</div>
        <div class="alert-message">{{ error }}</div>
      </div>
      <button class="btn btn-secondary btn-sm" @click="loadItems">
        Thử Lại
      </button>
    </div>

    <!-- Success Toast -->
    <div v-if="toastMessage" class="toast-banner">
      <AppIcon name="check" size="18" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- 2. Summary Stats (4 Cards) -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap bg-blue">
          <AppIcon name="activity" size="20" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Đang làm</span>
          <span class="stat-val mono">{{ stats.activeCount }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap bg-amber">
          <AppIcon name="sparkles" size="20" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Ý tưởng</span>
          <span class="stat-val mono">{{ stats.ideaCount }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap bg-purple">
          <AppIcon name="video" size="20" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Đang sản xuất</span>
          <span class="stat-val mono">{{ stats.inProductionCount }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap bg-green">
          <AppIcon name="check-circle" size="20" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Đã xuất bản</span>
          <span class="stat-val mono">{{ stats.publishedCount }}</span>
        </div>
      </div>
    </div>

    <!-- 3. Toolbar: Status Tabs, Search, Priority Filter, Sort -->
    <div class="card toolbar-card">
      <!-- Status Tabs Row -->
      <div class="status-tabs-row">
        <button
          class="status-tab-btn"
          :class="{ active: filterState.status === 'all' }"
          @click="filterState.status = 'all'"
        >
          <span>Tất cả (Quy trình)</span>
          <span class="tab-count-badge">{{ nonArchivedCount }}</span>
        </button>

        <button
          v-for="st in ACTIVE_STATUS_KEYS"
          :key="st"
          class="status-tab-btn"
          :class="{ active: filterState.status === st }"
          @click="filterState.status = st"
        >
          <span>{{ STATUS_LABELS[st] }}</span>
          <span class="tab-count-badge">{{ countByStatus(st) }}</span>
        </button>

        <button
          class="status-tab-btn archived-tab"
          :class="{ active: filterState.status === 'archived' }"
          @click="filterState.status = 'archived'"
        >
          <AppIcon name="archive" size="14" />
          <span>Đã lưu trữ</span>
          <span class="tab-count-badge">{{ archivedCount }}</span>
        </button>
      </div>

      <!-- Secondary Controls Row (Search, Priority, Sort) -->
      <div class="controls-row">
        <!-- Search Box -->
        <div class="search-box">
          <AppIcon name="search" size="16" class="search-icon" />
          <input
            v-model="filterState.searchQuery"
            type="text"
            placeholder="Tìm theo tiêu đề dự kiến, video gốc, kênh đối thủ..."
            class="search-input"
          />
          <button
            v-if="filterState.searchQuery"
            class="clear-search-btn"
            @click="filterState.searchQuery = ''"
          >
            <AppIcon name="x" size="14" />
          </button>
        </div>

        <!-- Priority Select -->
        <div class="filter-group">
          <label class="filter-label">Mức ưu tiên:</label>
          <select v-model="filterState.priority" class="filter-select">
            <option value="all">Tất cả mức ưu tiên</option>
            <option value="high">Cao</option>
            <option value="normal">Bình thường</option>
            <option value="low">Thấp</option>
          </select>
        </div>

        <!-- Sort Select -->
        <div class="filter-group">
          <label class="filter-label">Sắp xếp:</label>
          <select v-model="filterState.sortBy" class="filter-select">
            <option value="updated_desc">Mới cập nhật</option>
            <option value="created_desc">Mới thêm</option>
            <option value="priority_desc">Ưu tiên cao</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 4. Loading Skeleton -->
    <div v-if="loading && items.length === 0" class="skeleton-container">
      <div v-for="n in 3" :key="n" class="skeleton-card"></div>
    </div>

    <!-- 5. Empty State (Khi chưa có bất kỳ item nào trong hệ thống) -->
    <div v-else-if="items.length === 0" class="card empty-state-card">
      <div class="empty-icon-wrap">
        <AppIcon name="video" size="36" class="empty-icon" />
      </div>
      <h3 class="empty-title">Chưa có nội dung nào trong Tiến Độ Sản Xuất.</h3>
      <p class="empty-desc">
        Hãy chọn một video đối thủ đang tăng trưởng và đưa vào danh sách sản xuất để bắt đầu quy trình sáng tạo.
      </p>
      <router-link to="/video-tiem-nang" class="btn btn-primary">
        <AppIcon name="zap" size="16" />
        <span>Xem Video Tiềm Năng</span>
      </router-link>
    </div>

    <!-- 6. Filter No Results -->
    <div v-else-if="filteredItems.length === 0" class="card empty-filter-card">
      <AppIcon name="search" size="28" class="text-muted" />
      <p class="empty-filter-text">Không tìm thấy mục sản xuất nào phù hợp với bộ lọc.</p>
      <button class="btn btn-secondary btn-sm" @click="resetFilters">
        Đặt lại bộ lọc
      </button>
    </div>

    <!-- 7. Main Display: Kanban Board (Desktop & status === 'all') -->
    <div
      v-else-if="filterState.status === 'all' && isDesktop"
      class="kanban-board"
    >
      <div
        v-for="st in ACTIVE_STATUS_KEYS"
        :key="st"
        class="kanban-column"
      >
        <div class="column-header">
          <div class="column-title-wrap">
            <span class="column-dot" :class="`dot-${st}`"></span>
            <span class="column-title">{{ STATUS_LABELS[st] }}</span>
          </div>
          <span class="column-badge">{{ getColumnItems(st).length }}</span>
        </div>

        <div class="column-cards-list">
          <div
            v-for="item in getColumnItems(st)"
            :key="item.id"
            class="production-card"
          >
            <!-- Card Header: Working Title & Priority -->
            <div class="p-card-top">
              <span
                class="priority-badge"
                :class="`priority-${item.priority}`"
                :title="`Mức ưu tiên: ${PRIORITY_LABELS[item.priority]}`"
              >
                {{ PRIORITY_LABELS[item.priority] }}
              </span>
              <span class="card-time">{{ productionService.formatRelativeTime(item.updatedAt) }}</span>
            </div>

            <!-- Working Title -->
            <h4 class="working-title" :class="{ 'text-placeholder': !item.workingTitle }">
              {{ item.workingTitle || 'Chưa đặt tiêu đề dự kiến' }}
            </h4>

            <!-- Source Video Info -->
            <div class="source-video-box">
              <div v-if="item.sourceVideo" class="source-video-inner">
                <img
                  v-if="item.sourceVideo.thumbnailUrl"
                  :src="item.sourceVideo.thumbnailUrl"
                  :alt="item.sourceVideo.title"
                  class="source-thumb"
                  loading="lazy"
                  @error="onThumbError"
                />
                <div class="source-meta">
                  <span class="source-channel">{{ item.sourceVideo.channelName }}</span>
                  <router-link
                    :to="`/videos/${item.sourceVideo.id}`"
                    class="source-title-link"
                    :title="item.sourceVideo.title"
                  >
                    {{ truncate(item.sourceVideo.title, 55) }}
                  </router-link>
                </div>
              </div>
              <div v-else class="source-deleted-notice">
                <AppIcon name="alert" size="14" />
                <span>Video nguồn không còn trong hệ thống.</span>
              </div>
            </div>

            <!-- Notes preview -->
            <p v-if="item.notes" class="notes-preview">
              {{ truncate(item.notes, 90) }}
            </p>

            <!-- Published URL preview -->
            <div v-if="item.publishedUrl" class="published-url-row">
              <AppIcon name="external" size="12" />
              <a :href="item.publishedUrl" target="_blank" rel="noopener noreferrer" class="published-link">
                {{ truncate(item.publishedUrl, 30) }}
              </a>
            </div>

            <!-- Status selector quick change -->
            <div class="status-change-wrap">
              <label class="status-change-label">Trạng thái:</label>
              <select
                :value="item.status"
                class="status-select-sm"
                @change="onQuickStatusChange(item, $event)"
              >
                <option v-for="sKey in ALL_STATUS_OPTIONS" :key="sKey" :value="sKey">
                  {{ STATUS_LABELS[sKey] }}
                </option>
              </select>
            </div>

            <!-- Card Actions -->
            <div class="p-card-actions">
              <button
                class="btn-card-action"
                @click="openEditModal(item)"
                title="Chỉnh sửa nội dung sản xuất"
              >
                <AppIcon name="settings" size="14" />
                <span>Sửa</span>
              </button>

              <button
                v-if="item.status !== 'archived'"
                class="btn-card-action"
                @click="handleArchiveItem(item)"
                title="Lưu trữ mục này"
              >
                <AppIcon name="archive" size="14" />
                <span>Lưu trữ</span>
              </button>

              <button
                v-else
                class="btn-card-action text-blue"
                @click="handleRestoreItem(item)"
                title="Khôi phục về Ý tưởng"
              >
                <AppIcon name="restore" size="14" />
                <span>Khôi phục</span>
              </button>

              <button
                class="btn-card-action text-danger"
                @click="openDeleteModal(item)"
                title="Xóa mục khỏi quy trình sản xuất"
              >
                <AppIcon name="x" size="14" />
                <span>Xóa</span>
              </button>
            </div>
          </div>

          <div v-if="getColumnItems(st).length === 0" class="column-empty">
            <span>Trống</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 8. Single Status / Mobile Vertical Cards List -->
    <div v-else class="cards-list-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="production-card full-card"
      >
        <!-- Card Header: Working Title & Badges -->
        <div class="p-card-top">
          <div class="badges-group">
            <span class="status-badge" :class="`badge-status-${item.status}`">
              {{ STATUS_LABELS[item.status] }}
            </span>
            <span class="priority-badge" :class="`priority-${item.priority}`">
              {{ PRIORITY_LABELS[item.priority] }}
            </span>
          </div>
          <span class="card-time">{{ productionService.formatRelativeTime(item.updatedAt) }}</span>
        </div>

        <!-- Working Title -->
        <h4 class="working-title" :class="{ 'text-placeholder': !item.workingTitle }">
          {{ item.workingTitle || 'Chưa đặt tiêu đề dự kiến' }}
        </h4>

        <!-- Source Video Box -->
        <div class="source-video-box">
          <div v-if="item.sourceVideo" class="source-video-inner">
            <img
              v-if="item.sourceVideo.thumbnailUrl"
              :src="item.sourceVideo.thumbnailUrl"
              :alt="item.sourceVideo.title"
              class="source-thumb"
              loading="lazy"
              @error="onThumbError"
            />
            <div class="source-meta">
              <span class="source-channel">{{ item.sourceVideo.channelName }}</span>
              <router-link
                :to="`/videos/${item.sourceVideo.id}`"
                class="source-title-link"
                :title="item.sourceVideo.title"
              >
                {{ item.sourceVideo.title }}
              </router-link>
              <a
                :href="item.sourceVideo.url"
                target="_blank"
                rel="noopener noreferrer"
                class="source-yt-link"
              >
                <AppIcon name="external" size="12" />
                <span>Xem trên YouTube</span>
              </a>
            </div>
          </div>
          <div v-else class="source-deleted-notice">
            <AppIcon name="alert" size="14" />
            <span>Video nguồn không còn trong hệ thống.</span>
          </div>
        </div>

        <!-- Notes -->
        <p v-if="item.notes" class="notes-preview">
          {{ item.notes }}
        </p>

        <!-- Published URL -->
        <div v-if="item.publishedUrl" class="published-url-row">
          <AppIcon name="external" size="14" />
          <span>URL xuất bản: </span>
          <a :href="item.publishedUrl" target="_blank" rel="noopener noreferrer" class="published-link">
            {{ item.publishedUrl }}
          </a>
        </div>

        <!-- Status selector -->
        <div class="status-change-wrap">
          <label class="status-change-label">Chuyển trạng thái:</label>
          <select
            :value="item.status"
            class="status-select-sm"
            @change="onQuickStatusChange(item, $event)"
          >
            <option v-for="sKey in ALL_STATUS_OPTIONS" :key="sKey" :value="sKey">
              {{ STATUS_LABELS[sKey] }}
            </option>
          </select>
        </div>

        <!-- Card Actions -->
        <div class="p-card-actions">
          <button
            class="btn btn-secondary btn-sm"
            @click="openEditModal(item)"
          >
            <AppIcon name="settings" size="14" />
            <span>Chỉnh Sửa</span>
          </button>

          <button
            v-if="item.status !== 'archived'"
            class="btn btn-secondary btn-sm"
            @click="handleArchiveItem(item)"
          >
            <AppIcon name="archive" size="14" />
            <span>Lưu Trữ</span>
          </button>

          <button
            v-else
            class="btn btn-secondary btn-sm text-blue"
            @click="handleRestoreItem(item)"
          >
            <AppIcon name="restore" size="14" />
            <span>Khôi Phục</span>
          </button>

          <button
            class="btn btn-secondary btn-sm text-danger"
            @click="openDeleteModal(item)"
          >
            <AppIcon name="x" size="14" />
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 9. Edit Item Modal -->
    <AppModal
      v-model="showEditModal"
      title="Chỉnh Sửa Nội Dung Sản Xuất"
      description="Cập nhật tiêu đề dự kiến, ghi chú sản xuất, mức ưu tiên và URL xuất bản."
      max-width="540px"
    >
      <div v-if="editingItem" class="edit-modal-form">
        <!-- Working Title Field -->
        <div class="form-group">
          <label class="form-label" for="edit-working-title">
            Tiêu đề dự kiến (tối đa 200 ký tự)
          </label>
          <input
            id="edit-working-title"
            v-model="editForm.workingTitle"
            type="text"
            maxlength="200"
            class="form-input"
            placeholder="Nhập tiêu đề video dự kiến của bạn..."
          />
          <span class="char-counter">{{ (editForm.workingTitle || '').length }}/200</span>
        </div>

        <!-- Priority Field -->
        <div class="form-group">
          <label class="form-label" for="edit-priority">Mức ưu tiên</label>
          <select id="edit-priority" v-model="editForm.priority" class="form-input">
            <option value="low">Thấp</option>
            <option value="normal">Bình thường</option>
            <option value="high">Cao</option>
          </select>
        </div>

        <!-- Notes Field -->
        <div class="form-group">
          <label class="form-label" for="edit-notes">
            Ghi chú sản xuất (tối đa 5000 ký tự)
          </label>
          <textarea
            id="edit-notes"
            v-model="editForm.notes"
            rows="4"
            maxlength="5000"
            class="form-textarea"
            placeholder="Ghi chú về góc quay, dàn ý, tài liệu tham khảo..."
          ></textarea>
          <span class="char-counter">{{ (editForm.notes || '').length }}/5000</span>
        </div>

        <!-- Published URL Field -->
        <div class="form-group">
          <label class="form-label" for="edit-published-url">
            URL video đã xuất bản (tùy chọn)
          </label>
          <input
            id="edit-published-url"
            v-model="editForm.publishedUrl"
            type="url"
            class="form-input"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div v-if="modalError" class="modal-error-box">
          {{ modalError }}
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="showEditModal = false">
          Hủy Bỏ
        </button>
        <button
          class="btn btn-primary"
          :disabled="isSubmittingModal"
          @click="submitEditModal"
        >
          <span v-if="isSubmittingModal" class="spinner-sm"></span>
          <span>{{ isSubmittingModal ? 'Đang lưu...' : 'Lưu Thay Đổi' }}</span>
        </button>
      </template>
    </AppModal>

    <!-- 10. Confirm Delete Modal -->
    <AppModal
      v-model="showDeleteModal"
      title="Xóa Mục Khỏi Tiến Độ Sản Xuất?"
      description="Bạn có chắc chắn muốn xóa mục này khỏi quy trình sản xuất không?"
      max-width="450px"
    >
      <div v-if="deletingItem" class="delete-modal-content">
        <p class="delete-warning-text">
          Thao tác này sẽ xóa vĩnh viễn mục này khỏi Tiến Độ Sản Xuất.
          <strong>Video gốc của đối thủ vẫn được bảo toàn trong hệ thống.</strong>
        </p>
        <div class="delete-target-preview">
          <span class="target-title">{{ deletingItem.workingTitle || deletingItem.sourceVideo?.title || 'Mục sản xuất' }}</span>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="showDeleteModal = false">
          Hủy Bỏ
        </button>
        <button
          class="btn btn-danger"
          :disabled="isSubmittingModal"
          @click="submitDeleteModal"
        >
          <span v-if="isSubmittingModal" class="spinner-sm"></span>
          <span>{{ isSubmittingModal ? 'Đang xóa...' : 'Xác Nhận Xóa' }}</span>
        </button>
      </template>
    </AppModal>

    <!-- 11. Access Key Prompt Modal -->
    <AccessKeyPromptModal
      v-model="showAccessKeyModal"
      :initial-error="accessKeyError"
      @confirmed="onAccessKeyConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';
import {
  productionService,
  setStoredAccessKey,
  getStoredAccessKey,
  AccessKeyRequiredError,
} from '@/services/production-service';
import type {
  ProductionItem,
  ProductionStatus,
  ProductionPriority,
  ProductionFilterState,
  ProductionUpdateInput,
} from '@/types/production';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types/production';

// Active 7 status keys for Kanban columns
const ACTIVE_STATUS_KEYS: ProductionStatus[] = [
  'idea',
  'research',
  'script',
  'thumbnail',
  'production',
  'editing',
  'published',
];

const ALL_STATUS_OPTIONS: ProductionStatus[] = [
  'idea',
  'research',
  'script',
  'thumbnail',
  'production',
  'editing',
  'published',
  'archived',
];

// Responsive check
const isDesktop = ref(window.innerWidth > 900);
function handleResize() {
  isDesktop.value = window.innerWidth > 900;
}

// States
const items = ref<ProductionItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const toastMessage = ref<string | null>(null);

const filterState = ref<ProductionFilterState>({
  status: 'all',
  priority: 'all',
  searchQuery: '',
  sortBy: 'updated_desc',
});

// Edit modal state
const showEditModal = ref(false);
const editingItem = ref<ProductionItem | null>(null);
const editForm = ref<{
  workingTitle: string;
  notes: string;
  priority: ProductionPriority;
  publishedUrl: string;
}>({
  workingTitle: '',
  notes: '',
  priority: 'normal',
  publishedUrl: '',
});

// Delete modal state
const showDeleteModal = ref(false);
const deletingItem = ref<ProductionItem | null>(null);

const isSubmittingModal = ref(false);
const modalError = ref<string | null>(null);

// Access key modal
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
let pendingAction: ((key: string) => Promise<void>) | null = null;

// Lifecycle
onMounted(async () => {
  document.title = 'Tiến Độ Sản Xuất — Bắt Bài Đối Thủ';
  window.addEventListener('resize', handleResize);
  await loadItems();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Computed
const stats = computed(() => productionService.computeSummaryStats(items.value));

const filteredItems = computed(() =>
  productionService.filterAndSortItems(items.value, filterState.value)
);

function countByStatus(status: ProductionStatus): number {
  return items.value.filter(i => i.status === status).length;
}

const archivedCount = computed(() => countByStatus('archived'));
const nonArchivedCount = computed(() => items.value.filter(i => i.status !== 'archived').length);

function getColumnItems(status: ProductionStatus): ProductionItem[] {
  return filteredItems.value.filter(i => i.status === status);
}

// Data loading
async function loadItems() {
  loading.value = true;
  error.value = null;
  try {
    const data = await productionService.fetchProductionItems();
    items.value = data;
  } catch (err: any) {
    error.value = err.message || 'Không thể tải Tiến Độ Sản Xuất.';
  } finally {
    loading.value = false;
  }
}

// Filter reset
function resetFilters() {
  filterState.value = {
    status: 'all',
    priority: 'all',
    searchQuery: '',
    sortBy: 'updated_desc',
  };
}

// Action executor with access key wrapper
async function executeWithAccessKey(action: (key: string) => Promise<void>) {
  error.value = null;
  const key = getStoredAccessKey();
  if (!key) {
    accessKeyError.value = null;
    pendingAction = action;
    showAccessKeyModal.value = true;
    return;
  }

  try {
    await action(key);
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError) {
      accessKeyError.value = err.message;
      pendingAction = action;
      showAccessKeyModal.value = true;
    } else {
      error.value = err.message || 'Thao tác không thành công.';
    }
  }
}

async function onAccessKeyConfirmed(key: string) {
  setStoredAccessKey(key);
  showAccessKeyModal.value = false;
  if (pendingAction) {
    const act = pendingAction;
    pendingAction = null;
    try {
      await act(key);
    } catch (err: any) {
      if (err instanceof AccessKeyRequiredError) {
        accessKeyError.value = err.message;
        pendingAction = act;
        showAccessKeyModal.value = true;
      } else {
        error.value = err.message || 'Thao tác không thành công.';
      }
    }
  }
}

// Quick Status Change
async function onQuickStatusChange(item: ProductionItem, e: Event) {
  const select = e.target as HTMLSelectElement;
  const newStatus = select.value as ProductionStatus;
  if (newStatus === item.status) return;

  await executeWithAccessKey(async (key) => {
    const updated = await productionService.changeProductionStatus(item.id, newStatus, key);
    const idx = items.value.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      items.value[idx] = updated;
    }
    showToast(`Đã chuyển sang "${STATUS_LABELS[newStatus]}"`);
  });
}

// Archive
async function handleArchiveItem(item: ProductionItem) {
  await executeWithAccessKey(async (key) => {
    const updated = await productionService.archiveProductionItem(item.id, key);
    const idx = items.value.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      items.value[idx] = updated;
    }
    showToast('Đã lưu trữ mục sản xuất.');
  });
}

// Restore
async function handleRestoreItem(item: ProductionItem) {
  await executeWithAccessKey(async (key) => {
    const updated = await productionService.restoreProductionItem(item.id, key);
    const idx = items.value.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      items.value[idx] = updated;
    }
    showToast('Đã khôi phục về Ý tưởng.');
  });
}

// Edit Modal
function openEditModal(item: ProductionItem) {
  editingItem.value = item;
  editForm.value = {
    workingTitle: item.workingTitle || '',
    notes: item.notes || '',
    priority: item.priority || 'normal',
    publishedUrl: item.publishedUrl || '',
  };
  modalError.value = null;
  showEditModal.value = true;
}

async function submitEditModal() {
  if (!editingItem.value) return;
  const itemId = editingItem.value.id;

  isSubmittingModal.value = true;
  modalError.value = null;

  await executeWithAccessKey(async (key) => {
    const updateInput: ProductionUpdateInput = {
      id: itemId,
      workingTitle: editForm.value.workingTitle,
      notes: editForm.value.notes,
      priority: editForm.value.priority,
      publishedUrl: editForm.value.publishedUrl,
    };
    const updated = await productionService.updateProductionItem(updateInput, key);
    const idx = items.value.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      items.value[idx] = updated;
    }
    showEditModal.value = false;
    showToast('Đã cập nhật mục sản xuất.');
  });

  isSubmittingModal.value = false;
}

// Delete Modal
function openDeleteModal(item: ProductionItem) {
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function submitDeleteModal() {
  if (!deletingItem.value) return;
  const itemId = deletingItem.value.id;

  isSubmittingModal.value = true;

  await executeWithAccessKey(async (key) => {
    await productionService.deleteProductionItem(itemId, key);
    items.value = items.value.filter(i => i.id !== itemId);
    showDeleteModal.value = false;
    showToast('Đã xóa mục khỏi Tiến Độ Sản Xuất.');
  });

  isSubmittingModal.value = false;
}

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = null;
    }
  }, 2500);
}

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

function onThumbError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60';
}
</script>

<style scoped>
.production-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 60px;
  width: 100%;
  box-sizing: border-box;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.title-icon {
  color: #38bdf8;
}

.page-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* Toast Banner */
.toast-banner {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
  background-color: #10b981;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  font-weight: 500;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Alert Banner */
.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 8px;
  font-size: 14px;
}

.error-banner {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 2px;
}

/* Stats Grid (4 cards) */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-blue { background: rgba(56, 189, 248, 0.12); color: #38bdf8; }
.bg-amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.bg-purple { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
.bg-green { background: rgba(16, 185, 129, 0.12); color: #10b981; }

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-val {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

/* Card General */
.card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  box-sizing: border-box;
  max-width: 100%;
}

/* Toolbar */
.toolbar-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
}

.status-tabs-row {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.status-tabs-row::-webkit-scrollbar {
  display: none;
}

.status-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.status-tab-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.status-tab-btn.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.3);
  font-weight: 600;
}

.tab-count-badge {
  font-size: 11px;
  background: var(--bg-surface);
  padding: 1px 6px;
  border-radius: 10px;
  color: var(--text-tertiary);
}

.status-tab-btn.active .tab-count-badge {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.18);
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-tertiary);
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.search-input:focus {
  border-color: var(--color-primary);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 2px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.filter-select {
  padding: 7px 10px;
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

/* Kanban Board */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(7, minmax(200px, 1fr));
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 16px;
  min-height: 480px;
}

.kanban-column {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  max-height: 80vh;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  border-top-left-radius: 9px;
  border-top-right-radius: 9px;
}

.column-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-idea { background: #f59e0b; }
.dot-research { background: #3b82f6; }
.dot-script { background: #6366f1; }
.dot-thumbnail { background: #ec4899; }
.dot-production { background: #8b5cf6; }
.dot-editing { background: #06b6d4; }
.dot-published { background: #10b981; }

.column-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.column-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  background: var(--bg-base);
  padding: 2px 7px;
  border-radius: 10px;
}

.column-cards-list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
}

.column-empty {
  padding: 30px 10px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  border: 1px dashed var(--border-subtle);
  border-radius: 8px;
}

/* Production Card */
.production-card {
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: border-color 0.15s ease;
}

.production-card:hover {
  border-color: var(--border-hover);
}

.p-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.badges-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.priority-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
}

.priority-high {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.priority-normal {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.priority-low {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.card-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.working-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.text-placeholder {
  color: var(--text-tertiary);
  font-style: italic;
  font-weight: 400;
}

/* Source Video Box */
.source-video-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 8px;
}

.source-video-inner {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.source-thumb {
  width: 56px;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 4px;
  background: var(--bg-base);
  flex-shrink: 0;
}

.source-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.source-channel {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.source-title-link {
  font-size: 12px;
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  line-height: 1.3;
}

.source-title-link:hover {
  color: #38bdf8;
  text-decoration: underline;
}

.source-yt-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
  text-decoration: none;
  margin-top: 2px;
}

.source-yt-link:hover {
  color: var(--text-primary);
}

.source-deleted-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
  font-style: italic;
}

.notes-preview {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
  background: var(--bg-surface);
  padding: 6px 8px;
  border-radius: 4px;
}

.published-url-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.published-link {
  color: #10b981;
  text-decoration: none;
  word-break: break-all;
}

.published-link:hover {
  text-decoration: underline;
}

.status-change-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid var(--border-subtle);
}

.status-change-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.status-select-sm {
  font-size: 11px;
  padding: 3px 6px;
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.p-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
}

.btn-card-action {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  padding: 4px 6px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-card-action:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.text-blue { color: #38bdf8; }
.text-danger { color: #ef4444; }

/* Cards List Grid (Single tab & Mobile) */
.cards-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.full-card {
  padding: 16px;
  gap: 12px;
}

/* Empty States */
.empty-state-card,
.empty-filter-card {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  color: #38bdf8;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 480px;
  margin: 0;
  line-height: 1.5;
}

.empty-filter-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* Skeleton */
.skeleton-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.skeleton-card {
  height: 180px;
  background: var(--bg-surface);
  border-radius: 10px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

/* Edit Modal Form */
.edit-modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input,
.form-textarea {
  padding: 9px 12px;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--color-primary);
}

.char-counter {
  font-size: 11px;
  color: var(--text-tertiary);
  align-self: flex-end;
}

.modal-error-box {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

/* Delete Modal */
.delete-modal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.delete-warning-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.delete-target-preview {
  padding: 10px 14px;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .cards-list-grid {
    grid-template-columns: 1fr;
  }
}
</style>
