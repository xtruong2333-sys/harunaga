<template>
  <div class="content-intelligence-studio">
    <!-- Page Header -->
    <PageHeader
      kicker="STUDIO TÌNH BÁO NỘI DUNG"
      title="Trợ Lý Nội Dung AI"
      description="Biến tín hiệu từ video đối thủ thành hướng nội dung mới dựa trên dữ liệu đang theo dõi."
      badge="Phân tích từ dữ liệu video đã chọn"
      badge-tone="accent"
    />

    <!-- System Error Banner (when error occurs during selection or analysis) -->
    <div v-if="pageError && videoOptions.length > 0" class="studio-alert-banner error-banner" role="alert">
      <div class="alert-content">
        <AppIcon name="alert-triangle" :size="18" class="alert-icon" />
        <span class="alert-message">{{ pageError }}</span>
      </div>
      <button
        type="button"
        class="alert-close-btn"
        aria-label="Đóng thông báo"
        @click="pageError = null"
      >
        <AppIcon name="x" :size="14" />
      </button>
    </div>

    <!-- Error State (when initial video options query fails) -->
    <ErrorState
      v-if="pageError && videoOptions.length === 0 && !isLoadingOptions"
      title="Không thể tải danh sách video"
      :message="pageError"
      retry-text="Thử lại"
      :show-retry="true"
      @retry="loadVideoOptions"
    />

    <!-- Workspace Main Layout: 2 Columns on Desktop -->
    <div v-else class="studio-workspace-grid">
      <!-- LEFT COLUMN: Source Explorer (36–40%) -->
      <aside class="workspace-left-rail">
        <AiSourceExplorer
          :videos="videoOptions"
          :selected-id="selectedVideoId"
          :loading="isLoadingOptions"
          @select="handleSelectVideo"
        />
      </aside>

      <!-- RIGHT COLUMN: Selected Source & Analysis Control / Results (60–64%) -->
      <main class="workspace-right-stage">
        <!-- 1. Selected Source Panel -->
        <AiSelectedSource
          :video="selectedVideo"
          :is-analyzing="isAnalyzing"
          :is-adding-to-production="isAddingToProduction"
          @analyze="handleAnalyzeClick"
          @add-to-production="handleAddToProduction"
        />

        <!-- 2. Analysis Loading Skeleton Document (Keeps Source Visible!) -->
        <AiAnalysisSkeleton v-if="isAnalyzing" />

        <!-- 3. Analysis Results (When Analysis is Ready and not analyzing) -->
        <div v-if="analysisResult && !isAnalyzing" class="analysis-results-wrap">
          <!-- A. Intelligence Brief: 2 Columns -->
          <AiIntelligenceBrief
            :summary="analysisResult.summary"
            :content-angle="analysisResult.content_angle"
            :copied-all="copiedAll"
            @copy-all="copyAllAnalysis"
          />

          <!-- B. Attention Signals -->
          <AiAttentionSignals
            :signals="analysisResult.why_it_may_attract_attention"
          />

          <!-- C. Creative Output Workspace: Segmented Tabs (Titles / Thumbnails / Hooks) -->
          <AiCreativeWorkspace
            :title-ideas="analysisResult.title_ideas"
            :thumbnail-concepts="analysisResult.thumbnail_concepts"
            :hook-ideas="analysisResult.hook_ideas"
            :active-mode="activeOutputMode"
            :copied-key="copiedKey"
            @update:active-mode="handleOutputModeChange"
            @copy-item="copySingleItem"
          />

          <!-- D. Originality Note: Informational Band -->
          <AiOriginalityNote
            :note="analysisResult.originality_note"
          />
        </div>
      </main>
    </div>

    <!-- Unified Floating Toast Banner -->
    <div
      v-if="toast"
      class="studio-toast-banner"
      :class="`toast-${toast.type}`"
      role="status"
      aria-live="polite"
    >
      <AppIcon :name="toast.type === 'success' ? 'check' : 'alert-circle'" :size="16" />
      <span>{{ toast.message }}</span>
    </div>

    <!-- Access Key Prompt Modal -->
    <AccessKeyPromptModal
      v-model="showAccessKeyModal"
      :initial-error="accessKeyError"
      @confirmed="onAccessKeyConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';
import AiSourceExplorer from '@/components/ai-content/AiSourceExplorer.vue';
import AiSelectedSource from '@/components/ai-content/AiSelectedSource.vue';
import AiAnalysisSkeleton from '@/components/ai-content/AiAnalysisSkeleton.vue';
import AiIntelligenceBrief from '@/components/ai-content/AiIntelligenceBrief.vue';
import AiAttentionSignals from '@/components/ai-content/AiAttentionSignals.vue';
import AiCreativeWorkspace from '@/components/ai-content/AiCreativeWorkspace.vue';
import AiOriginalityNote from '@/components/ai-content/AiOriginalityNote.vue';

import {
  aiContentService,
  setStoredAccessKey,
  getStoredAccessKey,
  AccessKeyRequiredError,
} from '@/services/ai-content-service';
import { productionService } from '@/services/production-service';
import {
  type AiContentAnalysis,
  type AiVideoOption,
  type AiOutputMode,
  AI_CONTENT_OUTPUT_MODE_STORAGE_KEY,
} from '@/types/ai-content';

