import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import {
  mapAlertStatus,
  calculateThresholdExcessRatio,
  formatThresholdExcess,
  formatDelta,
  checkSendingStuck,
  formatElapsedSeconds,
  getTimeFilterThreshold,
  sanitizeAlertError,
  computeAlertSummary,
  groupAlertsByVideo,
  filterAndSortAlerts,
  alertHistoryService,
} from '../src/services/alert-history-service';
import type { AlertHistoryItem } from '../src/types/alert-history';

import AlertStatusBadge from '../src/components/alert-history/AlertStatusBadge.vue';
import AlertSummaryStrip from '../src/components/alert-history/AlertSummaryStrip.vue';
import AlertTimeline from '../src/components/alert-history/AlertTimeline.vue';
import AlertTable from '../src/components/alert-history/AlertTable.vue';
import AlertVideoGroups from '../src/components/alert-history/AlertVideoGroups.vue';
import AlertFailedList from '../src/components/alert-history/AlertFailedList.vue';
import AlertDetailModal from '../src/components/alert-history/AlertDetailModal.vue';
import AlertHistoryPage from '../src/pages/AlertHistoryPage.vue';
import * as supabaseModule from '../src/services/supabase';

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<any>('vue-router');
  return {
    ...actual,
    useRoute: () => ({
      query: {},
      params: {},
    }),
    useRouter: () => ({
      replace: vi.fn().mockResolvedValue(true),
      push: vi.fn().mockResolvedValue(true),
    }),
  };
});

const routerLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
};

function makeItem(overrides: Partial<AlertHistoryItem> = {}): AlertHistoryItem {
  return {
    id: 'id-1',
    videoId: 'video-1',
    videoTitle: 'Test Video',
    videoYoutubeId: 'abc123',
    videoThumbnailUrl: null,
    channelId: 'ch-1',
    channelName: 'Test Channel',
    channelHandle: '@test',
    channelAvatarUrl: null,
    thresholdVph: 1000,
    measuredVph: 2000,
    viewCountAtAlert: 50000,
    viewDeltaAtAlert: 5000,
    elapsedSeconds: 3600,
    thresholdRatio: 2.0,
    thresholdExcessRatio: 1.0,
    currentVph: 1800,
    currentViewCount: 55000,
    status: 'sent',
    isSendingStuck: false,
    attempts: 1,
    discordMessageId: 'msg-1',
    sanitizedLastError: null,
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    sentAt: new Date(Date.now() - 3500 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3500 * 1000).toISOString(),
    ...overrides,
  };
}

