// src/services/query-pagination.ts
// Helper phân trang an toàn cho các truy vấn Supabase vượt giới hạn 1.000 dòng mặc định.
// TUYỆT ĐỐI KHÔNG TỰ CẮT DỮ LIỆU. PHÂN TRANG TUẦN TỰ ĐẦY ĐỦ.

/**
 * Tải toàn bộ dữ liệu theo từng trang batch tuần tự từ Supabase
 *
 * @param fetchPage Hàm gọi Supabase với range(from, to) inclusive
 * @param batchSize Số dòng mỗi trang (mặc định 1.000)
 * @returns Mảng kết quả tổng hợp của toàn bộ các trang
 */
export async function fetchAllBatches<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  batchSize: number = 1000
): Promise<T[]> {
  if (batchSize <= 0) {
    throw new Error('batchSize phải lớn hơn 0');
  }

  const allItems: T[] = [];
  let from = 0;
  const maxBatches = 10000; // Bảo vệ chống vòng lặp vô hạn
  let batchCount = 0;

  while (batchCount < maxBatches) {
    const to = from + batchSize - 1;
    const { data, error } = await fetchPage(from, to);

    if (error) {
      throw error;
    }

    const rows = data || [];
    allItems.push(...rows);

    // Nếu số dòng nhận được ít hơn batchSize, tức là đã đến trang cuối cùng
    if (rows.length < batchSize) {
      break;
    }

    from += batchSize;
    batchCount++;
  }

  return allItems;
}
