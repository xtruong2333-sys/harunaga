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
} from '../types/alert-history';

// ============================================================
// Helpers
// ============================================================

export function mapAlertStatus(status: string): string {
  switch (status) {
    case 'sent': return 'Đã gửi';
    case 'pending': return 'Đang chờ';
    case 'sending': return 'Đang gửi';
    case 'failed': return 'Gửi lỗi';
    default: return status;
  }
}

export function calculateThresholdRatio(measuredVph: number, thresholdVph: number): number | null {
  if (!thresholdVph || thresholdVph <= 0) return null;
  return measuredVph / thresholdVph;
}

export function checkSendingStuck(status: string, updatedAt: string): boolean {
  if (status !== 'sending') return false;
  const updatedMs = new Date(updatedAt).getTime();
  const nowMs = Date.now();
  const diffMinutes = (nowMs - updatedMs) / 60000;
  return diffMinutes > 15;
}

export function formatElapsedSeconds(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export function getTimeFilterThreshold(range: TimeFilterRange): string | null {
  if (range === 'all') return null;
  const now = new Date();
  const hours = range === '24h' ? 24 : range === '7d' ? 168 : 720;
  now.setHours(now.getHours() - hours);
  return now.toISOString();
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
  const supabase = getSupabase()!

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

export function computeAlertSummary(items: AlertHistoryItem[]): AlertHistorySummary {
  let sent = 0;
  let waiting = 0;
  let failed = 0;
  for (const item of items) {
    if (item.status === 'sent') sent++;
    else if (item.status === 'pending' || item.status === 'sending') waiting++;
    else if (item.status === 'failed') failed++;
  }
  return { total: items.length, sent, waiting, failed };
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

  // Filter by time range
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
  if (filter.search.trim()) {
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
      result.sort((a, b) => b.measuredVph - a.measuredVph);
      break;
    case 'views_desc':
      result.sort((a, b) => b.viewCountAtAlert - a.viewCountAtAlert);
      break;
    case 'attempts_desc':
      result.sort((a, b) => b.attempts - a.attempts);
      break;
    case 'newest':
    default:
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return result;
}

// ============================================================
// Service object
// ============================================================

export const alertHistoryService = {
  mapAlertStatus,
  calculateThresholdRatio,
  checkSendingStuck,
  formatElapsedSeconds,
  getTimeFilterThreshold,
  sanitizeAlertError,
  fetchAlertHistory,
  computeAlertSummary,
  filterAndSortAlerts,
};
