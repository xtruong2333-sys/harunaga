// Service: report-service.ts
// Quản lý dữ liệu Báo Cáo 24h / 7 Ngày (Phase 16)
// 100% READ ONLY: Không gọi collector, không gọi AI, không mutation, không fetch video_snapshots.

import { isSupabaseConfigured, getSupabase } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import { sanitizeErrorSummary } from './data-health-service';
import type {
  ReportRange,
  ReportVideo,
  ReportAlert,
  ReportAlertStatus,
  ReportScan,
  ReportScanStatus,
  ReportScanTrigger,
  ReportSummary,
  ReportScanSummary,
  ReportChannelActivity,
  ReportData,
} from '@/types/report';

// ============================================================
// Mapping & Formatting Helpers
// ============================================================

export const ALERT_STATUS_MAP: Record<ReportAlertStatus, string> = {
  pending: 'Chờ gửi',
  sending: 'Đang gửi',
  sent: 'Đã gửi',
  failed: 'Gửi lỗi',
};

export const SCAN_STATUS_MAP: Record<ReportScanStatus, string> = {
  running: 'Đang chạy',
  success: 'Thành công',
  partial: 'Một phần',
  failed: 'Thất bại',
};

export const SCAN_TRIGGER_MAP: Record<ReportScanTrigger, string> = {
  manual: 'Thủ công',
  schedule: 'Tự động',
};

const vnDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatVietnamDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    // Returns dd/mm/yyyy, hh:mm -> replace comma with space
    return vnDateTimeFormatter.format(d).replace(',', '');
  } catch {
    return '—';
  }
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatVph(vph: number | null | undefined): string {
  if (vph === null || vph === undefined) {
    return 'Chưa đủ dữ liệu';
  }
  if (vph === 0) {
    return '0 VPH';
  }
  return `${new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(vph)} VPH`;
}

