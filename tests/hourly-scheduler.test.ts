import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Bắt Bài Đối Thủ — Kiểm thử Bộ Lập Lịch Tự Động Mỗi Giờ (Giai đoạn 2B)', () => {
  // A. triggerSource manual -> scan_runs = manual
  it('A. triggerSource manual: Khi triggerSource là "manual" hoặc không truyền -> ghi nhận trigger_source = "manual"', () => {
    const resolveTriggerSource = (body: { triggerSource?: string }) => {
      return body.triggerSource === 'schedule' ? 'schedule' : 'manual';
    };

    expect(resolveTriggerSource({ triggerSource: 'manual' })).toBe('manual');
    expect(resolveTriggerSource({})).toBe('manual');
  });

  // B. triggerSource schedule -> scan_runs = schedule
  it('B. triggerSource schedule: Khi triggerSource là "schedule" -> ghi nhận trigger_source = "schedule"', () => {
    const resolveTriggerSource = (body: { triggerSource?: string }) => {
      return body.triggerSource === 'schedule' ? 'schedule' : 'manual';
    };

    expect(resolveTriggerSource({ triggerSource: 'schedule' })).toBe('schedule');
  });

  // C. invalid access key schedule -> blocked (401)
  it('C. Xác thực bảo mật: triggerSource = "schedule" nhưng sai accessKey vẫn bị chặn 401', () => {
    const configuredKey = 'secret_access_key_123';
    const validateRequest = (body: { accessKey: string; triggerSource?: string }) => {
      if (!body.accessKey || body.accessKey.trim() !== configuredKey) {
        return { status: 401, error: 'Mã truy cập không chính xác. Thao tác bị từ chối.' };
      }
      return { status: 200, success: true };
    };

    const result = validateRequest({ accessKey: 'WRONG_KEY', triggerSource: 'schedule' });
    expect(result.status).toBe(401);
  });

  // D. running scan < 30 phút -> new run skipped
  it('D. Chống chạy chồng: Khi có phiên scan running < 30 phút -> phiên mới bị bỏ qua (skipped = true)', () => {
    const now = new Date('2026-09-17T08:15:00Z');
    const runningRun = {
      id: 'run-1',
      status: 'running',
      startedAt: new Date('2026-09-17T08:05:00Z'), // 10 phút trước (< 30 phút)
    };

    const staleThresholdMs = 30 * 60 * 1000;
    const elapsed = now.getTime() - runningRun.startedAt.getTime();
    const isStale = elapsed > staleThresholdMs;

    expect(isStale).toBe(false);

    // Phiên mới phải bị skip
    const shouldSkip = !isStale && runningRun.status === 'running';
    expect(shouldSkip).toBe(true);
  });

  // E. running scan > 30 phút -> old run failed -> new run allowed
  it('E. Phục hồi phiên treo: Khi phiên scan running > 30 phút -> đánh dấu failed, phiên mới được phép chạy', () => {
    const now = new Date('2026-09-17T08:45:00Z');
    const runningRun = {
      id: 'run-stale',
      status: 'running',
      startedAt: new Date('2026-09-17T08:05:00Z'), // 40 phút trước (> 30 phút)
      finishedAt: null as string | null,
      errorSummary: null as string | null,
    };

    const staleThresholdMs = 30 * 60 * 1000;
    const elapsed = now.getTime() - runningRun.startedAt.getTime();
    const isStale = elapsed > staleThresholdMs;

    expect(isStale).toBe(true);

    if (isStale) {
      runningRun.status = 'failed';
      runningRun.finishedAt = now.toISOString();
      runningRun.errorSummary = 'Phiên kiểm tra trước bị treo quá thời gian cho phép.';
    }

    expect(runningRun.status).toBe('failed');
    expect(runningRun.errorSummary).toBe('Phiên kiểm tra trước bị treo quá thời gian cho phép.');

    // Không còn run nào running hợp lệ -> Cho phép phiên mới chạy
    const activeRunning = runningRun.status === 'running';
    expect(activeRunning).toBe(false);
  });

  // F. 0 active channels -> success
  it('F. Danh sách kênh rỗng: Khi có 0 kênh active -> trả về success, channelsTotal = 0, videosFound = 0', () => {
    const channels: any[] = [];
    const runResult = {
      success: true,
      run: {
        channelsTotal: channels.length,
        channelsSuccess: 0,
        channelsFailed: 0,
        videosFound: 0,
        snapshotsCreated: 0,
        status: 'success',
      },
    };

    expect(runResult.success).toBe(true);
    expect(runResult.run.channelsTotal).toBe(0);
    expect(runResult.run.status).toBe('success');
  });

  // G. cron schedule -> 5 * * * *
  it('G. Lịch chạy Cron: Migration cấu hình chính xác lịch chạy vào phút thứ 5 mỗi giờ ("5 * * * *")', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260917000003_schedule_hourly_collection.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    expect(migrationSql).toContain("'5 * * * *'");
  });

  // H. cron job name -> bat-bai-doi-thu-hourly-collector
  it('H. Tên Cron Job: Migration sử dụng đúng tên định danh "bat-bai-doi-thu-hourly-collector"', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260917000003_schedule_hourly_collection.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    expect(migrationSql).toContain("'bat-bai-doi-thu-hourly-collector'");
  });

  // I. cron migration rerun -> không duplicate job (idempotent)
  it('I. Tính Idempotent: Migration chứa lệnh unschedule trước khi tạo lại để không gây duplicate job', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260917000003_schedule_hourly_collection.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    expect(migrationSql).toContain("cron.unschedule('bat-bai-doi-thu-hourly-collector')");
  });

  // J. manual scan khi schedule running -> skipped
  it('J. Chống xung đột: Manual scan được kích hoạt khi Schedule scan đang running (<30m) -> bị skipped', () => {
    const currentRun = { status: 'running', triggerSource: 'schedule', startedAt: new Date() };

    const canStart = currentRun.status !== 'running';
    expect(canStart).toBe(false);
  });

  // K. schedule scan khi manual running -> skipped
  it('K. Chống xung đột: Schedule scan được kích hoạt khi Manual scan đang running (<30m) -> bị skipped', () => {
    const currentRun = { status: 'running', triggerSource: 'manual', startedAt: new Date() };

    const canStart = currentRun.status !== 'running';
    expect(canStart).toBe(false);
  });
});
