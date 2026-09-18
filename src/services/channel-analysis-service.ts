// Service Layer: channel-analysis-service.ts
// Nguồn dữ liệu Phân Tích Kênh (Read-only từ Supabase production)
// TUYỆT ĐỐI KHÔNG TẠO DỮ LIỆU GIẢ. KHÔNG GỌI COLLECTOR.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { DatabaseNotConfiguredError } from './channel-service';
import {
  ChannelAnalysis,
  ChannelAnalysisHeader,
  ChannelVideoItem,
  ChannelAlertSummary,
  ChannelRecentAlert,
  ChannelVphDistribution,
} from '@/types/channel-analysis';
import { fetchAllBatches } from './query-pagination';

export const channelAnalysisService = {
  /**
   * Tải dữ liệu phân tích đầy đủ của một kênh theo UUID
   */
  async fetchChannelAnalysis(channelId: string): Promise<ChannelAnalysis | null> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const supabase = getSupabase()!;

    // 1. Lấy thông tin kênh
    const { data: channelData, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .maybeSingle();

    if (channelError) {
      throw new Error(`Lỗi tải thông tin kênh: ${channelError.message}`);
    }

    if (!channelData) {
      return null;
    }

    const rawThreshold = channelData.alert_vph_threshold;
    const threshold = rawThreshold !== null && rawThreshold !== undefined && !isNaN(Number(rawThreshold)) && Number(rawThreshold) > 0
      ? Number(rawThreshold)
      : null;

    const rawScanLimit = channelData.scan_limit;
    const scanLimit = rawScanLimit !== null && rawScanLimit !== undefined && !isNaN(Number(rawScanLimit)) && Number(rawScanLimit) > 0
      ? Number(rawScanLimit)
      : null;

    const channelHeader: ChannelAnalysisHeader = {
      id: channelData.id,
      name: channelData.name || 'Kênh Chưa Rõ',
      handle: channelData.handle || null,
      avatarUrl: channelData.avatar_url || null,
      status: channelData.status || 'active',
      scanLimit,
      alertVphThreshold: threshold,
      lastScanAt: channelData.last_scan_at || null,
      createdAt: channelData.created_at,
      url: channelData.url || `https://www.youtube.com/channel/${channelData.id}`,
    };

    // 2. Lấy toàn bộ video của kênh này với phân trang an toàn >1.000 video
    const videos = await fetchAllBatches<any>((from, to) =>
      supabase
        .from('videos')
        .select('*')
        .eq('channel_id', channelId)
        .order('published_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    );

    // 3. Lấy các alert liên quan đến video của kênh này (chunk <= 200 IDs để tránh URL quá dài)
    const videoIds = videos.map(v => v.id);
    const alertMap = new Map<string, any>();
    const alertsList: any[] = [];

    if (videoIds.length > 0) {
      const alertChunkSize = 200;
      for (let i = 0; i < videoIds.length; i += alertChunkSize) {
        const chunk = videoIds.slice(i, i + alertChunkSize);
        const { data: rawAlerts, error: alertsError } = await supabase
          .from('video_alerts')
          .select('*')
          .in('video_id', chunk);

        if (alertsError) {
          throw new Error(`Lỗi tải cảnh báo của kênh: ${alertsError.message}`);
        }

        if (rawAlerts) {
          for (const a of rawAlerts) {
            alertMap.set(a.video_id, a);
            alertsList.push(a);
          }
        }
      }
    }

    // 4. Chuẩn hóa danh sách ChannelVideoItem trực tiếp từ cached columns (Không query video_snapshots)
    const videoTitleMap = new Map<string, string>();
    const mappedVideos: ChannelVideoItem[] = videos.map(v => {
      videoTitleMap.set(v.id, v.title || 'Video Không Tiêu Đề');
      const vph = v.latest_measured_vph !== null && v.latest_measured_vph !== undefined
        ? Number(v.latest_measured_vph)
        : null;
      const isOver = vph !== null && threshold !== null && threshold > 0 && vph >= threshold;
      const alert = alertMap.get(v.id);

      return {
        id: v.id,
        youtubeVideoId: v.youtube_video_id,
        title: v.title || 'Video Không Tiêu Đề',
        url: v.url || `https://www.youtube.com/watch?v=${v.youtube_video_id}`,
        thumbnailUrl: v.thumbnail_url || null,
        publishedAt: v.published_at,
        latestViewCount: v.latest_view_count !== null && v.latest_view_count !== undefined && !isNaN(Number(v.latest_view_count))
          ? Number(v.latest_view_count)
          : null,
        latestMeasuredVph: vph,
        latestDeltaViews: v.latest_view_delta !== null && v.latest_view_delta !== undefined ? Number(v.latest_view_delta) : null,
        isOverThreshold: isOver,
        alertStatus: alert ? alert.status : null,
      };
    });

    // 6. Tính toán thống kê chính & Phân bố VPH
    let nullCount = 0;
    let zeroCount = 0;
    let risingCount = 0;
    let overThresholdCount = 0;
    let maxVph: number | null = null;
    let sumRisingVph = 0;

    for (const v of mappedVideos) {
      const vph = v.latestMeasuredVph;
      if (vph === null) {
        nullCount++;
      } else if (vph === 0) {
        zeroCount++;
      } else if (vph > 0) {
        risingCount++;
        sumRisingVph += vph;
        if (maxVph === null || vph > maxVph) {
          maxVph = vph;
        }
        if (v.isOverThreshold) {
          overThresholdCount++;
        }
      }
    }

    // VPH trung bình chỉ tính trên các video đang tăng (VPH > 0)
    const avgVph = risingCount > 0 ? Math.round(sumRisingVph / risingCount) : null;

    const distribution: ChannelVphDistribution = {
      nullCount,
      zeroCount,
      risingCount,
      overThresholdCount,
    };

    // 7. Sắp xếp danh sách video
    // Top 5 VPH DESC (NULLs last)
    const topRisingVideos = [...mappedVideos]
      .sort((a, b) => {
        if (a.latestMeasuredVph === null && b.latestMeasuredVph === null) return 0;
        if (a.latestMeasuredVph === null) return 1;
        if (b.latestMeasuredVph === null) return -1;
        return b.latestMeasuredVph - a.latestMeasuredVph;
      })
      .slice(0, 5);

    // Top 10 VPH DESC cho biểu đồ
    const topVphChartVideos = [...mappedVideos]
      .sort((a, b) => {
        if (a.latestMeasuredVph === null && b.latestMeasuredVph === null) return 0;
        if (a.latestMeasuredVph === null) return 1;
        if (b.latestMeasuredVph === null) return -1;
        return b.latestMeasuredVph - a.latestMeasuredVph;
      })
      .slice(0, 10);

    // Top 10 Published DESC (Mới nhất)
    const latestVideos = [...mappedVideos]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);

    // 8. Tổng kết Alert
    const recentAlerts: ChannelRecentAlert[] = alertsList
      .sort((a, b) => {
        const timeA = a.sent_at ? new Date(a.sent_at).getTime() : 0;
        const timeB = b.sent_at ? new Date(b.sent_at).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        videoId: a.video_id,
        videoTitle: videoTitleMap.get(a.video_id) || 'Video Không Tiêu Đề',
        measuredVph: a.measured_vph !== null ? Number(a.measured_vph) : null,
        status: a.status,
        sentAt: a.sent_at || null,
      }));

    const alertSummary: ChannelAlertSummary = {
      total: alertsList.length,
      sent: alertsList.filter(a => a.status === 'sent').length,
      pending: alertsList.filter(a => a.status === 'pending' || a.status === 'sending').length,
      failed: alertsList.filter(a => a.status === 'failed').length,
      recentAlerts,
    };

    return {
      channel: channelHeader,
      totalVideos: mappedVideos.length,
      risingVideos: risingCount,
      maxVph,
      avgVph,
      distribution,
      topRisingVideos,
      latestVideos,
      topVphChartVideos,
      alertSummary,
    };
  },

  /**
   * Tính toán VPH trung bình (hàm thuần túy để test)
   */
  calculateAverageVph(vphs: (number | null)[]): number | null {
    const valid = vphs.filter((v): v is number => v !== null && v !== undefined && v > 0);
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / valid.length);
  },
};
