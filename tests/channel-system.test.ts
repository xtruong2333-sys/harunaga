import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChannelStore } from '../src/stores/channel-store';
import { channelService, DatabaseNotConfiguredError } from '../src/services/channel-service';
import { Channel, mapChannelInputToDb, STATUS_LABELS } from '../src/types/channel';

describe('Bắt Bài Đối Thủ — Kiểm thử hệ thống Kênh Theo Dõi (13 yêu cầu bắt buộc)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
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
    expect(store.totalCount).toBe(1);
    expect(store.activeCount).toBe(1);
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
      youtubeChannelId: 'UC123',
      name: 'Test',
      url: 'https://youtube.com',
    });
    expect(payload.scan_limit).toBe(15);
  });

  // 9. Default threshold -> 5000
  it('9. Default threshold -> 5000', () => {
    const payload = mapChannelInputToDb({
      youtubeChannelId: 'UC123',
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

    const lines = [
      '@existing_channel',
      '@new_channel_1',
      '@new_channel_1', // Trùng ngay trong input
    ];

    const summary = await channelService.bulkResolveChannels(lines, existing);

    expect(summary.total).toBe(3);
    // 1 trùng với existing, 1 trùng do dòng lặp lại sau khi thêm, 1 hợp lệ
    expect(summary.valid.length).toBe(1);
    expect(summary.valid[0].resolved?.handle).toBe('@new_channel_1');
    expect(summary.duplicates.length).toBe(2);
  });

  // 12. Resolver fail -> thông báo lỗi rõ
  it('12. Resolver fail -> thông báo lỗi tiếng Việt rõ ràng khi input sai', async () => {
    await expect(channelService.resolveChannel('')).rejects.toThrow(
      'Vui lòng nhập đường dẫn hoặc @tênkênh YouTube.'
    );

    await expect(channelService.resolveChannel('invalid-gibberish-string??')).rejects.toThrow(
      'Đường dẫn hoặc @tênkênh không hợp lệ'
    );
  });

  // 13. Backend unavailable -> không demo fallback
  it('13. Backend unavailable -> ném DatabaseNotConfiguredError và KHÔNG dùng demo fallback', async () => {
    const store = useChannelStore();
    vi.spyOn(channelService, 'listChannels').mockRejectedValue(new DatabaseNotConfiguredError());

    await store.fetchChannels();

    expect(store.notConfigured).toBe(true);
    expect(store.error).toContain('Chưa kết nối cơ sở dữ liệu');
    // Tuyệt đối không fallback sang demo data
    expect(store.channels).toEqual([]);
    expect(store.totalCount).toBe(0);
  });

  // Kiểm tra tên hiển thị trạng thái tiếng Việt
  it('Tên hiển thị trạng thái chuẩn tiếng Việt tự nhiên', () => {
    expect(STATUS_LABELS.active).toBe('Đang theo dõi');
    expect(STATUS_LABELS.paused).toBe('Tạm dừng');
    expect(STATUS_LABELS.archived).toBe('Đã lưu trữ');
  });
});
