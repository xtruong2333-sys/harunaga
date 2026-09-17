import { describe, it, expect } from 'vitest';
import { dashboardService } from '../src/services/dashboard-service';

describe('Bắt Bài Đối Thủ — Giai Đoạn 5: Tổng Quan (Overview Dashboard)', () => {
  describe('1. Định dạng nguồn kích hoạt (formatTriggerSource)', () => {
    it('Chuyển đổi trigger_source sang tiếng Việt chuẩn', () => {
      expect(dashboardService.formatTriggerSource('schedule')).toBe('Tự động');
      expect(dashboardService.formatTriggerSource('manual')).toBe('Thủ công');
      expect(dashboardService.formatTriggerSource(null)).toBe('Không rõ');
      expect(dashboardService.formatTriggerSource(undefined)).toBe('Không rõ');
    });
  });

  describe('2. Định dạng trạng thái lần quét (formatScanStatus)', () => {
    it('Trạng thái success: Thành công / Hoạt động bình thường', () => {
      const res = dashboardService.formatScanStatus('success');
      expect(res.label).toBe('Thành công');
      expect(res.badgeText).toBe('Hoạt động bình thường');
      expect(res.tone).toBe('success');
    });

    it('Trạng thái partial: Thành công một phần / Có lỗi một phần', () => {
      const res = dashboardService.formatScanStatus('partial');
      expect(res.label).toBe('Thành công một phần');
      expect(res.badgeText).toBe('Có lỗi một phần');
      expect(res.tone).toBe('warning');
    });

    it('Trạng thái failed: Thất bại / Cần kiểm tra', () => {
      const res = dashboardService.formatScanStatus('failed');
      expect(res.label).toBe('Thất bại');
      expect(res.badgeText).toBe('Cần kiểm tra');
      expect(res.tone).toBe('danger');
    });

    it('Trạng thái running: Đang chạy / Đang quét dữ liệu', () => {
      const res = dashboardService.formatScanStatus('running');
      expect(res.label).toBe('Đang chạy');
      expect(res.badgeText).toBe('Đang quét dữ liệu');
      expect(res.tone).toBe('info');
    });

    it('Trạng thái null / không rõ', () => {
      const res = dashboardService.formatScanStatus(null);
      expect(res.badgeText).toBe('Chưa có lần quét nào');
      expect(res.tone).toBe('info');
    });
  });
});