describe('Wave 3.10 — ALERT OPERATIONS & SIGNAL HISTORY CENTER', () => {
  // 1. Status Wording Thống nhất (Section 13)
  describe('1. Chuẩn hoá trạng thái cảnh báo (mapAlertStatus)', () => {
    it('ánh xạ đúng 4 trạng thái chuẩn sang tiếng Việt', () => {
      expect(mapAlertStatus('sent')).toBe('Đã cảnh báo');
      expect(mapAlertStatus('pending')).toBe('Chờ gửi');
      expect(mapAlertStatus('sending')).toBe('Đang gửi');
      expect(mapAlertStatus('failed')).toBe('Gửi lỗi');
    });

    it('trả về nguyên bản khi gặp trạng thái không xác định', () => {
      expect(mapAlertStatus('unknown_status')).toBe('unknown_status');
    });
  });

  // 2. Threshold Excess Semantics (Section 10 & 11)
  describe('2. Tính toán và định dạng mức vượt ngưỡng (calculateThresholdExcessRatio & formatThresholdExcess)', () => {
    it('tính đúng tỷ lệ vượt ngưỡng: threshold=1000, measured=1200 -> +20%', () => {
      const ratio = calculateThresholdExcessRatio(1200, 1000);
      expect(ratio).toBeCloseTo(0.2);
      expect(formatThresholdExcess(ratio)).toBe('+20%');
    });

    it('tính đúng tỷ lệ khi bằng ngưỡng: threshold=1000, measured=1000 -> 0%', () => {
      const ratio = calculateThresholdExcessRatio(1000, 1000);
      expect(ratio).toBe(0);
      expect(formatThresholdExcess(ratio)).toBe('0%');
    });

    it('tính đúng tỷ lệ khi dưới ngưỡng (dữ liệu cũ bất thường): threshold=1000, measured=950 -> -5%', () => {
      const ratio = calculateThresholdExcessRatio(950, 1000);
      expect(ratio).toBeCloseTo(-0.05);
      expect(formatThresholdExcess(ratio)).toBe('-5%');
    });

    it('trả về null và định dạng "—" khi threshold <= 0 hoặc null', () => {
      expect(calculateThresholdExcessRatio(1200, 0)).toBeNull();
      expect(calculateThresholdExcessRatio(1200, -100)).toBeNull();
      expect(calculateThresholdExcessRatio(1200, null)).toBeNull();
      expect(calculateThresholdExcessRatio(null, 1000)).toBeNull();
      expect(formatThresholdExcess(null)).toBe('—');
    });
  });

  // 3. Delta Formatting (Section 12)
  describe('3. Định dạng biến động lượt xem (formatDelta)', () => {
    it('định dạng số dương kèm dấu cộng (+500)', () => {
      expect(formatDelta(500)).toBe('+500');
      expect(formatDelta(12500)).toBe('+12.500');
    });

    it('định dạng số 0 là "0"', () => {
      expect(formatDelta(0)).toBe('0');
    });

    it('định dạng số âm đúng dấu trừ (-500), không bị lỗi "+-500"', () => {
      expect(formatDelta(-500)).toBe('-500');
      expect(formatDelta(-2500)).toBe('-2.500');
    });

    it('định dạng null là "—"', () => {
      expect(formatDelta(null)).toBe('—');
      expect(formatDelta(undefined)).toBe('—');
    });
  });

  // 4. Stuck Sending Semantics (Section 14 & 15)
  describe('4. Nhận diện trạng thái gửi lâu (checkSendingStuck)', () => {
    const now = new Date('2026-09-18T10:00:00Z').getTime();

    it('trả về false cho trạng thái khác sending', () => {
      const oldTime = new Date(now - 30 * 60 * 1000).toISOString();
      expect(checkSendingStuck('sent', oldTime, now)).toBe(false);
      expect(checkSendingStuck('failed', oldTime, now)).toBe(false);
      expect(checkSendingStuck('pending', oldTime, now)).toBe(false);
    });

    it('trả về false khi sending nhưng cập nhật dưới 15 phút', () => {
      const recent = new Date(now - 10 * 60 * 1000).toISOString();
      expect(checkSendingStuck('sending', recent, now)).toBe(false);
    });

    it('trả về true khi sending và chưa cập nhật quá 15 phút (>15m)', () => {
      const oldTime = new Date(now - 20 * 60 * 1000).toISOString();
      expect(checkSendingStuck('sending', oldTime, now)).toBe(true);
    });

    it('không crash khi updatedAt là chuỗi ngày không hợp lệ hoặc null và trả về false', () => {
      expect(checkSendingStuck('sending', 'invalid-date-string', now)).toBe(false);
      expect(checkSendingStuck('sending', null, now)).toBe(false);
      expect(checkSendingStuck('sending', undefined, now)).toBe(false);
    });
  });

  // 5. Elapsed Seconds Formatting
  describe('5. Định dạng thời gian đo (formatElapsedSeconds)', () => {
    it('định dạng null trả về "—"', () => {
      expect(formatElapsedSeconds(null)).toBe('—');
    });
    it('định dạng giây < 60', () => {
      expect(formatElapsedSeconds(45)).toBe('45s');
    });
    it('định dạng phút tròn', () => {
      expect(formatElapsedSeconds(120)).toBe('2m');
    });
    it('định dạng phút và giây kết hợp', () => {
      expect(formatElapsedSeconds(90)).toBe('1m 30s');
    });
  });

  // 6. Time Filter Threshold Deterministic (Section 42)
  describe('6. Ngưỡng thời gian lọc có tính tất định (getTimeFilterThreshold)', () => {
    const fixedNow = new Date('2026-09-18T12:00:00.000Z').getTime();

    it('trả về null cho range "all"', () => {
      expect(getTimeFilterThreshold('all', fixedNow)).toBeNull();
    });

    it('tính chính xác mốc 24h trước', () => {
      const res = getTimeFilterThreshold('24h', fixedNow);
      expect(res).toBe('2026-09-17T12:00:00.000Z');
    });

    it('tính chính xác mốc 7d trước', () => {
      const res = getTimeFilterThreshold('7d', fixedNow);
      expect(res).toBe('2026-09-11T12:00:00.000Z');
    });

    it('tính chính xác mốc 30d trước', () => {
      const res = getTimeFilterThreshold('30d', fixedNow);
      expect(res).toBe('2026-08-19T12:00:00.000Z');
    });
  });

  // 7. Error Sanitization (Section 34)
  describe('7. Làm sạch thông báo lỗi nhạy cảm (sanitizeAlertError)', () => {
    it('trả về null khi input là null', () => {
      expect(sanitizeAlertError(null)).toBeNull();
    });

    it('loại bỏ webhook URL Discord nhạy cảm', () => {
      const raw = 'Request error to https://discord.com/api/webhooks/12345/secret_token with code 500';
      const sanitized = sanitizeAlertError(raw);
      expect(sanitized).not.toContain('discord.com');
      expect(sanitized).not.toContain('secret_token');
    });

    it('giữ nguyên lỗi chung không chứa thông tin nhạy cảm', () => {
      expect(sanitizeAlertError('Network timeout while sending')).toBe('Network timeout while sending');
    });
  });

  // 8. Alert Summary Computation (Section 5 & 6)
  describe('8. Tổng hợp số liệu cảnh báo (computeAlertSummary)', () => {
    it('tổng hợp đúng số lượng từng nhóm trạng thái và số lượng gửi lâu', () => {
      const items = [
        makeItem({ id: '1', status: 'sent', isSendingStuck: false }),
        makeItem({ id: '2', status: 'sent', isSendingStuck: false }),
        makeItem({ id: '3', status: 'pending', isSendingStuck: false }),
        makeItem({ id: '4', status: 'sending', isSendingStuck: true }),
        makeItem({ id: '5', status: 'failed', isSendingStuck: false }),
      ];

      const summary = computeAlertSummary(items);
      expect(summary.total).toBe(5);
      expect(summary.sent).toBe(2);
      expect(summary.waiting).toBe(2); // 1 pending + 1 sending
      expect(summary.failed).toBe(1);
      expect(summary.stuckCount).toBe(1);
    });

    it('trả về toàn bộ 0 khi danh sách rỗng', () => {
      const summary = computeAlertSummary([]);
      expect(summary.total).toBe(0);
      expect(summary.sent).toBe(0);
      expect(summary.waiting).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.stuckCount).toBe(0);
    });
  });

  // 9. Group Alerts by Video (Section 20 & 58 & 63)
  describe('9. Nhóm cảnh báo theo Video (groupAlertsByVideo)', () => {
    it('tuân thủ schema anti-spam: nhóm mỗi video thành một card cảnh báo với alertCount = 1', () => {
      const a1 = makeItem({
        id: 'a-1',
        videoId: 'v-100',
        videoTitle: 'Video A',
        measuredVph: 1500,
        status: 'pending',
        createdAt: '2026-09-17T10:00:00Z',
      });
      const a2 = makeItem({
        id: 'a-2',
        videoId: 'v-200',
        videoTitle: 'Video B',
        measuredVph: 2500,
        status: 'sent',
        createdAt: '2026-09-17T11:00:00Z',
      });

      const groups = groupAlertsByVideo([a1, a2]);
      expect(groups).toHaveLength(2);
      expect(groups.every(g => g.alertCount === 1)).toBe(true);

      const groupA = groups.find(g => g.videoId === 'v-100')!;
      expect(groupA).toBeDefined();
      expect(groupA.alertCount).toBe(1);
      expect(groupA.latestAlertAt).toBe('2026-09-17T10:00:00Z');
      expect(groupA.latestStatus).toBe('pending');
      expect(groupA.maxMeasuredVph).toBe(1500);

      const groupB = groups.find(g => g.videoId === 'v-200')!;
      expect(groupB).toBeDefined();
      expect(groupB.alertCount).toBe(1);
      expect(groupB.latestAlertAt).toBe('2026-09-17T11:00:00Z');
      expect(groupB.latestStatus).toBe('sent');
      expect(groupB.maxMeasuredVph).toBe(2500);
    });

    it('xử lý an toàn khi VPH là null (maxMeasuredVph null-safe)', () => {
      const a1 = makeItem({
        id: 'a-1',
        videoId: 'v-null',
        measuredVph: null as any,
        createdAt: '2026-09-17T10:00:00Z',
      });

      const groups = groupAlertsByVideo([a1]);
      expect(groups[0].maxMeasuredVph).toBeNull();
    });
  });

  // 10. Filter and Sort (Section 22, 23, 44, 45)
  describe('10. Lọc và Sắp xếp cảnh báo (filterAndSortAlerts)', () => {
    const items = [
      makeItem({
        id: '1',
        videoId: 'vid-1',
        videoTitle: 'Hướng dẫn Three.js toàn tập',
        channelName: 'Học Làm Game',
        channelHandle: '@hocgame',
        channelId: 'ch-game',
        status: 'sent',
        measuredVph: 1500,
        viewCountAtAlert: 10000,
        attempts: 1,
        isSendingStuck: false,
        createdAt: '2026-09-17T08:00:00Z',
      }),
      makeItem({
        id: '2',
        videoId: 'vid-2',
        videoTitle: 'Review Game Hot 2026',
        channelName: 'Gamer Pro',
        channelHandle: '@gamerpro',
        channelId: 'ch-pro',
        status: 'failed',
        measuredVph: 3000,
        viewCountAtAlert: 50000,
        attempts: 3,
        isSendingStuck: false,
        createdAt: '2026-09-17T10:00:00Z',
      }),
      makeItem({
        id: '3',
        videoId: 'vid-3',
        videoTitle: 'Tin tức đối thủ',
        channelName: 'Học Làm Game',
        channelHandle: '@hocgame',
        channelId: 'ch-game',
        status: 'sending',
        measuredVph: 800,
        viewCountAtAlert: 5000,
        attempts: 1,
        isSendingStuck: true,
        createdAt: '2026-09-17T09:00:00Z',
      }),
    ];

    it('lọc theo status cụ thể', () => {
      const res = filterAndSortAlerts(
        items,
        { status: 'failed', range: 'all', channelId: null, search: '', videoId: null },
        'newest'
      );
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('2');
    });

    it('lọc theo stuckOnly (đang gửi lâu)', () => {
      const res = filterAndSortAlerts(
        items,
        { status: 'all', range: 'all', channelId: null, search: '', videoId: null, stuckOnly: true },
        'newest'
      );
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('3');
    });

    it('lọc theo channelId', () => {
      const res = filterAndSortAlerts(
        items,
        { status: 'all', range: 'all', channelId: 'ch-pro', search: '', videoId: null },
        'newest'
      );
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('2');
    });

    it('lọc theo videoId (deep link)', () => {
      const res = filterAndSortAlerts(
        items,
        { status: 'all', range: 'all', channelId: null, search: '', videoId: 'vid-1' },
        'newest'
      );
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('1');
    });

    it('tìm kiếm theo tiêu đề video, tên kênh hoặc handle', () => {
      const res1 = filterAndSortAlerts(
        items,
        { status: 'all', range: 'all', channelId: null, search: 'three.js', videoId: null },
        'newest'
      );
      expect(res1.length).toBe(1);
      expect(res1[0].id).toBe('1');

      const res2 = filterAndSortAlerts(
        items,
        { status: 'all', range: 'all', channelId: null, search: '@gamerpro', videoId: null },
        'newest'
      );
      expect(res2.length).toBe(1);
      expect(res2[0].id).toBe('2');
    });

    it('sắp xếp theo newest (timestamp so sánh an toàn)', () => {
      const res = filterAndSortAlerts(
        items,
        { status: 'all', range: 'all', channelId: null, search: '', videoId: null },
        'newest'
      );
      expect(res[0].id).toBe('2'); // 10:00
      expect(res[1].id).toBe('3'); // 09:00
      expect(res[2].id).toBe('1'); // 08:00
    });

    it('sắp xếp theo vph_desc', () => {
      const res = filterAndSortAlerts(
        items,
        { status: 'all', range: 'all', channelId: null, search: '', videoId: null },
        'vph_desc'
      );
      expect(res[0].measuredVph).toBe(3000);
      expect(res[2].measuredVph).toBe(800);
    });

    it('sắp xếp theo views_desc', () => {
      const res = filterAndSortAlerts(
        items,
        { status: 'all', range: 'all', channelId: null, search: '', videoId: null },
        'views_desc'
      );
      expect(res[0].viewCountAtAlert).toBe(50000);
    });

    it('sắp xếp theo attempts_desc', () => {
      const res = filterAndSortAlerts(
        items,
        { status: 'all', range: 'all', channelId: null, search: '', videoId: null },
        'attempts_desc'
      );
      expect(res[0].attempts).toBe(3);
    });
  });

  // 11. Pagination Batching > 1000 Rows Simulation (Section 7 & 8)
  describe('11. Phân trang batch lớn > 1000 dòng (fetchAllAlertHistory)', () => {
    it('lấy toàn bộ các batch mà không bị nghẽn ở trần 500 hay 1000', async () => {
      const fakePage1 = Array.from({ length: 1000 }, (_, i) => ({
        id: `a-${i}`,
        video_id: `v-${i}`,
        threshold_vph: 1000,
        measured_vph: 1500,
        view_count: 5000,
        view_delta: 200,
        elapsed_seconds: 3600,
        status: 'sent',
        attempts: 1,
        discord_message_id: 'd-1',
        last_error: null,
        created_at: '2026-09-17T10:00:00Z',
        sent_at: '2026-09-17T10:01:00Z',
        updated_at: '2026-09-17T10:01:00Z',
        videos: {
          id: `v-${i}`,
          title: `Video ${i}`,
          youtube_video_id: `yt-${i}`,
          thumbnail_url: null,
          latest_measured_vph: 1500,
          latest_view_count: 5200,
          channels: { id: 'ch-1', name: 'Chan 1', handle: '@c1', avatar_url: null },
        },
      }));

      const fakePage2 = Array.from({ length: 150 }, (_, i) => ({
        id: `a-${1000 + i}`,
        video_id: `v-${1000 + i}`,
        threshold_vph: 1000,
        measured_vph: 1800,
        view_count: 7000,
        view_delta: 300,
        elapsed_seconds: 3600,
        status: 'sent',
        attempts: 1,
        discord_message_id: 'd-2',
        last_error: null,
        created_at: '2026-09-16T10:00:00Z',
        sent_at: '2026-09-16T10:01:00Z',
        updated_at: '2026-09-16T10:01:00Z',
        videos: {
          id: `v-${1000 + i}`,
          title: `Video ${1000 + i}`,
          youtube_video_id: `yt-${1000 + i}`,
          thumbnail_url: null,
          latest_measured_vph: 1800,
          latest_view_count: 7300,
          channels: { id: 'ch-1', name: 'Chan 1', handle: '@c1', avatar_url: null },
        },
      }));

      const mockQueryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((from: number, _to: number) => {
          if (from === 0) return Promise.resolve({ data: fakePage1, error: null });
          return Promise.resolve({ data: fakePage2, error: null });
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      // Tái hiện logic fetchAll
      let allRows: any[] = [];
      let offset = 0;
      let hasMore = true;
      const batchSize = 1000;

      while (hasMore) {
        const { data } = await mockSupabase
          .from('video_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + batchSize - 1);

        allRows.push(...data);
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          offset += batchSize;
        }
      }

      expect(allRows.length).toBe(1150);
      expect(mockQueryBuilder.range).toHaveBeenCalledTimes(2);
    });
  });

  // 12. UI Components Tests
  describe('12. Kiểm thử giao diện các Component Wave 3.10', () => {
    it('12.1 AlertStatusBadge hiển thị đúng nhãn trạng thái và tag gửi lâu', () => {
      const w1 = mount(AlertStatusBadge, {
        props: { status: 'sent', isSendingStuck: false },
      });
      expect(w1.text()).toContain('Đã cảnh báo');

      const w2 = mount(AlertStatusBadge, {
        props: { status: 'sending', isSendingStuck: true },
      });
      expect(w2.text()).toContain('Đang gửi');
      expect(w2.text()).toContain('Đang gửi lâu');
      expect(w2.find('.stuck-badge').attributes('title')).toContain('hơn 15 phút');
    });

    it('12.2 AlertSummaryStrip hiển thị 4 thẻ chỉ số tổng quan và nhãn gửi lâu', () => {
      const summary = { total: 45, sent: 38, waiting: 5, failed: 2, stuckCount: 1 };
      const wrapper = mount(AlertSummaryStrip, {
        props: { summary, loading: false, hasActiveFilter: true },
      });

      expect(wrapper.text()).toContain('TỔNG CẢNH BÁO');
      expect(wrapper.text()).toContain('45');
      expect(wrapper.text()).toContain('ĐÃ CẢNH BÁO');
      expect(wrapper.text()).toContain('38');
      expect(wrapper.text()).toContain('CHỜ / ĐANG GỬI');
      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain('1 gửi lâu');
      expect(wrapper.text()).toContain('GỬI LỖI');
      expect(wrapper.text()).toContain('2');
      expect(wrapper.text()).toContain('Dữ liệu theo bộ lọc hiện tại');
    });

    it('12.3 AlertTimeline hiển thị nhóm theo ngày và các trường thông tin media-first', () => {
      const today = new Date().toISOString();
      const items = [
        makeItem({
          id: 't-1',
          videoTitle: 'Video Timeline Test',
          channelName: 'Channel XYZ',
          measuredVph: 1200,
          thresholdVph: 1000,
          thresholdExcessRatio: 0.2,
          createdAt: today,
        }),
      ];

      const wrapper = mount(AlertTimeline, {
        props: { items },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: {
              props: ['detailUrl', 'src', 'alt'],
              template: '<div class="vt-stub" :data-url="detailUrl"></div>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('HÔM NAY');
      expect(wrapper.text()).toContain('Video Timeline Test');
      expect(wrapper.text()).toContain('Channel XYZ');
      expect(wrapper.text()).toContain('1.200 VPH');
      expect(wrapper.text()).toContain('1.000 VPH');
      expect(wrapper.text()).toContain('+20%');
    });

    it('12.4 AlertTable hiển thị đầy đủ 11 cột và format delta chuẩn (+500, -500)', () => {
      const items = [
        makeItem({
          id: 'tbl-1',
          videoTitle: 'Table Video 1',
          measuredVph: 1500,
          thresholdVph: 1000,
          thresholdExcessRatio: 0.5,
          viewDeltaAtAlert: 500,
          viewCountAtAlert: 10000,
        }),
        makeItem({
          id: 'tbl-2',
          videoTitle: 'Table Video 2',
          measuredVph: 800,
          thresholdVph: 1000,
          thresholdExcessRatio: -0.2,
          viewDeltaAtAlert: -200,
          viewCountAtAlert: 5000,
        }),
      ];

      const wrapper = mount(AlertTable, {
        props: { items },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
          },
        },
      });

      expect(wrapper.text()).toContain('Table Video 1');
      expect(wrapper.text()).toContain('+50%');
      expect(wrapper.text()).toContain('+500');

      expect(wrapper.text()).toContain('Table Video 2');
      expect(wrapper.text()).toContain('-20%');
      expect(wrapper.text()).toContain('-200'); // không phải +-200
    });

    it('12.5 AlertFailedList chỉ hiển thị các alert có trạng thái failed và lỗi làm sạch', () => {
      const items = [
        makeItem({ id: 'f-1', status: 'sent', videoTitle: 'Good Video' }),
        makeItem({
          id: 'f-2',
          status: 'failed',
          videoTitle: 'Failed Video',
          sanitizedLastError: 'Discord API rate limit exceeded',
          attempts: 3,
        }),
      ];

      const wrapper = mount(AlertFailedList, {
        props: { items },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
          },
        },
      });

      expect(wrapper.text()).not.toContain('Good Video');
      expect(wrapper.text()).toContain('Failed Video');
      expect(wrapper.text()).toContain('Đã thử 3 lần');
      expect(wrapper.text()).toContain('Discord API rate limit exceeded');
    });

    it('12.6 AlertDetailModal hiển thị 2 mốc thời gian rõ ràng và hỗ trợ link nội bộ', () => {
      const item = makeItem({
        id: 'det-1',
        videoId: 'vid-det-123',
        videoTitle: 'Detailed Alert Title',
        channelId: 'ch-det-456',
        channelName: 'Detailed Channel',
        measuredVph: 1600,
        thresholdVph: 1000,
        thresholdExcessRatio: 0.6,
        currentVph: 1250,
        currentViewCount: 65000,
        discordMessageId: 'disc-msg-999',
        sanitizedLastError: 'Webhook timeout',
      });

      const wrapper = mount(AlertDetailModal, {
        props: { item },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
            AppModal: { template: '<div class="modal-stub"><slot /></div>' },
          },
        },
      });

      expect(wrapper.text()).toContain('DỮ LIỆU TẠI THỜI ĐIỂM CẢNH BÁO');
      expect(wrapper.text()).toContain('1.600 VPH');
      expect(wrapper.text()).toContain('+60%');

      expect(wrapper.text()).toContain('DỮ LIỆU HIỆN TẠI CỦA VIDEO');
      expect(wrapper.text()).toContain('1.250 VPH');
      expect(wrapper.text()).toContain('65.000');

      expect(wrapper.text()).toContain('disc-msg-999');
      expect(wrapper.text()).toContain('Webhook timeout');

      expect(wrapper.html()).toContain('/videos/vid-det-123');
      expect(wrapper.html()).toContain('/kenh-theo-doi/ch-det-456');
    });

    it('12.7 AlertHistoryPage gắn kết đầy đủ coordinator, PageHeader, ViewModeSwitcher và chuyển đổi view', async () => {
      vi.spyOn(alertHistoryService, 'fetchAllAlertHistory').mockResolvedValue([
        makeItem({ id: 'p-1', videoTitle: 'Page Test Video', channelName: 'Chan Page' }),
      ]);

      const wrapper = mount(AlertHistoryPage, {
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
          },
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Lịch Sử Cảnh Báo');
      expect(wrapper.text()).toContain('ALERT OPERATIONS & SIGNAL HISTORY');
      expect(wrapper.find('.alert-summary-strip').exists()).toBe(true);
      expect(wrapper.find('.view-mode-switcher').exists()).toBe(true);
      expect(wrapper.find('.alert-filter-bar').exists()).toBe(true);
      expect(wrapper.text()).toContain('Page Test Video');
    });
  });

  describe('13. Final fix Wave 3.10 Verification Tests', () => {
    it('13.1 ErrorState retry contract: nút Thử lại phát emit retry và gọi reload', async () => {
      let callCount = 0;
      vi.spyOn(alertHistoryService, 'fetchAllAlertHistory').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Supabase network error');
        }
        return [makeItem({ id: 'recovered-1', videoTitle: 'Recovered Video' })];
      });

      const wrapper = mount(AlertHistoryPage, {
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
          },
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Không thể tải lịch sử cảnh báo');
      expect(wrapper.text()).toContain('Supabase network error');
      const retryBtn = wrapper.find('.retry-btn');
      expect(retryBtn.exists()).toBe(true);

      await retryBtn.trigger('click');
      await flushPromises();

      expect(callCount).toBe(2);
      expect(wrapper.text()).not.toContain('Không thể tải lịch sử cảnh báo');
      expect(wrapper.text()).toContain('Recovered Video');
    });

    it('13.2 failed alert ở vị trí >50 vẫn xuất hiện trong Failed View sau khi view filtering', async () => {
      // 55 sent alerts followed by 5 failed alerts
      const items: AlertHistoryItem[] = [];
      for (let i = 0; i < 55; i++) {
        items.push(makeItem({ id: `sent-${i}`, videoId: `v-${i}`, status: 'sent', videoTitle: `Sent Video ${i}` }));
      }
      for (let i = 0; i < 5; i++) {
        items.push(makeItem({ id: `failed-${i}`, videoId: `vf-${i}`, status: 'failed', videoTitle: `Failed Video ${i}` }));
      }

      vi.spyOn(alertHistoryService, 'fetchAllAlertHistory').mockResolvedValue(items);

      const wrapper = mount(AlertHistoryPage, {
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
          },
        },
      });

      await flushPromises();

      // Switch to failed view
      (wrapper.vm as any).onViewModeChange('failed');
      await flushPromises();

      expect(wrapper.text()).toContain('Failed Video 0');
      expect(wrapper.text()).toContain('Failed Video 4');
      expect(wrapper.text()).not.toContain('Sent Video 0');
    });

    it('13.3 range filtering dùng actual timestamp milliseconds với timezone offset khác nhau', () => {
      // Threshold: 24h before 2026-09-18T12:00:00Z => 2026-09-17T12:00:00Z
      const testNowMs = new Date('2026-09-18T12:00:00Z').getTime();

      // Item A: 2026-09-17T08:00:00-05:00 => 2026-09-17T13:00:00Z (after threshold, valid)
      const itemA = makeItem({ id: 'a', createdAt: '2026-09-17T08:00:00-05:00' });

      // Item B: 2026-09-18T00:30:00+14:00 => 2026-09-17T10:30:00Z (before threshold, excluded)
      // Note: lexically "2026-09-18T00:30:00+14:00" > "2026-09-17T12:00:00.000Z", but in ms it is earlier!
      const itemB = makeItem({ id: 'b', createdAt: '2026-09-18T00:30:00+14:00' });

      // Item C: invalid timestamp => excluded
      const itemC = makeItem({ id: 'c', createdAt: 'invalid-date' });

      const filtered = filterAndSortAlerts(
        [itemA, itemB, itemC],
        { status: 'all', range: '24h', channelId: null, search: '', videoId: null },
        'newest',
        testNowMs
      );

      expect(filtered.map(i => i.id)).toEqual(['a']);
    });

    it('13.4 schema anti-spam semantics: hiển thị Cảnh báo ghi nhận, VPH đo được, Thời điểm cảnh báo', () => {
      const group = {
        videoId: 'vid-antispam',
        videoTitle: 'Single Alert Video',
        videoYoutubeId: 'yt-123',
        videoThumbnailUrl: 'https://example.com/thumb.jpg',
        channelId: 'ch-1',
        channelName: 'Antispam Channel',
        channelHandle: '@anti',
        alertCount: 1,
        latestAlertAt: '2026-09-18T10:00:00Z',
        latestStatus: 'sent' as const,
        maxMeasuredVph: 1500,
      };

      const wrapper = mount(AlertVideoGroups, {
        props: { groups: [group] },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
          },
        },
      });

      expect(wrapper.text()).toContain('Cảnh báo ghi nhận');
      expect(wrapper.text()).not.toContain('1 lần cảnh báo');
      expect(wrapper.text()).toContain('VPH đo được');
      expect(wrapper.text()).toContain('Thời điểm cảnh báo');
    });

    it('13.5 deterministic pagination gọi fetchAllAlertHistory qua Supabase mock với order created_at DESC và id DESC', async () => {
      vi.restoreAllMocks();

      const orderCalls: { col: string; opts: any }[] = [];
      const rangeCalls: { from: number; to: number }[] = [];

      const sampleRow = (id: string, createdAt: string) => ({
        id,
        video_id: `v-${id}`,
        threshold_vph: 1000,
        measured_vph: 1500,
        view_count: 20000,
        view_delta: 500,
        elapsed_seconds: 120,
        status: 'sent',
        attempts: 1,
        discord_message_id: 'd-1',
        last_error: null,
        created_at: createdAt,
        sent_at: createdAt,
        updated_at: createdAt,
        videos: {
          id: `v-${id}`,
          title: `Video ${id}`,
          youtube_video_id: 'yt-id',
          thumbnail_url: null,
          latest_measured_vph: 1500,
          latest_view_count: 20000,
          channels: {
            id: 'ch-1',
            name: 'Channel 1',
            handle: '@ch1',
            avatar_url: null,
          },
        },
      });

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation((col, opts) => {
          orderCalls.push({ col, opts });
          return queryBuilder;
        }),
        range: vi.fn().mockImplementation((from, to) => {
          rangeCalls.push({ from, to });
          if (from === 0) {
            return Promise.resolve({
              data: [
                sampleRow('alert-2', '2026-09-18T10:00:00Z'),
                sampleRow('alert-1', '2026-09-18T10:00:00Z'),
              ],
              error: null,
            });
          }
          return Promise.resolve({
            data: [sampleRow('alert-0', '2026-09-18T09:00:00Z')],
            error: null,
          });
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
      };

      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockSupabase as any);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const items = await alertHistoryService.fetchAllAlertHistory(2);

      expect(items.length).toBe(3);
      expect(orderCalls).toEqual(
        expect.arrayContaining([
          { col: 'created_at', opts: { ascending: false } },
          { col: 'id', opts: { ascending: false } },
        ])
      );
      expect(rangeCalls).toEqual([
        { from: 0, to: 1 },
        { from: 2, to: 3 },
      ]);
    });

    it('13.6 broken avatar fallback khi xảy ra @error trong AlertTimeline, AlertTable và AlertDetailModal', async () => {
      const itemWithBrokenAvatar = makeItem({
        id: 'broken-av-1',
        channelId: 'ch-broken',
        channelName: 'Broken Avatar Channel',
        channelAvatarUrl: 'https://broken-domain.invalid/avatar.jpg',
      });

      // 1. AlertTimeline
      const timelineWrapper = mount(AlertTimeline, {
        props: { items: [itemWithBrokenAvatar] },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
          },
        },
      });
      expect(timelineWrapper.find('.channel-avatar').exists()).toBe(true);
      await timelineWrapper.find('.channel-avatar').trigger('error');
      expect(timelineWrapper.find('.channel-avatar').exists()).toBe(false);
      expect(timelineWrapper.find('.avatar-fallback').text()).toBe('B');

      // 2. AlertTable
      const tableWrapper = mount(AlertTable, {
        props: { items: [itemWithBrokenAvatar] },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
          },
        },
      });
      expect(tableWrapper.find('.tbl-avatar').exists()).toBe(true);
      await tableWrapper.find('.tbl-avatar').trigger('error');
      expect(tableWrapper.find('.tbl-avatar').exists()).toBe(false);
      expect(tableWrapper.find('.avatar-fallback').text()).toBe('B');

      // 3. AlertDetailModal
      const modalWrapper = mount(AlertDetailModal, {
        props: { item: itemWithBrokenAvatar },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: { template: '<div class="vt-stub"></div>' },
            AppModal: { template: '<div class="modal-stub"><slot /></div>' },
          },
        },
      });
      expect(modalWrapper.find('.ch-avatar').exists()).toBe(true);
      await modalWrapper.find('.ch-avatar').trigger('error');
      expect(modalWrapper.find('.ch-avatar').exists()).toBe(false);
      expect(modalWrapper.find('.avatar-fallback').text()).toBe('B');
    });

    it('13.7 missing thumbnail + youtubeVideoId fallback truyền đúng vào VideoThumbnail trong AlertTable và AlertDetailModal', () => {
      const item = makeItem({
        id: 'tb-1',
        videoThumbnailUrl: null,
        videoYoutubeId: 'yt-spec-fallback-999',
      });

      const tableWrapper = mount(AlertTable, {
        props: { items: [item] },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: {
              template: '<div class="vt-stub" :data-yt="youtubeVideoId"></div>',
              props: ['youtubeVideoId'],
            },
          },
        },
      });
      expect(tableWrapper.find('.vt-stub').attributes('data-yt')).toBe('yt-spec-fallback-999');

      const modalWrapper = mount(AlertDetailModal, {
        props: { item },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: {
              template: '<div class="vt-stub" :data-yt="youtubeVideoId"></div>',
              props: ['youtubeVideoId'],
            },
            AppModal: { template: '<div class="modal-stub"><slot /></div>' },
          },
        },
      });
      expect(modalWrapper.find('.vt-stub').attributes('data-yt')).toBe('yt-spec-fallback-999');
    });
  });
});
