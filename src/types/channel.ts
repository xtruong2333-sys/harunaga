// TypeScript Definitions cho Bắt Bài Đối Thủ

export type ChannelStatus = 'active' | 'paused' | 'archived';

export interface Channel {
  id: string;
  youtubeChannelId: string;
  name: string;
  handle: string | null;
  url: string;
  avatarUrl: string | null;
  status: ChannelStatus;
  scanLimit: number;
  alertVphThreshold: number;
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastScanAt: string | null;
  totalVideos?: number;
  risingVideoCount?: number;
  maxVph?: number | null;
}

export interface DbChannel {
  id: string;
  youtube_channel_id: string;
  name: string;
  handle: string | null;
  url: string;
  avatar_url: string | null;
  status: ChannelStatus;
  scan_limit: number;
  alert_vph_threshold: number;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_scan_at: string | null;
}

export interface CreateChannelInput {
  youtubeChannelId: string;
  name: string;
  handle?: string | null;
  url: string;
  avatarUrl?: string | null;
  scanLimit?: number;
  alertVphThreshold?: number;
  notes?: string | null;
}

export interface UpdateChannelInput {
  scanLimit?: number;
  alertVphThreshold?: number;
  notes?: string | null;
  status?: ChannelStatus;
}

export interface ResolvedChannelPreview {
  youtubeChannelId: string;
  name: string;
  handle: string | null;
  url: string;
  avatarUrl: string | null;
}

export interface BulkResolveItemResult {
  input: string;
  resolved: ResolvedChannelPreview | null;
  alreadyExists: boolean;
  existingChannel?: Channel;
  error?: string;
}

export interface BulkResolveSummary {
  total: number;
  valid: BulkResolveItemResult[];
  duplicates: BulkResolveItemResult[];
  errors: BulkResolveItemResult[];
}

export function mapDbChannelToChannel(db: DbChannel): Channel {
  return {
    id: db.id,
    youtubeChannelId: db.youtube_channel_id,
    name: db.name,
    handle: db.handle,
    url: db.url,
    avatarUrl: db.avatar_url,
    status: db.status,
    scanLimit: db.scan_limit,
    alertVphThreshold: db.alert_vph_threshold,
    source: db.source,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    lastScanAt: db.last_scan_at,
  };
}

export function mapChannelInputToDb(input: CreateChannelInput): Partial<DbChannel> {
  return {
    youtube_channel_id: input.youtubeChannelId,
    name: input.name,
    handle: input.handle || null,
    url: input.url,
    avatar_url: input.avatarUrl || null,
    scan_limit: input.scanLimit ?? 15,
    alert_vph_threshold: input.alertVphThreshold ?? 5000,
    notes: input.notes || null,
    status: 'active',
    source: 'manual',
  };
}

// Từ điển ánh xạ trạng thái sang tiếng Việt tự nhiên
export const STATUS_LABELS: Record<ChannelStatus, string> = {
  active: 'Đang theo dõi',
  paused: 'Tạm dừng',
  archived: 'Đã lưu trữ',
};
