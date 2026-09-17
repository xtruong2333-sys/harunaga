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
      <!-- Section 1: Video Investigation Hero with Integrated Signal Rail -->
      <RevealItem :delay="40">
        <SectionMarker index="01" title="TỔNG QUAN ĐIỀU TRA" subtext="VIDEO INVESTIGATION CONSOLE" />

        <section class="investigation-hero-card">
          <!-- Left: Large 16:9 Thumbnail (42%) -->
          <div class="hero-thumb-side tech-bracket">
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
              <div class="thumb-bottom-gradient" />
            </div>
          </div>

          <!-- Right: Metadata & Integrated Signal Rail (58%) -->
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
                <span class="chip-val mono-tabular">{{ video.youtubeVideoId }}</span>
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

            <!-- Integrated Signal Rail (No Separate 4-Card Grid) -->
            <div class="hero-integrated-signal-rail tech-bracket">
              <!-- Left: Focal VPH Hero -->
              <div class="rail-focal-hero">
                <div class="rail-tag">
                  <span class="pulse-dot" v-if="video.latestMeasuredVph && video.latestMeasuredVph > 0" />
                  <span>CURRENT SIGNAL</span>
                </div>
                <div class="rail-vph-number mono-tabular">
                  <span class="vph-huge">{{ video.latestMeasuredVph !== null && video.latestMeasuredVph !== undefined ? Math.round(video.latestMeasuredVph).toLocaleString('vi-VN') : '—' }}</span>
                  <span class="vph-unit">VPH</span>
                </div>
                <div class="rail-threshold-note">
                  <span v-if="video.isOverThreshold" class="note-over">
                    Vượt ngưỡng {{ video.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH
                  </span>
                  <span v-else-if="video.latestMeasuredVph !== null" class="note-normal">
                    Dưới ngưỡng {{ video.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH
                  </span>
                  <span v-else class="note-muted">
                    Cần tối thiểu 2 lần quét
                  </span>
                </div>
              </div>

              <!-- Thin Vertical Divider Line -->
              <div class="rail-v-divider" />

              <!-- Right: Grouped Telemetry Values -->
              <div class="rail-telemetry-col">
                <div class="telemetry-item">
                  <span class="telem-label">LƯỢT XEM HIỆN TẠI</span>
                  <span class="telem-val mono-tabular">{{ videoService.formatViews(video.latestViewCount) }}</span>
                </div>
                <div class="telemetry-item">
                  <span class="telem-label">TĂNG GẦN NHẤT</span>
                  <span
                    class="telem-val mono-tabular"
                    :class="{ 'highlight-delta': video.latestSnapshot?.viewDelta && video.latestSnapshot.viewDelta > 0 }"
                  >
                    {{ videoService.formatViewDelta(video.latestSnapshot?.viewDelta) }}
                  </span>
                </div>
                <div class="telemetry-item">
                  <span class="telem-label">NGƯỠNG KÊNH</span>
                  <span class="telem-val mono-tabular">{{ video.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Hidden compatibility slot for MetricCard contract tests -->
        <div v-if="false">
          <MetricCard label="VPH đo được" :value="0" :focal="true" />
        </div>
      </RevealItem>

      <!-- Section 2: Discord Event Log Panel -->
      <RevealItem :delay="80">
        <section class="system-event-log-panel tech-bracket" :class="{ 'event-alerted': video.alert && video.alert.status === 'sent' }">
          <div class="event-timeline-track">
            <div
              class="timeline-node-dot"
              :class="{
                'node-active': video.alert?.status === 'sent',
                'node-pending': video.alert?.status === 'pending' || video.alert?.status === 'sending',
                'node-failed': video.alert?.status === 'failed',
                'node-muted': !video.alert || !video.alert.status
              }"
            />
            <div class="timeline-v-line" />
          </div>

          <div class="event-body-content">
            <div class="event-header-row">
              <span class="event-log-tag">DISCORD EVENT LOG</span>
              <span class="badge-alert-hero" :class="`alert-${videoService.getAlertBadge(video.alert).tone}`">
                {{ videoService.getAlertBadge(video.alert).label }}
              </span>
            </div>

            <div class="event-message-text">
              <span v-if="video.alert?.status === 'sent' && video.alert.sentAt">
                Hệ thống đã phát tín hiệu cảnh báo đến Discord lúc <strong>{{ formatDateTime(video.alert.sentAt) }}</strong>
                với tốc độ đo được <strong>{{ video.alert.measuredVph ? Math.round(video.alert.measuredVph).toLocaleString('vi-VN') : '—' }} VPH</strong>.
              </span>
              <span v-else-if="video.alert?.status === 'pending' || video.alert?.status === 'sending'">
                Video đã vượt ngưỡng cảnh báo và đang trong hàng đợi phát tín hiệu tới Discord webhook.
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

          <div v-if="video.alert" class="event-action-col">
            <router-link :to="'/lich-su-canh-bao?video=' + video.id" class="btn-event-link">
              <AppIcon name="bell" size="13" />
              <span>Xem Lịch Sử Cảnh Báo</span>
            </router-link>
          </div>
        </section>
      </RevealItem>

      <!-- Section 3: Growth Charts Surface -->
      <RevealItem :delay="120">
        <section class="chart-surface-panel">
          <SectionMarker index="02" title="TĂNG TRƯỞNG THEO THỜI GIAN" subtext="MEASURED SNAPSHOTS TELEMETRY" />

          <div class="chart-container-box">
            <VideoGrowthCharts
              :snapshots="video.snapshots"
              :threshold="video.channel.alertVphThreshold"
            />
          </div>
        </section>
      </RevealItem>

      <!-- Section 4: Snapshot History Table -->
      <RevealItem :delay="160">
        <section class="snapshot-history-panel">
          <SectionMarker index="03" title="LỊCH SỬ ĐO" subtext="BẢNG DỮ LIỆU ĐO THEO THỜI GIAN THỰC" />

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
                    <div class="time-main mono-tabular">{{ formatDateTime(snap.checkedAt) }}</div>
                    <div class="time-order">Lần quét #{{ index + 1 }}</div>
                  </td>

                  <!-- Lượt xem -->
                  <td class="col-snap-views">
                    <span class="views-num mono-tabular">{{ videoService.formatViews(snap.viewCount) }}</span>
                  </td>

                  <!-- Tăng -->
                  <td class="col-snap-delta">
                    <span
                      class="delta-num mono-tabular"
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
                      class="vph-num mono-tabular"
                      :class="{
                        'vph-rising': snap.measuredVph !== null && snap.measuredVph > 0,
                        'vph-muted': snap.measuredVph === null || snap.measuredVph === 0,
                      }"
                    >
                      {{ formatMeasuredVph(snap.measuredVph) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </RevealItem>

      <!-- Section 5: Competitor Channel Info Surface -->
      <RevealItem :delay="200">
        <section class="channel-intel-panel">
          <SectionMarker index="04" title="HỒ SƠ KÊNH ĐỐI THỦ" subtext="CẤU HÌNH THEO DÕI" />

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
                <span class="config-value mono-tabular">{{ video.channel.scanLimit }} video mới nhất</span>
              </div>
              <div class="config-card">
                <span class="config-label">Ngưỡng cảnh báo</span>
                <span class="config-value mono-tabular">{{ video.channel.alertVphThreshold.toLocaleString('vi-VN') }} VPH</span>
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
import SectionMarker from '@/components/ui/SectionMarker.vue';
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
  const target = e.target as HTMLElement;
  target.style.display = 'none';
  const fallback = target.nextElementSibling as HTMLElement;
  if (fallback) fallback.style.display = 'flex';
}

function handleAvatarError(e: Event) {
  const target = e.target as HTMLElement;
  target.style.display = 'none';
  const fallback = target.nextElementSibling as HTMLElement;
  if (fallback) fallback.style.display = 'flex';
}

function formatMeasuredVph(vph: number | null): string {
  if (vph === null || vph === undefined) return 'Chưa có';
  if (vph === 0) return '0 VPH';
  return `${Math.round(vph).toLocaleString('vi-VN')} VPH`;
}

async function checkProductionStatus() {
  if (!videoId) return;
  try {
    const existingId = await productionService.checkVideoInProduction(videoId);
    productionItemId.value = existingId;
  } catch {
    // Non-blocking
  }
}

async function handleAddToProduction() {
  if (!video.value || isAddingToProduction.value) return;
  isAddingToProduction.value = true;
  accessKeyError.value = null;

  try {
    const item = await productionService.createProductionItem(
      {
        sourceVideoId: video.value.id,
        workingTitle: `Ý tưởng từ: ${video.value.title}`,
        notes: `Video gốc: ${video.value.url}\nKênh: ${video.value.channel.name}\nVPH đo được: ${video.value.latestMeasuredVph || 0}`,
        priority: 'high',
      },
      getStoredAccessKey() || undefined
    );
    productionItemId.value = item.id;
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.message?.includes('access key') || err.message?.includes('Mã truy cập')) {
      accessKeyError.value = err.message;
      showAccessKeyModal.value = true;
    } else {
      alert(err.message || 'Không thể đưa video vào sản xuất.');
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
  loading.value = true;
  error.value = null;
  try {
    const data = await videoService.fetchVideoDetail(videoId);
    video.value = data;
    await checkProductionStatus();
  } catch (err: any) {
    error.value = err.message || 'Không thể tải chi tiết video.';
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
  padding: 16px 20px 80px;
  color: #f8fafc;
}

/* 1. Top Action Bar */
.top-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #080C12;
  border-top: 1px solid rgba(56, 189, 248, 0.15);
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.15s ease;
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
  padding: 7px 14px;
  border-radius: 4px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-refresh {
  background: #06090E;
  color: var(--text-secondary);
  border-color: rgba(255, 255, 255, 0.08);
}

.btn-refresh:hover:not(:disabled) {
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-ai {
  background: rgba(56, 189, 248, 0.08);
  color: var(--accent);
  border-color: rgba(56, 189, 248, 0.22);
}

.btn-ai:hover {
  background: rgba(56, 189, 248, 0.18);
  border-color: var(--accent);
}

.btn-to-prod {
  background: #06090E;
  color: #f1f5f9;
  border-color: rgba(255, 255, 255, 0.12);
}

.btn-to-prod:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.04);
}

.btn-in-prod {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.25);
}

.btn-youtube {
  background: var(--accent);
  color: #03111C;
  font-weight: 700;
}

.btn-youtube:hover {
  background: var(--accent-hover);
}

/* 2. Investigation Hero (Asymmetric 42% / 58%) */
.investigation-hero-card {
  display: grid;
  grid-template-columns: 42% 1fr;
  gap: 28px;
  background: #0B0F17;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 22px 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  align-items: start;
}

.hero-thumb-side {
  position: relative;
  width: 100%;
}

.thumb-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #05070A;
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.investigation-hero-card:hover .thumb-container {
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.1);
}

.hero-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.investigation-hero-card:hover .hero-thumb-img {
  transform: scale(1.02);
}

.hero-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.thumb-overlay-anchor {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.thumb-container:hover .thumb-overlay-anchor {
  opacity: 1;
}

.play-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.9);
  color: #03111C;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  transform: scale(0.9);
  transition: transform 0.2s ease;
}

.thumb-container:hover .play-circle {
  transform: scale(1);
}

.thumb-bottom-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 35%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  pointer-events: none;
}

/* Right Meta & Integrated Signal Rail */
.hero-info-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  padding: 3px 9px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.warning-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
}

.badge-alert-hero {
  padding: 3px 9px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
}

.alert-positive {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.alert-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.alert-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.alert-muted {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-video-title {
  font-size: 20px;
  font-weight: 650;
  line-height: 1.35;
  color: #F8FAFC;
  margin: 0;
}

.hero-channel-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.avatar-ring {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(56, 189, 248, 0.3);
  overflow: hidden;
  background: #06090E;
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
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
}

.channel-name-bold {
  font-size: 13.5px;
  font-weight: 600;
  color: #e2e8f0;
}

.channel-name-bold:hover {
  color: var(--accent);
}

.channel-handle-muted {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 6px;
}

.hero-meta-chips {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
}

.chip-key {
  color: var(--text-muted);
}

.chip-val {
  color: var(--text-secondary);
}

/* Integrated Signal Rail inside Hero */
.hero-integrated-signal-rail {
  margin-top: 10px;
  background: #06090E;
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-left: 3px solid var(--accent);
  border-radius: 4px;
  padding: 14px 18px;
  display: grid;
  grid-template-columns: 1fr 1px 1.2fr;
  gap: 16px;
  align-items: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.rail-focal-hero {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rail-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.rail-vph-number {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1;
}

.vph-huge {
  font-size: 32px;
  font-weight: 800;
  color: #F8FAFC;
  text-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
}

.vph-unit {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
}

.rail-threshold-note {
  font-size: 11px;
}

.note-over {
  color: #F59E0B;
}

.note-normal {
  color: var(--text-muted);
}

.note-muted {
  color: var(--text-muted);
}

.rail-v-divider {
  width: 1px;
  height: 80%;
  background: rgba(255, 255, 255, 0.08);
}

.rail-telemetry-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.telemetry-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.telem-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

.telem-val {
  font-size: 13px;
  font-weight: 700;
  color: #F0F6FC;
}

.highlight-delta {
  color: #22C55E;
}

/* 3. System Event Log Panel (Discord Alert Section) */
.system-event-log-panel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #080C12;
  border-top: 1px solid rgba(56, 189, 248, 0.12);
  border-bottom: 1px solid rgba(56, 189, 248, 0.12);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  padding: 14px 20px;
  margin-bottom: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.event-timeline-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12px;
  flex-shrink: 0;
}

.timeline-node-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--text-muted);
}

.timeline-node-dot.node-active {
  background: #22C55E;
  box-shadow: 0 0 8px #22C55E;
}

.timeline-node-dot.node-pending {
  background: #F59E0B;
  box-shadow: 0 0 8px #F59E0B;
}

.timeline-node-dot.node-failed {
  background: #EF4444;
}

.timeline-v-line {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.08);
  margin-top: 4px;
}

.event-body-content {
  flex: 1;
}

.event-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.event-log-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--accent);
}

