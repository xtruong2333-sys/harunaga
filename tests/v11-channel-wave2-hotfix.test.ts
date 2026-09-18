import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ChannelTableHeader from '@/features/channels/components/ChannelTableHeader.vue';
import ChannelDetailPage from '@/pages/ChannelDetailPage.vue';
import { channelAnalysisService } from '@/services/channel-analysis-service';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: 'test-channel-id' },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('V1.1 Wave 2.1: Channel Intelligence Correctness Hotfix', () => {
  describe('1. ChannelTableHeader Duplicate Action Buttons Hotfix', () => {
    it('does NOT contain duplicate action buttons (+ Thêm Kênh / Thêm Nhiều Kênh) in ChannelTableHeader', () => {
      const wrapper = mount(ChannelTableHeader, {
        props: {
          searchQuery: '',
          currentFilter: 'all',
          currentSort: 'newest',
          counts: {
            all: 5,
            active: 3,
            paused: 1,
            archived: 1,
          },
        },
        global: {
          stubs: {
            AppIcon: true,
          },
        },
      });

      expect(wrapper.find('.action-buttons').exists()).toBe(false);
      const text = wrapper.text();
      expect(text).not.toContain('Thêm Kênh');
      expect(text).not.toContain('Thêm Nhiều Kênh');
      expect(wrapper.find('.search-input').exists()).toBe(true);
      expect(wrapper.find('.sort-select').exists()).toBe(true);
    });
  });

  describe('2. Distribution Rail & Mutually Exclusive Breakdown', () => {
    it('correctly calculates risingBelowThresholdCount without double counting', async () => {
      const mockAnalysisData = {
        channel: {
          id: 'test-channel-id',
          name: 'Kênh Test',
          handle: '@test',
          url: 'https://youtube.com/@test',
          avatarUrl: '',
          status: 'active' as const,
          scanLimit: 15,
          alertVphThreshold: 5000,
          source: 'manual' as const,
          notes: '',
          lastScanAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        totalVideos: 20,
        risingVideos: 8,
        maxVph: 12000,
        avgVph: 4500,
        distribution: {
          overThresholdCount: 3,
          risingCount: 8,
          zeroCount: 7,
          nullCount: 5,
        },
        topRisingVideos: [
          {
            id: 'v-1',
            title: 'Video Hot',
            url: 'https://youtube.com/watch?v=1',
            thumbnailUrl: '',
            publishedAt: new Date().toISOString(),
            latestViewCount: 50000,
            latestMeasuredVph: 12000,
            latestDeltaViews: 3000,
            isOverThreshold: true,
          },
        ],
        topVphChartVideos: [],
        latestVideos: [],
        alertSummary: {
          total: 3,
          sent: 3,
          pending: 0,
          failed: 0,
          recentAlerts: [],
        },
      };

      vi.spyOn(channelAnalysisService, 'fetchChannelAnalysis').mockResolvedValue(mockAnalysisData as any);

      const wrapper = mount(ChannelDetailPage, {
        global: {
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
            AppIcon: true,
            ChannelVphChart: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      await nextTick();

      const segThreshold = wrapper.find('.seg-threshold');
      const segRising = wrapper.find('.seg-rising');
      const segZero = wrapper.find('.seg-zero');
      const segNull = wrapper.find('.seg-null');

      expect(segThreshold.exists()).toBe(true);
      expect(segRising.exists()).toBe(true);
      expect(segZero.exists()).toBe(true);
      expect(segNull.exists()).toBe(true);

      expect(segThreshold.attributes('title')).toBe('Vượt ngưỡng: 3 video');
      expect(segRising.attributes('title')).toBe('Đang tăng dưới ngưỡng: 5 video');
      expect(segZero.attributes('title')).toBe('Không tăng: 7 video');
      expect(segNull.attributes('title')).toBe('Chưa đủ dữ liệu: 5 video');

      const risingBox = wrapper.find('.box-rising');
      expect(risingBox.text()).toContain('5');
      expect(risingBox.text()).toContain('Đang tăng dưới ngưỡng');
    });
  });

  describe('3. Top Signals Positive VPH Filtering', () => {
    it('filters out videos with 0 or null VPH from Top Signals and displays empty message when all <= 0', async () => {
      const mockAnalysisData = {
        channel: {
          id: 'test-channel-id',
          name: 'Kênh Không Tăng',
          handle: '@notrising',
          url: 'https://youtube.com/@notrising',
          avatarUrl: '',
          status: 'active' as const,
          scanLimit: 15,
          alertVphThreshold: 5000,
          source: 'manual' as const,
          notes: '',
          lastScanAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        totalVideos: 3,
        risingVideos: 0,
        maxVph: null,
        avgVph: null,
        distribution: {
          overThresholdCount: 0,
          risingCount: 0,
          zeroCount: 2,
          nullCount: 1,
        },
        topRisingVideos: [
          {
            id: 'v-zero',
            title: 'Video Zero VPH',
            url: 'https://youtube.com/watch?v=z',
            thumbnailUrl: '',
            publishedAt: new Date().toISOString(),
            latestViewCount: 1000,
            latestMeasuredVph: 0,
            latestDeltaViews: 0,
            isOverThreshold: false,
          },
          {
            id: 'v-null',
            title: 'Video Null VPH',
            url: 'https://youtube.com/watch?v=n',
            thumbnailUrl: '',
            publishedAt: new Date().toISOString(),
            latestViewCount: 500,
            latestMeasuredVph: null,
            latestDeltaViews: null,
            isOverThreshold: false,
          },
        ],
        topVphChartVideos: [],
        latestVideos: [],
        alertSummary: {
          total: 0,
          sent: 0,
          pending: 0,
          failed: 0,
          recentAlerts: [],
        },
      };

      vi.spyOn(channelAnalysisService, 'fetchChannelAnalysis').mockResolvedValue(mockAnalysisData as any);

      const wrapper = mount(ChannelDetailPage, {
        global: {
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
            AppIcon: true,
            ChannelVphChart: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      await nextTick();

      expect(wrapper.find('.panel-empty').exists()).toBe(true);
      expect(wrapper.find('.panel-empty').text()).toContain('Chưa có video nào ghi nhận VPH lớn hơn 0.');
      expect(wrapper.find('.featured-video-card').exists()).toBe(false);
      expect(wrapper.text()).not.toContain('#1 TĂNG TRƯỞNG CAO NHẤT');
    });

    it('only renders positive VPH videos in featured and secondary lists', async () => {
      const mockAnalysisData = {
        channel: {
          id: 'test-channel-id',
          name: 'Kênh Hỗn Hợp',
          handle: '@mixed',
          url: 'https://youtube.com/@mixed',
          avatarUrl: '',
          status: 'active' as const,
          scanLimit: 15,
          alertVphThreshold: 5000,
          source: 'manual' as const,
          notes: '',
          lastScanAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        totalVideos: 4,
        risingVideos: 2,
        maxVph: 3500,
        avgVph: 2000,
        distribution: {
          overThresholdCount: 0,
          risingCount: 2,
          zeroCount: 1,
          nullCount: 1,
        },
        topRisingVideos: [
          {
            id: 'v-top1',
            title: 'Top 1 Video',
            url: 'https://youtube.com/watch?v=1',
            thumbnailUrl: '',
            publishedAt: new Date().toISOString(),
            latestViewCount: 20000,
            latestMeasuredVph: 3500,
            latestDeltaViews: 500,
            isOverThreshold: false,
          },
          {
            id: 'v-top2',
            title: 'Top 2 Video',
            url: 'https://youtube.com/watch?v=2',
            thumbnailUrl: '',
            publishedAt: new Date().toISOString(),
            latestViewCount: 10000,
            latestMeasuredVph: 500,
            latestDeltaViews: 100,
            isOverThreshold: false,
          },
          {
            id: 'v-zero',
            title: 'Zero VPH Video',
            url: 'https://youtube.com/watch?v=0',
            thumbnailUrl: '',
            publishedAt: new Date().toISOString(),
            latestViewCount: 1000,
            latestMeasuredVph: 0,
            latestDeltaViews: 0,
            isOverThreshold: false,
          },
        ],
        topVphChartVideos: [],
        latestVideos: [],
        alertSummary: {
          total: 0,
          sent: 0,
          pending: 0,
          failed: 0,
          recentAlerts: [],
        },
      };

      vi.spyOn(channelAnalysisService, 'fetchChannelAnalysis').mockResolvedValue(mockAnalysisData as any);

      const wrapper = mount(ChannelDetailPage, {
        global: {
          stubs: {
            RouterLink: { template: '<a><slot /></a>' },
            AppIcon: true,
            ChannelVphChart: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      await nextTick();

      expect(wrapper.find('.featured-video-card').exists()).toBe(true);
      expect(wrapper.find('.featured-title').text()).toContain('Top 1 Video');

      const secondaryItems = wrapper.findAll('.v-card-item');
      expect(secondaryItems.length).toBe(1);
      expect(secondaryItems[0].text()).toContain('Top 2 Video');
      expect(wrapper.text()).not.toContain('Zero VPH Video');
    });
  });
});
