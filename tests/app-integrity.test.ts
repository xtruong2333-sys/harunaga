import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import fs from 'fs';
import path from 'path';

import AppIcon from '@/components/ui/AppIcon.vue';
import ChannelProfileHero from '@/components/channel-detail/ChannelProfileHero.vue';
import ChannelActivityFeed from '@/components/channel-detail/ChannelActivityFeed.vue';
import ChannelPerformanceStrip from '@/components/channel-detail/ChannelPerformanceStrip.vue';
import ChannelMonitoringConfig from '@/components/channel-detail/ChannelMonitoringConfig.vue';
import VideoAlertContext from '@/components/video-detail/VideoAlertContext.vue';
import VideoSignalSummary from '@/components/video-detail/VideoSignalSummary.vue';
import VideoChannelContext from '@/components/video-detail/VideoChannelContext.vue';

const routerLinkStub = {
  template: '<a><slot /></a>',
};

const globalStubs = {
  RouterLink: routerLinkStub,
  'router-link': routerLinkStub,
};

describe('FINAL REVIEW FIX — App Integrity & Cross-Wave Regressions', () => {
  // 1. AppIcon Audit & Dynamic Icons
  describe('1. AppIcon Global Support & Dynamic Icons', () => {
    it('1.1 Toan bo dynamic icons duoc ho tro va render ra SVG hop le', () => {
      const dynamicIcons = [
        'info',
        'send',
        'chevron-left',
        'chevron-right',
        'chevron-down',
        'arrow-left',
        'arrow-right',
        'filter',
        'inbox',
        'edit',
        'alert-triangle',
        'chart',
        'refresh-cw',
        'image',
        'shield',
        'grid',
        'layout-grid',
        'list',
        'table',
      ];

      for (const iconName of dynamicIcons) {
        const wrapper = mount(AppIcon, {
          props: { name: iconName },
        });
        const svg = wrapper.find('svg');
        expect(svg.exists()).toBe(true);
        expect(svg.html().length).toBeGreaterThan(30);
      }
 });

 it('1.2 Quet tinh tat ca icon name trong src/**/*.vue de dam bao khong icon nao render rong', () => {
 const srcDir = path.resolve(__dirname, '../src');
 const vueFiles: string[] = [];

 function walkDir(dir: string) {
 const entries = fs.readdirSync(dir, { withFileTypes: true });
 for (const entry of entries) {
 const fullPath = path.join(dir, entry.name);
 if (entry.isDirectory()) {
 walkDir(fullPath);
 } else if (entry.name.endsWith('.vue')) {
 vueFiles.push(fullPath);
 }
 }
 }

 walkDir(srcDir);

 const staticIconRegex = /<AppIcon[^>]+name=["']([a-zA-Z0-9_-]+)["']/g;
 const foundIcons = new Set<string>();

 for (const filePath of vueFiles) {
 const content = fs.readFileSync(filePath, 'utf-8');
 let match: RegExpExecArray | null;
 while ((match = staticIconRegex.exec(content)) !== null) {
 foundIcons.add(match[1]);
 }
 }

 expect(foundIcons.size).toBeGreaterThan(15);

 for (const icon of foundIcons) {
 const wrapper = mount(AppIcon, {
 props: { name: icon },
 });
 const svg = wrapper.find('svg');
 expect(svg.exists()).toBe(true);
 }
 });
 });

 // 2. App Shell Fake Status Removal
 describe('2. App Shell Clean-up — Xoa fake status va live indicator gia', () => {
 it('2.1 AppLayout.vue khong chua LIVE SIGNAL hay He thong san sang', () => {
 const appLayoutPath = path.resolve(__dirname, '../src/layouts/AppLayout.vue');
 const content = fs.readFileSync(appLayoutPath, 'utf-8');

 expect(content.includes('LIVE SIGNAL')).toBe(false);
 expect(content.includes('Hệ thống sẵn sàng')).toBe(false);
 expect(content.includes('workspace-mode-badge')).toBe(true);
 });

 it('2.2 MobileNavDrawer.vue khong chua He thong san sang hay v1.1 Live', () => {
 const mobileDrawerPath = path.resolve(__dirname, '../src/components/ui/MobileNavDrawer.vue');
 const content = fs.readFileSync(mobileDrawerPath, 'utf-8');

 expect(content.includes('Hệ thống sẵn sàng')).toBe(false);
 expect(content.includes('v1.1 Live')).toBe(false);
 expect(content.includes('footer-brand')).toBe(true);
 });

 it('2.3 AppIntro.vue khong chua He thong san sang', () => {
 const introPath = path.resolve(__dirname, '../src/components/motion/AppIntro.vue');
 const content = fs.readFileSync(introPath, 'utf-8');

 expect(content.includes('Hệ thống sẵn sàng')).toBe(false);
 });
 });

 // 3. No Native alert()
 describe('3. Xoa hoan toan native alert() tren toan bo web', () => {
 it('3.1 Cac trang chinh khong con dung native alert()', () => {
 const pagesToCheck = [
 '../src/pages/OpportunityVideosPage.vue',
 '../src/pages/VideosPage.vue',
 '../src/pages/VideoDetailPage.vue',
 '../src/pages/ChannelsPage.vue',
 '../src/pages/ChannelDetailPage.vue',
 '../src/features/channels/components/BulkAddChannelsModal.vue',
 ];

 for (const relPath of pagesToCheck) {
 const fullPath = path.resolve(__dirname, relPath);
 const content = fs.readFileSync(fullPath, 'utf-8');
 const hasAlert = /\balert\s*\(/.test(content);
 expect(hasAlert).toBe(false);
 }
 });

 it('3.2 Toan bo thu muc src khong con loi goi native alert()', () => {
 const srcDir = path.resolve(__dirname, '../src');
 const allFiles: string[] = [];

 function walkDir(dir: string) {
 const entries = fs.readdirSync(dir, { withFileTypes: true });
 for (const entry of entries) {
 const fullPath = path.join(dir, entry.name);
 if (entry.isDirectory()) {
 walkDir(fullPath);
 } else if (entry.name.endsWith('.vue') || entry.name.endsWith('.ts')) {
 allFiles.push(fullPath);
 }
 }
 }

 walkDir(srcDir);

 const filesWithAlert: string[] = [];
 for (const file of allFiles) {
 const content = fs.readFileSync(file, 'utf-8');
 if (/\balert\s*\(/.test(content)) {
 filesWithAlert.push(file);
 }
 }

 expect(filesWithAlert).toEqual([]);
 });
 });

 // 4. Channel Profile Hero — Collector Wording & Interaction Lock
 describe('4. ChannelProfileHero Interaction Lock & Collector Wording', () => {
 const mockChannel = {
 id: 'test-ch-1',
 name: 'Kênh Test',
 handle: '@kenhtest',
 avatarUrl: 'https://example.com/a.jpg',
 status: 'active' as const,
 scanLimit: 15,
 alertVphThreshold: 5000,
 lastScanAt: new Date().toISOString(),
 createdAt: '2026-01-01T00:00:00Z',
 url: 'https://youtube.com/@kenhtest',
 };

 it('4.1 Tooltip collector khong chua kenh nay, ma chi toan bo kenh theo doi', () => {
 const wrapper = mount(ChannelProfileHero, {
 props: {
 channel: mockChannel,
 },
 global: { stubs: globalStubs },
 });

 const collectorBtn = wrapper.find('.btn-collector');
 expect(collectorBtn.exists()).toBe(true);
 const title = collectorBtn.attributes('title') || '';
 expect(title).toContain('Kích hoạt kiểm tra dữ liệu cho các kênh đang theo dõi');
 expect(title.includes('kênh này')).toBe(false);
 });

 it('4.2 Khi disabled = true thi cac nut thao tac bi disabled', () => {
 const wrapper = mount(ChannelProfileHero, {
 props: {
 channel: mockChannel,
 disabled: true,
 },
 global: { stubs: globalStubs },
 });

 const buttons = wrapper.findAll('button');
 for (const btn of buttons) {
 expect(btn.attributes('disabled')).toBeDefined();
 }
 });

 it('4.3 Khi isCollecting = true thi nut collector hien thi trang thai dang chay va disabled', () => {
 const wrapper = mount(ChannelProfileHero, {
 props: {
 channel: mockChannel,
 isCollecting: true,
 },
 global: { stubs: globalStubs },
 });

 const collectorBtn = wrapper.find('.btn-collector');
 expect(collectorBtn.attributes('disabled')).toBeDefined();
 expect(collectorBtn.text()).toContain('Đang kích hoạt...');
 });
 });

 // 5. Null != Zero Semantics
 describe('5. Semantics Null != Zero', () => {
 it('5.1 ChannelActivityFeed hien thi 0 VPH khi measuredVph = 0', () => {
 const wrapper = mount(ChannelActivityFeed, {
 props: {
 alertSummary: {
 total: 1,
 sent: 1,
 pending: 0,
 failed: 0,
 recentAlerts: [
 {
 id: 'alt-1',
 videoId: 'vid-1',
 videoTitle: 'Video Zero Growth',
 measuredVph: 0,
 status: 'sent',
 sentAt: new Date().toISOString(),
 },
 ],
 },
 lastScanAt: new Date().toISOString(),
 },
 global: { stubs: globalStubs },
 });

 const vphText = wrapper.find('.alert-vph-val').text();
 expect(vphText).toBe('0 VPH');
 expect(vphText).not.toContain('—');
 });

 it('5.2 ChannelPerformanceStrip hien thi 0 VPH khi maxVph = 0', () => {
 const wrapper = mount(ChannelPerformanceStrip, {
 props: {
 analysis: {
 channel: {
 id: 'ch-1',
 name: 'Test Channel',
 handle: '@test',
 avatarUrl: '',
 status: 'active' as const,
 scanLimit: 15,
 alertVphThreshold: 5000,
 lastScanAt: null,
 createdAt: '2026-01-01T00:00:00Z',
 url: 'https://youtube.com/@test',
 },
 totalVideos: 10,
 risingVideos: 0,
 maxVph: 0,
 avgVph: 0,
 distribution: {
 overThresholdCount: 0,
 risingCount: 0,
 zeroCount: 10,
 nullCount: 0,
 },
 topRisingVideos: [],
 latestVideos: [],
 topVphChartVideos: [],
 publishingVideos: [],
 alertSummary: {
 total: 0,
 sent: 0,
 pending: 0,
 failed: 0,
 recentAlerts: [],
 },
 scanSummary: {
 lastScanAt: null,
 scanCount24h: 0,
 successRate: 100,
 recentScans: [],
 },
 hourlyPattern: [],
 topOpportunityGapVideos: [],
 },
 },
 global: { stubs: globalStubs },
 });

 const focalVal = wrapper.find('.focal-card .m-val').text();
 expect(focalVal).toBe('0 VPH');
 expect(focalVal).not.toContain('—');
 });

 it('5.3 VideoAlertContext hien thi 0 VPH khi alert.measuredVph = 0', () => {
 const wrapper = mount(VideoAlertContext, {
 props: {
 videoId: 'vid-zero',
 alert: {
 id: 'alt-zero',
 status: 'sent',
 measuredVph: 0,
 sentAt: '2026-09-18T10:00:00Z',
 lastError: null,
 },
 },
 global: { stubs: globalStubs },
 });

 expect(wrapper.text()).toContain('0 VPH');
 expect(wrapper.text()).not.toContain('— VPH');
 });

 it('5.4 ChannelMonitoringConfig hien thi 0 VPH khi alertVphThreshold = 0 va Chua dat khi null', () => {
 const wrapperWithZero = mount(ChannelMonitoringConfig, {
 props: {
 channel: {
 id: 'ch-1',
 name: 'Test',
 handle: '@test',
 avatarUrl: '',
 status: 'active' as const,
 scanLimit: 15,
 alertVphThreshold: 0,
 lastScanAt: null,
 createdAt: '2026-01-01T00:00:00Z',
 url: '',
 },
 },
 global: { stubs: globalStubs },
 });
 expect(wrapperWithZero.text()).toContain('0 VPH');

 const wrapperWithNull = mount(ChannelMonitoringConfig, {
 props: {
 channel: {
 id: 'ch-1',
 name: 'Test',
 handle: '@test',
 avatarUrl: '',
 status: 'active' as const,
 scanLimit: 15,
 alertVphThreshold: null,
 lastScanAt: null,
 createdAt: '2026-01-01T00:00:00Z',
 url: '',
 },
 },
 global: { stubs: globalStubs },
 });
 expect(wrapperWithNull.text()).toContain('Chưa đặt');
 });

 it('5.5 VideoSignalSummary hien thi day du nguong va chenh lech khi VPH = 0 hoac nguong = 0', () => {
 const wrapper = mount(VideoSignalSummary, {
 props: {
 video: {
 id: 'v-1',
 youtubeVideoId: 'yt-1',
 title: 'Test Zero Video',
 url: 'https://youtube.com/watch?v=yt-1',
 thumbnailUrl: '',
 publishedAt: '2026-09-18T00:00:00Z',
 latestViewCount: 1000,
 latestMeasuredVph: 0,
 channel: {
 id: 'c-1',
 name: 'Channel Test',
 handle: '@test',
 avatarUrl: '',
 status: 'active',
 scanLimit: 15,
 alertVphThreshold: 0,
 url: '',
 },
 snapshots: [
 {
 id: 's-1',
 viewCount: 1000,
 measuredVph: 0,
 viewDelta: 0,
 checkedAt: '2026-09-18T01:00:00Z',
 },
 ],
 alert: null,
 } as any,
 },
 global: { stubs: globalStubs },
 });

 expect(wrapper.text()).toContain('0 VPH');
 expect(wrapper.text()).toContain('Chênh lệch so với ngưỡng:');
 expect(wrapper.text()).toContain('+0 VPH');
 });

 it('5.6 VideoChannelContext hien thi 0 VPH khi alertVphThreshold = 0', () => {
 const wrapper = mount(VideoChannelContext, {
 props: {
 channel: {
 id: 'c-1',
 name: 'Channel Test',
 handle: '@test',
 avatarUrl: '',
 status: 'active',
 scanLimit: 15,
 alertVphThreshold: 0,
 url: 'https://youtube.com',
 },
 },
 global: { stubs: globalStubs },
 });

 expect(wrapper.text()).toContain('0 VPH');
 expect(wrapper.text()).not.toContain('— VPH');
 });
 });
});
