// Định nghĩa kiểu dữ liệu cho Video và Lịch sử lượt xem (Video Snapshots)

export interface Video {
  id: string;
  youtubeVideoId: string;
  channelId: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  duration: string | null;
  isShort: boolean | null;
  firstSeenAt: string;
  lastSeenAt: string;
  latestViewCount: number;
  latestMeasuredVph: number | null;
  latestViewDelta?: number | null;
  latestSnapshotCheckedAt?: string | null;
  firstSnapshotCheckedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbVideo {
  id: string;
  youtube_video_id: string;
  channel_id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  published_at: string;
  duration: string | null;
  is_short: boolean | null;
  first_seen_at: string;
  last_seen_at: string;
  latest_view_count: number;
  latest_measured_vph: number | null;
  latest_view_delta?: number | null;
  latest_snapshot_checked_at?: string | null;
  first_snapshot_checked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoSnapshot {
  id: string;
  videoId: string;
  viewCount: number;
  checkedAt: string;
  measuredVph: number | null;
  viewDelta: number | null;
  elapsedSeconds: number | null;
}

export interface DbVideoSnapshot {
  id: string;
  video_id: string;
  view_count: number;
  checked_at: string;
  measured_vph: number | null;
  view_delta: number | null;
  elapsed_seconds: number | null;
}

export function mapDbVideoToVideo(db: DbVideo): Video {
  return {
    id: db.id,
    youtubeVideoId: db.youtube_video_id,
    channelId: db.channel_id,
    title: db.title,
    url: db.url,
    thumbnailUrl: db.thumbnail_url,
    publishedAt: db.published_at,
    duration: db.duration,
    isShort: db.is_short,
    firstSeenAt: db.first_seen_at,
    lastSeenAt: db.last_seen_at,
    latestViewCount: Number(db.latest_view_count) || 0,
    latestMeasuredVph: db.latest_measured_vph !== null ? Number(db.latest_measured_vph) : null,
    latestViewDelta: db.latest_view_delta !== null && db.latest_view_delta !== undefined ? Number(db.latest_view_delta) : null,
    latestSnapshotCheckedAt: db.latest_snapshot_checked_at || null,
    firstSnapshotCheckedAt: db.first_snapshot_checked_at || null,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export interface VideoChannelMeta {
  id: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  alertVphThreshold: number;
}

export interface VideoAlertMeta {
  id: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  measuredVph: number | null;
  sentAt: string | null;
}

export interface VideoListItem {
  id: string;
  youtubeVideoId: string;
  channelId: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  latestViewCount: number;
  latestMeasuredVph: number | null;
  channel: VideoChannelMeta;
  alert: VideoAlertMeta | null;
  latestSnapshot?: {
    viewDelta: number | null;
    checkedAt: string;
  } | null;
  latestDeltaViews: number | null;
  isOverThreshold: boolean;
}

export type VideoSortOption = 'vph_desc' | 'views_desc' | 'published_desc' | 'delta_desc';
export type VideoFilterOption = 'all' | 'rising' | 'alerted' | 'unalerted';

export interface VideoStatsSummary {
  totalVideos: number;
  risingVideos: number;
  maxVph: number | null;
  alertedVideos: number;
}

export interface VideoSnapshotPoint {
  id: string;
  checkedAt: string;
  viewCount: number;
  viewDelta: number | null;
  elapsedSeconds: number | null;
  measuredVph: number | null;
}

export interface VideoAlertInfo {
  id: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  measuredVph: number | null;
  sentAt: string | null;
  lastError: string | null;
}

export interface VideoDetailChannelMeta extends VideoChannelMeta {
  scanLimit: number;
  status: string;
  url: string;
}

export interface VideoDetail {
  id: string;
  youtubeVideoId: string;
  channelId: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  duration: string | null;
  latestViewCount: number;
  latestMeasuredVph: number | null;
  channel: VideoDetailChannelMeta;
  alert: VideoAlertInfo | null;
  snapshots: VideoSnapshotPoint[];
  latestSnapshot: VideoSnapshotPoint | null;
  isOverThreshold: boolean;
  createdAt: string;
  updatedAt: string;
}

