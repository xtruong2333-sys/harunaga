<template>
  <div class="production-page">
    <!-- 1. Page Header -->
    <PageHeader
      kicker="TRUNG TÂM ĐIỀU PHỐI SẢN XUẤT"
      title="Tiến Độ Sản Xuất"
      description="Theo dõi ý tưởng từ video nguồn đến khi nội dung được xuất bản."
      badge="Dữ liệu quy trình thực tế"
      badge-tone="neutral"
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="interactionsLocked"
          title="Tải lại danh sách tiến độ"
          @click="loadItems"
        >
          <AppIcon name="refresh" :size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm mới' }}</span>
        </button>
      </template>
    </PageHeader>

    <!-- 2. Summary Rail -->
    <ProductionSummaryRail :stats="stats" />

    <!-- 3. Toolbar: Search, Filters, Sorters, View Mode Switcher -->
    <ProductionToolbar
      :filter-state="filterState"
      :view-mode="viewMode"
      :non-archived-count="nonArchivedCount"
      :status-counts="statusCounts"
      @update:search-query="filterState.searchQuery = $event"
      @update:status="filterState.status = $event as any"
      @update:priority="filterState.priority = $event as any"
      @update:sort-by="filterState.sortBy = $event as any"
      @update:view-mode="setViewMode"
      @reset="resetFilters"
    />

    <!-- 4. Main Content Area -->
    <main class="production-main-stage">
      <!-- A. Loading Skeleton -->
      <div v-if="loading && items.length === 0" class="production-skeleton-view" aria-label="Đang tải dữ liệu...">
        <div class="skeleton-summary-strip">
          <div v-for="n in 4" :key="n" class="skeleton-card skeleton-box"></div>
        </div>
        <div class="skeleton-board-row">
          <div v-for="n in 4" :key="n" class="skeleton-col skeleton-box"></div>
        </div>
      </div>

      <!-- B. Query Error State -->
      <ErrorState
        v-else-if="error && items.length === 0"
        title="Không thể tải Tiến Độ Sản Xuất"
        :message="error"
        retry-text="Thử lại"
        :show-retry="true"
        @retry="loadItems"
      />

      <!-- C. Real Empty State (Dataset is empty) -->
      <EmptyState
        v-else-if="items.length === 0"
        title="Chưa có nội dung nào trong Tiến Độ Sản Xuất"
        description="Thêm video đối thủ từ Trợ Lý Nội Dung AI hoặc Video Tiềm Năng để bắt đầu quy trình sáng tạo độc lập."
        action-text="Xem Video Tiềm Năng"
        @action="navigateToOpportunities"
      />

      <!-- D. Filter Mismatch Empty State -->
      <EmptyState
        v-else-if="filteredItems.length === 0"
        title="Không tìm thấy mục phù hợp với bộ lọc"
        description="Không có nội dung nào khớp với tiêu chí tìm kiếm hoặc trạng thái đã chọn."
        action-text="Đặt lại bộ lọc"
        @action="resetFilters"
      />

      <!-- E. Active Board View -->
      <ProductionBoard
        v-else-if="viewMode === 'board'"
        :items="filteredItems"
        :selected-status="filterState.status"
        :busy-item-ids="busyItemIds"
        :any-mutation-busy="interactionsLocked"
        :interactions-locked="interactionsLocked"
        @change-status="handleChangeStatus"
        @edit="openEditModal"
        @archive="handleArchive"
        @restore="handleRestore"
        @delete="openDeleteModal"
      />

      <!-- F. Active List View -->
      <ProductionList
        v-else
        :items="filteredItems"
        :busy-item-ids="busyItemIds"
        :any-mutation-busy="interactionsLocked"
        :interactions-locked="interactionsLocked"
        @change-status="handleChangeStatus"
        @edit="openEditModal"
        @archive="handleArchive"
        @restore="handleRestore"
        @delete="openDeleteModal"
      />
    </main>

    <!-- 5. Edit Modal -->
    <ProductionEditModal
      v-model="showEditModal"
      :item="editingItem"
      :is-saving="isSavingEdit"
      :modal-error="editModalError"
      @save="handleSaveEdit"
    />

    <!-- 6. Delete Confirmation Modal -->
    <ProductionDeleteModal
      v-model="showDeleteModal"
      :item="deletingItem"
      :is-deleting="isDeleting"
      @confirm="handleConfirmDelete"
    />

    <!-- 7. Access Key Prompt Modal -->
    <AccessKeyPromptModal
      :model-value="showAccessKeyModal"
      :initial-error="accessKeyError"
      @update:model-value="handleAccessModalChange"
      @confirmed="onAccessKeyConfirmed"
    />

    <!-- 8. Unified Toast Banner -->
    <div
      v-if="toast"
      class="production-toast-banner"
      :class="`toast-${toast.type}`"
      role="status"
      aria-live="polite"
    >
      <AppIcon :name="toast.type === 'success' ? 'check' : 'alert'" :size="16" />
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';
import ProductionSummaryRail from '@/components/production/ProductionSummaryRail.vue';
import ProductionToolbar from '@/components/production/ProductionToolbar.vue';
import ProductionBoard from '@/components/production/ProductionBoard.vue';
import ProductionList from '@/components/production/ProductionList.vue';
import ProductionEditModal from '@/components/production/ProductionEditModal.vue';
import ProductionDeleteModal from '@/components/production/ProductionDeleteModal.vue';

