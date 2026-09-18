<template>
  <div class="video-alert-context surface-card system-event-log-panel">
    <div class="alert-header">
      <div class="header-left">
        <h3 class="alert-title">TRẠNG THÁI CẢNH BÁO</h3>
        <span class="event-tag">DISCORD EVENT LOG</span>
      </div>

      <span class="status-badge" :class="`badge-${badgeInfo.tone}`">
        {{ badgeInfo.label }}
      </span>
    </div>

    <!-- Alert Event Details -->
    <div class="alert-message-box">
      <div class="timeline-indicator">
        <div class="indicator-dot" :class="`dot-${badgeInfo.tone}`"></div>
      </div>

      <div class="message-content">
        <p v-if="alert?.status === 'sent' && alert.sentAt" class="event-text">
          Hệ thống đã phát tín hiệu cảnh báo đến Discord lúc <strong>{{ formatDateTime(alert.sentAt) }}</strong>
          với tốc độ đo được <strong>{{ alert.measuredVph !== null && alert.measuredVph !== undefined ? alert.measuredVph.toLocaleString('vi-VN') + ' VPH' : '—' }}</strong>.
        </p>
        <p v-else-if="alert?.status === 'pending'" class="event-text">
          Video đã vượt ngưỡng cảnh báo và đang nằm trong hàng đợi phát tín hiệu tới Discord webhook.
        </p>
        <p v-else-if="alert?.status === 'sending'" class="event-text">
          Đang kết nối tới Discord webhook để phát tín hiệu cảnh báo tăng trưởng.
        </p>
        <p v-else-if="alert?.status === 'failed'" class="event-text">
          Không thể gửi cảnh báo qua Discord webhook.
          <span v-if="alert.lastError" class="error-msg">
            Chi tiết: {{ sanitizeError(alert.lastError) }}
          </span>
        </p>
        <p v-else class="event-text">
          Video chưa từng vượt ngưỡng cảnh báo của kênh hoặc chưa kích hoạt gửi thông báo.
        </p>
      </div>
    </div>

    <div class="alert-action-footer">
      <router-link
        :to="'/lich-su-canh-bao?video=' + videoId"
        class="btn-alert-link"
      >
        <AppIcon name="bell" size="13" />
        <span>Xem Toàn Bộ Lịch Sử Cảnh Báo</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { VideoAlertInfo } from '@/types/video';

const props = defineProps<{
  alert: VideoAlertInfo | null;
  videoId: string;
}>();

const badgeInfo = computed(() => {
  const a = props.alert;
  if (!a || !a.status) return { label: 'Chưa cảnh báo', tone: 'muted' };
  switch (a.status) {
    case 'pending': return { label: 'Chờ gửi', tone: 'warning' };
    case 'sending': return { label: 'Đang gửi', tone: 'warning' };
    case 'sent': return { label: 'Đã cảnh báo', tone: 'success' };
    case 'failed': return { label: 'Gửi lỗi', tone: 'danger' };
    default: return { label: 'Chưa cảnh báo', tone: 'muted' };
  }
});

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

function sanitizeError(err: string): string {
  return err.replace(/https?:\/\/[^\s]+/g, '[URL]').substring(0, 160);
}
</script>

<style scoped>
.video-alert-context {
  padding: 22px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.alert-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-title {
  font-size: 13.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-primary, #0F172A);
  margin: 0;
}

.event-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted, #64748B);
  letter-spacing: 0.06em;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.badge-success {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
}

.badge-warning {
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid #FDE68A;
}

.badge-danger {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.badge-muted {
  background: #F8FAFC;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.alert-message-box {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
  align-items: flex-start;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
}

.dot-success { background: #10B981; }
.dot-warning { background: #F59E0B; }
.dot-danger { background: #EF4444; }
.dot-muted { background: #94A3B8; }

.event-text {
  font-size: 13px;
  color: var(--text-secondary, #475569);
  line-height: 1.5;
  margin: 0;
}

.error-msg {
  display: block;
  margin-top: 4px;
  color: #DC2626;
  font-size: 12px;
}

.alert-action-footer {
  padding-top: 4px;
}

.btn-alert-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  color: var(--text-primary, #0F172A);
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-alert-link:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}
</style>
