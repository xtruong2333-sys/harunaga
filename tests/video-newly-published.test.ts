import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  getPublishedThreshold,
  formatVideoAge,
  getFreshBadge,
  formatMeasuredVph,
  formatViewDelta,
  mapAlertStatus,
  calculateFirstObservedMinutes,
  computeNewVideoSummary,
  filterNewVideos,
  sortNewVideos,
  parseUrlParams,
} from '../src/services/new-videos-service';
import type { NewVideoItem, NewVideoFilter } from '../src/types/new-videos';

function makeVideo(overrides: Partial<NewVideoItem> = {}): NewVideoItem {
  return {
    id: 'vid-1',
    youtubeVideoId: 'yt-1',
    title: 'Video Title Test',
    thumbnailUrl: 'https://i.ytimg.com/vi/yt-1/hqdefault.jpg',
    publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    channelId: 'ch-1',
    channelName: 'Channel One',
    channelHandle: '@channelone',
    channelAvatarUrl: null,
    latestViewCount: 1000,
    latestMeasuredVph: 500,
    latestViewDelta: 100,
    latestSnapshotCheckedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    firstSnapshotCheckedAt: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    firstObservedMinutesAfterPublish: 20,
    alertStatus: 'none',
    hasAlert: false,
    ...overrides,
  };
}

