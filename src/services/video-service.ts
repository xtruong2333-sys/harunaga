// Service Layer: video-service.ts
// Nguồn dữ liệu Video Đang Tăng (Read-only từ Supabase production)
// TUYỆT ĐỐI KHÔNG TẠO DỮ LIỆU GIẢ. KHÔNG GỌI COLLECTOR KHI LÀM MỚI.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import {
  VideoListItem,
  VideoSortOption,
  VideoFilterOption,
  VideoStatsSummary,
  VideoChannelMeta,
  VideoAlertMeta,
  VideoDetail,
  VideoSnapshotPoint,
  VideoAlertInfo,
  VideoDetailChannelMeta,
} from '@/types/video';
import { fetchAllBatches } from './query-pagination';

export const videoService = {
  /**
   * Tải danh sách video thật kèm kênh, snapshot mới nhất và trạng thái cảnh báo
   */
  async fetchTrendingVideos(): Promise<{ videos: VideoListItem[]; stats: VideoStatsSummary }> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const supabase = getSupabase()!;

    // 1. Query danh sách video kèm kênh và alert liên kết với phân trang an toàn >1.000 video
    const rawVideos = await fetchAllBatches<any>((from, to) =>
      supabase
        .from('videos')
        .select('*, channels(id, name, handle, avatar_url, alert_vph_threshold), video_alerts(id, status, measured_vph, sent_at, created_at)')
        .order('published_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    );

    // 2. Chuẩn hóa thành VideoListItem[] trực tiếp từ cached columns
    const videos: VideoListItem[] = (rawVideos || []).map((raw: any) => {
      const channelData = raw.channels || {};
      const rawThreshold = channelData.alert_vph_threshold;
      const channelThreshold =
        rawThreshold !== null &&
        rawThreshold !== undefined &&
        !isNaN(Number(rawThreshold)) &&
        Number(rawThreshold) > 0
          ? Number(rawThreshold)
          : null;

      const channelMeta: VideoChannelMeta = {
        id: channelData.id || raw.channel_id,
        name: channelData.name || 'Kênh Chưa Rõ',
        handle: channelData.handle || null,
        avatarUrl: channelData.avatar_url || null,
        alertVphThreshold: channelThreshold,
      };

      // Xử lý alert join an toàn: lấy alert mới nhất theo timestamp
      let alertMeta: VideoAlertMeta | null = null;
      if (raw.video_alerts) {
        const alertsArray = Array.isArray(raw.video_alerts) ? raw.video_alerts : [raw.video_alerts];
        if (alertsArray.length > 0) {
          const sorted = [...alertsArray].sort((a, b) => {
            const timeA = new Date(a.sent_at || a.created_at || 0).getTime();
            const timeB = new Date(b.sent_at || b.created_at || 0).getTime();
            return timeB - timeA;
          });
          const a = sorted[0];
          if (a && a.id) {
            alertMeta = {
              id: a.id,
              status: a.status,
              measuredVph: a.measured_vph !== null && a.measured_vph !== undefined ? Number(a.measured_vph) : null,
              sentAt: a.sent_at || null,
            };
          }
        }
      }

      const latestVph = raw.latest_measured_vph !== null && raw.latest_measured_vph !== undefined
        ? Number(raw.latest_measured_vph)
        : null;

      const latestDelta = raw.latest_view_delta !== null && raw.latest_view_delta !== undefined
        ? Number(raw.latest_view_delta)
        : null;

      const latestViews =
        raw.latest_view_count !== null && raw.latest_view_count !== undefined && !isNaN(Number(raw.latest_view_count))
          ? Number(raw.latest_view_count)
          : null;

      const latestSnap = raw.latest_snapshot_checked_at
        ? {
            viewDelta: latestDelta,
            checkedAt: raw.latest_snapshot_checked_at,
          }
        : null;

      const isOverThreshold =
        latestVph !== null &&
        channelThreshold !== null &&
        channelThreshold > 0 &&
        latestVph >= channelThreshold;

      return {
        id: raw.id,
        youtubeVideoId: raw.youtube_video_id,
        channelId: raw.channel_id,
        title: raw.title || 'Video Không Tiêu Đề',
        url: raw.url || `https://www.youtube.com/watch?v=${raw.youtube_video_id}`,
        thumbnailUrl: raw.thumbnail_url || null,
        publishedAt: raw.published_at,
        latestViewCount: latestViews,
        latestMeasuredVph: latestVph,
        channel: channelMeta,
        alert: alertMeta,
        latestSnapshot: latestSnap,
        latestDeltaViews: latestDelta,
        isOverThreshold,
      };
    });

    // 3. Tính toán thống kê đầu trang
    const stats: VideoStatsSummary = this.calculateStats(videos);

    return { videos, stats };
  },

  /**
   * Tính toán các chỉ số thống kê
   */
  calculateStats(videos: VideoListItem[]): VideoStatsSummary {
    let maxVph: number | null = null;
    let risingVideos = 0;
    let alertedVideos = 0;
    let totalDelta = 0;

    for (const v of videos) {
      if (v.latestMeasuredVph !== null && v.latestMeasuredVph > 0) {
        risingVideos++;
        if (maxVph === null || v.latestMeasuredVph > maxVph) {
          maxVph = v.latestMeasuredVph;
        }
      }
      if (v.latestDeltaViews !== null && v.latestDeltaViews !== undefined && v.latestDeltaViews > 0) {
        totalDelta += v.latestDeltaViews;
      }
      if (v.alert && v.alert.status === 'sent') {
        alertedVideos++;
      }
    }

    return {
      totalVideos: videos.length,
      risingVideos,
      maxVph,
      totalDelta: totalDelta > 0 ? totalDelta : null,
      alertedVideos,
    };
  },

  /**
   * Sắp xếp danh sách video theo tiêu chí
   */
  sortVideos(videos: VideoListItem[], sort: VideoSortOption): VideoListItem[] {
    const list = [...videos];

    switch (sort) {
      case 'vph_desc':
        return list.sort((a, b) => {
          if (a.latestMeasuredVph === null && b.latestMeasuredVph === null) return 0;
          if (a.latestMeasuredVph === null) return 1;
          if (b.latestMeasuredVph === null) return -1;
          return b.latestMeasuredVph - a.latestMeasuredVph;
        });

      case 'views_desc':
        return list.sort((a, b) => (b.latestViewCount ?? -1) - (a.latestViewCount ?? -1));

      case 'published_desc':
        return list.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

      case 'delta_desc':
        return list.sort((a, b) => {
          const deltaA = a.latestDeltaViews ?? a.latestSnapshot?.viewDelta ?? null;
          const deltaB = b.latestDeltaViews ?? b.latestSnapshot?.viewDelta ?? null;
          if (deltaA === null && deltaB === null) return 0;
          if (deltaA === null) return 1;
          if (deltaB === null) return -1;
          return deltaB - deltaA;
        });

      default:
        return list;
    }
  },

  /**
   * Lọc danh sách video theo trạng thái, kênh và từ khóa tìm kiếm
   */
  filterVideos(
    videos: VideoListItem[],
    filter: VideoFilterOption,
    channelId: string,
    query: string
  ): VideoListItem[] {
    let result = [...videos];

    // 1. Lọc theo trạng thái
    if (filter === 'rising') {
      result = result.filter(v => v.latestMeasuredVph !== null && v.latestMeasuredVph > 0);
    } else if (filter === 'alerted') {
      result = result.filter(v => v.alert?.status === 'sent');
    } else if (filter === 'unalerted') {
      result = result.filter(v => !v.alert || v.alert.status !== 'sent');
    }

    // 2. Lọc theo kênh
    if (channelId && channelId !== 'all') {
      result = result.filter(v => v.channelId === channelId);
    }

    // 3. Tìm kiếm không phân biệt hoa thường theo tiêu đề hoặc tên/handle kênh
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        v =>
          v.title.toLowerCase().includes(q) ||
          v.channel.name.toLowerCase().includes(q) ||
          (v.channel.handle && v.channel.handle.toLowerCase().includes(q))
      );
    }

    return result;
  },

  /**
   * Tải chi tiết 1 video theo ID
   */
  async fetchVideoDetail(id: string): Promise<VideoDetail> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const supabase = getSupabase()!;

    // 1. Query thông tin video kèm kênh và alert
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .select('*, channels(*), video_alerts(*)')
      .eq('id', id)
      .single();

    if (videoError || !videoData) {
      throw new Error(videoError?.message || 'Không tìm thấy video');
    }

    // 2. Query lịch sử snapshots sắp xếp theo thời gian mới nhất
    const { data: snapshotsData, error: snapshotsError } = await supabase
      .from('video_snapshots')
      .select('*')
      .eq('video_id', id)
      .order('checked_at', { ascending: false });

    if (snapshotsError) {
      throw new Error(snapshotsError.message);
    }

    const snapshots: VideoSnapshotPoint[] = (snapshotsData || []).map((s: any) => ({
      id: s.id,
      checkedAt: s.checked_at,
      viewCount: Number(s.view_count) || 0,
      viewDelta: s.view_delta !== null && s.view_delta !== undefined ? Number(s.view_delta) : null,
      elapsedSeconds: s.elapsed_seconds !== null && s.elapsed_seconds !== undefined ? Number(s.elapsed_seconds) : null,
      measuredVph: s.measured_vph !== null && s.measured_vph !== undefined ? Number(s.measured_vph) : null,
    }));

    // 3. Chuẩn hóa channel meta
    const ch = videoData.channels || {};
    const channelThreshold = ch.alert_vph_threshold !== null && ch.alert_vph_threshold !== undefined && !isNaN(Number(ch.alert_vph_threshold)) && Number(ch.alert_vph_threshold) > 0
      ? Number(ch.alert_vph_threshold)
      : null;

    const channelMeta: VideoDetailChannelMeta = {
      id: ch.id || videoData.channel_id,
      name: ch.name || 'Kênh Chưa Rõ',
      handle: ch.handle || null,
      avatarUrl: ch.avatar_url || null,
      alertVphThreshold: channelThreshold,
      scanLimit: ch.scan_limit !== null && ch.scan_limit !== undefined && !isNaN(Number(ch.scan_limit))
        ? Number(ch.scan_limit)
        : null,
      status: ch.status || 'active',
      url: ch.url || `https://www.youtube.com/channel/${ch.youtube_channel_id || ''}`,
    };

    // 4. Chuẩn hóa alert info
    let alertInfo: VideoAlertInfo | null = null;
    if (videoData.video_alerts) {
      const alertsArray = Array.isArray(videoData.video_alerts) ? videoData.video_alerts : [videoData.video_alerts];
      if (alertsArray.length > 0) {
        const sorted = [...alertsArray].sort((a, b) => {
          const timeA = new Date(a.sent_at || a.created_at || 0).getTime();
          const timeB = new Date(b.sent_at || b.created_at || 0).getTime();
          return timeB - timeA;
        });
        const a = sorted[0];
        if (a && a.id) {
          alertInfo = {
            id: a.id,
            status: a.status,
            measuredVph: a.measured_vph !== null && a.measured_vph !== undefined ? Number(a.measured_vph) : null,
            sentAt: a.sent_at || null,
            lastError: a.last_error || null,
          };
        }
      }
    }

    const latestVph = videoData.latest_measured_vph !== null && videoData.latest_measured_vph !== undefined
      ? Number(videoData.latest_measured_vph)
      : null;

    const isOverThreshold =
      latestVph !== null &&
      channelThreshold !== null &&
      channelThreshold > 0 &&
      latestVph >= channelThreshold;

    const latestViewCount = videoData.latest_view_count !== null && videoData.latest_view_count !== undefined && !isNaN(Number(videoData.latest_view_count))
      ? Number(videoData.latest_view_count)
      : null;

    return {
      id: videoData.id,
      youtubeVideoId: videoData.youtube_video_id,
      channelId: videoData.channel_id,
      title: videoData.title || 'Video Không Tiêu Đề',
      url: videoData.url || `https://www.youtube.com/watch?v=${videoData.youtube_video_id}`,
      thumbnailUrl: videoData.thumbnail_url || null,
      publishedAt: videoData.published_at,
      duration: videoData.duration || null,
      latestViewCount,
      latestMeasuredVph: latestVph,
      channel: channelMeta,
      alert: alertInfo,
      snapshots,
      latestSnapshot: snapshots[0] || null,
      isOverThreshold,
      createdAt: videoData.created_at,
      updatedAt: videoData.updated_at,
    };
  },

  /**
   * Định dạng khoảng thời gian trôi qua giữa các snapshot
   */
  formatElapsedSeconds(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || seconds < 0) {
      return '—';
    }
    if (seconds < 60) {
      return `${seconds} giây`;
    }
    const minutes = Math.floor(seconds / 60);
    if (seconds < 3600) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }
    return `${hours} giờ ${remainingMinutes} phút`;
  },

  /**
   * Nhãn và màu trạng thái cảnh báo Discord
   */
  getAlertBadge(alert: any): { label: string; tone: 'muted' | 'warning' | 'success' | 'danger' } {
    if (!alert) {
      return { label: 'Chưa cảnh báo', tone: 'muted' };
    }
    switch (alert.status) {
      case 'pending':
        return { label: 'Chờ gửi', tone: 'warning' };
      case 'sending':
        return { label: 'Đang gửi', tone: 'warning' };
      case 'sent':
        return { label: 'Đã gửi', tone: 'success' };
      case 'failed':
        return { label: 'Gửi lỗi', tone: 'danger' };
      default:
        return { label: 'Chưa cảnh báo', tone: 'muted' };
    }
  },

  /**
   * Định dạng VPH chuẩn
   */
  formatVph(vph: number | null | undefined): string {
    if (vph === null || vph === undefined) {
      return 'Chưa đủ dữ liệu';
    }
    return `${Math.round(vph).toLocaleString('vi-VN')} VPH`;
  },

  /**
   * Định dạng số lượt xem có dấu phân cách
   */
  formatViews(views: number | null | undefined): string {
    if (views === null || views === undefined) {
      return '—';
    }
    return Math.round(views).toLocaleString('vi-VN');
  },

  /**
   * Định dạng delta lượt xem
   */
  formatViewDelta(delta: number | null | undefined): string {
    if (delta === null || delta === undefined) {
      return '—';
    }
    if (delta === 0) {
      return '0 lượt xem';
    }
    const prefix = delta > 0 ? '+' : '';
    return `${prefix}${Math.round(delta).toLocaleString('vi-VN')} lượt xem`;
  },

  /**
   * Định dạng thời gian tương đối
   */
  formatRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Vừa xong';
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  },
};

