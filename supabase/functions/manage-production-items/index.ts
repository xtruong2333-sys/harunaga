// Supabase Edge Function: manage-production-items
// Quản lý các thao tác ghi của Tiến Độ Sản Xuất (create, update, change_status, archive, restore, delete)
// Xác thực an toàn qua APP_WRITE_ACCESS_KEY
// Tuyệt đối không xóa video nguồn khi xóa production item

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface ManageProductionRequest {
  accessKey: string;
  action: 'create' | 'update' | 'change_status' | 'archive' | 'restore' | 'delete';
  payload?: any;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_STATUSES = [
  'idea',
  'research',
  'script',
  'thumbnail',
  'production',
  'editing',
  'published',
  'archived',
];

const VALID_PRIORITIES = ['low', 'normal', 'high'];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ManageProductionRequest;
    const { accessKey, action, payload } = body || {};

    // 1. Xác thực Mã Truy Cập Quản Trị (APP_WRITE_ACCESS_KEY)
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

    // 2. Khởi tạo Supabase Server Client với Secret Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    let secretKey: string | null = null;
    try {
      const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
      secretKey = secretKeys["default"] || null;
    } catch {
      secretKey = null;
    }
    if (!secretKey) {
      secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || null;
    }

    if (!supabaseUrl || !secretKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Thiếu cấu hình SUPABASE_URL hoặc Secret Key trên máy chủ.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, secretKey);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 3. Xử lý các hành động
    switch (action) {
      case "create": {
        const { sourceVideoId, workingTitle, notes, priority } = payload || {};

        if (!sourceVideoId || !uuidRegex.test(sourceVideoId)) {
          return new Response(
            JSON.stringify({ success: false, error: "Mã định danh video nguồn không hợp lệ." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Kiểm tra video nguồn tồn tại trong bảng videos
        const { data: video, error: vErr } = await supabase
          .from("videos")
          .select("id, title")
          .eq("id", sourceVideoId)
          .single();

        if (vErr || !video) {
          return new Response(
            JSON.stringify({ success: false, error: "Không tìm thấy video nguồn trong hệ thống." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Kiểm tra xem video này đã có trong production_items chưa
        const { data: existing } = await supabase
          .from("production_items")
          .select("id")
          .eq("source_video_id", sourceVideoId)
          .maybeSingle();

        if (existing) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Video này đã có trong Tiến Độ Sản Xuất.",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validPriority = VALID_PRIORITIES.includes(priority) ? priority : "normal";
        const cleanTitle = workingTitle ? String(workingTitle).trim().slice(0, 200) : null;
        const cleanNotes = notes ? String(notes).trim().slice(0, 5000) : null;

        const { data: newItem, error: insErr } = await supabase
          .from("production_items")
          .insert({
            source_video_id: sourceVideoId,
            working_title: cleanTitle,
            notes: cleanNotes,
            priority: validPriority,
            status: "idea",
          })
          .select("*, videos(id, title, youtube_video_id, url, thumbnail_url, channels(name, handle, avatar_url))")
          .single();

        if (insErr || !newItem) {
          return new Response(
            JSON.stringify({ success: false, error: insErr?.message || "Không thể tạo mục sản xuất." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, item: newItem }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        const { id, workingTitle, notes, priority, publishedUrl } = payload || {};

        if (!id || !uuidRegex.test(id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Mã mục sản xuất không hợp lệ." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: any = { updated_at: new Date().toISOString() };

        if (workingTitle !== undefined) {
          updates.working_title = workingTitle ? String(workingTitle).trim().slice(0, 200) : null;
        }

        if (notes !== undefined) {
          updates.notes = notes ? String(notes).trim().slice(0, 5000) : null;
        }

        if (priority !== undefined) {
          if (!VALID_PRIORITIES.includes(priority)) {
            return new Response(
              JSON.stringify({ success: false, error: "Mức ưu tiên không hợp lệ (chỉ chấp nhận: low, normal, high)." }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          updates.priority = priority;
        }

        if (publishedUrl !== undefined) {
          if (publishedUrl && publishedUrl.trim()) {
            const urlStr = publishedUrl.trim();
            if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
              return new Response(
                JSON.stringify({ success: false, error: "URL xuất bản phải bắt đầu bằng http:// hoặc https://" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            updates.published_url = urlStr;
          } else {
            updates.published_url = null;
          }
        }

        const { data: updatedItem, error: updErr } = await supabase
          .from("production_items")
          .update(updates)
          .eq("id", id)
          .select("*, videos(id, title, youtube_video_id, url, thumbnail_url, channels(name, handle, avatar_url))")
          .single();

        if (updErr || !updatedItem) {
          return new Response(
            JSON.stringify({ success: false, error: updErr?.message || "Không thể cập nhật mục sản xuất." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, item: updatedItem }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "change_status": {
        const { id, status } = payload || {};

        if (!id || !uuidRegex.test(id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Mã mục sản xuất không hợp lệ." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!VALID_STATUSES.includes(status)) {
          return new Response(
            JSON.stringify({ success: false, error: `Trạng thái không hợp lệ: ${status}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: any = {
          status,
          updated_at: new Date().toISOString(),
        };

        // Nếu chuyển thành published và chưa có published_at, set published_at = now()
        if (status === "published") {
          const { data: current } = await supabase
            .from("production_items")
            .select("published_at")
            .eq("id", id)
            .single();

          if (!current?.published_at) {
            updates.published_at = new Date().toISOString();
          }
        }

        const { data: updatedItem, error: statusErr } = await supabase
          .from("production_items")
          .update(updates)
          .eq("id", id)
          .select("*, videos(id, title, youtube_video_id, url, thumbnail_url, channels(name, handle, avatar_url))")
          .single();

        if (statusErr || !updatedItem) {
          return new Response(
            JSON.stringify({ success: false, error: statusErr?.message || "Không thể đổi trạng thái mục sản xuất." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, item: updatedItem }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "archive": {
        const { id } = payload || {};

        if (!id || !uuidRegex.test(id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Mã mục sản xuất không hợp lệ." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: archivedItem, error: arcErr } = await supabase
          .from("production_items")
          .update({
            status: "archived",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select("*, videos(id, title, youtube_video_id, url, thumbnail_url, channels(name, handle, avatar_url))")
          .single();

        if (arcErr || !archivedItem) {
          return new Response(
            JSON.stringify({ success: false, error: arcErr?.message || "Không thể lưu trữ mục sản xuất." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, item: archivedItem }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "restore": {
        const { id } = payload || {};

        if (!id || !uuidRegex.test(id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Mã mục sản xuất không hợp lệ." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: restoredItem, error: resErr } = await supabase
          .from("production_items")
          .update({
            status: "idea",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select("*, videos(id, title, youtube_video_id, url, thumbnail_url, channels(name, handle, avatar_url))")
          .single();

        if (resErr || !restoredItem) {
          return new Response(
            JSON.stringify({ success: false, error: resErr?.message || "Không thể khôi phục mục sản xuất." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, item: restoredItem }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const { id } = payload || {};

        if (!id || !uuidRegex.test(id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Mã mục sản xuất không hợp lệ." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: delErr } = await supabase
          .from("production_items")
          .delete()
          .eq("id", id);

        if (delErr) {
          return new Response(
            JSON.stringify({ success: false, error: delErr.message || "Không thể xóa mục sản xuất." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, deletedId: id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Hành động không được hỗ trợ: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Đã xảy ra lỗi khi xử lý mục sản xuất.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
