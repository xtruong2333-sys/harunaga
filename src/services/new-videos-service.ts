// Service Layer: new-videos-service.ts
// Quản lý dữ liệu Video Mới Đăng (Giai đoạn 14)
// TUYỆT ĐỐI READ-ONLY: Không mutation, không gọi Edge Function.
// Không tự tính VPH từ views / age. Không dự đoán viral.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import type {
  NewVideoRange,
  NewVideoStatus,
  NewVideoSort,
  NewVideoItem,
  NewVideoSummary,
  NewVideoFilter,
  AlertDisplayStatus,
} from '@/types/new-videos';

// ============================================================
// Time & Age Helpers
// ============================================================

export function getPublishedThreshold(range: NewVideoRange, now = Date.now()): string {
  let msAgo = 24 * 3600 * 1000;
  switch (range) {
    case '6h':
      msAgo = 6 * 3600 * 1000;
      break;
    case '12h':
      msAgo = 12 * 3600 * 1000;
      break;
    case '24h':
      msAgo = 24 * 3600 * 1000;
      break;
    case '3d':
      msAgo = 3 * 24 * 3600 * 1000;
      break;
    case '7d':
      msAgo = 7 * 24 * 3600 * 1000;
      break;
  }
  return new Date(now - msAgo).toISOString();
}

export function formatVideoAge(publishedAt: string, now = Date.now()): string {
  const diffMs = now - new Date(publishedAt).getTime();
  if (diffMs < 0) return 'Vừa xong';
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(diffMs / (3600 * 1000));
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(diffMs / (24 * 3600 * 1000));
  return `${days} ngày trước`;
}

export function getFreshBadge(publishedAt: string, now = Date.now()): string | null {
  const diffMs = now - new Date(publishedAt).getTime();
  if (diffMs <= 3600 * 1000) {
    return 'Vừa đăng';
  }
  if (diffMs <= 6 * 3600 * 1000) {
    return 'Mới < 6 giờ';
  }
  return null;
}

export function formatMeasuredVph(vph: number | null | undefined): string {
  if (vph === null || vph === undefined) {
    return 'Chưa đủ dữ liệu';
  }
  if (vph === 0) {
    return '0 VPH';
  }
  return `${vph.toLocaleString('vi-VN')} VPH`;
}

export function formatViewDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) {
    return '—';
  }
  if (delta > 0) {
    return `+${delta.toLocaleString('vi-VN')}`;
  }
  return delta.toLocaleString('vi-VN');
}

export function mapAlertStatus(status: string | null | undefined): string {
  switch (status) {
    case 'pending':
      return 'Chờ gửi';
    case 'sending':
      return 'Đang gửi';
    case 'sent':
      return 'Đã cảnh báo';
    case 'failed':
      return 'Gửi lỗi';
    default:
      return 'Chưa cảnh báo';
  }
}

export function calculateFirstObservedMinutes(
  publishedAt: string,
  firstCheckedAt: string | null | undefined
): number | null {
  if (!firstCheckedAt || !publishedAt) return null;
  const pubTime = new Date(publishedAt).getTime();
  const checkTime = new Date(firstCheckedAt).getTime();
  const diffMs = checkTime - pubTime;
  if (diffMs < 0 || isNaN(diffMs)) return null;
  return Math.floor(diffMs / 60000);
}

// ============================================================
// Summary Computation
// ============================================================

export function computeNewVideoSummary(videos: NewVideoItem[]): NewVideoSummary {
  const totalVideos = videos.length;
  const uniqueChannels = new Set<string>();
  let risingVideos = 0;
  let maxVph: number | null = null;

  for (const v of videos) {
    if (v.channelId) {
      uniqueChannels.add(v.channelId);
    }
    if (v.latestMeasuredVph !== null && v.latestMeasuredVph > 0) {
      risingVideos++;
    }
    if (v.latestMeasuredVph !== null) {
      if (maxVph === null || v.latestMeasuredVph > maxVph) {
        maxVph = v.latestMeasuredVph;
      }
    }
  }

  return {
    totalVideos,
    totalChannels: uniqueChannels.size,
    risingVideos,
    maxVph,
  };
}

