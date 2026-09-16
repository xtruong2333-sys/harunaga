// Service Layer: channel-service.ts
// Nguồn dữ liệu duy nhất cho kênh đối thủ qua Supabase

import { getSupabase, isSupabaseConfigured } from './supabase';
import {
  Channel,
  DbChannel,
  CreateChannelInput,
  UpdateChannelInput,
  ResolvedChannelPreview,
  BulkResolveSummary,
  mapDbChannelToChannel,
  mapChannelInputToDb,
} from '@/types/channel';

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('Chưa kết nối cơ sở dữ liệu. Vui lòng cấu hình Supabase URL và Anon Key.');
    this.name = 'DatabaseNotConfiguredError';
  }
}

export const channelService = {
  /**
   * Lấy danh sách toàn bộ kênh từ database
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
   * Gọi qua Edge Function hoặc fallback trực tiếp client parser
   */
  async resolveChannel(input: string): Promise<ResolvedChannelPreview> {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Vui lòng nhập đường dẫn hoặc @tênkênh YouTube.');
    }

    // Thử gọi qua Supabase Edge Function nếu khả dụng
    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;
      try {
        const { data, error } = await supabase.functions.invoke('resolve-youtube-channel', {
          body: { query: trimmed },
        });

        if (!error && data?.success && data?.data) {
          return data.data as ResolvedChannelPreview;
        }
        if (data?.error) {
          throw new Error(data.error);
        }
      } catch (err: any) {
        // Nếu Edge Function không deploy hoặc mạng lỗi, tiếp tục phân tích phía client
        if (err.message && !err.message.includes('FunctionsFetchError')) {
          throw err;
        }
      }
    }

    // Client-side parser cho các URL chuẩn YouTube (khi dev hoặc chưa deploy Edge Function)
    return this._clientResolveFallback(trimmed);
  },

  /**
   * Bộ giải quyết chuẩn hóa phía client khi chưa deploy edge function
   */
  async _clientResolveFallback(input: string): Promise<ResolvedChannelPreview> {
    let clean = input.trim();
    
    // Xử lý @handle trực tiếp
    if (clean.startsWith('@')) {
      const handle = clean;
      const cleanHandle = handle.replace(/[^a-zA-Z0-9_.-]/g, '');
      return {
        youtubeChannelId: `UC_${cleanHandle}`,
        name: cleanHandle,
        handle: handle,
        url: `https://www.youtube.com/${handle}`,
        avatarUrl: null,
      };
    }

    // Xử lý URL
    let urlStr = clean;
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      urlStr = 'https://' + urlStr;
    }

    try {
      const url = new URL(urlStr);
      const path = url.pathname.replace(/\/+$/, '');

      // Dạng @handle: youtube.com/@tenkenh
      const handleMatch = path.match(/\/(@[a-zA-Z0-9_.-]+)/);
      if (handleMatch) {
        const handle = handleMatch[1];
        const cleanHandle = handle.slice(1);
        return {
          youtubeChannelId: `UC_${cleanHandle}`,
          name: cleanHandle,
          handle: handle,
          url: `https://www.youtube.com/${handle}`,
          avatarUrl: null,
        };
      }

      // Dạng /channel/UC...
      const channelMatch = path.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
      if (channelMatch) {
        const channelId = channelMatch[1];
        return {
          youtubeChannelId: channelId,
          name: `Kênh ${channelId.slice(0, 8)}...`,
          handle: null,
          url: `https://www.youtube.com/channel/${channelId}`,
          avatarUrl: null,
        };
      }
    } catch {
      // Ignored
    }

    throw new Error('Đường dẫn hoặc @tênkênh không hợp lệ. Vui lòng nhập đúng định dạng (VD: @tenkenh hoặc youtube.com/@tenkenh).');
  },

  /**
   * Thêm kênh mới vào cơ sở dữ liệu
   */
  async createChannel(input: CreateChannelInput): Promise<Channel> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }
    const supabase = getSupabase()!;

    // Kiểm tra trùng lặp
    const existing = await this.findByYoutubeId(input.youtubeChannelId);
    if (existing) {
      throw new Error(`Kênh "${existing.name}" (${existing.youtubeChannelId}) đã tồn tại trong danh sách.`);
    }

    const payload = mapChannelInputToDb(input);
    const { data, error } = await supabase
      .from('channels')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Kênh này đã có trong danh sách theo dõi.');
      }
      throw new Error(`Không thể thêm kênh: ${error.message}`);
    }

    return mapDbChannelToChannel(data as DbChannel);
  },

  /**
   * Cập nhật thiết lập kênh (scan_limit, alert_vph_threshold, notes)
   */
  async updateChannel(id: string, input: UpdateChannelInput): Promise<Channel> {
    if (!isSupabaseConfigured()) throw new DatabaseNotConfiguredError();
    const supabase = getSupabase()!;

    const payload: Partial<DbChannel> = {};
    if (input.scanLimit !== undefined) payload.scan_limit = input.scanLimit;
    if (input.alertVphThreshold !== undefined) payload.alert_vph_threshold = input.alertVphThreshold;
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.status !== undefined) payload.status = input.status;

    const { data, error } = await supabase
      .from('channels')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Lỗi cập nhật thiết lập: ${error.message}`);
    return mapDbChannelToChannel(data as DbChannel);
  },

  /**
   * Tạm dừng theo dõi kênh (status = paused)
   */
  async pauseChannel(id: string): Promise<Channel> {
    return this.updateChannel(id, { status: 'paused' });
  },

  /**
   * Bật lại theo dõi kênh (status = active)
   */
  async resumeChannel(id: string): Promise<Channel> {
    return this.updateChannel(id, { status: 'active' });
  },

  /**
   * Lưu trữ kênh (status = archived, không xóa dữ liệu)
   */
  async archiveChannel(id: string): Promise<Channel> {
    return this.updateChannel(id, { status: 'archived' });
  },

  /**
   * Khôi phục kênh đã lưu trữ (status = active)
   */
  async restoreChannel(id: string): Promise<Channel> {
    return this.updateChannel(id, { status: 'active' });
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
          // Thêm tạm thời để tránh trùng lặp ngay trong danh sách nhập vào
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
