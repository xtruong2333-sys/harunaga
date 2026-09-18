<template>
  <div class="publishing-schedule-page">
    <!-- 1. Page Header -->
    <PageHeader
      kicker="PUBLISHING PATTERN INTELLIGENCE"
      title="Lịch Đăng Đối Thủ"
      description="Phân tích thời điểm, nhịp đăng và lịch sử xuất bản video của các kênh đối thủ dựa trên dữ liệu đã thu thập."
    >
      <template #actions>
        <div class="header-action-group">
          <!-- Timezone Badge (Vietnam UTC+7) -->
          <div
            class="timezone-badge"
            title="Tất cả ngày và giờ trong trang này được quy đổi sang múi giờ Việt Nam."
          >
            <AppIcon name="clock" :size="13" />
            <span>Giờ Việt Nam • UTC+7</span>
          </div>

          <!-- Refresh Button -->
          <button
            type="button"
            class="btn btn-secondary refresh-btn"
            :disabled="loading"
            @click="loadData"
          >
            <AppIcon name="refresh" :size="14" :class="{ 'spin-anim': loading }" />
            <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <!-- 2. Error State -->
    <ErrorState
      v-if="error"
      title="Không thể tải lịch đăng đối thủ"
      :message="error"
      :show-retry="true"
      retry-text="Thử Lại"
      @retry="loadData"
    />

    <template v-else>
      <!-- 3. Summary Strip -->
      <PublishingSummaryStrip :summary="summary" :loading="loading && !allVideos.length" />

      <!-- 4. Filter Bar & View Mode Switcher -->
      <div class="controls-row">
        <PublishingFilterBar
          :range="filter.range"
          :channel-id="filter.channelId"
          :weekday="filter.weekday"
          :channels="channelOptions"
          @update:range="onRangeChange"
          @update:channel-id="onChannelChange"
          @update:weekday="onWeekdayChange"
          @reset="resetFilters"
        />

        <div class="view-switcher-wrap">
          <ViewModeSwitcher
            v-model="currentViewMode"
            :modes="PUBLISHING_VIEW_MODES"
            :storage-key="STORAGE_VIEW_MODE_KEY"
            size="md"
          />
        </div>
      </div>

      <!-- 5. Loading Skeleton -->
      <div v-if="loading && !allVideos.length" class="skeleton-container">
        <div class="skeleton-card skeleton-banner"></div>
        <div class="skeleton-card skeleton-matrix"></div>
      </div>

      <!-- 6. Empty State when no videos match filter -->
      <EmptyState
        v-else-if="!loading && filteredVideos.length === 0"
        title="Chưa có dữ liệu lịch đăng"
        description="Không có video phù hợp với bộ lọc hiện tại. Thử mở rộng khoảng thời gian hoặc chọn kênh khác."
        action-text="Xem Tất Cả"
        @action="resetFilters"
      />

      <!-- 7. View Modes Content -->
      <div v-else class="publishing-view-container">
        <!-- MODE 1: CALENDAR (Overview) -->
        <div v-if="currentViewMode === 'calendar'" class="calendar-view-stack">
          <!-- Week Pattern Strip -->
          <PublishingWeekPattern
            :days="weekPatternDays"
            :selected-weekday="filter.weekday"
            @select-weekday="toggleWeekdayFilter"
          />

          <!-- 7x24 Heatmap -->
          <PublishingHeatmap
            :cells="heatmapData.cells"
            :max-count="heatmapData.maxCount"
            :channel-name="activeChannelName"
          />

          <!-- Channel Publishing Rhythm Table -->
          <PublishingChannelRhythm :channels="channelStats" :as-cards="false" />

          <!-- Recent Uploads List -->
          <PublishingRecentTimeline
            :videos="filteredVideos"
            :grouped-by-date="false"
            :limit="20"
          />
        </div>

        <!-- MODE 2: HEATMAP -->
        <div v-else-if="currentViewMode === 'heatmap'" class="heatmap-view-stack">
          <PublishingHeatmap
            :cells="heatmapData.cells"
            :max-count="heatmapData.maxCount"
            :channel-name="activeChannelName"
          />

          <PublishingDistribution
            :weekday-dist="weekdayDist"
            :hourly-dist="hourlyDist"
            :total-videos="filteredVideos.length"
          />
        </div>

        <!-- MODE 3: CHANNELS -->
        <div v-else-if="currentViewMode === 'channels'" class="channels-view-stack">
          <PublishingChannelRhythm :channels="channelStats" :as-cards="true" />
        </div>

        <!-- MODE 4: TIMELINE -->
        <div v-else-if="currentViewMode === 'timeline'" class="timeline-view-stack">
          <PublishingRecentTimeline
            :videos="filteredVideos"
            :grouped-by-date="true"
            :limit="50"
          />
        </div>
      </div>
    </template>
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

