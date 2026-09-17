// Service Layer: publishing-schedule-service.ts
// Quản lý dữ liệu Lịch Đăng Của Đối Thủ (Giai đoạn 15)
// TUYỆT ĐỐI READ-ONLY: Không mutation, không gọi Edge Function.
// Thuần túy mô tả lịch sử thực tế, không đưa ra dự đoán hay khuyến nghị giờ đăng.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import type {
  PublishingRange,
  VietnamDateParts,
  PublishingVideo,
  PublishingScheduleSummary,
  PublishingHeatmapCell,
  PublishingDistributionItem,
  ChannelPublishingStats,
} from '@/types/publishing-schedule';

export const WEEKDAY_NAMES = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật',
];

const WEEKDAY_MAP: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

// ============================================================
// Timezone & Date Helpers (Asia/Ho_Chi_Minh UTC+7)
// ============================================================

const vnFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Ho_Chi_Minh',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function toVietnamDateParts(isoString: string): VietnamDateParts {
  const dt = new Date(isoString);
  const parts = vnFormatter.formatToParts(dt);

  let year = 1970;
  let month = 1;
  let day = 1;
  let weekdayShort = 'Mon';
  let hour = 0;
  let minute = 0;

  for (const p of parts) {
    if (p.type === 'year') year = parseInt(p.value, 10);
    else if (p.type === 'month') month = parseInt(p.value, 10);
    else if (p.type === 'day') day = parseInt(p.value, 10);
    else if (p.type === 'weekday') weekdayShort = p.value;
    else if (p.type === 'hour') hour = parseInt(p.value, 10);
    else if (p.type === 'minute') minute = parseInt(p.value, 10);
  }

  // Handle midnight 24 edge case in some Intl implementations
  if (hour === 24) hour = 0;

  const weekdayIndex = WEEKDAY_MAP[weekdayShort] ?? 0;
  const weekdayName = WEEKDAY_NAMES[weekdayIndex];

  const mmStr = month < 10 ? `0${month}` : `${month}`;
  const ddStr = day < 10 ? `0${day}` : `${day}`;
  const hhStr = hour < 10 ? `0${hour}` : `${hour}`;
  const minStr = minute < 10 ? `0${minute}` : `${minute}`;

  const dateStr = `${year}-${mmStr}-${ddStr}`;
  const formatted = `${hhStr}:${minStr} ${ddStr}/${mmStr}/${year}`;

  return {
    year,
    month,
    day,
    weekdayIndex,
    weekdayName,
    hour,
    minute,
    dateStr,
    formatted,
  };
}

export function getRangeThreshold(range: PublishingRange, now = Date.now()): string | null {
  switch (range) {
    case '7d':
      return new Date(now - 7 * 24 * 3600 * 1000).toISOString();
    case '30d':
      return new Date(now - 30 * 24 * 3600 * 1000).toISOString();
    case '90d':
      return new Date(now - 90 * 24 * 3600 * 1000).toISOString();
    case 'all':
    default:
      return null;
  }
}

export function formatRelativeTime(isoString: string | null, now = Date.now()): string {
  if (!isoString) return '—';
  const diffMs = now - new Date(isoString).getTime();
  if (diffMs < 0) return 'Vừa xong';
  const mins = Math.floor(diffMs / (60 * 1000));
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(diffMs / (3600 * 1000));
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(diffMs / (24 * 3600 * 1000));
  return `${days} ngày trước`;
}

// ============================================================
// Interval Calculations (Average & Median)
// ============================================================

export function calculateAverageInterval(ascTimestampsMs: number[]): number | null {
  if (ascTimestampsMs.length < 2) return null;
  let totalDeltaHours = 0;
  for (let i = 0; i < ascTimestampsMs.length - 1; i++) {
    const deltaHours = (ascTimestampsMs[i + 1] - ascTimestampsMs[i]) / (3600 * 1000);
    totalDeltaHours += deltaHours;
  }
  return totalDeltaHours / (ascTimestampsMs.length - 1);
}

