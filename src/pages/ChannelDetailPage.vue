<template>
  <div class="competitor-intelligence-profile">
    <!-- Loading Skeletons -->
    <div v-if="loading && !analysis" class="skeleton-container">
      <div class="skeleton-hero"></div>
      <div class="skeleton-metrics"></div>
      <div class="skeleton-signal"></div>
      <div class="skeleton-grid-2">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>

    <!-- Error / Not Found State -->
    <div v-else-if="error || !analysis" class="error-container">
      <div class="error-card surface-card">
        <div class="error-icon-box">
          <AppIcon name="alert-triangle" size="36" />
        </div>
        <h2 class="error-title">
          {{ error || 'Không tìm thấy kênh này.' }}
        </h2>
        <p class="error-desc">
          Kênh có thể đã bị xóa hoặc liên kết không hợp lệ. Vui lòng kiểm tra lại danh sách theo dõi.
        </p>
        <router-link to="/kenh-theo-doi" class="btn-return">
          <AppIcon name="arrow-left" size="16" />
          <span>Quay Lại Kênh Theo Dõi</span>
        </router-link>
      </div>
    </div>

    <!-- Main Intelligence Profile Workspace -->
    <main v-else class="profile-content">
      <!-- 1. Competitor Identity Hero -->
      <ChannelProfileHero
        :channel="analysis.channel"
        :loading="loading"
        :is-pausing-or-resuming="isPausingOrResuming"
        :is-archiving-or-restoring="isArchivingOrRestoring"
        :is-collecting="isCollecting"
        :disabled="interactionLocked"
        @refresh="!interactionLocked && loadChannelData()"
        @edit="!interactionLocked && (showEditModal = true)"
        @toggle-pause="handleTogglePause"
        @toggle-archive="handleToggleArchive"
        @trigger-collection="handleTriggerCollection"
      />

      <!-- Notification Banner if any -->
      <div v-if="notificationMsg" class="notification-banner">
        <AppIcon name="info" size="16" />
        <span>{{ notificationMsg }}</span>
      </div>

      <!-- 2. Performance Strip & Segmented Growth Distribution -->
      <ChannelPerformanceStrip :analysis="analysis" />

      <!-- 3. Top Signals (Video Tăng Nhanh Nhất) -->
      <ChannelTopSignal :analysis="analysis" />

      <!-- 4. VPH Horizontal Comparison Chart -->
      <ChannelVphChart
        :videos="analysis.topVphChartVideos"
        :threshold="analysis.channel.alertVphThreshold"
      />

      <!-- 5. Publishing Cadence & Monitoring Config (2 Columns) -->
      <div class="rhythm-config-grid">
        <ChannelPublishingRhythm :videos="analysis.publishingVideos || analysis.latestVideos" />
        <ChannelMonitoringConfig
          :channel="analysis.channel"
          @edit="showEditModal = true"
        />
      </div>

      <!-- 6. Alert & Scan Activity Feed -->
      <ChannelActivityFeed
        :alert-summary="analysis.alertSummary"
        :last-scan-at="analysis.channel.lastScanAt"
        @trigger-collection="handleTriggerCollection"
      />
    </main>

    <!-- Channel Edit Modal -->
    <ChannelEditModal
      v-model="showEditModal"
      :channel="analysis ? analysis.channel : null"
      :is-submitting="isSavingEdit"
      @save="handleSaveEdit"
    />

    <!-- Access Key Prompt Modal -->
    <AccessKeyPromptModal
      :model-value="showAccessKeyModal"
      @update:model-value="handleAccessModalChange"
      :initial-error="accessKeyError"
      @confirmed="onAccessKeyConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';
