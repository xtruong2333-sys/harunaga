// src/services/production-service.ts
// Nguồn dữ liệu duy nhất cho Tiến Độ Sản Xuất / Production Workspace 2.0.
// SELECT đọc qua RLS public. Mọi WRITE đi qua manage-production-items + APP_WRITE_ACCESS_KEY.

import { getSupabase, isSupabaseConfigured, parseEdgeFunctionError } from './supabase';
import {
  getStoredAccessKey,
  setStoredAccessKey,
  clearStoredAccessKey,
  AccessKeyRequiredError,
  INVALID_KEY_ERROR_MESSAGE,
} from './channel-service';
import type {
  ProductionItem,
  ProductionCreateInput,
  ProductionUpdateInput,
  ProductionWorkspaceUpdateInput,
  ProductionStatus,
  ProductionPriority,
  ProductionFilterState,
  ProductionStats,
  ProductionWorkspace,
  ProductionTask,
  ProductionTaskCreateInput,
  ProductionTaskUpdateInput,
  ProductionAsset,
  ProductionAssetCreateInput,
  ProductionNote,
  ProductionNoteCreateInput,
  ProductionNoteUpdateInput,
  ProductionActivity,
  ProductionTemplate,
} from '@/types/production';

export { getStoredAccessKey, setStoredAccessKey, clearStoredAccessKey, AccessKeyRequiredError };

export function normalizeSourceVideoUrl(
  dbUrl: string | null | undefined,
  youtubeVideoId: string | null | undefined
): string | null {
  if (dbUrl && typeof dbUrl === 'string' && dbUrl.trim().length > 0) {
    const trimmed = dbUrl.trim();
    if (trimmed !== 'null' && trimmed !== 'undefined') return trimmed;
  }
  if (youtubeVideoId && typeof youtubeVideoId === 'string' && youtubeVideoId.trim().length > 0) {
    const cleanId = youtubeVideoId.trim();
    if (cleanId !== 'null' && cleanId !== 'undefined') {
      return `https://www.youtube.com/watch?v=${cleanId}`;
    }
  }
  return null;
}

export function deriveProductionThumbnailUrl(
  dbThumbnailUrl: string | null | undefined,
  youtubeVideoId: string | null | undefined
): string | null {
  if (dbThumbnailUrl && typeof dbThumbnailUrl === 'string' && dbThumbnailUrl.trim().length > 0) {
    const trimmed = dbThumbnailUrl.trim();
    if (trimmed !== 'null' && trimmed !== 'undefined') return trimmed;
  }
  if (youtubeVideoId && typeof youtubeVideoId === 'string' && youtubeVideoId.trim().length > 0) {
    const cleanId = youtubeVideoId.trim();
    if (cleanId !== 'null' && cleanId !== 'undefined') {
      return `https://i.ytimg.com/vi/${cleanId}/mqdefault.jpg`;
    }
  }
  return null;
}

function mapDbRowToItem(row: any): ProductionItem {
  const video = row.videos;
  const channel = video?.channels;
  const rawYtId = video?.youtube_video_id && typeof video.youtube_video_id === 'string'
    ? video.youtube_video_id.trim()
    : null;
  const validYtId = rawYtId && rawYtId !== 'null' && rawYtId !== 'undefined' ? rawYtId : null;

  return {
    id: row.id,
    sourceVideoId: row.source_video_id,
    workingTitle: row.working_title,
    notes: row.notes,
    status: row.status as ProductionStatus,
    priority: row.priority as ProductionPriority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedUrl: row.published_url,
    publishedAt: row.published_at,
    dueAt: row.due_at ?? null,
    startedAt: row.started_at ?? null,
    assigneeLabel: row.assignee_label ?? null,
    templateKey: row.template_key ?? null,
    sourceVideo: video
      ? {
          id: video.id,
          title: video.title || 'Video đối thủ',
          url: normalizeSourceVideoUrl(video.url, validYtId),
          youtubeVideoId: validYtId,
          thumbnailUrl: deriveProductionThumbnailUrl(video.thumbnail_url, validYtId),
          channelName: channel?.name || 'Kênh đối thủ',
          channelHandle: channel?.handle || null,
          channelAvatarUrl: channel?.avatar_url || null,
        }
      : null,
  };
}

