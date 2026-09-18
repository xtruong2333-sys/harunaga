// Type Definitions: dashboard.ts
// Các kiểu dữ liệu cho màn hình Tổng Quan

export interface DashboardScanRun {
  id: string;
  triggerSource: 'manual' | 'schedule';
  status: 'success' | 'partial' | 'failed' | 'running';
  startedAt: string;
  finishedAt: string | null;
  channelsTotal: number;
  channelsSuccess: number;
  channelsFailed: number;
  videosFound: number;
  snapshotsCreated: number;
  alertsSent: number;
  errorSummary: string | null;
}

export interface DashboardTopVideo {
  id: string;
  youtubeVideoId: string;
  channelId: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  latestViewCount: number;
  latestMeasuredVph: number | null;
  latestDeltaViews: number | null;
  isOverThreshold: boolean;
  channelName: string;
  channelAvatarUrl: string | null;
  alertVphThreshold: number | null;
}

export interface DashboardChannelSummary {
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  avatarUrl: string | null;
  risingVideoCount: number;
  maxVph: number | null;
  totalVideos: number;
}

export interface DashboardAlertSummary {
  total: number;
  sent: number;
  pending: number;
  failed: number;
}

export interface DashboardSummary {
  activeChannelsCount: number;
  totalVideosCount: number;
  risingVideosCount: number;
  maxVph: number | null;
  latestScan: DashboardScanRun | null;
  recentScans: DashboardScanRun[];
  topVideos: DashboardTopVideo[];
  topChannels: DashboardChannelSummary[];
  alertSummary: DashboardAlertSummary;
}
