import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { mount } from '@vue/test-utils';
import {
  parseReportRange,
  getReportRangeStart,
  formatVietnamDateTime,
  formatNumber,
  formatNullableNumber,
  formatVph,
  formatRelativeTime,
  parseAlertStatus,
  parseScanStatus,
  parseScanTrigger,
  toFiniteNumber,
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
  ReportSummary,
  ReportScanSummary,
  ReportChannelActivity,
} from '../src/types/report';

import ReportSummaryRail from '../src/components/report/ReportSummaryRail.vue';
import ReportBriefView from '../src/components/report/ReportBriefView.vue';
import ReportVideoSignals from '../src/components/report/ReportVideoSignals.vue';
import ReportChannelActivityComponent from '../src/components/report/ReportChannelActivity.vue';
import ReportOperationsView from '../src/components/report/ReportOperationsView.vue';

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

function createMockQuery(rows: any[]) {
  const query: any = {
    gte: () => query,
    lte: () => query,
    order: () => query,
    range: (fromIdx: number, toIdx: number) => {
      const slice = rows.slice(fromIdx, toIdx + 1);
      return Promise.resolve({ data: slice, error: null });
    },
  };
  return query;
}

describe('Bắt Bài Đối Thủ — Wave 3.11: Executive Intelligence Report (report-service)', () => {
  // 1. Range & Boundary
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

  // 2. Video Summary Computation
  describe('2. Tính toán tóm tắt video mới (computeReportSummary)', () => {
    it('dataset mẫu: 5 video mới, 3 channels, VPH: 100, 0, NULL, 300, 50 -> videoNew=5, channels=3, rising=3, maxVPH=300', () => {
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

  // 3. Alert Summary
  describe('3. Tóm tắt cảnh báo phát sinh (Alert Summary)', () => {
    it('truyền đúng số lượng alert phát sinh trong khoảng', () => {
      const summary = computeReportSummary([], 3, []);
      expect(summary.alertsCount).toBe(3);
    });
  });

  // 4. Scan Summary
  describe('4. Tóm tắt hoạt động quét (computeScanSummary)', () => {
    it('scans (running 50, success 100, partial 90, failed 0, unknown 10) -> total=5, snapshots=250, attention=2', () => {
      const scans: ReportScan[] = [
        makeScan({ status: 'running', snapshotsCreated: 50 }),
        makeScan({ status: 'success', snapshotsCreated: 100 }),
        makeScan({ status: 'partial', snapshotsCreated: 90 }),
        makeScan({ status: 'failed', snapshotsCreated: 0 }),
        makeScan({ status: 'unknown', snapshotsCreated: 10 }),
      ];

      const scanSum = computeScanSummary(scans);
      expect(scanSum.totalScans).toBe(5);
      expect(scanSum.runningScans).toBe(1);
      expect(scanSum.successScans).toBe(1);
      expect(scanSum.partialScans).toBe(1);
      expect(scanSum.failedScans).toBe(1);
      expect(scanSum.unknownScans).toBe(1);
      expect(scanSum.totalSnapshots).toBe(250);

      const repSum = computeReportSummary([], 0, scans);
      expect(repSum.snapshotsCount).toBe(250);
      expect(repSum.attentionScansCount).toBe(2); // 1 partial + 1 failed
    });
  });

  // 5. Channel Activity
  describe('5. Thống kê hoạt động từng kênh (computeChannelActivity)', () => {
    it('tính đúng số video, video gần nhất, latestVideoId, max VPH và số video đang tăng theo từng kênh', () => {
      const vA1 = makeVideo({
        id: 'vA1',
        channelId: 'ch-A',
        channelName: 'Channel Alpha',
        title: 'Video A1',
        publishedAt: '2026-09-17T12:00:00Z',
        latestMeasuredVph: 150,
      });
      const vA2 = makeVideo({
        id: 'vA2',
        channelId: 'ch-A',
        channelName: 'Channel Alpha',
        title: 'Video A2 Mới Nhất',
        publishedAt: '2026-09-17T15:00:00Z',
        latestMeasuredVph: 400,
      });
      const vA3 = makeVideo({
        id: 'vA3',
        channelId: 'ch-A',
        channelName: 'Channel Alpha',
        title: 'Video A3',
        publishedAt: '2026-09-17T09:00:00Z',
        latestMeasuredVph: 0,
      });
      const vB1 = makeVideo({
        id: 'vB1',
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
      expect(chA.latestVideoId).toBe('vA2');
      expect(chA.latestVideoTitle).toBe('Video A2 Mới Nhất');
      expect(chA.latestPublishedAt).toBe('2026-09-17T15:00:00Z');
      expect(chA.maxCurrentVph).toBe(400);
      expect(chA.risingCount).toBe(2);

      // Channel B
      const chB = activities[1];
      expect(chB.channelId).toBe('ch-B');
      expect(chB.newVideosCount).toBe(1);
      expect(chB.latestVideoId).toBe('vB1');
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

    it('khi hai kênh bằng cả số video và ngày xuất bản mới nhất, tie-breaking theo channelName ASC', () => {
      const vA = makeVideo({
        channelId: 'ch-z',
        channelName: 'Zebra Channel',
        publishedAt: '2026-09-17T14:00:00Z',
      });
      const vB = makeVideo({
        channelId: 'ch-a',
        channelName: 'Alpha Channel',
        publishedAt: '2026-09-17T14:00:00Z',
      });

      const res = computeChannelActivity([vA, vB]);
      expect(res[0].channelName).toBe('Alpha Channel');
      expect(res[1].channelName).toBe('Zebra Channel');
    });
  });

  // 6. Historical Alert Values & Status Semantics
  describe('6. Bảo toàn giá trị lịch sử cảnh báo và Status Semantics', () => {
    it('Alert History phải giữ nguyên measuredVph và thresholdVph tại thời điểm cảnh báo, status sent hiển thị Đã cảnh báo', () => {
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
        statusLabel: 'Đã cảnh báo',
        createdAt: '2026-09-17T08:00:00Z',
      };

      expect(alertItem.measuredVph).toBe(6000);
      expect(alertItem.thresholdVph).toBe(5000);
      expect(alertItem.status).toBe('sent');
      expect(ALERT_STATUS_MAP[alertItem.status]).toBe('Đã cảnh báo');
    });
  });

  // 7. NULL vs 0 VPH & formatNullableNumber
  describe('7. Phân biệt rõ NULL và 0 VPH (formatVph & formatNullableNumber)', () => {
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

    it('formatNullableNumber trả về "—" khi null/undefined, "0" khi 0, định dạng khi > 0', () => {
      expect(formatNullableNumber(null)).toBe('—');
      expect(formatNullableNumber(undefined)).toBe('—');
      expect(formatNullableNumber(0)).toBe('0');
      expect(formatNullableNumber(1500)).toContain('1.500');
    });

    it('formatVietnamDateTime định dạng ngày giờ theo múi giờ Việt Nam', () => {
      expect(formatVietnamDateTime(null)).toBe('—');
      expect(formatVietnamDateTime('invalid')).toBe('—');
      const vnStr = formatVietnamDateTime('2026-09-17T13:00:00Z');
      expect(vnStr).toContain('17/09/2026');
      expect(vnStr).toContain('20:00');
    });
  });

  // 8. Copy Summary Text
  describe('8. Định dạng chuỗi tóm tắt sao chép (buildReportCopyText)', () => {
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

      expect(copyText.toLowerCase()).not.toContain('viral');
      expect(copyText.toLowerCase()).not.toContain('dự đoán');
      expect(copyText.toLowerCase()).not.toContain('khuyên');
      expect(copyText.toLowerCase()).not.toContain('nên làm');
      expect(copyText.toLowerCase()).not.toContain('score');
      expect(copyText.toLowerCase()).not.toContain('bùng nổ');
    });
  });

  // 9. Error Sanitization
  describe('9. Khử độc thông tin nhạy cảm trong lỗi phiên quét (sanitizeErrorSummary)', () => {
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

  // 10. Rising Videos Sorting & Deterministic Tie Breaking
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

    it('khi VPH bằng nhau, tie-breaking theo publishedAt DESC và id DESC', () => {
      const v1 = makeVideo({ id: 'v-1', latestMeasuredVph: 200, publishedAt: '2026-09-17T10:00:00Z' });
      const v2 = makeVideo({ id: 'v-2', latestMeasuredVph: 200, publishedAt: '2026-09-17T12:00:00Z' });
      const v3 = makeVideo({ id: 'v-3', latestMeasuredVph: 200, publishedAt: '2026-09-17T12:00:00Z' });

      const res = sortRisingNewVideos([v1, v2, v3], 3);
      expect(res[0].id).toBe('v-3'); // published 12:00, id v-3 > v-2
      expect(res[1].id).toBe('v-2');
      expect(res[2].id).toBe('v-1'); // published 10:00
    });
  });

  // 11. Pagination Safety (>1000 Rows)
  describe('11. An toàn phân trang khi dữ liệu vượt 1000 hàng (>1000 rows)', () => {
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
              select: () => createMockQuery(mockAlertRows),
            };
          }
          return {
            select: () => createMockQuery([]),
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
              select: () => createMockQuery(mockScanRows),
            };
          }
          return {
            select: () => createMockQuery([]),
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

    it('UPPER BOUND & SECONDARY ORDER: kiểm tra fetchReportData gọi .lte(col, nowIso) và .order("id", { ascending: false })', async () => {
      const supabaseModule = await import('../src/services/supabase');
      const origGetSupabase = supabaseModule.getSupabase;
      const origIsConfigured = supabaseModule.isSupabaseConfigured;

      const calls: { table: string; lteCol?: string; lteVal?: string; orders: any[] }[] = [];

      const mockClient = {
        from: (table: string) => {
          const callInfo: { table: string; lteCol?: string; lteVal?: string; orders: any[] } = {
            table,
            orders: [],
          };
          calls.push(callInfo);

          const q: any = {
            select: () => q,
            gte: () => q,
            lte: (col: string, val: string) => {
              callInfo.lteCol = col;
              callInfo.lteVal = val;
              return q;
            },
            order: (col: string, opts: any) => {
              callInfo.orders.push({ col, opts });
              return q;
            },
            range: () => Promise.resolve({ data: [], error: null }),
          };
          return q;
        },
      };

      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockClient as any);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const fixedNow = 1773800000000;
      const nowIso = new Date(fixedNow).toISOString();

      try {
        await fetchReportData('24h', fixedNow);

        const videoCall = calls.find(c => c.table === 'videos');
        expect(videoCall).toBeDefined();
        expect(videoCall?.lteCol).toBe('published_at');
        expect(videoCall?.lteVal).toBe(nowIso);
        expect(videoCall?.orders).toContainEqual({ col: 'id', opts: { ascending: false } });

        const alertCall = calls.find(c => c.table === 'video_alerts');
        expect(alertCall).toBeDefined();
        expect(alertCall?.lteCol).toBe('created_at');
        expect(alertCall?.lteVal).toBe(nowIso);
        expect(alertCall?.orders).toContainEqual({ col: 'id', opts: { ascending: false } });

        const scanCall = calls.find(c => c.table === 'scan_runs');
        expect(scanCall).toBeDefined();
        expect(scanCall?.lteCol).toBe('started_at');
        expect(scanCall?.lteVal).toBe(nowIso);
        expect(scanCall?.orders).toContainEqual({ col: 'id', opts: { ascending: false } });
      } finally {
        vi.spyOn(supabaseModule, 'getSupabase').mockImplementation(origGetSupabase);
        vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockImplementation(origIsConfigured);
      }
    });
  });

  // 12. Static Source Verification
  describe('12. Kiểm tra tĩnh mã nguồn: 100% READ-ONLY và KHÔNG fetch video_snapshots toàn kỳ', () => {
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

    it('report-service.ts không query bảng video_snapshots', () => {
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

  // 13. Status and Trigger Mapping & Parsers
  describe('13. Ánh xạ trạng thái và nguồn kích hoạt đúng chuẩn tiếng Việt', () => {
    it('ALERT_STATUS_MAP ánh xạ chuẩn: sent = Đã cảnh báo', () => {
      expect(ALERT_STATUS_MAP.pending).toBe('Chờ gửi');
      expect(ALERT_STATUS_MAP.sending).toBe('Đang gửi');
      expect(ALERT_STATUS_MAP.sent).toBe('Đã cảnh báo');
      expect(ALERT_STATUS_MAP.failed).toBe('Gửi lỗi');
      expect(ALERT_STATUS_MAP.unknown).toBe('Không rõ');
    });

    it('SCAN_STATUS_MAP ánh xạ chuẩn', () => {
      expect(SCAN_STATUS_MAP.running).toBe('Đang chạy');
      expect(SCAN_STATUS_MAP.success).toBe('Thành công');
      expect(SCAN_STATUS_MAP.partial).toBe('Một phần');
      expect(SCAN_STATUS_MAP.failed).toBe('Thất bại');
      expect(SCAN_STATUS_MAP.unknown).toBe('Không rõ');
    });

    it('SCAN_TRIGGER_MAP ánh xạ chuẩn', () => {
      expect(SCAN_TRIGGER_MAP.manual).toBe('Thủ công');
      expect(SCAN_TRIGGER_MAP.schedule).toBe('Tự động');
      expect(SCAN_TRIGGER_MAP.unknown).toBe('Không rõ');
    });

    it('parseAlertStatus, parseScanStatus, parseScanTrigger xử lý fail-safe unknown', () => {
      expect(parseAlertStatus('sent')).toBe('sent');
      expect(parseAlertStatus('invalid')).toBe('unknown');
      expect(parseScanStatus('running')).toBe('running');
      expect(parseScanStatus('some_bad_status')).toBe('unknown');
      expect(parseScanTrigger('schedule')).toBe('schedule');
      expect(parseScanTrigger(null)).toBe('unknown');
    });

    it('toFiniteNumber xử lý an toàn', () => {
      expect(toFiniteNumber(42)).toBe(42);
      expect(toFiniteNumber('100')).toBe(100);
      expect(toFiniteNumber(null, 0)).toBe(0);
      expect(toFiniteNumber(NaN, 5)).toBe(5);
    });
  });

  // 14. UI Component Rendering Tests
  describe('14. Render UI Components của Wave 3.11', () => {
    const sampleSummary: ReportSummary = {
      newVideosCount: 12,
      channelsWithNewVideosCount: 5,
      risingNewVideosCount: 4,
      alertsCount: 2,
      snapshotsCount: 1400,
      attentionScansCount: 1,
      maxCurrentVph: 550,
    };

    const sampleScanSummary: ReportScanSummary = {
      totalScans: 8,
      runningScans: 0,
      successScans: 7,
      partialScans: 1,
      failedScans: 0,
      unknownScans: 0,
      totalSnapshots: 1400,
    };

    it('ReportSummaryRail hiển thị đủ 6 chỉ số điều hành và cảnh báo attention', () => {
      const wrapper = mount(ReportSummaryRail, {
        props: {
          summary: sampleSummary,
          range: '24h',
        },
      });

      expect(wrapper.text()).toContain('Video mới');
      expect(wrapper.text()).toContain('12');
      expect(wrapper.text()).toContain('Kênh có video mới');
      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain('Video mới đang tăng');
      expect(wrapper.text()).toContain('4');
      expect(wrapper.text()).toContain('Cảnh báo phát sinh');
      expect(wrapper.text()).toContain('2');
      expect(wrapper.text()).toContain('Lần quét cần chú ý');
      expect(wrapper.text()).toContain('1');
      expect(wrapper.find('.has-attention').exists()).toBe(true);
    });

    it('ReportBriefView hiển thị văn bản tóm lược điều hành và emit change-view', async () => {
      const wrapper = mount(ReportBriefView, {
        props: {
          summary: sampleSummary,
          scanSummary: sampleScanSummary,
          risingVideos: [makeVideo({ id: 'rv-1', title: 'Video Đang Tăng 1', latestMeasuredVph: 550 })],
          newVideos: [makeVideo({ id: 'nv-1', title: 'Video Mới Xuất Bản 1' })],
          channelActivities: [
            {
              channelId: 'ch-1',
              channelName: 'Channel One',
              channelHandle: '@one',
              channelAvatarUrl: null,
              newVideosCount: 3,
              latestPublishedAt: '2026-09-17T12:00:00Z',
              latestVideoId: 'v-1',
              latestVideoTitle: 'Video 1',
              latestVideoYoutubeId: 'yt-1',
              maxCurrentVph: 550,
              risingCount: 1,
            },
          ],
          recentAlerts: [],
          recentScans: [],
          range: '24h',
        },
        global: {
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      });

      expect(wrapper.text()).toContain('TỔNG KẾT NHANH ĐIỀU HÀNH');
      expect(wrapper.text()).toContain('12 video mới');
      expect(wrapper.text()).toContain('5 kênh đối thủ');

      const seeMoreBtn = wrapper.find('.see-more-link');
      expect(seeMoreBtn.exists()).toBe(true);
      await seeMoreBtn.trigger('click');
      expect(wrapper.emitted('change-view')).toBeTruthy();
    });

    it('ReportVideoSignals hiển thị danh sách video tăng trưởng và video mới xuất bản', () => {
      const rising = [makeVideo({ id: 'rv-1', title: 'Video Tăng Trưởng X', latestMeasuredVph: 800 })];
      const newV = [makeVideo({ id: 'nv-1', title: 'Video Mới Nhất Y', latestViewCount: 2500 })];

      const wrapper = mount(ReportVideoSignals, {
        props: {
          risingVideos: rising,
          newVideos: newV,
          maxCurrentVph: 800,
          range: '24h',
        },
        global: {
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      });

      expect(wrapper.text()).toContain('Video Mới Đang Tăng');
      expect(wrapper.text()).toContain('Video Tăng Trưởng X');
      expect(wrapper.text()).toContain('Video Mới Xuất Bản');
      expect(wrapper.text()).toContain('Video Mới Nhất Y');
      expect(wrapper.text()).toContain('800');
    });

    it('ReportChannelActivityComponent hiển thị bảng các kênh và liên kết video mới nhất', () => {
      const channels: ReportChannelActivity[] = [
        {
          channelId: 'ch-test',
          channelName: 'Kênh Thử Nghiệm',
          channelHandle: '@kenhtest',
          channelAvatarUrl: null,
          newVideosCount: 4,
          latestPublishedAt: '2026-09-17T14:00:00Z',
          latestVideoId: 'v-test',
          latestVideoTitle: 'Video Thử Nghiệm Gần Nhất',
          latestVideoYoutubeId: 'yt-test',
          maxCurrentVph: 350,
          risingCount: 2,
        },
      ];

      const wrapper = mount(ReportChannelActivityComponent, {
        props: {
          channels,
          range: '24h',
        },
        global: {
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      });

      expect(wrapper.text()).toContain('Kênh Có Hoạt Động Mới');
      expect(wrapper.text()).toContain('Kênh Thử Nghiệm');
      expect(wrapper.text()).toContain('Video Thử Nghiệm Gần Nhất');
      expect(wrapper.text()).toContain('4');
      expect(wrapper.text()).toContain('2 video');
    });

    it('ReportOperationsView hiển thị bảng phiên quét và accordion mở xem sanitized error', async () => {
      const scans: ReportScan[] = [
        makeScan({
          id: 'scan-err',
          status: 'partial',
          statusLabel: 'Một phần',
          errorSummary: 'Original secret error',
          sanitizedError: 'Sanitized error detail [Mã bí mật ẩn]',
        }),
      ];

      const wrapper = mount(ReportOperationsView, {
        props: {
          alerts: [],
          scans,
          scanSummary: sampleScanSummary,
          range: '24h',
        },
        global: {
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      });

      expect(wrapper.text()).toContain('Lịch Sử Phiên Quét & Snapshot');
      const toggleBtn = wrapper.find('.btn-toggle-error');
      expect(toggleBtn.exists()).toBe(true);
      expect(toggleBtn.text()).toBe('Xem lỗi');

      await toggleBtn.trigger('click');
      expect(wrapper.text()).toContain('Sanitized error detail [Mã bí mật ẩn]');
      expect(wrapper.find('.btn-toggle-error').text()).toBe('Đóng lỗi');
    });
  });
});
