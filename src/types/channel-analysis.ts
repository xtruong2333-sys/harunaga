// Type Definitions: channel-analysis.ts
// Các kiểu dữ liệu cho màn hình Phân Tích Kênh (/kenh-theo-doi/:id)

export interface ChannelAnalysisHeader {
  id: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  status: 'active' | 'paused' | 'archived';
  scanLimit: number | null;
  alertVphThreshold: number | null;
  lastScanAt: string | null;
  createdAt: string;
  url: string;
}

export interface ChannelVideoItem {
  id: string;
  youtubeVideoId: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  latestViewCount: number | null;
  latestMeasuredVph: number | null;
  latestDeltaViews: number | null;
  isOverThreshold: boolean;
  alertStatus: 'pending' | 'sending' | 'sent' | 'failed' | null;
}

export interface ChannelVphDistribution {
  nullCount: number;       // Chưa đủ dữ liệu
  zeroCount: number;       // Không tăng (VPH = 0)
  risingCount: number;     // Đang tăng (VPH > 0)
  overThresholdCount: number; // Vượt ngưỡng (VPH >= alert threshold)
}

export interface ChannelRecentAlert {
  id: string;
  videoId: string;
  videoTitle: string;
  measuredVph: number | null;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  sentAt: string | null;
}

export interface ChannelAlertSummary {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  recentAlerts: ChannelRecentAlert[];
}

export interface ChannelAnalysis {
  channel: ChannelAnalysisHeader;
  totalVideos: number;
  risingVideos: number;
  maxVph: number | null;
  avgVph: number | null;
  distribution: ChannelVphDistribution;
  topRisingVideos: ChannelVideoItem[]; // Top 5 sort VPH DESC
  latestVideos: ChannelVideoItem[];    // Top 10 sort published_at DESC
  topVphChartVideos: ChannelVideoItem[]; // Top 10 sort VPH DESC (cho biểu đồ)
  publishingVideos: ChannelVideoItem[]; // Toàn bộ video sắp xếp theo published_at DESC cho phân tích nhịp đăng
  alertSummary: ChannelAlertSummary;
}
