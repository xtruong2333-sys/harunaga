import { isSupabaseConfigured, getSupabase } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import { sanitizeErrorSummary } from './data-health-service';
import type {
  AlertStatus,
  TimeFilterRange,
  AlertHistorySort,
  AlertHistorySummary,
  AlertHistoryItem,
  AlertHistoryFilter,
  AlertVideoGroup,
} from '../types/alert-history';

// ============================================================
// Helpers
// ============================================================

export function isValidTimestamp(val: string | null | undefined): boolean {
  if (!val) return false;
  const dt = new Date(val);
  return !isNaN(dt.getTime());
}

export function mapAlertStatus(status: string): string {
  switch (status) {
    case 'sent': return 'Đã cảnh báo';
    case 'pending': return 'Chờ gửi';
    case 'sending': return 'Đang gửi';
    case 'failed': return 'Gửi lỗi';
    default: return status;
  }
}

export function calculateThresholdRatio(
  measuredVph: number | null | undefined,
  thresholdVph: number | null | undefined
): number | null {
  if (thresholdVph === null || thresholdVph === undefined || thresholdVph <= 0) return null;
  if (measuredVph === null || measuredVph === undefined) return null;
  return measuredVph / thresholdVph;
}

export function calculateThresholdExcessRatio(
  measuredVph: number | null | undefined,
  thresholdVph: number | null | undefined
): number | null {
  if (thresholdVph === null || thresholdVph === undefined || thresholdVph <= 0) return null;
  if (measuredVph === null || measuredVph === undefined) return null;
  return (measuredVph - thresholdVph) / thresholdVph;
}

export function formatThresholdExcess(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return '—';
  const pct = Math.round(ratio * 100);
  if (pct > 0) return `+${pct}%`;
  if (pct === 0) return '0%';
  return `${pct}%`;
}

export function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined || !Number.isFinite(delta)) return '—';
  const rounded = Math.round(delta);
  if (rounded > 0) return `+${rounded.toLocaleString('vi-VN')}`;
  if (rounded === 0) return '0';
  return `-${Math.abs(rounded).toLocaleString('vi-VN')}`;
}

export function checkSendingStuck(
  status: string,
  updatedAt: string | null | undefined,
  nowMs = Date.now()
): boolean {
  if (status !== 'sending') return false;
  if (!isValidTimestamp(updatedAt)) return false;
  const updatedMs = new Date(updatedAt!).getTime();
  const diffMinutes = (nowMs - updatedMs) / 60000;
  return diffMinutes > 15;
}

export function formatElapsedSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export function getTimeFilterThreshold(range: TimeFilterRange, nowMs = Date.now()): string | null {
  if (range === 'all') return null;
  const hours = range === '24h' ? 24 : range === '7d' ? 168 : 720;
  const thresholdMs = nowMs - hours * 3600 * 1000;
  return new Date(thresholdMs).toISOString();
}

export function sanitizeAlertError(lastError: string | null): string | null {
  if (!lastError) return null;
  return sanitizeErrorSummary(lastError);
}

// ============================================================
// Fetch from Supabase
// ============================================================

interface RawAlertRow {
  id: string;
  video_id: string;
  threshold_vph: number;
  measured_vph: number;
  view_count: number;
  view_delta: number | null;
  elapsed_seconds: number | null;
  status: string;
  attempts: number;
  discord_message_id: string | null;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
  updated_at: string;
  videos: {
    id: string;
    title: string;
    youtube_video_id: string | null;
    thumbnail_url: string | null;
    latest_measured_vph: number | null;
    latest_view_count: number | null;
    channels: {
      id: string;
      name: string;
      handle: string | null;
      avatar_url: string | null;
    };
  };
}