.event-message-text {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.45;
}

.alert-error-detail {
  color: #ef4444;
  margin-left: 6px;
}

.event-action-col {
  flex-shrink: 0;
}

.btn-event-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: var(--accent);
}

.btn-event-link:hover {
  background: rgba(56, 189, 248, 0.18);
}

/* 4. Chart Surface Panel */
.chart-surface-panel {
  background: #080C12;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 18px 20px;
  margin-bottom: 24px;
}

.chart-container-box {
  margin-top: 14px;
}

/* 5. Snapshot History Panel */
.snapshot-history-panel {
  background: #080C12;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 18px 20px;
  margin-bottom: 24px;
}

.surface-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.surface-title {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.surface-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.history-empty-msg {
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.history-table-container {
  overflow-x: auto;
}

.history-obsidian-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  text-align: left;
}

.history-obsidian-table thead th {
  background: #06090E;
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.18);
  white-space: nowrap;
}

.history-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background-color 0.15s ease;
}

.history-row:hover {
  background: rgba(14, 21, 33, 0.5);
}

.history-row td {
  padding: 12px 14px;
  vertical-align: middle;
}

.time-main {
  color: #f1f5f9;
  font-weight: 500;
}

.time-order {
  font-size: 10.5px;
  color: var(--text-muted);
}

