<template>
  <div class="video-detail-page">
    <!-- Top Action Bar -->
    <RevealItem :delay="0">
      <div class="top-action-bar">
        <router-link to="/videos" class="btn-back">
          <AppIcon name="arrow-left" size="16" />
          <span>Quay Lại Video Đang Tăng</span>
        </router-link>

        <div class="top-bar-actions" v-if="video">
          <!-- Tertiary: Refresh -->
          <button
            class="btn-action-tool btn-refresh"
            :disabled="loading"
            @click="loadVideoDetail"
            title="Tải lại dữ liệu mới nhất từ hệ thống"
          >
            <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
            <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
          </button>

          <!-- Secondary: AI Analyze -->
          <router-link
            :to="`/tro-ly-noi-dung?video=${video.id}`"
            class="btn-action-tool btn-ai"
            title="Phân tích nội dung và tạo ý tưởng mới bằng AI"
          >
            <AppIcon name="sparkles" size="14" />
            <span>Phân Tích Bằng AI</span>
          </router-link>

          <!-- Secondary: Production Item -->
          <router-link
            v-if="productionItemId"
            to="/tien-do-san-xuat"
            class="btn-action-tool btn-in-prod"
            title="Mục này đã có trong Tiến Độ Sản Xuất. Nhấn để mở."
          >
            <AppIcon name="check-circle" size="14" />
            <span>Đã Trong Tiến Độ Sản Xuất</span>
          </router-link>
          <button
            v-else
            class="btn-action-tool btn-to-prod"
            :disabled="isAddingToProduction"
            @click="handleAddToProduction"
            title="Đưa video này vào quy trình sản xuất nội dung"
          >
            <AppIcon name="clipboard-list" size="14" />
            <span>{{ isAddingToProduction ? 'Đang thêm...' : 'Đưa Vào Sản Xuất' }}</span>
          </button>

          <!-- Primary: YouTube Watch -->
          <a
            :href="video.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-action-tool btn-youtube"
            title="Mở video trên YouTube trong tab mới"
          >
            <span>Xem Trên YouTube</span>
            <AppIcon name="external" size="14" />
          </a>
        </div>
      </div>
    </RevealItem>

    <!-- Loading Skeleton -->
    <div v-if="loading && !video" class="skeleton-wrap">
      <div class="skeleton-hero-card" />
      <div class="skeleton-stats-strip">
        <div v-for="n in 4" :key="n" class="skeleton-card" />
      </div>
      <div class="skeleton-box" />
      <div class="skeleton-box" />
    </div>

    <!-- Error State -->
    <div v-else-if="error || !video" class="error-console-card">
      <div class="error-ring">
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

    <!-- Main Detail Console -->
    <template v-else>
      <!-- Section 1: Video Hero Header -->
      <RevealItem :delay="40">
        <section class="investigation-hero-card">
          <!-- Left: Large 16:9 Thumbnail -->
          <div class="hero-thumb-side">
            <div class="thumb-container">
              <img
                v-if="video.thumbnailUrl"
                :src="video.thumbnailUrl"
                :alt="video.title"
                class="hero-thumb-img"
                loading="lazy"
                @error="handleThumbError"
              />
              <div v-else class="hero-thumb-fallback">
                <AppIcon name="video" size="48" />
              </div>

              <!-- Play Overlay -->
              <a
                :href="video.url"
                target="_blank"
                rel="noopener noreferrer"
                class="thumb-overlay-anchor"
                title="Mở video trên YouTube"
              >
                <div class="play-circle">
                  <AppIcon name="play" size="24" />
                </div>
              </a>
            </div>
          </div>

          <!-- Right: Video Meta Details -->
          <div class="hero-info-side">
            <!-- Badges -->
            <div class="hero-badges-line">
              <span v-if="video.isOverThreshold" class="badge-threshold-hero">
                <span class="warning-pulse-dot" />
                Vượt ngưỡng cảnh báo
              </span>
              <span class="badge-alert-hero" :class="`alert-${videoService.getAlertBadge(video.alert).tone}`">
                {{ videoService.getAlertBadge(video.alert).label }}
              </span>
            </div>

            <!-- Title -->
            <h1 class="hero-video-title">{{ video.title }}</h1>

            <!-- Channel Link -->
            <router-link :to="'/kenh-theo-doi/' + video.channel.id" class="hero-channel-line" title="Xem phân tích kênh">
              <div class="avatar-ring">
                <img
                  v-if="video.channel.avatarUrl"
                  :src="video.channel.avatarUrl"
                  :alt="video.channel.name"
                  class="avatar-image"
                  @error="handleAvatarError"
                />
                <div v-else class="avatar-letter">
                  {{ video.channel.name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="channel-text">
                <span class="channel-name-bold">{{ video.channel.name }}</span>
                <span v-if="video.channel.handle" class="channel-handle-muted">
                  {{ video.channel.handle }}
                </span>
              </div>
            </router-link>

            <!-- Metadata Chips -->
            <div class="hero-meta-chips">
              <div class="meta-chip">
                <span class="chip-key">YouTube ID:</span>
                <span class="chip-val mono">{{ video.youtubeVideoId }}</span>
              </div>
              <div class="meta-chip">
                <span class="chip-key">Thời gian đăng:</span>
                <span class="chip-val" :title="video.publishedAt">{{ videoService.formatRelativeTime(video.publishedAt) }}</span>
              </div>
              <div v-if="video.duration" class="meta-chip">
                <span class="chip-key">Thời lượng:</span>
                <span class="chip-val">{{ video.duration }}</span>
              </div>
            </div>
          </div>
        </section>
      </RevealItem>

      <!-- Section 2: Main Metrics Signal Rail (4 Cards) -->
      <RevealItem :delay="80">
        <section class="metrics-signal-rail">
          <!-- 1. Lượt xem hiện tại -->
          <MetricCard
            label="Lượt xem hiện tại"
            :value="videoService.formatViews(video.latestViewCount)"
            subtext="Lượt xem tích luỹ"
            icon="video"
          />

          <!-- 2. VPH đo được (Focal) -->
          <MetricCard
            label="VPH đo được"
            :value="videoService.formatVph(video.latestMeasuredVph)"
            :focal="true"
            :variant="video.latestMeasuredVph !== null && video.latestMeasuredVph > 0 ? 'accent' : 'muted'"
            :subtext="video.isOverThreshold ? `Vượt ngưỡng ${video.channel.alertVphThreshold.toLocaleString('vi-VN')} VPH` : (video.latestMeasuredVph !== null ? 'Tốc độ tăng mỗi giờ' : 'Cần tối thiểu 2 lần quét')"
            icon="zap"
          />

          <!-- 3. Tăng từ lần trước -->
          <MetricCard
            label="Tăng từ lần trước"
            :value="videoService.formatViewDelta(video.latestSnapshot?.viewDelta)"
            :variant="video.latestSnapshot?.viewDelta !== null && (video.latestSnapshot?.viewDelta ?? 0) > 0 ? 'positive' : 'muted'"
            :subtext="video.latestSnapshot?.elapsedSeconds ? `Trong ${videoService.formatElapsedSeconds(video.latestSnapshot.elapsedSeconds)}` : 'Lần kiểm tra gần nhất'"
            icon="trending-up"
          />

          <!-- 4. Ngưỡng cảnh báo -->
          <MetricCard
            label="Ngưỡng cảnh báo"
            :value="`${video.channel.alertVphThreshold.toLocaleString('vi-VN')} VPH`"
            subtext="Cấu hình theo kênh"
            icon="bell"
          />
        </section>
      </RevealItem>

      <!-- Section 3: Event Alert Status Panel -->
      <RevealItem :delay="120">
        <section class="alert-event-panel" :class="{ 'panel-alerted': video.alert && video.alert.status === 'sent' }">
          <div class="panel-left-content">
            <div class="alert-icon-orb">
              <AppIcon name="bell" size="18" />
            </div>
            <div class="alert-text-body">
              <div class="alert-heading">
                <span class="heading-text">Cảnh báo Discord:</span>
                <span class="badge-alert-hero" :class="`alert-${videoService.getAlertBadge(video.alert).tone}`">
                  {{ videoService.getAlertBadge(video.alert).label }}
                </span>
              </div>
              <div class="alert-subline">
                <span v-if="video.alert?.status === 'sent' && video.alert.sentAt">
                  Đã gửi thông báo đến Discord lúc <strong>{{ formatDateTime(video.alert.sentAt) }}</strong>
                  với tốc độ đo được <strong>{{ video.alert.measuredVph ? Math.round(video.alert.measuredVph).toLocaleString('vi-VN') : '—' }} VPH</strong>.
                </span>
                <span v-else-if="video.alert?.status === 'pending' || video.alert?.status === 'sending'">
                  Video đã vượt ngưỡng cảnh báo và đang trong hàng đợi gửi tới kênh Discord.
                </span>
                <span v-else-if="video.alert?.status === 'failed'">
                  Không thể gửi cảnh báo qua Discord webhook.
                  <span v-if="video.alert.lastError" class="alert-error-detail">Lỗi: {{ video.alert.lastError.replace(/https?:\/\/[^\s]+/g, '[URL]').substring(0, 200) }}</span>
                </span>
                <span v-else>
                  Video chưa từng vượt ngưỡng cảnh báo của kênh hoặc chưa kích hoạt gửi thông báo.
                </span>
              </div>
            </div>
          </div>

          <div v-if="video.alert" class="panel-right-action">
            <router-link :to="'/lich-su-canh-bao?video=' + video.id" class="btn-alert-history">
              <AppIcon name="bell" size="13" />
              <span>Xem Lịch Sử Cảnh Báo</span>
            </router-link>
          </div>
        </section>
      </RevealItem>

      <!-- Section 4: Growth Charts Surface -->
      <RevealItem :delay="160">
        <section class="chart-surface-panel">
          <div class="surface-header">
            <div class="surface-title-group">
              <h2 class="surface-title">Tăng Trưởng Theo Thời Gian</h2>
              <p class="surface-subtitle">Dữ liệu đo thực tế từ các lần quét định kỳ của hệ thống.</p>
            </div>
          </div>

          <VideoGrowthCharts
            :snapshots="video.snapshots"
            :threshold="video.channel.alertVphThreshold"
          />
        </section>
      </RevealItem>

      <!-- Section 5: Snapshot History Table -->
      <RevealItem :delay="200">
        <section class="snapshot-history-panel">
          <div class="surface-header">
            <div class="surface-title-group">
              <h2 class="surface-title">Lịch Sử Snapshot</h2>
              <p class="surface-subtitle">Ghi nhận {{ video.snapshots.length }} lần quét định kỳ theo thứ tự thời gian.</p>
            </div>
          </div>

          <div v-if="video.snapshots.length === 0" class="history-empty-msg">
            Chưa có lịch sử lượt xem cho video này.
          </div>

          <div v-else class="history-table-container">
            <table class="history-obsidian-table">
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
                  <td class="col-snap-time">
                    <div class="time-main">{{ formatDateTime(snap.checkedAt) }}</div>
                    <div class="time-order">Lần quét #{{ index + 1 }}</div>
                  </td>

                  <!-- Lượt xem -->
                  <td class="col-snap-views">
                    <span class="views-num mono">{{ videoService.formatViews(snap.viewCount) }}</span>
                  </td>

                  <!-- Tăng -->
                  <td class="col-snap-delta">
                    <span
                      class="delta-num mono"
                      :class="{
                        'delta-pos': snap.viewDelta !== null && snap.viewDelta > 0,
                        'delta-neutral': snap.viewDelta === null || snap.viewDelta <= 0,
                      }"
                    >
                      {{ videoService.formatViewDelta(snap.viewDelta) }}
                    </span>
                  </td>

                  <!-- Khoảng thời gian -->
                  <td class="col-snap-elapsed">
                    <span class="elapsed-text">
                      {{ videoService.formatElapsedSeconds(snap.elapsedSeconds) }}
                    </span>
                  </td>

                  <!-- VPH đo được -->
                  <td class="col-snap-vph">
                    <span
                      class="vph-num mono"
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
        </section>
      </RevealItem>

      <!-- Section 6: Competitor Channel Info Surface -->
      <RevealItem :delay="240">
        <section class="channel-intel-panel">
          <div class="surface-header">
            <div class="surface-title-group">
              <h2 class="surface-title">Thông Tin Kênh Đối Thủ</h2>
              <p class="surface-subtitle">Thông số cấu hình theo dõi của kênh sở hữu video.</p>
            </div>
            <a
              :href="video.channel.url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-channel-external"
            >
              <span>Xem Kênh YouTube</span>
              <AppIcon name="external" size="13" />
            </a>
          </div>

          <div class="channel-intel-content">
            <div class="channel-intel-profile">
              <div class="channel-avatar-frame">
                <img
                  v-if="video.channel.avatarUrl"
                  :src="video.channel.avatarUrl"
                  :alt="video.channel.name"
                  class="avatar-large-img"
                  @error="handleAvatarError"
                />
                <div v-else class="avatar-large-char">
                  {{ video.channel.name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="channel-headings">
                <div class="channel-heading-name">{{ video.channel.name }}</div>
                <div v-if="video.channel.handle" class="channel-heading-handle">
                  {{ video.channel.handle }}
                </div>
              </div>
            </div>

            <div class="channel-config-grid">
              <div class="config-card">
                <span class="config-label">Trạng thái</span>
                <span class="config-value badge-status" :class="`status-${video.channel.status}`">
                  {{ video.channel.status === 'active' ? 'Đang theo dõi' : video.channel.status === 'paused' ? 'Tạm dừng' : 'Lưu trữ' }}
                </span>
              </div>
              <div class="config-card">
                <span class="config-label">Giới hạn video quét</span>
                <span class="config-value mono">{{ video.channel.scanLimit }} video mới nhất</span>
              </div>
              <div class="config-card">
                <span class="config-label">Ngưỡng cảnh báo</span>
                <span class="config-value mono">{{ video.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH</span>
              </div>
            </div>
          </div>
        </section>
      </RevealItem>
    </template>

    <!-- Access Key Prompt Modal -->
    <AccessKeyPromptModal
      v-model="showAccessKeyModal"
      :initial-error="accessKeyError"
      @confirmed="onAccessKeyConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import MetricCard from '@/components/ui/MetricCard.vue';
import RevealItem from '@/components/motion/RevealItem.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';
import VideoGrowthCharts from '@/features/videos/components/VideoGrowthCharts.vue';
import { videoService } from '@/services/video-service';
import {
  productionService,
  setStoredAccessKey,
  getStoredAccessKey,
  AccessKeyRequiredError,
} from '@/services/production-service';
import type { VideoDetail } from '@/types/video';

const route = useRoute();
const videoId = String(route.params.id || '');

const video = ref<VideoDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Production status state
const productionItemId = ref<string | null>(null);
const isAddingToProduction = ref(false);
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);

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

async function checkProductionState() {
  if (!videoId) return;
  try {
    productionItemId.value = await productionService.checkVideoInProduction(videoId);
  } catch {
    // Non-blocking
  }
}

async function handleAddToProduction() {
  if (!video.value || isAddingToProduction.value) return;

  const key = getStoredAccessKey();
  if (!key) {
    accessKeyError.value = null;
    showAccessKeyModal.value = true;
    return;
  }

  isAddingToProduction.value = true;
  try {
    const item = await productionService.createProductionItem(
      {
        sourceVideoId: video.value.id,
        workingTitle: video.value.title,
      },
      key
    );
    productionItemId.value = item.id;
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError) {
      accessKeyError.value = err.message;
      showAccessKeyModal.value = true;
    } else if (err?.message?.includes('đã có trong quy trình') || err?.message?.includes('409')) {
      await checkProductionState();
    } else {
      alert(err.message || 'Không thể đưa vào Tiến Độ Sản Xuất.');
    }
  } finally {
    isAddingToProduction.value = false;
  }
}

async function onAccessKeyConfirmed(key: string) {
  setStoredAccessKey(key);
  showAccessKeyModal.value = false;
  await handleAddToProduction();
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
      await checkProductionState();
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 28px 60px;
  color: #f8fafc;
}

/* Top Action Bar */
.top-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.18s ease;
}

.btn-back:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.05);
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-action-tool {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-refresh {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: #cbd5e1;
}

.btn-refresh:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.09);
  color: #f8fafc;
}

