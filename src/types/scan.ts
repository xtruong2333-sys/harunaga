// Định nghĩa kiểu dữ liệu cho Phiên Quét Dữ Liệu (Scan Runs)

export type ScanRunStatus = 'running' | 'success' | 'partial' | 'failed';
export type ScanTriggerSource = 'manual' | 'schedule';

export interface ScanRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: ScanRunStatus;
  channelsTotal: number;
  channelsSuccess: number;
  channelsFailed: number;
  videosFound: number;
  snapshotsCreated: number;
  alertCandidates?: number;
  alertsSent?: number;
  alertsFailed?: number;
  errorSummary: string | null;
  triggerSource: ScanTriggerSource;
}

export interface DbScanRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: ScanRunStatus;
  channels_total: number;
  channels_success: number;
  channels_failed: number;
  videos_found: number;
  snapshots_created: number;
  alert_candidates?: number;
  alerts_sent?: number;
  alerts_failed?: number;
  error_summary: string | null;
  trigger_source: ScanTriggerSource;
}

export interface CollectorResponse {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  run?: {
    id: string;
    channelsTotal: number;
    channelsSuccess: number;
    channelsFailed: number;
    videosFound: number;
    snapshotsCreated: number;
    alertCandidates?: number;
    alertsSent?: number;
    alertsFailed?: number;
    status: ScanRunStatus;
    triggerSource?: ScanTriggerSource;
    errorSummary?: string | null;
  };
  error?: string;
}