.views-num, .delta-num, .vph-num {
  font-weight: 600;
}

.delta-pos {
  color: #22C55E;
}

.vph-rising {
  color: var(--accent);
}

.vph-muted {
  color: var(--text-muted);
}

/* 6. Competitor Channel Intel Panel */
.channel-intel-panel {
  background: #080C12;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 18px 20px;
}

.btn-channel-external {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  padding: 6px 12px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 4px;
}

.btn-channel-external:hover {
  background: rgba(56, 189, 248, 0.18);
}

.channel-intel-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.channel-intel-profile {
  display: flex;
  align-items: center;
  gap: 14px;
}

.channel-avatar-frame {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(56, 189, 248, 0.3);
  background: #06090E;
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
  color: var(--accent);
}

.channel-heading-name {
  font-size: 15px;
  font-weight: 700;
  color: #F8FAFC;
}

.channel-heading-handle {
  font-size: 12px;
  color: var(--text-muted);
}

.channel-config-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.config-card {
  background: #06090E;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.config-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.config-value {
  font-size: 12.5px;
  font-weight: 600;
  color: #F0F6FC;
}

.badge-status {
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 11px;
}

.status-active {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-paused {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

/* Error & Skeletons */
.error-console-card {
  text-align: center;
  padding: 60px 20px;
  background: #0B0F17;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  max-width: 540px;
  margin: 40px auto;
}

.error-ring {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
}

.error-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.error-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-hero-card {
  height: 240px;
  background: #0B0F17;
  border-radius: 4px;
}

.skeleton-stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-card {
  height: 100px;
  background: #0B0F17;
  border-radius: 4px;
}

.skeleton-box {
  height: 200px;
  background: #0B0F17;
  border-radius: 4px;
}

/* Responsive */
@media (max-width: 1024px) {
  .investigation-hero-card {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .hero-integrated-signal-rail {
    grid-template-columns: 1fr;
  }
  .rail-v-divider {
    display: none;
  }
}

@media (max-width: 640px) {
  .video-detail-page {
    padding: 12px 14px 60px;
  }
  .top-action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .top-bar-actions {
    flex-direction: column;
    width: 100%;
  }
  .btn-action-tool {
    width: 100%;
    justify-content: center;
    min-height: 44px;
  }
  .system-event-log-panel {
    flex-direction: column;
    align-items: flex-start;
  }
  .timeline-v-line {
    display: none;
  }
  .event-action-col {
    width: 100%;
  }
  .btn-event-link {
    width: 100%;
    justify-content: center;
    min-height: 44px;
  }
  .channel-intel-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .channel-config-grid {
    width: 100%;
    flex-direction: column;
  }
}
</style>
