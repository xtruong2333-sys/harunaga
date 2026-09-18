<template>
  <div class="card-section channel-freshness-section">
    <div class="section-header">
      <div>
        <div class="title-with-count">
          <h2 class="section-title">Độ Mới Dữ Liệu Kênh Đối Thủ</h2>
          <span v-if="channelsNeedAttentionCount > 0" class="attention-pill">
            {{ channelsNeedAttentionCount }} kênh cần chú ý
          </span>
        </div>
        <p class="section-subtitle">
          Sắp xếp theo thứ tự ưu tiên: kênh chưa quét hoặc quét hơn 2 giờ trước hiển thị đầu tiên.
        </p>
      </div>
    </div>

    <!-- Desktop Table -->
    <div v-if="channels.length > 0" class="table-container desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>Kênh Đối Thủ</th>
            <th>Lần Quét Cuối</th>
            <th>Tình Trạng</th>
            <th>Giới Hạn Quét</th>
            <th>Ngưỡng Cảnh Báo</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ch in channels" :key="ch.id">
            <td>
              <div class="channel-cell">
                <DataHealthChannelAvatar
                  :avatar-url="ch.avatarUrl"
                  :name="ch.name"
                  :size="38"
                />
                <div class="channel-info">
                  <div class="channel-name">{{ ch.name }}</div>
                  <div v-if="ch.handle" class="channel-handle">{{ ch.handle }}</div>
                </div>
              </div>
            </td>
            <td class="cell-nowrap">
              <div class="scan-time-main">{{ ch.relativeScanTime }}</div>
              <div v-if="ch.lastScanAt" class="scan-time-sub mono">
                {{ formatDateTime(ch.lastScanAt) }}
              </div>
            </td>
            <td>
              <span class="badge-freshness" :class="`freshness-${ch.freshnessCategory}`">
                {{ ch.freshnessLabel }}
              </span>
            </td>
            <td class="mono">
              {{ ch.scanLimit !== null ? `${formatNumber(ch.scanLimit)} video` : '—' }}
            </td>
            <td class="mono">
              {{ ch.alertVphThreshold !== null ? `${formatNumber(ch.alertVphThreshold)} VPH` : '—' }}
            </td>
            <td>
              <router-link :to="`/kenh-theo-doi/${ch.id}`" class="table-action-link">
                Chi tiết
                <AppIcon name="chevron-right" size="13" />
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div v-if="channels.length > 0" class="mobile-cards-list mobile-only">
      <div v-for="ch in channels" :key="ch.id" class="mobile-item-card">
        <div class="card-top-row">
          <div class="channel-cell">
            <DataHealthChannelAvatar
              :avatar-url="ch.avatarUrl"
              :name="ch.name"
              :size="36"
            />
            <div class="channel-info">
              <div class="channel-name">{{ ch.name }}</div>
              <div v-if="ch.handle" class="channel-handle">{{ ch.handle }}</div>
            </div>
          </div>
          <span class="badge-freshness" :class="`freshness-${ch.freshnessCategory}`">
            {{ ch.freshnessLabel }}
          </span>
        </div>

        <div class="card-metrics-grid">
          <div class="metric-block">
            <span class="metric-label">Lần quét cuối</span>
            <span class="metric-val">{{ ch.relativeScanTime }}</span>
          </div>
          <div class="metric-block">
            <span class="metric-label">Giới hạn / Ngưỡng</span>
            <span class="metric-val mono">
              {{ ch.scanLimit !== null ? `${formatNumber(ch.scanLimit)} vid` : '—' }} •
              {{ ch.alertVphThreshold !== null ? `${formatNumber(ch.alertVphThreshold)} VPH` : '—' }}
            </span>
          </div>
        </div>

        <div class="card-action-row">
          <router-link :to="`/kenh-theo-doi/${ch.id}`" class="table-action-link">
            Xem phân tích kênh
            <AppIcon name="chevron-right" size="13" />
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="empty-placeholder">
      Chưa có kênh đối thủ nào đang được theo dõi trong hệ thống.
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import DataHealthChannelAvatar from './DataHealthChannelAvatar.vue';
import { formatNumber, formatDateTime } from '@/services/data-health-service';
import type { ChannelFreshness } from '@/types/data-health';

defineProps<{
  channels: ChannelFreshness[];
  channelsNeedAttentionCount: number;
}>();
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

.channel-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-info {
  display: flex;
  flex-direction: column;
}

.channel-name {
  font-weight: 600;
  color: var(--text-primary, #0F172A);
}

[data-theme="dark"] .channel-name {
  color: #F1F5F9;
}

.channel-handle {
  font-size: 0.76rem;
  color: var(--text-muted, #64748B);
}

[data-theme="dark"] .channel-handle {
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
  padding: 24px;
  text-align: center;
  font-size: 0.88rem;
  color: var(--text-muted, #94A3B8);
}

/* Mobile */
.mobile-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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