import {
  productionService,
  getStoredAccessKey,
  setStoredAccessKey,
  AccessKeyRequiredError,
} from '@/services/production-service';
import type {
  ProductionItem,
  ProductionFilterState,
  ProductionStatus,
  ProductionViewMode,
  ProductionUpdateInput,
} from '@/types/production';
import { STATUS_LABELS, PRODUCTION_VIEW_MODE_STORAGE_KEY } from '@/types/production';

const router = useRouter();

// State
const items = ref<ProductionItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Per-item busy tracking & mutation guard
const busyItemIds = ref<Set<string>>(new Set());
const isAnyMutationBusy = computed(() => busyItemIds.value.size > 0);

// Unified interactions locking state
const interactionsLocked = computed(() => {
  return (
    loading.value ||
    isAnyMutationBusy.value ||
    showAccessKeyModal.value ||
    pendingAction !== null
  );
});

// Load request ID to protect against async race conditions
let loadRequestId = 0;

// View Mode with localStorage persistence
function getSafeViewMode(): ProductionViewMode {
  try {
    const saved = localStorage.getItem(PRODUCTION_VIEW_MODE_STORAGE_KEY);
    if (saved === 'board' || saved === 'list') {
      return saved;
    }
  } catch (e) {
    console.warn('Cannot read view mode from localStorage:', e);
  }
  return 'board';
}

const viewMode = ref<ProductionViewMode>(getSafeViewMode());

function setViewMode(mode: ProductionViewMode) {
  const safeMode: ProductionViewMode = mode === 'list' ? 'list' : 'board';
  viewMode.value = safeMode;
  try {
    localStorage.setItem(PRODUCTION_VIEW_MODE_STORAGE_KEY, safeMode);
  } catch (e) {
    console.warn('Cannot write view mode to localStorage:', e);
  }
}

// Filter and sort state
const filterState = ref<ProductionFilterState>({
  status: 'all',
  priority: 'all',
  searchQuery: '',
  sortBy: 'updated_desc',
});

function resetFilters() {
  filterState.value = {
    status: 'all',
    priority: 'all',
    searchQuery: '',
    sortBy: 'updated_desc',
  };
}

// Computed stats and counts
const stats = computed(() => {
  return productionService.computeSummaryStats(items.value);
});

const nonArchivedCount = computed(() => {
  return items.value.filter(i => i.status !== 'archived').length;
});

const statusCounts = computed(() => {
  const map: Record<ProductionStatus, number> = {
    idea: 0,
    research: 0,
    script: 0,
    thumbnail: 0,
    production: 0,
    editing: 0,
    published: 0,
    archived: 0,
  };
  for (const item of items.value) {
    if (map[item.status] !== undefined) {
      map[item.status]++;
    }
  }
  return map;
});

