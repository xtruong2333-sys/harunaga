<template>
  <div class="overview-opportunity-feed section-container">
    <div class="section-header">
      <div class="section-title-wrap">
        <div class="section-kicker">TỐC ĐỘ TĂNG CAO NHẤT</div>
        <h2 class="section-title">Video Đáng Chú Ý</h2>
      </div>

      <div class="section-actions">
        <router-link to="/video-tiem-nang" class="section-link section-link-subtle">
          <AppIcon name="zap" size="14" />
          <span>Xem Video Tiềm Năng</span>
        </router-link>
        <router-link to="/videos" class="section-link">
          <span>Xem tất cả video</span>
          <AppIcon name="arrow-right" size="14" />
        </router-link>
      </div>
    </div>

    <div v-if="!videos || videos.length === 0" class="feed-empty">
      Chưa có video nào ghi nhận tốc độ tăng trưởng VPH.
    </div>

    <div v-else class="feed-grid">
      <!-- 1. Featured Spotlight Video #1 -->
      <div v-if="featuredVideo" class="featured-card">
        <div class="featured-thumb-box">
          <router-link :to="'/videos/' + featuredVideo.id" class="thumb-link">
            <img
              v-if="featuredVideo.thumbnailUrl"
              :src="featuredVideo.thumbnailUrl"
              :alt="featuredVideo.title"
              class="featured-thumb"
              loading="lazy"
              @error="handleImgError"
            />
            <div v-else class="thumb-fallback">
              <AppIcon name="video" size="32" />
            </div>
          </router-link>

          <span
            class="video-badge"
            :class="featuredVideo.isOverThreshold ? 'badge-threshold' : 'badge-rising'"
          >
            {{ featuredVideo.isOverThreshold ? 'VƯỢT NGƯỠNG' : 'ĐANG TĂNG' }}
          </span>

          <span class="rank-tag">#1 ĐỘT PHÁ</span>
        </div>

        <div class="featured-details">
          <div class="video-channel-row">
            <div class="channel-avatar-box">
              <img
                v-if="featuredVideo.channelAvatarUrl"
                :src="featuredVideo.channelAvatarUrl"
                :alt="featuredVideo.channelName"
                class="ch-avatar"
                @error="handleImgError"
              />
              <div v-else class="ch-avatar-fallback">
                {{ (featuredVideo.channelName || 'C').charAt(0).toUpperCase() }}
              </div>
            </div>
            <span class="channel-name">{{ featuredVideo.channelName }}</span>
            <span class="dot-sep">•</span>
            <span class="pub-time">{{ formatRelativeTime(featuredVideo.publishedAt) }}</span>
          </div>

          <router-link :to="'/videos/' + featuredVideo.id" class="video-title" :title="featuredVideo.title">
            {{ featuredVideo.title }}
          </router-link>

          <!-- Metric Row -->
          <div class="featured-metrics-row">
            <div class="metric-block">
              <div class="m-lbl">VPH ĐO ĐƯỢC</div>
              <div class="m-val mono text-accent">
                {{ formatVph(featuredVideo.latestMeasuredVph) }}
              </div>
            </div>

            <div class="metric-block">
              <div class="m-lbl">LƯỢT XEM</div>
              <div class="m-val mono">
                {{ formatNumber(featuredVideo.latestViewCount) }}
              </div>
            </div>

            <div class="metric-block">
              <div class="m-lbl">TĂNG LẦN ĐO</div>
              <div class="m-val mono text-positive">
                {{ formatDelta(featuredVideo.latestDeltaViews) }}
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="featured-actions-row">
            <router-link :to="'/videos/' + featuredVideo.id" class="btn btn-primary btn-sm">
              <AppIcon name="bar-chart-2" size="14" />
              <span>Xem Phân Tích</span>
            </router-link>
            <router-link :to="'/tro-ly-noi-dung?video=' + featuredVideo.id" class="btn btn-secondary btn-sm">
              <AppIcon name="sparkles" size="14" />
              <span>Trợ Lý AI</span>
            </router-link>
            <a
              :href="featuredVideo.url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-youtube"
              title="Xem video trên YouTube"
              aria-label="Xem video trên YouTube"
            >
              <AppIcon name="external" size="14" />
            </a>
          </div>
        </div>
      </div>

      <!-- 2. Secondary Grid (#2 to #5) -->
      <div class="secondary-grid">
        <div
          v-for="(v, idx) in secondaryVideos"
          :key="v.id"
          class="secondary-card"
        >
          <div class="secondary-thumb-box">
            <router-link :to="'/videos/' + v.id" class="sec-thumb-link">
              <img
                v-if="v.thumbnailUrl"
                :src="v.thumbnailUrl"
                :alt="v.title"
                class="sec-thumb"
                loading="lazy"
                @error="handleImgError"
              />
              <div v-else class="thumb-fallback">
                <AppIcon name="video" size="20" />
              </div>
            </router-link>
            <span class="sec-rank-badge">#{{ idx + 2 }}</span>
          </div>

          <div class="secondary-info">
            <router-link :to="'/videos/' + v.id" class="sec-title" :title="v.title">
              {{ v.title }}
            </router-link>

            <div class="sec-meta-line">
              <span class="sec-channel">{{ v.channelName }}</span>
              <span class="dot-sep">•</span>
              <span class="sec-time">{{ formatRelativeTime(v.publishedAt) }}</span>
            </div>

            <div class="sec-metrics-line">
              <div class="sec-vph mono text-accent">
                {{ formatVph(v.latestMeasuredVph) }}
              </div>
              <span v-if="v.latestDeltaViews" class="sec-delta mono text-positive">
                {{ formatDelta(v.latestDeltaViews) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DashboardTopVideo } from '@/types/dashboard';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  videos: DashboardTopVideo[];
}>();

const featuredVideo = computed(() => (props.videos && props.videos.length > 0 ? props.videos[0] : null));
const secondaryVideos = computed(() => (props.videos && props.videos.length > 1 ? props.videos.slice(1, 5) : []));

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}

