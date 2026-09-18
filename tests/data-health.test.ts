import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import * as fs from 'fs';
import * as path from 'path';
import router from '../src/router';
import {
  computeSystemStatus,
  computeChannelFreshness,
  sortChannelsByFreshness,
  computeVideoFreshness,
  formatDuration,
  formatRelativeTime,
  sanitizeErrorSummary,
  formatNumber,
  formatDateTime,
  normalizeYouTubeVideoId,
  normalizeDataHealthThumbnail,
  mapScanRow,
  selectStaleVideos,
  dataHealthService,
} from '../src/services/data-health-service';
import * as supabaseModule from '../src/services/supabase';
import DataHealthPage from '../src/pages/DataHealthPage.vue';
import DataHealthAlertMonitoring from '../src/components/data-health/DataHealthAlertMonitoring.vue';
import type {
  DataHealthScan,
  ChannelFreshness,
  VideoFreshness,
  DataHealthSummary,
} from '../src/types/data-health';
import {
  SCAN_STATUS_LABELS,
  TRIGGER_SOURCE_LABELS,
  FRESHNESS_LABELS,
  VIDEO_FRESHNESS_LABELS,
} from '../src/types/data-health';

describe('Bắt Bài Đối Thủ — Giai Đoạn 10: Tình Trạng Dữ Liệu (Data Health Monitoring)', () => {
  const baseTimeMs = 1758100000000; // Reference timestamp: ~Sep 17 2025/2026

  // 1. Route và Page Title
  it('Route /tinh-trang-du-lieu được định nghĩa và có tiêu đề đúng chuẩn', () => {
    const route = router.getRoutes().find(r => r.path === '/tinh-trang-du-lieu');
    expect(route).toBeDefined();
    expect(route?.name).toBe('DataHealth');
    expect(route?.meta?.title).toBe('Tình Trạng Dữ Liệu — Bắt Bài Đối Thủ');
  });

  // 2. Mapping nhãn Scan Status và Trigger Source
  it('Các nhãn trạng thái và kiểu kích hoạt hiển thị 100% tiếng Việt chuẩn mực', () => {
    expect(SCAN_STATUS_LABELS.success).toBe('Thành công');
    expect(SCAN_STATUS_LABELS.partial).toBe('Thành công một phần');
    expect(SCAN_STATUS_LABELS.failed).toBe('Thất bại');
    expect(SCAN_STATUS_LABELS.running).toBe('Đang chạy');

    expect(TRIGGER_SOURCE_LABELS.schedule).toBe('Tự động');
    expect(TRIGGER_SOURCE_LABELS.manual).toBe('Thủ công');

    expect(FRESHNESS_LABELS.fresh).toBe('Mới cập nhật');
    expect(FRESHNESS_LABELS.warning).toBe('Chậm cập nhật');
    expect(FRESHNESS_LABELS.stale).toBe('Cần chú ý');
    expect(FRESHNESS_LABELS.never).toBe('Chưa quét');

    expect(VIDEO_FRESHNESS_LABELS.never).toBe('Chưa có snapshot');
  });

  // 3. System Status Banner (Độ ưu tiên A -> E)
  describe('Tình trạng hệ thống (System Status Banner)', () => {
    const mockScan = (status: any, startedAgoMinutes: number, finishedAgoMinutes: number | null): DataHealthScan => {
      const startedAt = new Date(baseTimeMs - startedAgoMinutes * 60 * 1000).toISOString();
      const finishedAt = finishedAgoMinutes !== null
        ? new Date(baseTimeMs - finishedAgoMinutes * 60 * 1000).toISOString()
        : null;
      return {
        id: 'scan-1',
        startedAt,
        finishedAt,
        status,
        statusLabel: SCAN_STATUS_LABELS[status as keyof typeof SCAN_STATUS_LABELS] || status,
        triggerSource: 'schedule',
        triggerLabel: 'Tự động',
        channelsTotal: 3,
        channelsSuccess: 3,
        channelsFailed: 0,
        videosFound: 30,
        snapshotsCreated: 30,
        alertsSent: 0,
        alertsFailed: 0,
        sanitizedError: null,
        durationText: '30 giây',
        relativeTime: '30 phút trước',
      };
    };

    it('A. Ưu tiên 1: Đang quét dữ liệu (running <= 30 phút)', () => {
      const scan = mockScan('running', 10, null);
      const res = computeSystemStatus(scan, null, baseTimeMs);
      expect(res.code).toBe('running');
      expect(res.label).toBe('Đang quét dữ liệu');
      expect(res.tone).toBe('info');
      expect(res.isStuckRunning).toBe(false);
      expect(res.description).toContain('Hệ thống đang thực hiện quét dữ liệu');
    });

    it('A-stuck. Running quá 30 phút -> Cảnh báo factual text', () => {
      const scan = mockScan('running', 35, null);
      const res = computeSystemStatus(scan, null, baseTimeMs);
      expect(res.code).toBe('running');
      expect(res.isStuckRunning).toBe(true);
      expect(res.description).toBe('Lần quét này đã chạy hơn 30 phút.');
    });

    it('B. Ưu tiên 2: Thất bại (failed) -> Cần kiểm tra', () => {
      const scan = mockScan('failed', 10, 9);
      const res = computeSystemStatus(scan, null, baseTimeMs);
      expect(res.code).toBe('needs_check');
      expect(res.label).toBe('Cần kiểm tra');
      expect(res.tone).toBe('danger');
    });

    it('C. Ưu tiên 3: Thành công một phần (partial) -> Có lỗi một phần', () => {
      const scan = mockScan('partial', 15, 14);
      const res = computeSystemStatus(scan, null, baseTimeMs);
      expect(res.code).toBe('partial_error');
      expect(res.label).toBe('Có lỗi một phần');
      expect(res.tone).toBe('warning');
    });

    it('D. Ưu tiên 4: Lần quét thành công đã quá 2 giờ -> Dữ liệu đang chậm cập nhật', () => {
      const scan = mockScan('success', 150, 149); // 149 phút = ~2.5 giờ trước
      const res = computeSystemStatus(scan, scan, baseTimeMs);
      expect(res.code).toBe('slow_update');
      expect(res.label).toBe('Dữ liệu đang chậm cập nhật');
      expect(res.tone).toBe('warning');
    });

    it('E. Ưu tiên 5: Thành công trong vòng 2 giờ -> Hoạt động bình thường', () => {
      const scan = mockScan('success', 40, 39); // 39 phút trước
      const res = computeSystemStatus(scan, scan, baseTimeMs);
      expect(res.code).toBe('normal');
      expect(res.label).toBe('Hoạt động bình thường');
      expect(res.tone).toBe('success');
    });

    it('Trường hợp chưa có lần quét nào -> Dữ liệu đang chậm cập nhật', () => {
      const res = computeSystemStatus(null, null, baseTimeMs);
      expect(res.code).toBe('slow_update');
      expect(res.label).toBe('Dữ liệu đang chậm cập nhật');
    });
  });

  // 4. Channel Freshness
  describe('Phân loại độ mới của kênh (Channel Freshness)', () => {
    it('Chưa quét (null) -> never (Chưa quét)', () => {
      const res = computeChannelFreshness(null, baseTimeMs);
      expect(res.category).toBe('never');
      expect(res.label).toBe('Chưa quét');
    });

    it('Quét <= 90 phút trước -> fresh (Mới cập nhật)', () => {
      const time = new Date(baseTimeMs - 45 * 60 * 1000).toISOString();
      const res = computeChannelFreshness(time, baseTimeMs);
      expect(res.category).toBe('fresh');
      expect(res.label).toBe('Mới cập nhật');
    });

    it('Quét 90 phút – 2 giờ trước -> warning (Chậm cập nhật)', () => {
      const time = new Date(baseTimeMs - 105 * 60 * 1000).toISOString();
      const res = computeChannelFreshness(time, baseTimeMs);
      expect(res.category).toBe('warning');
      expect(res.label).toBe('Chậm cập nhật');
    });

    it('Quét > 2 giờ trước -> stale (Cần chú ý)', () => {
      const time = new Date(baseTimeMs - 150 * 60 * 1000).toISOString();
      const res = computeChannelFreshness(time, baseTimeMs);
      expect(res.category).toBe('stale');
      expect(res.label).toBe('Cần chú ý');
    });
  });

  // 5. Sắp xếp kênh theo độ mới
  describe('Sắp xếp kênh theo độ mới (Sort Channels By Freshness)', () => {
    it('Ưu tiên kênh chưa quét hoặc cũ nhất hiển thị trước', () => {
      const channels: ChannelFreshness[] = [
        {
          id: 'ch-fresh',
          name: 'Kênh Mới',
          handle: '@moi',
          avatarUrl: null,
          lastScanAt: new Date(baseTimeMs - 30 * 60 * 1000).toISOString(),
          scanLimit: 15,
          alertVphThreshold: 1000,
          freshnessCategory: 'fresh',
          freshnessLabel: 'Mới cập nhật',
          relativeScanTime: '30 phút trước',
        },
        {
          id: 'ch-never',
          name: 'Kênh Chưa Quét',
          handle: '@chuascan',
          avatarUrl: null,
          lastScanAt: null,
          scanLimit: 15,
          alertVphThreshold: 1000,
          freshnessCategory: 'never',
          freshnessLabel: 'Chưa quét',
          relativeScanTime: 'Chưa có dữ liệu',
        },
        {
          id: 'ch-stale',
          name: 'Kênh Cần Chú Ý',
          handle: '@chu-y',
          avatarUrl: null,
          lastScanAt: new Date(baseTimeMs - 180 * 60 * 1000).toISOString(),
          scanLimit: 15,
          alertVphThreshold: 1000,
          freshnessCategory: 'stale',
          freshnessLabel: 'Cần chú ý',
          relativeScanTime: '3 giờ trước',
        },
        {
          id: 'ch-warning',
          name: 'Kênh Chậm',
          handle: '@cham',
          avatarUrl: null,
          lastScanAt: new Date(baseTimeMs - 100 * 60 * 1000).toISOString(),
          scanLimit: 15,
          alertVphThreshold: 1000,
          freshnessCategory: 'warning',
          freshnessLabel: 'Chậm cập nhật',
          relativeScanTime: '100 phút trước',
        },
      ];

      const sorted = sortChannelsByFreshness(channels);
      expect(sorted[0].id).toBe('ch-never');
      expect(sorted[1].id).toBe('ch-stale');
      expect(sorted[2].id).toBe('ch-warning');
      expect(sorted[3].id).toBe('ch-fresh');
    });
  });

  // 6. Video Freshness
  describe('Phân loại độ mới của video (Video Freshness)', () => {
    it('Chưa có snapshot (null) -> never (Chưa có snapshot)', () => {
      const res = computeVideoFreshness(null, baseTimeMs);
      expect(res.category).toBe('never');
      expect(res.label).toBe('Chưa có snapshot');
    });

    it('Snapshot <= 90 phút -> fresh (Mới cập nhật)', () => {
      const time = new Date(baseTimeMs - 20 * 60 * 1000).toISOString();
      const res = computeVideoFreshness(time, baseTimeMs);
      expect(res.category).toBe('fresh');
      expect(res.label).toBe('Mới cập nhật');
    });

    it('Snapshot 90 phút – 2 giờ -> warning (Chậm cập nhật)', () => {
      const time = new Date(baseTimeMs - 110 * 60 * 1000).toISOString();
      const res = computeVideoFreshness(time, baseTimeMs);
      expect(res.category).toBe('warning');
      expect(res.label).toBe('Chậm cập nhật');
    });

    it('Snapshot > 2 giờ -> stale (Cần chú ý)', () => {
      const time = new Date(baseTimeMs - 180 * 60 * 1000).toISOString();
      const res = computeVideoFreshness(time, baseTimeMs);
      expect(res.category).toBe('stale');
      expect(res.label).toBe('Cần chú ý');
    });
  });

  // 7. Format Duration
  describe('Định dạng thời lượng (formatDuration)', () => {
    it('Trạng thái running -> Đang chạy', () => {
      const started = new Date(baseTimeMs - 10000).toISOString();
      expect(formatDuration(started, null, 'running')).toBe('Đang chạy');
    });

    it('finishedAt là null -> Đang chạy', () => {
      const started = new Date(baseTimeMs - 10000).toISOString();
      expect(formatDuration(started, null, 'success')).toBe('Đang chạy');
    });

    it('Thời lượng dưới 60 giây', () => {
      const started = '2026-09-17T08:00:00.000Z';
      const finished = '2026-09-17T08:00:23.000Z';
      expect(formatDuration(started, finished, 'success')).toBe('23 giây');
    });

    it('Thời lượng trên 60 giây', () => {
      const started = '2026-09-17T08:00:00.000Z';
      const finished = '2026-09-17T08:01:05.000Z';
      expect(formatDuration(started, finished, 'success')).toBe('1 phút 05 giây');
    });
  });

  // 8. Format Relative Time
  describe('Định dạng thời gian tương đối (formatRelativeTime)', () => {
    it('null -> Chưa có dữ liệu', () => {
      expect(formatRelativeTime(null, baseTimeMs)).toBe('Chưa có dữ liệu');
    });

    it('< 60 giây -> Vừa xong', () => {
      const time = new Date(baseTimeMs - 30 * 1000).toISOString();
      expect(formatRelativeTime(time, baseTimeMs)).toBe('Vừa xong');
    });

    it('15 phút trước', () => {
      const time = new Date(baseTimeMs - 15 * 60 * 1000).toISOString();
      expect(formatRelativeTime(time, baseTimeMs)).toBe('15 phút trước');
    });

    it('3 giờ trước', () => {
      const time = new Date(baseTimeMs - 3 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(time, baseTimeMs)).toBe('3 giờ trước');
    });

    it('2 ngày trước', () => {
      const time = new Date(baseTimeMs - 2 * 86400 * 1000).toISOString();
      expect(formatRelativeTime(time, baseTimeMs)).toBe('2 ngày trước');
    });
  });

  // 9. Khử độc lỗi (Sanitize Error Summary)
  describe('Khử độc lỗi bảo mật (sanitizeErrorSummary)', () => {
    it('Ẩn URL Discord Webhook chứa token bí mật', () => {
      const err = 'Failed to post: https://discord.com/api/webhooks/1234567890/abcdefg_secret_token';
      const clean = sanitizeErrorSummary(err);
      expect(clean).not.toContain('abcdefg_secret_token');
      expect(clean).toContain('[URL Webhook ẩn]');
    });

    it('Ẩn Bearer token, access key, api key', () => {
      const err = 'Authorization failed with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID and secret: my_secret_key_123';
      const clean = sanitizeErrorSummary(err);
      expect(clean).not.toContain('my_secret_key_123');
      expect(clean).toContain('[Mã bí mật ẩn]');
    });

    it('Ẩn query param key', () => {
      const err = 'Failed with URL query key=AIzaSyA_example_1234567';
      const clean = sanitizeErrorSummary(err);
      expect(clean).not.toContain('AIzaSyA_example_1234567');
      expect(clean).toContain('key=[ẩn]');
    });

    it('Ẩn OpenAI key (sk-...)', () => {
      const err = 'Error from AI provider with key sk-proj-1234567890abcdefghijklmn';
      const clean = sanitizeErrorSummary(err);
      expect(clean).not.toContain('sk-proj-1234567890abcdefghijklmn');
      expect(clean).toContain('[OpenAI Key ẩn]');
    });

    it('Xử lý an toàn chuỗi rỗng hoặc undefined', () => {
      expect(sanitizeErrorSummary(null)).toBe('');
      expect(sanitizeErrorSummary(undefined)).toBe('');
      expect(sanitizeErrorSummary('')).toBe('');
    });
  });

  // 10. Wave 3.14 — Định Dạng Số Chuẩn (Zero vs Null Semantics)
  describe('Định dạng số chuẩn (formatNumber)', () => {
    it('null hoặc undefined -> —', () => {
      expect(formatNumber(null)).toBe('—');
      expect(formatNumber(undefined)).toBe('—');
    });

    it('0 -> 0 (không bị nuốt thành —)', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('Số nguyên và số lớn được format chuẩn vi-VN', () => {
      expect(formatNumber(1250)).toBe('1.250');
      expect(formatNumber(1500000)).toBe('1.500.000');
    });
  });

  // 11. Wave 3.14 — Định Dạng Ngày Giờ & Bảo Vệ Ngày Không Hợp Lệ
  describe('Định dạng ngày giờ (formatDateTime)', () => {
    it('null hoặc undefined -> —', () => {
      expect(formatDateTime(null)).toBe('—');
      expect(formatDateTime(undefined)).toBe('—');
    });

    it('Chuỗi ngày không hợp lệ (NaN) -> —', () => {
      expect(formatDateTime('invalid-date-string')).toBe('—');
      expect(formatDateTime('foo_bar_date')).toBe('—');
    });

    it('Chuỗi ISO hợp lệ -> hiển thị ngày giờ chuẩn', () => {
      const formatted = formatDateTime('2026-09-18T10:30:00.000Z');
      expect(formatted).not.toBe('—');
      expect(formatted).toContain('2026');
    });
  });

  // 12. Wave 3.14 — Chuẩn Hóa YouTube Video ID & Thumbnail URL
  describe('Chuẩn hóa YouTube ID và Thumbnail (normalizeYouTubeVideoId & normalizeDataHealthThumbnail)', () => {
    it('normalizeYouTubeVideoId loại bỏ khoảng trắng và từ chối các chuỗi null/undefined', () => {
      expect(normalizeYouTubeVideoId('  dQw4w9WgXcQ  ')).toBe('dQw4w9WgXcQ');
      expect(normalizeYouTubeVideoId(null)).toBeNull();
      expect(normalizeYouTubeVideoId(undefined)).toBeNull();
      expect(normalizeYouTubeVideoId('null')).toBeNull();
      expect(normalizeYouTubeVideoId('undefined')).toBeNull();
      expect(normalizeYouTubeVideoId('')).toBeNull();
    });

    it('normalizeDataHealthThumbnail ưu tiên URL từ DB nếu hợp lệ', () => {
      const dbUrl = 'https://custom-storage.example.com/thumbnails/video123.jpg';
      const res = normalizeDataHealthThumbnail(dbUrl, 'abc12345');
      expect(res).toBe(dbUrl);
    });

    it('normalizeDataHealthThumbnail fallback sang YouTube mqdefault khi DB thumbnail rỗng nhưng có YouTube ID', () => {
      const res = normalizeDataHealthThumbnail(null, 'dQw4w9WgXcQ');
      expect(res).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
    });

    it('normalizeDataHealthThumbnail trả về null nếu cả hai đều rỗng, KHÔNG tạo URL /null/ hay /undefined/', () => {
      expect(normalizeDataHealthThumbnail(null, null)).toBeNull();
      expect(normalizeDataHealthThumbnail(undefined, undefined)).toBeNull();
      expect(normalizeDataHealthThumbnail('', 'null')).toBeNull();
    });
  });

  // 13. Wave 3.14 — Hardening hàm tính toán độ mới trước dữ liệu ngày lỗi (NaN)
  describe('Bảo vệ tính toán độ mới trước chuỗi ngày lỗi', () => {
    it('computeChannelFreshness với ngày không hợp lệ -> ném lỗi Thời gian quét kênh không hợp lệ.', () => {
      expect(() => computeChannelFreshness('malformed-date-string', baseTimeMs)).toThrow(
        'Thời gian quét kênh không hợp lệ.'
      );
    });

    it('computeVideoFreshness với ngày không hợp lệ -> ném lỗi Thời gian snapshot video không hợp lệ.', () => {
      expect(() => computeVideoFreshness('malformed-date-string', baseTimeMs)).toThrow(
        'Thời gian snapshot video không hợp lệ.'
      );
    });

    it('computeChannelFreshness với null hoặc undefined -> trả về never (Chưa quét)', () => {
      expect(computeChannelFreshness(null, baseTimeMs).category).toBe('never');
      expect(computeChannelFreshness(undefined, baseTimeMs).category).toBe('never');
    });

    it('computeVideoFreshness với null hoặc undefined -> trả về never (Chưa có snapshot)', () => {
      expect(computeVideoFreshness(null, baseTimeMs).category).toBe('never');
      expect(computeVideoFreshness(undefined, baseTimeMs).category).toBe('never');
    });

    it('formatDuration với ngày không hợp lệ -> —', () => {
      expect(formatDuration('bad-start', 'bad-end', 'success')).toBe('—');
    });

    it('formatRelativeTime với ngày không hợp lệ -> —', () => {
      expect(formatRelativeTime('bad-iso-date', baseTimeMs)).toBe('—');
    });
  });

  // 14. Wave 3.14 — Validation mapScanRow
  describe('Kiểm tra hợp lệ dữ liệu phiên quét (mapScanRow)', () => {
    it('started_at thiếu hoặc null -> ném lỗi', () => {
      expect(() => mapScanRow(null, baseTimeMs)).toThrow('Thời gian bắt đầu quét không hợp lệ');
      expect(() => mapScanRow({}, baseTimeMs)).toThrow('Thời gian bắt đầu quét không hợp lệ');
      expect(() => mapScanRow({ started_at: null }, baseTimeMs)).toThrow('Thời gian bắt đầu quét không hợp lệ');
    });

    it('started_at không hợp lệ (NaN) -> ném lỗi', () => {
      expect(() => mapScanRow({ started_at: 'invalid-date' }, baseTimeMs)).toThrow('Thời gian bắt đầu quét không hợp lệ');
    });

    it('finished_at không hợp lệ (NaN) -> ném lỗi', () => {
      expect(() => mapScanRow({
        started_at: '2026-09-18T10:00:00Z',
        finished_at: 'invalid-finish',
      }, baseTimeMs)).toThrow('Thời gian kết thúc quét không hợp lệ');
    });

    it('started_at hợp lệ và finished_at null -> map thành công ở trạng thái đang chạy', () => {
      const row = {
        id: 'scan-run-1',
        started_at: '2026-09-18T10:00:00Z',
        finished_at: null,
        status: 'running',
        trigger_source: 'schedule',
        channels_total: 5,
        channels_success: 4,
        channels_failed: 0,
        videos_found: 25,
        snapshots_created: 25,
        alerts_sent: 2,
        alerts_failed: 0,
        error_summary: null,
      };
      const res = mapScanRow(row, baseTimeMs);
      expect(res.id).toBe('scan-run-1');
      expect(res.status).toBe('running');
      expect(res.durationText).toBe('Đang chạy');
      expect(res.channelsTotal).toBe(5);
    });
  });

  // 15. Wave 3.14 — Helper thuần lọc video cần cập nhật (selectStaleVideos)
  describe('Helper thuần lọc video cần cập nhật (selectStaleVideos)', () => {
    const makeVideo = (id: string, category: 'never' | 'stale' | 'warning' | 'fresh', snapshotAt: string | null): VideoFreshness => ({
      id,
      title: `Video ${id}`,
      thumbnailUrl: null,
      youtubeVideoId: id,
      channelId: 'ch-1',
      channelName: 'Channel 1',
      latestSnapshotAt: snapshotAt,
      latestViewCount: 1000,
      latestMeasuredVph: 100,
      freshnessCategory: category,
      freshnessLabel: VIDEO_FRESHNESS_LABELS[category] || category,
      relativeSnapshotTime: snapshotAt ? '1 giờ trước' : 'Chưa có dữ liệu',
    });

    it('never và stale được chọn; warning và fresh BỊ LOẠI', () => {
      const list = [
        makeVideo('v-fresh', 'fresh', new Date(baseTimeMs - 30 * 60 * 1000).toISOString()),
        makeVideo('v-warning', 'warning', new Date(baseTimeMs - 100 * 60 * 1000).toISOString()),
        makeVideo('v-stale', 'stale', new Date(baseTimeMs - 180 * 60 * 1000).toISOString()),
        makeVideo('v-never', 'never', null),
      ];

      const res = selectStaleVideos(list, 20);
      expect(res.total).toBe(2);
      expect(res.items.map(i => i.id)).toEqual(['v-never', 'v-stale']);
    });

    it('Cắt đúng limit nhưng total giữ nguyên tổng số stale candidates', () => {
      const list: VideoFreshness[] = [];
      for (let i = 0; i < 25; i++) {
        list.push(makeVideo(`v-stale-${i}`, 'stale', new Date(baseTimeMs - (200 + i) * 60 * 1000).toISOString()));
      }
      const res = selectStaleVideos(list, 10);
      expect(res.total).toBe(25);
      expect(res.items).toHaveLength(10);
    });

    it('Sắp xếp đúng: never lên đầu, sau đó đến stale cũ nhất trước', () => {
      const list = [
        makeVideo('v-stale-recent', 'stale', new Date(baseTimeMs - 150 * 60 * 1000).toISOString()),
        makeVideo('v-stale-oldest', 'stale', new Date(baseTimeMs - 300 * 60 * 1000).toISOString()),
        makeVideo('v-never-1', 'never', null),
        makeVideo('v-never-2', 'never', null),
      ];
      const res = selectStaleVideos(list, 20);
      expect(res.items[0].freshnessCategory).toBe('never');
      expect(res.items[1].freshnessCategory).toBe('never');
      expect(res.items[2].id).toBe('v-stale-oldest');
      expect(res.items[3].id).toBe('v-stale-recent');
    });
  });

  // 16. Wave 3.14 — Static Icon Audit Test
  describe('Static AppIcon Audit cho Data Operations Observatory', () => {
    it('Mọi AppIcon trong DataHealthPage và components/data-health/ đều hợp lệ trong AppIcon.vue', () => {
      const appIconPath = path.resolve(__dirname, '../src/components/ui/AppIcon.vue');
      const appIconContent = fs.readFileSync(appIconPath, 'utf-8');

      const componentFiles = [
        path.resolve(__dirname, '../src/pages/DataHealthPage.vue'),
        path.resolve(__dirname, '../src/components/data-health/DataHealthAlertMonitoring.vue'),
        path.resolve(__dirname, '../src/components/data-health/DataHealthChannelFreshness.vue'),
        path.resolve(__dirname, '../src/components/data-health/DataHealthScanOperations.vue'),
        path.resolve(__dirname, '../src/components/data-health/DataHealthStatusBanner.vue'),
        path.resolve(__dirname, '../src/components/data-health/DataHealthTelemetryRail.vue'),
        path.resolve(__dirname, '../src/components/data-health/DataHealthVideoFreshness.vue'),
      ];

      const testedIcons: string[] = [];
      const iconPattern = /<AppIcon[^>]*\bname="([^"]+)"/g;

      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = iconPattern.exec(content)) !== null) {
          const iconName = match[1];
          testedIcons.push(iconName);
          expect(appIconContent).toContain(`'${iconName}'`);
        }
      }
      expect(testedIcons.length).toBeGreaterThan(0);
      expect(testedIcons).not.toContain('users');
      expect(testedIcons).not.toContain('chevron-right');
    });
  });

  // 17. Wave 3.14 — Mock Supabase & fetchDataHealthSummary (12 Scenarios)
  describe('Mock Supabase & fetchDataHealthSummary (12 Scenarios)', () => {
    function buildMockSupabase(overrides: {
      scans?: { data?: any; error?: any };
      latestSchedule?: { data?: any; error?: any };
      channels?: { data?: any; error?: any };
      videos?: { data?: any; error?: any };
      alerts?: { data?: any; error?: any };
    } = {}) {
      return {
        from: (table: string) => {
          let isScheduleFilter = false;
          let limitVal = 0;
          const chain: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              if (col === 'trigger_source' && val === 'schedule') {
                isScheduleFilter = true;
              }
              return chain;
            }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockImplementation((n: number) => {
              limitVal = n;
              return chain;
            }),
            then: (resolve: any) => {
              if (table === 'scan_runs') {
                if (isScheduleFilter || limitVal === 1) {
                  return Promise.resolve(overrides.latestSchedule || { data: [], error: null }).then(resolve);
                }
                return Promise.resolve(overrides.scans || { data: [], error: null }).then(resolve);
              }
              if (table === 'channels') {
                return Promise.resolve(overrides.channels || { data: [], error: null }).then(resolve);
              }
              if (table === 'videos') {
                return Promise.resolve(overrides.videos || { data: [], error: null }).then(resolve);
              }
              if (table === 'video_alerts') {
                return Promise.resolve(overrides.alerts || { data: [], error: null }).then(resolve);
              }
              return Promise.resolve({ data: [], error: null }).then(resolve);
            },
          };
          return chain;
        },
      };
    }

    beforeEach(() => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    // 1. Channels query error
    it('1. Lỗi query channels -> ném lỗi factual rõ ràng', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({ channels: { error: { message: 'Connection timeout' } } }) as any
      );
      await expect(dataHealthService.fetchDataHealthSummary()).rejects.toThrow('Lỗi tải danh sách kênh: Connection timeout');
    });

    // 2. Scans query error
    it('2. Lỗi query scans -> ném lỗi factual rõ ràng', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({ scans: { error: { message: 'Permission denied' } } }) as any
      );
      await expect(dataHealthService.fetchDataHealthSummary()).rejects.toThrow('Lỗi tải lịch sử quét: Permission denied');
    });

    // 3. Videos query error
    it('3. Lỗi query videos -> ném lỗi factual rõ ràng', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({ videos: { error: { message: 'Table not found' } } }) as any
      );
      await expect(dataHealthService.fetchDataHealthSummary()).rejects.toThrow('Lỗi tải danh sách video: Table not found');
    });

    // 4. Alerts query error
    it('4. Lỗi query alerts -> ném lỗi factual rõ ràng', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({ alerts: { error: { message: 'Network reset' } } }) as any
      );
      await expect(dataHealthService.fetchDataHealthSummary()).rejects.toThrow('Lỗi tải tình trạng cảnh báo: Network reset');
    });

    // 5. Latest scan running -> systemStatus.code === 'running'
    it('5. Latest scan running -> systemStatus.code === running', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({
          scans: {
            data: [{
              id: 's1',
              started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              finished_at: null,
              status: 'running',
              trigger_source: 'schedule',
            }],
          },
        }) as any
      );
      const summary = await dataHealthService.fetchDataHealthSummary();
      expect(summary.systemStatus.code).toBe('running');
    });

    // 6. Latest scan failed -> systemStatus.code === 'needs_check'
    it('6. Latest scan failed -> systemStatus.code === needs_check', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({
          scans: {
            data: [{
              id: 's1',
              started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              finished_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
              status: 'failed',
              trigger_source: 'schedule',
            }],
          },
        }) as any
      );
      const summary = await dataHealthService.fetchDataHealthSummary();
      expect(summary.systemStatus.code).toBe('needs_check');
    });

    // 7. Latest scan partial -> systemStatus.code === 'partial_error'
    it('7. Latest scan partial -> systemStatus.code === partial_error', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({
          scans: {
            data: [{
              id: 's1',
              started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              finished_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
              status: 'partial',
              trigger_source: 'schedule',
            }],
          },
        }) as any
      );
      const summary = await dataHealthService.fetchDataHealthSummary();
      expect(summary.systemStatus.code).toBe('partial_error');
    });

    // 8. Latest scan success but > 2h ago -> systemStatus.code === 'slow_update'
    it('8. Latest scan success nhưng > 2h trước -> systemStatus.code === slow_update', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({
          scans: {
            data: [{
              id: 's1',
              started_at: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
              finished_at: new Date(Date.now() - 149 * 60 * 1000).toISOString(),
              status: 'success',
              trigger_source: 'schedule',
            }],
          },
        }) as any
      );
      const summary = await dataHealthService.fetchDataHealthSummary();
      expect(summary.systemStatus.code).toBe('slow_update');
    });

    // 9. Latest scan success within 2h -> systemStatus.code === 'normal'
    it('9. Latest scan success trong vòng 2h -> systemStatus.code === normal', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({
          scans: {
            data: [{
              id: 's1',
              started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              finished_at: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
              status: 'success',
              trigger_source: 'schedule',
            }],
          },
        }) as any
      );
      const summary = await dataHealthService.fetchDataHealthSummary();
      expect(summary.systemStatus.code).toBe('normal');
    });

    // 10. Video freshness correctly mapped
    it('10. Danh sách video và độ mới snapshot được map chuẩn xác', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({
          videos: {
            data: [
              {
                id: 'v1',
                title: 'Test Video',
                thumbnail_url: null,
                youtube_video_id: 'yt123',
                channel_id: 'ch1',
                latest_view_count: 5000,
                latest_measured_vph: 500,
                latest_snapshot_checked_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
                channels: { name: 'Kênh Test' },
              },
            ],
          },
        }) as any
      );
      const summary = await dataHealthService.fetchDataHealthSummary();
      expect(summary.activeVideosCount).toBe(1);
      expect(summary.staleVideosCount).toBe(0);
    });

    // 11. Channels need attention count matches stale + never
    it('11. channelsNeedAttentionCount tính đúng số lượng kênh stale và never', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({
          channels: {
            data: [
              { id: 'ch1', name: 'Fresh', last_scan_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
              { id: 'ch2', name: 'Never', last_scan_at: null },
              { id: 'ch3', name: 'Stale', last_scan_at: new Date(Date.now() - 180 * 60 * 1000).toISOString() },
            ],
          },
        }) as any
      );
      const summary = await dataHealthService.fetchDataHealthSummary();
      expect(summary.channelsNeedAttentionCount).toBe(2);
    });

    // 12. Failed alerts count & list mapped correctly
    it('12. failedAlertsCount và failedAlerts list được xử lý và khử độc lỗi bảo mật', async () => {
      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(
        buildMockSupabase({
          alerts: {
            data: [
              {
                id: 'a1',
                video_id: 'v1',
                status: 'failed',
                measured_vph: 1500,
                attempts: 3,
                last_error: 'Failed to webhook: https://discord.com/api/webhooks/123/secret_token_123',
                updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                videos: { title: 'Vid 1', channel_id: 'ch1', channels: { name: 'Ch 1' } },
              },
              {
                id: 'a2',
                video_id: 'v2',
                status: 'sending',
                measured_vph: 1000,
                attempts: 1,
                last_error: null,
                updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
                videos: { title: 'Vid 2', channel_id: 'ch1', channels: { name: 'Ch 1' } },
              },
            ],
          },
        }) as any
      );
      const summary = await dataHealthService.fetchDataHealthSummary();
      expect(summary.failedAlertsCount).toBe(1);
      expect(summary.alertSummary.stuckSendingCount).toBe(1);
      expect(summary.alertSummary.failedAlerts[0].sanitizedError).not.toContain('secret_token_123');
      expect(summary.alertSummary.failedAlerts[0].sanitizedError).toContain('[URL Webhook ẩn]');
    });
  });

  // 18. Wave 3.14 — Component & Page UX Edge Cases
  describe('Component & Page UX Edge Cases', () => {
    const defaultMountOptions = {
      global: {
        stubs: {
          'router-link': true,
          Teleport: true,
        },
      },
    };

    describe('DataHealthAlertMonitoring empty states', () => {
      it('total === 0 -> Hiển thị "Chưa có bản ghi cảnh báo nào trong phạm vi dữ liệu đã tải."', () => {
        const wrapper = mount(DataHealthAlertMonitoring, {
          ...defaultMountOptions,
          props: {
            summary: {
              total: 0,
              sampleLimit: 100,
              sampleSize: 0,
              sent: 0,
              pending: 0,
              sending: 0,
              failed: 0,
              stuckSendingCount: 0,
              failedAlerts: [],
            },
          },
        });
        expect(wrapper.text()).toContain('Chưa có bản ghi cảnh báo nào trong phạm vi dữ liệu đã tải.');
      });

      it('total > 0 && failed === 0 -> Hiển thị "Không có cảnh báo thất bại trong các bản ghi đã tải."', () => {
        const wrapper = mount(DataHealthAlertMonitoring, {
          ...defaultMountOptions,
          props: {
            summary: {
              total: 5,
              sampleLimit: 100,
              sampleSize: 5,
              sent: 5,
              pending: 0,
              sending: 0,
              failed: 0,
              stuckSendingCount: 0,
              failedAlerts: [],
            },
          },
        });
        expect(wrapper.text()).toContain('Không có cảnh báo thất bại trong các bản ghi đã tải.');
      });

      it('stuckSendingCount > 0 -> Hiển thị câu factual chính xác về các bản ghi đủ điều kiện', () => {
        const wrapper = mount(DataHealthAlertMonitoring, {
          ...defaultMountOptions,
          props: {
            summary: {
              total: 5,
              sampleLimit: 100,
              sampleSize: 5,
              sent: 3,
              pending: 0,
              sending: 2,
              failed: 0,
              stuckSendingCount: 2,
              failedAlerts: [],
            },
          },
        });
        expect(wrapper.text()).toContain('Có 2 cảnh báo ở trạng thái gửi lâu hơn 15 phút. Các bản ghi đủ điều kiện sẽ được xử lý lại ở phiên thu thập tiếp theo.');
      });
    });

    describe('DataHealthPage Race Protection & Refresh Warning & Modals', () => {
      const mockSummaryA: DataHealthSummary = {
        systemStatus: { code: 'normal', label: 'Hoạt động bình thường', tone: 'success', description: 'OK', isStuckRunning: false },
        latestScan: null,
        latestScheduledScan: null,
        channelsNeedAttentionCount: 0,
        staleVideosCount: 0,
        activeVideosCount: 5,
        failedAlertsCount: 0,
        channels: [],
        staleVideos: [],
        alertSummary: { total: 0, sampleLimit: 100, sampleSize: 0, sent: 0, pending: 0, sending: 0, failed: 0, stuckSendingCount: 0, failedAlerts: [] },
        recentScans: [],
        lastFetchedAt: '12:00:00',
      };

      beforeEach(() => {
        vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('Refresh thất bại giữ nguyên summary cũ và hiển thị warning banner', async () => {
        let fetchCallCount = 0;
        vi.spyOn(dataHealthService, 'fetchDataHealthSummary').mockImplementation(async () => {
          fetchCallCount++;
          if (fetchCallCount === 1) {
            return mockSummaryA;
          }
          throw new Error('Network timeout during refresh');
        });

        const wrapper = mount(DataHealthPage, defaultMountOptions);
        await flushPromises();

        expect(wrapper.find('.observatory-body').exists()).toBe(true);
        expect(wrapper.find('.refresh-warning-band').exists()).toBe(false);

        const refreshBtn = wrapper.find('button.btn-refresh');
        await refreshBtn.trigger('click');
        await flushPromises();

        expect(wrapper.find('.observatory-body').exists()).toBe(true);
        const warningBand = wrapper.find('.refresh-warning-band');
        expect(warningBand.exists()).toBe(true);
        expect(warningBand.text()).toContain('Không thể làm mới dữ liệu. Đang hiển thị lần tải thành công gần nhất.');
        expect(warningBand.text()).toContain('Network timeout during refresh');
      });

      it('Lần tải đầu tiên thất bại -> render ErrorState toàn màn hình', async () => {
        vi.spyOn(dataHealthService, 'fetchDataHealthSummary').mockRejectedValue(new Error('Initial fetch failed'));
        const wrapper = mount(DataHealthPage, defaultMountOptions);
        await flushPromises();

        expect(wrapper.find('.observatory-body').exists()).toBe(false);
        expect(wrapper.text()).toContain('Không thể kết nối dữ liệu quan sát');
        expect(wrapper.text()).toContain('Initial fetch failed');
      });

      it('PageHeader kicker hiển thị đúng chuẩn DATA OPERATIONS OBSERVATORY', async () => {
        vi.spyOn(dataHealthService, 'fetchDataHealthSummary').mockResolvedValue(mockSummaryA);
        const wrapper = mount(DataHealthPage, defaultMountOptions);
        await flushPromises();
        expect(wrapper.text()).toContain('DATA OPERATIONS OBSERVATORY');
      });

      it('Refresh race: Request A bắt đầu trước nhưng trả về sau request B thì request B thắng và summary là B', async () => {
        const mockSummaryB: DataHealthSummary = {
          ...mockSummaryA,
          lastFetchedAt: '12:05:00',
          activeVideosCount: 99,
        };

        let resolveA: (val: any) => void;
        let resolveB: (val: any) => void;

        let callIdx = 0;
        vi.spyOn(dataHealthService, 'fetchDataHealthSummary').mockImplementation(() => {
          callIdx++;
          if (callIdx === 1) {
            return new Promise(res => { resolveA = res; });
          } else {
            return new Promise(res => { resolveB = res; });
          }
        });

        const wrapper = mount(DataHealthPage, defaultMountOptions);

        // Call B while A is still pending
        (wrapper.vm as any).loadData();

        // Now B resolves first
        resolveB!(mockSummaryB);
        await flushPromises();

        expect(wrapper.find('.observatory-body').exists()).toBe(true);
        expect(wrapper.text()).toContain('12:05:00');

        // Now A resolves late
        resolveA!(mockSummaryA);
        await flushPromises();

        // Summary remains B!
        expect(wrapper.text()).toContain('12:05:00');
        expect(wrapper.text()).not.toContain('12:00:00');
      });

      it('Visibility change không kích hoạt refresh khi đang bận tải (loading is true)', async () => {
        let callCount = 0;
        vi.spyOn(dataHealthService, 'fetchDataHealthSummary').mockImplementation(async () => {
          callCount++;
          return mockSummaryA;
        });

        const wrapper = mount(DataHealthPage, defaultMountOptions);
        expect(callCount).toBe(1);

        // Set loading = true and simulate visibility change
        (wrapper.vm as any).loading = true;
        (wrapper.vm as any).handleVisibilityChange();
        expect(callCount).toBe(1); // Not called again!

        // When loading is false, visibility change calls loadData
        (wrapper.vm as any).loading = false;
        (wrapper.vm as any).handleVisibilityChange();
        expect(callCount).toBe(2);
      });

      it('Mở modal lỗi scan và discord alert render đúng qua AppModal và chỉ hiển thị thông báo đã khử độc', async () => {
        const secretUrl = 'https://discord.com/api/webhooks/123/my_super_secret_token';
        const sanitized = sanitizeErrorSummary(`Webhook error: ${secretUrl}`);

        vi.spyOn(dataHealthService, 'fetchDataHealthSummary').mockResolvedValue({
          ...mockSummaryA,
          recentScans: [
            {
              id: 'scan-err',
              startedAt: '2026-09-18T10:00:00Z',
              finishedAt: '2026-09-18T10:01:00Z',
              status: 'failed',
              statusLabel: 'Thất bại',
              triggerSource: 'schedule',
              triggerLabel: 'Tự động',
              channelsTotal: 1,
              channelsSuccess: 0,
              channelsFailed: 1,
              videosFound: 0,
              snapshotsCreated: 0,
              alertsSent: 0,
              alertsFailed: 1,
              sanitizedError: sanitized,
              durationText: '1 phút',
              relativeTime: '10 phút trước',
            },
          ],
        });

        const wrapper = mount(DataHealthPage, defaultMountOptions);
        await flushPromises();

        // Trigger openScanError
        (wrapper.vm as any).openScanError((wrapper.vm as any).summary.recentScans[0]);
        await flushPromises();

        expect(wrapper.text()).toContain('Chi Tiết Lỗi Lần Quét');
        expect(wrapper.text()).toContain(sanitized);
        expect(wrapper.text()).not.toContain('my_super_secret_token');

        // Close scan error
        (wrapper.vm as any).closeScanError();
        await flushPromises();

        // Trigger openAlertError
        (wrapper.vm as any).openAlertError({
          id: 'alert-err',
          videoId: 'v-1',
          videoTitle: 'Test Video',
          channelName: 'Test Channel',
          measuredVph: 1200,
          attempts: 3,
          updatedAt: '2026-09-18T10:00:00Z',
          sanitizedError: sanitized,
        });
        await flushPromises();

        expect(wrapper.text()).toContain('Chi Tiết Lỗi Gửi Cảnh Báo Discord');
        expect(wrapper.text()).toContain(sanitized);
        expect(wrapper.text()).not.toContain('my_super_secret_token');
      });
    });
  });
});
