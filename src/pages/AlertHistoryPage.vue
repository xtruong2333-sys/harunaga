<template>
  <div class="alert-history-page">
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-title">Lịch Sử Cảnh Báo</h1>
        <p class="page-subtitle">Toàn bộ cảnh báo VPH mà hệ thống đã ghi nhận</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" :disabled="loading" @click="reload">
          <AppIcon name="refresh" size="15" />
          {{ loading ? "Đang tải..." : "Làm mới" }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-banner">
      <AppIcon name="alert" size="16" />
      <span>{{ error }}</span>
    </div>

    <div class="summary-grid" v-if="!loading || allItems.length > 0">
      <div class="summary-card">
        <div class="summary-label">Tổng cảnh báo</div>
        <div class="summary-value mono">{{ summary.total }}</div>
      </div>
      <div class="summary-card card-sent">
        <div class="summary-label">Đã gửi</div>
        <div class="summary-value mono">{{ summary.sent }}</div>
      </div>
      <div class="summary-card card-waiting">
        <div class="summary-label">Đang chờ</div>
        <div class="summary-value mono">{{ summary.waiting }}</div>
      </div>
      <div class="summary-card" :class="summary.failed > 0 ? 'card-failed' : ''">
        <div class="summary-label">Gửi lỗi</div>
        <div class="summary-value mono">{{ summary.failed }}</div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Trạng thái</label>
        <select v-model="filter.status" class="filter-select" @change="onFilterChange">
          <option value="all">Tất cả</option>
          <option value="sent">Đã gửi</option>
          <option value="pending">Đang chờ</option>
          <option value="sending">Đang gửi</option>
          <option value="failed">Gửi lỗi</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Khoảng thời gian</label>
        <select v-model="filter.range" class="filter-select" @change="onFilterChange">
          <option value="24h">24 giờ qua</option>
          <option value="7d">7 ngày qua</option>
          <option value="30d">30 ngày qua</option>
          <option value="all">Tất cả thời gian</option>
        </select>
      </div>
      <div class="filter-group" v-if="channels.length > 0">
        <label class="filter-label">Kênh</label>
        <select v-model="filter.channelId" class="filter-select" @change="onFilterChange">
          <option :value="null">Tất cả kênh</option>
          <option v-for="ch in channels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Sắp xếp</label>
        <select v-model="sort" class="filter-select" @change="onFilterChange">
          <option value="newest">Mới nhất</option>
          <option value="vph_desc">VPH cao nhất</option>
          <option value="views_desc">Lượt xem cao nhất</option>
          <option value="attempts_desc">Nhiều lần thử nhất</option>
        </select>
      </div>
      <div class="filter-group filter-search">
        <label class="filter-label">Tìm kiếm</label>
        <input
          v-model="filter.search"
          class="filter-input"
          placeholder="Tên video, kênh..."
          type="text"
          @input="onFilterChange"
        />
      </div>
    </div>

    <div v-if="filter.videoId" class="deep-link-banner">
      <AppIcon name="video" size="14" />
      <span>Đang lọc theo video cụ thể.</span>
      <button class="btn-clear-video" @click="clearVideoFilter">Xem tất cả</button>
    </div>

    <div v-if="loading && allItems.length === 0" class="loading-state">
      <div v-for="i in 5" :key="i" class="skeleton-row"></div>
    </div>

    <div v-else-if="!loading && displayed.length === 0" class="empty-state">
      <AppIcon name="bell" size="32" iconClass="empty-icon" />
      <div class="empty-title">Chưa có cảnh báo nào</div>
      <div class="empty-desc">
        <span v-if="allItems.length === 0">
          Hệ thống chưa ghi nhận cảnh báo VPH nào. Cảnh báo được tạo khi video vượt ngưỡng VPH đã thiết lập cho từng kênh.
        </span>
        <span v-else>Không có cảnh báo nào phù hợp với bộ lọc hiện tại.</span>
      </div>
    </div>

    <div v-else class="table-container desktop-only">
      <table class="alert-table">
        <thead>
          <tr>
            <th>Video</th>
            <th>Kênh</th>
            <th>Thời điểm cảnh báo</th>
            <th class="num-col">VPH lúc cảnh báo</th>
            <th class="num-col">Ngưỡng VPH</th>
            <th class="num-col">Vượt ngưỡng</th>
            <th class="num-col">Lượt xem lúc cảnh báo</th>
            <th class="num-col">View tăng</th>
            <th>Trạng thái</th>
            <th class="num-col">Số lần thử</th>
            <th>Gửi lúc</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in displayed" :key="item.id" class="alert-row" @click="openModal(item)">
            <td class="video-cell">
              <img v-if="item.videoThumbnailUrl" :src="item.videoThumbnailUrl" :alt="item.videoTitle" class="thumb" loading="lazy" />
              <div class="video-title">{{ item.videoTitle }}</div>
            </td>
            <td class="channel-cell">
              <img v-if="item.channelAvatarUrl" :src="item.channelAvatarUrl" :alt="item.channelName" class="avatar" loading="lazy" />
              <span>{{ item.channelName }}</span>
            </td>
            <td class="time-cell">{{ formatRelative(item.createdAt) }}</td>
            <td class="num-col mono">{{ fmtVph(item.measuredVph) }}</td>
            <td class="num-col mono">{{ fmtVph(item.thresholdVph) }}</td>
            <td class="num-col">
              <span v-if="item.thresholdRatio !== null" class="ratio-badge">{{ fmtRatio(item.thresholdRatio) }}</span>
              <span v-else>—</span>
            </td>
            <td class="num-col mono">{{ fmtNum(item.viewCountAtAlert) }}</td>
            <td class="num-col mono">{{ item.viewDeltaAtAlert !== null ? "+" + fmtNum(item.viewDeltaAtAlert) : "—" }}</td>
            <td>
              <span class="status-badge" :class="statusClass(item)">
                {{ alertHistoryService.mapAlertStatus(item.status) }}
                <span v-if="item.isSendingStuck" class="stuck-tag">?</span>
              </span>
            </td>
            <td class="num-col mono">{{ item.attempts }}</td>
            <td class="time-cell">{{ item.sentAt ? formatRelative(item.sentAt) : "—" }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && displayed.length > 0" class="mobile-only">
      <div v-for="item in displayed" :key="item.id" class="mobile-card" @click="openModal(item)">
        <div class="mobile-card-header">
          <img v-if="item.videoThumbnailUrl" :src="item.videoThumbnailUrl" :alt="item.videoTitle" class="mobile-thumb" loading="lazy" />
          <div class="mobile-card-info">
            <div class="mobile-video-title">{{ item.videoTitle }}</div>
            <div class="mobile-channel">{{ item.channelName }}</div>
          </div>
          <span class="status-badge" :class="statusClass(item)">{{ alertHistoryService.mapAlertStatus(item.status) }}</span>
        </div>
        <div class="mobile-card-body">
          <div class="mobile-stat"><span class="ms-label">VPH cảnh báo</span><span class="ms-val mono">{{ fmtVph(item.measuredVph) }}</span></div>
          <div class="mobile-stat"><span class="ms-label">Ngưỡng VPH</span><span class="ms-val mono">{{ fmtVph(item.thresholdVph) }}</span></div>
          <div class="mobile-stat" v-if="item.thresholdRatio !== null"><span class="ms-label">Vượt ngưỡng</span><span class="ms-val">{{ fmtRatio(item.thresholdRatio) }}</span></div>
          <div class="mobile-stat"><span class="ms-label">Thời điểm</span><span class="ms-val">{{ formatRelative(item.createdAt) }}</span></div>
          <div class="mobile-stat"><span class="ms-label">Lần thử</span><span class="ms-val mono">{{ item.attempts }}</span></div>
        </div>
      </div>
    </div>

    <div v-if="hasMore && !loading" class="load-more-wrap">
      <button class="btn-load-more" @click="loadMore">Xem Thêm ({{ remaining }} cảnh báo)</button>
    </div>

    <div v-if="modalItem" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title">Chi Tiết Cảnh Báo</div>
          <button class="modal-close" @click="closeModal"><AppIcon name="x" size="18" /></button>
        </div>
        <div class="modal-body">
          <div class="modal-video-row">
            <img v-if="modalItem.videoThumbnailUrl" :src="modalItem.videoThumbnailUrl" class="modal-thumb" :alt="modalItem.videoTitle" />
            <div>
              <div class="modal-video-title">{{ modalItem.videoTitle }}</div>
              <div class="modal-channel">{{ modalItem.channelName }}<span v-if="modalItem.channelHandle" class="modal-handle"> ({{ modalItem.channelHandle }})</span></div>
              <a v-if="modalItem.videoYoutubeId" :href="'https://www.youtube.com/watch?v=' + modalItem.videoYoutubeId" target="_blank" rel="noopener noreferrer" class="yt-link">
                Xem trên YouTube <AppIcon name="external" size="12" />
              </a>
            </div>
          </div>
          <div class="modal-group">
            <div class="modal-group-title">Dữ liệu tại thời điểm cảnh báo</div>
            <div class="modal-row"><span class="modal-key">Thời điểm</span><span class="modal-val">{{ formatDateTime(modalItem.createdAt) }}</span></div>
            <div class="modal-row"><span class="modal-key">VPH đo được</span><span class="modal-val mono">{{ fmtVph(modalItem.measuredVph) }}</span></div>
            <div class="modal-row"><span class="modal-key">Ngưỡng VPH kênh</span><span class="modal-val mono">{{ fmtVph(modalItem.thresholdVph) }}</span></div>
            <div class="modal-row"><span class="modal-key">Vượt ngưỡng</span><span class="modal-val">{{ modalItem.thresholdRatio !== null ? fmtRatio(modalItem.thresholdRatio) : "—" }}</span></div>
            <div class="modal-row"><span class="modal-key">Lượt xem lúc cảnh báo</span><span class="modal-val mono">{{ fmtNum(modalItem.viewCountAtAlert) }}</span></div>
            <div class="modal-row"><span class="modal-key">View tăng (khoảng đo)</span><span class="modal-val mono">{{ modalItem.viewDeltaAtAlert !== null ? "+" + fmtNum(modalItem.viewDeltaAtAlert) : "—" }}</span></div>
            <div class="modal-row"><span class="modal-key">Thời gian đo</span><span class="modal-val mono">{{ alertHistoryService.formatElapsedSeconds(modalItem.elapsedSeconds) }}</span></div>
          </div>
          <div class="modal-group">
            <div class="modal-group-title">Dữ liệu hiện tại của video</div>
            <div class="modal-row"><span class="modal-key">VPH hiện tại</span><span class="modal-val mono">{{ modalItem.currentVph !== null ? fmtVph(modalItem.currentVph) : "Chưa có" }}</span></div>
            <div class="modal-row"><span class="modal-key">Lượt xem hiện tại</span><span class="modal-val mono">{{ modalItem.currentViewCount !== null ? fmtNum(modalItem.currentViewCount) : "Chưa có" }}</span></div>
          </div>
          <div class="modal-group">
            <div class="modal-group-title">Trạng thái gửi Discord</div>
            <div class="modal-row">
              <span class="modal-key">Trạng thái</span>
              <span class="modal-val">
                <span class="status-badge" :class="statusClass(modalItem)">
                  {{ alertHistoryService.mapAlertStatus(modalItem.status) }}
                  <span v-if="modalItem.isSendingStuck" class="stuck-tag">Bị treo?</span>
                </span>
              </span>
            </div>
            <div class="modal-row"><span class="modal-key">Số lần thử</span><span class="modal-val mono">{{ modalItem.attempts }}</span></div>
            <div class="modal-row" v-if="modalItem.sentAt"><span class="modal-key">Gửi thành công lúc</span><span class="modal-val">{{ formatDateTime(modalItem.sentAt) }}</span></div>
            <div class="modal-row" v-if="modalItem.discordMessageId"><span class="modal-key">Discord Message ID</span><span class="modal-val mono">{{ modalItem.discordMessageId }}</span></div>
            <div v-if="modalItem.sanitizedLastError" class="modal-error-block">
              <div class="modal-key">Lỗi gần nhất</div>
              <div class="modal-error-text">{{ modalItem.sanitizedLastError }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

﻿<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import { alertHistoryService } from '@/services/alert-history-service';
import { DatabaseNotConfiguredError } from '@/services/channel-service';
import type {
  AlertHistoryItem,
  AlertHistoryFilter,
  AlertHistorySort,
  AlertHistorySummary,
} from '@/types/alert-history';

const route = useRoute();
const router = useRouter();

const allItems = ref<AlertHistoryItem[]>([]);
const displayLimit = ref(50);
const loading = ref(false);
const error = ref<string | null>(null);
const modalItem = ref<AlertHistoryItem | null>(null);
const sort = ref<AlertHistorySort>('newest');

const filter = ref<AlertHistoryFilter>({
  status: 'all',
  range: '7d',
  channelId: null,
  search: '',
  videoId: null,
});

const channels = computed(() => {
  const map = new Map<string, { id: string; name: string }>();
  for (const item of allItems.value) {
    if (!map.has(item.channelId)) {
      map.set(item.channelId, { id: item.channelId, name: item.channelName });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
});

const filtered = computed(() =>
  alertHistoryService.filterAndSortAlerts(allItems.value, filter.value, sort.value)
);
const displayed = computed(() => filtered.value.slice(0, displayLimit.value));
const hasMore = computed(() => filtered.value.length > displayLimit.value);
const remaining = computed(() => filtered.value.length - displayLimit.value);
const summary = computed<AlertHistorySummary>(() =>
  alertHistoryService.computeAlertSummary(allItems.value)
);

onMounted(async () => {
  readUrlParams();
  await reload();
});

watch(() => route.query, () => readUrlParams());

function readUrlParams() {
  const q = route.query;
  if (q.status && ['pending', 'sending', 'sent', 'failed', 'all'].includes(q.status as string)) {
    filter.value.status = q.status as AlertHistoryFilter['status'];
  }
  if (q.range && ['24h', '7d', '30d', 'all'].includes(q.range as string)) {
    filter.value.range = q.range as AlertHistoryFilter['range'];
  }
  if (q.channel && typeof q.channel === 'string') {
    filter.value.channelId = q.channel;
  }
  if (q.video && typeof q.video === 'string' && isValidUuid(q.video)) {
    filter.value.videoId = q.video;
  }
}

function isValidUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

async function reload() {
  loading.value = true;
  error.value = null;
  try {
    allItems.value = await alertHistoryService.fetchAlertHistory(500, 0);
  } catch (e: unknown) {
    if (e instanceof DatabaseNotConfiguredError) {
      error.value = 'Chưa cấu hình kết nối Supabase. Vui lòng kiểm tra cài đặt.';
    } else {
      error.value = e instanceof Error ? e.message : 'Không thể tải dữ liệu cảnh báo.';
    }
  } finally {
    loading.value = false;
  }
}

function onFilterChange() {
  displayLimit.value = 50;
  const q: Record<string, string> = {};
  if (filter.value.status !== 'all') q.status = filter.value.status;
  if (filter.value.range !== '7d') q.range = filter.value.range;
  if (filter.value.channelId) q.channel = filter.value.channelId;
  if (filter.value.videoId) q.video = filter.value.videoId;
  router.replace({ query: q });
}

function clearVideoFilter() {
  filter.value.videoId = null;
  onFilterChange();
}

function loadMore() { displayLimit.value += 50; }
function openModal(item: AlertHistoryItem) { modalItem.value = item; }
function closeModal() { modalItem.value = null; }

function fmtVph(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return Math.round(v).toLocaleString('vi-VN') + ' VPH';
}
function fmtNum(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('vi-VN');
}
function fmtRatio(r: number): string { return (r * 100).toFixed(0) + '%'; }
function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return mins + ' phút trước';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' giờ trước';
  return Math.floor(hrs / 24) + ' ngày trước';
}
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function statusClass(item: AlertHistoryItem): string {
  if (item.isSendingStuck) return 'status-stuck';
  switch (item.status) {
    case 'sent': return 'status-sent';
    case 'pending': return 'status-pending';
    case 'sending': return 'status-sending';
    case 'failed': return 'status-failed';
    default: return '';
  }
}
</script>

﻿<style scoped>
.alert-history-page { display: flex; flex-direction: column; gap: 24px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; }
.header-actions { display: flex; gap: 8px; flex-shrink: 0; }
.btn-refresh { display: flex; align-items: center; gap: 6px; padding: 7px 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.btn-refresh:hover:not(:disabled) { background: var(--accent-subtle); color: var(--accent); }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
.error-banner { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #f87171; font-size: 13px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.summary-card { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 16px 20px; }
.summary-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.summary-value { font-size: 26px; font-weight: 700; color: var(--text-primary); }
.card-sent { border-color: rgba(34,197,94,0.3); }
.card-sent .summary-value { color: #4ade80; }
.card-waiting { border-color: rgba(234,179,8,0.3); }
.card-waiting .summary-value { color: #fbbf24; }
.card-failed { border-color: rgba(239,68,68,0.3); }
.card-failed .summary-value { color: #f87171; }
.filter-bar { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 10px; }
.filter-group { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
.filter-search { flex: 1; min-width: 200px; }
.filter-label { font-size: 11px; color: var(--text-secondary); font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; }
.filter-select, .filter-input { padding: 7px 10px; background: var(--bg-main); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary); font-size: 13px; outline: none; transition: border-color 0.15s; }
.filter-select:focus, .filter-input:focus { border-color: var(--accent); }
.deep-link-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--accent-subtle); border: 1px solid rgba(56,189,248,0.3); border-radius: 8px; font-size: 13px; color: var(--accent); }
.btn-clear-video { margin-left: auto; padding: 3px 10px; background: transparent; border: 1px solid var(--accent); border-radius: 5px; color: var(--accent); font-size: 12px; cursor: pointer; transition: all 0.15s; }
.btn-clear-video:hover { background: var(--accent); color: #000; }
.loading-state { display: flex; flex-direction: column; gap: 10px; }
.skeleton-row { height: 52px; background: var(--bg-surface); border-radius: 8px; animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 32px; text-align: center; background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: 12px; gap: 12px; }
:deep(.empty-icon) { color: var(--text-muted); }
.empty-title { font-size: 16px; font-weight: 600; color: var(--text-secondary); }
.empty-desc { font-size: 13px; color: var(--text-muted); max-width: 440px; }
.table-container { overflow-x: auto; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 10px; }
.alert-table { width: 100%; border-collapse: collapse; min-width: 960px; }
.alert-table thead { background: var(--bg-surface-elevated); }
.alert-table th { padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); text-align: left; white-space: nowrap; }
.num-col { text-align: right !important; }
.alert-row { border-top: 1px solid var(--border-subtle); cursor: pointer; transition: background 0.1s; }
.alert-row:hover { background: var(--bg-surface-elevated); }
.alert-table td { padding: 10px 14px; font-size: 13px; color: var(--text-primary); vertical-align: middle; }
.video-cell { display: flex; align-items: center; gap: 8px; max-width: 240px; }
.thumb { width: 52px; height: 30px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
.video-title { font-size: 12px; color: var(--text-primary); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.channel-cell { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; }
.time-cell { white-space: nowrap; font-size: 12px; color: var(--text-secondary); }
.ratio-badge { font-size: 12px; font-weight: 600; color: var(--accent); }
.mono { font-family: var(--font-mono, monospace); }
.status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.status-sent { background: rgba(34,197,94,0.15); color: #4ade80; }
.status-pending { background: rgba(234,179,8,0.15); color: #fbbf24; }
.status-sending { background: rgba(56,189,248,0.15); color: #38bdf8; }
.status-failed { background: rgba(239,68,68,0.15); color: #f87171; }
.status-stuck { background: rgba(249,115,22,0.15); color: #fb923c; }
.stuck-tag { font-size: 10px; opacity: 0.8; }
.load-more-wrap { display: flex; justify-content: center; }
.btn-load-more { padding: 9px 24px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.btn-load-more:hover { background: var(--accent-subtle); color: var(--accent); }
.mobile-only { display: none; }
.desktop-only { display: block; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-box { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 14px; width: 100%; max-width: 600px; max-height: 85vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; background: var(--bg-surface); z-index: 1; }
.modal-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.modal-close { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 4px; transition: color 0.15s; }
.modal-close:hover { color: var(--text-primary); }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.modal-video-row { display: flex; gap: 14px; align-items: flex-start; }
.modal-thumb { width: 96px; height: 54px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.modal-video-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; line-height: 1.3; }
.modal-channel { font-size: 12px; color: var(--text-secondary); }
.modal-handle { color: var(--text-muted); }
.yt-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--accent); text-decoration: none; margin-top: 6px; }
.yt-link:hover { text-decoration: underline; }
.modal-group { background: var(--bg-surface-elevated); border-radius: 8px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.modal-group-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 2px; }
.modal-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.modal-key { font-size: 13px; color: var(--text-secondary); }
.modal-val { font-size: 13px; color: var(--text-primary); font-weight: 500; text-align: right; }
.modal-error-block { margin-top: 4px; padding: 10px 12px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 6px; }
.modal-error-text { font-size: 12px; color: #f87171; margin-top: 4px; word-break: break-word; }
@media (max-width: 900px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .desktop-only { display: none !important; }
  .mobile-only { display: flex; flex-direction: column; gap: 12px; }
  .mobile-card { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; cursor: pointer; transition: background 0.1s; }
  .mobile-card:active { background: var(--bg-surface-elevated); }
  .mobile-card-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
  .mobile-thumb { width: 60px; height: 34px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
  .mobile-card-info { flex: 1; min-width: 0; }
  .mobile-video-title { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .mobile-channel { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
  .mobile-card-body { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .mobile-stat { display: flex; flex-direction: column; gap: 2px; }
  .ms-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .ms-val { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .modal-box { max-height: 90vh; }
}
@media (max-width: 480px) {
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .filter-bar { flex-direction: column; }
  .filter-group { min-width: unset; width: 100%; }
}
</style>