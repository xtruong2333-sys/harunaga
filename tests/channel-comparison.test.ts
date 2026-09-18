import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import {
  channelComparisonService,
  getTimeWindowThreshold,
  formatRelativeTime,
  mapAlertStatus,
  computeComparisonMetrics,
  aggregateVphTrend,
  formatDelta,
  computePublishingMetrics,
  toFiniteNumber,
} from '../src/services/channel-comparison-service';
import ComparisonChannelSelector from '../src/components/channel-comparison/ComparisonChannelSelector.vue';
import ComparisonIdentityStrip from '../src/components/channel-comparison/ComparisonIdentityStrip.vue';
import ComparisonMetricRail from '../src/components/channel-comparison/ComparisonMetricRail.vue';
import ComparisonPublishingRhythm from '../src/components/channel-comparison/ComparisonPublishingRhythm.vue';
import ComparisonFreshness from '../src/components/channel-comparison/ComparisonFreshness.vue';
import ComparisonTrendChart from '../src/components/channel-comparison/ComparisonTrendChart.vue';
import ComparisonSignalColumns from '../src/components/channel-comparison/ComparisonSignalColumns.vue';
import ComparisonTable from '../src/components/channel-comparison/ComparisonTable.vue';
import ChannelComparisonPage from '../src/pages/ChannelComparisonPage.vue';
import type { ChannelComparisonItem } from '../src/types/channel-comparison';
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
      replace: vi.fn(),
      push: vi.fn(),
    }),
  };
});

const routerLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
};

const mockItemA: ChannelComparisonItem = {
  id: 'ch-a',
  name: 'Kênh Đối Thủ A',
  handle: '@doithua',
  avatarUrl: 'https://example.com/a.jpg',
  status: 'active',
  statusLabel: 'Đang theo dõi',
  alertVphThreshold: 5000,
  lastScanAt: new Date(Date.now() - 3600000).toISOString(),
  relativeScanTime: '1 giờ trước',
  color: '#38bdf8',
  metrics: {
    videoCount: 10,
    risingVideoCount: 4,
    risingVideoRatio: 50.0,
    maxVph: 6200,
    avgMeasuredVph: 1200,
    trackedViews: 150000,
    latestViewDelta: 1250,
    videosWithVphCount: 8,
  },
  publishing: {
    publishedLast7d: 3,
    publishedLast30d: 12,
    avgDaysBetweenPosts: 2.5,
    mostCommonWeekday: 'Thứ Sáu',
    commonHourWindow: '18–21h',
    sampleCount: 15,
  },
  topVideos: [
    {
      id: 'v-1',
      youtubeVideoId: 'yt-1',
      title: 'Video Top A',
      thumbnailUrl: 'https://example.com/v1.jpg',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      relativePublishedAt: '1 ngày trước',
      latestViewCount: 45000,
      latestMeasuredVph: 6200,
      latestViewDelta: 500,
      alertStatus: 'sent',
      alertStatusLabel: 'Đã gửi',
    },
  ],
  trendPoints: [
    {
      hourKey: '2026-09-18 10:00',
      hourLabel: '10:00 18/09',
      avgVph: 4500,
      sampleCount: 2,
    },
    {
      hourKey: '2026-09-18 11:00',
      hourLabel: '11:00 18/09',
      avgVph: 5200,
      sampleCount: 3,
    },
    // Missing hour 12:00 -> gap
    {
      hourKey: '2026-09-18 13:00',
      hourLabel: '13:00 18/09',
      avgVph: 6200,
      sampleCount: 2,
    },
  ],
};