import PublishingSummaryStrip from '@/components/publishing-schedule/PublishingSummaryStrip.vue';
import PublishingFilterBar from '@/components/publishing-schedule/PublishingFilterBar.vue';
import PublishingWeekPattern from '@/components/publishing-schedule/PublishingWeekPattern.vue';
import PublishingHeatmap from '@/components/publishing-schedule/PublishingHeatmap.vue';
import PublishingDistribution from '@/components/publishing-schedule/PublishingDistribution.vue';
import PublishingChannelRhythm from '@/components/publishing-schedule/PublishingChannelRhythm.vue';
import PublishingRecentTimeline from '@/components/publishing-schedule/PublishingRecentTimeline.vue';

import { publishingScheduleService } from '@/services/publishing-schedule-service';
import {
  PUBLISHING_VIEW_MODES,
  type PublishingRange,
  type PublishingViewMode,
  type PublishingVideo,
  type PublishingFilter,
  type PublishingScheduleSummary,
  type ChannelPublishingStats,
  type PublishingWeekPatternDay,
} from '@/types/publishing-schedule';

const STORAGE_VIEW_MODE_KEY = 'bbdt_publishing_schedule_view_mode';
const STORAGE_RANGE_KEY = 'bbdt_publishing_range';
const STORAGE_CHANNEL_KEY = 'bbdt_publishing_channel_filter';
const STORAGE_WEEKDAY_KEY = 'bbdt_publishing_weekday_filter';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref<string | null>(null);

// Raw dataset
const allVideos = ref<PublishingVideo[]>([]);
const rangeVideos = ref<PublishingVideo[]>([]);

// View Mode
const currentViewMode = ref<PublishingViewMode>('calendar');

// Filter state
const filter = ref<PublishingFilter>({
  range: '30d',
  channelId: null,
  weekday: null,
});

