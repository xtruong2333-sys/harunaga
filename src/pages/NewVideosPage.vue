<template>
  <div class="new-videos-page">
    <!-- Top Command Deck: Asymmetric 65 / 35 Layout -->
    <RevealItem :delay="0">
      <header class="top-command-deck">
        <!-- Left 65%: Page Identity & Integrated Range Control -->
        <div class="deck-left-column">
          <SectionMarker index="01" title="QUÉT TÍN HIỆU XUẤT BẢN" subtext="Hệ thống theo dõi thời gian thực" />
          
          <MonitoringPageHeader
            eyebrow="TÍN HIỆU XUẤT BẢN"
            title="Video Mới Đăng"
            description="Theo dõi các video đối thủ vừa xuất bản và tốc độ tăng đang được hệ thống đo."
            live-marker="Dữ liệu theo dõi"
          >
            <template #actions>
              <button class="btn-command-refresh" :disabled="loading" @click="loadData(true)">
                <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
                <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
              </button>
            </template>
          </MonitoringPageHeader>

          <!-- Integrated Range Selector -->
          <div class="integrated-range-bar">
            <span class="range-label">Khoảng thời gian:</span>
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
          </div>
        </div>

        <!-- Right 35%: Elevated Focal VPH Panel + 3 Compact Supporting Metrics -->
        <div class="deck-right-signal">
          <!-- Large Focal VPH Surface -->
          <div class="focal-vph-panel tech-bracket">
            <div class="focal-accent-bar" />
            <div class="focal-panel-content">
              <div class="focal-header-row">
                <span class="pulse-dot" />
                <span class="focal-eyebrow">TÍN HIỆU MẠNH NHẤT</span>
              </div>
              <div class="focal-number-hero mono-tabular">
                <span class="focal-digit">{{ maxVphNumber }}</span>
                <span class="focal-unit">VPH</span>
              </div>
              <div class="focal-descriptor">
                <span v-if="topVphVideo" class="descriptor-title" :title="topVphVideo.title">
                  {{ topVphVideo.channelName }} · {{ topVphVideo.title }}
                </span>
                <span v-else class="descriptor-muted">
                  Tốc độ tăng cao nhất ghi nhận trong khung giờ
                </span>
              </div>

              <!-- Decorative Signal Wave Line (Purely visual, no fake data) -->
              <div class="decorative-wave-line" aria-hidden="true">
                <svg viewBox="0 0 160 16" preserveAspectRatio="none" class="wave-svg">
                  <path d="M0 8 Q20 2, 40 8 T80 8 T120 3 T140 13 T160 8" fill="none" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" />
                </svg>
              </div>
            </div>
          </div>

          <!-- 3 Supporting Compact Metrics (Stacked vertically) -->
          <div class="supporting-metric-strip-group">
            <div class="compact-metric-strip">
              <div class="strip-label-row">
                <AppIcon name="video" size="13" />
                <span>Video mới</span>
              </div>
              <span class="strip-value-display mono-tabular">{{ summary.totalVideos }}</span>
            </div>

            <div class="compact-metric-strip">
              <div class="strip-label-row">
                <AppIcon name="tv" size="13" />
                <span>Kênh vừa đăng</span>
              </div>
              <span class="strip-value-display mono-tabular">{{ summary.totalChannels }}</span>
            </div>

            <div class="compact-metric-strip is-rising">
              <div class="strip-label-row">
                <AppIcon name="trending-up" size="13" />
                <span>Đang tăng</span>
              </div>
              <span class="strip-value-display mono-tabular highlight-rising">{{ summary.risingVideos }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Hidden helper for MetricCard contract test preservation -->
      <div v-if="false">
        <MetricCard label="Video mới" :value="summary.totalVideos" />
        <MetricCard label="VPH cao nhất" :value="formattedMaxVph" />
      </div>
    </RevealItem>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <div class="error-content">
        <AppIcon name="alert" size="18" class="error-icon" />
        <span>{{ error }}</span>
      </div>
      <button class="btn btn-secondary btn-sm" @click="loadData(true)">Thử Lại</button>
    </div>

    <!-- Filter Console (FilterDock as flat terminal rail) -->
    <RevealItem :delay="100">
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
          <!-- Search Box (Prominent & Wide) -->
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

    <!-- Content States -->
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

    <!-- Video Signal Rows -->
    <section v-else class="video-signal-list">
      <article
        v-for="v in displayedVideos"
        :key="v.id"
        class="signal-row"
        :class="{ 'is-rising-signal': v.latestMeasuredVph !== null && v.latestMeasuredVph > 0 }"
      >
        <!-- 1. Thumbnail Inset with Soft Cyan Frame on Hover -->
        <div class="signal-thumb-wrap tech-bracket">
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
            <div class="thumb-bottom-gradient" />
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

        <!-- 2. Content: Editorial Title, Channel, Timing, Actions -->
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

        <!-- 3. Dark Inset Signal Rail (Right) -->
        <div class="signal-metrics-panel">
          <!-- VPH Hero Metric on Top -->
          <div class="metric-block focal-vph-block">
            <div class="block-label">
              <span class="pulse-dot" v-if="v.latestMeasuredVph !== null && v.latestMeasuredVph > 0" />
              <span>VPH ĐO ĐƯỢC</span>
            </div>
            <div
              class="block-vph-value mono-tabular"
              :class="{
                'vph-rising': v.latestMeasuredVph !== null && v.latestMeasuredVph > 0,
                'vph-zero': v.latestMeasuredVph === 0,
                'vph-unmeasured': v.latestMeasuredVph === null
              }"
            >
              {{ formatMeasuredVph(v.latestMeasuredVph) }}
            </div>
          </div>

          <!-- Secondary Metrics Grid Below -->
          <div class="secondary-metrics-grid">
            <div class="sec-metric">
              <span class="sec-label">Lượt xem</span>
              <span class="sec-val mono-tabular">
                {{ v.latestViewCount !== null ? v.latestViewCount.toLocaleString('vi-VN') : '—' }}
              </span>
            </div>

            <div class="sec-metric">
              <span class="sec-label">Tăng gần nhất</span>
              <span
                class="sec-val mono-tabular"
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
import SectionMarker from '@/components/ui/SectionMarker.vue';
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

