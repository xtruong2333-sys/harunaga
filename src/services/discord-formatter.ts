// Discord Embed Formatter: Định dạng nội dung cảnh báo video tăng nhanh
// 100% Tiếng Việt, định dạng số hàng nghìn chuẩn Việt Nam (dấu chấm).

export interface DiscordAlertPayloadInput {
  channelName: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  publishedAt: string;
  measuredVph: number;
  currentViews: number;
  viewDelta?: number | null;
  elapsedSeconds?: number | null;
  thresholdVph: number;
}

/**
 * Định dạng số nguyên sang chuẩn Việt Nam (ngăn cách hàng nghìn bằng dấu chấm)
 * Ví dụ: 5000 -> "5.000", 78400 -> "78.400"
 */
export function formatViNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Định dạng số giây sang phút/giờ dễ đọc
 */
export function formatDurationVi(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0 giây';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = (minutes / 60).toFixed(1);
  return `${hours} giờ (${minutes} phút)`;
}

/**
 * Định dạng ngày giờ xuất bản sang Tiếng Việt
 */
export function formatDateTimeVi(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Tạo Discord Embed Object chuẩn theo quy định Giai đoạn 2C
 */
export function buildDiscordEmbed(input: DiscordAlertPayloadInput) {
  const deltaStr = input.viewDelta !== null && input.viewDelta !== undefined
    ? `+${formatViNumber(input.viewDelta)}`
    : 'Không rõ';

  const embed: any = {
    title: '🚨 Video đang tăng nhanh',
    url: input.videoUrl,
    color: 0xff3366, // Đỏ cam nổi bật cảnh báo
    fields: [
      { name: 'Kênh', value: input.channelName, inline: true },
      { name: 'VPH đo được', value: `**${formatViNumber(input.measuredVph)}** lượt xem/giờ`, inline: true },
      { name: 'Ngưỡng cảnh báo', value: `${formatViNumber(input.thresholdVph)} VPH`, inline: true },
      { name: 'Video', value: `[${input.videoTitle}](${input.videoUrl})` },
      { name: 'Lượt xem hiện tại', value: formatViNumber(input.currentViews), inline: true },
      { name: 'Tăng từ lần trước', value: deltaStr, inline: true },
      { name: 'Khoảng thời gian đo', value: formatDurationVi(input.elapsedSeconds), inline: true },
      { name: 'Xuất bản', value: formatDateTimeVi(input.publishedAt), inline: true },
    ],
    footer: {
      text: 'Bắt Bài Đối Thủ • Dữ liệu đo thực tế',
    },
    timestamp: new Date().toISOString(),
  };

  if (input.thumbnailUrl) {
    embed.thumbnail = { url: input.thumbnailUrl };
  }

  return {
    embeds: [embed],
  };
}
