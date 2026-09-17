<template>
  <div class="publishing-schedule-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">Lịch Đăng Của Đối Thủ</h1>
        <p class="page-subtitle">
          Quan sát thời điểm và tần suất đăng video của các kênh dựa trên lịch sử đã thu thập.
        </p>
        <div class="timezone-badge">
          <AppIcon name="clock" size="13" />
          <span>Múi giờ hiển thị: Việt Nam (UTC+7)</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" :disabled="loading" @click="loadData">
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
      <button class="btn btn-secondary btn-sm" @click="loadData">Thử Lại</button>
    </div>

    <!-- Summary Cards -->
    <section class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Video trong khoảng</div>
        <div class="summary-value mono">
          <template v-if="loading && !allVideos.length">...</template>
          <template v-else>{{ summary.totalVideos }}</template>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Kênh có đăng video</div>
        <div class="summary-value mono">
          <template v-if="loading && !allVideos.length">...</template>
          <template v-else>{{ summary.totalChannels }}</template>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Trung bình video / ngày</div>
        <div class="summary-value mono">
          <template v-if="loading && !allVideos.length">...</template>
          <template v-else-if="summary.avgVideosPerDay !== null">
            {{ summary.avgVideosPerDay.toLocaleString('vi-VN') }}
          </template>
          <template v-else>—</template>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Video đăng gần nhất</div>
        <div class="summary-value">
          <template v-if="loading && !allVideos.length">...</template>
          <template v-else-if="summary.latestPublishedAt">
            {{ publishingScheduleService.formatRelativeTime(summary.latestPublishedAt) }}
          </template>
          <template v-else>—</template>
        </div>
      </div>
    </section>

    <!-- Filter Bar -->
    <section class="filter-section">
      <!-- Date Range Selector -->
      <div class="range-group">
        <span class="filter-label">Khoảng thời gian:</span>
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
      </div>

      <!-- Channel Dropdown -->
      <div class="channel-group">
        <span class="filter-label">Kênh:</span>
        <select
          v-model="filter.channelId"
          class="channel-select"
          @change="onChannelChange"
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
    </section>

    <!-- Skeleton Loading -->
    <div v-if="loading && !allVideos.length" class="skeleton-container">
      <div class="skeleton-box h-200"></div>
      <div class="skeleton-box h-200"></div>
      <div class="skeleton-box h-250"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && !rangeVideos.length && !error" class="empty-state">
      <div class="empty-icon-wrap">
        <AppIcon name="calendar" size="48" />
      </div>
      <h3 class="empty-title">Chưa có dữ liệu lịch đăng trong khoảng thời gian này.</h3>
      <p class="empty-desc">
        Thử mở rộng khoảng thời gian hoặc chọn kênh khác để phân tích.
      </p>
      <div class="empty-actions">
        <button class="btn btn-secondary" @click="selectRange('all')">
          Xem Tất Cả
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="content-container">
      <!-- SECTION 1: HEATMAP -->
      <section class="section-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">Phân Bố Ngày & Giờ Đăng</h2>
            <p class="section-desc">
              Ma trận tần suất xuất bản video theo 7 ngày trong tuần và 24 giờ trong ngày (giờ Việt Nam).
            </p>
          </div>
          <div class="heatmap-legend">
            <span class="legend-text">Ít</span>
            <span class="legend-cell level-0"></span>
            <span class="legend-cell level-1"></span>
            <span class="legend-cell level-2"></span>
            <span class="legend-cell level-3"></span>
            <span class="legend-cell level-4"></span>
            <span class="legend-text">Nhiều</span>
          </div>
        </div>

        <div class="heatmap-scroll-wrap">
          <div class="heatmap-table">
            <!-- Header Row: Hours 00 to 23 -->
            <div class="heatmap-row header-row">
              <div class="heatmap-cell weekday-header">Thứ</div>
              <div
                v-for="h in 24"
                :key="'h-' + (h - 1)"
                class="heatmap-cell hour-header mono"
              >
                {{ (h - 1) < 10 ? '0' + (h - 1) : (h - 1) }}
              </div>
            </div>

            <!-- 7 Weekday Rows -->
            <div
              v-for="(row, wIdx) in heatmapData.cells"
              :key="'w-' + wIdx"
              class="heatmap-row"
            >
              <div class="heatmap-cell weekday-col">
                {{ publishingScheduleService.WEEKDAY_NAMES[wIdx] }}
              </div>
              <div
                v-for="cell in row"
                :key="'cell-' + cell.weekday + '-' + cell.hour"
                class="heatmap-cell data-cell"
                :class="getCellClass(cell.count, heatmapData.maxCount)"
                :title="`${cell.weekdayName}, ${formatHourRange(cell.hour)}: ${cell.count} video`"
              >
                <span class="cell-count" v-if="cell.count > 0">{{ cell.count }}</span>
                <span class="cell-zero" v-else>·</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 2: FACTUAL PEAKS & DISTRIBUTIONS -->
      <section class="distribution-grid">
        <!-- Weekday Distribution -->
        <div class="section-card">
          <div class="section-header-compact">
            <h3 class="section-title-sm">Video Theo Ngày Trong Tuần</h3>
            <div class="peak-note">
              <span class="peak-label">Nhiều nhất:</span>
              <span class="peak-val">{{ peakWeekdayText }}</span>
            </div>
          </div>

          <div class="bars-list">
            <div
              v-for="item in weekdayDist"
              :key="item.label"
              class="bar-row"
            >
              <span class="bar-label">{{ item.label }}</span>
              <div class="bar-track">
                <div
                  class="bar-fill bar-fill-weekday"
                  :style="{ width: item.percentage + '%' }"
                ></div>
              </div>
              <span class="bar-stat mono">
                {{ item.count }} <small>({{ item.percentage }}%)</small>
              </span>
            </div>
          </div>
        </div>

        <!-- Hourly Distribution -->
        <div class="section-card">
          <div class="section-header-compact">
            <h3 class="section-title-sm">Video Theo Giờ (00–23h)</h3>
            <div class="peak-note">
              <span class="peak-label">Nhiều nhất:</span>
              <span class="peak-val">{{ peakHourText }}</span>
            </div>
          </div>

          <div class="hourly-bars-scroll">
            <div class="hourly-chart">
              <div
                v-for="item in hourlyDist"
                :key="item.label"
                class="hourly-col"
                :title="`${item.label}: ${item.count} video (${item.percentage}%)`"
              >
                <div class="hourly-bar-wrap">
                  <div
                    class="hourly-bar-fill"
                    :style="{ height: (maxHourlyCount > 0 ? (item.count / maxHourlyCount) * 100 : 0) + '%' }"
                  ></div>
                </div>
                <span class="hourly-count mono" v-if="item.count > 0">{{ item.count }}</span>
                <span class="hourly-count text-muted" v-else>0</span>
                <span class="hourly-label mono">{{ item.label.slice(0, 2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 3: CHANNEL PUBLISHING TABLE -->
      <section class="section-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">Nhịp Đăng Theo Kênh</h2>
            <p class="section-desc">
              Khoảng cách trung bình và trung vị giữa các lần xuất bản video của từng đối thủ.
            </p>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div class="table-responsive desktop-table">
          <table class="channel-table">
            <thead>
              <tr>
                <th>Kênh</th>
                <th class="text-right">Trong khoảng</th>
                <th class="text-right">7 ngày</th>
                <th class="text-right">30 ngày</th>
                <th>Đăng gần nhất</th>
                <th>Khoảng cách TB</th>
                <th>Khoảng cách trung vị</th>
                <th>Thường đăng nhất</th>
                <th>Giờ thường xuất hiện</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ch in channelStats" :key="ch.channelId">
                <td>
                  <router-link :to="'/kenh-theo-doi/' + ch.channelId" class="channel-name-link">
                    <img
                      v-if="ch.channelAvatarUrl"
                      :src="ch.channelAvatarUrl"
                      :alt="ch.channelName"
                      class="ch-avatar"
                    />
                    <div class="ch-info">
                      <div class="ch-name">{{ ch.channelName }}</div>
                      <div v-if="ch.channelHandle" class="ch-handle">{{ ch.channelHandle }}</div>
                    </div>
                  </router-link>
                </td>
                <td class="text-right mono font-semibold">{{ ch.videoCountInRange }}</td>
                <td class="text-right mono text-muted">{{ ch.videoCount7d }}</td>
                <td class="text-right mono text-muted">{{ ch.videoCount30d }}</td>
                <td>{{ publishingScheduleService.formatRelativeTime(ch.latestPublishedAt) }}</td>
                <td class="mono font-medium">
                  {{ publishingScheduleService.formatInterval(ch.avgIntervalHours) }}
                </td>
                <td class="mono font-medium text-highlight">
                  {{ publishingScheduleService.formatInterval(ch.medianIntervalHours) }}
                </td>
                <td>{{ ch.peakWeekday }}</td>
                <td class="mono">{{ ch.peakHour }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="mobile-channel-cards">
          <div
            v-for="ch in channelStats"
            :key="'m-' + ch.channelId"
            class="m-channel-card"
          >
            <div class="m-ch-header">
              <router-link :to="'/kenh-theo-doi/' + ch.channelId" class="channel-name-link">
                <img
                  v-if="ch.channelAvatarUrl"
                  :src="ch.channelAvatarUrl"
                  :alt="ch.channelName"
                  class="ch-avatar"
                />
                <div class="ch-info">
                  <div class="ch-name">{{ ch.channelName }}</div>
                  <div v-if="ch.channelHandle" class="ch-handle">{{ ch.channelHandle }}</div>
                </div>
              </router-link>
              <span class="m-badge mono">{{ ch.videoCountInRange }} video</span>
            </div>

            <div class="m-ch-stats-grid">
              <div class="m-stat-item">
                <span class="m-stat-lbl">Khoảng cách trung vị:</span>
                <span class="m-stat-val text-highlight mono">
                  {{ publishingScheduleService.formatInterval(ch.medianIntervalHours) }}
                </span>
              </div>
              <div class="m-stat-item">
                <span class="m-stat-lbl">Khoảng cách TB:</span>
                <span class="m-stat-val mono">
                  {{ publishingScheduleService.formatInterval(ch.avgIntervalHours) }}
                </span>
              </div>
              <div class="m-stat-item">
                <span class="m-stat-lbl">Đăng gần nhất:</span>
                <span class="m-stat-val">
                  {{ publishingScheduleService.formatRelativeTime(ch.latestPublishedAt) }}
                </span>
              </div>
              <div class="m-stat-item">
                <span class="m-stat-lbl">Thường đăng nhất:</span>
                <span class="m-stat-val">{{ ch.peakWeekday }}</span>
              </div>
              <div class="m-stat-item m-stat-full">
                <span class="m-stat-lbl">Giờ thường xuất hiện:</span>
                <span class="m-stat-val mono">{{ ch.peakHour }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 4: RECENT TIMELINE -->
      <section class="section-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">Video Đăng Gần Đây</h2>
            <p class="section-desc">
              Danh sách 50 video mới nhất trong khoảng thời gian đã chọn (giờ Việt Nam).
            </p>
          </div>
        </div>

        <div class="timeline-list">
          <div
            v-for="v in recentVideos"
            :key="v.id"
            class="timeline-item"
          >
            <!-- Thumbnail -->
            <router-link :to="'/videos/' + v.id" class="tl-thumb-wrap">
              <img
                v-if="v.thumbnailUrl"
                :src="v.thumbnailUrl"
                :alt="v.title"
                class="tl-thumb"
                loading="lazy"
              />
              <div v-else class="tl-thumb-placeholder">
                <AppIcon name="video" size="20" />
              </div>
            </router-link>

            <!-- Video Info -->
            <div class="tl-info">
              <h3 class="tl-title">
                <router-link :to="'/videos/' + v.id" class="tl-title-link">
                  {{ v.title }}
                </router-link>
              </h3>
              <div class="tl-meta">
                <router-link :to="'/kenh-theo-doi/' + v.channelId" class="tl-channel">
                  <img
                    v-if="v.channelAvatarUrl"
                    :src="v.channelAvatarUrl"
                    :alt="v.channelName"
                    class="tl-ch-avatar"
                  />
                  <span>{{ v.channelName }}</span>
                </router-link>
                <span class="tl-dot">·</span>
                <span class="tl-time mono">{{ v.vnFormatted }}</span>
                <span class="tl-dot">·</span>
                <span class="tl-age text-muted">{{ publishingScheduleService.formatRelativeTime(v.publishedAt) }}</span>
              </div>
            </div>

            <!-- External YouTube Link -->
            <div class="tl-action">
              <a
                :href="'https://www.youtube.com/watch?v=' + v.youtubeVideoId"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-yt"
                title="Xem trên YouTube"
              >
                <span>Xem YouTube</span>
                <AppIcon name="external" size="12" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import { publishingScheduleService } from '@/services/publishing-schedule-service';
import type {
  PublishingRange,
  PublishingVideo,
  PublishingFilter,
  PublishingScheduleSummary,
  ChannelPublishingStats,
} from '@/types/publishing-schedule';

const route = useRoute();
const router = useRouter();

const rangeOptions: { value: PublishingRange; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: 'all', label: 'Tất cả' },
];

const loading = ref(false);
const error = ref<string | null>(null);
const allVideos = ref<PublishingVideo[]>([]);
const rangeVideos = ref<PublishingVideo[]>([]);

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

// Summary Cards
const summary = computed<PublishingScheduleSummary>(() => {
  return publishingScheduleService.computeScheduleSummary(rangeVideos.value, filter.value.range);
});

// Heatmap Data (7x24)
const heatmapData = computed(() => {
  return publishingScheduleService.buildPublishingHeatmap(rangeVideos.value);
});

// Weekday & Hourly Distributions
const weekdayDist = computed(() => {
  return publishingScheduleService.computeWeekdayDistribution(rangeVideos.value);
});

const hourlyDist = computed(() => {
  return publishingScheduleService.computeHourlyDistribution(rangeVideos.value);
});

const maxHourlyCount = computed(() => {
  if (!hourlyDist.value.length) return 0;
  return Math.max(...hourlyDist.value.map(h => h.count));
});

// Peak texts
const peakWeekdayText = computed(() => {
  return publishingScheduleService.findPeakBuckets(weekdayDist.value);
});

const peakHourText = computed(() => {
  const formattedItems = hourlyDist.value.map(h => ({
    label: `${h.label}–${h.label.slice(0, 2)}:59`,
    count: h.count,
  }));
  return publishingScheduleService.findPeakBuckets(formattedItems);
});

// Channel Table Stats
const channelStats = computed<ChannelPublishingStats[]>(() => {
  return publishingScheduleService.computeChannelPublishingStats(allVideos.value, rangeVideos.value);
});

// Recent 50 Videos
const recentVideos = computed<PublishingVideo[]>(() => {
  return rangeVideos.value.slice(0, 50);
});

function formatHourRange(hour: number): string {
  const hh = hour < 10 ? `0${hour}` : `${hour}`;
  return `${hh}:00–${hh}:59`;
}

function getCellClass(count: number, maxCount: number): string {
  if (count === 0) return 'level-0';
  if (maxCount <= 1) return 'level-4';
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 'level-1';
  if (ratio <= 0.5) return 'level-2';
  if (ratio <= 0.75) return 'level-3';
  return 'level-4';
}

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    const res = await publishingScheduleService.fetchPublishingSchedule(
      filter.value.range,
      filter.value.channelId
    );
    allVideos.value = res.allVideos;
    rangeVideos.value = res.rangeVideos;
  } catch (err: any) {
    error.value = err.message || 'Không thể tải Lịch Đăng Của Đối Thủ.';
  } finally {
    loading.value = false;
  }
}

function selectRange(r: PublishingRange) {
  if (filter.value.range === r) return;
  filter.value.range = r;
  syncUrl();
  loadData();
}

function onChannelChange() {
  syncUrl();
  loadData();
}

function syncUrl() {
  const query: Record<string, string> = {};
  if (filter.value.range !== '30d') query.range = filter.value.range;
  if (filter.value.channelId) query.channel = filter.value.channelId;

  router.replace({ query }).catch(() => {});
}

function initFromUrl() {
  const parsed = publishingScheduleService.parseUrlParams(route.query);
  filter.value.range = parsed.range;
  filter.value.channelId = parsed.channelId;
}

onMounted(() => {
  initFromUrl();
  loadData();
});

watch(
  () => route.query,
  newQuery => {
    const parsed = publishingScheduleService.parseUrlParams(newQuery);
    if (parsed.range !== filter.value.range || parsed.channelId !== filter.value.channelId) {
      filter.value.range = parsed.range;
      filter.value.channelId = parsed.channelId;
      loadData();
    }
  }
);
</script>

<style scoped>
.publishing-schedule-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Page Header */
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
  margin: 0 0 8px;
}

.timezone-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  color: #38bdf8;
  font-size: 12px;
  font-weight: 500;
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

.summary-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
}

