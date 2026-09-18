import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import RecentVideoSummaryStrip from '@/components/videos/recent/RecentVideoSummaryStrip.vue';
import RecentVideoLargeCard from '@/components/videos/recent/RecentVideoLargeCard.vue';
import RecentVideoGridCard from '@/components/videos/recent/RecentVideoGridCard.vue';
import RecentVideoListRow from '@/components/videos/recent/RecentVideoListRow.vue';
import RecentVideoTableView from '@/components/videos/recent/RecentVideoTableView.vue';
import RecentVideoGallery from '@/components/videos/recent/RecentVideoGallery.vue';
import type { NewVideoItem, NewVideoSummary } from '@/types/new-videos';

const routerLinkStub = {
  template: '<a><slot /></a>',
};

const mockVideo: NewVideoItem = {
  id: 'vid-test-1',
  youtubeVideoId: 'yt-xyz-123',
  title: 'Bí Quyết Tăng Trưởng Kênh YouTube 2026',
  thumbnailUrl: 'https://i.ytimg.com/vi/yt-xyz-123/hqdefault.jpg',
  publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  channelId: 'ch-1',
  channelName: 'Review Công Nghệ',
  channelHandle: '@reviewcongnghe',
  channelAvatarUrl: 'https://example.com/avatar.jpg',
  latestViewCount: 154000,
  latestMeasuredVph: 4800,
  latestViewDelta: 12400,
  latestSnapshotCheckedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  firstSnapshotCheckedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  firstObservedMinutesAfterPublish: 15,
  alertStatus: 'sent',
  hasAlert: true,
};

const mockSummary: NewVideoSummary = {
  totalVideos: 42,
  totalChannels: 12,
  risingVideos: 18,
  maxVph: 12000,
};

describe('Wave 3.3 — Recent Video Intelligence Library Components', () => {
  // 1. VideoThumbnail.vue
  describe('1. VideoThumbnail.vue', () => {
    it('1.1 Renders image with correct src and alt', () => {
      const wrapper = mount(VideoThumbnail, {
        props: {
          src: mockVideo.thumbnailUrl,
          alt: mockVideo.title,
          youtubeVideoId: mockVideo.youtubeVideoId,
          detailUrl: '/videos/' + mockVideo.id,
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      const img = wrapper.find('.thumbnail-image');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe(mockVideo.thumbnailUrl);
      expect(img.attributes('alt')).toBe(mockVideo.title);
    });

    it('1.2 Switches to fallback placeholder on image error', async () => {
      const wrapper = mount(VideoThumbnail, {
        props: {
          src: 'https://invalid-url.com/nonexistent.jpg',
          alt: 'Faulty Image',
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      const img = wrapper.find('.thumbnail-image');
      await img.trigger('error');

      expect(wrapper.find('.thumbnail-image').exists()).toBe(false);
      expect(wrapper.find('.thumbnail-fallback').exists()).toBe(true);
    });

    it('1.3 Displays neutral VPH badge without arbitrary high-vph threshold class', () => {
      const wrapper = mount(VideoThumbnail, {
        props: {
          src: mockVideo.thumbnailUrl,
          vphBadge: 4800,
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      expect(wrapper.find('.vph-overlay-badge').text()).toContain('4.8K VPH');
      expect(wrapper.find('.is-high-vph').exists()).toBe(false);
    });
  });

  // 2. RecentVideoSummaryStrip.vue
  describe('2. RecentVideoSummaryStrip.vue', () => {
    it('2.1 Renders 4 metrics correctly when loaded', () => {
      const wrapper = mount(RecentVideoSummaryStrip, {
        props: {
          summary: mockSummary,
          loading: false,
          hasMore: false,
        },
      });

      expect(wrapper.text()).toContain('42');
      expect(wrapper.text()).toContain('12');
      expect(wrapper.text()).toContain('18');
      expect(wrapper.text()).toContain('12K VPH');
      expect(wrapper.text()).toContain('VIDEO MỚI');
    });

    it('2.2 Renders skeleton boxes when loading prop is true', () => {
      const wrapper = mount(RecentVideoSummaryStrip, {
        props: {
          summary: mockSummary,
          loading: true,
        },
      });

      const skeletons = wrapper.findAll('.skeleton-summary-item');
      expect(skeletons.length).toBe(4);
    });

    it('2.3 Displays (ĐÃ TẢI) suffix when hasMore is true', () => {
      const wrapper = mount(RecentVideoSummaryStrip, {
        props: {
          summary: mockSummary,
          loading: false,
          hasMore: true,
        },
      });

      expect(wrapper.text()).toContain('VIDEO (ĐÃ TẢI)');
      expect(wrapper.text()).toContain('KÊNH (ĐÃ TẢI)');
      expect(wrapper.text()).toContain('MAX VPH (ĐÃ TẢI)');
    });
  });

  // 3. RecentVideoLargeCard.vue (Default view mode)
  describe('3. RecentVideoLargeCard.vue', () => {
    it('3.1 Renders title, channel name, VPH, and views', () => {
      const wrapper = mount(RecentVideoLargeCard, {
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
      expect(wrapper.text()).toContain(mockVideo.channelName);
      expect(wrapper.text()).toContain('4.8K VPH');
      expect(wrapper.text()).toContain('154K');
    });

    it('3.2 Falls back avatar initial letter when channelAvatarUrl fails', async () => {
      const wrapper = mount(RecentVideoLargeCard, {
        props: {
          video: mockVideo,
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      const avatar = wrapper.find('.channel-avatar');
      await avatar.trigger('error');

      expect(wrapper.find('.avatar-fallback').text()).toBe('R');
    });

    it('3.3 Contains correct external YouTube link', () => {
      const wrapper = mount(RecentVideoLargeCard, {
        props: {
          video: mockVideo,
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      const ytBtn = wrapper.find('.btn-yt');
      expect(ytBtn.attributes('href')).toBe(`https://www.youtube.com/watch?v=${mockVideo.youtubeVideoId}`);
      expect(ytBtn.attributes('target')).toBe('_blank');
    });
  });

  // 4. RecentVideoGridCard.vue
  describe('4. RecentVideoGridCard.vue', () => {
    it('4.1 Renders compact card with title and metrics', () => {
      const wrapper = mount(RecentVideoGridCard, {
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
      expect(wrapper.text()).toContain(mockVideo.channelName);
      expect(wrapper.text()).toContain('4.8K VPH');
    });
  });

  // 5. RecentVideoListRow.vue
  describe('5. RecentVideoListRow.vue', () => {
    it('5.1 Renders horizontal row with title and action buttons', () => {
      const wrapper = mount(RecentVideoListRow, {
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
      expect(wrapper.text()).toContain(mockVideo.channelName);
      expect(wrapper.find('.btn-yt-link').attributes('href')).toBe(`https://www.youtube.com/watch?v=${mockVideo.youtubeVideoId}`);
    });
  });

  // 6. RecentVideoTableView.vue
  describe('6. RecentVideoTableView.vue', () => {
    it('6.1 Renders table rows with formatted metrics and links', () => {
      const wrapper = mount(RecentVideoTableView, {
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
      expect(wrapper.text()).toContain(mockVideo.channelName);
      expect(wrapper.find('.vph-tag').text()).toContain('4.8K VPH');
    });
  });

  // 7. RecentVideoGallery.vue
  describe('7. RecentVideoGallery.vue', () => {
    it('7.1 Renders gallery grid with video items', () => {
      const wrapper = mount(RecentVideoGallery, {
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
      expect(wrapper.text()).toContain(mockVideo.channelName);
    });
  });
});
