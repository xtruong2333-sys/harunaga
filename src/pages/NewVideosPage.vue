<template>
  <div class="new-videos-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">Video Mới Đăng</h1>
        <p class="page-subtitle">
          Theo dõi các video đối thủ vừa xuất bản và tốc độ tăng đang được hệ thống đo.
        </p>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" :disabled="loading" @click="loadData(true)">
          <AppIcon name="refresh" size="16" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </div>
    </header>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <div class="error-content">
        <AppIcon name="alert" size="18" class="error-icon" />
        <span>{{ error }}</span>
      </div>
      <button class="btn btn-secondary btn-sm" @click="loadData(true)">Thử Lại</button>
    </div>

    <!-- Summary Cards -->
    <section class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Video mới</div>
        <div class="summary-value mono">
          <template v-if="loading && !allVideos.length">...</template>
          <template v-else>{{ summary.totalVideos }}</template>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Kênh vừa đăng</div>
        <div class="summary-value mono">
          <template v-if="loading && !allVideos.length">...</template>
          <template v-else>{{ summary.totalChannels }}</template>
        </div>
      </div>
      <div class="summary-card card-rising">
        <div class="summary-label">Video đang tăng</div>
        <div class="summary-value mono">
          <template v-if="loading && !allVideos.length">...</template>
          <template v-else>{{ summary.risingVideos }}</template>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">VPH cao nhất</div>
        <div class="summary-value mono">
          <template v-if="loading && !allVideos.length">...</template>
          <template v-else-if="summary.maxVph !== null">
            {{ summary.maxVph.toLocaleString('vi-VN') }} VPH
          </template>
          <template v-else>—</template>
        </div>
      </div>
    </section>

    <!-- Time Range Selector -->
    <section class="range-selector-section">
      <div class="range-label">Khoảng thời gian:</div>
      <div class="range-buttons">
        <button
          v-for="opt in rangeOptions"
          :key="opt.value"
          class="range-btn"
          :class="{ active: filter.range === opt.value }"
          @click="selectRange(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Filters & Search Bar -->
    <section class="filter-bar">
      <!-- Channel Filter -->
      <div class="filter-group">
        <select
          v-model="filter.channelId"
          class="filter-select"
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
      <div class="filter-group">
        <select
          v-model="filter.status"
          class="filter-select"
          @change="onFilterChange"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="rising">Đang tăng (VPH > 0)</option>
          <option value="not_rising">Không tăng (VPH = 0)</option>
          <option value="unmeasured">Chưa đủ dữ liệu</option>
          <option value="alerted">Đã cảnh báo</option>
        </select>
      </div>

      <!-- Sort -->
      <div class="filter-group">
        <select
          v-model="filter.sort"
          class="filter-select"
          @change="onFilterChange"
        >
          <option value="newest">Mới đăng nhất</option>
          <option value="vph_desc">VPH cao nhất</option>
          <option value="views_desc">Lượt xem cao nhất</option>
          <option value="delta_desc">Tăng nhiều nhất ở lần đo gần nhất</option>
        </select>
      </div>

      <!-- Search Box -->
      <div class="search-box">
        <AppIcon name="search" size="14" class="search-icon" />
        <input
          v-model="filter.search"
          type="text"
          class="search-input"
          placeholder="Tìm theo tiêu đề, tên kênh..."
          @input="onFilterChange"
        />
        <button
          v-if="filter.search"
          class="btn-clear-search"
          @click="filter.search = ''; onFilterChange()"
        >
          ✕
        </button>
      </div>
    </section>

    <!-- Skeleton Loading -->
    <div v-if="loading && !allVideos.length" class="skeleton-list">
      <div v-for="i in 5" :key="i" class="skeleton-card">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-content">
          <div class="skeleton-line w-75"></div>
          <div class="skeleton-line w-50"></div>
          <div class="skeleton-line w-25"></div>
        </div>
        <div class="skeleton-metrics">
          <div class="skeleton-metric-box"></div>
          <div class="skeleton-metric-box"></div>
        </div>
      </div>
    </div>

    <!-- Empty State: No videos in range -->
    <div
      v-else-if="!loading && !allVideos.length && !error"
      class="empty-state"
    >
      <div class="empty-icon-wrap">
        <AppIcon name="clock" size="48" />
      </div>
      <h3 class="empty-title">Chưa có video mới trong khoảng thời gian này.</h3>
      <p class="empty-desc">
        Thử mở rộng khoảng thời gian hoặc kiểm tra lại sau.
      </p>
      <div class="empty-actions">
        <button class="btn btn-secondary" @click="selectRange('7d')">
          Xem 7 ngày qua
        </button>
      </div>
    </div>

    <!-- Empty State: Filters do not match -->
    <div
      v-else-if="!loading && allVideos.length > 0 && !displayedVideos.length"
      class="empty-state"
    >
      <div class="empty-icon-wrap">
        <AppIcon name="search" size="48" />
      </div>
      <h3 class="empty-title">Không tìm thấy video phù hợp với bộ lọc.</h3>
      <p class="empty-desc">
        Thử bỏ bớt điều kiện lọc hoặc từ khóa tìm kiếm.
      </p>
      <div class="empty-actions">
        <button class="btn btn-primary" @click="resetFilters">
          Xóa Bộ Lọc
        </button>
      </div>
    </div>

    <!-- Video List -->
    <section v-else class="video-list">
      <article
        v-for="v in displayedVideos"
        :key="v.id"
        class="video-card"
      >
        <!-- Thumbnail Section -->
        <div class="video-thumb-wrap">
          <router-link :to="'/videos/' + v.id" class="thumb-link">
            <img
              v-if="v.thumbnailUrl"
              :src="v.thumbnailUrl"
              :alt="v.title"
              class="video-thumb-img"
              loading="lazy"
            />
            <div v-else class="thumb-placeholder">
              <AppIcon name="video" size="24" />
            </div>
          </router-link>

          <!-- Fresh Badge (<= 1h or <= 6h) -->
          <span
            v-if="getFreshBadge(v.publishedAt)"
            class="fresh-badge"
            :class="getFreshBadge(v.publishedAt) === 'Vừa đăng' ? 'badge-super-fresh' : 'badge-recent'"
          >
            {{ getFreshBadge(v.publishedAt) }}
          </span>
        </div>

        <!-- Video Info Section -->
        <div class="video-info-wrap">
          <h2 class="video-title">
            <router-link :to="'/videos/' + v.id" class="title-link">
              {{ v.title }}
            </router-link>
          </h2>

          <div class="channel-row">
            <router-link :to="'/kenh-theo-doi/' + v.channelId" class="channel-link">
              <img
                v-if="v.channelAvatarUrl"
                :src="v.channelAvatarUrl"
                :alt="v.channelName"
                class="channel-avatar"
              />
              <span class="channel-name">{{ v.channelName }}</span>
              <span v-if="v.channelHandle" class="channel-handle">({{ v.channelHandle }})</span>
            </router-link>
          </div>

          <div class="timestamps-row">
            <span class="time-item">
              <span class="time-label">Đăng:</span>
              <span class="time-val">{{ formatVideoAge(v.publishedAt) }}</span>
            </span>

            <span v-if="v.firstObservedMinutesAfterPublish !== null" class="time-item observe-time">
              <span class="time-label">Bắt đầu theo dõi:</span>
              <span class="time-val">{{ v.firstObservedMinutesAfterPublish }} phút sau khi đăng</span>
            </span>
          </div>

          <div class="video-actions-row">
            <router-link :to="'/videos/' + v.id" class="action-link-internal">
              Chi tiết video
            </router-link>
            <a
              :href="'https://www.youtube.com/watch?v=' + v.youtubeVideoId"
              target="_blank"
              rel="noopener noreferrer"
              class="action-link-yt"
            >
              <span>Xem YouTube</span>
              <AppIcon name="external" size="12" />
            </a>
          </div>
        </div>

        <!-- Metrics Section -->
        <div class="video-metrics-wrap">
          <!-- Measured VPH -->
          <div class="metric-item vph-metric">
            <div class="metric-label">VPH đo được</div>
            <div
              class="metric-val mono"
              :class="{
                'val-rising': v.latestMeasuredVph !== null && v.latestMeasuredVph > 0,
                'val-unmeasured': v.latestMeasuredVph === null,
                'val-zero': v.latestMeasuredVph === 0
              }"
            >
              {{ formatMeasuredVph(v.latestMeasuredVph) }}
            </div>
          </div>

          <!-- Current Views -->
          <div class="metric-item">
            <div class="metric-label">Lượt xem hiện tại</div>
            <div class="metric-val mono">
              {{ v.latestViewCount !== null ? v.latestViewCount.toLocaleString('vi-VN') : '—' }}
            </div>
          </div>

          <!-- Latest View Delta -->
          <div class="metric-item">
            <div class="metric-label">Tăng ở lần đo gần nhất</div>
            <div
              class="metric-val mono"
              :class="{ 'val-delta-pos': v.latestViewDelta !== null && v.latestViewDelta > 0 }"
            >
              {{ formatViewDelta(v.latestViewDelta) }}
            </div>
          </div>

          <!-- Measurement Timestamp -->
          <div class="metric-item measurement-time">
            <div class="metric-label">Đo lần cuối</div>
            <div class="metric-val-sm">
              {{ v.latestSnapshotCheckedAt ? formatVideoAge(v.latestSnapshotCheckedAt) : 'Chưa có' }}
            </div>
          </div>

          <!-- Alert Status Badge -->
          <div class="metric-item alert-metric">
            <div class="metric-label">Trạng thái cảnh báo</div>
            <span
              class="alert-badge"
              :class="'alert-badge-' + v.alertStatus"
            >
              {{ mapAlertStatus(v.alertStatus) }}
            </span>
          </div>
        </div>
      </article>

      <!-- Load More Button -->
      <div v-if="hasMore && !loading" class="load-more-wrap">
        <button class="btn btn-secondary btn-load-more" @click="loadMore">
          <span>Xem Thêm (+100)</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import {
  newVideosService,
  getFreshBadge,
  formatVideoAge,
  formatMeasuredVph,
  formatViewDelta,
  mapAlertStatus,
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

// Range Options
const rangeOptions: { value: NewVideoRange; label: string }[] = [
  { value: '6h', label: '6 giờ' },
  { value: '12h', label: '12 giờ' },
  { value: '24h', label: '24 giờ' },
  { value: '3d', label: '3 ngày' },
  { value: '7d', label: '7 ngày' },
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

// Summary Cards calculation: reflects the selected time window (+ channel filter if chosen)
const summary = computed<NewVideoSummary>(() => {
  let targetVideos = allVideos.value;
  if (filter.value.channelId) {
    targetVideos = targetVideos.filter(v => v.channelId === filter.value.channelId);
  }
  return newVideosService.computeNewVideoSummary(targetVideos);
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
  filter.value.channelId = null;
  filter.value.status = 'all';
  filter.value.search = '';
  filter.value.sort = 'newest';
  syncUrl();
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
}

onMounted(() => {
  initFromUrl();
  loadData(true);
});

// Watch route query changes (for back/forward navigation)
watch(
  () => route.query,
  newQuery => {
    const parsed = newVideosService.parseUrlParams(newQuery);
    if (parsed.range !== filter.value.range) {
      filter.value.range = parsed.range;
      filter.value.channelId = parsed.channelId;
      filter.value.status = parsed.status;
      filter.value.sort = parsed.sort;
      filter.value.search = parsed.search;
      loadData(true);
    } else {
      filter.value.channelId = parsed.channelId;
      filter.value.status = parsed.status;
      filter.value.sort = parsed.sort;
      filter.value.search = parsed.search;
    }
  }
);
</script>

<style scoped>
.new-videos-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 6px;
}

.page-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 14px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-icon {
  color: #ef4444;
  flex-shrink: 0;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-rising {
  border-color: rgba(56, 189, 248, 0.3);
}

.summary-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
}

.card-rising .summary-value {
  color: #38bdf8;
}

/* Range Selector */
.range-selector-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
}

.range-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.range-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.range-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.range-btn:hover {
  background: #334155;
  color: #f8fafc;
}

.range-btn.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
  font-weight: 600;
}

