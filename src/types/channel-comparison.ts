// src/types/channel-comparison.ts
// Các kiểu dữ liệu cho tính năng So Sánh Kênh (Phase 12)

export type ComparisonTimeWindow = '24h' | '3d' | '7d' | '30d' | 'all';

export interface ComparableChannelOption {
  id: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  status: 'active' | 'paused' | 'archived';
}

export interface ChannelComparisonMetrics {
  videoCount: number;
  risingVideoCount: number;
  risingVideoRatio: number | null; // Tỷ lệ %, null nếu không có video nào có VPH
  maxVph: number | null;
  avgMeasuredVph: number | null; // Trung bình đo được (bao gồm 0, loại trừ NULL)
  trackedViews: number | null; // Lượt xem đang theo dõi, null nếu toàn bộ video không có lượt xem
  latestViewDelta: number | null; // Tổng view_delta ở snapshot mới nhất của mỗi video
  videosWithVphCount: number;
}

export interface ChannelPublishingMetrics {
  publishedLast7d: number;
  publishedLast30d: number;
  avgDaysBetweenPosts: number | null;
  mostCommonWeekday: string | null;
  commonHourWindow: string | null;
  sampleCount: number;
}

export interface ChannelComparisonVideo {
  id: string;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  relativePublishedAt: string;
  latestViewCount: number | null;
  latestMeasuredVph: number | null;
  latestViewDelta: number | null;
  alertStatus: 'no_alert' | 'pending' | 'sending' | 'sent' | 'failed';
  alertStatusLabel: string;
}

export interface ChannelComparisonTrendPoint {
  hourKey: string; // YYYY-MM-DD HH
  hourLabel: string; // ví dụ 14:00 17/09
  avgVph: number;
  sampleCount: number;
}

export interface ChannelComparisonItem {
  id: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  status: 'active' | 'paused' | 'archived';
  statusLabel: string;
  alertVphThreshold: number | null;
  lastScanAt: string | null;
  relativeScanTime: string;
  color: string;
  metrics: ChannelComparisonMetrics;
  publishing: ChannelPublishingMetrics;
  topVideos: ChannelComparisonVideo[];
  trendPoints: ChannelComparisonTrendPoint[];
}

export interface ChannelComparisonData {
  timeWindow: ComparisonTimeWindow;
  channels: ChannelComparisonItem[];
  allTrendHourKeys: string[];
}

export const TIME_WINDOW_LABELS: Record<ComparisonTimeWindow, string> = {
  '24h': '24 giờ',
  '3d': '3 ngày',
  '7d': '7 ngày',
  '30d': '30 ngày',
  'all': 'Tất cả',
};

export const COMPARISON_PALETTE = [
  '#38bdf8', // Xanh dương nhạt (Sky blue)
  '#10b981', // Xanh ngọc (Emerald green)
  '#f59e0b', // Hổ phách (Amber)
  '#c084fc', // Tím nhạt (Purple)
];

export type ComparisonViewMode = 'overview' | 'table' | 'signals' | 'trend';

export const COMPARISON_VIEW_MODES = [
  { id: 'overview', label: 'Tổng quan', icon: 'grid', title: 'Tổng quan đối chiếu' },
  { id: 'table', label: 'Bảng', icon: 'list', title: 'Bảng số liệu chi tiết' },
  { id: 'signals', label: 'Tín hiệu', icon: 'zap', title: 'Tín hiệu video nổi bật' },
  { id: 'trend', label: 'Xu hướng', icon: 'trending-up', title: 'Biểu đồ xu hướng VPH 24h' },
];