const filteredItems = computed(() => {
  return productionService.filterAndSortItems(items.value, filterState.value);
});

// Toast notification state
type ToastType = 'success' | 'error';
const toast = ref<{ message: string; type: ToastType } | null>(null);
let toastTimeout: any = null;

function showToast(message: string, type: ToastType = 'success') {
  if (toastTimeout) clearTimeout(toastTimeout);
  toast.value = { message, type };
  toastTimeout = setTimeout(() => {
    toast.value = null;
  }, 2800);
}

// Access key modal state & hardened pending action
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
let pendingAction: ((key: string) => Promise<void>) | null = null;

function handleAccessModalChange(isOpen: boolean) {
  showAccessKeyModal.value = isOpen;
  if (!isOpen) {
    pendingAction = null;
    accessKeyError.value = null;
  }
}

async function executeWithAccessKey(
  action: (key: string) => Promise<void>,
  itemIdsToBusy?: string[],
  onNonAuthError?: (err: Error) => void
) {
  // Prevent duplicate execution if loading or modal already has pending action
  if (loading.value || (showAccessKeyModal.value && pendingAction !== null)) return;

  // Invalidate any pending load requests so a late refresh response does NOT overwrite mutation result
  ++loadRequestId;

  // Mark items as busy
  itemIdsToBusy?.forEach(id => busyItemIds.value.add(id));

  const key = getStoredAccessKey();
  if (!key) {
    pendingAction = async (_k: string) => {
      await executeWithAccessKey(action, itemIdsToBusy, onNonAuthError);
    };
    accessKeyError.value = null;
    showAccessKeyModal.value = true;
    // Release busy flag while waiting for user interaction in modal
    itemIdsToBusy?.forEach(id => busyItemIds.value.delete(id));
    return;
  }

  try {
    await action(key);
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError) {
      accessKeyError.value = err.message;
      pendingAction = async (_k: string) => {
        await executeWithAccessKey(action, itemIdsToBusy, onNonAuthError);
      };
      showAccessKeyModal.value = true;
    } else {
      if (onNonAuthError) {
        onNonAuthError(err);
      } else {
        showToast(err.message || 'Thao tác không thành công.', 'error');
      }
    }
  } finally {
    itemIdsToBusy?.forEach(id => busyItemIds.value.delete(id));
  }
}

async function onAccessKeyConfirmed(key: string) {
  setStoredAccessKey(key);
  showAccessKeyModal.value = false;
  accessKeyError.value = null;
  if (pendingAction) {
    const act = pendingAction;
    pendingAction = null;
    await act(key);
  }
}

// Fetch items with async race protection
async function loadItems() {
  if (isAnyMutationBusy.value || showAccessKeyModal.value || pendingAction !== null) return;
  const currentReqId = ++loadRequestId;
  loading.value = true;
  error.value = null;

  try {
    const data = await productionService.fetchProductionItems();
    if (currentReqId !== loadRequestId) return; // Stale fetch response ignored
    items.value = data;
  } catch (err: any) {
    if (currentReqId !== loadRequestId) return;
    error.value = err.message || 'Không thể tải Tiến Độ Sản Xuất.';
  } finally {
    if (currentReqId === loadRequestId) {
      loading.value = false;
    }
  }
}

// Action Handlers
async function handleChangeStatus({ id, status }: { id: string; status: ProductionStatus }) {
  if (interactionsLocked.value) return;
  const target = items.value.find(i => i.id === id);
  if (!target || target.status === status) return;

  await executeWithAccessKey(
    async (key) => {
      const updated = await productionService.changeProductionStatus(id, status, key);
      const idx = items.value.findIndex(i => i.id === id);
      if (idx !== -1) {
        items.value[idx] = updated;
      }
      showToast(`Đã chuyển sang ${STATUS_LABELS[status]}.`, 'success');
    },
    [id]
  );
}

