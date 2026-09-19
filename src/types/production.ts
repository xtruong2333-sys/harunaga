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

export type ActiveProductionStatus = Exclude<ProductionStatus, 'archived'>;
export type ProductionPriority = 'low' | 'normal' | 'high';
export type ProductionViewMode = 'board' | 'list';

export type ProductionAssetType =
  | 'reference'
  | 'thumbnail'
  | 'script'
  | 'voice'
  | 'footage'
  | 'project'
  | 'drive'
  | 'youtube'
  | 'other';

export type ProductionNoteCategory =
  | 'general'
  | 'research'
  | 'script'
  | 'thumbnail'
  | 'production'
  | 'editing'
  | 'seo';

export const PRODUCTION_VIEW_MODE_STORAGE_KEY = 'bbdt_production_view_mode';

export const ACTIVE_WORKFLOW_STATUSES: ActiveProductionStatus[] = [
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
  dueAt: string | null;
  startedAt: string | null;
  assigneeLabel: string | null;
  templateKey: string | null;
  taskCompletedCount: number;
  taskTotalCount: number;
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

export interface ProductionWorkspaceUpdateInput extends ProductionUpdateInput {
  status?: ProductionStatus;
  dueAt?: string;
  startedAt?: string;
  assigneeLabel?: string;
  templateKey?: string;
}

export interface ProductionTask {
  id: string;
  productionItemId: string;
  stage: ActiveProductionStatus;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionTaskCreateInput {
  productionItemId: string;
  stage: ActiveProductionStatus;
  title: string;
  sortOrder?: number;
}

export interface ProductionTaskUpdateInput {
  id: string;
  title?: string;
  stage?: ActiveProductionStatus;
  isCompleted?: boolean;
  sortOrder?: number;
}

export interface ProductionAsset {
  id: string;
  productionItemId: string;
  assetType: ProductionAssetType;
  label: string;
  url: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionAssetCreateInput {
  productionItemId: string;
  assetType: ProductionAssetType;
  label: string;
  url: string;
  notes?: string;
}

export interface ProductionNote {
  id: string;
  productionItemId: string;
  stage: ActiveProductionStatus | null;
  category: ProductionNoteCategory;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionNoteCreateInput {
  productionItemId: string;
  stage?: ActiveProductionStatus | null;
  category?: ProductionNoteCategory;
  body: string;
  isPinned?: boolean;
}

export interface ProductionNoteUpdateInput {
  id: string;
  body?: string;
  category?: ProductionNoteCategory;
  stage?: ActiveProductionStatus | null;
  isPinned?: boolean;
}

export interface ProductionActivity {
  id: string;
  productionItemId: string;
  eventType: string;
  message: string;
  stageFrom: string | null;
  stageTo: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProductionTemplateChecklistItem {
  stage: ActiveProductionStatus;
  title: string;
  sortOrder: number;
}

export interface ProductionTemplate {
  id: string;
  templateKey: string;
  name: string;
  description: string | null;
  checklist: ProductionTemplateChecklistItem[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionWorkspace {
  tasks: ProductionTask[];
  assets: ProductionAsset[];
  notes: ProductionNote[];
  activity: ProductionActivity[];
  templates: ProductionTemplate[];
}

export interface ProductionFilterState {
  status: 'all' | ProductionStatus;
  priority: 'all' | ProductionPriority;
  searchQuery: string;
  sortBy: 'updated_desc' | 'created_desc' | 'priority_desc';
}

export interface ProductionStats {
  activeCount: number;
  nonArchivedCount: number;
  totalActive?: number;
  ideaCount: number;
  inProductionCount: number;
  publishedCount: number;
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

export const ASSET_TYPE_LABELS: Record<ProductionAssetType, string> = {
  reference: 'Tham khảo',
  thumbnail: 'Thumbnail',
  script: 'Kịch bản',
  voice: 'Voice',
  footage: 'Footage',
  project: 'Project',
  drive: 'Drive',
  youtube: 'YouTube',
  other: 'Khác',
};

export const NOTE_CATEGORY_LABELS: Record<ProductionNoteCategory, string> = {
  general: 'Chung',
  research: 'Nghiên cứu',
  script: 'Kịch bản',
  thumbnail: 'Thumbnail',
  production: 'Sản xuất',
  editing: 'Chỉnh sửa',
  seo: 'SEO',
};