function mapTask(row: any): ProductionTask {
  return {
    id: row.id,
    productionItemId: row.production_item_id,
    stage: row.stage,
    title: row.title,
    isCompleted: !!row.is_completed,
    sortOrder: Number(row.sort_order || 0),
    completedAt: row.completed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAsset(row: any): ProductionAsset {
  return {
    id: row.id,
    productionItemId: row.production_item_id,
    assetType: row.asset_type,
    label: row.label,
    url: row.url,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNote(row: any): ProductionNote {
  return {
    id: row.id,
    productionItemId: row.production_item_id,
    stage: row.stage ?? null,
    category: row.category,
    body: row.body,
    isPinned: !!row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row: any): ProductionActivity {
  return {
    id: row.id,
    productionItemId: row.production_item_id,
    eventType: row.event_type,
    message: row.message,
    stageFrom: row.stage_from ?? null,
    stageTo: row.stage_to ?? null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function mapTemplate(row: any): ProductionTemplate {
  return {
    id: row.id,
    templateKey: row.template_key,
    name: row.name,
    description: row.description ?? null,
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    isSystem: !!row.is_system,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function ensureSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Chưa kết nối cơ sở dữ liệu Supabase.');
  }
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Chưa kết nối cơ sở dữ liệu Supabase.');
  }
  return supabase;
}

function throwQueryError(error: any, fallback: string): never {
  console.error(fallback, error);
  throw new Error(error?.message || fallback);
}

export const productionService = {
  async fetchProductionItems(): Promise<ProductionItem[]> {
    const supabase = ensureSupabase();
    const { data, error } = await supabase
      .from('production_items')
      .select('*, videos(id, title, youtube_video_id, url, thumbnail_url, channel_id, channels(name, handle, avatar_url))')
      .order('updated_at', { ascending: false });

    if (error) throwQueryError(error, 'Không thể tải Tiến Độ Sản Xuất.');
    return (data || []).map(mapDbRowToItem);
  },

  async checkVideoInProduction(videoId: string): Promise<string | null> {
    const supabase = ensureSupabase();
    const { data, error } = await supabase
      .from('production_items')
      .select('id')
      .eq('source_video_id', videoId)
      .maybeSingle();

    if (error) throwQueryError(error, 'Lỗi khi kiểm tra video trong Tiến Độ Sản Xuất.');
    return data?.id || null;
  },

  async fetchProductionWorkspace(itemId: string): Promise<ProductionWorkspace> {
    const supabase = ensureSupabase();
    const [tasksRes, assetsRes, notesRes, activityRes, templatesRes] = await Promise.all([
      supabase.from('production_tasks').select('*').eq('production_item_id', itemId).order('stage').order('sort_order'),
      supabase.from('production_assets').select('*').eq('production_item_id', itemId).order('created_at', { ascending: false }),
      supabase.from('production_notes').select('*').eq('production_item_id', itemId).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('production_activity').select('*').eq('production_item_id', itemId).order('created_at', { ascending: false }).limit(100),
      supabase.from('production_templates').select('*').order('is_system', { ascending: false }).order('name'),
    ]);

    if (tasksRes.error) throwQueryError(tasksRes.error, 'Không thể tải checklist sản xuất.');
    if (assetsRes.error) throwQueryError(assetsRes.error, 'Không thể tải tài sản sản xuất.');
    if (notesRes.error) throwQueryError(notesRes.error, 'Không thể tải ghi chú sản xuất.');
    if (activityRes.error) throwQueryError(activityRes.error, 'Không thể tải lịch sử sản xuất.');
    if (templatesRes.error) throwQueryError(templatesRes.error, 'Không thể tải template sản xuất.');

    return {
      tasks: (tasksRes.data || []).map(mapTask),
      assets: (assetsRes.data || []).map(mapAsset),
      notes: (notesRes.data || []).map(mapNote),
      activity: (activityRes.data || []).map(mapActivity),
      templates: (templatesRes.data || []).map(mapTemplate),
    };
  },

  async _invokeProductionEdge(action: string, payload: any, explicitKey?: string): Promise<any> {
    const accessKey = explicitKey || getStoredAccessKey();
    if (!accessKey) throw new AccessKeyRequiredError();

    const supabase = ensureSupabase();
    const { data, error } = await supabase.functions.invoke('manage-production-items', {
      body: { accessKey, action, payload },
    });

    if (error) {
      const { message, isAuthError } = await parseEdgeFunctionError(error, 'Lỗi kết nối máy chủ sản xuất.');
      if (isAuthError) {
        clearStoredAccessKey();
        throw new AccessKeyRequiredError(INVALID_KEY_ERROR_MESSAGE);
      }
      throw new Error(message);
    }

    if (!data?.success) {
      const errMsg = data?.error || 'Thao tác không thành công.';
      if (errMsg.includes('Mã truy cập') || errMsg.includes('truy cập')) {
        clearStoredAccessKey();
        throw new AccessKeyRequiredError(INVALID_KEY_ERROR_MESSAGE);
      }
      throw new Error(errMsg);
    }

    return data;
  },

  async createProductionItem(input: ProductionCreateInput, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('create', input, explicitKey);
    return mapDbRowToItem(res.item);
  },

  async updateProductionItem(input: ProductionUpdateInput, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('update', input, explicitKey);
    return mapDbRowToItem(res.item);
  },

  async updateProductionWorkspace(input: ProductionWorkspaceUpdateInput, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('update_workspace', input, explicitKey);
    return mapDbRowToItem(res.item);
  },

  async changeProductionStatus(id: string, status: ProductionStatus, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('change_status', { id, status }, explicitKey);
    return mapDbRowToItem(res.item);
  },

  async archiveProductionItem(id: string, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('archive', { id }, explicitKey);
    return mapDbRowToItem(res.item);
  },

  async restoreProductionItem(id: string, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('restore', { id }, explicitKey);
    return mapDbRowToItem(res.item);
  },

  async deleteProductionItem(id: string, explicitKey?: string): Promise<string> {
    const res = await this._invokeProductionEdge('delete', { id }, explicitKey);
    return res.deletedId;
  },

  async createTask(input: ProductionTaskCreateInput, explicitKey?: string): Promise<ProductionTask> {
    const res = await this._invokeProductionEdge('create_task', input, explicitKey);
    return mapTask(res.task);
  },

  async updateTask(input: ProductionTaskUpdateInput, explicitKey?: string): Promise<ProductionTask> {
    const res = await this._invokeProductionEdge('update_task', input, explicitKey);
    return mapTask(res.task);
  },

  async deleteTask(id: string, explicitKey?: string): Promise<string> {
    const res = await this._invokeProductionEdge('delete_task', { id }, explicitKey);
    return res.deletedId;
  },

  async applyTemplate(productionItemId: string, templateKey: string, explicitKey?: string): Promise<void> {
    await this._invokeProductionEdge('apply_template', { productionItemId, templateKey }, explicitKey);
  },

  async createAsset(input: ProductionAssetCreateInput, explicitKey?: string): Promise<ProductionAsset> {
    const res = await this._invokeProductionEdge('create_asset', input, explicitKey);
    return mapAsset(res.asset);
  },

  async deleteAsset(id: string, explicitKey?: string): Promise<string> {
    const res = await this._invokeProductionEdge('delete_asset', { id }, explicitKey);
    return res.deletedId;
  },

  async createNote(input: ProductionNoteCreateInput, explicitKey?: string): Promise<ProductionNote> {
    const res = await this._invokeProductionEdge('create_note', input, explicitKey);
    return mapNote(res.note);
  },

  async updateNote(input: ProductionNoteUpdateInput, explicitKey?: string): Promise<ProductionNote> {
    const res = await this._invokeProductionEdge('update_note', input, explicitKey);
    return mapNote(res.note);
  },

  async deleteNote(id: string, explicitKey?: string): Promise<string> {
    const res = await this._invokeProductionEdge('delete_note', { id }, explicitKey);
    return res.deletedId;
  },

  computeTaskProgress(tasks: ProductionTask[]): { completed: number; total: number; percent: number } {
    const total = tasks.length;
    const completed = tasks.filter(task => task.isCompleted).length;
    return {
      completed,
      total,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  },

  computeSummaryStats(items: ProductionItem[]): ProductionStats {
    let activeCount = 0;
    let ideaCount = 0;
    let inProductionCount = 0;
    let publishedCount = 0;

    for (const item of items) {
      if (item.status !== 'published' && item.status !== 'archived') activeCount++;
      if (item.status === 'idea') ideaCount++;
      if (item.status === 'production' || item.status === 'editing') inProductionCount++;
      if (item.status === 'published') publishedCount++;
    }

    const nonArchivedCount = items.filter(item => item.status !== 'archived').length;
    return { activeCount, nonArchivedCount, totalActive: activeCount, ideaCount, inProductionCount, publishedCount };
  },

  filterAndSortItems(items: ProductionItem[], filter: ProductionFilterState): ProductionItem[] {
    let result = [...items];

    if (filter.status !== 'all') result = result.filter(item => item.status === filter.status);
    else result = result.filter(item => item.status !== 'archived');

    if (filter.priority !== 'all') result = result.filter(item => item.priority === filter.priority);

    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      result = result.filter(item => {
        const wt = (item.workingTitle || '').toLowerCase();
        const st = (item.sourceVideo?.title || '').toLowerCase();
        const ch = (item.sourceVideo?.channelName || '').toLowerCase();
        return wt.includes(q) || st.includes(q) || ch.includes(q);
      });
    }

    const priorityWeight: Record<ProductionPriority, number> = { high: 3, normal: 2, low: 1 };
    result.sort((a, b) => {
      if (filter.sortBy === 'priority_desc') {
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (diff !== 0) return diff;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (filter.sortBy === 'created_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  },

  formatRelativeTime(isoDate: string | null): string {
    if (!isoDate) return '—';
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 30) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return isoDate;
    }
  },

  formatDueState(isoDate: string | null): { label: string; tone: 'neutral' | 'warning' | 'danger' | 'success' } | null {
    if (!isoDate) return null;
    const due = new Date(isoDate);
    if (Number.isNaN(due.getTime())) return null;
    const diff = due.getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return { label: `Quá hạn ${Math.abs(days)} ngày`, tone: 'danger' };
    if (days === 0) return { label: 'Đến hạn hôm nay', tone: 'warning' };
    if (days <= 2) return { label: `Còn ${days} ngày`, tone: 'warning' };
    return { label: `Còn ${days} ngày`, tone: 'neutral' };
  },
};
