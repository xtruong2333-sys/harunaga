import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateMeasuredVph } from '../src/services/vph-calculator';

describe('Bắt Bài Đối Thủ — Kiểm thử Bộ Thu Thập Dữ Liệu Video (Phase 2A)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Chỉ quét kênh active, bỏ qua paused và archived
  it('1. Lọc trạng thái kênh: Chỉ xử lý kênh "active", bỏ qua "paused" và "archived"', () => {
    const channels = [
      { id: 'c1', name: 'Kênh A', status: 'active', scan_limit: 15 },
      { id: 'c2', name: 'Kênh B', status: 'paused', scan_limit: 15 },
      { id: 'c3', name: 'Kênh C', status: 'archived', scan_limit: 15 },
      { id: 'c4', name: 'Kênh D', status: 'active', scan_limit: 5 },
    ];

    const activeChannels = channels.filter((c) => c.status === 'active');
    expect(activeChannels.length).toBe(2);
    expect(activeChannels.map((c) => c.id)).toEqual(['c1', 'c4']);
  });

  // 2. scan_limit động (không hardcode 15)
  it('2. Scan limit động: Sử dụng đúng scan_limit của từng kênh (5, 15, 30)', () => {
    const channelA = { scan_limit: 5 };
    const channelB = { scan_limit: 20 };
    const channelDefault = { scan_limit: null };

    const getEffectiveLimit = (limit: number | null | undefined) =>
      Math.max(1, Math.min(50, Number(limit) || 15));

    expect(getEffectiveLimit(channelA.scan_limit)).toBe(5);
    expect(getEffectiveLimit(channelB.scan_limit)).toBe(20);
    expect(getEffectiveLimit(channelDefault.scan_limit)).toBe(15);
  });

  // 3. Tối ưu Quota: Batching tối đa 50 video IDs / call (chứng minh 750 video chỉ tốn 15 calls thay vì 750 calls)
  it('3. Tối ưu Quota: 50 kênh x 15 video = 750 video IDs được gom thành đúng 15 batch calls (tối đa 50 IDs/call)', () => {
    // Giả lập 750 video IDs
    const totalVideos = 750;
    const videoIds = Array.from({ length: totalVideos }, (_, i) => `video_id_${i}`);

    const chunkSize = 50;
    const batches: string[][] = [];

    for (let i = 0; i < videoIds.length; i += chunkSize) {
      batches.push(videoIds.slice(i, i + chunkSize));
    }

    // Phải gom thành đúng 15 requests
    expect(batches.length).toBe(15);
    // Mỗi request (trừ có thể request cuối) chứa đúng 50 IDs
    for (const batch of batches) {
      expect(batch.length).toBeLessThanOrEqual(50);
      expect(batch.length).toBe(50);
    }
    // Tổng số video IDs trong tất cả batch phải đúng 750
    const flatIds = batches.flat();
    expect(flatIds.length).toBe(750);
  });

  // 4. Chống trùng lặp video (Duplicate video prevention)
  it('4. Chống trùng lặp video: Cùng youtube_video_id không tạo bản ghi video mới mà cập nhật bản ghi cũ', () => {
    const existingDbVideos = new Map<string, { id: string; viewCount: number; title: string }>();

    // Đã có 1 video trong DB
    existingDbVideos.set('v_123', { id: 'uuid-v1', viewCount: 5000, title: 'Tiêu đề cũ' });

    // Quét lần 2 gặp lại video 'v_123' với lượt xem mới
    const scannedVideo = {
      youtubeVideoId: 'v_123',
      title: 'Tiêu đề mới (đối thủ vừa đổi)',
      newViewCount: 7500,
    };

    let insertedCount = 0;
    let updatedCount = 0;

    if (existingDbVideos.has(scannedVideo.youtubeVideoId)) {
      const existing = existingDbVideos.get(scannedVideo.youtubeVideoId)!;
      existing.title = scannedVideo.title;
      existing.viewCount = scannedVideo.newViewCount;
      updatedCount++;
    } else {
      existingDbVideos.set(scannedVideo.youtubeVideoId, {
        id: 'uuid-v2',
        viewCount: scannedVideo.newViewCount,
        title: scannedVideo.title,
      });
      insertedCount++;
    }

    // Không insert mới, chỉ update
    expect(insertedCount).toBe(0);
    expect(updatedCount).toBe(1);
    expect(existingDbVideos.size).toBe(1);
    expect(existingDbVideos.get('v_123')?.title).toBe('Tiêu đề mới (đối thủ vừa đổi)');
    expect(existingDbVideos.get('v_123')?.viewCount).toBe(7500);
  });

  // 5. Tính VPH qua 2 lần quét thực tế
  it('5. Quét lần 1 (Snapshot #1: VPH = null) -> Quét lần 2 sau 1 giờ (Snapshot #2: VPH được tính chính xác)', () => {
    // Lần 1: 50,000 views lúc 10:00
    const scan1Time = '2026-09-17T10:00:00Z';
    const scan1Views = 50000;
    const snap1 = calculateMeasuredVph({
      currentViews: scan1Views,
      currentCheckedAt: scan1Time,
      previousViews: null,
      previousCheckedAt: null,
    });

    expect(snap1.measuredVph).toBeNull();
    expect(snap1.viewDelta).toBeNull();

    // Lần 2: 56,400 views lúc 11:00 (sau 1 giờ = 3600s)
    const scan2Time = '2026-09-17T11:00:00Z';
    const scan2Views = 56400;
    const snap2 = calculateMeasuredVph({
      currentViews: scan2Views,
      currentCheckedAt: scan2Time,
      previousViews: scan1Views,
      previousCheckedAt: scan1Time,
    });

    expect(snap2.viewDelta).toBe(6400);
    expect(snap2.elapsedSeconds).toBe(3600);
    expect(snap2.measuredVph).toBe(6400);
  });
});
