import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import VideoDetailPage from '@/pages/VideoDetailPage.vue';
import VideoInvestigationHero from '@/components/video-detail/VideoInvestigationHero.vue';
import VideoSignalSummary from '@/components/video-detail/VideoSignalSummary.vue';
import VideoGrowthAnalysis from '@/components/video-detail/VideoGrowthAnalysis.vue';
import VideoSnapshotHistory from '@/components/video-detail/VideoSnapshotHistory.vue';
import VideoChannelContext from '@/components/video-detail/VideoChannelContext.vue';
import VideoAlertContext from '@/components/video-detail/VideoAlertContext.vue';
import VideoGrowthCharts from '@/features/videos/components/VideoGrowthCharts.vue';
import { videoService } from '@/services/video-service';
import { productionService } from '@/services/production-service';
import type { VideoDetail } from '@/types/video';

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<any>('vue-router');
  return {
    ...actual,
    useRoute: () => ({
      params: { id: 'detail-vid-1' },
    }),
  };
});

const routerLinkStub = {
  template: '<a><slot /></a>',
};

const mockDetail: VideoDetail = {
  id: 'detail-vid-1',
  youtubeVideoId: 'yt-detail-1',
  channelId: 'ch-detail-1',
  title: 'Bí Quyết Tăng Trưởng Kênh YouTube Tự Động 2026',
  url: 'https://youtube.com/watch?v=yt-detail-1',
  thumbnailUrl: 'https://example.com/thumb-1.jpg',
  publishedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  duration: '14:25',
  latestViewCount: 48000,
  latestMeasuredVph: 6200,
  isOverThreshold: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  channel: {
    id: 'ch-detail-1',
    name: 'Kênh Đột Phá AI',
    handle: '@dotphaai',
    avatarUrl: 'https://example.com/avatar.jpg',
    alertVphThreshold: 4000,
    scanLimit: 10,
    status: 'active',
    url: 'https://youtube.com/channel/ch-1',
  },
  alert: {
    id: 'alt-detail-1',
    status: 'sent',
    measuredVph: 6200,
    sentAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    lastError: null,
  },
  snapshots: [
    {
      id: 'snap-2',
      checkedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
      viewCount: 48000,
      viewDelta: 3100,
      elapsedSeconds: 1800,
      measuredVph: 6200,
    },
    {
      id: 'snap-1',
      checkedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      viewCount: 44900,
      viewDelta: null,
      elapsedSeconds: null,
      measuredVph: null,
    },
  ],
  latestSnapshot: {
    id: 'snap-2',
    checkedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    viewCount: 48000,
    viewDelta: 3100,
    elapsedSeconds: 1800,
    measuredVph: 6200,
  },
};

const mockDetailNulls: VideoDetail = {
  ...mockDetail,
  id: 'detail-vid-nulls',
  latestViewCount: null,
  latestMeasuredVph: null,
  isOverThreshold: false,
  channel: {
    ...mockDetail.channel,
    alertVphThreshold: null,
  },
  alert: null,
  snapshots: [],
  latestSnapshot: null,
};

