import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ChannelDetailPage from '@/pages/ChannelDetailPage.vue';
import ChannelProfileHero from '@/components/channel-detail/ChannelProfileHero.vue';
import ChannelPerformanceStrip from '@/components/channel-detail/ChannelPerformanceStrip.vue';
import ChannelTopSignal from '@/components/channel-detail/ChannelTopSignal.vue';
import ChannelPublishingRhythm from '@/components/channel-detail/ChannelPublishingRhythm.vue';
import ChannelMonitoringConfig from '@/components/channel-detail/ChannelMonitoringConfig.vue';
import ChannelActivityFeed from '@/components/channel-detail/ChannelActivityFeed.vue';
import { channelAnalysisService } from '@/services/channel-analysis-service';
import type { ChannelAnalysis } from '@/types/channel-analysis';

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<any>('vue-router');
  return {
    ...actual,
    useRoute: () => ({
      params: { id: 'test-ch-1' },
    }),
  };
});

const routerLinkStub = {
  template: '<a><slot /></a>',
};

const mockAnalysis: ChannelAnalysis = {
  channel: {
    id: 'test-ch-1',
    name: 'Kênh Đối Thủ AI Pro',
    handle: '@aipro_channel',
    avatarUrl: 'https://example.com/avatar.jpg',
    status: 'active',
    scanLimit: 15,
    alertVphThreshold: 5000,
    lastScanAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    createdAt: '2026-08-01T00:00:00Z',
    url: 'https://youtube.com/@aipro_channel',
  },
  totalVideos: 12,
  risingVideos: 5,
  maxVph: 12500,
  avgVph: 6400,
  distribution: {
    overThresholdCount: 2,
    risingCount: 5,
    zeroCount: 4,
    nullCount: 3,
  },
  topRisingVideos: [
    {
      id: 'vid-1',
      youtubeVideoId: 'yt-1',
      title: 'Chiến Thuật Video Đột Phá 2026',
      url: 'https://youtube.com/watch?v=yt-1',
      thumbnailUrl: 'https://example.com/t1.jpg',
      publishedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
      latestViewCount: 65000,
      latestMeasuredVph: 12500,
      latestDeltaViews: 4500,
      isOverThreshold: true,
      alertStatus: 'sent',
    },
    {
      id: 'vid-2',
      youtubeVideoId: 'yt-2',
      title: 'Top 5 Công Cụ Tự Động Hóa',
      url: 'https://youtube.com/watch?v=yt-2',
      thumbnailUrl: 'https://example.com/t2.jpg',
      publishedAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
      latestViewCount: 25000,
      latestMeasuredVph: 4200,
      latestDeltaViews: 800,
      isOverThreshold: false,
      alertStatus: null,
    },
  ],
  latestVideos: [
    {
      id: 'vid-1',
      youtubeVideoId: 'yt-1',
      title: 'Chiến Thuật Video Đột Phá 2026',
      url: 'https://youtube.com/watch?v=yt-1',
      thumbnailUrl: 'https://example.com/t1.jpg',
      publishedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
      latestViewCount: 65000,
      latestMeasuredVph: 12500,
      latestDeltaViews: 4500,
      isOverThreshold: true,
      alertStatus: 'sent',
    },
    {
      id: 'vid-2',
      youtubeVideoId: 'yt-2',
      title: 'Top 5 Công Cụ Tự Động Hóa',
      url: 'https://youtube.com/watch?v=yt-2',
      thumbnailUrl: 'https://example.com/t2.jpg',
      publishedAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
      latestViewCount: 25000,
      latestMeasuredVph: 4200,
      latestDeltaViews: 800,
      isOverThreshold: false,
      alertStatus: null,
    },
    {
      id: 'vid-3',
      youtubeVideoId: 'yt-3',
      title: 'Phân Tích Xu Hướng Tuần',
      url: 'https://youtube.com/watch?v=yt-3',
      thumbnailUrl: 'https://example.com/t3.jpg',
      publishedAt: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
      latestViewCount: 12000,
      latestMeasuredVph: 0,
      latestDeltaViews: 0,
      isOverThreshold: false,
      alertStatus: null,
    },
  ],
  topVphChartVideos: [],
  alertSummary: {
    total: 3,
    sent: 2,
    pending: 1,
    failed: 0,
    recentAlerts: [
      {
        id: 'alt-1',
        videoId: 'vid-1',
        videoTitle: 'Chiến Thuật Video Đột Phá 2026',
        measuredVph: 12500,
        status: 'sent',
        sentAt: new Date(Date.now() - 1800 * 1000).toISOString(),
      },
    ],
  },
};

