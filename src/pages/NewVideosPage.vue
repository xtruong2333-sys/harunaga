<template>
  <div class="new-videos-page">
    <!-- 1. Shared Monitoring Header -->
    <RevealItem :delay="0">
      <MonitoringPageHeader
        eyebrow="TÍN HIỆU XUẤT BẢN"
        title="Video Mới Đăng"
        description="Theo dõi các video đối thủ vừa xuất bản và tốc độ tăng đang được hệ thống đo."
        live-marker="Dữ liệu theo dõi"
      >
        <template #actions>
          <button class="btn btn-refresh" :disabled="loading" @click="loadData(true)">
            <AppIcon name="refresh" size="15" :class="{ 'spin-anim': loading }" />
            <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
          </button>
        </template>
      </MonitoringPageHeader>
    </RevealItem>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <div class="error-content">
        <AppIcon name="alert" size="18" class="error-icon" />
        <span>{{ error }}</span>
      </div>
      <button class="btn btn-secondary btn-sm" @click="loadData(true)">Thử Lại</button>
    </div>

    <!-- 2. Signal Metrics Strip (4 Horizontal Cards) -->
    <RevealItem :delay="60">
      <section class="summary-strip">
        <MetricCard
          label="Video mới"
          :value="summary.totalVideos"
          :loading="loading && !allVideos.length"
          icon="video"
        />
        <MetricCard
          label="Kênh vừa đăng"
          :value="summary.totalChannels"
          :loading="loading && !allVideos.length"
          icon="tv"
        />
        <MetricCard
          label="Video đang tăng"
          :value="summary.risingVideos"
          :loading="loading && !allVideos.length"
          variant="accent"
          icon="trending-up"
        />
        <MetricCard
          label="VPH cao nhất"
          :value="formattedMaxVph"
          :loading="loading && !allVideos.length"
          :focal="true"
          icon="zap"
          subtext="Tốc độ tăng cao nhất"
        />
      </section>
    </RevealItem>

    <!-- 3. Time Range Segmented Control -->
    <RevealItem :delay="120">
      <section class="range-control-bar">
        <span class="range-prefix">Khoảng thời gian:</span>
        <div class="segmented-control" role="tablist">
          <button
            v-for="opt in rangeOptions"
            :key="opt.value"
            role="tab"
            :aria-selected="filter.range === opt.value"
            class="segment-btn"
            :class="{ 'segment-active': filter.range === opt.value }"
            @click="selectRange(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </section>
    </RevealItem>

    <!-- 4. Filter Console (FilterDock) -->
    <RevealItem :delay="180">
      <FilterDock
        title="BỘ ĐIỀU KHIỂN TÍN HIỆU"
        :active-count="activeFilterCount"
      >
        <template #headerActions v-if="activeFilterCount > 0">
          <button class="btn-reset-filters" @click="resetFilters">
            Đặt lại bộ lọc
          </button>
        </template>

        <div class="filter-controls-grid">
          <!-- Search Box (Prominent) -->
          <div class="control-search">
            <AppIcon name="search" size="15" class="search-icon" />
            <input
              v-model="filter.search"
              type="text"
              class="dock-input search-input"
              placeholder="Tìm theo tiêu đề video hoặc tên kênh..."
              @input="onFilterChange"
            />
            <button
              v-if="filter.search"
              class="btn-clear-search"
              title="Xóa tìm kiếm"
              @click="filter.search = ''; onFilterChange()"
            >
              ✕
            </button>
          </div>

          <!-- Channel Dropdown -->
          <div class="control-select-wrap">
            <select
              v-model="filter.channelId"
              class="dock-select"
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

          <!-- Status Dropdown -->
          <div class="control-select-wrap">
            <select
              v-model="filter.status"
              class="dock-select"
              @change="onFilterChange"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="rising">Đang tăng (VPH > 0)</option>
              <option value="not_rising">Không tăng (VPH = 0)</option>
              <option value="unmeasured">Chưa đủ dữ liệu</option>
              <option value="alerted">Đã cảnh báo</option>
            </select>
          </div>

          <!-- Sort Dropdown -->
          <div class="control-select-wrap">
            <select
              v-model="filter.sort"
              class="dock-select"
              @change="onFilterChange"
            >
              <option value="newest">Mới đăng nhất</option>
              <option value="vph_desc">VPH cao nhất</option>
              <option value="views_desc">Lượt xem cao nhất</option>
              <option value="delta_desc">Tăng nhiều nhất ở lần đo gần nhất</option>
            </select>
          </div>
        </div>
      </FilterDock>
    </RevealItem>

    <!-- 5. Content States -->
    <!-- Skeleton Loading -->
    <div v-if="loading && !allVideos.length" class="skeleton-list">
      <div v-for="i in 4" :key="i" class="skeleton-signal-row">
        <div class="skeleton-thumb" />
        <div class="skeleton-info">
          <div class="skeleton-line line-title" />
          <div class="skeleton-line line-meta" />
          <div class="skeleton-line line-tags" />
        </div>
        <div class="skeleton-metrics" />
      </div>
    </div>

    <!-- Empty State: No videos in range -->
    <div
      v-else-if="!loading && !allVideos.length && !error"
      class="empty-state-card"
    >
      <div class="empty-icon-ring">
        <AppIcon name="clock" size="32" />
      </div>
      <h3 class="empty-title">Chưa có video mới trong khoảng thời gian này</h3>
      <p class="empty-desc">
        Hệ thống chưa ghi nhận video đối thủ xuất bản trong khung giờ đã chọn. Bạn có thể mở rộng khung thời gian để xem các tín hiệu trước đó.
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
      class="empty-state-card"
    >
      <div class="empty-icon-ring">
        <AppIcon name="search" size="32" />
      </div>
      <h3 class="empty-title">Không tìm thấy video phù hợp với bộ lọc</h3>
      <p class="empty-desc">
        Không có video nào thỏa mãn điều kiện lọc và từ khóa tìm kiếm hiện tại.
      </p>
      <div class="empty-actions">
        <button class="btn btn-primary" @click="resetFilters">
          Xóa Bộ Lọc
        </button>
      </div>
    </div>

    <!-- 6. Video Signal Rows -->
    <section v-else class="video-signal-list">
      <article
        v-for="v in displayedVideos"
        :key="v.id"
        class="signal-row"
      >
        <!-- Left: Thumbnail 16:9 -->
        <div class="signal-thumb-wrap">
          <router-link :to="'/videos/' + v.id" class="thumb-anchor" title="Xem chi tiết video">
            <img
              v-if="v.thumbnailUrl"
              :src="v.thumbnailUrl"
              :alt="v.title"
              class="signal-thumb-img"
              loading="lazy"
            />
            <div v-else class="thumb-placeholder">
              <AppIcon name="video" size="28" />
            </div>
          </router-link>

          <!-- Fresh Badge Overlay -->
          <span
            v-if="getFreshBadge(v.publishedAt)"
            class="fresh-badge"
            :class="getFreshBadge(v.publishedAt) === 'Vừa đăng' ? 'badge-super-fresh' : 'badge-recent'"
          >
            {{ getFreshBadge(v.publishedAt) }}
          </span>
        </div>

        <!-- Center: Title, Channel, Timing, Actions -->
        <div class="signal-main-info">
          <h2 class="video-title">
            <router-link :to="'/videos/' + v.id" class="title-anchor" :title="v.title">
              {{ v.title }}
            </router-link>
          </h2>

          <div class="channel-line">
            <router-link :to="'/kenh-theo-doi/' + v.channelId" class="channel-anchor">
              <img
                v-if="v.channelAvatarUrl"
                :src="v.channelAvatarUrl"
                :alt="v.channelName"
                class="channel-avatar"
                loading="lazy"
              />
              <span class="channel-name">{{ v.channelName }}</span>
              <span v-if="v.channelHandle" class="channel-handle">({{ v.channelHandle }})</span>
            </router-link>
          </div>

          <div class="time-chips-row">
            <div class="time-chip">
              <span class="chip-label">Đăng:</span>
              <span class="chip-value">{{ formatVideoAge(v.publishedAt) }}</span>
            </div>
            <div v-if="v.firstObservedMinutesAfterPublish !== null" class="time-chip observe-chip">
              <span class="chip-label">Bắt đầu theo dõi:</span>
              <span class="chip-value">{{ v.firstObservedMinutesAfterPublish }} phút sau khi đăng</span>
            </div>
          </div>

          <div class="actions-line">
            <router-link :to="'/videos/' + v.id" class="action-btn-detail">
              <span>Chi tiết video</span>
              <AppIcon name="arrow-right" size="12" />
            </router-link>
            <a
              :href="'https://www.youtube.com/watch?v=' + v.youtubeVideoId"
              target="_blank"
              rel="noopener noreferrer"
              class="action-btn-yt"
              title="Mở trên YouTube"
            >
              <span>Xem YouTube</span>
              <AppIcon name="external" size="12" />
            </a>
          </div>
        </div>

        <!-- Right: Signal Metrics Panel -->
        <div class="signal-metrics-panel">
          <!-- VPH Focal Metric -->
          <div class="metric-block focal-vph-block">
            <div class="block-label">VPH ĐO ĐƯỢC</div>
            <div
              class="block-vph-value mono"
              :class="{
                'vph-rising': v.latestMeasuredVph !== null && v.latestMeasuredVph > 0,
                'vph-zero': v.latestMeasuredVph === 0,
                'vph-unmeasured': v.latestMeasuredVph === null
              }"
            >
              {{ formatMeasuredVph(v.latestMeasuredVph) }}
            </div>
          </div>

          <!-- Secondary Metrics Grid -->
          <div class="secondary-metrics-grid">
            <div class="sec-metric">
              <span class="sec-label">Lượt xem</span>
              <span class="sec-val mono">
                {{ v.latestViewCount !== null ? v.latestViewCount.toLocaleString('vi-VN') : '—' }}
              </span>
            </div>

            <div class="sec-metric">
              <span class="sec-label">Tăng gần nhất</span>
              <span
                class="sec-val mono"
                :class="{ 'delta-pos': v.latestViewDelta !== null && v.latestViewDelta > 0 }"
              >
                {{ formatViewDelta(v.latestViewDelta) }}
              </span>
            </div>

            <div class="sec-metric">
              <span class="sec-label">Đo lần cuối</span>
              <span class="sec-val sec-time">
                {{ v.latestSnapshotCheckedAt ? formatVideoAge(v.latestSnapshotCheckedAt) : 'Chưa có' }}
              </span>
            </div>

            <div class="sec-metric">
              <span class="sec-label">Cảnh báo</span>
              <span class="alert-tag" :class="'alert-tag-' + v.alertStatus">
                {{ mapAlertStatus(v.alertStatus) }}
              </span>
            </div>
          </div>
        </div>
      </article>

      <!-- Load More Button -->
      <div v-if="hasMore && !loading" class="load-more-container">
        <button class="btn-load-more" @click="loadMore">
          <span>Xem Thêm (+100)</span>
          <AppIcon name="chevron-down" size="14" />
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import MonitoringPageHeader from '@/components/ui/MonitoringPageHeader.vue';
import MetricCard from '@/components/ui/MetricCard.vue';
import FilterDock from '@/components/ui/FilterDock.vue';
import RevealItem from '@/components/motion/RevealItem.vue';
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

