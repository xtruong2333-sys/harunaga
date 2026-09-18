<template>
  <div class="channel-comparison-page">
    <!-- Page Header -->
    <PageHeader
      kicker="COMPETITIVE BENCHMARK ARENA"
      title="So Sánh Kênh"
      description="Đặt 2–4 kênh đối thủ cạnh nhau để đối chiếu tốc độ tăng trưởng, hiệu suất video, nhịp đăng và độ mới dữ liệu."
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-secondary refresh-btn"
          :disabled="loading"
          @click="loadComparisonData"
          title="Tải lại dữ liệu đối chiếu mới nhất"
        >
          <AppIcon name="refresh" :size="16" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </template>
    </PageHeader>

    <!-- Channel Selector with 4 slots and modal picker -->
    <ComparisonChannelSelector
      :selected-channels="selectedChannels"
      :available-channels="allComparableChannels"
      :time-window="timeWindow"
      @add="addChannel"
      @remove="removeChannel"
      @update:time-window="setTimeWindow"
    />

    <!-- View Mode Switcher -->
    <div v-if="selectedChannelIds.length >= 2" class="view-controls-bar">
      <ViewModeSwitcher
        v-model="viewMode"
        :modes="COMPARISON_VIEW_MODES"
        storage-key="bbdt_compare_view_mode"
        size="md"
        @change="handleViewModeChange"
      />
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner card">
      <div class="error-banner-content">
        <AppIcon name="alert" :size="20" class="text-danger" />
        <div class="error-text-wrap">
          <h4 class="error-title">Không thể tải dữ liệu so sánh</h4>
          <p class="error-desc">{{ error }}</p>
        </div>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" @click="loadComparisonData">
        <AppIcon name="refresh" :size="14" />
        <span>Thử Lại</span>
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-else-if="loading && !comparisonData" class="loading-stack">
      <div class="skeleton-summary-grid">
        <div v-for="i in 4" :key="i" class="skeleton-card skeleton-stat-box"></div>
      </div>
      <div class="skeleton-card skeleton-large-panel"></div>
    </div>

    <!-- Empty State: < 2 Channels -->
    <div v-else-if="selectedChannelIds.length < 2" class="empty-selection-card card">
      <div class="empty-icon-circle">
        <AppIcon name="bar-chart-2" :size="32" />
      </div>
      <h3 class="empty-title">
        {{ selectedChannelIds.length === 0 ? 'Chọn ít nhất 2 kênh để bắt đầu so sánh' : 'Hãy chọn thêm 1 kênh để bắt đầu đối chiếu' }}
      </h3>
      <p class="empty-desc">
        {{ selectedChannelIds.length === 0
          ? 'Đặt dữ liệu đo thực tế của 2–4 đối thủ cạnh nhau để kiểm tra VPH, video đang tăng, nhịp đăng và xu hướng 24h.'
          : 'Cần tối thiểu 2 kênh để thiết lập bàn đối chiếu trực tiếp.' }}
      </p>
    </div>

    <!-- Active Comparison Arena -->
    <div v-else-if="comparisonData" class="arena-content">
      <!-- 4 Fact Summary Cards -->
      <div class="summary-facts-grid">
        <div class="fact-card card">
          <span class="fact-label">KÊNH ĐỐI CHIẾU</span>
          <span class="fact-val mono">{{ comparisonData.channels.length }}</span>
          <span class="fact-sub">Tối đa 4 kênh</span>
        </div>

        <div class="fact-card card">
          <span class="fact-label">TỔNG VIDEO TRONG CỬA SỔ</span>
          <span class="fact-val mono">{{ totalVideosInWindow.toLocaleString('vi-VN') }}</span>
          <span class="fact-sub">Khoảng {{ timeWindowLabel }}</span>
        </div>

        <div class="fact-card card">
          <span class="fact-label">MAX VPH TOÀN NHÓM</span>
          <span class="fact-val mono" :class="{ 'text-primary': groupMaxVph !== null }">
            {{ groupMaxVph !== null ? `${groupMaxVph.toLocaleString('vi-VN')} VPH` : '—' }}
          </span>
          <span class="fact-sub">Video tăng trưởng mạnh nhất</span>
        </div>

        <div class="fact-card card">
          <span class="fact-label">VIDEO ĐANG TĂNG TOÀN NHÓM</span>
          <span class="fact-val mono text-success">
            {{ totalRisingVideosInGroup }}
          </span>
          <span class="fact-sub">VPH đo được > 0</span>
        </div>
      </div>

      <!-- Mode 1: Overview -->
      <div v-if="viewMode === 'overview'" class="mode-stack">
        <!-- 1. Channel Identities Strip -->
        <ComparisonIdentityStrip :channels="comparisonData.channels" />

        <!-- 2. Benchmark Metric Rail -->
        <ComparisonMetricRail :channels="comparisonData.channels" />

        <!-- 3. Trend Chart 24h -->
        <ComparisonTrendChart
          :channels="comparisonData.channels"
          :all-trend-hour-keys="comparisonData.allTrendHourKeys"
        />

        <!-- 4. Top Video Signals -->
        <ComparisonSignalColumns :channels="comparisonData.channels" />

        <!-- 5. Publishing Rhythm -->
        <ComparisonPublishingRhythm :channels="comparisonData.channels" />

        <!-- 6. Data Freshness -->
        <ComparisonFreshness :channels="comparisonData.channels" />
      </div>

      <!-- Mode 2: Table -->
      <div v-else-if="viewMode === 'table'" class="mode-stack">
        <ComparisonTable :channels="comparisonData.channels" />
      </div>

      <!-- Mode 3: Signals -->
      <div v-else-if="viewMode === 'signals'" class="mode-stack">
        <ComparisonSignalColumns :channels="comparisonData.channels" />
      </div>

      <!-- Mode 4: Trend -->
      <div v-else-if="viewMode === 'trend'" class="mode-stack">
        <ComparisonTrendChart
          :channels="comparisonData.channels"
          :all-trend-hour-keys="comparisonData.allTrendHourKeys"
        />
        <ComparisonMetricRail :channels="comparisonData.channels" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ViewModeSwitcher from '@/components/ui/ViewModeSwitcher.vue';
