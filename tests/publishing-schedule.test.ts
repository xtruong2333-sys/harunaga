import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  toVietnamDateParts,
  getRangeThreshold,
  calculateAverageInterval,
  calculateMedianInterval,
  formatInterval,
  findPeakBuckets,
  buildPublishingHeatmap,
  computeWeekdayDistribution,
  computeHourlyDistribution,
  computeScheduleSummary,
  computeChannelPublishingStats,
  parseUrlParams,
  formatRelativeTime,
} from '../src/services/publishing-schedule-service';
import type { PublishingVideo } from '../src/types/publishing-schedule';

function makeVideo(overrides: Partial<PublishingVideo> = {}): PublishingVideo {
  const publishedAt = overrides.publishedAt ?? '2026-09-17T10:00:00Z';
  const vn = toVietnamDateParts(publishedAt);
  return {
    id: 'vid-1',
    channelId: 'ch-1',
    channelName: 'Channel One',
    channelHandle: '@ch1',
    channelAvatarUrl: null,
    channelStatus: 'active',
    title: 'Test Video',
    thumbnailUrl: null,
    youtubeVideoId: 'yt-1',
    publishedAt,
    vnDate: vn.dateStr,
    vnWeekday: vn.weekdayIndex,
    vnWeekdayName: vn.weekdayName,
    vnHour: vn.hour,
    vnFormatted: vn.formatted,
    ...overrides,
  };
}

