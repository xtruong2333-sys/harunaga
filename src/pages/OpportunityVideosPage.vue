<template>
  <div class="opportunity-page">
    <!-- 1. Header Section -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">Video Tiềm Năng</h1>
        <p class="page-description">
          Phát hiện các video mới đang có tốc độ tăng lượt xem đáng chú ý từ những kênh đối thủ.
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

    <!-- 2. Time Window Selector & Explanation -->
    <div class="time-filter-section">
      <div class="time-filter-pills">
        <button
          v-for="tw in timeWindows"
          :key="tw.id"
          class="time-pill-btn"
          :class="{ 'time-pill-active': filters.timeWindow === tw.id }"
          @click="filters.timeWindow = tw.id"
        >
          {{ tw.label }}
        </button>
      </div>
      <div class="time-filter-caption">
        <AppIcon name="zap" size="14" />
        <span>Video mới có tốc độ tăng lượt xem được đo lớn hơn 0 VPH.</span>
      </div>
    </div>

    <!-- Error State Banner -->
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

    <!-- Loading Skeleton -->
    <div v-if="loading && allVideos.length === 0" class="skeleton-container">
      <div class="skeleton-stats-grid">
        <div v-for="n in 4" :key="n" class="skeleton-card"></div>
      </div>
      <div class="skeleton-hero"></div>
      <div class="skeleton-table"></div>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- 3. Top 4 Stat Cards -->
      <div class="stats-grid">
        <!-- Card 1: Video tiềm năng -->
        <div class="stat-card">
          <div class="stat-label">Video tiềm năng</div>
          <div class="stat-val mono text-accent">{{ stats.potentialCount }}</div>
          <div class="stat-desc">Video có VPH đo được lớn hơn 0</div>
        </div>

        <!-- Card 2: Mới trong 24 giờ -->
        <div class="stat-card">
          <div class="stat-label">Mới trong 24 giờ</div>
          <div class="stat-val mono">{{ stats.new24hCount }}</div>
          <div class="stat-desc">Xuất bản trong vòng 24 giờ qua</div>
        </div>

        <!-- Card 3: VPH cao nhất -->
        <div class="stat-card">
          <div class="stat-label">VPH cao nhất</div>
          <div class="stat-val mono" :class="stats.maxVph !== null ? 'text-accent' : 'text-muted'">
            {{ stats.maxVph !== null ? `${Math.round(stats.maxVph).toLocaleString('vi-VN')} VPH` : 'Chưa có dữ liệu' }}
          </div>
          <div class="stat-desc">Tốc độ đo được cao nhất</div>
        </div>

        <!-- Card 4: Vượt ngưỡng -->
        <div class="stat-card">
          <div class="stat-label">Vượt ngưỡng</div>
          <div class="stat-val mono" :class="stats.overThresholdCount > 0 ? 'text-threshold' : 'text-muted'">
            {{ stats.overThresholdCount }}
          </div>
          <div class="stat-desc">Đạt ngưỡng cảnh báo của kênh</div>
        </div>
      </div>

      <!-- 4. Section: Video Đang Tăng Nhanh Nhất (Top Hero Video) -->
      <div v-if="topRisingVideo" class="top-rising-hero-card">
        <div class="hero-card-header">
          <div class="hero-badge-title">
            <span class="rank-tag">#1</span>
            <span class="hero-heading">Đang Tăng Nhanh Nhất</span>
          </div>
          <span class="hero-subheading">Video có tốc độ tăng trưởng VPH cao nhất trong khoảng thời gian đã chọn</span>
        </div>

        <div class="hero-body">
          <!-- Large Thumbnail -->
          <router-link :to="'/videos/' + topRisingVideo.id" class="hero-thumb-wrap" title="Xem chi tiết video">
            <img
              v-if="topRisingVideo.thumbnailUrl"
              :src="topRisingVideo.thumbnailUrl"
              :alt="topRisingVideo.title"
              class="hero-thumb-img"
              loading="lazy"
              @error="handleImgError"
            />
            <div v-else class="hero-thumb-fallback">
              <AppIcon name="video" size="28" />
            </div>
          </router-link>

          <!-- Middle Info -->
          <div class="hero-info-col">
            <router-link :to="'/videos/' + topRisingVideo.id" class="hero-video-title" :title="topRisingVideo.title">
              {{ topRisingVideo.title }}
            </router-link>

            <!-- Channel row -->
            <div class="hero-meta-row">
              <router-link :to="'/kenh-theo-doi/' + topRisingVideo.channel.id" class="hero-channel-link">
                <div class="hero-avatar-wrap">
                  <img
                    v-if="topRisingVideo.channel.avatarUrl"
                    :src="topRisingVideo.channel.avatarUrl"
                    :alt="topRisingVideo.channel.name"
                    class="hero-avatar-img"
                    @error="handleImgError"
                  />
                  <div v-else class="hero-avatar-fallback">
                    {{ topRisingVideo.channel.name.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <span class="hero-channel-name">{{ topRisingVideo.channel.name }}</span>
              </router-link>

              <span class="dot-separator">•</span>
              <span class="hero-age">{{ topRisingVideo.videoAge }}</span>
              <span class="dot-separator">•</span>
              <span class="hero-yt-id mono">ID: {{ topRisingVideo.youtubeVideoId }}</span>
            </div>

            <!-- Metrics row -->
            <div class="hero-metrics-row">
              <div class="h-metric">
                <div class="h-lbl">LƯỢT XEM</div>
                <div class="h-val mono">{{ formatViews(topRisingVideo.latestViewCount) }}</div>
              </div>
              <div class="h-metric">
                <div class="h-lbl">VPH ĐO ĐƯỢC</div>
                <div class="h-val mono text-accent">{{ formatVph(topRisingVideo.latestMeasuredVph) }}</div>
              </div>
              <div class="h-metric">
                <div class="h-lbl">TĂNG LẦN TRƯỚC</div>
                <div class="h-val mono text-delta">{{ formatViewDelta(topRisingVideo.latestDeltaViews) }}</div>
              </div>
              <div class="h-metric metric-threshold">
                <div class="h-lbl">MỨC SO VỚI NGƯỠNG</div>
                <div class="progress-wrap">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :class="{ 'fill-over': topRisingVideo.isOverThreshold }"
                      :style="{ width: `${Math.min(100, Math.max(4, topRisingVideo.thresholdRatio))}%` }"
                    ></div>
                  </div>
                  <span class="progress-text mono" :class="topRisingVideo.isOverThreshold ? 'text-threshold' : ''">
                    {{ topRisingVideo.thresholdRatio }}% ngưỡng
                  </span>
                  <span v-if="topRisingVideo.isOverThreshold" class="badge-threshold-pill">Vượt ngưỡng</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="hero-actions-col">
            <button
              class="btn btn-secondary btn-sm"
              :disabled="addingVideoId === topRisingVideo.id"
              @click="handleAddToProduction(topRisingVideo)"
              title="Đưa vào Tiến Độ Sản Xuất"
            >
              <AppIcon name="clipboard-list" size="14" />
              <span>{{ addingVideoId === topRisingVideo.id ? 'Đang thêm...' : 'Sản Xuất' }}</span>
            </button>
            <router-link :to="'/tro-ly-noi-dung?video=' + topRisingVideo.id" class="btn btn-secondary btn-sm" title="Phân tích nội dung AI">
              <AppIcon name="sparkles" size="14" />
              <span>Phân Tích AI</span>
            </router-link>
            <router-link :to="'/videos/' + topRisingVideo.id" class="btn btn-primary btn-sm">
              <AppIcon name="activity" size="14" />
              <span>Chi Tiết</span>
            </router-link>
            <a
              :href="topRisingVideo.url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-secondary btn-sm"
              title="Xem trên YouTube"
            >
              <AppIcon name="external" size="14" />
              <span>Xem YouTube</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 5. Controls Toolbar: Search, Channel, Sort & Quick Filters -->
      <div class="toolbar-card">
        <div class="toolbar-top-row">
          <!-- Search box -->
          <div class="search-input-wrap">
            <AppIcon name="search" size="16" class="search-icon" />
            <input
              v-model="filters.searchQuery"
              type="text"
              class="search-input"
              placeholder="Tìm video hoặc kênh..."
            />
            <button
              v-if="filters.searchQuery"
              class="search-clear-btn"
              @click="filters.searchQuery = ''"
              title="Xóa tìm kiếm"
            >
              <AppIcon name="x" size="14" />
            </button>
          </div>

          <!-- Channel Dropdown -->
          <div class="select-wrap">
            <select v-model="filters.channelId" class="custom-select">
              <option value="all">Tất cả kênh ({{ uniqueChannels.length }})</option>
              <option v-for="ch in uniqueChannels" :key="ch.id" :value="ch.id">
                {{ ch.name }}
              </option>
            </select>
          </div>

          <!-- Sort Dropdown -->
          <div class="select-wrap">
            <select v-model="filters.sortOption" class="custom-select">
              <option value="vph_desc">VPH cao nhất</option>
              <option value="published_desc">Mới đăng nhất</option>
              <option value="delta_desc">Tăng lượt xem nhiều nhất</option>
              <option value="threshold_ratio_desc">Gần ngưỡng cảnh báo</option>
            </select>
          </div>
        </div>

        <!-- Quick filter tabs -->
        <div class="quick-filter-tabs">
          <button
            v-for="tab in quickFilterTabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ 'tab-btn-active': filters.quickFilter === tab.id }"
            @click="filters.quickFilter = tab.id"
          >
            <span>{{ tab.label }}</span>
            <span class="tab-badge mono">{{ getTabCount(tab.id) }}</span>
          </button>
        </div>
      </div>

      <!-- 6. Empty State -->
      <div v-if="displayedVideos.length === 0" class="empty-state-box">
        <div class="empty-icon-wrap">
          <AppIcon name="video" size="32" />
        </div>
        <div class="empty-title">{{ getEmptyMessage().title }}</div>
        <p class="empty-desc">{{ getEmptyMessage().desc }}</p>
        <button
          v-if="filters.timeWindow !== 'all' || filters.channelId !== 'all' || filters.searchQuery || filters.quickFilter !== 'all'"
          class="btn btn-secondary btn-sm"
          @click="resetFilters"
        >
          Đặt lại bộ lọc
        </button>
      </div>

      <!-- 7. Desktop Table View (>= 900px) -->
      <div v-else class="desktop-table-container">
        <table class="opportunity-table">
          <thead>
            <tr>
              <th class="th-video">VIDEO</th>
              <th class="th-channel">KÊNH</th>
              <th class="th-age">TUỔI VIDEO</th>
              <th class="th-views">LƯỢT XEM</th>
              <th class="th-vph">VPH ĐO ĐƯỢC</th>
              <th class="th-delta">TĂNG TỪ LẦN TRƯỚC</th>
              <th class="th-threshold">MỨC NGƯỠNG</th>
              <th class="th-alert">CẢNH BÁO</th>
              <th class="th-actions">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in displayedVideos" :key="v.id" class="opp-table-row">
              <!-- Video Col -->
              <td class="td-video">
                <div class="video-cell">
                  <router-link :to="'/videos/' + v.id" class="cell-thumb-wrap" title="Xem chi tiết video">
                    <img
                      v-if="v.thumbnailUrl"
                      :src="v.thumbnailUrl"
                      :alt="v.title"
                      class="cell-thumb-img"
                      loading="lazy"
                      @error="handleImgError"
                    />
                    <div v-else class="cell-thumb-fallback">
                      <AppIcon name="video" size="18" />
                    </div>
                  </router-link>

                  <div class="cell-title-box">
                    <router-link :to="'/videos/' + v.id" class="cell-video-title" :title="v.title">
                      {{ v.title }}
                    </router-link>
                    <span class="cell-yt-id mono">ID: {{ v.youtubeVideoId }}</span>
                  </div>
                </div>
              </td>

              <!-- Channel Col -->
              <td class="td-channel">
                <router-link :to="'/kenh-theo-doi/' + v.channel.id" class="cell-channel-link" title="Xem phân tích kênh">
                  <div class="cell-avatar-wrap">
                    <img
                      v-if="v.channel.avatarUrl"
                      :src="v.channel.avatarUrl"
                      :alt="v.channel.name"
                      class="cell-avatar-img"
                      @error="handleImgError"
                    />
                    <div v-else class="cell-avatar-fallback">
                      {{ v.channel.name.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <span class="cell-channel-name">{{ v.channel.name }}</span>
                </router-link>
              </td>

              <!-- Video Age Col -->
              <td class="td-age">
                <span class="age-text">{{ v.videoAge }}</span>
              </td>

              <!-- Views Col -->
              <td class="td-views">
                <span class="views-val mono">{{ formatViews(v.latestViewCount) }}</span>
              </td>

              <!-- VPH Col -->
              <td class="td-vph">
                <span class="vph-val mono text-accent">{{ formatVph(v.latestMeasuredVph) }}</span>
              </td>

              <!-- Delta Col -->
              <td class="td-delta">
                <span class="delta-val mono" :class="v.latestDeltaViews && v.latestDeltaViews > 0 ? 'text-delta' : 'text-muted'">
                  {{ formatViewDelta(v.latestDeltaViews) }}
                </span>
              </td>

              <!-- Threshold Col -->
              <td class="td-threshold">
                <div class="threshold-cell">
                  <div class="progress-bar-small">
                    <div
                      class="progress-fill"
                      :class="{ 'fill-over': v.isOverThreshold }"
                      :style="{ width: `${Math.min(100, Math.max(4, v.thresholdRatio))}%` }"
                    ></div>
                  </div>
                  <div class="threshold-ratio-row">
                    <span class="threshold-ratio-text mono" :class="v.isOverThreshold ? 'text-threshold' : ''">
                      {{ v.thresholdRatio }}% ngưỡng
                    </span>
                    <span v-if="v.isOverThreshold" class="badge-threshold-pill">Vượt ngưỡng</span>
                  </div>
                </div>
              </td>

              <!-- Alert Col -->
              <td class="td-alert">
                <span class="badge-alert" :class="`alert-${opportunityService.getAlertBadge(v.alert).tone}`">
                  {{ opportunityService.getAlertBadge(v.alert).label }}
                </span>
              </td>

              <!-- Actions Col -->
              <td class="td-actions">
                <div class="cell-actions-group">
                  <button
                    class="btn btn-secondary btn-xs"
                    :disabled="addingVideoId === v.id"
                    @click="handleAddToProduction(v)"
                    title="Đưa vào Tiến Độ Sản Xuất"
                  >
                    <AppIcon name="clipboard-list" size="12" />
                    <span>{{ addingVideoId === v.id ? '...' : 'Sản Xuất' }}</span>
                  </button>
                  <router-link :to="'/tro-ly-noi-dung?video=' + v.id" class="btn btn-secondary btn-xs" title="Phân tích nội dung AI">
                    <AppIcon name="sparkles" size="12" />
                    <span>AI</span>
                  </router-link>
                  <router-link :to="'/videos/' + v.id" class="btn btn-secondary btn-xs">
                    <span>Chi Tiết</span>
                  </router-link>
                  <a
                    :href="v.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-icon-link"
                    title="Mở trên YouTube"
                  >
                    <AppIcon name="external" size="14" />
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 8. Mobile Cards View (< 900px) -->
      <div v-if="displayedVideos.length > 0" class="mobile-cards-container">
        <div v-for="v in displayedVideos" :key="v.id" class="opp-mobile-card">
          <!-- Thumbnail & Header -->
          <div class="m-card-top">
            <router-link :to="'/videos/' + v.id" class="m-thumb-wrap">
              <img
                v-if="v.thumbnailUrl"
                :src="v.thumbnailUrl"
                :alt="v.title"
                class="m-thumb-img"
                loading="lazy"
                @error="handleImgError"
              />
              <div v-else class="m-thumb-fallback">
                <AppIcon name="video" size="20" />
              </div>
            </router-link>

            <div class="m-title-box">
              <router-link :to="'/videos/' + v.id" class="m-video-title">
                {{ v.title }}
              </router-link>
              <div class="m-channel-row">
                <router-link :to="'/kenh-theo-doi/' + v.channel.id" class="m-channel-link">
                  {{ v.channel.name }}
                </router-link>
                <span class="dot-separator">•</span>
                <span class="m-age">{{ v.videoAge }}</span>
              </div>
            </div>
          </div>

          <!-- Metrics Grid -->
          <div class="m-metrics-grid">
            <div class="m-metric-item">
              <div class="m-lbl">LƯỢT XEM</div>
              <div class="m-val mono">{{ formatViews(v.latestViewCount) }}</div>
            </div>
            <div class="m-metric-item">
              <div class="m-lbl">VPH ĐO ĐƯỢC</div>
              <div class="m-val mono text-accent">{{ formatVph(v.latestMeasuredVph) }}</div>
            </div>
            <div class="m-metric-item">
              <div class="m-lbl">TĂNG LẦN TRƯỚC</div>
              <div class="m-val mono text-delta">{{ formatViewDelta(v.latestDeltaViews) }}</div>
            </div>
            <div class="m-metric-item">
              <div class="m-lbl">CẢNH BÁO</div>
              <span class="badge-alert-mini" :class="`alert-${opportunityService.getAlertBadge(v.alert).tone}`">
                {{ opportunityService.getAlertBadge(v.alert).label }}
              </span>
            </div>
          </div>

          <!-- Threshold Progress -->
          <div class="m-threshold-box">
            <div class="m-progress-header">
              <span class="m-progress-lbl">Tiến độ ngưỡng cảnh báo</span>
              <span class="m-progress-val mono" :class="v.isOverThreshold ? 'text-threshold' : ''">
                {{ v.thresholdRatio }}% ngưỡng
              </span>
            </div>
            <div class="progress-bar-small">
              <div
                class="progress-fill"
                :class="{ 'fill-over': v.isOverThreshold }"
                :style="{ width: `${Math.min(100, Math.max(4, v.thresholdRatio))}%` }"
              ></div>
            </div>
            <div v-if="v.isOverThreshold" class="m-over-tag">
              <span class="badge-threshold-pill">Vượt ngưỡng</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="m-actions-row">
            <button
              class="btn btn-secondary btn-sm flex-1"
              :disabled="addingVideoId === v.id"
              @click="handleAddToProduction(v)"
              title="Đưa vào Tiến Độ Sản Xuất"
            >
              <AppIcon name="clipboard-list" size="14" />
              <span>{{ addingVideoId === v.id ? 'Đang thêm...' : 'Sản Xuất' }}</span>
            </button>
            <router-link :to="'/tro-ly-noi-dung?video=' + v.id" class="btn btn-secondary btn-sm flex-1" title="Phân tích AI">
              <AppIcon name="sparkles" size="14" />
              <span>Phân Tích AI</span>
            </router-link>
            <router-link :to="'/videos/' + v.id" class="btn btn-secondary btn-sm flex-1">
              <span>Chi Tiết</span>
            </router-link>
            <a
              :href="v.url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-secondary btn-sm flex-1"
            >
              <AppIcon name="external" size="14" />
              <span>YouTube</span>
            </a>
          </div>
        </div>
      </div>
    </template>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast-notification">
      {{ toastMessage }}
    </div>

    <!-- Access Key Prompt Modal -->
    <AccessKeyPromptModal
      v-model="showAccessKeyModal"
      :initial-error="accessKeyError"
      @confirmed="onAccessKeyConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';
import { opportunityService } from '@/services/opportunity-service';
import {
  productionService,
  setStoredAccessKey,
  getStoredAccessKey,
  AccessKeyRequiredError,
} from '@/services/production-service';
import {
  OpportunityVideo,
  OpportunityFilterState,
  OpportunityTimeWindow,
  OpportunityQuickFilter,
} from '@/types/opportunity';

const loading = ref(false);
const error = ref<string | null>(null);
const allVideos = ref<OpportunityVideo[]>([]);

// Production integration
const addingVideoId = ref<string | null>(null);
const pendingVideoToAdd = ref<OpportunityVideo | null>(null);
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
const toastMessage = ref<string | null>(null);
let toastTimer: any = null;

function showToast(msg: string) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
}

async function handleAddToProduction(v: OpportunityVideo) {
  if (!v || addingVideoId.value) return;

  const key = getStoredAccessKey();
  if (!key) {
    pendingVideoToAdd.value = v;
    accessKeyError.value = null;
    showAccessKeyModal.value = true;
    return;
  }

  addingVideoId.value = v.id;
  try {
    await productionService.createProductionItem(
      {
        sourceVideoId: v.id,
        workingTitle: v.title,
      },
      key
    );
    showToast(`Đã đưa "${v.title.slice(0, 32)}..." vào Tiến Độ Sản Xuất!`);
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError) {
      pendingVideoToAdd.value = v;
      accessKeyError.value = err.message;
      showAccessKeyModal.value = true;
    } else if (err?.message?.includes('đã có trong quy trình') || err?.message?.includes('409')) {
      showToast('Video này đã có trong Tiến Độ Sản Xuất!');
    } else {
      alert(err.message || 'Không thể đưa vào Tiến Độ Sản Xuất.');
    }
  } finally {
    addingVideoId.value = null;
  }
}

async function onAccessKeyConfirmed(key: string) {
  setStoredAccessKey(key);
  showAccessKeyModal.value = false;
  if (pendingVideoToAdd.value) {
    const v = pendingVideoToAdd.value;
    pendingVideoToAdd.value = null;
    await handleAddToProduction(v);
  }
}

// Filter & Sort State
const filters = reactive<OpportunityFilterState>({
  timeWindow: '7d', // Mặc định 7 ngày theo Section 5
  channelId: 'all',
  searchQuery: '',
  quickFilter: 'all',
  sortOption: 'vph_desc',
});

// Time Window Options
const timeWindows: { id: OpportunityTimeWindow; label: string }[] = [
  { id: '24h', label: '24 giờ' },
  { id: '3d', label: '3 ngày' },
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: 'all', label: 'Tất cả' },
];

// Quick Filter Tabs
const quickFilterTabs: { id: OpportunityQuickFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'over_threshold', label: 'Vượt ngưỡng' },
  { id: 'alerted', label: 'Đã cảnh báo' },
  { id: 'unalerted', label: 'Chưa cảnh báo' },
];

