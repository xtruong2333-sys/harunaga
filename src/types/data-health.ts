// src/types/data-health.ts
// Các kiểu dữ liệu cho tính năng Tình Trạng Dữ Liệu (Phase 10)

export type ScanStatus = 'success' | 'partial' | 'failed' | 'running';
export type TriggerSource = 'schedule' | 'manual';

export type FreshnessCategory = 'fresh' | 'warning' | 'stale' | 'never';

export type SystemStatusTone = 'success' | 'warning' | 'danger' | 'info';
export type SystemStatusCode =
  | 'normal'
  | 'slow_update'
  | 'partial_error'
  | 'needs_check'
  | 'running';

export interface SystemStatus {
  code: SystemStatusCode;
  label: string;
  tone: SystemStatusTone;
  description: string;
  isStuckRunning: boolean;
}

export interface DataHealthScan {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: ScanStatus;
  statusLabel: string;
  triggerSource: TriggerSource;
  triggerLabel: string;
  channelsTotal: number;
  channelsSuccess: number;
  channelsFailed: number;
  videosFound: number;
  snapshotsCreated: number;
  alertsSent: number;
  alertsFailed: number;
  sanitizedError: string | null;
  durationText: string;
  relativeTime: string;
}

export interface ChannelFreshness {
  id: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  lastScanAt: string | null;
  scanLimit: number | null;
  alertVphThreshold: number | null;
  freshnessCategory: FreshnessCategory;
  freshnessLabel: string;
  relativeScanTime: string;
}

export interface VideoFreshness {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  youtubeVideoId: string | null;
  channelId: string;
  channelName: string;
  latestSnapshotAt: string | null;
  latestViewCount: number | null;
  latestMeasuredVph: number | null;
  freshnessCategory: FreshnessCategory;
  freshnessLabel: string;
  relativeSnapshotTime: string;
}

export interface FailedAlertItem {
  id: string;
  videoId: string;
  videoTitle: string;
  channelName: string;
  measuredVph: number | null;
  attempts: number;
  updatedAt: string;
  sanitizedError: string;
}

export interface AlertHealthSummary {
  total: number;
  sampleLimit: number;
  sampleSize: number;
  sent: number;
  pending: number;
  sending: number;
  failed: number;
  stuckSendingCount: number;
  failedAlerts: FailedAlertItem[];
}

export interface DataHealthSummary {
  systemStatus: SystemStatus;
  latestScan: DataHealthScan | null;
  latestScheduledScan: DataHealthScan | null;
  channelsNeedAttentionCount: number;
  staleVideosCount: number;
  activeVideosCount: number;
  failedAlertsCount: number;
  channels: ChannelFreshness[];
  staleVideos: VideoFreshness[];
  alertSummary: AlertHealthSummary;
  recentScans: DataHealthScan[];
  lastFetchedAt: string;
}

export const SCAN_STATUS_LABELS: Record<ScanStatus, string> = {
  success: 'Thành công',
  partial: 'Thành công một phần',
  failed: 'Thất bại',
  running: 'Đang chạy',
};

export const TRIGGER_SOURCE_LABELS: Record<TriggerSource, string> = {
  schedule: 'Tự động',
  manual: 'Thủ công',
};

export const FRESHNESS_LABELS: Record<FreshnessCategory, string> = {
  fresh: 'Mới cập nhật',
  warning: 'Chậm cập nhật',
  stale: 'Cần chú ý',
  never: 'Chưa quét',
};

export const VIDEO_FRESHNESS_LABELS: Record<FreshnessCategory, string> = {
  fresh: 'Mới cập nhật',
  warning: 'Chậm cập nhật',
  stale: 'Cần chú ý',
  never: 'Chưa có snapshot',
};