function formatNumber(num: number): string {
  if (!num) return '0';
  return num.toLocaleString('vi-VN');
}

function formatVph(vph: number | null): string {
  if (vph === null || vph === undefined) return '—';
  return `${Math.round(vph).toLocaleString('vi-VN')} VPH`;
}

function formatDelta(delta: number | null): string {
  if (delta === null || delta === undefined) return '—';
  if (delta > 0) return `+${delta.toLocaleString('vi-VN')}`;
  return delta.toLocaleString('vi-VN');
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
.overview-opportunity-feed {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-kicker {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--primary, #2563EB);
  text-transform: uppercase;
}

[data-theme="dark"] .section-kicker {
  color: #38BDF8;
}

.section-title {
  font-size: 18px;
  font-weight: 750;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--primary, #2563EB);
  text-decoration: none;
}

[data-theme="dark"] .section-link {
  color: #38BDF8;
}

.section-link-subtle {
  color: var(--text-secondary);
  font-weight: 500;
}

.section-link-subtle:hover {
  color: var(--primary, #2563EB);
}

.feed-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

/* Feed Grid: 1 Featured on Left, 4 Secondary on Right */
.feed-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 20px;
}

/* Featured Card */
.featured-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  padding: 16px;
  box-shadow: var(--shadow-sm, 0 4px 14px rgba(30, 60, 90, 0.05));
  transition: all 0.2s ease;
}

.featured-card:hover {
  border-color: #BFDBFE;
  box-shadow: var(--shadow-md, 0 10px 30px rgba(30, 60, 90, 0.08));
}

.featured-thumb-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-inset, #EEF4F8);
}

.thumb-link {
  display: block;
  width: 100%;
  height: 100%;
}

.featured-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.featured-card:hover .featured-thumb {
  transform: scale(1.03);
}

.video-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-threshold {
  background: #FEF3C7;
  color: #B45309;
  border: 1px solid #FDE68A;
}

.badge-rising {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
}

.rank-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(15, 31, 53, 0.82);
  color: #FFFFFF;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.featured-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-channel-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.channel-avatar-box {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-inset);
  flex-shrink: 0;
}

.ch-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ch-avatar-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  background: #E2E8F0;
  color: #475569;
}

.channel-name {
  font-weight: 600;
  color: var(--text-primary);
}

.dot-sep {
  color: var(--text-muted);
}

.pub-time {
  color: var(--text-muted);
}

.video-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-title:hover {
  color: var(--primary, #2563EB);
}

.featured-metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  background: var(--bg-page-secondary, #F1F5F9);
  padding: 10px 14px;
  border-radius: 10px;
}

[data-theme="dark"] .featured-metrics-row {
  background: rgba(8, 14, 24, 0.65);
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-lbl {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.m-val {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
}

.text-accent {
  color: var(--primary, #2563EB);
}

[data-theme="dark"] .text-accent {
  color: #38BDF8;
}

.text-positive {
  color: #059669;
}

[data-theme="dark"] .text-positive {
  color: #34D399;
}

.featured-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.btn-youtube {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--surface, #FFFFFF);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-youtube:hover {
  color: #EF4444;
  border-color: #FECACA;
  background: #FEF2F2;
}

/* Secondary Grid */
.secondary-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.secondary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
  transition: all 0.15s ease;
}

.secondary-card:hover {
  border-color: #BFDBFE;
  background: var(--surface-hover, #F3F7FB);
  transform: translateY(-1px);
}

.secondary-thumb-box {
  position: relative;
  width: 100px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-inset);
  flex-shrink: 0;
}

.sec-thumb-link {
  display: block;
  width: 100%;
  height: 100%;
}

.sec-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sec-rank-badge {
  position: absolute;
  top: 3px;
  left: 3px;
  background: rgba(15, 31, 53, 0.78);
  color: #FFFFFF;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
}

.secondary-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.sec-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.35;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sec-title:hover {
  color: var(--primary, #2563EB);
}

.sec-meta-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.sec-channel {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sec-time {
  color: var(--text-muted);
  white-space: nowrap;
}

.sec-metrics-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}

.sec-vph {
  font-size: 12px;
  font-weight: 700;
}

.sec-delta {
  font-size: 11px;
}

@media (max-width: 900px) {
  .feed-grid {
    grid-template-columns: 1fr;
  }
}
</style>
