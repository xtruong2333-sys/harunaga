<template>
  <div class="card-section video-freshness-section">
    <div class="section-header">
      <div>
        <div class="title-with-count">
          <h2 class="section-title">Video Cần Cập Nhật Snapshot</h2>
          <span class="attention-pill">
            {{ displayPillText }}
          </span>
        </div>
        <p class="section-subtitle">
          Danh sách tối đa 20 video chưa có snapshot hoặc có snapshot cập nhật hơn 2 giờ trước.
        </p>
      </div>
    </div>

    <!-- Desktop Table -->
    <div v-if="staleVideos.length > 0" class="table-container desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th class="th-video">Video</th>
            <th>Kênh Đối Thủ</th>
            <th>Snapshot Cuối</th>
            <th>Tình Trạng</th>
            <th>Lượt Xem</th>
            <th>VPH Đo Được</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="video in staleVideos" :key="video.id">
            <td class="td-video">
              <div class="video-row-cell">
                <div class="video-thumb-slot">
                  <VideoThumbnail
                    :src="video.thumbnailUrl"
                    :youtube-video-id="video.youtubeVideoId || undefined"
                    :detail-url="`/videos/${video.id}`"
                    :alt="video.title"
                    ratio="16-9"
                  />
                </div>
                <div class="video-info-slot">
                  <router-link :to="`/videos/${video.id}`" class="video-title-link" :title="video.title">
                    {{ video.title }}
                  </router-link>
                  <span class="video-channel-name">{{ video.channelName }}</span>
                </div>
              </div>
            </td>
            <td class="cell-nowrap font-medium">{{ video.channelName }}</td>
            <td class="cell-nowrap">
              <div class="scan-time-main">{{ video.relativeSnapshotTime }}</div>
              <div v-if="video.latestSnapshotAt" class="scan-time-sub mono">
                {{ formatDateTime(video.latestSnapshotAt) }}
              </div>
            </td>
            <td>
              <span class="badge-freshness" :class="`freshness-${video.freshnessCategory}`">
                {{ video.freshnessLabel }}
              </span>
            </td>
            <td class="mono cell-nowrap">
              {{ video.latestViewCount !== null ? formatNumber(video.latestViewCount) : '—' }}
            </td>
            <td class="mono cell-nowrap">
              <span v-if="video.latestMeasuredVph !== null" class="font-bold">
                {{ formatNumber(video.latestMeasuredVph) }} VPH
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <router-link :to="`/videos/${video.id}`" class="table-action-link">
                Chi tiết
                <AppIcon name="external" size="13" />
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div v-if="staleVideos.length > 0" class="mobile-cards-list mobile-only">
      <div v-for="video in staleVideos" :key="video.id" class="mobile-item-card">
        <div class="card-thumb-banner">
          <VideoThumbnail
            :src="video.thumbnailUrl"
            :youtube-video-id="video.youtubeVideoId || undefined"
            :detail-url="`/videos/${video.id}`"
            :alt="video.title"
            ratio="16-9"
          />
        </div>

        <div class="card-video-header">
          <router-link :to="`/videos/${video.id}`" class="video-title-link" :title="video.title">
            {{ video.title }}
          </router-link>
          <span class="video-channel-name">{{ video.channelName }}</span>
        </div>

        <div class="card-metrics-grid">
          <div class="metric-block">
            <span class="metric-label">Snapshot cuối</span>
            <span class="metric-val">{{ video.relativeSnapshotTime }}</span>
          </div>
          <div class="metric-block">
            <span class="metric-label">Tình trạng</span>
            <span class="badge-freshness inline-badge" :class="`freshness-${video.freshnessCategory}`">
              {{ video.freshnessLabel }}
            </span>
          </div>
          <div class="metric-block">
            <span class="metric-label">Lượt xem</span>
            <span class="metric-val mono">
              {{ video.latestViewCount !== null ? formatNumber(video.latestViewCount) : '—' }}
            </span>
          </div>
          <div class="metric-block">
            <span class="metric-label">VPH hiện tại</span>
            <span class="metric-val mono">
              {{ video.latestMeasuredVph !== null ? `${formatNumber(video.latestMeasuredVph)} VPH` : '—' }}
            </span>
          </div>
        </div>

        <div class="card-action-row">
          <router-link :to="`/videos/${video.id}`" class="table-action-link">
            Xem phân tích video
            <AppIcon name="external" size="13" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Factual Empty State -->
    <div v-else class="empty-placeholder">
      <AppIcon name="shield-check" size="24" class="text-success" />
      <p class="empty-text">{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import { formatNumber, formatDateTime } from '@/services/data-health-service';
import type { VideoFreshness } from '@/types/data-health';

const props = defineProps<{
  staleVideos: VideoFreshness[];
  staleVideosCount: number;
  activeVideosCount: number;
}>();

const displayPillText = computed(() => {
  if (props.staleVideosCount > 20) {
    return `Đang hiển thị 20 / ${props.staleVideosCount} video cần chú ý`;
  }
  return `${props.staleVideosCount} video cần chú ý`;
});

const emptyMessage = computed(() => {
  if (props.activeVideosCount === 0) {
    return 'Chưa có video thuộc các kênh đang theo dõi.';
  }
  return 'Không có video nào chưa có snapshot hoặc quá 2 giờ chưa cập nhật.';
});
</script>

<style scoped>
.card-section {
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  border-radius: var(--radius-lg, 12px);
  padding: 20px 24px;
}

[data-theme="dark"] .card-section {
  background: var(--bg-card, #1E293B);
  border-color: rgba(255, 255, 255, 0.08);
}

.section-header {
  margin-bottom: 20px;
}

.title-with-count {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary, #0F172A);
}

.attention-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #D97706;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
}

[data-theme="dark"] .attention-pill {
  color: #FBBF24;
}

.section-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

[data-theme="dark"] .section-subtitle {
  color: #94A3B8;
}

.table-container {
  overflow-x: auto;
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  border-radius: var(--radius-md, 8px);
}

[data-theme="dark"] .table-container {
  border-color: rgba(255, 255, 255, 0.08);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
  text-align: left;
}

.th-video {
  min-width: 320px;
}

.data-table th {
  padding: 10px 14px;
  background: var(--bg-inset, #F8FAFC);
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted, #64748B);
  border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
}

[data-theme="dark"] .data-table th {
  background: rgba(255, 255, 255, 0.04);
  border-bottom-color: rgba(255, 255, 255, 0.08);
  color: #94A3B8;
}

.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.04));
  color: var(--text-primary, #0F172A);
  vertical-align: middle;
}

