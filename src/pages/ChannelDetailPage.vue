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
      <!-- 1. Channel Header Card -->
      <div class="channel-hero-card">
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

        <!-- Channel Configuration Info (Read-only) -->
        <div class="hero-config-grid">
          <div class="config-item">
            <div class="config-lbl">Video kiểm tra</div>
            <div class="config-val mono">{{ analysis.channel.scanLimit }} video</div>
          </div>
          <div class="config-item">
            <div class="config-lbl">Ngưỡng cảnh báo</div>
            <div class="config-val mono text-threshold">
              {{ analysis.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH
            </div>
          </div>
          <div class="config-item">
            <div class="config-lbl">Cập nhật gần nhất</div>
            <div class="config-val" :title="analysis.channel.lastScanAt ? formatFullDateTime(analysis.channel.lastScanAt) : ''">
              {{ analysis.channel.lastScanAt ? formatRelativeTime(analysis.channel.lastScanAt) : 'Chưa kiểm tra' }}
            </div>
          </div>
          <div class="config-item">
            <div class="config-lbl">Ngày thêm</div>
            <div class="config-val">{{ formatDateOnly(analysis.channel.createdAt) }}</div>
          </div>
        </div>
      </div>

      <!-- 2. 4 Main Stat Cards -->
      <div class="stats-grid">
        <!-- Tổng video -->
        <div class="stat-card">
          <div class="stat-label">Tổng video</div>
          <div class="stat-val mono">{{ analysis.totalVideos }}</div>
          <div class="stat-desc">Số video của kênh trong hệ thống</div>
        </div>

        <!-- Video đang tăng -->
        <div class="stat-card">
          <div class="stat-label">Video đang tăng</div>
          <div class="stat-val mono stat-rising">{{ analysis.risingVideos }}</div>
          <div class="stat-desc">Video có VPH đo được lớn hơn 0</div>
        </div>

        <!-- VPH cao nhất -->
        <div class="stat-card">
          <div class="stat-label">VPH cao nhất</div>
          <div
            class="stat-val"
            :class="analysis.maxVph !== null && analysis.maxVph > 0 ? 'stat-max-vph' : 'stat-muted'"
          >
            {{ videoService.formatVph(analysis.maxVph) }}
          </div>
          <div class="stat-desc">Tốc độ tăng cao nhất của kênh</div>
        </div>

        <!-- VPH trung bình -->
        <div class="stat-card">
          <div class="stat-label">VPH trung bình</div>
          <div
            class="stat-val"
            :class="analysis.avgVph !== null ? 'stat-avg-vph' : 'stat-muted'"
          >
            {{ analysis.avgVph !== null ? `${analysis.avgVph.toLocaleString('vi-VN')} VPH` : 'Chưa đủ dữ liệu' }}
          </div>
          <div class="stat-desc">Trung bình các video đang tăng của kênh</div>
        </div>
      </div>

      <!-- Empty Video State if Channel has 0 videos -->
      <div v-if="analysis.totalVideos === 0" class="empty-videos-card">
        <div class="empty-v-icon">
          <AppIcon name="video" size="32" />
        </div>
        <div class="empty-v-title">Chưa có dữ liệu video cho kênh này.</div>
        <div class="empty-v-desc">Hãy chờ lần quét dữ liệu tiếp theo của hệ thống.</div>
      </div>

      <template v-else>
        <!-- 3. Section: Tình Trạng Video (VPH Distribution) -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="s-title">Tình Trạng Video</div>
            <div class="s-subtitle">Phân loại video theo mức độ tăng trưởng VPH đo được</div>
          </div>

          <div class="dist-grid">
            <div class="dist-box">
              <div class="dist-lbl">Chưa đủ dữ liệu</div>
              <div class="dist-val mono text-muted">{{ analysis.distribution.nullCount }}</div>
              <div class="dist-sub">Cần thêm snapshot</div>
            </div>
            <div class="dist-box">
              <div class="dist-lbl">Không tăng (0 VPH)</div>
              <div class="dist-val mono text-muted">{{ analysis.distribution.zeroCount }}</div>
              <div class="dist-sub">Lượt xem không đổi</div>
            </div>
            <div class="dist-box box-rising">
              <div class="dist-lbl">Đang tăng (&gt; 0 VPH)</div>
              <div class="dist-val mono text-accent">{{ analysis.distribution.risingCount }}</div>
              <div class="dist-sub">Đang có lượt xem mới</div>
            </div>
            <div class="dist-box box-threshold">
              <div class="dist-lbl">Vượt ngưỡng (&ge; {{ analysis.channel.alertVphThreshold.toLocaleString('vi-VN') }})</div>
              <div class="dist-val mono text-threshold">{{ analysis.distribution.overThresholdCount }}</div>
              <div class="dist-sub">Vượt ngưỡng cảnh báo</div>
            </div>
          </div>
        </div>

        <!-- 4. Section: Biểu Đồ VPH -->
        <ChannelVphChart
          :videos="analysis.topVphChartVideos"
          :threshold="analysis.channel.alertVphThreshold"
        />

        <!-- 5. Section: Video Tăng Nhanh Nhất (Top 5 Video) -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="s-title">Video Tăng Nhanh Nhất</div>
            <div class="s-subtitle">Top 5 video có VPH cao nhất của kênh</div>
          </div>

          <div v-if="analysis.topRisingVideos.length === 0" class="panel-empty">
            Chưa có video nào ghi nhận tốc độ tăng trưởng.
          </div>

          <div v-else class="v-list">
            <div v-for="(v, index) in analysis.topRisingVideos" :key="v.id" class="v-card-item">
              <div class="rank-num">#{{ index + 1 }}</div>

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
                    class="vm-val"
                    :class="v.latestMeasuredVph !== null && v.latestMeasuredVph > 0 ? 'text-accent' : 'text-muted'"
                  >
                    {{ videoService.formatVph(v.latestMeasuredVph) }}
                  </div>
                </div>
                <div class="v-metric-col">
                  <div class="vm-lbl">TĂNG LẦN TRƯỚC</div>
                  <div
                    class="vm-val"
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

        <!-- 6. Section: Video Mới Nhất (Top 10 Video) -->
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

        <!-- 7. Section: Cảnh Báo Của Kênh -->
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
import { ref, onMounted } from 'vue';
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

/* 1. Channel Hero Card */
.channel-hero-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 16px;
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
  font-size: 24px;
  font-weight: 700;
  color: var(--text-secondary);
}

.hero-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.hero-handle {
  font-size: 13px;
  color: var(--text-secondary);
}

.hero-config-grid {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  padding: 12px 18px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.config-lbl {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.config-val {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.config-val.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-threshold {
  color: #F59E0B;
}

/* 2. Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-val {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-val.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.stat-rising {
  color: #38BDF8;
}

.stat-max-vph {
  color: #34D399;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.stat-avg-vph {
  color: #38BDF8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.stat-muted {
  color: var(--text-muted);
  font-size: 18px;
  font-weight: 400;
}

.stat-desc {
  font-size: 11px;
  color: var(--text-muted);
}

/* Section Card */
.section-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.s-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 3. Distribution Grid */
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
  font-weight: 500;
}

.dist-val {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.dist-sub {
  font-size: 10px;
  color: var(--text-muted);
}

.box-rising {
  border-color: rgba(56, 189, 248, 0.25);
}

.box-threshold {
  border-color: rgba(245, 158, 11, 0.25);
}

.text-accent {
  color: var(--signal-accent, #38BDF8);
}

.text-positive {
  color: var(--signal-positive, #34D399);
}

.text-muted {
  color: var(--text-muted);
}

/* 5. Top Videos List */
.v-list {
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

.vm-val.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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

/* 6. Latest Table */
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
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
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

/* 7. Alert Summary Box */
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
@media (max-width: 900px) {
  .channel-hero-card {
    flex-direction: column;
    align-items: stretch;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dist-grid {
    grid-template-columns: repeat(2, 1fr);
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
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .dist-grid {
    grid-template-columns: 1fr;
  }
  .v-metrics-row {
    grid-template-columns: 1fr;
  }
}
</style>