import ComparisonChannelSelector from '@/components/channel-comparison/ComparisonChannelSelector.vue';
import ComparisonIdentityStrip from '@/components/channel-comparison/ComparisonIdentityStrip.vue';
import ComparisonMetricRail from '@/components/channel-comparison/ComparisonMetricRail.vue';
import ComparisonPublishingRhythm from '@/components/channel-comparison/ComparisonPublishingRhythm.vue';
import ComparisonFreshness from '@/components/channel-comparison/ComparisonFreshness.vue';
import ComparisonTrendChart from '@/components/channel-comparison/ComparisonTrendChart.vue';
import ComparisonSignalColumns from '@/components/channel-comparison/ComparisonSignalColumns.vue';
import ComparisonTable from '@/components/channel-comparison/ComparisonTable.vue';

import { channelComparisonService } from '@/services/channel-comparison-service';
import type {
  ComparisonTimeWindow,
  ComparableChannelOption,
  ChannelComparisonData,
  ComparisonViewMode,
} from '@/types/channel-comparison';
import {
  TIME_WINDOW_LABELS,
  COMPARISON_VIEW_MODES,
} from '@/types/channel-comparison';

const route = useRoute();
const router = useRouter();

const STORAGE_CHANNELS_KEY = 'bbdt_compare_channel_ids';
const STORAGE_TIME_WINDOW_KEY = 'bbdt_compare_time_window';
const STORAGE_VIEW_MODE_KEY = 'bbdt_compare_view_mode';

const loading = ref(false);
const error = ref<string | null>(null);

const allComparableChannels = ref<ComparableChannelOption[]>([]);
const selectedChannelIds = ref<string[]>([]);
const timeWindow = ref<ComparisonTimeWindow>('7d');
const viewMode = ref<ComparisonViewMode>('overview');

const comparisonData = ref<ChannelComparisonData | null>(null);

const timeWindowLabel = computed(() => TIME_WINDOW_LABELS[timeWindow.value]);

const selectedChannels = computed(() => {
  return selectedChannelIds.value
    .map(id => allComparableChannels.value.find(c => c.id === id))
    .filter((c): c is ComparableChannelOption => Boolean(c));
});

const totalVideosInWindow = computed(() => {
  if (!comparisonData.value) return 0;
  return comparisonData.value.channels.reduce((sum, ch) => sum + ch.metrics.videoCount, 0);
});

const groupMaxVph = computed(() => {
  if (!comparisonData.value) return null;
  const vphs = comparisonData.value.channels
    .map(ch => ch.metrics.maxVph)
    .filter((v): v is number => v !== null && v > 0);
  if (vphs.length === 0) return null;
  return Math.max(...vphs);
});

const totalRisingVideosInGroup = computed(() => {
  if (!comparisonData.value) return 0;
  return comparisonData.value.channels.reduce((sum, ch) => sum + ch.metrics.risingVideoCount, 0);
});

function handleViewModeChange(newMode: string) {
  viewMode.value = newMode as ComparisonViewMode;
}

function addChannel(id: string) {
  if (selectedChannelIds.value.length >= 4) return;
  if (!selectedChannelIds.value.includes(id)) {
    selectedChannelIds.value.push(id);
    persistAndSync();
    loadComparisonData();
  }
}

function removeChannel(id: string) {
  selectedChannelIds.value = selectedChannelIds.value.filter(cid => cid !== id);
  persistAndSync();
  if (selectedChannelIds.value.length >= 2) {
    loadComparisonData();
  } else {
    comparisonData.value = null;
  }
}