const mockItemB: ChannelComparisonItem = {
  id: 'ch-b',
  name: 'Kênh Đối Thủ B',
  handle: '@doithub',
  avatarUrl: null,
  status: 'paused',
  statusLabel: 'Tạm dừng',
  alertVphThreshold: null,
  lastScanAt: null,
  relativeScanTime: 'Chưa có',
  color: '#10b981',
  metrics: {
    videoCount: 5,
    risingVideoCount: 1,
    risingVideoRatio: 25.0,
    maxVph: 2100,
    avgMeasuredVph: 500,
    trackedViews: null, // all views null
    latestViewDelta: -200, // negative delta
    videosWithVphCount: 4,
  },
  publishing: {
    publishedLast7d: 1,
    publishedLast30d: 2,
    avgDaysBetweenPosts: null,
    mostCommonWeekday: 'Chưa đủ dữ liệu',
    commonHourWindow: 'Chưa đủ dữ liệu',
    sampleCount: 2,
  },
  topVideos: [],
  trendPoints: [
    {
      hourKey: '2026-09-18 10:00',
      hourLabel: '10:00 18/09',
      avgVph: 1800,
      sampleCount: 1,
    },
    {
      hourKey: '2026-09-18 11:00',
      hourLabel: '11:00 18/09',
      avgVph: 2100,
      sampleCount: 2,
    },
  ],
};

