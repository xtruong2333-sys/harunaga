import { describe, it, expect } from 'vitest';
import { calculateMeasuredVph } from '../src/services/vph-calculator';

describe('Bắt Bài Đối Thủ — Kiểm thử công thức VPH Đo Được (Phase 2A)', () => {
  // A. Snapshot đầu: VPH = null
  it('A. Snapshot đầu tiên: Chưa từng có snapshot -> VPH = null, delta = null, elapsed = null', () => {
    const result = calculateMeasuredVph({
      currentViews: 50000,
      currentCheckedAt: '2026-09-17T14:00:00Z',
      previousViews: null,
      previousCheckedAt: null,
    });

    expect(result.measuredVph).toBeNull();
    expect(result.viewDelta).toBeNull();
    expect(result.elapsedSeconds).toBeNull();
  });

  // B. 72000 → 78400 trong 1 giờ: VPH = 6400
  it('B. 72,000 -> 78,400 trong chính xác 1 giờ (3600s) -> VPH = 6,400', () => {
    const result = calculateMeasuredVph({
      currentViews: 78400,
      currentCheckedAt: '2026-09-17T15:00:00Z',
      previousViews: 72000,
      previousCheckedAt: '2026-09-17T14:00:00Z',
    });

    expect(result.viewDelta).toBe(6400);
    expect(result.elapsedSeconds).toBe(3600);
    expect(result.measuredVph).toBe(6400);
  });

  // C. 10000 → 11000 trong 30 phút: VPH = 2000
  it('C. 10,000 -> 11,000 trong 30 phút (1800s) -> VPH = 2,000', () => {
    const result = calculateMeasuredVph({
      currentViews: 11000,
      currentCheckedAt: '2026-09-17T14:30:00Z',
      previousViews: 10000,
      previousCheckedAt: '2026-09-17T14:00:00Z',
    });

    expect(result.viewDelta).toBe(1000);
    expect(result.elapsedSeconds).toBe(1800);
    expect(result.measuredVph).toBe(2000);
  });

  // D. 10000 → 12000 trong 2 giờ: VPH = 1000
  it('D. 10,000 -> 12,000 trong 2 giờ (7200s) -> VPH = 1,000', () => {
    const result = calculateMeasuredVph({
      currentViews: 12000,
      currentCheckedAt: '2026-09-17T16:00:00Z',
      previousViews: 10000,
      previousCheckedAt: '2026-09-17T14:00:00Z',
    });

    expect(result.viewDelta).toBe(2000);
    expect(result.elapsedSeconds).toBe(7200);
    expect(result.measuredVph).toBe(1000);
  });

  // E. Views giảm: VPH = 0, không âm
  it('E. Lượt xem giảm bất thường (80,000 -> 79,000) -> VPH = 0, delta = 0, không âm', () => {
    const result = calculateMeasuredVph({
      currentViews: 79000,
      currentCheckedAt: '2026-09-17T15:00:00Z',
      previousViews: 80000,
      previousCheckedAt: '2026-09-17T14:00:00Z',
    });

    expect(result.viewDelta).toBe(0);
    expect(result.elapsedSeconds).toBe(3600);
    expect(result.measuredVph).toBe(0);
    expect(result.warning).toBeDefined();
  });

  // F. Khoảng thời gian = 0: không chia 0, VPH = null/error safe
  it('F. Khoảng thời gian = 0 giây -> an toàn tránh chia cho 0, VPH = null', () => {
    const result = calculateMeasuredVph({
      currentViews: 15000,
      currentCheckedAt: '2026-09-17T14:00:00Z',
      previousViews: 15000,
      previousCheckedAt: '2026-09-17T14:00:00Z',
    });

    expect(result.elapsedSeconds).toBe(0);
    expect(result.measuredVph).toBeNull();
    expect(result.warning).toBeDefined();
  });

  // G. Thời gian thực tế không tròn giờ (ví dụ: 58 phút, 62 phút)
  it('G. Thời gian thực tế không tròn giờ (58 phút = 3480s) tính đúng theo giây', () => {
    const prev = new Date('2026-09-17T14:00:00Z');
    const curr = new Date(prev.getTime() + 58 * 60 * 1000); // 58 phút

    const result = calculateMeasuredVph({
      currentViews: 55800,
      currentCheckedAt: curr.toISOString(),
      previousViews: 50000,
      previousCheckedAt: prev.toISOString(),
    });

    // delta = 5800, elapsed = 3480s (58/60 h), vph = 5800 / (58/60) = 6000
    expect(result.viewDelta).toBe(5800);
    expect(result.elapsedSeconds).toBe(3480);
    expect(result.measuredVph).toBe(6000);
  });
});
