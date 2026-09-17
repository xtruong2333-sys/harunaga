import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AddChannelModal from '../src/features/channels/components/AddChannelModal.vue';
import BulkAddChannelsModal from '../src/features/channels/components/BulkAddChannelsModal.vue';
import AccessKeyPromptModal from '../src/components/ui/AccessKeyPromptModal.vue';
import { channelService, clearStoredAccessKey, setStoredAccessKey, getStoredAccessKey } from '../src/services/channel-service';
import { Channel } from '../src/types/channel';

describe('Bắt Bài Đối Thủ — Luồng Mã Truy Cập Khi Thêm Kênh (Fix Flow)', () => {
  const mockChannel: Channel = {
    id: 'chan-001',
    youtubeChannelId: 'UC_test_123',
    name: 'Kênh Test Đối Thủ',
    handle: '@kenhtest',
    url: 'https://youtube.com/@kenhtest',
    avatarUrl: 'https://example.com/avatar.jpg',
    status: 'active',
    scanLimit: 15,
    alertVphThreshold: 5000,
    source: 'manual',
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastScanAt: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    clearStoredAccessKey();
    document.body.innerHTML = '';
  });

  // A. Không có access key -> bấm thêm kênh -> phát event access-key-required
  it('A. Không có access key -> bấm Thêm Vào Danh Sách -> phát event access-key-required để mở modal', async () => {
    const wrapper = mount(AddChannelModal, {
      props: {
        modelValue: true,
        existingChannels: [],
      },
    });

    // Giả lập kênh đã được resolve thành công
    (wrapper.vm as any).resolvedPreview = {
      youtubeChannelId: 'UC_test_123',
      name: 'Kênh Test Đối Thủ',
      handle: '@kenhtest',
      url: 'https://youtube.com/@kenhtest',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    await wrapper.vm.$nextTick();

    // Bấm nút thêm kênh
    await expect((wrapper.vm as any).handleAdd()).rejects.toThrow();

    // Kiểm tra event access-key-required đã được emit
    const emitted = wrapper.emitted('access-key-required');
    expect(emitted).toBeDefined();
    expect(emitted!.length).toBe(1);
    expect(typeof emitted![0][0]).toBe('function'); // retry callback
  });

  // B. Nhập đúng mã -> tự động thêm kênh thành công
  it('B. Sau khi nhập đúng mã -> retry callback tự động thêm kênh thành công', async () => {
    const wrapper = mount(AddChannelModal, {
      props: {
        modelValue: true,
        existingChannels: [],
      },
    });

    (wrapper.vm as any).resolvedPreview = {
      youtubeChannelId: 'UC_test_123',
      name: 'Kênh Test Đối Thủ',
      handle: '@kenhtest',
      url: 'https://youtube.com/@kenhtest',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    await wrapper.vm.$nextTick();

    // Lần 1: Không có key -> fail và lấy retry callback
    let retryCallback: (() => Promise<any>) | null = null;
    try {
      await (wrapper.vm as any).handleAdd();
    } catch {
      const emitted = wrapper.emitted('access-key-required');
      retryCallback = emitted![0][0] as () => Promise<any>;
    }

    expect(retryCallback).not.toBeNull();

    // Mock API thành công khi nhập đúng key
    setStoredAccessKey('correct_access_key');
    vi.spyOn(channelService, 'createChannel').mockResolvedValue(mockChannel);

    // Chạy lại retryCallback
    const result = await retryCallback!();
    expect(result).toEqual(mockChannel);
    expect(wrapper.emitted('added')).toBeDefined();
    expect(wrapper.emitted('added')![0][0]).toEqual(mockChannel);
  });

  // C. Nhập sai mã -> AccessKeyPromptModal hiển thị lỗi
  it('C. Nhập sai mã -> AccessKeyPromptModal cập nhật và hiển thị lỗi để nhập lại', async () => {
    const wrapper = mount(AccessKeyPromptModal, {
      props: {
        modelValue: true,
        initialError: 'Mã truy cập không chính xác. Thao tác bị từ chối.',
      },
    });

    await wrapper.vm.$nextTick();

    // Modal hiển thị lỗi ngay khi mở
    expect(document.body.textContent).toContain('Mã truy cập không chính xác');

    // Nhập mã mới
    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
    input.value = 'another_wrong_key';
    input.dispatchEvent(new Event('input'));
    await wrapper.vm.$nextTick();

    // Xác nhận
    const confirmBtn = document.querySelector('.access-key-form + * .btn-primary') as HTMLButtonElement || document.querySelector('button.btn-primary') as HTMLButtonElement;
    confirmBtn.click();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('confirmed')).toBeDefined();
    expect(wrapper.emitted('confirmed')![0][0]).toBe('another_wrong_key');

    // Cập nhật initialError mới nếu backend vẫn báo sai
    await wrapper.setProps({
      initialError: 'Mã truy cập không chính xác lần 2.',
    });
    await wrapper.vm.$nextTick();
    expect(document.body.textContent).toContain('Mã truy cập không chính xác lần 2.');
  });

  // D. Sau mã đúng -> kênh được thêm vào danh sách và modal đóng
  it('D. Sau khi mã đúng -> AddChannelModal emit added và đóng modal', async () => {
    const wrapper = mount(AddChannelModal, {
      props: {
        modelValue: true,
        existingChannels: [],
      },
    });

    (wrapper.vm as any).resolvedPreview = {
      youtubeChannelId: 'UC_test_123',
      name: 'Kênh Test Đối Thủ',
      handle: '@kenhtest',
      url: 'https://youtube.com/@kenhtest',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    setStoredAccessKey('valid_key');
    vi.spyOn(channelService, 'createChannel').mockResolvedValue(mockChannel);

    await (wrapper.vm as any).handleAdd();

    expect(wrapper.emitted('added')).toBeDefined();
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe(false);
  });

  // E. Không cần resolve lại channel
  it('E. Quá trình hỏi access key KHÔNG làm mất resolvedPreview (không cần resolve lại)', async () => {
    const wrapper = mount(AddChannelModal, {
      props: {
        modelValue: true,
        existingChannels: [],
      },
    });

    const preview = {
      youtubeChannelId: 'UC_test_123',
      name: 'Kênh Test Đối Thủ',
      handle: '@kenhtest',
      url: 'https://youtube.com/@kenhtest',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    (wrapper.vm as any).resolvedPreview = preview;
    await wrapper.vm.$nextTick();

    // Cố gắng thêm khi chưa có key
    try {
      await (wrapper.vm as any).handleAdd();
    } catch {
      // Bị từ chối do thiếu key
    }

    // resolvedPreview vẫn được giữ nguyên vẹn
    expect((wrapper.vm as any).resolvedPreview).toEqual(preview);
    expect(document.body.textContent).toContain('Kênh Test Đối Thủ');
  });

  // F. Không còn dòng lỗi đỏ "Vui lòng nhập Mã truy cập..." trong AddChannelModal
  it('F. Không hiển thị dòng lỗi đỏ "Vui lòng nhập Mã truy cập..." trong AddChannelModal', async () => {
    const wrapper = mount(AddChannelModal, {
      props: {
        modelValue: true,
        existingChannels: [],
      },
    });

    (wrapper.vm as any).resolvedPreview = {
      youtubeChannelId: 'UC_test_123',
      name: 'Kênh Test Đối Thủ',
      handle: '@kenhtest',
      url: 'https://youtube.com/@kenhtest',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    await wrapper.vm.$nextTick();

    // Bấm thêm khi thiếu key
    try {
      await (wrapper.vm as any).handleAdd();
    } catch {
      // Ignored
    }

    await wrapper.vm.$nextTick();

    // Không được xuất hiện alert-box alert-error
    expect((wrapper.vm as any).resolveError).toBeNull();
    const errorBox = document.querySelector('.alert-error');
    expect(errorBox).toBeNull();
  });

  // G. Áp dụng tương tự cho BulkAddChannelsModal
  it('G. BulkAddChannelsModal phát access-key-required khi chưa có mã truy cập', async () => {
    const wrapper = mount(BulkAddChannelsModal, {
      props: {
        modelValue: true,
        existingChannels: [],
      },
    });

    (wrapper.vm as any).summary = {
      total: 1,
      valid: [
        {
          input: '@kenh1',
          resolved: {
            youtubeChannelId: 'UC_bulk_1',
            name: 'Kênh Bulk 1',
            handle: '@kenh1',
            url: 'https://youtube.com/@kenh1',
            avatarUrl: null,
          },
          alreadyExists: false,
        },
      ],
      duplicates: [],
      errors: [],
    };

    await wrapper.vm.$nextTick();

    try {
      await (wrapper.vm as any).handleSubmitBulk();
    } catch {
      // Ignored
    }

    const emitted = wrapper.emitted('access-key-required');
    expect(emitted).toBeDefined();
    expect(emitted!.length).toBe(1);
  });

  // H. Áp dụng tương tự cho resume/restore trong AddChannelModal
  it('H. Thao tác resume hoặc restore trong AddChannelModal cũng phát access-key-required', async () => {
    const wrapper = mount(AddChannelModal, {
      props: {
        modelValue: true,
        existingChannels: [],
      },
    });

    (wrapper.vm as any).existingChannel = {
      ...mockChannel,
      status: 'paused',
    };

    await wrapper.vm.$nextTick();

    try {
      await (wrapper.vm as any).handleResumeExisting();
    } catch {
      // Ignored
    }

    const emitted = wrapper.emitted('access-key-required');
    expect(emitted).toBeDefined();
    expect(emitted!.length).toBe(1);
    expect((wrapper.vm as any).resolveError).toBeNull();
  });

  // I. Khi Edge Function trả về lỗi HTTP 401 (FunctionsHttpError), _invokeManage chuyển thành AccessKeyRequiredError
  it('I. _invokeManage bắt lỗi 401 FunctionsHttpError, xóa key cũ và ném AccessKeyRequiredError', async () => {
    setStoredAccessKey('invalid_stored_key');

    const fakeFunctionsError = {
      name: 'FunctionsHttpError',
      message: 'Edge Function returned a non-2xx status code',
      context: {
        status: 401,
        clone: () => ({
          json: async () => ({
            success: false,
            error: 'Mã truy cập không chính xác. Thao tác bị từ chối.',
          }),
        }),
        json: async () => ({
          success: false,
          error: 'Mã truy cập không chính xác. Thao tác bị từ chối.',
        }),
      },
    };

    const mockSupabase = {
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: null,
          error: fakeFunctionsError,
        }),
      },
    };

    const { getSupabase } = await import('../src/services/supabase');
    vi.spyOn({ getSupabase }, 'getSupabase').mockReturnValue(mockSupabase as any);

    // Spy on supabase module directly
    const supabaseModule = await import('../src/services/supabase');
    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockSupabase as any);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    const { AccessKeyRequiredError: ImportedAccessKeyRequiredError } = await import('../src/services/channel-service');

    await expect(channelService._invokeManage('create', { name: 'Test' })).rejects.toThrow(
      ImportedAccessKeyRequiredError
    );

    // Mã cũ phải được xóa khỏi storage
    const { getStoredAccessKey } = await import('../src/services/channel-service');
    expect(getStoredAccessKey()).toBeNull();
  });

  // J. AddChannelModal khi gặp lỗi 401 FunctionsHttpError phải kích hoạt prompt modal thay vì hiện "Edge Function returned a non-2xx status code"
  it('J. AddChannelModal khi backend trả 401 FunctionsHttpError không hiện lỗi đỏ non-2xx mà mở AccessKeyPromptModal', async () => {
    const wrapper = mount(AddChannelModal, {
      props: {
        modelValue: true,
        existingChannels: [],
      },
    });

    (wrapper.vm as any).resolvedPreview = {
      youtubeChannelId: 'UC_test_123',
      name: 'Kênh Test Đối Thủ',
      handle: '@kenhtest',
      url: 'https://youtube.com/@kenhtest',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    const { AccessKeyRequiredError: ImportedAccessKeyRequiredError } = await import('../src/services/channel-service');
    vi.spyOn(channelService, 'createChannel').mockRejectedValue(
      new ImportedAccessKeyRequiredError('Mã truy cập không chính xác. Vui lòng nhập lại.')
    );

    await wrapper.vm.$nextTick();

    try {
      await (wrapper.vm as any).handleAdd();
    } catch {
      // Expected reject
    }

    await wrapper.vm.$nextTick();

    // Phải emit access-key-required
    const emitted = wrapper.emitted('access-key-required');
    expect(emitted).toBeDefined();
    expect(emitted!.length).toBe(1);
    expect(emitted![0][1]).toBe('Mã truy cập không chính xác. Vui lòng nhập lại.');

    // Không được để chuỗi 'Edge Function returned a non-2xx status code'
    expect((wrapper.vm as any).resolveError).toBeNull();
    const errorBox = document.querySelector('.alert-error');
    expect(errorBox).toBeNull();
  });

  // K. [Yêu cầu A-D] sessionStorage chứa mã sai -> thêm kênh -> xóa mã -> mở prompt hiển thị đúng thông báo -> nhập đúng tự chạy lại
  it('K. [Yêu cầu A-D] Stale wrong key flow: Xóa mã sai -> Mở modal "Mã truy cập không chính xác. Vui lòng nhập lại." -> Giữ preview -> Retry thành công', async () => {
    setStoredAccessKey('wrong_old_key');
    expect(getStoredAccessKey()).toBe('wrong_old_key');

    const fake401Error = {
      name: 'FunctionsHttpError',
      message: 'Edge Function returned a non-2xx status code',
      context: {
        status: 401,
        clone: () => ({
          json: async () => ({
            success: false,
            error: 'Mã truy cập không chính xác. Thao tác bị từ chối.',
          }),
        }),
        json: async () => ({
          success: false,
          error: 'Mã truy cập không chính xác. Thao tác bị từ chối.',
        }),
      },
    };

    const mockSupabase = {
      functions: {
        invoke: vi.fn().mockImplementation(async (_fn, options) => {
          if (options?.body?.accessKey === 'correct_key') {
            return {
              data: {
                success: true,
                channel: {
                  id: 'chan-002',
                  youtube_channel_id: 'UC_test_123',
                  name: 'Kênh Test Đối Thủ',
                  handle: '@kenhtest',
                  url: 'https://youtube.com/@kenhtest',
                  avatar_url: 'https://example.com/avatar.jpg',
                  status: 'active',
                  scan_limit: 15,
                  alert_vph_threshold: 5000,
                  source: 'manual',
                  notes: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_scan_at: null,
                },
              },
              error: null,
            };
          }
          return { data: null, error: fake401Error };
        }),
      },
    };

    const supabaseModule = await import('../src/services/supabase');
    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockSupabase as any);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    const modalWrapper = mount(AddChannelModal, {
      props: {
        modelValue: true,
        existingChannels: [],
      },
    });

    const preview = {
      youtubeChannelId: 'UC_test_123',
      name: 'Kênh Test Đối Thủ',
      handle: '@kenhtest',
      url: 'https://youtube.com/@kenhtest',
      avatarUrl: 'https://example.com/avatar.jpg',
    };
    (modalWrapper.vm as any).resolvedPreview = preview;
    await modalWrapper.vm.$nextTick();

    // Bước 1: Bấm thêm kênh khi session đang có mã sai
    let retryAction: (() => Promise<any>) | null = null;
    let receivedErrorMsg: string | undefined;

    try {
      await (modalWrapper.vm as any).handleAdd();
    } catch {
      const emitted = modalWrapper.emitted('access-key-required');
      expect(emitted).toBeDefined();
      retryAction = emitted![0][0] as () => Promise<any>;
      receivedErrorMsg = emitted![0][1] as string;
    }

    // Yêu cầu A: Mã sai bị xóa khỏi sessionStorage
    expect(getStoredAccessKey()).toBeNull();

    // Yêu cầu A & 3: Hiển thị đúng câu "Mã truy cập không chính xác. Vui lòng nhập lại."
    expect(receivedErrorMsg).toBe('Mã truy cập không chính xác. Vui lòng nhập lại.');

    // Yêu cầu C: Không cần resolve lại kênh (resolvedPreview nguyên vẹn)
    expect((modalWrapper.vm as any).resolvedPreview).toEqual(preview);
    expect((modalWrapper.vm as any).resolveError).toBeNull();

    // Yêu cầu D: Nếu sai mã lần nữa -> tiếp tục xóa key và báo lỗi
    setStoredAccessKey('another_wrong_key');
    let retryAction2: (() => Promise<any>) | null = null;
    try {
      await retryAction!();
    } catch {
      expect(getStoredAccessKey()).toBeNull();
      const emitted2 = modalWrapper.emitted('access-key-required');
      expect(emitted2!.length).toBe(2);
      retryAction2 = emitted2![1][0] as () => Promise<any>;
      expect(emitted2![1][1]).toBe('Mã truy cập không chính xác. Vui lòng nhập lại.');
    }

    // Yêu cầu B: Nhập mã đúng -> tự động thêm kênh thành công
    setStoredAccessKey('correct_key');
    const created = await retryAction2!();
    expect(created.name).toBe('Kênh Test Đối Thủ');
    expect(modalWrapper.emitted('added')).toBeDefined();
  });

  // L. [Yêu cầu E] pause/resume/archive/restore khi gặp mã sai: xóa key, ném lỗi và tự chạy lại khi có key đúng
  it('L. [Yêu cầu E] pause/resume/archive/restore gặp mã sai: xóa key và tự chạy lại thành công', async () => {
    setStoredAccessKey('wrong_key');

    const fake401 = {
      name: 'FunctionsHttpError',
      message: 'Edge Function returned a non-2xx status code',
      context: {
        status: 401,
        clone: () => ({
          json: async () => ({
            success: false,
            error: 'Mã truy cập không chính xác. Thao tác bị từ chối.',
          }),
        }),
        json: async () => ({
          success: false,
          error: 'Mã truy cập không chính xác. Thao tác bị từ chối.',
        }),
      },
    };

    const mockDbChannel = {
      id: 'chan-001',
      youtube_channel_id: 'UC_test_123',
      name: 'Kênh Test',
      handle: null,
      url: 'https://youtube.com',
      avatar_url: null,
      status: 'paused',
      scan_limit: 15,
      alert_vph_threshold: 5000,
      source: 'manual',
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_scan_at: null,
    };

    const mockSupabase = {
      functions: {
        invoke: vi.fn().mockImplementation(async (_fn, options) => {
          if (options?.body?.accessKey === 'valid_key') {
            return {
              data: {
                success: true,
                channel: { ...mockDbChannel, status: options.body.action === 'resume' ? 'active' : 'paused' },
              },
              error: null,
            };
          }
          return { data: null, error: fake401 };
        }),
      },
    };

    const supabaseModule = await import('../src/services/supabase');
    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockSupabase as any);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    const { AccessKeyRequiredError: ImportedAccessKeyRequiredError } = await import('../src/services/channel-service');

    // 1. Thao tác pause với key sai
    await expect(channelService.pauseChannel('chan-001')).rejects.toThrow(
      ImportedAccessKeyRequiredError
    );
    expect(getStoredAccessKey()).toBeNull();

    // Nhập key đúng -> chạy lại thành công
    setStoredAccessKey('valid_key');
    const paused = await channelService.pauseChannel('chan-001');
    expect(paused.status).toBe('paused');

    // 2. Thao tác resume với key sai
    setStoredAccessKey('wrong_key_2');
    await expect(channelService.resumeChannel('chan-001')).rejects.toThrow(
      ImportedAccessKeyRequiredError
    );
    expect(getStoredAccessKey()).toBeNull();

    setStoredAccessKey('valid_key');
    const resumed = await channelService.resumeChannel('chan-001');
    expect(resumed.status).toBe('active');
  });

  // M. [Yêu cầu F] collectorService.triggerCollection khi gặp mã sai: xóa key, ném lỗi và tự chạy lại khi có key đúng
  it('M. [Yêu cầu F] collectorService.triggerCollection gặp mã sai: xóa key và tự chạy lại thành công', async () => {
    setStoredAccessKey('wrong_key');

    const fake401 = {
      name: 'FunctionsHttpError',
      message: 'Edge Function returned a non-2xx status code',
      context: {
        status: 401,
        clone: () => ({
          json: async () => ({
            success: false,
            error: 'Mã truy cập không chính xác. Thao tác bị từ chối.',
          }),
        }),
        json: async () => ({
          success: false,
          error: 'Mã truy cập không chính xác. Thao tác bị từ chối.',
        }),
      },
    };

    const mockSupabase = {
      functions: {
        invoke: vi.fn().mockImplementation(async (_fn, options) => {
          if (options?.body?.accessKey === 'valid_key') {
            return {
              data: {
                success: true,
                run: { id: 'run-1', channelsSuccess: 5, videosFound: 25 },
              },
              error: null,
            };
          }
          return { data: null, error: fake401 };
        }),
      },
    };

    const supabaseModule = await import('../src/services/supabase');
    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue(mockSupabase as any);
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    const { collectorService } = await import('../src/services/collector-service');
    const { AccessKeyRequiredError: ImportedAccessKeyRequiredError } = await import('../src/services/channel-service');

    // Gọi triggerCollection khi session có key sai
    await expect(collectorService.triggerCollection()).rejects.toThrow(
      ImportedAccessKeyRequiredError
    );

    // Key sai phải bị xóa khỏi sessionStorage
    expect(getStoredAccessKey()).toBeNull();

    // Cung cấp key đúng -> chạy lại thành công
    setStoredAccessKey('valid_key');
    const res = await collectorService.triggerCollection();
    expect(res.success).toBe(true);
    expect(res.run?.channelsSuccess).toBe(5);
  });

  // N. [Yêu cầu ChannelsPage pendingAction] executeWithAccessKey bắt lỗi 401, mở modal và tự động retry pendingAction sau khi user xác nhận mã mới
  it('N. ChannelsPage executeWithAccessKey giữ pendingAction, mở modal với câu lỗi đúng và retry thành công', async () => {
    const { createPinia, setActivePinia } = await import('pinia');
    setActivePinia(createPinia());

    const { default: ChannelsPage } = await import('../src/pages/ChannelsPage.vue');
    const { AccessKeyRequiredError: ImportedAccessKeyRequiredError } = await import('../src/services/channel-service');

    const wrapper = mount(ChannelsPage, {
      global: {
        plugins: [createPinia()],
      },
    });

    await wrapper.vm.$nextTick();

    // Giả lập 1 action mutation (ví dụ pause)
    let actionExecutionCount = 0;
    const testAction = vi.fn().mockImplementation(async () => {
      actionExecutionCount++;
      if (actionExecutionCount === 1) {
        throw new ImportedAccessKeyRequiredError('Mã truy cập không chính xác. Vui lòng nhập lại.');
      }
      return 'success';
    });

    // Gọi executeWithAccessKey
    await (wrapper.vm as any).executeWithAccessKey(testAction);

    // Modal phải mở và hiện đúng thông báo
    expect((wrapper.vm as any).showAccessKeyModal).toBe(true);
    expect((wrapper.vm as any).accessKeyError).toBe('Mã truy cập không chính xác. Vui lòng nhập lại.');

    // Giả lập user nhập mã mới và bấm Xác Nhận (handleAccessKeyConfirmed)
    await (wrapper.vm as any).handleAccessKeyConfirmed();

    // Action phải được tự động chạy lại lần 2
    expect(actionExecutionCount).toBe(2);

    // Modal đóng, lỗi được dọn dẹp
    expect((wrapper.vm as any).showAccessKeyModal).toBe(false);
    expect((wrapper.vm as any).accessKeyError).toBeNull();
  });
});


