// Types: Báo Cáo 24h / 7 Ngày (Phase 16)
// 100% Read-Only

export type ReportRange = '24h' | '7d';

export interface ReportVideo {
  id: string;
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
  title: string;
  thumbnailUrl: string | null;
  youtubeVideoId: string | null;
  publishedAt: string;
  latestMeasuredVph: number | null;
  latestViewCount: number | null;
  hasAlert?: boolean;
}

export type ReportAlertStatus = 'pending' | 'sending' | 'sent' | 'failed';

export interface ReportAlert {
  id: string;
  videoId: string;
  videoTitle: string;
  videoYoutubeId: string | null;
  videoThumbnailUrl: string | null;
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
  measuredVph: number;
  thresholdVph: number;
  viewCount: number;
  status: ReportAlertStatus;
  statusLabel: string;
  createdAt: string;
}

export type ReportScanStatus = 'running' | 'success' | 'partial' | 'failed';
export type ReportScanTrigger = 'manual' | 'schedule';

export interface ReportScan {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: ReportScanStatus;
  statusLabel: string;
  triggerSource: ReportScanTrigger;
  triggerLabel: string;
  channelsTotal: number;
  channelsSuccess: number;
  channelsFailed: number;
  videosFound: number;
  snapshotsCreated: number;
  alertsSent: number;
  alertsFailed: number;
  errorSummary: string | null;
  sanitizedError: string | null;
}

export interface ReportSummary {
  newVideosCount: number;
  channelsWithNewVideosCount: number;
  risingNewVideosCount: number;
  alertsCount: number;
  snapshotsCount: number;
  attentionScansCount: number;
  maxCurrentVph: number | null;
}

export interface ReportScanSummary {
  totalScans: number;
  successScans: number;
  partialScans: number;
  failedScans: number;
  totalSnapshots: number;
}

export interface ReportChannelActivity {
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
  newVideosCount: number;
  latestPublishedAt: string;
  latestVideoTitle: string;
  maxCurrentVph: number | null;
  risingCount: number;
}

export interface ReportData {
  range: ReportRange;
  rangeStartIso: string;
  generatedAtIso: string;
  summary: ReportSummary;
  scanSummary: ReportScanSummary;
  risingVideos: ReportVideo[];
  newVideos: ReportVideo[];
  channelActivities: ReportChannelActivity[];
  recentAlerts: ReportAlert[];
  recentScans: ReportScan[];
}