/* Filter Section */
.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
}

.range-group,
.channel-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.range-buttons {
  display: flex;
  gap: 6px;
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

.channel-select {
  background: #1e293b;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  min-width: 200px;
  cursor: pointer;
}

.channel-select:focus {
  border-color: #38bdf8;
}

/* Section Card */
.section-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.section-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 4px;
}

.section-title-sm {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

.section-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* Heatmap Legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
}

.legend-text {
  margin: 0 4px;
}

.legend-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

/* Heatmap Table */
.heatmap-scroll-wrap {
  overflow-x: auto;
  border: 1px solid #1e293b;
  border-radius: 8px;
  background: #020617;
}

.heatmap-table {
  display: flex;
  flex-direction: column;
  min-width: 780px;
}

.heatmap-row {
  display: grid;
  grid-template-columns: 80px repeat(24, 1fr);
  border-bottom: 1px solid #0f172a;
}

.heatmap-row:last-child {
  border-bottom: none;
}

.header-row {
  background: #090e1a;
  border-bottom: 1px solid #1e293b;
}

.heatmap-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 2px;
  font-size: 11px;
  border-right: 1px solid #0f172a;
}

.heatmap-cell:last-child {
  border-right: none;
}

.weekday-header {
  font-weight: 600;
  color: #64748b;
  border-right: 1px solid #1e293b;
  background: #090e1a;
}

