// Service Layer: opportunity-service.ts
// Nguồn dữ liệu Video Tiềm Năng (Read-only từ Supabase production)
// TUYỆT ĐỐI KHÔNG TẠO DỮ LIỆU GIẢ. KHÔNG GỌI COLLECTOR KHI LÀM MỚI.
// TUYỆT ĐỐI KHÔNG DỰ ĐOÁN TƯƠNG LAI / KHÔNG TẠO SCORE CHỦ QUAN.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import {
  OpportunityVideo,
  OpportunityStats,
  OpportunityFilterState,
  OpportunitySortOption,
  OpportunityChannelMeta,
  OpportunityAlertMeta,
} from '@/types/opportunity';
import { fetchAllBatches } from './query-pagination';

export const opportunityService = {
  /**
   * Tải toàn bộ video có VPH đo được > 0 từ Supabase production (Hỗ trợ >1.000 video với pagination)
   */
  async fetchOpportunityVideos(): Promise<OpportunityVideo[]> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const supabase = getSupabase()!;

    // 1. Query danh sách video kèm kênh và alert liên kết với phân trang an toàn
    const rawVideos = await fetchAllBatches<any>((from, to) =>
      supabase
        .from('videos')
        .select('*, channels(id, name, handle, avatar_url, alert_vph_threshold), video_alerts(id, status, measured_vph, sent_at)')
        .gt('latest_measured_vph', 0)
        .order('latest_measured_vph', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    );

    const candidateVideos = rawVideos || [];
    if (candidateVideos.length === 0) {
      return [];
    }

    // 2. Chuẩn hóa thành danh sách OpportunityVideo từ cached columns (Không query video_snapshots)
    const now = new Date();
    return candidateVideos.map((raw: any) => {
      const channelData = raw.channels || {};
      const channelThreshold = Number(channelData.alert_vph_threshold) || 5000;

      const channelMeta: OpportunityChannelMeta = {
        id: channelData.id || raw.channel_id,
        name: channelData.name || 'Kênh Chưa Rõ',
        handle: channelData.handle || null,
        avatarUrl: channelData.avatar_url || null,
        alertVphThreshold: channelThreshold,
      };

      let alertMeta: OpportunityAlertMeta | null = null;
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

      const vph = Number(raw.latest_measured_vph) || 0;
      const ratio = channelThreshold > 0 ? Math.round((vph / channelThreshold) * 100) : 0;
      const isOver = channelThreshold > 0 && vph >= channelThreshold;

      return {
        id: raw.id,
        youtubeVideoId: raw.youtube_video_id,
        channelId: raw.channel_id,
        title: raw.title || 'Video Không Tiêu Đề',
        url: raw.url || `https://www.youtube.com/watch?v=${raw.youtube_video_id}`,
        thumbnailUrl: raw.thumbnail_url || null,
        publishedAt: raw.published_at,
        videoAge: this.formatVideoAge(raw.published_at, now),
        latestViewCount: Number(raw.latest_view_count) || 0,
        latestMeasuredVph: vph,
        latestDeltaViews: raw.latest_view_delta !== null && raw.latest_view_delta !== undefined ? Number(raw.latest_view_delta) : null,
        channel: channelMeta,
        thresholdRatio: ratio,
        isOverThreshold: isOver,
        alert: alertMeta,
      };
    });
  },

  /**
   * Lọc video theo khoảng thời gian, kênh, tìm kiếm và quick filter
   */
  filterOpportunityVideos(
    videos: OpportunityVideo[],
    filters: OpportunityFilterState,
    now: Date = new Date()
  ): OpportunityVideo[] {
    const nowTime = now.getTime();

    // 1. Khoảng thời gian xuất bản
    let timeLimitMs: number | null = null;
    switch (filters.timeWindow) {
      case '24h':
        timeLimitMs = 24 * 60 * 60 * 1000;
        break;
      case '3d':
        timeLimitMs = 3 * 24 * 60 * 60 * 1000;
        break;
      case '7d':
        timeLimitMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeLimitMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
      default:
        timeLimitMs = null;
        break;
    }

    return videos.filter(v => {
      // Điều kiện tiên quyết: VPH đo được > 0
      if (!v.latestMeasuredVph || v.latestMeasuredVph <= 0) {
        return false;
      }

      // Kiểm tra mốc thời gian xuất bản
      if (timeLimitMs !== null) {
        const pubTime = new Date(v.publishedAt).getTime();
        if (pubTime < nowTime - timeLimitMs) {
          return false;
        }
      }

      // Lọc theo kênh
      if (filters.channelId !== 'all' && v.channelId !== filters.channelId) {
        return false;
      }

      // Tìm kiếm theo tiêu đề video, tên kênh, handle kênh
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchTitle = v.title.toLowerCase().includes(q);
        const matchChannel = v.channel.name.toLowerCase().includes(q);
        const matchHandle = v.channel.handle ? v.channel.handle.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchChannel && !matchHandle) {
          return false;
        }
      }

      // Quick filter
      if (filters.quickFilter === 'over_threshold' && !v.isOverThreshold) {
        return false;
      }
      if (filters.quickFilter === 'alerted' && (!v.alert || v.alert.status !== 'sent')) {
        return false;
      }
      if (filters.quickFilter === 'unalerted' && v.alert && v.alert.status === 'sent') {
        return false;
      }

      return true;
    });
  },

  /**
   * Sắp xếp video theo tùy chọn
   */
  sortOpportunityVideos(
    videos: OpportunityVideo[],
    sortOption: OpportunitySortOption
  ): OpportunityVideo[] {
    const list = [...videos];
    switch (sortOption) {
      case 'vph_desc':
        return list.sort((a, b) => b.latestMeasuredVph - a.latestMeasuredVph);
      case 'published_desc':
        return list.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      case 'delta_desc':
        return list.sort((a, b) => (b.latestDeltaViews ?? 0) - (a.latestDeltaViews ?? 0));
      case 'threshold_ratio_desc':
        return list.sort((a, b) => b.thresholdRatio - a.thresholdRatio);
      default:
        return list;
    }
  },

  /**
   * Tính toán 4 chỉ số thống kê đầu trang
   */
  calculateOpportunityStats(
    filteredVideos: OpportunityVideo[],
    now: Date = new Date()
  ): OpportunityStats {
    const nowTime = now.getTime();
    const ms24h = 24 * 60 * 60 * 1000;

    let new24hCount = 0;
    let maxVph: number | null = null;
    let overThresholdCount = 0;

    for (const v of filteredVideos) {
      const pubTime = new Date(v.publishedAt).getTime();
      if (pubTime >= nowTime - ms24h) {
        new24hCount++;
      }
      if (maxVph === null || v.latestMeasuredVph > maxVph) {
        maxVph = v.latestMeasuredVph;
      }
      if (v.isOverThreshold) {
        overThresholdCount++;
      }
    }

    return {
      potentialCount: filteredVideos.length,
      new24hCount,
      maxVph,
      overThresholdCount,
    };
  },

  /**
   * Định dạng tuổi video tính từ published_at đến thời gian hiện tại
   * Ví dụ: 42 phút, 6 giờ, 1 ngày 4 giờ, 3 ngày
   */
  formatVideoAge(publishedAt: string, now: Date = new Date()): string {
    if (!publishedAt) return '—';
    const pubTime = new Date(publishedAt).getTime();
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - pubTime) / 1000));

    if (diffSeconds < 60) {
      return 'Vừa xong';
    }

    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) {
      return `${minutes} phút`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} giờ`;
    }

    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    if (remHours > 0) {
      return `${days} ngày ${remHours} giờ`;
    }
    return `${days} ngày`;
  },

  /**
   * Tính toán và định dạng thanh tiến trình so với ngưỡng cảnh báo
   */
  formatThresholdProgress(
    vph: number,
    threshold: number
  ): {
    ratio: number;
    percentText: string;
    visualWidthPercent: number;
    isOver: boolean;
  } {
    if (!threshold || threshold <= 0) {
      return { ratio: 0, percentText: '—', visualWidthPercent: 0, isOver: false };
    }
    const ratio = Math.round((vph / threshold) * 100);
    const isOver = vph >= threshold;
    const visualWidthPercent = Math.min(100, Math.max(ratio > 0 ? 2 : 0, ratio));
    return {
      ratio,
      percentText: `${ratio}% ngưỡng`,
      visualWidthPercent,
      isOver,
    };
  },

  /**
   * Ánh xạ trạng thái cảnh báo Discord
   */
  getAlertBadge(alert: OpportunityAlertMeta | null): {
    label: string;
    tone: 'muted' | 'warning' | 'success' | 'danger';
  } {
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