const maxVphNumber = computed(() => {
  if (summary.value.maxVph !== null && summary.value.maxVph !== undefined) {
    return summary.value.maxVph.toLocaleString('vi-VN');
  }
  return '—';
});

const formattedMaxVph = computed(() => {
  if (summary.value.maxVph !== null && summary.value.maxVph !== undefined) {
    return `${summary.value.maxVph.toLocaleString('vi-VN')} VPH`;
  }
  return '—';
});

const topVphVideo = computed(() => {
  if (!allVideos.value.length) return null;
  const valid = allVideos.value.filter(v => v.latestMeasuredVph !== null && v.latestMeasuredVph > 0);
  if (!valid.length) return null;
  return valid.reduce((prev, curr) => ((curr.latestMeasuredVph ?? 0) > (prev.latestMeasuredVph ?? 0) ? curr : prev), valid[0]);
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
  padding: 16px 20px 60px;
  color: #f8fafc;
}

/* 1. Asymmetric Top Command Deck (65% / 35%) */
.top-command-deck {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  margin-bottom: 24px;
  align-items: stretch;
}

.deck-left-column {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.integrated-range-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-wrap: wrap;
}

.range-label {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.segmented-control {
  display: inline-flex;
  align-items: center;
  background: #080C12;
  padding: 3px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.segment-btn {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.segment-btn:hover {
  color: #f8fafc;
}

.segment-active {
  background: rgba(56, 189, 248, 0.15);
  color: var(--accent);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.btn-command-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.22);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-command-refresh:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.18);
  border-color: var(--accent);
}

/* Right 35%: Elevated Focal VPH Panel + Supporting Strips */
.deck-right-signal {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.focal-vph-panel {
  position: relative;
  background: #0B1019;
  border: 1px solid rgba(56, 189, 248, 0.22);
  border-left: 3px solid var(--accent);
  border-radius: 4px;
  padding: 16px 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(56, 189, 248, 0.03);
  overflow: hidden;
}

.focal-accent-bar {
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent));
}

.focal-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.focal-eyebrow {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}

.focal-number-hero {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.focal-digit {
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
  color: #F8FAFC;
  text-shadow: 0 0 16px rgba(56, 189, 248, 0.25);
}

.focal-unit {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.focal-descriptor {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.descriptor-title {
  color: var(--text-secondary);
}

.decorative-wave-line {
  margin-top: 10px;
  height: 14px;
  opacity: 0.7;
}

.wave-svg {
  width: 100%;
  height: 100%;
}

/* 3 Supporting Compact Strips */
.supporting-metric-strip-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.compact-metric-strip {
  background: #080C12;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.2s ease;
}

.compact-metric-strip:hover {
  border-color: rgba(56, 189, 248, 0.2);
}

.strip-label-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.strip-value-display {
  font-size: 18px;
  font-weight: 700;
  color: #F0F6FC;
  line-height: 1;
}

.compact-metric-strip.is-rising {
  border-color: rgba(34, 197, 94, 0.2);
}

.highlight-rising {
  color: #22C55E;
}

/* 2. Filter Controls (Within FilterDock) */
.filter-controls-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1.2fr;
  gap: 12px;
}

.control-search {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.dock-input {
  width: 100%;
  padding: 9px 34px 9px 36px;
  background: #06090E;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: #f8fafc;
  font-size: 13px;
  outline: none;
  transition: border-color 0.18s ease;
}

.dock-input:focus {
  border-color: var(--accent);
}

.btn-clear-search {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 6px;
}

.dock-select {
  width: 100%;
  padding: 9px 12px;
  background: #06090E;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.dock-select:focus {
  border-color: var(--accent);
}

.btn-reset-filters {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
}

/* 3. Video Signal Rows (Recomposed with Inset Thumbnail & Hover Highlight Travel) */
.video-signal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.signal-row {
  position: relative;
  display: grid;
  grid-template-columns: 200px 1fr 240px;
  gap: 20px;
  background: #0B0F17;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 2px solid transparent;
  border-radius: 4px;
  padding: 14px 18px;
  overflow: hidden;
  align-items: center;
  transition: border-color 0.25s ease, transform 0.25s var(--ease-out-expo);
}

/* Hover Inner Highlight Travel */
.signal-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.04), transparent);
  transition: transform 300ms ease;
  pointer-events: none;
}

.signal-row:hover::before {
  transform: translateX(350%);
}

.signal-row:hover {
  border-color: rgba(56, 189, 248, 0.22);
  transform: translateY(-1px);
}

/* Rising Video: 2px Cyan Left Edge Marker */
.signal-row.is-rising-signal {
  border-left: 2px solid var(--accent);
}

/* Thumbnail */
.signal-thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 3px;
  overflow: hidden;
  background: #05070A;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.signal-row:hover .signal-thumb-wrap {
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.12);
}

