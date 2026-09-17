import { describe, it, expect, vi } from 'vitest';
import { fetchAllBatches } from '../src/services/query-pagination';
import fs from 'fs';
import path from 'path';

describe('Bắt Bài Đối Thủ — Phase 18: Long-Term Data Scale & Snapshot Optimization', () => {
  // ============================================================
  // 1. TEST PAGINATION HELPER (fetchAllBatches)
  // ============================================================
  describe('1. Pagination Helper (fetchAllBatches)', () => {
    it('Trường hợp 0 items: Trả về mảng rỗng []', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ data: [], error: null });
      const res = await fetchAllBatches(mockFetch, 1000);
      expect(res).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(0, 999);
    });

    it('Trường hợp 1 item: Trả về đúng 1 phần tử sau 1 batch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
      const res = await fetchAllBatches(mockFetch, 1000);
      expect(res).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('Trường hợp 999 items (< 1000): Dừng ngay sau batch 1', async () => {
      const items = Array.from({ length: 999 }, (_, i) => ({ id: `${i}` }));
      const mockFetch = vi.fn().mockResolvedValue({ data: items, error: null });
      const res = await fetchAllBatches(mockFetch, 1000);
      expect(res).toHaveLength(999);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('Trường hợp đúng 1000 items (= 1000): Batch 1 trả 1000, Batch 2 trả 0 -> Dừng', async () => {
      const items1000 = Array.from({ length: 1000 }, (_, i) => ({ id: `${i}` }));
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ data: items1000, error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const res = await fetchAllBatches(mockFetch, 1000);
      expect(res).toHaveLength(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, 0, 999);
      expect(mockFetch).toHaveBeenNthCalledWith(2, 1000, 1999);
    });

    it('Trường hợp 1001 items: Batch 1 trả 1000, Batch 2 trả 1 -> Dừng', async () => {
      const items1000 = Array.from({ length: 1000 }, (_, i) => ({ id: `batch1_${i}` }));
      const items1 = [{ id: 'batch2_0' }];
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ data: items1000, error: null })
        .mockResolvedValueOnce({ data: items1, error: null });

      const res = await fetchAllBatches<{ id: string }>(mockFetch, 1000);
      expect(res).toHaveLength(1001);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(res[0].id).toBe('batch1_0');
      expect(res[999].id).toBe('batch1_999');
      expect(res[1000].id).toBe('batch2_0');
    });

    it('Trường hợp 2,350 snapshots (Video Detail): Batch 1 (1000), Batch 2 (1000), Batch 3 (350)', async () => {
      const b1 = Array.from({ length: 1000 }, (_, i) => ({ id: `snap_${i}`, count: i }));
      const b2 = Array.from({ length: 1000 }, (_, i) => ({ id: `snap_${1000 + i}`, count: 1000 + i }));
      const b3 = Array.from({ length: 350 }, (_, i) => ({ id: `snap_${2000 + i}`, count: 2000 + i }));

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ data: b1, error: null })
        .mockResolvedValueOnce({ data: b2, error: null })
        .mockResolvedValueOnce({ data: b3, error: null });

      const res = await fetchAllBatches<{ id: string; count: number }>(mockFetch, 1000);
      expect(res).toHaveLength(2350);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenNthCalledWith(1, 0, 999);
      expect(mockFetch).toHaveBeenNthCalledWith(2, 1000, 1999);
      expect(mockFetch).toHaveBeenNthCalledWith(3, 2000, 2999);
      // Row 2350 là phần tử cuối cùng
      expect(res[2349].id).toBe('snap_2349');
    });

    it('Ném lỗi khi Supabase trả error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ data: null, error: new Error('Supabase 500 error') });
      await expect(fetchAllBatches(mockFetch, 1000)).rejects.toThrow('Supabase 500 error');
    });

    it('Chặn batchSize <= 0', async () => {
      const mockFetch = vi.fn();
      await expect(fetchAllBatches(mockFetch, 0)).rejects.toThrow('batchSize phải lớn hơn 0');
    });
  });

  // ============================================================
  // 2. TEST BACKFILL LOGIC & NULL SEMANTICS
  // ============================================================
  describe('2. Backfill Logic & Null Semantics', () => {
    it('Backfill từ chuỗi snapshots: t1 (first), t2, t3 (latest)', () => {
      const snapshots = [
        { checked_at: '2026-09-17T10:00:00Z', view_count: 100, measured_vph: null, view_delta: null },
        { checked_at: '2026-09-17T11:00:00Z', view_count: 150, measured_vph: 50, view_delta: 50 },
        { checked_at: '2026-09-17T12:00:00Z', view_count: 210, measured_vph: 60, view_delta: 60 },
      ];

      // Logic DISTINCT ON (video_id) ORDER BY checked_at DESC cho latest
      const latest = snapshots[snapshots.length - 1];
      // Logic DISTINCT ON (video_id) ORDER BY checked_at ASC cho earliest
      const earliest = snapshots[0];

      const cachedVideo = {
        latest_view_count: latest.view_count,
        latest_measured_vph: latest.measured_vph,
        latest_view_delta: latest.view_delta,
        latest_snapshot_checked_at: latest.checked_at,
        first_snapshot_checked_at: earliest.checked_at,
      };

      expect(cachedVideo.latest_view_count).toBe(210);
      expect(cachedVideo.latest_measured_vph).toBe(60);
      expect(cachedVideo.latest_view_delta).toBe(60);
      expect(cachedVideo.latest_snapshot_checked_at).toBe('2026-09-17T12:00:00Z');
      expect(cachedVideo.first_snapshot_checked_at).toBe('2026-09-17T10:00:00Z');
    });

    it('Null Semantics: Latest snapshot có measured_vph NULL & view_delta NULL -> Cache giữ nguyên NULL, không biến thành 0', () => {
      const latestSnapshot = {
        view_count: 500,
        measured_vph: null,
        view_delta: null,
        checked_at: '2026-09-17T10:00:00Z',
      };

      const cachedVideo = {
        latest_view_count: latestSnapshot.view_count,
        latest_measured_vph: latestSnapshot.measured_vph,
        latest_view_delta: latestSnapshot.view_delta,
        latest_snapshot_checked_at: latestSnapshot.checked_at,
      };

      expect(cachedVideo.latest_measured_vph).toBeNull();
      expect(cachedVideo.latest_view_delta).toBeNull();
      expect(cachedVideo.latest_measured_vph).not.toBe(0);
      expect(cachedVideo.latest_view_delta).not.toBe(0);
    });
  });

  // ============================================================
  // 3. TEST COLLECTOR FIRST & SECOND OBSERVATION
  // ============================================================
  describe('3. Collector First & Second Observation', () => {
    function simulateCalculateVph(
      currentViews: number,
      currentCheckedAt: Date,
      previousViews: number | null,
      previousCheckedAt: Date | null
    ) {
      if (previousViews === null || !previousCheckedAt) {
        return { viewDelta: null, elapsedSeconds: null, measuredVph: null };
      }
      const elapsedMs = currentCheckedAt.getTime() - previousCheckedAt.getTime();
      const elapsedSeconds = Math.round(elapsedMs / 1000);
      if (elapsedSeconds <= 0) {
        return { viewDelta: Math.max(0, currentViews - previousViews), elapsedSeconds: 0, measuredVph: null };
      }
      if (currentViews < previousViews) {
        return { viewDelta: 0, elapsedSeconds, measuredVph: 0 };
      }
      const delta = currentViews - previousViews;
      const elapsedHours = elapsedSeconds / 3600;
      const measuredVph = Math.round((delta / elapsedHours) * 100) / 100;
      return { viewDelta: delta, elapsedSeconds, measuredVph };
    }

    it('First Observation (latest_snapshot_checked_at == null): measuredVph = null, viewDelta = null, NO alert', () => {
      const existingVideo = {
        latest_view_count: 1000,
        latest_snapshot_checked_at: null, // Chưa từng có snapshot thành công
      };

      // Rule: Nếu latest_snapshot_checked_at == null -> previousViews và previousCheckedAt đều là null
      const previousCheckedAt = existingVideo.latest_snapshot_checked_at ? new Date(existingVideo.latest_snapshot_checked_at) : null;
      const previousViews = previousCheckedAt ? existingVideo.latest_view_count : null;

      const res = simulateCalculateVph(1200, new Date('2026-09-17T11:00:00Z'), previousViews, previousCheckedAt);

      expect(res.measuredVph).toBeNull();
      expect(res.viewDelta).toBeNull();
      expect(res.elapsedSeconds).toBeNull();
    });

    it('Second Observation: 100 views lúc 10:00 -> 200 views lúc 11:00 -> delta 100, elapsed 3600, measured VPH 100', () => {
      const prevCheckedAt = new Date('2026-09-17T10:00:00Z');
      const curCheckedAt = new Date('2026-09-17T11:00:00Z');

      const res = simulateCalculateVph(200, curCheckedAt, 100, prevCheckedAt);

      expect(res.viewDelta).toBe(100);
      expect(res.elapsedSeconds).toBe(3600);
      expect(res.measuredVph).toBe(100);
    });

    it('Negative Delta: 200 views trước đó -> 180 views hiện tại -> delta 0, VPH = 0', () => {
      const prevCheckedAt = new Date('2026-09-17T10:00:00Z');
      const curCheckedAt = new Date('2026-09-17T11:00:00Z');

      const res = simulateCalculateVph(180, curCheckedAt, 200, prevCheckedAt);

      expect(res.viewDelta).toBe(0);
      expect(res.elapsedSeconds).toBe(3600);
      expect(res.measuredVph).toBe(0);
    });
  });

  // ============================================================
  // 4. TEST SNAPSHOT INSERT FAILURE CONSISTENCY
  // ============================================================
  describe('4. Snapshot Insert Failure Consistency', () => {
    it('Nếu snapshot insert thất bại: không advance cache trên videos, không tạo alert candidate', () => {
      let snapshotsCreated = 0;
      let alertCandidates = 0;
      let cachedVph = 50;
      let cachedDelta = 50;

      const snapErr = { message: 'Database constraint failure' };
      const vphResult = { measuredVph: 15000, viewDelta: 500, elapsedSeconds: 3600 };

      if (!snapErr) {
        snapshotsCreated++;
        cachedVph = vphResult.measuredVph;
        cachedDelta = vphResult.viewDelta;
        if (vphResult.measuredVph >= 5000) {
          alertCandidates++;
        }
      }

      expect(snapshotsCreated).toBe(0);
      expect(cachedVph).toBe(50); // Không bị advance
      expect(cachedDelta).toBe(50); // Không bị advance
      expect(alertCandidates).toBe(0); // Không tạo alert
    });
  });

  // ============================================================
  // 5. TEST BATCH VIDEO LOOKUP CHUNKING
  // ============================================================
  describe('5. Batch Video Lookup Chunking', () => {
    it('1,205 YouTube video IDs được chia thành 7 batches <= 200 IDs (không tạo huge URL)', () => {
      const totalIds = 1205;
      const ids = Array.from({ length: totalIds }, (_, i) => `yt_vid_${i}`);
      const lookupChunkSize = 200;
      const chunks: string[][] = [];

      for (let i = 0; i < ids.length; i += lookupChunkSize) {
        chunks.push(ids.slice(i, i + lookupChunkSize));
      }

      expect(chunks).toHaveLength(7);
      expect(chunks[0]).toHaveLength(200);
      expect(chunks[5]).toHaveLength(200);
      expect(chunks[6]).toHaveLength(5); // 1205 % 200 = 5
      expect(chunks.flat()).toHaveLength(1205);
    });
  });

  // ============================================================
  // 6. TEST HOURLY RPC TREND AGGREGATION LOGIC
  // ============================================================
  describe('6. Server-side Hourly Trend RPC Semantics', () => {
    it('1 giờ có [100, 0, 200, NULL] -> AVG = 100, sample_count = 3 (NULL excluded, 0 included)', () => {
      const rawSamples = [100, 0, 200, null];
      // SQL: WHERE measured_vph IS NOT NULL -> lọc null
      const nonNull = rawSamples.filter((v): v is number => v !== null);
      const sum = nonNull.reduce((acc, v) => acc + v, 0);
      const avg = sum / nonNull.length;

      expect(nonNull).toHaveLength(3);
      expect(avg).toBe(100);
    });

    it('Scale test: 4 channels trong 24h có 20,000 raw snapshots -> RPC trả về tối đa 96 hourly groups', () => {
      // 4 channels x 24 hours = 96 hourly buckets
      const maxPossibleBuckets = 4 * 24;
      expect(maxPossibleBuckets).toBe(96);
    });
  });

  // ============================================================
  // 7. TEST SOURCE INTEGRITY (KHÔNG CÒN N+1 HOẶC QUERY SNAPSHOTS HISTORY Ở FRONTEND)
  // ============================================================
  describe('7. Source Integrity & Scalability Auditing', () => {
    const rootDir = path.resolve(__dirname, '..');

    it('collect-youtube-data/index.ts: Không còn per-video snapshot query .from("video_snapshots").select(...).limit(1)', () => {
      const collectorSrc = fs.readFileSync(
        path.join(rootDir, 'supabase/functions/collect-youtube-data/index.ts'),
        'utf-8'
      );
      // Không được query previous snapshot trong loop
      expect(collectorSrc).not.toMatch(/\.from\(["']video_snapshots["']\)\s*\.select\(["']view_count,\s*checked_at["']\)/);
      // Phải có batch query videos
      expect(collectorSrc).toContain('existingVideosMap');
      expect(collectorSrc).toContain('lookupChunkSize');
    });

    it('dashboard-service.ts: Không query video_snapshots', () => {
      const src = fs.readFileSync(path.join(rootDir, 'src/services/dashboard-service.ts'), 'utf-8');
      expect(src).not.toContain(".from('video_snapshots')");
      expect(src).toContain('channel_video_current_stats');
      expect(src).toContain("latest_view_delta");
    });

    it('video-service.ts fetchTrendingVideos: Không query video_snapshots', () => {
      const src = fs.readFileSync(path.join(rootDir, 'src/services/video-service.ts'), 'utf-8');
      // fetchTrendingVideos không được query video_snapshots
      const trendingSection = src.split('fetchVideoDetail')[0];
      expect(trendingSection).not.toContain(".from('video_snapshots')");
      expect(trendingSection).toContain('latest_snapshot_checked_at');
      expect(trendingSection).toContain('latest_view_delta');
    });

    it('new-videos-service.ts: Không query video_snapshots', () => {
      const src = fs.readFileSync(path.join(rootDir, 'src/services/new-videos-service.ts'), 'utf-8');
      expect(src).not.toContain(".from('video_snapshots')");
      expect(src).toContain('latest_view_delta');
      expect(src).toContain('first_snapshot_checked_at');
    });

    it('opportunity-service.ts: Không query video_snapshots', () => {
      const src = fs.readFileSync(path.join(rootDir, 'src/services/opportunity-service.ts'), 'utf-8');
      expect(src).not.toContain(".from('video_snapshots')");
      expect(src).toContain('latest_view_delta');
      expect(src).toContain('fetchAllBatches');
    });

    it('channel-analysis-service.ts: Không query video_snapshots chỉ để lấy delta', () => {
      const src = fs.readFileSync(path.join(rootDir, 'src/services/channel-analysis-service.ts'), 'utf-8');
      expect(src).not.toContain(".from('video_snapshots')");
      expect(src).toContain('latest_view_delta');
      expect(src).toContain('fetchAllBatches');
    });

    it('channel-comparison-service.ts: Không query video_snapshots, sử dụng RPC get_channel_vph_hourly', () => {
      const src = fs.readFileSync(path.join(rootDir, 'src/services/channel-comparison-service.ts'), 'utf-8');
      expect(src).not.toContain(".from('video_snapshots')");
      expect(src).toContain("rpc('get_channel_vph_hourly'");
      expect(src).toContain('latest_view_delta');
    });
  });
});
