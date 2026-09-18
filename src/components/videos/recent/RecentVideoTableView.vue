<template>
  <div class="recent-video-table-wrap surface-card">
    <div class="table-responsive">
      <table class="video-table">
        <thead>
          <tr>
            <th class="col-video">Video</th>
            <th class="col-channel">Kênh</th>
            <th class="col-time">Đăng lúc</th>
            <th class="col-views">Lượt xem</th>
            <th class="col-vph">Tốc độ VPH</th>
            <th class="col-delta">Tăng gần nhất</th>
            <th class="col-actions">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="v in videos"
            :key="v.id"
            class="table-row"
            :class="{ 'is-rising': v.latestMeasuredVph !== null && v.latestMeasuredVph > 0 }"
          >
            <!-- Video Column: Mini Thumbnail + Title -->
            <td class="col-video">
              <div class="video-cell-main">
                <div class="mini-thumb-wrap">
                  <router-link :to="'/videos/' + v.id" class="mini-thumb-link">
                    <img
                      v-if="v.thumbnailUrl"
                      :src="v.thumbnailUrl"
                      :alt="v.title"
                      class="mini-thumb-img"
                      loading="lazy"
                    />
                    <div v-else class="mini-thumb-placeholder">
                      <AppIcon name="video" size="14" />
                    </div>
                  </router-link>
                </div>
                <div class="video-cell-meta">
                  <router-link :to="'/videos/' + v.id" class="table-title-link" :title="v.title">
                    {{ v.title }}
                  </router-link>
                  <span v-if="getFreshBadge(v.publishedAt)" class="mini-fresh-badge">
                    {{ getFreshBadge(v.publishedAt) }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Channel Column -->
            <td class="col-channel">
              <router-link :to="'/kenh-theo-doi/' + v.channelId" class="table-channel-link">
                {{ v.channelName }}
              </router-link>
            </td>

            <!-- Time Column -->
            <td class="col-time">
              <span class="time-text" :title="v.publishedAt">{{ formatVideoAge(v.publishedAt) }}</span>
            </td>

            <!-- Views Column -->
            <td class="col-views mono">
              {{ v.latestViewCount !== null && v.latestViewCount !== undefined ? formatNumber(v.latestViewCount) : '—' }}
            </td>

            <!-- VPH Column -->
            <td class="col-vph">
              <span
                class="vph-tag mono"
                :class="{ 'tag-active': v.latestMeasuredVph !== null && v.latestMeasuredVph > 0 }"
                :title="'Số lượt xem tăng trung bình mỗi giờ giữa hai lần hệ thống đo gần nhất.'"
              >
                {{ v.latestMeasuredVph !== null && v.latestMeasuredVph !== undefined ? (v.latestMeasuredVph === 0 ? '0 VPH' : `${formatNumber(Math.round(v.latestMeasuredVph))} VPH`) : '—' }}
              </span>
            </td>

            <!-- Delta Column -->
            <td class="col-delta mono" :class="{ 'text-positive': v.latestViewDelta !== null && v.latestViewDelta > 0 }">
              {{ formatViewDelta(v.latestViewDelta) }}
            </td>

            <!-- Actions Column -->
            <td class="col-actions">
              <div class="table-action-btns">
                <router-link :to="'/videos/' + v.id" class="tbl-btn" title="Xem chi tiết">
                  <AppIcon name="info" size="13" />
                </router-link>
                <a
                  :href="`https://www.youtube.com/watch?v=${v.youtubeVideoId}`"
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
import { formatVideoAge, getFreshBadge, formatViewDelta } from '@/services/new-videos-service';
import type { NewVideoItem } from '@/types/new-videos';

defineProps<{
  videos: NewVideoItem[];
}>();

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString('vi-VN');
}
</script>

<style scoped>
.recent-video-table-wrap {
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

.video-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.video-table thead tr {
  background: var(--bg-inset, #F8FAFC);
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.video-table th {
  padding: 11px 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
  white-space: nowrap;
}

.video-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border, #E3EBF3);
  color: var(--text-primary);
  vertical-align: middle;
}

.video-table tr:last-child td {
  border-bottom: none;
}

.table-row:hover {
  background: rgba(37, 99, 235, 0.02);
}

[data-theme="dark"] .table-row:hover {
  background: rgba(56, 189, 248, 0.03);
}

.video-cell-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
}

.mini-thumb-wrap {
  width: 100px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-inset, #EEF4F8);
  flex-shrink: 0;
}

.mini-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mini-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-muted);
}

.video-cell-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-title-link {
  font-weight: 600;
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

.mini-fresh-badge {
  display: inline-block;
  align-self: flex-start;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  background: #059669;
  color: #FFFFFF;
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

.time-text {
  color: var(--text-secondary);
  white-space: nowrap;
}

.vph-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  background: var(--bg-inset, #F1F5F9);
  color: var(--text-secondary);
  white-space: nowrap;
}

.vph-tag.tag-active {
  background: #EFF6FF;
  color: #0284C7;
}

[data-theme="dark"] .vph-tag.tag-active {
  background: rgba(37, 99, 235, 0.15);
  color: #38BDF8;
}

.text-positive {
  color: #16A34A;
}

[data-theme="dark"] .text-positive {
  color: #4ADE80;
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
  transition: all 0.15s ease;
}

.tbl-btn:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.tbl-btn-yt:hover {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}
</style>
