// Service Layer: dashboard-service.ts
// Nguồn dữ liệu Tổng Quan (Read-only từ Supabase production)
// TUYỆT ĐỐI KHÔNG TẠO DỮ LIỆU GIẢ. KHÔNG GỌI COLLECTOR KHI LÀM MỚI.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import {
  DashboardSummary,
  DashboardScanRun,
  DashboardTopVideo,
  DashboardChannelSummary,
  DashboardAlertSummary,
} from '@/types/dashboard';

export const dashboardService = {
  /**
   * Tải toàn bộ dữ liệu tổng hợp cho màn hình Tổng Quan
   */
  async fetchDashboardSummary(): Promise<DashboardSummary> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const supabase = getSupabase()!;

    // 1. Lấy danh sách kênh đang hoạt động và toàn bộ kênh
    const { data: channelsData, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, handle, avatar_url, alert_vph_threshold, status');

    if (channelsError) {
      throw new Error(`Lỗi tải danh sách kênh: ${channelsError.message}`);
    }

    const activeChannels = (channelsData || []).filter(c => c.status === 'active');
    const channelMap = new Map<string, any>();
    for (const c of channelsData || []) {
      channelMap.set(c.id, c);
    }

    // 2. Server-side exact count tổng số video
    const { count: totalVideosCount, error: totalCountError } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    if (totalCountError) {
      throw new Error(`Lỗi đếm tổng số video: ${totalCountError.message}`);
    }

    // 3. Server-side exact count số video đang tăng (VPH > 0)
    const { count: risingVideosCount, error: risingCountError } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .gt('latest_measured_vph', 0);

    if (risingCountError) {
      throw new Error(`Lỗi đếm số video đang tăng: ${risingCountError.message}`);
    }

    // 4. Query VPH cao nhất hiện tại (Top 1 DESC NULLS LAST)
    const { data: maxVphData, error: maxVphError } = await supabase
      .from('videos')
      .select('latest_measured_vph')
      .not('latest_measured_vph', 'is', null)
      .order('latest_measured_vph', { ascending: false })
      .limit(1);

    if (maxVphError) {
      throw new Error(`Lỗi tải VPH cao nhất: ${maxVphError.message}`);
    }

    const maxVph = maxVphData && maxVphData.length > 0 && maxVphData[0].latest_measured_vph !== null
      ? Number(maxVphData[0].latest_measured_vph)
      : null;

    // 5. Query Top 5 video theo VPH DESC (NULLs last) kèm latest_view_delta từ cache
    const { data: topVideosData, error: topVideosError } = await supabase
      .from('videos')
      .select('id, youtube_video_id, channel_id, title, url, thumbnail_url, published_at, latest_view_count, latest_measured_vph, latest_view_delta')
      .order('latest_measured_vph', { ascending: false, nullsFirst: false })
      .limit(5);

    if (topVideosError) {
      throw new Error(`Lỗi tải top video: ${topVideosError.message}`);
    }

    const topVideos: DashboardTopVideo[] = (topVideosData || []).map(v => {
      const ch = channelMap.get(v.channel_id) || {};
      const vph = v.latest_measured_vph !== null && v.latest_measured_vph !== undefined ? Number(v.latest_measured_vph) : null;
      const threshold = ch.alert_vph_threshold !== null && ch.alert_vph_threshold !== undefined && !isNaN(Number(ch.alert_vph_threshold)) ? Number(ch.alert_vph_threshold) : null;
      return {
        id: v.id,
        youtubeVideoId: v.youtube_video_id,
        channelId: v.channel_id,
        title: v.title || 'Video Không Tiêu Đề',
        url: v.url || `https://www.youtube.com/watch?v=${v.youtube_video_id}`,
        thumbnailUrl: v.thumbnail_url || null,
        publishedAt: v.published_at,
        latestViewCount: Number(v.latest_view_count) || 0,
        latestMeasuredVph: vph,
        latestDeltaViews: v.latest_view_delta !== null && v.latest_view_delta !== undefined ? Number(v.latest_view_delta) : null,
        isOverThreshold: vph !== null && threshold !== null && threshold > 0 && vph >= threshold,
        channelName: ch.name || 'Kênh Chưa Rõ',
        channelAvatarUrl: ch.avatar_url || null,
        alertVphThreshold: threshold,
      };
    });

    // 6. Tổng kết theo kênh từ view server-side: channel_video_current_stats
    const { data: channelStatsData, error: chanStatsError } = await supabase
      .from('channel_video_current_stats')
      .select('channel_id, total_videos, rising_video_count, max_vph');

    if (chanStatsError) {
      throw new Error(`Lỗi tải thống kê kênh: ${chanStatsError.message}`);
    }

    const channelStatsMap = new Map<string, { risingCount: number; maxVph: number | null; totalVideos: number }>();
    if (channelStatsData) {
      for (const cs of channelStatsData) {
        channelStatsMap.set(cs.channel_id, {
          risingCount: Number(cs.rising_video_count) || 0,
          maxVph: cs.max_vph !== null && cs.max_vph !== undefined ? Number(cs.max_vph) : null,
          totalVideos: Number(cs.total_videos) || 0,
        });
      }
    }

    const topChannels: DashboardChannelSummary[] = (channelsData || [])
      .map(ch => {
        const stats = channelStatsMap.get(ch.id) || { risingCount: 0, maxVph: null, totalVideos: 0 };
        return {
          channelId: ch.id,
          channelName: ch.name,
          channelHandle: ch.handle,
          avatarUrl: ch.avatar_url,
          risingVideoCount: stats.risingCount,
          maxVph: stats.maxVph,
          totalVideos: stats.totalVideos,
        };
      })
      .sort((a, b) => {
        if (a.maxVph === null && b.maxVph === null) return b.risingVideoCount - a.risingVideoCount;
        if (a.maxVph === null) return 1;
        if (b.maxVph === null) return -1;
        return b.maxVph - a.maxVph;
      })
      .slice(0, 5);

    // 7. Lấy lịch sử quét (scan_runs)
    const { data: rawScans, error: scansError } = await supabase
      .from('scan_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);

    if (scansError) {
      throw new Error(`Lỗi tải lịch sử quét: ${scansError.message}`);
    }

    const recentScans: DashboardScanRun[] = (rawScans || []).map((s: any) => ({
      id: s.id,
      triggerSource: s.trigger_source,
      status: s.status,
      startedAt: s.started_at,
      finishedAt: s.finished_at || null,
      channelsTotal: Number(s.channels_total) || 0,
      channelsSuccess: Number(s.channels_success) || 0,
      channelsFailed: Number(s.channels_failed) || 0,
      videosFound: Number(s.videos_found) || 0,
      snapshotsCreated: Number(s.snapshots_created) || 0,
      alertsSent: Number(s.alerts_sent) || 0,
      errorSummary: s.error_summary || null,
    }));

    const latestScan = recentScans.length > 0 ? recentScans[0] : null;

    // 8. Lấy tổng kết cảnh báo Discord dùng exact count queries
    const [
      { count: totalAlerts, error: totalAlertsErr },
      { count: sentAlerts, error: sentAlertsErr },
      { count: pendingAlerts, error: pendingAlertsErr },
      { count: failedAlerts, error: failedAlertsErr },
    ] = await Promise.all([
      supabase.from('video_alerts').select('*', { count: 'exact', head: true }),
      supabase.from('video_alerts').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('video_alerts').select('*', { count: 'exact', head: true }).in('status', ['pending', 'sending']),
      supabase.from('video_alerts').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    ]);

    if (totalAlertsErr || sentAlertsErr || pendingAlertsErr || failedAlertsErr) {
      const alertErrMsg = totalAlertsErr?.message || sentAlertsErr?.message || pendingAlertsErr?.message || failedAlertsErr?.message;
      throw new Error(`Lỗi tải cảnh báo Discord: ${alertErrMsg}`);
    }

    const alertSummary: DashboardAlertSummary = {
      total: totalAlerts || 0,
      sent: sentAlerts || 0,
      pending: pendingAlerts || 0,
      failed: failedAlerts || 0,
    };

    return {
      activeChannelsCount: activeChannels.length,
      totalVideosCount: totalVideosCount || 0,
      risingVideosCount: risingVideosCount || 0,
      maxVph,
      latestScan,
      recentScans,
      topVideos,
      topChannels,
      alertSummary,
    };
  },

  /**
   * Định dạng nguồn kích hoạt (trigger_source)
   */
  formatTriggerSource(source: string | null | undefined): string {
    if (source === 'schedule') return 'Tự động';
    if (source === 'manual') return 'Thủ công';
    return source || 'Không rõ';
  },

  /**
   * Định dạng trạng thái lần quét và trả về text badge
   */
  formatScanStatus(status: string | null | undefined): { label: string; badgeText: string; tone: 'success' | 'warning' | 'danger' | 'info' } {
    switch (status) {
      case 'success':
        return { label: 'Thành công', badgeText: 'Hoạt động bình thường', tone: 'success' };
      case 'partial':
        return { label: 'Thành công một phần', badgeText: 'Có lỗi một phần', tone: 'warning' };
      case 'failed':
        return { label: 'Thất bại', badgeText: 'Cần kiểm tra', tone: 'danger' };
      case 'running':
        return { label: 'Đang chạy', badgeText: 'Đang quét dữ liệu', tone: 'info' };
      default:
        return { label: status || 'Không rõ', badgeText: 'Chưa có lần quét nào', tone: 'info' };
    }
  },
};
