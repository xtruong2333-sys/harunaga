// src/services/ai-content-service.ts
// Service xử lý nghiệp vụ cho Trợ Lý Nội Dung AI
// Tuyệt đối không gọi OpenAI trực tiếp từ browser
// Chỉ giao tiếp qua Supabase Edge Function: analyze-video-content
// Sử dụng dữ liệu thật từ Supabase database

import { getSupabase, isSupabaseConfigured, parseEdgeFunctionError } from './supabase';
import {
  getStoredAccessKey,
  setStoredAccessKey,
  clearStoredAccessKey,
  AccessKeyRequiredError,
  INVALID_KEY_ERROR_MESSAGE,
} from './channel-service';
import type { AiContentAnalysis, AiVideoOption } from '@/types/ai-content';

export { getStoredAccessKey, setStoredAccessKey, clearStoredAccessKey, AccessKeyRequiredError };

/**
 * Suy ra URL thumbnail từ thumbnail_url hoặc youtube_video_id.
 * Tuyệt đối không tạo URL chứa /null/ hoặc /undefined/.
 */
export function deriveThumbnailUrl(
  thumbnailUrl: string | null | undefined,
  youtubeVideoId: string | null | undefined
): string | null {
  if (thumbnailUrl && typeof thumbnailUrl === 'string' && thumbnailUrl.trim().length > 0) {
    return thumbnailUrl.trim();
  }
  if (youtubeVideoId && typeof youtubeVideoId === 'string' && youtubeVideoId.trim().length > 0) {
    const cleanId = youtubeVideoId.trim();
    if (cleanId !== 'null' && cleanId !== 'undefined') {
      return `https://i.ytimg.com/vi/${cleanId}/mqdefault.jpg`;
    }
  }
  return null;
}

/**
 * Định dạng số nullable.
 * null/undefined/NaN -> fallback ('—')
 * 0 -> '0'
 */
export function formatNullableNumber(val: number | null | undefined, fallback = '—'): string {
  if (val === null || val === undefined || isNaN(Number(val))) return fallback;
  return Number(val).toLocaleString('vi-VN');
}

/**
 * Định dạng VPH.
 * null/undefined/NaN -> 'Chưa đủ dữ liệu'
 * 0 -> '0 VPH'
 */
export function formatVph(vph: number | null | undefined): string {
  if (vph === null || vph === undefined || isNaN(Number(vph))) return 'Chưa đủ dữ liệu';
  return `${Number(vph).toLocaleString('vi-VN')} VPH`;
}

/**
 * Định dạng chênh lệch lượt xem giữa 2 lần quét.
 * null/undefined/NaN -> 'Chưa đủ dữ liệu'
 * 0 -> '0 view'
 * > 0 -> '+X view'
 * < 0 -> '-X view'
 */
export function formatViewDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined || isNaN(Number(delta))) return 'Chưa đủ dữ liệu';
  if (delta === 0) return '0 view';
  if (delta > 0) return `+${delta.toLocaleString('vi-VN')} view`;
  return `-${Math.abs(delta).toLocaleString('vi-VN')} view`;
}