export function calculateMedianInterval(ascTimestampsMs: number[]): number | null {
  if (ascTimestampsMs.length < 2) return null;
  const deltas: number[] = [];
  for (let i = 0; i < ascTimestampsMs.length - 1; i++) {
    const deltaHours = (ascTimestampsMs[i + 1] - ascTimestampsMs[i]) / (3600 * 1000);
    deltas.push(deltaHours);
  }
  deltas.sort((a, b) => a - b);
  const m = deltas.length;
  if (m % 2 === 1) {
    return deltas[Math.floor(m / 2)];
  }
  return (deltas[m / 2 - 1] + deltas[m / 2]) / 2;
}

export function formatInterval(hours: number | null): string {
  if (hours === null || hours === undefined) return '—';
  if (hours < 24) {
    const rounded = Math.round(hours * 10) / 10;
    return `${rounded.toLocaleString('vi-VN')} giờ`;
  }
  const days = hours / 24;
  const roundedDays = Math.round(days * 10) / 10;
  return `${roundedDays.toLocaleString('vi-VN')} ngày`;
}

// ============================================================
// Peak Bucket Finder
// ============================================================

export function findPeakBuckets(items: { label: string; count: number }[]): string {
  if (items.length === 0) return '—';
  const maxCount = Math.max(...items.map(i => i.count));
  if (maxCount === 0) return '—';
  const matches = items.filter(i => i.count === maxCount);
  const labels = matches.map(m => m.label).join(', ');
  return `${labels} — ${maxCount.toLocaleString('vi-VN')} video`;
}

// ============================================================
// Aggregations: Heatmap, Weekday, Hour, Summary
// ============================================================

export function buildPublishingHeatmap(videos: PublishingVideo[]): {
  cells: PublishingHeatmapCell[][];
  maxCount: number;
} {
  // 7 rows x 24 cols
  const cells: PublishingHeatmapCell[][] = [];
  for (let w = 0; w < 7; w++) {
    const row: PublishingHeatmapCell[] = [];
    for (let h = 0; h < 24; h++) {
      row.push({
        weekday: w,
        weekdayName: WEEKDAY_NAMES[w],
        hour: h,
        count: 0,
      });
    }
    cells.push(row);
  }

  let maxCount = 0;
  for (const v of videos) {
    if (v.vnWeekday >= 0 && v.vnWeekday < 7 && v.vnHour >= 0 && v.vnHour < 24) {
      cells[v.vnWeekday][v.vnHour].count++;
      if (cells[v.vnWeekday][v.vnHour].count > maxCount) {
        maxCount = cells[v.vnWeekday][v.vnHour].count;
      }
    }
  }

  return { cells, maxCount };
}

export function computeWeekdayDistribution(videos: PublishingVideo[]): PublishingDistributionItem[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const v of videos) {
    if (v.vnWeekday >= 0 && v.vnWeekday < 7) {
      counts[v.vnWeekday]++;
    }
  }

  const total = videos.length;
  return counts.map((count, index) => ({
    label: WEEKDAY_NAMES[index],
    count,
    percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
  }));
}

export function computeHourlyDistribution(videos: PublishingVideo[]): PublishingDistributionItem[] {
  const counts = new Array(24).fill(0);
  for (const v of videos) {
    if (v.vnHour >= 0 && v.vnHour < 24) {
      counts[v.vnHour]++;
    }
  }

  const total = videos.length;
  return counts.map((count, hour) => {
    const hhStr = hour < 10 ? `0${hour}` : `${hour}`;
    return {
      label: `${hhStr}:00`,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });
}

export function computeScheduleSummary(
  videos: PublishingVideo[],
  range: PublishingRange,
  now = Date.now()
): PublishingScheduleSummary {
  const totalVideos = videos.length;
  const channelSet = new Set<string>();
  let latestPublishedAt: string | null = null;
  let earliestMs: number | null = null;

  for (const v of videos) {
    if (v.channelId) channelSet.add(v.channelId);
    if (!latestPublishedAt || v.publishedAt > latestPublishedAt) {
      latestPublishedAt = v.publishedAt;
    }
    const ms = new Date(v.publishedAt).getTime();
    if (earliestMs === null || ms < earliestMs) {
      earliestMs = ms;
    }
  }

  let avgVideosPerDay: number | null = null;
  if (totalVideos > 0) {
    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '30d') days = 30;
    else if (range === '90d') days = 90;
    else if (range === 'all') {
      if (earliestMs !== null) {
        days = Math.max(1, Math.ceil((now - earliestMs) / (24 * 3600 * 1000)));
      }
    }
    avgVideosPerDay = Math.round((totalVideos / days) * 10) / 10;
  }

  return {
    totalVideos,
    totalChannels: channelSet.size,
    avgVideosPerDay,
    latestPublishedAt,
  };
}