const route = useRoute();

// States
const videoOptions = ref<AiVideoOption[]>([]);
const isLoadingOptions = ref(false);
const selectedVideoId = ref('');
const selectedVideo = ref<AiVideoOption | null>(null);

const isAnalyzing = ref(false);
const isAddingToProduction = ref(false);
const analysisResult = ref<AiContentAnalysis | null>(null);
const pageError = ref<string | null>(null);

// Async / Race Condition Protection IDs
let selectionRequestId = 0;
let analysisRequestId = 0;

// Output mode persistence with safe storage helper
function getSafeOutputMode(): AiOutputMode {
  try {
    const raw = localStorage.getItem(AI_CONTENT_OUTPUT_MODE_STORAGE_KEY);
    if (raw === 'titles' || raw === 'thumbnails' || raw === 'hooks') {
      return raw;
    }
  } catch (e) {
    console.warn('Cannot read output mode from localStorage:', e);
  }
  return 'titles';
}

const activeOutputMode = ref<AiOutputMode>(getSafeOutputMode());

function handleOutputModeChange(mode: AiOutputMode) {
  const safeMode: AiOutputMode = (mode === 'titles' || mode === 'thumbnails' || mode === 'hooks') ? mode : 'titles';
  activeOutputMode.value = safeMode;
  try {
    localStorage.setItem(AI_CONTENT_OUTPUT_MODE_STORAGE_KEY, safeMode);
  } catch (e) {
    console.warn('Cannot persist output mode to localStorage:', e);
  }
}

// Access Key Modal state
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
let pendingKeyRetry: ((key: string) => Promise<void>) | null = null;

// Copy tracking
const copiedAll = ref(false);
const copiedKey = ref<string | null>(null);

// Unified Toast
type ToastType = 'success' | 'error';
const toast = ref<{ message: string; type: ToastType } | null>(null);
let toastTimeout: any = null;

function showToast(message: string, type: ToastType = 'success') {
  if (toastTimeout) clearTimeout(toastTimeout);
  toast.value = { message, type };
  toastTimeout = setTimeout(() => {
    toast.value = null;
  }, 2800);
}

onMounted(async () => {
  document.title = 'Trợ Lý Nội Dung AI — Bắt Bài Đối Thủ';
  await loadVideoOptions();
  await checkRouteQueryParam();
});

watch(
  () => route?.query?.video,
  async () => {
    await checkRouteQueryParam();
  }
);

function clearSelection() {
  ++selectionRequestId;
  ++analysisRequestId;
  selectedVideoId.value = '';
  selectedVideo.value = null;
  analysisResult.value = null;
  isAnalyzing.value = false;
  pageError.value = null;
}

async function loadVideoOptions() {
  isLoadingOptions.value = true;
  pageError.value = null;
  try {
    const list = await aiContentService.fetchAiVideoOptions();
    videoOptions.value = list;
  } catch (err: any) {
    pageError.value = err.message || 'Không thể tải danh sách video.';
  } finally {
    isLoadingOptions.value = false;
  }
}

async function checkRouteQueryParam() {
  const qVideoId = route?.query?.video as string | undefined;
  if (qVideoId && typeof qVideoId === 'string' && qVideoId.trim().length > 0) {
    await selectVideoById(qVideoId.trim());
  } else {
    clearSelection();
  }
}

async function handleSelectVideo(id: string) {
  await selectVideoById(id);
}

async function selectVideoById(id: string) {
  // Race protection for video selection
  const currentReqId = ++selectionRequestId;

  // Invalidate any pending analysis for previously selected video
  ++analysisRequestId;
  isAnalyzing.value = false;
  analysisResult.value = null;
  pageError.value = null;

  try {
    const detail = await aiContentService.fetchVideoContext(id);
    if (currentReqId !== selectionRequestId) return; // Stale request, ignore

    if (detail) {
      selectedVideo.value = detail;
      selectedVideoId.value = detail.id;
    } else {
      // Fallback: look in fetched videoOptions list only when service returns null
      const fallback = videoOptions.value.find(v => v.id === id);
      if (fallback) {
        selectedVideo.value = fallback;
        selectedVideoId.value = fallback.id;
      } else {
        selectedVideo.value = null;
        selectedVideoId.value = '';
        pageError.value = 'Không tìm thấy video đã chọn trong hệ thống.';
      }
    }
  } catch (err: any) {
    if (currentReqId !== selectionRequestId) return;
    // Do NOT swallow error or fallback silently when service throws!
    selectedVideo.value = null;
    selectedVideoId.value = '';
    pageError.value = err.message || 'Không thể tải thông tin video.';
  }
}

async function handleAnalyzeClick() {
  if (!selectedVideo.value) return;
  pageError.value = null;

  const key = getStoredAccessKey();
  if (!key) {
    promptForAccessKey(async (k: string) => {
      await runAnalysis(k);
    });
    return;
  }

  await runAnalysis(key);
}

