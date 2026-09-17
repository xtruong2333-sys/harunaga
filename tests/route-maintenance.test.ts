import { describe, it, expect } from 'vitest';
import router from '../src/router';

describe('Bắt Bài Đối Thủ — Giai Đoạn 11: Route Maintenance & Lazy Loading', () => {
  const EXPECTED_ROUTES = [
    { path: '/', redirect: '/tong-quan' },
    { path: '/tong-quan', name: 'Overview', title: 'Tổng Quan — Bắt Bài Đối Thủ' },
    { path: '/video-tiem-nang', name: 'OpportunityVideos', title: 'Video Tiềm Năng — Bắt Bài Đối Thủ' },
    { path: '/videos', name: 'Videos', title: 'Video Đang Tăng — Bắt Bài Đối Thủ' },
    { path: '/videos/:id', name: 'VideoDetail', title: 'Chi Tiết Video — Bắt Bài Đối Thủ' },
    { path: '/kenh-theo-doi', name: 'KenhTheoDoi', title: 'Kênh Theo Dõi — Bắt Bài Đối Thủ' },
    { path: '/kenh-theo-doi/:id', name: 'ChannelDetail', title: 'Phân Tích Kênh — Bắt Bài Đối Thủ' },
    { path: '/so-sanh-kenh', name: 'ChannelComparison', title: 'So Sánh Kênh — Bắt Bài Đối Thủ' },
    { path: '/tro-ly-noi-dung', name: 'AiContentAssistant', title: 'Trợ Lý Nội Dung AI — Bắt Bài Đối Thủ' },
    { path: '/tien-do-san-xuat', name: 'Production', title: 'Tiến Độ Sản Xuất — Bắt Bài Đối Thủ' },
    { path: '/tinh-trang-du-lieu', name: 'DataHealth', title: 'Tình Trạng Dữ Liệu — Bắt Bài Đối Thủ' },
  ];

  it('Tất cả 11 routes chính đều được đăng ký đầy đủ và không bị mất', () => {
    const registeredRoutes = router.getRoutes();
    for (const expected of EXPECTED_ROUTES) {
      const found = registeredRoutes.find(r => r.path === expected.path);
      expect(found, `Route ${expected.path} phải tồn tại`).toBeDefined();
      if (expected.name) {
        expect(found?.name).toBe(expected.name);
      }
      if (expected.title) {
        expect(found?.meta?.title).toBe(expected.title);
      }
    }
  });

  it('Root route / chuyển hướng chính xác về /tong-quan', () => {
    const rootRoute = router.getRoutes().find(r => r.path === '/');
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.redirect).toBe('/tong-quan');
  });

  it('Catch-all route /:pathMatch(.*)* chuyển hướng an toàn về /tong-quan', () => {
    const catchAll = router.getRoutes().find(r => r.path.includes(':pathMatch'));
    expect(catchAll).toBeDefined();
    expect(catchAll?.redirect).toBe('/tong-quan');
  });

  it('Tất cả các Page component đều sử dụng lazy loading (dynamic import functions)', async () => {
    const registeredRoutes = router.getRoutes();
    const pageRoutes = registeredRoutes.filter(r => r.path !== '/' && !r.path.includes(':pathMatch'));

    expect(pageRoutes.length).toBe(10);

    for (const route of pageRoutes) {
      const comp = route.components?.default;
      expect(typeof comp, `Component của route ${route.path} phải là dynamic import function`).toBe('function');
      
      // Thực thi dynamic import để xác nhận module nạp thành công
      const module = await (comp as () => Promise<any>)();
      expect(module, `Module của route ${route.path} phải tồn tại`).toBeDefined();
      expect(module.default, `Module của route ${route.path} phải có default export`).toBeDefined();
    }
  });
});
