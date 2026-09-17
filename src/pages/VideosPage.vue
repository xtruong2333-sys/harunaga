<template>
  <div class="videos-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">Video Đang Tăng</h1>
        <p class="page-description">
          Theo dõi các video đang có tốc độ tăng trưởng lượt xem cao và vượt ngưỡng cảnh báo.
        </p>
      </div>

      <div class="page-header-actions">
        <button
          class="btn btn-secondary"
          :disabled="loading"
          @click="loadData"
          title="Tải lại dữ liệu mới nhất từ hệ thống"
        >
          <AppIcon name="refresh" size="16" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </div>
    </div>

    <!-- Thông báo lỗi -->
    <div v-if="error" class="error-alert">
      <div class="error-alert-content">
        <AppIcon name="alert" size="18" />
        <span>{{ error }}</span>
      </div>
      <button class="btn btn-secondary btn-sm" @click="loadData">
        <AppIcon name="refresh" size="14" />
        <span>Thử Lại</span>
      </button>
    </div>

    <!-- Thống kê tổng quan -->
    <VideoStatsHeader
      :total-count="stats.totalVideos"
      :rising-count="stats.risingVideos"
      :max-vph="stats.maxVph"
      :alerted-count="stats.alertedVideos"
    />

    <!-- Skeleton Loading -->
    <div v-if="loading && videos.length === 0" class="skeleton-container">
      <div class="skeleton-row" v-for="n in 5" :key="n"></div>
    </div>

    <!-- Nội dung chính -->
    <template v-else>
      <!-- Thanh điều khiển: Tìm kiếm, Lọc tab, Chọn kênh, Sắp xếp, Làm mới -->
      <VideoTableHeader
        v-model:search-query="searchQuery"
        v-model:current-filter="currentFilter"
        v-model:selected-channel-id="selectedChannelId"
        v-model:current-sort="currentSort"
        :channels="channelOptions"
        :counts="filterCounts"
        :loading="loading"
        @refresh="loadData"
      />

      <!-- Trạng thái không có kết quả -->
      <div v-if="filteredAndSortedVideos.length === 0" class="no-results-card">
        <div class="no-results-icon">
          <AppIcon name="video" size="32" />
        </div>
        <div class="no-results-title">Không tìm thấy video nào</div>
        <div class="no-results-text">
          {{ videos.length === 0 ? 'Hệ thống chưa ghi nhận video nào từ các kênh theo dõi.' : 'Không có video nào phù hợp với bộ lọc và điều kiện tìm kiếm hiện tại.' }}
        </div>
        <button
          v-if="videos.length > 0"
          class="btn btn-secondary btn-sm"
          @click="resetFilters"
        >
          Đặt lại bộ lọc
        </button>
      </div>

      <!-- Bảng Desktop (>= 900px) -->
      <VideoDesktopTable
        v-else
        :videos="filteredAndSortedVideos"
      />

      <!-- Danh sách Thẻ Mobile (< 900px) -->
      <VideoMobileList
        v-if="filteredAndSortedVideos.length > 0"
        :videos="filteredAndSortedVideos"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoStatsHeader from '@/features/videos/components/VideoStatsHeader.vue';
import VideoTableHeader from '@/features/videos/components/VideoTableHeader.vue';
import VideoDesktopTable from '@/features/videos/components/VideoDesktopTable.vue';
import VideoMobileList from '@/features/videos/components/VideoMobileList.vue';
import { videoService } from '@/services/video-service';
import {
  VideoListItem,
  VideoStatsSummary,
  VideoSortOption,
  VideoFilterOption,
} from '@/types/video';

// Page Title
document.title = 'Video Đang Tăng — Bắt Bài Đối Thủ';

// State
const videos = ref<VideoListItem[]>([]);
const stats = ref<VideoStatsSummary>({
  totalVideos: 0,
  risingVideos: 0,
  maxVph: null,
  alertedVideos: 0,
});
const loading = ref(false);
const error = ref<string | null>(null);

// Filters & Controls
const searchQuery = ref('');
const currentFilter = ref<VideoFilterOption>('all');
const selectedChannelId = ref('all');
const currentSort = ref<VideoSortOption>('vph_desc');

// Lấy danh sách kênh độc nhất từ các video đã tải
const channelOptions = computed(() => {
  const channelMap = new Map<string, { id: string; name: string }>();
  for (const v of videos.value) {
    if (v.channel?.id && !channelMap.has(v.channel.id)) {
      channelMap.set(v.channel.id, {
        id: v.channel.id,
        name: v.channel.name,
      });
    }
  }
  return Array.from(channelMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
});

// Đếm số lượng video theo từng bộ lọc
const filterCounts = computed(() => {
  const all = videos.value.length;
  const rising = videos.value.filter(v => v.latestMeasuredVph !== null && v.latestMeasuredVph > 0).length;
  const alerted = videos.value.filter(v => v.alert?.status === 'sent').length;
  const unalerted = videos.value.filter(v => !v.alert || v.alert.status !== 'sent').length;
  return { all, rising, alerted, unalerted };
});

// Video đã lọc và sắp xếp
const filteredAndSortedVideos = computed(() => {
  const filtered = videoService.filterVideos(
    videos.value,
    currentFilter.value,
    selectedChannelId.value,
    searchQuery.value
  );
  return videoService.sortVideos(filtered, currentSort.value);
});

// Tải dữ liệu thật từ Supabase (TUYỆT ĐỐI KHÔNG GỌI COLLECTOR)
async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const res = await videoService.fetchTrendingVideos();
    videos.value = res.videos;
    stats.value = res.stats;
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải danh sách video. Vui lòng thử lại sau.';
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  searchQuery.value = '';
  currentFilter.value = 'all';
  selectedChannelId.value = 'all';
  currentSort.value = 'vph_desc';
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.videos-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.page-description {
  font-size: 14px;
  color: var(--text-secondary);
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
}

.skeleton-row {
  height: 64px;
  background-color: var(--bg-surface);
  border-radius: 10px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.no-results-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.no-results-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.no-results-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.no-results-text {
  color: var(--text-secondary);
  font-size: 13px;
  max-width: 440px;
  line-height: 1.5;
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