.hour-header {
  color: #64748b;
  font-size: 10px;
}

.weekday-col {
  justify-content: flex-start;
  padding-left: 10px;
  font-weight: 600;
  color: #94a3b8;
  background: #090e1a;
  border-right: 1px solid #1e293b;
}

.data-cell {
  cursor: pointer;
  transition: opacity 0.1s ease;
}

.data-cell:hover {
  filter: brightness(1.25);
}

.level-0 {
  background: #070c18;
  color: #334155;
}

.level-1 {
  background: #082f49;
  color: #7dd3fc;
}

.level-2 {
  background: #0369a1;
  color: #e0f2fe;
}

.level-3 {
  background: #0284c7;
  color: #ffffff;
  font-weight: 600;
}

.level-4 {
  background: #38bdf8;
  color: #0c4a6e;
  font-weight: 700;
}

.cell-count {
  font-size: 11px;
}

.cell-zero {
  opacity: 0.25;
}

/* Distribution Grid */
.distribution-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.peak-note {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.peak-label {
  color: #64748b;
}

.peak-val {
  color: #38bdf8;
  font-weight: 600;
}

.bars-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-row {
  display: grid;
  grid-template-columns: 70px 1fr 90px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.bar-label {
  color: #cbd5e1;
  font-weight: 500;
}

.bar-track {
  height: 8px;
  background: #1e293b;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill-weekday {
  height: 100%;
  background: #38bdf8;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-stat {
  text-align: right;
  color: #f1f5f9;
  font-size: 11px;
}

.bar-stat small {
  color: #64748b;
}

/* Hourly Chart */
.hourly-bars-scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}

.hourly-chart {
  display: flex;
  align-items: flex-end;
  height: 130px;
  gap: 6px;
  min-width: 500px;
  padding-top: 10px;
}

.hourly-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 4px;
  cursor: pointer;
}

