import { describe, it, expect } from 'vitest';
import { videoService } from '../src/services/video-service';
import { VideoListItem } from '../src/types/video';

const mockVideos: VideoListItem[] = [
  {
    id: 'vid-1',
    youtubeVideoId: 'yt-1',
    channelId: 'chan-a',
    title: 'Review iPhone 16 Pro Max sau 1 tháng',
    url: 'https://www.youtube.com/watch?v=yt-1',
    thumbnailUrl: 'https://i.ytimg.com/vi/yt-1/hqdefault.jpg',
    publishedAt: '2026-09-17T02:00:00Z',
    latestViewCount: 50000,
    latestMeasuredVph: 1500,
    latestDeltaViews: 1500,
    isOverThreshold: true,
    channel: {
      id: 'chan-a',
      name: 'Vật Vờ Studio',
      handle: '@vatvostudio',
      avatarUrl: null,
      alertVphThreshold: 1000,
    },
    alert: {
      id: 'alert-1',
      status: 'sent',
      measuredVph: 1500,
      sentAt: '2026-09-17T03:00:00Z',
    },
  },
  {
    id: 'vid-2',
    youtubeVideoId: 'yt-2',
    channelId: 'chan-b',
    title: 'Mở hộp Galaxy S25 Ultra chính hãng',
    url: 'https://www.youtube.com/watch?v=yt-2',
    thumbnailUrl: 'https://i.ytimg.com/vi/yt-2/hqdefault.jpg',
    publishedAt: '2026-09-16T12:00:00Z',
    latestViewCount: 120000,
    latestMeasuredVph: 3500,
    latestDeltaViews: 2800,
    isOverThreshold: false,
    channel: {
      id: 'chan-b',
      name: 'Duy Thẩm',
      handle: '@duytham',
      avatarUrl: null,
      alertVphThreshold: 5000,
    },
    alert: null,
  },
  {
    id: 'vid-3',
    youtubeVideoId: 'yt-3',
    channelId: 'chan-a',
    title: 'Top 5 laptop sinh viên giá rẻ 2026',
    url: 'https://www.youtube.com/watch?v=yt-3',
    thumbnailUrl: 'https://i.ytimg.com/vi/yt-3/hqdefault.jpg',
    publishedAt: '2026-09-15T08:00:00Z',
    latestViewCount: 8000,
    latestMeasuredVph: 0,
    latestDeltaViews: 0,
    isOverThreshold: false,
    channel: {
      id: 'chan-a',
      name: 'Vật Vờ Studio',
      handle: '@vatvostudio',
      avatarUrl: null,
      alertVphThreshold: 1000,
    },
    alert: null,
  },
  {
    id: 'vid-4',
    youtubeVideoId: 'yt-4',
    channelId: 'chan-c',
    title: 'Video mới kiểm tra lần đầu chưa có snapshot thứ hai',
    url: 'https://www.youtube.com/watch?v=yt-4',
    thumbnailUrl: 'https://i.ytimg.com/vi/yt-4/hqdefault.jpg',
    publishedAt: '2026-09-17T03:00:00Z',
    latestViewCount: 2500,
    latestMeasuredVph: null,
    latestDeltaViews: null,
    isOverThreshold: false,
    channel: {
      id: 'chan-c',
      name: 'GenZ Công Nghệ',
      handle: '@genztech',
      avatarUrl: null,
      alertVphThreshold: 2000,
    },
    alert: {
      id: 'alert-4',
      status: 'pending',
      measuredVph: null,
      sentAt: null,
    },
  },
];

