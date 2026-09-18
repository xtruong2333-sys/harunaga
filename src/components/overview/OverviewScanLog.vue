<template>
  <div class="overview-scan-log section-container">
    <div class="section-header">
      <div class="section-title-wrap">
        <div class="section-kicker">LỊCH SỬ TELEMETRY</div>
        <h2 class="section-title">Nhật Ký Hệ Thống</h2>
      </div>
    </div>

    <div v-if="!scans || scans.length === 0" class="log-empty">
      Chưa có dữ liệu nhật ký hệ thống.
    </div>

    <div v-else class="table-scroll-wrap">
      <table class="scan-table">
        <thead>
          <tr>
            <th>THỜI GIAN</th>
            <th>KIỂU CHẠY</th>
            <th>TRẠNG THÁI</th>
            <th>KÊNH QUÉT</th>
            <th>VIDEO TÌM THẤY</th>
            <th>SNAPSHOT</th>
            <th>CẢNH BÁO</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="scan in scans" :key="scan.id" class="scan-row">
            <td class="col-time mono">
              {{ formatDateTime(scan.startedAt) }}
            </td>
            <td>
              <span class="trigger-pill" :class="`trigger-${scan.triggerSource}`">
                {{ scan.triggerSource === 'schedule' ? 'Tự động' : 'Thủ công' }}
              </span>
            </td>
            <td>
              <span class="status-pill" :class="`pill-${scan.status}`">
                {{ formatStatus(scan.status) }}
              </span>
            </td>
            <td class="mono">{{ scan.channelsSuccess }} / {{ scan.channelsTotal }}</td>
            <td class="mono">{{ scan.videosFound }}</td>
            <td class="mono">{{ scan.snapshotsCreated }}</td>
            <td class="mono">{{ scan.alertsSent }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DashboardScanRun } from '@/types/dashboard';

defineProps<{
  scans: DashboardScanRun[];
}>();

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatStatus(status: string): string {
  if (status === 'success') return 'Thành công';
  if (status === 'running') return 'Đang chạy';
  if (status === 'partial') return 'Thành công 1 phần';
  if (status === 'failed') return 'Thất bại';
  return 'Không rõ';
}
</script>

<style scoped>
.overview-scan-log {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.log-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.table-scroll-wrap {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border, #E3EBF3);
}

.scan-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 12.5px;
}

.scan-table th {
  background: var(--bg-page-secondary, #F8FAFC);
  padding: 10px 14px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border, #E3EBF3);
  white-space: nowrap;
}

.scan-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border, #E3EBF3);
  vertical-align: middle;
  white-space: nowrap;
}

.scan-row:last-child td {
  border-bottom: none;
}

.scan-row:hover td {
  background: var(--surface-hover, #F3F7FB);
}

.trigger-pill {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.trigger-schedule {
  background: #EFF6FF;
  color: #2563EB;
}

.trigger-manual {
  background: #F1F5F9;
  color: #64748B;
}

.status-pill {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.pill-success {
  background: #ECFDF5;
  color: #059669;
}

.pill-info,
.pill-running {
  background: #EFF6FF;
  color: #2563EB;
}

.pill-warning,
.pill-partial {
  background: #FFFBEB;
  color: #D97706;
}

.pill-danger,
.pill-failed {
  background: #FEF2F2;
  color: #EF4444;
}
</style>