import ChannelProfileHero from '@/components/channel-detail/ChannelProfileHero.vue';
import ChannelPerformanceStrip from '@/components/channel-detail/ChannelPerformanceStrip.vue';
import ChannelTopSignal from '@/components/channel-detail/ChannelTopSignal.vue';
import ChannelPublishingRhythm from '@/components/channel-detail/ChannelPublishingRhythm.vue';
import ChannelMonitoringConfig from '@/components/channel-detail/ChannelMonitoringConfig.vue';
import ChannelActivityFeed from '@/components/channel-detail/ChannelActivityFeed.vue';
import ChannelEditModal from '@/components/channel-detail/ChannelEditModal.vue';
import ChannelVphChart from '@/features/channels/components/ChannelVphChart.vue';
import { channelAnalysisService } from '@/services/channel-analysis-service';
import {
  channelService,
  setStoredAccessKey,
  AccessKeyRequiredError,
} from '@/services/channel-service';
import { collectorService } from '@/services/collector-service';
import type { ChannelAnalysis } from '@/types/channel-analysis';

const route = useRoute();
const channelId = String(route.params.id || '');

const analysis = ref<ChannelAnalysis | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const notificationMsg = ref<string | null>(null);

// Modals and action states
const showEditModal = ref(false);
const isSavingEdit = ref(false);
const isPausingOrResuming = ref(false);
const isArchivingOrRestoring = ref(false);
const isCollecting = ref(false);

const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
const pendingAction = ref<(() => Promise<void>) | null>(null);

const interactionLocked = computed(() => {
  return (
    showAccessKeyModal.value ||
    pendingAction.value !== null ||
    isSavingEdit.value ||
    isPausingOrResuming.value ||
    isArchivingOrRestoring.value ||
    isCollecting.value
  );
});

function handleAccessModalChange(isOpen: boolean) {
  showAccessKeyModal.value = isOpen;
  if (!isOpen) {
    pendingAction.value = null;
    accessKeyError.value = null;
  }
}

async function executeWithAccessKey(action: () => Promise<void>) {
  try {
    await action();
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError || err.message?.includes('access key') || err.message?.includes('Mã truy cập')) {
      pendingAction.value = action;
      accessKeyError.value = err.message || 'Vui lòng nhập Mã truy cập để thực hiện thao tác.';
      showAccessKeyModal.value = true;
    } else {
      notificationMsg.value = err.message || 'Thao tác không thành công.';
      setTimeout(() => { notificationMsg.value = null; }, 5000);
    }
  }
}

async function onAccessKeyConfirmed(key: string) {
  setStoredAccessKey(key);
  if (pendingAction.value) {
    const action = pendingAction.value;
    try {
      accessKeyError.value = null;
      await action();
      pendingAction.value = null;
      showAccessKeyModal.value = false;
      accessKeyError.value = null;
    } catch (err: any) {
      if (err instanceof AccessKeyRequiredError || err.message?.includes('access key') || err.message?.includes('Mã truy cập')) {
        pendingAction.value = action;
        accessKeyError.value = 'Mã truy cập không chính xác. Vui lòng nhập lại.';
        showAccessKeyModal.value = true;
      } else {
        pendingAction.value = null;
        showAccessKeyModal.value = false;
        notificationMsg.value = err.message || 'Thao tác không thành công.';
        setTimeout(() => { notificationMsg.value = null; }, 5000);
      }
    }
  } else {
    showAccessKeyModal.value = false;
    accessKeyError.value = null;
  }
}

async function loadChannelData() {
  if (!channelId) {
    error.value = 'Mã nhận diện kênh không hợp lệ.';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const res = await channelAnalysisService.fetchChannelAnalysis(channelId);
    if (!res) {
      error.value = 'Không tìm thấy kênh này.';
    } else {
      analysis.value = res;
      document.title = `Hồ Sơ Kênh: ${res.channel.name} — Bắt Bài Đối Thủ`;
    }
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải dữ liệu phân tích kênh.';
  } finally {
    loading.value = false;
  }
}