// ============================================================
// Channel Publishing Stats Computation
// ============================================================

export function computeChannelPublishingStats(
  allVideos: PublishingVideo[],
  rangeVideos: PublishingVideo[],
  now = Date.now()
): ChannelPublishingStats[] {
  const threshold7d = now - 7 * 24 * 3600 * 1000;
  const threshold30d = now - 30 * 24 * 3600 * 1000;

  // 1. Group all videos by channel to compute full interval & rolling counts
  const allByChannel = new Map<string, PublishingVideo[]>();
  for (const v of allVideos) {
    let list = allByChannel.get(v.channelId);
    if (!list) {
      list = [];
      allByChannel.set(v.channelId, list);
    }
    list.push(v);
  }

  // 2. Group range videos by channel
  const rangeByChannel = new Map<string, PublishingVideo[]>();
  for (const v of rangeVideos) {
    let list = rangeByChannel.get(v.channelId);
    if (!list) {
      list = [];
      rangeByChannel.set(v.channelId, list);
    }
    list.push(v);
  }

  // Collect all unique channels from range or allVideos
  const channelIds = Array.from(allByChannel.keys());
  const statsList: ChannelPublishingStats[] = [];

  for (const chId of channelIds) {
    const chAllVideos = allByChannel.get(chId) ?? [];
    const chRangeVideos = rangeByChannel.get(chId) ?? [];

    if (chAllVideos.length === 0) continue;

    const first = chAllVideos[0];
    const channelName = first.channelName;
    const channelHandle = first.channelHandle;
    const channelAvatarUrl = first.channelAvatarUrl;
    const channelStatus = first.channelStatus;

    // Rolling counts
    let count7d = 0;
    let count30d = 0;
    let latestPublishedAt: string | null = null;

    // Timestamps for intervals
    const timestampsMs: number[] = [];

    for (const v of chAllVideos) {
      const ms = new Date(v.publishedAt).getTime();
      timestampsMs.push(ms);

      if (ms >= threshold7d) count7d++;
      if (ms >= threshold30d) count30d++;
      if (!latestPublishedAt || v.publishedAt > latestPublishedAt) {
        latestPublishedAt = v.publishedAt;
      }
    }

    // Sort ascending for intervals
    timestampsMs.sort((a, b) => a - b);
    const avgInterval = calculateAverageInterval(timestampsMs);
    const medianInterval = calculateMedianInterval(timestampsMs);

    // Peak weekday & peak hour in selected range ONLY (no fallback to chAllVideos)
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    const hourCounts = new Array(24).fill(0);

    for (const v of chRangeVideos) {
      weekdayCounts[v.vnWeekday]++;
      hourCounts[v.vnHour]++;
    }

    // Peak weekday
    const maxWCount = Math.max(...weekdayCounts);
    let peakWeekday = '—';
    if (maxWCount > 0) {
      const wMatches = weekdayCounts
        .map((cnt, idx) => (cnt === maxWCount ? WEEKDAY_NAMES[idx] : null))
        .filter(Boolean) as string[];
      peakWeekday = wMatches.join(', ');
    }

    // Peak hour
    const maxHCount = Math.max(...hourCounts);
    let peakHour = '—';
    if (maxHCount > 0) {
      const hMatches = hourCounts
        .map((cnt, idx) => {
          if (cnt === maxHCount) {
            const hhStr = idx < 10 ? `0${idx}` : `${idx}`;
            return `${hhStr}:00–${hhStr}:59`;
          }
          return null;
        })
        .filter(Boolean) as string[];
      peakHour = hMatches.join(', ');
    }

    statsList.push({
      channelId: chId,
      channelName,
      channelHandle,
      channelAvatarUrl,
      channelStatus,
      videoCountInRange: chRangeVideos.length,
      videoCount7d: count7d,
      videoCount30d: count30d,
      latestPublishedAt,
      avgIntervalHours: avgInterval,
      medianIntervalHours: medianInterval,
      peakWeekday,
      peakHour,
    });
  }

  // Sort channels by videoCountInRange DESC, then channelName ASC
  statsList.sort((a, b) => {
    if (b.videoCountInRange !== a.videoCountInRange) {
      return b.videoCountInRange - a.videoCountInRange;
    }
    return a.channelName.localeCompare(b.channelName);
  });

  return statsList;
}

