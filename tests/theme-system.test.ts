import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { mount } from '@vue/test-utils';
import { useTheme, THEME_STORAGE_KEY } from '../src/composables/useTheme';
import ThemeToggle from '../src/components/ui/ThemeToggle.vue';

describe('V1.1 Theme System — Light / Dark Mode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('1. useTheme Composable Contract', () => {
    it('1.1 THEME_STORAGE_KEY phải là bbdt_theme', () => {
      expect(THEME_STORAGE_KEY).toBe('bbdt_theme');
    });

    it('1.2 Default theme phải là "dark" khi localStorage trống', () => {
      const { theme, isDark } = useTheme();
      expect(theme.value).toBe('dark');
      expect(isDark.value).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('1.3 setTheme("light") cập nhật reactive state, DOM data-theme và localStorage', () => {
      const { theme, isDark, setTheme } = useTheme();
      setTheme('light');
      expect(theme.value).toBe('light');
      expect(isDark.value).toBe(false);
      expect(localStorage.getItem('bbdt_theme')).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('1.4 toggleTheme() chuyển đổi qua lại giữa dark và light', () => {
      const { theme, isDark, setTheme, toggleTheme } = useTheme();
      setTheme('dark');
      expect(isDark.value).toBe(true);

      toggleTheme();
      expect(theme.value).toBe('light');
      expect(isDark.value).toBe(false);
      expect(localStorage.getItem('bbdt_theme')).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      toggleTheme();
      expect(theme.value).toBe('dark');
      expect(isDark.value).toBe(true);
      expect(localStorage.getItem('bbdt_theme')).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('1.5 Fallback an toàn về "dark" nếu giá trị trong localStorage không hợp lệ', () => {
      const { setTheme } = useTheme();
      // @ts-expect-error test invalid theme input
      setTheme('invalid-color-theme');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('1.6 Không bị crash khi localStorage bị chặn hoặc throw', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded or SecurityError');
      });

      const { setTheme, theme } = useTheme();
      expect(() => setTheme('light')).not.toThrow();
      expect(theme.value).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      setItemSpy.mockRestore();
    });
  });

  describe('2. ThemeToggle Component UI & Accessibility', () => {
    it('2.1 ThemeToggle component tồn tại và render switch button', () => {
      const wrapper = mount(ThemeToggle);
      expect(wrapper.find('button[role="switch"]').exists()).toBe(true);
    });

    it('2.2 Có ARIA attributes chuẩn: role="switch", aria-checked, aria-label', () => {
      const { setTheme } = useTheme();
      setTheme('dark');
      const wrapper = mount(ThemeToggle);
      const button = wrapper.find('button');
      
      expect(button.attributes('role')).toBe('switch');
      expect(button.attributes('aria-checked')).toBe('true');
      expect(button.attributes('aria-label')).toContain('giao diện sáng');
    });

    it('2.3 Chứa các biểu tượng sun và moon trong template', () => {
      const wrapper = mount(ThemeToggle);
      expect(wrapper.find('.theme-toggle__icon--sun').exists()).toBe(true);
      expect(wrapper.find('.theme-toggle__icon--moon').exists()).toBe(true);
      expect(wrapper.find('.theme-toggle__knob').exists()).toBe(true);
    });

    it('2.4 Click vào ThemeToggle chuyển đổi theme', async () => {
      const { setTheme, isDark } = useTheme();
      setTheme('dark');
      const wrapper = mount(ThemeToggle);

      await wrapper.find('button').trigger('click');
      expect(isDark.value).toBe(false);

      await wrapper.find('button').trigger('click');
      expect(isDark.value).toBe(true);
    });
  });

  describe('3. Anti-FOUC Script in index.html', () => {
    it('3.1 index.html chứa synchronous inline script đọc bbdt_theme trước app mount', () => {
      const htmlPath = resolve(__dirname, '../index.html');
      expect(existsSync(htmlPath)).toBe(true);
      const html = readFileSync(htmlPath, 'utf-8');

      expect(html).toContain('localStorage.getItem(\'bbdt_theme\')');
      expect(html).toContain('document.documentElement.setAttribute(\'data-theme\'');
    });
  });

  describe('4. Global Stylesheet Theme Architecture in main.css', () => {
    it('4.1 main.css chứa định nghĩa tokens cho cả [data-theme="dark"] và [data-theme="light"]', () => {
      const cssPath = resolve(__dirname, '../src/styles/main.css');
      const css = readFileSync(cssPath, 'utf-8');

      expect(css).toContain('[data-theme="dark"]');
      expect(css).toContain('[data-theme="light"]');

      // Light mode Arctic Signal Desk tokens
      expect(css).toContain('--bg-main: #F4F7FB');
      expect(css).toContain('--bg-surface: #FFFFFF');
      expect(css).toContain('--text-primary: #12202D');
      expect(css).toContain('--border-subtle: rgba(15, 40, 60, 0.09)');
    });
  });

  describe('5. AppLayout Integration', () => {
    it('5.1 AppLayout.vue tích hợp ThemeToggle ở cả desktop sidebar và mobile topbar', () => {
      const layoutPath = resolve(__dirname, '../src/layouts/AppLayout.vue');
      const layout = readFileSync(layoutPath, 'utf-8');

      expect(layout).toContain('import ThemeToggle from');
      expect(layout).toContain('<ThemeToggle');
      expect(layout).toContain('sidebar-theme-wrapper');
      expect(layout).toContain('mobile-topbar-actions');
    });
  });
});