export function formatRelativeTime(isoString: string | null | undefined, now = Date.now()): string {
  if (!isoString) return '—';
  const time = new Date(isoString).getTime();
  if (isNaN(time)) return '—';
  const diffSec = Math.max(0, Math.floor((now - time) / 1000));

  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

export function parseReportRange(val: unknown): ReportRange {
  if (val === '7d') return '7d';
  return '24h';
}

export function getReportRangeStart(range: ReportRange, nowMs = Date.now()): string {
  if (range === '7d') {
    return new Date(nowMs - 7 * 24 * 3600 * 1000).toISOString();
  }
  return new Date(nowMs - 24 * 3600 * 1000).toISOString();
}

// ============================================================
// Pure Computation Functions (Unit Testable)
// ============================================================

export function computeReportSummary(
  videos: ReportVideo[],
  alertsCount: number,
  scans: ReportScan[]
): ReportSummary {
  const newVideosCount = videos.length;
  const channelIdSet = new Set<string>();
  let risingNewVideosCount = 0;
  const vphList: number[] = [];

  for (const v of videos) {
    channelIdSet.add(v.channelId);
    if (v.latestMeasuredVph !== null && v.latestMeasuredVph > 0) {
      risingNewVideosCount++;
    }
    if (v.latestMeasuredVph !== null) {
      vphList.push(v.latestMeasuredVph);
    }
  }

  let snapshotsCount = 0;
  let attentionScansCount = 0;

  for (const s of scans) {
    snapshotsCount += s.snapshotsCreated;
    if (s.status === 'partial' || s.status === 'failed') {
      attentionScansCount++;
    }
  }

  const maxCurrentVph = vphList.length > 0 ? Math.max(...vphList) : null;

  return {
    newVideosCount,
    channelsWithNewVideosCount: channelIdSet.size,
    risingNewVideosCount,
    alertsCount,
    snapshotsCount,
    attentionScansCount,
    maxCurrentVph,
  };
}

export function computeScanSummary(scans: ReportScan[]): ReportScanSummary {
  let successScans = 0;
  let partialScans = 0;
  let failedScans = 0;
  let totalSnapshots = 0;

  for (const s of scans) {
    totalSnapshots += s.snapshotsCreated;
    if (s.status === 'success') successScans++;
    else if (s.status === 'partial') partialScans++;
    else if (s.status === 'failed') failedScans++;
  }

  return {
    totalScans: scans.length,
    successScans,
    partialScans,
    failedScans,
    totalSnapshots,
  };
}

export function computeChannelActivity(videos: ReportVideo[]): ReportChannelActivity[] {
  const map = new Map<string, {
    channelId: string;
    channelName: string;
    channelHandle: string | null;
    channelAvatarUrl: string | null;
    videos: ReportVideo[];
  }>();

  for (const v of videos) {
    let entry = map.get(v.channelId);
    if (!entry) {
      entry = {
        channelId: v.channelId,
        channelName: v.channelName,
        channelHandle: v.channelHandle,
        channelAvatarUrl: v.channelAvatarUrl,
        videos: [],
      };
      map.set(v.channelId, entry);
    }
    entry.videos.push(v);
  }

  const result: ReportChannelActivity[] = [];

  for (const item of map.values()) {
    // Sort videos by publishedAt DESC
    item.videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const latest = item.videos[0];

    const vphs = item.videos
      .map(v => v.latestMeasuredVph)
      .filter((val): val is number => val !== null);
    const maxCurrentVph = vphs.length > 0 ? Math.max(...vphs) : null;
    const risingCount = item.videos.filter(v => v.latestMeasuredVph !== null && v.latestMeasuredVph > 0).length;

    result.push({
      channelId: item.channelId,
      channelName: item.channelName,
      channelHandle: item.channelHandle,
      channelAvatarUrl: item.channelAvatarUrl,
      newVideosCount: item.videos.length,
      latestPublishedAt: latest.publishedAt,
      latestVideoTitle: latest.title,
      maxCurrentVph,
      risingCount,
    });
  }

  // Sort: newVideosCount DESC, tie: latestPublishedAt DESC
  result.sort((a, b) => {
    if (b.newVideosCount !== a.newVideosCount) {
      return b.newVideosCount - a.newVideosCount;
    }
    return new Date(b.latestPublishedAt).getTime() - new Date(a.latestPublishedAt).getTime();
  });

  return result;
}

export function sortRisingNewVideos(videos: ReportVideo[], limit = 10): ReportVideo[] {
  return videos
    .filter(v => v.latestMeasuredVph !== null && v.latestMeasuredVph > 0)
    .sort((a, b) => (b.latestMeasuredVph ?? 0) - (a.latestMeasuredVph ?? 0))
    .slice(0, limit);
}

export function buildReportCopyText(
  summary: ReportSummary,
  range: ReportRange,
  nowMs = Date.now()
): string {
  const rangeTitle = range === '24h' ? 'BÁO CÁO BẮT BÀI ĐỐI THỦ — 24 GIỜ' : 'BÁO CÁO BẮT BÀI ĐỐI THỦ — 7 NGÀY';
  const vphText = summary.maxCurrentVph !== null ? formatVph(summary.maxCurrentVph) : '—';
  const formattedCreatedTime = formatVietnamDateTime(new Date(nowMs).toISOString());

  return `${rangeTitle}

Video mới: ${summary.newVideosCount}
Kênh có video mới: ${summary.channelsWithNewVideosCount}
Video mới đang tăng: ${summary.risingNewVideosCount}
Cảnh báo phát sinh: ${summary.alertsCount}
Snapshot đã ghi nhận: ${formatNumber(summary.snapshotsCount)}
Lần quét cần chú ý: ${summary.attentionScansCount}

VPH cao nhất hiện tại trong nhóm video mới: ${vphText}

Thời điểm tạo: ${formattedCreatedTime} (Múi giờ Việt Nam)`;
}

// ============================================================
// Data Fetching Function (>1000 Pagination & Batch Safety)
// ============================================================

interface RawVideoRow {
  id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string | null;
  youtube_video_id: string | null;
  published_at: string;
  latest_measured_vph: number | null;
  latest_view_count: number | null;
  channels: {
    id: string;
    name: string;
    handle: string | null;
    avatar_url: string | null;
  } | null;
}

interface RawAlertRow {
  id: string;
  video_id: string;
  threshold_vph: number;
  measured_vph: number;
  view_count: number;
  status: string;
  created_at: string;
  videos: {
    id: string;
    title: string;
    youtube_video_id: string | null;
    thumbnail_url: string | null;
    channels: {
      id: string;
      name: string;
      handle: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

interface RawScanRow {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  trigger_source: string;
  channels_total: number;
  channels_success: number;
  channels_failed: number;
  videos_found: number;
  snapshots_created: number;
  alerts_sent: number;
  alerts_failed: number;
  error_summary: string | null;
}

export async function fetchReportData(
  range: ReportRange,
  nowMs = Date.now()
): Promise<ReportData> {
  if (!isSupabaseConfigured()) {
    throw new DatabaseNotConfiguredError();
  }
  const supabase = getSupabase()!;
  const rangeStartIso = getReportRangeStart(range, nowMs);

  // 1. Fetch videos published in range with batch pagination (safety > 1000 rows)
  const BATCH_SIZE = 1000;
  let offset = 0;
  let hasMore = true;
  const rawVideos: RawVideoRow[] = [];

  while (hasMore) {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id, channel_id, title, thumbnail_url, youtube_video_id, published_at,
        latest_measured_vph, latest_view_count,
        channels(id, name, handle, avatar_url)
      `)
      .gte('published_at', rangeStartIso)
      .order('published_at', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      throw new Error(`Lỗi tải danh sách video: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as RawVideoRow[];
    rawVideos.push(...rows);

    if (rows.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      offset += BATCH_SIZE;
    }
  }

  // 2. Fetch all alerts in range for exact summary count and recent list
  const { data: rawAlertData, error: alertErr } = await supabase
    .from('video_alerts')
    .select(`
      id, video_id, threshold_vph, measured_vph, view_count, status, created_at,
      videos(id, title, youtube_video_id, thumbnail_url,
        channels(id, name, handle, avatar_url))
    `)
    .gte('created_at', rangeStartIso)
    .order('created_at', { ascending: false });

  if (alertErr) {
    throw new Error(`Lỗi tải danh sách cảnh báo: ${alertErr.message}`);
  }
  const rawAlerts = (rawAlertData ?? []) as unknown as RawAlertRow[];

  // 3. Fetch all scans started in range for summary and recent list
  const { data: rawScanData, error: scanErr } = await supabase
    .from('scan_runs')
    .select(`
      id, started_at, finished_at, status, trigger_source,
      channels_total, channels_success, channels_failed,
      videos_found, snapshots_created, alerts_sent, alerts_failed, error_summary
    `)
    .gte('started_at', rangeStartIso)
    .order('started_at', { ascending: false });

  if (scanErr) {
    throw new Error(`Lỗi tải hoạt động thu thập: ${scanErr.message}`);
  }
  const rawScans = (rawScanData ?? []) as unknown as RawScanRow[];

  // 4. Transform alerts (preserving historical alert values)
  const alertVideoIds = new Set<string>();
  const allAlerts: ReportAlert[] = rawAlerts.map(row => {
    alertVideoIds.add(row.video_id);
    const rawStatus = (row.status || 'pending') as ReportAlertStatus;
    const status: ReportAlertStatus = (rawStatus in ALERT_STATUS_MAP) ? rawStatus : 'pending';
    return {
      id: row.id,
      videoId: row.video_id,
      videoTitle: row.videos?.title ?? '(Video không rõ)',
      videoYoutubeId: row.videos?.youtube_video_id ?? null,
      videoThumbnailUrl: row.videos?.thumbnail_url ?? null,
      channelId: row.videos?.channels?.id ?? '',
      channelName: row.videos?.channels?.name ?? '(Kênh không rõ)',
      channelHandle: row.videos?.channels?.handle ?? null,
      channelAvatarUrl: row.videos?.channels?.avatar_url ?? null,
      measuredVph: Number(row.measured_vph || 0),
      thresholdVph: Number(row.threshold_vph || 0),
      viewCount: Number(row.view_count || 0),
      status,
      statusLabel: ALERT_STATUS_MAP[status] || status,
      createdAt: row.created_at,
    };
  });

  // 5. Transform videos
  const allVideos: ReportVideo[] = rawVideos.map(row => ({
    id: row.id,
    channelId: row.channel_id,
    channelName: row.channels?.name ?? '(Kênh không rõ)',
    channelHandle: row.channels?.handle ?? null,
    channelAvatarUrl: row.channels?.avatar_url ?? null,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    youtubeVideoId: row.youtube_video_id,
    publishedAt: row.published_at,
    latestMeasuredVph: row.latest_measured_vph,
    latestViewCount: row.latest_view_count,
    hasAlert: alertVideoIds.has(row.id),
  }));

  // 6. Transform scans
  const allScans: ReportScan[] = rawScans.map(row => {
    const rawStatus = (row.status || 'success') as ReportScanStatus;
    const status: ReportScanStatus = (rawStatus in SCAN_STATUS_MAP) ? rawStatus : 'success';
    const rawTrigger = (row.trigger_source || 'schedule') as ReportScanTrigger;
    const triggerSource: ReportScanTrigger = (rawTrigger in SCAN_TRIGGER_MAP) ? rawTrigger : 'schedule';
    const sanitizedError = sanitizeErrorSummary(row.error_summary);

    return {
      id: row.id,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      status,
      statusLabel: SCAN_STATUS_MAP[status] || status,
      triggerSource,
      triggerLabel: SCAN_TRIGGER_MAP[triggerSource] || triggerSource,
      channelsTotal: Number(row.channels_total || 0),
      channelsSuccess: Number(row.channels_success || 0),
      channelsFailed: Number(row.channels_failed || 0),
      videosFound: Number(row.videos_found || 0),
      snapshotsCreated: Number(row.snapshots_created || 0),
      alertsSent: Number(row.alerts_sent || 0),
      alertsFailed: Number(row.alerts_failed || 0),
      errorSummary: row.error_summary || null,
      sanitizedError: sanitizedError || null,
    };
  });

  // 7. Derive high-level aggregations
  const summary = computeReportSummary(allVideos, allAlerts.length, allScans);
  const scanSummary = computeScanSummary(allScans);
  const risingVideos = sortRisingNewVideos(allVideos, 10);
  const newVideos = allVideos.slice(0, 20);
  const channelActivities = computeChannelActivity(allVideos);
  const recentAlerts = allAlerts.slice(0, 20);
  const recentScans = allScans.slice(0, 20);

  return {
    range,
    rangeStartIso,
    generatedAtIso: new Date(nowMs).toISOString(),
    summary,
    scanSummary,
    risingVideos,
    newVideos,
    channelActivities,
    recentAlerts,
    recentScans,
  };
}