async function handleTogglePause() {
  if (!analysis.value || interactionLocked.value) return;
  const isCurrentlyActive = analysis.value.channel.status === 'active';
  const channelName = analysis.value.channel.name;

  await executeWithAccessKey(async () => {
    isPausingOrResuming.value = true;
    try {
      if (isCurrentlyActive) {
        await channelService.pauseChannel(channelId);
        notificationMsg.value = `Đã tạm dừng theo dõi kênh ${channelName}.`;
      } else {
        await channelService.resumeChannel(channelId);
        notificationMsg.value = `Đã tiếp tục theo dõi kênh ${channelName}.`;
      }
      await loadChannelData();
      setTimeout(() => { notificationMsg.value = null; }, 5000);
    } finally {
      isPausingOrResuming.value = false;
    }
  });
}

async function handleToggleArchive() {
  if (!analysis.value || interactionLocked.value) return;
  const isCurrentlyArchived = analysis.value.channel.status === 'archived';
  const channelName = analysis.value.channel.name;

  await executeWithAccessKey(async () => {
    isArchivingOrRestoring.value = true;
    try {
      if (isCurrentlyArchived) {
        await channelService.restoreChannel(channelId);
        notificationMsg.value = `Đã khôi phục kênh ${channelName}.`;
      } else {
        await channelService.archiveChannel(channelId);
        notificationMsg.value = `Đã lưu trữ kênh ${channelName}.`;
      }
      await loadChannelData();
      setTimeout(() => { notificationMsg.value = null; }, 5000);
    } finally {
      isArchivingOrRestoring.value = false;
    }
  });
}

async function handleSaveEdit(payload: { alertThreshold: number | null; scanLimit: number | null }) {
  if (!analysis.value || isSavingEdit.value) return;

  await executeWithAccessKey(async () => {
    isSavingEdit.value = true;
    try {
      await channelService.updateChannel(channelId, {
        alertVphThreshold: payload.alertThreshold,
        scanLimit: payload.scanLimit,
      });
      showEditModal.value = false;
      notificationMsg.value = 'Đã cập nhật cấu hình kênh thành công.';
      await loadChannelData();
      setTimeout(() => { notificationMsg.value = null; }, 5000);
    } finally {
      isSavingEdit.value = false;
    }
  });
}

async function handleTriggerCollection() {
  if (!analysis.value || interactionLocked.value) return;

  await executeWithAccessKey(async () => {
    isCollecting.value = true;
    notificationMsg.value = 'Đang kích hoạt quét dữ liệu...';
    try {
      const res = await collectorService.triggerCollection();
      if (res.skipped) {
        notificationMsg.value = res.reason || 'Đang có phiên kiểm tra khác hoạt động.';
      } else if (res.success && res.run) {
        notificationMsg.value = `Đã quét thành công: ${res.run.channelsSuccess} kênh, ${res.run.videosFound} video.`;
        await loadChannelData();
      }
      setTimeout(() => { notificationMsg.value = null; }, 6000);
    } catch (err: any) {
      notificationMsg.value = err.message || 'Không thể quét dữ liệu.';
    } finally {
      isCollecting.value = false;
    }
  });
}

onMounted(() => {
  loadChannelData();
});
</script>

<style scoped>
.competitor-intelligence-profile {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding-bottom: 60px;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.notification-banner {
  padding: 12px 16px;
  border-radius: 10px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1E40AF;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rhythm-config-grid {
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

.skeleton-hero {
  height: 220px;
  border-radius: 16px;
  background: linear-gradient(90deg, #EEF4F8 25%, #E2E8F0 50%, #EEF4F8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-metrics {
  height: 140px;
  border-radius: 14px;
  background: linear-gradient(90deg, #EEF4F8 25%, #E2E8F0 50%, #EEF4F8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-signal {
  height: 280px;
  border-radius: 16px;
  background: linear-gradient(90deg, #EEF4F8 25%, #E2E8F0 50%, #EEF4F8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.skeleton-card {
  height: 240px;
  border-radius: 14px;
  background: linear-gradient(90deg, #EEF4F8 25%, #E2E8F0 50%, #EEF4F8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

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
  .rhythm-config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