// ============================================================
// Client-side Filter & Sort
// ============================================================

export function filterNewVideos(videos: NewVideoItem[], filter: NewVideoFilter): NewVideoItem[] {
  let result = [...videos];

  // Lọc theo kênh
  if (filter.channelId) {
    result = result.filter(v => v.channelId === filter.channelId);
  }

  // Lọc theo trạng thái đo / cảnh báo
  if (filter.status !== 'all') {
    switch (filter.status) {
      case 'rising':
        result = result.filter(v => v.latestMeasuredVph !== null && v.latestMeasuredVph > 0);
        break;
      case 'not_rising':
        result = result.filter(v => v.latestMeasuredVph === 0);
        break;
      case 'unmeasured':
        result = result.filter(v => v.latestMeasuredVph === null);
        break;
      case 'alerted':
        result = result.filter(v => v.hasAlert);
        break;
    }
  }

  // Tìm kiếm theo từ khóa (tiêu đề, tên kênh, handle)
  if (filter.search.trim()) {
    const q = filter.search.trim().toLowerCase();
    result = result.filter(
      v =>
        v.title.toLowerCase().includes(q) ||
        v.channelName.toLowerCase().includes(q) ||
        (v.channelHandle ? v.channelHandle.toLowerCase().includes(q) : false)
    );
  }

  return result;
}

function sortWithNullsLast(a: number | null, b: number | null, desc = true): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return desc ? b - a : a - b;
}

export function sortNewVideos(videos: NewVideoItem[], sort: NewVideoSort): NewVideoItem[] {
  const result = [...videos];

  switch (sort) {
    case 'vph_desc':
      result.sort((a, b) => sortWithNullsLast(a.latestMeasuredVph, b.latestMeasuredVph, true));
      break;
    case 'views_desc':
      result.sort((a, b) => sortWithNullsLast(a.latestViewCount, b.latestViewCount, true));
      break;
    case 'delta_desc':
      result.sort((a, b) => sortWithNullsLast(a.latestViewDelta, b.latestViewDelta, true));
      break;
    case 'newest':
    default:
      result.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      break;
  }

  return result;
}

// ============================================================
// URL Parsing & Safe Fallback
// ============================================================

export function parseUrlParams(query: Record<string, any>): {
  range: NewVideoRange;
  channelId: string | null;
  status: NewVideoStatus;
  sort: NewVideoSort;
  search: string;
} {
  const validRanges: NewVideoRange[] = ['6h', '12h', '24h', '3d', '7d'];
  const validStatuses: NewVideoStatus[] = ['all', 'rising', 'not_rising', 'unmeasured', 'alerted'];
  const validSorts: NewVideoSort[] = ['newest', 'vph_desc', 'views_desc', 'delta_desc'];

  const rangeStr = typeof query.range === 'string' ? query.range : '';
  const range: NewVideoRange = validRanges.includes(rangeStr as NewVideoRange)
    ? (rangeStr as NewVideoRange)
    : '24h';

  const statusStr = typeof query.status === 'string' ? query.status : '';
  const status: NewVideoStatus = validStatuses.includes(statusStr as NewVideoStatus)
    ? (statusStr as NewVideoStatus)
    : 'all';

  const sortStr = typeof query.sort === 'string' ? query.sort : '';
  const sort: NewVideoSort = validSorts.includes(sortStr as NewVideoSort)
    ? (sortStr as NewVideoSort)
    : 'newest';

  const channelId =
    typeof query.channel === 'string' && query.channel.trim().length > 0
      ? query.channel.trim()
      : null;

  const search = typeof query.search === 'string' ? query.search : '';

  return { range, channelId, status, sort, search };
}

// ============================================================
// Supabase Data Fetching (READ-ONLY)
// ============================================================

