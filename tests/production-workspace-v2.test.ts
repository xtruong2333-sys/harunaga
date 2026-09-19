import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { mount } from '@vue/test-utils';
import { productionService } from '../src/services/production-service';
import type { ProductionItem, ProductionWorkspace } from '../src/types/production';

describe('Production Workspace 2.0', () => {
  const root = path.resolve(__dirname, '..');

  const sampleItem: ProductionItem = {
    id: 'prod-v2-1',
    sourceVideoId: 'video-1',
    workingTitle: 'DIY copper pipe remake',
    notes: 'Giữ hook ngắn và thumbnail rõ.',
    status: 'thumbnail',
    priority: 'normal',
    createdAt: '2026-09-19T08:00:00.000Z',
    updatedAt: '2026-09-19T09:00:00.000Z',
    publishedUrl: null,
    publishedAt: null,
    dueAt: '2026-09-22T08:00:00.000Z',
    startedAt: '2026-09-19T08:30:00.000Z',
    assigneeLabel: 'Trường',
    templateKey: 'diy_remake',
    taskCompletedCount: 1,
    taskTotalCount: 2,
    sourceVideo: {
      id: 'video-1',
      title: 'Copper Pipe Trick',
      url: 'https://www.youtube.com/watch?v=abc123',
      youtubeVideoId: 'abc123',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc123/mqdefault.jpg',
      channelName: 'Inventor Hacks',
      channelHandle: '@inventor',
      channelAvatarUrl: null,
    },
  };

  const workspace: ProductionWorkspace = {
    tasks: [
      {
        id: 'task-1',
        productionItemId: sampleItem.id,
        stage: 'thumbnail',
        title: 'Concept A/B',
        isCompleted: true,
        sortOrder: 10,
        completedAt: '2026-09-19T09:10:00.000Z',
        createdAt: '2026-09-19T09:00:00.000Z',
        updatedAt: '2026-09-19T09:10:00.000Z',
      },
      {
        id: 'task-2',
        productionItemId: sampleItem.id,
        stage: 'thumbnail',
        title: 'Kiểm tra mobile',
        isCompleted: false,
        sortOrder: 20,
        completedAt: null,
        createdAt: '2026-09-19T09:00:00.000Z',
        updatedAt: '2026-09-19T09:00:00.000Z',
      },
    ],
    assets: [],
    notes: [],
    activity: [],
    templates: [
      {
        id: 'tpl-1',
        templateKey: 'diy_remake',
        name: 'DIY Remake',
        description: 'Template DIY',
        checklist: [],
        isSystem: true,
        createdAt: '2026-09-19T00:00:00.000Z',
        updatedAt: '2026-09-19T00:00:00.000Z',
      },
    ],
  };

  it('migration V2 chỉ bổ sung schema và khóa ghi public', () => {
    const migration = fs.readFileSync(
      path.resolve(root, 'supabase/migrations/20260919000007_production_workspace_v2.sql'),
      'utf-8'
    );

    expect(migration).toContain('ALTER TABLE production_items');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS due_at');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS production_tasks');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS production_assets');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS production_notes');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS production_activity');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS production_templates');
    expect(migration).toContain('ON production_tasks FOR SELECT USING (true)');
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]{0,180}FOR INSERT/i);
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]{0,180}FOR UPDATE/i);
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]{0,180}FOR DELETE/i);
  });

  it('Edge Function giữ action cũ và bổ sung action Workspace V2 qua cùng access key', () => {
    const edge = fs.readFileSync(
      path.resolve(root, 'supabase/functions/manage-production-items/index.ts'),
      'utf-8'
    );

    expect(edge).toContain('APP_WRITE_ACCESS_KEY');
    for (const action of [
      'case "create"',
      'case "update"',
      'case "change_status"',
      'case "archive"',
      'case "restore"',
      'case "delete"',
      'case "update_workspace"',
      'case "create_task"',
      'case "update_task"',
      'case "delete_task"',
      'case "apply_template"',
      'case "create_asset"',
      'case "delete_asset"',
      'case "create_note"',
      'case "update_note"',
      'case "delete_note"',
    ]) {
      expect(edge).toContain(action);
    }
  });

  it('progress checklist được tính từ task thật, không lưu phần trăm giả', () => {
    expect(productionService.computeTaskProgress(workspace.tasks)).toEqual({
      completed: 1,
      total: 2,
      percent: 50,
    });
    expect(productionService.computeTaskProgress([])).toEqual({
      completed: 0,
      total: 0,
      percent: 0,
    });
  });

  it('Drawer hiển thị hồ sơ, timeline và emit payload chỉnh sửa trực tiếp', async () => {
    const { default: ProductionDetailDrawer } = await import(
      '../src/components/production/ProductionDetailDrawer.vue'
    );

    const wrapper = mount(ProductionDetailDrawer, {
      props: {
        modelValue: true,
        item: sampleItem,
        workspace,
        workspaceLoading: false,
        workspaceError: null,
        saving: false,
        mutationBusy: false,
      },
      global: {
        stubs: {
          Teleport: true,
          VideoThumbnail: { template: '<div class="video-thumbnail-stub"></div>' },
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('DIY copper pipe remake');
    expect(wrapper.text()).toContain('Tổng Quan');
    expect(wrapper.text()).toContain('Checklist');
    expect(wrapper.text()).toContain('AI Studio');
    expect(wrapper.text()).toContain('Đang làm thumbnail');

    const titleInput = wrapper.find('input[type="text"]');
    await titleInput.setValue('DIY copper pipe — bản mới');

    const saveButton = wrapper.findAll('button').find(button => button.text().includes('Lưu thay đổi'));
    expect(saveButton).toBeDefined();
    await saveButton!.trigger('click');

    const save = wrapper.emitted('save');
    expect(save).toBeDefined();
    expect(save![0][0]).toMatchObject({
      id: sampleItem.id,
      workingTitle: 'DIY copper pipe — bản mới',
      priority: 'normal',
      status: 'thumbnail',
      assigneeLabel: 'Trường',
    });
    expect(save![0][0]).not.toHaveProperty('templateKey');
  });

  it('Drawer checklist hiển thị progress thật 1/2 = 50%', async () => {
    const { default: ProductionDetailDrawer } = await import(
      '../src/components/production/ProductionDetailDrawer.vue'
    );

    const wrapper = mount(ProductionDetailDrawer, {
      props: {
        modelValue: true,
        item: sampleItem,
        workspace,
      },
      global: {
        stubs: {
          Teleport: true,
          VideoThumbnail: { template: '<div></div>' },
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const checklistTab = wrapper.findAll('button').find(button => button.text().includes('Checklist'));
    await checklistTab!.trigger('click');

    expect(wrapper.text()).toContain('1/2 công việc hoàn thành');
    expect(wrapper.text()).toContain('50%');
    expect(wrapper.text()).toContain('Concept A/B');
    expect(wrapper.text()).toContain('Kiểm tra mobile');
  });

  it('Card click mở hồ sơ nhưng vẫn giữ quick stage/edit actions cũ', async () => {
    const { default: ProductionCard } = await import('../src/components/production/ProductionCard.vue');
    const wrapper = mount(ProductionCard, {
      props: {
        item: sampleItem,
        isBusy: false,
        anyMutationBusy: false,
        interactionsLocked: false,
      },
      global: {
        stubs: {
          VideoThumbnail: { template: '<div class="video-thumbnail-stub"></div>' },
        },
      },
    });

    await wrapper.find('article.production-card').trigger('click');
    expect(wrapper.emitted('open')).toHaveLength(1);

    const editButton = wrapper.find('.action-btn.edit-btn');
    await editButton.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('open')).toHaveLength(1);

    expect(wrapper.find('.stage-select-control').exists()).toBe(true);
    expect(wrapper.find('.action-btn.edit-btn').exists()).toBe(true);
    expect(wrapper.text()).toContain('1/2');
    expect(wrapper.text()).toContain('Trường');
  });

  it('ProductionPage nối Drawer qua access-key mutation flow tập trung', () => {
    const page = fs.readFileSync(path.resolve(root, 'src/pages/ProductionPage.vue'), 'utf-8');
    expect(page).toContain('<ProductionDetailDrawer');
    expect(page).toContain('@open="openDetailDrawer"');
    expect(page).toContain('executeWithAccessKey(');
    expect(page).toContain('runWorkspaceMutation(');
    expect(page).toContain('productionService.updateProductionWorkspace');
    expect(page).toContain('productionService.applyTemplate');
    expect(page).toContain('templateKey: payload.templateKey');
  });

  it('AI tab dùng deep-link video nguồn thật mà AI Studio hiện hỗ trợ', () => {
    const drawer = fs.readFileSync(
      path.resolve(root, 'src/components/production/ProductionDetailDrawer.vue'),
      'utf-8'
    );
    const aiPage = fs.readFileSync(
      path.resolve(root, 'src/pages/AiContentAssistantPage.vue'),
      'utf-8'
    );
    expect(drawer).toContain("query: { video: item.sourceVideoId }");
    expect(aiPage).toContain('route?.query?.video');
    expect(aiPage).toContain('selectVideoById(qVideoId.trim())');
  });

  it('V2 không giả upload file: tài sản hiện là URL/link có validation http(s)', () => {
    const drawer = fs.readFileSync(
      path.resolve(root, 'src/components/production/ProductionDetailDrawer.vue'),
      'utf-8'
    );
    const edge = fs.readFileSync(
      path.resolve(root, 'supabase/functions/manage-production-items/index.ts'),
      'utf-8'
    );
    expect(drawer).toContain('type="url"');
    expect(drawer).not.toContain('type="file"');
    expect(edge).toContain('URL tài sản phải bắt đầu bằng http:// hoặc https://');
  });
});
