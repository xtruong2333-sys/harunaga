import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OverviewHero from '@/components/overview/OverviewHero.vue';
import OverviewMetricCluster from '@/components/overview/OverviewMetricCluster.vue';
import OverviewPerformance from '@/components/overview/OverviewPerformance.vue';
import OverviewOpportunityFeed from '@/components/overview/OverviewOpportunityFeed.vue';
import OverviewCompetitorList from '@/components/overview/OverviewCompetitorList.vue';
import OverviewAlertPanel from '@/components/overview/OverviewAlertPanel.vue';
import OverviewDataHealth from '@/components/overview/OverviewDataHealth.vue';
import OverviewScanLog from '@/components/overview/OverviewScanLog.vue';
import { DashboardSummary, DashboardTopVideo, DashboardChannelSummary, DashboardAlertSummary, DashboardScanRun } from '@/types/dashboard';

describe('Wave 3.1 YouTube Intelligence Command Center Components', () => {
  describe('1. OverviewMetricCluster.vue', () => {
    it('1.1 Renders all 4 key micro-metrics with tabular formatting', () => {
      const wrapper = mount(OverviewMetricCluster, {
        props: {
          activeChannels: 12,
          totalVideos: 3450,
          risingVideos: 18,
          maxVph: 12500,
          loading: false,
        },
      });

      expect(wrapper.text()).toContain('KÊNH ĐANG THEO DÕI');
      expect(wrapper.text()).toContain('12');
      expect(wrapper.text()).toContain('TỔNG VIDEO');
      expect(wrapper.text()).toContain((3450).toLocaleString('vi-VN'));
      expect(wrapper.text()).toContain('ĐANG TĂNG');
      expect(wrapper.text()).toContain('18');
      expect(wrapper.text()).toContain('MAX VPH');
      expect(wrapper.text()).toContain((12500).toLocaleString('vi-VN'));
    });

    it('1.2 Handles loading state with skeleton placeholders', () => {
      const wrapper = mount(OverviewMetricCluster, {
        props: {
          activeChannels: 0,
          totalVideos: 0,
          risingVideos: 0,
          maxVph: null,
          loading: true,
        },
      });

      expect(wrapper.findAll('.kpi-skeleton').length).toBe(4);
    });

    it('1.3 Handles null or 0 values gracefully when not loading', () => {
      const wrapper = mount(OverviewMetricCluster, {
        props: {
          activeChannels: 0,
          totalVideos: 0,
          risingVideos: 0,
          maxVph: null,
          loading: false,
        },
      });

      expect(wrapper.text()).toContain('0');
      expect(wrapper.text()).toContain('—');
    });
  });

  describe('2. OverviewHero.vue', () => {
    it('2.1 Renders intelligence command center hero and status', () => {
      const mockSummary: Partial<DashboardSummary> = {
        activeChannelsCount: 8,
        totalVideosCount: 240,
        risingVideosCount: 4,
        maxVph: 8400,
        latestScan: {
          id: 'scan-1',
          triggerSource: 'manual',
          status: 'success',
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          channelsTotal: 8,
          channelsSuccess: 8,
          channelsFailed: 0,
          videosFound: 240,
          snapshotsCreated: 240,
          alertsSent: 2,
          errorSummary: null,
        },
      };

      const wrapper = mount(OverviewHero, {
        props: {
          summary: mockSummary as DashboardSummary,
          loading: false,
        },
      });

      expect(wrapper.text()).toContain('Bắt Bài Đối Thủ');
      expect(wrapper.text()).toContain('YOUTUBE INTELLIGENCE SYSTEM');
      expect(wrapper.text()).toContain('Hệ thống đang hoạt động');
      expect(wrapper.find('.status-success').exists()).toBe(true);
    });

    it('2.2 Displays running state when latest scan is running', () => {
      const mockSummary: Partial<DashboardSummary> = {
        activeChannelsCount: 8,
        totalVideosCount: 240,
        risingVideosCount: 4,
        maxVph: 8400,
        latestScan: {
          id: 'scan-1',
          triggerSource: 'schedule',
          status: 'running',
          startedAt: new Date().toISOString(),
          finishedAt: null,
          channelsTotal: 8,
          channelsSuccess: 4,
          channelsFailed: 0,
          videosFound: 120,
          snapshotsCreated: 120,
          alertsSent: 0,
          errorSummary: null,
        },
      };

      const wrapper = mount(OverviewHero, {
        props: {
          summary: mockSummary as DashboardSummary,
          loading: false,
        },
      });

      expect(wrapper.text()).toContain('Đang quét dữ liệu');
      expect(wrapper.find('.pulse-dot').exists()).toBe(true);
    });

    it('2.3 Displays synchronizing label when loading prop is true', () => {
      const wrapper = mount(OverviewHero, {
        props: {
          summary: null,
          loading: true,
        },
      });

      expect(wrapper.text()).toContain('Đang đồng bộ dữ liệu...');
    });
  });

  describe('3. OverviewPerformance.vue', () => {
    it('3.1 Computes and displays rising ratio and channel success rate correctly', () => {
      const mockSummary: Partial<DashboardSummary> = {
        activeChannelsCount: 10,
        totalVideosCount: 100,
        risingVideosCount: 25,
        maxVph: 5600,
        latestScan: {
          id: 'scan-1',
          triggerSource: 'manual',
          status: 'success',
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          channelsTotal: 10,
          channelsSuccess: 10,
          channelsFailed: 0,
          videosFound: 100,
          snapshotsCreated: 1540,
          alertsSent: 48,
          errorSummary: null,
        },
        alertSummary: {
          total: 50,
          sent: 48,
          pending: 2,
          failed: 0,
        },
      };

      const wrapper = mount(OverviewPerformance, {
        props: {
          summary: mockSummary as DashboardSummary,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('PHÂN TÍCH TÍN HIỆU');
      expect(wrapper.text()).toContain('25% (25 / 100)');
      expect(wrapper.text()).toContain('100% (10 / 10)');
      expect(wrapper.text()).toContain('1540');
      expect(wrapper.text()).toContain('48');
    });
  });

  describe('4. OverviewOpportunityFeed.vue', () => {
    const mockVideos: DashboardTopVideo[] = [
      {
        id: 'vid-1',
        youtubeVideoId: 'yt-1',
        channelId: 'ch-1',
        title: 'Cách làm video triệu view 2026',
        channelName: 'Tech Master VN',
        channelAvatarUrl: null,
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        url: 'https://youtube.com/watch?v=yt-1',
        publishedAt: new Date().toISOString(),
        latestMeasuredVph: 4500,
        latestDeltaViews: 1200,
        latestViewCount: 55000,
        isOverThreshold: true,
        alertVphThreshold: 1000,
      },
      {
        id: 'vid-2',
        youtubeVideoId: 'yt-2',
        channelId: 'ch-2',
        title: 'Review công nghệ AI mới nhất',
        channelName: 'AI Channel',
        channelAvatarUrl: null,
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        url: 'https://youtube.com/watch?v=yt-2',
        publishedAt: new Date().toISOString(),
        latestMeasuredVph: 2100,
        latestDeltaViews: null,
        latestViewCount: 32000,
        isOverThreshold: false,
        alertVphThreshold: 1000,
      },
    ];

    it('4.1 Renders neutral #1 VPH CAO NHẤT rank tag and secondary list', () => {
      const wrapper = mount(OverviewOpportunityFeed, {
        props: {
          videos: mockVideos,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('Cách làm video triệu view 2026');
      expect(wrapper.text()).toContain('Tech Master VN');
      expect(wrapper.text()).toContain((4500).toLocaleString('vi-VN'));
      expect(wrapper.text()).toContain('#1 VPH CAO NHẤT');
      expect(wrapper.text()).toContain('VƯỢT NGƯỠNG');
      expect(wrapper.text()).toContain((1200).toLocaleString('vi-VN'));

      // Secondary list
      expect(wrapper.text()).toContain('Review công nghệ AI mới nhất');
      expect(wrapper.text()).toContain('AI Channel');
    });

    it('4.2 Shows empty state when no opportunity videos exist', () => {
      const wrapper = mount(OverviewOpportunityFeed, {
        props: {
          videos: [],
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('Chưa có video nào ghi nhận tốc độ tăng trưởng VPH');
    });
  });

  describe('5. OverviewCompetitorList.vue', () => {
    const mockChannels: DashboardChannelSummary[] = [
      {
        channelId: 'chan-1',
        channelName: 'Kênh Đối Thủ 1',
        channelHandle: '@doithu1',
        avatarUrl: null,
        totalVideos: 45,
        risingVideoCount: 6,
        maxVph: 8200,
      },
      {
        channelId: 'chan-2',
        channelName: 'Kênh Đối Thủ 2',
        channelHandle: '@doithu2',
        avatarUrl: null,
        totalVideos: 20,
        risingVideoCount: 1,
        maxVph: 1500,
      },
    ];

    it('5.1 Renders top competitors table with ranking and indicators', () => {
      const wrapper = mount(OverviewCompetitorList, {
        props: {
          channels: mockChannels,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('Kênh Đối Thủ 1');
      expect(wrapper.text()).toContain((8200).toLocaleString('vi-VN'));
      expect(wrapper.text()).toContain('6 đang tăng');
      expect(wrapper.text()).toContain('45 video');
      expect(wrapper.text()).toContain('Kênh Đối Thủ 2');
    });
  });

  describe('6. OverviewAlertPanel.vue & DataHealth.vue', () => {
    it('6.1 Renders alert distribution correctly in OverviewAlertPanel', () => {
      const mockAlerts: DashboardAlertSummary = {
        total: 50,
        sent: 45,
        pending: 3,
        failed: 2,
      };

      const wrapper = mount(OverviewAlertPanel, {
        props: {
          alertSummary: mockAlerts,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('50');
      expect(wrapper.text()).toContain('45');
      expect(wrapper.text()).toContain('3');
      expect(wrapper.text()).toContain('2');
    });

    it('6.2 Renders data health telemetry and Xem chi tiết link in OverviewDataHealth', () => {
      const mockScan: DashboardScanRun = {
        id: 'run-1',
        triggerSource: 'manual',
        status: 'success',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        channelsTotal: 10,
        channelsSuccess: 10,
        channelsFailed: 0,
        videosFound: 320,
        snapshotsCreated: 320,
        alertsSent: 0,
        errorSummary: null,
      };

      const wrapper = mount(OverviewDataHealth, {
        props: {
          latestScan: mockScan,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('Thành công');
      expect(wrapper.text()).toContain('Xem chi tiết');
      expect(wrapper.text()).toContain('Kích hoạt thủ công');
      expect(wrapper.text()).toContain('10 / 10 kênh');
      expect(wrapper.text()).toContain('320 video');
      expect(wrapper.text()).toContain('320 snapshot');
    });

    it('6.3 Shows "Chưa có dữ liệu" when latestScan is null in OverviewDataHealth', () => {
      const wrapper = mount(OverviewDataHealth, {
        props: {
          latestScan: null,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('Chưa có dữ liệu');
      expect(wrapper.text()).not.toContain('Kích hoạt thủ công');
    });
  });

  describe('7. OverviewScanLog.vue', () => {
    it('7.1 Renders recent scan logs table', () => {
      const mockScans: DashboardScanRun[] = [
        {
          id: 'log-1',
          triggerSource: 'schedule',
          status: 'success',
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          channelsTotal: 12,
          channelsSuccess: 12,
          channelsFailed: 0,
          videosFound: 450,
          snapshotsCreated: 450,
          alertsSent: 5,
          errorSummary: null,
        },
      ];

      const wrapper = mount(OverviewScanLog, {
        props: {
          scans: mockScans,
        },
      });

      expect(wrapper.text()).toContain('Tự động');
      expect(wrapper.text()).toContain('Thành công');
      expect(wrapper.text()).toContain('12 / 12');
      expect(wrapper.text()).toContain('450');
      expect(wrapper.text()).toContain('5');
    });
  });
});