/* Filter Bar */
.filter-bar {
  display: grid;
  grid-template-columns: 200px 180px 200px 1fr;
  gap: 12px;
  align-items: center;
}

.filter-select {
  width: 100%;
  background: #0f172a;
  border: 1px solid #1e293b;
  color: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: #38bdf8;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #64748b;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: #0f172a;
  border: 1px solid #1e293b;
  color: #f8fafc;
  padding: 8px 32px 8px 36px;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.search-input:focus {
  border-color: #38bdf8;
}

.btn-clear-search {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
}

.btn-clear-search:hover {
  color: #f8fafc;
}

/* Video List */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  grid-template-columns: 220px 1fr 240px;
  gap: 20px;
  align-items: center;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.video-card:hover {
  border-color: #334155;
  background: #111c35;
}

/* Thumbnail */
.video-thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: #020617;
}

.thumb-link {
  display: block;
  width: 100%;
  height: 100%;
}

.video-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.fresh-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-super-fresh {
  background: rgba(16, 185, 129, 0.9);
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.badge-recent {
  background: rgba(56, 189, 248, 0.85);
  color: #0f172a;
}

/* Video Info */
.video-info-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.video-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.title-link {
  color: #f1f5f9;
  text-decoration: none;
  transition: color 0.15s ease;
}

.title-link:hover {
  color: #38bdf8;
}

.channel-row {
  display: flex;
  align-items: center;
}

.channel-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s ease;
}