// Channel options extracted from allVideos
const channelOptions = computed<{ id: string; name: string }[]>(() => {
  const map = new Map<string, string>();
  for (const v of allVideos.value) {
    if (v.channelId && !map.has(v.channelId)) {
      map.set(v.channelId, v.channelName);
    }
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const activeChannelName = computed<string | null>(() => {
  if (!filter.value.channelId) return null;
  const match = channelOptions.value.find(c => c.id === filter.value.channelId);
  return match ? match.name : null;
});

// Filtered videos pipeline: rangeVideos -> channel filter -> weekday filter
const filteredVideos = computed<PublishingVideo[]>(() => {
  let list = rangeVideos.value;

  if (filter.value.channelId) {
    list = list.filter(v => v.channelId === filter.value.channelId);
  }

  if (filter.value.weekday !== null && filter.value.weekday !== undefined) {
    list = list.filter(v => v.vnWeekday === filter.value.weekday);
  }

  return list;
});

// Summary: computed from filteredVideos
const summary = computed<PublishingScheduleSummary>(() => {
  return publishingScheduleService.computeScheduleSummary(
    filteredVideos.value,
    filter.value.range
  );
});

// Heatmap Data (7x24) from filteredVideos
const heatmapData = computed(() => {
  return publishingScheduleService.buildPublishingHeatmap(filteredVideos.value);
});

// Weekday & Hourly Distributions from filteredVideos
const weekdayDist = computed(() => {
  return publishingScheduleService.computeWeekdayDistribution(filteredVideos.value);
});

const hourlyDist = computed(() => {
  return publishingScheduleService.computeHourlyDistribution(filteredVideos.value);
});

// Week pattern strip days from videos in range + channel filter (independent of weekday filter)
const weekPatternDays = computed<PublishingWeekPatternDay[]>(() => {
  let list = rangeVideos.value;
  if (filter.value.channelId) {
    list = list.filter(v => v.channelId === filter.value.channelId);
  }
  return publishingScheduleService.computeWeekPatternStrip(list);
});

// Channel Table Stats: computed from allVideos and rangeVideos
const channelStats = computed<ChannelPublishingStats[]>(() => {
  let allChVideos = allVideos.value;
  let rangeChVideos = rangeVideos.value;

  if (filter.value.channelId) {
    allChVideos = allChVideos.filter(v => v.channelId === filter.value.channelId);
    rangeChVideos = rangeChVideos.filter(v => v.channelId === filter.value.channelId);
  }

  if (filter.value.weekday !== null && filter.value.weekday !== undefined) {
    rangeChVideos = rangeChVideos.filter(v => v.vnWeekday === filter.value.weekday);
  }

  return publishingScheduleService.computeChannelPublishingStats(allChVideos, rangeChVideos);
});

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    // Fetch all monitored channels' videos once for this range (client-side filters for channel/weekday)
    const res = await publishingScheduleService.fetchPublishingSchedule(
      filter.value.range,
      null
    );
    allVideos.value = res.allVideos;
    rangeVideos.value = res.rangeVideos;

    // Validate channel filter against loaded channels
    if (filter.value.channelId) {
      const exists = channelOptions.value.some(c => c.id === filter.value.channelId);
      if (!exists) {
        filter.value.channelId = null;
        persistAndSync();
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Không thể tải Lịch Đăng Đối Thủ.';
  } finally {
    loading.value = false;
  }
}

function onRangeChange(newRange: PublishingRange) {
  if (filter.value.range === newRange) return;
  filter.value.range = newRange;
  persistAndSync();
  loadData();
}

function onChannelChange(newChannelId: string | null) {
  filter.value.channelId = newChannelId;
  persistAndSync();
}

function onWeekdayChange(newWeekday: number | null) {
  filter.value.weekday = newWeekday;
  persistAndSync();
}

function toggleWeekdayFilter(weekday: number) {
  if (filter.value.weekday === weekday) {
    filter.value.weekday = null;
  } else {
    filter.value.weekday = weekday;
  }
  persistAndSync();
}

function resetFilters() {
  filter.value.range = '30d';
  filter.value.channelId = null;
  filter.value.weekday = null;
  persistAndSync();
  loadData();
}

function persistAndSync() {
  // 1. Persistence in localStorage
  try {
    localStorage.setItem(STORAGE_RANGE_KEY, filter.value.range);
    if (filter.value.channelId) {
      localStorage.setItem(STORAGE_CHANNEL_KEY, filter.value.channelId);
    } else {
      localStorage.removeItem(STORAGE_CHANNEL_KEY);
    }
    if (filter.value.weekday !== null) {
      localStorage.setItem(STORAGE_WEEKDAY_KEY, String(filter.value.weekday));
    } else {
      localStorage.removeItem(STORAGE_WEEKDAY_KEY);
    }
  } catch {}

  // 2. Sync to URL query
  const query: Record<string, string> = {};
  if (filter.value.range !== '30d') query.range = filter.value.range;
  if (filter.value.channelId) query.channel = filter.value.channelId;
  if (filter.value.weekday !== null && filter.value.weekday !== undefined) {
    query.weekday = String(filter.value.weekday);
  }

  router.replace({ query }).catch(() => {});
}

function initFromStorageAndUrl() {
  // 1. Read View Mode from localStorage
  try {
    const savedMode = localStorage.getItem(STORAGE_VIEW_MODE_KEY) as PublishingViewMode | null;
    if (savedMode && ['calendar', 'heatmap', 'channels', 'timeline'].includes(savedMode)) {
      currentViewMode.value = savedMode;
    }
  } catch {}

  // 2. Read Range, Channel, Weekday from URL or fallback to localStorage
  const parsed = publishingScheduleService.parseUrlParams(route.query);

  let initialRange = parsed.range;
  let initialChannel = parsed.channelId;
  let initialWeekday = parsed.weekday;

  // Fallback to localStorage if not in URL query
  try {
    if (!route.query.range) {
      const savedRange = localStorage.getItem(STORAGE_RANGE_KEY) as PublishingRange | null;
      if (savedRange && ['7d', '30d', '90d', 'all'].includes(savedRange)) {
        initialRange = savedRange;
      }
    }
    if (!route.query.channel) {
      const savedChannel = localStorage.getItem(STORAGE_CHANNEL_KEY);
      if (savedChannel) initialChannel = savedChannel;
    }
    if (route.query.weekday === undefined) {
      const savedWeekday = localStorage.getItem(STORAGE_WEEKDAY_KEY);
      if (savedWeekday !== null && savedWeekday !== '') {
        const num = parseInt(savedWeekday, 10);
        if (!isNaN(num) && num >= 0 && num <= 6) {
          initialWeekday = num;
        }
      }
    }
  } catch {}

  filter.value.range = initialRange;
  filter.value.channelId = initialChannel;
  filter.value.weekday = initialWeekday;

  persistAndSync();
}

onMounted(() => {
  initFromStorageAndUrl();
  loadData();
});

watch(
  () => route.query,
  newQuery => {
    const parsed = publishingScheduleService.parseUrlParams(newQuery);
    let needRefetch = false;
    if (parsed.range !== filter.value.range) {
      filter.value.range = parsed.range;
      needRefetch = true;
    }
    filter.value.channelId = parsed.channelId;
    filter.value.weekday = parsed.weekday;

    if (needRefetch) {
      loadData();
    }
  }
);
</script>

<style scoped>
.publishing-schedule-page {
  max-width: none;
  margin: 0 auto;
  padding: 24px;
}

.header-action-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.timezone-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #0284c7;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: help;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.controls-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.controls-row :deep(.publishing-filter-bar) {
  flex: 1;
  margin-bottom: 0;
}

.view-switcher-wrap {
  display: flex;
  align-items: center;
}

/* Skeleton Loading */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-card {
  background: #f1f5f9;
  border-radius: 12px;
  animation: pulse-loading 1.5s ease-in-out infinite;
}

.skeleton-banner {
  height: 120px;
}

.skeleton-matrix {
  height: 320px;
}

@keyframes pulse-loading {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.calendar-view-stack,
.heatmap-view-stack,
.channels-view-stack,
.timeline-view-stack {
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }
  .view-switcher-wrap {
    justify-content: flex-end;
  }
}
</style>
