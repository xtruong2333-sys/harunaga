// src/services/channel-comparison-service.ts
// Service Layer cho tính năng So Sánh Kênh (Phase 12)
// 100% READ ONLY từ Supabase application tables.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import type {
  ComparisonTimeWindow,
  ComparableChannelOption,
  ChannelComparisonItem,
  ChannelComparisonMetrics,
  ChannelPublishingMetrics,
  ChannelComparisonVideo,
  ChannelComparisonTrendPoint,
  ChannelComparisonData,
} from '@/types/channel-comparison';
import { COMPARISON_PALETTE } from '@/types/channel-comparison';
import { fetchAllBatches } from './query-pagination';

/**
 * Chuyển đổi giá trị sang finite number an toàn hoặc null
 */
export function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Định dạng biến động lượt xem delta (+500, 0, -500, —)
 */
export function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return '—';
  if (delta > 0) return `+${delta.toLocaleString('vi-VN')}`;
  if (delta === 0) return '0';
  return delta.toLocaleString('vi-VN');
}

/**
 * Tính toán nhịp đăng đối chiếu (Publishing Rhythm) từ toàn bộ video của kênh
 */
export function computePublishingMetrics(
  videos: Array<{ published_at: string | null }>,
  nowMs: number = Date.now()
): ChannelPublishingMetrics {
  const validVideos = videos.filter(v => Boolean(v.published_at));
  const sampleCount = validVideos.length;

  const ms7d = nowMs - 7 * 24 * 60 * 60 * 1000;
  const ms30d = nowMs - 30 * 24 * 60 * 60 * 1000;

  let publishedLast7d = 0;
  let publishedLast30d = 0;

  for (const v of validVideos) {
    const t = new Date(v.published_at!).getTime();
    if (t >= ms7d) publishedLast7d++;
    if (t >= ms30d) publishedLast30d++;
  }

  // Guard: if sampleCount < 3, insufficient data for reliable cadence insights
  if (sampleCount < 3) {
    return {
      publishedLast7d,
      publishedLast30d,
      avgDaysBetweenPosts: null,
      mostCommonWeekday: 'Chưa đủ dữ liệu',
      commonHourWindow: 'Chưa đủ dữ liệu',
      sampleCount,
    };
  }

  // Sort timestamps ascending to calculate intervals
  const sortedTimes = validVideos
    .map(v => new Date(v.published_at!).getTime())
    .sort((a, b) => a - b);

  let totalDiffMs = 0;
  for (let i = 1; i < sortedTimes.length; i++) {
    totalDiffMs += (sortedTimes[i] - sortedTimes[i - 1]);
  }
  const avgDays = (totalDiffMs / (sortedTimes.length - 1)) / (24 * 60 * 60 * 1000);
  const avgDaysBetweenPosts = Math.round(avgDays * 10) / 10;

  // Most common weekday
  const weekdayCounts: Record<number, number> = {};
  const hourCounts: Record<string, number> = {};

  const weekdayNames: Record<number, string> = {
    0: 'CN',
    1: 'T2',
    2: 'T3',
    3: 'T4',
    4: 'T5',
    5: 'T6',
    6: 'T7',
  };

  const getHourWindowLabel = (h: number): string => {
    if (h < 3) return '00–03h';
    if (h < 6) return '03–06h';
    if (h < 9) return '06–09h';
    if (h < 12) return '09–12h';
    if (h < 15) return '12–15h';
    if (h < 18) return '15–18h';
    if (h < 21) return '18–21h';
    return '21–24h';
  };

  for (const v of validVideos) {
    const d = new Date(v.published_at!);
    const day = d.getDay();
    weekdayCounts[day] = (weekdayCounts[day] || 0) + 1;

    const win = getHourWindowLabel(d.getHours());
    hourCounts[win] = (hourCounts[win] || 0) + 1;
  }

  let bestDay = 0;
  let maxDayCount = -1;
  for (const [dayStr, count] of Object.entries(weekdayCounts)) {
    const d = Number(dayStr);
    if (count > maxDayCount) {
      maxDayCount = count;
      bestDay = d;
    }
  }

  let bestHourWindow = '18–21h';
  let maxHourCount = -1;
  for (const [win, count] of Object.entries(hourCounts)) {
    if (count > maxHourCount) {
      maxHourCount = count;
      bestHourWindow = win;
    }
  }

  return {
    publishedLast7d,
    publishedLast30d,
    avgDaysBetweenPosts,
    mostCommonWeekday: weekdayNames[bestDay] || 'Chưa đủ dữ liệu',
    commonHourWindow: bestHourWindow,
    sampleCount,
  };
}

