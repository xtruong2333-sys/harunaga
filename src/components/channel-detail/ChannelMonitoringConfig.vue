<template>
  <div class="channel-monitoring-config surface-card">
    <div class="config-header">
      <div class="header-left">
        <h3 class="config-title">CẤU HÌNH THEO DÕI</h3>
        <span class="config-sub">Thiết lập ngưỡng VPH và cơ chế quét đối thủ</span>
      </div>
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        @click="$emit('edit')"
      >
        <AppIcon name="edit" size="14" />
        <span>Chỉnh Sửa</span>
      </button>
    </div>

    <div class="config-details-grid">
      <div class="cfg-row">
        <span class="cfg-lbl">Trạng thái theo dõi</span>
        <span class="cfg-val">
          <span class="status-chip" :class="`status-${channel.status}`">
            {{ channel.status === 'active' ? 'Đang theo dõi' : channel.status === 'paused' ? 'Tạm dừng' : 'Lưu trữ' }}
          </span>
        </span>
      </div>

      <div class="cfg-row">
        <span class="cfg-lbl">Ngưỡng cảnh báo VPH</span>
        <span class="cfg-val mono text-accent">
          {{ channel.alertVphThreshold ? channel.alertVphThreshold.toLocaleString('vi-VN') + ' VPH' : '—' }}
        </span>
      </div>

      <div class="cfg-row">
        <span class="cfg-lbl">Giới hạn video mỗi lần quét</span>
        <span class="cfg-val mono">
          {{ channel.scanLimit !== null && channel.scanLimit !== undefined ? channel.scanLimit + ' video' : '—' }}
        </span>
      </div>

      <div class="cfg-row">
        <span class="cfg-lbl">Quét gần nhất</span>
        <span class="cfg-val">
          {{ channel.lastScanAt ? formatRelativeTime(channel.lastScanAt) : 'Chưa kiểm tra' }}
        </span>
      </div>

      <div class="cfg-row">
        <span class="cfg-lbl">Ngày thêm vào hệ thống</span>
        <span class="cfg-val mono">
          {{ formatDateOnly(channel.createdAt) }}
        </span>
      </div>

      <div class="cfg-row">
        <span class="cfg-lbl">Mã kênh nội bộ</span>
        <span class="cfg-val mono text-muted id-txt" :title="channel.id">
          {{ channel.id }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ChannelAnalysisHeader } from '@/types/channel-analysis';

defineProps<{
  channel: ChannelAnalysisHeader;
}>();

defineEmits<{
  (e: 'edit'): void;
}>();

function formatDateOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso || '—';
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
.channel-monitoring-config {
  padding: 24px;
  border-radius: 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: 0 1px 4px rgba(30, 60, 90, 0.04);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary, #0F172A);
  margin: 0;
  text-transform: uppercase;
}

.config-sub {
  font-size: 12.5px;
  color: var(--text-secondary, #64748B);
}

.config-details-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cfg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
  gap: 12px;
}

.cfg-lbl {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary, #64748B);
}

.cfg-val {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  text-align: right;
}

.status-chip {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
}

.status-active { background: #DCFCE7; color: #15803D; }
.status-paused { background: #FEF3C7; color: #B45309; }
.status-archived { background: #F1F5F9; color: #64748B; }

.text-accent { color: #2563EB; }
.text-muted { color: #94A3B8; }

.id-txt {
  font-size: 11px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  color: var(--text-primary, #0F172A);
  transition: all 0.15s ease;
}

.btn:hover {
  background: var(--primary-soft, #EFF6FF);
  border-color: #BFDBFE;
  color: var(--primary, #2563EB);
}
</style>