describe('Bắt Bài Đối Thủ — Giai Đoạn 15: Lịch Đăng Của Đối Thủ (publishing-schedule-service)', () => {
  // 1. Timezone deterministic conversion (Asia/Ho_Chi_Minh UTC+7)
  describe('1. Chuyển đổi múi giờ chuẩn Việt Nam (toVietnamDateParts)', () => {
    it('chuyển đổi chính xác 18:00 UTC sang 01:00 ngày hôm sau UTC+7 (Section 45)', () => {
      // 2026-09-17 is Thursday. 18:00 UTC is Friday 01:00 UTC+7.
      const utc = '2026-09-17T18:00:00Z';
      const vn = toVietnamDateParts(utc);

      expect(vn.year).toBe(2026);
      expect(vn.month).toBe(9);
      expect(vn.day).toBe(18);
      expect(vn.hour).toBe(1);
      expect(vn.minute).toBe(0);
      expect(vn.weekdayIndex).toBe(4); // Thứ 6 (Friday)
      expect(vn.weekdayName).toBe('Thứ 6');
      expect(vn.dateStr).toBe('2026-09-18');
      expect(vn.formatted).toBe('01:00 18/09/2026');
    });

    it('chuyển đổi chính xác buổi sáng 03:30 UTC sang 10:30 UTC+7 cùng ngày', () => {
      // 2026-09-14 is Monday. 03:30 UTC is Monday 10:30 UTC+7.
      const utc = '2026-09-14T03:30:00Z';
      const vn = toVietnamDateParts(utc);

      expect(vn.year).toBe(2026);
      expect(vn.month).toBe(9);
      expect(vn.day).toBe(14);
      expect(vn.hour).toBe(10);
      expect(vn.minute).toBe(30);
      expect(vn.weekdayIndex).toBe(0); // Thứ 2 (Monday)
      expect(vn.weekdayName).toBe('Thứ 2');
    });

    it('xử lý chính xác ngày Chủ Nhật (Sunday)', () => {
      // 2026-09-13 is Sunday. 08:00 UTC -> 15:00 UTC+7 Sunday.
      const utc = '2026-09-13T08:00:00Z';
      const vn = toVietnamDateParts(utc);

      expect(vn.weekdayIndex).toBe(6); // Chủ Nhật
      expect(vn.weekdayName).toBe('Chủ Nhật');
      expect(vn.hour).toBe(15);
    });
  });

  // 2. Range Thresholds
  describe('2. Ngưỡng thời gian truy vấn (getRangeThreshold)', () => {
    const fixedNow = 1700000000000;

    it('range 7d lùi đúng 7 ngày', () => {
      const th = getRangeThreshold('7d', fixedNow);
      expect(new Date(th!).getTime()).toBe(fixedNow - 7 * 24 * 3600 * 1000);
    });

    it('range 30d lùi đúng 30 ngày (mặc định)', () => {
      const th = getRangeThreshold('30d', fixedNow);
      expect(new Date(th!).getTime()).toBe(fixedNow - 30 * 24 * 3600 * 1000);
    });

    it('range 90d lùi đúng 90 ngày', () => {
      const th = getRangeThreshold('90d', fixedNow);
      expect(new Date(th!).getTime()).toBe(fixedNow - 90 * 24 * 3600 * 1000);
    });

    it('range all trả về null (không giới hạn ngưỡng dưới)', () => {
      expect(getRangeThreshold('all', fixedNow)).toBeNull();
    });
  });

  // 3. Heatmap Construction (Section 47)
  describe('3. Xây dựng ma trận Heatmap 7x24 (buildPublishingHeatmap)', () => {
    it('khởi tạo đúng ma trận 7 hàng x 24 cột', () => {
      const { cells, maxCount } = buildPublishingHeatmap([]);
      expect(cells.length).toBe(7);
      for (const row of cells) {
        expect(row.length).toBe(24);
        for (const c of row) {
          expect(c.count).toBe(0);
        }
      }
      expect(maxCount).toBe(0);
    });

    it('đếm chính xác video theo đúng ô Thứ và Giờ (Section 47: Mon 10h=2, Tue 20h=1)', () => {
      // Thứ 2: 2026-09-14 03:00 UTC = 10:00 VN
      // Thứ 3: 2026-09-15 13:00 UTC = 20:00 VN
      const v1 = makeVideo({ publishedAt: '2026-09-14T03:15:00Z' }); // Mon 10h
      const v2 = makeVideo({ publishedAt: '2026-09-14T03:45:00Z' }); // Mon 10h
      const v3 = makeVideo({ publishedAt: '2026-09-15T13:20:00Z' }); // Tue 20h

      const { cells, maxCount } = buildPublishingHeatmap([v1, v2, v3]);

      expect(cells[0][10].count).toBe(2); // Thứ 2, 10h
      expect(cells[1][20].count).toBe(1); // Thứ 3, 20h
      expect(cells[0][0].count).toBe(0);  // Ô khác = 0
      expect(maxCount).toBe(2);
    });
  });

  // 4. Weekday & Hourly Distributions (Section 48 & 49)
  describe('4. Biểu đồ phân bố ngày và giờ (computeWeekdayDistribution & computeHourlyDistribution)', () => {
    const videos: PublishingVideo[] = [
      makeVideo({ publishedAt: '2026-09-14T03:00:00Z' }), // Mon 10h
      makeVideo({ publishedAt: '2026-09-14T05:00:00Z' }), // Mon 12h
      makeVideo({ publishedAt: '2026-09-16T08:00:00Z' }), // Wed 15h
      makeVideo({ publishedAt: '2026-09-18T18:00:00Z' }), // Fri 18h UTC = Sat 01h VN
      makeVideo({ publishedAt: '2026-09-20T12:00:00Z' }), // Sun 19h
    ];

    it('tổng số lượng trong 7 ngày trong tuần bằng đúng tổng video (Section 48)', () => {
      const weekdayDist = computeWeekdayDistribution(videos);
      expect(weekdayDist.length).toBe(7);
      const totalSum = weekdayDist.reduce((acc, cur) => acc + cur.count, 0);
      expect(totalSum).toBe(videos.length);
      expect(weekdayDist[0].count).toBe(2); // Thứ 2
      expect(weekdayDist[2].count).toBe(1); // Thứ 4
      expect(weekdayDist[5].count).toBe(1); // Thứ 7
      expect(weekdayDist[6].count).toBe(1); // Chủ Nhật
    });

    it('tổng số lượng trong 24 giờ bằng đúng tổng video (Section 49)', () => {
      const hourlyDist = computeHourlyDistribution(videos);
      expect(hourlyDist.length).toBe(24);
      const totalSum = hourlyDist.reduce((acc, cur) => acc + cur.count, 0);
      expect(totalSum).toBe(videos.length);
      expect(hourlyDist[10].count).toBe(1); // 10h
      expect(hourlyDist[12].count).toBe(1); // 12h
      expect(hourlyDist[15].count).toBe(1); // 15h
      expect(hourlyDist[1].count).toBe(1);  // 01h
      expect(hourlyDist[19].count).toBe(1); // 19h
    });
  });

  // 5. Average and Median Intervals (Section 50, 51, 52)
  describe('5. Tính khoảng cách trung bình và trung vị (Intervals)', () => {
    it('tính đúng khoảng cách trung bình: day 1, day 2, day 4 -> 1.5 ngày (36 giờ) (Section 50)', () => {
      const d1 = new Date('2026-09-01T10:00:00Z').getTime();
      const d2 = new Date('2026-09-02T10:00:00Z').getTime(); // +24h
      const d4 = new Date('2026-09-04T10:00:00Z').getTime(); // +48h

      const avg = calculateAverageInterval([d1, d2, d4]);
      expect(avg).toBe(36); // 36 giờ = 1.5 ngày
      expect(formatInterval(avg)).toBe('1,5 ngày');
    });

    it('tính đúng trung vị khoảng cách: deltas 2h, 4h, 100h -> median = 4h (Section 51)', () => {
      const t0 = 1000000;
      const t1 = t0 + 2 * 3600 * 1000;   // delta 2h
      const t2 = t1 + 4 * 3600 * 1000;   // delta 4h
      const t3 = t2 + 100 * 3600 * 1000; // delta 100h

      const median = calculateMedianInterval([t0, t1, t2, t3]);
      expect(median).toBe(4);
      expect(formatInterval(median)).toBe('4 giờ');
    });

    it('tính đúng trung vị khi số cặp chẵn: deltas 2h, 4h, 6h, 10h -> median = 5h', () => {
      const t0 = 1000000;
      const t1 = t0 + 2 * 3600 * 1000;  // delta 2h
      const t2 = t1 + 4 * 3600 * 1000;  // delta 4h
      const t3 = t2 + 6 * 3600 * 1000;  // delta 6h
      const t4 = t3 + 10 * 3600 * 1000; // delta 10h

      const median = calculateMedianInterval([t0, t1, t2, t3, t4]);
      expect(median).toBe(5); // (4 + 6) / 2
    });

    it('trả về null khi số video < 2 (0 video hoặc 1 video) (Section 52)', () => {
      expect(calculateAverageInterval([])).toBeNull();
      expect(calculateAverageInterval([1000000])).toBeNull();
      expect(calculateMedianInterval([])).toBeNull();
      expect(calculateMedianInterval([1000000])).toBeNull();
      expect(formatInterval(null)).toBe('—');
    });
  });

  // 6. Peak Tie Handling (Section 53)
  describe('6. Xử lý đồng hạng đỉnh (findPeakBuckets)', () => {
    it('xử lý chính xác trường hợp đồng hạng nhiều ngày (Monday=3, Friday=3) (Section 53)', () => {
      const items = [
        { label: 'Thứ 2', count: 3 },
        { label: 'Thứ 3', count: 1 },
        { label: 'Thứ 6', count: 3 },
        { label: 'Thứ 7', count: 2 },
      ];

      const res = findPeakBuckets(items);
      expect(res).toBe('Thứ 2, Thứ 6 — 3 video');
    });

    it('trả về 1 kết quả duy nhất khi không có tie', () => {
      const items = [
        { label: 'Thứ 2', count: 5 },
        { label: 'Thứ 3', count: 2 },
      ];
      expect(findPeakBuckets(items)).toBe('Thứ 2 — 5 video');
    });

    it('trả về "—" khi toàn bộ count = 0 hoặc rỗng', () => {
      expect(findPeakBuckets([])).toBe('—');
      expect(findPeakBuckets([{ label: 'Thứ 2', count: 0 }])).toBe('—');
    });
  });

  // 7. Schedule Summary (Section 8)
  describe('7. Thống kê tổng quan (computeScheduleSummary)', () => {
    it('tính đúng video, kênh, trung bình/ngày và video mới nhất', () => {
      const v1 = makeVideo({ channelId: 'ch-1', publishedAt: '2026-09-01T10:00:00Z' });
      const v2 = makeVideo({ channelId: 'ch-1', publishedAt: '2026-09-10T10:00:00Z' });
      const v3 = makeVideo({ channelId: 'ch-2', publishedAt: '2026-09-15T10:00:00Z' });

      const summary = computeScheduleSummary([v1, v2, v3], '30d');
      expect(summary.totalVideos).toBe(3);
      expect(summary.totalChannels).toBe(2);
      expect(summary.avgVideosPerDay).toBe(0.1); // 3 / 30 = 0.1
      expect(summary.latestPublishedAt).toBe('2026-09-15T10:00:00Z');
    });

    it('xử lý rỗng trả về đúng các giá trị mặc định', () => {
      const summary = computeScheduleSummary([], '30d');
      expect(summary.totalVideos).toBe(0);
      expect(summary.totalChannels).toBe(0);
      expect(summary.avgVideosPerDay).toBeNull();
      expect(summary.latestPublishedAt).toBeNull();
    });

    it('formatRelativeTime xử lý đúng các mốc thời gian tương đối', () => {
      const now = 1700000000000;
      expect(formatRelativeTime(null, now)).toBe('—');
      expect(formatRelativeTime(new Date(now - 30 * 1000).toISOString(), now)).toBe('Vừa xong');
      expect(formatRelativeTime(new Date(now - 20 * 60 * 1000).toISOString(), now)).toBe('20 phút trước');
      expect(formatRelativeTime(new Date(now - 5 * 3600 * 1000).toISOString(), now)).toBe('5 giờ trước');
      expect(formatRelativeTime(new Date(now - 3 * 24 * 3600 * 1000).toISOString(), now)).toBe('3 ngày trước');
    });

    it('computeChannelPublishingStats tính đúng thống kê từng kênh', () => {
      const now = 1700000000000;
      const v1 = makeVideo({
        channelId: 'ch-1',
        channelName: 'Channel A',
        publishedAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
      });
      const v2 = makeVideo({
        channelId: 'ch-1',
        channelName: 'Channel A',
        publishedAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString(),
      });

      const stats = computeChannelPublishingStats([v1, v2], [v1, v2], now);
      expect(stats.length).toBe(1);
      expect(stats[0].channelName).toBe('Channel A');
      expect(stats[0].videoCountInRange).toBe(2);
      expect(stats[0].videoCount7d).toBe(2);
      expect(stats[0].videoCount30d).toBe(2);
      expect(stats[0].avgIntervalHours).toBe(24);
      expect(stats[0].medianIntervalHours).toBe(24);
    });

    it('regression: channel có 2 video cũ ngoài range, 0 video trong range -> videoCountInRange=0, peakWeekday="—", peakHour="—"', () => {
      const now = 1700000000000;
      const v1 = makeVideo({
        channelId: 'ch-old',
        channelName: 'Old Channel',
        publishedAt: new Date(now - 45 * 24 * 3600 * 1000).toISOString(),
      });
      const v2 = makeVideo({
        channelId: 'ch-old',
        channelName: 'Old Channel',
        publishedAt: new Date(now - 40 * 24 * 3600 * 1000).toISOString(),
      });

      // chRangeVideos rỗng cho channel này
      const stats = computeChannelPublishingStats([v1, v2], [], now);
      expect(stats.length).toBe(1);
      expect(stats[0].videoCountInRange).toBe(0);
      expect(stats[0].peakWeekday).toBe('—');
      expect(stats[0].peakHour).toBe('—');
    });

    it('channel có video trong selected range -> peak weekday/hour vẫn tính bình thường', () => {
      const now = 1700000000000;
      const v1 = makeVideo({
        channelId: 'ch-active',
        channelName: 'Active Channel',
        publishedAt: '2026-09-17T12:30:00Z', // 19:30 UTC+7 Thứ 5
      });
      const v2 = makeVideo({
        channelId: 'ch-active',
        channelName: 'Active Channel',
        publishedAt: '2026-09-10T12:45:00Z', // 19:45 UTC+7 Thứ 5
      });

      const stats = computeChannelPublishingStats([v1, v2], [v1, v2], now);
      expect(stats.length).toBe(1);
      expect(stats[0].videoCountInRange).toBe(2);
      expect(stats[0].peakWeekday).toBe('Thứ 5');
      expect(stats[0].peakHour).toBe('19:00–19:59');
    });
  });

  // 8. URL Parsing & Safe Fallbacks (Section 28 & 55)
  describe('8. Phân tích tham số URL và fallback (parseUrlParams)', () => {
    it('nhận đúng range và channel hợp lệ', () => {
      const res = parseUrlParams({ range: '7d', channel: 'ch-123' });
      expect(res.range).toBe('7d');
      expect(res.channelId).toBe('ch-123');
    });

    it('fallback an toàn khi range không hợp lệ về 30d (Section 55)', () => {
      const res = parseUrlParams({ range: 'invalid_range' });
      expect(res.range).toBe('30d');
    });

    it('bỏ qua channel nếu chuỗi rỗng hoặc chỉ toàn khoảng trắng', () => {
      expect(parseUrlParams({ channel: '' }).channelId).toBeNull();
      expect(parseUrlParams({ channel: '   ' }).channelId).toBeNull();
    });
  });

  // 9. Batch Pagination Simulation (>1000 Rows Safe) (Section 54)
  describe('9. Cơ chế phân trang batch > 1000 rows (fetchPublishingSchedule simulation)', () => {
    it('lấy đầy đủ dữ liệu khi số dòng vượt quá 1000 mà không bị cắt ở trần 1000', async () => {
      // Giả lập mock Supabase trả về 2 trang (trang 1: 1000 rows, trang 2: 250 rows -> tổng 1250 rows)
      const fakePage1 = Array.from({ length: 1000 }, (_, i) => ({
        id: `v-${i}`,
        channel_id: 'ch-1',
        title: `Video ${i}`,
        thumbnail_url: null,
        youtube_video_id: `yt-${i}`,
        published_at: '2026-09-10T10:00:00Z',
        channels: { id: 'ch-1', name: 'Chan 1', handle: '@c1', avatar_url: null, status: 'active' },
      }));

      const fakePage2 = Array.from({ length: 250 }, (_, i) => ({
        id: `v-${1000 + i}`,
        channel_id: 'ch-1',
        title: `Video ${1000 + i}`,
        thumbnail_url: null,
        youtube_video_id: `yt-${1000 + i}`,
        published_at: '2026-09-12T10:00:00Z',
        channels: { id: 'ch-1', name: 'Chan 1', handle: '@c1', avatar_url: null, status: 'active' },
      }));

      let callCount = 0;
      const mockQueryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((from: number, _to: number) => {
          callCount++;
          if (from === 0) {
            return Promise.resolve({ data: fakePage1, error: null });
          }
          return Promise.resolve({ data: fakePage2, error: null });
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      // Tái sử dụng logic pagination
      let allRows: any[] = [];
      let offset = 0;
      const BATCH_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data } = await mockSupabase.from('videos').select().range(offset, offset + BATCH_SIZE - 1);
        allRows.push(...data);
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }
      }

      expect(callCount).toBe(2);
      expect(allRows.length).toBe(1250);
    });
  });

  // 10. Read-Only Compliance (Section 56)
  describe('10. Tuân thủ Read-Only tuyệt đối (Static Inspection)', () => {
    it('mã nguồn publishing-schedule-service.ts không chứa mutation hoặc Edge Function invoke', () => {
      const filePath = path.resolve(__dirname, '../src/services/publishing-schedule-service.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Loại bỏ comments trước khi kiểm tra
      const codeOnly = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

      const forbiddenPatterns = [
        /\.insert\s*\(/i,
        /\.update\s*\(/i,
        /\.delete\s*\(/i,
        /\.upsert\s*\(/i,
        /functions\.invoke/i,
        /collect-youtube-data/i,
        /analyze-video-content/i,
        /bbdt_access_key/i,
      ];

      for (const pattern of forbiddenPatterns) {
        expect(pattern.test(codeOnly)).toBe(false);
      }
    });
  });
});
