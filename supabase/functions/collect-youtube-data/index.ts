// Supabase Edge Function: collect-youtube-data
// Bộ thu thập dữ liệu video đối thủ, lưu mốc lịch sử lượt xem và tính toán VPH đo được
// Hỗ trợ triggerSource: 'manual' | 'schedule'. Chống chạy chồng & phục hồi phiên treo (stale run).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface CollectRequest {
  accessKey: string;
  triggerSource?: 'manual' | 'schedule';
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
    const triggerSource: 'manual' | 'schedule' = body.triggerSource === 'schedule' ? 'schedule' : 'manual';

    // 1. Xác thực Mã Truy Cập Quản Trị (Áp dụng bắt buộc cho cả manual lẫn schedule)
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

    // 4. Kiểm tra chống chạy chồng (Concurrency & Stale Run Protection)
    const nowUtc = new Date();
    const staleThresholdMs = 30 * 60 * 1000; // 30 phút

    const { data: runningRuns } = await supabase
      .from("scan_runs")
      .select("id, started_at")
      .eq("status", "running")
      .order("started_at", { ascending: false });

    if (runningRuns && runningRuns.length > 0) {
      let hasActiveRunning = false;

      for (const r of runningRuns) {
        const started = new Date(r.started_at);
        const elapsed = nowUtc.getTime() - started.getTime();

        if (elapsed > staleThresholdMs) {
          // Stale run: Treo quá 30 phút -> Đánh dấu failed để phục hồi
          await supabase
            .from("scan_runs")
            .update({
              status: "failed",
              finished_at: nowUtc.toISOString(),
              error_summary: "Phiên kiểm tra trước bị treo quá thời gian cho phép.",
            })
            .eq("id", r.id);
        } else {
          hasActiveRunning = true;
        }
      }

      // Nếu vẫn còn run đang chạy chưa quá 30 phút -> Bỏ qua (Skipped)
      if (hasActiveRunning) {
        return new Response(
          JSON.stringify({
            success: true,
            skipped: true,
            reason: "Đang có phiên kiểm tra khác hoạt động.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 5. Tạo bản ghi scan_runs (trạng thái ban đầu: running)
    const runStartTime = new Date();
    const { data: runRecord, error: runErr } = await supabase
      .from("scan_runs")
      .insert({
        status: "running",
        started_at: runStartTime.toISOString(),
        trigger_source: triggerSource,
      })
      .select()
      .single();

    if (runErr || !runRecord) {
      // Chặn chạy chồng nếu vi phạm unique constraint
      if (runErr?.message?.includes("running") || runErr?.code === "23505") {
        return new Response(
          JSON.stringify({
            success: true,
            skipped: true,
            reason: "Đang có phiên kiểm tra khác hoạt động.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: `Không thể khởi tạo phiên kiểm tra: ${runErr?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const runId = runRecord.id;

    // Khởi tạo các biến theo dõi kết quả
    let channelsTotal = 0;
    let channelsSuccess = 0;
    let channelsFailed = 0;
    let videosFound = 0;
    let snapshotsCreated = 0;
    let finalStatus: 'success' | 'partial' | 'failed' = 'failed';
    let finalErrorSummary: string | null = null;
    const errors: string[] = [];

    try {
      // 6. Đọc danh sách kênh đang theo dõi (CHỈ KÊNH ACTIVE)
      const { data: channels, error: chanErr } = await supabase
        .from("channels")
        .select("*")
        .eq("status", "active");

      if (chanErr) {
        throw new Error(`Lỗi đọc danh sách kênh: ${chanErr.message}`);
      }

      channelsTotal = channels ? channels.length : 0;

      if (!channels || channels.length === 0) {
        finalStatus = "success";
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
              triggerSource,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      interface VideoItemToFetch {
        channelDbId: string;
        youtubeVideoId: string;
        title: string;
        publishedAt: string;
        thumbnailUrl: string | null;
      }

      const allVideoItems: VideoItemToFetch[] = [];

      // 7. Xử lý từng kênh active để lấy playlist uploads và danh sách video mới nhất
      for (const ch of channels) {
        try {
          let uploadsPlaylistId = ch.uploads_playlist_id;

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

            await supabase
              .from("channels")
              .update({ uploads_playlist_id: uploadsPlaylistId, youtube_checked_at: new Date().toISOString() })
              .eq("id", ch.id);
          }

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

      videosFound = allVideoItems.length;

      // 8. Tối ưu Quota: Gom nhóm (batch) tối đa 50 video IDs mỗi request videos.list
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

      // 9. Upsert Videos & Tạo Snapshots & Tính Measured VPH
      const checkTime = new Date();

      for (const vItem of allVideoItems) {
        const stats = videoStatsMap.get(vItem.youtubeVideoId);
        if (!stats) continue;

        const currentViews = stats.viewCount;

        const { data: existingVideo } = await supabase
          .from("videos")
          .select("id, latest_view_count, latest_measured_vph, first_seen_at")
          .eq("youtube_video_id", vItem.youtubeVideoId)
          .maybeSingle();

        let videoDbId: string;

        if (existingVideo) {
          videoDbId = existingVideo.id;
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

          if (vphResult.measuredVph !== null) {
            await supabase
              .from("videos")
              .update({ latest_measured_vph: vphResult.measuredVph })
              .eq("id", videoDbId);
          }
        }
      }

      finalStatus = channelsFailed === 0 ? "success" : channelsSuccess > 0 ? "partial" : "failed";
      finalErrorSummary = errors.length > 0 ? errors.slice(0, 10).join("; ") : null;

      return new Response(
        JSON.stringify({
          success: true,
          run: {
            id: runId,
            channelsTotal,
            channelsSuccess,
            channelsFailed,
            videosFound,
            snapshotsCreated,
            status: finalStatus,
            triggerSource,
            errorSummary: finalErrorSummary,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (runException: any) {
      finalStatus = "failed";
      finalErrorSummary = (runException.message || String(runException)).replace(youtubeApiKey, "REDACTED");
      return new Response(
        JSON.stringify({ success: false, error: finalErrorSummary }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      // LUÔN LUÔN CẬP NHẬT TRẠNG THÁI KẾT THÚC CHO SCAN_RUNS (Không bao giờ bỏ quên running)
      await supabase
        .from("scan_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: finalStatus,
          channels_total: channelsTotal,
          channels_success: channelsSuccess,
          channels_failed: channelsFailed,
          videos_found: videosFound,
          snapshots_created: snapshotsCreated,
          error_summary: finalErrorSummary,
        })
        .eq("id", runId);
    }

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