[data-theme="dark"] .data-table td {
  border-bottom-color: rgba(255, 255, 255, 0.04);
  color: #E2E8F0;
}

.data-table tbody tr:hover {
  background: rgba(0, 0, 0, 0.015);
}

[data-theme="dark"] .data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.video-row-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.video-thumb-slot {
  width: 130px;
  min-width: 130px;
  flex-shrink: 0;
}

.video-info-slot {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.video-title-link {
  font-weight: 600;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}

.video-title-link:hover {
  color: #2563EB;
}

[data-theme="dark"] .video-title-link {
  color: #F1F5F9;
}
[data-theme="dark"] .video-title-link:hover {
  color: #60A5FA;
}

.video-channel-name {
  font-size: 0.78rem;
  color: var(--text-muted, #64748B);
}

[data-theme="dark"] .video-channel-name {
  color: #94A3B8;
}

.cell-nowrap {
  white-space: nowrap;
}

.scan-time-main {
  font-weight: 600;
  font-size: 0.84rem;
}

.scan-time-sub {
  font-size: 0.74rem;
  color: var(--text-muted, #64748B);
}

[data-theme="dark"] .scan-time-sub {
  color: #94A3B8;
}

.badge-freshness {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
}

.freshness-fresh {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}
[data-theme="dark"] .freshness-fresh { color: #34D399; }

.freshness-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #D97706;
}
[data-theme="dark"] .freshness-warning { color: #FBBF24; }

.freshness-stale {
  background: rgba(239, 68, 68, 0.15);
  color: #DC2626;
}
[data-theme="dark"] .freshness-stale { color: #F87171; }

.freshness-never {
  background: rgba(100, 116, 139, 0.15);
  color: #475569;
}
[data-theme="dark"] .freshness-never { color: #94A3B8; }

.table-action-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #2563EB;
  text-decoration: none;
  transition: color 0.15s ease;
}

.table-action-link:hover {
  color: #1D4ED8;
  text-decoration: underline;
}

[data-theme="dark"] .table-action-link {
  color: #60A5FA;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 20px;
  text-align: center;
}

.empty-text {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text-secondary, #475569);
  font-weight: 500;
}

[data-theme="dark"] .empty-text {
  color: #94A3B8;
}

/* Mobile */
.mobile-cards-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mobile-item-card {
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 14px;
}

[data-theme="dark"] .mobile-item-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.card-thumb-banner {
  width: 100%;
  margin-bottom: 10px;
}

.card-video-header {
  margin-bottom: 12px;
}

.card-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.74rem;
  color: var(--text-muted, #64748B);
  font-weight: 500;
}

[data-theme="dark"] .metric-label {
  color: #94A3B8;
}

.metric-val {
  font-size: 0.85rem;
  font-weight: 700;
}

.inline-badge {
  align-self: flex-start;
}

.card-action-row {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
}

.desktop-only { display: block; }
.mobile-only { display: none; }

@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-only { display: flex; }
}
</style>
