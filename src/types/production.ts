// src/types/production.ts
// Các kiểu dữ liệu dành cho tính năng Tiến Độ Sản Xuất

export type ProductionStatus =
  | 'idea'
  | 'research'
  | 'script'
  | 'thumbnail'
  | 'production'
  | 'editing'
  | 'published'
  | 'archived';

export type ProductionPriority = 'low' | 'normal' | 'high';

export type ProductionViewMode = 'board' | 'list';

export const PRODUCTION_VIEW_MODE_STORAGE_KEY = 'bbdt_production_view_mode';

export const ACTIVE_WORKFLOW_STATUSES: ProductionStatus[] = [
  'idea',
  'research',
  'script',
  'thumbnail',
  'production',
  'editing',
  'published',
];

export interface ProductionSourceVideo {
  id: string;
  title: string;
  url: string | null;
  youtubeVideoId: string | null;
  thumbnailUrl: string | null;
  channelName: string;
  channelHandle: string | null;
  channelAvatarUrl: string | null;
}

export interface ProductionItem {
  id: string;
  sourceVideoId: string | null;
  workingTitle: string | null;
  notes: string | null;
  status: ProductionStatus;
  priority: ProductionPriority;
  createdAt: string;
  updatedAt: string;
  publishedUrl: string | null;
  publishedAt: string | null;
  sourceVideo: ProductionSourceVideo | null;
}

export interface ProductionCreateInput {
  sourceVideoId: string;
  workingTitle?: string;
  notes?: string;
  priority?: ProductionPriority;
}

export interface ProductionUpdateInput {
  id: string;
  workingTitle?: string;
  notes?: string;
  priority?: ProductionPriority;
  publishedUrl?: string;
}

export interface ProductionFilterState {
  status: 'all' | ProductionStatus;
  priority: 'all' | ProductionPriority;
  searchQuery: string;
  sortBy: 'updated_desc' | 'created_desc' | 'priority_desc';
}

export interface ProductionStats {
  activeCount: number; // status not in ('published', 'archived')
  nonArchivedCount: number; // status !== 'archived' (toàn bộ quy trình không archived)
  totalActive?: number; // Alias for activeCount
  ideaCount: number; // status === 'idea'
  inProductionCount: number; // status in ('production', 'editing')
  publishedCount: number; // status === 'published'
}

export const STATUS_LABELS: Record<ProductionStatus, string> = {
  idea: 'Ý tưởng',
  research: 'Đang nghiên cứu',
  script: 'Đang viết nội dung',
  thumbnail: 'Đang làm thumbnail',
  production: 'Đang sản xuất',
  editing: 'Đang chỉnh sửa',
  published: 'Đã xuất bản',
  archived: 'Đã lưu trữ',
};

export const PRIORITY_LABELS: Record<ProductionPriority, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
};