function mapRawToItem(row: RawAlertRow): AlertHistoryItem {
  const status = row.status as AlertStatus;
  return {
    id: row.id,
    videoId: row.video_id,
    videoTitle: row.videos?.title ?? '(không rõ)',
    videoYoutubeId: row.videos?.youtube_video_id ?? null,
    videoThumbnailUrl: row.videos?.thumbnail_url ?? null,
    channelId: row.videos?.channels?.id ?? '',
    channelName: row.videos?.channels?.name ?? '(không rõ)',
    channelHandle: row.videos?.channels?.handle ?? null,
    channelAvatarUrl: row.videos?.channels?.avatar_url ?? null,
    thresholdVph: row.threshold_vph,
    measuredVph: row.measured_vph,
    viewCountAtAlert: row.view_count,
    viewDeltaAtAlert: row.view_delta,
    elapsedSeconds: row.elapsed_seconds,
    thresholdRatio: calculateThresholdRatio(row.measured_vph, row.threshold_vph),
    thresholdExcessRatio: calculateThresholdExcessRatio(row.measured_vph, row.threshold_vph),
    currentVph: row.videos?.latest_measured_vph ?? null,
    currentViewCount: row.videos?.latest_view_count ?? null,
    status,
    isSendingStuck: checkSendingStuck(row.status, row.updated_at),
    attempts: row.attempts,
    discordMessageId: row.discord_message_id,
    sanitizedLastError: sanitizeAlertError(row.last_error),
    createdAt: row.created_at,
    sentAt: row.sent_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchAlertHistory(limit = 50, offset = 0): Promise<AlertHistoryItem[]> {
  if (!isSupabaseConfigured()) throw new DatabaseNotConfiguredError();
  const supabase = getSupabase()!;

  const { data, error } = await supabase
    .from('video_alerts')
    .select(
      `id, video_id, threshold_vph, measured_vph, view_count, view_delta, elapsed_seconds,
       status, attempts, discord_message_id, last_error, created_at, sent_at, updated_at,
       videos(id, title, youtube_video_id, thumbnail_url, latest_measured_vph, latest_view_count,
         channels(id, name, handle, avatar_url))`
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawAlertRow[]).map(mapRawToItem);
}

export async function fetchAllAlertHistory(batchSize = 1000): Promise<AlertHistoryItem[]> {
  if (!isSupabaseConfigured()) throw new DatabaseNotConfiguredError();
  const supabase = getSupabase()!;
  const allRows: RawAlertRow[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('video_alerts')
      .select(
        `id, video_id, threshold_vph, measured_vph, view_count, view_delta, elapsed_seconds,
         status, attempts, discord_message_id, last_error, created_at, sent_at, updated_at,
         videos(id, title, youtube_video_id, thumbnail_url, latest_measured_vph, latest_view_count,
           channels(id, name, handle, avatar_url))`
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as RawAlertRow[];
    allRows.push(...rows);

    if (rows.length < batchSize) {
      hasMore = false;
    } else {
      offset += batchSize;
    }
  }

  return allRows.map(mapRawToItem);
}

export function computeAlertSummary(items: AlertHistoryItem[]): AlertHistorySummary {
  let sent = 0;
  let waiting = 0;
  let failed = 0;
  let stuckCount = 0;
  for (const item of items) {
    if (item.status === 'sent') sent++;
    else if (item.status === 'pending' || item.status === 'sending') waiting++;
    else if (item.status === 'failed') failed++;

    if (item.isSendingStuck) stuckCount++;
  }
  return { total: items.length, sent, waiting, failed, stuckCount };
}

// ============================================================
// Group Alerts by Video (for Video View Mode)
// ============================================================

export function groupAlertsByVideo(items: AlertHistoryItem[]): AlertVideoGroup[] {
  const groupsMap = new Map<string, AlertHistoryItem[]>();
  for (const item of items) {
    let list = groupsMap.get(item.videoId);
    if (!list) {
      list = [];
      groupsMap.set(item.videoId, list);
    }
    list.push(item);
  }

  const result: AlertVideoGroup[] = [];
  for (const [videoId, alertList] of groupsMap.entries()) {
    if (alertList.length === 0) continue;
    // Sort alerts by createdAt DESC to find latest alert
    const sorted = [...alertList].sort((a, b) => {
      const tA = isValidTimestamp(a.createdAt) ? new Date(a.createdAt).getTime() : 0;
      const tB = isValidTimestamp(b.createdAt) ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

    const latest = sorted[0];
    let maxMeasuredVph: number | null = null;
    for (const a of alertList) {
      if (a.measuredVph !== null && a.measuredVph !== undefined && Number.isFinite(a.measuredVph)) {
        if (maxMeasuredVph === null || a.measuredVph > maxMeasuredVph) {
          maxMeasuredVph = a.measuredVph;
        }
      }
    }

    result.push({
      videoId,
      videoTitle: latest.videoTitle,
      videoYoutubeId: latest.videoYoutubeId,
      videoThumbnailUrl: latest.videoThumbnailUrl,
      channelId: latest.channelId,
      channelName: latest.channelName,
      channelHandle: latest.channelHandle,
      alertCount: alertList.length,
      latestAlertAt: latest.createdAt,
      latestStatus: latest.status,
      maxMeasuredVph,
    });
  }

  // Sort by latestAlertAt DESC
  result.sort((a, b) => {
    const tA = isValidTimestamp(a.latestAlertAt) ? new Date(a.latestAlertAt).getTime() : 0;
    const tB = isValidTimestamp(b.latestAlertAt) ? new Date(b.latestAlertAt).getTime() : 0;
    return tB - tA;
  });

  return result;
}

// ============================================================
// Client-side filter + sort
// ============================================================

export function filterAndSortAlerts(
  items: AlertHistoryItem[],
  filter: AlertHistoryFilter,
  sort: AlertHistorySort
): AlertHistoryItem[] {
  let result = [...items];

  // Filter by videoId (deep link)
  if (filter.videoId) {
    result = result.filter(i => i.videoId === filter.videoId);
  }

  // Filter by status
  if (filter.status !== 'all') {
    result = result.filter(i => i.status === filter.status);
  }

  // Filter by stuckOnly
  if (filter.stuckOnly) {
    result = result.filter(i => i.isSendingStuck);
  }

  // Filter by time range (on createdAt)
  if (filter.range !== 'all') {
    const threshold = getTimeFilterThreshold(filter.range);
    if (threshold) {
      result = result.filter(i => i.createdAt >= threshold);
    }
  }

  // Filter by channel
  if (filter.channelId) {
    result = result.filter(i => i.channelId === filter.channelId);
  }

  // Full-text search (title, channel name, handle)
  if (filter.search && filter.search.trim()) {
    const q = filter.search.trim().toLowerCase();
    result = result.filter(
      i =>
        i.videoTitle.toLowerCase().includes(q) ||
        i.channelName.toLowerCase().includes(q) ||
        (i.channelHandle?.toLowerCase().includes(q) ?? false)
    );
  }

  // Sort
  switch (sort) {
    case 'vph_desc':
      result.sort((a, b) => {
        const vA = a.measuredVph ?? -Infinity;
        const vB = b.measuredVph ?? -Infinity;
        return vB - vA;
      });
      break;
    case 'views_desc':
      result.sort((a, b) => {
        const vA = a.viewCountAtAlert ?? -Infinity;
        const vB = b.viewCountAtAlert ?? -Infinity;
        return vB - vA;
      });
      break;
    case 'attempts_desc':
      result.sort((a, b) => (b.attempts ?? 0) - (a.attempts ?? 0));
      break;
    case 'newest':
    default:
      result.sort((a, b) => {
        const tA = isValidTimestamp(a.createdAt) ? new Date(a.createdAt).getTime() : -Infinity;
        const tB = isValidTimestamp(b.createdAt) ? new Date(b.createdAt).getTime() : -Infinity;
        return tB - tA;
      });
  }

  return result;
}

// ============================================================
// Service object
// ============================================================

export const alertHistoryService = {
  isValidTimestamp,
  mapAlertStatus,
  calculateThresholdRatio,
  calculateThresholdExcessRatio,
  formatThresholdExcess,
  formatDelta,
  checkSendingStuck,
  formatElapsedSeconds,
  getTimeFilterThreshold,
  sanitizeAlertError,
  fetchAlertHistory,
  fetchAllAlertHistory,
  computeAlertSummary,
  groupAlertsByVideo,
  filterAndSortAlerts,
};
