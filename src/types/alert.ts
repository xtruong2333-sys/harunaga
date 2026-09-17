// Định nghĩa kiểu dữ liệu cho Cảnh báo Video (Video Alerts)

export type AlertStatus = 'pending' | 'sending' | 'sent' | 'failed';

export interface VideoAlert {
  id: string;
  videoId: string;
  snapshotId: string | null;
  thresholdVph: number;
  measuredVph: number;
  viewCount: number;
  viewDelta: number | null;
  elapsedSeconds: number | null;
  status: AlertStatus;
  attempts: number;
  discordMessageId: string | null;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
  updatedAt: string;
}

export interface DbVideoAlert {
  id: string;
  video_id: string;
  snapshot_id: string | null;
  threshold_vph: number;
  measured_vph: number;
  view_count: number;
  view_delta: number | null;
  elapsed_seconds: number | null;
  status: AlertStatus;
  attempts: number;
  discord_message_id: string | null;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
  updated_at: string;
}