// Load Data
async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    allVideos.value = await opportunityService.fetchOpportunityVideos();
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải danh sách Video Tiềm Năng.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  document.title = 'Video Tiềm Năng — Bắt Bài Đối Thủ';
  loadData();
});

// Unique Channels list for dropdown
const uniqueChannels = computed(() => {
  const map = new Map<string, { id: string; name: string }>();
  for (const v of allVideos.value) {
    if (!map.has(v.channel.id)) {
      map.set(v.channel.id, { id: v.channel.id, name: v.channel.name });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
});

// Filtered videos based on current filters
const filteredVideos = computed(() => {
  return opportunityService.filterOpportunityVideos(allVideos.value, filters);
});

// Sorted & Displayed videos
const displayedVideos = computed(() => {
  return opportunityService.sortOpportunityVideos(filteredVideos.value, filters.sortOption);
});

// Top rising video (Rank #1 in current set)
const topRisingVideo = computed(() => {
  if (filteredVideos.value.length === 0) return null;
  // Video with max latest_measured_vph in current filtered set
  const sorted = [...filteredVideos.value].sort((a, b) => b.latestMeasuredVph - a.latestMeasuredVph);
  return sorted[0] || null;
});

// Top 4 stats calculated over the time-filtered and channel-filtered set
const stats = computed(() => {
  return opportunityService.calculateOpportunityStats(filteredVideos.value);
});

// Tab Counts
function getTabCount(tabId: OpportunityQuickFilter): number {
  const baseList = opportunityService.filterOpportunityVideos(allVideos.value, {
    ...filters,
    quickFilter: 'all',
  });
  if (tabId === 'all') return baseList.length;
  if (tabId === 'over_threshold') return baseList.filter(v => v.isOverThreshold).length;
  if (tabId === 'alerted') return baseList.filter(v => v.alert?.status === 'sent').length;
  if (tabId === 'unalerted') return baseList.filter(v => !v.alert || v.alert.status !== 'sent').length;
  return 0;
}

// Reset Filters
function resetFilters() {
  filters.timeWindow = '7d';
  filters.channelId = 'all';
  filters.searchQuery = '';
  filters.quickFilter = 'all';
  filters.sortOption = 'vph_desc';
}

// Dynamic empty message based on active window
function getEmptyMessage() {
  const twLabel = timeWindows.find(t => t.id === filters.timeWindow)?.label || 'khoảng thời gian này';
  return {
    title: `Chưa có video tiềm năng trong ${twLabel} gần đây.`,
    desc: 'Bạn có thể mở rộng khoảng thời gian để xem thêm video.',
  };
}

// Formatting helpers
function formatViews(views: number): string {
  return Math.round(views).toLocaleString('vi-VN');
}

function formatVph(vph: number): string {
  return `${Math.round(vph).toLocaleString('vi-VN')} VPH`;
}

function formatViewDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return '—';
  if (delta <= 0) return '0 lượt xem';
  return `+${Math.round(delta).toLocaleString('vi-VN')} lượt xem`;
}

function handleImgError(e: Event) {
  const img = e.target as HTMLImageElement;
  if (img) img.style.display = 'none';
}
</script>

<style scoped>
.opportunity-page {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 1. Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0 0 6px 0;
}

.page-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  max-width: 680px;
  line-height: 1.5;
}