describe('Bắt Bài Đối Thủ — Giai Đoạn 14: Video Mới Đăng (new-videos-service)', () => {
  // 1. Time Range Thresholds
  describe('1. Ngưỡng thời gian xuất bản (getPublishedThreshold)', () => {
    const fixedNow = 1700000000000; // Fixed timestamp

    it('tính chính xác mốc 6 giờ trước', () => {
      const threshold = getPublishedThreshold('6h', fixedNow);
      expect(new Date(threshold).getTime()).toBe(fixedNow - 6 * 3600 * 1000);
    });

    it('tính chính xác mốc 12 giờ trước', () => {
      const threshold = getPublishedThreshold('12h', fixedNow);
      expect(new Date(threshold).getTime()).toBe(fixedNow - 12 * 3600 * 1000);
    });

    it('tính chính xác mốc 24 giờ trước (mặc định)', () => {
      const threshold = getPublishedThreshold('24h', fixedNow);
      expect(new Date(threshold).getTime()).toBe(fixedNow - 24 * 3600 * 1000);
    });

    it('tính chính xác mốc 3 ngày trước', () => {
      const threshold = getPublishedThreshold('3d', fixedNow);
      expect(new Date(threshold).getTime()).toBe(fixedNow - 3 * 24 * 3600 * 1000);
    });

    it('tính chính xác mốc 7 ngày trước', () => {
      const threshold = getPublishedThreshold('7d', fixedNow);
      expect(new Date(threshold).getTime()).toBe(fixedNow - 7 * 24 * 3600 * 1000);
    });
  });

  // 2. Video Age & Fresh Badges
  describe('2. Tuổi video và Huy hiệu factual (formatVideoAge & getFreshBadge)', () => {
    const fixedNow = 1700000000000;

    it('formatVideoAge: hiển thị "Vừa xong" khi < 1 phút', () => {
      const pub = new Date(fixedNow - 30 * 1000).toISOString();
      expect(formatVideoAge(pub, fixedNow)).toBe('Vừa xong');
    });

    it('formatVideoAge: hiển thị phút trước khi < 1 giờ', () => {
      const pub = new Date(fixedNow - 25 * 60 * 1000).toISOString();
      expect(formatVideoAge(pub, fixedNow)).toBe('25 phút trước');
    });

    it('formatVideoAge: hiển thị giờ trước khi < 24 giờ', () => {
      const pub = new Date(fixedNow - 5 * 3600 * 1000).toISOString();
      expect(formatVideoAge(pub, fixedNow)).toBe('5 giờ trước');
    });

    it('formatVideoAge: hiển thị ngày trước khi >= 24 giờ', () => {
      const pub = new Date(fixedNow - 48 * 3600 * 1000).toISOString();
      expect(formatVideoAge(pub, fixedNow)).toBe('2 ngày trước');
    });

    it('getFreshBadge: tuổi <= 1 giờ nhận badge "Vừa đăng"', () => {
      const pub = new Date(fixedNow - 45 * 60 * 1000).toISOString();
      expect(getFreshBadge(pub, fixedNow)).toBe('Vừa đăng');
    });

    it('getFreshBadge: 1h < tuổi <= 6h nhận badge "Mới < 6 giờ"', () => {
      const pub = new Date(fixedNow - 3 * 3600 * 1000).toISOString();
      expect(getFreshBadge(pub, fixedNow)).toBe('Mới < 6 giờ');
    });

    it('getFreshBadge: tuổi > 6h không có badge (null)', () => {
      const pub = new Date(fixedNow - 7 * 3600 * 1000).toISOString();
      expect(getFreshBadge(pub, fixedNow)).toBeNull();
    });

    it('getFreshBadge: TUYỆT ĐỐI không dùng các từ cảm tính như Hot, Viral, Bùng nổ', () => {
      const forbidden = ['hot', 'viral', 'bùng nổ', 'bung no'];
      const badge1 = (getFreshBadge(new Date(fixedNow - 30 * 60 * 1000).toISOString(), fixedNow) || '').toLowerCase();
      const badge2 = (getFreshBadge(new Date(fixedNow - 4 * 3600 * 1000).toISOString(), fixedNow) || '').toLowerCase();
      for (const word of forbidden) {
        expect(badge1).not.toContain(word);
        expect(badge2).not.toContain(word);
      }
    });
  });

  // 3. Measured VPH Formatting & Distinction
  describe('3. Định dạng VPH đo được (formatMeasuredVph)', () => {
    it('khi NULL hoặc undefined: hiển thị "Chưa đủ dữ liệu", không giả mạo 0', () => {
      expect(formatMeasuredVph(null)).toBe('Chưa đủ dữ liệu');
      expect(formatMeasuredVph(undefined)).toBe('Chưa đủ dữ liệu');
      expect(formatMeasuredVph(null)).not.toBe('0 VPH');
    });

    it('khi = 0: hiển thị "0 VPH" (đã đo nhưng không tăng)', () => {
      expect(formatMeasuredVph(0)).toBe('0 VPH');
    });

    it('khi > 0: hiển thị kèm hậu tố VPH và định dạng số', () => {
      expect(formatMeasuredVph(1500)).toBe('1.500 VPH');
      expect(formatMeasuredVph(25)).toBe('25 VPH');
    });
  });

  // 4. View Delta Formatting
  describe('4. Định dạng tăng ở lần đo gần nhất (formatViewDelta)', () => {
    it('khi NULL hoặc undefined: hiển thị "—"', () => {
      expect(formatViewDelta(null)).toBe('—');
      expect(formatViewDelta(undefined)).toBe('—');
    });

    it('khi > 0: hiển thị dấu cộng phía trước (+X)', () => {
      expect(formatViewDelta(250)).toBe('+250');
      expect(formatViewDelta(10000)).toBe('+10.000');
    });

    it('khi = 0: hiển thị "0"', () => {
      expect(formatViewDelta(0)).toBe('0');
    });
  });

  // 5. Alert Status Mapping
  describe('5. Ánh xạ trạng thái cảnh báo (mapAlertStatus)', () => {
    it('ánh xạ đúng các trạng thái cảnh báo theo quy định', () => {
      expect(mapAlertStatus('pending')).toBe('Chờ gửi');
      expect(mapAlertStatus('sending')).toBe('Đang gửi');
      expect(mapAlertStatus('sent')).toBe('Đã cảnh báo');
      expect(mapAlertStatus('failed')).toBe('Gửi lỗi');
      expect(mapAlertStatus('none')).toBe('Chưa cảnh báo');
      expect(mapAlertStatus(null)).toBe('Chưa cảnh báo');
    });
  });

  // 6. First Observation Calculation
  describe('6. Tính thời gian bắt đầu theo dõi sau khi đăng (calculateFirstObservedMinutes)', () => {
    it('tính đúng số phút chênh lệch giữa first snapshot và publishedAt', () => {
      const pub = '2026-09-17T10:00:00Z';
      const snap = '2026-09-17T10:35:00Z';
      expect(calculateFirstObservedMinutes(pub, snap)).toBe(35);
    });

    it('trả về null nếu thiếu dữ liệu hoặc thời gian âm', () => {
      expect(calculateFirstObservedMinutes('2026-09-17T10:00:00Z', null)).toBeNull();
      // Snap xảy ra trước khi đăng (dữ liệu sai lệch)
      expect(calculateFirstObservedMinutes('2026-09-17T10:00:00Z', '2026-09-17T09:00:00Z')).toBeNull();
    });
  });

  // 7. Summary Cards Calculation (Section 53 requirement)
  describe('7. Tính toán 4 thẻ thống kê tổng quan (computeNewVideoSummary)', () => {
    it('tính đúng cho bộ dữ liệu 5 video, 3 kênh, 2 VPH >0, 1 VPH =0, 2 VPH null', () => {
      const dataset: NewVideoItem[] = [
        makeVideo({ id: 'v1', channelId: 'ch-1', latestMeasuredVph: 1200 }), // rising
        makeVideo({ id: 'v2', channelId: 'ch-1', latestMeasuredVph: 3500 }), // rising (max)
        makeVideo({ id: 'v3', channelId: 'ch-2', latestMeasuredVph: 0 }),    // not rising
        makeVideo({ id: 'v4', channelId: 'ch-3', latestMeasuredVph: null }), // unmeasured
        makeVideo({ id: 'v5', channelId: 'ch-2', latestMeasuredVph: null }), // unmeasured
      ];

      const summary = computeNewVideoSummary(dataset);
      expect(summary.totalVideos).toBe(5);
      expect(summary.totalChannels).toBe(3);
      expect(summary.risingVideos).toBe(2);
      expect(summary.maxVph).toBe(3500);
    });

    it('khi tất cả video đều chưa có VPH đo được: maxVph là null, không fake 0', () => {
      const dataset: NewVideoItem[] = [
        makeVideo({ id: 'v1', channelId: 'ch-1', latestMeasuredVph: null }),
        makeVideo({ id: 'v2', channelId: 'ch-2', latestMeasuredVph: null }),
      ];

      const summary = computeNewVideoSummary(dataset);
      expect(summary.totalVideos).toBe(2);
      expect(summary.totalChannels).toBe(2);
      expect(summary.risingVideos).toBe(0);
      expect(summary.maxVph).toBeNull();
    });
  });

  // 8. Filtering Logic (Status, Channel, Search)
  describe('8. Bộ lọc video (filterNewVideos)', () => {
    const dataset: NewVideoItem[] = [
      makeVideo({
        id: 'v1',
        title: 'Bí quyết nấu ăn đỉnh cao',
        channelId: 'ch-1',
        channelName: 'Bếp Nhà Tôi',
        channelHandle: '@bepnhatoi',
        latestMeasuredVph: 500,
        hasAlert: true,
      }),
      makeVideo({
        id: 'v2',
        title: 'Review công nghệ 2026',
        channelId: 'ch-2',
        channelName: 'Kênh Công Nghệ',
        channelHandle: '@techvn',
        latestMeasuredVph: 0,
        hasAlert: false,
      }),
      makeVideo({
        id: 'v3',
        title: 'Hướng dẫn làm game 3D',
        channelId: 'ch-1',
        channelName: 'Bếp Nhà Tôi',
        channelHandle: '@bepnhatoi',
        latestMeasuredVph: null,
        hasAlert: false,
      }),
    ];

    const baseFilter: NewVideoFilter = {
      range: '24h',
      channelId: null,
      status: 'all',
      sort: 'newest',
      search: '',
    };

    it('lọc trạng thái rising (VPH > 0)', () => {
      const res = filterNewVideos(dataset, { ...baseFilter, status: 'rising' });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('v1');
    });

    it('lọc trạng thái not_rising (VPH = 0)', () => {
      const res = filterNewVideos(dataset, { ...baseFilter, status: 'not_rising' });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('v2');
    });

    it('lọc trạng thái unmeasured (VPH null)', () => {
      const res = filterNewVideos(dataset, { ...baseFilter, status: 'unmeasured' });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('v3');
    });

    it('lọc trạng thái alerted (đã cảnh báo)', () => {
      const res = filterNewVideos(dataset, { ...baseFilter, status: 'alerted' });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('v1');
    });

    it('lọc theo kênh (channelId)', () => {
      const res = filterNewVideos(dataset, { ...baseFilter, channelId: 'ch-1' });
      expect(res.length).toBe(2);
      expect(res.map(v => v.id)).toEqual(['v1', 'v3']);
    });

    it('tìm kiếm theo tiêu đề video (không phân biệt hoa thường)', () => {
      const res = filterNewVideos(dataset, { ...baseFilter, search: 'nấu ăn' });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('v1');
    });

    it('tìm kiếm theo handle của kênh', () => {
      const res = filterNewVideos(dataset, { ...baseFilter, search: 'techvn' });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('v2');
    });
  });

  // 9. Sorting Logic & NULL Handling (Section 25 & 57)
  describe('9. Sắp xếp video & xử lý NULL ở cuối (sortNewVideos)', () => {
    const dataset: NewVideoItem[] = [
      makeVideo({
        id: 'v1',
        publishedAt: '2026-09-17T10:00:00Z',
        latestMeasuredVph: 200,
        latestViewCount: 5000,
        latestViewDelta: null,
      }),
      makeVideo({
        id: 'v2',
        publishedAt: '2026-09-17T12:00:00Z',
        latestMeasuredVph: null, // VPH null
        latestViewCount: 1000,
        latestViewDelta: 50,
      }),
      makeVideo({
        id: 'v3',
        publishedAt: '2026-09-17T08:00:00Z',
        latestMeasuredVph: 1500, // VPH cao nhất
        latestViewCount: 20000,
        latestViewDelta: 300,
      }),
    ];

    it('sort newest: mới đăng nhất lên đầu', () => {
      const res = sortNewVideos(dataset, 'newest');
      expect(res.map(v => v.id)).toEqual(['v2', 'v1', 'v3']);
    });

    it('sort vph_desc: VPH cao nhất lên đầu, NULL LUÔN XẾP CUỐI CÙNG', () => {
      const res = sortNewVideos(dataset, 'vph_desc');
      expect(res[0].id).toBe('v3'); // 1500
      expect(res[1].id).toBe('v1'); // 200
      expect(res[2].id).toBe('v2'); // null phải ở cuối
      expect(res[2].latestMeasuredVph).toBeNull();
    });

    it('sort views_desc: lượt xem cao nhất lên đầu', () => {
      const res = sortNewVideos(dataset, 'views_desc');
      expect(res.map(v => v.id)).toEqual(['v3', 'v1', 'v2']);
    });

    it('sort delta_desc: tăng nhiều nhất ở lần đo gần nhất, NULL XẾP CUỐI CÙNG', () => {
      const res = sortNewVideos(dataset, 'delta_desc');
      expect(res[0].id).toBe('v3'); // +300
      expect(res[1].id).toBe('v2'); // +50
      expect(res[2].id).toBe('v1'); // null phải ở cuối
      expect(res[2].latestViewDelta).toBeNull();
    });
  });

  // 10. URL Query Parsing & Safe Fallbacks (Section 27 & 59)
  describe('10. Phân tích tham số URL và fallback an toàn (parseUrlParams)', () => {
    it('nhận đúng các tham số hợp lệ', () => {
      const parsed = parseUrlParams({
        range: '12h',
        status: 'rising',
        sort: 'vph_desc',
        channel: 'ch-123',
        search: 'test query',
      });
      expect(parsed.range).toBe('12h');
      expect(parsed.status).toBe('rising');
      expect(parsed.sort).toBe('vph_desc');
      expect(parsed.channelId).toBe('ch-123');
      expect(parsed.search).toBe('test query');
    });

    it('fallback an toàn khi range không hợp lệ về 24h', () => {
      const parsed = parseUrlParams({ range: 'invalid_range' });
      expect(parsed.range).toBe('24h');
    });

    it('fallback an toàn khi status không hợp lệ về all', () => {
      const parsed = parseUrlParams({ status: 'fake_status' });
      expect(parsed.status).toBe('all');
    });

    it('fallback an toàn khi sort không hợp lệ về newest', () => {
      const parsed = parseUrlParams({ sort: 'unsupported_sort' });
      expect(parsed.sort).toBe('newest');
    });

    it('bỏ qua channel nếu rỗng hoặc không phải chuỗi', () => {
      expect(parseUrlParams({ channel: '' }).channelId).toBeNull();
      expect(parseUrlParams({ channel: '   ' }).channelId).toBeNull();
    });
  });

  // 11. Read-Only Compliance Check (Section 60)
  describe('11. Tuân thủ Read-Only tuyệt đối (Static Inspection)', () => {
    it('mã nguồn src/services/new-videos-service.ts không chứa mutation hay Edge Function invoke', () => {
      const filePath = path.resolve(__dirname, '../src/services/new-videos-service.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Các phương thức mutation bị cấm
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

      // Loại bỏ comments trước khi kiểm tra code thực thi
      const codeOnly = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

      for (const pattern of forbiddenPatterns) {
        expect(pattern.test(codeOnly)).toBe(false);
      }
    });
  });
});