export const aiContentService = {
  /**
   * Lấy danh sách video từ database để người dùng chọn phân tích.
   * Ưu tiên video có VPH cao nhất và video mới nhất.
   */
  async fetchAiVideoOptions(): Promise<AiVideoOption[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('videos')
      .select('id, youtube_video_id, title, channel_id, published_at, latest_view_count, latest_measured_vph, thumbnail_url, channels ( id, name, alert_vph_threshold )')
      .order('latest_measured_vph', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Lỗi truy vấn video options cho AI:', error);
      throw new Error(error.message || 'Không thể tải danh sách video.');
    }

    if (!data) return [];

    return data.map((row: any) => {
      const channel = row.channels as any;
      const rawYtId = row.youtube_video_id && typeof row.youtube_video_id === 'string' ? row.youtube_video_id.trim() : null;
      const validYtId = rawYtId && rawYtId !== 'null' && rawYtId !== 'undefined' ? rawYtId : null;

      return {
        id: row.id,
        youtube_video_id: validYtId,
        title: row.title,
        channel_id: row.channel_id,
        channel_name: channel?.name || 'Kênh đối thủ',
        published_at: row.published_at,
        latest_view_count: row.latest_view_count,
        latest_measured_vph: row.latest_measured_vph,
        alert_vph_threshold: channel?.alert_vph_threshold !== null && channel?.alert_vph_threshold !== undefined && !isNaN(Number(channel.alert_vph_threshold)) ? Number(channel.alert_vph_threshold) : null,
        thumbnail_url: deriveThumbnailUrl(row.thumbnail_url, validYtId),
      };
    });
  },

  /**
   * Lấy chi tiết 1 video cùng thông tin 2 snapshot gần nhất để hiển thị video context card
   */
  async fetchVideoContext(videoId: string): Promise<AiVideoOption | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: video, error: vErr } = await supabase
      .from('videos')
      .select('id, youtube_video_id, title, channel_id, published_at, latest_view_count, latest_measured_vph, thumbnail_url, channels ( id, name, alert_vph_threshold )')
      .eq('id', videoId)
      .single();

    if (vErr) {
      if (vErr.code === 'PGRST116' || vErr.message?.includes('0 rows')) {
        return null;
      }
      console.error('Lỗi truy vấn video context:', vErr);
      throw new Error(vErr.message || 'Lỗi khi tải thông tin video.');
    }

    if (!video) return null;

    // Lấy 2 snapshot gần nhất
    const { data: snapshots, error: sErr } = await supabase
      .from('video_snapshots')
      .select('view_count, checked_at')
      .eq('video_id', videoId)
      .order('checked_at', { ascending: false })
      .limit(2);

    if (sErr) {
      console.error('Lỗi truy vấn snapshots:', sErr);
      throw new Error(sErr.message || 'Lỗi khi tải lịch sử snapshot.');
    }

    let viewDelta: number | null = null;
    if (
      snapshots &&
      snapshots.length >= 2 &&
      snapshots[0].view_count !== null &&
      snapshots[0].view_count !== undefined &&
      typeof snapshots[0].view_count === 'number' &&
      !isNaN(snapshots[0].view_count) &&
      snapshots[1].view_count !== null &&
      snapshots[1].view_count !== undefined &&
      typeof snapshots[1].view_count === 'number' &&
      !isNaN(snapshots[1].view_count)
    ) {
      viewDelta = snapshots[0].view_count - snapshots[1].view_count;
    }

    const channel = video.channels as any;
    const rawYtId = video.youtube_video_id && typeof video.youtube_video_id === 'string' ? video.youtube_video_id.trim() : null;
    const validYtId = rawYtId && rawYtId !== 'null' && rawYtId !== 'undefined' ? rawYtId : null;

    return {
      id: video.id,
      youtube_video_id: validYtId,
      title: video.title,
      channel_id: video.channel_id,
      channel_name: channel?.name || 'Kênh đối thủ',
      published_at: video.published_at,
      latest_view_count: video.latest_view_count,
      latest_measured_vph: video.latest_measured_vph,
      alert_vph_threshold: channel?.alert_vph_threshold !== null && channel?.alert_vph_threshold !== undefined && !isNaN(Number(channel.alert_vph_threshold)) ? Number(channel.alert_vph_threshold) : null,
      thumbnail_url: deriveThumbnailUrl(video.thumbnail_url, validYtId),
      view_delta: viewDelta,
    };
  },

  /**
   * Gọi Edge Function analyze-video-content với Mã Truy Cập
   */
  async analyzeVideoContent(videoId: string, explicitKey?: string): Promise<AiContentAnalysis> {
    const accessKey = explicitKey || getStoredAccessKey();
    if (!accessKey) {
      throw new AccessKeyRequiredError();
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Chưa kết nối cơ sở dữ liệu Supabase.');
    }

    const supabase = getSupabase()!;
    const { data, error } = await supabase.functions.invoke('analyze-video-content', {
      body: {
        accessKey,
        videoId,
      },
    });

    if (error) {
      const { message, isAuthError } = await parseEdgeFunctionError(error, 'Lỗi kết nối máy chủ phân tích AI.');
      if (isAuthError) {
        clearStoredAccessKey();
        throw new AccessKeyRequiredError(INVALID_KEY_ERROR_MESSAGE);
      }
      throw new Error(message);
    }

    if (!data?.success || !data?.data) {
      const errMsg = data?.error || 'Không thể phân tích video.';
      if (errMsg.includes('Mã truy cập') || errMsg.includes('truy cập')) {
        clearStoredAccessKey();
        throw new AccessKeyRequiredError(INVALID_KEY_ERROR_MESSAGE);
      }
      throw new Error(errMsg);
    }

    return data.data as AiContentAnalysis;
  },

  /**
   * Định dạng toàn bộ kết quả phân tích sang dạng văn bản tiếng Việt dễ đọc để sao chép
   */
  formatAnalysisToPlainText(
    analysis: AiContentAnalysis,
    videoTitle: string,
    channelName: string
  ): string {
    const lines: string[] = [];
    lines.push('========================================');
    lines.push('BẮT BÀI ĐỐI THỦ — TRỢ LÝ NỘI DUNG AI');
    lines.push('========================================');
    lines.push(`Video gốc: ${videoTitle}`);
    lines.push(`Kênh đối thủ: ${channelName}`);
    lines.push('');

    lines.push('1. TÓM TẮT & GÓC NỘI DUNG:');
    lines.push(`- Tóm tắt chủ đề: ${analysis.summary}`);
    lines.push(`- Góc tiếp cận đối thủ: ${analysis.content_angle}`);
    lines.push('');

    lines.push('2. YẾU TỐ THU HÚT NGƯỜI XEM:');
    analysis.why_it_may_attract_attention.forEach((reason, idx) => {
      lines.push(`- [${idx + 1}] ${reason}`);
    });
    lines.push('');

    lines.push('3. 5 ĐỀ XUẤT TIÊU ĐỀ MỚI:');
    analysis.title_ideas.forEach((title, idx) => {
      lines.push(`${idx + 1}. ${title}`);
    });
    lines.push('');

    lines.push('4. 3 CONCEPT THUMBNAIL GỢI Ý:');
    analysis.thumbnail_concepts.forEach((concept, idx) => {
      lines.push(`• Concept ${idx + 1}: ${concept.concept}`);
      lines.push(`  + Trọng tâm hình ảnh: ${concept.visual_focus}`);
      lines.push(`  + Chữ trên ảnh (Overlay): "${concept.text_overlay}"`);
    });
    lines.push('');

    lines.push('5. 3 HOOK MỞ ĐẦU (0-5 GIÂY ĐẦU):');
    analysis.hook_ideas.forEach((hook, idx) => {
      lines.push(`• Hook ${idx + 1}: "${hook}"`);
    });
    lines.push('');

    lines.push('6. LƯU Ý TÍNH NGUYÊN BẢN (ORIGINALITY):');
    lines.push(analysis.originality_note);
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('Được tạo bởi: Bắt Bài Đối Thủ (batbaidoithu.click)');

    return lines.join('\n');
  },
};
