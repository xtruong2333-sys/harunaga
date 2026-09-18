<template>
  <div class="video-investigation-workspace">
    <!-- Top Action & Navigation Bar -->
    <div class="top-nav-bar">
      <div class="nav-left">
        <router-link to="/videos" class="btn-back">
          <AppIcon name="arrow-left" size="16" />
          <span>Quay Lại Video Đang Tăng</span>
        </router-link>
        <span class="nav-sep">/</span>
        <span class="nav-kicker">VIDEO INVESTIGATION WORKSPACE</span>
      </div>

      <div class="nav-right" v-if="video">
        <button
          type="button"
          class="btn-refresh"
          :disabled="loading"
          @click="loadVideoDetail"
          title="Tải lại dữ liệu từ hệ thống"
        >
          <AppIcon name="refresh" size="14" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading && !video" class="skeleton-container">
      <div class="skeleton-card skeleton-hero"></div>
      <div class="skeleton-grid-2">
        <div class="skeleton-card skeleton-chart"></div>
        <div class="skeleton-card skeleton-summary"></div>
      </div>
      <div class="skeleton-card skeleton-table"></div>
    </div>

    <!-- Error / Not Found State -->
    <div v-else-if="error || !video" class="error-container">
      <div class="error-card surface-card">
        <div class="error-icon-box">
          <AppIcon name="alert-triangle" size="36" />
        </div>
        <h2 class="error-title">
          {{ error || 'Không tìm thấy video này.' }}
        </h2>
        <p class="error-desc">
          Video có thể đã bị gỡ khỏi danh sách theo dõi hoặc liên kết không hợp lệ.
        </p>
        <router-link to="/videos" class="btn-return">
          <AppIcon name="arrow-left" size="16" />
          <span>Quay Lại Danh Sách Video</span>
        </router-link>
      </div>
    </div>

    <!-- Main Investigation Console -->
    <main v-else class="workspace-content">
      <!-- 1. Investigation Hero (Thumbnail, Title, VPH, Actions) -->
      <VideoInvestigationHero
        :video="video"
        :production-item-id="productionItemId"
        :is-adding-to-production="isAddingToProduction"
        @add-production="handleAddToProduction"
      />

      <!-- 2. Growth Analysis & Signal Summary -->
      <VideoGrowthAnalysis :video="video" />

      <!-- 3. Snapshot History Table -->
      <VideoSnapshotHistory :snapshots="video.snapshots" />

      <!-- 4. Channel Context & Alert Context (2 Columns) -->
      <div class="context-columns-grid">
        <VideoChannelContext :channel="video.channel" />
        <VideoAlertContext :alert="video.alert" :video-id="video.id" />
      </div>
    </main>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast-notification">
      {{ toastMessage }}
    </div>

    <!-- Access Key Prompt Modal -->
    <AccessKeyPromptModal
      :model-value="showAccessKeyModal"
      @update:model-value="onAccessModalChange"
      :initial-error="accessKeyError"
      @confirmed="onAccessKeyConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';
import VideoInvestigationHero from '@/components/video-detail/VideoInvestigationHero.vue';
import VideoGrowthAnalysis from '@/components/video-detail/VideoGrowthAnalysis.vue';
import VideoSnapshotHistory from '@/components/video-detail/VideoSnapshotHistory.vue';
import VideoChannelContext from '@/components/video-detail/VideoChannelContext.vue';
import VideoAlertContext from '@/components/video-detail/VideoAlertContext.vue';
import { videoService } from '@/services/video-service';
import {
  productionService,
  setStoredAccessKey,
  getStoredAccessKey,
  AccessKeyRequiredError,
} from '@/services/production-service';
import type { VideoDetail } from '@/types/video';

const route = useRoute();
const videoId = String(route?.params?.id || '');

const video = ref<VideoDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Production flow state
const productionItemId = ref<string | null>(null);
const isAddingToProduction = ref(false);
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
const toastMessage = ref<string | null>(null);
let toastTimer: any = null;