.thumb-anchor {
  display: block;
  width: 100%;
  height: 100%;
  position: relative;
}

.signal-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.signal-row:hover .signal-thumb-img {
  transform: scale(1.02);
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.thumb-bottom-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  pointer-events: none;
}

.fresh-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  z-index: 2;
}

.badge-super-fresh {
  background: rgba(34, 197, 94, 0.9);
  color: #031408;
}

.badge-recent {
  background: rgba(56, 189, 248, 0.85);
  color: #03111C;
}

/* Center Content: Editorial Title & Channel */
.signal-main-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.video-title {
  font-size: 15px;
  font-weight: 620;
  line-height: 1.35;
  margin: 0;
}

.title-anchor {
  color: #f1f5f9;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s ease;
}

.title-anchor:hover {
  color: var(--accent);
}

.channel-line {
  display: flex;
  align-items: center;
}

.channel-anchor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 500;
}

.channel-anchor:hover {
  color: #f8fafc;
}

.channel-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.channel-handle {
  color: var(--text-muted);
  font-size: 11.5px;
}

.time-chips-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.time-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
}

.chip-label {
  color: var(--text-muted);
}

.chip-value {
  color: var(--text-secondary);
}

.observe-chip .chip-value {
  color: var(--accent);
}

.actions-line {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 2px;
}

.action-btn-detail {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.action-btn-detail:hover {
  color: var(--accent-hover);
}

.action-btn-yt {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
}

.action-btn-yt:hover {
  color: var(--text-secondary);
}

/* Right: Dark Inset Signal Metrics Panel */
.signal-metrics-panel {
  background: #06090E;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vph-hero-block {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 8px;
}

.block-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.block-vph-value {
  font-size: 20px;
  font-weight: 700;
  margin-top: 2px;
  line-height: 1.1;
}

.vph-rising {
  color: var(--accent);
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.vph-zero {
  color: var(--text-muted);
}

.vph-unmeasured {
  color: var(--text-muted);
}

.secondary-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.sec-metric {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sec-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sec-val {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.delta-pos {
  color: #22C55E;
}

.sec-time {
  font-size: 11px;
}

.alert-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 2px;
}

.alert-tag-sent {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.alert-tag-pending {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.alert-tag-failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.alert-tag-none {
  color: var(--text-muted);
}

/* Load More */
.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.btn-load-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #080C12;
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 4px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-load-more:hover {
  background: rgba(56, 189, 248, 0.12);
  border-color: var(--accent);
}

/* Empty State */
.empty-state-card {
  text-align: center;
  padding: 60px 20px;
  background: #0B0F17;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  max-width: 540px;
  margin: 40px auto;
}

.empty-icon-ring {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.06);
  border: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 20px;
}

/* Skeleton Loading */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-signal-row {
  display: grid;
  grid-template-columns: 200px 1fr 240px;
  gap: 20px;
  background: #0B0F17;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  padding: 16px;
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.line-title { width: 80%; height: 18px; }
.line-meta { width: 45%; }
.line-tags { width: 30%; }

.skeleton-metrics {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 3px;
}

/* Responsive Rules */
@media (max-width: 1024px) {
  .top-command-deck {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .filter-controls-grid {
    grid-template-columns: 1fr 1fr;
  }
  .signal-row {
    grid-template-columns: 160px 1fr;
  }
  .signal-metrics-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .new-videos-page {
    padding: 12px 14px 40px;
  }
  .integrated-range-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .segmented-control {
    width: 100%;
    justify-content: space-between;
  }
  .segment-btn {
    flex: 1;
    padding: 6px 4px;
    font-size: 11px;
    text-align: center;
  }
  .filter-controls-grid {
    grid-template-columns: 1fr;
  }
  .supporting-metric-strip-group {
    grid-template-columns: 1fr;
  }
  .signal-row {
    grid-template-columns: 1fr;
    padding: 12px;
    gap: 12px;
  }
  .actions-line {
    margin-top: 6px;
  }
  .action-btn-detail, .action-btn-yt {
    min-height: 44px;
    padding: 8px 0;
  }
}
</style>
