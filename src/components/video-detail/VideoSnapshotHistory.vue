<template>
  <section class="snapshot-history-section surface-card">
    <div class="section-header-bar">
      <div class="header-left">
        <h2 class="history-title">LỊCH SỬ SNAPSHOT</h2>
        <span class="snapshot-count-pill">{{ snapshots.length }} lần quét</span>
      </div>

      <div class="sort-toggle-wrap" v-if="snapshots.length > 0">
        <button
          type="button"
          class="sort-toggle-btn"
          :class="{ 'is-active': sortOrder === 'newest' }"
          @click="sortOrder = 'newest'"
        >
          Mới nhất trước
        </button>
        <button
          type="button"
          class="sort-toggle-btn"
          :class="{ 'is-active': sortOrder === 'oldest' }"
          @click="sortOrder = 'oldest'"
        >
          Cũ nhất trước
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="snapshots.length === 0" class="history-empty">
      Chưa có lịch sử đo cho video này.
    </div>

    <!-- Table View (Desktop & Tablet) -->
    <div v-else class="table-responsive">
      <table class="snapshot-data-table">
        <thead>
          <tr>
            <th>THỜI ĐIỂM</th>
            <th>LƯỢT XEM</th>
            <th>TĂNG (DELTA)</th>
            <th>KHOẢNG THỜI GIAN</th>
            <th>VPH ĐO ĐƯỢC</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(snap, idx) in orderedSnapshots" :key="snap.id" class="snapshot-row">
            <!-- Time -->
            <td class="col-time">
              <div class="time-primary mono">{{ formatDateTime(snap.checkedAt) }}</div>
              <div class="time-index">Lần quét #{{ getScanIndex(idx) }}</div>
            </td>

            <!-- Views -->
            <td class="col-views mono">
              {{ videoService.formatViews(snap.viewCount) }}
            </td>

            <!-- Delta -->
            <td
              class="col-delta mono"
              :class="{
                'text-positive': snap.viewDelta !== null && snap.viewDelta > 0,
                'text-neutral': snap.viewDelta === null || snap.viewDelta <= 0
              }"
            >
              {{ videoService.formatViewDelta(snap.viewDelta) }}
            </td>

            <!-- Elapsed -->
            <td class="col-elapsed">
              {{ videoService.formatElapsedSeconds(snap.elapsedSeconds) }}
            </td>

            <!-- VPH -->
            <td class="col-vph mono">
              <span
                :class="{
                  'text-accent': snap.measuredVph !== null && snap.measuredVph > 0,
                  'text-muted': snap.measuredVph === null || snap.measuredVph === 0
                }"
              >
                {{ formatMeasuredVph(snap.measuredVph) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { VideoSnapshotPoint } from '@/types/video';
import { videoService } from '@/services/video-service';

const props = defineProps<{
  snapshots: VideoSnapshotPoint[];
}>();

const sortOrder = ref<'newest' | 'oldest'>('newest');

const orderedSnapshots = computed(() => {
  const list = [...props.snapshots];
  if (sortOrder.value === 'oldest') {
    return list.sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
  }
  return list.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
});

function getScanIndex(idx: number): number {
  if (sortOrder.value === 'oldest') {
    return idx + 1;
  }
  return props.snapshots.length - idx;
}

function formatDateTime(iso: string): string {
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

function formatMeasuredVph(vph: number | null | undefined): string {
  if (vph === null || vph === undefined) return '—';
  if (vph === 0) return '0 VPH';
  return `${Math.round(vph).toLocaleString('vi-VN')} VPH`;
}
</script>

<style scoped>
.snapshot-history-section {
  padding: 24px;
  border-radius: 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: var(--shadow-sm, 0 4px 20px rgba(30, 60, 90, 0.05));
  margin-bottom: 28px;
}

.section-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border, #E3EBF3);
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-primary, #0F172A);
  margin: 0;
}

.snapshot-count-pill {
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}

.sort-toggle-wrap {
  display: flex;
  background: var(--bg-inset, #F8FAFC);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--border, #E3EBF3);
}

.sort-toggle-btn {
  padding: 5px 12px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #64748B);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sort-toggle-btn.is-active {
  background: var(--surface, #FFFFFF);
  color: var(--primary, #2563EB);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.history-empty {
  padding: 36px;
  text-align: center;
  color: var(--text-muted, #64748B);
  font-size: 14px;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.snapshot-data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.snapshot-data-table th {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted, #64748B);
  background: var(--bg-inset, #F8FAFC);
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.snapshot-data-table td {
  padding: 12px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--border, #E3EBF3);
  color: var(--text-primary, #0F172A);
}

.snapshot-row:hover {
  background: #F8FAFC;
}

.time-primary {
  font-weight: 600;
}

.time-index {
  font-size: 11px;
  color: var(--text-muted, #64748B);
}

.text-positive {
  color: #059669;
  font-weight: 600;
}

.text-neutral {
  color: #64748B;
}

.text-accent {
  color: var(--primary, #2563EB);
  font-weight: 700;
}

.text-muted {
  color: #94A3B8;
}

@media (max-width: 640px) {
  .snapshot-history-section {
    padding: 16px;
  }
}
</style>
