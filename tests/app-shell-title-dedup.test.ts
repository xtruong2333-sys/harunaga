import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('App shell page-title deduplication', () => {
  const layoutPath = path.resolve(__dirname, '../src/layouts/AppLayout.vue');
  const content = fs.readFileSync(layoutPath, 'utf-8');

  it('does not render route/page title inside the desktop topbar', () => {
    expect(content).not.toContain('currentTitle');
    expect(content).not.toContain('workspace-title');
    expect(content).not.toContain('useRoute');
  });

  it('keeps the desktop topbar as a neutral system context only', () => {
    expect(content).toContain('BẮT BÀI ĐỐI THỦ · INTELLIGENCE OS');
    expect(content).toContain('INTELLIGENCE WORKSPACE');
  });

  it('keeps PageHeader responsible for page-specific titles', () => {
    const pages = [
      '../src/pages/ReportPage.vue',
      '../src/pages/ChannelsPage.vue',
      '../src/pages/NewVideosPage.vue',
      '../src/pages/OpportunityVideosPage.vue',
      '../src/pages/VideosPage.vue',
      '../src/pages/ChannelComparisonPage.vue',
      '../src/pages/PublishingSchedulePage.vue',
      '../src/pages/AlertHistoryPage.vue',
      '../src/pages/AiContentAssistantPage.vue',
      '../src/pages/ProductionPage.vue',
      '../src/pages/DataHealthPage.vue',
    ];

    for (const rel of pages) {
      const page = fs.readFileSync(path.resolve(__dirname, rel), 'utf-8');
      expect(page).toContain('<PageHeader');
    }
  });
});
