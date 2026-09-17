// Service Layer: collector-service.ts
// Kích hoạt tiến trình thu thập dữ liệu video server-side qua Edge Function

import { getSupabase, isSupabaseConfigured } from './supabase';
import { getStoredAccessKey, AccessKeyRequiredError, DatabaseNotConfiguredError } from './channel-service';
import { CollectorResponse } from '@/types/scan';

export const collectorService = {
  /**
   * Kích hoạt quét dữ liệu video thủ công
   */
  async triggerCollection(providedKey?: string, triggerSource: 'manual' | 'schedule' = 'manual'): Promise<CollectorResponse> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseNotConfiguredError();
    }

    const accessKey = providedKey || getStoredAccessKey();
    if (!accessKey) {
      throw new AccessKeyRequiredError('Vui lòng nhập Mã truy cập để thực hiện kiểm tra dữ liệu.');
    }

    const supabase = getSupabase()!;
    const { data, error } = await supabase.functions.invoke('collect-youtube-data', {
      body: { accessKey, triggerSource },
    });

    if (error) {
      throw new Error(error.message || 'Lỗi kết nối máy chủ thu thập dữ liệu.');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Quá trình kiểm tra dữ liệu không thành công.');
    }

    return data as CollectorResponse;
  },
};
