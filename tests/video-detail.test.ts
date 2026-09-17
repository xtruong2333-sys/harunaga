import { describe, it, expect } from 'vitest';
import { videoService } from '../src/services/video-service';

describe('Bắt Bài Đối Thủ — Giai Đoạn 4: Chi Tiết Video (Video Detail)', () => {
  describe('1. Định dạng khoảng thời gian trôi qua (formatElapsedSeconds)', () => {
    it('Xử lý giá trị null, undefined hoặc số âm', () => {
      expect(videoService.formatElapsedSeconds(null)).toBe('—');
      expect(videoService.formatElapsedSeconds(undefined)).toBe('—');
      expect(videoService.formatElapsedSeconds(-10)).toBe('—');
    });

    it('Định dạng dưới 60 giây (giây)', () => {
      expect(videoService.formatElapsedSeconds(0)).toBe('0 giây');
      expect(videoService.formatElapsedSeconds(45)).toBe('45 giây');
      expect(videoService.formatElapsedSeconds(59)).toBe('59 giây');
    });

    it('Định dạng dưới 1 giờ (phút)', () => {
      expect(videoService.formatElapsedSeconds(60)).toBe('1 phút');
      expect(videoService.formatElapsedSeconds(120)).toBe('2 phút');
      expect(videoService.formatElapsedSeconds(1680)).toBe('28 phút');
      expect(videoService.formatElapsedSeconds(3540)).toBe('59 phút');
    });

    it('Định dạng chẵn giờ (giờ)', () => {
      expect(videoService.formatElapsedSeconds(3600)).toBe('1 giờ');
      expect(videoService.formatElapsedSeconds(7200)).toBe('2 giờ');
      expect(videoService.formatElapsedSeconds(86400)).toBe('24 giờ');
    });

    it('Định dạng kết hợp giờ và phút (giờ phút)', () => {
      expect(videoService.formatElapsedSeconds(3960)).toBe('1 giờ 6 phút');
      expect(videoService.formatElapsedSeconds(4020)).toBe('1 giờ 7 phút');
      expect(videoService.formatElapsedSeconds(7800)).toBe('2 giờ 10 phút');
    });
  });

  describe('2. Trạng thái cảnh báo Discord (getAlertBadge)', () => {
    it('Xử lý alert null -> Chưa cảnh báo', () => {
      const badge = videoService.getAlertBadge(null);
      expect(badge.label).toBe('Chưa cảnh báo');
      expect(badge.tone).toBe('muted');
    });

    it('Xử lý status pending -> Chờ gửi', () => {
      const badge = videoService.getAlertBadge({
        id: 'alt-1',
        status: 'pending',
        measuredVph: 1500,
        sentAt: null,
        lastError: null,
      });
      expect(badge.label).toBe('Chờ gửi');
      expect(badge.tone).toBe('warning');
    });

    it('Xử lý status sending -> Đang gửi', () => {
      const badge = videoService.getAlertBadge({
        id: 'alt-2',
        status: 'sending',
        measuredVph: 1500,
        sentAt: null,
        lastError: null,
      });
      expect(badge.label).toBe('Đang gửi');
      expect(badge.tone).toBe('warning');
    });

    it('Xử lý status sent -> Đã gửi', () => {
      const badge = videoService.getAlertBadge({
        id: 'alt-3',
        status: 'sent',
        measuredVph: 1500,
        sentAt: '2026-09-17T03:00:00Z',
        lastError: null,
      });
      expect(badge.label).toBe('Đã gửi');
      expect(badge.tone).toBe('success');
    });

    it('Xử lý status failed -> Gửi lỗi', () => {
      const badge = videoService.getAlertBadge({
        id: 'alt-4',
        status: 'failed',
        measuredVph: 1500,
        sentAt: null,
        lastError: 'Webhook rate limit',
      });
      expect(badge.label).toBe('Gửi lỗi');
      expect(badge.tone).toBe('danger');
    });
  });
});