describe('Bắt Bài Đối Thủ — Giai Đoạn 12: So Sánh Kênh (Channel Comparison)', () => {
  describe('1. Ngưỡng thời gian lọc (getTimeWindowThreshold)', () => {
    it('all trả về null', () => {
      expect(getTimeWindowThreshold('all')).toBeNull();
    });

    it('24h trả về mốc thời gian cách hiện tại khoảng 24 giờ', () => {
      const threshold = getTimeWindowThreshold('24h');
      expect(threshold).not.toBeNull();
      const diffMs = Date.now() - new Date(threshold!).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThanOrEqual(23.9);
      expect(diffHours).toBeLessThanOrEqual(24.1);
    });

    it('3d, 7d, 30d tính đúng khoảng thời gian theo ngày', () => {
      const t3d = getTimeWindowThreshold('3d');
      const t7d = getTimeWindowThreshold('7d');
      const t30d = getTimeWindowThreshold('30d');

      expect(t3d).not.toBeNull();
      expect(t7d).not.toBeNull();
      expect(t30d).not.toBeNull();

      const diffDays3 = (Date.now() - new Date(t3d!).getTime()) / (1000 * 60 * 60 * 24);
      const diffDays7 = (Date.now() - new Date(t7d!).getTime()) / (1000 * 60 * 60 * 24);
      const diffDays30 = (Date.now() - new Date(t30d!).getTime()) / (1000 * 60 * 60 * 24);

      expect(Math.round(diffDays3)).toBe(3);
      expect(Math.round(diffDays7)).toBe(7);
      expect(Math.round(diffDays30)).toBe(30);
    });
  });

  describe('2. Tính toán chỉ số so sánh (computeComparisonMetrics)', () => {
    it('Trả về đúng chỉ số khi có đầy đủ video và snapshot delta', () => {
      const videos = [
        {
          latest_view_count: 10000,
          latest_measured_vph: 800,
          view_delta: 150,
        },
        {
          latest_view_count: 5000,
          latest_measured_vph: 200,
          view_delta: 50,
        },
        {
          latest_view_count: 3000,
          latest_measured_vph: 0,
          view_delta: 0,
        },
        {
          latest_view_count: 2000,
          latest_measured_vph: null,
          view_delta: null,
        },
      ];

      const metrics = computeComparisonMetrics(videos);

      expect(metrics.videoCount).toBe(4);
      expect(metrics.risingVideoCount).toBe(2);
      expect(metrics.maxVph).toBe(800);
      expect(metrics.trackedViews).toBe(20000);
      expect(metrics.latestViewDelta).toBe(200);
      expect(metrics.avgMeasuredVph).toBe(333);
      expect(metrics.risingVideoRatio).toBe(66.7);
    });

    it('Khi không có video nào đo được VPH (toàn bộ NULL), tỷ lệ và TB trả về null', () => {
      const videos = [
        {
          latest_view_count: 1000,
          latest_measured_vph: null,
          view_delta: null,
        },
      ];

      const metrics = computeComparisonMetrics(videos);

      expect(metrics.videoCount).toBe(1);
      expect(metrics.risingVideoCount).toBe(0);
      expect(metrics.risingVideoRatio).toBeNull();
      expect(metrics.avgMeasuredVph).toBeNull();
      expect(metrics.maxVph).toBeNull();
      expect(metrics.trackedViews).toBe(1000);
      expect(metrics.latestViewDelta).toBeNull();
    });

    it('Khi danh sách video hoàn toàn rỗng, mọi chỉ số đo lường đều là null hoặc 0', () => {
      const metrics = computeComparisonMetrics([]);

      expect(metrics.videoCount).toBe(0);
      expect(metrics.risingVideoCount).toBe(0);
      expect(metrics.risingVideoRatio).toBeNull();
      expect(metrics.avgMeasuredVph).toBeNull();
      expect(metrics.maxVph).toBeNull();
      expect(metrics.trackedViews).toBeNull();
      expect(metrics.latestViewDelta).toBeNull();
    });

    it('Tracked views: toàn bộ null trả về null, partial measured trả về sum chính xác', () => {
      const allNull = [
        { latest_view_count: null, latest_measured_vph: null, view_delta: null },
        { latest_view_count: null, latest_measured_vph: 50, view_delta: null },
      ];
      expect(computeComparisonMetrics(allNull).trackedViews).toBeNull();

      const partial = [
        { latest_view_count: null, latest_measured_vph: null, view_delta: null },
        { latest_view_count: 500, latest_measured_vph: 50, view_delta: null },
        { latest_view_count: 1500, latest_measured_vph: null, view_delta: null },
      ];
      expect(computeComparisonMetrics(partial).trackedViews).toBe(2000);
    });
  });

  describe('3. Định dạng delta & finite number helper', () => {
    it('formatDelta xử lý chuẩn các trường hợp dương, 0, âm, và null', () => {
      expect(formatDelta(500)).toBe('+500');
      expect(formatDelta(0)).toBe('0');
      expect(formatDelta(-500)).toBe('-500');
      expect(formatDelta(-500)).not.toContain('+-');
      expect(formatDelta(null)).toBe('—');
      expect(formatDelta(undefined)).toBe('—');
    });

    it('toFiniteNumber chỉ nhận finite number', () => {
      expect(toFiniteNumber(123)).toBe(123);
      expect(toFiniteNumber('456')).toBe(456);
      expect(toFiniteNumber(null)).toBeNull();
      expect(toFiniteNumber(undefined)).toBeNull();
      expect(toFiniteNumber(NaN)).toBeNull();
      expect(toFiniteNumber(Infinity)).toBeNull();
      expect(toFiniteNumber('')).toBeNull();
    });
  });

  describe('4. Tính toán nhịp đăng (computePublishingMetrics)', () => {
    it('Nếu sample < 3 video → trả về Chưa đủ dữ liệu và null cho khoảng cách', () => {
      const now = Date.now();
      const videos = [
        { published_at: new Date(now - 86400000).toISOString() },
        { published_at: new Date(now - 2 * 86400000).toISOString() },
      ];

      const res = computePublishingMetrics(videos, now);
      expect(res.sampleCount).toBe(2);
      expect(res.publishedLast7d).toBe(2);
      expect(res.publishedLast30d).toBe(2);
      expect(res.avgDaysBetweenPosts).toBeNull();
      expect(res.mostCommonWeekday).toBe('Chưa đủ dữ liệu');
      expect(res.commonHourWindow).toBe('Chưa đủ dữ liệu');
    });

    it('Nếu sample >= 3 video → tính khoảng cách trung bình và thống kê thứ/giờ', () => {
      const now = Date.now();
      const videos = [
        { published_at: new Date(now - 2 * 86400000).toISOString() }, // 2 ngày trước
        { published_at: new Date(now - 4 * 86400000).toISOString() }, // 4 ngày trước
        { published_at: new Date(now - 6 * 86400000).toISOString() }, // 6 ngày trước
      ];

      const res = computePublishingMetrics(videos, now);
      expect(res.sampleCount).toBe(3);
      expect(res.avgDaysBetweenPosts).toBe(2); // (2+2)/2 = 2.0
      expect(res.mostCommonWeekday).not.toBe('Chưa đủ dữ liệu');
      expect(res.commonHourWindow).not.toBe('Chưa đủ dữ liệu');
    });
  });

  describe('5. Tổng hợp biểu đồ xu hướng 24h (aggregateVphTrend)', () => {
    it('Nhóm snapshot theo giờ và tính trung bình VPH trong giờ đó', () => {
      const now = Date.now();
      const oneHourAgo = new Date(now - 1 * 60 * 60 * 1000).toISOString();
      const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

      const snapshots = [
        { measured_vph: 400, checked_at: twoHoursAgo },
        { measured_vph: 600, checked_at: twoHoursAgo },
        { measured_vph: 500, checked_at: oneHourAgo },
        { measured_vph: null, checked_at: oneHourAgo },
      ];

      const trendPoints = aggregateVphTrend(snapshots, now);
      expect(trendPoints.length).toBe(2);
      expect(trendPoints[0].avgVph).toBe(500);
      expect(trendPoints[0].sampleCount).toBe(2);
      expect(trendPoints[1].avgVph).toBe(500);
      expect(trendPoints[1].sampleCount).toBe(1);
    });

    it('Loại bỏ hoàn toàn các snapshot cũ hơn 24 giờ', () => {
      const now = Date.now();
      const thirtyHoursAgo = new Date(now - 30 * 60 * 60 * 1000).toISOString();
      const snapshots = [{ measured_vph: 999, checked_at: thirtyHoursAgo }];
      const trendPoints = aggregateVphTrend(snapshots, now);
      expect(trendPoints.length).toBe(0);
    });
  });

  describe('6. Định dạng thời gian và nhãn (formatRelativeTime & mapAlertStatus)', () => {
    it('Định dạng tiếng Việt tương đối chính xác', () => {
      const now = new Date();
      expect(formatRelativeTime(now.toISOString())).toBe('Vừa xong');

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 phút trước');
    });

    it('Chuyển đổi trạng thái cảnh báo sang tiếng Việt chuẩn', () => {
      expect(mapAlertStatus('sent')).toEqual({ alertStatus: 'sent', label: 'Đã gửi' });
      expect(mapAlertStatus('sending')).toEqual({ alertStatus: 'sending', label: 'Đang gửi' });
      expect(mapAlertStatus('pending')).toEqual({ alertStatus: 'pending', label: 'Chờ gửi' });
      expect(mapAlertStatus('failed')).toEqual({ alertStatus: 'failed', label: 'Gửi lỗi' });
      expect(mapAlertStatus(null)).toEqual({ alertStatus: 'no_alert', label: 'Chưa cảnh báo' });
    });
  });

  describe('7. UI Components Unit Tests', () => {
    it('7.1 ComparisonChannelSelector hiển thị các slot kênh và phát emit', async () => {
      const wrapper = mount(ComparisonChannelSelector, {
        props: {
          selectedChannels: [
            { id: 'ch-a', name: 'Kênh A', handle: '@a', avatarUrl: null, status: 'active' },
            { id: 'ch-b', name: 'Kênh B', handle: '@b', avatarUrl: null, status: 'paused' },
          ],
          availableChannels: [
            { id: 'ch-a', name: 'Kênh A', handle: '@a', avatarUrl: null, status: 'active' },
            { id: 'ch-b', name: 'Kênh B', handle: '@b', avatarUrl: null, status: 'paused' },
            { id: 'ch-c', name: 'Kênh C', handle: '@c', avatarUrl: null, status: 'active' },
          ],
          timeWindow: '7d',
        },
        global: {
          stubs: {
            AppModal: { template: '<div class="modal-stub"><slot /></div>' },
          },
        },
      });

      expect(wrapper.text()).toContain('Kênh A');
      expect(wrapper.text()).toContain('Kênh B');
      expect(wrapper.text()).toContain('VS');

      // Click remove channel A
      const removeBtns = wrapper.findAll('.slot-remove-btn');
      expect(removeBtns.length).toBe(2);
      await removeBtns[0].trigger('click');
      expect(wrapper.emitted('remove')).toBeTruthy();
      expect(wrapper.emitted('remove')![0]).toEqual(['ch-a']);
    });

    it('7.2 ComparisonMetricRail hiển thị CAO NHẤT cho factual max và render — cho null', () => {
      const wrapper = mount(ComparisonMetricRail, {
        props: {
          channels: [mockItemA, mockItemB],
        },
      });

      // Max VPH: Kênh A có 6200 vs Kênh B 2100 -> Kênh A hiển thị CAO NHẤT
      const maxBadges = wrapper.findAll('.max-badge');
      expect(maxBadges.length).toBeGreaterThanOrEqual(1);
      expect(wrapper.text()).toContain('CAO NHẤT');

      // Kênh B trackedViews là null -> render —
      expect(wrapper.text()).toContain('—');
    });

    it('7.3 ComparisonTrendChart hỗ trợ gap hour và không vẽ sập xuống 0', () => {
      const wrapper = mount(ComparisonTrendChart, {
        props: {
          channels: [mockItemA, mockItemB],
          allTrendHourKeys: ['2026-09-18 10:00', '2026-09-18 11:00', '2026-09-18 12:00', '2026-09-18 13:00'],
        },
      });

      // Kiểm tra tiêu đề và phụ đề rõ nghĩa
      expect(wrapper.text()).toContain('XU HƯỚNG VPH — 24 GIỜ GẦN NHẤT');
      expect(wrapper.text()).toContain('Không phụ thuộc bộ lọc thời gian đăng video phía trên');

      // Kênh A có gap ở 12:00 -> sinh ra 2 segments riêng biệt
      const paths = wrapper.findAll('path.trend-line');
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });

    it('7.4 ComparisonPublishingRhythm hiển thị nhịp xuất bản và sample guard', () => {
      const wrapper = mount(ComparisonPublishingRhythm, {
        props: {
          channels: [mockItemA, mockItemB],
        },
      });

      expect(wrapper.text()).toContain('NHỊP ĐĂNG ĐỐI CHIẾU');
      expect(wrapper.text()).toContain('12 video');
      // Kênh B sample < 3 -> hiển thị Chưa đủ dữ liệu
      expect(wrapper.text()).toContain('Chưa đủ dữ liệu');
    });

    it('7.5 ComparisonFreshness hiển thị lần quét gần nhất và ngưỡng', () => {
      const wrapper = mount(ComparisonFreshness, {
        props: {
          channels: [mockItemA, mockItemB],
        },
      });

      expect(wrapper.text()).toContain('ĐỘ MỚI DỮ LIỆU THU THẬP');
      expect(wrapper.text()).toContain('1 giờ trước');
      expect(wrapper.text()).toContain('Chưa thiết lập');
    });

    it('7.6 ComparisonTable hiển thị bảng tổng hợp đầy đủ các dòng', () => {
      const wrapper = mount(ComparisonTable, {
        props: {
          channels: [mockItemA, mockItemB],
        },
        global: {
          stubs: { 'router-link': routerLinkStub },
        },
      });

      expect(wrapper.text()).toContain('BẢNG ĐỐI SOÁT TẤT CẢ CHỈ SỐ');
      expect(wrapper.text()).toContain('VPH CAO NHẤT');
      expect(wrapper.text()).toContain('Lượt Xem Đang Theo Dõi');
      expect(wrapper.text()).toContain('CAO NHẤT');
    });

    it('7.7 ComparisonIdentityStrip hiển thị danh sách kênh và thông tin cơ bản', () => {
      const wrapper = mount(ComparisonIdentityStrip, {
        props: {
          channels: [mockItemA, mockItemB],
        },
        global: {
          stubs: { 'router-link': routerLinkStub },
        },
      });

      expect(wrapper.text()).toContain('Kênh Đối Thủ A');
      expect(wrapper.text()).toContain('@doithua');
      expect(wrapper.text()).toContain('Kênh Đối Thủ B');
      expect(wrapper.text()).toContain('@doithub');
    });

    it('7.8 ComparisonSignalColumns sử dụng route /videos/:id và hiển thị top video tín hiệu', () => {
      const wrapper = mount(ComparisonSignalColumns, {
        props: {
          channels: [mockItemA, mockItemB],
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
            VideoThumbnail: {
              props: ['detailUrl', 'src', 'alt', 'youtubeVideoId', 'ratio'],
              template: '<div class="video-thumbnail-stub" :data-detail-url="detailUrl"></div>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('TÍN HIỆU VIDEO NỔI BẬT THEO VPH');
      expect(wrapper.text()).toContain('Video Top A');

      // Video detail route là /videos/:id
      const routerLinks = wrapper.findAll('a');
      const hrefs = routerLinks.map(l => l.attributes('href'));
      expect(hrefs).toContain('/videos/v-1');

      const thumbStubs = wrapper.findAll('.video-thumbnail-stub');
      expect(thumbStubs[0].attributes('data-detail-url')).toBe('/videos/v-1');
    });

    it('7.9 ComparisonSignalColumns hiển thị empty state khi kênh không có video VPH > 0', () => {
      const emptyChannel: ChannelComparisonItem = {
        ...mockItemA,
        id: 'ch-zero',
        name: 'Kênh Không Tăng',
        topVideos: [],
      };
      const wrapper = mount(ComparisonSignalColumns, {
        props: {
          channels: [emptyChannel],
        },
        global: {
          stubs: { 'router-link': routerLinkStub },
        },
      });

      expect(wrapper.text()).toContain('Chưa có video đang tăng trong khoảng thời gian này.');
    });

    it('7.10 ChannelComparisonPage: no saved selection giữ 0 channel và không tự chọn', async () => {
      localStorage.clear();
      vi.spyOn(channelComparisonService, 'fetchComparableChannels').mockResolvedValue([
        { id: 'c1', name: 'Channel 1', handle: '@c1', avatarUrl: null, status: 'active' },
        { id: 'c2', name: 'Channel 2', handle: '@c2', avatarUrl: null, status: 'active' },
      ]);
      
      const wrapper = mount(ChannelComparisonPage, {
        global: {
          stubs: {
            'router-link': routerLinkStub,
            AppModal: { template: '<div class="modal-stub"><slot /></div>' },
          },
        },
      });

      await flushPromises();

      // Giữ đúng 0 kênh được chọn, không tự thêm active channels
      expect(wrapper.text()).toContain('Chọn ít nhất 2 kênh để bắt đầu so sánh');
      const selector = wrapper.findComponent(ComparisonChannelSelector);
      expect(selector.props('selectedChannels').length).toBe(0);
    });

    it('7.11 ChannelComparisonPage: one valid saved channel giữ đúng 1 channel, không tự thêm', async () => {
      localStorage.setItem('bbdt_compare_channel_ids', JSON.stringify(['c1']));
      vi.spyOn(channelComparisonService, 'fetchComparableChannels').mockResolvedValue([
        { id: 'c1', name: 'Channel 1', handle: '@c1', avatarUrl: null, status: 'active' },
        { id: 'c2', name: 'Channel 2', handle: '@c2', avatarUrl: null, status: 'active' },
      ]);
      
      const wrapper = mount(ChannelComparisonPage, {
        global: {
          stubs: {
            'router-link': routerLinkStub,
            AppModal: { template: '<div class="modal-stub"><slot /></div>' },
          },
        },
      });

      await flushPromises();

      // Giữ đúng 1 kênh, không tự thêm c2
      expect(wrapper.text()).toContain('Hãy chọn thêm 1 kênh để bắt đầu đối chiếu');
      const selector = wrapper.findComponent(ComparisonChannelSelector);
      expect(selector.props('selectedChannels').length).toBe(1);
      expect(selector.props('selectedChannels')[0].id).toBe('c1');
    });
  });

  describe('8. fetchChannelComparison Integration, Ordering & Alert Determinism', () => {
    it('8.1 Dedupe tối đa 4 kênh và bảo toàn thứ tự lựa chọn của người dùng', async () => {
      const mockRawChannels = [
        { id: 'c1', name: 'Channel 1', handle: '@c1', avatar_url: null, status: 'active', alert_vph_threshold: 1000, last_scan_at: null },
        { id: 'c2', name: 'Channel 2', handle: '@c2', avatar_url: null, status: 'active', alert_vph_threshold: null, last_scan_at: null },
        { id: 'c3', name: 'Channel 3', handle: '@c3', avatar_url: null, status: 'active', alert_vph_threshold: 3000, last_scan_at: null },
        { id: 'c4', name: 'Channel 4', handle: '@c4', avatar_url: null, status: 'active', alert_vph_threshold: 4000, last_scan_at: null },
        { id: 'c5', name: 'Channel 5', handle: '@c5', avatar_url: null, status: 'active', alert_vph_threshold: 5000, last_scan_at: null },
      ];

      const mockVideos = [
        {
          id: 'v-c2-1',
          channel_id: 'c2',
          youtube_video_id: 'yt2',
          title: 'V2',
          thumbnail_url: null,
          published_at: new Date().toISOString(),
          latest_view_count: null, // null preserved
          latest_measured_vph: 800, // positive VPH so it appears in topVideos
          latest_view_delta: null,
        },
      ];

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'channels') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({ data: mockRawChannels, error: null }),
            };
          }
          if (table === 'videos') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              range: vi.fn().mockResolvedValue({ data: mockVideos, error: null }),
            };
          }
          if (table === 'video_alerts') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({
                data: [
                  { video_id: 'v-c2-1', status: 'sent', sent_at: '2026-09-18T00:00:00Z', created_at: '2026-09-17T00:00:00Z' },
                  { video_id: 'v-c2-1', status: 'pending', sent_at: null, created_at: '2026-09-18T05:00:00Z' }, // newer created_at
                ],
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }),
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockSupabase as any);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      // Gửi mảng có trùng lặp và 5 id theo thứ tự: c2, c1, c2, c3, c4, c5
      const result = await channelComparisonService.fetchChannelComparison(
        ['c2', 'c1', 'c2', 'c3', 'c4', 'c5'],
        '7d'
      );

      // Phải lấy đúng tối đa 4 kênh và bảo toàn thứ tự: c2, c1, c3, c4
      expect(result.channels.length).toBe(4);
      expect(result.channels[0].id).toBe('c2');
      expect(result.channels[1].id).toBe('c1');
      expect(result.channels[2].id).toBe('c3');
      expect(result.channels[3].id).toBe('c4');

      // Null threshold và null latestViewCount được bảo toàn nguyên vẹn
      expect(result.channels[0].alertVphThreshold).toBeNull();
      expect(result.channels[0].topVideos[0].latestViewCount).toBeNull();

      // Alert mới nhất chọn đúng alert có timestamp mới hơn (pending với created_at 05:00 > sent với sent_at 00:00)
      expect(result.channels[0].topVideos[0].alertStatus).toBe('pending');
    });

    it('8.2 VPH 0 và null không bao giờ xuất hiện trong topVideos', async () => {
      const mockRawChannels = [
        { id: 'c1', name: 'Channel 1', handle: '@c1', avatar_url: null, status: 'active', alert_vph_threshold: null, last_scan_at: null },
      ];

      const mockVideos = [
        {
          id: 'v-zero',
          channel_id: 'c1',
          youtube_video_id: 'yt0',
          title: 'Video Zero VPH',
          thumbnail_url: null,
          published_at: new Date().toISOString(),
          latest_view_count: 1000,
          latest_measured_vph: 0,
          latest_view_delta: 0,
        },
        {
          id: 'v-null',
          channel_id: 'c1',
          youtube_video_id: 'ytnull',
          title: 'Video Null VPH',
          thumbnail_url: null,
          published_at: new Date().toISOString(),
          latest_view_count: 2000,
          latest_measured_vph: null,
          latest_view_delta: null,
        },
        {
          id: 'v-pos',
          channel_id: 'c1',
          youtube_video_id: 'ytpos',
          title: 'Video Positive VPH',
          thumbnail_url: null,
          published_at: new Date().toISOString(),
          latest_view_count: 5000,
          latest_measured_vph: 250,
          latest_view_delta: 50,
        },
      ];

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'channels') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({ data: mockRawChannels, error: null }),
            };
          }
          if (table === 'videos') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              range: vi.fn().mockResolvedValue({ data: mockVideos, error: null }),
            };
          }
          if (table === 'video_alerts') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }),
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockSupabase as any);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const result = await channelComparisonService.fetchChannelComparison(['c1'], '7d');
      expect(result.channels[0].topVideos.length).toBe(1);
      expect(result.channels[0].topVideos[0].id).toBe('v-pos');
      expect(result.channels[0].topVideos.some(v => v.id === 'v-zero')).toBe(false);
      expect(result.channels[0].topVideos.some(v => v.id === 'v-null')).toBe(false);
    });
  });
});