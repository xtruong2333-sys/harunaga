<template>
  <div class="video-detail-page">
    <!-- Top Action Bar -->
    <div class="top-bar">
      <router-link to="/videos" class="btn-back">
        <AppIcon name="arrow-left" size="16" />
        <span>Quay Lại Video Đang Tăng</span>
      </router-link>

      <div class="top-bar-actions" v-if="video">
        <button
          class="btn btn-secondary btn-sm"
          :disabled="loading"
          @click="loadVideoDetail"
          title="Tải lại dữ liệu mới nhất từ hệ thống"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>

        <a
          :href="video.url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary btn-sm btn-youtube"
        >
          <span>Xem Trên YouTube</span>
          <AppIcon name="external" size="14" />
        </a>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading && !video" class="skeleton-wrap">
      <div class="skeleton-hero"></div>
      <div class="skeleton-stats">
        <div v-for="n in 4" :key="n" class="skeleton-card"></div>
      </div>
      <div class="skeleton-chart"></div>
      <div class="skeleton-table"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !video" class="error-card">
      <div class="error-icon">
        <AppIcon name="alert" size="32" />
      </div>
      <div class="error-title">
        {{ error || 'Không tìm thấy video này.' }}
      </div>
      <p class="error-desc">
        Video có thể đã bị gỡ khỏi danh sách theo dõi hoặc liên kết không hợp lệ.
      </p>
      <router-link to="/videos" class="btn btn-secondary">
        <AppIcon name="arrow-left" size="16" />
        <span>Quay Lại Danh Sách Video</span>
      </router-link>
    </div>

    <!-- Main Detail Content -->
    <template v-else>
      <!-- Section 1: Video Hero Header (2 columns desktop, 1 column mobile) -->
      <div class="video-hero-card">
        <div class="hero-thumb-wrap">
          <img
            v-if="video.thumbnailUrl"
            :src="video.thumbnailUrl"
            :alt="video.title"
            class="hero-thumb"
            loading="lazy"
            @error="handleThumbError"
          />
          <div v-else class="hero-thumb-fallback">
            <AppIcon name="video" size="48" />
          </div>
          <a
            :href="video.url"
            target="_blank"
            rel="noopener noreferrer"
            class="thumb-play-overlay"
            title="Mở video trên YouTube"
          >
            <div class="play-btn-circle">
              <AppIcon name="play" size="24" />
            </div>
          </a>
        </div>

        <div class="hero-info">
          <div class="hero-badges-row">
            <span v-if="video.isOverThreshold" class="badge-threshold">
              Vượt ngưỡng cảnh báo
            </span>
            <span class="badge-alert" :class="`alert-${videoService.getAlertBadge(video.alert).tone}`">
              {{ videoService.getAlertBadge(video.alert).label }}
            </span>
          </div>

          <h1 class="hero-title">{{ video.title }}</h1>

          <!-- Channel row -->
          <div class="hero-channel-row">
            <div class="channel-avatar-wrap">
              <img
                v-if="video.channel.avatarUrl"
                :src="video.channel.avatarUrl"
                :alt="video.channel.name"
                class="channel-avatar"
                @error="handleAvatarError"
              />
              <div v-else class="avatar-fallback">
                {{ video.channel.name.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="channel-meta-text">
              <div class="channel-name">{{ video.channel.name }}</div>
              <div v-if="video.channel.handle" class="channel-handle">
                {{ video.channel.handle }}
              </div>
            </div>
          </div>

          <!-- Metadata chips -->
          <div class="hero-metadata-grid">
            <div class="meta-item">
              <span class="meta-label">YouTube ID:</span>
              <span class="meta-value mono">{{ video.youtubeVideoId }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Thời gian đăng:</span>
              <span class="meta-value" :title="video.publishedAt">{{ videoService.formatRelativeTime(video.publishedAt) }}</span>
            </div>
            <div v-if="video.duration" class="meta-item">
              <span class="meta-label">Thời lượng:</span>
              <span class="meta-value">{{ video.duration }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: 4 Main Stats Cards -->
      <div class="stats-grid">
        <!-- 1. Lượt xem hiện tại -->
        <div class="stat-card">
          <div class="stat-label">Lượt xem hiện tại</div>
          <div class="stat-val mono">{{ videoService.formatViews(video.latestViewCount) }}</div>
          <div class="stat-sub">lượt xem tích luỹ</div>
        </div>

        <!-- 2. VPH đo được -->
        <div class="stat-card">
          <div class="stat-label">VPH đo được</div>
          <div
            class="stat-val"
            :class="{
              'vph-rising': video.latestMeasuredVph !== null && video.latestMeasuredVph > 0,
              'vph-muted': video.latestMeasuredVph === null || video.latestMeasuredVph === 0,
            }"
          >
            {{ videoService.formatVph(video.latestMeasuredVph) }}
          </div>
          <div class="stat-sub">
            <span v-if="video.isOverThreshold" class="text-warning">
              Vượt ngưỡng {{ video.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH
            </span>
            <span v-else-if="video.latestMeasuredVph !== null">
              Tốc độ tăng trưởng mỗi giờ
            </span>
            <span v-else>
              Cần tối thiểu 2 lần quét
            </span>
          </div>
        </div>

        <!-- 3. Tăng từ lần trước -->
        <div class="stat-card">
          <div class="stat-label">Tăng từ lần trước</div>
          <div
            class="stat-val"
            :class="{
              'delta-positive': video.latestSnapshot?.viewDelta !== null && (video.latestSnapshot?.viewDelta ?? 0) > 0,
              'delta-neutral': video.latestSnapshot?.viewDelta === null || (video.latestSnapshot?.viewDelta ?? 0) <= 0,
            }"
          >
            {{ videoService.formatViewDelta(video.latestSnapshot?.viewDelta) }}
          </div>
          <div class="stat-sub">
            {{ video.latestSnapshot?.elapsedSeconds ? `Trong ${videoService.formatElapsedSeconds(video.latestSnapshot.elapsedSeconds)}` : 'Lần kiểm tra gần nhất' }}
          </div>
        </div>

        <!-- 4. Ngưỡng cảnh báo -->
        <div class="stat-card">
          <div class="stat-label">Ngưỡng cảnh báo</div>
          <div class="stat-val stat-threshold">
            {{ video.channel.alertVphThreshold.toLocaleString('vi-VN') }} <span class="unit">VPH</span>
          </div>
          <div class="stat-sub">
            Cấu hình theo kênh
          </div>
        </div>
      </div>

      <!-- Section 3: Discord Alert Card -->
      <div class="alert-info-card">
        <div class="alert-info-left">
          <div class="alert-icon-wrap">
            <AppIcon name="bell" size="20" />
          </div>
          <div class="alert-details">
            <div class="alert-title-row">
              <span class="alert-title">Cảnh báo Discord:</span>
              <span class="badge-alert" :class="`alert-${videoService.getAlertBadge(video.alert).tone}`">
                {{ videoService.getAlertBadge(video.alert).label }}
              </span>
            </div>
            <div class="alert-desc">
              <span v-if="video.alert?.status === 'sent' && video.alert.sentAt">
                Đã gửi thông báo đến Discord lúc <strong>{{ formatDateTime(video.alert.sentAt) }}</strong>
                với tốc độ đo được <strong>{{ video.alert.measuredVph ? Math.round(video.alert.measuredVph).toLocaleString('vi-VN') : '—' }} VPH</strong>.
              </span>
              <span v-else-if="video.alert?.status === 'pending' || video.alert?.status === 'sending'">
                Video đã vượt ngưỡng cảnh báo và đang trong hàng đợi gửi tới kênh Discord.
              </span>
              <span v-else-if="video.alert?.status === 'failed'">
                Không thể gửi cảnh báo qua Discord webhook.
                <span v-if="video.alert.lastError" class="alert-error-detail">Lỗi: {{ video.alert.lastError }}</span>
              </span>
              <span v-else>
                Video chưa từng vượt ngưỡng cảnh báo của kênh hoặc chưa kích hoạt gửi thông báo.
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 4: Biểu Đồ Tăng Trưởng -->
      <VideoGrowthCharts
        :snapshots="video.snapshots"
        :threshold="video.channel.alertVphThreshold"
      />

      <!-- Section 5: Bảng Lịch Sử Snapshot -->
      <div class="history-card">
        <div class="history-header">
          <div class="history-title">Lịch Sử Snapshot</div>
          <div class="history-subtitle">
            Ghi nhận {{ video.snapshots.length }} lần quét định kỳ theo thứ tự thời gian
          </div>
        </div>

        <div v-if="video.snapshots.length === 0" class="history-empty">
          Chưa có lịch sử lượt xem cho video này.
        </div>

        <div v-else class="history-table-wrap">
          <table class="history-table">
            <thead>
              <tr>
                <th>THỜI ĐIỂM</th>
                <th>LƯỢT XEM</th>
                <th>TĂNG</th>
                <th>KHOẢNG THỜI GIAN</th>
                <th>VPH ĐO ĐƯỢC</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(snap, index) in video.snapshots" :key="snap.id" class="history-row">
                <!-- Thời điểm -->
                <td class="col-time">
                  <div class="time-primary">{{ formatDateTime(snap.checkedAt) }}</div>
                  <div class="time-seq">Lần quét #{{ index + 1 }}</div>
                </td>

                <!-- Lượt xem -->
                <td class="col-views">
                  <span class="views-val mono">{{ videoService.formatViews(snap.viewCount) }}</span>
                </td>

                <!-- Tăng -->
                <td class="col-delta">
                  <span
                    class="delta-val"
                    :class="{
                      'delta-positive': snap.viewDelta !== null && snap.viewDelta > 0,
                      'delta-neutral': snap.viewDelta === null || snap.viewDelta <= 0,
                    }"
                  >
                    {{ videoService.formatViewDelta(snap.viewDelta) }}
                  </span>
                </td>

                <!-- Khoảng thời gian -->
                <td class="col-elapsed">
                  <span class="elapsed-val">
                    {{ videoService.formatElapsedSeconds(snap.elapsedSeconds) }}
                  </span>
                </td>

                <!-- VPH đo được -->
                <td class="col-vph">
                  <span
                    class="vph-val"
                    :class="{
                      'vph-rising': snap.measuredVph !== null && snap.measuredVph > 0,
                      'vph-muted': snap.measuredVph === null || snap.measuredVph === 0,
                    }"
                  >
                    {{ videoService.formatVph(snap.measuredVph) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 6: Thông Tin Kênh -->
      <div class="channel-card">
        <div class="channel-card-header">
          <div class="channel-card-title">Thông Tin Kênh Đối Thủ</div>
          <a
            :href="video.channel.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary btn-sm"
          >
            <span>Xem Kênh YouTube</span>
            <AppIcon name="external" size="13" />
          </a>
        </div>

        <div class="channel-card-content">
          <div class="channel-profile">
            <div class="channel-avatar-large">
              <img
                v-if="video.channel.avatarUrl"
                :src="video.channel.avatarUrl"
                :alt="video.channel.name"
                class="avatar-img"
                @error="handleAvatarError"
              />
              <div v-else class="avatar-large-fallback">
                {{ video.channel.name.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="channel-names">
              <div class="channel-name-title">{{ video.channel.name }}</div>
              <div v-if="video.channel.handle" class="channel-handle-text">
                {{ video.channel.handle }}
              </div>
            </div>
          </div>

          <div class="channel-stats-list">
            <div class="c-stat-item">
              <div class="c-stat-label">Trạng thái</div>
              <div class="c-stat-val">
                <span class="badge" :class="`badge-${video.channel.status}`">
                  {{ video.channel.status === 'active' ? 'Đang theo dõi' : video.channel.status === 'paused' ? 'Tạm dừng' : 'Lưu trữ' }}
                </span>
              </div>
            </div>
            <div class="c-stat-item">
              <div class="c-stat-label">Video kiểm tra</div>
              <div class="c-stat-val">{{ video.channel.scanLimit }} video mới nhất</div>
            </div>
            <div class="c-stat-item">
              <div class="c-stat-label">Ngưỡng cảnh báo</div>
              <div class="c-stat-val">{{ video.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoGrowthCharts from '@/features/videos/components/VideoGrowthCharts.vue';
import { videoService } from '@/services/video-service';
import { VideoDetail } from '@/types/video';

const route = useRoute();
const videoId = String(route.params.id || '');

const video = ref<VideoDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

function formatDateTime(iso: string): string {
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

function handleThumbError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}

function handleAvatarError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}

async function loadVideoDetail() {
  if (!videoId) {
    error.value = 'Mã nhận diện video không hợp lệ.';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const res = await videoService.fetchVideoDetail(videoId);
    if (!res) {
      error.value = 'Không tìm thấy video này.';
    } else {
      video.value = res;
      document.title = `${res.title} — Chi Tiết Video`;
    }
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải chi tiết video. Vui lòng thử lại sau.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadVideoDetail();
});
</script>

<style scoped>
.video-detail-page {
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
  height: 220px;
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

.skeleton-chart {
  height: 280px;
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

/* Section 1: Hero Card */
.video-hero-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 24px;
}

.hero-thumb-wrap {
  width: 320px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-thumb-fallback {
  color: var(--text-muted);
}

.thumb-play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
  text-decoration: none;
}

.hero-thumb-wrap:hover .thumb-play-overlay {
  opacity: 1;
}

.play-btn-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.hero-badges-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.badge-threshold {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background-color: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
  text-transform: uppercase;
}

.badge-alert {
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
}

.alert-muted {
  background-color: rgba(100, 116, 139, 0.12);
  color: var(--text-secondary);
  border: 1px solid rgba(100, 116, 139, 0.25);
}

.alert-warning {
  background-color: rgba(234, 179, 8, 0.12);
  color: #EAB308;
  border: 1px solid rgba(234, 179, 8, 0.25);
}

.alert-success {
  background-color: rgba(34, 197, 94, 0.12);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.alert-danger {
  background-color: rgba(239, 68, 68, 0.12);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
}

.hero-channel-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.channel-avatar-wrap {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.channel-meta-text {
  display: flex;
  flex-direction: column;
}

.channel-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.channel-handle {
  font-size: 11px;
  color: var(--text-secondary);
}

.hero-metadata-grid {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  margin-top: auto;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.meta-label {
  color: var(--text-muted);
}

.meta-value {
  color: var(--text-secondary);
}

.meta-value.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Section 2: Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-val.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.stat-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.vph-rising {
  color: #38BDF8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.vph-muted {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 18px;
}

.delta-positive {
  color: #34D399;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.delta-neutral {
  color: var(--text-muted);
}

.stat-threshold {
  color: #F59E0B;
}

.stat-threshold .unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.text-warning {
  color: #F59E0B;
  font-weight: 500;
}

/* Section 3: Alert Info Card */
.alert-info-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px 20px;
}

.alert-info-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.alert-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.alert-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.alert-error-detail {
  color: var(--danger);
  display: block;
  margin-top: 4px;
}

/* Section 5: History Table */
.history-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
}

.history-header {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.history-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.history-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.history-empty {
  padding: 36px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.history-table-wrap {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.history-table th {
  background-color: var(--bg-surface-elevated);
  padding: 12px 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.history-table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.history-row:last-child td {
  border-bottom: none;
}

.history-row:hover td {
  background-color: var(--bg-surface-hover);
}

.col-time {
  white-space: nowrap;
}

.time-primary {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.time-seq {
  font-size: 11px;
  color: var(--text-muted);
}

.col-views {
  white-space: nowrap;
}

.views-val {
  font-weight: 600;
  color: var(--text-primary);
}

.col-delta {
  white-space: nowrap;
}

.delta-val {
  font-size: 13px;
}

.col-elapsed {
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-secondary);
}

.col-vph {
  white-space: nowrap;
}

.vph-val {
  font-weight: 600;
  font-size: 13px;
}

/* Section 6: Channel Info Card */
.channel-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.channel-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.channel-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.channel-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.channel-profile {
  display: flex;
  align-items: center;
  gap: 14px;
}

.channel-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-large-fallback {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-secondary);
}

.channel-names {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.channel-name-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.channel-handle-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.channel-stats-list {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.c-stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.c-stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.c-stat-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .video-hero-card {
    flex-direction: column;
  }
  .hero-thumb-wrap {
    width: 100%;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .channel-card-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .channel-stats-list {
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .hero-metadata-grid {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
