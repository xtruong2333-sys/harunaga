// Types definition for Video Mới Đăng (Phase 14)

export type NewVideoRange = '6h' | '12h' | '24h' | '3d' | '7d';

export type NewVideoStatus = 'all' | 'rising' | 'not_rising' | 'unmeasured' | 'alerted';

export type NewVideoSort = 'newest' | 'vph_desc' | 'views_desc' | 'delta_desc';

export type AlertDisplayStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'none';

export interface NewVideoItem {
  id: string;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
  latestViewCount: number | null;
  latestMeasuredVph: number | null;
  latestViewDelta: number | null;
  latestSnapshotCheckedAt: string | null;
  firstSnapshotCheckedAt: string | null;
  firstObservedMinutesAfterPublish: number | null;
  alertStatus: AlertDisplayStatus;
  hasAlert: boolean;
}

export interface NewVideoSummary {
  totalVideos: number;
  totalChannels: number;
  risingVideos: number;
  maxVph: number | null;
}

export interface NewVideoFilter {
  range: NewVideoRange;
  channelId: string | null;
  status: NewVideoStatus;
  sort: NewVideoSort;
  search: string;
}

export interface ChannelOption {
  id: string;
  name: string;
}
