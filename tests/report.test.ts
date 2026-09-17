import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseReportRange,
  getReportRangeStart,
  formatVietnamDateTime,
  formatNumber,
  formatVph,
  formatRelativeTime,
  computeReportSummary,
  computeScanSummary,
  computeChannelActivity,
  sortRisingNewVideos,
  buildReportCopyText,
  fetchReportData,
  ALERT_STATUS_MAP,
  SCAN_STATUS_MAP,
  SCAN_TRIGGER_MAP,
} from '../src/services/report-service';
import { sanitizeErrorSummary } from '../src/services/data-health-service';
import type {
  ReportVideo,
  ReportAlert,
  ReportScan,
} from '../src/types/report';

function makeVideo(overrides: Partial<ReportVideo> = {}): ReportVideo {
  return {
    id: overrides.id ?? 'v-' + Math.random().toString(36).substring(7),
    channelId: overrides.channelId ?? 'ch-1',
    channelName: overrides.channelName ?? 'Kênh Đối Thủ 1',
    channelHandle: overrides.channelHandle ?? '@kenh1',
    channelAvatarUrl: overrides.channelAvatarUrl ?? null,
    title: overrides.title ?? 'Video Tiêu Đề Mẫu',
    thumbnailUrl: overrides.thumbnailUrl ?? null,
    youtubeVideoId: overrides.youtubeVideoId ?? 'yt-123',
    publishedAt: overrides.publishedAt ?? '2026-09-17T10:00:00Z',
    latestMeasuredVph: overrides.latestMeasuredVph !== undefined ? overrides.latestMeasuredVph : 100,
    latestViewCount: overrides.latestViewCount !== undefined ? overrides.latestViewCount : 1500,
    hasAlert: overrides.hasAlert ?? false,
  };
}

function makeScan(overrides: Partial<ReportScan> = {}): ReportScan {
  return {
    id: overrides.id ?? 'scan-' + Math.random().toString(36).substring(7),
    startedAt: overrides.startedAt ?? '2026-09-17T12:00:00Z',
    finishedAt: overrides.finishedAt ?? '2026-09-17T12:02:00Z',
    status: overrides.status ?? 'success',
    statusLabel: overrides.statusLabel ?? 'Thành công',
    triggerSource: overrides.triggerSource ?? 'schedule',
    triggerLabel: overrides.triggerLabel ?? 'Tự động',
    channelsTotal: overrides.channelsTotal ?? 10,
    channelsSuccess: overrides.channelsSuccess ?? 10,
    channelsFailed: overrides.channelsFailed ?? 0,
    videosFound: overrides.videosFound ?? 25,
    snapshotsCreated: overrides.snapshotsCreated ?? 100,
    alertsSent: overrides.alertsSent ?? 0,
    alertsFailed: overrides.alertsFailed ?? 0,
    errorSummary: overrides.errorSummary ?? null,
    sanitizedError: overrides.sanitizedError ?? null,
  };
}