function showToast(msg: string) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
}

function onAccessModalChange(isOpen: boolean) {
  showAccessKeyModal.value = isOpen;
  if (!isOpen) {
    accessKeyError.value = null;
    isAddingToProduction.value = false;
  }
}

async function checkProductionStatus() {
  if (!videoId) return;
  try {
    const existingId = await productionService.checkVideoInProduction(videoId);
    productionItemId.value = existingId;
  } catch {
    // Non-blocking
  }
}

async function handleAddToProduction() {
  if (!video.value || isAddingToProduction.value) return;
  isAddingToProduction.value = true;
  accessKeyError.value = null;

  try {
    const measuredVphText = video.value.latestMeasuredVph !== null && video.value.latestMeasuredVph !== undefined
      ? `${video.value.latestMeasuredVph}`
      : 'Chưa đủ dữ liệu';

    const item = await productionService.createProductionItem(
      {
        sourceVideoId: video.value.id,
        workingTitle: `Ý tưởng từ: ${video.value.title}`,
        notes: `Video gốc: ${video.value.url}\nKênh: ${video.value.channel.name}\nVPH đo được: ${measuredVphText}`,
        priority: 'high',
      },
      getStoredAccessKey() || undefined
    );
    productionItemId.value = item.id;
    showToast('Đã đưa video vào Tiến Độ Sản Xuất!');
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.message?.includes('access key') || err.message?.includes('Mã truy cập')) {
      accessKeyError.value = err.message;
      showAccessKeyModal.value = true;
    } else {
      showToast(err.message || 'Không thể đưa video vào sản xuất.');
    }
  } finally {
    isAddingToProduction.value = false;
  }
}

async function onAccessKeyConfirmed(key: string) {
  setStoredAccessKey(key);
  showAccessKeyModal.value = false;
  await handleAddToProduction();
}

async function loadVideoDetail() {
  loading.value = true;
  error.value = null;
  try {
    const data = await videoService.fetchVideoDetail(videoId);
    video.value = data;
    await checkProductionStatus();
  } catch (err: any) {
    error.value = err.message || 'Không thể tải chi tiết video.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadVideoDetail();
});
</script>

<style scoped>
.video-investigation-workspace {
  width: 100%;
  max-width: none;
  padding-bottom: 60px;
}

.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(30, 60, 90, 0.04);
  flex-wrap: wrap;
  gap: 12px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary, #0F172A);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.15s ease;
}

.btn-back:hover {
  color: var(--primary, #2563EB);
}

.nav-sep {
  color: #CBD5E1;
}

.nav-kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted, #64748B);
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--bg-inset, #F8FAFC);
  color: var(--text-primary, #0F172A);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.workspace-content {
  display: flex;
  flex-direction: column;
}

.context-columns-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

/* Skeletons */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-card {
  border-radius: 14px;
  background: linear-gradient(90deg, #EEF4F8 25%, #E2E8F0 50%, #EEF4F8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-hero { height: 260px; }
.skeleton-grid-2 {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 20px;
}
.skeleton-chart { height: 220px; }
.skeleton-summary { height: 220px; }
.skeleton-table { height: 240px; }

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Error State */
.error-container {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

.error-card {
  padding: 48px 32px;
  text-align: center;
  max-width: 480px;
  border-radius: 16px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.error-icon-box {
  color: #DC2626;
  margin-bottom: 8px;
}

.error-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  margin: 0;
}

.error-desc {
  font-size: 13.5px;
  color: var(--text-secondary, #64748B);
  margin: 0 0 8px 0;
}

.btn-return {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid #BFDBFE;
}

@media (max-width: 1024px) {
  .context-columns-grid {
    grid-template-columns: 1fr;
  }
}

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 10px;
  background: #0F172A;
  color: #FFFFFF;
  font-size: 13.5px;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: toastIn 0.2s ease;
}

@keyframes toastIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
