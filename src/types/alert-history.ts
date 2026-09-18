export type AlertStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'unknown';
export type TimeFilterRange = '24h' | '7d' | '30d' | 'all';
export type AlertHistorySort = 'newest' | 'vph_desc' | 'views_desc' | 'attempts_desc';
export type AlertViewMode = 'timeline' | 'table' | 'video' | 'failed';

export const ALERT_VIEW_MODES: { id: AlertViewMode; label: string; icon: string }[] = [
  { id: 'timeline', label: 'Dòng thời gian', icon: 'clock' },
  { id: 'table', label: 'Bảng', icon: 'table' },
  { id: 'video', label: 'Theo video', icon: 'video' },
  { id: 'failed', label: 'Gửi lỗi', icon: 'alert' },
];

export interface AlertHistorySummary {
  total: number;
  sent: number;
  waiting: number;
  failed: number;
  stuckCount?: number;
}

export interface AlertHistoryItem {
  id: string;
  videoId: string;
  videoTitle: string;
  videoYoutubeId: string | null;
  videoThumbnailUrl: string | null;
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
  thresholdVph: number;
  measuredVph: number;
  viewCountAtAlert: number;
  viewDeltaAtAlert: number | null;
  elapsedSeconds: number | null;
  thresholdRatio: number | null;
  thresholdExcessRatio: number | null;
  currentVph: number | null;
  currentViewCount: number | null;
  status: AlertStatus;
  isSendingStuck: boolean;
  attempts: number;
  discordMessageId: string | null;
  sanitizedLastError: string | null;
  createdAt: string;
  sentAt: string | null;
  updatedAt: string;
}

export interface AlertHistoryFilter {
  status: AlertStatus | 'all';
  range: TimeFilterRange;
  channelId: string | null;
  search: string;
  videoId: string | null;
  stuckOnly?: boolean;
}

export interface AlertVideoGroup {
  videoId: string;
  videoTitle: string;
  videoYoutubeId: string | null;
  videoThumbnailUrl: string | null;
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  alertCount: number;
  latestAlertAt: string;
  latestStatus: AlertStatus;
  maxMeasuredVph: number | null;
}