.btn-ai {
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #c084fc;
}

.btn-ai:hover {
  background: rgba(168, 85, 247, 0.22);
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.25);
}

.btn-to-prod {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38bdf8;
}

.btn-to-prod:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
}

.btn-in-prod {
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: #34d399;
}

.btn-youtube {
  background: #e11d48;
  border: 1px solid #f43f5e;
  color: #ffffff;
}

.btn-youtube:hover {
  background: #be123c;
  box-shadow: 0 0 16px rgba(225, 29, 72, 0.4);
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Hero Section */
.investigation-hero-card {
  display: grid;
  grid-template-columns: 42% 58%;
  gap: 28px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(12px);
  margin-bottom: 24px;
}

.hero-thumb-side {
  width: 100%;
}

.thumb-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.hero-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.thumb-container:hover .hero-thumb-img {
  transform: scale(1.025);
}

.hero-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.thumb-overlay-anchor {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.thumb-container:hover .thumb-overlay-anchor {
  opacity: 1;
}

.play-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(225, 29, 72, 0.9);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
  transition: transform 0.2s ease;
}

.play-circle:hover {
  transform: scale(1.1);
}

.hero-info-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.hero-badges-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.badge-threshold-hero {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.25);
}

.warning-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fbbf24;
  animation: pulse-dot 1.8s infinite;
}

