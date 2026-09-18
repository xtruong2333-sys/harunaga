import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ViewModeSwitcher from '../src/components/ui/ViewModeSwitcher.vue';
import FilterBar from '../src/components/ui/FilterBar.vue';
import PageHeader from '../src/components/ui/PageHeader.vue';
import EmptyState from '../src/components/ui/EmptyState.vue';
import ErrorState from '../src/components/ui/ErrorState.vue';

describe('Wave 3.0 Shared UI Foundation Components', () => {
  // 1. ViewModeSwitcher.vue
  describe('1. ViewModeSwitcher.vue', () => {
    const modes = [
      { id: 'grid', label: 'Lưới', icon: 'grid' },
      { id: 'table', label: 'Bảng', icon: 'list' },
    ];

    it('1.1 Renders mode options correctly and handles selection', async () => {
      const wrapper = mount(ViewModeSwitcher, {
        props: {
          modelValue: 'grid',
          modes,
        },
      });

      const buttons = wrapper.findAll('.mode-btn');
      expect(buttons.length).toBe(2);
      expect(buttons[0].classes()).toContain('is-active');
      expect(buttons[1].classes()).not.toContain('is-active');

      await buttons[1].trigger('click');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['table']);
      expect(wrapper.emitted('change')?.[0]).toEqual(['table']);
    });

    it('1.2 Saves and restores mode from localStorage when storageKey is provided', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('table');

      const wrapper = mount(ViewModeSwitcher, {
        props: {
          modelValue: 'grid',
          modes,
          storageKey: 'test_view_mode',
        },
      });

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['table']);

      const buttons = wrapper.findAll('.mode-btn');
      await buttons[0].trigger('click');
      expect(setItemSpy).toHaveBeenCalledWith('test_view_mode', 'grid');

      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
    });
  });

  // 2. FilterBar.vue
  describe('2. FilterBar.vue', () => {
    it('2.1 Emits search input updates and clear event', async () => {
      const wrapper = mount(FilterBar, {
        props: {
          search: 'youtube',
          totalCount: 150,
          filteredCount: 25,
          hasActiveFilters: true,
        },
      });

      expect(wrapper.find('.count-val').text()).toBe('25');
      expect(wrapper.find('.count-total').text()).toContain('150');

      const input = wrapper.find('.search-input');
      expect((input.element as HTMLInputElement).value).toBe('youtube');

      const clearSearchBtn = wrapper.find('.clear-search-btn');
      await clearSearchBtn.trigger('click');
      expect(wrapper.emitted('update:search')?.[0]).toEqual(['']);

      const clearFiltersBtn = wrapper.find('.btn-clear-filters');
      await clearFiltersBtn.trigger('click');
      expect(wrapper.emitted('clear')).toBeTruthy();
    });
  });

  // 3. PageHeader.vue
  describe('3. PageHeader.vue', () => {
    it('3.1 Renders kicker, title, description and badge', () => {
      const wrapper = mount(PageHeader, {
        props: {
          kicker: 'TỔNG QUAN HỆ THỐNG',
          title: 'Trung Tâm Chỉ Huy',
          description: 'Mô tả trung tâm chỉ huy tình báo',
          badge: 'Live',
          badgeTone: 'success',
        },
      });

      expect(wrapper.find('.page-kicker').text()).toBe('TỔNG QUAN HỆ THỐNG');
      expect(wrapper.find('.page-title').text()).toBe('Trung Tâm Chỉ Huy');
      expect(wrapper.find('.page-description').text()).toBe('Mô tả trung tâm chỉ huy tình báo');
      expect(wrapper.find('.badge-success').text()).toBe('Live');
    });
  });

  // 4. EmptyState.vue
  describe('4. EmptyState.vue', () => {
    it('4.1 Renders title, description, and emits action', async () => {
      const wrapper = mount(EmptyState, {
        props: {
          title: 'Chưa có dữ liệu',
          description: 'Vui lòng thêm kênh để bắt đầu',
          actionText: 'Thêm Kênh',
        },
      });

      expect(wrapper.find('.empty-title').text()).toBe('Chưa có dữ liệu');
      expect(wrapper.find('.empty-desc').text()).toBe('Vui lòng thêm kênh để bắt đầu');

      const btn = wrapper.find('button.btn-primary');
      await btn.trigger('click');
      expect(wrapper.emitted('action')).toBeTruthy();
    });
  });

  // 5. ErrorState.vue
  describe('5. ErrorState.vue', () => {
    it('5.1 Renders error title, message and emits retry', async () => {
      const wrapper = mount(ErrorState, {
        props: {
          title: 'Lỗi tải kênh',
          message: 'Không thể kết nối đến máy chủ',
          retryText: 'Thử lại ngay',
          showRetry: true,
        },
      });

      expect(wrapper.find('.error-title').text()).toBe('Lỗi tải kênh');
      expect(wrapper.find('.error-message').text()).toBe('Không thể kết nối đến máy chủ');

      const retryBtn = wrapper.find('.retry-btn');
      expect(retryBtn.text()).toContain('Thử lại ngay');

      await retryBtn.trigger('click');
      expect(wrapper.emitted('retry')).toBeTruthy();
    });
  });
});
