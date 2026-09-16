// Supabase Edge Function: collect-youtube-data
// Bộ thu thập dữ liệu video đối thủ, lưu mốc lịch sử lượt xem và tính toán VPH đo được
// Sử dụng YouTube Data API v3 chính thống. Tối ưu quota: batch max 50 video IDs / call.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface CollectRequest {
  accessKey: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Tính toán Measured VPH thuần túy
 */
function calculateVph(
  currentViews: number,
  currentCheckedAt: Date,
  previousViews: number | null,
  previousCheckedAt: Date | null
): { viewDelta: number | null; elapsedSeconds: number | null; measuredVph: number | null } {
  if (previousViews === null || !previousCheckedAt) {
    return { viewDelta: null, elapsedSeconds: null, measuredVph: null };
  }

  const elapsedMs = currentCheckedAt.getTime() - previousCheckedAt.getTime();
  const elapsedSeconds = Math.round(elapsedMs / 1000);

  if (elapsedSeconds <= 0) {
    return { viewDelta: Math.max(0, currentViews - previousViews), elapsedSeconds: 0, measuredVph: null };
  }

  if (currentViews < previousViews) {
    return { viewDelta: 0, elapsedSeconds, measuredVph: 0 };
  }

  const delta = currentViews - previousViews;
  const elapsedHours = elapsedSeconds / 3600;
  const measuredVph = Math.round((delta / elapsedHours) * 100) / 100;

  return { viewDelta: delta, elapsedSeconds, measuredVph };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as CollectRequest;
    const { accessKey } = body;

    // 1. Xác thực Mã Truy Cập Quản Trị
    const configuredAccessKey = Deno.env.get("APP_WRITE_ACCESS_KEY");
    if (!configuredAccessKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Hệ thống máy chủ chưa cấu hình APP_WRITE_ACCESS_KEY.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!accessKey || accessKey.trim() !== configuredAccessKey.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Mã truy cập không chính xác. Thao tác bị từ chối.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Kiểm tra YouTube API Key (Server-side secret)
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Hệ thống máy chủ chưa cấu hình YOUTUBE_API_KEY. Vui lòng cài đặt secret trên Supabase.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Khởi tạo Supabase Server Client
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

    // 4. Tạo bản ghi scan_runs (trạng thái ban đầu: running)
    const runStartTime = new Date();
    const { data: runRecord, error: runErr } = await supabase
      .from("scan_runs")
      .insert({
        status: "running",
        started_at: runStartTime.toISOString(),
        trigger_source: "manual",
      })
      .select()
      .single();

    if (runErr || !runRecord) {
      return new Response(
        JSON.stringify({ success: false, error: `Không thể khởi tạo phiên kiểm tra: ${runErr?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const runId = runRecord.id;

    // 5. Đọc danh sách kênh đang theo dõi (CHỈ KÊNH ACTIVE)
    const { data: channels, error: chanErr } = await supabase
      .from("channels")
      .select("*")
      .eq("status", "active");

    if (chanErr) {
      await supabase
        .from("scan_runs")
        .update({ status: "failed", error_summary: `Lỗi đọc danh sách kênh: ${chanErr.message}`, finished_at: new Date().toISOString() })
        .eq("id", runId);

      return new Response(
        JSON.stringify({ success: false, error: "Không thể đọc danh sách kênh đối thủ." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!channels || channels.length === 0) {
      await supabase
        .from("scan_runs")
        .update({
          status: "success",
          channels_total: 0,
          channels_success: 0,
          channels_failed: 0,
          videos_found: 0,
          snapshots_created: 0,
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);

      return new Response(
        JSON.stringify({
          success: true,
          run: {
            id: runId,
            channelsTotal: 0,
            channelsSuccess: 0,
            channelsFailed: 0,
            videosFound: 0,
            snapshotsCreated: 0,
            status: "success",
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let channelsSuccess = 0;
    let channelsFailed = 0;
    const errors: string[] = [];

    interface VideoItemToFetch {
      channelDbId: string;
      youtubeVideoId: string;
      title: string;
      publishedAt: string;
      thumbnailUrl: string | null;
    }

    const allVideoItems: VideoItemToFetch[] = [];

    // 6. Xử lý từng kênh active để lấy playlist uploads và danh sách video mới nhất
    for (const ch of channels) {
      try {
        let uploadsPlaylistId = ch.uploads_playlist_id;

        // Nếu chưa có uploads_playlist_id trong database: gọi channels.list 1 lần duy nhất
        if (!uploadsPlaylistId) {
          const chRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(ch.youtube_channel_id)}&key=${youtubeApiKey}`
          );

          if (!chRes.ok) {
            const errJson = await chRes.json().catch(() => ({}));
            throw new Error(`channels.list HTTP ${chRes.status}: ${errJson.error?.message || chRes.statusText}`);
          }

          const chData = await chRes.json();
          if (!chData.items || chData.items.length === 0) {
            throw new Error(`Không tìm thấy kênh ${ch.youtube_channel_id} trên YouTube.`);
          }

          uploadsPlaylistId = chData.items[0]?.contentDetails?.relatedPlaylists?.uploads;
          if (!uploadsPlaylistId) {
            throw new Error(`Kênh ${ch.youtube_channel_id} không có playlist tải lên.`);
          }

          // Lưu lại vào DB để lần sau tái sử dụng (không gọi channels.list nữa)
          await supabase
            .from("channels")
            .update({ uploads_playlist_id: uploadsPlaylistId, youtube_checked_at: new Date().toISOString() })
            .eq("id", ch.id);
        }

        // Lấy tối đa scan_limit video mới nhất từ playlist uploads
        const scanLimit = Math.max(1, Math.min(50, Number(ch.scan_limit) || 15));
        const plRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=${scanLimit}&key=${youtubeApiKey}`
        );

        if (!plRes.ok) {
          const errJson = await plRes.json().catch(() => ({}));
          throw new Error(`playlistItems.list HTTP ${plRes.status}: ${errJson.error?.message || plRes.statusText}`);
        }

        const plData = await plRes.json();
        const items = plData.items || [];

        for (const item of items) {
          const vId = item.contentDetails?.videoId;
          if (vId) {
            const snippet = item.snippet || {};
            const thumbs = snippet.thumbnails || {};
            const thumbUrl = thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || null;

            allVideoItems.push({
              channelDbId: ch.id,
              youtubeVideoId: vId,
              title: snippet.title || "Không có tiêu đề",
              publishedAt: snippet.publishedAt || item.contentDetails?.videoPublishedAt || new Date().toISOString(),
              thumbnailUrl: thumbUrl,
            });
          }
        }

        channelsSuccess++;
        await supabase
          .from("channels")
          .update({ last_scan_at: new Date().toISOString() })
          .eq("id", ch.id);

      } catch (err: any) {
        channelsFailed++;
        const safeErrMsg = (err.message || String(err)).replace(youtubeApiKey, "REDACTED");
        errors.push(`Kênh ${ch.name || ch.youtube_channel_id}: ${safeErrMsg}`);
      }
    }

    // 7. Tối ưu Quota: Gom nhóm (batch) tối đa 50 video IDs mỗi request videos.list
    const videoStatsMap = new Map<string, { viewCount: number; duration: string | null }>();
    const chunkSize = 50;

    for (let i = 0; i < allVideoItems.length; i += chunkSize) {
      const chunk = allVideoItems.slice(i, i + chunkSize);
      const ids = chunk.map((v) => v.youtubeVideoId).join(",");

      try {
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${encodeURIComponent(ids)}&key=${youtubeApiKey}`
        );

        if (vRes.ok) {
          const vData = await vRes.json();
          for (const item of vData.items || []) {
            const views = Number(item.statistics?.viewCount) || 0;
            const duration = item.contentDetails?.duration || null;
            videoStatsMap.set(item.id, { viewCount: views, duration });
          }
        } else {
          const errJson = await vRes.json().catch(() => ({}));
          const safeMsg = (errJson.error?.message || vRes.statusText).replace(youtubeApiKey, "REDACTED");
          errors.push(`videos.list batch HTTP ${vRes.status}: ${safeMsg}`);
        }
      } catch (err: any) {
        const safeMsg = (err.message || String(err)).replace(youtubeApiKey, "REDACTED");
        errors.push(`videos.list error: ${safeMsg}`);
      }
    }

    // 8. Upsert Videos & Tạo Snapshots & Tính Measured VPH
    const checkTime = new Date();
    let snapshotsCreated = 0;

    for (const vItem of allVideoItems) {
      const stats = videoStatsMap.get(vItem.youtubeVideoId);
      if (!stats) continue; // Video bị xóa hoặc private

      const currentViews = stats.viewCount;

      // Kiểm tra video đã có trong database chưa
      const { data: existingVideo } = await supabase
        .from("videos")
        .select("id, latest_view_count, latest_measured_vph, first_seen_at")
        .eq("youtube_video_id", vItem.youtubeVideoId)
        .maybeSingle();

      let videoDbId: string;

      if (existingVideo) {
        videoDbId = existingVideo.id;
        // Cập nhật video hiện có (tránh duplicate)
        await supabase
          .from("videos")
          .update({
            title: vItem.title,
            thumbnail_url: vItem.thumbnailUrl,
            duration: stats.duration,
            last_seen_at: checkTime.toISOString(),
            latest_view_count: currentViews,
          })
          .eq("id", videoDbId);
      } else {
        // Thêm video mới
        const { data: insertedVideo, error: insErr } = await supabase
          .from("videos")
          .insert({
            youtube_video_id: vItem.youtubeVideoId,
            channel_id: vItem.channelDbId,
            title: vItem.title,
            url: `https://www.youtube.com/watch?v=${vItem.youtubeVideoId}`,
            thumbnail_url: vItem.thumbnailUrl,
            published_at: vItem.publishedAt,
            duration: stats.duration,
            first_seen_at: checkTime.toISOString(),
            last_seen_at: checkTime.toISOString(),
            latest_view_count: currentViews,
            latest_measured_vph: null,
          })
          .select()
          .single();

        if (insErr || !insertedVideo) continue;
        videoDbId = insertedVideo.id;
      }

      // Lấy snapshot gần nhất trước đó của video này để tính VPH đo được
      const { data: prevSnap } = await supabase
        .from("video_snapshots")
        .select("view_count, checked_at")
        .eq("video_id", videoDbId)
        .order("checked_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousViews = prevSnap ? Number(prevSnap.view_count) : null;
      const previousCheckedAt = prevSnap ? new Date(prevSnap.checked_at) : null;

      const vphResult = calculateVph(currentViews, checkTime, previousViews, previousCheckedAt);

      // Tạo snapshot mới
      const { error: snapErr } = await supabase
        .from("video_snapshots")
        .insert({
          video_id: videoDbId,
          view_count: currentViews,
          checked_at: checkTime.toISOString(),
          measured_vph: vphResult.measuredVph,
          view_delta: vphResult.viewDelta,
          elapsed_seconds: vphResult.elapsedSeconds,
        });

      if (!snapErr) {
        snapshotsCreated++;

        // Cập nhật latest_measured_vph trên bảng videos
        if (vphResult.measuredVph !== null) {
          await supabase
            .from("videos")
            .update({ latest_measured_vph: vphResult.measuredVph })
            .eq("id", videoDbId);
        }
      }
    }

    // 9. Cập nhật trạng thái hoàn thành của scan_runs
    const finalStatus = channelsFailed === 0 ? "success" : channelsSuccess > 0 ? "partial" : "failed";
    const errorSummary = errors.length > 0 ? errors.slice(0, 10).join("; ") : null;

    await supabase
      .from("scan_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: finalStatus,
        channels_total: channels.length,
        channels_success: channelsSuccess,
        channels_failed: channelsFailed,
        videos_found: allVideoItems.length,
        snapshots_created: snapshotsCreated,
        error_summary: errorSummary,
      })
      .eq("id", runId);

    // 10. Phản hồi hợp đồng chuẩn
    return new Response(
      JSON.stringify({
        success: true,
        run: {
          id: runId,
          channelsTotal: channels.length,
          channelsSuccess: channelsSuccess,
          channelsFailed: channelsFailed,
          videosFound: allVideoItems.length,
          snapshotsCreated: snapshotsCreated,
          status: finalStatus,
          errorSummary,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Lỗi máy chủ thu thập dữ liệu video.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
