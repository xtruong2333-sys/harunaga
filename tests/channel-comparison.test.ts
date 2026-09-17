import { describe, it, expect } from 'vitest';
import {
  channelComparisonService,
  getTimeWindowThreshold,
  formatRelativeTime,
  mapAlertStatus,
  computeComparisonMetrics,
  aggregateVphTrend,
} from '../src/services/channel-comparison-service';

describe('Bắt Bài Đối Thủ — Giai Đoạn 12: So Sánh Kênh (Channel Comparison)', () => {
  describe('1. Ngưỡng thời gian lọc (getTimeWindowThreshold)', () => {
    it('all trả về null', () => {
      expect(getTimeWindowThreshold('all')).toBeNull();
    });

    it('24h trả về mốc thời gian cách hiện tại khoảng 24 giờ', () => {
      const threshold = getTimeWindowThreshold('24h');
      expect(threshold).not.toBeNull();
      const diffMs = Date.now() - new Date(threshold!).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThanOrEqual(23.9);
      expect(diffHours).toBeLessThanOrEqual(24.1);
    });

    it('3d, 7d, 30d tính đúng khoảng thời gian theo ngày', () => {
      const t3d = getTimeWindowThreshold('3d');
      const t7d = getTimeWindowThreshold('7d');
      const t30d = getTimeWindowThreshold('30d');

      expect(t3d).not.toBeNull();
      expect(t7d).not.toBeNull();
      expect(t30d).not.toBeNull();

      const diffDays3 = (Date.now() - new Date(t3d!).getTime()) / (1000 * 60 * 60 * 24);
      const diffDays7 = (Date.now() - new Date(t7d!).getTime()) / (1000 * 60 * 60 * 24);
      const diffDays30 = (Date.now() - new Date(t30d!).getTime()) / (1000 * 60 * 60 * 24);

      expect(Math.round(diffDays3)).toBe(3);
      expect(Math.round(diffDays7)).toBe(7);
      expect(Math.round(diffDays30)).toBe(30);
    });
  });

  describe('2. Tính toán chỉ số so sánh (computeComparisonMetrics)', () => {
    it('Trả về đúng chỉ số khi có đầy đủ video và snapshot delta', () => {
      const videos = [
        {
          latest_view_count: 10000,
          latest_measured_vph: 800, // đang tăng (>0)
          view_delta: 150,
        },
        {
          latest_view_count: 5000,
          latest_measured_vph: 200, // đang tăng (>0)
          view_delta: 50,
        },
        {
          latest_view_count: 3000,
          latest_measured_vph: 0, // đo được = 0 (không tăng)
          view_delta: 0,
        },
        {
          latest_view_count: 2000,
          latest_measured_vph: null, // chưa đo VPH
          view_delta: null,
        },
      ];

      const metrics = computeComparisonMetrics(videos);

      expect(metrics.videoCount).toBe(4);
      expect(metrics.risingVideoCount).toBe(2);
      expect(metrics.maxVph).toBe(800);
      expect(metrics.trackedViews).toBe(20000); // 10000 + 5000 + 3000 + 2000
      expect(metrics.latestViewDelta).toBe(200); // 150 + 50 + 0

      // avgMeasuredVph: (800 + 200 + 0) / 3 = 333 (loại trừ NULL, bao gồm 0)
      expect(metrics.avgMeasuredVph).toBe(333);

      // risingVideoRatio: 2 rising / 3 measured * 100 = 66.7% (loại trừ NULL khỏi mẫu số)
      expect(metrics.risingVideoRatio).toBe(66.7);
    });

    it('Khi không có video nào đo được VPH (toàn bộ NULL), tỷ lệ và TB trả về null', () => {
      const videos = [
        {
          latest_view_count: 1000,
          latest_measured_vph: null,
          view_delta: null,
        },
      ];

      const metrics = computeComparisonMetrics(videos);

      expect(metrics.videoCount).toBe(1);
      expect(metrics.risingVideoCount).toBe(0);
      expect(metrics.risingVideoRatio).toBeNull();
      expect(metrics.avgMeasuredVph).toBeNull();
      expect(metrics.maxVph).toBeNull();
      expect(metrics.latestViewDelta).toBeNull();
    });

    it('Khi danh sách video hoàn toàn rỗng, mọi chỉ số đo lường đều là null hoặc 0', () => {
      const metrics = computeComparisonMetrics([]);

      expect(metrics.videoCount).toBe(0);
      expect(metrics.risingVideoCount).toBe(0);
      expect(metrics.risingVideoRatio).toBeNull();
      expect(metrics.avgMeasuredVph).toBeNull();
      expect(metrics.maxVph).toBeNull();
      expect(metrics.trackedViews).toBe(0);
      expect(metrics.latestViewDelta).toBeNull();
    });
  });

  describe('3. Tổng hợp biểu đồ xu hướng 24h (aggregateVphTrend)', () => {
    it('Nhóm snapshot theo giờ và tính trung bình VPH trong giờ đó', () => {
      const now = Date.now();
      const oneHourAgo = new Date(now - 1 * 60 * 60 * 1000).toISOString();
      const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

      const snapshots = [
        {
          measured_vph: 400,
          checked_at: twoHoursAgo,
        },
        {
          measured_vph: 600,
          checked_at: twoHoursAgo,
        },
        {
          measured_vph: 500,
          checked_at: oneHourAgo,
        },
        // snapshot null -> bị loại khỏi avg
        {
          measured_vph: null,
          checked_at: oneHourAgo,
        },
      ];

      const trendPoints = aggregateVphTrend(snapshots, now);

      expect(trendPoints.length).toBe(2);

      // Điểm 2 giờ trước: (400 + 600) / 2 = 500, sampleCount = 2
      expect(trendPoints[0].avgVph).toBe(500);
      expect(trendPoints[0].sampleCount).toBe(2);

      // Điểm 1 giờ trước: 500, sampleCount = 1
      expect(trendPoints[1].avgVph).toBe(500);
      expect(trendPoints[1].sampleCount).toBe(1);
    });

    it('Loại bỏ hoàn toàn các snapshot cũ hơn 24 giờ', () => {
      const now = Date.now();
      const thirtyHoursAgo = new Date(now - 30 * 60 * 60 * 1000).toISOString();

      const snapshots = [
        {
          measured_vph: 999,
          checked_at: thirtyHoursAgo,
        },
      ];

      const trendPoints = aggregateVphTrend(snapshots, now);
      expect(trendPoints.length).toBe(0);
    });

    it('Không tự ý bịa thêm giờ (no fake interpolation) khi thiếu dữ liệu', () => {
      const trendPoints = aggregateVphTrend([], Date.now());
      expect(trendPoints.length).toBe(0);
    });
  });

  describe('4. Định dạng thời gian và nhãn (formatRelativeTime & mapAlertStatus)', () => {
    it('Định dạng tiếng Việt tương đối chính xác', () => {
      const now = new Date();
      expect(formatRelativeTime(now.toISOString())).toBe('Vừa xong');

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 phút trước');

      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeHoursAgo)).toBe('3 giờ trước');

      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fourDaysAgo)).toBe('4 ngày trước');
    });

    it('Chuyển đổi trạng thái cảnh báo sang tiếng Việt chuẩn', () => {
      expect(mapAlertStatus('sent')).toEqual({ alertStatus: 'sent', label: 'Đã gửi' });
      expect(mapAlertStatus('sending')).toEqual({ alertStatus: 'sending', label: 'Đang gửi' });
      expect(mapAlertStatus('pending')).toEqual({ alertStatus: 'pending', label: 'Chờ gửi' });
      expect(mapAlertStatus('failed')).toEqual({ alertStatus: 'failed', label: 'Gửi lỗi' });
      expect(mapAlertStatus(null)).toEqual({ alertStatus: 'no_alert', label: 'Chưa cảnh báo' });
    });
  });

  describe('5. Ràng buộc an toàn và READ-ONLY', () => {
    it('Service channelComparisonService chỉ có các phương thức đọc dữ liệu', () => {
      expect(typeof channelComparisonService.fetchComparableChannels).toBe('function');
      expect(typeof channelComparisonService.fetchChannelComparison).toBe('function');

      // Tuyệt đối không có các hàm ghi/xóa/sửa
      expect((channelComparisonService as any).createComparison).toBeUndefined();
      expect((channelComparisonService as any).saveComparison).toBeUndefined();
      expect((channelComparisonService as any).deleteComparison).toBeUndefined();
      expect((channelComparisonService as any).triggerScan).toBeUndefined();
    });
  });
});
