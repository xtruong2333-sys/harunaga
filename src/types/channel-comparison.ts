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
  trackedViews: number;
  latestViewDelta: number | null; // Tổng view_delta ở snapshot mới nhất của mỗi video
  videosWithVphCount: number;
}

export interface ChannelComparisonVideo {
  id: string;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  relativePublishedAt: string;
  latestViewCount: number;
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
