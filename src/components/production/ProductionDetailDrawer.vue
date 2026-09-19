<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="modelValue && item" class="production-drawer-backdrop" @click.self="requestClose">
        <aside class="production-detail-drawer" role="dialog" aria-modal="true" aria-label="Hồ sơ sản xuất">
          <header class="drawer-header">
            <div class="drawer-source">
              <div class="drawer-thumb">
                <VideoThumbnail
                  v-if="item.sourceVideo"
                  :src="item.sourceVideo.thumbnailUrl"
                  :youtube-video-id="item.sourceVideo.youtubeVideoId || undefined"
                  :detail-url="item.sourceVideo ? `/videos/${item.sourceVideo.id}` : undefined"
                  :alt="item.sourceVideo?.title || 'Video nguồn'"
                  ratio="16-9"
                />
                <div v-else class="drawer-thumb-empty">
                  <AppIcon name="video" :size="26" />
                </div>
              </div>
              <div class="drawer-title-block">
                <div class="drawer-kicker">PRODUCTION WORKSPACE</div>
                <h2 class="drawer-title">{{ displayTitle }}</h2>
                <div class="drawer-meta">
                  <span v-if="item.sourceVideo">{{ item.sourceVideo.channelName }}</span>
                  <span>•</span>
                  <span>{{ STATUS_LABELS[form.status] }}</span>
                  <span v-if="dueState" class="due-chip" :class="`tone-${dueState.tone}`">{{ dueState.label }}</span>
                </div>
              </div>
            </div>
            <div class="drawer-header-actions">
              <a
                v-if="item.sourceVideo?.url"
                :href="item.sourceVideo.url"
                target="_blank"
                rel="noopener noreferrer"
                class="icon-action"
                title="Mở video nguồn"
              >
                <AppIcon name="external" :size="16" />
              </a>
              <button type="button" class="icon-action" title="Đóng" :disabled="saving || mutationBusy" @click="requestClose">
                <AppIcon name="x" :size="17" />
              </button>
            </div>
          </header>

          <section class="stage-timeline" aria-label="Tiến độ giai đoạn">
            <button
              v-for="(status, index) in ACTIVE_WORKFLOW_STATUSES"
              :key="status"
              type="button"
              class="stage-step"
              :class="{
                current: form.status === status,
                completed: currentStageIndex > index,
                upcoming: currentStageIndex < index
              }"
              :disabled="saving || mutationBusy || item.status === 'archived'"
              @click="form.status = status"
            >
              <span class="stage-node">
                <AppIcon v-if="currentStageIndex > index" name="check" :size="11" />
                <span v-else>{{ index + 1 }}</span>
              </span>
              <span class="stage-name">{{ shortStatusLabel(status) }}</span>
            </button>
          </section>

          <nav class="drawer-tabs" aria-label="Các khu vực hồ sơ">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="drawer-tab"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
              <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
            </button>
          </nav>

          <main class="drawer-body">
            <div v-if="activeTab === 'overview'" class="drawer-panel-stack">
              <section class="drawer-section">
                <div class="section-heading">
                  <div>
                    <h3>Thông tin công việc</h3>
                    <p>Chỉnh trực tiếp các trường chính của hồ sơ.</p>
                  </div>
                  <span v-if="dirty" class="unsaved-chip">Có thay đổi chưa lưu</span>
                </div>

                <div class="form-grid">
                  <label class="field span-2">
                    <span>Tiêu đề đang làm</span>
                    <input v-model="form.workingTitle" type="text" maxlength="200" placeholder="Tiêu đề nội dung đang sản xuất..." />
                  </label>

                  <label class="field">
                    <span>Giai đoạn</span>
                    <select v-model="form.status">
                      <option v-for="status in ACTIVE_WORKFLOW_STATUSES" :key="status" :value="status">
                        {{ STATUS_LABELS[status] }}
                      </option>
                      <option value="archived">Đã lưu trữ</option>
                    </select>
                  </label>

                  <label class="field">
                    <span>Mức ưu tiên</span>
                    <select v-model="form.priority">
                      <option value="low">Thấp</option>
                      <option value="normal">Bình thường</option>
                      <option value="high">Cao</option>
                    </select>
                  </label>

                  <label class="field">
                    <span>Deadline</span>
                    <input v-model="form.dueAt" type="datetime-local" />
                  </label>

                  <label class="field">
                    <span>Người phụ trách</span>
                    <input v-model="form.assigneeLabel" type="text" maxlength="100" placeholder="Ví dụ: Trường" />
                  </label>

                  <label class="field span-2">
                    <span>Ghi chú công việc</span>
                    <textarea v-model="form.notes" rows="5" maxlength="5000" placeholder="Ghi chú tổng quan, yêu cầu cần nhớ..."></textarea>
                  </label>

                  <label class="field span-2">
                    <span>URL video đã xuất bản</span>
                    <input v-model="form.publishedUrl" type="url" placeholder="https://youtube.com/..." />
                  </label>
                </div>
              </section>

              <section class="drawer-section">
                <div class="section-heading">
                  <div>
                    <h3>Template quy trình</h3>
                    <p>Áp dụng template sẽ chỉ thêm checklist còn thiếu, không xóa checklist bạn đã tạo.</p>
                  </div>
                </div>
                <div class="template-row">
                  <select v-model="selectedTemplateKey" :disabled="workspaceLoading || mutationBusy">
                    <option value="">Chọn template...</option>
                    <option v-for="tpl in workspace?.templates || []" :key="tpl.id" :value="tpl.templateKey">
                      {{ tpl.name }}
                    </option>
                  </select>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    :disabled="!selectedTemplateKey || mutationBusy"
                    @click="$emit('apply-template', { productionItemId: item.id, templateKey: selectedTemplateKey })"
                  >
                    Áp dụng template
                  </button>
                </div>
              </section>

              <section class="drawer-section source-section">
                <div class="section-heading">
                  <div>
                    <h3>Nguồn nội dung</h3>
                    <p>Dữ liệu nguồn chỉ xem, không chỉnh sửa từ Production Workspace.</p>
                  </div>
                </div>
                <div class="source-facts">
                  <div><span>Kênh</span><strong>{{ item.sourceVideo?.channelName || '—' }}</strong></div>
                  <div><span>Video nguồn</span><strong>{{ item.sourceVideo?.title || 'Không còn trong hệ thống' }}</strong></div>
                  <div><span>Bắt đầu</span><strong>{{ formatDateTime(item.startedAt) }}</strong></div>
                  <div><span>Cập nhật</span><strong>{{ formatDateTime(item.updatedAt) }}</strong></div>
                </div>
              </section>
            </div>

            <div v-else-if="activeTab === 'checklist'" class="drawer-panel-stack">
              <WorkspaceError v-if="workspaceError" :message="workspaceError" @retry="$emit('refresh-workspace')" />
              <template v-else>
                <section class="drawer-section progress-section">
                  <div class="progress-head">
                    <div>
                      <h3>Checklist sản xuất</h3>
                      <p>{{ progress.completed }}/{{ progress.total }} công việc hoàn thành</p>
                    </div>
                    <strong>{{ progress.percent }}%</strong>
                  </div>
                  <div class="progress-track"><div class="progress-fill" :style="{ width: progress.percent + '%' }"></div></div>
                </section>

                <section class="drawer-section compact-form-section">
                  <div class="inline-form task-create-form">
                    <select v-model="newTask.stage">
                      <option v-for="status in ACTIVE_WORKFLOW_STATUSES" :key="status" :value="status">{{ STATUS_LABELS[status] }}</option>
                    </select>
                    <input v-model="newTask.title" type="text" maxlength="240" placeholder="Thêm checklist..." @keyup.enter="submitTask" />
                    <button type="button" class="btn btn-primary" :disabled="!newTask.title.trim() || mutationBusy" @click="submitTask">
                      <AppIcon name="plus" :size="14" /> Thêm
                    </button>
                  </div>
                </section>

                <section v-for="stage in stagesWithTasks" :key="stage" class="drawer-section checklist-stage">
                  <div class="checklist-stage-head">
                    <h3>{{ STATUS_LABELS[stage] }}</h3>
                    <span>{{ completedForStage(stage) }}/{{ tasksForStage(stage).length }}</span>
                  </div>
                  <div class="task-list">
                    <div v-for="task in tasksForStage(stage)" :key="task.id" class="task-row" :class="{ done: task.isCompleted }">
                      <button
                        type="button"
                        class="task-check"
                        :class="{ checked: task.isCompleted }"
                        :disabled="mutationBusy"
                        @click="$emit('update-task', { id: task.id, isCompleted: !task.isCompleted })"
                      >
                        <AppIcon v-if="task.isCompleted" name="check" :size="12" />
                      </button>
                      <span class="task-title">{{ task.title }}</span>
                      <button type="button" class="row-delete" :disabled="mutationBusy" title="Xóa checklist" @click="$emit('delete-task', task.id)">
                        <AppIcon name="x" :size="13" />
                      </button>
                    </div>
                    <div v-if="tasksForStage(stage).length === 0" class="empty-inline">Chưa có checklist.</div>
                  </div>
                </section>

                <div v-if="workspaceLoading" class="workspace-loading">Đang tải checklist...</div>
              </template>
            </div>

            <div v-else-if="activeTab === 'assets'" class="drawer-panel-stack">
              <WorkspaceError v-if="workspaceError" :message="workspaceError" @retry="$emit('refresh-workspace')" />
              <template v-else>
                <section class="drawer-section">
                  <div class="section-heading">
                    <div>
                      <h3>Thêm tài sản / liên kết</h3>
                      <p>Drive, project edit, script, thumbnail, footage, YouTube hoặc link tham khảo.</p>
                    </div>
                  </div>
                  <div class="form-grid asset-form">
                    <label class="field">
                      <span>Loại</span>
                      <select v-model="newAsset.assetType">
                        <option v-for="(label, key) in ASSET_TYPE_LABELS" :key="key" :value="key">{{ label }}</option>
                      </select>
                    </label>
                    <label class="field">
                      <span>Tên tài sản</span>
                      <input v-model="newAsset.label" type="text" maxlength="160" placeholder="Ví dụ: Thumbnail final" />
                    </label>
                    <label class="field span-2">
                      <span>URL</span>
                      <input v-model="newAsset.url" type="url" placeholder="https://..." />
                    </label>
                    <label class="field span-2">
                      <span>Ghi chú</span>
                      <input v-model="newAsset.notes" type="text" maxlength="1000" placeholder="Ghi chú ngắn..." />
                    </label>
                  </div>
                  <div class="form-action-row">
                    <button type="button" class="btn btn-primary" :disabled="!canAddAsset || mutationBusy" @click="submitAsset">
                      <AppIcon name="plus" :size="14" /> Thêm tài sản
                    </button>
                  </div>
                </section>

                <section class="drawer-section">
                  <div class="section-heading"><div><h3>Tài sản đã lưu</h3><p>{{ workspace?.assets.length || 0 }} liên kết</p></div></div>
                  <div class="asset-list">
                    <div v-for="asset in workspace?.assets || []" :key="asset.id" class="asset-row">
                      <div class="asset-icon"><AppIcon :name="asset.assetType === 'thumbnail' ? 'image' : asset.assetType === 'youtube' ? 'video' : 'external'" :size="16" /></div>
                      <div class="asset-info">
                        <div class="asset-top"><strong>{{ asset.label }}</strong><span>{{ ASSET_TYPE_LABELS[asset.assetType] }}</span></div>
                        <p v-if="asset.notes">{{ asset.notes }}</p>
                        <a :href="asset.url" target="_blank" rel="noopener noreferrer">{{ asset.url }}</a>
                      </div>
                      <button type="button" class="row-delete" :disabled="mutationBusy" @click="$emit('delete-asset', asset.id)"><AppIcon name="x" :size="13" /></button>
                    </div>
                    <div v-if="!workspace?.assets.length" class="empty-block">Chưa có tài sản nào.</div>
                  </div>
                </section>
              </template>
            </div>

            <div v-else-if="activeTab === 'notes'" class="drawer-panel-stack">
              <WorkspaceError v-if="workspaceError" :message="workspaceError" @retry="$emit('refresh-workspace')" />
              <template v-else>
                <section class="drawer-section">
                  <div class="form-grid">
                    <label class="field">
                      <span>Loại ghi chú</span>
                      <select v-model="newNote.category">
                        <option v-for="(label, key) in NOTE_CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option>
                      </select>
                    </label>
                    <label class="field">
                      <span>Giai đoạn</span>
                      <select v-model="newNote.stage">
                        <option :value="null">Chung</option>
                        <option v-for="status in ACTIVE_WORKFLOW_STATUSES" :key="status" :value="status">{{ STATUS_LABELS[status] }}</option>
                      </select>
                    </label>
                    <label class="field span-2">
                      <span>Nội dung</span>
                      <textarea v-model="newNote.body" rows="4" maxlength="5000" placeholder="Ghi lại thay đổi, yêu cầu, quyết định..."></textarea>
                    </label>
                  </div>
                  <label class="pin-option"><input v-model="newNote.isPinned" type="checkbox" /> Ghim ghi chú này</label>
                  <div class="form-action-row">
                    <button type="button" class="btn btn-primary" :disabled="!newNote.body.trim() || mutationBusy" @click="submitNote">
                      <AppIcon name="plus" :size="14" /> Thêm ghi chú
                    </button>
                  </div>
                </section>

                <section class="drawer-section note-list-section">
                  <div v-for="note in workspace?.notes || []" :key="note.id" class="note-card" :class="{ pinned: note.isPinned }">
                    <div class="note-head">
                      <div class="note-tags">
                        <span>{{ NOTE_CATEGORY_LABELS[note.category] }}</span>
                        <span v-if="note.stage">{{ STATUS_LABELS[note.stage] }}</span>
                        <span v-if="note.isPinned" class="pin-chip">Đã ghim</span>
                      </div>
                      <span>{{ formatDateTime(note.createdAt) }}</span>
                    </div>
                    <p>{{ note.body }}</p>
                    <div class="note-actions">
                      <button type="button" :disabled="mutationBusy" @click="$emit('update-note', { id: note.id, isPinned: !note.isPinned })">
                        {{ note.isPinned ? 'Bỏ ghim' : 'Ghim' }}
                      </button>
                      <button type="button" class="danger-link" :disabled="mutationBusy" @click="$emit('delete-note', note.id)">Xóa</button>
                    </div>
                  </div>
                  <div v-if="!workspace?.notes.length" class="empty-block">Chưa có ghi chú log.</div>
                </section>
              </template>
            </div>

            <div v-else class="drawer-panel-stack">
              <WorkspaceError v-if="workspaceError" :message="workspaceError" @retry="$emit('refresh-workspace')" />
              <section v-else class="drawer-section activity-section">
                <div class="section-heading"><div><h3>Lịch sử hoạt động</h3><p>Tối đa 100 sự kiện gần nhất.</p></div></div>
                <div class="activity-list">
                  <div v-for="event in workspace?.activity || []" :key="event.id" class="activity-row">
                    <div class="activity-dot"></div>
                    <div class="activity-copy"><strong>{{ event.message }}</strong><span>{{ formatDateTime(event.createdAt) }}</span></div>
                  </div>
                  <div v-if="!workspace?.activity.length" class="empty-block">Chưa có lịch sử hoạt động.</div>
                </div>
              </section>
            </div>
          </main>

          <footer class="drawer-footer">
            <div class="footer-nav">
              <button type="button" class="btn btn-secondary" :disabled="!canGoPrevious || saving || mutationBusy" @click="moveStage(-1)">
                <AppIcon name="arrow-left" :size="14" /> Bước trước
              </button>
              <button type="button" class="btn btn-secondary" :disabled="!canGoNext || saving || mutationBusy" @click="moveStage(1)">
                Bước tiếp <AppIcon name="arrow-right" :size="14" />
              </button>
            </div>
            <div class="footer-save">
              <button type="button" class="btn btn-secondary" :disabled="saving || mutationBusy" @click="resetForm">Hủy thay đổi</button>
              <button type="button" class="btn btn-primary" :disabled="!dirty || saving || mutationBusy" @click="submitCore">
                {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
              </button>
            </div>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import { productionService } from '@/services/production-service';
import type {
  ActiveProductionStatus,
  ProductionAssetCreateInput,
  ProductionAssetType,
  ProductionItem,
  ProductionNoteCategory,
  ProductionNoteCreateInput,
  ProductionStatus,
  ProductionTaskCreateInput,
  ProductionTaskUpdateInput,
  ProductionWorkspace,
  ProductionWorkspaceUpdateInput,
} from '@/types/production';
import {
  ACTIVE_WORKFLOW_STATUSES,
  ASSET_TYPE_LABELS,
  NOTE_CATEGORY_LABELS,
  STATUS_LABELS,
} from '@/types/production';

const WorkspaceError = defineComponent({
  props: { message: { type: String, required: true } },
  emits: ['retry'],
  setup(props, { emit }) {
    return () => h('div', { class: 'workspace-error' }, [
      h('strong', 'Không thể tải dữ liệu Workspace V2'),
      h('p', props.message),
      h('button', { type: 'button', class: 'btn btn-secondary', onClick: () => emit('retry') }, 'Thử lại'),
    ]);
  },
});

const props = defineProps<{
  modelValue: boolean;
  item: ProductionItem | null;
  workspace: ProductionWorkspace | null;
  workspaceLoading?: boolean;
  workspaceError?: string | null;
  saving?: boolean;
  mutationBusy?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', payload: ProductionWorkspaceUpdateInput): void;
  (e: 'refresh-workspace'): void;
  (e: 'apply-template', payload: { productionItemId: string; templateKey: string }): void;
  (e: 'create-task', payload: ProductionTaskCreateInput): void;
  (e: 'update-task', payload: ProductionTaskUpdateInput): void;
  (e: 'delete-task', id: string): void;
  (e: 'create-asset', payload: ProductionAssetCreateInput): void;
  (e: 'delete-asset', id: string): void;
  (e: 'create-note', payload: ProductionNoteCreateInput): void;
  (e: 'update-note', payload: { id: string; isPinned: boolean }): void;
  (e: 'delete-note', id: string): void;
}>();

type DrawerTab = 'overview' | 'checklist' | 'assets' | 'notes' | 'activity';

const activeTab = ref<DrawerTab>('overview');
const selectedTemplateKey = ref('');

const form = reactive({
  workingTitle: '',
  notes: '',
  status: 'idea' as ProductionStatus,
  priority: 'normal' as ProductionItem['priority'],
  publishedUrl: '',
  dueAt: '',
  assigneeLabel: '',
});

const initialSnapshot = ref('');
const newTask = reactive({ stage: 'idea' as ActiveProductionStatus, title: '' });
const newAsset = reactive({ assetType: 'reference' as ProductionAssetType, label: '', url: '', notes: '' });
const newNote = reactive({
  category: 'general' as ProductionNoteCategory,
  stage: null as ActiveProductionStatus | null,
  body: '',
  isPinned: false,
});

const displayTitle = computed(() => form.workingTitle || props.item?.sourceVideo?.title || 'Chưa đặt tiêu đề');
const currentStageIndex = computed(() => ACTIVE_WORKFLOW_STATUSES.indexOf(form.status as ActiveProductionStatus));
const dueState = computed(() => productionService.formatDueState(localToIso(form.dueAt) || null));
const progress = computed(() => productionService.computeTaskProgress(props.workspace?.tasks || []));

const tabs = computed(() => [
  { id: 'overview' as const, label: 'Tổng Quan' },
  { id: 'checklist' as const, label: 'Checklist', count: props.workspace?.tasks.length || 0 },
  { id: 'assets' as const, label: 'Tài Sản', count: props.workspace?.assets.length || 0 },
  { id: 'notes' as const, label: 'Ghi Chú', count: props.workspace?.notes.length || 0 },
  { id: 'activity' as const, label: 'Lịch Sử', count: props.workspace?.activity.length || 0 },
]);

const dirty = computed(() => serializeForm() !== initialSnapshot.value);
const canGoPrevious = computed(() => currentStageIndex.value > 0 && props.item?.status !== 'archived');
const canGoNext = computed(() => currentStageIndex.value >= 0 && currentStageIndex.value < ACTIVE_WORKFLOW_STATUSES.length - 1 && props.item?.status !== 'archived');
const canAddAsset = computed(() => newAsset.label.trim().length > 0 && /^https?:\/\//i.test(newAsset.url.trim()));

const stagesWithTasks = computed(() => {
  const present = new Set((props.workspace?.tasks || []).map(task => task.stage));
  const result = ACTIVE_WORKFLOW_STATUSES.filter(stage => present.has(stage));
  return result.length ? result : [form.status === 'archived' ? 'idea' : form.status as ActiveProductionStatus];
});

function serializeForm() {
  return JSON.stringify({
    workingTitle: form.workingTitle,
    notes: form.notes,
    status: form.status,
    priority: form.priority,
    publishedUrl: form.publishedUrl,
    dueAt: form.dueAt,
    assigneeLabel: form.assigneeLabel,
  });
}

function toLocalDateTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localToIso(value: string): string {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function populateForm() {
  if (!props.item) return;
  form.workingTitle = props.item.workingTitle || '';
  form.notes = props.item.notes || '';
  form.status = props.item.status;
  form.priority = props.item.priority;
  form.publishedUrl = props.item.publishedUrl || '';
  form.dueAt = toLocalDateTime(props.item.dueAt);
  form.assigneeLabel = props.item.assigneeLabel || '';
  selectedTemplateKey.value = props.item.templateKey || '';
  initialSnapshot.value = serializeForm();
}

function resetForm() {
  populateForm();
}

function requestClose() {
  if (props.saving || props.mutationBusy) return;
  if (dirty.value && typeof window !== 'undefined') {
    const ok = window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và đóng hồ sơ?');
    if (!ok) return;
  }
  emit('update:modelValue', false);
}

function submitCore() {
  if (!props.item || !dirty.value) return;
  emit('save', {
    id: props.item.id,
    workingTitle: form.workingTitle,
    notes: form.notes,
    priority: form.priority,
    publishedUrl: form.publishedUrl,
    status: form.status,
    dueAt: localToIso(form.dueAt),
    assigneeLabel: form.assigneeLabel,
    templateKey: selectedTemplateKey.value,
  });
}

function moveStage(direction: -1 | 1) {
  const next = currentStageIndex.value + direction;
  if (next >= 0 && next < ACTIVE_WORKFLOW_STATUSES.length) {
    form.status = ACTIVE_WORKFLOW_STATUSES[next];
  }
}

function shortStatusLabel(status: ActiveProductionStatus) {
  const map: Record<ActiveProductionStatus, string> = {
    idea: 'Ý tưởng',
    research: 'Nghiên cứu',
    script: 'Kịch bản',
    thumbnail: 'Thumbnail',
    production: 'Sản xuất',
    editing: 'Chỉnh sửa',
    published: 'Xuất bản',
  };
  return map[status];
}

function tasksForStage(stage: ActiveProductionStatus) {
  return (props.workspace?.tasks || []).filter(task => task.stage === stage);
}

function completedForStage(stage: ActiveProductionStatus) {
  return tasksForStage(stage).filter(task => task.isCompleted).length;
}

function submitTask() {
  if (!props.item || !newTask.title.trim()) return;
  emit('create-task', {
    productionItemId: props.item.id,
    stage: newTask.stage,
    title: newTask.title.trim(),
    sortOrder: tasksForStage(newTask.stage).length * 10 + 10,
  });
  newTask.title = '';
}

function submitAsset() {
  if (!props.item || !canAddAsset.value) return;
  emit('create-asset', {
    productionItemId: props.item.id,
    assetType: newAsset.assetType,
    label: newAsset.label.trim(),
    url: newAsset.url.trim(),
    notes: newAsset.notes.trim(),
  });
  newAsset.label = '';
  newAsset.url = '';
  newAsset.notes = '';
}

function submitNote() {
  if (!props.item || !newNote.body.trim()) return;
  emit('create-note', {
    productionItemId: props.item.id,
    stage: newNote.stage,
    category: newNote.category,
    body: newNote.body.trim(),
    isPinned: newNote.isPinned,
  });
  newNote.body = '';
  newNote.isPinned = false;
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
}

watch(() => props.item?.id, () => {
  populateForm();
  activeTab.value = 'overview';
  newTask.stage = props.item?.status && props.item.status !== 'archived' ? props.item.status as ActiveProductionStatus : 'idea';
}, { immediate: true });

watch(() => props.item?.updatedAt, () => {
  populateForm();
});
</script>

<style scoped>
.production-drawer-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(15,35,58,.26);backdrop-filter:blur(3px);display:flex;justify-content:flex-end}
.production-detail-drawer{width:min(680px,96vw);height:100%;background:var(--surface,#fff);border-left:1px solid var(--border,#d7e3ef);box-shadow:-20px 0 60px rgba(20,48,78,.18);display:flex;flex-direction:column;color:var(--text-primary,#10233f)}
.drawer-header{padding:16px 18px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;border-bottom:1px solid var(--border,#d7e3ef)}
.drawer-source{display:flex;gap:13px;min-width:0;flex:1}.drawer-thumb{width:112px;flex:0 0 112px;border-radius:10px;overflow:hidden;background:var(--surface-muted,#f5f9fd)}.drawer-thumb-empty{aspect-ratio:16/9;display:grid;place-items:center;color:var(--text-muted)}
.drawer-title-block{min-width:0}.drawer-kicker{font-size:10px;font-weight:800;letter-spacing:.08em;color:#4c87df;margin-bottom:4px}.drawer-title{font-size:18px;line-height:1.3;margin:0;color:var(--text-primary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.drawer-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:11.5px;color:var(--text-muted)}
.drawer-header-actions{display:flex;gap:7px}.icon-action{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--border);background:var(--surface-muted);color:var(--text-secondary);border-radius:9px;text-decoration:none;cursor:pointer}
.due-chip,.unsaved-chip{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;font-size:10.5px;font-weight:700}.tone-neutral{background:#eef4f9;color:#597087}.tone-warning{background:#fff1cc;color:#9a5b00}.tone-danger{background:#fde5e5;color:#b42323}.tone-success{background:#def5e9;color:#087a57}.unsaved-chip{background:#fff1cc;color:#8f5700}
.stage-timeline{padding:13px 17px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-bottom:1px solid var(--border);background:var(--surface-muted)}
.stage-step{position:relative;border:0;background:transparent;padding:0 3px;display:flex;flex-direction:column;align-items:center;gap:5px;color:var(--text-muted);cursor:pointer}.stage-step:not(:last-child)::after{content:"";position:absolute;top:11px;left:58%;width:84%;height:2px;background:var(--border)}.stage-step.completed:not(:last-child)::after{background:#71b89d}.stage-node{position:relative;z-index:1;width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#fff;border:2px solid var(--border);font-size:9px;font-weight:800}.stage-step.completed .stage-node{background:#e0f4ea;border-color:#7fc6a7;color:#087a57}.stage-step.current .stage-node{background:#1769e8;border-color:#1769e8;color:white;box-shadow:0 0 0 4px rgba(23,105,232,.1)}.stage-step.current{color:#145dce}.stage-name{font-size:9.5px;font-weight:700;white-space:nowrap}
.drawer-tabs{display:flex;gap:4px;padding:8px 12px;border-bottom:1px solid var(--border);overflow-x:auto;background:#fff}.drawer-tab{border:0;background:transparent;color:var(--text-secondary);padding:8px 10px;border-radius:8px;font-size:12px;font-weight:650;white-space:nowrap;cursor:pointer}.drawer-tab.active{background:#eaf2ff;color:#145dce}.tab-count{margin-left:4px;padding:1px 5px;border-radius:999px;background:rgba(23,105,232,.08);font-size:10px}
.drawer-body{flex:1;overflow:auto;padding:16px;background:#f7fafd}.drawer-panel-stack{display:flex;flex-direction:column;gap:13px}.drawer-section{background:#fff;border:1px solid var(--border);border-radius:12px;padding:15px;box-shadow:0 2px 8px rgba(44,82,120,.035)}
.section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:13px}.section-heading h3,.checklist-stage-head h3,.progress-head h3{font-size:14px;margin:0;color:var(--text-primary)}.section-heading p,.progress-head p{font-size:11.5px;color:var(--text-muted);margin:3px 0 0}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{display:flex;flex-direction:column;gap:5px}.field>span{font-size:11px;font-weight:700;color:var(--text-secondary)}.field input,.field select,.field textarea,.template-row select,.inline-form input,.inline-form select{width:100%;min-height:38px;padding:8px 10px;border:1px solid var(--border);border-radius:9px;background:#fbfdff;color:var(--text-primary);font-size:12.5px}.field textarea{resize:vertical}.span-2{grid-column:span 2}
.template-row{display:grid;grid-template-columns:1fr auto;gap:9px}.source-facts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.source-facts>div{padding:10px;border-radius:9px;background:var(--surface-muted);display:flex;flex-direction:column;gap:3px}.source-facts span{font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em}.source-facts strong{font-size:11.5px;color:var(--text-secondary)}
.progress-head{display:flex;justify-content:space-between;align-items:center}.progress-head strong{font-size:22px;color:#1769e8}.progress-track{height:7px;background:#e7eef5;border-radius:999px;overflow:hidden;margin-top:11px}.progress-fill{height:100%;background:linear-gradient(90deg,#1769e8,#28b889);border-radius:999px;transition:width .2s ease}
.inline-form{display:grid;grid-template-columns:150px 1fr auto;gap:8px}.checklist-stage-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.checklist-stage-head span{font-size:11px;color:var(--text-muted)}.task-list{display:flex;flex-direction:column;gap:6px}.task-row{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:8px;background:#f8fbff;border:1px solid #e3ebf3}.task-row.done .task-title{text-decoration:line-through;color:var(--text-muted)}.task-check{width:22px;height:22px;border-radius:6px;border:1px solid #b9cce0;background:#fff;display:grid;place-items:center;color:white;cursor:pointer}.task-check.checked{background:#16a36f;border-color:#16a36f}.task-title{flex:1;font-size:12px;color:var(--text-secondary)}.row-delete{width:26px;height:26px;border:0;background:transparent;color:var(--text-muted);display:grid;place-items:center;border-radius:6px;cursor:pointer}.row-delete:hover{background:#fdeaea;color:#c53030}.empty-inline,.empty-block{padding:16px;text-align:center;color:var(--text-muted);font-size:12px}
.asset-form{margin-bottom:10px}.form-action-row{display:flex;justify-content:flex-end;margin-top:10px}.asset-list{display:flex;flex-direction:column;gap:8px}.asset-row{display:flex;align-items:flex-start;gap:10px;padding:10px;border:1px solid #e1eaf2;background:#f8fbff;border-radius:9px}.asset-icon{width:34px;height:34px;border-radius:8px;background:#eaf2ff;color:#1769e8;display:grid;place-items:center;flex:0 0 auto}.asset-info{flex:1;min-width:0}.asset-top{display:flex;align-items:center;gap:7px}.asset-top strong{font-size:12px}.asset-top span{font-size:9.5px;padding:2px 5px;border-radius:999px;background:#eef3f8;color:var(--text-muted)}.asset-info p{font-size:11px;margin:4px 0;color:var(--text-muted)}.asset-info a{font-size:10.5px;color:#1769e8;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pin-option{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;color:var(--text-secondary);margin-top:8px}.note-list-section{display:flex;flex-direction:column;gap:9px}.note-card{padding:11px;border:1px solid #e1eaf2;border-radius:9px;background:#fff}.note-card.pinned{border-color:#b8cff2;background:#f7fbff}.note-head{display:flex;justify-content:space-between;gap:10px;font-size:10px;color:var(--text-muted)}.note-tags{display:flex;gap:5px;flex-wrap:wrap}.note-tags span{padding:2px 6px;border-radius:999px;background:#eef3f8}.note-tags .pin-chip{background:#eaf2ff;color:#145dce}.note-card p{font-size:12.5px;line-height:1.5;color:var(--text-secondary);white-space:pre-wrap}.note-actions{display:flex;gap:8px;justify-content:flex-end}.note-actions button{border:0;background:transparent;color:#1769e8;font-size:11px;cursor:pointer}.note-actions .danger-link{color:#c53030}
.activity-list{display:flex;flex-direction:column}.activity-row{display:flex;gap:10px;position:relative;padding:0 0 14px}.activity-row:not(:last-child)::after{content:"";position:absolute;left:5px;top:13px;bottom:0;width:1px;background:#dce6ef}.activity-dot{width:11px;height:11px;margin-top:3px;border-radius:50%;background:#1769e8;box-shadow:0 0 0 3px #eaf2ff;flex:0 0 auto;z-index:1}.activity-copy{display:flex;flex-direction:column;gap:2px}.activity-copy strong{font-size:11.5px;color:var(--text-secondary)}.activity-copy span{font-size:10px;color:var(--text-muted)}
.workspace-error{padding:20px;border:1px solid #efc4c4;background:#fff3f3;border-radius:11px;color:#9f1d1d}.workspace-error p{font-size:12px}.workspace-loading{text-align:center;color:var(--text-muted);font-size:12px;padding:10px}
.drawer-footer{padding:11px 14px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff}.footer-nav,.footer-save{display:flex;gap:8px}
.drawer-fade-enter-active,.drawer-fade-leave-active{transition:opacity .18s ease}.drawer-fade-enter-active .production-detail-drawer,.drawer-fade-leave-active .production-detail-drawer{transition:transform .2s cubic-bezier(.16,1,.3,1)}.drawer-fade-enter-from,.drawer-fade-leave-to{opacity:0}.drawer-fade-enter-from .production-detail-drawer,.drawer-fade-leave-to .production-detail-drawer{transform:translateX(100%)}
@media(max-width:760px){.production-detail-drawer{width:100vw}.drawer-thumb{width:90px;flex-basis:90px}.stage-timeline{overflow-x:auto;grid-template-columns:repeat(7,92px)}.form-grid{grid-template-columns:1fr}.span-2{grid-column:span 1}.source-facts{grid-template-columns:1fr}.inline-form{grid-template-columns:1fr}.template-row{grid-template-columns:1fr}.drawer-footer{align-items:stretch;flex-direction:column}.footer-nav,.footer-save{display:grid;grid-template-columns:1fr 1fr}}
@media(prefers-reduced-motion:reduce){.drawer-fade-enter-active,.drawer-fade-leave-active,.drawer-fade-enter-active .production-detail-drawer,.drawer-fade-leave-active .production-detail-drawer,.progress-fill{transition:none!important}}
</style>
