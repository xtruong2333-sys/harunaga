<template>
  <div class="growth-table-wrap surface-card">
    <div class="table-responsive">
      <table class="growth-table">
        <thead>
          <tr>
            <th class="col-video">Video</th>
            <th class="col-channel">Kênh</th>
            <th class="col-vph">Tốc độ VPH</th>
            <th class="col-views">Lượt xem</th>
            <th class="col-delta">Tăng gần nhất</th>
            <th class="col-published">Đăng lúc</th>
            <th class="col-alert">Cảnh báo</th>
            <th class="col-actions">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="v in videos"
            :key="v.id"
            class="table-row"
          >
            <!-- Video Col -->
            <td class="col-video">
              <div class="video-cell-main">
                <div class="mini-thumb-wrap">
                  <VideoThumbnail
                    :src="v.thumbnailUrl"
                    :alt="v.title"
                    ratio="16-9"
                    :show-overlay-actions="false"
                    :detail-url="'/videos/' + v.id"
                  />
                </div>
                <div class="video-cell-meta">
                  <router-link :to="'/videos/' + v.id" class="table-title-link" :title="v.title">
                    {{ v.title }}
                  </router-link>
                </div>
              </div>
            </td>

            <!-- Channel Col -->
            <td class="col-channel">
              <router-link :to="'/kenh-theo-doi/' + v.channel.id" class="table-channel-link">
                {{ v.channel.name }}
              </router-link>
            </td>

            <!-- VPH Col -->
            <td class="col-vph">
              <span class="vph-tag mono text-accent">
                {{ formatVph(v.latestMeasuredVph) }}
              </span>
            </td>

            <!-- Views Col -->
            <td class="col-views mono">
              {{ formatNumber(v.latestViewCount) }}
            </td>

            <!-- Delta Col -->
            <td class="col-delta mono" :class="{ 'text-positive': v.latestDeltaViews && v.latestDeltaViews > 0 }">
              {{ formatDelta(v.latestDeltaViews) }}
            </td>

            <!-- Published Col -->
            <td class="col-published">
              <span class="age-text">{{ formatVideoAge(v.publishedAt) }}</span>
            </td>

            <!-- Alert Col -->
            <td class="col-alert">
              <GrowthStatusBadge
                v-if="v.alert"
                type="alert"
                :alert-status="v.alert.status"
              />
              <template v-else>
                <GrowthStatusBadge
                  v-if="v.latestMeasuredVph && v.latestMeasuredVph > 0"
                  type="rising"
                  :measured-vph="v.latestMeasuredVph"
                />
                <GrowthStatusBadge
                  v-else
                  type="alert"
                  alert-status="unalerted"
                />
              </template>
            </td>

            <!-- Actions Col -->
            <td class="col-actions">
              <div class="table-action-btns">
                <button
                  type="button"
                  class="tbl-btn tbl-btn-prod"
                  :disabled="isAddingToProduction"
                  title="Đưa vào Sản Xuất"
                  @click="$emit('add-production', v)"
                >
                  <AppIcon name="clipboard-list" size="13" />
                </button>
                <router-link :to="'/tro-ly-noi-dung?video=' + v.id" class="tbl-btn" title="Phân tích AI">
                  <AppIcon name="sparkles" size="13" />
                </router-link>
                <router-link :to="'/videos/' + v.id" class="tbl-btn" title="Xem chi tiết">
                  <AppIcon name="info" size="13" />
                </router-link>
                <a
                  :href="v.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="tbl-btn tbl-btn-yt"
                  title="Mở YouTube"
                >
                  <AppIcon name="external" size="13" />
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import GrowthStatusBadge from '@/components/growth/GrowthStatusBadge.vue';
import type { VideoListItem } from '@/types/video';

defineProps<{
  videos: VideoListItem[];
  isAddingToProduction?: boolean;
}>();

defineEmits<{
  (e: 'add-production', video: VideoListItem): void;
}>();

function formatVph(vph: number | null | undefined): string {
  if (vph === null || vph === undefined) return '—';
  if (vph === 0) return '0 VPH';
  return `${formatNumber(Math.round(vph))} VPH`;
}

function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return '—';
  if (delta > 0) return `+${formatNumber(delta)}`;
  return formatNumber(delta);
}

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
.growth-table-wrap {
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(30, 60, 90, 0.04));
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.growth-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.col-video { min-width: 280px; }
.col-channel { min-width: 110px; }
.col-vph { min-width: 85px; }
.col-views { min-width: 80px; }
.col-delta { min-width: 85px; }
.col-published { min-width: 90px; }
.col-alert { min-width: 110px; }
.col-actions { min-width: 140px; }

.growth-table thead tr {
  background: var(--bg-inset, #F8FAFC);
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.growth-table th {
  padding: 11px 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
  white-space: nowrap;
}

.growth-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border, #E3EBF3);
  color: var(--text-primary);
  vertical-align: middle;
}

.growth-table tr:last-child td {
  border-bottom: none;
}

.table-row:hover {
  background: rgba(37, 99, 235, 0.02);
}

.video-cell-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-thumb-wrap {
  width: 108px;
  flex-shrink: 0;
}

.video-cell-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-title-link {
  font-weight: 650;
  color: var(--text-primary);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}

.table-title-link:hover {
  color: var(--primary, #2563EB);
}

.table-channel-link {
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
}

.table-channel-link:hover {
  color: var(--primary, #2563EB);
}

.age-text {
  color: var(--text-secondary);
  white-space: nowrap;
  font-size: 12px;
}

.vph-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  background: #EFF6FF;
}

[data-theme="dark"] .vph-tag {
  background: rgba(37, 99, 235, 0.15);
}

.table-action-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tbl-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-secondary);
  border: 1px solid var(--border, #E3EBF3);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tbl-btn:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.tbl-btn-prod:hover {
  background: #2563EB;
  color: #FFFFFF;
}

.tbl-btn-yt:hover {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}

.text-accent { color: #0284C7; }
.text-positive { color: #059669; }
</style>