function setTimeWindow(win: ComparisonTimeWindow) {
  timeWindow.value = win;
  try {
    localStorage.setItem(STORAGE_TIME_WINDOW_KEY, win);
  } catch {}
  persistAndSync();
  loadComparisonData();
}

function persistAndSync() {
  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(selectedChannelIds.value));
  } catch {}

  // Sync to query string
  const query: Record<string, string> = {};
  if (selectedChannelIds.value.length > 0) {
    query.channels = selectedChannelIds.value.join(',');
  }
  if (timeWindow.value !== '7d') {
    query.range = timeWindow.value;
  }
  router.replace({ query });
}

async function loadComparisonData() {
  if (selectedChannelIds.value.length < 2) {
    comparisonData.value = null;
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    comparisonData.value = await channelComparisonService.fetchChannelComparison(
      selectedChannelIds.value,
      timeWindow.value
    );
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải dữ liệu So Sánh Kênh. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  // Load stored view mode
  try {
    const savedMode = localStorage.getItem(STORAGE_VIEW_MODE_KEY);
    if (savedMode && ['overview', 'table', 'signals', 'trend'].includes(savedMode)) {
      viewMode.value = savedMode as ComparisonViewMode;
    }
  } catch {}

  // Load stored time window
  try {
    const savedWindow = localStorage.getItem(STORAGE_TIME_WINDOW_KEY);
    if (savedWindow && ['24h', '3d', '7d', '30d', 'all'].includes(savedWindow)) {
      timeWindow.value = savedWindow as ComparisonTimeWindow;
    }
  } catch {}

  loading.value = true;
  try {
    allComparableChannels.value = await channelComparisonService.fetchComparableChannels();

    // Check query params first
    const rawChannels = route.query.channels as string | undefined;
    const rawRange = route.query.range as string | undefined;

    if (rawRange && ['24h', '3d', '7d', '30d', 'all'].includes(rawRange)) {
      timeWindow.value = rawRange as ComparisonTimeWindow;
    }

    let initialIds: string[] = [];

    if (rawChannels) {
      initialIds = rawChannels
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    } else {
      // Check localStorage
      try {
        const savedIdsJson = localStorage.getItem(STORAGE_CHANNELS_KEY);
        if (savedIdsJson) {
          const parsed = JSON.parse(savedIdsJson);
          if (Array.isArray(parsed)) {
            initialIds = parsed.map(String);
          }
        }
      } catch {}
    }

    // Validate IDs against loaded channels (discard deleted or invalid ones)
    const validIds = initialIds.filter(id => allComparableChannels.value.some(c => c.id === id));

    if (validIds.length >= 2) {
      selectedChannelIds.value = Array.from(new Set(validIds)).slice(0, 4);
    } else if (validIds.length === 1) {
      // If only 1 valid id was saved, keep it and add another active channel if possible
      const otherActive = allComparableChannels.value.find(c => c.id !== validIds[0] && c.status === 'active');
      selectedChannelIds.value = otherActive ? [validIds[0], otherActive.id] : [validIds[0]];
    } else {
      // Default: pick first 2 active channels
      const defaultActive = allComparableChannels.value
        .filter(c => c.status === 'active')
        .slice(0, 2)
        .map(c => c.id);
      selectedChannelIds.value = defaultActive;
    }

    persistAndSync();

    if (selectedChannelIds.value.length >= 2) {
      await loadComparisonData();
    }
  } catch (err: any) {
    error.value = err?.message || 'Không thể khởi tạo danh sách kênh so sánh.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.channel-comparison-page {
  max-width: none;
  margin: 0 auto;
  padding: 24px;
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

.view-controls-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin-bottom: 24px;
  gap: 16px;
}

.error-banner-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.error-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #991b1b;
  margin: 0 0 4px 0;
}

.error-desc {
  font-size: 0.85rem;
  color: #b91c1c;
  margin: 0;
}

/* Loading Skeletons */
.loading-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-card {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
  border-radius: 12px;
}

.skeleton-stat-box {
  height: 96px;
}

.skeleton-large-panel {
  height: 380px;
}

@keyframes skeletonShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty Selection Card */
.empty-selection-card {
  padding: 48px 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.empty-desc {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 520px;
  margin: 0;
  line-height: 1.5;
}

/* Summary Facts Grid */
.summary-facts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.fact-card {
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fact-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #64748b;
}

.fact-val {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.text-primary {
  color: #2563eb;
}

.text-success {
  color: #059669;
}

.fact-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}

.mode-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 1024px) {
  .summary-facts-grid,
  .skeleton-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .channel-comparison-page {
    padding: 14px;
  }
  .summary-facts-grid,
  .skeleton-summary-grid {
    grid-template-columns: 1fr;
  }
  .view-controls-bar {
    justify-content: stretch;
  }
}
</style>