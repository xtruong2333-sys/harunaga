<template>
  <div class="channel-detail-page">
    <!-- Top Action Bar -->
    <div class="top-bar">
      <router-link to="/kenh-theo-doi" class="btn-back">
        <AppIcon name="arrow-left" size="16" />
        <span>Quay Lại Kênh Theo Dõi</span>
      </router-link>

      <div class="top-bar-actions" v-if="analysis">
        <router-link
          :to="'/so-sanh-kenh?channels=' + analysis.channel.id"
          class="btn btn-secondary btn-sm"
          title="So sánh kênh này với kênh đối thủ khác"
        >
          <AppIcon name="bar-chart-2" size="14" />
          <span>So Sánh Kênh Này</span>
        </router-link>

        <router-link
          :to="'/video-moi-dang?channel=' + analysis.channel.id"
          class="btn btn-secondary btn-sm"
          title="Xem video mới đăng của kênh này"
        >
          <AppIcon name="clock" size="14" />
          <span>Video Mới</span>
        </router-link>

        <router-link
          :to="'/lich-dang-doi-thu?channel=' + analysis.channel.id"
          class="btn btn-secondary btn-sm"
          title="Xem lịch đăng của kênh này"
        >
          <AppIcon name="calendar" size="14" />
          <span>Lịch Đăng</span>
        </router-link>

        <button
          class="btn btn-secondary btn-sm"
          :disabled="loading"
          @click="loadChannelData"
          title="Tải lại dữ liệu mới nhất từ hệ thống"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>

        <a
          :href="analysis.channel.url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary btn-sm btn-youtube"
        >
          <span>Xem Kênh YouTube</span>
          <AppIcon name="external" size="14" />
        </a>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading && !analysis" class="skeleton-wrap">
      <div class="skeleton-hero"></div>
      <div class="skeleton-stats">
        <div v-for="n in 4" :key="n" class="skeleton-card"></div>
      </div>
      <div class="skeleton-dist"></div>
      <div class="skeleton-chart"></div>
      <div class="skeleton-table"></div>
    </div>

    <!-- Error / Invalid Channel State -->
    <div v-else-if="error || !analysis" class="error-card">
      <div class="error-icon">
        <AppIcon name="alert" size="32" />
      </div>
      <div class="error-title">
        {{ error || 'Không tìm thấy kênh này.' }}
      </div>
      <p class="error-desc">
        Kênh có thể đã bị xóa hoặc liên kết không hợp lệ. Vui lòng kiểm tra lại danh sách theo dõi.
      </p>
      <router-link to="/kenh-theo-doi" class="btn btn-secondary">
        <AppIcon name="arrow-left" size="16" />
        <span>Quay Lại Kênh Theo Dõi</span>
      </router-link>
    </div>

    <!-- Main Detail Content -->
    <template v-else>
      <!-- 1. Channel Intelligence Hero -->
      <div class="channel-hero-card">
        <div class="hero-main-row">
          <!-- Left: Channel Identity -->
          <div class="hero-left">
            <div class="hero-avatar-wrap">
              <img
                v-if="analysis.channel.avatarUrl"
                :src="analysis.channel.avatarUrl"
                :alt="analysis.channel.name"
                class="hero-avatar"
                @error="handleAvatarError"
              />
              <div v-else class="hero-avatar-fallback">
                {{ analysis.channel.name.charAt(0).toUpperCase() }}
              </div>
            </div>

            <div class="hero-titles">
              <div class="hero-title-row">
                <h1 class="hero-name">{{ analysis.channel.name }}</h1>
                <span class="badge" :class="`badge-${analysis.channel.status}`">
                  {{ analysis.channel.status === 'active' ? 'Đang theo dõi' : analysis.channel.status === 'paused' ? 'Tạm dừng' : 'Đã lưu trữ' }}
                </span>
              </div>
              <div v-if="analysis.channel.handle" class="hero-handle">
                {{ analysis.channel.handle }}
              </div>
            </div>
          </div>

          <!-- Right: Focal Intelligence Metrics Grid -->
          <div class="hero-stats-grid">
            <!-- Focal Metric: VPH cao nhất -->
            <div class="hero-stat-box focal-stat-box">
              <div class="hero-stat-label">VPH CAO NHẤT</div>
              <div
                class="hero-stat-val"
                :class="analysis.maxVph !== null && analysis.maxVph > 0 ? 'text-max-vph' : 'text-muted'"
              >
                {{ videoService.formatVph(analysis.maxVph) }}
              </div>
              <div class="hero-stat-sub">Tốc độ tăng cao nhất</div>
            </div>

            <!-- Video đang tăng -->
            <div class="hero-stat-box">
              <div class="hero-stat-label">VIDEO ĐANG TĂNG</div>
              <div class="hero-stat-val mono text-rising">{{ analysis.risingVideos }}</div>
              <div class="hero-stat-sub">Có VPH đo được &gt; 0</div>
            </div>

            <!-- Tổng video -->
            <div class="hero-stat-box">
              <div class="hero-stat-label">TỔNG VIDEO</div>
              <div class="hero-stat-val mono">{{ analysis.totalVideos }}</div>
              <div class="hero-stat-sub">Đang trong hệ thống</div>
            </div>

            <!-- VPH trung bình -->
            <div class="hero-stat-box">
              <div class="hero-stat-label">VPH TRUNG BÌNH</div>
              <div
                class="hero-stat-val"
                :class="analysis.avgVph !== null ? 'text-avg-vph' : 'text-muted'"
              >
                {{ analysis.avgVph !== null ? `${analysis.avgVph.toLocaleString('vi-VN')} VPH` : 'Chưa đủ dữ liệu' }}
              </div>
              <div class="hero-stat-sub">Các video đang tăng</div>
            </div>
          </div>
        </div>

        <!-- Technical Configuration Strip -->
        <div class="hero-config-strip">
          <div class="config-cell">
            <span class="config-lbl">Kiểm tra:</span>
            <span class="config-val mono">{{ analysis.channel.scanLimit }} video / lần</span>
          </div>
          <div class="config-divider"></div>
          <div class="config-cell">
            <span class="config-lbl">Ngưỡng cảnh báo:</span>
            <span class="config-val mono text-threshold">{{ analysis.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH</span>
          </div>
          <div class="config-divider"></div>
          <div class="config-cell">
            <span class="config-lbl">Quét gần nhất:</span>
            <span class="config-val" :title="analysis.channel.lastScanAt ? formatFullDateTime(analysis.channel.lastScanAt) : ''">
              {{ analysis.channel.lastScanAt ? formatRelativeTime(analysis.channel.lastScanAt) : 'Chưa kiểm tra' }}
            </span>
          </div>
          <div class="config-divider"></div>
          <div class="config-cell">
            <span class="config-lbl">Ngày thêm:</span>
            <span class="config-val">{{ formatDateOnly(analysis.channel.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty Video State if Channel has 0 videos -->
      <div v-if="analysis.totalVideos === 0" class="empty-videos-card">
        <div class="empty-v-icon">
          <AppIcon name="video" size="32" />
        </div>
        <div class="empty-v-title">Chưa có dữ liệu video cho kênh này.</div>
        <div class="empty-v-desc">Hãy nhấn "Kiểm Tra Dữ Liệu" hoặc chờ lần quét tự động tiếp theo của hệ thống.</div>
      </div>

      <template v-else>
        <!-- 2. Section: Tình Trạng Video (Segmented Distribution Rail) -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="s-title">Tình Trạng Video</div>
            <div class="s-subtitle">Phân loại tổng {{ analysis.totalVideos }} video theo mức độ tăng trưởng VPH đo được thực tế</div>
          </div>

          <!-- Proportional Distribution Rail (Mutually Exclusive) -->
          <div class="distribution-rail-wrap">
            <div class="distribution-rail-track">
              <div
                v-if="analysis.distribution.overThresholdCount > 0"
                class="rail-segment seg-threshold"
                :style="{ flex: analysis.distribution.overThresholdCount }"
                :title="`Vượt ngưỡng: ${analysis.distribution.overThresholdCount} video`"
              ></div>
              <div
                v-if="risingBelowThresholdCount > 0"
                class="rail-segment seg-rising"
                :style="{ flex: risingBelowThresholdCount }"
                :title="`Đang tăng dưới ngưỡng: ${risingBelowThresholdCount} video`"
              ></div>
              <div
                v-if="analysis.distribution.zeroCount > 0"
                class="rail-segment seg-zero"
                :style="{ flex: analysis.distribution.zeroCount }"
                :title="`Không tăng: ${analysis.distribution.zeroCount} video`"
              ></div>
              <div
                v-if="analysis.distribution.nullCount > 0"
                class="rail-segment seg-null"
                :style="{ flex: analysis.distribution.nullCount }"
                :title="`Chưa đủ dữ liệu: ${analysis.distribution.nullCount} video`"
              ></div>
            </div>
          </div>

          <!-- Breakdown Cards -->
          <div class="dist-grid">
            <div class="dist-box box-threshold">
              <div class="dist-lbl">Vượt ngưỡng (&ge; {{ analysis.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH)</div>
              <div class="dist-val mono text-threshold">{{ analysis.distribution.overThresholdCount }}</div>
              <div class="dist-sub">Video kích hoạt cảnh báo</div>
            </div>
            <div class="dist-box box-rising">
              <div class="dist-lbl">Đang tăng dưới ngưỡng</div>
              <div class="dist-val mono text-accent">{{ risingBelowThresholdCount }}</div>
              <div class="dist-sub">Đang có lượt xem mới</div>
            </div>
            <div class="dist-box">
              <div class="dist-lbl">Không tăng (0 VPH)</div>
              <div class="dist-val mono text-muted">{{ analysis.distribution.zeroCount }}</div>
              <div class="dist-sub">Lượt xem không đổi</div>
            </div>
            <div class="dist-box">
              <div class="dist-lbl">Chưa đủ dữ liệu</div>
              <div class="dist-val mono text-muted">{{ analysis.distribution.nullCount }}</div>
              <div class="dist-sub">Cần thêm snapshot đo</div>
            </div>
          </div>
        </div>

        <!-- 3. Section: Biểu Đồ VPH -->
        <ChannelVphChart
          :videos="analysis.topVphChartVideos"
          :threshold="analysis.channel.alertVphThreshold"
        />

        <!-- 4. Section: Top Signals (Video Tăng Nhanh Nhất) -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="s-title">Video Tăng Nhanh Nhất (Top Signals)</div>
            <div class="s-subtitle">Top 5 video có tốc độ tăng trưởng VPH cao nhất của kênh</div>
          </div>

          <div v-if="positiveTopSignals.length === 0" class="panel-empty">
            Chưa có video nào ghi nhận VPH lớn hơn 0.
          </div>

          <div v-else class="top-signals-wrap">
            <!-- #1 Video Featured Highlight -->
            <div v-if="positiveTopSignals[0]" class="featured-video-card">
              <div class="featured-badge-tag">
                <AppIcon name="zap" size="14" />
                <span>#1 TĂNG TRƯỞNG CAO NHẤT</span>
              </div>
              <div class="featured-body">
                <router-link :to="'/videos/' + positiveTopSignals[0].id" class="featured-thumb-wrap">
                  <img
                    v-if="positiveTopSignals[0].thumbnailUrl"
                    :src="positiveTopSignals[0].thumbnailUrl"
                    :alt="positiveTopSignals[0].title"
                    class="featured-thumb"
                    loading="lazy"
                    @error="handleImgError"
                  />
                  <div v-else class="featured-thumb-fallback">
                    <AppIcon name="video" size="28" />
                  </div>
                </router-link>

                <div class="featured-content">
                  <router-link :to="'/videos/' + positiveTopSignals[0].id" class="featured-title">
                    {{ positiveTopSignals[0].title }}
                  </router-link>
                  <div class="featured-meta">
                    <span>{{ videoService.formatRelativeTime(positiveTopSignals[0].publishedAt) }}</span>
                    <span v-if="positiveTopSignals[0].isOverThreshold" class="badge-threshold-mini">Vượt ngưỡng</span>
                  </div>

                  <div class="featured-metrics-strip">
                    <div class="f-metric-box">
                      <span class="f-lbl">LƯỢT XEM HIỆN TẠI</span>
                      <span class="f-val mono">{{ videoService.formatViews(positiveTopSignals[0].latestViewCount) }}</span>
                    </div>
                    <div class="f-metric-box focal-metric">
                      <span class="f-lbl">VPH ĐO ĐƯỢC</span>
                      <span class="f-val mono text-accent">{{ videoService.formatVph(positiveTopSignals[0].latestMeasuredVph) }}</span>
                    </div>
                    <div class="f-metric-box">
                      <span class="f-lbl">TĂNG LẦN GẦN NHẤT</span>
                      <span class="f-val mono text-positive">{{ videoService.formatViewDelta(positiveTopSignals[0].latestDeltaViews) }}</span>
                    </div>
                  </div>

                  <div class="featured-actions">
                    <router-link :to="'/videos/' + positiveTopSignals[0].id" class="btn btn-secondary btn-sm">
                      <AppIcon name="activity" size="14" />
                      <span>Xem Phân Tích Video</span>
                    </router-link>
                    <a
                      :href="positiveTopSignals[0].url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-secondary btn-sm"
                    >
                      <span>Mở YouTube</span>
                      <AppIcon name="external" size="14" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- #2 to #5 Compact Rankings -->
            <div v-if="positiveTopSignals.length > 1" class="secondary-ranking-list">
              <div
                v-for="(v, idx) in positiveTopSignals.slice(1)"
                :key="v.id"
                class="v-card-item"
              >
                <div class="rank-num">#{{ idx + 2 }}</div>

                <router-link :to="'/videos/' + v.id" class="v-thumb-wrap" title="Xem chi tiết video">
                  <img
                    v-if="v.thumbnailUrl"
                    :src="v.thumbnailUrl"
                    :alt="v.title"
                    class="v-thumb"
                    loading="lazy"
                    @error="handleImgError"
                  />
                  <div v-else class="v-thumb-fallback">
                    <AppIcon name="video" size="20" />
                  </div>
                </router-link>

                <div class="v-details">
                  <router-link :to="'/videos/' + v.id" class="v-title-text" :title="v.title">
                    {{ v.title }}
                  </router-link>
                  <div class="v-sub-info">
                    <span>{{ videoService.formatRelativeTime(v.publishedAt) }}</span>
                    <span v-if="v.isOverThreshold" class="badge-threshold-mini">Vượt ngưỡng</span>
                  </div>
                </div>

                <div class="v-metrics-row">
                  <div class="v-metric-col">
                    <div class="vm-lbl">LƯỢT XEM</div>
                    <div class="vm-val mono">{{ videoService.formatViews(v.latestViewCount) }}</div>
                  </div>
                  <div class="v-metric-col">
                    <div class="vm-lbl">VPH ĐO ĐƯỢC</div>
                    <div
                      class="vm-val mono"
                      :class="v.latestMeasuredVph !== null && v.latestMeasuredVph > 0 ? 'text-accent' : 'text-muted'"
                    >
                      {{ videoService.formatVph(v.latestMeasuredVph) }}
                    </div>
                  </div>
                  <div class="v-metric-col">
                    <div class="vm-lbl">TĂNG GẦN NHẤT</div>
                    <div
                      class="vm-val mono"
                      :class="v.latestDeltaViews !== null && v.latestDeltaViews > 0 ? 'text-positive' : 'text-muted'"
                    >
                      {{ videoService.formatViewDelta(v.latestDeltaViews) }}
                    </div>
                  </div>
                </div>

                <div class="v-btn-actions">
                  <router-link :to="'/videos/' + v.id" class="btn btn-secondary btn-sm">
                    <span>Chi Tiết</span>
                  </router-link>
                  <a
                    :href="v.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-youtube-icon"
                    title="Mở video trên YouTube"
                  >
                    <AppIcon name="external" size="14" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Section: Video Mới Nhất (Top 10 Video) -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="s-title">Video Mới Nhất</div>
            <div class="s-subtitle">10 video xuất bản gần đây nhất của kênh</div>
          </div>

          <div class="latest-table-wrap">
            <table class="latest-table">
              <thead>
                <tr>
                  <th>VIDEO</th>
                  <th>THỜI GIAN ĐĂNG</th>
                  <th>LƯỢT XEM</th>
                  <th>VPH ĐO ĐƯỢC</th>
                  <th style="text-align: right;">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in analysis.latestVideos" :key="v.id" class="latest-row">
                  <td class="col-v-info">
                    <div class="table-v-wrap">
                      <router-link :to="'/videos/' + v.id" class="table-thumb-link">
                        <img
                          v-if="v.thumbnailUrl"
                          :src="v.thumbnailUrl"
                          :alt="v.title"
                          class="table-thumb"
                          loading="lazy"
                          @error="handleImgError"
                        />
                        <div v-else class="table-thumb-fallback">
                          <AppIcon name="video" size="16" />
                        </div>
                      </router-link>
                      <router-link :to="'/videos/' + v.id" class="table-v-title" :title="v.title">
                        {{ v.title }}
                      </router-link>
                    </div>
                  </td>
                  <td class="col-v-pub" :title="v.publishedAt">
                    {{ videoService.formatRelativeTime(v.publishedAt) }}
                  </td>
                  <td class="col-v-views mono">
                    {{ videoService.formatViews(v.latestViewCount) }}
                  </td>
                  <td class="col-v-vph">
                    <span
                      class="vph-tag"
                      :class="v.latestMeasuredVph !== null && v.latestMeasuredVph > 0 ? 'vph-accent' : 'vph-muted'"
                    >
                      {{ videoService.formatVph(v.latestMeasuredVph) }}
                    </span>
                  </td>
                  <td class="col-v-actions">
                    <router-link :to="'/videos/' + v.id" class="btn btn-secondary btn-sm">
                      <span>Chi Tiết</span>
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 6. Section: Cảnh Báo Của Kênh -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="s-title">Cảnh Báo Của Kênh</div>
            <div class="s-subtitle">Trạng thái gửi thông báo Discord cho các video vượt ngưỡng</div>
          </div>

          <div class="alert-summary-box">
            <div class="alert-pills-row">
              <div class="a-pill">
                <span class="a-pill-lbl">Tổng cảnh báo:</span>
                <span class="a-pill-val mono">{{ analysis.alertSummary.total }}</span>
              </div>
              <div class="a-pill pill-sent">
                <span class="a-pill-lbl">Đã gửi:</span>
                <span class="a-pill-val mono">{{ analysis.alertSummary.sent }}</span>
              </div>
              <div class="a-pill pill-pending">
                <span class="a-pill-lbl">Đang chờ:</span>
                <span class="a-pill-val mono">{{ analysis.alertSummary.pending }}</span>
              </div>
              <div class="a-pill pill-failed">
                <span class="a-pill-lbl">Gửi lỗi:</span>
                <span class="a-pill-val mono">{{ analysis.alertSummary.failed }}</span>
              </div>
            </div>

            <div v-if="analysis.alertSummary.total === 0" class="alert-note-box">
              <AppIcon name="check-circle" size="16" />
              <span>Chưa có video nào của kênh vượt ngưỡng cảnh báo.</span>
            </div>

            <!-- Recent Alerts List if any -->
            <div v-else-if="analysis.alertSummary.recentAlerts.length > 0" class="recent-alerts-list">
              <div v-for="a in analysis.alertSummary.recentAlerts" :key="a.id" class="recent-alert-item">
                <div class="alert-v-name">
                  <router-link :to="'/videos/' + a.videoId">
                    {{ a.videoTitle }}
                  </router-link>
                </div>
                <div class="alert-v-meta">
                  <span class="mono text-threshold">{{ a.measuredVph ? `${Math.round(a.measuredVph).toLocaleString('vi-VN')} VPH` : '—' }}</span>
                  <span class="badge-alert" :class="`alert-${a.status === 'sent' ? 'success' : a.status === 'failed' ? 'danger' : 'warning'}`">
                    {{ a.status === 'sent' ? 'Đã gửi' : a.status === 'failed' ? 'Gửi lỗi' : 'Chờ gửi' }}
                  </span>
                  <span v-if="a.sentAt" class="alert-time">{{ formatRelativeTime(a.sentAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import ChannelVphChart from '@/features/channels/components/ChannelVphChart.vue';
import { channelAnalysisService } from '@/services/channel-analysis-service';
import { videoService } from '@/services/video-service';
import { ChannelAnalysis } from '@/types/channel-analysis';

const route = useRoute();
const channelId = String(route.params.id || '');

const analysis = ref<ChannelAnalysis | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// 1. Exclusive distribution count: videos rising (VPH > 0) but below threshold
const risingBelowThresholdCount = computed(() => {
  if (!analysis.value) return 0;
  return Math.max(
    0,
    analysis.value.distribution.risingCount - analysis.value.distribution.overThresholdCount
  );
});

// 2. Top signals filtered to strictly positive measured VPH (> 0)
const positiveTopSignals = computed(() => {
  if (!analysis.value) return [];
  return analysis.value.topRisingVideos.filter(
    video => video.latestMeasuredVph !== null && video.latestMeasuredVph > 0
  );
});

function handleAvatarError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}

function formatDateOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatFullDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatRelativeTime(iso: string): string {
  if (!iso) return '';
  const now = new Date();
  const past = new Date(iso);
  const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffSeconds < 60) return 'Vừa xong';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

async function loadChannelData() {
  if (!channelId) {
    error.value = 'Mã nhận diện kênh không hợp lệ.';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const res = await channelAnalysisService.fetchChannelAnalysis(channelId);
    if (!res) {
      error.value = 'Không tìm thấy kênh này.';
    } else {
      analysis.value = res;
      document.title = `Phân Tích Kênh: ${res.channel.name} — Bắt Bài Đối Thủ`;
    }
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải dữ liệu phân tích kênh. Vui lòng thử lại sau.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadChannelData();
});
</script>

<style scoped>
.channel-detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Top Bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s ease;
}

.btn-back:hover {
  color: var(--accent);
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-youtube {
  gap: 6px;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Skeleton State */
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-hero {
  height: 140px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-card {
  height: 100px;
  background-color: var(--bg-surface);
  border-radius: 10px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-dist {
  height: 100px;
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

.skeleton-table {
  height: 200px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

/* Error Card */
.error-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 56px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.error-icon {
  color: var(--danger);
}

.error-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.error-desc {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 440px;
  line-height: 1.5;
}

/* Empty Video Card */
.empty-videos-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-v-icon {
  color: var(--text-muted);
}

.empty-v-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-v-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 1. Channel Intelligence Hero Card */
.channel-hero-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
}

.hero-main-row {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: 1 1 320px;
  min-width: 280px;
}

.hero-avatar-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-avatar-fallback {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-secondary);
}

.hero-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-name {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.hero-handle {
  font-size: 13px;
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.hero-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex: 2 1 540px;
}

.hero-stat-box {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}

.focal-stat-box {
  background-color: var(--accent-subtle);
  border-color: var(--accent);
}

.hero-stat-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.focal-stat-box .hero-stat-label {
  color: var(--accent);
}

.hero-stat-val {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.hero-stat-sub {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.text-max-vph {
  color: var(--signal-positive, #10B981);
}

.text-rising {
  color: var(--signal-accent, #38BDF8);
}

.text-avg-vph {
  color: var(--signal-accent, #38BDF8);
}

.text-threshold {
  color: #F59E0B;
}

.text-muted {
  color: var(--text-muted);
}

.text-positive {
  color: var(--signal-positive, #10B981);
}

.text-accent {
  color: var(--accent);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Technical Config Strip */
.hero-config-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px 16px;
  flex-wrap: wrap;
}

.config-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-lbl {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.config-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
}

.config-divider {
  width: 1px;
  height: 16px;
  background-color: var(--border-subtle);
}

/* Section Card */
.section-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
}

.section-card-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.s-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 2. Proportional Distribution Rail */
.distribution-rail-wrap {
  width: 100%;
}

.distribution-rail-track {
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  gap: 2px;
}

.rail-segment {
  height: 100%;
  transition: flex 0.3s ease;
}

.seg-threshold {
  background-color: #F59E0B;
}

.seg-rising {
  background-color: #0284C7;
}

.seg-zero {
  background-color: var(--border-strong, #64748B);
  opacity: 0.5;
}

.seg-null {
  background-color: var(--border-subtle, #334155);
  opacity: 0.3;
}

.dist-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.dist-box {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dist-lbl {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
}

.dist-val {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
}

.dist-sub {
  font-size: 10px;
  color: var(--text-muted);
}

.box-rising {
  border-color: rgba(2, 132, 199, 0.4);
}

.box-threshold {
  border-color: rgba(245, 158, 11, 0.4);
}

/* 4. Top Signals: Featured #1 + Rankings */
.top-signals-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.featured-video-card {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--accent);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--accent-subtle);
}

.featured-badge-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--accent);
  color: #FFFFFF;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.featured-body {
  display: flex;
  gap: 20px;
  padding: 20px;
  align-items: center;
}

.featured-thumb-wrap {
  width: 220px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.featured-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-thumb-fallback {
  color: var(--text-muted);
}

.featured-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.featured-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-title:hover {
  color: var(--accent);
}

.featured-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.featured-metrics-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px 16px;
  flex-wrap: wrap;
}

.f-metric-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.f-lbl {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.f-val {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-primary);
}

.focal-metric .f-val {
  font-size: 16px;
}

.featured-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Secondary Rankings (#2-#5) */
.secondary-ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.v-card-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}

.rank-num {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  width: 28px;
  flex-shrink: 0;
}

.v-thumb-wrap {
  width: 96px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v-thumb-fallback {
  color: var(--text-muted);
}

.v-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.v-title-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
}

.v-title-text:hover {
  color: var(--accent);
}

.v-sub-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

.badge-threshold-mini {
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  background-color: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  text-transform: uppercase;
}

.v-metrics-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.v-metric-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 90px;
}

.vm-lbl {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
}

.vm-val {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.v-btn-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-youtube-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  text-decoration: none;
}

.btn-youtube-icon:hover {
  color: var(--accent);
}

/* 5. Latest Table */
.latest-table-wrap {
  overflow-x: auto;
}

.latest-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.latest-table th {
  background-color: var(--bg-surface-elevated);
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.latest-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.latest-row:last-child td {
  border-bottom: none;
}

.latest-row:hover td {
  background-color: var(--bg-surface-hover);
}

.col-v-info {
  min-width: 240px;
}

.table-v-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-thumb-link {
  width: 64px;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.table-thumb-fallback {
  color: var(--text-muted);
}

.table-v-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.table-v-title:hover {
  color: var(--accent);
}

.col-v-pub {
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-secondary);
}

.col-v-views {
  white-space: nowrap;
  font-weight: 600;
}

.col-v-vph {
  white-space: nowrap;
}

.vph-tag {
  font-size: 12px;
  font-weight: 600;
}

.vph-accent {
  color: #38BDF8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.vph-muted {
  color: var(--text-muted);
  font-weight: 400;
}

.col-v-actions {
  white-space: nowrap;
  text-align: right;
}

/* 6. Alert Summary Box */
.alert-summary-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.alert-pills-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.a-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  font-size: 12px;
}

.a-pill-lbl {
  color: var(--text-secondary);
}

.a-pill-val {
  font-weight: 700;
  color: var(--text-primary);
}

.pill-sent .a-pill-val {
  color: #22C55E;
}

.pill-pending .a-pill-val {
  color: #EAB308;
}

.pill-failed .a-pill-val {
  color: #EF4444;
}

.alert-note-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 10px 14px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

.recent-alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 12px;
}

.alert-v-name a {
  color: var(--text-primary);
  font-weight: 500;
  text-decoration: none;
}

.alert-v-name a:hover {
  color: var(--accent);
}

.alert-v-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.badge-alert {
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
}

.alert-success {
  background-color: rgba(34, 197, 94, 0.12);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.alert-warning {
  background-color: rgba(234, 179, 8, 0.12);
  color: #EAB308;
  border: 1px solid rgba(234, 179, 8, 0.25);
}

.alert-danger {
  background-color: rgba(239, 68, 68, 0.12);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.alert-time {
  color: var(--text-muted);
  font-size: 11px;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .hero-main-row {
    flex-direction: column;
  }
  .hero-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dist-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .featured-body {
    flex-direction: column;
    align-items: stretch;
  }
  .featured-thumb-wrap {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .hero-stats-grid {
    grid-template-columns: 1fr;
  }
  .dist-grid {
    grid-template-columns: 1fr;
  }
  .v-card-item {
    flex-direction: column;
    align-items: stretch;
  }
  .v-thumb-wrap {
    width: 100%;
  }
  .v-metrics-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .v-btn-actions {
    justify-content: flex-end;
  }
  .hero-config-strip {
    flex-direction: column;
    align-items: flex-start;
  }
  .config-divider {
    display: none;
  }
}
</style>
