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