describe('Wave 3.6 — Video Investigation Workspace', () => {
  // 1. VideoInvestigationHero.vue
  describe('1. VideoInvestigationHero.vue', () => {
    it('1.1 Renders primary metrics: VPH, Views, Delta, Video age', () => {
      const wrapper = mount(VideoInvestigationHero, {
        props: { video: mockDetail },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.text()).toContain('6.2K VPH');
      expect(wrapper.text()).toContain('48K');
      expect(wrapper.text()).toContain('+3.1K');
      expect(wrapper.text()).toContain(mockDetail.title);
      expect(wrapper.text()).toContain(mockDetail.channel.name);
    });

    it('1.2 Handles null metrics with — and does not assume 5000 threshold', () => {
      const wrapper = mount(VideoInvestigationHero, {
        props: { video: mockDetailNulls },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.text()).toContain('—');
      expect(wrapper.text()).not.toContain('5000');
      expect(wrapper.text()).not.toContain('5K VPH');
      expect(wrapper.text()).toContain('CHƯA THIẾT LẬP NGƯỠNG');
    });

    it('1.3 Renders accurate alert badges: pending, sending, sent, failed', () => {
      const pendingWrapper = mount(VideoInvestigationHero, {
        props: {
          video: {
            ...mockDetail,
            alert: { id: 'alt-p', status: 'pending', measuredVph: 6000, sentAt: null, lastError: null },
          },
        },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(pendingWrapper.text()).toContain('Chờ gửi');

      const sendingWrapper = mount(VideoInvestigationHero, {
        props: {
          video: {
            ...mockDetail,
            alert: { id: 'alt-s', status: 'sending', measuredVph: 6000, sentAt: null, lastError: null },
          },
        },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(sendingWrapper.text()).toContain('Đang gửi');

      const failedWrapper = mount(VideoInvestigationHero, {
        props: {
          video: {
            ...mockDetail,
            alert: { id: 'alt-f', status: 'failed', measuredVph: 6000, sentAt: null, lastError: 'Rate limit' },
          },
        },
        global: { stubs: { 'router-link': routerLinkStub } },
      });
      expect(failedWrapper.text()).toContain('Gửi lỗi');
    });

    it('1.4 Emits add-production on production CTA click', async () => {
      const wrapper = mount(VideoInvestigationHero, {
        props: { video: mockDetail, isAddingToProduction: false },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      const prodBtn = wrapper.find('.btn-production');
      await prodBtn.trigger('click');
      expect(wrapper.emitted('add-production')).toBeTruthy();
    });
  });

  // 2. VideoSignalSummary.vue
  describe('2. VideoSignalSummary.vue', () => {
    it('2.1 Renders factual signals without fake scores', () => {
      const wrapper = mount(VideoSignalSummary, {
        props: { video: mockDetail },
      });

      expect(wrapper.text()).toContain('TÓM TẮT TÍN HIỆU');
      expect(wrapper.text()).toContain('6.200 VPH');
      expect(wrapper.text()).toContain('48.000');
      expect(wrapper.text()).toContain('+3.100 lượt xem');
      expect(wrapper.text()).toContain('2 lần');
      expect(wrapper.text()).not.toContain('/100');
    });
  });

  // 2b. VideoGrowthAnalysis.vue
  describe('2b. VideoGrowthAnalysis.vue', () => {
    it('2b.1 Renders growth analysis container with section header', () => {
      const wrapper = mount(VideoGrowthAnalysis, {
        props: { video: mockDetail },
      });

      expect(wrapper.text()).toContain('PHÂN TÍCH TĂNG TRƯỞNG');
      expect(wrapper.text()).toContain('TÓM TẮT TÍN HIỆU');
    });
  });

  // 3. VideoSnapshotHistory.vue
  describe('3. VideoSnapshotHistory.vue', () => {
    it('3.1 Renders snapshot table rows and supports newest/oldest toggle', async () => {
      const wrapper = mount(VideoSnapshotHistory, {
        props: { snapshots: mockDetail.snapshots },
      });

      expect(wrapper.text()).toContain('LỊCH SỬ SNAPSHOT');
      expect(wrapper.text()).toContain('2 lần quét');
      expect(wrapper.text()).toContain('48.000');
      expect(wrapper.text()).toContain('+3.100 lượt xem');

      const toggleBtns = wrapper.findAll('.sort-toggle-btn');
      expect(toggleBtns.length).toBe(2);
      await toggleBtns[1].trigger('click'); // Cũ nhất trước
      expect(toggleBtns[1].classes()).toContain('is-active');
    });

    it('3.2 Renders empty state message when snapshots list is empty', () => {
      const wrapper = mount(VideoSnapshotHistory, {
        props: { snapshots: [] },
      });

      expect(wrapper.text()).toContain('Chưa có lịch sử đo cho video này.');
    });
  });

  // 4. VideoChannelContext.vue
  describe('4. VideoChannelContext.vue', () => {
    it('4.1 Renders channel information, configuration, and navigation link', () => {
      const wrapper = mount(VideoChannelContext, {
        props: { channel: mockDetail.channel },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.text()).toContain('THÔNG TIN KÊNH ĐỐI THỦ');
      expect(wrapper.text()).toContain(mockDetail.channel.name);
      expect(wrapper.text()).toContain(mockDetail.channel.handle);
      expect(wrapper.text()).toContain('10 video mới nhất');
      expect(wrapper.text()).toContain('4.000 VPH');
    });
  });

  // 5. VideoAlertContext.vue
  describe('5. VideoAlertContext.vue', () => {
    it('5.1 Renders Discord event log and status details', () => {
      const wrapper = mount(VideoAlertContext, {
        props: { alert: mockDetail.alert, videoId: mockDetail.id },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.text()).toContain('TRẠNG THÁI CẢNH BÁO');
      expect(wrapper.text()).toContain('DISCORD EVENT LOG');
      expect(wrapper.text()).toContain('Đã cảnh báo');
      expect(wrapper.text()).toContain('6.200 VPH');
    });
  });

  // 6. VideoDetailPage.vue Full Workspace Integration
  describe('6. VideoDetailPage.vue Full Workspace Integration', () => {
    it('6.1 Loads and mounts full workspace with back button, refresh and action links', async () => {
      vi.spyOn(videoService, 'fetchVideoDetail').mockResolvedValueOnce(mockDetail);

      const wrapper = mount(VideoDetailPage, {
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Quay Lại Video Đang Tăng');
      expect(wrapper.text()).toContain('VIDEO INVESTIGATION WORKSPACE');
      expect(wrapper.text()).toContain(mockDetail.title);
      expect(wrapper.text()).toContain('PHÂN TÍCH TĂNG TRƯỞNG');
      expect(wrapper.text()).toContain('LỊCH SỬ SNAPSHOT');
      expect(wrapper.text()).toContain('THÔNG TIN KÊNH ĐỐI THỦ');
      expect(wrapper.text()).toContain('TRẠNG THÁI CẢNH BÁO');
    });

    it('6.2 Handles error when video detail fetch fails', async () => {
      vi.spyOn(videoService, 'fetchVideoDetail').mockRejectedValueOnce(new Error('Video không tồn tại'));

      const wrapper = mount(VideoDetailPage, {
        global: {
          stubs: {
            'router-link': routerLinkStub,
          },
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Video không tồn tại');
      expect(wrapper.text()).toContain('Quay Lại Danh Sách Video');
    });
  });

  // 7. VideoGrowthCharts Chronology & Data Integrity
  describe('7. VideoGrowthCharts Chronology & Data Integrity', () => {
    it('7.1 Sorts descending snapshots chronologically: chart renders past -> present from left to right', () => {
      const descendingSnapshots = [
        {
          id: 'snap-new',
          checkedAt: '2026-09-18T10:00:00Z',
          viewCount: 50000,
          viewDelta: 10000,
          elapsedSeconds: 3600,
          measuredVph: 10000,
        },
        {
          id: 'snap-old',
          checkedAt: '2026-09-18T09:00:00Z',
          viewCount: 40000,
          viewDelta: null,
          elapsedSeconds: null,
          measuredVph: null,
        },
      ];

      const wrapper = mount(VideoGrowthCharts, {
        props: {
          snapshots: descendingSnapshots,
          threshold: 5000,
        },
      });

      const circles = wrapper.findAll('.views-node');
      expect(circles.length).toBe(2);
      const cx0 = Number(circles[0].attributes('cx'));
      const cx1 = Number(circles[1].attributes('cx'));
      expect(cx0).toBeLessThan(cx1);
      expect(wrapper.text()).toContain('50.000');
    });

    it('7.2 Computes latestView correctly as newest snapshot even when array order is inverted', () => {
      const invertedSnapshots = [
        {
          id: 'snap-future',
          checkedAt: '2026-09-18T12:00:00Z',
          viewCount: 99999,
          viewDelta: 20000,
          elapsedSeconds: 3600,
          measuredVph: 20000,
        },
        {
          id: 'snap-mid',
          checkedAt: '2026-09-18T11:00:00Z',
          viewCount: 79999,
          viewDelta: 15000,
          elapsedSeconds: 3600,
          measuredVph: 15000,
        },
        {
          id: 'snap-past',
          checkedAt: '2026-09-18T10:00:00Z',
          viewCount: 64999,
          viewDelta: null,
          elapsedSeconds: null,
          measuredVph: null,
        },
      ];

      const wrapper = mount(VideoGrowthCharts, {
        props: {
          snapshots: invertedSnapshots,
        },
      });

      expect(wrapper.text()).toContain('99.999 lượt xem');
    });
  });

  // 8. Wave 3.6 Data Integrity & Production Notes
  describe('8. Wave 3.6 Data Integrity & Production Notes', () => {
    it('8.1 Renders — when latestViewCount is null', () => {
      const wrapper = mount(VideoInvestigationHero, {
        props: {
          video: {
            ...mockDetail,
            latestViewCount: null,
          },
        },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      const telemetryBox = wrapper.findAll('.telemetry-box')[0];
      expect(telemetryBox.text()).toContain('LƯỢT XEM HIỆN TẠI');
      expect(telemetryBox.text()).toContain('—');
    });

    it('8.2 VideoDetailPage source code has zero contract-markers or v-if="false" dead code', () => {
      const pagePath = path.resolve(__dirname, '../src/pages/VideoDetailPage.vue');
      const content = fs.readFileSync(pagePath, 'utf-8');

      expect(content).not.toContain('contract-markers');
      expect(content).not.toContain('v-if="false"');
      expect(content).not.toContain('SectionMarker');
    });

    it('8.3 Writes "Chưa đủ dữ liệu" instead of 0 for null latestMeasuredVph in production notes', async () => {
      const spyCreate = vi.spyOn(productionService, 'createProductionItem').mockResolvedValueOnce({
        id: 'prod-new-1',
        title: 'test',
      } as any);

      vi.spyOn(videoService, 'fetchVideoDetail').mockResolvedValueOnce({
        ...mockDetail,
        latestMeasuredVph: null,
      });

      const wrapper = mount(VideoDetailPage, {
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      await flushPromises();

      const hero = wrapper.findComponent(VideoInvestigationHero);
      hero.vm.$emit('add-production');

      await flushPromises();

      expect(spyCreate).toHaveBeenCalledTimes(1);
      const payload = spyCreate.mock.calls[0][0];
      expect(payload.notes).toContain('VPH đo được: Chưa đủ dữ liệu');
      expect(payload.notes).not.toContain('VPH đo được: 0');
    });

    it('8.4 Renders — when channel scanLimit is null', () => {
      const wrapper = mount(VideoChannelContext, {
        props: {
          channel: {
            ...mockDetail.channel,
            scanLimit: null,
          },
        },
        global: { stubs: { 'router-link': routerLinkStub } },
      });

      expect(wrapper.text()).toContain('Giới hạn quét');
      expect(wrapper.text()).toContain('—');
    });
  });
});