.badge-alert-hero {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.alert-success {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.alert-warning {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.25);
}

.alert-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.alert-neutral {
  background: rgba(255, 255, 255, 0.05);
  color: #64748b;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-video-title {
  font-size: 26px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.35;
  margin: 0;
}

.hero-channel-line {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  width: fit-content;
  transition: opacity 0.15s ease;
}

.hero-channel-line:hover {
  opacity: 0.85;
}

.avatar-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: #0b111e;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-letter {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #94a3b8;
  font-size: 15px;
}

.channel-text {
  display: flex;
  flex-direction: column;
}

.channel-name-bold {
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
}

.channel-handle-muted {
  font-size: 12px;
  color: #64748b;
}

.hero-meta-chips {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  font-size: 12px;
}

.chip-key {
  color: #64748b;
}

.chip-val {
  color: #cbd5e1;
  font-weight: 500;
}

/* Main Metrics Signal Rail */
.metrics-signal-rail {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

/* Event Alert Panel */
.alert-event-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  margin-bottom: 24px;
}

.panel-alerted {
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 0 20px -5px rgba(56, 189, 248, 0.15);
}

.panel-left-content {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
}

.alert-icon-orb {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  flex-shrink: 0;
}

.alert-text-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.heading-text {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
}

.alert-subline {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}

