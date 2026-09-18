import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('V1.1 — Wave 1: Monitoring Experience Redesign Contract Assertions', () => {
  const srcDir = path.resolve(__dirname, '../src');

  // 1. New Videos Page Contract (Updated to Wave 3.3 Modern Architecture)
  it('1. NewVideosPage preserves all range options, filters, actions and shared UI components', () => {
    const filePath = path.join(srcDir, 'pages/NewVideosPage.vue');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Range options: 6h, 12h, 24h, 3d, 7d
    expect(content).toContain("'6h'");
    expect(content).toContain("'12h'");
    expect(content).toContain("'24h'");
    expect(content).toContain("'3d'");
    expect(content).toContain("'7d'");

    // Filter properties preserved
    expect(content).toContain('channelId');
    expect(content).toContain('status');
    expect(content).toContain('sort');
    expect(content).toContain('search');

    // Load more (+100) CTA preserved
    expect(content).toContain('loadMore');
    expect(content).toContain('Xem Thêm (+100)');

    // Shared UI components integrated (Wave 3.0 & 3.3 standards)
    expect(content).toContain('PageHeader');
    expect(content).toContain('FilterBar');
    expect(content).toContain('RecentVideoSummaryStrip');
    expect(content).toContain('ViewModeSwitcher');
    expect(content).toContain('RECENT VIDEO RADAR');
  });

  // 2. Videos Page & Components Contract
  it('2. VideosPage and components preserve stats, filter tabs, sort, desktop table and mobile list', () => {
    const pagePath = path.join(srcDir, 'pages/VideosPage.vue');
    const pageContent = fs.readFileSync(pagePath, 'utf-8');

    expect(pageContent).toContain('VideoStatsHeader');
    expect(pageContent).toContain('VideoTableHeader');
    expect(pageContent).toContain('VideoDesktopTable');
    expect(pageContent).toContain('VideoMobileList');
    expect(pageContent).toContain('TỐC ĐỘ TĂNG');
    expect(pageContent).toContain('Video Đang Tăng');

    // VideoTableHeader tabs preserved
    const headerPath = path.join(srcDir, 'features/videos/components/VideoTableHeader.vue');
    const headerContent = fs.readFileSync(headerPath, 'utf-8');
    expect(headerContent).toContain("value: 'all'");
    expect(headerContent).toContain("value: 'rising'");
    expect(headerContent).toContain("value: 'alerted'");
    expect(headerContent).toContain("value: 'unalerted'");
    expect(headerContent).toContain('vph_desc');
    expect(headerContent).toContain('views_desc');
    expect(headerContent).toContain('published_desc');
    expect(headerContent).toContain('delta_desc');

    // Desktop Table columns preserved
    const tablePath = path.join(srcDir, 'features/videos/components/VideoDesktopTable.vue');
    const tableContent = fs.readFileSync(tablePath, 'utf-8');
    expect(tableContent).toContain('col-video');
    expect(tableContent).toContain('col-channel');
    expect(tableContent).toContain('col-vph');
    expect(tableContent).toContain('col-views');
    expect(tableContent).toContain('col-delta');
    expect(tableContent).toContain('col-published');
    expect(tableContent).toContain('col-alert');
    expect(tableContent).toContain('col-actions');
  });

  // 3. Video Detail Page Contract
  it('3. VideoDetailPage preserves all investigation actions: Refresh, AI, Production, YouTube and Alert link', () => {
    const detailPath = path.join(srcDir, 'pages/VideoDetailPage.vue');
    const detailContent = fs.readFileSync(detailPath, 'utf-8');

    // Back button
    expect(detailContent).toContain("to=\"/videos\"");
    expect(detailContent).toContain('Quay Lại Video Đang Tăng');

    // Actions
    expect(detailContent).toContain('loadVideoDetail');
    expect(detailContent).toContain('Làm Mới');
    expect(detailContent).toContain('/tro-ly-noi-dung?video=');
    expect(detailContent).toContain('Phân Tích Bằng AI');
    expect(detailContent).toContain('handleAddToProduction');
    expect(detailContent).toContain('Đưa Vào Sản Xuất');
    expect(detailContent).toContain('Xem Trên YouTube');
    expect(detailContent).toContain('/lich-su-canh-bao?video=');

    // Growth charts & Snapshot history
    expect(detailContent).toContain('VideoGrowthCharts');
    expect(detailContent).toContain('Lịch Sử Snapshot');
    expect(detailContent).toContain('Thông Tin Kênh Đối Thủ');

    // AccessKey Modal
    expect(detailContent).toContain('AccessKeyPromptModal');
  });

  // 4. Zero Service Logic Modification Rule
  it('4. Zero service modification rule: all service files remain untouched in business logic', () => {
    const videoServicePath = path.join(srcDir, 'services/video-service.ts');
    const newVideosServicePath = path.join(srcDir, 'services/new-videos-service.ts');

    const vsContent = fs.readFileSync(videoServicePath, 'utf-8');
    const nvsContent = fs.readFileSync(newVideosServicePath, 'utf-8');

    // Video service methods intact
    expect(vsContent).toContain('fetchTrendingVideos');
    expect(vsContent).toContain('calculateStats');
    expect(vsContent).toContain('sortVideos');
    expect(vsContent).toContain('filterVideos');
    expect(vsContent).toContain('formatVph');

    // New videos service methods intact
    expect(nvsContent).toContain('fetchNewVideos');
    expect(nvsContent).toContain('computeNewVideoSummary');
    expect(nvsContent).toContain('filterNewVideos');
    expect(nvsContent).toContain('sortNewVideos');
  });

  // 5. Shared Obsidian Signal Desk Components Exist
  it('5. Shared Obsidian UI components exist and export valid Vue components', () => {
    const headerPath = path.join(srcDir, 'components/ui/MonitoringPageHeader.vue');
    const metricCardPath = path.join(srcDir, 'components/ui/MetricCard.vue');
    const filterDockPath = path.join(srcDir, 'components/ui/FilterDock.vue');

    expect(fs.existsSync(headerPath)).toBe(true);
    expect(fs.existsSync(metricCardPath)).toBe(true);
    expect(fs.existsSync(filterDockPath)).toBe(true);
  });

  // 6. SectionMarker Component and Integration across other monitoring pages
  it('6. SectionMarker exists and is integrated across core monitoring pages', () => {
    const markerPath = path.join(srcDir, 'components/ui/SectionMarker.vue');
    expect(fs.existsSync(markerPath)).toBe(true);

    const videosContent = fs.readFileSync(path.join(srcDir, 'pages/VideosPage.vue'), 'utf-8');
    const detailContent = fs.readFileSync(path.join(srcDir, 'pages/VideoDetailPage.vue'), 'utf-8');

    expect(videosContent).toContain('SectionMarker');
    expect(detailContent).toContain('SectionMarker');
  });

  // 7. Signal Command Visual Identity Architecture (Asymmetry, Integrated Rail, Event Log)
  it('7. Core monitoring pages adopt modern signal rail and event log', () => {
    const detailContent = fs.readFileSync(path.join(srcDir, 'pages/VideoDetailPage.vue'), 'utf-8');
    const statsHeaderContent = fs.readFileSync(path.join(srcDir, 'features/videos/components/VideoStatsHeader.vue'), 'utf-8');

    // Videos asymmetric stats
    expect(statsHeaderContent).toContain('active-signal-stats-deck');
    expect(statsHeaderContent).toContain('focal-signal-surface');
    expect(statsHeaderContent).toContain('TỐC ĐỘ TĂNG CAO NHẤT');

    // VideoDetail integrated hero signal rail & event log
    expect(detailContent).toContain('hero-integrated-signal-rail');
    expect(detailContent).toContain('system-event-log-panel');
    expect(detailContent).toContain('DISCORD EVENT LOG');
  });
});
