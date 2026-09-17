import { describe, it, expect } from 'vitest';
import { channelAnalysisService } from '../src/services/channel-analysis-service';
import { ChannelVideoItem } from '../src/types/channel-analysis';

describe('Bắt Bài Đối Thủ — Giai Đoạn 6: Phân Tích Kênh (Channel Analysis)', () => {
  describe('1. Tính toán VPH trung bình (calculateAverageVph)', () => {
    it('Trả về null khi mảng rỗng', () => {
      expect(channelAnalysisService.calculateAverageVph([])).toBeNull();
    });

    it('Trả về null khi toàn bộ giá trị là null', () => {
      expect(channelAnalysisService.calculateAverageVph([null, null, null])).toBeNull();
    });

    it('Trả về null khi toàn bộ giá trị là 0 (không có video đang tăng)', () => {
      expect(channelAnalysisService.calculateAverageVph([0, 0, 0])).toBeNull();
    });

    it('Trả về null khi kết hợp cả null và 0', () => {
      expect(channelAnalysisService.calculateAverageVph([null, 0, null, 0])).toBeNull();
    });

    it('Tuyệt đối LOẠI BỎ null và 0 khỏi tử số và mẫu số khi tính trung bình', () => {
      // 4 video: [100, 200, 0, null] -> chỉ tính trên [100, 200], mẫu số = 2 => TB = 150
      // Nếu tính sai (chia cho 4): (100+200)/4 = 75 (SAI)
      const vphs = [100, 200, 0, null];
      expect(channelAnalysisService.calculateAverageVph(vphs)).toBe(150);
    });

    it('Tính đúng trung bình và làm tròn số nguyên', () => {
      const vphs = [500, null, 1500, 0, 1000];
      // Hợp lệ: 500, 1500, 1000 => Tổng 3000 / 3 = 1000
      expect(channelAnalysisService.calculateAverageVph(vphs)).toBe(1000);

      const vphsRound = [100, 105];
      // (100 + 105) / 2 = 102.5 => làm tròn 103
      expect(channelAnalysisService.calculateAverageVph(vphsRound)).toBe(103);
    });
  });

  describe('2. Phân bố trạng thái VPH (Distribution Count)', () => {
    it('Phân loại chính xác các trạng thái: Chưa đủ dữ liệu, Không tăng, Đang tăng, Vượt ngưỡng', () => {
      const threshold = 1000;
      const sampleVideos: Partial<ChannelVideoItem>[] = [
        { id: '1', latestMeasuredVph: null, isOverThreshold: false },
        { id: '2', latestMeasuredVph: null, isOverThreshold: false },
        { id: '3', latestMeasuredVph: 0, isOverThreshold: false },
        { id: '4', latestMeasuredVph: 500, isOverThreshold: false },
        { id: '5', latestMeasuredVph: 1200, isOverThreshold: true },
        { id: '6', latestMeasuredVph: 2500, isOverThreshold: true },
      ];

      let nullCount = 0;
      let zeroCount = 0;
      let risingCount = 0;
      let overThresholdCount = 0;
      let maxVph: number | null = null;
      let sumRisingVph = 0;

      for (const v of sampleVideos) {
        const vph = v.latestMeasuredVph ?? null;
        if (vph === null) {
          nullCount++;
        } else if (vph === 0) {
          zeroCount++;
        } else if (vph > 0) {
          risingCount++;
          sumRisingVph += vph;
          if (maxVph === null || vph > maxVph) {
            maxVph = vph;
          }
          if (vph >= threshold) {
            overThresholdCount++;
          }
        }
      }

      expect(nullCount).toBe(2);
      expect(zeroCount).toBe(1);
      expect(risingCount).toBe(3);
      expect(overThresholdCount).toBe(2);
      expect(maxVph).toBe(2500);
      expect(Math.round(sumRisingVph / risingCount)).toBe(1400); // (500 + 1200 + 2500) / 3 = 1400
    });
  });

  describe('3. Sắp xếp danh sách video của kênh', () => {
    const mockVideos: ChannelVideoItem[] = [
      {
        id: 'v1',
        youtubeVideoId: 'yt1',
        title: 'Video A',
        url: 'https://youtube.com/watch?v=yt1',
        thumbnailUrl: null,
        publishedAt: '2026-09-10T10:00:00Z',
        latestViewCount: 500,
        latestMeasuredVph: 50,
        latestDeltaViews: 50,
        isOverThreshold: false,
        alertStatus: null,
      },
      {
        id: 'v2',
        youtubeVideoId: 'yt2',
        title: 'Video B',
        url: 'https://youtube.com/watch?v=yt2',
        thumbnailUrl: null,
        publishedAt: '2026-09-15T10:00:00Z',
        latestViewCount: 5000,
        latestMeasuredVph: 1500,
        latestDeltaViews: 1500,
        isOverThreshold: true,
        alertStatus: 'sent',
      },
      {
        id: 'v3',
        youtubeVideoId: 'yt3',
        title: 'Video C',
        url: 'https://youtube.com/watch?v=yt3',
        thumbnailUrl: null,
        publishedAt: '2026-09-01T10:00:00Z',
        latestViewCount: 200,
        latestMeasuredVph: null,
        latestDeltaViews: null,
        isOverThreshold: false,
        alertStatus: null,
      },
      {
        id: 'v4',
        youtubeVideoId: 'yt4',
        title: 'Video D',
        url: 'https://youtube.com/watch?v=yt4',
        thumbnailUrl: null,
        publishedAt: '2026-09-16T12:00:00Z',
        latestViewCount: 1000,
        latestMeasuredVph: 300,
        latestDeltaViews: 300,
        isOverThreshold: false,
        alertStatus: null,
      },
    ];

    it('Sắp xếp video tăng nhanh nhất: VPH DESC, NULLs ở cuối', () => {
      const sorted = [...mockVideos].sort((a, b) => {
        if (a.latestMeasuredVph === null && b.latestMeasuredVph === null) return 0;
        if (a.latestMeasuredVph === null) return 1;
        if (b.latestMeasuredVph === null) return -1;
        return b.latestMeasuredVph - a.latestMeasuredVph;
      });

      expect(sorted[0].id).toBe('v2'); // VPH: 1500
      expect(sorted[1].id).toBe('v4'); // VPH: 300
      expect(sorted[2].id).toBe('v1'); // VPH: 50
      expect(sorted[3].id).toBe('v3'); // VPH: null
    });

    it('Sắp xếp video mới nhất: publishedAt DESC', () => {
      const sorted = [...mockVideos].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      expect(sorted[0].id).toBe('v4'); // 2026-09-16
      expect(sorted[1].id).toBe('v2'); // 2026-09-15
      expect(sorted[2].id).toBe('v1'); // 2026-09-10
      expect(sorted[3].id).toBe('v3'); // 2026-09-01
    });
  });
});