.alert-subline strong {
  color: #f8fafc;
}

.alert-error-detail {
  color: #fca5a5;
  margin-left: 6px;
}

.btn-alert-history {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-alert-history:hover {
  background: rgba(56, 189, 248, 0.18);
}

/* Surface Panels */
.chart-surface-panel,
.snapshot-history-panel,
.channel-intel-panel {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 22px;
  backdrop-filter: blur(12px);
  margin-bottom: 24px;
}

.surface-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.surface-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.surface-title {
  font-size: 17px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.surface-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* Snapshot History Table */
.history-table-container {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.history-obsidian-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.history-obsidian-table th {
  background: rgba(10, 16, 28, 0.9);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  white-space: nowrap;
}

.history-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: background-color 0.15s ease;
}

.history-row:hover {
  background: rgba(30, 41, 59, 0.4);
}

.history-obsidian-table td {
  padding: 11px 16px;
  vertical-align: middle;
}

.time-main {
  color: #f1f5f9;
  font-weight: 500;
}

.time-order {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.views-num {
  color: #f8fafc;
  font-weight: 600;
}

.delta-num {
  font-weight: 600;
}

.delta-pos {
  color: #34d399;
}

.delta-neutral {
  color: #64748b;
}

.elapsed-text {
  color: #94a3b8;
  font-size: 12px;
}

.vph-num {
  font-weight: 700;
}

.vph-rising {
  color: #38bdf8;
}

.vph-muted {
  color: #64748b;
}

.history-empty-msg {
  padding: 30px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

/* Channel Intel Content */
.channel-intel-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.channel-intel-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.channel-avatar-frame {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: #090d16;
}

.avatar-large-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-large-char {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #94a3b8;
}

.channel-heading-name {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
}

.channel-heading-handle {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.channel-config-grid {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.config-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(10, 16, 28, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  min-width: 130px;
}

.config-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.config-value {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}

.badge-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  width: fit-content;
}

.status-active {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.status-paused {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.btn-channel-external {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-channel-external:hover {
  background: rgba(255, 255, 255, 0.09);
  color: #f8fafc;
}

/* Skeletons */
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-hero-card {
  height: 220px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}

.skeleton-stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-card {
  height: 85px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.skeleton-box {
  height: 180px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
}

/* Error Console Card */
.error-console-card {
  text-align: center;
  padding: 60px 24px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px dashed rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  margin: 40px auto;
  max-width: 500px;
}

.error-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  margin: 0 auto 16px;
}

.error-title {
  font-size: 18px;
  font-weight: 700;
  color: #fca5a5;
  margin-bottom: 8px;
}

.error-desc {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 20px;
  line-height: 1.5;
}

/* Responsive Media Queries */
@media (max-width: 1024px) {
  .investigation-hero-card {
    grid-template-columns: 1fr;
  }

  .metrics-signal-rail {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .alert-event-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-alert-history {
    justify-content: center;
  }

  .channel-intel-content {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 640px) {
  .video-detail-page {
    padding: 16px 16px 40px;
  }

  .top-action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .top-bar-actions {
    width: 100%;
  }

  .btn-action-tool {
    flex: 1 1 45%;
    min-height: 44px;
    justify-content: center;
  }

  .hero-video-title {
    font-size: 20px;
  }

  .metrics-signal-rail {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
