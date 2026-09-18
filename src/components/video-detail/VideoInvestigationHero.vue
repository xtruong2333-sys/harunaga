<template>
  <div class="video-investigation-hero surface-card">
    <div class="hero-layout-grid">
      <!-- Left: 16:9 Large Media Frame (52-58%) -->
      <div class="hero-media-column">
        <VideoThumbnail
          :src="video.thumbnailUrl"
          :alt="video.title"
          ratio="16-9"
          loading="eager"
          :detail-url="video.url"
          :youtube-video-id="video.youtubeVideoId"
          :vph-badge="video.latestMeasuredVph"
        />
      </div>

      <!-- Right: Identity & Telemetry Metrics (42-48%) -->
      <div class="hero-meta-column">
        <!-- Badges row -->
        <div class="hero-badge-strip">
          <!-- Threshold Badge -->
          <template v-if="video.channel.alertVphThreshold">
            <span
              v-if="video.isOverThreshold"
              class="badge-pill badge-over-threshold"
            >
              <span class="pulse-dot"></span>
              VƯỢT NGƯỠNG ({{ formatNumber(video.channel.alertVphThreshold) }} VPH)
            </span>
            <span v-else class="badge-pill badge-under-threshold">
              CHƯA VƯỢT ({{ formatNumber(video.channel.alertVphThreshold) }} VPH)
            </span>
          </template>
          <span v-else class="badge-pill badge-neutral">
            CHƯA THIẾT LẬP NGƯỠNG
          </span>

          <!-- Alert Status Badge -->
          <span
            class="badge-pill"
            :class="`alert-status-${alertBadge.tone}`"
          >
            {{ alertBadge.label }}
          </span>
        </div>

        <!-- Video Title -->
        <h1 class="hero-title" :title="video.title">
          {{ video.title }}
        </h1>

        <!-- Channel Identity Line -->
        <div class="channel-identity-line">
          <router-link
            :to="'/kenh-theo-doi/' + video.channel.id"
            class="channel-avatar-link"
            :title="video.channel.name"
          >
            <img
              v-if="video.channel.avatarUrl && !avatarError"
              :src="video.channel.avatarUrl"
              :alt="video.channel.name"
              class="channel-avatar-img"
              loading="lazy"
              @error="avatarError = true"
            />
            <div v-else class="channel-avatar-char">
              {{ (video.channel.name || 'C').charAt(0).toUpperCase() }}
            </div>
          </router-link>

          <div class="channel-info-text">
            <router-link
              :to="'/kenh-theo-doi/' + video.channel.id"
              class="channel-name-link"
            >
              {{ video.channel.name }}
            </router-link>
            <span v-if="video.channel.handle" class="channel-handle">
              {{ video.channel.handle }}
            </span>
            <span class="meta-dot">•</span>
            <span
              class="video-publish-age"
              :title="formatExactDateTime(video.publishedAt)"
            >
              {{ formatVideoAge(video.publishedAt) }}
            </span>
          </div>
        </div>

        <!-- Primary Metrics: Hero Integrated Signal Rail -->
        <div class="hero-integrated-signal-rail">
          <!-- Focal VPH Box -->
          <div
            class="focal-vph-container"
            title="Số lượt xem tăng trung bình mỗi giờ giữa hai lần hệ thống đo gần nhất."
          >
            <div class="focal-vph-value mono text-accent">
              {{ formattedVph }}
            </div>
            <div class="focal-vph-label">
              TỐC ĐỘ TĂNG TRƯỞNG (VPH)
            </div>
          </div>

          <!-- Secondary Telemetry Stats -->
          <div class="telemetry-grid">
            <div class="telemetry-box">
              <span class="telemetry-label">LƯỢT XEM HIỆN TẠI</span>
              <span class="telemetry-value mono">{{ formatNumber(video.latestViewCount) }}</span>
            </div>
            <div class="telemetry-box">
              <span class="telemetry-label">TĂNG GẦN NHẤT</span>
              <span
                class="telemetry-value mono"
                :class="{ 'text-positive': latestDelta && latestDelta > 0 }"
              >
                {{ formatDelta(latestDelta) }}
              </span>
            </div>
            <div class="telemetry-box">
              <span class="telemetry-label">NGƯỠNG KÊNH</span>
              <span class="telemetry-value mono">
                {{ video.channel.alertVphThreshold !== null ? formatNumber(video.channel.alertVphThreshold) + ' VPH' : '—' }}
              </span>
            </div>
            <div class="telemetry-box">
              <span class="telemetry-label">TUỔI VIDEO</span>
              <span class="telemetry-value mono">{{ formatVideoAge(video.publishedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions Row -->
        <div class="hero-actions-deck">
          <!-- Primary: Production CTA -->
          <router-link
            v-if="productionItemId"
            to="/tien-do-san-xuat"
            class="btn btn-in-production"
            title="Mục này đã có trong Tiến Độ Sản Xuất. Nhấn để mở."
          >
            <AppIcon name="check-circle" size="14" />
            <span>Đã Trong Tiến Độ Sản Xuất</span>
          </router-link>
          <button
            v-else
            type="button"
            class="btn btn-primary btn-production"
            :disabled="isAddingToProduction"
            @click="$emit('add-production')"
          >
            <AppIcon name="clipboard-list" size="14" />
            <span>{{ isAddingToProduction ? 'Đang xử lý...' : 'Đưa Vào Sản Xuất' }}</span>
          </button>

          <!-- Secondary: AI Analyze -->
          <router-link
            :to="'/tro-ly-noi-dung?video=' + video.id"
            class="btn btn-secondary"
            title="Phân tích nội dung và tạo ý tưởng bằng AI"
          >
            <AppIcon name="sparkles" size="14" />
            <span>Phân Tích Bằng AI</span>
          </router-link>

          <!-- Secondary: YouTube Watch -->
          <a
            :href="video.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary btn-yt"
            title="Xem trên YouTube"
          >
            <span>Xem Trên YouTube</span>
            <AppIcon name="external" size="13" />
          </a>

          <!-- Alert History Link -->
          <router-link
            :to="'/lich-su-canh-bao?video=' + video.id"
            class="btn btn-secondary btn-alert-hist"
            title="Xem lịch sử cảnh báo"
          >
            <AppIcon name="bell" size="13" />
            <span>Lịch Sử Cảnh Báo</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import type { VideoDetail } from '@/types/video';

const props = defineProps<{
  video: VideoDetail;
  productionItemId?: string | null;
  isAddingToProduction?: boolean;
}>();

defineEmits<{
  (e: 'add-production'): void;
}>();

const avatarError = ref(false);

const latestDelta = computed(() => {
  return props.video.latestSnapshot?.viewDelta ?? (props.video as any).latestDeltaViews ?? null;
});

const alertBadge = computed(() => {
  const a = props.video.alert;
  if (!a || !a.status) return { label: 'Chưa cảnh báo', tone: 'muted' };
  switch (a.status) {
    case 'pending': return { label: 'Chờ gửi', tone: 'warning' };
    case 'sending': return { label: 'Đang gửi', tone: 'warning' };
    case 'sent': return { label: 'Đã cảnh báo', tone: 'success' };
    case 'failed': return { label: 'Gửi lỗi', tone: 'danger' };
    default: return { label: 'Chưa cảnh báo', tone: 'muted' };
  }
});

const formattedVph = computed(() => {
  const v = props.video.latestMeasuredVph;
  if (v === null || v === undefined) return '—';
  if (v >= 1000) {
    return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K VPH';
  }
  return `${Math.round(v).toLocaleString('vi-VN')} VPH`;
});

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '—';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString('vi-VN');
}

function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return '—';
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${formatNumber(delta)}`;
}

function formatExactDateTime(iso: string): string {
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

function formatVideoAge(publishedAt: string): string {
  if (!publishedAt) return '—';
  const pubTime = new Date(publishedAt).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - pubTime) / 1000));
  if (diffSeconds < 60) return 'Vừa xong';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}
</script>

<style scoped>
.video-investigation-hero {
  padding: 24px;
  border-radius: 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: var(--shadow-sm, 0 4px 20px rgba(30, 60, 90, 0.05));
  margin-bottom: 24px;
}

.hero-layout-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 28px;
  align-items: start;
}

.hero-media-column {
  width: 100%;
}

.hero-meta-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-badge-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-over-threshold {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.badge-under-threshold {
  background: #F8FAFC;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.badge-neutral {
  background: #F8FAFC;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #DC2626;
  box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6);
  animation: pulseDot 2s infinite;
}

@keyframes pulseDot {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
  70% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-dot {
    animation: none;
    box-shadow: none;
  }
}

.alert-status-success {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
}

.alert-status-warning {
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid #FDE68A;
}

.alert-status-danger {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.alert-status-muted,
.alert-status-neutral {
  background: #F8FAFC;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.hero-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.channel-identity-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.channel-avatar-link {
  display: block;
  flex-shrink: 0;
}

.channel-avatar-img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border, #E3EBF3);
}

.channel-avatar-char {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #BFDBFE;
}

.channel-info-text {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 13px;
}

.channel-name-link {
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
}

.channel-name-link:hover {
  color: var(--primary, #2563EB);
}

.channel-handle {
  color: var(--text-muted, #64748B);
  font-size: 12px;
}

.meta-dot {
  color: #CBD5E1;
}

.video-publish-age {
  color: var(--text-secondary, #475569);
  font-size: 12.5px;
}

/* Integrated Signal Rail */
.hero-integrated-signal-rail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
}

.focal-vph-container {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.focal-vph-value {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}

.text-accent {
  color: var(--primary, #2563EB);
}

.focal-vph-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-muted, #64748B);
}

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.telemetry-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.telemetry-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted, #64748B);
}

.telemetry-value {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
}

.text-positive {
  color: #059669;
}

/* Actions Deck */
.hero-actions-deck {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--primary, #2563EB);
  color: #FFFFFF;
  border: 1px solid var(--primary, #2563EB);
}

.btn-primary:hover:not(:disabled) {
  background: #1D4ED8;
  border-color: #1D4ED8;
}

.btn-in-production {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
}

.btn-secondary {
  background: var(--surface, #FFFFFF);
  color: var(--text-primary, #0F172A);
  border: 1px solid var(--border, #E3EBF3);
}

.btn-secondary:hover {
  background: var(--bg-inset, #F8FAFC);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

@media (max-width: 1024px) {
  .hero-layout-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 640px) {
  .video-investigation-hero {
    padding: 16px;
  }

  .hero-title {
    font-size: 18px;
  }

  .telemetry-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions-deck {
    flex-direction: column;
    width: 100%;
  }

  .hero-actions-deck .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
