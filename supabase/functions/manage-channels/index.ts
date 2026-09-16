// Supabase Edge Function: manage-channels
// Xử lý toàn bộ các thao tác ghi (create, update, pause, resume, archive, restore)
// Xác thực qua APP_WRITE_ACCESS_KEY server-side.
// Tuyệt đối không để browser anon tự do INSERT / UPDATE database.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface ManageRequest {
  accessKey: string;
  action: 'create' | 'update' | 'pause' | 'resume' | 'archive' | 'restore';
  payload?: any;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ManageRequest;
    const { accessKey, action, payload } = body;

    // 1. Xác thực Mã Truy Cập Quản Trị
    const configuredKey = Deno.env.get("APP_WRITE_ACCESS_KEY");
    if (!configuredKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Hệ thống máy chủ chưa cấu hình APP_WRITE_ACCESS_KEY. Vui lòng liên hệ quản trị viên.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!accessKey || accessKey.trim() !== configuredKey.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Mã truy cập không chính xác. Thao tác bị từ chối.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Khởi tạo Supabase Server Client với SERVICE_ROLE_KEY
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trên Edge Function.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 3. Thực hiện thao tác
    switch (action) {
      case "create": {
        const { youtubeChannelId, name, handle, url, avatarUrl, scanLimit, alertVphThreshold, notes } = payload;
        
        // Kiểm tra dữ liệu đầu vào bắt buộc
        if (!youtubeChannelId || !/^UC[a-zA-Z0-9_-]{22}$/.test(youtubeChannelId)) {
          return new Response(
            JSON.stringify({ success: false, error: "YouTube Channel ID không hợp lệ." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!name || typeof name !== 'string' || !name.trim()) {
          return new Response(
            JSON.stringify({ success: false, error: "Tên kênh không được để trống." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validScanLimit = Math.max(1, Math.min(50, Number(scanLimit) || 15));
        const validThreshold = Math.max(1, Number(alertVphThreshold) || 5000);

        // Kiểm tra trùng lặp tại server
        const { data: existing } = await supabase
          .from("channels")
          .select("id, name")
          .eq("youtube_channel_id", youtubeChannelId)
          .maybeSingle();

        if (existing) {
          return new Response(
            JSON.stringify({ success: false, error: "Kênh này đã có trong danh sách theo dõi." }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("channels")
          .insert({
            youtube_channel_id: youtubeChannelId,
            name: name.trim(),
            handle: handle ? handle.trim() : null,
            url: url || `https://www.youtube.com/channel/${youtubeChannelId}`,
            avatar_url: avatarUrl || null,
            scan_limit: validScanLimit,
            alert_vph_threshold: validThreshold,
            notes: notes ? notes.trim() : null,
            status: "active",
            source: "manual",
          })
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: `Lỗi thêm kênh: ${error.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, channel: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        const { id, scanLimit, alertVphThreshold, notes, status } = payload;
        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: "Thiếu ID kênh cần cập nhật." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: any = {};
        if (scanLimit !== undefined) updateData.scan_limit = Math.max(1, Math.min(50, Number(scanLimit)));
        if (alertVphThreshold !== undefined) updateData.alert_vph_threshold = Math.max(1, Number(alertVphThreshold));
        if (notes !== undefined) updateData.notes = notes;
        if (status && ["active", "paused", "archived"].includes(status)) updateData.status = status;

        const { data, error } = await supabase
          .from("channels")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: `Lỗi cập nhật kênh: ${error.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, channel: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "pause": {
        const { id } = payload;
        const { data, error } = await supabase
          .from("channels")
          .update({ status: "paused" })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, channel: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "resume": {
        const { id } = payload;
        const { data, error } = await supabase
          .from("channels")
          .update({ status: "active" })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, channel: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "archive": {
        const { id } = payload;
        const { data, error } = await supabase
          .from("channels")
          .update({ status: "archived" })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, channel: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "restore": {
        const { id } = payload;
        const { data, error } = await supabase
          .from("channels")
          .update({ status: "active" })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, channel: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Hành động không hợp lệ." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Lỗi xử lý quản lý kênh." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
