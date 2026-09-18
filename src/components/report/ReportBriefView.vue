<template>
  <div class="brief-view-container">
    <!-- 1. Executive Briefing Card -->
    <section class="briefing-card" aria-label="Bản tin tổng quan">
      <div class="briefing-header">
        <div class="briefing-badge">
          <AppIcon name="file-text" :size="13" />
          <span>TỔNG KẾT NHANH ĐIỀU HÀNH</span>
        </div>
        <span class="briefing-timestamp">Múi giờ Việt Nam (UTC+7)</span>
      </div>
      <p class="briefing-text">
        Trong <strong>{{ range === '24h' ? '24 giờ qua' : '7 ngày qua' }}</strong>, hệ thống đã ghi nhận
        <strong>{{ summary.newVideosCount }} video mới</strong> từ
        <strong>{{ summary.channelsWithNewVideosCount }} kênh đối thủ</strong> đang theo dõi.
        Hiện có <strong>{{ summary.risingNewVideosCount }} video</strong> ghi nhận tốc độ tăng trưởng đo được (VPH &gt; 0)<span v-if="summary.maxCurrentVph !== null">, với mức đỉnh đạt <strong>{{ formatVph(summary.maxCurrentVph) }}</strong></span>.
        Trong kỳ đã phát sinh <strong>{{ summary.alertsCount }} cảnh báo</strong> VPH và ghi nhận
        <strong>{{ scanSummary.totalScans }} phiên quét</strong> (thu thập {{ formatNumber(summary.snapshotsCount) }} snapshot)<span v-if="summary.attentionScansCount > 0">, ghi nhận <strong class="text-rose">{{ summary.attentionScansCount }} lần quét cần chú ý</strong></span>.
      </p>
    </section>

    <!-- 2. Dual Grid: Top Rising Signals & Recent Publishing -->
    <div class="dual-columns">
      <!-- Top Rising Signals Preview -->
      <section class="sub-section" aria-labelledby="top-rising-title">
        <div class="sub-header">
          <div class="sub-title-wrap">
            <h3 id="top-rising-title" class="sub-title">Top Video Đang Tăng</h3>
            <span class="sub-caption">Video mới có VPH cao nhất</span>
          </div>
          <button
            type="button"
            class="see-more-link"
            @click="$emit('change-view', 'videos')"
          >
            Xem Top 10 →
          </button>
        </div>

        <div v-if="risingVideos.length === 0" class="empty-mini-box">
          <AppIcon name="trending-up" :size="20" />
          <span>Không có video mới nào có VPH &gt; 0 trong kỳ</span>
        </div>

        <div v-else class="compact-video-list">
          <article
            v-for="v in risingVideos.slice(0, 5)"
            :key="v.id"
            class="compact-video-item"
          >
            <div class="compact-thumb-wrap">
              <VideoThumbnail
                :src="v.thumbnailUrl"
                :alt="v.title"
                ratio="16-9"
                :detail-url="`/videos/${v.id}`"
                :youtube-video-id="v.youtubeVideoId || undefined"
                :show-overlay-actions="false"
              />
            </div>
            <div class="compact-info">
              <div class="compact-channel">
                <router-link :to="`/kenh-theo-doi/${v.channelId}`" class="channel-link">
                  {{ v.channelName }}
                </router-link>
              </div>
              <router-link :to="`/videos/${v.id}`" class="compact-title" :title="v.title">
                {{ v.title }}
              </router-link>
              <div class="compact-meta">
                <span class="vph-highlight font-mono">{{ formatVph(v.latestMeasuredVph) }}</span>
                <span class="meta-dot">•</span>
                <span>{{ formatRelativeTime(v.publishedAt) }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Recent Publishing Preview -->
      <section class="sub-section" aria-labelledby="top-recent-title">
        <div class="sub-header">
          <div class="sub-title-wrap">
            <h3 id="top-recent-title" class="sub-title">Video Mới Xuất Bản</h3>
            <span class="sub-caption">Hoạt động đăng tải gần nhất</span>
          </div>
          <button
            type="button"
            class="see-more-link"
            @click="$emit('change-view', 'videos')"
          >
            Xem danh sách →
          </button>
        </div>

        <div v-if="newVideos.length === 0" class="empty-mini-box">
          <AppIcon name="video" :size="20" />
          <span>Chưa có video mới nào trong kỳ</span>
        </div>

        <div v-else class="compact-video-list">
          <article
            v-for="v in newVideos.slice(0, 5)"
            :key="v.id"
            class="compact-video-item"
          >
            <div class="compact-thumb-wrap">
              <VideoThumbnail
                :src="v.thumbnailUrl"
                :alt="v.title"
                ratio="16-9"
                :detail-url="`/videos/${v.id}`"
                :youtube-video-id="v.youtubeVideoId || undefined"
                :show-overlay-actions="false"
              />
            </div>
            <div class="compact-info">
              <div class="compact-channel">
                <router-link :to="`/kenh-theo-doi/${v.channelId}`" class="channel-link">
                  {{ v.channelName }}
                </router-link>
              </div>
              <router-link :to="`/videos/${v.id}`" class="compact-title" :title="v.title">
                {{ v.title }}
              </router-link>
              <div class="compact-meta">
                <span>{{ formatRelativeTime(v.publishedAt) }}</span>
                <span class="meta-dot">•</span>
                <span>{{ formatNullableNumber(v.latestViewCount) }} lượt xem</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- 3. Dual Grid: Top Active Channels & Operations Snapshot -->
    <div class="dual-columns">
      <!-- Active Channels Preview -->
      <section class="sub-section" aria-labelledby="top-channels-title">
        <div class="sub-header">
          <div class="sub-title-wrap">
            <h3 id="top-channels-title" class="sub-title">Kênh Hoạt Động Nhiều Nhất</h3>
            <span class="sub-caption">Kênh đối thủ có nhiều video mới</span>
          </div>
          <button
            type="button"
            class="see-more-link"
            @click="$emit('change-view', 'channels')"
          >
            Xem danh sách kênh →
          </button>
        </div>

        <div v-if="channelActivities.length === 0" class="empty-mini-box">
          <AppIcon name="tv" :size="20" />
          <span>Chưa có kênh nào đăng video trong kỳ</span>
        </div>

        <div v-else class="compact-channels-list">
          <div
            v-for="ch in channelActivities.slice(0, 4)"
            :key="ch.channelId"
            class="compact-channel-row"
          >
            <div class="ch-left">
              <img
                v-if="ch.channelAvatarUrl && !avatarErrors[ch.channelId]"
                :src="ch.channelAvatarUrl"
                :alt="ch.channelName"
                class="ch-avatar"
                loading="lazy"
                @error="handleAvatarError(ch.channelId)"
              />
              <div v-else class="ch-avatar-fallback">{{ ch.channelName.slice(0, 1) }}</div>
              <div class="ch-text">
                <router-link :to="`/kenh-theo-doi/${ch.channelId}`" class="ch-name">
                  {{ ch.channelName }}
                </router-link>
                <div class="ch-latest" :title="ch.latestVideoTitle">
                  Mới nhất: {{ ch.latestVideoTitle }}
                </div>
              </div>
            </div>
            <div class="ch-right">
              <span class="ch-count-badge">{{ ch.newVideosCount }} video</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Operations Status Snapshot -->
      <section class="sub-section" aria-labelledby="ops-summary-title">
        <div class="sub-header">
          <div class="sub-title-wrap">
            <h3 id="ops-summary-title" class="sub-title">Trạng Thái Vận Hành & Thu Thập</h3>
            <span class="sub-caption">Tổng hợp cảnh báo & quét bot</span>
          </div>
          <button
            type="button"
            class="see-more-link"
            @click="$emit('change-view', 'operations')"
          >
            Chi tiết vận hành →
          </button>
        </div>

        <div class="ops-preview-grid">
          <div class="ops-card">
            <div class="ops-card-header">
              <span class="ops-card-title">Cảnh báo VPH</span>
              <span class="ops-card-badge">{{ summary.alertsCount }} phát sinh</span>
            </div>
            <p v-if="summary.alertsCount === 0" class="ops-card-desc">
              Không có video nào vượt ngưỡng cảnh báo trong kỳ.
            </p>
            <div v-else class="ops-mini-list">
              <div
                v-for="alt in recentAlerts.slice(0, 3)"
                :key="alt.id"
                class="ops-alert-item"
              >
                <span class="ops-dot" :class="`is-${alt.status}`"></span>
                <span class="ops-alert-title" :title="alt.videoTitle">{{ alt.videoTitle }}</span>
                <span class="ops-alert-vph font-mono">{{ formatVph(alt.measuredVph) }}</span>
              </div>
            </div>
          </div>

          <div class="ops-card">
            <div class="ops-card-header">
              <span class="ops-card-title">Phiên quét & Dữ liệu</span>
              <span class="ops-card-badge" :class="{ 'is-attention': scanSummary.partialScans + scanSummary.failedScans > 0 }">
                {{ scanSummary.totalScans }} phiên
              </span>
            </div>
            <div class="scan-breakdown">
              <div class="sb-item">
                <span class="sb-label">Thành công:</span>
                <strong class="text-emerald">{{ scanSummary.successScans }}</strong>
              </div>
              <div class="sb-item">
                <span class="sb-label">Một phần:</span>
                <strong :class="scanSummary.partialScans > 0 ? 'text-amber' : 'text-muted'">{{ scanSummary.partialScans }}</strong>
              </div>
              <div class="sb-item">
                <span class="sb-label">Thất bại:</span>
                <strong :class="scanSummary.failedScans > 0 ? 'text-rose' : 'text-muted'">{{ scanSummary.failedScans }}</strong>
              </div>
              <div class="sb-item">
                <span class="sb-label">Snapshots:</span>
                <strong>{{ formatNumber(scanSummary.totalSnapshots) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import type {
  ReportSummary,
  ReportScanSummary,
  ReportVideo,
  ReportChannelActivity,
  ReportAlert,
  ReportScan,
  ReportRange,
  ReportViewMode,
} from '@/types/report';
import {
  formatVph,
  formatNumber,
  formatNullableNumber,
  formatRelativeTime,
} from '@/services/report-service';

defineProps<{
  summary: ReportSummary;
  scanSummary: ReportScanSummary;
  risingVideos: ReportVideo[];
  newVideos: ReportVideo[];
  channelActivities: ReportChannelActivity[];
  recentAlerts: ReportAlert[];
  recentScans: ReportScan[];
  range: ReportRange;
}>();

defineEmits<{
  (e: 'change-view', mode: ReportViewMode): void;
}>();

const avatarErrors = ref<Record<string, boolean>>({});

function handleAvatarError(channelId: string) {
  avatarErrors.value[channelId] = true;
}
</script>

<style scoped>
.brief-view-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* 1. Briefing Card */
.briefing-card {
  padding: 18px 22px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-left: 4px solid #2563eb;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .briefing-card {
  background: rgba(15, 23, 42, 0.7);
  border-color: rgba(51, 65, 85, 0.7);
  border-left-color: #38bdf8;
}

.briefing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.briefing-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #2563eb;
  text-transform: uppercase;
}

[data-theme="dark"] .briefing-badge {
  color: #38bdf8;
}

.briefing-timestamp {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
}

.briefing-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary, #1e293b);
  margin: 0;
}

[data-theme="dark"] .briefing-text {
  color: #e2e8f0;
}

.text-rose {
  color: #e11d48;
}

/* Dual Column Layout */
.dual-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.sub-section {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
}

[data-theme="dark"] .sub-section {
  background: rgba(15, 23, 42, 0.7);
  border-color: rgba(51, 65, 85, 0.7);
}

.sub-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.sub-title-wrap {
  display: flex;
  flex-direction: column;
}

.sub-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0 0 2px;
}