// Active filters count
const activeFilterCount = computed(() => {
  let count = 0;
  if (filter.value.channelId) count++;
  if (filter.value.status !== 'all') count++;
  if (filter.value.sort !== 'newest') count++;
  if (filter.value.search.trim()) count++;
  return count;
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

// Summary Cards calculation
const summary = computed<NewVideoSummary>(() => {
  let targetVideos = allVideos.value;
  if (filter.value.channelId) {
    targetVideos = targetVideos.filter(v => v.channelId === filter.value.channelId);
  }
  return newVideosService.computeNewVideoSummary(targetVideos);
});

const formattedMaxVph = computed(() => {
  if (summary.value.maxVph !== null && summary.value.maxVph !== undefined) {
    return `${summary.value.maxVph.toLocaleString('vi-VN')} VPH`;
  }
  return '—';
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
</script>

<style scoped>
.new-videos-page {
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

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #fca5a5;
  margin-bottom: 20px;
  font-size: 14px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-icon {
  color: #ef4444;
}

/* 2. Summary Strip */
.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

/* 3. Range Control Bar */
.range-control-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.range-prefix {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.segmented-control {
  display: inline-flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 3px;
  gap: 3px;
  backdrop-filter: blur(8px);
}

.segment-btn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.segment-btn:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.04);
}

.segment-active {
  color: #38bdf8 !important;
  background: rgba(56, 189, 248, 0.12) !important;
  border: 1px solid rgba(56, 189, 248, 0.25);
  box-shadow: 0 0 10px -2px rgba(56, 189, 248, 0.3);
}

/* 4. Filter Console Grid */
.filter-controls-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.2fr;
  gap: 12px;
  align-items: center;
}

.control-search {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
}

.dock-input {
  width: 100%;
  padding: 9px 34px 9px 36px;
  background: rgba(10, 16, 28, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dock-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.btn-clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.btn-clear-search:hover {
  color: #f8fafc;
}

.control-select-wrap {
  width: 100%;
}

.dock-select {
  width: 100%;
  padding: 9px 12px;
  background: rgba(10, 16, 28, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.dock-select:focus {
  border-color: #38bdf8;
}

.btn-reset-filters {
  background: none;
  border: none;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.btn-reset-filters:hover {
  color: #38bdf8;
}

/* 5. Video Signal Row */
.video-signal-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.signal-row {
  display: grid;
  grid-template-columns: 260px 1fr 300px;
  gap: 22px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 16px;
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.signal-row:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.25);
  box-shadow: 0 10px 28px -6px rgba(0, 0, 0, 0.5);
}

/* Thumbnail Section */
.signal-thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.thumb-anchor {
  display: block;
  width: 100%;
  height: 100%;
}

.signal-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.signal-row:hover .signal-thumb-img {
  transform: scale(1.025);
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
  top: 8px;
  left: 8px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
}

.badge-super-fresh {
  background: rgba(239, 68, 68, 0.85);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.badge-recent {
  background: rgba(56, 189, 248, 0.85);
  color: #04101e;
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4);
}

/* Center Info Section */
.signal-main-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.video-title {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.title-anchor {
  color: #f8fafc;
  text-decoration: none;
  transition: color 0.15s ease;
}

.title-anchor:hover {
  color: #38bdf8;
}

.channel-line {
  display: flex;
  align-items: center;
}

.channel-anchor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s ease;
}

.channel-anchor:hover {
  color: #38bdf8;
}

.channel-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.channel-handle {
  color: #64748b;
  font-size: 12px;
}

.time-chips-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.time-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 11px;
}

.chip-label {
  color: #64748b;
  font-weight: 500;
}

.chip-value {
  color: #cbd5e1;
  font-weight: 600;
}

.observe-chip .chip-value {
  color: #38bdf8;
}

.actions-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.action-btn-detail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #38bdf8;
  text-decoration: none;
  padding: 5px 12px;
  border-radius: 6px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  transition: all 0.15s ease;
}

.action-btn-detail:hover {
  background: rgba(56, 189, 248, 0.18);
  border-color: #38bdf8;
}

.action-btn-yt {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #94a3b8;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.action-btn-yt:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.05);
}

/* Right Signal Metrics Panel */
.signal-metrics-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  background: rgba(10, 16, 28, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 14px;
}

.focal-vph-block {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 10px;
}

.block-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-bottom: 4px;
}

.block-vph-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.vph-rising {
  color: #38bdf8;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
}

.vph-zero {
  color: #64748b;
}

.vph-unmeasured {
  color: #94a3b8;
  font-size: 15px;
  font-weight: 600;
}

.secondary-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}

.sec-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sec-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.sec-val {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  font-variant-numeric: tabular-nums;
}

.delta-pos {
  color: #34d399;
}

.sec-time {
  font-size: 11px;
  color: #94a3b8;
}

.alert-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.alert-tag-sent {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.alert-tag-pending,
.alert-tag-sending {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.alert-tag-failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.alert-tag-none {
  background: rgba(148, 163, 184, 0.08);
  color: #64748b;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Load More */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.btn-load-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-load-more:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(56, 189, 248, 0.4);
  color: #38bdf8;
}

/* Empty State Card */
.empty-state-card {
  text-align: center;
  padding: 60px 24px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin: 30px 0;
}

.empty-icon-ring {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  color: #38bdf8;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #94a3b8;
  max-width: 480px;
  margin: 0 auto 20px;
  line-height: 1.5;
}

/* Skeletons */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-signal-row {
  display: grid;
  grid-template-columns: 260px 1fr 300px;
  gap: 22px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 16px;
}

.skeleton-thumb {
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 14px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
}

.line-title { width: 75%; height: 18px; }
.line-meta { width: 40%; }
.line-tags { width: 55%; }

.skeleton-metrics {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

/* Responsive Media Queries */
@media (max-width: 1024px) {
  .summary-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-controls-grid {
    grid-template-columns: 1fr 1fr;
  }

  .signal-row {
    grid-template-columns: 220px 1fr;
    grid-template-rows: auto auto;
  }

  .signal-metrics-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .new-videos-page {
    padding: 16px 16px 40px;
  }

  .summary-strip {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .filter-controls-grid {
    grid-template-columns: 1fr;
  }

  .signal-row {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .signal-thumb-wrap {
    width: 100%;
  }

  .actions-line {
    flex-wrap: wrap;
  }

  .action-btn-detail,
  .action-btn-yt {
    min-height: 44px;
    justify-content: center;
    flex: 1;
  }

  .secondary-metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .signal-row:hover {
    transform: none;
  }
  .signal-thumb-img:hover {
    transform: none;
  }
}
</style>
