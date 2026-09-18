<template>
  <div class="channel-activity-feed surface-card">
    <div class="activity-header">
      <div class="header-left">
        <h3 class="activity-title">HOẠT ĐỘNG CẢNH BÁO & QUÉT</h3>
        <span class="activity-sub">Lịch sử phát tín hiệu Discord và tiến trình cập nhật dữ liệu</span>
      </div>
    </div>

    <!-- Alert Status Pills -->
    <div class="alert-pills-row">
      <div class="a-pill">
        <span class="a-pill-lbl">Tổng cảnh báo:</span>
        <span class="a-pill-val mono">{{ alertSummary.total }}</span>
      </div>
      <div class="a-pill pill-sent">
        <span class="a-pill-lbl">Đã gửi:</span>
        <span class="a-pill-val mono">{{ alertSummary.sent }}</span>
      </div>
      <div class="a-pill pill-pending">
        <span class="a-pill-lbl">Đang chờ:</span>
        <span class="a-pill-val mono">{{ alertSummary.pending }}</span>
      </div>
      <div class="a-pill pill-failed">
        <span class="a-pill-lbl">Gửi lỗi:</span>
        <span class="a-pill-val mono">{{ alertSummary.failed }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="alertSummary.total === 0" class="alert-note-box">
      <AppIcon name="check-circle" size="18" class="note-icon" />
      <span>Chưa có video nào của kênh vượt ngưỡng cảnh báo.</span>
    </div>

    <!-- Recent Alerts List -->
    <div v-else-if="alertSummary.recentAlerts.length > 0" class="recent-alerts-list">
      <div
        v-for="a in alertSummary.recentAlerts"
        :key="a.id"
        class="recent-alert-item"
      >
        <div class="alert-item-left">
          <span class="alert-status-dot" :class="`dot-${a.status}`"></span>
          <router-link :to="'/videos/' + a.videoId" class="alert-v-name">
            {{ a.videoTitle }}
          </router-link>
        </div>

        <div class="alert-item-right">
          <span class="alert-vph-val mono text-accent">
            {{ a.measuredVph ? Math.round(a.measuredVph).toLocaleString('vi-VN') + ' VPH' : '—' }}
          </span>
          <span class="badge-alert" :class="`alert-${a.status}`">
            {{ formatAlertStatus(a.status) }}
          </span>
          <span v-if="a.sentAt" class="alert-time">{{ formatRelativeTime(a.sentAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ChannelAlertSummary } from '@/types/channel-analysis';

defineProps<{
  alertSummary: ChannelAlertSummary;
  lastScanAt: string | null;
}>();

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
.channel-activity-feed {
  padding: 24px;
  border-radius: 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: 0 1px 4px rgba(30, 60, 90, 0.04);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary, #0F172A);
  margin: 0;
  text-transform: uppercase;
}

.activity-sub {
  font-size: 12.5px;
  color: var(--text-secondary, #64748B);
}

.alert-pills-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.a-pill {
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pill-sent {
  border-color: #BBF7D0;
  background: #F0FDF4;
}

.pill-pending {
  border-color: #FDE68A;
  background: #FEFCE8;
}

.pill-failed {
  border-color: #FECACA;
  background: #FEF2F2;
}

.a-pill-lbl {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary, #64748B);
}

.a-pill-val {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-primary, #0F172A);
}

.pill-sent .a-pill-val { color: #15803D; }
.pill-pending .a-pill-val { color: #B45309; }
.pill-failed .a-pill-val { color: #DC2626; }

.alert-note-box {
  padding: 24px;
  border-radius: 10px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px dashed var(--border, #E3EBF3);
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary, #64748B);
  font-size: 13px;
  font-weight: 500;
}

.note-icon {
  color: #16A34A;
}

.recent-alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
  gap: 16px;
  flex-wrap: wrap;
}

.alert-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.alert-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-sent { background: #16A34A; }
.dot-pending, .dot-sending { background: #EAB308; }
.dot-failed { background: #DC2626; }

.alert-v-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-v-name:hover {
  color: var(--primary, #2563EB);
}

.alert-item-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-vph-val {
  font-size: 13px;
  font-weight: 800;
}

.badge-alert {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.alert-sent { background: #DCFCE7; color: #166534; }
.alert-pending, .alert-sending { background: #FEF3C7; color: #B45309; }
.alert-failed { background: #FEE2E2; color: #991B1B; }

.alert-time {
  font-size: 11.5px;
  color: var(--text-muted, #64748B);
}

.text-accent { color: #2563EB; }

@media (max-width: 768px) {
  .alert-pills-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