// ============================================================
// URL Parsing & Safe Fallback
// ============================================================

export function parseUrlParams(query: Record<string, any>): {
  range: PublishingRange;
  channelId: string | null;
} {
  const validRanges: PublishingRange[] = ['7d', '30d', '90d', 'all'];
  const rangeStr = typeof query.range === 'string' ? query.range : '';
  const range: PublishingRange = validRanges.includes(rangeStr as PublishingRange)
    ? (rangeStr as PublishingRange)
    : '30d';

  const channelId =
    typeof query.channel === 'string' && query.channel.trim().length > 0
      ? query.channel.trim()
      : null;

  return { range, channelId };
}

// ============================================================
// Supabase Data Fetching with Batch Pagination (>1000 safe)
// ============================================================

interface RawVideoRow {
  id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string | null;
  youtube_video_id: string;
  published_at: string;
  channels: {
    id: string;
    name: string;
    handle: string | null;
    avatar_url: string | null;
    status: string;
  } | null;
}

export async function fetchPublishingSchedule(
  range: PublishingRange = '30d',
  channelId: string | null = null
): Promise<{ rangeVideos: PublishingVideo[]; allVideos: PublishingVideo[] }> {
  if (!isSupabaseConfigured()) {
    throw new DatabaseNotConfiguredError();
  }

  const supabase = getSupabase()!;
  const thresholdIso = getRangeThreshold(range);

  // Pagination loop to fetch all videos without hitting the 1000-row cap
  const BATCH_SIZE = 1000;
  let offset = 0;
  let hasMore = true;
  const rawAllRows: RawVideoRow[] = [];

  while (hasMore) {
    let query = supabase
      .from('videos')
      .select(
        `id, channel_id, title, thumbnail_url, youtube_video_id, published_at,
         channels(id, name, handle, avatar_url, status)`
      )
      .order('published_at', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Lỗi tải dữ liệu lịch đăng: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as RawVideoRow[];
    rawAllRows.push(...rows);

    if (rows.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      offset += BATCH_SIZE;
    }
  }

  // Map to PublishingVideo objects with Vietnam date parts precomputed
  const allVideos: PublishingVideo[] = rawAllRows.map(row => {
    const vn = toVietnamDateParts(row.published_at);
    return {
      id: row.id,
      channelId: row.channel_id,
      channelName: row.channels?.name ?? '(Kênh không rõ)',
      channelHandle: row.channels?.handle ?? null,
      channelAvatarUrl: row.channels?.avatar_url ?? null,
      channelStatus: row.channels?.status ?? 'active',
      title: row.title,
      thumbnailUrl: row.thumbnail_url,
      youtubeVideoId: row.youtube_video_id,
      publishedAt: row.published_at,
      vnDate: vn.dateStr,
      vnWeekday: vn.weekdayIndex,
      vnWeekdayName: vn.weekdayName,
      vnHour: vn.hour,
      vnFormatted: vn.formatted,
    };
  });

  // Filter for selected range
  const rangeVideos = thresholdIso
    ? allVideos.filter(v => v.publishedAt >= thresholdIso)
    : allVideos;

  return { rangeVideos, allVideos };
}

// ============================================================
// Service Export
// ============================================================

export const publishingScheduleService = {
  WEEKDAY_NAMES,
  toVietnamDateParts,
  getRangeThreshold,
  formatRelativeTime,
  calculateAverageInterval,
  calculateMedianInterval,
  formatInterval,
  findPeakBuckets,
  buildPublishingHeatmap,
  computeWeekdayDistribution,
  computeHourlyDistribution,
  computeScheduleSummary,
  computeChannelPublishingStats,
  parseUrlParams,
  fetchPublishingSchedule,
};