interface RawVideoData {
  id: string;
  youtube_video_id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
  latest_view_count: number | null;
  latest_measured_vph: number | null;
  latest_view_delta: number | null;
  latest_snapshot_checked_at: string | null;
  first_snapshot_checked_at: string | null;
  created_at: string;
  updated_at: string;
  channels: {
    id: string;
    name: string;
    handle: string | null;
    avatar_url: string | null;
  } | null;
  video_alerts: {
    id: string;
    status: string;
    measured_vph: number;
    sent_at: string | null;
  }[] | null;
}

export async function fetchNewVideos(
  range: NewVideoRange = '24h',
  limit = 100,
  offset = 0
): Promise<{ videos: NewVideoItem[]; hasMore: boolean }> {
  if (!isSupabaseConfigured()) {
    throw new DatabaseNotConfiguredError();
  }

  const supabase = getSupabase()!;
  const thresholdIso = getPublishedThreshold(range);

  // 1. Query videos trong khung thời gian published_at đã chọn kèm cached snapshot metadata
  const { data: rawVideos, error: videoError } = await supabase
    .from('videos')
    .select(
      `id, youtube_video_id, channel_id, title, thumbnail_url, published_at,
       latest_view_count, latest_measured_vph, latest_view_delta, latest_snapshot_checked_at, first_snapshot_checked_at,
       created_at, updated_at,
       channels(id, name, handle, avatar_url),
       video_alerts(id, status, measured_vph, sent_at)`
    )
    .gte('published_at', thresholdIso)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit);

  if (videoError) {
    throw new Error(`Lỗi tải video mới đăng: ${videoError.message}`);
  }

  const videoRows = (rawVideos ?? []) as unknown as RawVideoData[];
  const hasMore = videoRows.length > limit;
  const slicedRows = hasMore ? videoRows.slice(0, limit) : videoRows;

  if (slicedRows.length === 0) {
    return { videos: [], hasMore: false };
  }

  // 2. Ghép nối dữ liệu thành NewVideoItem từ các trường cached (Không query video_snapshots)
  const items: NewVideoItem[] = slicedRows.map(row => {
    // Alert mapping
    let alertStatus: AlertDisplayStatus = 'none';
    let hasAlert = false;

    if (row.video_alerts && row.video_alerts.length > 0) {
      const alert = row.video_alerts[0];
      hasAlert = true;
      if (alert.status === 'sent') alertStatus = 'sent';
      else if (alert.status === 'pending') alertStatus = 'pending';
      else if (alert.status === 'sending') alertStatus = 'sending';
      else if (alert.status === 'failed') alertStatus = 'failed';
    }

    const firstObservedMinutes = calculateFirstObservedMinutes(
      row.published_at,
      row.first_snapshot_checked_at
    );

    return {
      id: row.id,
      youtubeVideoId: row.youtube_video_id,
      title: row.title,
      thumbnailUrl: row.thumbnail_url,
      publishedAt: row.published_at,
      channelId: row.channel_id,
      channelName: row.channels?.name ?? '(Kênh không rõ)',
      channelHandle: row.channels?.handle ?? null,
      channelAvatarUrl: row.channels?.avatar_url ?? null,
      latestViewCount: row.latest_view_count !== null ? Number(row.latest_view_count) : null,
      latestMeasuredVph: row.latest_measured_vph !== null ? Number(row.latest_measured_vph) : null,
      latestViewDelta: row.latest_view_delta !== null && row.latest_view_delta !== undefined ? Number(row.latest_view_delta) : null,
      latestSnapshotCheckedAt: row.latest_snapshot_checked_at ?? null,
      firstSnapshotCheckedAt: row.first_snapshot_checked_at ?? null,
      firstObservedMinutesAfterPublish: firstObservedMinutes,
      alertStatus,
      hasAlert,
    };
  });

  return { videos: items, hasMore };
}

// ============================================================
// Service Export
// ============================================================

export const newVideosService = {
  getPublishedThreshold,
  formatVideoAge,
  getFreshBadge,
  formatMeasuredVph,
  formatViewDelta,
  mapAlertStatus,
  calculateFirstObservedMinutes,
  computeNewVideoSummary,
  filterNewVideos,
  sortNewVideos,
  parseUrlParams,
  fetchNewVideos,
};