.channel-link:hover {
  color: #38bdf8;
}

.channel-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
}

.channel-handle {
  color: #64748b;
  font-size: 12px;
}

.timestamps-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.time-item {
  display: flex;
  gap: 6px;
}

.time-label {
  color: #64748b;
}

.time-val {
  color: #94a3b8;
  font-weight: 500;
}

.observe-time .time-val {
  color: #38bdf8;
}

.video-actions-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}

.action-link-internal {
  font-size: 12px;
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
}

.action-link-internal:hover {
  color: #38bdf8;
}

.action-link-yt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ef4444;
  text-decoration: none;
  font-weight: 500;
}

.action-link-yt:hover {
  text-decoration: underline;
}

/* Metrics Section */
.video-metrics-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #090e1a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 12px 14px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.metric-label {
  color: #64748b;
  font-size: 11px;
}

.metric-val {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}

.val-rising {
  color: #38bdf8;
}

.val-zero {
  color: #94a3b8;
}

.val-unmeasured {
  color: #64748b;
  font-weight: 400;
  font-size: 11px;
}

.val-delta-pos {
  color: #34d399;
}

.metric-val-sm {
  font-size: 11px;
  color: #94a3b8;
}

/* Alert Badge */
.alert-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.alert-badge-pending {
  background: rgba(234, 179, 8, 0.15);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.alert-badge-sending {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.alert-badge-sent {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.alert-badge-failed {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.alert-badge-none {
  background: rgba(100, 116, 139, 0.15);
  color: #64748b;
}

/* Load More */
.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.btn-load-more {
  padding: 10px 24px;
  font-size: 14px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  background: #0f172a;
  border: 1px dashed #334155;
  border-radius: 12px;
  gap: 12px;
}

.empty-icon-wrap {
  color: #475569;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
}

.empty-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  max-width: 420px;
}

.empty-actions {
  margin-top: 8px;
}

/* Skeleton Loading */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  grid-template-columns: 220px 1fr 240px;
  gap: 20px;
  align-items: center;
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #1e293b;
  border-radius: 8px;
  animation: pulse 1.5s infinite;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-line {
  height: 14px;
  background: #1e293b;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.w-75 { width: 75%; }
.w-50 { width: 50%; }
.w-25 { width: 25%; }

.skeleton-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-metric-box {
  height: 28px;
  background: #1e293b;
  border-radius: 6px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

/* Shared Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #0284c7;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #0369a1;
}

.btn-secondary {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.btn-secondary:hover:not(:disabled) {
  background: #334155;
  color: #f8fafc;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Responsive - Mobile */
@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    grid-template-columns: 1fr 1fr;
  }

  .search-box {
    grid-column: span 2;
  }

  .video-card,
  .skeleton-card {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .video-thumb-wrap,
  .skeleton-thumb {
    max-width: 100%;
  }

  .video-metrics-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .alert-metric {
    grid-column: span 2;
  }
}
</style>