describe('Bắt Bài Đối Thủ — Giai Đoạn 3: Video Đang Tăng', () => {
  describe('1. Sắp xếp (Sorting)', () => {
    it('Sắp xếp theo VPH cao nhất (vph_desc): Video có VPH cao đứng đầu, null ở cuối cùng', () => {
      const sorted = videoService.sortVideos(mockVideos, 'vph_desc');
      expect(sorted[0].id).toBe('vid-2'); // 3500 VPH
      expect(sorted[1].id).toBe('vid-1'); // 1500 VPH
      expect(sorted[2].id).toBe('vid-3'); // 0 VPH
      expect(sorted[3].id).toBe('vid-4'); // null VPH
    });

    it('Sắp xếp theo Lượt xem cao nhất (views_desc)', () => {
      const sorted = videoService.sortVideos(mockVideos, 'views_desc');
      expect(sorted[0].id).toBe('vid-2'); // 120,000 views
      expect(sorted[1].id).toBe('vid-1'); // 50,000 views
      expect(sorted[2].id).toBe('vid-3'); // 8,000 views
      expect(sorted[3].id).toBe('vid-4'); // 2,500 views
    });

    it('Sắp xếp theo Mới đăng nhất (published_desc)', () => {
      const sorted = videoService.sortVideos(mockVideos, 'published_desc');
      expect(sorted[0].id).toBe('vid-4'); // 2026-09-17T03:00:00Z
      expect(sorted[1].id).toBe('vid-1'); // 2026-09-17T02:00:00Z
      expect(sorted[2].id).toBe('vid-2'); // 2026-09-16T12:00:00Z
      expect(sorted[3].id).toBe('vid-3'); // 2026-09-15T08:00:00Z
    });

    it('Sắp xếp theo Tăng nhiều nhất (delta_desc)', () => {
      const sorted = videoService.sortVideos(mockVideos, 'delta_desc');
      expect(sorted[0].id).toBe('vid-2'); // +2800 delta
      expect(sorted[1].id).toBe('vid-1'); // +1500 delta
      expect(sorted[2].id).toBe('vid-3'); // 0 delta
      expect(sorted[3].id).toBe('vid-4'); // null delta
    });
  });

  describe('2. Lọc danh sách (Filtering)', () => {
    it('Lọc theo tab: rising (chỉ video có VPH > 0)', () => {
      const filtered = videoService.filterVideos(mockVideos, 'rising', 'all', '');
      expect(filtered.length).toBe(2);
      expect(filtered.map(v => v.id)).toEqual(['vid-1', 'vid-2']);
    });

    it('Lọc theo tab: alerted (chỉ video đã gửi cảnh báo sent)', () => {
      const filtered = videoService.filterVideos(mockVideos, 'alerted', 'all', '');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('vid-1');
    });

    it('Lọc theo tab: unalerted (chưa gửi cảnh báo hoặc chưa sent)', () => {
      const filtered = videoService.filterVideos(mockVideos, 'unalerted', 'all', '');
      expect(filtered.length).toBe(3);
      expect(filtered.map(v => v.id)).toEqual(['vid-2', 'vid-3', 'vid-4']);
    });

    it('Lọc theo kênh cụ thể', () => {
      const filtered = videoService.filterVideos(mockVideos, 'all', 'chan-a', '');
      expect(filtered.length).toBe(2);
      expect(filtered.every(v => v.channelId === 'chan-a')).toBe(true);
    });

    it('Tìm kiếm từ khóa theo tiêu đề video', () => {
      const filtered = videoService.filterVideos(mockVideos, 'all', 'all', 'Galaxy');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('vid-2');
    });

    it('Tìm kiếm từ khóa theo tên kênh hoặc handle', () => {
      const filtered = videoService.filterVideos(mockVideos, 'all', 'all', 'vatvostudio');
      expect(filtered.length).toBe(2);
      expect(filtered.map(v => v.id)).toEqual(['vid-1', 'vid-3']);
    });
  });

  describe('3. Tính toán số liệu thống kê (Stats Summary)', () => {
    it('Tính đúng tổng số video, số video đang tăng, max VPH, số video đã cảnh báo', () => {
      const stats = videoService.calculateStats(mockVideos);
      expect(stats.totalVideos).toBe(4);
      expect(stats.risingVideos).toBe(2); // vid-1 (1500) và vid-2 (3500)
      expect(stats.maxVph).toBe(3500);
      expect(stats.alertedVideos).toBe(1); // vid-1 (status = sent)
    });
  });

  describe('4. Định dạng hiển thị (Formatting & Display)', () => {
    it('formatViews: Định dạng số nguyên có dấu phân cách vi-VN', () => {
      expect(videoService.formatViews(1200000)).toMatch(/1[.,]200[.,]000/);
      expect(videoService.formatViews(0)).toBe('0');
    });

    it('formatVph: VPH = null -> "Chưa đủ dữ liệu", 0 -> "0 VPH", > 0 -> "{vph} VPH"', () => {
      expect(videoService.formatVph(null)).toBe('Chưa đủ dữ liệu');
      expect(videoService.formatVph(0)).toBe('0 VPH');
      expect(videoService.formatVph(1429.55)).toMatch(/1[.,]430 VPH/);
    });

    it('formatViewDelta: null -> "—", 0 -> "0 lượt xem", > 0 -> "+{x} lượt xem"', () => {
      expect(videoService.formatViewDelta(null)).toBe('—');
      expect(videoService.formatViewDelta(0)).toBe('0 lượt xem');
      expect(videoService.formatViewDelta(1500)).toMatch(/\+1[.,]500 lượt xem/);
    });

    it('getAlertBadge: Trả về nhãn tiếng Việt và tone màu chuẩn xác', () => {
      expect(videoService.getAlertBadge(null)).toEqual({ label: 'Chưa cảnh báo', tone: 'muted' });
      expect(videoService.getAlertBadge({ id: '1', status: 'pending', measuredVph: null, sentAt: null })).toEqual({
        label: 'Chờ gửi',
        tone: 'warning',
      });
      expect(videoService.getAlertBadge({ id: '2', status: 'sent', measuredVph: 1000, sentAt: null })).toEqual({
        label: 'Đã gửi',
        tone: 'success',
      });
      expect(videoService.getAlertBadge({ id: '3', status: 'failed', measuredVph: 1000, sentAt: null })).toEqual({
        label: 'Gửi lỗi',
        tone: 'danger',
      });
    });
  });
});
