// src/services/data-health-service.ts
// Service Layer cho màn hình Tình Trạng Dữ Liệu (Phase 10)
// Chế độ CHỈ ĐỌC (Read-Only) từ Supabase application tables
// KHÔNG query pg_cron, vault, pg_net. KHÔNG gọi collector.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import type {
  DataHealthScan,
  DataHealthSummary,
  ChannelFreshness,
  VideoFreshness,
  AlertHealthSummary,
  FailedAlertItem,
  SystemStatus,
  ScanStatus,
  TriggerSource,
  FreshnessCategory,
} from '@/types/data-health';
import {
  SCAN_STATUS_LABELS,
  TRIGGER_SOURCE_LABELS,
  FRESHNESS_LABELS,
  VIDEO_FRESHNESS_LABELS,
} from '@/types/data-health';

/**
 * Khử độc lỗi (Sanitize error summary):
 * Loại bỏ URL webhook Discord, API key, access key, Bearer tokens, Supabase JWT, OpenAI keys
 */
export function sanitizeErrorSummary(err: string | null | undefined): string {
  if (!err) return '';
  return err
    // Discord Webhooks
    .replace(/https?:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/[^\s'"]+/gi, '[URL Webhook ẩn]')
    // Generic URLs with tokens or keys
    .replace(/https?:\/\/[^\s'"]+/gi, '[URL ẩn]')
    // Authorization headers or tokens
    .replace(/(?:Bearer|token|secret|access_key|api_key|apikey)[:=\s]+[a-zA-Z0-9_\-\.]+/gi, '[Mã bí mật ẩn]')
    // Specific key/token query params
    .replace(/(key|token|secret|password)=[a-zA-Z0-9_\-\.]+/gi, '$1=[ẩn]')
    // Supabase project keys / JWTs
    .replace(/eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/gi, '[JWT ẩn]')
    // OpenAI keys (sk-...)
    .replace(/sk-[a-zA-Z0-9_\-]{20,}/gi, '[OpenAI Key ẩn]');
}

/**
 * Định dạng thời lượng quét (Duration):
 * Ví dụ: '21 giây', '1 phút 04 giây', hoặc 'Đang chạy' nếu status === 'running'
 */
export function formatDuration(
  startedAt: string,
  finishedAt: string | null,
  status: ScanStatus
): string {
  if (status === 'running' || !finishedAt) {
    return 'Đang chạy';
  }

  try {
    const startMs = new Date(startedAt).getTime();
    const endMs = new Date(finishedAt).getTime();
    const sec = Math.max(0, Math.round((endMs - startMs) / 1000));

    if (sec < 60) {
      return `${sec} giây`;
    }

    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    const secPadded = remSec < 10 ? `0${remSec}` : `${remSec}`;
    return `${min} phút ${secPadded} giây`;
  } catch {
    return '—';
  }
}

/**
 * Định dạng thời gian tương đối tiếng Việt (ví dụ: '18 phút trước', '2 giờ trước', 'Vừa xong')
 */
export function formatRelativeTime(isoDate: string | null, nowMs: number = Date.now()): string {
  if (!isoDate) return 'Chưa có dữ liệu';
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
 * Tính toán độ mới dữ liệu kênh (Channel Freshness)
 * fresh: <= 90 phút
 * warning: 90 phút < age <= 2 giờ
 * stale: > 2 giờ
 * never: NULL
 */
export function computeChannelFreshness(
  lastScanAt: string | null,
  nowMs: number = Date.now()
): { category: FreshnessCategory; label: string } {
  if (!lastScanAt) {
    return { category: 'never', label: FRESHNESS_LABELS.never };
  }

  const scanMs = new Date(lastScanAt).getTime();
  const diffMinutes = (nowMs - scanMs) / (60 * 1000);

  if (diffMinutes <= 90) {
    return { category: 'fresh', label: FRESHNESS_LABELS.fresh };
  } else if (diffMinutes <= 120) {
    return { category: 'warning', label: FRESHNESS_LABELS.warning };
  } else {
    return { category: 'stale', label: FRESHNESS_LABELS.stale };
  }
}

/**
 * Sắp xếp kênh theo độ mới (Sort Channel Health)
 * Default: kênh cũ nhất trước.
 * Thứ tự ưu tiên: never -> stale -> warning -> fresh.
 * Trong cùng nhóm: last_scan_at ASC.
 */
export function sortChannelsByFreshness(channels: ChannelFreshness[]): ChannelFreshness[] {
  const priorityRank: Record<FreshnessCategory, number> = {
    never: 0,
    stale: 1,
    warning: 2,
    fresh: 3,
  };

  return [...channels].sort((a, b) => {
    const rankA = priorityRank[a.freshnessCategory];
    const rankB = priorityRank[b.freshnessCategory];
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    if (!a.lastScanAt && !b.lastScanAt) return 0;
    if (!a.lastScanAt) return -1;
    if (!b.lastScanAt) return 1;

    return new Date(a.lastScanAt).getTime() - new Date(b.lastScanAt).getTime();
  });
}

/**
 * Tính toán độ mới video (Video Freshness)
 * fresh: <= 90 phút
 * warning: 90 phút – 2 giờ
 * stale: > 2 giờ
 * never: NULL (Chưa có snapshot)
 */
export function computeVideoFreshness(
  latestSnapshotAt: string | null,
  nowMs: number = Date.now()
): { category: FreshnessCategory; label: string } {
  if (!latestSnapshotAt) {
    return { category: 'never', label: VIDEO_FRESHNESS_LABELS.never };
  }

  const snapMs = new Date(latestSnapshotAt).getTime();
  const diffMinutes = (nowMs - snapMs) / (60 * 1000);

  if (diffMinutes <= 90) {
    return { category: 'fresh', label: VIDEO_FRESHNESS_LABELS.fresh };
  } else if (diffMinutes <= 120) {
    return { category: 'warning', label: VIDEO_FRESHNESS_LABELS.warning };
  } else {
    return { category: 'stale', label: VIDEO_FRESHNESS_LABELS.stale };
  }
}

/**
 * Tính toán Tình Trạng Hệ Thống (System Status Banner)
 * Thứ tự ưu tiên tuyệt đối A -> E:
 * A. Nếu latest scan status = running -> 'Đang quét dữ liệu'
 *    (nếu started_at > 30 phút trước -> factual text: 'Lần quét này đã chạy hơn 30 phút.')
 * B. Nếu latest scan status = failed -> 'Cần kiểm tra'
 * C. Nếu latest scan status = partial -> 'Có lỗi một phần'
 * D. Nếu latest successful/partial scan finished_at cũ hơn 2 giờ -> 'Dữ liệu đang chậm cập nhật'
 * E. Nếu latest scan success và finished_at <= 2 giờ -> 'Hoạt động bình thường'
 */
export function computeSystemStatus(
  latestScan: DataHealthScan | null,
  latestSuccessfulOrPartialScan: DataHealthScan | null,
  nowMs: number = Date.now()
): SystemStatus {
  if (!latestScan) {
    return {
      code: 'slow_update',
      label: 'Dữ liệu đang chậm cập nhật',
      tone: 'warning',
      description: 'Chưa có thông tin về lịch sử quét dữ liệu trong hệ thống.',
      isStuckRunning: false,
    };
  }

  // A. Running
  if (latestScan.status === 'running') {
    const startedMs = new Date(latestScan.startedAt).getTime();
    const runningMinutes = (nowMs - startedMs) / (60 * 1000);
    const isStuck = runningMinutes > 30;

    return {
      code: 'running',
      label: 'Đang quét dữ liệu',
      tone: 'info',
      description: isStuck
        ? 'Lần quét này đã chạy hơn 30 phút.'
        : 'Hệ thống đang thực hiện quét dữ liệu mới nhất từ YouTube.',
      isStuckRunning: isStuck,
    };
  }

  // B. Failed
  if (latestScan.status === 'failed') {
    return {
      code: 'needs_check',
      label: 'Cần kiểm tra',
      tone: 'danger',
      description: 'Lần quét gần nhất gặp sự cố và không hoàn thành thành công.',
      isStuckRunning: false,
    };
  }

  // C. Partial
  if (latestScan.status === 'partial') {
    return {
      code: 'partial_error',
      label: 'Có lỗi một phần',
      tone: 'warning',
      description: 'Lần quét gần nhất hoàn tất nhưng có một số kênh hoặc video gặp lỗi.',
      isStuckRunning: false,
    };
  }

  // D. Stale > 2 hours
  const refScan = latestSuccessfulOrPartialScan || latestScan;
  const finishTime = refScan.finishedAt || refScan.startedAt;
  const finishMs = new Date(finishTime).getTime();
  const ageHours = (nowMs - finishMs) / (60 * 60 * 1000);

  if (ageHours > 2) {
    return {
      code: 'slow_update',
      label: 'Dữ liệu đang chậm cập nhật',
      tone: 'warning',
      description: `Lần quét thành công gần nhất đã diễn ra hơn ${Math.floor(ageHours)} giờ trước.`,
      isStuckRunning: false,
    };
  }

  // E. Normal
  return {
    code: 'normal',
    label: 'Hoạt động bình thường',
    tone: 'success',
    description: 'Hệ thống thu thập dữ liệu đang hoạt động ổn định và cập nhật theo chu kỳ.',
    isStuckRunning: false,
  };
}

function mapScanRow(row: any, nowMs: number): DataHealthScan {
  const status = (row.status || 'success') as ScanStatus;
  const triggerSource = (row.trigger_source || 'schedule') as TriggerSource;
  const sanitized = sanitizeErrorSummary(row.error_summary);

  return {
    id: row.id,
    startedAt: row.started_at,
    finishedAt: row.finished_at || null,
    status,
    statusLabel: SCAN_STATUS_LABELS[status] || status,
    triggerSource,
    triggerLabel: TRIGGER_SOURCE_LABELS[triggerSource] || triggerSource,
    channelsTotal: Number(row.channels_total || 0),
    channelsSuccess: Number(row.channels_success || 0),
    channelsFailed: Number(row.channels_failed || 0),
    videosFound: Number(row.videos_found || 0),
    snapshotsCreated: Number(row.snapshots_created || 0),
    alertsSent: Number(row.alerts_sent || 0),
    alertsFailed: Number(row.alerts_failed || 0),
    errorSummary: row.error_summary || null,
    sanitizedError: sanitized || null,
    durationText: formatDuration(row.started_at, row.finished_at, status),
    relativeTime: formatRelativeTime(row.started_at, nowMs),
  };
}

export const dataHealthService = {
  /**
   * Tải toàn bộ dữ liệu Tình Trạng Dữ Liệu từ Supabase
   */
  async fetchDataHealthSummary(): Promise<DataHealthSummary> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const supabase = getSupabase()!;
    const nowMs = Date.now();

    // 1. Chạy song song các truy vấn cốt lõi
    const [
      scansRes,
      latestScheduleRes,
      channelsRes,
      videosRes,
      alertsRes,
    ] = await Promise.all([
      // Lịch sử 20 lần quét gần nhất
      supabase
        .from('scan_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20),

      // Lần quét tự động gần nhất
      supabase
        .from('scan_runs')
        .select('*')
        .eq('trigger_source', 'schedule')
        .order('started_at', { ascending: false })
        .limit(1),

      // Các kênh đang theo dõi (status = active)
      supabase
        .from('channels')
        .select('id, name, handle, avatar_url, last_scan_at, scan_limit, alert_vph_threshold, status')
        .eq('status', 'active'),

      // Danh sách video thuộc active channels
      supabase
        .from('videos')
        .select('id, title, thumbnail_url, youtube_video_id, channel_id, latest_view_count, latest_measured_vph, channels!inner(id, name, status)')
        .eq('channels.status', 'active'),

      // Cảnh báo Discord gần đây
      supabase
        .from('video_alerts')
        .select('id, video_id, status, measured_vph, attempts, last_error, updated_at, videos(id, title, channel_id, channels(name))')
        .order('updated_at', { ascending: false })
        .limit(100),
    ]);

    if (scansRes.error) throw new Error(`Lỗi tải lịch sử quét: ${scansRes.error.message}`);
    if (channelsRes.error) throw new Error(`Lỗi tải danh sách kênh: ${channelsRes.error.message}`);
    if (videosRes.error) throw new Error(`Lỗi tải danh sách video: ${videosRes.error.message}`);

    // Map scan runs
    const rawScans = scansRes.data || [];
    const recentScans: DataHealthScan[] = rawScans.map(r => mapScanRow(r, nowMs));
    const latestScan = recentScans.length > 0 ? recentScans[0] : null;

    // Latest scheduled scan
    const rawSchedule = latestScheduleRes.data || [];
    const latestScheduledScan = rawSchedule.length > 0 ? mapScanRow(rawSchedule[0], nowMs) : null;

    // Latest successful or partial scan for banner freshness check
    const latestSuccessfulOrPartialScan =
      recentScans.find(s => s.status === 'success' || s.status === 'partial') || null;

    // Calculate system status
    const systemStatus = computeSystemStatus(latestScan, latestSuccessfulOrPartialScan, nowMs);

    // Map channel freshness
    const rawChannels = channelsRes.data || [];
    const channels: ChannelFreshness[] = rawChannels.map((ch: any) => {
      const freshness = computeChannelFreshness(ch.last_scan_at, nowMs);
      return {
        id: ch.id,
        name: ch.name,
        handle: ch.handle || null,
        avatarUrl: ch.avatar_url || null,
        lastScanAt: ch.last_scan_at || null,
        scanLimit: Number(ch.scan_limit || 15),
        alertVphThreshold: Number(ch.alert_vph_threshold || 1000),
        freshnessCategory: freshness.category,
        freshnessLabel: freshness.label,
        relativeScanTime: formatRelativeTime(ch.last_scan_at, nowMs),
      };
    });

    const sortedChannels = sortChannelsByFreshness(channels);
    const channelsNeedAttentionCount = channels.filter(
      ch => ch.freshnessCategory === 'never' || ch.freshnessCategory === 'stale'
    ).length;

    // Map videos and snapshot freshness
    const rawVideos = videosRes.data || [];
    const videoIds = rawVideos.map((v: any) => v.id);

    // Fetch latest snapshot checked_at for candidate videos
    const latestSnapMap = new Map<string, string>();
    if (videoIds.length > 0) {
      const { data: snapData } = await supabase
        .from('video_snapshots')
        .select('video_id, checked_at')
        .in('video_id', videoIds)
        .order('checked_at', { ascending: false });

      if (snapData) {
        for (const snap of snapData) {
          if (!latestSnapMap.has(snap.video_id)) {
            latestSnapMap.set(snap.video_id, snap.checked_at);
          }
        }
      }
    }

    const allVideoFreshness: VideoFreshness[] = rawVideos.map((v: any) => {
      const snapAt = latestSnapMap.get(v.id) || null;
      const freshness = computeVideoFreshness(snapAt, nowMs);
      const ch = v.channels;

      return {
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnail_url || (v.youtube_video_id ? `https://i.ytimg.com/vi/${v.youtube_video_id}/mqdefault.jpg` : null),
        youtubeVideoId: v.youtube_video_id,
        channelId: v.channel_id,
        channelName: ch?.name || 'Kênh đối thủ',
        latestSnapshotAt: snapAt,
        latestViewCount: v.latest_view_count !== null ? Number(v.latest_view_count) : null,
        latestMeasuredVph: v.latest_measured_vph !== null ? Number(v.latest_measured_vph) : null,
        freshnessCategory: freshness.category,
        freshnessLabel: freshness.label,
        relativeSnapshotTime: formatRelativeTime(snapAt, nowMs),
      };
    });

    // Count stale videos (> 2 hours or no snapshot)
    const staleVideosCount = allVideoFreshness.filter(
      v => v.freshnessCategory === 'never' || v.freshnessCategory === 'stale'
    ).length;

    // Sort videos: oldest snapshot first (never -> stale -> warning -> fresh)
    const videoPriorityRank: Record<FreshnessCategory, number> = {
      never: 0,
      stale: 1,
      warning: 2,
      fresh: 3,
    };

    const sortedStaleVideos = [...allVideoFreshness]
      .sort((a, b) => {
        const rankA = videoPriorityRank[a.freshnessCategory];
        const rankB = videoPriorityRank[b.freshnessCategory];
        if (rankA !== rankB) return rankA - rankB;

        if (!a.latestSnapshotAt && !b.latestSnapshotAt) return 0;
        if (!a.latestSnapshotAt) return -1;
        if (!b.latestSnapshotAt) return 1;

        return new Date(a.latestSnapshotAt).getTime() - new Date(b.latestSnapshotAt).getTime();
      })
      .slice(0, 20);

    // Map Discord alerts
    const rawAlerts = alertsRes.data || [];
    let alertSent = 0;
    let alertPending = 0;
    let alertSending = 0;
    let alertFailed = 0;
    let stuckSendingCount = 0;
    const failedAlerts: FailedAlertItem[] = [];

    for (const a of rawAlerts) {
      if (a.status === 'sent') alertSent++;
      else if (a.status === 'pending') alertPending++;
      else if (a.status === 'sending') {
        alertSending++;
        const updatedMs = new Date(a.updated_at).getTime();
        if ((nowMs - updatedMs) > 15 * 60 * 1000) {
          stuckSendingCount++;
        }
      } else if (a.status === 'failed') {
        alertFailed++;
        if (failedAlerts.length < 10) {
          const v: any = Array.isArray(a.videos) ? a.videos[0] : a.videos;
          const ch: any = Array.isArray(v?.channels) ? v?.channels[0] : v?.channels;
          failedAlerts.push({
            id: a.id,
            videoId: a.video_id,
            videoTitle: v?.title || 'Video đối thủ',
            channelName: ch?.name || 'Kênh đối thủ',
            measuredVph: a.measured_vph !== null ? Number(a.measured_vph) : null,
            attempts: Number(a.attempts || 0),
            updatedAt: a.updated_at,
            lastError: a.last_error || 'Không rõ nguyên nhân',
            sanitizedError: sanitizeErrorSummary(a.last_error) || 'Lỗi không xác định',
          });
        }
      }
    }

    const alertSummary: AlertHealthSummary = {
      total: rawAlerts.length,
      sent: alertSent,
      pending: alertPending,
      sending: alertSending,
      failed: alertFailed,
      stuckSendingCount,
      failedAlerts,
    };

    const d = new Date(nowMs);
    const lastFetchedAt = d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      systemStatus,
      latestScan,
      latestScheduledScan,
      channelsNeedAttentionCount,
      staleVideosCount,
      failedAlertsCount: alertFailed,
      channels: sortedChannels,
      staleVideos: sortedStaleVideos,
      alertSummary,
      recentScans,
      lastFetchedAt,
    };
  },
};