function promptForAccessKey(action: (key: string) => Promise<void>) {
  accessKeyError.value = null;
  pendingKeyRetry = action;
  showAccessKeyModal.value = true;
}

async function onAccessKeyConfirmed(key: string) {
  setStoredAccessKey(key);
  showAccessKeyModal.value = false;
  if (pendingKeyRetry) {
    const action = pendingKeyRetry;
    pendingKeyRetry = null;
    await action(key);
  }
}

async function runAnalysis(key: string) {
  if (!selectedVideo.value) return;

  const currentReqId = ++analysisRequestId;
  const targetSourceVideoId = selectedVideo.value.id;

  isAnalyzing.value = true;
  pageError.value = null;

  try {
    const result = await aiContentService.analyzeVideoContent(targetSourceVideoId, key);

    // Strict race check:
    // Only apply if this request is still current AND currently selected video has not changed!
    if (currentReqId !== analysisRequestId || selectedVideo.value?.id !== targetSourceVideoId) {
      return;
    }

    analysisResult.value = result;
  } catch (err: any) {
    if (currentReqId !== analysisRequestId) return;

    if (err instanceof AccessKeyRequiredError) {
      accessKeyError.value = err.message;
      promptForAccessKey(async (k: string) => {
        await runAnalysis(k);
      });
    } else {
      pageError.value = err.message || 'Đã xảy ra lỗi khi phân tích nội dung.';
    }
  } finally {
    if (currentReqId === analysisRequestId) {
      isAnalyzing.value = false;
    }
  }
}

async function handleAddToProduction() {
  if (!selectedVideo.value || isAddingToProduction.value) return;

  const key = getStoredAccessKey();
  if (!key) {
    promptForAccessKey(async (k: string) => {
      await addToProductionWithKey(k);
    });
    return;
  }

  await addToProductionWithKey(key);
}

async function addToProductionWithKey(key: string) {
  if (!selectedVideo.value) return;
  isAddingToProduction.value = true;
  try {
    await productionService.createProductionItem(
      {
        sourceVideoId: selectedVideo.value.id,
        workingTitle: selectedVideo.value.title,
      },
      key
    );
    showToast('Đã đưa video vào Tiến Độ Sản Xuất.', 'success');
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError) {
      accessKeyError.value = err.message;
      promptForAccessKey(async (k: string) => {
        await addToProductionWithKey(k);
      });
    } else if (err?.message?.includes('đã có trong quy trình') || err?.message?.includes('409')) {
      showToast('Video này đã có trong Tiến Độ Sản Xuất.', 'error');
    } else {
      showToast(err.message || 'Không thể đưa vào Tiến Độ Sản Xuất.', 'error');
    }
  } finally {
    isAddingToProduction.value = false;
  }
}

async function copySingleItem(text: string, id: string) {
  try {
    await navigator.clipboard.writeText(text);
    copiedKey.value = id;
    showToast('Đã sao chép vào bộ nhớ tạm!', 'success');
    setTimeout(() => {
      if (copiedKey.value === id) {
        copiedKey.value = null;
      }
    }, 2000);
  } catch {
    showToast('Không thể sao chép vào bộ nhớ tạm.', 'error');
  }
}

async function copyAllAnalysis() {
  if (!analysisResult.value || !selectedVideo.value) return;
  const fullText = aiContentService.formatAnalysisToPlainText(
    analysisResult.value,
    selectedVideo.value.title,
    selectedVideo.value.channel_name
  );

  try {
    await navigator.clipboard.writeText(fullText);
    copiedAll.value = true;
    showToast('Đã sao chép toàn bộ nội dung phân tích!', 'success');
    setTimeout(() => {
      copiedAll.value = false;
    }, 2500);
  } catch {
    showToast('Không thể sao chép vào bộ nhớ tạm.', 'error');
  }
}
</script>

<style scoped>
.content-intelligence-studio {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 0 40px;
}

.studio-alert-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: #dc2626;
}

[data-theme="dark"] .studio-alert-banner {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  font-weight: 500;
}

.alert-icon {
  flex-shrink: 0;
}

.alert-close-btn {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: inline-flex;
}

.studio-workspace-grid {
  display: grid;
  grid-template-columns: 38% 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1024px) {
  .studio-workspace-grid {
    grid-template-columns: 320px 1fr;
    gap: 18px;
  }
}

@media (max-width: 860px) {
  .studio-workspace-grid {
    grid-template-columns: 1fr;
  }
}

.workspace-left-rail {
  position: sticky;
  top: 20px;
}

@media (max-width: 860px) {
  .workspace-left-rail {
    position: static;
  }
}

.workspace-right-stage {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.analysis-results-wrap {
  animation: fadeIn 0.2s ease-out;
}

/* Unified Floating Toast */
.studio-toast-banner {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
  animation: slideInToast 0.18s ease-out;
}

.toast-success {
  background: #0f172a;
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .toast-success {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.15);
}

.toast-error {
  background: #dc2626;
  color: #ffffff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInToast {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .analysis-results-wrap {
    animation: none !important;
  }
  .studio-toast-banner {
    animation: none !important;
  }
}
</style>
