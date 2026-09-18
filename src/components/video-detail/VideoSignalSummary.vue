<template>
  <div class="video-signal-summary surface-card">
    <div class="summary-header">
      <h3 class="summary-title">TÓM TẮT TÍN HIỆU</h3>
      <span class="summary-badge">{{ video.snapshots.length }} SNAPSHOTS</span>
    </div>

    <div class="fact-list">
      <div class="fact-item">
        <span class="fact-lbl">Tốc độ VPH hiện tại:</span>
        <span class="fact-val mono text-accent">{{ formattedVph }}</span>
      </div>

      <div class="fact-item">
        <span class="fact-lbl">Lượt xem gần nhất:</span>
        <span class="fact-val mono">{{ formatNumber(video.latestViewCount) }}</span>
      </div>

      <div class="fact-item">
        <span class="fact-lbl">Tăng lần quét gần nhất:</span>
        <span class="fact-val mono" :class="{ 'text-positive': latestDelta && latestDelta > 0 }">
          {{ formatDelta(latestDelta) }}
        </span>
      </div>

      <div class="fact-item">
        <span class="fact-lbl">Số lần đo snapshot:</span>
        <span class="fact-val mono">{{ video.snapshots.length }} lần</span>
      </div>

      <div class="fact-item" v-if="firstSnapshotTime">
        <span class="fact-lbl">Lần đo đầu tiên:</span>
        <span class="fact-val">{{ firstSnapshotTime }}</span>
      </div>

      <div class="fact-item" v-if="latestSnapshotTime">
        <span class="fact-lbl">Lần đo gần nhất:</span>
        <span class="fact-val">{{ latestSnapshotTime }}</span>
      </div>

      <div class="fact-item">
        <span class="fact-lbl">Ngưỡng kênh theo dõi:</span>
        <span class="fact-val mono">{{ video.channel.alertVphThreshold ? formatNumber(video.channel.alertVphThreshold) + ' VPH' : 'Chưa thiết lập' }}</span>
      </div>

      <div class="fact-item" v-if="video.channel.alertVphThreshold && video.latestMeasuredVph">
        <span class="fact-lbl">Chênh lệch so với ngưỡng:</span>
        <span
          class="fact-val mono"
          :class="thresholdDelta >= 0 ? 'text-positive' : 'text-neutral'"
        >
          {{ thresholdDelta >= 0 ? '+' : '' }}{{ formatNumber(thresholdDelta) }} VPH
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VideoDetail } from '@/types/video';

const props = defineProps<{
  video: VideoDetail;
}>();

const latestDelta = computed(() => {
  return props.video.latestSnapshot?.viewDelta ?? (props.video as any).latestDeltaViews ?? null;
});

const formattedVph = computed(() => {
  const v = props.video.latestMeasuredVph;
  if (v === null || v === undefined) return '—';
  return `${Math.round(v).toLocaleString('vi-VN')} VPH`;
});

const firstSnapshotTime = computed(() => {
  const snaps = props.video.snapshots;
  if (!snaps || snaps.length === 0) return null;
  const first = snaps[snaps.length - 1];
  return formatTime(first.checkedAt);
});

const latestSnapshotTime = computed(() => {
  const snaps = props.video.snapshots;
  if (!snaps || snaps.length === 0) return null;
  const latest = snaps[0];
  return formatTime(latest.checkedAt);
});

const thresholdDelta = computed(() => {
  const t = props.video.channel.alertVphThreshold;
  const v = props.video.latestMeasuredVph;
  if (!t || v === null || v === undefined) return 0;
  return Math.round(v - t);
});

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('vi-VN');
}

function formatDelta(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n > 0 ? `+${n.toLocaleString('vi-VN')} lượt xem` : `${n.toLocaleString('vi-VN')} lượt xem`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.video-signal-summary {
  padding: 20px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.summary-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-primary, #0F172A);
  margin: 0;
}

.summary-badge {
  padding: 3px 7px;
  border-radius: 5px;
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  font-size: 11px;
  font-weight: 700;
}

.fact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  gap: 8px;
}

.fact-lbl {
  color: var(--text-secondary, #475569);
}

.fact-val {
  font-weight: 600;
  color: var(--text-primary, #0F172A);
}

.text-accent {
  color: var(--primary, #2563EB);
}

.text-positive {
  color: #059669;
}

.text-neutral {
  color: #64748B;
}
</style>
