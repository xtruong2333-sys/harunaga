// Định nghĩa kiểu dữ liệu cho màn hình Video Tiềm Năng (Phase 7)
// Nguồn dữ liệu 100% FACTUAL từ Supabase production.
// TUYỆT ĐỐI KHÔNG TẠO SCORE CHỦ QUAN / KHÔNG AI.

export type OpportunityTimeWindow = '24h' | '3d' | '7d' | '30d' | 'all';

export type OpportunitySortOption =
  | 'vph_desc'
  | 'published_desc'
  | 'delta_desc'
  | 'threshold_ratio_desc';

export type OpportunityQuickFilter = 'all' | 'over_threshold' | 'alerted' | 'unalerted';

export interface OpportunityChannelMeta {
  id: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  alertVphThreshold: number;
}

export interface OpportunityAlertMeta {
  id: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  measuredVph: number | null;
  sentAt: string | null;
}

export interface OpportunityVideo {
  id: string;
  youtubeVideoId: string;
  channelId: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  videoAge: string;
  latestViewCount: number;
  latestMeasuredVph: number;
  latestDeltaViews: number | null;
  channel: OpportunityChannelMeta;
  thresholdRatio: number; // e.g. 25 = 25% ngưỡng
  isOverThreshold: boolean;
  alert: OpportunityAlertMeta | null;
}

export interface OpportunityStats {
  potentialCount: number;
  new24hCount: number;
  maxVph: number | null;
  overThresholdCount: number;
}

export interface OpportunityFilterState {
  timeWindow: OpportunityTimeWindow;
  channelId: string; // 'all' hoặc channel UUID
  searchQuery: string;
  quickFilter: OpportunityQuickFilter;
  sortOption: OpportunitySortOption;
}