.sub-caption {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
}

.see-more-link {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.see-more-link:hover {
  text-decoration: underline;
}

[data-theme="dark"] .see-more-link {
  color: #38bdf8;
}

.empty-mini-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 16px;
  border: 1px dashed var(--border, #cbd5e1);
  border-radius: 8px;
  color: var(--text-muted, #94a3b8);
  font-size: 12.5px;
}

[data-theme="dark"] .empty-mini-box {
  border-color: rgba(51, 65, 85, 0.6);
}

/* Compact Video List */
.compact-video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compact-video-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.compact-thumb-wrap {
  width: 100px;
  flex-shrink: 0;
}

.compact-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.compact-channel {
  font-size: 11px;
  margin-bottom: 2px;
}

.channel-link {
  color: var(--text-secondary, #64748b);
  text-decoration: none;
  font-weight: 500;
}

.channel-link:hover {
  color: #2563eb;
}

.compact-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}

.compact-title:hover {
  color: #2563eb;
}

[data-theme="dark"] .compact-title:hover {
  color: #38bdf8;
}

.compact-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
}

.vph-highlight {
  color: #059669;
  font-weight: 700;
}

[data-theme="dark"] .vph-highlight {
  color: #34d399;
}

.meta-dot {
  opacity: 0.4;
}

/* Compact Channels List */
.compact-channels-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compact-channel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  background: var(--bg-inset, #f8fafc);
  border-radius: 8px;
}

[data-theme="dark"] .compact-channel-row {
  background: rgba(15, 23, 42, 0.5);
}

.ch-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ch-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.ch-avatar-fallback {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 11.5px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.ch-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ch-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  text-decoration: none;
}

.ch-name:hover {
  color: #2563eb;
}

.ch-latest {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}

.ch-count-badge {
  display: inline-flex;
  padding: 3px 8px;
  font-size: 11.5px;
  font-weight: 700;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  white-space: nowrap;
}

[data-theme="dark"] .ch-count-badge {
  background: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
}

/* Operations Preview Grid */
.ops-preview-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ops-card {
  padding: 12px 14px;
  background: var(--bg-inset, #f8fafc);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

[data-theme="dark"] .ops-card {
  background: rgba(15, 23, 42, 0.5);
}

.ops-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ops-card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}

.ops-card-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 4px;
  color: var(--text-secondary, #64748b);
}

.ops-card-badge.is-attention {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #dc2626;
}

.ops-card-desc {
  font-size: 11.5px;
  color: var(--text-muted, #94a3b8);
  margin: 0;
}

.ops-mini-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ops-alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
}

.ops-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ops-dot.is-sent {
  background: #16a34a;
}
.ops-dot.is-pending {
  background: #d97706;
}
.ops-dot.is-sending {
  background: #2563eb;
}
.ops-dot.is-failed {
  background: #dc2626;
}

.ops-alert-title {
  color: var(--text-primary, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.ops-alert-vph {
  color: #059669;
  font-weight: 600;
}

.scan-breakdown {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  font-size: 11.5px;
}

.sb-item {
  display: flex;
  flex-direction: column;
}

.sb-label {
  font-size: 10.5px;
  color: var(--text-muted, #94a3b8);
}

.text-emerald {
  color: #059669;
}
.text-amber {
  color: #d97706;
}
.text-rose {
  color: #dc2626;
}
.text-muted {
  color: var(--text-muted, #94a3b8);
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

@media (max-width: 900px) {
  .dual-columns {
    grid-template-columns: 1fr;
  }
}
</style>
