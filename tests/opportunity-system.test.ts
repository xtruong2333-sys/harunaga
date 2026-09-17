import { describe, it, expect } from 'vitest';
import { opportunityService } from '../src/services/opportunity-service';
import { OpportunityVideo, OpportunityFilterState } from '../src/types/opportunity';

describe('Bắt Bài Đối Thủ — Giai Đoạn 7: Video Tiềm Năng (Opportunity System)', () => {
  const mockNow = new Date('2026-09-17T14:00:00Z');

  const createMockVideo = (
    id: string,
    title: string,
    channelId: string,
    channelName: string,
    channelHandle: string,
    publishedAt: string,
    vph: number,
    threshold: number,
    delta: number | null = null,
    alertStatus: 'pending' | 'sending' | 'sent' | 'failed' | null = null
  ): OpportunityVideo => {
    const ratio = threshold > 0 ? Math.round((vph / threshold) * 100) : 0;
    return {
      id,
      youtubeVideoId: `yt_${id}`,
      channelId,
      title,
      url: `https://youtube.com/watch?v=yt_${id}`,
      thumbnailUrl: null,
      publishedAt,
      videoAge: opportunityService.formatVideoAge(publishedAt, mockNow),
      latestViewCount: 5000,
      latestMeasuredVph: vph,
      latestDeltaViews: delta,
      channel: {
        id: channelId,
        name: channelName,
        handle: channelHandle,
        avatarUrl: null,
        alertVphThreshold: threshold,
      },
      thresholdRatio: ratio,
      isOverThreshold: threshold > 0 && vph >= threshold,
      alert: alertStatus
        ? {
            id: `alt_${id}`,
            status: alertStatus,
            measuredVph: vph,
            sentAt: alertStatus === 'sent' ? '2026-09-17T05:00:00Z' : null,
          }
        : null,
    };
  };

  // Sample data:
  // Now is 2026-09-17T14:00:00Z
  // v1: published 12 hours ago (2026-09-17T02:00:00Z), VPH: 850, threshold: 5000 (17%)
  // v2: published 2 days ago (2026-09-15T14:00:00Z), VPH: 6000, threshold: 5000 (120% - over)
  // v3: published 5 days ago (2026-09-12T14:00:00Z), VPH: 300, threshold: 1000 (30%)
  // v4: published 10 days ago (2026-09-07T14:00:00Z), VPH: 1200, threshold: 1000 (120% - over)
  // v5: published 20 days ago (2026-08-28T14:00:00Z), VPH: 50, threshold: 3000 (2%)
  // v6: published 40 days ago (2026-08-08T14:00:00Z), VPH: 200, threshold: 5000 (4%)
  // v_zero: published 1 day ago, VPH: 0 (should be excluded)
  const sampleVideos: OpportunityVideo[] = [
    createMockVideo('v1', 'Học làm thợ mộc siêu cấp', 'ch1', 'Kênh Sáng Tạo', '@sangtao', '2026-09-17T02:00:00Z', 850, 5000, 100, 'sent'),
    createMockVideo('v2', 'Sáng chế máy hàn mini', 'ch1', 'Kênh Sáng Tạo', '@sangtao', '2026-09-15T14:00:00Z', 6000, 5000, 500, 'sent'),
    createMockVideo('v3', 'Tái chế ống đồng làm pin', 'ch2', 'Thợ Sửa Chữa', '@thosuachua', '2026-09-12T14:00:00Z', 300, 1000, 50, null),
    createMockVideo('v4', 'Máy phát điện không chổi than', 'ch2', 'Thợ Sửa Chữa', '@thosuachua', '2026-09-07T14:00:00Z', 1200, 1000, 200, 'pending'),
    createMockVideo('v5', 'Mẹo dùng máy khoan cũ', 'ch3', 'Khám Phá DIY', '@diyvn', '2026-08-28T14:00:00Z', 50, 3000, 10, null),
    createMockVideo('v6', 'Bí mật lò vi sóng', 'ch3', 'Khám Phá DIY', '@diyvn', '2026-08-08T14:00:00Z', 200, 5000, 30, 'failed'),
  ];

  const defaultFilters: OpportunityFilterState = {
    timeWindow: '7d',
    channelId: 'all',
    searchQuery: '',
    quickFilter: 'all',
    sortOption: 'vph_desc',
  };

  describe('1. Định dạng tuổi video (formatVideoAge)', () => {
    it('Định dạng dưới 1 phút -> Vừa xong', () => {
      expect(opportunityService.formatVideoAge('2026-09-17T13:59:30Z', mockNow)).toBe('Vừa xong');
    });

    it('Định dạng dưới 1 giờ -> X phút', () => {
      expect(opportunityService.formatVideoAge('2026-09-17T13:18:00Z', mockNow)).toBe('42 phút');
      expect(opportunityService.formatVideoAge('2026-09-17T13:55:00Z', mockNow)).toBe('5 phút');
    });

    it('Định dạng dưới 24 giờ -> X giờ', () => {
      expect(opportunityService.formatVideoAge('2026-09-17T08:00:00Z', mockNow)).toBe('6 giờ');
      expect(opportunityService.formatVideoAge('2026-09-17T02:00:00Z', mockNow)).toBe('12 giờ');
    });

    it('Định dạng tròn ngày -> X ngày', () => {
      expect(opportunityService.formatVideoAge('2026-09-14T14:00:00Z', mockNow)).toBe('3 ngày');
      expect(opportunityService.formatVideoAge('2026-09-10T14:00:00Z', mockNow)).toBe('7 ngày');
    });

    it('Định dạng kết hợp ngày và giờ -> X ngày Y giờ', () => {
      expect(opportunityService.formatVideoAge('2026-09-16T10:00:00Z', mockNow)).toBe('1 ngày 4 giờ');
      expect(opportunityService.formatVideoAge('2026-09-15T08:00:00Z', mockNow)).toBe('2 ngày 6 giờ');
    });
  });

  describe('2. Tính toán mức ngưỡng (formatThresholdProgress)', () => {
    it('Tính đúng tỷ lệ phần trăm (25% ngưỡng cảnh báo)', () => {
      const res = opportunityService.formatThresholdProgress(1250, 5000);
      expect(res.ratio).toBe(25);
      expect(res.percentText).toBe('25% ngưỡng');
      expect(res.visualWidthPercent).toBe(25);
      expect(res.isOver).toBe(false);
    });

    it('Xử lý vượt ngưỡng (> 100%): visual bar bị giới hạn 100% nhưng text giữ nguyên', () => {
      const res = opportunityService.formatThresholdProgress(6200, 5000);
      expect(res.ratio).toBe(124);
      expect(res.percentText).toBe('124% ngưỡng');
      expect(res.visualWidthPercent).toBe(100);
      expect(res.isOver).toBe(true);
    });

    it('Xử lý ngưỡng bằng 0 hoặc không hợp lệ', () => {
      const res = opportunityService.formatThresholdProgress(100, 0);
      expect(res.ratio).toBe(0);
      expect(res.percentText).toBe('—');
      expect(res.visualWidthPercent).toBe(0);
      expect(res.isOver).toBe(false);
    });
  });

  describe('3. Bộ lọc thời gian (Time Window Filtering)', () => {
    it('Mặc định 7 ngày: Chỉ giữ video xuất bản trong 7 ngày gần nhất', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: '7d',
      }, mockNow);

      const ids = filtered.map(v => v.id);
      expect(ids).toContain('v1'); // 12h
      expect(ids).toContain('v2'); // 2d
      expect(ids).toContain('v3'); // 5d
      expect(ids).not.toContain('v4'); // 10d
      expect(ids).not.toContain('v5'); // 20d
      expect(ids).not.toContain('v6'); // 40d
      expect(filtered.length).toBe(3);
    });

    it('Bộ lọc 24 giờ: Chỉ giữ video xuất bản trong vòng 24 giờ', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: '24h',
      }, mockNow);

      expect(filtered.map(v => v.id)).toEqual(['v1']);
    });

    it('Bộ lọc 3 ngày: Giữ video xuất bản trong 3 ngày', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: '3d',
      }, mockNow);

      expect(filtered.map(v => v.id)).toEqual(['v1', 'v2']);
    });

    it('Bộ lọc 30 ngày: Giữ video xuất bản trong 30 ngày', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: '30d',
      }, mockNow);

      const ids = filtered.map(v => v.id);
      expect(ids).toContain('v1');
      expect(ids).toContain('v2');
      expect(ids).toContain('v3');
      expect(ids).toContain('v4');
      expect(ids).toContain('v5');
      expect(ids).not.toContain('v6'); // 40d
      expect(filtered.length).toBe(5);
    });

    it('Bộ lọc Tất cả: Giữ toàn bộ video có VPH > 0', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: 'all',
      }, mockNow);

      expect(filtered.length).toBe(6);
    });

    it('Tuyệt đối LOẠI BỎ video có VPH <= 0 hoặc null khỏi ứng viên tiềm năng', () => {
      const zeroVideo = createMockVideo('v_zero', 'Video 0 VPH', 'ch1', 'Kênh A', '@a', '2026-09-17T02:00:00Z', 0, 5000);
      const list = [...sampleVideos, zeroVideo];
      const filtered = opportunityService.filterOpportunityVideos(list, {
        ...defaultFilters,
        timeWindow: 'all',
      }, mockNow);

      expect(filtered.map(v => v.id)).not.toContain('v_zero');
    });
  });

  describe('4. Lọc theo kênh & Tìm kiếm', () => {
    it('Lọc chính xác theo channelId', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: 'all',
        channelId: 'ch1',
      }, mockNow);

      expect(filtered.length).toBe(2);
      expect(filtered.every(v => v.channelId === 'ch1')).toBe(true);
    });

    it('Tìm kiếm theo tiêu đề video', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: 'all',
        searchQuery: 'máy hàn',
      }, mockNow);

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('v2');
    });

    it('Tìm kiếm theo tên hoặc handle kênh', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: 'all',
        searchQuery: '@thosuachua',
      }, mockNow);

      expect(filtered.length).toBe(2);
      expect(filtered.map(v => v.id)).toEqual(['v3', 'v4']);
    });
  });

  describe('5. Quick Filter Tabs', () => {
    it('Quick filter over_threshold: Chỉ giữ video vượt ngưỡng cảnh báo riêng của kênh', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: 'all',
        quickFilter: 'over_threshold',
      }, mockNow);

      // v2: 6000 >= 5000 (over)
      // v4: 1200 >= 1000 (over - ngưỡng riêng 1000)
      expect(filtered.map(v => v.id)).toEqual(['v2', 'v4']);
    });

    it('Quick filter alerted: Chỉ giữ video đã gửi cảnh báo Discord (status = sent)', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: 'all',
        quickFilter: 'alerted',
      }, mockNow);

      expect(filtered.map(v => v.id)).toEqual(['v1', 'v2']);
    });

    it('Quick filter unalerted: Giữ video chưa từng gửi cảnh báo thành công', () => {
      const filtered = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: 'all',
        quickFilter: 'unalerted',
      }, mockNow);

      expect(filtered.map(v => v.id)).toEqual(['v3', 'v4', 'v5', 'v6']);
    });
  });

  describe('6. Sắp xếp danh sách (Sorting)', () => {
    it('Sắp xếp VPH cao nhất (vph_desc)', () => {
      const sorted = opportunityService.sortOpportunityVideos(sampleVideos, 'vph_desc');
      expect(sorted.map(v => v.id)).toEqual(['v2', 'v4', 'v1', 'v3', 'v6', 'v5']);
      expect(sorted[0].latestMeasuredVph).toBe(6000);
    });

    it('Sắp xếp Mới đăng nhất (published_desc)', () => {
      const sorted = opportunityService.sortOpportunityVideos(sampleVideos, 'published_desc');
      expect(sorted.map(v => v.id)).toEqual(['v1', 'v2', 'v3', 'v4', 'v5', 'v6']);
    });

    it('Sắp xếp Tăng lượt xem nhiều nhất (delta_desc)', () => {
      const sorted = opportunityService.sortOpportunityVideos(sampleVideos, 'delta_desc');
      expect(sorted[0].id).toBe('v2'); // delta 500
      expect(sorted[1].id).toBe('v4'); // delta 200
      expect(sorted[2].id).toBe('v1'); // delta 100
    });

    it('Sắp xếp Gần ngưỡng cảnh báo (threshold_ratio_desc)', () => {
      const sorted = opportunityService.sortOpportunityVideos(sampleVideos, 'threshold_ratio_desc');
      // v2: 120%, v4: 120%, v3: 30%, v1: 17%, v6: 4%, v5: 2%
      expect(sorted[0].thresholdRatio).toBe(120);
      expect(sorted[1].thresholdRatio).toBe(120);
      expect(sorted[2].thresholdRatio).toBe(30);
      expect(sorted[3].thresholdRatio).toBe(17);
    });
  });

  describe('7. Tính toán 4 thẻ thống kê (calculateOpportunityStats)', () => {
    it('Tính đúng thống kê trên tập video 7 ngày', () => {
      const filtered7d = opportunityService.filterOpportunityVideos(sampleVideos, {
        ...defaultFilters,
        timeWindow: '7d',
      }, mockNow);

      const stats = opportunityService.calculateOpportunityStats(filtered7d, mockNow);
      expect(stats.potentialCount).toBe(3); // v1, v2, v3
      expect(stats.new24hCount).toBe(1); // v1 (12h)
      expect(stats.maxVph).toBe(6000); // v2
      expect(stats.overThresholdCount).toBe(1); // v2
    });

    it('Tính đúng khi tập video rỗng', () => {
      const stats = opportunityService.calculateOpportunityStats([], mockNow);
      expect(stats.potentialCount).toBe(0);
      expect(stats.new24hCount).toBe(0);
      expect(stats.maxVph).toBeNull();
      expect(stats.overThresholdCount).toBe(0);
    });
  });

  describe('8. Ánh xạ trạng thái cảnh báo Discord', () => {
    it('Ánh xạ chính xác các trạng thái', () => {
      expect(opportunityService.getAlertBadge(null).label).toBe('Chưa cảnh báo');
      expect(opportunityService.getAlertBadge({ id: '1', status: 'pending', measuredVph: 100, sentAt: null }).label).toBe('Chờ gửi');
      expect(opportunityService.getAlertBadge({ id: '2', status: 'sending', measuredVph: 100, sentAt: null }).label).toBe('Đang gửi');
      expect(opportunityService.getAlertBadge({ id: '3', status: 'sent', measuredVph: 100, sentAt: '...' }).label).toBe('Đã gửi');
      expect(opportunityService.getAlertBadge({ id: '4', status: 'failed', measuredVph: 100, sentAt: null }).label).toBe('Gửi lỗi');
    });
  });
});
