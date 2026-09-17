// src/services/production-service.ts
// Nguồn dữ liệu duy nhất cho Tiến Độ Sản Xuất
// Thao tác SELECT đọc trực tiếp từ Supabase RLS public
// Mọi thao tác GHI (create, update, change_status, archive, restore, delete)
// đi qua Edge Function 'manage-production-items' với APP_WRITE_ACCESS_KEY.

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
  ProductionStatus,
  ProductionPriority,
  ProductionFilterState,
  ProductionStats,
} from '@/types/production';

export { getStoredAccessKey, setStoredAccessKey, clearStoredAccessKey, AccessKeyRequiredError };

function mapDbRowToItem(row: any): ProductionItem {
  const video = row.videos;
  const channel = video?.channels;

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
    sourceVideo: video
      ? {
          id: video.id,
          title: video.title,
          url: video.url || `https://www.youtube.com/watch?v=${video.youtube_video_id}`,
          youtubeVideoId: video.youtube_video_id,
          thumbnailUrl:
            video.thumbnail_url ||
            (video.youtube_video_id
              ? `https://i.ytimg.com/vi/${video.youtube_video_id}/mqdefault.jpg`
              : null),
          channelName: channel?.name || 'Kênh đối thủ',
          channelHandle: channel?.handle || null,
          channelAvatarUrl: channel?.avatar_url || null,
        }
      : null,
  };
}

export const productionService = {
  /**
   * Lấy danh sách toàn bộ các mục sản xuất từ Supabase database
   */
  async fetchProductionItems(): Promise<ProductionItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('production_items')
      .select('*, videos(id, title, youtube_video_id, url, thumbnail_url, channel_id, channels(name, handle, avatar_url))')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      console.error('Lỗi khi tải production_items:', error);
      throw new Error(error?.message || 'Không thể tải Tiến Độ Sản Xuất.');
    }

    return data.map(mapDbRowToItem);
  },

  /**
   * Kiểm tra xem videoId đã có mục trong production_items chưa
   */
  async checkVideoInProduction(videoId: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = await supabase
      .from('production_items')
      .select('id')
      .eq('source_video_id', videoId)
      .maybeSingle();

    return data?.id || null;
  },

  /**
   * Gọi Edge Function manage-production-items
   */
  async _invokeProductionEdge(action: string, payload: any, explicitKey?: string): Promise<any> {
    const accessKey = explicitKey || getStoredAccessKey();
    if (!accessKey) {
      throw new AccessKeyRequiredError();
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Chưa kết nối cơ sở dữ liệu Supabase.');
    }

    const supabase = getSupabase()!;
    const { data, error } = await supabase.functions.invoke('manage-production-items', {
      body: {
        accessKey,
        action,
        payload,
      },
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

  /**
   * Đưa video đối thủ vào danh sách sản xuất
   */
  async createProductionItem(input: ProductionCreateInput, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('create', input, explicitKey);
    return mapDbRowToItem(res.item);
  },

  /**
   * Cập nhật thông tin mục sản xuất
   */
  async updateProductionItem(input: ProductionUpdateInput, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('update', input, explicitKey);
    return mapDbRowToItem(res.item);
  },

  /**
   * Đổi trạng thái mục sản xuất
   */
  async changeProductionStatus(
    id: string,
    status: ProductionStatus,
    explicitKey?: string
  ): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('change_status', { id, status }, explicitKey);
    return mapDbRowToItem(res.item);
  },

  /**
   * Lưu trữ mục sản xuất (status = 'archived')
   */
  async archiveProductionItem(id: string, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('archive', { id }, explicitKey);
    return mapDbRowToItem(res.item);
  },

  /**
   * Khôi phục mục đã lưu trữ về Ý tưởng (status = 'idea')
   */
  async restoreProductionItem(id: string, explicitKey?: string): Promise<ProductionItem> {
    const res = await this._invokeProductionEdge('restore', { id }, explicitKey);
    return mapDbRowToItem(res.item);
  },

  /**
   * Xóa vĩnh viễn mục sản xuất khỏi bảng production_items
   */
  async deleteProductionItem(id: string, explicitKey?: string): Promise<string> {
    const res = await this._invokeProductionEdge('delete', { id }, explicitKey);
    return res.deletedId;
  },

  /**
   * Tính toán 4 chỉ số thống kê tóm tắt
   */
  computeSummaryStats(items: ProductionItem[]): ProductionStats {
    let activeCount = 0;
    let ideaCount = 0;
    let inProductionCount = 0;
    let publishedCount = 0;

    for (const item of items) {
      if (item.status !== 'archived') {
        activeCount++;
      }
      if (item.status === 'idea') {
        ideaCount++;
      }
      if (item.status === 'production' || item.status === 'editing') {
        inProductionCount++;
      }
      if (item.status === 'published') {
        publishedCount++;
      }
    }

    return {
      activeCount,
      totalActive: activeCount,
      ideaCount,
      inProductionCount,
      publishedCount,
    };
  },

  /**
   * Lọc và sắp xếp các mục sản xuất theo filter state
   */
  filterAndSortItems(items: ProductionItem[], filter: ProductionFilterState): ProductionItem[] {
    let result = [...items];

    // 1. Lọc theo trạng thái
    if (filter.status !== 'all') {
      result = result.filter(item => item.status === filter.status);
    } else {
      // Mặc định tab 'Tất cả' hoặc Kanban board không hiển thị archived
      result = result.filter(item => item.status !== 'archived');
    }

    // 2. Lọc theo mức ưu tiên
    if (filter.priority !== 'all') {
      result = result.filter(item => item.priority === filter.priority);
    }

    // 3. Tìm kiếm theo tiêu đề dự kiến, tiêu đề video gốc hoặc tên kênh
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      result = result.filter(item => {
        const wt = (item.workingTitle || '').toLowerCase();
        const st = (item.sourceVideo?.title || '').toLowerCase();
        const ch = (item.sourceVideo?.channelName || '').toLowerCase();
        return wt.includes(q) || st.includes(q) || ch.includes(q);
      });
    }

    // 4. Sắp xếp
    const priorityWeight: Record<ProductionPriority, number> = {
      high: 3,
      normal: 2,
      low: 1,
    };

    result.sort((a, b) => {
      if (filter.sortBy === 'priority_desc') {
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (diff !== 0) return diff;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (filter.sortBy === 'created_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // default: updated_desc
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  },

  /**
   * Định dạng thời gian tương đối
   */
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
};
