<template>
  <div class="channel-comparison-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <div class="page-eyebrow">ĐỐI SOÁT ĐỐI THỦ</div>
        <h1 class="page-title">So Sánh Kênh</h1>
        <p class="page-description">
          Đặt dữ liệu đo thực tế của 2–4 kênh đối thủ cạnh nhau để đối chiếu tốc độ tăng trưởng, hiệu suất video và xu hướng 24h.
        </p>
      </div>

      <div class="page-header-actions">
        <button
          class="btn btn-secondary"
          :disabled="loading"
          @click="loadComparisonData"
          title="Tải lại dữ liệu so sánh mới nhất"
        >
          <AppIcon name="refresh" size="16" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="error-alert">
      <div class="error-alert-content">
        <AppIcon name="alert" size="18" />
        <span>{{ error }}</span>
      </div>
      <button class="btn btn-secondary btn-sm" @click="loadComparisonData">
        <AppIcon name="refresh" size="14" />
        <span>Thử Lại</span>
      </button>
    </div>

    <!-- Section 1: Channel Selector Card -->
    <div class="card selector-card">
      <div class="selector-header">
        <div class="selector-title-row">
          <AppIcon name="bar-chart-2" size="20" class="text-accent" />
          <h2 class="selector-title">Kênh Đang So Sánh ({{ selectedChannelIds.length }}/4)</h2>
        </div>
        <span class="selection-guide-text" :class="{ 'text-warning': selectedChannelIds.length < 2 }">
          {{ selectionValidationMessage }}
        </span>
      </div>

      <!-- Selected Channels Chips -->
      <div v-if="selectedChannels.length > 0" class="selected-chips-container">
        <div
          v-for="(ch, idx) in selectedChannels"
          :key="ch.id"
          class="channel-chip"
          :style="{ borderColor: COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length] }"
        >
          <div
            class="chip-color-dot"
            :style="{ backgroundColor: COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length] }"
          ></div>
          <img
            v-if="ch.avatarUrl"
            :src="ch.avatarUrl"
            :alt="ch.name"
            class="chip-avatar"
          />
          <div v-else class="chip-avatar-placeholder">
            {{ ch.name.charAt(0) }}
          </div>
          <span class="chip-name">{{ ch.name }}</span>
          <button
            class="chip-remove-btn"
            @click="removeChannel(ch.id)"
            title="Bỏ kênh khỏi danh sách so sánh"
            aria-label="Xóa kênh"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Channel Search & Add Picker -->
      <div class="picker-section">
        <div class="picker-search-bar">
          <AppIcon name="search" size="16" class="search-icon" />
          <input
            v-model="channelSearchQuery"
            type="text"
            placeholder="Tìm kiếm kênh để thêm vào so sánh..."
            class="picker-input"
            :disabled="selectedChannelIds.length >= 4"
          />
          <button
            v-if="channelSearchQuery"
            class="clear-btn"
            @click="channelSearchQuery = ''"
          >
            ✕
          </button>
        </div>

        <!-- Available Channels Dropdown/List -->
        <div v-if="availableFilteredChannels.length > 0 && selectedChannelIds.length < 4" class="available-channels-list">
          <button
            v-for="ch in availableFilteredChannels"
            :key="ch.id"
            class="available-channel-item"
            @click="addChannel(ch.id)"
          >
            <img
              v-if="ch.avatarUrl"
              :src="ch.avatarUrl"
              :alt="ch.name"
              class="available-avatar"
            />
            <div v-else class="available-avatar-placeholder">
              {{ ch.name.charAt(0) }}
            </div>
            <div class="available-info">
              <span class="available-name">{{ ch.name }}</span>
              <span v-if="ch.handle" class="available-handle">{{ ch.handle }}</span>
            </div>
            <span class="available-add-icon">+ Thêm</span>
          </button>
        </div>

        <div v-else-if="channelSearchQuery && availableFilteredChannels.length === 0" class="no-results-hint">
          Không tìm thấy kênh phù hợp với từ khóa "{{ channelSearchQuery }}".
        </div>
      </div>
    </div>

    <!-- Empty State when < 2 channels -->
    <div v-if="selectedChannelIds.length < 2" class="empty-selection-card">
      <div class="empty-icon-wrap">
        <AppIcon name="bar-chart-2" size="40" />
      </div>
      <h3 class="empty-title">
        {{ selectedChannelIds.length === 0 ? 'Chọn ít nhất 2 kênh để bắt đầu so sánh.' : 'Hãy chọn thêm 1 kênh để bắt đầu so sánh.' }}
      </h3>
      <p class="empty-desc">
        Hệ thống sẽ đối chiếu số liệu VPH đo được, số lượng video đang tăng, lượt xem thực tế và xu hướng 24h giữa các kênh bạn chọn.
      </p>
    </div>

    <!-- Comparison Results (When >= 2 channels) -->
    <template v-else>
      <!-- Time Window Controls -->
      <div class="filter-controls-bar">
        <div class="window-label">Khoảng thời gian video đăng:</div>
        <div class="window-buttons">
          <button
            v-for="(label, key) in TIME_WINDOW_LABELS"
            :key="key"
            class="window-btn"
            :class="{ 'window-btn-active': timeWindow === key }"
            @click="setTimeWindow(key)"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading && !comparisonData" class="skeleton-wrap">
        <div class="skeleton-table"></div>
        <div class="skeleton-chart"></div>
      </div>

      <template v-else-if="comparisonData && comparisonData.channels.length >= 2">
        <!-- 1. Comparison Table (Desktop View) -->
        <div class="card comparison-table-card desktop-only">
          <div class="section-title-wrap">
            <h2 class="section-title">Bảng Đối Chiếu Số Liệu</h2>
            <span class="section-subtitle">Dữ liệu được tính dựa trên các video được xuất bản trong khoảng thời gian đã chọn.</span>
          </div>

          <div class="table-container">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th class="metric-col-header">Chỉ Số Đo Lường</th>
                  <th
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="channel-col-header"
                    :style="{ borderTopColor: ch.color }"
                  >
                    <div class="th-channel-card">
                      <div class="th-channel-top">
                        <img
                          v-if="ch.avatarUrl"
                          :src="ch.avatarUrl"
                          :alt="ch.name"
                          class="th-avatar"
                        />
                        <div v-else class="th-avatar-placeholder" :style="{ backgroundColor: ch.color }">
                          {{ ch.name.charAt(0) }}
                        </div>
                        <div class="th-channel-names">
                          <router-link :to="`/kenh-theo-doi/${ch.id}`" class="th-name-link" :title="ch.name">
                            {{ ch.name }}
                          </router-link>
                          <span v-if="ch.handle" class="th-handle">{{ ch.handle }}</span>
                        </div>
                      </div>
                      <span class="badge-status-sm" :class="`status-${ch.status}`">
                        {{ ch.statusLabel }}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Số video -->
                <tr>
                  <td class="metric-name-cell">
                    <div class="metric-title">Số video</div>
                    <div class="metric-hint">Video đăng trong khoảng thời gian</div>
                  </td>
                  <td
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="metric-val-cell mono"
                    :class="{ 'cell-max-highlight': isMaxInMetric(ch, 'videoCount') }"
                  >
                    {{ ch.metrics.videoCount }}
                  </td>
                </tr>

                <!-- Video đang tăng -->
                <tr>
                  <td class="metric-name-cell">
                    <div class="metric-title">Video đang tăng</div>
                    <div class="metric-hint">Số video có VPH đo được lớn hơn 0</div>
                  </td>
                  <td
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="metric-val-cell mono"
                    :class="{ 'cell-max-highlight': isMaxInMetric(ch, 'risingVideoCount') }"
                  >
                    <span :class="ch.metrics.risingVideoCount > 0 ? 'text-rising' : ''">
                      {{ ch.metrics.risingVideoCount }}
                    </span>
                  </td>
                </tr>

                <!-- Tỷ lệ đang tăng -->
                <tr>
                  <td class="metric-name-cell">
                    <div class="metric-title">Tỷ lệ đang tăng</div>
                    <div class="metric-hint">% trên các video có đo được VPH</div>
                  </td>
                  <td
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="metric-val-cell mono"
                    :class="{ 'cell-max-highlight': isMaxInMetric(ch, 'risingVideoRatio') }"
                  >
                    {{ ch.metrics.risingVideoRatio !== null ? `${ch.metrics.risingVideoRatio}%` : '—' }}
                  </td>
                </tr>

                <!-- VPH cao nhất (Focal Row) -->
                <tr class="row-focal-vph">
                  <td class="metric-name-cell">
                    <div class="metric-title focal-title">VPH cao nhất ★</div>
                    <div class="metric-hint">Tốc độ tăng cao nhất đo được</div>
                  </td>
                  <td
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="metric-val-cell mono font-semibold focal-val"
                    :class="{ 'cell-max-highlight': isMaxInMetric(ch, 'maxVph') }"
                  >
                    {{ ch.metrics.maxVph !== null ? formatNumber(ch.metrics.maxVph) : '—' }}
                  </td>
                </tr>

                <!-- VPH trung bình đo được -->
                <tr>
                  <td class="metric-name-cell">
                    <div class="metric-title">VPH trung bình đo được</div>
                    <div class="metric-hint">Trung bình các video đã có snapshot (gồm 0)</div>
                  </td>
                  <td
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="metric-val-cell mono"
                    :class="{ 'cell-max-highlight': isMaxInMetric(ch, 'avgMeasuredVph') }"
                  >
                    {{ ch.metrics.avgMeasuredVph !== null ? formatNumber(ch.metrics.avgMeasuredVph) : '—' }}
                  </td>
                </tr>

                <!-- Lượt xem đang theo dõi -->
                <tr>
                  <td class="metric-name-cell">
                    <div class="metric-title" title="Tổng lượt xem hiện tại của các video đang được hệ thống theo dõi trong khoảng thời gian đã chọn.">
                      Lượt xem đang theo dõi ⓘ
                    </div>
                    <div class="metric-hint">Tổng views của các video trong khoảng lọc</div>
                  </td>
                  <td
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="metric-val-cell mono"
                    :class="{ 'cell-max-highlight': isMaxInMetric(ch, 'trackedViews') }"
                  >
                    {{ formatNumber(ch.metrics.trackedViews) }}
                  </td>
                </tr>

                <!-- View tăng ở lần đo gần nhất -->
                <tr>
                  <td class="metric-name-cell">
                    <div class="metric-title">Lượt xem tăng ở lần đo gần nhất</div>
                    <div class="metric-hint">Tổng delta lượt xem snapshot mới nhất</div>
                  </td>
                  <td
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="metric-val-cell mono"
                    :class="{ 'cell-max-highlight': isMaxInMetric(ch, 'latestViewDelta') }"
                  >
                    <span v-if="ch.metrics.latestViewDelta !== null" :class="ch.metrics.latestViewDelta > 0 ? 'text-rising' : ''">
                      +{{ formatNumber(ch.metrics.latestViewDelta) }}
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                </tr>

                <!-- Ngưỡng cảnh báo VPH -->
                <tr>
                  <td class="metric-name-cell">
                    <div class="metric-title">Ngưỡng cảnh báo VPH</div>
                    <div class="metric-hint">Mốc kích hoạt cảnh báo Discord</div>
                  </td>
                  <td
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="metric-val-cell mono text-muted"
                  >
                    {{ formatNumber(ch.alertVphThreshold) }} VPH
                  </td>
                </tr>

                <!-- Cập nhật kênh gần nhất -->
                <tr>
                  <td class="metric-name-cell">
                    <div class="metric-title">Cập nhật kênh gần nhất</div>
                    <div class="metric-hint">Thời điểm quét dữ liệu kênh lần cuối</div>
                  </td>
                  <td
                    v-for="ch in comparisonData.channels"
                    :key="ch.id"
                    class="metric-val-cell text-sm"
                  >
                    {{ ch.relativeScanTime }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Comparison Cards (Mobile View) -->
        <div class="mobile-comparison-cards mobile-only">
          <div
            v-for="ch in comparisonData.channels"
            :key="ch.id"
            class="card mobile-channel-card"
            :style="{ borderTopColor: ch.color }"
          >
            <div class="mobile-card-header">
              <div class="mobile-channel-top">
                <img
                  v-if="ch.avatarUrl"
                  :src="ch.avatarUrl"
                  :alt="ch.name"
                  class="th-avatar"
                />
                <div v-else class="th-avatar-placeholder" :style="{ backgroundColor: ch.color }">
                  {{ ch.name.charAt(0) }}
                </div>
                <div>
                  <router-link :to="`/kenh-theo-doi/${ch.id}`" class="th-name-link font-semibold">
                    {{ ch.name }}
                  </router-link>
                  <div v-if="ch.handle" class="th-handle">{{ ch.handle }}</div>
                </div>
              </div>
              <span class="badge-status-sm" :class="`status-${ch.status}`">
                {{ ch.statusLabel }}
              </span>
            </div>

            <div class="mobile-metrics-grid">
              <div class="mobile-metric-item">
                <span class="metric-label">Số video</span>
                <span class="metric-val mono">{{ ch.metrics.videoCount }}</span>
              </div>
              <div class="mobile-metric-item">
                <span class="metric-label">Video đang tăng</span>
                <span class="metric-val mono" :class="ch.metrics.risingVideoCount > 0 ? 'text-rising' : ''">
                  {{ ch.metrics.risingVideoCount }}
                </span>
              </div>
              <div class="mobile-metric-item">
                <span class="metric-label">Tỷ lệ đang tăng</span>
                <span class="metric-val mono">
                  {{ ch.metrics.risingVideoRatio !== null ? `${ch.metrics.risingVideoRatio}%` : '—' }}
                </span>
              </div>
              <div class="mobile-metric-item">
                <span class="metric-label">VPH cao nhất</span>
                <span class="metric-val mono font-semibold">
                  {{ ch.metrics.maxVph !== null ? formatNumber(ch.metrics.maxVph) : '—' }}
                </span>
              </div>
              <div class="mobile-metric-item">
                <span class="metric-label">VPH trung bình</span>
                <span class="metric-val mono">
                  {{ ch.metrics.avgMeasuredVph !== null ? formatNumber(ch.metrics.avgMeasuredVph) : '—' }}
                </span>
              </div>
              <div class="mobile-metric-item">
                <span class="metric-label">Lượt xem theo dõi</span>
                <span class="metric-val mono">
                  {{ formatNumber(ch.metrics.trackedViews) }}
                </span>
              </div>
              <div class="mobile-metric-item">
                <span class="metric-label">Delta view gần nhất</span>
                <span class="metric-val mono">
                  <span v-if="ch.metrics.latestViewDelta !== null" :class="ch.metrics.latestViewDelta > 0 ? 'text-rising' : ''">
                    +{{ formatNumber(ch.metrics.latestViewDelta) }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </span>
              </div>
              <div class="mobile-metric-item">
                <span class="metric-label">Ngưỡng VPH</span>
                <span class="metric-val mono text-muted">
                  {{ formatNumber(ch.alertVphThreshold) }} VPH
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Xu Hướng VPH Gần Đây (24h SVG Trend Chart) -->
        <div class="card trend-chart-card">
          <div class="section-header-flex">
            <div>
              <h2 class="section-title">Xu Hướng VPH Gần Đây</h2>
              <p class="section-subtitle">
                Biểu đồ dùng các snapshot được ghi nhận trong 24 giờ gần nhất.
              </p>
            </div>

            <!-- Chart Legends -->
            <div class="chart-legends">
              <div
                v-for="ch in comparisonData.channels"
                :key="ch.id"
                class="legend-item"
              >
                <span class="legend-dot" :style="{ backgroundColor: ch.color }"></span>
                <span class="legend-name">{{ ch.name }}</span>
              </div>
            </div>
          </div>

          <!-- SVG Chart Container -->
          <div v-if="hasTrendData" class="svg-chart-wrapper">
            <svg
              viewBox="0 0 900 280"
              class="trend-svg"
              @mouseleave="activeTooltip = null"
            >
              <!-- Grid Lines -->
              <g class="grid-lines">
                <line
                  v-for="tick in yAxisTicks"
                  :key="tick.value"
                  x1="60"
                  :y1="tick.y"
                  x2="880"
                  :y2="tick.y"
                  class="trend-grid-line"
                  stroke-dasharray="3 3"
                />
              </g>

              <!-- Y-Axis Labels -->
              <g class="y-axis-labels">
                <text
                  v-for="tick in yAxisTicks"
                  :key="tick.value"
                  x="50"
                  :y="tick.y + 4"
                  text-anchor="end"
                  class="svg-axis-text"
                >
                  {{ formatNumber(tick.value) }}
                </text>
              </g>

              <!-- X-Axis Labels -->
              <g class="x-axis-labels">
                <text
                  v-for="(label, idx) in xAxisLabels"
                  :key="idx"
                  :x="label.x"
                  y="265"
                  text-anchor="middle"
                  class="svg-axis-text"
                >
                  {{ label.text }}
                </text>
              </g>

              <!-- Channel Paths & Points -->
              <g v-for="ch in comparisonData.channels" :key="ch.id">
                <path
                  v-if="getChannelPath(ch)"
                  :d="getChannelPath(ch)"
                  fill="none"
                  :stroke="ch.color"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />

                <!-- Point Circles -->
                <circle
                  v-for="pt in getChannelPlotPoints(ch)"
                  :key="pt.hourKey"
                  :cx="pt.x"
                  :cy="pt.y"
                  r="4.5"
                  :fill="ch.color"
                  class="plot-point-circle"
                  @mouseenter="activeTooltip = { ...pt, channelName: ch.name, color: ch.color }"
                  @touchstart="activeTooltip = { ...pt, channelName: ch.name, color: ch.color }"
                />
              </g>
            </svg>

            <!-- Chart Hover Tooltip -->
            <div
              v-if="activeTooltip"
              class="chart-tooltip"
              :style="{ left: `${(activeTooltip.x / 900) * 100}%`, top: `${(activeTooltip.y / 280) * 100}%` }"
            >
              <div class="tooltip-header" :style="{ color: activeTooltip.color }">
                ● {{ activeTooltip.channelName }}
              </div>
              <div class="tooltip-time">{{ activeTooltip.hourLabel }}</div>
              <div class="tooltip-vph font-semibold">
                VPH trung bình: {{ formatNumber(activeTooltip.avgVph) }}
              </div>
              <div class="tooltip-sample text-muted">
                ({{ activeTooltip.sampleCount }} snapshot đo được)
              </div>
            </div>
          </div>

          <div v-else class="empty-chart-note">
            Chưa đủ dữ liệu VPH trong 24 giờ gần nhất cho các kênh đã chọn.
          </div>
        </div>

        <!-- 3. Top Video Mỗi Kênh (Video Tăng Nhanh Theo Kênh) -->
        <div class="card top-videos-card">
          <div class="section-title-wrap">
            <h2 class="section-title">Video Tăng Nhanh Theo Kênh</h2>
            <span class="section-subtitle">Tối đa 5 video có tốc độ tăng trưởng (VPH) cao nhất của từng kênh.</span>
          </div>

          <div class="channels-top-videos-grid">
            <div
              v-for="ch in comparisonData.channels"
              :key="ch.id"
              class="channel-videos-column"
            >
              <!-- Column Header -->
              <div class="col-header" :style="{ borderLeftColor: ch.color }">
                <span class="col-channel-name">{{ ch.name }}</span>
                <span class="col-video-count text-muted">({{ ch.topVideos.length }} video)</span>
              </div>

              <!-- Videos List -->
              <div v-if="ch.topVideos.length > 0" class="videos-list">
                <div
                  v-for="v in ch.topVideos"
                  :key="v.id"
                  class="video-card-item"
                >
                  <div class="video-card-thumb-wrap">
                    <img
                      v-if="v.thumbnailUrl"
                      :src="v.thumbnailUrl"
                      :alt="v.title"
                      class="video-card-thumb"
                      loading="lazy"
                    />
                    <div v-else class="video-card-thumb-placeholder">Video</div>
                  </div>

                  <div class="video-card-details">
                    <router-link :to="`/videos/${v.id}`" class="video-card-title" :title="v.title">
                      {{ v.title }}
                    </router-link>

                    <div class="video-card-meta">
                      <span class="meta-time">{{ v.relativePublishedAt }}</span>
                      <span class="meta-views mono">{{ formatNumber(v.latestViewCount) }} views</span>
                    </div>

                    <div class="video-card-vph-row">
                      <div class="vph-tag">
                        <span class="vph-tag-label">VPH:</span>
                        <span
                          class="vph-tag-val mono font-semibold"
                          :class="v.latestMeasuredVph !== null && v.latestMeasuredVph > 0 ? 'text-rising' : 'text-muted'"
                        >
                          {{ v.latestMeasuredVph !== null ? formatNumber(v.latestMeasuredVph) : '—' }}
                        </span>
                      </div>

                      <div v-if="v.latestViewDelta !== null" class="delta-tag mono">
                        <span :class="v.latestViewDelta > 0 ? 'text-rising' : 'text-muted'">
                          +{{ formatNumber(v.latestViewDelta) }}
                        </span>
                      </div>
                    </div>

                    <div class="video-card-footer">
                      <span class="badge-alert" :class="`alert-${v.alertStatus}`">
                        {{ v.alertStatusLabel }}
                      </span>
                      <a
                        :href="`https://www.youtube.com/watch?v=${v.youtubeVideoId}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="youtube-link"
                      >
                        YouTube ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="empty-col-note">
                Không có video nào trong khoảng thời gian đã chọn.
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import { channelComparisonService } from '@/services/channel-comparison-service';
import type {
  ComparisonTimeWindow,
  ComparableChannelOption,
  ChannelComparisonData,
  ChannelComparisonItem,
} from '@/types/channel-comparison';
import { TIME_WINDOW_LABELS, COMPARISON_PALETTE } from '@/types/channel-comparison';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref<string | null>(null);

const allComparableChannels = ref<ComparableChannelOption[]>([]);
const selectedChannelIds = ref<string[]>([]);
const timeWindow = ref<ComparisonTimeWindow>('7d');

const comparisonData = ref<ChannelComparisonData | null>(null);
const channelSearchQuery = ref('');
const activeTooltip = ref<any | null>(null);

// Validation message
const selectionValidationMessage = computed(() => {
  const count = selectedChannelIds.value.length;
  if (count === 0) return 'Chọn ít nhất 2 kênh để bắt đầu so sánh.';
  if (count === 1) return 'Hãy chọn thêm 1 kênh.';
  if (count >= 4) return 'Có thể so sánh tối đa 4 kênh cùng lúc.';
  return `Đang so sánh ${count} kênh. Có thể chọn thêm ${4 - count} kênh.`;
});

// Selected channels details from available list
const selectedChannels = computed(() => {
  return selectedChannelIds.value
    .map(id => allComparableChannels.value.find(c => c.id === id))
    .filter((c): c is ComparableChannelOption => Boolean(c));
});

// Available channels for picker (not already selected, matching search)
const availableFilteredChannels = computed(() => {
  const selectedSet = new Set(selectedChannelIds.value);
  let list = allComparableChannels.value.filter(c => !selectedSet.has(c.id));

  if (channelSearchQuery.value.trim()) {
    const q = channelSearchQuery.value.toLowerCase().trim();
    list = list.filter(
      c => c.name.toLowerCase().includes(q) || (c.handle && c.handle.toLowerCase().includes(q))
    );
  }

  return list.slice(0, 8); // Tối đa 8 gợi ý
});

// Check if a metric value is highest in the group (for subtle highlighting)
function isMaxInMetric(
  ch: ChannelComparisonItem,
  metricKey: keyof ChannelComparisonItem['metrics']
): boolean {
  if (!comparisonData.value || comparisonData.value.channels.length < 2) return false;
  const val = ch.metrics[metricKey];
  if (val === null || val === undefined || Number(val) <= 0) return false;

  const allVals = comparisonData.value.channels
    .map(c => c.metrics[metricKey])
    .filter((v): v is number => v !== null && v !== undefined);

  if (allVals.length === 0) return false;
  const max = Math.max(...allVals);
  return Number(val) === max && max > 0;
}

// Format numbers with vi-VN locale
function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0';
  return n.toLocaleString('vi-VN');
}

// Add channel to comparison
function addChannel(id: string) {
  if (selectedChannelIds.value.length >= 4) return;
  if (!selectedChannelIds.value.includes(id)) {
    selectedChannelIds.value.push(id);
    channelSearchQuery.value = '';
    syncQueryState();
  }
}

// Remove channel from comparison
function removeChannel(id: string) {
  selectedChannelIds.value = selectedChannelIds.value.filter(cid => cid !== id);
  syncQueryState();
}

// Change time window
function setTimeWindow(win: ComparisonTimeWindow) {
  timeWindow.value = win;
  syncQueryState();
}

// Sync selection to URL query parameters
function syncQueryState() {
  const query: Record<string, string> = {};
  if (selectedChannelIds.value.length > 0) {
    query.channels = selectedChannelIds.value.join(',');
  }
  if (timeWindow.value !== '7d') {
    query.range = timeWindow.value;
  }
  router.replace({ query });
}

// Load data for comparison
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

// -------------------------------------------------------------
// SVG Trend Chart Helpers
// -------------------------------------------------------------
const hasTrendData = computed(() => {
  if (!comparisonData.value) return false;
  return comparisonData.value.channels.some(c => c.trendPoints.length > 0);
});

// Max VPH across all trend points for scaling
const chartMaxVph = computed(() => {
  if (!comparisonData.value) return 100;
  let max = 0;
  for (const ch of comparisonData.value.channels) {
    for (const pt of ch.trendPoints) {
      if (pt.avgVph > max) max = pt.avgVph;
    }
  }
  return max > 0 ? Math.ceil(max * 1.15) : 100;
});

// Y-Axis ticks (4 nice divisions)
const yAxisTicks = computed(() => {
  const max = chartMaxVph.value;
  const ticks = [0, Math.round(max * 0.33), Math.round(max * 0.66), max];
  return ticks.map(val => ({
    value: val,
    y: 240 - (val / max) * 200,
  }));
});

// Sorted hour keys across all channels
const allTrendHours = computed(() => {
  if (!comparisonData.value) return [];
  return comparisonData.value.allTrendHourKeys;
});

// X-Axis labels for chart
const xAxisLabels = computed(() => {
  const hours = allTrendHours.value;
  if (hours.length === 0) return [];
  // Pick up to 5 evenly spaced labels
  const count = hours.length;
  const indices = [0];
  if (count > 2) indices.push(Math.floor(count / 2));
  if (count > 1) indices.push(count - 1);

  return indices.map(idx => {
    const key = hours[idx];
    const x = 60 + (idx / Math.max(1, count - 1)) * 820;
    const parts = key.split(' ');
    const hourPart = parts[1] || '';
    return {
      x,
      text: hourPart,
    };
  });
});

// Coordinates for a channel's trend points
function getChannelPlotPoints(ch: ChannelComparisonItem) {
  const hours = allTrendHours.value;
  if (hours.length === 0) return [];
  const max = chartMaxVph.value;

  const points: Array<any> = [];
  for (const pt of ch.trendPoints) {
    const hourIdx = hours.indexOf(pt.hourKey);
    if (hourIdx !== -1) {
      const x = 60 + (hourIdx / Math.max(1, hours.length - 1)) * 820;
      const y = 240 - (pt.avgVph / max) * 200;
      points.push({
        ...pt,
        x,
        y,
      });
    }
  }
  return points;
}

// Generate SVG path string (d attribute)
function getChannelPath(ch: ChannelComparisonItem): string {
  const pts = getChannelPlotPoints(ch);
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y}`;

  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

// -------------------------------------------------------------
// Lifecycle & Query Parsing
// -------------------------------------------------------------
onMounted(async () => {
  loading.value = true;
  try {
    allComparableChannels.value = await channelComparisonService.fetchComparableChannels();

    // Parse query params
    const rawChannels = route.query.channels as string | undefined;
    const rawRange = route.query.range as string | undefined;

    if (rawRange && ['24h', '3d', '7d', '30d', 'all'].includes(rawRange)) {
      timeWindow.value = rawRange as ComparisonTimeWindow;
    }

    if (rawChannels) {
      const ids = rawChannels
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      // Validate IDs against loaded channels
      const validIds = ids.filter(id => allComparableChannels.value.some(c => c.id === id));
      selectedChannelIds.value = Array.from(new Set(validIds)).slice(0, 4);
    } else {
      // Default: if no query, pick first 2-3 active channels automatically
      const defaultPicks = allComparableChannels.value
        .filter(c => c.status === 'active')
        .slice(0, 3)
        .map(c => c.id);

      if (defaultPicks.length >= 2) {
        selectedChannelIds.value = defaultPicks;
        syncQueryState();
      }
    }

    if (selectedChannelIds.value.length >= 2) {
      await loadComparisonData();
    }
  } catch (err: any) {
    error.value = err?.message || 'Lỗi tải danh sách kênh.';
  } finally {
    loading.value = false;
  }
});

// Watch query change (e.g. browser back/forward)
watch(
  () => route.query,
  newQuery => {
    const rawChannels = newQuery.channels as string | undefined;
    const rawRange = newQuery.range as string | undefined;

    let changed = false;
    if (rawRange && ['24h', '3d', '7d', '30d', 'all'].includes(rawRange)) {
      if (timeWindow.value !== rawRange) {
        timeWindow.value = rawRange as ComparisonTimeWindow;
        changed = true;
      }
    }

    if (rawChannels) {
      const ids = rawChannels
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 4);
      if (JSON.stringify(ids) !== JSON.stringify(selectedChannelIds.value)) {
        selectedChannelIds.value = ids;
        changed = true;
      }
    }

    if (changed && selectedChannelIds.value.length >= 2) {
      loadComparisonData();
    }
  }
);

watch(
  [selectedChannelIds, timeWindow],
  () => {
    if (selectedChannelIds.value.length >= 2) {
      loadComparisonData();
    } else {
      comparisonData.value = null;
    }
  },
  { deep: true }
);
</script>

<style scoped>
.channel-comparison-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: none;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header-text {
  flex: 1;
  min-width: 260px;
}

.page-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--accent);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin: 0 0 6px 0;
}

.page-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Card base */
.card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px 22px;
}

/* Selector Card */
.selector-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.selector-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.selection-guide-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.text-warning {
  color: #f59e0b;
}

/* Selected Chips */
.selected-chips-container {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.channel-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  padding: 5px 10px 5px 8px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-primary);
}

.chip-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chip-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
}

.chip-avatar-placeholder {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: var(--accent-subtle);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.chip-name {
  font-weight: 500;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-remove-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  padding: 2px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chip-remove-btn:hover {
  color: #ef4444;
}

/* Picker Search & Available */
.picker-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 12px;
}

.picker-input {
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  flex: 1;
  outline: none;
}

.search-icon {
  color: var(--text-muted);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
}

.available-channels-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px;
  max-height: 240px;
  overflow-y: auto;
}

.available-channel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.available-channel-item:hover {
  border-color: var(--accent);
  background-color: var(--accent-subtle);
}

.available-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
}

.available-avatar-placeholder {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: var(--bg-surface-elevated);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.available-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.available-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.available-handle {
  font-size: 10px;
  color: var(--text-muted);
}

.available-add-icon {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
}

.no-results-hint {
  font-size: 12px;
  color: var(--text-muted);
  padding: 6px 4px;
}

/* Empty Selection Card */
.empty-selection-card {
  text-align: center;
  padding: 48px 24px;
  background-color: var(--bg-surface);
  border: 1px dashed var(--border-subtle);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--bg-surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 500px;
  line-height: 1.5;
  margin: 0;
}

/* Time Window Controls */
.filter-controls-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.window-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.window-buttons {
  display: flex;
  gap: 6px;
}

.window-btn {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.window-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-elevated);
}

.window-btn-active {
  background-color: var(--accent-subtle);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}

/* Comparison Table Card */
.comparison-table-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.metric-col-header {
  width: 260px;
  padding: 14px 16px;
  background-color: var(--bg-surface-elevated);
  color: var(--text-secondary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
}

.channel-col-header {
  padding: 14px 16px;
  background-color: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--border-subtle);
  border-top: 3px solid transparent;
  vertical-align: top;
  min-width: 180px;
}

.th-channel-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.th-channel-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.th-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.th-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.th-channel-names {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.th-name-link {
  color: var(--text-primary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.th-name-link:hover {
  color: var(--accent);
  text-decoration: underline;
}

.th-handle {
  font-size: 11px;
  color: var(--text-muted);
}

.badge-status-sm {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
  font-weight: 600;
}

.status-active {
  background-color: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.status-paused {
  background-color: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.metric-name-cell {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  background-color: rgba(255, 255, 255, 0.01);
}

.metric-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

.metric-val-cell {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 14px;
  color: var(--text-primary);
  vertical-align: middle;
}

.row-focal-vph {
  background-color: var(--accent-subtle, rgba(2, 132, 199, 0.08));
}

.row-focal-vph td {
  border-top: 1px solid var(--accent);
  border-bottom: 1px solid var(--accent);
}

.focal-title {
  color: var(--accent);
  font-weight: 700;
}

.focal-val {
  font-size: 15px;
  color: var(--accent);
}

.cell-max-highlight {
  background-color: var(--accent-subtle);
  color: var(--accent);
  font-weight: 800;
}

.text-rising {
  color: #10b981;
}

.text-muted {
  color: var(--text-muted);
}

/* Mobile Cards */
.mobile-comparison-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mobile-channel-card {
  border-top: 3px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-channel-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

.mobile-metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.metric-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Trend Chart Card */
.trend-chart-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.chart-legends {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.svg-chart-wrapper {
  position: relative;
  width: 100%;
  overflow-x: auto;
}

.trend-svg {
  width: 100%;
  min-width: 600px;
  height: auto;
  display: block;
}

.trend-grid-line {
  stroke: var(--border-subtle);
  opacity: 0.8;
}

.svg-axis-text {
  font-size: 10px;
  fill: var(--text-muted);
  font-family: monospace;
}

.plot-point-circle {
  cursor: pointer;
  transition: r 0.15s ease;
}

.plot-point-circle:hover {
  r: 7;
}

.chart-tooltip {
  position: absolute;
  transform: translate(-50%, -120%);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 11px;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
  z-index: 10;
}

.tooltip-header {
  font-weight: 700;
  margin-bottom: 2px;
}

.empty-chart-note {
  text-align: center;
  padding: 36px 16px;
  color: var(--text-muted);
  font-size: 13px;
  background-color: var(--bg-surface-elevated);
  border-radius: 8px;
}

/* Top Videos Card */
.top-videos-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.channels-top-videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.channel-videos-column {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.col-header {
  padding-left: 8px;
  border-left: 3px solid var(--accent);
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.col-channel-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.col-video-count {
  font-size: 11px;
}

.videos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-card-item {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px;
  display: flex;
  gap: 10px;
}

.video-card-thumb-wrap {
  width: 70px;
  height: 42px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--bg-surface-elevated);
}

.video-card-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-card-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-muted);
}

.video-card-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.video-card-title {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-card-title:hover {
  color: var(--accent);
}

.video-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: var(--text-muted);
}

.video-card-vph-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.vph-tag {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
}

.vph-tag-label {
  font-size: 10px;
  color: var(--text-muted);
}

.video-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
  border-top: 1px dashed var(--border-subtle);
  margin-top: 2px;
}

.badge-alert {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
}

.alert-sent {
  background-color: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.alert-sending,
.alert-pending {
  background-color: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.alert-failed {
  background-color: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.alert-no_alert {
  background-color: var(--bg-surface-elevated);
  color: var(--text-muted);
}

.youtube-link {
  font-size: 10px;
  color: var(--accent);
  text-decoration: none;
}

.youtube-link:hover {
  text-decoration: underline;
}

.empty-col-note {
  font-size: 12px;
  color: var(--text-muted);
  padding: 16px 8px;
  text-align: center;
}

/* Skeleton */
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-table {
  height: 240px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-chart {
  height: 260px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Visibility */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .channels-top-videos-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-actions {
    justify-content: flex-end;
  }
}
</style>
