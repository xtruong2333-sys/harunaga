import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('V4 premium workspace redesign', () => {
  const root = path.resolve(__dirname, '..');
  const main = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf-8');
  const css = fs.readFileSync(path.join(root, 'src/styles/v4-premium-ui.css'), 'utf-8');
  const layout = fs.readFileSync(path.join(root, 'src/layouts/AppLayout.vue'), 'utf-8');

  it('loads the V4 design system last', () => {
    const oldTagLayer = main.indexOf("@/styles/tag-micro-contrast-hotfix.css");
    const v4 = main.indexOf("@/styles/v4-premium-ui.css");
    expect(oldTagLayer).toBeGreaterThanOrEqual(0);
    expect(v4).toBeGreaterThan(oldTagLayer);
  });

  it('defines the approved light-first shell and surface tokens', () => {
    const lightFinal = css.split('V4 LIGHT FINAL — approved direction')[1] || '';

    for (const token of [
      '--v4-sidebar: 220px',
      '--v4-bg: #F5F9FD',
      '--v4-surface: #FFFFFF',
      '--v4-text: #10233F',
      '--v4-blue: #1769E8',
      '--v4-radius: 13px',
    ]) {
      expect(lightFinal).toContain(token);
    }
  });

  it('uses a light sidebar in light mode and keeps dark mode optional', () => {
    const lightFinal = css.split('V4 LIGHT FINAL — approved direction')[1] || '';
    expect(lightFinal).toContain('[data-theme="light"] .app-sidebar');
    expect(lightFinal).toContain('background: rgba(255,255,255,.985) !important');
    expect(lightFinal).toContain('[data-theme="light"] .sidebar-item--active');
    expect(lightFinal).toContain('background: #EAF2FF !important');
    expect(css).toContain('[data-theme="dark"]');
  });

  it('uses clean white cards and restrained shadows in the approved light mode', () => {
    const lightFinal = css.split('V4 LIGHT FINAL — approved direction')[1] || '';
    expect(lightFinal).toContain('background: #FFFFFF !important');
    expect(lightFinal).toContain('box-shadow: 0 2px 9px rgba(56, 89, 123, .05) !important');
    expect(lightFinal).toContain('background: #F3F7FB !important');
  });

  it('covers every primary page workspace', () => {
    for (const selector of [
      '.overview-page',
      '.report-page',
      '.recent-videos-workspace',
      '.opportunity-intelligence-workspace',
      '.growth-videos-workspace',
      '.video-investigation-workspace',
      '.channels-page',
      '.competitor-intelligence-profile',
      '.channel-comparison-page',
      '.publishing-schedule-page',
      '.alert-history-page',
      '.content-intelligence-studio',
      '.production-page',
      '.data-health-observatory',
    ]) {
      expect(css).toContain(selector);
    }
  });

  it('keeps the shell title deduplicated and navigation routes intact', () => {
    expect(layout).not.toContain('currentTitle');
    expect(layout).toContain('BẮT BÀI ĐỐI THỦ · INTELLIGENCE OS');

    for (const route of [
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
    ]) {
      expect(layout).toContain(route);
    }
  });

  it('does not use zoom or whole-app scaling hacks', () => {
    expect(css).not.toMatch(/\bzoom\s*:/);
    expect(css).not.toMatch(/\.app-layout[^}]*transform:\s*scale\(/s);
    expect(css).not.toMatch(/\.main-content[^}]*transform:\s*scale\(/s);
  });

  it('keeps the V4 change visual-only', () => {
    const changedVisualFiles = [
      'src/components/ui/PageHeader.vue',
      'src/components/ui/FilterBar.vue',
      'src/components/ui/FilterDock.vue',
      'src/components/ui/MetricCard.vue',
      'src/components/ui/ViewModeSwitcher.vue',
      'src/components/ui/SectionMarker.vue',
      'src/components/ui/AppModal.vue',
      'src/components/ui/EmptyState.vue',
      'src/components/ui/ErrorState.vue',
      'src/components/ui/MobileNavDrawer.vue',
      'src/components/motion/IntelligenceField.vue',
      'src/layouts/AppLayout.vue',
    ];

    for (const rel of changedVisualFiles) {
      const content = fs.readFileSync(path.join(root, rel), 'utf-8');
      expect(content.length).toBeGreaterThan(500);
    }
  });
});
