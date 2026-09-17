import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AddChannelModal from '../src/features/channels/components/AddChannelModal.vue';
import BulkAddChannelsModal from '../src/features/channels/components/BulkAddChannelsModal.vue';
import AccessKeyPromptModal from '../src/components/ui/AccessKeyPromptModal.vue';
import { channelService, clearStoredAccessKey, setStoredAccessKey } from '../src/services/channel-service';
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
});
