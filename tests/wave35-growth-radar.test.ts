import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import GrowthStatusBadge from '@/components/growth/GrowthStatusBadge.vue';
import GrowthSummaryStrip from '@/components/growth/GrowthSummaryStrip.vue';
import GrowthRadarHero from '@/components/growth/GrowthRadarHero.vue';
import GrowthRadarLanes from '@/components/growth/GrowthRadarLanes.vue';
import GrowthRadarCandidateStream from '@/components/growth/GrowthRadarCandidateStream.vue';
import GrowthLargeCard from '@/components/growth/GrowthLargeCard.vue';
import GrowthListRow from '@/components/growth/GrowthListRow.vue';
import GrowthTableView from '@/components/growth/GrowthTableView.vue';
import GrowthCompactGrid from '@/components/growth/GrowthCompactGrid.vue';
import VideosPage from '@/pages/VideosPage.vue';
import { videoService } from '@/services/video-service';
import type { VideoListItem, VideoStatsSummary } from '@/types/video';

const routerLinkStub = {
  template: '<a><slot /></a>',
};

const mockVideo: VideoListItem = {
  id: 'growth-vid-1',
  youtubeVideoId: 'yt-growth-1',
  channelId: 'ch-growth-1',
  title: 'Chế Tạo Máy Cắt Laser Mini Tự Động',
  url: 'https://youtube.com/watch?v=yt-growth-1',
  thumbnailUrl: 'https://example.com/growth-1.jpg',
  publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  latestViewCount: 52000,
  latestMeasuredVph: 8400,
  latestDeltaViews: 2100,
  channel: {
    id: 'ch-growth-1',
    name: 'Sáng Tạo Kỹ Thuật',
    handle: '@sangtaokythuật',
    avatarUrl: 'https://example.com/avatar1.jpg',
    alertVphThreshold: 5000,
  },
  alert: {
    id: 'alt-growth-1',
    status: 'sent',
    measuredVph: 8400,
    sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  isOverThreshold: true,
};

const mockVideoPending: VideoListItem = {
  ...mockVideo,
  id: 'growth-vid-pending',
  alert: {
    id: 'alt-growth-pending',
    status: 'pending',
    measuredVph: 8400,
    sentAt: null,
  },
};

const mockVideoSending: VideoListItem = {
  ...mockVideo,
  id: 'growth-vid-sending',
  alert: {
    id: 'alt-growth-sending',
    status: 'sending',
    measuredVph: 8400,
    sentAt: null,
  },
};

const mockVideoFailed: VideoListItem = {
  ...mockVideo,
  id: 'growth-vid-failed',
  alert: {
    id: 'alt-growth-failed',
    status: 'failed',
    measuredVph: 8400,
    sentAt: null,
  },
};

const mockVideo2: VideoListItem = {
  id: 'growth-vid-2',
  youtubeVideoId: 'yt-growth-2',
  channelId: 'ch-growth-2',
  title: 'Khôi Phục Động Cơ Cổ 50 Năm Tuổi',
  url: 'https://youtube.com/watch?v=yt-growth-2',
  thumbnailUrl: null,
  publishedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  latestViewCount: 14000,
  latestMeasuredVph: 1200,
  latestDeltaViews: 400,
  channel: {
    id: 'ch-growth-2',
    name: 'Phục Chế Xe Cổ',
    handle: '@phuchexeco',
    avatarUrl: null,
    alertVphThreshold: 2000,
  },
  alert: null,
  isOverThreshold: false,
};

const mockVideoNulls: VideoListItem = {
  id: 'growth-vid-null',
  youtubeVideoId: 'yt-growth-null',
  channelId: 'ch-growth-null',
  title: 'Video Chưa Đo Lường',
  url: 'https://youtube.com/watch?v=yt-growth-null',
  thumbnailUrl: null,
  publishedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  latestViewCount: null,
  latestMeasuredVph: null,
  latestDeltaViews: null,
  channel: {
    id: 'ch-growth-null',
    name: 'Kênh Mới Tạo',
    handle: null,
    avatarUrl: null,
    alertVphThreshold: null,
  },
  alert: null,
  isOverThreshold: false,
};

const mockStats: VideoStatsSummary = {
  totalVideos: 40,
  risingVideos: 18,
  maxVph: 8400,
  totalDelta: 12600,
  alertedVideos: 6,
};

describe('Wave 3.5 — Growth Signal Radar Components', () => {
  // 1. GrowthStatusBadge.vue
  describe('1. GrowthStatusBadge.vue', () => {
    it('1.1 Renders alert statuses with accurate tone and labels', () => {
      const sent = mount(GrowthStatusBadge, {
        props: { type: 'alert', alertStatus: 'sent' },
      });
      expect(sent.text()).toBe('ĐÃ CẢNH BÁO');
      expect(sent.classes()).toContain('tone-success');

      const pending = mount(GrowthStatusBadge, {
        props: { type: 'alert', alertStatus: 'pending' },
      });
      expect(pending.text()).toBe('CHỜ GỬI');
      expect(pending.classes()).toContain('tone-warning');

      const none = mount(GrowthStatusBadge, {
        props: { type: 'alert', alertStatus: null },
      });
      expect(none.text()).toBe('CHƯA CẢNH BÁO');
      expect(none.classes()).toContain('tone-neutral');
    });

    it('1.2 Renders rising and threshold states', () => {
      const rising = mount(GrowthStatusBadge, {
        props: { type: 'rising', measuredVph: 1500 },
      });
      expect(rising.text()).toBe('ĐANG TĂNG');
      expect(rising.classes()).toContain('tone-accent');

      const notRising = mount(GrowthStatusBadge, {
        props: { type: 'rising', measuredVph: 0 },
      });
      expect(notRising.text()).toBe('CHƯA TĂNG');
    });

    it('1.3 Renders pending, sending, and failed alert statuses accurately', () => {
      const pending = mount(GrowthStatusBadge, {
        props: { type: 'alert', alertStatus: 'pending' },
      });
      expect(pending.text()).toBe('CHỜ GỬI');
      expect(pending.classes()).toContain('tone-warning');

      const sending = mount(GrowthStatusBadge, {
        props: { type: 'alert', alertStatus: 'sending' },
      });
      expect(sending.text()).toBe('ĐANG GỬI');
      expect(sending.classes()).toContain('tone-warning');

      const failed = mount(GrowthStatusBadge, {
        props: { type: 'alert', alertStatus: 'failed' },
      });
      expect(failed.text()).toBe('GỬI LỖI');
      expect(failed.classes()).toContain('tone-danger');
    });

    it('1.4 Renders alert statuses correctly across all 6 growth view components', () => {
      // Hero: pending -> CHỜ GỬI
      const heroPending = mount(GrowthRadarHero, {
        props: { video: mockVideoPending, isVphSelection: false },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(heroPending.text()).toContain('CHỜ GỬI');

      // LargeCard: sending -> ĐANG GỬI
      const cardSending = mount(GrowthLargeCard, {
        props: { video: mockVideoSending },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(cardSending.text()).toContain('ĐANG GỬI');

      // ListRow: failed -> GỬI LỖI
      const rowFailed = mount(GrowthListRow, {
        props: { video: mockVideoFailed },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(rowFailed.text()).toContain('GỬI LỖI');

      // TableView: pending, sending, failed all rendered
      const tableView = mount(GrowthTableView, {
        props: { videos: [mockVideoPending, mockVideoSending, mockVideoFailed] },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(tableView.text()).toContain('CHỜ GỬI');
      expect(tableView.text()).toContain('ĐANG GỬI');
      expect(tableView.text()).toContain('GỬI LỖI');

      // CompactGrid: sending -> ĐANG GỬI
      const compact = mount(GrowthCompactGrid, {
        props: { videos: [mockVideoSending] },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(compact.text()).toContain('ĐANG GỬI');

      // CandidateStream: failed -> GỬI LỖI
      const stream = mount(GrowthRadarCandidateStream, {
        props: { candidates: [mockVideoFailed] },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(stream.text()).toContain('GỬI LỖI');
    });
  });

  // 2. GrowthSummaryStrip.vue
  describe('2. GrowthSummaryStrip.vue', () => {
    it('2.1 Renders 4 growth metrics correctly', () => {
      const wrapper = mount(GrowthSummaryStrip, {
        props: {
          stats: mockStats,
          loading: false,
        },
      });

      expect(wrapper.text()).toContain('18');
      expect(wrapper.text()).toContain('8.4K VPH');
      expect(wrapper.text()).toContain('+12.6K');
      expect(wrapper.text()).toContain('6');
      expect(wrapper.text()).toContain('VIDEO ĐANG TĂNG');
    });

    it('2.2 Displays skeleton shimmer when loading', () => {
      const wrapper = mount(GrowthSummaryStrip, {
        props: {
          stats: mockStats,
          loading: true,
        },
      });

      const skeletons = wrapper.findAll('.skeleton-card');
      expect(skeletons.length).toBe(4);
    });
  });

  // 3. GrowthRadarHero.vue
  describe('3. GrowthRadarHero.vue', () => {
    it('3.1 Renders radar featured hero showcase with VPH, channel, and links', () => {
      const wrapper = mount(GrowthRadarHero, {
        props: {
          video: mockVideo,
          isVphSelection: true,
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain('TÍN HIỆU VPH CAO NHẤT');
      expect(wrapper.text()).toContain(mockVideo.title);
      expect(wrapper.text()).toContain(mockVideo.channel.name);
      expect(wrapper.text()).toContain('8.4K VPH');
      expect(wrapper.text()).toContain('52K');
      expect(wrapper.text()).toContain('+2.1K');
      expect(wrapper.find('.btn-yt-action').attributes('href')).toBe(mockVideo.url);
    });

    it('3.2 Handles nulls safely with — representation', () => {
      const wrapper = mount(GrowthRadarHero, {
        props: {
          video: mockVideoNulls,
          isVphSelection: false,
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain('TÍN HIỆU NỔI BẬT');
      expect(wrapper.text()).toContain('—');
    });
  });

  // 4. GrowthRadarLanes.vue
  describe('4. GrowthRadarLanes.vue', () => {
    it('4.1 Calculates factual counts for lanes and emits filter event on click', async () => {
      const wrapper = mount(GrowthRadarLanes, {
        props: {
          videos: [mockVideo, mockVideo2, mockVideoNulls],
          activeFilter: 'all',
        },
      });

      expect(wrapper.text()).toContain('ĐANG TĂNG (VPH > 0)');
      expect(wrapper.text()).toContain('2 video');
      expect(wrapper.text()).toContain('ĐÃ CẢNH BÁO');
      expect(wrapper.text()).toContain('1 video');

      const chips = wrapper.findAll('.radar-lane-chip');
      await chips[0].trigger('click');
      expect(wrapper.emitted('select-filter')).toBeTruthy();
      expect(wrapper.emitted('select-filter')![0][0]).toBe('rising');
    });
  });

  // 5. GrowthRadarCandidateStream.vue
  describe('5. GrowthRadarCandidateStream.vue', () => {
    it('5.1 Renders candidate rows and emits select-featured', async () => {
      const wrapper = mount(GrowthRadarCandidateStream, {
        props: {
          candidates: [mockVideo2],
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain(mockVideo2.title);
      expect(wrapper.text()).toContain('1.2K VPH');

      await wrapper.find('.stream-row').trigger('click');
      expect(wrapper.emitted('select-featured')).toBeTruthy();
      expect(wrapper.emitted('select-featured')![0][0]).toEqual(mockVideo2);
    });
  });

  // 6. GrowthLargeCard.vue
  describe('6. GrowthLargeCard.vue', () => {
    it('6.1 Renders large card layout with metrics and action buttons', () => {
      const wrapper = mount(GrowthLargeCard, {
        props: {
          video: mockVideo,
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain(mockVideo.title);
      expect(wrapper.text()).toContain('8.4K VPH');
      expect(wrapper.text()).toContain('52K');
      expect(wrapper.text()).toContain('+2.1K');
    });
  });

  // 7. GrowthListRow.vue
  describe('7. GrowthListRow.vue', () => {
    it('7.1 Renders horizontal media-first row', () => {
      const wrapper = mount(GrowthListRow, {
        props: {
          video: mockVideo,
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain(mockVideo.title);
      expect(wrapper.text()).toContain('8.4K VPH');
      expect(wrapper.text()).toContain(mockVideo.channel.name);
    });
  });

  // 8. GrowthTableView.vue
  describe('8. GrowthTableView.vue', () => {
    it('8.1 Renders power-user table with columns and compact actions', () => {
      const wrapper = mount(GrowthTableView, {
        props: {
          videos: [mockVideo],
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain(mockVideo.title);
      expect(wrapper.text()).toContain('8.4K VPH');
      expect(wrapper.text()).toContain('52K');
      expect(wrapper.text()).toContain('ĐÃ CẢNH BÁO');
    });
  });

  // 9. GrowthCompactGrid.vue
  describe('9. GrowthCompactGrid.vue', () => {
    it('9.1 Renders compact card with VPH and delta', () => {
      const wrapper = mount(GrowthCompactGrid, {
        props: {
          videos: [mockVideo, mockVideo2],
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain(mockVideo.title);
      expect(wrapper.text()).toContain('8.4K VPH');
      expect(wrapper.text()).toContain(mockVideo2.title);
      expect(wrapper.text()).toContain('1.2K VPH');
    });
  });

  // 10. videoService Data Operations
  describe('10. videoService Data Operations', () => {
    it('10.1 Sorts by VPH desc correctly with nulls at the end', () => {
      const sorted = videoService.sortVideos(
        [mockVideo2, mockVideoNulls, mockVideo],
        'vph_desc'
      );

      expect(sorted[0].id).toBe(mockVideo.id); // 8400
      expect(sorted[1].id).toBe(mockVideo2.id); // 1200
      expect(sorted[2].id).toBe(mockVideoNulls.id); // null
    });

    it('10.2 Sorts by Delta desc correctly with nulls at the end', () => {
      const sorted = videoService.sortVideos(
        [mockVideoNulls, mockVideo2, mockVideo],
        'delta_desc'
      );

      expect(sorted[0].id).toBe(mockVideo.id); // 2100
      expect(sorted[1].id).toBe(mockVideo2.id); // 400
      expect(sorted[2].id).toBe(mockVideoNulls.id); // null
    });

    it('10.3 Filters by rising status', () => {
      const filtered = videoService.filterVideos(
        [mockVideo, mockVideo2, mockVideoNulls],
        'rising',
        'all',
        ''
      );

      expect(filtered.length).toBe(2);
      expect(filtered.map(v => v.id)).not.toContain(mockVideoNulls.id);
    });

    it('10.4 Filters by alerted status', () => {
      const filtered = videoService.filterVideos(
        [mockVideo, mockVideo2, mockVideoNulls],
        'alerted',
        'all',
        ''
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(mockVideo.id);
    });

    it('10.5 Filters by search query in title and channel name', () => {
      const filteredByTitle = videoService.filterVideos(
        [mockVideo, mockVideo2],
        'all',
        'all',
        'Laser'
      );
      expect(filteredByTitle.length).toBe(1);
      expect(filteredByTitle[0].id).toBe(mockVideo.id);

      const filteredByChannel = videoService.filterVideos(
        [mockVideo, mockVideo2],
        'all',
        'all',
        'Phục Chế'
      );
      expect(filteredByChannel.length).toBe(1);
      expect(filteredByChannel[0].id).toBe(mockVideo2.id);
    });
  });

  // 11. VideosPage Integration Contract
  describe('11. VideosPage Integration Contract', () => {
    it('11.1 Custom featured selection does not carry VPH CAO NHẤT label (renders TÍN HIỆU NỔI BẬT)', async () => {
      vi.spyOn(videoService, 'fetchTrendingVideos').mockResolvedValueOnce({
        videos: [mockVideo, mockVideo2], // mockVideo has 8400, mockVideo2 has 1200
        stats: mockStats,
      });

      const wrapper = mount(VideosPage, {
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      await flushPromises();

      // Ban đầu mockVideo (8400 - max VPH) được chọn làm featured
      expect(wrapper.find('.featured-kicker').text()).toContain('TÍN HIỆU VPH CAO NHẤT');

      // Click vào candidate mockVideo2 (1200 - không phải max VPH)
      const streamRow = wrapper.find('.stream-row');
      await streamRow.trigger('click');

      // Bây giờ featured là mockVideo2, không được mang label VPH CAO NHẤT mà phải là TÍN HIỆU NỔI BẬT
      expect(wrapper.find('.featured-kicker').text()).toContain('TÍN HIỆU NỔI BẬT');
      expect(wrapper.find('.featured-kicker').text()).not.toContain('TÍN HIỆU VPH CAO NHẤT');
    });

    it('11.2 Empty state has route /video-moi-dang via action-to', async () => {
      vi.spyOn(videoService, 'fetchTrendingVideos').mockResolvedValueOnce({
        videos: [],
        stats: { totalVideos: 0, risingVideos: 0, maxVph: null, totalDelta: null, alertedVideos: 0 },
      });

      const wrapper = mount(VideosPage, {
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      await flushPromises();

      const emptyState = wrapper.findComponent({ name: 'EmptyState' });
      expect(emptyState.exists()).toBe(true);
      expect(emptyState.props('actionTo')).toBe('/video-moi-dang');
    });
  });
});
