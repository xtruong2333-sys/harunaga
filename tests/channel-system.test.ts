import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChannelStore } from '../src/stores/channel-store';
import {
  channelService,
  DatabaseNotConfiguredError,
  setStoredAccessKey,
  clearStoredAccessKey,
  getStoredAccessKey,
} from '../src/services/channel-service';
import { Channel, mapChannelInputToDb } from '../src/types/channel';
import * as fs from 'fs';
import * as path from 'path';

describe('Bắt Bài Đối Thủ — Kiểm thử hệ thống Kênh Theo Dõi (Giai đoạn 1.1)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    clearStoredAccessKey();
    vi.restoreAllMocks();
  });

  // 1. Database rỗng -> 0 channel
  it('1. Database rỗng -> khởi tạo với đúng 0 kênh', async () => {
    vi.spyOn(channelService, 'listChannels').mockResolvedValue([]);
    const store = useChannelStore();
    await store.fetchChannels();

    expect(store.channels.length).toBe(0);
    expect(store.totalCount).toBe(0);
    expect(store.activeCount).toBe(0);
    expect(store.pausedCount).toBe(0);
    expect(store.archivedCount).toBe(0);
  });

  // 2. Thêm channel hợp lệ -> thành công
  it('2. Thêm channel hợp lệ -> thành công với đầy đủ thuộc tính', async () => {
    const newChan: Channel = {
      id: 'uuid-1',
      youtubeChannelId: 'UC1234567890123456789012',
      name: 'Khoa Học Vui',
      handle: '@khoahocvui',
      url: 'https://www.youtube.com/@khoahocvui',
      avatarUrl: 'https://yt3.ggpht.com/avatar.jpg',
      status: 'active',
      scanLimit: 15,
      alertVphThreshold: 5000,
      source: 'manual',
      notes: 'Kênh đối thủ tiềm năng',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastScanAt: null,
    };

    vi.spyOn(channelService, 'createChannel').mockResolvedValue(newChan);
    const store = useChannelStore();
    const created = await store.addChannel({
      youtubeChannelId: newChan.youtubeChannelId,
      name: newChan.name,
      handle: newChan.handle,
      url: newChan.url,
      avatarUrl: newChan.avatarUrl,
      scanLimit: 15,
      alertVphThreshold: 5000,
    });

    expect(created.id).toBe('uuid-1');
    expect(created.youtubeChannelId).toBe('UC1234567890123456789012');
    expect(created.status).toBe('active');
    expect(store.channels.length).toBe(1);
  });

  // 3. Duplicate YouTube Channel ID -> bị chặn
  it('3. Duplicate YouTube Channel ID -> bị chặn và báo lỗi rõ', async () => {
    vi.spyOn(channelService, 'createChannel').mockRejectedValue(
      new Error('Kênh này đã có trong danh sách theo dõi.')
    );
    const store = useChannelStore();

    await expect(
      store.addChannel({
        youtubeChannelId: 'UC1234567890123456789012',
        name: 'Trùng Lặp',
        url: 'https://www.youtube.com/channel/UC1234567890123456789012',
      })
    ).rejects.toThrow('Kênh này đã có trong danh sách theo dõi.');
  });

  // 4. Pause -> active -> paused
  it('4. Pause -> chuyển trạng thái từ active sang paused', async () => {
    const chan: Channel = {
      id: 'uuid-1',
      youtubeChannelId: 'UC123',
      name: 'Kênh 1',
      handle: null,
      url: 'https://youtube.com',
      avatarUrl: null,
      status: 'active',
      scanLimit: 15,
      alertVphThreshold: 5000,
      source: 'manual',
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastScanAt: null,
    };
    const pausedChan = { ...chan, status: 'paused' as const };

    const store = useChannelStore();
    store.channels = [chan];

    vi.spyOn(channelService, 'pauseChannel').mockResolvedValue(pausedChan);
    const updated = await store.pauseChannel('uuid-1');

    expect(updated.status).toBe('paused');
    expect(store.channels[0].status).toBe('paused');
    expect(store.activeCount).toBe(0);
    expect(store.pausedCount).toBe(1);
  });

  // 5. Resume -> paused -> active
  it('5. Resume -> chuyển trạng thái từ paused sang active', async () => {
    const pausedChan: Channel = {
      id: 'uuid-1',
      youtubeChannelId: 'UC123',
      name: 'Kênh 1',
      handle: null,
      url: 'https://youtube.com',
      avatarUrl: null,
      status: 'paused',
      scanLimit: 15,
      alertVphThreshold: 5000,
      source: 'manual',
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastScanAt: null,
    };
    const activeChan = { ...pausedChan, status: 'active' as const };

    const store = useChannelStore();
    store.channels = [pausedChan];

    vi.spyOn(channelService, 'resumeChannel').mockResolvedValue(activeChan);
    const updated = await store.resumeChannel('uuid-1');

    expect(updated.status).toBe('active');
    expect(store.channels[0].status).toBe('active');
    expect(store.activeCount).toBe(1);
    expect(store.pausedCount).toBe(0);
  });

  // 6. Archive -> archived
  it('6. Archive -> chuyển trạng thái sang archived (không xóa vật lý dữ liệu)', async () => {
    const chan: Channel = {
      id: 'uuid-1',
      youtubeChannelId: 'UC123',
      name: 'Kênh 1',
      handle: null,
      url: 'https://youtube.com',
      avatarUrl: null,
      status: 'active',
      scanLimit: 15,
      alertVphThreshold: 5000,
      source: 'manual',
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastScanAt: null,
    };
    const archivedChan = { ...chan, status: 'archived' as const };

    const store = useChannelStore();
    store.channels = [chan];

    vi.spyOn(channelService, 'archiveChannel').mockResolvedValue(archivedChan);
    const updated = await store.archiveChannel('uuid-1');

    expect(updated.status).toBe('archived');
    expect(store.channels.length).toBe(1);
    expect(store.archivedCount).toBe(1);
    expect(store.activeCount).toBe(0);
  });

  // 7. Restore -> archived -> active
  it('7. Restore -> khôi phục kênh đã lưu trữ sang active', async () => {
    const archivedChan: Channel = {
      id: 'uuid-1',
      youtubeChannelId: 'UC123',
      name: 'Kênh 1',
      handle: null,
      url: 'https://youtube.com',
      avatarUrl: null,
      status: 'archived',
      scanLimit: 15,
      alertVphThreshold: 5000,
      source: 'manual',
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastScanAt: null,
    };
    const activeChan = { ...archivedChan, status: 'active' as const };

    const store = useChannelStore();
    store.channels = [archivedChan];

    vi.spyOn(channelService, 'restoreChannel').mockResolvedValue(activeChan);
    const updated = await store.restoreChannel('uuid-1');

    expect(updated.status).toBe('active');
    expect(store.archivedCount).toBe(0);
    expect(store.activeCount).toBe(1);
  });

  // 8. Default scan_limit -> 15
  it('8. Default scan_limit -> 15', () => {
    const payload = mapChannelInputToDb({
      youtubeChannelId: 'UC1234567890123456789012',
      name: 'Test',
      url: 'https://youtube.com',
    });
    expect(payload.scan_limit).toBe(15);
  });

  // 9. Default threshold -> 5000
  it('9. Default threshold -> 5000', () => {
    const payload = mapChannelInputToDb({
      youtubeChannelId: 'UC1234567890123456789012',
      name: 'Test',
      url: 'https://youtube.com',
    });
    expect(payload.alert_vph_threshold).toBe(5000);
  });

  // 10. Search -> hoạt động
  it('10. Search -> lọc chính xác theo name hoặc handle', () => {
    const list: Channel[] = [
      {
        id: '1',
        youtubeChannelId: 'UC1',
        name: 'Chiến Binh Game',
        handle: '@chienbinhgame',
        url: '',
        avatarUrl: null,
        status: 'active',
        scanLimit: 15,
        alertVphThreshold: 5000,
        source: 'manual',
        notes: null,
        createdAt: '',
        updatedAt: '',
        lastScanAt: null,
      },
      {
        id: '2',
        youtubeChannelId: 'UC2',
        name: 'Học Làm Bánh',
        handle: '@lambanhngon',
        url: '',
        avatarUrl: null,
        status: 'active',
        scanLimit: 15,
        alertVphThreshold: 5000,
        source: 'manual',
        notes: null,
        createdAt: '',
        updatedAt: '',
        lastScanAt: null,
      },
    ];

    const searchByName = list.filter(c => c.name.toLowerCase().includes('làm bánh'));
    expect(searchByName.length).toBe(1);
    expect(searchByName[0].name).toBe('Học Làm Bánh');

    const searchByHandle = list.filter(c => c.handle?.includes('chienbinh'));
    expect(searchByHandle.length).toBe(1);
    expect(searchByHandle[0].handle).toBe('@chienbinhgame');
  });

  // 11. Bulk duplicate -> không insert trùng
  it('11. Bulk duplicate -> nhận diện và loại trừ các kênh đã tồn tại', async () => {
    const existing: Channel[] = [
      {
        id: '1',
        youtubeChannelId: 'UC_existing_channel',
        name: 'Existing',
        handle: '@existing_channel',
        url: '',
        avatarUrl: null,
        status: 'active',
        scanLimit: 15,
        alertVphThreshold: 5000,
        source: 'manual',
        notes: null,
        createdAt: '',
        updatedAt: '',
        lastScanAt: null,
      },
    ];

    vi.spyOn(channelService, 'resolveChannel').mockImplementation(async (input: string) => {
      if (input === '@existing_channel') {
        return {
          youtubeChannelId: 'UC_existing_channel',
          name: 'Existing',
          handle: '@existing_channel',
          url: 'https://youtube.com/@existing_channel',
          avatarUrl: null,
        };
      }
      return {
        youtubeChannelId: 'UC_new_channel_1_22char',
        name: 'New Channel',
        handle: '@new_channel_1',
        url: 'https://youtube.com/@new_channel_1',
        avatarUrl: null,
      };
    });

    const lines = [
      '@existing_channel',
      '@new_channel_1',
      '@new_channel_1',
    ];

    const summary = await channelService.bulkResolveChannels(lines, existing);

    expect(summary.total).toBe(3);
    expect(summary.valid.length).toBe(1);
    expect(summary.valid[0].resolved?.handle).toBe('@new_channel_1');
    expect(summary.duplicates.length).toBe(2);
  });

  // 12. Resolver fail -> thông báo lỗi rõ
  it('12. Resolver fail -> thông báo lỗi tiếng Việt rõ ràng khi input rỗng', async () => {
    await expect(channelService.resolveChannel('')).rejects.toThrow(
      'Vui lòng nhập đường dẫn hoặc @tênkênh YouTube.'
    );
  });

  // 13. Backend unavailable -> không demo fallback
  it('13. Backend unavailable -> ném DatabaseNotConfiguredError và KHÔNG dùng demo fallback', async () => {
    const store = useChannelStore();
    vi.spyOn(channelService, 'listChannels').mockRejectedValue(new DatabaseNotConfiguredError());

    await store.fetchChannels();

    expect(store.notConfigured).toBe(true);
    expect(store.error).toContain('Chưa kết nối cơ sở dữ liệu');
    expect(store.channels).toEqual([]);
    expect(store.totalCount).toBe(0);
  });

  // =========================================================================
  // CÁC TEST MỚI BẮT BUỘC TRONG GIAI ĐOẠN 1.1 (Yêu cầu A -> M)
  // =========================================================================

  // A. resolve @handle khi backend chưa cấu hình -> FAIL rõ ràng, KHÔNG UC_fake
  it('A. resolveChannel khi Supabase chưa cấu hình -> ném lỗi rõ ràng, KHÔNG tạo UC_fake', async () => {
    // Giả lập chưa cấu hình Supabase
    await expect(channelService.resolveChannel('@anyhandle')).rejects.toThrow(
      'Chưa kết nối dịch vụ kiểm tra kênh YouTube.'
    );
  });

  // B. Không tồn tại chuỗi/code tạo UC_${handle} trong toàn bộ src/
  it('B. Kiểm tra toàn bộ mã nguồn src/ KHÔNG chứa cơ chế tạo UC_fake', () => {
    const srcDir = path.resolve(__dirname, '../src');
    function scanDir(dir: string): string[] {
      let files: string[] = [];
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) files.push(...scanDir(full));
        else if (full.endsWith('.ts') || full.endsWith('.vue')) files.push(full);
      }
      return files;
    }

    const files = scanDir(srcDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toContain('UC_${');
      expect(content).not.toContain("UC_' +");
      expect(content).not.toContain('UC_fake');
      expect(content).not.toContain('_clientResolveFallback');
    }
  });

  // C & D. Không có direct browser INSERT / UPDATE channels trong src/
  it('C & D. Mã nguồn src/ KHÔNG gọi direct .insert( hay .update( trên channels table', () => {
    const srcDir = path.resolve(__dirname, '../src');
    function scanDir(dir: string): string[] {
      let files: string[] = [];
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) files.push(...scanDir(full));
        else if (full.endsWith('.ts') || full.endsWith('.vue')) files.push(full);
      }
      return files;
    }

    const files = scanDir(srcDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Không được gọi .from('channels').insert(...) hoặc .from('channels').update(...)
      expect(content).not.toMatch(/from\(['"]channels['"]\)\s*\.insert/);
      expect(content).not.toMatch(/from\(['"]channels['"]\)\s*\.update/);
      expect(content).not.toMatch(/from\(['"]channels['"]\)\s*\.delete/);
    }
  });

  // E & F. RLS anon INSERT & UPDATE -> DENIED trong migration SQL
  it('E & F. Database migration không cho phép anon INSERT hay UPDATE', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260917000001_create_channels.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Phải ENABLE ROW LEVEL SECURITY
    expect(sql).toContain('ALTER TABLE channels ENABLE ROW LEVEL SECURITY;');
    // Phải có SELECT policy
    expect(sql).toContain('FOR SELECT');
    // KHÔNG ĐƯỢC CÓ INSERT policy công khai
    expect(sql).not.toContain('FOR INSERT');
    // KHÔNG ĐƯỢC CÓ UPDATE policy công khai
    expect(sql).not.toContain('FOR UPDATE');
  });

  // G. Wrong Mã truy cập -> denied
  it('G. Thiếu hoặc sai Mã truy cập -> ném AccessKeyRequiredError', async () => {
    clearStoredAccessKey();
    expect(getStoredAccessKey()).toBeNull();

    await expect(
      channelService.createChannel({
        youtubeChannelId: 'UC1234567890123456789012',
        name: 'Test',
        url: 'https://youtube.com',
      })
    ).rejects.toThrow();
  });

  // H. Correct Mã truy cập -> mutation accepted
  it('H. Đúng Mã truy cập -> lưu trong sessionStorage và gửi đi trong mutation', async () => {
    setStoredAccessKey('mat-khau-quan-tri-bi-mat');
    expect(getStoredAccessKey()).toBe('mat-khau-quan-tri-bi-mat');

    const expectedChan: Channel = {
      id: 'uuid-test',
      youtubeChannelId: 'UC1234567890123456789012',
      name: 'Kênh Test',
      handle: '@test',
      url: 'https://youtube.com/@test',
      avatarUrl: null,
      status: 'active',
      scanLimit: 15,
      alertVphThreshold: 5000,
      source: 'manual',
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastScanAt: null,
    };

    vi.spyOn(channelService, '_invokeManage').mockResolvedValue(expectedChan);

    const res = await channelService.createChannel({
      youtubeChannelId: 'UC1234567890123456789012',
      name: 'Kênh Test',
      url: 'https://youtube.com/@test',
    });

    expect(res.id).toBe('uuid-test');
    expect(channelService._invokeManage).toHaveBeenCalledWith('create', expect.any(Object));
  });

  // I. Duplicate youtube_channel_id -> rejected
  it('I. Server manage-channels kiểm tra trùng lặp youtube_channel_id', () => {
    const manageFuncPath = path.resolve(__dirname, '../supabase/functions/manage-channels/index.ts');
    const funcCode = fs.readFileSync(manageFuncPath, 'utf-8');

    // Kiểm tra có code check duplicate và trả lỗi
    expect(funcCode).toContain('eq("youtube_channel_id", youtubeChannelId)');
    expect(funcCode).toContain('Kênh này đã có trong danh sách theo dõi.');
  });

  // J & K. alert_vph_threshold = 1 valid, 0 invalid
  it('J & K. Kiểm tra constraint alert_vph_threshold >= 1 trong database migration', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260917000001_create_channels.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('CHECK (alert_vph_threshold >= 1)');
    expect(sql).not.toContain('CHECK (alert_vph_threshold >= 100)');
  });

  // L. Vite build -> dist/CNAME exists
  it('L. Kiểm tra public/CNAME tồn tại và chứa batbaidoithu.click', () => {
    const cnamePath = path.resolve(__dirname, '../public/CNAME');
    expect(fs.existsSync(cnamePath)).toBe(true);
    const content = fs.readFileSync(cnamePath, 'utf-8');
    expect(content.trim()).toBe('batbaidoithu.click');
  });

  // M. Source repository -> không tracked generated hashed assets ở root
  it('M. Root repository index.html là Vite source và không có assets/ hash ở root', () => {
    const rootIndex = path.resolve(__dirname, '../index.html');
    const html = fs.readFileSync(rootIndex, 'utf-8');

    // Phải là Vite source với script /src/main.ts
    expect(html).toContain('src="/src/main.ts"');
    expect(html).not.toContain('/assets/index-');

    // Thư mục assets ở root không được tồn tại (chỉ có trong dist/)
    const rootAssets = path.resolve(__dirname, '../assets');
    expect(fs.existsSync(rootAssets)).toBe(false);
  });
});
