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
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}