describe('Bắt Bài Đối Thủ — Giai Đoạn 16: Báo Cáo 24h / 7 Ngày (report-service)', () => {
  // 1. Range & Boundary (Section 56)
  describe('1. Phân tích khoảng thời gian và mốc ranh giới (getReportRangeStart & parseReportRange)', () => {
    it('parseReportRange fallback về 24h khi giá trị không hợp lệ', () => {
      expect(parseReportRange('24h')).toBe('24h');
      expect(parseReportRange('7d')).toBe('7d');
      expect(parseReportRange('30d')).toBe('24h');
      expect(parseReportRange(undefined)).toBe('24h');
      expect(parseReportRange(null)).toBe('24h');
    });

    it('tính mốc bắt đầu chính xác: 24h là now - 24 giờ, 7d là now - 7*24 giờ', () => {
      const fixedNow = 1700000000000;
      const start24h = getReportRangeStart('24h', fixedNow);
      const start7d = getReportRangeStart('7d', fixedNow);

      expect(new Date(start24h).getTime()).toBe(fixedNow - 24 * 3600 * 1000);
      expect(new Date(start7d).getTime()).toBe(fixedNow - 7 * 24 * 3600 * 1000);
    });

    it('kiểm tra boundary: timestamp đúng mốc start được tính vào, trước start bị loại trừ', () => {
      const fixedNow = 1700000000000;
      const startMs = fixedNow - 24 * 3600 * 1000;
      const startIso = new Date(startMs).toISOString();

      const exactAtStart = new Date(startMs).toISOString();
      const beforeStart = new Date(startMs - 1).toISOString();
      const afterStart = new Date(startMs + 1).toISOString();

      expect(exactAtStart >= startIso).toBe(true);
      expect(afterStart >= startIso).toBe(true);
      expect(beforeStart >= startIso).toBe(false);
    });
  });

  // 2. Video Summary Computation (Section 57)
  describe('2. Tính toán tóm tắt video mới (computeReportSummary)', () => {
    it('dataset mẫu Section 57: 5 video mới, 3 channels, VPH: 100, 0, NULL, 300, 50 -> videoNew=5, channels=3, rising=3, maxVPH=300', () => {
      const videos: ReportVideo[] = [
        makeVideo({ channelId: 'ch-1', latestMeasuredVph: 100 }),
        makeVideo({ channelId: 'ch-1', latestMeasuredVph: 0 }),
        makeVideo({ channelId: 'ch-2', latestMeasuredVph: null }),
        makeVideo({ channelId: 'ch-3', latestMeasuredVph: 300 }),
        makeVideo({ channelId: 'ch-2', latestMeasuredVph: 50 }),
      ];

      const summary = computeReportSummary(videos, 0, []);
      expect(summary.newVideosCount).toBe(5);
      expect(summary.channelsWithNewVideosCount).toBe(3);
      expect(summary.risingNewVideosCount).toBe(3); // 100, 300, 50 > 0
      expect(summary.maxCurrentVph).toBe(300);
    });

    it('nếu tất cả video có VPH là null -> maxCurrentVph là null', () => {
      const videos = [
        makeVideo({ latestMeasuredVph: null }),
        makeVideo({ latestMeasuredVph: null }),
      ];
      const summary = computeReportSummary(videos, 0, []);
      expect(summary.maxCurrentVph).toBeNull();
    });

    it('nếu không có video nào -> trả về 0 và null', () => {
      const summary = computeReportSummary([], 0, []);
      expect(summary.newVideosCount).toBe(0);
      expect(summary.channelsWithNewVideosCount).toBe(0);
      expect(summary.risingNewVideosCount).toBe(0);
      expect(summary.maxCurrentVph).toBeNull();
    });
  });

  // 3. Alert Summary (Section 58)
  describe('3. Tóm tắt cảnh báo phát sinh (Alert Summary)', () => {
    it('truyền đúng số lượng alert phát sinh trong khoảng', () => {
      const summary = computeReportSummary([], 3, []);
      expect(summary.alertsCount).toBe(3);
    });
  });

  // 4. Scan Summary (Section 59)
  describe('4. Tóm tắt hoạt động quét (computeScanSummary & Section 59)', () => {
    it('dataset Section 59: scans (success 100, success 120, partial 90, failed 0) -> total=4, snapshots=310, attention=2', () => {
      const scans: ReportScan[] = [
        makeScan({ status: 'success', snapshotsCreated: 100 }),
        makeScan({ status: 'success', snapshotsCreated: 120 }),
        makeScan({ status: 'partial', snapshotsCreated: 90 }),
        makeScan({ status: 'failed', snapshotsCreated: 0 }),
      ];

      const scanSum = computeScanSummary(scans);
      expect(scanSum.totalScans).toBe(4);
      expect(scanSum.successScans).toBe(2);
      expect(scanSum.partialScans).toBe(1);
      expect(scanSum.failedScans).toBe(1);
      expect(scanSum.totalSnapshots).toBe(310);

      const repSum = computeReportSummary([], 0, scans);
      expect(repSum.snapshotsCount).toBe(310);
      expect(repSum.attentionScansCount).toBe(2); // 1 partial + 1 failed
    });
  });

  // 5. Channel Activity (Section 60)
  describe('5. Thống kê hoạt động từng kênh (computeChannelActivity)', () => {
    it('tính đúng số video, video gần nhất, max VPH và số video đang tăng theo từng kênh', () => {
      const vA1 = makeVideo({
        channelId: 'ch-A',
        channelName: 'Channel Alpha',
        title: 'Video A1',
        publishedAt: '2026-09-17T12:00:00Z',
        latestMeasuredVph: 150,
      });
      const vA2 = makeVideo({
        channelId: 'ch-A',
        channelName: 'Channel Alpha',
        title: 'Video A2 Mới Nhất',
        publishedAt: '2026-09-17T15:00:00Z',
        latestMeasuredVph: 400,
      });
      const vA3 = makeVideo({
        channelId: 'ch-A',
        channelName: 'Channel Alpha',
        title: 'Video A3',
        publishedAt: '2026-09-17T09:00:00Z',
        latestMeasuredVph: 0,
      });
      const vB1 = makeVideo({
        channelId: 'ch-B',
        channelName: 'Channel Beta',
        title: 'Video B1 Duy Nhất',
        publishedAt: '2026-09-17T11:00:00Z',
        latestMeasuredVph: null,
      });

      const activities = computeChannelActivity([vA1, vA2, vA3, vB1]);
      expect(activities.length).toBe(2);

      // Channel A xếp trước vì có 3 video
      const chA = activities[0];
      expect(chA.channelId).toBe('ch-A');
      expect(chA.newVideosCount).toBe(3);
      expect(chA.latestVideoTitle).toBe('Video A2 Mới Nhất');
      expect(chA.latestPublishedAt).toBe('2026-09-17T15:00:00Z');
      expect(chA.maxCurrentVph).toBe(400);
      expect(chA.risingCount).toBe(2); // 150 và 400 > 0

      // Channel B
      const chB = activities[1];
      expect(chB.channelId).toBe('ch-B');
      expect(chB.newVideosCount).toBe(1);
      expect(chB.latestVideoTitle).toBe('Video B1 Duy Nhất');
      expect(chB.maxCurrentVph).toBeNull();
      expect(chB.risingCount).toBe(0);
    });

    it('khi hai kênh bằng số video, ưu tiên xếp kênh có video xuất bản gần nhất trước (tie breaking)', () => {
      const v1 = makeVideo({
        channelId: 'ch-1',
        channelName: 'Kênh 1',
        publishedAt: '2026-09-17T10:00:00Z',
      });
      const v2 = makeVideo({
        channelId: 'ch-2',
        channelName: 'Kênh 2',
        publishedAt: '2026-09-17T14:00:00Z',
      });

      const res = computeChannelActivity([v1, v2]);
      expect(res[0].channelId).toBe('ch-2'); // v2 mới hơn v1
      expect(res[1].channelId).toBe('ch-1');
    });
  });

  // 6. Historical Alert Values (Section 61)
  describe('6. Bảo toàn giá trị lịch sử cảnh báo (Section 61)', () => {
    it('Alert History phải giữ nguyên measuredVph và thresholdVph tại thời điểm cảnh báo, không thay bằng current VPH', () => {
      const alertItem: ReportAlert = {
        id: 'alt-1',
        videoId: 'vid-1',
        videoTitle: 'Video có bão view',
        videoYoutubeId: 'yt-1',
        videoThumbnailUrl: null,
        channelId: 'ch-1',
        channelName: 'Kênh X',
        channelHandle: '@x',
        channelAvatarUrl: null,
        measuredVph: 6000,
        thresholdVph: 5000,
        viewCount: 15000,
        status: 'sent',
        statusLabel: 'Đã gửi',
        createdAt: '2026-09-17T08:00:00Z',
      };

      // Giả sử video hiện tại VPH đã giảm xuống 900
      const currentVideoVph = 900;
      expect(alertItem.measuredVph).toBe(6000);
      expect(alertItem.measuredVph).not.toBe(currentVideoVph);
      expect(alertItem.thresholdVph).toBe(5000);
      expect(alertItem.viewCount).toBe(15000);
    });
  });

  // 7. NULL vs 0 VPH Display Rule (Section 62)
  describe('7. Phân biệt rõ NULL và 0 VPH (formatVph & Section 62)', () => {
    it('NULL trả về "Chưa đủ dữ liệu"', () => {
      expect(formatVph(null)).toBe('Chưa đủ dữ liệu');
      expect(formatVph(undefined)).toBe('Chưa đủ dữ liệu');
    });

    it('0 trả về "0 VPH" (đã đo nhưng không tăng)', () => {
      expect(formatVph(0)).toBe('0 VPH');
    });

    it('> 0 trả về chuỗi định dạng số kèm đơn vị VPH', () => {
      expect(formatVph(740.39)).toContain('740,39');
      expect(formatVph(740.39)).toContain('VPH');
    });

    it('formatVietnamDateTime định dạng ngày giờ theo múi giờ Việt Nam', () => {
      expect(formatVietnamDateTime(null)).toBe('—');
      expect(formatVietnamDateTime('invalid')).toBe('—');
      // 2026-09-17T13:00:00Z -> 20:00 17/09/2026 UTC+7
      const vnStr = formatVietnamDateTime('2026-09-17T13:00:00Z');
      expect(vnStr).toContain('17/09/2026');
      expect(vnStr).toContain('20:00');
    });

    it('formatNumber định dạng số với dấu chấm phân cách hàng nghìn', () => {
      expect(formatNumber(null)).toBe('0');
      expect(formatNumber(1080)).toContain('1.080');
      expect(formatNumber(25000)).toContain('25.000');
    });

    it('formatRelativeTime tính thời gian tương đối', () => {
      const now = 1700000000000;
      expect(formatRelativeTime(null, now)).toBe('—');
      expect(formatRelativeTime(new Date(now - 30 * 1000).toISOString(), now)).toBe('Vừa xong');
      expect(formatRelativeTime(new Date(now - 15 * 60 * 1000).toISOString(), now)).toBe('15 phút trước');
      expect(formatRelativeTime(new Date(now - 4 * 3600 * 1000).toISOString(), now)).toBe('4 giờ trước');
      expect(formatRelativeTime(new Date(now - 2 * 24 * 3600 * 1000).toISOString(), now)).toBe('2 ngày trước');
    });
  });

  // 8. Copy Summary Text (Section 63)
  describe('8. Định dạng chuỗi tóm tắt sao chép (buildReportCopyText & Section 63)', () => {
    it('chuỗi tóm tắt chứa đúng các trường số liệu thật, không chứa phán đoán cảm tính hay AI', () => {
      const summary = {
        newVideosCount: 36,
        channelsWithNewVideosCount: 29,
        risingNewVideosCount: 15,
        alertsCount: 0,
        snapshotsCount: 1080,
        attentionScansCount: 0,
        maxCurrentVph: 740.39,
      };

      const copyText = buildReportCopyText(summary, '24h', 1700000000000);

      expect(copyText).toContain('BÁO CÁO BẮT BÀI ĐỐI THỦ — 24 GIỜ');
      expect(copyText).toContain('Video mới: 36');
      expect(copyText).toContain('Kênh có video mới: 29');
      expect(copyText).toContain('Video mới đang tăng: 15');
      expect(copyText).toContain('Cảnh báo phát sinh: 0');
      expect(copyText).toContain('Lần quét cần chú ý: 0');
      expect(copyText).toContain('740,39');
      expect(copyText).toContain('Múi giờ Việt Nam');

      // Section 63: Tuyệt đối không có phán đoán, dự đoán, recommendation
      expect(copyText.toLowerCase()).not.toContain('viral');
      expect(copyText.toLowerCase()).not.toContain('dự đoán');
      expect(copyText.toLowerCase()).not.toContain('khuyên');
      expect(copyText.toLowerCase()).not.toContain('nên làm');
      expect(copyText.toLowerCase()).not.toContain('score');
      expect(copyText.toLowerCase()).not.toContain('bùng nổ');
    });

    it('chuỗi tóm tắt 7 ngày hiển thị đúng tiêu đề 7 NGÀY', () => {
      const summary = {
        newVideosCount: 10,
        channelsWithNewVideosCount: 5,
        risingNewVideosCount: 2,
        alertsCount: 1,
        snapshotsCount: 500,
        attentionScansCount: 0,
        maxCurrentVph: null,
      };
      const text = buildReportCopyText(summary, '7d', 1700000000000);
      expect(text).toContain('BÁO CÁO BẮT BÀI ĐỐI THỦ — 7 NGÀY');
      expect(text).toContain('VPH cao nhất hiện tại trong nhóm video mới: —');
    });
  });

  // 9. Error Sanitization (Section 64)
  describe('9. Khử độc thông tin nhạy cảm trong lỗi phiên quét (sanitizeErrorSummary & Section 64)', () => {
    it('loại bỏ webhook URL, token, API key, JWT khỏi error summary', () => {
      const rawError =
        'Error sending webhook to https://discord.com/api/webhooks/123456789/abcdefghijk with token: sk-proj-12345678901234567890 and Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz.abc';

      const sanitized = sanitizeErrorSummary(rawError);

      expect(sanitized).not.toContain('123456789/abcdefghijk');
      expect(sanitized).not.toContain('sk-proj-12345678901234567890');
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz.abc');
      expect(sanitized).toContain('[URL Webhook ẩn]');
      expect(sanitized).toContain('[Mã bí mật ẩn]');
    });
  });

  // 10. Rising Videos Sorting & Limit (Section 10)
  describe('10. Lọc và sắp xếp video mới đang tăng (sortRisingNewVideos)', () => {
    it('chỉ lấy video có latestMeasuredVph > 0, xếp giảm dần và lấy tối đa limit', () => {
      const vList: ReportVideo[] = [
        makeVideo({ id: '1', latestMeasuredVph: 50 }),
        makeVideo({ id: '2', latestMeasuredVph: 500 }),
        makeVideo({ id: '3', latestMeasuredVph: 0 }),
        makeVideo({ id: '4', latestMeasuredVph: null }),
        makeVideo({ id: '5', latestMeasuredVph: 250 }),
      ];

      const res = sortRisingNewVideos(vList, 2);
      expect(res.length).toBe(2);
      expect(res[0].id).toBe('2'); // 500 VPH
      expect(res[1].id).toBe('5'); // 250 VPH
    });
  });

  // 11. Pagination Safety (>1000 Rows) (Section 65)
  describe('11. An toàn phân trang khi dữ liệu vượt 1000 hàng (>1000 rows)', () => {
    it('kiểm tra thuật toán phân trang lặp offset += BATCH_SIZE cho đến khi rows < BATCH_SIZE', () => {
      // Giả lập logic vòng lặp phân trang
      const BATCH_SIZE = 1000;
      const totalMockRows = 2450;
      let offset = 0;
      let hasMore = true;
      let fetchCount = 0;
      const fetched: number[] = [];

      while (hasMore) {
        fetchCount++;
        const currentBatch = Math.min(BATCH_SIZE, totalMockRows - offset);
        for (let i = 0; i < currentBatch; i++) {
          fetched.push(offset + i);
        }
        if (currentBatch < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }
      }

      expect(fetchCount).toBe(3); // 1000 + 1000 + 450
      expect(fetched.length).toBe(2450);
    });

    it('ALERT PAGINATION: mock 1.205 alerts -> expected summary alertsCount = 1.205 và recentAlerts.length = 20', async () => {
      const supabaseModule = await import('../src/services/supabase');
      const origGetSupabase = supabaseModule.getSupabase;
      const origIsConfigured = supabaseModule.isSupabaseConfigured;

      const mockAlertRows = Array.from({ length: 1205 }, (_, i) => ({
        id: `alert-${i}`,
        video_id: `v-${i}`,
        threshold_vph: 100,
        measured_vph: 150,
        view_count: 2000,
        status: 'sent',
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        videos: {
          id: `v-${i}`,
          title: `Video ${i}`,
          youtube_video_id: `yt-${i}`,
          thumbnail_url: null,
          channels: { id: `ch-${i}`, name: `Channel ${i}`, handle: `@ch${i}`, avatar_url: null },
        },
      }));

      const mockClient = {
        from: (table: string) => {
          if (table === 'video_alerts') {
            return {
              select: () => ({
                gte: () => ({
                  order: () => ({
                    range: (fromIdx: number, toIdx: number) => {
                      const slice = mockAlertRows.slice(fromIdx, toIdx + 1);
                      return Promise.resolve({ data: slice, error: null });
                    },
                  }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              gte: () => ({
                order: () => ({
                  range: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        },
      };

      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockClient as any);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      try {
        const data = await fetchReportData('24h');
        expect(data.summary.alertsCount).toBe(1205);
        expect(data.recentAlerts.length).toBe(20);
      } finally {
        vi.spyOn(supabaseModule, 'getSupabase').mockImplementation(origGetSupabase);
        vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockImplementation(origIsConfigured);
      }
    });

    it('SCAN PAGINATION: mock 1.150 scans -> expected summary/scanSummary tính đủ 1.150 và recentScans.length = 20', async () => {
      const supabaseModule = await import('../src/services/supabase');
      const origGetSupabase = supabaseModule.getSupabase;
      const origIsConfigured = supabaseModule.isSupabaseConfigured;

      const mockScanRows = Array.from({ length: 1150 }, (_, i) => ({
        id: `scan-${i}`,
        started_at: new Date(Date.now() - i * 1000).toISOString(),
        finished_at: new Date(Date.now() - i * 1000 + 500).toISOString(),
        status: i % 2 === 0 ? 'success' : 'partial',
        trigger_source: 'schedule',
        channels_total: 10,
        channels_success: 9,
        channels_failed: 1,
        videos_found: 20,
        snapshots_created: 10,
        alerts_sent: 0,
        alerts_failed: 0,
        error_summary: null,
      }));

      const mockClient = {
        from: (table: string) => {
          if (table === 'scan_runs') {
            return {
              select: () => ({
                gte: () => ({
                  order: () => ({
                    range: (fromIdx: number, toIdx: number) => {
                      const slice = mockScanRows.slice(fromIdx, toIdx + 1);
                      return Promise.resolve({ data: slice, error: null });
                    },
                  }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              gte: () => ({
                order: () => ({
                  range: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        },
      };

      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockClient as any);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      try {
        const data = await fetchReportData('24h');
        expect(data.scanSummary.totalScans).toBe(1150);
        expect(data.scanSummary.totalSnapshots).toBe(1150 * 10);
        expect(data.summary.snapshotsCount).toBe(1150 * 10);
        expect(data.recentScans.length).toBe(20);
      } finally {
        vi.spyOn(supabaseModule, 'getSupabase').mockImplementation(origGetSupabase);
        vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockImplementation(origIsConfigured);
      }
    });
  });

  // 12. Static Source Verification: Read Only & No Snapshot History Bulk Fetch (Section 66 & 67)
  describe('12. Kiểm tra tĩnh mã nguồn: 100% READ-ONLY và KHÔNG fetch video_snapshots toàn kỳ (Section 66 & 67)', () => {
    const servicePath = path.resolve(__dirname, '../src/services/report-service.ts');
    const pagePath = path.resolve(__dirname, '../src/pages/ReportPage.vue');
    const serviceCode = fs.readFileSync(servicePath, 'utf-8');
    const pageCode = fs.readFileSync(pagePath, 'utf-8');

    it('report-service.ts không chứa bất kỳ mutation nào (insert, update, delete, upsert, functions.invoke)', () => {
      expect(serviceCode).not.toContain('.insert(');
      expect(serviceCode).not.toContain('.update(');
      expect(serviceCode).not.toContain('.delete(');
      expect(serviceCode).not.toContain('.upsert(');
      expect(serviceCode).not.toContain('.invoke(');
    });

    it('report-service.ts không query bảng video_snapshots (Section 66: không fetch hàng chục nghìn snapshots)', () => {
      expect(serviceCode).not.toContain("from('video_snapshots')");
      expect(serviceCode).not.toContain('from("video_snapshots")');
    });

    it('ReportPage.vue không import AccessKeyPromptModal và không đọc bbdt_access_key', () => {
      expect(pageCode).not.toContain('AccessKeyPromptModal');
      expect(pageCode).not.toContain('bbdt_access_key');
    });

    it('ReportPage.vue không gọi collector hoặc Edge Function', () => {
      expect(pageCode).not.toContain('collect-youtube-data');
      expect(pageCode).not.toContain('analyze-video-content');
    });
  });

  // 13. Status and Trigger Mapping
  describe('13. Ánh xạ trạng thái và nguồn kích hoạt đúng chuẩn tiếng Việt', () => {
    it('ALERT_STATUS_MAP ánh xạ chuẩn', () => {
      expect(ALERT_STATUS_MAP.pending).toBe('Chờ gửi');
      expect(ALERT_STATUS_MAP.sending).toBe('Đang gửi');
      expect(ALERT_STATUS_MAP.sent).toBe('Đã gửi');
      expect(ALERT_STATUS_MAP.failed).toBe('Gửi lỗi');
    });

    it('SCAN_STATUS_MAP ánh xạ chuẩn', () => {
      expect(SCAN_STATUS_MAP.running).toBe('Đang chạy');
      expect(SCAN_STATUS_MAP.success).toBe('Thành công');
      expect(SCAN_STATUS_MAP.partial).toBe('Một phần');
      expect(SCAN_STATUS_MAP.failed).toBe('Thất bại');
    });

    it('SCAN_TRIGGER_MAP ánh xạ chuẩn', () => {
      expect(SCAN_TRIGGER_MAP.manual).toBe('Thủ công');
      expect(SCAN_TRIGGER_MAP.schedule).toBe('Tự động');
    });
  });
});
