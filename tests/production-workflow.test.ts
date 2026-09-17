import { describe, it, expect, beforeEach } from 'vitest';
import { productionService } from '../src/services/production-service';
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
import { STATUS_LABELS, PRIORITY_LABELS } from '../src/types/production';
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

      expect(stats.totalActive).toBe(4);
      expect(stats.activeCount).toBe(4);
      expect(stats.inProductionCount).toBe(2);
      expect(stats.publishedCount).toBe(1);
      expect(stats.ideaCount).toBe(1);
    });

    it('trả về 0 cho tất cả chỉ số khi danh sách trống', () => {
      const stats = productionService.computeSummaryStats([]);
      expect(stats.totalActive).toBe(0);
      expect(stats.activeCount).toBe(0);
      expect(stats.inProductionCount).toBe(0);
      expect(stats.publishedCount).toBe(0);
      expect(stats.ideaCount).toBe(0);
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
});
