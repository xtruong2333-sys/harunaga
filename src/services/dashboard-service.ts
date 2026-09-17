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

    // 2. Lấy toàn bộ video
    const { data: videosData, error: videosError } = await supabase
      .from('videos')
      .select('id, youtube_video_id, channel_id, title, url, thumbnail_url, published_at, latest_view_count, latest_measured_vph');

    if (videosError) {
      throw new Error(`Lỗi tải danh sách video: ${videosError.message}`);
    }

    const videos = videosData || [];

    // 3. Lấy snapshot mới nhất để có view_delta của mỗi video
    const { data: snapshotsData, error: snapError } = await supabase
      .from('video_snapshots')
      .select('video_id, view_delta, checked_at')
      .order('checked_at', { ascending: false });

    if (snapError) {
      throw new Error(`Lỗi tải lịch sử snapshot: ${snapError.message}`);
    }

    const latestSnapMap = new Map<string, number | null>();
    if (snapshotsData) {
      for (const s of snapshotsData) {
        if (!latestSnapMap.has(s.video_id)) {
          latestSnapMap.set(s.video_id, s.view_delta !== null && s.view_delta !== undefined ? Number(s.view_delta) : null);
        }
      }
    }

    // 4. Tính toán các chỉ số thống kê chính
    let risingCount = 0;
    let maxVph: number | null = null;

    for (const v of videos) {
      const vph = v.latest_measured_vph !== null && v.latest_measured_vph !== undefined ? Number(v.latest_measured_vph) : null;
      if (vph !== null && vph > 0) {
        risingCount++;
        if (maxVph === null || vph > maxVph) {
          maxVph = vph;
        }
      }
    }

    // 5. Chuẩn bị Top 5 video theo VPH DESC (NULLs last)
    const sortedVideos = [...videos].sort((a, b) => {
      const vphA = a.latest_measured_vph !== null && a.latest_measured_vph !== undefined ? Number(a.latest_measured_vph) : null;
      const vphB = b.latest_measured_vph !== null && b.latest_measured_vph !== undefined ? Number(b.latest_measured_vph) : null;
      if (vphA === null && vphB === null) return 0;
      if (vphA === null) return 1;
      if (vphB === null) return -1;
      return vphB - vphA;
    });

    const topVideos: DashboardTopVideo[] = sortedVideos.slice(0, 5).map(v => {
      const ch = channelMap.get(v.channel_id) || {};
      const vph = v.latest_measured_vph !== null && v.latest_measured_vph !== undefined ? Number(v.latest_measured_vph) : null;
      const threshold = Number(ch.alert_vph_threshold) || 5000;
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
        latestDeltaViews: latestSnapMap.get(v.id) ?? null,
        isOverThreshold: vph !== null && threshold > 0 && vph >= threshold,
        channelName: ch.name || 'Kênh Chưa Rõ',
        channelAvatarUrl: ch.avatar_url || null,
        alertVphThreshold: threshold,
      };
    });

    // 6. Tổng kết theo kênh (Kênh đang có video tăng)
    const channelStatsMap = new Map<string, { risingCount: number; maxVph: number | null; totalVideos: number }>();
    for (const v of videos) {
      const cId = v.channel_id;
      if (!channelStatsMap.has(cId)) {
        channelStatsMap.set(cId, { risingCount: 0, maxVph: null, totalVideos: 0 });
      }
      const item = channelStatsMap.get(cId)!;
      item.totalVideos++;
      const vph = v.latest_measured_vph !== null && v.latest_measured_vph !== undefined ? Number(v.latest_measured_vph) : null;
      if (vph !== null && vph > 0) {
        item.risingCount++;
        if (item.maxVph === null || vph > item.maxVph) {
          item.maxVph = vph;
        }
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

    // 8. Lấy tổng kết cảnh báo Discord
    const { data: alertsData, error: alertsError } = await supabase
      .from('video_alerts')
      .select('status');

    if (alertsError) {
      throw new Error(`Lỗi tải cảnh báo Discord: ${alertsError.message}`);
    }

    const alerts = alertsData || [];
    const alertSummary: DashboardAlertSummary = {
      total: alerts.length,
      sent: alerts.filter(a => a.status === 'sent').length,
      pending: alerts.filter(a => a.status === 'pending' || a.status === 'sending').length,
      failed: alerts.filter(a => a.status === 'failed').length,
    };

    return {
      activeChannelsCount: activeChannels.length,
      totalVideosCount: videos.length,
      risingVideosCount: risingCount,
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
