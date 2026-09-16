// VPH Calculator: Bộ tính toán Tốc độ tăng lượt xem mỗi giờ (VPH đo được)
// Áp dụng CÔNG THỨC KHÓA (Strict Measured VPH) — Tuyệt đối không dùng lifetime hay estimated VPH.

export interface VphCalculationInput {
  currentViews: number;
  currentCheckedAt: Date | string;
  previousViews?: number | null;
  previousCheckedAt?: Date | string | null;
}

export interface VphCalculationResult {
  viewDelta: number | null;
  elapsedSeconds: number | null;
  measuredVph: number | null;
  warning?: string;
}

/**
 * Tính toán Measured VPH dựa trên 2 mốc snapshot thực tế.
 */
export function calculateMeasuredVph(input: VphCalculationInput): VphCalculationResult {
  const { currentViews, currentCheckedAt, previousViews, previousCheckedAt } = input;

  // 1. Snapshot đầu tiên: Chưa có snapshot trước đó -> VPH = null, viewDelta = null, elapsedSeconds = null
  if (previousViews === undefined || previousViews === null || !previousCheckedAt) {
    return {
      viewDelta: null,
      elapsedSeconds: null,
      measuredVph: null,
    };
  }

  const currentDate = new Date(currentCheckedAt);
  const prevDate = new Date(previousCheckedAt);

  // Tính số giây trôi qua thực tế giữa 2 mốc
  const elapsedMs = currentDate.getTime() - prevDate.getTime();
  const elapsedSeconds = Math.round(elapsedMs / 1000);

  // An toàn khi thời gian không hợp lệ hoặc bằng 0 (tránh chia cho 0)
  if (elapsedSeconds <= 0) {
    return {
      viewDelta: Math.max(0, currentViews - previousViews),
      elapsedSeconds: Math.max(0, elapsedSeconds),
      measuredVph: null,
      warning: 'Khoảng thời gian giữa 2 mốc kiểm tra nhỏ hơn hoặc bằng 0 giây.',
    };
  }

  // 2. Lượt xem giảm bất thường (YouTube audit views, lọc bot view)
  if (currentViews < previousViews) {
    return {
      viewDelta: 0,
      elapsedSeconds,
      measuredVph: 0,
      warning: `Lượt xem giảm bất thường (${previousViews} -> ${currentViews}). Gán delta = 0, VPH = 0.`,
    };
  }

  // 3. Snapshot thứ 2 trở đi với view bình thường hoặc tăng
  const delta = currentViews - previousViews;
  const elapsedHours = elapsedSeconds / 3600;
  const rawVph = delta / elapsedHours;

  // Làm tròn 2 chữ số thập phân, hoặc số nguyên nếu chẵn
  const measuredVph = Math.round(rawVph * 100) / 100;

  return {
    viewDelta: delta,
    elapsedSeconds,
    measuredVph,
  };
}
