<template>
  <div class="overview-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">Tổng Quan</h1>
        <p class="page-description">
          Theo dõi nhanh tình trạng hệ thống, kênh đối thủ và các video đang tăng mạnh.
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

    <!-- Error Alert -->
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
    <div v-if="loading && !summary" class="skeleton-wrap">
      <div class="skeleton-stats">
        <div v-for="n in 4" :key="n" class="skeleton-card"></div>
      </div>
      <div class="skeleton-system"></div>
      <div class="skeleton-top-videos"></div>
      <div class="skeleton-row-grid">
        <div class="skeleton-panel"></div>
        <div class="skeleton-panel"></div>
      </div>
      <div class="skeleton-table"></div>
    </div>

    <!-- Empty State (No Channels in DB) -->
    <div v-else-if="summary && summary.activeChannelsCount === 0 && summary.totalVideosCount === 0" class="empty-card">
      <div class="empty-icon">
        <AppIcon name="tv" size="36" />
      </div>
      <div class="empty-title">Chưa có kênh theo dõi.</div>
      <p class="empty-desc">
        Hệ thống chưa ghi nhận kênh đối thủ nào. Hãy thêm kênh đầu tiên để bắt đầu theo dõi tự động.
      </p>
      <router-link to="/kenh-theo-doi" class="btn btn-primary">
        <AppIcon name="plus" size="16" />
        <span>Thêm Kênh Theo Dõi</span>
      </router-link>
    </div>

    <!-- Main Dashboard Content -->
    <template v-else-if="summary">
      <!-- 1. 4 Main Stat Cards -->
      <div class="stats-grid">
        <!-- Kênh đang theo dõi -->
        <div class="stat-card">
          <div class="stat-label">Kênh đang theo dõi</div>
          <div class="stat-val mono stat-channels">{{ summary.activeChannelsCount }}</div>
          <div class="stat-desc">Tổng số kênh đang được hệ thống quét định kỳ</div>
        </div>

        <!-- Tổng video -->
        <div class="stat-card">
          <div class="stat-label">Tổng video</div>
          <div class="stat-val mono">{{ videoService.formatViews(summary.totalVideosCount) }}</div>
          <div class="stat-desc">Video đang được lưu trong hệ thống</div>
        </div>

        <!-- Video đang tăng -->
        <div class="stat-card">
          <div class="stat-label">Video đang tăng</div>
          <div class="stat-val mono stat-rising">{{ summary.risingVideosCount }}</div>
          <div class="stat-desc">Video có VPH đo được lớn hơn 0</div>
        </div>

        <!-- VPH cao nhất -->
        <div class="stat-card">
          <div class="stat-label">VPH cao nhất</div>
          <div
            class="stat-val"
            :class="summary.maxVph !== null && summary.maxVph > 0 ? 'stat-max-vph' : 'stat-muted'"
          >
            {{ videoService.formatVph(summary.maxVph) }}
          </div>
          <div class="stat-desc">Tốc độ tăng trưởng cao nhất hiện tại</div>
        </div>
      </div>

      <!-- 2. Section: Tình Trạng Dữ Liệu (Latest Scan Run) -->
      <div class="system-status-card">
        <div class="status-card-header">
          <div class="status-title-group">
            <div class="status-title">Tình Trạng Dữ Liệu</div>
            <div class="status-subtitle">
              <span v-if="summary.latestScan">
                Cập nhật gần nhất:
                <strong :title="formatFullDateTime(summary.latestScan.finishedAt || summary.latestScan.startedAt)">
                  {{ formatRelativeTime(summary.latestScan.finishedAt || summary.latestScan.startedAt) }}
                </strong>
                <span v-if="summary.latestScan.triggerSource === 'schedule'" class="schedule-tag">
                  (Quét tự động định kỳ)
                </span>
              </span>
              <span v-else>Chưa có lần quét nào</span>
            </div>
          </div>

          <div v-if="summary.latestScan" class="status-badge-wrap">
            <span class="badge" :class="`badge-scan-${dashboardService.formatScanStatus(summary.latestScan.status).tone}`">
              {{ dashboardService.formatScanStatus(summary.latestScan.status).badgeText }}
            </span>
          </div>
        </div>

        <div v-if="summary.latestScan" class="status-metrics-grid">
          <div class="status-metric-item">
            <div class="metric-lbl">Kiểu chạy</div>
            <div class="metric-data">
              {{ dashboardService.formatTriggerSource(summary.latestScan.triggerSource) }}
            </div>
          </div>
          <div class="status-metric-item">
            <div class="metric-lbl">Kênh quét</div>
            <div class="metric-data mono">
              {{ summary.latestScan.channelsSuccess }} / {{ summary.latestScan.channelsTotal }} kênh
            </div>
          </div>
          <div class="status-metric-item">
            <div class="metric-lbl">Video tìm thấy</div>
            <div class="metric-data mono">
              {{ summary.latestScan.videosFound }} video
            </div>
          </div>
          <div class="status-metric-item">
            <div class="metric-lbl">Snapshot tạo</div>
            <div class="metric-data mono">
              {{ summary.latestScan.snapshotsCreated }} snapshot
            </div>
          </div>
          <div class="status-metric-item">
            <div class="metric-lbl">Cảnh báo gửi</div>
            <div class="metric-data mono">
              {{ summary.latestScan.alertsSent }} cảnh báo
            </div>
          </div>
        </div>

        <div v-if="summary.latestScan?.errorSummary" class="scan-error-banner">
          <AppIcon name="alert" size="16" />
          <span>{{ summary.latestScan.errorSummary }}</span>
        </div>
      </div>

      <!-- 3. Section: Video Tăng Nhanh Nhất (Top 5 Videos) -->
      <div class="section-container">
        <div class="section-header">
          <div class="section-title-wrap">
            <div class="section-title">Video Tăng Nhanh Nhất</div>
            <div class="section-subtitle">Top 5 video có tốc độ tăng trưởng VPH cao nhất hiện tại</div>
          </div>
          <div class="section-actions">
            <router-link to="/video-tiem-nang" class="section-link section-link-subtle">
              <AppIcon name="zap" size="14" />
              <span>Xem Video Tiềm Năng</span>
            </router-link>
            <router-link to="/videos" class="section-link">
              <span>Xem tất cả video</span>
              <AppIcon name="arrow-left" size="14" style="transform: rotate(180deg);" />
            </router-link>
          </div>
        </div>

        <div v-if="summary.topVideos.length === 0" class="panel-empty">
          Chưa có video nào ghi nhận tốc độ tăng trưởng.
        </div>

        <div v-else class="top-videos-list">
          <div v-for="(v, index) in summary.topVideos" :key="v.id" class="top-video-card">
            <div class="top-rank-badge">#{{ index + 1 }}</div>

            <!-- Thumbnail -->
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

            <!-- Video Info -->
            <div class="v-main-info">
              <router-link :to="'/videos/' + v.id" class="v-title" :title="v.title">
                {{ v.title }}
              </router-link>

              <div class="v-channel-line">
                <div class="v-avatar-wrap">
                  <img
                    v-if="v.channelAvatarUrl"
                    :src="v.channelAvatarUrl"
                    :alt="v.channelName"
                    class="v-avatar"
                    @error="handleImgError"
                  />
                  <div v-else class="v-avatar-fallback">
                    {{ v.channelName.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <span class="v-channel-name">{{ v.channelName }}</span>
                <span class="dot-separator">•</span>
                <span class="v-published">{{ videoService.formatRelativeTime(v.publishedAt) }}</span>
              </div>
            </div>

            <!-- Video Metrics -->
            <div class="v-metrics-group">
              <div class="v-metric-item">
                <div class="v-m-lbl">LƯỢT XEM</div>
                <div class="v-m-val mono">{{ videoService.formatViews(v.latestViewCount) }}</div>
              </div>

              <div class="v-metric-item">
                <div class="v-m-lbl">VPH ĐO ĐƯỢC</div>
                <div
                  class="v-m-val"
                  :class="v.latestMeasuredVph !== null && v.latestMeasuredVph > 0 ? 'vph-accent' : 'vph-muted'"
                >
                  {{ videoService.formatVph(v.latestMeasuredVph) }}
                </div>
                <span v-if="v.isOverThreshold" class="badge-threshold-mini">Vượt ngưỡng</span>
              </div>

              <div class="v-metric-item">
                <div class="v-m-lbl">TĂNG LẦN TRƯỚC</div>
                <div
                  class="v-m-val"
                  :class="v.latestDeltaViews !== null && v.latestDeltaViews > 0 ? 'delta-positive' : 'delta-neutral'"
                >
                  {{ videoService.formatViewDelta(v.latestDeltaViews) }}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="v-actions-group">
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

      <!-- 4. Two-column Row: Top Channels & Discord Alert Summary -->
      <div class="split-row">
        <!-- Column A: Kênh Đang Có Video Tăng -->
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title-wrap">
              <div class="panel-title">Kênh Đang Có Video Tăng</div>
              <div class="panel-subtitle">Xếp hạng kênh theo tốc độ VPH cao nhất</div>
            </div>
            <router-link to="/kenh-theo-doi" class="section-link">
              <span>Xem kênh</span>
            </router-link>
          </div>

          <div v-if="summary.topChannels.length === 0" class="panel-empty">
            Chưa có kênh nào ghi nhận video tăng.
          </div>

          <div v-else class="channel-summary-list">
            <router-link
              v-for="ch in summary.topChannels"
              :key="ch.channelId"
              :to="'/kenh-theo-doi/' + ch.channelId"
              class="channel-summary-item"
              title="Xem phân tích kênh"
            >
              <div class="ch-avatar-wrap">
                <img
                  v-if="ch.avatarUrl"
                  :src="ch.avatarUrl"
                  :alt="ch.channelName"
                  class="ch-avatar"
                  @error="handleImgError"
                />
                <div v-else class="ch-avatar-fallback">
                  {{ ch.channelName.charAt(0).toUpperCase() }}
                </div>
              </div>

              <div class="ch-info">
                <div class="ch-name">{{ ch.channelName }}</div>
                <div class="ch-sub">
                  <span>{{ ch.totalVideos }} video</span>
                  <span class="dot-separator">•</span>
                  <span class="text-accent">{{ ch.risingVideoCount }} video đang tăng</span>
                </div>
              </div>

              <div class="ch-vph">
                <div class="ch-vph-val mono">
                  {{ ch.maxVph !== null ? `${Math.round(ch.maxVph).toLocaleString('vi-VN')} VPH` : '—' }}
                </div>
                <div class="ch-vph-lbl">VPH cao nhất</div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Column B: Cảnh Báo Discord -->
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title-wrap">
              <div class="panel-title">Cảnh Báo Discord</div>
              <div class="panel-subtitle">Trạng thái gửi cảnh báo tự động tới Discord webhook</div>
            </div>
          </div>

          <div class="alert-summary-content">
            <div class="alert-counts-grid">
              <div class="alert-count-box">
                <div class="a-box-label">Tổng cảnh báo</div>
                <div class="a-box-val mono">{{ summary.alertSummary.total }}</div>
              </div>
              <div class="alert-count-box box-sent">
                <div class="a-box-label">Đã gửi</div>
                <div class="a-box-val mono">{{ summary.alertSummary.sent }}</div>
              </div>
              <div class="alert-count-box box-pending">
                <div class="a-box-label">Đang chờ</div>
                <div class="a-box-val mono">{{ summary.alertSummary.pending }}</div>
              </div>
              <div class="alert-count-box box-failed">
                <div class="a-box-label">Gửi lỗi</div>
                <div class="a-box-val mono">{{ summary.alertSummary.failed }}</div>
              </div>
            </div>

            <div class="alert-status-note">
              <div v-if="summary.alertSummary.total === 0" class="note-normal">
                <AppIcon name="check-circle" size="18" />
                <span>Chưa có video nào vượt ngưỡng cảnh báo. Hệ thống đang theo dõi bình thường.</span>
              </div>
              <div v-else-if="summary.alertSummary.failed > 0" class="note-warning">
                <AppIcon name="alert" size="18" />
                <span>Có {{ summary.alertSummary.failed }} thông báo gửi lỗi. Vui lòng kiểm tra webhook URL.</span>
              </div>
              <div v-else class="note-success">
                <AppIcon name="check" size="18" />
                <span>Tất cả cảnh báo vượt ngưỡng đã được gửi thành công đến Discord.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Section: Lịch Sử Quét Gần Đây -->
      <div class="section-container">
        <div class="section-header">
          <div class="section-title-wrap">
            <div class="section-title">Lịch Sử Quét Gần Đây</div>
            <div class="section-subtitle">5 lần quét gần nhất ghi nhận trong hệ thống</div>
          </div>
        </div>

        <div v-if="summary.recentScans.length === 0" class="panel-empty">
          Chưa có lịch sử quét nào được ghi nhận.
        </div>

        <div v-else class="table-card">
          <div class="table-scroll-wrap">
            <table class="scan-table">
              <thead>
                <tr>
                  <th>THỜI GIAN</th>
                  <th>KIỂU CHẠY</th>
                  <th>TRẠNG THÁI</th>
                  <th>KÊNH</th>
                  <th>VIDEO</th>
                  <th>SNAPSHOT</th>
                  <th>CẢNH BÁO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="scan in summary.recentScans" :key="scan.id" class="scan-row">
                  <!-- Thời gian -->
                  <td class="col-scan-time">
                    <div class="scan-primary-time">{{ formatTimeOnly(scan.startedAt) }}</div>
                    <div class="scan-sub-date">{{ formatDateOnly(scan.startedAt) }}</div>
                  </td>

                  <!-- Kiểu chạy -->
                  <td class="col-scan-trigger">
                    <span class="trigger-pill" :class="`trigger-${scan.triggerSource}`">
                      {{ dashboardService.formatTriggerSource(scan.triggerSource) }}
                    </span>
                  </td>

                  <!-- Trạng thái -->
                  <td class="col-scan-status">
                    <span class="badge" :class="`badge-scan-${dashboardService.formatScanStatus(scan.status).tone}`">
                      {{ dashboardService.formatScanStatus(scan.status).label }}
                    </span>
                  </td>

                  <!-- Kênh -->
                  <td class="col-scan-num mono">
                    {{ scan.channelsSuccess }}/{{ scan.channelsTotal }}
                  </td>

                  <!-- Video -->
                  <td class="col-scan-num mono">
                    {{ scan.videosFound }}
                  </td>

                  <!-- Snapshot -->
                  <td class="col-scan-num mono">
                    {{ scan.snapshotsCreated }}
                  </td>

                  <!-- Cảnh báo -->
                  <td class="col-scan-num mono">
                    {{ scan.alertsSent }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { dashboardService } from '@/services/dashboard-service';
import { videoService } from '@/services/video-service';
import { DashboardSummary } from '@/types/dashboard';

// Page Title
document.title = 'Tổng Quan — Bắt Bài Đối Thủ';

const summary = ref<DashboardSummary | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}

function formatTimeOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatDateOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
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
      second: '2-digit',
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

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const data = await dashboardService.fetchDashboardSummary();
    summary.value = data;
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải dữ liệu Tổng Quan. Vui lòng thử lại sau.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.overview-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.page-description {
  font-size: 14px;
  color: var(--text-secondary);
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Error Alert */
.error-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background-color: var(--danger-bg);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 12px 18px;
  color: var(--danger);
}

.error-alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

/* Skeleton Loading */
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.skeleton-system {
  height: 120px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-top-videos {
  height: 320px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-row-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.skeleton-panel {
  height: 220px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-table {
  height: 240px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

/* Empty State */
.empty-card {
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

.empty-icon {
  color: var(--text-muted);
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 440px;
  line-height: 1.5;
}

/* 1. Stats Grid */
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
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-val.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.stat-channels {
  color: var(--accent);
}

.stat-rising {
  color: #38BDF8;
}

.stat-max-vph {
  color: #34D399;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.stat-muted {
  color: var(--text-muted);
  font-size: 20px;
  font-weight: 500;
}

.stat-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.3;
}

/* 2. System Status Card */
.system-status-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.status-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.status-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.schedule-tag {
  color: var(--accent);
  margin-left: 4px;
}

.badge-scan-success {
  background-color: rgba(34, 197, 94, 0.12);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.badge-scan-warning {
  background-color: rgba(234, 179, 8, 0.12);
  color: #EAB308;
  border: 1px solid rgba(234, 179, 8, 0.25);
}

.badge-scan-danger {
  background-color: rgba(239, 68, 68, 0.12);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.badge-scan-info {
  background-color: rgba(56, 189, 248, 0.12);
  color: #38BDF8;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.status-metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--bg-surface-elevated);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.status-metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-lbl {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.metric-data {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-data.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.scan-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--danger-bg);
  color: var(--danger);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}

/* Section Containers */
.section-container {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.section-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
  text-decoration: none;
}

.section-link:hover {
  color: var(--accent-hover);
}

.section-link-subtle {
  color: var(--text-secondary);
}

.section-link-subtle:hover {
  color: var(--accent);
}

.panel-empty {
  padding: 28px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

/* 3. Top Videos List */
.top-videos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.top-video-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  transition: all 0.15s ease;
}

.top-video-card:hover {
  border-color: var(--border-strong);
  background-color: var(--bg-surface-hover);
}

.top-rank-badge {
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

.v-main-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.v-title {
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

.v-title:hover {
  color: var(--accent);
}

.v-channel-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.v-avatar-wrap {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v-avatar-fallback {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-secondary);
}

.v-channel-name {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v-published {
  color: var(--text-muted);
  white-space: nowrap;
}

.dot-separator {
  color: var(--text-muted);
  opacity: 0.6;
}

.v-metrics-group {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.v-metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 90px;
}

.v-m-lbl {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.v-m-val {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.v-m-val.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.vph-accent {
  color: #38BDF8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.vph-muted {
  color: var(--text-muted);
  font-weight: 400;
}

.badge-threshold-mini {
  display: inline-flex;
  align-self: flex-start;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  background-color: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  text-transform: uppercase;
}

.delta-positive {
  color: #34D399;
}

.delta-neutral {
  color: var(--text-muted);
  font-weight: 400;
}

.v-actions-group {
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
  transition: all 0.15s ease;
}

.btn-youtube-icon:hover {
  color: var(--accent);
  background-color: var(--bg-surface-elevated);
  border-color: var(--border-strong);
}

/* 4. Split Row (Top Channels & Discord Alerts) */
.split-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.panel-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Channel Summary List */
.channel-summary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.channel-summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  cursor: pointer;
}

.channel-summary-item:hover {
  border-color: var(--accent);
  background-color: rgba(56, 189, 248, 0.05);
}

.ch-avatar-wrap {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ch-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ch-avatar-fallback {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.ch-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.ch-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ch-sub {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.text-accent {
  color: var(--accent);
  font-weight: 500;
}

.ch-vph {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.ch-vph-val {
  font-size: 13px;
  font-weight: 700;
  color: #38BDF8;
}

.ch-vph-lbl {
  font-size: 10px;
  color: var(--text-muted);
}

/* Alert Summary Box */
.alert-summary-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-counts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.alert-count-box {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.a-box-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.a-box-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.box-sent .a-box-val {
  color: #22C55E;
}

.box-pending .a-box-val {
  color: #EAB308;
}

.box-failed .a-box-val {
  color: #EF4444;
}

.alert-status-note {
  padding: 12px 14px;
  border-radius: 8px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  font-size: 12px;
  line-height: 1.4;
}

.note-normal {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.note-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #EAB308;
}

.note-success {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #22C55E;
}

/* 5. Scan Table */
.table-card {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.table-scroll-wrap {
  overflow-x: auto;
}

.scan-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.scan-table th {
  background-color: var(--bg-surface-elevated);
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.scan-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.scan-row:last-child td {
  border-bottom: none;
}

.scan-row:hover td {
  background-color: var(--bg-surface-hover);
}

.col-scan-time {
  white-space: nowrap;
}

.scan-primary-time {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.scan-sub-date {
  font-size: 11px;
  color: var(--text-muted);
}

.trigger-pill {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.trigger-schedule {
  background-color: rgba(56, 189, 248, 0.12);
  color: #38BDF8;
}

.trigger-manual {
  background-color: rgba(148, 163, 184, 0.12);
  color: #94A3B8;
}

.col-scan-num {
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-primary);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .split-row {
    grid-template-columns: 1fr;
  }
  .status-metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .page-header-actions {
    display: none;
  }
  .status-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .top-video-card {
    flex-direction: column;
    align-items: stretch;
  }
  .top-rank-badge {
    position: absolute;
  }
  .v-thumb-wrap {
    width: 100%;
  }
  .v-metrics-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .v-actions-group {
    justify-content: flex-end;
  }
  .alert-counts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .v-metrics-group {
    grid-template-columns: 1fr;
  }
}
</style>