/**
 * Tính toán mốc thời gian dựa trên window lọc (published_at boundary)
 */
export function getTimeWindowThreshold(
  window: ComparisonTimeWindow,
  nowMs: number = Date.now()
): Date | null {
  switch (window) {
    case '24h':
      return new Date(nowMs - 24 * 60 * 60 * 1000);
    case '3d':
      return new Date(nowMs - 3 * 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(nowMs - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(nowMs - 30 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
}

/**
 * Định dạng thời gian tương đối tiếng Việt
 */
export function formatRelativeTime(isoDate: string | null, nowMs: number = Date.now()): string {
  if (!isoDate) return 'Chưa có';
  try {
    const timeMs = new Date(isoDate).getTime();
    const diffMs = nowMs - timeMs;
    if (diffMs < 0) return 'Vừa xong';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Vừa xong';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  } catch {
    return isoDate;
  }
}

/**
 * Ánh xạ trạng thái cảnh báo sang nhãn tiếng Việt
 */
export function mapAlertStatus(
  status: string | null | undefined
): { alertStatus: ChannelComparisonVideo['alertStatus']; label: string } {
  if (!status) {
    return { alertStatus: 'no_alert', label: 'Chưa cảnh báo' };
  }
  switch (status) {
    case 'sent':
      return { alertStatus: 'sent', label: 'Đã gửi' };
    case 'sending':
      return { alertStatus: 'sending', label: 'Đang gửi' };
    case 'pending':
      return { alertStatus: 'pending', label: 'Chờ gửi' };
    case 'failed':
      return { alertStatus: 'failed', label: 'Gửi lỗi' };
    default:
      return { alertStatus: 'no_alert', label: 'Chưa cảnh báo' };
  }
}

/**
 * Tính toán các chỉ số so sánh cho một tập video (Section 9 - 15)
 */
export function computeComparisonMetrics(
  videos: Array<{
    latest_view_count: number | null;
    latest_measured_vph: number | null;
    view_delta: number | null;
  }>
): ChannelComparisonMetrics {
  const videoCount = videos.length;

  // Lọc các video có measured_vph IS NOT NULL (bao gồm 0)
  const videosWithVph = videos.filter(v => {
    const val = toFiniteNumber(v.latest_measured_vph);
    return val !== null;
  });
  const videosWithVphCount = videosWithVph.length;

  // Video đang tăng (measured_vph > 0)
  const risingVideos = videosWithVph.filter(v => Number(v.latest_measured_vph) > 0);
  const risingVideoCount = risingVideos.length;

  // Tỷ lệ video đang tăng = risingVideoCount / videosWithVphCount * 100
  // Nếu mẫu số = 0 -> null (hiển thị —)
  const risingVideoRatio = videosWithVphCount > 0
    ? Math.round((risingVideoCount / videosWithVphCount) * 1000) / 10
    : null;

  // VPH cao nhất
  let maxVph: number | null = null;
  if (videosWithVphCount > 0) {
    maxVph = Math.max(...videosWithVph.map(v => Number(v.latest_measured_vph)));
  }

  // VPH trung bình đo được = AVG(latest_measured_vph) trên các video IS NOT NULL (bao gồm 0)
  let avgMeasuredVph: number | null = null;
  if (videosWithVphCount > 0) {
    const sumVph = videosWithVph.reduce((sum, v) => sum + Number(v.latest_measured_vph), 0);
    avgMeasuredVph = Math.round(sumVph / videosWithVphCount);
  }

  // Lượt xem đang theo dõi = SUM(latest_view_count)
  // Nếu không có video nào có views -> null; nếu có -> sum
  const measuredViews = videos
    .map(v => toFiniteNumber(v.latest_view_count))
    .filter((v): v is number => v !== null);
  const trackedViews = measuredViews.length > 0
    ? measuredViews.reduce((sum, v) => sum + v, 0)
    : null;

  // Lượt xem tăng ở lần đo gần nhất = SUM(view_delta)
  const measuredDeltas = videos
    .map(v => toFiniteNumber(v.view_delta))
    .filter((v): v is number => v !== null);
  const latestViewDelta = measuredDeltas.length > 0
    ? measuredDeltas.reduce((sum, v) => sum + v, 0)
    : null;

  return {
    videoCount,
    risingVideoCount,
    risingVideoRatio,
    maxVph,
    avgMeasuredVph,
    trackedViews,
    latestViewDelta,
    videosWithVphCount,
  };
}

/**
 * Nhóm snapshots trong 24 giờ thành các điểm theo giờ (Trend Aggregation)
 * Section 24 & 25: 24h gần nhất, group YYYY-MM-DD HH, AVG(measured_vph) excludes NULL, includes 0.
 */
export function aggregateVphTrend(
  snapshots: Array<{ measured_vph: number | null; checked_at: string }>,
  nowMs: number = Date.now()
): ChannelComparisonTrendPoint[] {
  const cutoffMs = nowMs - 24 * 60 * 60 * 1000;

  // Map: hourKey -> { sumVph, count }
  const hourMap = new Map<string, { sumVph: number; count: number; dateObj: Date }>();

  for (const s of snapshots) {
    if (s.measured_vph === null || s.measured_vph === undefined) continue;

    const snapTimeMs = new Date(s.checked_at).getTime();
    if (snapTimeMs < cutoffMs) continue;

    const d = new Date(snapTimeMs);
    // hourKey YYYY-MM-DD HH
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hour = String(d.getUTCHours()).padStart(2, '0');
    const hourKey = `${year}-${month}-${day} ${hour}:00`;

    const existing = hourMap.get(hourKey);
    if (existing) {
      existing.sumVph += Number(s.measured_vph);
      existing.count += 1;
    } else {
      hourMap.set(hourKey, {
        sumVph: Number(s.measured_vph),
        count: 1,
        dateObj: d,
      });
    }
  }

  // Sắp xếp các giờ theo thứ tự thời gian tăng dần
  const sortedKeys = Array.from(hourMap.keys()).sort();

  return sortedKeys.map(key => {
    const data = hourMap.get(key)!;
    const localHour = String(data.dateObj.getHours()).padStart(2, '0');
    const localDay = String(data.dateObj.getDate()).padStart(2, '0');
    const localMonth = String(data.dateObj.getMonth() + 1).padStart(2, '0');
    const hourLabel = `${localHour}:00 ${localDay}/${localMonth}`;

    return {
      hourKey: key,
      hourLabel,
      avgVph: Math.round(data.sumVph / data.count),
      sampleCount: data.count,
    };
  });
}

export const channelComparisonService = {
  /**
   * Tải danh sách kênh có thể so sánh (status = active | paused)
   */
  async fetchComparableChannels(includeArchived = false): Promise<ComparableChannelOption[]> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const supabase = getSupabase()!;
    const statuses = includeArchived ? ['active', 'paused', 'archived'] : ['active', 'paused'];

    const { data, error } = await supabase
      .from('channels')
      .select('id, name, handle, avatar_url, status')
      .in('status', statuses)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Lỗi tải danh sách kênh: ${error.message}`);
    }

    return (data || []).map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      handle: ch.handle || null,
      avatarUrl: ch.avatar_url || null,
      status: ch.status,
    }));
  },

  /**
   * Tải dữ liệu so sánh chi tiết cho 2-4 kênh
   */
  async fetchChannelComparison(
    channelIds: string[],
    timeWindow: ComparisonTimeWindow = '7d',
    nowMs: number = Date.now()
  ): Promise<ChannelComparisonData> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    // Deduplicate và lấy tối đa 4 ID
    const uniqueIds = Array.from(new Set(channelIds.filter(Boolean))).slice(0, 4);
    if (uniqueIds.length === 0) {
      return { timeWindow, channels: [], allTrendHourKeys: [] };
    }

    const supabase = getSupabase()!;
    const windowThreshold = getTimeWindowThreshold(timeWindow, nowMs);
    const trendCutoff = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();

    // 1. Tải thông tin các kênh đã chọn
    const { data: rawChannels, error: chError } = await supabase
      .from('channels')
      .select('id, name, handle, avatar_url, status, alert_vph_threshold, last_scan_at')
      .in('id', uniqueIds);

    if (chError) {
      throw new Error(`Lỗi tải thông tin kênh so sánh: ${chError.message}`);
    }

    const channelsFound = rawChannels || [];
    if (channelsFound.length === 0) {
      return { timeWindow, channels: [], allTrendHourKeys: [] };
    }

    // Giữ nguyên thứ tự theo uniqueIds người dùng đã chọn
    const orderedChannels = uniqueIds
      .map(id => channelsFound.find(c => c.id === id))
      .filter((c): c is typeof channelsFound[0] => Boolean(c));

    // 2. Tải toàn bộ video thuộc các kênh đã chọn với phân trang an toàn >1.000 video
    const allVideos = await fetchAllBatches<any>((from, to) =>
      supabase
        .from('videos')
        .select('id, channel_id, youtube_video_id, title, thumbnail_url, published_at, latest_view_count, latest_measured_vph, latest_view_delta, latest_snapshot_checked_at')
        .in('channel_id', uniqueIds)
        .order('published_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    );

    const allVideoIds = allVideos.map(v => v.id);

    // 3. Tải xu hướng VPH 24h qua SQL RPC get_channel_vph_hourly (Server-side Aggregation)
    const { data: rpcRows, error: rpcErr } = await supabase.rpc('get_channel_vph_hourly', {
      p_channel_ids: uniqueIds,
      p_since: trendCutoff,
    });

    if (rpcErr) {
      throw new Error(`Lỗi tải xu hướng VPH 24h: ${rpcErr.message}`);
    }

    const trendPointsByChannel = new Map<string, ChannelComparisonTrendPoint[]>();
    if (rpcRows) {
      for (const r of rpcRows) {
        const chId = r.channel_id;
        if (!trendPointsByChannel.has(chId)) {
          trendPointsByChannel.set(chId, []);
        }
        const d = new Date(r.hour_bucket);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const hour = String(d.getUTCHours()).padStart(2, '0');
        const hourKey = `${year}-${month}-${day} ${hour}:00`;

        const localHour = String(d.getHours()).padStart(2, '0');
        const localDay = String(d.getDate()).padStart(2, '0');
        const localMonth = String(d.getMonth() + 1).padStart(2, '0');
        const hourLabel = `${localHour}:00 ${localDay}/${localMonth}`;

        trendPointsByChannel.get(chId)!.push({
          hourKey,
          hourLabel,
          avgVph: Math.round(Number(r.avg_vph)),
          sampleCount: Number(r.sample_count),
        });
      }
    }

    // 4. Batch query latest alerts for all videos (chunk <= 200 IDs)
    const latestAlertMap = new Map<string, string>();
    if (allVideoIds.length > 0) {
      const alertChunkSize = 200;
      for (let i = 0; i < allVideoIds.length; i += alertChunkSize) {
        const chunk = allVideoIds.slice(i, i + alertChunkSize);
        const { data: alertData } = await supabase
          .from('video_alerts')
          .select('video_id, status, sent_at, created_at')
          .in('video_id', chunk);

        if (alertData) {
          // Sắp xếp giảm dần theo sent_at || created_at (thống nhất với Wave 3.4-3.7)
          const sortedAlerts = [...alertData].sort((a, b) => {
            const timeA = new Date(a.sent_at || a.created_at || 0).getTime();
            const timeB = new Date(b.sent_at || b.created_at || 0).getTime();
            return timeB - timeA;
          });

          for (const a of sortedAlerts) {
            if (!latestAlertMap.has(a.video_id)) {
              latestAlertMap.set(a.video_id, a.status);
            }
          }
        }
      }
    }

    // 5. Tổng hợp từng kênh
    const allHourKeysSet = new Set<string>();

    const comparisonItems: ChannelComparisonItem[] = orderedChannels.map((ch, idx) => {
      const channelColor = COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length];

      // Lọc video của kênh này
      const chVideos = allVideos.filter(v => v.channel_id === ch.id);

      // Tính nhịp đăng từ toàn bộ video của kênh (không phụ thuộc timeWindow lọc video phía trên)
      const publishing = computePublishingMetrics(chVideos, nowMs);

      // Lọc video theo time window (published_at)
      const windowVideos = chVideos.filter(v => {
        if (!windowThreshold) return true;
        if (!v.published_at) return false;
        return new Date(v.published_at) >= windowThreshold;
      });

      // Gộp thông tin delta snapshot mới nhất vào mỗi video từ cache
      const videosWithDelta = windowVideos.map(v => ({
        ...v,
        latest_view_count: toFiniteNumber(v.latest_view_count),
        latest_measured_vph: toFiniteNumber(v.latest_measured_vph),
        view_delta: toFiniteNumber(v.latest_view_delta),
      }));

      // Tính metrics
      const metrics = computeComparisonMetrics(videosWithDelta);

      // Sắp xếp top 5 video:
      // 1. latest_measured_vph DESC (NULL ở cuối)
      // 2. view_delta DESC nếu VPH bằng nhau
      // 3. published_at DESC (mới nhất)
      const sortedVideos = [...videosWithDelta].sort((a, b) => {
        const vphA = toFiniteNumber(a.latest_measured_vph);
        const vphB = toFiniteNumber(b.latest_measured_vph);
        if (vphA === null && vphB !== null) return 1;
        if (vphA !== null && vphB === null) return -1;
        if (vphA !== null && vphB !== null && vphA !== vphB) {
          return vphB - vphA;
        }

        const deltaA = toFiniteNumber(a.view_delta);
        const deltaB = toFiniteNumber(b.view_delta);
        if (deltaA === null && deltaB !== null) return 1;
        if (deltaA !== null && deltaB === null) return -1;
        if (deltaA !== null && deltaB !== null && deltaA !== deltaB) {
          return deltaB - deltaA;
        }

        const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return timeB - timeA;
      });

      const top5Videos: ChannelComparisonVideo[] = sortedVideos.slice(0, 5).map(v => {
        const alertStatusRaw = latestAlertMap.get(v.id) || null;
        const mappedAlert = mapAlertStatus(alertStatusRaw);

        return {
          id: v.id,
          youtubeVideoId: v.youtube_video_id,
          title: v.title || 'Video đối thủ',
          thumbnailUrl: v.thumbnail_url || (v.youtube_video_id ? `https://i.ytimg.com/vi/${v.youtube_video_id}/mqdefault.jpg` : null),
          publishedAt: v.published_at,
          relativePublishedAt: formatRelativeTime(v.published_at, nowMs),
          latestViewCount: toFiniteNumber(v.latest_view_count),
          latestMeasuredVph: toFiniteNumber(v.latest_measured_vph),
          latestViewDelta: toFiniteNumber(v.view_delta),
          alertStatus: mappedAlert.alertStatus,
          alertStatusLabel: mappedAlert.label,
        };
      });

      // Xu hướng VPH 24h lấy từ kết quả RPC
      const trendPoints = trendPointsByChannel.get(ch.id) || [];
      for (const tp of trendPoints) {
        allHourKeysSet.add(tp.hourKey);
      }

      const statusLabels: Record<string, string> = {
        active: 'Đang theo dõi',
        paused: 'Tạm dừng',
        archived: 'Đã lưu trữ',
      };

      return {
        id: ch.id,
        name: ch.name,
        handle: ch.handle || null,
        avatarUrl: ch.avatar_url || null,
        status: ch.status,
        statusLabel: statusLabels[ch.status] || ch.status,
        alertVphThreshold: ch.alert_vph_threshold !== null && ch.alert_vph_threshold !== undefined && !isNaN(Number(ch.alert_vph_threshold)) ? Number(ch.alert_vph_threshold) : null,
        lastScanAt: ch.last_scan_at || null,
        relativeScanTime: formatRelativeTime(ch.last_scan_at, nowMs),
        color: channelColor,
        metrics,
        publishing,
        topVideos: top5Videos,
        trendPoints,
      };
    });

    const allTrendHourKeys = Array.from(allHourKeysSet).sort();

    return {
      timeWindow,
      channels: comparisonItems,
      allTrendHourKeys,
    };
  },
};
