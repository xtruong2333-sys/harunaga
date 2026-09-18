<template>
  <div class="channel-profile-hero surface-card">
    <!-- Top Nav / Back Row -->
    <div class="hero-nav-row">
      <router-link to="/kenh-theo-doi" class="btn-back">
        <AppIcon name="arrow-left" size="16" />
        <span>Quay Lại Kênh Theo Dõi</span>
      </router-link>
      <div class="nav-kicker-badge">
        <span class="pulse-dot"></span>
        <span class="kicker-txt">COMPETITOR INTELLIGENCE PROFILE</span>
      </div>
    </div>

    <div class="hero-main-layout">
      <!-- Left Column: Channel Identity -->
      <div class="identity-col">
        <div class="avatar-wrap">
          <img
            v-if="channel.avatarUrl && !avatarError"
            :src="channel.avatarUrl"
            :alt="channel.name"
            class="channel-avatar"
            loading="lazy"
            @error="avatarError = true"
          />
          <div v-else class="avatar-fallback">
            {{ (channel.name || 'C').charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="identity-meta">
          <div class="name-status-row">
            <h1 class="hero-channel-name">{{ channel.name }}</h1>
            <span class="status-badge" :class="`status-${channel.status}`">
              {{ statusLabel }}
            </span>
          </div>

          <div class="handle-links-row">
            <span v-if="channel.handle" class="hero-channel-handle">{{ channel.handle }}</span>
            <a
              :href="channel.url"
              target="_blank"
              rel="noopener noreferrer"
              class="external-yt-link"
              title="Xem kênh trực tiếp trên YouTube"
            >
              <span>Kênh YouTube</span>
              <AppIcon name="external" size="13" />
            </a>
          </div>
        </div>
      </div>

      <!-- Right Column: Quick Telemetry Strip -->
      <div class="telemetry-col">
        <div class="telemetry-cell">
          <span class="tel-lbl">NGƯỠNG CẢNH BÁO</span>
          <span class="tel-val mono text-accent">
            {{ channel.alertVphThreshold !== null && channel.alertVphThreshold !== undefined ? channel.alertVphThreshold.toLocaleString('vi-VN') + ' VPH' : '—' }}
          </span>
        </div>

        <div class="telemetry-cell">
          <span class="tel-lbl">GIỚI HẠN QUÉT</span>
          <span class="tel-val mono">
            {{ channel.scanLimit !== null && channel.scanLimit !== undefined ? channel.scanLimit + ' video / lần' : '—' }}
          </span>
        </div>

        <div class="telemetry-cell">
          <span class="tel-lbl">QUÉT GẦN NHẤT</span>
          <span class="tel-val" :title="channel.lastScanAt ? formatFullDateTime(channel.lastScanAt) : ''">
            {{ channel.lastScanAt ? formatRelativeTime(channel.lastScanAt) : 'Chưa kiểm tra' }}
          </span>
        </div>

        <div class="telemetry-cell">
          <span class="tel-lbl">NGÀY THÊM</span>
          <span class="tel-val mono">{{ formatDateOnly(channel.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom Action Deck -->
    <div class="hero-action-deck">
      <div class="deck-left">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="loading || disabled"
          @click="$emit('refresh')"
          title="Tải lại dữ liệu mới nhất từ hệ thống"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>

        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="disabled"
          @click="$emit('edit')"
          title="Chỉnh sửa cấu hình ngưỡng và quét của kênh"
        >
          <AppIcon name="edit" size="14" />
          <span>Chỉnh Sửa</span>
        </button>

        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="isPausingOrResuming || disabled"
          @click="$emit('toggle-pause')"
          :title="channel.status === 'active' ? 'Tạm dừng theo dõi kênh này' : 'Tiếp tục theo dõi kênh này'"
        >
          <AppIcon :name="channel.status === 'active' ? 'pause' : 'play'" size="14" />
          <span>{{ pauseActionLabel }}</span>
        </button>

        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="isArchivingOrRestoring || disabled"
          @click="$emit('toggle-archive')"
          :title="channel.status === 'archived' ? 'Khôi phục kênh' : 'Lưu trữ kênh này'"
        >
          <AppIcon :name="channel.status === 'archived' ? 'rotate-ccw' : 'archive'" size="14" />
          <span>{{ archiveActionLabel }}</span>
        </button>
      </div>

      <div class="deck-right">
        <router-link
          :to="'/so-sanh-kenh?channels=' + channel.id"
          class="btn btn-secondary btn-sm"
          title="So sánh kênh này với kênh đối thủ khác"
        >
          <AppIcon name="bar-chart-2" size="14" />
          <span>So Sánh</span>
        </router-link>

        <router-link
          :to="'/video-moi-dang?channel=' + channel.id"
          class="btn btn-secondary btn-sm"
          title="Xem video mới đăng của kênh này"
        >
          <AppIcon name="clock" size="14" />
          <span>Video Mới</span>
        </router-link>

        <router-link
          :to="'/lich-dang-doi-thu?channel=' + channel.id"
          class="btn btn-secondary btn-sm"
          title="Xem lịch đăng của kênh này"
        >
          <AppIcon name="calendar" size="14" />
          <span>Lịch Đăng</span>
        </router-link>

        <button
          type="button"
          class="btn btn-primary btn-sm btn-collector"
          :disabled="isCollecting || disabled"
          @click="$emit('trigger-collection')"
          title="Kích hoạt kiểm tra dữ liệu cho các kênh đang theo dõi"
        >
          <AppIcon name="zap" size="14" :class="{ 'spin-anim': isCollecting }" />
          <span>{{ isCollecting ? 'Đang kích hoạt...' : 'Kiểm Tra Dữ Liệu' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ChannelAnalysisHeader } from '@/types/channel-analysis';

const props = defineProps<{
  channel: ChannelAnalysisHeader;
  loading?: boolean;
  isPausingOrResuming?: boolean;
  isArchivingOrRestoring?: boolean;
  isCollecting?: boolean;
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'refresh'): void;
  (e: 'edit'): void;
  (e: 'toggle-pause'): void;
  (e: 'toggle-archive'): void;
  (e: 'trigger-collection'): void;
}>();

const avatarError = ref(false);

const statusLabel = computed(() => {
  switch (props.channel.status) {
    case 'active': return 'Đang theo dõi';
    case 'paused': return 'Tạm dừng';
    case 'archived': return 'Đã lưu trữ';
    default: return 'Đang theo dõi';
  }
});

const pauseActionLabel = computed(() =>
  props.channel.status === 'active' ? 'Tạm Dừng' : 'Tiếp Tục Theo Dõi'
);

const archiveActionLabel = computed(() =>
  props.channel.status === 'archived' ? 'Khôi Phục' : 'Lưu Trữ'
);

function formatDateOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso || '—';
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
</script>

<style scoped>
.channel-profile-hero {
  border-radius: 16px;
  padding: 24px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: 0 2px 10px rgba(30, 60, 90, 0.04);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-soft, #EEF4F8);
  padding-bottom: 14px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary, #0F172A);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.15s ease;
}

.btn-back:hover {
  color: var(--primary, #2563EB);
}

.nav-kicker-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: var(--primary-soft, #EFF6FF);
  border: 1px solid #BFDBFE;
  border-radius: 999px;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2563EB;
}

.kicker-txt {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #1E40AF;
}

.hero-main-layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 24px;
  align-items: center;
}

.identity-col {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-wrap {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--border, #E3EBF3);
  overflow: hidden;
  background: #F1F5F9;
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
  font-size: 32px;
  font-weight: 800;
  color: var(--primary, #2563EB);
}

.identity-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.name-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-channel-name {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary, #0F172A);
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-active {
  background: #DCFCE7;
  color: #15803D;
  border: 1px solid #BBF7D0;
}

.status-paused {
  background: #FEF3C7;
  color: #B45309;
  border: 1px solid #FDE68A;
}

.status-archived {
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.handle-links-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.hero-channel-handle {
  font-size: 13.5px;
  color: var(--text-secondary, #64748B);
  font-weight: 500;
}

.external-yt-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: #DC2626;
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.external-yt-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.telemetry-col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  padding: 14px 18px;
}

.telemetry-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tel-lbl {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-muted, #64748B);
  text-transform: uppercase;
}

.tel-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
}

.hero-action-deck {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 14px;
  border-top: 1px solid var(--border-soft, #EEF4F8);
}

.deck-left,
.deck-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-secondary {
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  color: var(--text-primary, #0F172A);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--primary-soft, #EFF6FF);
  border-color: #BFDBFE;
  color: var(--primary, #2563EB);
}

.btn-primary {
  background: var(--primary, #2563EB);
  border: 1px solid #1D4ED8;
  color: #FFFFFF;
}

.btn-primary:hover:not(:disabled) {
  background: #1D4ED8;
}

.btn-collector {
  background: linear-gradient(135deg, #2563EB, #0EA5E9);
  border: none;
  color: #FFFFFF;
  font-weight: 700;
}

.btn-collector:hover:not(:disabled) {
  opacity: 0.92;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .hero-main-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-action-deck {
    flex-direction: column;
    align-items: stretch;
  }
  .deck-left, .deck-right {
    width: 100%;
    justify-content: stretch;
  }
  .deck-left .btn, .deck-right .btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
