import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import AppIntro from '../src/components/motion/AppIntro.vue';
import RevealItem from '../src/components/motion/RevealItem.vue';
import MobileNavDrawer from '../src/components/ui/MobileNavDrawer.vue';
import App from '../src/App.vue';
import router from '../src/router';

describe('Bắt Bài Đối Thủ — Phase 19: Professional UI / UX / Motion Redesign', () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Cinematic Entry Screen (AppIntro.vue)
  describe('1. Màn hình Cinematic Entry Screen (AppIntro.vue)', () => {
    it('1.1 Render đầy đủ các thành phần nhận diện thương hiệu Bắt Bài Đối Thủ', () => {
      const wrapper = mount(AppIntro);

      expect(wrapper.find('.brand-title').text()).toBe('BẮT BÀI ĐỐI THỦ');
      expect(wrapper.find('.brand-tagline').text()).toContain('Theo dõi đối thủ • Phát hiện video tăng nhanh');
      expect(wrapper.find('.status-indicator').text()).toContain('Hệ thống sẵn sàng');
      expect(wrapper.find('.status-dot').exists()).toBe(true);
      expect(wrapper.find('.logo-shield').exists()).toBe(true);
      expect(wrapper.findAll('.orbital-ring').length).toBe(3);
    });

    it('1.2 Nút CTA có nhãn "Vào Bảng Điều Khiển" và icon mũi tên', () => {
      const wrapper = mount(AppIntro);
      const btn = wrapper.find('.entry-cta-btn');

      expect(btn.exists()).toBe(true);
      expect(btn.text()).toContain('Vào Bảng Điều Khiển');
      expect(wrapper.find('.btn-arrow').exists()).toBe(true);
      expect(wrapper.find('.btn-shimmer').exists()).toBe(true);
    });

    it('1.3 Bấm nút CTA kích hoạt hiệu ứng exit và emit event "enter"', async () => {
      vi.useFakeTimers();
      const wrapper = mount(AppIntro);
      const btn = wrapper.find('.entry-cta-btn');

      await btn.trigger('click');

      // Ngay sau khi click, class intro-exiting được gắn
      expect(wrapper.classes()).toContain('intro-exiting');
      expect(wrapper.emitted('enter')).toBeUndefined();

      // Sau thời gian animation kết thúc (360ms)
      vi.advanceTimersByTime(370);
      expect(wrapper.emitted('enter')).toBeDefined();
      expect(wrapper.emitted('enter')!.length).toBe(1);
    });

    it('1.4 Nhấn phím Enter hoặc Space trên nút CTA cũng kích hoạt chuyển cảnh', async () => {
      vi.useFakeTimers();
      const wrapper = mount(AppIntro);
      const btn = wrapper.find('.entry-cta-btn');

      await btn.trigger('keydown.enter');
      expect(wrapper.classes()).toContain('intro-exiting');

      vi.advanceTimersByTime(370);
      expect(wrapper.emitted('enter')!.length).toBe(1);
    });

    it('1.5 Không lưu trạng thái vĩnh viễn vào localStorage hoặc sessionStorage để hard refresh luôn xuất hiện', () => {
      const wrapper = mount(AppIntro);
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
      wrapper.unmount();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });
  });

  // 2. Mobile Navigation Drawer (MobileNavDrawer.vue)
  describe('2. Mobile Navigation Drawer (MobileNavDrawer.vue)', () => {
    const globalPlugins = {
      global: {
        plugins: [router],
      },
    };

    it('2.1 Hiển thị đầy đủ 12 link điều hướng của toàn bộ hệ thống', () => {
      const wrapper = mount(MobileNavDrawer, {
        props: { modelValue: true },
        ...globalPlugins,
      });

      const navLinks = wrapper.findAllComponents({ name: 'RouterLink' });
      expect(navLinks.length).toBe(12);

      const expectedPaths = [
        '/tong-quan',
        '/bao-cao',
        '/video-moi-dang',
        '/video-tiem-nang',
        '/videos',
        '/kenh-theo-doi',
        '/so-sanh-kenh',
        '/lich-dang-doi-thu',
        '/lich-su-canh-bao',
        '/tro-ly-noi-dung',
        '/tien-do-san-xuat',
        '/tinh-trang-du-lieu',
      ];

      const renderedPaths = navLinks.map((link) => link.props('to'));
      expect(renderedPaths).toEqual(expectedPaths);
    });

    it('2.2 Bấm nút X hoặc backdrop emit sự kiện đóng drawer', async () => {
      const wrapper = mount(MobileNavDrawer, {
        props: { modelValue: true },
        attachTo: document.body,
        ...globalPlugins,
      });

      const closeBtn = document.body.querySelector('.close-btn') as HTMLElement;
      expect(closeBtn).toBeTruthy();
      closeBtn.click();

      expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
      expect(wrapper.emitted('close')).toBeDefined();

      const backdrop = document.body.querySelector('.drawer-backdrop') as HTMLElement;
      expect(backdrop).toBeTruthy();
      backdrop.click();
      expect(wrapper.emitted('update:modelValue')!.length).toBe(2);

      wrapper.unmount();
    });

    it('2.3 Nhấn phím Escape đóng drawer', async () => {
      const wrapper = mount(MobileNavDrawer, {
        props: { modelValue: true },
        ...globalPlugins,
      });

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
      expect(wrapper.emitted('close')).toBeDefined();
    });

    it('2.4 Khóa cuộn trang khi drawer mở và khôi phục khi đóng', async () => {
      const wrapper = mount(MobileNavDrawer, {
        props: { modelValue: true },
        ...globalPlugins,
      });

      expect(document.body.style.overflow).toBe('hidden');

      await wrapper.setProps({ modelValue: false });
      expect(document.body.style.overflow).toBe('');
    });
  });

  // 3. Motion Components (RevealItem.vue)
  describe('3. Stagger Reveal Component (RevealItem.vue)', () => {
    it('3.1 Tính toán chính xác delay dựa trên index hoặc prop delay', () => {
      const wrapperIndex = mount(RevealItem, {
        props: { index: 3 },
      });
      expect(wrapperIndex.attributes('style')).toContain('animation-delay: 180ms');

      const wrapperDelay = mount(RevealItem, {
        props: { delay: 250 },
      });
      expect(wrapperDelay.attributes('style')).toContain('animation-delay: 250ms');
    });

    it('3.2 Render đúng HTML tag và nội dung bên trong slot', () => {
      const wrapper = mount(RevealItem, {
        props: { tag: 'section' },
        slots: {
          default: '<span class="test-child">Obsidian Content</span>',
        },
      });

      expect(wrapper.element.tagName.toLowerCase()).toBe('section');
      expect(wrapper.find('.test-child').text()).toBe('Obsidian Content');
    });
  });

  // 4. App Integration & Direct Deep Linking
  describe('4. Tích hợp App.vue và Giữ nguyên Deep Linking', () => {
    it('4.1 App.vue khởi tạo với AppIntro hiển thị và ẩn đi khi kích hoạt enter', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router],
        },
      });

      // AppIntro xuất hiện trên cùng
      expect(wrapper.findComponent(AppIntro).exists()).toBe(true);

      // Kích hoạt enter
      const intro = wrapper.findComponent(AppIntro);
      await intro.vm.$emit('enter');

      // Sau khi enter, AppIntro được gỡ bỏ khỏi DOM
      expect(wrapper.findComponent(AppIntro).exists()).toBe(false);
    });

    it('4.2 Giữ nguyên Deep Link URL khi khởi động và sau khi vào Dashboard', async () => {
      await router.push('/so-sanh-kenh');
      await router.isReady();

      const wrapper = mount(App, {
        global: {
          plugins: [router],
        },
      });

      expect(router.currentRoute.value.path).toBe('/so-sanh-kenh');

      // Kích hoạt enter
      const intro = wrapper.findComponent(AppIntro);
      await intro.vm.$emit('enter');

      // URL vẫn giữ nguyên là /so-sanh-kenh, KHÔNG bị cưỡng chế về /tong-quan
      expect(router.currentRoute.value.path).toBe('/so-sanh-kenh');
    });
  });

  // 5. CSS & Motion Compliance
  describe('5. Chuẩn Tokens Obsidian Control Room và Hỗ trợ Reduced Motion', () => {
    it('5.1 File main.css chứa đầy đủ Obsidian tokens và transitions', () => {
      const cssPath = resolve(__dirname, '../src/styles/main.css');
      const cssContent = readFileSync(cssPath, 'utf-8');

      expect(cssContent).toContain('--bg-main: #07090D');
      expect(cssContent).toContain('--bg-surface: #0E131A');
      expect(cssContent).toContain('--accent: #38BDF8');
      expect(cssContent).toContain('--accent-glow:');
      expect(cssContent).toContain('--ease-out-expo:');
      expect(cssContent).toContain('.surface-card');
      expect(cssContent).toContain('.interactive-card');
      expect(cssContent).toContain('.page-fade-enter-active');
      expect(cssContent).toContain('prefers-reduced-motion: reduce');
    });
  });
});
