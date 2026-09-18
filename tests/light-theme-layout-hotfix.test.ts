import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('V1.1 Light Theme & Wide Desktop Hotfix Contract Tests', () => {
  const rootDir = resolve(__dirname, '..');

  describe('1. Global Stylesheet Semantic Signal Tokens (main.css)', () => {
    const cssPath = resolve(rootDir, 'src/styles/main.css');
    const css = readFileSync(cssPath, 'utf-8');

    it('1.1 main.css định nghĩa các signal tokens cho dark mode', () => {
      expect(css).toContain('--signal-accent: #38BDF8;');
      expect(css).toContain('--signal-positive: #34D399;');
      expect(css).toContain('--signal-warning: #F59E0B;');
      expect(css).toContain('--progress-track: rgba(255, 255, 255, 0.08);');
      expect(css).toContain('--badge-neutral-bg: rgba(255, 255, 255, 0.08);');
    });

    it('1.2 main.css định nghĩa các signal tokens và text tương phản cao cho light mode', () => {
      expect(css).toContain('--text-primary: #12202D;');
      expect(css).toContain('--text-secondary: #475569;');
      expect(css).toContain('--text-muted: #64748B;');
      expect(css).toContain('--signal-accent: #0284C7;');
      expect(css).toContain('--signal-positive: #15803D;');
      expect(css).toContain('--signal-warning: #B45309;');
      expect(css).toContain('--progress-track: rgba(15, 40, 60, 0.10);');
      expect(css).toContain('--badge-neutral-bg: rgba(15, 40, 60, 0.07);');
    });

    it('1.3 main.css cung cấp các utility classes kết nối với signal tokens', () => {
      expect(css).toContain('.text-accent');
      expect(css).toContain('color: var(--signal-accent);');
      expect(css).toContain('.text-delta');
      expect(css).toContain('.text-positive');
      expect(css).toContain('color: var(--signal-positive);');
      expect(css).toContain('.text-threshold');
      expect(css).toContain('.text-warning');
      expect(css).toContain('color: var(--signal-warning);');
      expect(css).toContain('.progress-bar');
      expect(css).toContain('background-color: var(--progress-track);');
      expect(css).toContain('.tab-badge');
      expect(css).toContain('background-color: var(--badge-neutral-bg);');
    });
  });

  describe('2. Fluid Layout in AppLayout.vue', () => {
    const layoutPath = resolve(rootDir, 'src/layouts/AppLayout.vue');
    const layout = readFileSync(layoutPath, 'utf-8');

    it('2.1 AppLayout .main-content không bị giới hạn cứng 1400px', () => {
      expect(layout).not.toContain('max-width: 1400px;');
      expect(layout).toContain('max-width: none;');
    });

    it('2.2 AppLayout .main-content sử dụng fluid width và clamp padding', () => {
      expect(layout).toContain('width: calc(100% - 260px);');
      expect(layout).toContain('padding: clamp(20px, 2vw, 32px);');
    });
  });

  describe('3. Opportunity Page Layout & Table Actions (OpportunityVideosPage.vue & OpportunityTableView.vue)', () => {
    const oppPath = resolve(rootDir, 'src/pages/OpportunityVideosPage.vue');
    const opp = readFileSync(oppPath, 'utf-8');
    const tablePath = resolve(rootDir, 'src/components/opportunity/OpportunityTableView.vue');
    const tableContent = readFileSync(tablePath, 'utf-8');

    it('3.1 opportunity page không bị giới hạn 1440px và không bị double padding', () => {
      expect(opp).not.toContain('max-width: 1440px;');
      expect(opp).toContain('max-width: none;');
    });

    it('3.2 Opportunity table định nghĩa đầy đủ cấu trúc bảng và responsive wrapper', () => {
      expect(tableContent).toContain('.opportunity-table-wrap');
      expect(tableContent).toContain('.table-responsive');
      expect(tableContent).toContain('.opportunity-table');
      expect(tableContent).toContain('.col-video');
      expect(tableContent).toContain('.col-channel');
      expect(tableContent).toContain('.col-vph');
      expect(tableContent).toContain('.col-delta');
      expect(tableContent).toContain('.col-threshold');
      expect(tableContent).toContain('.col-actions');
    });

    it('3.3 Cụm nút Thao Tác có định dạng compact vừa vặn', () => {
      expect(tableContent).toContain('.table-action-btns');
      expect(tableContent).toContain('.tbl-btn');
      expect(tableContent).toContain('width: 28px;');
      expect(tableContent).toContain('height: 28px;');
    });

    it('3.4 Progress tracks và tab badges sử dụng CSS variables', () => {
      const allOpportunityCode = opp + tableContent + readFileSync(resolve(rootDir, 'src/components/opportunity/OpportunityStatusBadge.vue'), 'utf-8');
      expect(allOpportunityCode).toContain('var(--border');
      expect(allOpportunityCode).toContain('var(--surface');
    });
  });

  describe('4. Gỡ bỏ Restrictive Max-Width trên các trang dữ liệu', () => {
    it('4.1 VideosPage không còn max-width: 1400px', () => {
      const p = readFileSync(resolve(rootDir, 'src/pages/VideosPage.vue'), 'utf-8');
      expect(p).not.toContain('max-width: 1400px;');
      expect(p).toContain('max-width: none;');
    });

    it('4.2 NewVideosPage không còn max-width: 1400px', () => {
      const p = readFileSync(resolve(rootDir, 'src/pages/NewVideosPage.vue'), 'utf-8');
      expect(p).not.toContain('max-width: 1400px;');
      expect(p).toContain('max-width: none;');
    });

    it('4.3 ReportPage không còn max-width: 1400px', () => {
      const p = readFileSync(resolve(rootDir, 'src/pages/ReportPage.vue'), 'utf-8');
      expect(p).not.toContain('max-width: 1400px;');
      expect(p).toContain('max-width: none;');
    });

    it('4.4 PublishingSchedulePage không còn max-width: 1240px', () => {
      const p = readFileSync(resolve(rootDir, 'src/pages/PublishingSchedulePage.vue'), 'utf-8');
      expect(p).not.toContain('max-width: 1240px;');
      expect(p).toContain('max-width: none;');
    });

    it('4.5 ChannelComparisonPage không còn max-width: 1300px', () => {
      const p = readFileSync(resolve(rootDir, 'src/pages/ChannelComparisonPage.vue'), 'utf-8');
      expect(p).not.toContain('max-width: 1300px;');
      expect(p).toContain('max-width: none;');
    });

    it('4.6 ProductionPage không còn max-width: 1400px', () => {
      const p = readFileSync(resolve(rootDir, 'src/pages/ProductionPage.vue'), 'utf-8');
      expect(p).not.toContain('max-width: 1400px;');
      expect(p).toContain('max-width: none;');
    });

    it('4.7 DataHealthPage không còn max-width: 1280px', () => {
      const p = readFileSync(resolve(rootDir, 'src/pages/DataHealthPage.vue'), 'utf-8');
      expect(p).not.toContain('max-width: 1280px;');
      expect(p).toContain('max-width: none;');
    });
  });
});