async function handleArchive(id: string) {
  if (interactionsLocked.value) return;
  await executeWithAccessKey(
    async (key) => {
      const updated = await productionService.archiveProductionItem(id, key);
      const idx = items.value.findIndex(i => i.id === id);
      if (idx !== -1) {
        items.value[idx] = updated;
      }
      showToast('Đã chuyển mục vào danh sách lưu trữ.', 'success');
    },
    [id]
  );
}

async function handleRestore(id: string) {
  if (interactionsLocked.value) return;
  await executeWithAccessKey(
    async (key) => {
      const updated = await productionService.restoreProductionItem(id, key);
      const idx = items.value.findIndex(i => i.id === id);
      if (idx !== -1) {
        items.value[idx] = updated;
      }
      showToast('Đã khôi phục về Ý tưởng.', 'success');
    },
    [id]
  );
}

// Edit Modal
const showEditModal = ref(false);
const editingItem = ref<ProductionItem | null>(null);
const isSavingEdit = ref(false);
const editModalError = ref<string | null>(null);

function openEditModal(item: ProductionItem) {
  if (interactionsLocked.value) return;
  editingItem.value = item;
  editModalError.value = null;
  showEditModal.value = true;
}

async function handleSaveEdit(updateInput: ProductionUpdateInput) {
  if (loading.value || (showAccessKeyModal.value && pendingAction !== null)) return;
  editModalError.value = null;
  isSavingEdit.value = true;

  await executeWithAccessKey(
    async (key) => {
      const updated = await productionService.updateProductionItem(updateInput, key);
      const idx = items.value.findIndex(i => i.id === updateInput.id);
      if (idx !== -1) {
        items.value[idx] = updated;
      }
      showEditModal.value = false;
      editingItem.value = null;
      showToast('Đã lưu thay đổi mục sản xuất.', 'success');
    },
    [updateInput.id],
    (err) => {
      // Non-auth validation error remains inside modal!
      editModalError.value = err.message || 'Không thể lưu thay đổi.';
    }
  );

  isSavingEdit.value = false;
}

// Delete Modal
const showDeleteModal = ref(false);
const deletingItem = ref<ProductionItem | null>(null);
const isDeleting = ref(false);

function openDeleteModal(item: ProductionItem) {
  if (interactionsLocked.value) return;
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function handleConfirmDelete() {
  if (!deletingItem.value || loading.value || (showAccessKeyModal.value && pendingAction !== null)) return;
  const id = deletingItem.value.id;
  isDeleting.value = true;

  await executeWithAccessKey(
    async (key) => {
      await productionService.deleteProductionItem(id, key);
      // Remove item only after server succeeds!
      items.value = items.value.filter(i => i.id !== id);
      showDeleteModal.value = false;
      deletingItem.value = null;
      showToast('Đã xóa mục khỏi Tiến Độ Sản Xuất.', 'success');
    },
    [id]
  );

  isDeleting.value = false;
}

function navigateToOpportunities() {
  router.push('/video-tiem-nang');
}

onMounted(() => {
  document.title = 'Tiến Độ Sản Xuất — Bắt Bài Đối Thủ';
  loadItems();
});
</script>

<style scoped>
.production-page {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 0 0 40px;
}

.production-main-stage {
  min-height: 480px;
}

.production-skeleton-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-box {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-summary-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.skeleton-card {
  height: 80px;
}

.skeleton-board-row {
  display: flex;
  gap: 16px;
  overflow: hidden;
}

.skeleton-col {
  width: 320px;
  height: 500px;
  flex-shrink: 0;
}

.production-toast-banner {
  position: fixed;
  bottom: 28px;
  right: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(15, 31, 53, 0.15);
  z-index: 100;
  animation: toast-slide-up 0.22s ease-out;
}

@keyframes toast-slide-up {
  from {
    transform: translateY(14px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast-success {
  background: #065f46;
  color: #ffffff;
  border: 1px solid #047857;
}

.toast-error {
  background: #991b1b;
  color: #ffffff;
  border: 1px solid #b91c1c;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-box {
    animation: none !important;
  }
  .production-toast-banner {
    animation: none !important;
  }
  .spin-anim {
    animation: none !important;
  }
}
</style>