describe('Wave 3.7 — Competitor Intelligence Profile (/kenh-theo-doi/:id)', () => {
  // 1. ChannelProfileHero.vue
  describe('1. ChannelProfileHero.vue', () => {
    it('1.1 Renders channel identity, status badge, threshold, scan limit, and links', () => {
      const wrapper = mount(ChannelProfileHero, {
        props: { channel: mockAnalysis.channel },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.text()).toContain('Quay Lại Kênh Theo Dõi');
      expect(wrapper.text()).toContain('COMPETITOR INTELLIGENCE PROFILE');
      expect(wrapper.text()).toContain(mockAnalysis.channel.name);
      expect(wrapper.text()).toContain(mockAnalysis.channel.handle);
      expect(wrapper.text()).toContain('Đang theo dõi');
      expect(wrapper.text()).toContain('5.000 VPH');
      expect(wrapper.text()).toContain('15 video / lần');
    });

    it('1.2 Handles null threshold and null scanLimit gracefully without 5000/15 fallback', () => {
      const wrapper = mount(ChannelProfileHero, {
        props: {
          channel: {
            ...mockAnalysis.channel,
            alertVphThreshold: null,
            scanLimit: null,
          },
        },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.text()).not.toContain('5.000 VPH');
      expect(wrapper.text()).not.toContain('5000');
      expect(wrapper.text()).not.toContain('15 video');
      expect(wrapper.text()).toContain('—');
    });

    it('1.3 Renders paused and archived status labels accurately', () => {
      const pausedWrapper = mount(ChannelProfileHero, {
        props: {
          channel: { ...mockAnalysis.channel, status: 'paused' },
        },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(pausedWrapper.text()).toContain('Tạm dừng');

      const archivedWrapper = mount(ChannelProfileHero, {
        props: {
          channel: { ...mockAnalysis.channel, status: 'archived' },
        },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(archivedWrapper.text()).toContain('Đã lưu trữ');
    });

    it('1.4 Emits action events when buttons are clicked', async () => {
      const wrapper = mount(ChannelProfileHero, {
        props: { channel: mockAnalysis.channel },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      const buttons = wrapper.findAll('button');
      // Click Edit
      const editBtn = buttons.find(b => b.text().includes('Chỉnh Sửa'));
      await editBtn?.trigger('click');
      expect(wrapper.emitted('edit')).toBeTruthy();

      // Click Toggle Pause
      const pauseBtn = buttons.find(b => b.text().includes('Tạm Dừng'));
      await pauseBtn?.trigger('click');
      expect(wrapper.emitted('toggle-pause')).toBeTruthy();
    });
  });

  // 2. ChannelPerformanceStrip.vue
  describe('2. ChannelPerformanceStrip.vue', () => {
    it('2.1 Renders 4 primary metrics and segmented distribution rail', () => {
      const wrapper = mount(ChannelPerformanceStrip, {
        props: { analysis: mockAnalysis },
      });

      expect(wrapper.text()).toContain('TỔNG VIDEO');
      expect(wrapper.text()).toContain('12');
      expect(wrapper.text()).toContain('VIDEO ĐANG TĂNG');
      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain('12.500 VPH');
      expect(wrapper.text()).toContain('TỔNG CẢNH BÁO');
      expect(wrapper.text()).toContain('3');

      // Distribution rail classes for regression compatibility
      expect(wrapper.find('.seg-threshold').exists()).toBe(true);
      expect(wrapper.find('.seg-rising').exists()).toBe(true);
      expect(wrapper.find('.seg-zero').exists()).toBe(true);
      expect(wrapper.find('.seg-null').exists()).toBe(true);
      expect(wrapper.find('.box-rising').text()).toContain('Đang tăng dưới ngưỡng');
      expect(wrapper.find('.box-rising').text()).toContain('3'); // 5 rising - 2 over threshold = 3
    });
  });

  // 3. ChannelTopSignal.vue
  describe('3. ChannelTopSignal.vue', () => {
    it('3.1 Renders featured #1 video and secondary ranking item', () => {
      const wrapper = mount(ChannelTopSignal, {
        props: { analysis: mockAnalysis },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.text()).toContain('TÍN HIỆU NỔI BẬT');
      expect(wrapper.find('.featured-video-card').exists()).toBe(true);
      expect(wrapper.find('.featured-title').text()).toContain('Chiến Thuật Video Đột Phá 2026');
      expect(wrapper.text()).toContain('12.500 VPH');
      expect(wrapper.text()).toContain('65K');

      const secondaryItems = wrapper.findAll('.v-card-item');
      expect(secondaryItems.length).toBe(1);
      expect(secondaryItems[0].text()).toContain('Top 5 Công Cụ Tự Động Hóa');
    });

    it('3.2 Renders panel-empty when all videos have VPH <= 0', () => {
      const emptyAnalysis: ChannelAnalysis = {
        ...mockAnalysis,
        topRisingVideos: [
          {
            id: 'v-zero',
            youtubeVideoId: 'yt-0',
            title: 'Zero VPH',
            url: '',
            thumbnailUrl: null,
            publishedAt: new Date().toISOString(),
            latestViewCount: 100,
            latestMeasuredVph: 0,
            latestDeltaViews: 0,
            isOverThreshold: false,
            alertStatus: null,
          },
        ],
      };

      const wrapper = mount(ChannelTopSignal, {
        props: { analysis: emptyAnalysis },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.find('.panel-empty').exists()).toBe(true);
      expect(wrapper.find('.panel-empty').text()).toContain('Chưa có video nào ghi nhận VPH lớn hơn 0.');
      expect(wrapper.find('.featured-video-card').exists()).toBe(false);
    });
  });

  // 4. ChannelPublishingRhythm.vue
  describe('4. ChannelPublishingRhythm.vue', () => {
    it('4.1 Calculates publishing cadence and weekday distribution factually', () => {
      const wrapper = mount(ChannelPublishingRhythm, {
        props: { videos: mockAnalysis.latestVideos },
      });

      expect(wrapper.text()).toContain('NHỊP ĐĂNG GẦN ĐÂY');
      expect(wrapper.text()).toContain('TẦN SUẤT GẦN ĐÂY');
      expect(wrapper.text()).toContain('ĐĂNG NHIỀU NHẤT');
      expect(wrapper.text()).toContain('KHUNG GIỜ PHỔ BIẾN');
      expect(wrapper.findAll('.wd-col').length).toBe(7);
    });

    it('4.2 Displays Chưa đủ dữ liệu when sample has fewer than 3 videos', () => {
      const wrapper = mount(ChannelPublishingRhythm, {
        props: { videos: [mockAnalysis.latestVideos[0]] },
      });

      expect(wrapper.text()).toContain('Chưa đủ dữ liệu');
      expect(wrapper.text()).toContain('Cần ít nhất 3 video');
    });
  });

  // 5. ChannelMonitoringConfig.vue & ChannelActivityFeed.vue
  describe('5. Config & Activity Feed', () => {
    it('5.1 ChannelMonitoringConfig renders configuration and emits edit', async () => {
      const wrapper = mount(ChannelMonitoringConfig, {
        props: { channel: mockAnalysis.channel },
      });

      expect(wrapper.text()).toContain('CẤU HÌNH THEO DÕI');
      expect(wrapper.text()).toContain('5.000 VPH');
      expect(wrapper.text()).toContain('15 video');

      const editBtn = wrapper.find('button');
      await editBtn.trigger('click');
      expect(wrapper.emitted('edit')).toBeTruthy();
    });

    it('5.2 ChannelActivityFeed renders alert pills and recent alerts', () => {
      const wrapper = mount(ChannelActivityFeed, {
        props: {
          alertSummary: mockAnalysis.alertSummary,
          lastScanAt: mockAnalysis.channel.lastScanAt,
        },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.text()).toContain('HOẠT ĐỘNG CẢNH BÁO & QUÉT');
      expect(wrapper.text()).toContain('Đã gửi:');
      expect(wrapper.text()).toContain('2');
      expect(wrapper.text()).toContain('Đang chờ:');
      expect(wrapper.text()).toContain('1');
      expect(wrapper.text()).toContain('Chiến Thuật Video Đột Phá 2026');
      expect(wrapper.text()).toContain('12.500 VPH');
    });
  });

  // 6. ChannelDetailPage.vue Workspace Integration
  describe('6. ChannelDetailPage.vue Workspace Integration', () => {
    it('6.1 Mounts workspace and loads channel data cleanly', async () => {
      vi.spyOn(channelAnalysisService, 'fetchChannelAnalysis').mockResolvedValueOnce(mockAnalysis);

      const wrapper = mount(ChannelDetailPage, {
        global: { stubs: { 'router-link': routerLinkStub, ChannelVphChart: true } },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Quay Lại Kênh Theo Dõi');
      expect(wrapper.text()).toContain(mockAnalysis.channel.name);
      expect(wrapper.text()).toContain('TỔNG VIDEO');
      expect(wrapper.text()).toContain('TÍN HIỆU NỔI BẬT');
      expect(wrapper.text()).toContain('NHỊP ĐĂNG GẦN ĐÂY');
      expect(wrapper.text()).toContain('CẤU HÌNH THEO DÕI');
      expect(wrapper.text()).toContain('HOẠT ĐỘNG CẢNH BÁO & QUÉT');
    });

    it('6.2 Handles not found / error state cleanly', async () => {
      vi.spyOn(channelAnalysisService, 'fetchChannelAnalysis').mockResolvedValueOnce(null);

      const wrapper = mount(ChannelDetailPage, {
        global: { stubs: { 'router-link': routerLinkStub, ChannelVphChart: true } },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Không tìm thấy kênh này.');
      expect(wrapper.text()).toContain('Quay Lại Kênh Theo Dõi');
    });
  });
});