/* 2. Time Filter Section */
.time-filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 18px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
}

.time-filter-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.time-pill-btn {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  background-color: var(--bg-surface-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.15s ease;
}

.time-pill-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.time-pill-active {
  background-color: var(--accent);
  color: #0F172A;
  font-weight: 600;
  border-color: var(--accent);
}

.time-filter-caption {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.time-filter-caption svg {
  color: var(--accent);
}

/* Error Alert */
.error-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: var(--danger);
}

.error-alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

/* 3. Top 4 Stats Grid */
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
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-val {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-desc {
  font-size: 11px;
  color: var(--text-muted);
}

/* Text Highlights */
.text-accent {
  color: var(--signal-accent, #38BDF8);
}

.text-threshold {
  color: var(--signal-warning, #F59E0B);
}

.text-delta {
  color: var(--signal-positive, #34D399);
}

.text-muted {
  color: var(--text-muted);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* 4. Top Rising Hero Card */
.top-rising-hero-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--card-shadow);
}

.hero-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 12px;
}

.hero-badge-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rank-tag {
  background-color: var(--accent);
  color: var(--accent-text, #0F172A);
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: ui-monospace, monospace;
}

.hero-heading {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.hero-subheading {
  font-size: 12px;
  color: var(--text-secondary);
}

.hero-body {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-thumb-wrap {
  width: 220px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-thumb-fallback {
  color: var(--text-muted);
}

.hero-info-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.hero-video-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-video-title:hover {
  color: var(--accent);
}

.hero-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.hero-channel-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 600;
}

.hero-channel-link:hover {
  color: var(--accent);
}

.hero-avatar-wrap {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
}

.hero-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-avatar-fallback {
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  line-height: 20px;
  color: var(--text-secondary);
}

.dot-separator {
  color: var(--text-muted);
}

.hero-metrics-row {
  display: flex;
  align-items: center;
  gap: 20px;
  background-color: var(--bg-surface-elevated);
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}

.h-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.h-lbl {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.h-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-threshold {
  flex: 1;
  min-width: 180px;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: var(--progress-track, rgba(255, 255, 255, 0.08));
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #38BDF8;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.fill-over {
  background-color: #F59E0B;
}

.progress-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.badge-threshold-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  background-color: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
  text-transform: uppercase;
}

.hero-actions-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

/* 5. Toolbar Card */
.toolbar-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: var(--accent);
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
}

.select-wrap {
  flex-shrink: 0;
}

.custom-select {
  padding: 8px 14px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.custom-select:focus {
  border-color: var(--accent);
}

.quick-filter-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  border-top: 1px solid var(--border-subtle);
  padding-top: 10px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  background-color: var(--bg-surface-elevated);
  color: var(--text-primary);
}

.tab-btn-active {
  background-color: var(--bg-surface-elevated);
  color: var(--accent);
  font-weight: 600;
}

.tab-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 9999px;
  background-color: var(--badge-neutral-bg, rgba(255, 255, 255, 0.08));
}

/* 6. Empty State */
.empty-state-box {
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

.empty-icon-wrap {
  color: var(--text-muted);
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 440px;
  margin: 0;
  line-height: 1.5;
}

/* 7. Desktop Table */
.desktop-table-container {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow-x: auto;
}

.opportunity-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.opportunity-table th {
  padding: 10px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.opportunity-table td {
  padding: 10px 10px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.opp-table-row:hover {
  background-color: var(--bg-surface-elevated);
}

/* Column Specific Widths */
.th-video, .td-video { min-width: 230px; }
.th-channel, .td-channel { min-width: 120px; max-width: 150px; }
.th-age, .td-age { min-width: 75px; }
.th-views, .td-views { min-width: 85px; }
.th-vph, .td-vph { min-width: 90px; }
.th-delta, .td-delta { min-width: 100px; }
.th-threshold, .td-threshold { min-width: 110px; }
.th-alert, .td-alert { min-width: 85px; }
.th-actions, .td-actions { min-width: 205px; }

/* Table Cells */
.video-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 230px;
  max-width: 360px;
}

.cell-thumb-wrap {
  width: 72px;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cell-thumb-fallback {
  color: var(--text-muted);
}

.cell-title-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.cell-video-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cell-video-title:hover {
  color: var(--accent);
}

.cell-yt-id {
  font-size: 10px;
  color: var(--text-muted);
}

.cell-channel-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
}

.cell-channel-link:hover {
  color: var(--accent);
}

.cell-avatar-wrap {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  flex-shrink: 0;
}

.cell-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cell-avatar-fallback {
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  line-height: 22px;
  color: var(--text-secondary);
}

.age-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.views-val {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.vph-val {
  font-weight: 700;
  white-space: nowrap;
}

.delta-val {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.threshold-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
}

.progress-bar-small {
  width: 100%;
  height: 4px;
  background-color: var(--progress-track, rgba(255, 255, 255, 0.08));
  border-radius: 2px;
  overflow: hidden;
}

.threshold-ratio-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.threshold-ratio-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* Badges */
.badge-alert {
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.alert-muted {
  background-color: rgba(100, 116, 139, 0.12);
  color: var(--text-secondary);
}

.alert-warning {
  background-color: rgba(234, 179, 8, 0.12);
  color: #EAB308;
}

.alert-success {
  background-color: rgba(34, 197, 94, 0.12);
  color: #22C55E;
}

.alert-danger {
  background-color: rgba(239, 68, 68, 0.12);
  color: #EF4444;
}

.cell-actions-group {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.cell-actions-group .btn-xs {
  padding: 4px 8px;
  font-size: 11px;
  line-height: 1.2;
  gap: 4px;
  border-radius: 6px;
  white-space: nowrap;
}

.cell-actions-group .btn-icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: var(--text-secondary);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.cell-actions-group .btn-icon-link:hover {
  color: var(--text-primary);
  border-color: var(--accent);
}

/* 8. Mobile Cards Container (< 900px) */
.mobile-cards-container {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.opp-mobile-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.m-card-top {
  display: flex;
  gap: 12px;
}

.m-thumb-wrap {
  width: 100px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.m-thumb-fallback {
  color: var(--text-muted);
}

.m-title-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.m-video-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.m-channel-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.m-channel-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
}

.m-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  background-color: var(--bg-surface-elevated);
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.m-metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-lbl {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.m-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-alert-mini {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
}

.m-threshold-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.m-progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.m-progress-lbl {
  color: var(--text-secondary);
}

.m-progress-val {
  font-weight: 600;
  color: var(--text-primary);
}

.m-over-tag {
  display: flex;
}

.m-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flex-1 {
  flex: 1;
  text-align: center;
  justify-content: center;
}

/* Skeleton Loading */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-card {
  height: 90px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite;
}

.skeleton-hero {
  height: 160px;
  background-color: var(--bg-surface);
  border-radius: 14px;
  animation: pulse 1.5s infinite;
}

.skeleton-table {
  height: 320px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Breakpoints */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-body {
    flex-direction: column;
    align-items: stretch;
  }
  .hero-thumb-wrap {
    width: 100%;
  }
  .hero-actions-col {
    flex-direction: row;
  }
}

@media (max-width: 900px) {
  .desktop-table-container {
    display: none;
  }
  .mobile-cards-container {
    display: flex;
  }
}

@media (max-width: 640px) {
  .opportunity-page {
    padding: 16px;
    gap: 16px;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .time-filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-top-row {
    flex-direction: column;
    align-items: stretch;
  }
  .search-input-wrap,
  .select-wrap,
  .custom-select {
    width: 100%;
  }
}

.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: var(--bg-surface-elevated, #1e293b);
  color: var(--text-primary, #f8fafc);
  border: 1px solid var(--border-subtle, #334155);
  border-left: 4px solid var(--accent, #6366f1);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
