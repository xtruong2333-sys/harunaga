// Types for Lịch Đăng Của Đối Thủ (Phase 15)

export type PublishingRange = '7d' | '30d' | '90d' | 'all';

export type PublishingViewMode = 'calendar' | 'heatmap' | 'channels' | 'timeline';

export interface ViewModeConfig {
  id: PublishingViewMode;
  label: string;
  icon: string;
  title: string;
}

export const PUBLISHING_VIEW_MODES: ViewModeConfig[] = [
  { id: 'calendar', label: 'Lịch', icon: 'calendar', title: 'Lịch xuất bản tổng quan' },
  { id: 'heatmap', label: 'Heatmap', icon: 'grid', title: 'Ma trận tần suất 7x24' },
  { id: 'channels', label: 'Theo kênh', icon: 'users', title: 'Nhịp đăng chi tiết từng kênh' },
  { id: 'timeline', label: 'Timeline', icon: 'clock', title: 'Dòng thời gian video xuất bản' },
];

export interface PublishingWeekPatternDay {
  weekday: number;       // 0..6 (Thứ 2..Chủ Nhật)
  weekdayName: string;   // 'Thứ 2'..'Chủ Nhật'
  count: number;
  percentage: number;
  peakHour: string;      // e.g. '19:00' or '—'
  isMax: boolean;
}

export interface VietnamDateParts {
  year: number;
  month: number;
  day: number;
  weekdayIndex: number; // 0: Thứ 2, 1: Thứ 3, ..., 6: Chủ Nhật
  weekdayName: string;  // 'Thứ 2'..'Chủ Nhật'
  hour: number;         // 0..23
  minute: number;       // 0..59
  dateStr: string;      // YYYY-MM-DD
  formatted: string;    // HH:mm dd/MM/yyyy
}

export interface PublishingVideo {
  id: string;
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
  channelStatus: string;
  title: string;
  thumbnailUrl: string | null;
  youtubeVideoId: string;
  publishedAt: string; // ISO UTC
  vnDate: string;
  vnWeekday: number;   // 0..6
  vnWeekdayName: string;
  vnHour: number;      // 0..23
  vnFormatted: string;
}

export interface PublishingScheduleSummary {
  totalVideos: number;
  totalChannels: number;
  avgVideosPerDay: number | null;
  latestPublishedAt: string | null;
}

export interface PublishingHeatmapCell {
  weekday: number;       // 0..6
  weekdayName: string;   // 'Thứ 2'..'Chủ Nhật'
  hour: number;          // 0..23
  count: number;
}

export interface PublishingDistributionItem {
  label: string;
  count: number;
  percentage: number;
}

export interface ChannelPublishingStats {
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
  channelStatus: string;
  videoCountInRange: number;
  videoCount7d: number;
  videoCount30d: number;
  latestPublishedAt: string | null;
  avgIntervalHours: number | null;
  medianIntervalHours: number | null;
  peakWeekday: string;
  peakHour: string;
}

export interface PublishingFilter {
  range: PublishingRange;
  channelId: string | null;
  weekday: number | null; // null = all, 0..6
}
