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

/**
 * Định dạng số nguyên sang chuẩn Việt Nam (ngăn cách hàng nghìn bằng dấu chấm)
 */
function formatViNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Định dạng số giây sang phút/giờ dễ đọc
 */
function formatDurationVi(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "0 giây";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = (minutes / 60).toFixed(1);
  return `${hours} giờ (${minutes} phút)`;
}

/**
 * Định dạng ngày giờ xuất bản sang Tiếng Việt
 */
function formatDateTimeVi(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Tạo Discord Embed Object chuẩn theo quy định Giai đoạn 2C (Không @everyone, không @here)
 */
function buildDiscordEmbed(input: {
  channelName: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  publishedAt: string;
  measuredVph: number;
  currentViews: number;
  viewDelta?: number | null;
  elapsedSeconds?: number | null;
  thresholdVph: number;
}) {
  const deltaStr = input.viewDelta !== null && input.viewDelta !== undefined
    ? `+${formatViNumber(input.viewDelta)}`
    : "Không rõ";

  const embed: Record<string, unknown> = {
    title: "🚨 Video đang tăng nhanh",
    url: input.videoUrl,
    color: 0xff3366,
    fields: [
      { name: "Kênh", value: input.channelName, inline: true },
      { name: "VPH đo được", value: `**${formatViNumber(input.measuredVph)}** lượt xem/giờ`, inline: true },
      { name: "Ngưỡng cảnh báo", value: `${formatViNumber(input.thresholdVph)} VPH`, inline: true },
      { name: "Video", value: `[${input.videoTitle}](${input.videoUrl})` },
      { name: "Lượt xem hiện tại", value: formatViNumber(input.currentViews), inline: true },
      { name: "Tăng từ lần trước", value: deltaStr, inline: true },
      { name: "Khoảng thời gian đo", value: formatDurationVi(input.elapsedSeconds), inline: true },
      { name: "Xuất bản", value: formatDateTimeVi(input.publishedAt), inline: true },
    ],
    footer: {
      text: "Bắt Bài Đối Thủ • Dữ liệu đo thực tế",
    },
    timestamp: new Date().toISOString(),
  };

  if (input.thumbnailUrl) {
    embed.thumbnail = { url: input.thumbnailUrl };
  }

  return {
    embeds: [embed],
  };
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
    let alertCandidates = 0;
    let alertsSent = 0;
    let alertsFailed = 0;
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
      const channelThresholdMap = new Map<string, number>();
      if (channels) {
        for (const ch of channels) {
          const thresh = Number(ch.alert_vph_threshold);
          channelThresholdMap.set(ch.id, isNaN(thresh) || thresh <= 0 ? 5000 : thresh);
        }
      }

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
              alertCandidates: 0,
              alertsSent: 0,
              alertsFailed: 0,
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

      // Batch existing videos lookup (Chunk <= 200 để tránh URL quá dài)
      const uniqueYtIds = Array.from(new Set(allVideoItems.map((v) => v.youtubeVideoId)));
      const existingVideosMap = new Map<
        string,
        {
          id: string;
          youtube_video_id: string;
          channel_id: string;
          latest_view_count: number | null;
          latest_measured_vph: number | null;
          latest_view_delta: number | null;
          latest_snapshot_checked_at: string | null;
          first_snapshot_checked_at: string | null;
          first_seen_at: string;
        }
      >();

      const lookupChunkSize = 200;
      for (let i = 0; i < uniqueYtIds.length; i += lookupChunkSize) {
        const chunk = uniqueYtIds.slice(i, i + lookupChunkSize);
        const { data: batchVideos, error: batchErr } = await supabase
          .from("videos")
          .select(
            "id, youtube_video_id, channel_id, latest_view_count, latest_measured_vph, latest_view_delta, latest_snapshot_checked_at, first_snapshot_checked_at, first_seen_at"
          )
          .in("youtube_video_id", chunk);

        if (!batchErr && batchVideos) {
          for (const bv of batchVideos) {
            existingVideosMap.set(bv.youtube_video_id, bv);
          }
        }
      }

      for (const vItem of allVideoItems) {
        const stats = videoStatsMap.get(vItem.youtubeVideoId);
        if (!stats) continue;

        const currentViews = stats.viewCount;
        const existingVideo = existingVideosMap.get(vItem.youtubeVideoId);

        let videoDbId: string;
        let previousViews: number | null = null;
        let previousCheckedAt: Date | null = null;

        if (existingVideo) {
          videoDbId = existingVideo.id;
          // QUAN TRỌNG: Chỉ coi là quan sát tiếp theo khi có latest_snapshot_checked_at.
          // Nếu latest_snapshot_checked_at là null -> coi là First Observation (VPH = null).
          if (existingVideo.latest_snapshot_checked_at) {
            previousCheckedAt = new Date(existingVideo.latest_snapshot_checked_at);
            previousViews =
              existingVideo.latest_view_count !== null && existingVideo.latest_view_count !== undefined
                ? Number(existingVideo.latest_view_count)
                : null;
          }
        } else {
          // Thêm video mới vào cơ sở dữ liệu
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
              latest_view_delta: null,
              latest_snapshot_checked_at: null,
              first_snapshot_checked_at: null,
            })
            .select(
              "id, youtube_video_id, channel_id, latest_view_count, latest_measured_vph, latest_view_delta, latest_snapshot_checked_at, first_snapshot_checked_at, first_seen_at"
            )
            .single();

          if (insErr || !insertedVideo) continue;
          videoDbId = insertedVideo.id;
          existingVideosMap.set(vItem.youtubeVideoId, insertedVideo);
        }

        // Tính toán VPH đo được (First observation -> measuredVph = null)
        const vphResult = calculateVph(currentViews, checkTime, previousViews, previousCheckedAt);

        // 1. Thao tác INSERT snapshot trước
        const { data: insertedSnap, error: snapErr } = await supabase
          .from("video_snapshots")
          .insert({
            video_id: videoDbId,
            view_count: currentViews,
            checked_at: checkTime.toISOString(),
            measured_vph: vphResult.measuredVph,
            view_delta: vphResult.viewDelta,
            elapsed_seconds: vphResult.elapsedSeconds,
          })
          .select("id")
          .maybeSingle();

        // 2. CHỈ KHI snapshot insert THÀNH CÔNG mới cập nhật cache measurement trên videos
        if (!snapErr) {
          snapshotsCreated++;

          const videoUpdatePayload: Record<string, any> = {
            title: vItem.title,
            thumbnail_url: vItem.thumbnailUrl,
            duration: stats.duration,
            last_seen_at: checkTime.toISOString(),
            latest_view_count: currentViews,
            latest_measured_vph: vphResult.measuredVph,
            latest_view_delta: vphResult.viewDelta,
            latest_snapshot_checked_at: checkTime.toISOString(),
          };

          if (!existingVideo?.first_snapshot_checked_at) {
            videoUpdatePayload.first_snapshot_checked_at = checkTime.toISOString();
          }

          await supabase
            .from("videos")
            .update(videoUpdatePayload)
            .eq("id", videoDbId);

          // Cập nhật map để giữ state nhất quán
          const cur = existingVideosMap.get(vItem.youtubeVideoId);
          if (cur) {
            cur.latest_view_count = currentViews;
            cur.latest_measured_vph = vphResult.measuredVph;
            cur.latest_view_delta = vphResult.viewDelta;
            cur.latest_snapshot_checked_at = checkTime.toISOString();
            if (!cur.first_snapshot_checked_at) {
              cur.first_snapshot_checked_at = checkTime.toISOString();
            }
          }

          if (vphResult.measuredVph !== null) {
            const channelThreshold = channelThresholdMap.get(vItem.channelDbId) ?? 5000;
            if (vphResult.measuredVph >= channelThreshold) {
              alertCandidates++;

              // Đăng ký ứng viên cảnh báo vào hàng đợi.
              // UNIQUE(video_id) bảo đảm mỗi video chỉ được cảnh báo một lần duy nhất trong toàn bộ vòng đời.
              await supabase
                .from("video_alerts")
                .upsert(
                  {
                    video_id: videoDbId,
                    snapshot_id: insertedSnap?.id || null,
                    threshold_vph: channelThreshold,
                    measured_vph: vphResult.measuredVph,
                    view_count: currentViews,
                    view_delta: vphResult.viewDelta,
                    elapsed_seconds: vphResult.elapsedSeconds,
                    status: "pending",
                  },
                  { onConflict: "video_id", ignoreDuplicates: true }
                );
            }
          }
        }
      }

      // 10. Phục hồi các cảnh báo bị kẹt ở trạng thái 'sending' quá 15 phút (chuyển thành failed để retry)
      try {
        const staleAlertThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        await supabase
          .from("video_alerts")
          .update({
            status: "failed",
            last_error: "Quá trình gửi trước đó bị treo quá 15 phút.",
            updated_at: new Date().toISOString(),
          })
          .eq("status", "sending")
          .lt("updated_at", staleAlertThreshold);
      } catch (recoverErr: any) {
        console.error("Lỗi phục hồi alert treo:", recoverErr);
      }

      // 11. Xử lý gửi cảnh báo Discord (Nếu có webhook)
      const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");

      try {
        const { data: alertsToProcess, error: alertsQueryErr } = await supabase
          .from("video_alerts")
          .select(`
            id,
            video_id,
            snapshot_id,
            threshold_vph,
            measured_vph,
            view_count,
            view_delta,
            elapsed_seconds,
            attempts,
            status,
            videos:video_id (
              id,
              title,
              url,
              thumbnail_url,
              published_at,
              channels:channel_id (
                name
              )
            )
          `)
          .in("status", ["pending", "failed"])
          .lt("attempts", 5)
          .order("created_at", { ascending: true });

        if (!alertsQueryErr && alertsToProcess && alertsToProcess.length > 0) {
          for (const alert of alertsToProcess) {
            const currentAttempts = (Number(alert.attempts) || 0) + 1;

            // Chuyển trạng thái sang sending
            await supabase
              .from("video_alerts")
              .update({
                status: "sending",
                attempts: currentAttempts,
                updated_at: new Date().toISOString(),
              })
              .eq("id", alert.id);

            if (!discordWebhookUrl || !discordWebhookUrl.trim()) {
              alertsFailed++;
              await supabase
                .from("video_alerts")
                .update({
                  status: "failed",
                  last_error: "Chưa cấu hình DISCORD_WEBHOOK_URL trên máy chủ.",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", alert.id);
              continue;
            }

            try {
              const videoData: any = alert.videos;
              const channelName = videoData?.channels?.name || "Kênh đối thủ";
              const videoTitle = videoData?.title || "Video không rõ tiêu đề";
              const videoUrl = videoData?.url || `https://www.youtube.com/watch?v=${alert.video_id}`;
              const thumbnailUrl = videoData?.thumbnail_url || null;
              const publishedAt = videoData?.published_at || new Date().toISOString();

              const embedPayload = buildDiscordEmbed({
                channelName,
                videoTitle,
                videoUrl,
                thumbnailUrl,
                publishedAt,
                measuredVph: Number(alert.measured_vph),
                currentViews: Number(alert.view_count),
                viewDelta: alert.view_delta !== null ? Number(alert.view_delta) : null,
                elapsedSeconds: alert.elapsed_seconds !== null ? Number(alert.elapsed_seconds) : null,
                thresholdVph: Number(alert.threshold_vph),
              });

              const normalizedWebhookUrl = discordWebhookUrl.replace("discordapp.com", "discord.com");
              const discordRes = await fetch(`${normalizedWebhookUrl}?wait=true`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "User-Agent": "BatBaiDoiThu/1.0 (+https://batbaidoithu.click)",
                },
                body: JSON.stringify(embedPayload),
              });

              if (discordRes.ok) {
                const resBody = await discordRes.json().catch(() => ({}));
                const messageId = resBody?.id ? String(resBody.id) : null;

                await supabase
                  .from("video_alerts")
                  .update({
                    status: "sent",
                    sent_at: new Date().toISOString(),
                    discord_message_id: messageId,
                    last_error: null,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", alert.id);

                alertsSent++;
              } else {
                alertsFailed++;
                const errText = await discordRes.text().catch(() => "");
                const safeError = `Discord HTTP ${discordRes.status}: ${errText.slice(0, 300)}`.replace(discordWebhookUrl, "REDACTED");
                await supabase
                  .from("video_alerts")
                  .update({
                    status: "failed",
                    last_error: safeError,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", alert.id);
              }
            } catch (sendErr: any) {
              alertsFailed++;
              const safeError = (sendErr.message || String(sendErr)).replace(discordWebhookUrl, "REDACTED");
              await supabase
                .from("video_alerts")
                .update({
                  status: "failed",
                  last_error: safeError,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", alert.id);
            }
          }
        }
      } catch (alertProcessErr: any) {
        console.error("Lỗi trong vòng lặp gửi cảnh báo Discord:", alertProcessErr);
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
            alertCandidates,
            alertsSent,
            alertsFailed,
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
          alert_candidates: alertCandidates,
          alerts_sent: alertsSent,
          alerts_failed: alertsFailed,
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
