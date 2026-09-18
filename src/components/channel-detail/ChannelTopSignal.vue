<template>
  <div class="channel-top-signals surface-card">
    <div class="signals-header">
      <div class="header-left">
        <h3 class="signals-title">TÍN HIỆU NỔI BẬT</h3>
        <span class="signals-sub">Video có tốc độ tăng trưởng VPH cao nhất của kênh</span>
      </div>
    </div>

    <!-- Empty State: if positiveTopSignals is empty -->
    <div v-if="positiveTopSignals.length === 0" class="panel-empty">
      Chưa có video nào ghi nhận VPH lớn hơn 0.
    </div>

    <div v-else class="signals-body">
      <!-- 1. Featured Top #1 Video -->
      <div v-if="featuredVideo" class="featured-video-card">
        <div class="featured-badge-tag">
          <AppIcon name="zap" size="14" />
          <span>#1 TĂNG TRƯỞNG CAO NHẤT</span>
        </div>

        <div class="featured-layout">
          <!-- Thumbnail Frame -->
          <router-link :to="'/videos/' + featuredVideo.id" class="featured-thumb-wrap" title="Xem phân tích video">
            <VideoThumbnail
              :src="featuredVideo.thumbnailUrl"
              :alt="featuredVideo.title"
              class="featured-thumb"
            />
          </router-link>

          <!-- Content Meta -->
          <div class="featured-content">
            <div class="featured-meta-row">
              <span class="pub-age">{{ formatRelativeTime(featuredVideo.publishedAt) }}</span>
              <span v-if="featuredVideo.isOverThreshold" class="badge-threshold-mini">Vượt ngưỡng</span>
              <span v-if="featuredVideo.alertStatus" class="badge-alert-mini" :class="`alert-${featuredVideo.alertStatus}`">
                {{ formatAlertStatus(featuredVideo.alertStatus) }}
              </span>
            </div>

            <router-link :to="'/videos/' + featuredVideo.id" class="featured-title">
              {{ featuredVideo.title }}
            </router-link>

            <!-- Metrics Strip -->
            <div class="featured-metrics-strip">
              <div class="f-metric-box">
                <span class="f-lbl">LƯỢT XEM HIỆN TẠI</span>
                <span class="f-val mono">{{ formatViews(featuredVideo.latestViewCount) }}</span>
              </div>
              <div class="f-metric-box focal-metric">
                <span class="f-lbl">VPH ĐO ĐƯỢC</span>
                <span class="f-val mono text-accent">{{ formatVph(featuredVideo.latestMeasuredVph) }}</span>
              </div>
              <div class="f-metric-box">
                <span class="f-lbl">TĂNG LẦN GẦN NHẤT</span>
                <span class="f-val mono text-positive">{{ formatDelta(featuredVideo.latestDeltaViews) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="featured-actions">
              <router-link :to="'/videos/' + featuredVideo.id" class="btn btn-primary btn-sm">
                <AppIcon name="activity" size="14" />
                <span>Xem Phân Tích Video</span>
              </router-link>
              <a
                :href="featuredVideo.url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-secondary btn-sm"
                title="Mở video trên YouTube"
              >
                <span>Mở YouTube</span>
                <AppIcon name="external" size="14" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Secondary Rankings Rail / Grid (#2 to #5) -->
      <div v-if="secondaryVideos.length > 0" class="secondary-signals-block">
        <div class="secondary-kicker">VIDEO ĐANG TĂNG TIẾP THEO</div>
        <div class="secondary-ranking-list">
          <div
            v-for="(v, idx) in secondaryVideos"
            :key="v.id"
            class="v-card-item"
          >
            <div class="rank-num">#{{ idx + 2 }}</div>

            <router-link :to="'/videos/' + v.id" class="v-thumb-wrap" title="Xem chi tiết video">
              <VideoThumbnail
                :src="v.thumbnailUrl"
                :alt="v.title"
                class="v-thumb"
              />
            </router-link>

            <div class="v-details">
              <router-link :to="'/videos/' + v.id" class="v-title-text" :title="v.title">
                {{ v.title }}
              </router-link>
              <div class="v-sub-info">
                <span>{{ formatRelativeTime(v.publishedAt) }}</span>
                <span v-if="v.isOverThreshold" class="badge-threshold-mini">Vượt ngưỡng</span>
              </div>
            </div>

            <div class="v-metrics-row">
              <div class="v-metric-col">
                <div class="vm-lbl">LƯỢT XEM</div>
                <div class="vm-val mono">{{ formatViews(v.latestViewCount) }}</div>
              </div>
              <div class="v-metric-col">
                <div class="vm-lbl">VPH ĐO ĐƯỢC</div>
                <div class="vm-val mono text-accent">{{ formatVph(v.latestMeasuredVph) }}</div>
              </div>
              <div class="v-metric-col">
                <div class="vm-lbl">TĂNG GẦN NHẤT</div>
                <div class="vm-val mono text-positive">{{ formatDelta(v.latestDeltaViews) }}</div>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import type { ChannelAnalysis, ChannelVideoItem } from '@/types/channel-analysis';

const props = defineProps<{
  analysis: ChannelAnalysis;
}>();

const positiveTopSignals = computed<ChannelVideoItem[]>(() => {
  return props.analysis.topRisingVideos.filter(
    v => v.latestMeasuredVph !== null && v.latestMeasuredVph > 0
  );
});

const featuredVideo = computed(() => positiveTopSignals.value[0] || null);
const secondaryVideos = computed(() => positiveTopSignals.value.slice(1));

function formatViews(views: number | null | undefined): string {
  if (views === null || views === undefined) return '—';
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (views >= 1_000) return (views / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return views.toLocaleString('vi-VN');
}

function formatVph(vph: number | null | undefined): string {
  if (vph === null || vph === undefined) return '—';
  return `${Math.round(vph).toLocaleString('vi-VN')} VPH`;
}

function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return '—';
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${delta.toLocaleString('vi-VN')}`;
}

function formatAlertStatus(status: string): string {
  switch (status) {
    case 'sent': return 'Đã gửi';
    case 'pending': return 'Chờ gửi';
    case 'sending': return 'Đang gửi';
    case 'failed': return 'Gửi lỗi';
    default: return status;
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
.channel-top-signals {
  padding: 24px;
  border-radius: 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: 0 1px 4px rgba(30, 60, 90, 0.04);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.signals-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.signals-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary, #0F172A);
  margin: 0;
  text-transform: uppercase;
}

.signals-sub {
  font-size: 12.5px;
  color: var(--text-secondary, #64748B);
}

.panel-empty {
  padding: 36px;
  text-align: center;
  color: var(--text-muted, #64748B);
  font-size: 13.5px;
  background: var(--bg-inset, #F8FAFC);
  border-radius: 12px;
  border: 1px dashed var(--border, #E3EBF3);
}

.signals-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.featured-video-card {
  border: 1px solid #BFDBFE;
  background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.featured-badge-tag {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1E40AF;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.featured-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  align-items: center;
}

.featured-thumb-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  display: block;
}

.featured-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.featured-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pub-age {
  font-size: 12px;
  color: var(--text-muted, #64748B);
}

.badge-threshold-mini {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: #FEE2E2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.badge-alert-mini {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.alert-sent { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
.alert-pending, .alert-sending { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
.alert-failed { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }

.featured-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s ease;
}

.featured-title:hover {
  color: var(--primary, #2563EB);
}

.featured-metrics-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
}

.f-metric-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.f-lbl {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted, #64748B);
}

.f-val {
  font-size: 15px;
  font-weight: 800;
}

.featured-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.secondary-signals-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.secondary-kicker {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted, #64748B);
  text-transform: uppercase;
}

.secondary-ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.v-card-item {
  display: grid;
  grid-template-columns: 36px 140px 1.5fr 1.5fr auto;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  transition: all 0.15s ease;
}

.v-card-item:hover {
  border-color: #BFDBFE;
  background: #FFFFFF;
}

.rank-num {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-muted, #94A3B8);
  text-align: center;
}

.v-thumb-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  display: block;
}

.v-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.v-title-text {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.v-title-text:hover {
  color: var(--primary, #2563EB);
}

.v-sub-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--text-muted, #64748B);
}

.v-metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.v-metric-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vm-lbl {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--text-muted, #64748B);
}

.vm-val {
  font-size: 13px;
  font-weight: 700;
}

.v-btn-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-youtube-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--surface, #FFFFFF);
  color: #DC2626;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-youtube-icon:hover {
  border-color: #FECACA;
  background: #FEF2F2;
}

.text-accent { color: #2563EB; }
.text-positive { color: #16A34A; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.btn-primary {
  background: var(--primary, #2563EB);
  color: #FFFFFF;
  border: 1px solid #1D4ED8;
}

.btn-secondary {
  background: var(--surface, #FFFFFF);
  color: var(--text-primary, #0F172A);
  border: 1px solid var(--border, #E3EBF3);
}

@media (max-width: 1024px) {
  .featured-layout {
    grid-template-columns: 1fr;
  }
  .v-card-item {
    grid-template-columns: 28px 100px 1fr;
    grid-template-areas:
      "rank thumb details"
      "metrics metrics actions";
  }
}

@media (max-width: 640px) {
  .featured-metrics-strip {
    grid-template-columns: 1fr;
  }
  .v-metrics-row {
    grid-template-columns: 1fr;
  }
}
</style>