.hourly-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: #0a0f1d;
  border-radius: 3px;
  overflow: hidden;
}

.hourly-bar-fill {
  width: 100%;
  background: #0284c7;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
}

.hourly-col:hover .hourly-bar-fill {
  background: #38bdf8;
}

.hourly-count {
  font-size: 10px;
  color: #cbd5e1;
}

.hourly-label {
  font-size: 10px;
  color: #64748b;
}

/* Channel Table */
.table-responsive {
  overflow-x: auto;
}

.channel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.channel-table th {
  background: #090e1a;
  color: #64748b;
  font-weight: 600;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #1e293b;
  font-size: 12px;
}

.channel-table td {
  padding: 12px;
  border-bottom: 1px solid #1e293b;
  color: #cbd5e1;
}

.channel-table tbody tr:hover {
  background: #111c35;
}

.channel-name-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #f1f5f9;
  text-decoration: none;
  font-weight: 500;
}

.channel-name-link:hover {
  color: #38bdf8;
}

.ch-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.ch-info {
  display: flex;
  flex-direction: column;
}

.ch-name {
  font-weight: 500;
  color: #f8fafc;
}

.ch-handle {
  font-size: 11px;
  color: #64748b;
}

.text-right {
  text-align: right;
}

.font-semibold {
  font-weight: 600;
}

