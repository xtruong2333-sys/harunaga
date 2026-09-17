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
} from '@/types/video';

export const videoService = {
  /**
   * Tải danh sách video thật kèm kênh, snapshot mới nhất và trạng thái cảnh báo
   */
  async fetchTrendingVideos(): Promise<{ videos: VideoListItem[]; stats: VideoStatsSummary }> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const supabase = getSupabase()!;

    // 1. Query danh sách video kèm kênh và alert liên kết
    const { data: rawVideos, error: videoError } = await supabase
      .from('videos')
      .select('*, channels(id, name, handle, avatar_url, alert_vph_threshold), video_alerts(id, status, measured_vph, sent_at)');

    if (videoError) {
      throw new Error(`Lỗi tải danh sách video: ${videoError.message}`);
    }

    // 2. Query snapshots để trích xuất view_delta mới nhất của mỗi video
    const { data: rawSnapshots, error: snapError } = await supabase
      .from('video_snapshots')
      .select('video_id, view_delta, checked_at')
      .order('checked_at', { ascending: false });

    if (snapError) {
      throw new Error(`Lỗi tải lịch sử lượt xem: ${snapError.message}`);
    }

    // Ánh xạ snapshot mới nhất theo từng video_id
    const latestSnapshotMap = new Map<string, { viewDelta: number | null; checkedAt: string }>();
    if (rawSnapshots) {
      for (const snap of rawSnapshots) {
        if (!latestSnapshotMap.has(snap.video_id)) {
          latestSnapshotMap.set(snap.video_id, {
            viewDelta: snap.view_delta !== null && snap.view_delta !== undefined ? Number(snap.view_delta) : null,
            checkedAt: snap.checked_at,
          });
        }
      }
    }

    // 3. Chuẩn hóa thành VideoListItem[]
    const videos: VideoListItem[] = (rawVideos || []).map((raw: any) => {
      const channelData = raw.channels || {};
      const channelMeta: VideoChannelMeta = {
        id: channelData.id || raw.channel_id,
        name: channelData.name || 'Kênh Chưa Rõ',
        handle: channelData.handle || null,
        avatarUrl: channelData.avatar_url || null,
        alertVphThreshold: Number(channelData.alert_vph_threshold) || 5000,
      };

      // Xử lý alert join (có thể là object hoặc array 1 phần tử)
      let alertMeta: VideoAlertMeta | null = null;
      if (raw.video_alerts) {
        const a = Array.isArray(raw.video_alerts) ? raw.video_alerts[0] : raw.video_alerts;
        if (a) {
          alertMeta = {
            id: a.id,
            status: a.status,
            measuredVph: a.measured_vph !== null ? Number(a.measured_vph) : null,
            sentAt: a.sent_at || null,
          };
        }
      }

      const latestVph = raw.latest_measured_vph !== null && raw.latest_measured_vph !== undefined
        ? Number(raw.latest_measured_vph)
        : null;

      const latestSnap = latestSnapshotMap.get(raw.id) || null;

      const isOverThreshold =
        latestVph !== null &&
        channelMeta.alertVphThreshold > 0 &&
        latestVph >= channelMeta.alertVphThreshold;

      return {
        id: raw.id,
        youtubeVideoId: raw.youtube_video_id,
        channelId: raw.channel_id,
        title: raw.title || 'Video Không Tiêu Đề',
        url: raw.url || `https://www.youtube.com/watch?v=${raw.youtube_video_id}`,
        thumbnailUrl: raw.thumbnail_url || null,
        publishedAt: raw.published_at,
        latestViewCount: Number(raw.latest_view_count) || 0,
        latestMeasuredVph: latestVph,
        channel: channelMeta,
        alert: alertMeta,
        latestSnapshot: latestSnap,
        latestDeltaViews: latestSnap ? latestSnap.viewDelta : null,
        isOverThreshold,
      };
    });

    // 4. Tính toán thống kê đầu trang
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

    for (const v of videos) {
      if (v.latestMeasuredVph !== null && v.latestMeasuredVph > 0) {
        risingVideos++;
        if (maxVph === null || v.latestMeasuredVph > maxVph) {
          maxVph = v.latestMeasuredVph;
        }
      }
      if (v.alert && v.alert.status === 'sent') {
        alertedVideos++;
      }
    }

    return {
      totalVideos: videos.length,
      risingVideos,
      maxVph,
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
        return list.sort((a, b) => b.latestViewCount - a.latestViewCount);

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

    // 3. Lọc theo từ khóa tìm kiếm
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(v => {
        const matchTitle = v.title.toLowerCase().includes(q);
        const matchChannel = v.channel.name.toLowerCase().includes(q);
        const matchHandle = v.channel.handle ? v.channel.handle.toLowerCase().includes(q) : false;
        return matchTitle || matchChannel || matchHandle;
      });
    }

    return result;
  },

  /**
   * Định dạng số lượt xem theo chuẩn Việt Nam (ví dụ 876.183)
   */
  formatViews(count: number): string {
    if (count === null || count === undefined || isNaN(count)) return '0';
    return Math.round(count).toLocaleString('vi-VN');
  },

  /**
   * Định dạng VPH đo được
   */
  formatVph(vph: number | null): string {
    if (vph === null || vph === undefined) {
      return 'Chưa đủ dữ liệu';
    }
    if (vph === 0) {
      return '0 VPH';
    }
    const rounded = Math.round(vph);
    return `${rounded.toLocaleString('vi-VN')} VPH`;
  },

  /**
   * Định dạng lượt tăng từ lần đo trước
   */
  formatViewDelta(delta: number | null | undefined): string {
    if (delta === null || delta === undefined) {
      return '—';
    }
    if (delta <= 0) {
      return '0 lượt xem';
    }
    return `+${Math.round(delta).toLocaleString('vi-VN')} lượt xem`;
  },

  /**
   * Định dạng thời gian tương đối
   */
  formatRelativeTime(isoDate: string): string {
    if (!isoDate) return '';
    const now = new Date();
    const past = new Date(isoDate);
    const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffSeconds < 60) return 'Vừa xong';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} ngày trước`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} tháng trước`;
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} năm trước`;
  },

  /**
   * Trả về thông tin hiển thị trạng thái cảnh báo
   */
  getAlertBadge(alert: VideoAlertMeta | null): { label: string; tone: 'muted' | 'warning' | 'success' | 'danger' } {
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
};
