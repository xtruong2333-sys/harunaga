export type AlertStatus = 'pending' | 'sending' | 'sent' | 'failed';
export type TimeFilterRange = '24h' | '7d' | '30d' | 'all';
export type AlertHistorySort = 'newest' | 'vph_desc' | 'views_desc' | 'attempts_desc';

export interface AlertHistorySummary {
  total: number;
  sent: number;
  waiting: number;
  failed: number;
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
}
