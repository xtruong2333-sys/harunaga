// Types for Lịch Đăng Của Đối Thủ (Phase 15)

export type PublishingRange = '7d' | '30d' | '90d' | 'all';

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
