// Service Layer: channel-service.ts
// Nguồn dữ liệu duy nhất cho kênh đối thủ qua Supabase
// TUYỆT ĐỐI KHÔNG TẠO DỮ LIỆU GIẢ.
// Mọi thao tác WRITE đi qua Edge Function 'manage-channels' với Mã Truy Cập.

import { getSupabase, isSupabaseConfigured, parseEdgeFunctionError } from './supabase';
import {
  Channel,
  DbChannel,
  CreateChannelInput,
  UpdateChannelInput,
  ResolvedChannelPreview,
  BulkResolveSummary,
  mapDbChannelToChannel,
} from '@/types/channel';

export const ACCESS_KEY_STORAGE_KEY = 'bbdt_access_key';

export function getStoredAccessKey(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAccessKey(key: string): void {
  try {
    sessionStorage.setItem(ACCESS_KEY_STORAGE_KEY, key.trim());
  } catch {
    // SessionStorage unavailable
  }
}

export function clearStoredAccessKey(): void {
  try {
    sessionStorage.removeItem(ACCESS_KEY_STORAGE_KEY);
  } catch {
    // Ignored
  }
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('Chưa kết nối cơ sở dữ liệu. Vui lòng cấu hình Supabase URL và Anon Key.');
    this.name = 'DatabaseNotConfiguredError';
  }
}

export class AccessKeyRequiredError extends Error {
  constructor(message = 'Vui lòng nhập Mã truy cập để thực hiện thao tác.') {
    super(message);
    this.name = 'AccessKeyRequiredError';
  }
}

export const channelService = {
  /**
   * Lấy danh sách toàn bộ kênh từ database (Read-only qua anon SELECT)
   */
  async listChannels(): Promise<Channel[]> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }
    const supabase = getSupabase()!;
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Lỗi tải danh sách kênh: ${error.message}`);
    }

    return (data as DbChannel[]).map(mapDbChannelToChannel);
  },

  /**
   * Tìm kênh theo youtube_channel_id
   */
  async findByYoutubeId(youtubeChannelId: string): Promise<Channel | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase()!;
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('youtube_channel_id', youtubeChannelId)
      .maybeSingle();

    if (error) throw new Error(`Lỗi kiểm tra kênh: ${error.message}`);
    return data ? mapDbChannelToChannel(data as DbChannel) : null;
  },

  /**
   * Giải quyết thông tin kênh YouTube từ URL hoặc @handle
   * FAIL-CLOSED: Bắt buộc gọi qua Edge Function. Không đoán Channel ID, không tạo tên giả.
   */
  async resolveChannel(input: string): Promise<ResolvedChannelPreview> {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Vui lòng nhập đường dẫn hoặc @tênkênh YouTube.');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Chưa kết nối dịch vụ kiểm tra kênh YouTube.');
    }

    const supabase = getSupabase()!;
    const { data, error } = await supabase.functions.invoke('resolve-youtube-channel', {
      body: { query: trimmed },
    });

    if (error) {
      const { message } = await parseEdgeFunctionError(error, 'Lỗi kết nối dịch vụ kiểm tra kênh YouTube.');
      throw new Error(message);
    }

    // CONTRACT DUY NHẤT: data.channel
    if (!data?.success || !data?.channel) {
      throw new Error(data?.error || 'Không tìm thấy kênh YouTube hợp lệ.');
    }

    return data.channel as ResolvedChannelPreview;
  },

  /**
   * Gọi Edge Function 'manage-channels' để thực hiện mutation an toàn phía server
   */
  async _invokeManage(action: string, payload: any): Promise<Channel> {
    const accessKey = getStoredAccessKey();
    if (!accessKey) {
      throw new AccessKeyRequiredError();
    }

    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const supabase = getSupabase()!;
    const { data, error } = await supabase.functions.invoke('manage-channels', {
      body: {
        accessKey,
        action,
        payload,
      },
    });

    if (error) {
      const { message, isAuthError } = await parseEdgeFunctionError(error, 'Lỗi xử lý từ máy chủ.');
      if (isAuthError) {
        clearStoredAccessKey();
        throw new AccessKeyRequiredError(message);
      }
      throw new Error(message);
    }

    if (!data?.success || !data?.channel) {
      if (data?.error && (data.error.includes('Mã truy cập') || data.error.includes('truy cập'))) {
        clearStoredAccessKey();
        throw new AccessKeyRequiredError(data.error);
      }
      throw new Error(data?.error || 'Thao tác không thành công.');
    }

    return mapDbChannelToChannel(data.channel as DbChannel);
  },

  /**
   * Thêm kênh mới (qua Edge Function manage-channels)
   */
  async createChannel(input: CreateChannelInput): Promise<Channel> {
    return this._invokeManage('create', input);
  },

  /**
   * Cập nhật thiết lập kênh (qua Edge Function manage-channels)
   */
  async updateChannel(id: string, input: UpdateChannelInput): Promise<Channel> {
    return this._invokeManage('update', { id, ...input });
  },

  /**
   * Tạm dừng theo dõi kênh (status = paused)
   */
  async pauseChannel(id: string): Promise<Channel> {
    return this._invokeManage('pause', { id });
  },

  /**
   * Bật lại theo dõi kênh (status = active)
   */
  async resumeChannel(id: string): Promise<Channel> {
    return this._invokeManage('resume', { id });
  },

  /**
   * Lưu trữ kênh (status = archived, không xóa vật lý)
   */
  async archiveChannel(id: string): Promise<Channel> {
    return this._invokeManage('archive', { id });
  },

  /**
   * Khôi phục kênh đã lưu trữ (status = active)
   */
  async restoreChannel(id: string): Promise<Channel> {
    return this._invokeManage('restore', { id });
  },

  /**
   * Kiểm tra hàng loạt nhiều kênh
   */
  async bulkResolveChannels(
    lines: string[],
    existingChannels: Channel[],
    onProgress?: (current: number, total: number) => void
  ): Promise<BulkResolveSummary> {
    const cleanLines = lines
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const summary: BulkResolveSummary = {
      total: cleanLines.length,
      valid: [],
      duplicates: [],
      errors: [],
    };

    const existingMap = new Map<string, Channel>();
    existingChannels.forEach(c => existingMap.set(c.youtubeChannelId, c));

    for (let i = 0; i < cleanLines.length; i++) {
      const line = cleanLines[i];
      if (onProgress) {
        onProgress(i + 1, cleanLines.length);
      }

      try {
        const resolved = await this.resolveChannel(line);
        const existing = existingMap.get(resolved.youtubeChannelId);

        if (existing) {
          summary.duplicates.push({
            input: line,
            resolved,
            alreadyExists: true,
            existingChannel: existing,
          });
        } else {
          summary.valid.push({
            input: line,
            resolved,
            alreadyExists: false,
          });
          // Tránh trùng lặp ngay trong danh sách gửi lên
          existingMap.set(resolved.youtubeChannelId, {
            id: 'temp',
            youtubeChannelId: resolved.youtubeChannelId,
            name: resolved.name,
            handle: resolved.handle,
            url: resolved.url,
            avatarUrl: resolved.avatarUrl,
            status: 'active',
            scanLimit: 15,
            alertVphThreshold: 5000,
            source: 'manual',
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastScanAt: null,
          });
        }
      } catch (err: any) {
        summary.errors.push({
          input: line,
          resolved: null,
          alreadyExists: false,
          error: err.message || 'Không tìm thấy kênh.',
        });
      }
    }

    return summary;
  },
};
