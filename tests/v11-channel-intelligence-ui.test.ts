import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChannelStatsHeader from '@/features/channels/components/ChannelStatsHeader.vue';
import ChannelTableHeader from '@/features/channels/components/ChannelTableHeader.vue';
import ChannelDesktopTable from '@/features/channels/components/ChannelDesktopTable.vue';
import ChannelMobileList from '@/features/channels/components/ChannelMobileList.vue';
import ChannelVphChart from '@/features/channels/components/ChannelVphChart.vue';
import { Channel } from '@/types/channel';

const mockChannels: Channel[] = [
  {
    id: 'ch-1',
    youtubeChannelId: 'UC123',
    name: 'Kênh Đối Thủ Alpha',
    handle: '@alpha_channel',
    url: 'https://youtube.com/@alpha_channel',
    avatarUrl: 'https://example.com/alpha.jpg',
    status: 'active',
    scanLimit: 15,
    alertVphThreshold: 5000,
    source: 'manual',
    notes: '',
    lastScanAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ch-2',
    youtubeChannelId: 'UC456',
    name: 'Kênh Đối Thủ Beta',
    handle: '@beta_channel',
    url: 'https://youtube.com/@beta_channel',
    avatarUrl: '',
    status: 'paused',
    scanLimit: 10,
    alertVphThreshold: 2000,
    source: 'manual',
    notes: '',
    lastScanAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('V1.1 Wave 2: Channel Intelligence Workspace Components', () => {
  describe('ChannelStatsHeader.vue', () => {
    it('renders horizontal intelligence strip with focal active count and pulse indicator', () => {
      const wrapper = mount(ChannelStatsHeader, {
        props: {
          totalCount: 12,
          activeCount: 8,
          pausedCount: 4,
        },
      });

      expect(wrapper.find('.channel-stats-strip').exists()).toBe(true);
      expect(wrapper.find('.stat-focal').exists()).toBe(true);
      expect(wrapper.find('.pulse-indicator').exists()).toBe(true);
      expect(wrapper.text()).toContain('Đang theo dõi');
      expect(wrapper.text()).toContain('8');
      expect(wrapper.text()).toContain('Tổng số kênh');
      expect(wrapper.text()).toContain('12');
      expect(wrapper.text()).toContain('Tạm dừng quét');
      expect(wrapper.text()).toContain('4');
    });
  });

  describe('ChannelTableHeader.vue', () => {
    it('renders segmented filter pills and emits events', async () => {
      const wrapper = mount(ChannelTableHeader, {
        props: {
          searchQuery: '',
          currentFilter: 'all',
          currentSort: 'newest',
          counts: {
            all: 10,
            active: 7,
            paused: 2,
            archived: 1,
          },
        },
        global: {
          stubs: {
            AppIcon: true,
          },
        },
      });

      const pills = wrapper.findAll('.tab-pill');
      expect(pills.length).toBe(4);
      expect(wrapper.find('.search-input').exists()).toBe(true);

      // Click on 'Đang theo dõi' pill
      await pills[1].trigger('click');
      expect(wrapper.emitted('update:currentFilter')).toBeTruthy();
      expect(wrapper.emitted('update:currentFilter')![0]).toEqual(['active']);
    });
  });

  describe('ChannelDesktopTable.vue', () => {
    it('renders directory rows with status border classes and technical config badges', () => {
      const wrapper = mount(ChannelDesktopTable, {
        props: {
          channels: mockChannels,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
            AppIcon: true,
          },
        },
      });

      const rows = wrapper.findAll('.table-row');
      expect(rows.length).toBe(2);
      expect(rows[0].classes()).toContain('row-status-active');
      expect(rows[1].classes()).toContain('row-status-paused');

      expect(wrapper.text()).toContain('Kênh Đối Thủ Alpha');
      expect(wrapper.text()).toContain('@alpha_channel');
      expect(wrapper.text()).toContain('15');
      expect(wrapper.text()).toContain('video / lần');
      expect(wrapper.text()).toContain('5.000');
    });
  });

  describe('ChannelMobileList.vue', () => {
    it('renders mobile cards with status indicator classes and action buttons', () => {
      const wrapper = mount(ChannelMobileList, {
        props: {
          channels: mockChannels,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
            AppIcon: true,
          },
        },
      });

      const cards = wrapper.findAll('.mobile-card');
      expect(cards.length).toBe(2);
      expect(cards[0].classes()).toContain('card-status-active');
      expect(cards[1].classes()).toContain('card-status-paused');
      expect(wrapper.text()).toContain('Kênh Đối Thủ Alpha');
      expect(wrapper.text()).toContain('5.000 VPH');
    });
  });

  describe('ChannelVphChart.vue', () => {
    it('renders horizontal bars for measurable VPH videos and threshold badge', () => {
      const wrapper = mount(ChannelVphChart, {
        props: {
          threshold: 5000,
          videos: [
            {
              id: 'v-1',
              title: 'Video Breakout 1',
              youtubeVideoId: 'yt1',
              url: 'https://youtube.com/watch?v=yt1',
              thumbnailUrl: '',
              publishedAt: new Date().toISOString(),
              latestViewCount: 25000,
              latestMeasuredVph: 7200,
              latestDeltaViews: 1500,
              isOverThreshold: true,
              alertStatus: 'sent',
            },
            {
              id: 'v-2',
              title: 'Video Standard 2',
              youtubeVideoId: 'yt2',
              url: 'https://youtube.com/watch?v=yt2',
              thumbnailUrl: '',
              publishedAt: new Date().toISOString(),
              latestViewCount: 8000,
              latestMeasuredVph: 1200,
              latestDeltaViews: 300,
              isOverThreshold: false,
              alertStatus: null,
            },
          ],
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.find('.threshold-badge').text()).toContain('5.000');
      const barRows = wrapper.findAll('.bar-row');
      expect(barRows.length).toBe(2);
      expect(wrapper.text()).toContain('7.200 VPH');
      expect(wrapper.text()).toContain('1.200 VPH');
      expect(wrapper.find('.badge-threshold-tag').exists()).toBe(true);
    });
  });
});
