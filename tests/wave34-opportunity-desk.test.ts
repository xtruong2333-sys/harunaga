import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OpportunityStatusBadge from '@/components/opportunity/OpportunityStatusBadge.vue';
import OpportunitySignalReason from '@/components/opportunity/OpportunitySignalReason.vue';
import OpportunitySummaryStrip from '@/components/opportunity/OpportunitySummaryStrip.vue';
import OpportunityFeaturedHero from '@/components/opportunity/OpportunityFeaturedHero.vue';
import OpportunityCandidateRail from '@/components/opportunity/OpportunityCandidateRail.vue';
import OpportunityLargeCard from '@/components/opportunity/OpportunityLargeCard.vue';
import OpportunityListRow from '@/components/opportunity/OpportunityListRow.vue';
import OpportunityTableView from '@/components/opportunity/OpportunityTableView.vue';
import OpportunityCompareView from '@/components/opportunity/OpportunityCompareView.vue';
import OpportunityChartView from '@/components/opportunity/OpportunityChartView.vue';
import type { OpportunityVideo, OpportunityStats } from '@/types/opportunity';

const routerLinkStub = {
  template: '<a><slot /></a>',
};

const mockVideo: OpportunityVideo = {
  id: 'opp-vid-1',
  youtubeVideoId: 'yt-opp-123',
  channelId: 'ch-opp-1',
  title: 'Bí Kíp Sáng Chế Động Cơ Không Chổi Than',
  url: 'https://youtube.com/watch?v=yt-opp-123',
  thumbnailUrl: 'https://example.com/opp-thumb.jpg',
  publishedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  videoAge: '3 giờ',
  latestViewCount: 45000,
  latestMeasuredVph: 6200,
  latestDeltaViews: 1200,
  channel: {
    id: 'ch-opp-1',
    name: 'Sáng Tạo DIY',
    handle: '@sangtaodiy',
    avatarUrl: 'https://example.com/avatar.jpg',
    alertVphThreshold: 5000,
  },
  thresholdRatio: 124,
  isOverThreshold: true,
  alert: {
    id: 'alt-1',
    status: 'sent',
    measuredVph: 6200,
    sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
};

const mockVideo2: OpportunityVideo = {
  id: 'opp-vid-2',
  youtubeVideoId: 'yt-opp-456',
  channelId: 'ch-opp-2',
  title: 'Chế Tạo Pin Lithium Từ Phế Liệu',
  url: 'https://youtube.com/watch?v=yt-opp-456',
  thumbnailUrl: null,
  publishedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
  videoAge: '10 giờ',
  latestViewCount: 18000,
  latestMeasuredVph: 2400,
  latestDeltaViews: 300,
  channel: {
    id: 'ch-opp-2',
    name: 'Thợ Chế Cơ Khí',
    handle: '@thocokhi',
    avatarUrl: null,
    alertVphThreshold: 3000,
  },
  thresholdRatio: 80,
  isOverThreshold: false,
  alert: null,
};

const mockStats: OpportunityStats = {
  potentialCount: 24,
  new24hCount: 8,
  maxVph: 12400,
  overThresholdCount: 7,
};

describe('Wave 3.4 — Opportunity Intelligence Desk Components', () => {
  // 1. OpportunityStatusBadge.vue
  describe('1. OpportunityStatusBadge.vue', () => {
    it('1.1 Renders VƯỢT NGƯỠNG badge when isOverThreshold is true', () => {
      const wrapper = mount(OpportunityStatusBadge, {
        props: {
          type: 'threshold',
          isOverThreshold: true,
        },
      });

      expect(wrapper.text()).toBe('VƯỢT NGƯỠNG');
      expect(wrapper.classes()).toContain('tone-success');
    });

    it('1.2 Renders CHƯA VƯỢT badge when isOverThreshold is false', () => {
      const wrapper = mount(OpportunityStatusBadge, {
        props: {
          type: 'threshold',
          isOverThreshold: false,
        },
      });

      expect(wrapper.text()).toBe('CHƯA VƯỢT');
      expect(wrapper.classes()).toContain('tone-neutral');
    });
  });

  // 2. OpportunitySignalReason.vue
  describe('2. OpportunitySignalReason.vue', () => {
    it('2.1 Renders bullet facts from real metrics without AI hallucination', () => {
      const wrapper = mount(OpportunitySignalReason, {
        props: {
          video: mockVideo,
        },
      });

      expect(wrapper.text()).toContain('6.2K VPH');
      expect(wrapper.text()).toContain('Vượt ngưỡng kênh: +1.2K VPH (124%)');
      expect(wrapper.text()).toContain('Tăng gần nhất: +1.2K lượt xem');
      expect(wrapper.text()).toContain('3 giờ');
      expect(wrapper.text()).toContain('Đã phát cảnh báo tự động');
    });
  });

  // 3. OpportunitySummaryStrip.vue
  describe('3. OpportunitySummaryStrip.vue', () => {
    it('3.1 Renders 4 compact metrics correctly when loaded', () => {
      const wrapper = mount(OpportunitySummaryStrip, {
        props: {
          stats: mockStats,
          loading: false,
          hasMore: false,
        },
      });

      expect(wrapper.text()).toContain('24');
      expect(wrapper.text()).toContain('7');
      expect(wrapper.text()).toContain('8');
      expect(wrapper.text()).toContain('12.4K VPH');
      expect(wrapper.text()).toContain('ỨNG VIÊN TIỀM NĂNG');
    });

    it('3.2 Renders skeletons when loading prop is true', () => {
      const wrapper = mount(OpportunitySummaryStrip, {
        props: {
          stats: mockStats,
          loading: true,
        },
      });

      const skeletons = wrapper.findAll('.skeleton-summary-item');
      expect(skeletons.length).toBe(4);
    });
  });

  // 4. OpportunityFeaturedHero.vue
  describe('4. OpportunityFeaturedHero.vue', () => {
    it('4.1 Renders featured candidate showcase with VPH, channel, and action links', () => {
      const wrapper = mount(OpportunityFeaturedHero, {
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
      expect(wrapper.text()).toContain(mockVideo.channel.name);
      expect(wrapper.text()).toContain('6.2K VPH');
      expect(wrapper.text()).toContain('45K');
      expect(wrapper.find('.btn-yt-action').attributes('href')).toBe(mockVideo.url);
    });
  });

  // 5. OpportunityCandidateRail.vue
  describe('5. OpportunityCandidateRail.vue', () => {
    it('5.1 Renders other candidates and emits select event on click', async () => {
      const wrapper = mount(OpportunityCandidateRail, {
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
      expect(wrapper.text()).toContain('2.4K VPH');

      await wrapper.find('.rail-card').trigger('click');
      expect(wrapper.emitted('select')).toBeTruthy();
      expect(wrapper.emitted('select')![0][0]).toEqual(mockVideo2);
    });
  });

  // 6. OpportunityLargeCard.vue
  describe('6. OpportunityLargeCard.vue', () => {
    it('6.1 Renders large card layout with metrics and actions', () => {
      const wrapper = mount(OpportunityLargeCard, {
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
      expect(wrapper.text()).toContain('6.2K VPH');
      expect(wrapper.text()).toContain('124%');
    });
  });

  // 7. OpportunityListRow.vue
  describe('7. OpportunityListRow.vue', () => {
    it('7.1 Renders horizontal row layout', () => {
      const wrapper = mount(OpportunityListRow, {
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
      expect(wrapper.text()).toContain(mockVideo.channel.name);
      expect(wrapper.text()).toContain('6.2K VPH');
    });
  });

  // 8. OpportunityTableView.vue
  describe('8. OpportunityTableView.vue', () => {
    it('8.1 Renders table row with columns and mini thumbnail', () => {
      const wrapper = mount(OpportunityTableView, {
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
      expect(wrapper.text()).toContain(mockVideo.channel.name);
      expect(wrapper.text()).toContain('6.2K VPH');
    });
  });

  // 9. OpportunityCompareView.vue
  describe('9. OpportunityCompareView.vue', () => {
    it('9.1 Renders comparison grid for selected candidates', () => {
      const wrapper = mount(OpportunityCompareView, {
        props: {
          allCandidates: [mockVideo, mockVideo2],
        },
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      expect(wrapper.text()).toContain('SO SÁNH ỨNG VIÊN');
      expect(wrapper.text()).toContain(mockVideo.title);
      expect(wrapper.text()).toContain(mockVideo2.title);
      expect(wrapper.text()).toContain('6.2K VPH');
      expect(wrapper.text()).toContain('2.4K VPH');
    });
  });

  // 10. OpportunityChartView.vue
  describe('10. OpportunityChartView.vue', () => {
    it('10.1 Renders factual bar charts for VPH and Delta', () => {
      const wrapper = mount(OpportunityChartView, {
        props: {
          videos: [mockVideo, mockVideo2],
        },
      });

      expect(wrapper.text()).toContain('TỐC ĐỘ VPH CỦA TOP ỨNG VIÊN');
      expect(wrapper.text()).toContain('LƯỢT XEM TĂNG GẦN NHẤT (DELTA)');
      expect(wrapper.text()).toContain('6.2K VPH');
      expect(wrapper.text()).toContain('+1.2K');
    });
  });
});
