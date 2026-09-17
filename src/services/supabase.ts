// Supabase Client Config cho Bắt Bài Đối Thủ
// Sử dụng Supabase Publishable Key (chuẩn mới). Tuyệt đối không để Secret Key ở frontend!

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabasePublishableKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabasePublishableKey);
  }
  return clientInstance;
}

/**
 * Trích xuất chi tiết thông báo lỗi từ Edge Function response của Supabase (@supabase/functions-js).
 * Xử lý FunctionsHttpError để lấy payload JSON { success: false, error: '...' } từ máy chủ
 * thay vì lỗi generic 'Edge Function returned a non-2xx status code'.
 */
export async function parseEdgeFunctionError(
  error: any,
  fallbackMessage: string = 'Lỗi kết nối máy chủ.'
): Promise<{ message: string; isAuthError: boolean }> {
  let message = error?.message || fallbackMessage;
  let isAuthError = false;

  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as any).context;
    if (ctx?.status === 401 || ctx?.status === 403) {
      isAuthError = true;
    }

    try {
      const responseToRead = typeof ctx?.clone === 'function' ? ctx.clone() : ctx;
      if (typeof responseToRead?.json === 'function') {
        const body = await responseToRead.json();
        if (body?.error) {
          message = body.error;
          if (
            body.error.includes('Mã truy cập') ||
            body.error.includes('truy cập') ||
            body.error.toLowerCase().includes('unauthorized') ||
            body.error.toLowerCase().includes('forbidden')
          ) {
            isAuthError = true;
          }
        }
      }
    } catch {
      // Ignored
    }
  }

  if (message === 'Edge Function returned a non-2xx status code') {
    message = isAuthError
      ? 'Mã truy cập không chính xác. Thao tác bị từ chối.'
      : fallbackMessage;
  }

  return { message, isAuthError };
}

