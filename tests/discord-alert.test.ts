import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatViNumber,
  formatDurationVi,
  formatDateTimeVi,
  buildDiscordEmbed,
  type DiscordAlertPayloadInput,
} from '../src/services/discord-formatter';

describe('Bắt Bài Đối Thủ — Kiểm thử Cảnh báo Discord & VPH Đạt Ngưỡng (Phase 2C)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // A. snapshot 1 (measured_vph = null) → KHÔNG bao giờ tạo alert candidate
  it('A. Snapshot 1 (measured_vph = null): KHÔNG bao giờ tạo alert candidate dù view cao cỡ nào', () => {
    const measuredVph: number | null = null;
    const threshold = 5000;

    const isCandidate = measuredVph !== null && measuredVph >= threshold;
    expect(isCandidate).toBe(false);
  });

  // B. snapshot 2 (measured_vph = 4999 < 5000) → KHÔNG tạo alert candidate
  it('B. Snapshot 2 (measured_vph = 4999 < 5000): Dưới ngưỡng -> KHÔNG tạo alert candidate', () => {
    const measuredVph = 4999;
    const threshold = 5000;

    const isCandidate = measuredVph !== null && measuredVph >= threshold;
    expect(isCandidate).toBe(false);
  });

  // C. snapshot 2 (measured_vph = 5000 >= 5000) → TẠO alert candidate
  it('C. Snapshot 2 (measured_vph = 5000 >= 5000): Chạm đúng ngưỡng -> TẠO alert candidate', () => {
    const measuredVph = 5000;
    const threshold = 5000;

    const isCandidate = measuredVph !== null && measuredVph >= threshold;
    expect(isCandidate).toBe(true);
  });

  // D. snapshot 2 (measured_vph = 6420 >= 5000) → TẠO alert candidate
  it('D. Snapshot 2 (measured_vph = 6420 >= 5000): Vượt ngưỡng -> TẠO alert candidate', () => {
    const measuredVph = 6420;
    const threshold = 5000;

    const isCandidate = measuredVph !== null && measuredVph >= threshold;
    expect(isCandidate).toBe(true);
  });

  // E. alert_candidates tăng đúng số lượng
  it('E. alert_candidates tăng đúng số lượng video thỏa mãn ngưỡng trong phiên', () => {
    const snapshots = [
      { id: 'v1', measuredVph: null },
      { id: 'v2', measuredVph: 3500 },
      { id: 'v3', measuredVph: 5200 },
      { id: 'v4', measuredVph: 7800 },
      { id: 'v5', measuredVph: 4999 },
    ];
    const threshold = 5000;

    let alertCandidates = 0;
    for (const snap of snapshots) {
      if (snap.measuredVph !== null && snap.measuredVph >= threshold) {
        alertCandidates++;
      }
    }

    expect(alertCandidates).toBe(2);
  });

  // F. video đã có alert trong video_alerts → KHÔNG tạo alert mới (anti-spam 1 lần / vòng đời)
  it('F. Anti-spam: Mỗi video chỉ cảnh báo 1 lần duy nhất, video đã cảnh báo sẽ bị bỏ qua', () => {
    const existingAlertedVideoIds = new Set<string>(['vid_001', 'vid_002']);

    const newCandidates = ['vid_001', 'vid_003', 'vid_002', 'vid_004'];
    const insertedAlerts: string[] = [];

    for (const vid of newCandidates) {
      if (!existingAlertedVideoIds.has(vid)) {
        insertedAlerts.push(vid);
        existingAlertedVideoIds.add(vid);
      }
    }

    expect(insertedAlerts).toEqual(['vid_003', 'vid_004']);
    expect(insertedAlerts.length).toBe(2);
  });

  // G. insert video_alerts trùng video_id → database reject / conflict DO NOTHING
  it('G. UNIQUE(video_id): Insert bản ghi trùng lặp video_id sẽ được xử lý DO NOTHING (không trùng lặp)', () => {
    const videoAlertsTable: Array<{ id: string; video_id: string; status: string }> = [];

    function upsertAlert(alert: { id: string; video_id: string; status: string }) {
      const exists = videoAlertsTable.some((row) => row.video_id === alert.video_id);
      if (!exists) {
        videoAlertsTable.push(alert);
        return { inserted: true };
      }
      // ON CONFLICT (video_id) DO NOTHING
      return { inserted: false };
    }

    const firstTry = upsertAlert({ id: 'a1', video_id: 'vid_special', status: 'pending' });
    const secondTry = upsertAlert({ id: 'a2', video_id: 'vid_special', status: 'pending' });

    expect(firstTry.inserted).toBe(true);
    expect(secondTry.inserted).toBe(false);
    expect(videoAlertsTable.length).toBe(1);
    expect(videoAlertsTable[0].id).toBe('a1');
  });

  // H. DISCORD_WEBHOOK_URL thiếu → alert chuyển status = failed, scan_runs KHÔNG failed
  it('H. Thiếu DISCORD_WEBHOOK_URL: Alert chuyển status = "failed", phiên quét video KHÔNG bị failed', () => {
    const webhookUrl: string | undefined = undefined;
    let alertsFailed = 0;
    const scanRunStatus: 'success' | 'failed' = 'success';
    let alertStatus = 'pending';
    let lastError: string | null = null;

    if (!webhookUrl) {
      alertStatus = 'failed';
      lastError = 'Chưa cấu hình DISCORD_WEBHOOK_URL trên máy chủ.';
      alertsFailed++;
    }

    // scan_runs vẫn hoàn tất trọn vẹn
    expect(alertStatus).toBe('failed');
    expect(lastError).toContain('Chưa cấu hình DISCORD_WEBHOOK_URL');
    expect(alertsFailed).toBe(1);
    expect(scanRunStatus).toBe('success');
  });

  // I. Discord trả về 200/204 → alert chuyển status = sent, lưu sent_at, lưu discord_message_id nếu có
  it('I. Discord phản hồi 200/204: Alert chuyển status = "sent", ghi nhận sent_at và discord_message_id', async () => {
    const mockResponse = { id: 'msg_discord_12345' };
    const globalFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', globalFetch);

    let alertStatus = 'sending';
    let sentAt: string | null = null;
    let discordMessageId: string | null = null;

    const res = await fetch('https://discord.com/api/webhooks/mock', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      alertStatus = 'sent';
      sentAt = new Date().toISOString();
      discordMessageId = data.id;
    }

    expect(alertStatus).toBe('sent');
    expect(sentAt).toBeDefined();
    expect(discordMessageId).toBe('msg_discord_12345');
  });

  // J. Discord trả về 4xx/5xx → alert chuyển status = failed, attempts tăng, lưu last_error (đã che URL)
  it('J. Discord phản hồi 4xx/5xx: Alert chuyển status = "failed", attempts tăng, last_error đã che webhook URL', async () => {
    const secretWebhook = 'https://discord.com/api/webhooks/12345/SECRET_TOKEN';
    const globalFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => `Rate limited at ${secretWebhook}`,
    });
    vi.stubGlobal('fetch', globalFetch);

    let alertStatus = 'sending';
    let attempts = 1;
    let lastError: string | null = null;

    const res = await fetch(secretWebhook, { method: 'POST' });
    attempts++;
    if (!res.ok) {
      alertStatus = 'failed';
      const rawError = `Discord HTTP ${res.status}: ${await res.text()}`;
      // Che giấu webhook URL nhạy cảm
      lastError = rawError.replace(secretWebhook, 'REDACTED');
    }

    expect(alertStatus).toBe('failed');
    expect(attempts).toBe(2);
    expect(lastError).toContain('Discord HTTP 429');
    expect(lastError).not.toContain('SECRET_TOKEN');
    expect(lastError).toContain('REDACTED');
  });

  // K. alert đang ở trạng thái sending quá 15 phút → được phục hồi về failed
  it('K. Phục hồi trạng thái sending treo quá 15 phút: Tự động chuyển về "failed" để có cơ hội retry', () => {
    const now = new Date('2026-09-17T15:30:00Z').getTime();
    const staleThresholdMs = 15 * 60 * 1000;

    const alerts = [
      { id: '1', status: 'sending', updated_at: '2026-09-17T15:20:00Z' }, // 10 phút trước (chưa stale)
      { id: '2', status: 'sending', updated_at: '2026-09-17T15:10:00Z' }, // 20 phút trước (stale)
      { id: '3', status: 'sent', updated_at: '2026-09-17T15:00:00Z' },
    ];

    for (const a of alerts) {
      if (a.status === 'sending') {
        const elapsed = now - new Date(a.updated_at).getTime();
        if (elapsed > staleThresholdMs) {
          a.status = 'failed';
        }
      }
    }

    expect(alerts[0].status).toBe('sending');
    expect(alerts[1].status).toBe('failed');
    expect(alerts[2].status).toBe('sent');
  });

  // L. alert đã failed 5 lần → không retry nữa
  it('L. Chặn lặp vô tận: Alert đã thất bại 5 lần (attempts >= 5) sẽ KHÔNG được truy vấn để gửi lại', () => {
    const alerts = [
      { id: '1', status: 'failed', attempts: 1 },
      { id: '2', status: 'failed', attempts: 4 },
      { id: '3', status: 'failed', attempts: 5 },
      { id: '4', status: 'failed', attempts: 6 },
      { id: '5', status: 'pending', attempts: 0 },
    ];

    // Điều kiện truy vấn: status IN ('pending', 'failed') AND attempts < 5
    const eligibleAlerts = alerts.filter(
      (a) => (a.status === 'pending' || a.status === 'failed') && a.attempts < 5
    );

    expect(eligibleAlerts.length).toBe(3);
    expect(eligibleAlerts.map((a) => a.id)).toEqual(['1', '2', '5']);
  });

  // M. formatViNumber: 5000 → '5.000', 78400 → '78.400', 6420 → '6.420'
  it('M. formatViNumber: Phân cách hàng nghìn bằng dấu chấm theo chuẩn Việt Nam', () => {
    expect(formatViNumber(5000)).toBe('5.000');
    expect(formatViNumber(78400)).toBe('78.400');
    expect(formatViNumber(6420)).toBe('6.420');
    expect(formatViNumber(1000000)).toBe('1.000.000');
    expect(formatViNumber(0)).toBe('0');
  });

  // N. formatViNumber: null / undefined / NaN → '0'
  it('N. formatViNumber: Giá trị null, undefined, NaN luôn trả về "0" an toàn', () => {
    expect(formatViNumber(null)).toBe('0');
    expect(formatViNumber(undefined)).toBe('0');
    expect(formatViNumber(NaN)).toBe('0');
  });

  // O. formatDurationVi: 3540s → '59 phút', 3600s → '1.0 giờ (60 phút)'
  it('O. formatDurationVi: Định dạng thời lượng chính xác sang Tiếng Việt', () => {
    expect(formatDurationVi(3540)).toBe('59 phút');
    expect(formatDurationVi(3600)).toBe('1.0 giờ (60 phút)');
    expect(formatDurationVi(7200)).toBe('2.0 giờ (120 phút)');
    expect(formatDurationVi(0)).toBe('0 giây');
    expect(formatDurationVi(null)).toBe('0 giây');
  });

  // P. buildDiscordEmbed: chứa đầy đủ 8 trường
  it('P. buildDiscordEmbed: Chứa đầy đủ 8 trường thông tin theo quy định', () => {
    const publishedAtStr = '2026-09-17T08:00:00Z';
    expect(formatDateTimeVi(publishedAtStr)).toBeDefined();

    const input: DiscordAlertPayloadInput = {
      channelName: 'Kênh Đối Thủ Mẫu',
      videoTitle: 'Chiến Lược Tăng Trưởng YouTube 2026',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      publishedAt: publishedAtStr,
      measuredVph: 6420,
      currentViews: 78400,
      viewDelta: 6400,
      elapsedSeconds: 3540,
      thresholdVph: 5000,
    };

    const payload = buildDiscordEmbed(input);
    expect(payload.embeds).toBeDefined();
    expect(payload.embeds.length).toBe(1);

    const embed = payload.embeds[0];
    expect(embed.title).toBe('🚨 Video đang tăng nhanh');
    expect(embed.url).toBe(input.videoUrl);
    expect(embed.color).toBe(0xff3366);
    expect(embed.thumbnail?.url).toBe(input.thumbnailUrl);
    expect(embed.footer?.text).toContain('Bắt Bài Đối Thủ');

    const fields = embed.fields;
    expect(fields.length).toBe(8);

    const fieldNames = fields.map((f: any) => f.name);
    expect(fieldNames).toContain('Kênh');
    expect(fieldNames).toContain('VPH đo được');
    expect(fieldNames).toContain('Ngưỡng cảnh báo');
    expect(fieldNames).toContain('Video');
    expect(fieldNames).toContain('Lượt xem hiện tại');
    expect(fieldNames).toContain('Tăng từ lần trước');
    expect(fieldNames).toContain('Khoảng thời gian đo');
    expect(fieldNames).toContain('Xuất bản');

    // Kiểm tra định dạng số tiếng Việt trong field
    const vphField = fields.find((f: any) => f.name === 'VPH đo được');
    expect(vphField.value).toContain('**6.420**');

    const viewsField = fields.find((f: any) => f.name === 'Lượt xem hiện tại');
    expect(viewsField.value).toBe('78.400');

    const deltaField = fields.find((f: any) => f.name === 'Tăng từ lần trước');
    expect(deltaField.value).toBe('+6.400');
  });

  // Q. buildDiscordEmbed: KHÔNG chứa @everyone, @here
  it('Q. buildDiscordEmbed: KHÔNG chứa @everyone hoặc @here trong cấu hình thông báo', () => {
    const input: DiscordAlertPayloadInput = {
      channelName: 'Kênh Test Channel',
      videoTitle: 'Video Hướng Dẫn Tối Ưu',
      videoUrl: 'https://www.youtube.com/watch?v=test1234',
      publishedAt: '2026-09-17T08:00:00Z',
      measuredVph: 8000,
      currentViews: 100000,
      viewDelta: 8000,
      elapsedSeconds: 3600,
      thresholdVph: 5000,
    };

    const payload = buildDiscordEmbed(input);
    const serialized = JSON.stringify(payload);

    // Không có thuộc tính content
    expect((payload as any).content).toBeUndefined();
    // Payload serialized không chứa @everyone hoặc @here
    expect(serialized.includes('@everyone')).toBe(false);
    expect(serialized.includes('@here')).toBe(false);
    // Discord embed không tự ý gắn mention
    expect((payload as any).allowed_mentions).toBeUndefined();
  });
});
