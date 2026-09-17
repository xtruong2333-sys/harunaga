<template>
  <div class="videos-page">
    <!-- 1. Shared Monitoring Header -->
    <RevealItem :delay="0">
      <MonitoringPageHeader
        eyebrow="TỐC ĐỘ TĂNG"
        title="Video Đang Tăng"
        description="Theo dõi các video đang có tốc độ tăng trưởng lượt xem cao và vượt ngưỡng cảnh báo."
        live-marker="Bảng tín hiệu tăng"
      >
        <template #actions>
          <button
            class="btn btn-refresh"
            :disabled="loading"
            @click="loadData"
            title="Tải lại dữ liệu mới nhất từ hệ thống"
          >
            <AppIcon name="refresh" size="15" :class="{ 'spin-anim': loading }" />
            <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
          </button>
        </template>
      </MonitoringPageHeader>
    </RevealItem>

    <!-- Error Alert -->
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

    <!-- 2. Signal Stats Strip -->
    <RevealItem :delay="60">
      <VideoStatsHeader
        :total-count="stats.totalVideos"
        :rising-count="stats.risingVideos"
        :max-vph="stats.maxVph"
        :alerted-count="stats.alertedVideos"
      />
    </RevealItem>

    <!-- Skeleton Loading -->
    <div v-if="loading && videos.length === 0" class="skeleton-container">
      <div class="skeleton-row" v-for="n in 5" :key="n" />
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- 3. Command & Filter Deck -->
      <RevealItem :delay="120">
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
      </RevealItem>

      <!-- Empty Results State -->
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

      <!-- 4. Desktop Table (>= 900px) -->
      <RevealItem :delay="180" v-else>
        <VideoDesktopTable :videos="filteredAndSortedVideos" />
      </RevealItem>

      <!-- 5. Mobile List (< 900px) -->
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
import MonitoringPageHeader from '@/components/ui/MonitoringPageHeader.vue';
import RevealItem from '@/components/motion/RevealItem.vue';
import VideoStatsHeader from '@/features/videos/components/VideoStatsHeader.vue';
import VideoTableHeader from '@/features/videos/components/VideoTableHeader.vue';
import VideoDesktopTable from '@/features/videos/components/VideoDesktopTable.vue';
import VideoMobileList from '@/features/videos/components/VideoMobileList.vue';
import { videoService } from '@/services/video-service';
import type {
  VideoListItem,
  VideoSortOption,
  VideoFilterOption,
  VideoStatsSummary,
} from '@/types/video';

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

// Controls State
const searchQuery = ref('');
const currentFilter = ref<VideoFilterOption>('all');
const selectedChannelId = ref('all');
const currentSort = ref<VideoSortOption>('vph_desc');

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

// Filter counts for tabs
const filterCounts = computed(() => {
  let all = 0;
  let rising = 0;
  let alerted = 0;
  let unalerted = 0;
  for (const v of videos.value) {
    all++;
    if (v.latestMeasuredVph !== null && v.latestMeasuredVph > 0) rising++;
    if (v.alert && v.alert.status === 'sent') alerted++;
    else unalerted++;
  }
  return { all, rising, alerted, unalerted };
});

// Filter & Sort Pipeline
const filteredAndSortedVideos = computed(() => {
  const filtered = videoService.filterVideos(
    videos.value,
    currentFilter.value,
    selectedChannelId.value,
    searchQuery.value
  );
  return videoService.sortVideos(filtered, currentSort.value);
});

// Reset filters
function resetFilters() {
  searchQuery.value = '';
  currentFilter.value = 'all';
  selectedChannelId.value = 'all';
  currentSort.value = 'vph_desc';
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
.videos-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 28px 60px;
  color: #f8fafc;
}

/* Refresh Button */
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.28);
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
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

/* Error Alert */
.error-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #fca5a5;
  margin-bottom: 24px;
}

.error-alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Skeleton Loading */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.skeleton-row {
  height: 64px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  animation: pulse-skel 1.5s infinite;
}

@keyframes pulse-skel {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* Empty State Card */
.no-results-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  text-align: center;
  margin: 30px 0;
}

.no-results-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  margin-bottom: 16px;
}

.no-results-title {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 6px;
}

.no-results-text {
  font-size: 14px;
  color: #94a3b8;
  max-width: 480px;
  line-height: 1.5;
  margin-bottom: 18px;
}

@media (max-width: 900px) {
  :deep(.table-surface-card) {
    display: none;
  }
}

@media (max-width: 640px) {
  .videos-page {
    padding: 16px 16px 40px;
  }
}
</style>