.font-medium {
  font-weight: 500;
}

.text-highlight {
  color: #38bdf8;
}

.text-muted {
  color: #64748b;
}

/* Mobile Channel Cards (Hidden on Desktop) */
.mobile-channel-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.m-channel-card {
  background: #090e1a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.m-ch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.m-badge {
  font-size: 11px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 2px 8px;
  border-radius: 4px;
}

.m-ch-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 12px;
}

.m-stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-stat-full {
  grid-column: span 2;
}

.m-stat-lbl {
  color: #64748b;
  font-size: 11px;
}

.m-stat-val {
  color: #e2e8f0;
  font-size: 12px;
}

/* Timeline List */
.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 10px;
  border: 1px solid #1e293b;
  border-radius: 8px;
  background: #090e1a;
  transition: background 0.15s;
}

.timeline-item:hover {
  background: #111c35;
  border-color: #334155;
}

.tl-thumb-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: #020617;
  display: block;
}

.tl-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tl-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.tl-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.tl-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tl-title-link {
  color: #f1f5f9;
  text-decoration: none;
}

.tl-title-link:hover {
  color: #38bdf8;
}

.tl-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.tl-channel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  text-decoration: none;
}

.tl-channel:hover {
  color: #38bdf8;
}

.tl-ch-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
}

.tl-dot {
  color: #475569;
}

.tl-time {
  color: #38bdf8;
}

.tl-age {
  color: #64748b;
}

.btn-yt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ef4444;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  transition: all 0.15s;
}

.btn-yt:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
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

/* Skeleton */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-box {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  animation: pulse 1.5s infinite;
}

.h-200 { height: 200px; }
.h-250 { height: 250px; }

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

  .distribution-grid {
    grid-template-columns: 1fr;
  }

  .desktop-table {
    display: none;
  }

  .mobile-channel-cards {
    display: flex;
  }

  .timeline-item {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .tl-thumb-wrap {
    max-width: 100%;
  }

  .tl-action {
    justify-self: flex-start;
  }
}
</style>
