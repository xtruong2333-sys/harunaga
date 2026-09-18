import { describe, it, expect } from 'vitest';
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
} from '../src/services/data-health-service';
import type {
  DataHealthScan,
  ChannelFreshness,
  VideoFreshness,
  AlertHealthSummary,
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
    it('computeChannelFreshness với ngày không hợp lệ -> never (Chưa quét)', () => {
      const res = computeChannelFreshness('malformed-date-string', baseTimeMs);
      expect(res.category).toBe('never');
      expect(res.label).toBe('Chưa quét');
    });

    it('computeVideoFreshness với ngày không hợp lệ -> never (Chưa có snapshot)', () => {
      const res = computeVideoFreshness('malformed-date-string', baseTimeMs);
      expect(res.category).toBe('never');
      expect(res.label).toBe('Chưa có snapshot');
    });

    it('formatDuration với ngày không hợp lệ -> —', () => {
      expect(formatDuration('bad-start', 'bad-end', 'success')).toBe('—');
    });

    it('formatRelativeTime với ngày không hợp lệ -> —', () => {
      expect(formatRelativeTime('bad-iso-date', baseTimeMs)).toBe('—');
    });
  });

  // 14. Wave 3.14 — Lọc ứng viên Video Cần Cập Nhật (Stale Candidates Only)
  describe('Lọc ứng viên Video Cần Cập Nhật', () => {
    it('Chỉ đưa video stale hoặc never vào danh sách stale candidates, không lẫn fresh/warning', () => {
      const mockVideos: VideoFreshness[] = [
        {
          id: 'v-1',
          title: 'Video Fresh',
          thumbnailUrl: null,
          youtubeVideoId: 'yt1',
          channelId: 'ch1',
          channelName: 'Channel 1',
          latestSnapshotAt: new Date(baseTimeMs - 20 * 60 * 1000).toISOString(),
          latestViewCount: 100,
          latestMeasuredVph: 10,
          freshnessCategory: 'fresh',
          freshnessLabel: 'Mới cập nhật',
          relativeSnapshotTime: '20 phút trước',
        },
        {
          id: 'v-2',
          title: 'Video Warning',
          thumbnailUrl: null,
          youtubeVideoId: 'yt2',
          channelId: 'ch1',
          channelName: 'Channel 1',
          latestSnapshotAt: new Date(baseTimeMs - 100 * 60 * 1000).toISOString(),
          latestViewCount: 200,
          latestMeasuredVph: 20,
          freshnessCategory: 'warning',
          freshnessLabel: 'Chậm cập nhật',
          relativeSnapshotTime: '100 phút trước',
        },
        {
          id: 'v-3',
          title: 'Video Never',
          thumbnailUrl: null,
          youtubeVideoId: 'yt3',
          channelId: 'ch1',
          channelName: 'Channel 1',
          latestSnapshotAt: null,
          latestViewCount: null,
          latestMeasuredVph: null,
          freshnessCategory: 'never',
          freshnessLabel: 'Chưa có snapshot',
          relativeSnapshotTime: 'Chưa có dữ liệu',
        },
        {
          id: 'v-4',
          title: 'Video Stale',
          thumbnailUrl: null,
          youtubeVideoId: 'yt4',
          channelId: 'ch1',
          channelName: 'Channel 1',
          latestSnapshotAt: new Date(baseTimeMs - 180 * 60 * 1000).toISOString(),
          latestViewCount: 400,
          latestMeasuredVph: 40,
          freshnessCategory: 'stale',
          freshnessLabel: 'Cần chú ý',
          relativeSnapshotTime: '3 giờ trước',
        },
      ];

      const staleCandidates = mockVideos.filter(
        v => v.freshnessCategory === 'never' || v.freshnessCategory === 'stale'
      );

      expect(staleCandidates).toHaveLength(2);
      expect(staleCandidates.map(v => v.id)).toEqual(['v-3', 'v-4']);
    });
  });
});
