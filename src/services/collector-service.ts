import { getSupabase, isSupabaseConfigured, parseEdgeFunctionError } from './supabase';
import {
  getStoredAccessKey,
  clearStoredAccessKey,
  AccessKeyRequiredError,
  DatabaseNotConfiguredError,
  INVALID_KEY_ERROR_MESSAGE,
} from './channel-service';
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
      const { message, isAuthError } = await parseEdgeFunctionError(error, 'Lỗi kết nối máy chủ thu thập dữ liệu.');
      if (isAuthError) {
        clearStoredAccessKey();
        throw new AccessKeyRequiredError(INVALID_KEY_ERROR_MESSAGE);
      }
      throw new Error(message);
    }

    if (!data?.success) {
      if (data?.error && (data.error.includes('Mã truy cập') || data.error.includes('truy cập'))) {
        clearStoredAccessKey();
        throw new AccessKeyRequiredError(INVALID_KEY_ERROR_MESSAGE);
      }
      throw new Error(data?.error || 'Quá trình kiểm tra dữ liệu không thành công.');
    }

    return data as CollectorResponse;
  },
};
