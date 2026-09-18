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
  ProductionUpdateInput,
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

  // ==========================================
  // 7. WAVE 3.13: Final Interaction & Semantics Hardening
  // ==========================================
  describe('7. WAVE 3.13: Final Interaction & Semantics Hardening', () => {
    // 1. Static AppIcon names audit
    it('mọi AppIcon name tĩnh trong Production page và components đều có implementation thật trong AppIcon.vue', () => {
      const appIconFile = path.resolve(__dirname, '../src/components/ui/AppIcon.vue');
      const appIconContent = fs.readFileSync(appIconFile, 'utf-8');
      const supportedMatches = appIconContent.matchAll(/name === '([a-z0-9-]+)'/g);
      const supportedNames = new Set<string>();
      for (const m of supportedMatches) {
        supportedNames.add(m[1]);
      }

      const filesToCheck = [
        path.resolve(__dirname, '../src/pages/ProductionPage.vue'),
        ...fs.readdirSync(path.resolve(__dirname, '../src/components/production'))
          .filter(f => f.endsWith('.vue'))
          .map(f => path.resolve(__dirname, '../src/components/production', f))
      ];

      for (const file of filesToCheck) {
        const content = fs.readFileSync(file, 'utf-8');
        const iconNameMatches = content.matchAll(/<AppIcon[^>]*\bname="([a-z0-9-]+)"/g);
        for (const m of iconNameMatches) {
          const iconName = m[1];
          expect(supportedNames.has(iconName), `Unsupported AppIcon name "${iconName}" found in ${path.basename(file)}`).toBe(true);
        }
      }
    });

    // 2. Block mutation during load & prevent load overwriting mutation
    it('khóa mutation controls khi đang load, không cho mutation bắt đầu và enable lại sau khi load xong', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');

      setStoredAccessKey('valid-key');
      let resolveFetch: (val: any) => void;
      const fetchPromise = new Promise(r => { resolveFetch = r; });

      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockReturnValue(fetchPromise as any);
      const changeSpy = vi.spyOn(productionService, 'changeProductionStatus');

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: { 'router-link': { template: '<a><slot /></a>' } },
          },
        });

        // Initially loading is true
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).loading).toBe(true);
        expect((wrapper.vm as any).interactionsLocked).toBe(true);

        // Refresh button should be disabled
        const refreshBtn = wrapper.find('button[title="Tải lại danh sách tiến độ"]');
        expect(refreshBtn.attributes('disabled')).toBeDefined();

        // Attempting to change status programmatically during load should be ignored
        await (wrapper.vm as any).handleChangeStatus({ id: 'prod-1', status: 'script' });
        expect(changeSpy).not.toHaveBeenCalled();

        // Now resolve fetch
        resolveFetch!([sampleItems[0]]);
        await flushPromises();

        expect((wrapper.vm as any).loading).toBe(false);
        expect((wrapper.vm as any).interactionsLocked).toBe(false);
        expect(refreshBtn.attributes('disabled')).toBeUndefined();

        // After resolve, mutation works
        changeSpy.mockResolvedValueOnce({ ...sampleItems[0], status: 'script' });
        await (wrapper.vm as any).handleChangeStatus({ id: 'prod-1', status: 'script' });
        await flushPromises();

        expect(changeSpy).toHaveBeenCalledWith('prod-1', 'script', 'valid-key');
      } finally {
        fetchSpy.mockRestore();
        changeSpy.mockRestore();
      }
    });

    // 3. Access modal lock: modal open locks mutation and refresh, cancel unlocks
    it('khi access modal mở thì khóa toàn bộ mutation và refresh; cancel sẽ mở khóa', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');
      const { default: AccessKeyPromptModal } = await import('../src/components/ui/AccessKeyPromptModal.vue');

      clearStoredAccessKey();
      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const archiveSpy = vi.spyOn(productionService, 'archiveProductionItem');

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: { 'router-link': { template: '<a><slot /></a>' } },
          },
        });
        await flushPromises();

        // Trigger action that requires key
        await (wrapper.vm as any).handleArchive('prod-1');
        await flushPromises();

        expect((wrapper.vm as any).showAccessKeyModal).toBe(true);
        expect((wrapper.vm as any).interactionsLocked).toBe(true);

        // Attempting second action while modal is open should be blocked
        await (wrapper.vm as any).handleRestore('prod-1');
        await (wrapper.vm as any).loadItems();
        // Archive was NOT executed yet, only pending
        expect(archiveSpy).not.toHaveBeenCalled();

        // Cancel modal
        const modal = wrapper.findComponent(AccessKeyPromptModal);
        modal.vm.$emit('update:modelValue', false);
        await flushPromises();

        expect((wrapper.vm as any).showAccessKeyModal).toBe(false);
        expect((wrapper.vm as any).interactionsLocked).toBe(false);
      } finally {
        fetchSpy.mockRestore();
        archiveSpy.mockRestore();
      }
    });

    // 4. Invalid key error test: AccessKeyRequiredError message retained in modal
    it('mã truy cập sai ném AccessKeyRequiredError, modal mở lại với initialError đúng message thật', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');
      const { default: AccessKeyPromptModal } = await import('../src/components/ui/AccessKeyPromptModal.vue');

      setStoredAccessKey('invalid-key');
      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const changeSpy = vi.spyOn(productionService, 'changeProductionStatus').mockRejectedValue(
        new AccessKeyRequiredError('Mã truy cập không chính xác hoặc đã hết hạn.')
      );

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: { 'router-link': { template: '<a><slot /></a>' } },
          },
        });
        await flushPromises();

        // Trigger status change
        await (wrapper.vm as any).handleChangeStatus({ id: 'prod-1', status: 'script' });
        await flushPromises();

        const modal = wrapper.findComponent(AccessKeyPromptModal);
        expect(modal.props('modelValue')).toBe(true);
        expect(modal.props('initialError')).toBe('Mã truy cập không chính xác hoặc đã hết hạn.');
      } finally {
        fetchSpy.mockRestore();
        changeSpy.mockRestore();
      }
    });

    // 5. Status failure test
    it('changeProductionStatus thất bại thì item giữ nguyên status cũ, toast lỗi xuất hiện và busy state được giải phóng', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');

      setStoredAccessKey('valid-key');
      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([{ ...sampleItems[0], status: 'idea' }]);
      const changeSpy = vi.spyOn(productionService, 'changeProductionStatus').mockRejectedValue(
        new Error('Lỗi cập nhật máy chủ')
      );

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: { 'router-link': { template: '<a><slot /></a>' } },
          },
        });
        await flushPromises();

        await (wrapper.vm as any).handleChangeStatus({ id: 'prod-1', status: 'script' });
        await flushPromises();

        // Item status remains 'idea'
        expect((wrapper.vm as any).items[0].status).toBe('idea');
        // Busy state released
        expect((wrapper.vm as any).busyItemIds.has('prod-1')).toBe(false);
        expect((wrapper.vm as any).isAnyMutationBusy).toBe(false);
        // Error toast shown
        expect(wrapper.text()).toContain('Lỗi cập nhật máy chủ');
      } finally {
        fetchSpy.mockRestore();
        changeSpy.mockRestore();
      }
    });

    // 6. Double mutation test
    it('mutation item A đang pending thì cuộc gọi thứ 2 cho item A hoặc item B bị khóa, chỉ 1 call tới service', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');

      setStoredAccessKey('valid-key');
      let resolveA: (val: any) => void;
      const promiseA = new Promise(r => { resolveA = r; });

      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([
        { ...sampleItems[0], id: 'item-A' },
        { ...sampleItems[0], id: 'item-B' },
      ]);
      const changeSpy = vi.spyOn(productionService, 'changeProductionStatus')
        .mockReturnValueOnce(promiseA as any);

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: { 'router-link': { template: '<a><slot /></a>' } },
          },
        });
        await flushPromises();

        // Trigger mutation on item-A (starts pending)
        const mut1 = (wrapper.vm as any).handleChangeStatus({ id: 'item-A', status: 'script' });
        expect((wrapper.vm as any).busyItemIds.has('item-A')).toBe(true);
        expect((wrapper.vm as any).interactionsLocked).toBe(true);

        // Attempt second mutation on item-A
        await (wrapper.vm as any).handleChangeStatus({ id: 'item-A', status: 'thumbnail' });
        // Attempt mutation on item-B
        await (wrapper.vm as any).handleChangeStatus({ id: 'item-B', status: 'production' });

        expect(changeSpy).toHaveBeenCalledTimes(1);

        // Resolve item-A
        resolveA!({ ...sampleItems[0], id: 'item-A', status: 'script' });
        await mut1;
        await flushPromises();

        expect((wrapper.vm as any).busyItemIds.has('item-A')).toBe(false);
        expect((wrapper.vm as any).interactionsLocked).toBe(false);

        // Now item-B can be mutated
        changeSpy.mockResolvedValueOnce({ ...sampleItems[0], id: 'item-B', status: 'production' });
        await (wrapper.vm as any).handleChangeStatus({ id: 'item-B', status: 'production' });
        await flushPromises();

        expect(changeSpy).toHaveBeenCalledTimes(2);
      } finally {
        fetchSpy.mockRestore();
        changeSpy.mockRestore();
      }
    });

    // 7. View mode tests: A. garbage localStorage fallback; B. filter preservation during switch
    it('view mode fallback về board khi localStorage có giá trị rác, giữ nguyên filters khi switch view', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');

      localStorage.setItem(PRODUCTION_VIEW_MODE_STORAGE_KEY, 'corrupted_garbage_mode');
      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue(sampleItems);

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: { 'router-link': { template: '<a><slot /></a>' } },
          },
        });
        await flushPromises();

        // A. Fallback to board
        expect((wrapper.vm as any).viewMode).toBe('board');

        // B. Set filters
        (wrapper.vm as any).filterState.searchQuery = 'game 2d';
        (wrapper.vm as any).filterState.priority = 'high';
        (wrapper.vm as any).filterState.status = 'idea';
        (wrapper.vm as any).filterState.sortBy = 'priority_desc';

        expect(fetchSpy).toHaveBeenCalledTimes(1);

        // Switch board -> list -> board
        (wrapper.vm as any).setViewMode('list');
        await flushPromises();
        expect((wrapper.vm as any).viewMode).toBe('list');

        (wrapper.vm as any).setViewMode('board');
        await flushPromises();
        expect((wrapper.vm as any).viewMode).toBe('board');

        // Assert filters unchanged
        expect((wrapper.vm as any).filterState.searchQuery).toBe('game 2d');
        expect((wrapper.vm as any).filterState.priority).toBe('high');
        expect((wrapper.vm as any).filterState.status).toBe('idea');
        expect((wrapper.vm as any).filterState.sortBy).toBe('priority_desc');

        // fetchProductionItems not called again
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    // 8. Archive / Restore success uses exact server response
    it('archive và restore cập nhật local state dựa trên response chính xác từ server', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');

      setStoredAccessKey('valid-key');
      const serverArchivedItem: ProductionItem = {
        ...sampleItems[0],
        status: 'archived',
        updatedAt: '2026-09-18T12:00:00.000Z',
      };
      const serverRestoredItem: ProductionItem = {
        ...sampleItems[0],
        status: 'idea',
        updatedAt: '2026-09-18T12:05:00.000Z',
      };

      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const archiveSpy = vi.spyOn(productionService, 'archiveProductionItem').mockResolvedValue(serverArchivedItem);
      const restoreSpy = vi.spyOn(productionService, 'restoreProductionItem').mockResolvedValue(serverRestoredItem);

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: { 'router-link': { template: '<a><slot /></a>' } },
          },
        });
        await flushPromises();

        // Archive
        await (wrapper.vm as any).handleArchive('prod-1');
        await flushPromises();

        expect(archiveSpy).toHaveBeenCalledWith('prod-1', 'valid-key');
        expect((wrapper.vm as any).items[0].status).toBe('archived');
        expect((wrapper.vm as any).items[0].updatedAt).toBe('2026-09-18T12:00:00.000Z');

        // Restore
        await (wrapper.vm as any).handleRestore('prod-1');
        await flushPromises();

        expect(restoreSpy).toHaveBeenCalledWith('prod-1', 'valid-key');
        expect((wrapper.vm as any).items[0].status).toBe('idea');
        expect((wrapper.vm as any).items[0].updatedAt).toBe('2026-09-18T12:05:00.000Z');
      } finally {
        fetchSpy.mockRestore();
        archiveSpy.mockRestore();
        restoreSpy.mockRestore();
      }
    });

    // 9. Delete failure test
    it('deleteProductionItem thất bại thì item không bị xóa, toast lỗi factual và busy state được release', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');

      setStoredAccessKey('valid-key');
      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const deleteSpy = vi.spyOn(productionService, 'deleteProductionItem').mockRejectedValue(
        new Error('Không thể xóa mục do ràng buộc máy chủ.')
      );

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: { 'router-link': { template: '<a><slot /></a>' } },
          },
        });
        await flushPromises();

        (wrapper.vm as any).openDeleteModal(sampleItems[0]);
        await flushPromises();

        expect((wrapper.vm as any).showDeleteModal).toBe(true);

        await (wrapper.vm as any).handleConfirmDelete();
        await flushPromises();

        // Item still exists
        expect((wrapper.vm as any).items.length).toBe(1);
        expect((wrapper.vm as any).busyItemIds.has('prod-1')).toBe(false);
        expect((wrapper.vm as any).isDeleting).toBe(false);
        expect(wrapper.text()).toContain('Không thể xóa mục do ràng buộc máy chủ.');
      } finally {
        fetchSpy.mockRestore();
        deleteSpy.mockRestore();
      }
    });

    // 10. URL null render test
    it('sourceVideo.url null thì render title nguồn factual và không render thẻ <a> với href null', async () => {
      const { default: ProductionCard } = await import('../src/components/production/ProductionCard.vue');

      const nullUrlItem: ProductionItem = {
        ...sampleItems[0],
        sourceVideo: {
          ...sampleItems[0].sourceVideo!,
          title: 'Video Gốc Không Link URL',
          url: null,
        },
      };

      const wrapper = mount(ProductionCard, {
        props: {
          item: nullUrlItem,
          isBusy: false,
          anyMutationBusy: false,
        },
        global: {
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      });

      expect(wrapper.text()).toContain('Video Gốc Không Link URL');
      // No link to source video
      const sourceLinks = wrapper.findAll('a.source-video-link');
      expect(sourceLinks.length).toBe(0);
      expect(wrapper.find('.source-video-static').text()).toBe('Video Gốc Không Link URL');
      expect(wrapper.html()).not.toContain('href="null"');
    });

    // 11. Published URL null test
    it('status published có publishedAt nhưng publishedUrl null thì render Đã xuất bản và ngày nhưng không có link', async () => {
      const { default: ProductionCard } = await import('../src/components/production/ProductionCard.vue');

      const publishedItem: ProductionItem = {
        ...sampleItems[0],
        status: 'published',
        publishedAt: '2026-09-18T10:00:00.000Z',
        publishedUrl: null,
      };

      const wrapper = mount(ProductionCard, {
        props: {
          item: publishedItem,
          isBusy: false,
          anyMutationBusy: false,
        },
        global: {
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
          },
        },
      });

      expect(wrapper.text()).toContain('Đã xuất bản');
      expect(wrapper.find('.published-date').exists()).toBe(true);
      expect(wrapper.find('a.published-link-btn').exists()).toBe(false);
      expect(wrapper.text()).not.toContain('Xem bài đăng');
    });

    // 12. Edit clear test
    it('edit modal cho phép xóa trắng 3 trường và emit payload với chuỗi rỗng thay vì undefined', async () => {
      const { default: ProductionEditModal } = await import('../src/components/production/ProductionEditModal.vue');

      const initialItem: ProductionItem = {
        ...sampleItems[0],
        workingTitle: 'Old Working Title',
        notes: 'Old Notes Description',
        publishedUrl: 'https://example.com/old-video',
        priority: 'high',
      };

      const wrapper = mount(ProductionEditModal, {
        props: {
          modelValue: true,
          item: initialItem,
          isSaving: false,
          modalError: null,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      });

      // Clear all 3 inputs
      const titleInput = wrapper.find('#edit-working-title');
      await titleInput.setValue('');

      const notesTextarea = wrapper.find('#edit-notes');
      await notesTextarea.setValue('');

      const urlInput = wrapper.find('#edit-published-url');
      await urlInput.setValue('');

      // Submit
      await wrapper.find('form.edit-form').trigger('submit.prevent');

      const saveEmits = wrapper.emitted('save');
      expect(saveEmits).toBeDefined();
      expect(saveEmits![0][0]).toEqual({
        id: 'prod-1',
        workingTitle: '',
        notes: '',
        priority: 'high',
        publishedUrl: '',
      });
    });

    // 13. EDIT RETRY TEST: isSaving retained, save disabled, no double submission
    it('edit retry: khi nhập access key và updateProductionItem pending thì modal vẫn hiện isSaving, save disabled và không cho double submit', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');
      const { default: ProductionEditModal } = await import('../src/components/production/ProductionEditModal.vue');
      const { default: AccessKeyPromptModal } = await import('../src/components/ui/AccessKeyPromptModal.vue');

      clearStoredAccessKey();
      let resolveUpdate: (val: any) => void;
      const updatePromise = new Promise(r => { resolveUpdate = r; });

      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const updateSpy = vi.spyOn(productionService, 'updateProductionItem').mockReturnValue(updatePromise as any);

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: {
              'router-link': { template: '<a><slot /></a>' },
              Teleport: true,
            },
          },
        });
        await flushPromises();

        // Open edit modal
        (wrapper.vm as any).openEditModal(sampleItems[0]);
        await flushPromises();

        const editModal = wrapper.findComponent(ProductionEditModal);
        expect(editModal.props('modelValue')).toBe(true);

        // Submit edit without key
        const savePayload: ProductionUpdateInput = {
          id: 'prod-1',
          workingTitle: 'Retry Title',
          priority: 'high',
          notes: 'Retry Notes',
          publishedUrl: '',
        };
        await (wrapper.vm as any).handleSaveEdit(savePayload);
        await flushPromises();

        // Access modal opened
        const accessModal = wrapper.findComponent(AccessKeyPromptModal);
        expect(accessModal.props('modelValue')).toBe(true);

        // Confirm access key
        accessModal.vm.$emit('confirmed', 'new-valid-key');
        await flushPromises();

        // Now updateProductionItem is called and pending
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(editModal.props('isSaving')).toBe(true);

        // In modal DOM, save button should be disabled
        const saveBtn = editModal.findAll('button').find(b => b.text().includes('Đang lưu...'));
        expect(saveBtn).toBeDefined();
        expect(saveBtn!.attributes('disabled')).toBeDefined();

        // Attempt second submit while pending
        await (wrapper.vm as any).handleSaveEdit(savePayload);
        expect(updateSpy).toHaveBeenCalledTimes(1); // STILL only 1 call!

        // Resolve
        resolveUpdate!({ ...sampleItems[0], workingTitle: 'Retry Title' });
        await flushPromises();

        expect(editModal.props('modelValue')).toBe(false);
        expect((wrapper.vm as any).isAnyMutationBusy).toBe(false);
      } finally {
        fetchSpy.mockRestore();
        updateSpy.mockRestore();
      }
    });

    // 14. DELETE RETRY TEST: isDeleting retained, confirm disabled, no double delete
    it('delete retry: khi nhập access key và deleteProductionItem pending thì modal vẫn hiện isDeleting, confirm disabled và không cho double delete', async () => {
      const { default: ProductionPage } = await import('../src/pages/ProductionPage.vue');
      const { default: ProductionDeleteModal } = await import('../src/components/production/ProductionDeleteModal.vue');
      const { default: AccessKeyPromptModal } = await import('../src/components/ui/AccessKeyPromptModal.vue');

      clearStoredAccessKey();
      let resolveDelete: (val: any) => void;
      const deletePromise = new Promise(r => { resolveDelete = r; });

      const fetchSpy = vi.spyOn(productionService, 'fetchProductionItems').mockResolvedValue([sampleItems[0]]);
      const deleteSpy = vi.spyOn(productionService, 'deleteProductionItem').mockReturnValue(deletePromise as any);

      try {
        const wrapper = mount(ProductionPage, {
          global: {
            plugins: [router],
            stubs: {
              'router-link': { template: '<a><slot /></a>' },
              Teleport: true,
            },
          },
        });
        await flushPromises();

        // Open delete modal
        (wrapper.vm as any).openDeleteModal(sampleItems[0]);
        await flushPromises();

        const deleteModal = wrapper.findComponent(ProductionDeleteModal);
        expect(deleteModal.props('modelValue')).toBe(true);

        // Confirm delete without key
        await (wrapper.vm as any).handleConfirmDelete();
        await flushPromises();

        // Access modal opened
        const accessModal = wrapper.findComponent(AccessKeyPromptModal);
        expect(accessModal.props('modelValue')).toBe(true);

        // Confirm access key
        accessModal.vm.$emit('confirmed', 'new-valid-key');
        await flushPromises();

        // Now deleteProductionItem is called and pending
        expect(deleteSpy).toHaveBeenCalledTimes(1);
        expect(deleteModal.props('isDeleting')).toBe(true);

        // Confirm and cancel buttons should be disabled
        const confirmBtn = deleteModal.findAll('button').find(b => b.text().includes('Đang xóa...'));
        expect(confirmBtn).toBeDefined();
        expect(confirmBtn!.attributes('disabled')).toBeDefined();

        const cancelBtn = deleteModal.findAll('button').find(b => b.text() === 'Hủy');
        expect(cancelBtn).toBeDefined();
        expect(cancelBtn!.attributes('disabled')).toBeDefined();

        // Attempt second confirm while pending
        await (wrapper.vm as any).handleConfirmDelete();
        expect(deleteSpy).toHaveBeenCalledTimes(1); // STILL only 1 call!

        // Item still exists while pending
        expect((wrapper.vm as any).items.length).toBe(1);

        // Resolve
        resolveDelete!('prod-1');
        await flushPromises();

        expect(deleteModal.props('modelValue')).toBe(false);
        expect((wrapper.vm as any).items.length).toBe(0);
        expect((wrapper.vm as any).isAnyMutationBusy).toBe(false);
      } finally {
        fetchSpy.mockRestore();
        deleteSpy.mockRestore();
      }
    });
  });
});
