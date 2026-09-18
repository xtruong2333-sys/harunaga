import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChannelStatusBadge from '@/components/channels/ChannelStatusBadge.vue';
import ChannelActionsMenu from '@/components/channels/ChannelActionsMenu.vue';
import ChannelDeleteModal from '@/components/channels/ChannelDeleteModal.vue';
import ChannelSummaryStrip from '@/components/channels/ChannelSummaryStrip.vue';
import ChannelLargeCard from '@/components/channels/ChannelLargeCard.vue';
import ChannelMediumCard from '@/components/channels/ChannelMediumCard.vue';
import ChannelListRow from '@/components/channels/ChannelListRow.vue';
import ChannelTableView from '@/components/channels/ChannelTableView.vue';
import { Channel } from '@/types/channel';

const mockChannel: Channel = {
  id: 'ch-test-1',
  youtubeChannelId: 'UC_test_123',
  name: 'Review Công Nghệ VN',
  handle: '@reviewcongnghe',
  url: 'https://youtube.com/@reviewcongnghe',
  avatarUrl: 'https://example.com/avatar.jpg',
  status: 'active',
  scanLimit: 15,
  alertVphThreshold: 5000,
  source: 'manual',
  notes: 'Kênh đối thủ trọng điểm',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastScanAt: new Date(Date.now() - 3600000).toISOString(),
  totalVideos: 42,
  risingVideoCount: 5,
  maxVph: 8500,
};

describe('Wave 3.2 Competitor Intelligence Workspace Components', () => {
  describe('1. ChannelStatusBadge.vue', () => {
    it('1.1 Renders active status badge correctly', () => {
      const wrapper = mount(ChannelStatusBadge, {
        props: { status: 'active' },
      });
      expect(wrapper.text()).toContain('Đang theo dõi');
      expect(wrapper.classes()).toContain('status-active');
    });

    it('1.2 Renders paused status badge correctly', () => {
      const wrapper = mount(ChannelStatusBadge, {
        props: { status: 'paused' },
      });
      expect(wrapper.text()).toContain('Tạm dừng');
      expect(wrapper.classes()).toContain('status-paused');
    });

    it('1.3 Renders archived status badge correctly', () => {
      const wrapper = mount(ChannelStatusBadge, {
        props: { status: 'archived' },
      });
      expect(wrapper.text()).toContain('Đã lưu trữ');
      expect(wrapper.classes()).toContain('status-archived');
    });
  });

  describe('2. ChannelSummaryStrip.vue', () => {
    it('2.1 Renders 4 core compact metrics', () => {
      const wrapper = mount(ChannelSummaryStrip, {
        props: {
          totalCount: 18,
          activeCount: 15,
          risingVideosCount: 27,
          maxVph: 12400,
          loading: false,
        },
      });

      expect(wrapper.text()).toContain('18');
      expect(wrapper.text()).toContain('KÊNH THEO DÕI');
      expect(wrapper.text()).toContain('15');
      expect(wrapper.text()).toContain('ĐANG HOẠT ĐỘNG');
      expect(wrapper.text()).toContain('27');
      expect(wrapper.text()).toContain('VIDEO ĐANG TĂNG');
      expect(wrapper.text()).toContain((12400).toLocaleString('vi-VN'));
      expect(wrapper.text()).toContain('MAX VPH TOÀN MẠNG');
    });

    it('2.2 Renders skeleton placeholders when loading', () => {
      const wrapper = mount(ChannelSummaryStrip, {
        props: {
          totalCount: 0,
          activeCount: 0,
          risingVideosCount: 0,
          maxVph: null,
          loading: true,
        },
      });

      expect(wrapper.findAll('.strip-skeleton').length).toBe(4);
    });
  });

  describe('3. ChannelActionsMenu.vue', () => {
    it('3.1 Toggles dropdown menu on click and emits actions', async () => {
      const wrapper = mount(ChannelActionsMenu, {
        props: {
          channel: mockChannel,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.find('.menu-dropdown').exists()).toBe(false);

      const btn = wrapper.find('.btn-dots');
      await btn.trigger('click');

      expect(wrapper.find('.menu-dropdown').exists()).toBe(true);
      expect(wrapper.text()).toContain('Xem phân tích chi tiết');
      expect(wrapper.text()).toContain('Tạm dừng theo dõi');
      expect(wrapper.text()).toContain('Ngừng theo dõi');

      // Trigger pause
      const pauseBtn = wrapper.findAll('.menu-item').find(el => el.text().includes('Tạm dừng theo dõi'));
      expect(pauseBtn).toBeDefined();
      await pauseBtn!.trigger('click');

      expect(wrapper.emitted('pause')).toBeTruthy();
      expect(wrapper.emitted('pause')![0]).toEqual([mockChannel.id]);
    });
  });

  describe('4. ChannelDeleteModal.vue', () => {
    it('4.1 Renders warning with channel name and confirms archive action', async () => {
      const wrapper = mount(ChannelDeleteModal, {
        props: {
          modelValue: true,
          channel: mockChannel,
        },
      });

      expect(wrapper.text()).toContain('Ngừng theo dõi kênh?');
      expect(wrapper.text()).toContain('Review Công Nghệ VN');

      const confirmBtn = wrapper.find('.btn-danger');
      expect(confirmBtn.exists()).toBe(true);
      await confirmBtn.trigger('click');

      expect(wrapper.emitted('confirm')).toBeTruthy();
      expect(wrapper.emitted('confirm')![0]).toEqual([mockChannel.id]);
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
    });
  });

  describe('5. ChannelLargeCard.vue', () => {
    it('5.1 Renders large card with identity, micro-metrics, and signal bar', () => {
      const wrapper = mount(ChannelLargeCard, {
        props: {
          channel: mockChannel,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('Review Công Nghệ VN');
      expect(wrapper.text()).toContain('@reviewcongnghe');
      expect(wrapper.text()).toContain('Đang theo dõi');
      expect(wrapper.text()).toContain('42');
      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain((8500).toLocaleString('vi-VN'));
      expect(wrapper.text()).toContain('5 video');
      expect(wrapper.find('.sig-fill').attributes('style')).toContain('width: 100%');
    });
  });

  describe('6. ChannelMediumCard.vue', () => {
    it('6.1 Renders compact medium card', () => {
      const wrapper = mount(ChannelMediumCard, {
        props: {
          channel: mockChannel,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('Review Công Nghệ VN');
      expect(wrapper.text()).toContain('@reviewcongnghe');
      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain((8500).toLocaleString('vi-VN'));
    });
  });

  describe('7. ChannelListRow.vue', () => {
    it('7.1 Renders horizontal list row', () => {
      const wrapper = mount(ChannelListRow, {
        props: {
          channel: mockChannel,
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('Review Công Nghệ VN');
      expect(wrapper.text()).toContain('@reviewcongnghe');
      expect(wrapper.text()).toContain('42');
      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain((8500).toLocaleString('vi-VN'));
    });
  });

  describe('8. ChannelTableView.vue', () => {
    it('8.1 Renders table headers and rows with channel telemetry', () => {
      const wrapper = mount(ChannelTableView, {
        props: {
          channels: [mockChannel],
        },
        global: {
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      expect(wrapper.text()).toContain('KÊNH');
      expect(wrapper.text()).toContain('TRẠNG THÁI');
      expect(wrapper.text()).toContain('VIDEO THEO DÕI');
      expect(wrapper.text()).toContain('Review Công Nghệ VN');
      expect(wrapper.text()).toContain('42');
      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain((8500).toLocaleString('vi-VN'));
    });
  });
});
