<template>
  <div class="opportunity-table-wrap surface-card">
    <div class="table-responsive">
      <table class="opportunity-table">
        <thead>
          <tr>
            <th class="col-video">Video</th>
            <th class="col-channel">Kênh</th>
            <th class="col-age">Tuổi</th>
            <th class="col-views">Lượt xem</th>
            <th class="col-vph">Tốc độ VPH</th>
            <th class="col-delta">Tăng gần nhất</th>
            <th class="col-threshold">Mức ngưỡng</th>
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
                  <OpportunityStatusBadge
                    v-if="v.channel.alertVphThreshold !== null && v.channel.alertVphThreshold > 0"
                    type="threshold"
                    :is-over-threshold="v.isOverThreshold"
                  />
                </div>
              </div>
            </td>

            <!-- Channel Col -->
            <td class="col-channel">
              <router-link :to="'/kenh-theo-doi/' + v.channel.id" class="table-channel-link">
                {{ v.channel.name }}
              </router-link>
            </td>

            <!-- Age Col -->
            <td class="col-age">
              <span class="age-text">{{ v.videoAge }}</span>
            </td>

            <!-- Views Col -->
            <td class="col-views mono">
              {{ formatNumber(v.latestViewCount) }}
            </td>

            <!-- VPH Col -->
            <td class="col-vph">
              <span class="vph-tag mono text-accent">
                {{ formatVph(v.latestMeasuredVph) }}
              </span>
            </td>

            <!-- Delta Col -->
            <td class="col-delta mono" :class="{ 'text-positive': v.latestDeltaViews && v.latestDeltaViews > 0 }">
              {{ formatDelta(v.latestDeltaViews) }}
            </td>

            <!-- Threshold Col -->
            <td class="col-threshold">
              <div v-if="v.channel.alertVphThreshold !== null && v.channel.alertVphThreshold > 0" class="threshold-cell">
                <span class="mono" :class="{ 'text-positive font-bold': v.isOverThreshold }">
                  {{ v.thresholdRatio !== null ? v.thresholdRatio + '%' : '—' }}
                </span>
                <span class="threshold-sub mono">{{ formatNumber(v.channel.alertVphThreshold) }} VPH</span>
              </div>
              <div v-else class="threshold-cell">
                <span class="mono text-muted">—</span>
              </div>
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
import OpportunityStatusBadge from '@/components/opportunity/OpportunityStatusBadge.vue';
import type { OpportunityVideo } from '@/types/opportunity';

defineProps<{
  videos: OpportunityVideo[];
  isAddingToProduction?: boolean;
}>();

defineEmits<{
  (e: 'add-production', video: OpportunityVideo): void;
}>();

function formatVph(vph: number): string {
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
</script>

<style scoped>
.opportunity-table-wrap {
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

.opportunity-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.col-video { min-width: 280px; }
.col-channel { min-width: 110px; }
.col-age { min-width: 70px; }
.col-views { min-width: 80px; }
.col-vph { min-width: 85px; }
.col-delta { min-width: 85px; }
.col-threshold { min-width: 100px; }
.col-actions { min-width: 140px; }

.opportunity-table thead tr {
  background: var(--bg-inset, #F8FAFC);
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.opportunity-table th {
  padding: 11px 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
  white-space: nowrap;
}

.opportunity-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border, #E3EBF3);
  color: var(--text-primary);
  vertical-align: middle;
}

.opportunity-table tr:last-child td {
  border-bottom: none;
}

.table-row:hover {
  background: rgba(37, 99, 235, 0.02);
}

.video-cell-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
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

.threshold-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.threshold-sub {
  font-size: 10.5px;
  color: var(--text-muted);
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

.text-accent {
  color: #0284C7;
}

.text-positive {
  color: #059669;
}

.font-bold {
  font-weight: 750;
}
</style>
