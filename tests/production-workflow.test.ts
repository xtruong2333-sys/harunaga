import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { mount, flushPromises } from '@vue/test-utils';
import {
  productionService,
  normalizeSourceVideoUrl,
  deriveProductionThumbnailUrl,
} from '../src/services/production-service';
import {
  getStoredAccessKey,
  setStoredAccessKey,
  clearStoredAccessKey,
  AccessKeyRequiredError,
  ACCESS_KEY_STORAGE_KEY,
} from '../src/services/channel-service';
import type {
  ProductionItem,
  ProductionFilterState,
} from '../src/types/production';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  PRODUCTION_VIEW_MODE_STORAGE_KEY,
  ACTIVE_WORKFLOW_STATUSES,
} from '../src/types/production';
import router from '../src/router';

describe('Bắt Bài Đối Thủ — Giai Đoạn 9: Tiến Độ Sản Xuất (Production Workflow)', () => {
  const sampleItems: ProductionItem[] = [
    {
      id: 'prod-1',
      sourceVideoId: 'vid-101',
      workingTitle: 'Hướng dẫn làm game 2D với Unity',
      notes: 'Tập trung vào phần physics và animation controller',
      status: 'idea',
      priority: 'high',
      createdAt: '2026-09-17T08:00:00.000Z',
      updatedAt: '2026-09-17T10:00:00.000Z',
      publishedUrl: null,
      publishedAt: null,
      sourceVideo: {
        id: 'vid-101',
        title: 'Làm game 2D siêu tốc trong 10 phút',
        url: 'https://www.youtube.com/watch?v=abc12345',
        youtubeVideoId: 'abc12345',
        thumbnailUrl: 'https://i.ytimg.com/vi/abc12345/mqdefault.jpg',
        channelName: 'Game Dev Pro',
        channelHandle: '@gamedevpro',
        channelAvatarUrl: null,
      },
    },
    {
      id: 'prod-2',
      sourceVideoId: 'vid-102',
      workingTitle: '5 mẹo tối ưu hóa Vue 3 trong dự án lớn',
      notes: 'Thực nghiệm so sánh memory leak và render time',
      status: 'production',
      priority: 'normal',
      createdAt: '2026-09-17T07:00:00.000Z',
      updatedAt: '2026-09-17T11:30:00.000Z',
      publishedUrl: null,
      publishedAt: null,
      sourceVideo: {
        id: 'vid-102',
        title: 'Vue 3 Best Practices 2026',
        url: 'https://www.youtube.com/watch?v=vue99999',
        youtubeVideoId: 'vue99999',
        thumbnailUrl: null,
        channelName: 'Frontend Masters VN',
        channelHandle: '@frontendvn',
        channelAvatarUrl: null,
      },
    },
    {
      id: 'prod-3',
      sourceVideoId: 'vid-103',
      workingTitle: 'Khai thác Gemini Flash Omni API',
      notes: '',
      status: 'editing',
      priority: 'low',
      createdAt: '2026-09-17T06:00:00.000Z',
      updatedAt: '2026-09-17T09:00:00.000Z',
      publishedUrl: null,
      publishedAt: null,
      sourceVideo: null,
    },
    {
      id: 'prod-4',
      sourceVideoId: 'vid-104',
      workingTitle: 'Bí mật thuật toán YouTube đề xuất 2026',
      notes: 'Đã xuất bản thành công trên kênh',
      status: 'published',
      priority: 'high',
      createdAt: '2026-09-16T12:00:00.000Z',
      updatedAt: '2026-09-17T08:30:00.000Z',
      publishedUrl: 'https://www.youtube.com/watch?v=mypublished1',
      publishedAt: '2026-09-17T08:30:00.000Z',
      sourceVideo: null,
    },
    {
      id: 'prod-5',
      sourceVideoId: 'vid-105',
      workingTitle: 'Ý tưởng video cũ đã dừng thực hiện',
      notes: 'Chủ đề bão hòa, lưu trữ để tham khảo sau',
      status: 'archived',
      priority: 'low',
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-09-16T15:00:00.000Z',
      publishedUrl: null,
      publishedAt: null,
      sourceVideo: null,
    },
  ];

  beforeEach(() => {
    clearStoredAccessKey();
  });

  describe('1. Cấu trúc Trạng Thái và Nhãn Tiếng Việt', () => {
    it('STATUS_LABELS có đầy đủ 8 trạng thái với nhãn tiếng Việt chuẩn xác', () => {
      expect(STATUS_LABELS.idea).toBe('Ý tưởng');
      expect(STATUS_LABELS.research).toBe('Đang nghiên cứu');
      expect(STATUS_LABELS.script).toBe('Đang viết nội dung');
      expect(STATUS_LABELS.thumbnail).toBe('Đang làm thumbnail');
      expect(STATUS_LABELS.production).toBe('Đang sản xuất');
      expect(STATUS_LABELS.editing).toBe('Đang chỉnh sửa');
      expect(STATUS_LABELS.published).toBe('Đã xuất bản');
      expect(STATUS_LABELS.archived).toBe('Đã lưu trữ');
    });

    it('PRIORITY_LABELS có 3 mức ưu tiên chuẩn xác', () => {
      expect(PRIORITY_LABELS.low).toBe('Thấp');
      expect(PRIORITY_LABELS.normal).toBe('Bình thường');
      expect(PRIORITY_LABELS.high).toBe('Cao');
    });
  });

  describe('2. Tính toán 4 chỉ số thống kê tóm tắt (Summary Stats)', () => {
    it('tính chính xác 4 chỉ số: tổng đang làm, đang sản xuất, đã xuất bản, ý tưởng mới', () => {
      const stats = productionService.computeSummaryStats(sampleItems);

      // Đang làm (activeCount): status NOT IN ('published', 'archived') -> prod-1 (idea), prod-2 (production), prod-3 (editing) => 3
      expect(stats.activeCount).toBe(3);

      // Đang sản xuất: production (1) + editing (1) => 2
      expect(stats.inProductionCount).toBe(2);

      // Đã xuất bản: published (1) => 1
      expect(stats.publishedCount).toBe(1);

      // Ý tưởng mới: idea (1) => 1
      expect(stats.ideaCount).toBe(1);

      // Tất cả (Quy trình) - toàn bộ item không archived => 4
      expect(stats.nonArchivedCount).toBe(4);
    });

    it('trả về 0 cho tất cả chỉ số khi danh sách trống', () => {
      const stats = productionService.computeSummaryStats([]);
      expect(stats.activeCount).toBe(0);
      expect(stats.nonArchivedCount).toBe(0);
      expect(stats.inProductionCount).toBe(0);
      expect(stats.publishedCount).toBe(0);
      expect(stats.ideaCount).toBe(0);
    });

    it('regression: mục có status là published KHÔNG được tính vào Đang làm (activeCount)', () => {
      const onlyPublishedAndArchived: ProductionItem[] = [
        {
          id: 'test-pub-1',
          sourceVideoId: 'v1',
          workingTitle: 'Pub 1',
          notes: '',
          status: 'published',
          priority: 'normal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedUrl: null,
          publishedAt: new Date().toISOString(),
          sourceVideo: null,
        },
        {
          id: 'test-arch-1',
          sourceVideoId: 'v2',
          workingTitle: 'Arch 1',
          notes: '',
          status: 'archived',
          priority: 'low',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedUrl: null,
          publishedAt: null,
          sourceVideo: null,
        },
      ];

      const stats = productionService.computeSummaryStats(onlyPublishedAndArchived);
      expect(stats.activeCount).toBe(0); // published MUST NOT be in activeCount
      expect(stats.publishedCount).toBe(1);
      expect(stats.nonArchivedCount).toBe(1);
    });
  });

  describe('3. Bộ lọc và Sắp xếp (Filter & Sort Logic)', () => {
    it('lọc theo trạng thái cụ thể', () => {
      const filters: ProductionFilterState = {
        status: 'production',
        priority: 'all',
        searchQuery: '',
        sortBy: 'updated_desc',
      };
      const filtered = productionService.filterAndSortItems(sampleItems, filters);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('prod-2');
    });

    it('lọc theo danh sách lưu trữ (archived)', () => {
      const filters: ProductionFilterState = {
        status: 'archived',
        priority: 'all',
        searchQuery: '',
        sortBy: 'updated_desc',
      };
      const filtered = productionService.filterAndSortItems(sampleItems, filters);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('prod-5');
    });

    it('khi status="all", loại bỏ mục archived khỏi bảng làm việc chính', () => {
      const filters: ProductionFilterState = {
        status: 'all',
        priority: 'all',
        searchQuery: '',
        sortBy: 'updated_desc',
      };
      const filtered = productionService.filterAndSortItems(sampleItems, filters);
      expect(filtered.length).toBe(4);
      expect(filtered.find(i => i.status === 'archived')).toBeUndefined();
    });

    it('lọc theo mức độ ưu tiên', () => {
      const filters: ProductionFilterState = {
        status: 'all',
        priority: 'high',
        searchQuery: '',
        sortBy: 'updated_desc',
      };
      const filtered = productionService.filterAndSortItems(sampleItems, filters);
      expect(filtered.length).toBe(2);
      expect(filtered.every(i => i.priority === 'high')).toBe(true);
    });

    it('tìm kiếm theo tiêu đề dự kiến và tiêu đề video nguồn', () => {
      const res1 = productionService.filterAndSortItems(sampleItems, {
        status: 'all',
        priority: 'all',
        searchQuery: 'Unity',
        sortBy: 'updated_desc',
      });
      expect(res1.length).toBe(1);
      expect(res1[0].id).toBe('prod-1');

      const res2 = productionService.filterAndSortItems(sampleItems, {
        status: 'all',
        priority: 'all',
        searchQuery: 'Frontend Masters',
        sortBy: 'updated_desc',
      });
      expect(res2.length).toBe(1);
      expect(res2[0].id).toBe('prod-2');
    });

    it('sắp xếp theo thời gian cập nhật mới nhất (updated_desc)', () => {
      const res = productionService.filterAndSortItems(sampleItems, {
        status: 'all',
        priority: 'all',
        searchQuery: '',
        sortBy: 'updated_desc',
      });
      expect(res.map(i => i.id)).toEqual(['prod-2', 'prod-1', 'prod-3', 'prod-4']);
    });

    it('sắp xếp theo mức độ ưu tiên (priority_desc: high -> normal -> low)', () => {
      const res = productionService.filterAndSortItems(sampleItems, {
        status: 'all',
        priority: 'all',
        searchQuery: '',
        sortBy: 'priority_desc',
      });
      expect(res[0].priority).toBe('high');
      expect(res[res.length - 1].priority).toBe('low');
    });
  });

  describe('4. Bảo mật Access Key và RLS Protection Flow', () => {
    it('ném AccessKeyRequiredError khi chưa lưu access key trong sessionStorage', async () => {
      expect(getStoredAccessKey()).toBeNull();

      await expect(
        productionService.createProductionItem({
          sourceVideoId: 'vid-123',
          workingTitle: 'Test Video',
        })
      ).rejects.toThrow(AccessKeyRequiredError);

      await expect(
        productionService.changeProductionStatus('prod-1', 'published')
      ).rejects.toThrow(AccessKeyRequiredError);

      await expect(
        productionService.archiveProductionItem('prod-1')
      ).rejects.toThrow(AccessKeyRequiredError);

      await expect(
        productionService.restoreProductionItem('prod-1')
      ).rejects.toThrow(AccessKeyRequiredError);

      await expect(
        productionService.deleteProductionItem('prod-1')
      ).rejects.toThrow(AccessKeyRequiredError);
    });

    it('lưu và xóa access key qua session storage an toàn', () => {
      setStoredAccessKey('my-secret-test-key');
      expect(getStoredAccessKey()).toBe('my-secret-test-key');
      expect(sessionStorage.getItem(ACCESS_KEY_STORAGE_KEY)).toBe('my-secret-test-key');

      clearStoredAccessKey();
      expect(getStoredAccessKey()).toBeNull();
      expect(sessionStorage.getItem(ACCESS_KEY_STORAGE_KEY)).toBeNull();
    });
  });

  describe('5. Định tuyến Route /tien-do-san-xuat', () => {
    it('route /tien-do-san-xuat được cấu hình chuẩn xác với title Bắt Bài Đối Thủ', () => {
      const routes = router.getRoutes();
      const prodRoute = routes.find(r => r.path === '/tien-do-san-xuat');

      expect(prodRoute).toBeDefined();
      expect(prodRoute?.name).toBe('Production');
      expect(prodRoute?.meta?.title).toBe('Tiến Độ Sản Xuất — Bắt Bài Đối Thủ');
    });
  });

  // WAVE 3.13: Production Workflow Command Center — Semantics & Integration
  describe('6. WAVE 3.13: Production Workflow Command Center — Semantics & Integration', () => {
    // 1. SUPABASE NOT CONFIGURED
    it('fetchProductionItems ném lỗi khi Supabase chưa cấu hình, không trả mảng rỗng', async () => {
      const supabaseModule = await import('../src/services/supabase');
      const origIsConfigured = supabaseModule.isSupabaseConfigured;
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);

      try {
        await expect(productionService.fetchProductionItems()).rejects.toThrow(
          'Chưa kết nối cơ sở dữ liệu Supabase.'
        );
      } finally {
        vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockImplementation(origIsConfigured);
      }
    });

    // 2. CHECK VIDEO IN PRODUCTION SEMANTICS
    it('checkVideoInProduction: ném lỗi khi Supabase chưa cấu hình hoặc khi query lỗi, trả null khi thật sự không có', async () => {
      const supabaseModule = await import('../src/services/supabase');
      const origIsConfigured = supabaseModule.isSupabaseConfigured;
      const origGetSupabase = supabaseModule.getSupabase;

      try {
        // A. Supabase chưa config
        vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);
        await expect(productionService.checkVideoInProduction('vid-1')).rejects.toThrow(
          'Chưa kết nối cơ sở dữ liệu Supabase.'
        );

        // B. Query error
        vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);
        vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue({
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: { message: 'Database connection failed' } }),
              }),
            }),
          }),
        } as any);
        await expect(productionService.checkVideoInProduction('vid-1')).rejects.toThrow(
          'Database connection failed'
        );

        // C. Thật sự không có row -> null
        vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue({
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        } as any);
        const resNone = await productionService.checkVideoInProduction('vid-none');
        expect(resNone).toBeNull();

        // D. Có row -> trả id
        vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue({
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 'prod-found' }, error: null }),
              }),
            }),
          }),
        } as any);
        const resFound = await productionService.checkVideoInProduction('vid-found');
        expect(resFound).toBe('prod-found');
      } finally {
        vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockImplementation(origIsConfigured);
        vi.spyOn(supabaseModule, 'getSupabase').mockImplementation(origGetSupabase);
      }
    });

    // 3. SOURCE VIDEO & THUMBNAIL SEMANTICS
    it('normalizeSourceVideoUrl và deriveProductionThumbnailUrl hoạt động chuẩn xác', () => {
      // normalizeSourceVideoUrl
      expect(normalizeSourceVideoUrl('https://custom.url/watch', 'yt123')).toBe('https://custom.url/watch');
      expect(normalizeSourceVideoUrl(null, 'yt123')).toBe('https://www.youtube.com/watch?v=yt123');
      expect(normalizeSourceVideoUrl(undefined, '  yt456  ')).toBe('https://www.youtube.com/watch?v=yt456');
      expect(normalizeSourceVideoUrl(null, null)).toBeNull();
      expect(normalizeSourceVideoUrl('null', 'undefined')).toBeNull();
      expect(normalizeSourceVideoUrl('', '')).toBeNull();

      // deriveProductionThumbnailUrl
      expect(deriveProductionThumbnailUrl('https://custom.img/t.jpg', 'yt123')).toBe('https://custom.img/t.jpg');
      expect(deriveProductionThumbnailUrl(null, 'yt123')).toBe('https://i.ytimg.com/vi/yt123/mqdefault.jpg');
      expect(deriveProductionThumbnailUrl(undefined, '  yt789  ')).toBe('https://i.ytimg.com/vi/yt789/mqdefault.jpg');
      expect(deriveProductionThumbnailUrl(null, null)).toBeNull();
      expect(deriveProductionThumbnailUrl('null', 'undefined')).toBeNull();
      expect(deriveProductionThumbnailUrl('', '')).toBeNull();
    });

    // 4. NO UNPLASH OR STOCK IMAGES
    it('mã nguồn ProductionPage và components không chứa images.unsplash.com', () => {
      const pageFile = path.resolve(__dirname, '../src/pages/ProductionPage.vue');
      const compDir = path.resolve(__dirname, '../src/components/production');
      let allCode = fs.readFileSync(pageFile, 'utf-8');
      if (fs.existsSync(compDir)) {
        for (const file of fs.readdirSync(compDir)) {
          allCode += ' ' + fs.readFileSync(path.join(compDir, file), 'utf-8');
        }
      }
      expect(allCode).not.toContain('images.unsplash.com');
      expect(allCode).not.toContain('unsplash');
    });

    // 5. BOARD VIEW: RENDER ĐÚNG 7 ACTIVE WORKFLOW COLUMNS
    it('ACTIVE_WORKFLOW_STATUSES có đúng 7 trạng thái active, không chứa archived', () => {
      expect(ACTIVE_WORKFLOW_STATUSES).toEqual([
        'idea',
        'research',
        'script',
        'thumbnail',
        'production',
        'editing',
        'published',
      ]);
      expect(ACTIVE_WORKFLOW_STATUSES.includes('archived' as any)).toBe(false);
    });

    // 6. VIEW MODE PERSISTENCE & SAFE STORAGE
    it('chuyển đổi chế độ xem board <-> list lưu localStorage an toàn và không gọi fetchProductionItems lại', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');
      const { default: ProductionToolbar } = await import('../src/components/production/ProductionToolbar.vue');

      localStorage.removeItem(PRODUCTION_VIEW_MODE_STORAGE_KEY);
      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue(sampleItems);

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: {
              'router-link': { template: '<a><slot /></a>' },
            },
          },
        });

        await flushPromises();
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        const toolbar = wrapper.findComponent(ProductionToolbar);
        expect(toolbar.props('viewMode')).toBe('board');

        // Switch to list
        toolbar.vm.$emit('update:viewMode', 'list');
        await flushPromises();

        expect(toolbar.props('viewMode')).toBe('list');
        expect(localStorage.getItem(PRODUCTION_VIEW_MODE_STORAGE_KEY)).toBe('list');
        // Không refetch!
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        // Switch back to board
        toolbar.vm.$emit('update:viewMode', 'board');
        await flushPromises();

        expect(toolbar.props('viewMode')).toBe('board');
        expect(localStorage.getItem(PRODUCTION_VIEW_MODE_STORAGE_KEY)).toBe('board');
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    // 7. ASYNC RACE PROTECTION (loadRequestId)
    it('stale load response không ghi đè dữ liệu mới hơn khi tải lại', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');

      let resolveFetch1: (val: any) => void;
      const promise1 = new Promise(r => { resolveFetch1 = r; });

      const itemSet1: ProductionItem[] = [sampleItems[0]];
      const itemSet2: ProductionItem[] = [sampleItems[0], sampleItems[1]];

      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems')
        .mockReturnValueOnce(promise1 as any)
        .mockResolvedValueOnce(itemSet2);

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: {
              'router-link': { template: '<a><slot /></a>' },
            },
          },
        });

        // First fetch starts and hangs on promise1
        // Trigger second fetch
        const refreshBtn = wrapper.find('button[title="Tải lại danh sách tiến độ"]');
        await refreshBtn.trigger('click');
        await flushPromises();

        // Second fetch finished with itemSet2
        // Now resolve first fetch late
        resolveFetch1!(itemSet1);
        await flushPromises();

        // Must still show itemSet2, not overwritten by stale itemSet1!
        const cards = wrapper.findAll('.production-card');
        expect(cards.length).toBe(2);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    // 8. ACCESS KEY HARDENING: CANCEL MODAL CLEARS PENDING ACTION
    it('hủy bỏ modal mã truy cập sẽ xóa pendingAction an toàn', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');
      const { default: AccessKeyPromptModal } = await import('../src/components/ui/AccessKeyPromptModal.vue');

      clearStoredAccessKey();
      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const changeSpy = vi.spyOn(productionService, 'changeProductionStatus');

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: {
              'router-link': { template: '<a><slot /></a>' },
            },
          },
        });

        await flushPromises();

        // Try changing status without key
        const select = wrapper.find('.stage-select-control');
        await select.setValue('script');
        await select.trigger('change');
        await flushPromises();

        const modal = wrapper.findComponent(AccessKeyPromptModal);
        expect(modal.props('modelValue')).toBe(true);

        // Cancel modal
        modal.vm.$emit('update:modelValue', false);
        await flushPromises();

        expect(modal.props('modelValue')).toBe(false);

        // Even if confirmed is emitted later, pendingAction was cleared
        modal.vm.$emit('confirmed', 'key-123');
        await flushPromises();

        expect(changeSpy).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
        changeSpy.mockRestore();
      }
    });

    // 9. STATUS CHANGE & RETRY WITH CONFIRMED KEY
    it('đổi status nhắc mã truy cập, nhập đúng mã sẽ retry và cập nhật UI đúng từ server', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');
      const { default: AccessKeyPromptModal } = await import('../src/components/ui/AccessKeyPromptModal.vue');

      clearStoredAccessKey();
      const updatedItem: ProductionItem = {
        ...sampleItems[0],
        status: 'production',
        updatedAt: new Date().toISOString(),
      };

      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const changeSpy = vi.spyOn(productionService, 'changeProductionStatus').mockResolvedValue(updatedItem);

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: {
              'router-link': { template: '<a><slot /></a>' },
            },
          },
        });

        await flushPromises();

        const select = wrapper.find('.stage-select-control');
        await select.setValue('production');
        await select.trigger('change');
        await flushPromises();

        const modal = wrapper.findComponent(AccessKeyPromptModal);
        expect(modal.props('modelValue')).toBe(true);

        // Confirm access key
        modal.vm.$emit('confirmed', 'valid-write-key');
        await flushPromises();

        expect(changeSpy).toHaveBeenCalledWith('prod-1', 'production', 'valid-write-key');
        expect(wrapper.text()).toContain('Đã chuyển sang Đang sản xuất.');
      } finally {
        fetchSpy.mockRestore();
        changeSpy.mockRestore();
      }
    });

    // 10. EDIT MODAL SNAPSHOT PAYLOAD & NON-AUTH ERROR DISPLAY
    it('edit modal snapshot payload và hiển thị modalError khi URL không hợp lệ mà không đóng modal', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');
      const { default: ProductionEditModal } = await import('../src/components/production/ProductionEditModal.vue');

      setStoredAccessKey('valid-key');
      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const updateSpy = vi.spyOn(productionService, 'updateProductionItem').mockRejectedValue(
        new Error('URL xuất bản phải bắt đầu bằng http:// hoặc https://')
      );

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: {
              'router-link': { template: '<a><slot /></a>' },
            },
          },
        });

        await flushPromises();

        // Click edit on card
        const editBtn = wrapper.find('.action-btn.edit-btn');
        await editBtn.trigger('click');
        await flushPromises();

        const editModal = wrapper.findComponent(ProductionEditModal);
        expect(editModal.props('modelValue')).toBe(true);

        // Save with invalid URL
        editModal.vm.$emit('save', {
          id: 'prod-1',
          workingTitle: 'New Title',
          publishedUrl: 'invalid-url',
        });
        await flushPromises();

        expect(updateSpy).toHaveBeenCalled();
        // Modal remains open and shows error inside modal!
        expect(editModal.props('modelValue')).toBe(true);
        expect(editModal.props('modalError')).toBe('URL xuất bản phải bắt đầu bằng http:// hoặc https://');
      } finally {
        fetchSpy.mockRestore();
        updateSpy.mockRestore();
      }
    });

    // 11. DELETE MODAL & SAFE ITEM REMOVAL
    it('delete modal hiển thị cảnh báo an toàn và chỉ xóa local state khi server thành công', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');
      const { default: ProductionDeleteModal } = await import('../src/components/production/ProductionDeleteModal.vue');

      setStoredAccessKey('valid-key');
      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const deleteSpy = vi.spyOn(productionService, 'deleteProductionItem').mockResolvedValue('prod-1');

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: {
              'router-link': { template: '<a><slot /></a>' },
            },
          },
        });

        await flushPromises();

        // Open delete modal
        const deleteBtn = wrapper.find('.action-btn.delete-btn');
        await deleteBtn.trigger('click');
        await flushPromises();

        const deleteModal = wrapper.findComponent(ProductionDeleteModal);
        expect(deleteModal.props('modelValue')).toBe(true);
        expect(document.body.textContent).toContain('Video nguồn đối thủ không bị xóa.');

        // Confirm delete
        deleteModal.vm.$emit('confirm');
        await flushPromises();

        expect(deleteSpy).toHaveBeenCalledWith('prod-1', 'valid-key');
        expect(wrapper.findAll('.production-card').length).toBe(0);
      } finally {
        fetchSpy.mockRestore();
        deleteSpy.mockRestore();
      }
    });

    // 12. SOURCE VIDEO NULL SAFETY
    it('hiển thị thông báo khi sourceVideo null và không render liên kết hỏng khi url null', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');

      const nullSourceItem: ProductionItem = {
        ...sampleItems[0],
        id: 'prod-null-source',
        sourceVideo: null,
      };

      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([nullSourceItem]);

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: {
              'router-link': { template: '<a><slot /></a>' },
            },
          },
        });

        await flushPromises();

        expect(wrapper.text()).toContain('Video nguồn không còn trong hệ thống.');
      } finally {
        fetchSpy.mockRestore();
      }
    });

    // 13. NO FAKE AI METRICS
    it('không có AI score, viral probability, prediction, deadline hoặc completion % trong mã nguồn', () => {
      const pageFile = path.resolve(__dirname, '../src/pages/ProductionPage.vue');
      const compDir = path.resolve(__dirname, '../src/components/production');
      let allContent = fs.readFileSync(pageFile, 'utf-8');
      if (fs.existsSync(compDir)) {
        for (const file of fs.readdirSync(compDir)) {
          allContent += ' ' + fs.readFileSync(path.join(compDir, file), 'utf-8');
        }
      }

      expect(allContent.toLowerCase()).not.toContain('ai score');
      expect(allContent.toLowerCase()).not.toContain('viral probability');
      expect(allContent.toLowerCase()).not.toContain('dự đoán viral');
      expect(allContent.toLowerCase()).not.toContain('completion %');
      expect(allContent.toLowerCase()).not.toContain('phần trăm hoàn thành');
    });
  });
});
