// Supabase Edge Function: manage-production-items
// Production Workspace 2.0 — giữ nguyên contract cũ và bổ sung workspace/checklist/assets/notes/history.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface ManageProductionRequest {
  accessKey: string;
  action: string;
  payload?: any;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_STATUSES = [
  "idea", "research", "script", "thumbnail", "production", "editing", "published", "archived",
];
const ACTIVE_STATUSES = [
  "idea", "research", "script", "thumbnail", "production", "editing", "published",
];
const VALID_PRIORITIES = ["low", "normal", "high"];
const VALID_ASSET_TYPES = [
  "reference", "thumbnail", "script", "voice", "footage", "project", "drive", "youtube", "other",
];
const VALID_NOTE_CATEGORIES = [
  "general", "research", "script", "thumbnail", "production", "editing", "seo",
];

const ITEM_SELECT =
  "*, production_tasks(is_completed), videos(id, title, youtube_video_id, url, thumbnail_url, channels(name, handle, avatar_url))";

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function parseOptionalDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === "") return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) throw new Error("Ngày/giờ không hợp lệ.");
  return parsed.toISOString();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as ManageProductionRequest;
    const { accessKey, action, payload } = body || {};

    const configuredKey = Deno.env.get("APP_WRITE_ACCESS_KEY");
    if (!configuredKey) {
      return json({
        success: false,
        error: "Hệ thống máy chủ chưa cấu hình APP_WRITE_ACCESS_KEY. Vui lòng liên hệ quản trị viên.",
      }, 500);
    }
    if (!accessKey || accessKey.trim() !== configuredKey.trim()) {
      return json({ success: false, error: "Mã truy cập không chính xác. Thao tác bị từ chối." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    let secretKey: string | null = null;
    try {
      const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
      secretKey = secretKeys["default"] || null;
    } catch {
      secretKey = null;
    }
    if (!secretKey) secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || null;

    if (!supabaseUrl || !secretKey) {
      return json({ success: false, error: "Thiếu cấu hình SUPABASE_URL hoặc Secret Key trên máy chủ." }, 500);
    }

    const supabase = createClient(supabaseUrl, secretKey);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUuid = (value: unknown) => typeof value === "string" && uuidRegex.test(value);

    const logActivity = async (
      productionItemId: string,
      eventType: string,
      message: string,
      extras: Record<string, any> = {}
    ) => {
      const { error } = await supabase.from("production_activity").insert({
        production_item_id: productionItemId,
        event_type: eventType,
        message,
        stage_from: extras.stageFrom ?? null,
        stage_to: extras.stageTo ?? null,
        metadata: extras.metadata ?? {},
      });
      if (error) console.error("Không thể ghi production_activity:", error.message);
    };

    const getItem = async (id: string) => {
      const { data, error } = await supabase
        .from("production_items")
        .select("id, status, priority, working_title, notes, published_url, published_at, started_at, due_at, assignee_label, template_key")
        .eq("id", id)
        .single();
      if (error || !data) return null;
      return data;
    };

    switch (action) {
      case "create": {
        const { sourceVideoId, workingTitle, notes, priority } = payload || {};
        if (!validUuid(sourceVideoId)) return json({ success: false, error: "Mã định danh video nguồn không hợp lệ." }, 400);

        const { data: video, error: vErr } = await supabase
          .from("videos").select("id, title").eq("id", sourceVideoId).single();
        if (vErr || !video) return json({ success: false, error: "Không tìm thấy video nguồn trong hệ thống." }, 404);

        const { data: existing } = await supabase
          .from("production_items").select("id").eq("source_video_id", sourceVideoId).maybeSingle();
        if (existing) return json({ success: false, error: "Video này đã có trong Tiến Độ Sản Xuất." }, 409);

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
          .select(ITEM_SELECT)
          .single();

        if (insErr || !newItem) return json({ success: false, error: insErr?.message || "Không thể tạo mục sản xuất." }, 500);
        await logActivity(newItem.id, "created", "Đã tạo hồ sơ sản xuất.");
        return json({ success: true, item: newItem }, 201);
      }

      case "update": {
        const { id, workingTitle, notes, priority, publishedUrl } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã mục sản xuất không hợp lệ." }, 400);

        const updates: any = { updated_at: new Date().toISOString() };
        if (workingTitle !== undefined) updates.working_title = workingTitle ? String(workingTitle).trim().slice(0, 200) : null;
        if (notes !== undefined) updates.notes = notes ? String(notes).trim().slice(0, 5000) : null;
        if (priority !== undefined) {
          if (!VALID_PRIORITIES.includes(priority)) return json({ success: false, error: "Mức ưu tiên không hợp lệ (chỉ chấp nhận: low, normal, high)." }, 400);
          updates.priority = priority;
        }
        if (publishedUrl !== undefined) {
          const urlStr = publishedUrl ? String(publishedUrl).trim() : "";
          if (urlStr && !isHttpUrl(urlStr)) return json({ success: false, error: "URL xuất bản phải bắt đầu bằng http:// hoặc https://" }, 400);
          updates.published_url = urlStr || null;
        }

        const { data: updatedItem, error: updErr } = await supabase
          .from("production_items").update(updates).eq("id", id).select(ITEM_SELECT).single();
        if (updErr || !updatedItem) return json({ success: false, error: updErr?.message || "Không thể cập nhật mục sản xuất." }, 500);
        await logActivity(id, "updated", "Đã cập nhật thông tin hồ sơ.");
        return json({ success: true, item: updatedItem });
      }

      case "update_workspace": {
        const {
          id, workingTitle, notes, priority, publishedUrl, status,
          dueAt, startedAt, assigneeLabel, templateKey,
        } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã mục sản xuất không hợp lệ." }, 400);

        const current = await getItem(id);
        if (!current) return json({ success: false, error: "Không tìm thấy mục sản xuất." }, 404);

        const updates: any = { updated_at: new Date().toISOString() };

        if (workingTitle !== undefined) {
          const val = String(workingTitle || "").trim();
          if (val.length > 200) return json({ success: false, error: "Tiêu đề đang làm không được vượt quá 200 ký tự." }, 400);
          updates.working_title = val || null;
        }
        if (notes !== undefined) {
          const val = String(notes || "").trim();
          if (val.length > 5000) return json({ success: false, error: "Ghi chú không được vượt quá 5000 ký tự." }, 400);
          updates.notes = val || null;
        }
        if (priority !== undefined) {
          if (!VALID_PRIORITIES.includes(priority)) return json({ success: false, error: "Mức ưu tiên không hợp lệ." }, 400);
          updates.priority = priority;
        }
        if (publishedUrl !== undefined) {
          const val = String(publishedUrl || "").trim();
          if (val && !isHttpUrl(val)) return json({ success: false, error: "URL xuất bản phải bắt đầu bằng http:// hoặc https://" }, 400);
          updates.published_url = val || null;
        }
        if (status !== undefined) {
          if (!VALID_STATUSES.includes(status)) return json({ success: false, error: `Trạng thái không hợp lệ: ${status}` }, 400);
          updates.status = status;
          if (status === "published" && !current.published_at) updates.published_at = new Date().toISOString();
          if (status !== "idea" && status !== "archived" && !current.started_at) updates.started_at = new Date().toISOString();
        }

        try {
          const parsedDue = parseOptionalDate(dueAt);
          if (parsedDue !== undefined) updates.due_at = parsedDue;
          const parsedStarted = parseOptionalDate(startedAt);
          if (parsedStarted !== undefined) updates.started_at = parsedStarted;
        } catch (err: any) {
          return json({ success: false, error: err.message }, 400);
        }

        if (assigneeLabel !== undefined) {
          const val = String(assigneeLabel || "").trim();
          if (val.length > 100) return json({ success: false, error: "Tên người phụ trách không được vượt quá 100 ký tự." }, 400);
          updates.assignee_label = val || null;
        }

        if (templateKey !== undefined) {
          const val = String(templateKey || "").trim();
          if (val.length > 80) return json({ success: false, error: "Mã template không hợp lệ." }, 400);
          updates.template_key = val || null;
        }

        const { data: updatedItem, error } = await supabase
          .from("production_items").update(updates).eq("id", id).select(ITEM_SELECT).single();
        if (error || !updatedItem) return json({ success: false, error: error?.message || "Không thể lưu hồ sơ sản xuất." }, 500);

        if (status !== undefined && status !== current.status) {
          await logActivity(id, "status_changed", `Chuyển giai đoạn từ ${current.status} sang ${status}.`, {
            stageFrom: current.status,
            stageTo: status,
          });
        } else {
          await logActivity(id, "workspace_updated", "Đã lưu thay đổi hồ sơ sản xuất.");
        }
        return json({ success: true, item: updatedItem });
      }

      case "change_status": {
        const { id, status } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã mục sản xuất không hợp lệ." }, 400);
        if (!VALID_STATUSES.includes(status)) return json({ success: false, error: `Trạng thái không hợp lệ: ${status}` }, 400);

        const current = await getItem(id);
        if (!current) return json({ success: false, error: "Không tìm thấy mục sản xuất." }, 404);

        const updates: any = { status, updated_at: new Date().toISOString() };
        if (status === "published" && !current.published_at) updates.published_at = new Date().toISOString();
        if (status !== "idea" && status !== "archived" && !current.started_at) updates.started_at = new Date().toISOString();

        const { data: updatedItem, error: statusErr } = await supabase
          .from("production_items").update(updates).eq("id", id).select(ITEM_SELECT).single();
        if (statusErr || !updatedItem) return json({ success: false, error: statusErr?.message || "Không thể đổi trạng thái mục sản xuất." }, 500);

        if (status !== current.status) {
          await logActivity(id, "status_changed", `Chuyển giai đoạn từ ${current.status} sang ${status}.`, {
            stageFrom: current.status,
            stageTo: status,
          });
        }
        return json({ success: true, item: updatedItem });
      }

      case "archive": {
        const { id } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã mục sản xuất không hợp lệ." }, 400);
        const current = await getItem(id);
        const { data: archivedItem, error: arcErr } = await supabase
          .from("production_items")
          .update({ status: "archived", updated_at: new Date().toISOString() })
          .eq("id", id).select(ITEM_SELECT).single();
        if (arcErr || !archivedItem) return json({ success: false, error: arcErr?.message || "Không thể lưu trữ mục sản xuất." }, 500);
        await logActivity(id, "archived", "Đã lưu trữ hồ sơ.", { stageFrom: current?.status, stageTo: "archived" });
        return json({ success: true, item: archivedItem });
      }

      case "restore": {
        const { id } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã mục sản xuất không hợp lệ." }, 400);
        const { data: restoredItem, error: resErr } = await supabase
          .from("production_items")
          .update({ status: "idea", updated_at: new Date().toISOString() })
          .eq("id", id).select(ITEM_SELECT).single();
        if (resErr || !restoredItem) return json({ success: false, error: resErr?.message || "Không thể khôi phục mục sản xuất." }, 500);
        await logActivity(id, "restored", "Đã khôi phục hồ sơ về Ý tưởng.", { stageTo: "idea" });
        return json({ success: true, item: restoredItem });
      }

      case "delete": {
        const { id } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã mục sản xuất không hợp lệ." }, 400);
        const { error: delErr } = await supabase.from("production_items").delete().eq("id", id);
        if (delErr) return json({ success: false, error: delErr.message || "Không thể xóa mục sản xuất." }, 500);
        return json({ success: true, deletedId: id });
      }

      case "create_task": {
        const { productionItemId, stage, title, sortOrder } = payload || {};
        if (!validUuid(productionItemId)) return json({ success: false, error: "Mã hồ sơ sản xuất không hợp lệ." }, 400);
        if (!ACTIVE_STATUSES.includes(stage)) return json({ success: false, error: "Giai đoạn checklist không hợp lệ." }, 400);
        const cleanTitle = String(title || "").trim();
        if (!cleanTitle || cleanTitle.length > 240) return json({ success: false, error: "Tên checklist phải có từ 1 đến 240 ký tự." }, 400);

        const { data: task, error } = await supabase.from("production_tasks").insert({
          production_item_id: productionItemId,
          stage,
          title: cleanTitle,
          sort_order: Number.isInteger(sortOrder) ? sortOrder : 0,
        }).select("*").single();
        if (error || !task) return json({ success: false, error: error?.message || "Không thể thêm checklist." }, 500);
        await logActivity(productionItemId, "task_created", `Đã thêm checklist: ${cleanTitle}`, { stageTo: stage });
        return json({ success: true, task }, 201);
      }

      case "update_task": {
        const { id, title, stage, isCompleted, sortOrder } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã checklist không hợp lệ." }, 400);
        const { data: current, error: curErr } = await supabase
          .from("production_tasks").select("*").eq("id", id).single();
        if (curErr || !current) return json({ success: false, error: "Không tìm thấy checklist." }, 404);

        const updates: any = {};
        if (title !== undefined) {
          const val = String(title || "").trim();
          if (!val || val.length > 240) return json({ success: false, error: "Tên checklist phải có từ 1 đến 240 ký tự." }, 400);
          updates.title = val;
        }
        if (stage !== undefined) {
          if (!ACTIVE_STATUSES.includes(stage)) return json({ success: false, error: "Giai đoạn checklist không hợp lệ." }, 400);
          updates.stage = stage;
        }
        if (sortOrder !== undefined) updates.sort_order = Number(sortOrder) || 0;
        if (isCompleted !== undefined) {
          updates.is_completed = !!isCompleted;
          updates.completed_at = isCompleted ? new Date().toISOString() : null;
        }

        const { data: task, error } = await supabase.from("production_tasks")
          .update(updates).eq("id", id).select("*").single();
        if (error || !task) return json({ success: false, error: error?.message || "Không thể cập nhật checklist." }, 500);
        if (isCompleted !== undefined && !!isCompleted !== !!current.is_completed) {
          await logActivity(current.production_item_id, "task_toggled",
            `${isCompleted ? "Hoàn thành" : "Mở lại"} checklist: ${task.title}`,
            { stageTo: task.stage, metadata: { taskId: task.id, completed: !!isCompleted } });
        }
        return json({ success: true, task });
      }

      case "delete_task": {
        const { id } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã checklist không hợp lệ." }, 400);
        const { data: task } = await supabase.from("production_tasks").select("*").eq("id", id).single();
        if (!task) return json({ success: false, error: "Không tìm thấy checklist." }, 404);
        const { error } = await supabase.from("production_tasks").delete().eq("id", id);
        if (error) return json({ success: false, error: error.message || "Không thể xóa checklist." }, 500);
        await logActivity(task.production_item_id, "task_deleted", `Đã xóa checklist: ${task.title}`, { stageFrom: task.stage });
        return json({ success: true, deletedId: id });
      }

      case "apply_template": {
        const { productionItemId, templateKey } = payload || {};
        if (!validUuid(productionItemId)) return json({ success: false, error: "Mã hồ sơ sản xuất không hợp lệ." }, 400);
        const cleanKey = String(templateKey || "").trim();
        if (!cleanKey) return json({ success: false, error: "Chưa chọn template." }, 400);

        const { data: template, error: tErr } = await supabase
          .from("production_templates").select("*").eq("template_key", cleanKey).single();
        if (tErr || !template) return json({ success: false, error: "Không tìm thấy template." }, 404);

        const { data: existing } = await supabase
          .from("production_tasks").select("stage,title").eq("production_item_id", productionItemId);
        const existingKeys = new Set((existing || []).map((t: any) => `${t.stage}::${String(t.title).toLowerCase()}`));

        const checklist = Array.isArray(template.checklist) ? template.checklist : [];
        const rows = checklist
          .filter((entry: any) => ACTIVE_STATUSES.includes(entry?.stage) && String(entry?.title || "").trim())
          .filter((entry: any) => !existingKeys.has(`${entry.stage}::${String(entry.title).trim().toLowerCase()}`))
          .map((entry: any) => ({
            production_item_id: productionItemId,
            stage: entry.stage,
            title: String(entry.title).trim().slice(0, 240),
            sort_order: Number(entry.sortOrder) || 0,
          }));

        if (rows.length > 0) {
          const { error: insErr } = await supabase.from("production_tasks").insert(rows);
          if (insErr) return json({ success: false, error: insErr.message || "Không thể áp dụng template." }, 500);
        }

        const { error: itemErr } = await supabase.from("production_items")
          .update({ template_key: cleanKey, updated_at: new Date().toISOString() }).eq("id", productionItemId);
        if (itemErr) return json({ success: false, error: itemErr.message || "Không thể lưu template cho hồ sơ." }, 500);

        await logActivity(productionItemId, "template_applied",
          `Đã áp dụng template ${template.name} (${rows.length} checklist mới).`,
          { metadata: { templateKey: cleanKey, insertedTasks: rows.length } });
        return json({ success: true, insertedTasks: rows.length });
      }

      case "create_asset": {
        const { productionItemId, assetType, label, url, notes } = payload || {};
        if (!validUuid(productionItemId)) return json({ success: false, error: "Mã hồ sơ sản xuất không hợp lệ." }, 400);
        if (!VALID_ASSET_TYPES.includes(assetType)) return json({ success: false, error: "Loại tài sản không hợp lệ." }, 400);
        const cleanLabel = String(label || "").trim();
        const cleanUrl = String(url || "").trim();
        if (!cleanLabel || cleanLabel.length > 160) return json({ success: false, error: "Tên tài sản phải có từ 1 đến 160 ký tự." }, 400);
        if (!cleanUrl || !isHttpUrl(cleanUrl)) return json({ success: false, error: "URL tài sản phải bắt đầu bằng http:// hoặc https://" }, 400);
        const cleanNotes = String(notes || "").trim().slice(0, 1000) || null;

        const { data: asset, error } = await supabase.from("production_assets").insert({
          production_item_id: productionItemId,
          asset_type: assetType,
          label: cleanLabel,
          url: cleanUrl,
          notes: cleanNotes,
        }).select("*").single();
        if (error || !asset) return json({ success: false, error: error?.message || "Không thể thêm tài sản." }, 500);
        await logActivity(productionItemId, "asset_added", `Đã thêm tài sản: ${cleanLabel}`, { metadata: { assetId: asset.id, assetType } });
        return json({ success: true, asset }, 201);
      }

      case "delete_asset": {
        const { id } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã tài sản không hợp lệ." }, 400);
        const { data: asset } = await supabase.from("production_assets").select("*").eq("id", id).single();
        if (!asset) return json({ success: false, error: "Không tìm thấy tài sản." }, 404);
        const { error } = await supabase.from("production_assets").delete().eq("id", id);
        if (error) return json({ success: false, error: error.message || "Không thể xóa tài sản." }, 500);
        await logActivity(asset.production_item_id, "asset_deleted", `Đã xóa tài sản: ${asset.label}`, { metadata: { assetId: id } });
        return json({ success: true, deletedId: id });
      }

      case "create_note": {
        const { productionItemId, stage, category, body: noteBody, isPinned } = payload || {};
        if (!validUuid(productionItemId)) return json({ success: false, error: "Mã hồ sơ sản xuất không hợp lệ." }, 400);
        if (stage !== undefined && stage !== null && !ACTIVE_STATUSES.includes(stage)) return json({ success: false, error: "Giai đoạn ghi chú không hợp lệ." }, 400);
        const validCategory = category || "general";
        if (!VALID_NOTE_CATEGORIES.includes(validCategory)) return json({ success: false, error: "Loại ghi chú không hợp lệ." }, 400);
        const cleanBody = String(noteBody || "").trim();
        if (!cleanBody || cleanBody.length > 5000) return json({ success: false, error: "Ghi chú phải có từ 1 đến 5000 ký tự." }, 400);

        const { data: note, error } = await supabase.from("production_notes").insert({
          production_item_id: productionItemId,
          stage: stage || null,
          category: validCategory,
          body: cleanBody,
          is_pinned: !!isPinned,
        }).select("*").single();
        if (error || !note) return json({ success: false, error: error?.message || "Không thể thêm ghi chú." }, 500);
        await logActivity(productionItemId, "note_added", "Đã thêm ghi chú mới.", { stageTo: stage || null, metadata: { noteId: note.id, category: validCategory } });
        return json({ success: true, note }, 201);
      }

      case "update_note": {
        const { id, stage, category, body: noteBody, isPinned } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã ghi chú không hợp lệ." }, 400);
        const { data: current } = await supabase.from("production_notes").select("*").eq("id", id).single();
        if (!current) return json({ success: false, error: "Không tìm thấy ghi chú." }, 404);

        const updates: any = {};
        if (stage !== undefined) {
          if (stage !== null && !ACTIVE_STATUSES.includes(stage)) return json({ success: false, error: "Giai đoạn ghi chú không hợp lệ." }, 400);
          updates.stage = stage;
        }
        if (category !== undefined) {
          if (!VALID_NOTE_CATEGORIES.includes(category)) return json({ success: false, error: "Loại ghi chú không hợp lệ." }, 400);
          updates.category = category;
        }
        if (noteBody !== undefined) {
          const val = String(noteBody || "").trim();
          if (!val || val.length > 5000) return json({ success: false, error: "Ghi chú phải có từ 1 đến 5000 ký tự." }, 400);
          updates.body = val;
        }
        if (isPinned !== undefined) updates.is_pinned = !!isPinned;

        const { data: note, error } = await supabase.from("production_notes")
          .update(updates).eq("id", id).select("*").single();
        if (error || !note) return json({ success: false, error: error?.message || "Không thể cập nhật ghi chú." }, 500);
        await logActivity(current.production_item_id, "note_updated", "Đã cập nhật ghi chú.", { metadata: { noteId: id } });
        return json({ success: true, note });
      }

      case "delete_note": {
        const { id } = payload || {};
        if (!validUuid(id)) return json({ success: false, error: "Mã ghi chú không hợp lệ." }, 400);
        const { data: note } = await supabase.from("production_notes").select("*").eq("id", id).single();
        if (!note) return json({ success: false, error: "Không tìm thấy ghi chú." }, 404);
        const { error } = await supabase.from("production_notes").delete().eq("id", id);
        if (error) return json({ success: false, error: error.message || "Không thể xóa ghi chú." }, 500);
        await logActivity(note.production_item_id, "note_deleted", "Đã xóa ghi chú.", { metadata: { noteId: id } });
        return json({ success: true, deletedId: id });
      }

      default:
        return json({ success: false, error: `Hành động không được hỗ trợ: ${action}` }, 400);
    }
  } catch (err: any) {
    return json({ success: false, error: err.message || "Đã xảy ra lỗi khi xử lý mục sản xuất." }, 500);
  }
});
