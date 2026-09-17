<template>
  <div class="ai-content-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">
          <AppIcon name="sparkles" size="28" class="title-icon" />
          <span>Trợ Lý Nội Dung AI</span>
        </h1>
        <p class="page-description">
          Phân tích video đối thủ và tạo hướng nội dung mới dựa trên dữ liệu đang theo dõi.
        </p>
      </div>
    </div>

    <!-- Error Alert Banner -->
    <div v-if="pageError" class="alert-banner error-banner">
      <AppIcon name="alert" size="20" class="alert-icon" />
      <div class="alert-content">
        <div class="alert-title">Thông báo hệ thống</div>
        <div class="alert-message">{{ pageError }}</div>
      </div>
      <button v-if="selectedVideo" class="btn btn-secondary btn-sm" @click="pageError = null">
        Đóng
      </button>
    </div>

    <!-- Copy Toast Banner -->
    <div v-if="copyToast" class="toast-banner">
      <AppIcon name="check" size="18" />
      <span>{{ copyToast }}</span>
    </div>

    <!-- Section: Chọn Video Đối Thủ -->
    <div class="card selector-card">
      <div class="selector-header">
        <label class="selector-label" for="video-select">
          <AppIcon name="video" size="18" />
          <span>Chọn video đối thủ cần phân tích</span>
        </label>
        <span class="video-count-badge" v-if="videoOptions.length">
          {{ videoOptions.length }} video đang theo dõi
        </span>
      </div>

      <div class="selector-controls">
        <!-- Search filter input -->
        <div class="search-box">
          <AppIcon name="search" size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm theo tên video hoặc kênh đối thủ..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">
            <AppIcon name="x" size="14" />
          </button>
        </div>

        <!-- Video dropdown selector -->
        <select
          id="video-select"
          v-model="selectedVideoId"
          class="video-dropdown"
          :disabled="isLoadingOptions"
          @change="onVideoSelectChange"
        >
          <option value="" disabled>-- Chọn video để phân tích --</option>
          <option
            v-for="v in filteredVideoOptions"
            :key="v.id"
            :value="v.id"
          >
            [{{ v.channel_name }}] {{ truncate(v.title, 65) }} {{ formatVphBadge(v.latest_measured_vph) }}
          </option>
        </select>
      </div>

      <div v-if="isLoadingOptions" class="selector-loading">
        <div class="spinner-sm"></div>
        <span>Đang tải danh sách video...</span>
      </div>
    </div>

    <!-- Section: Real Video Context Card (Hiển thị khi đã chọn video) -->
    <div v-if="selectedVideo" class="card context-card">
      <div class="context-card-inner">
        <div class="context-thumbnail-col">
          <img
            :src="selectedVideo.thumbnail_url"
            :alt="selectedVideo.title"
            class="context-thumbnail"
            loading="lazy"
            @error="onThumbError"
          />
          <a
            :href="`https://www.youtube.com/watch?v=${selectedVideo.youtube_video_id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="yt-link-btn"
          >
            <AppIcon name="external" size="14" />
            <span>Mở trên YouTube</span>
          </a>
        </div>

        <div class="context-info-col">
          <div class="context-channel-tag">
            <AppIcon name="tv" size="14" />
            <span>{{ selectedVideo.channel_name }}</span>
          </div>

          <h2 class="context-title">
            <router-link :to="`/videos/${selectedVideo.id}`" class="title-link">
              {{ selectedVideo.title }}
            </router-link>
          </h2>

          <!-- Video Metrics Grid -->
          <div class="context-metrics-grid">
            <div class="metric-box">
              <span class="metric-label">Lượt xem hiện tại</span>
              <span class="metric-value">
                {{ selectedVideo.latest_view_count !== null ? selectedVideo.latest_view_count.toLocaleString('vi-VN') : '—' }}
              </span>
            </div>

            <div class="metric-box">
              <span class="metric-label">Tốc độ tăng trưởng (VPH)</span>
              <span class="metric-value" :class="getVphClass(selectedVideo.latest_measured_vph, selectedVideo.alert_vph_threshold)">
                {{ selectedVideo.latest_measured_vph !== null ? `${selectedVideo.latest_measured_vph.toLocaleString('vi-VN')} VPH` : 'Chưa đủ dữ liệu' }}
              </span>
            </div>

            <div class="metric-box" v-if="selectedVideo.view_delta !== undefined">
              <span class="metric-label">Tăng trưởng gần nhất</span>
              <span class="metric-value text-green">
                {{ selectedVideo.view_delta !== null ? `+${selectedVideo.view_delta.toLocaleString('vi-VN')} view` : 'Chưa đủ 2 lần quét' }}
              </span>
            </div>

            <div class="metric-box">
              <span class="metric-label">Thời gian đăng</span>
              <span class="metric-value font-normal">
                {{ formatDate(selectedVideo.published_at) }}
              </span>
            </div>
          </div>

          <!-- Action Call: Phân Tích Nội Dung -->
          <div class="context-actions">
            <button
              class="btn btn-analyze"
              :disabled="isAnalyzing"
              @click="handleAnalyzeClick"
            >
              <span v-if="isAnalyzing" class="spinner-sm"></span>
              <AppIcon v-else name="sparkles" size="18" />
              <span>{{ isAnalyzing ? 'Đang phân tích nội dung...' : 'Phân Tích Nội Dung' }}</span>
            </button>

            <router-link
              :to="`/videos/${selectedVideo.id}`"
              class="btn btn-secondary btn-detail"
            >
              <AppIcon name="activity" size="16" />
              <span>Xem lịch sử quét</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State: Khi chưa chọn video -->
    <div v-else-if="!isLoadingOptions" class="card empty-state-card">
      <div class="empty-icon-wrap">
        <AppIcon name="sparkles" size="36" class="empty-icon" />
      </div>
      <h3 class="empty-title">Chọn một video đối thủ để bắt đầu</h3>
      <p class="empty-desc">
        Chọn một video đang tăng trưởng từ danh sách phía trên và nhấn "Phân Tích Nội Dung" để AI khám phá góc nhìn, gợi ý tiêu đề và hook mở đầu video.
      </p>
    </div>

    <!-- Loading Skeleton: Trong lúc AI đang phân tích -->
    <div v-if="isAnalyzing" class="card loading-skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-line title-line"></div>
        <div class="skeleton-line sub-line"></div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-box"></div>
        <div class="skeleton-box"></div>
        <div class="skeleton-box"></div>
      </div>
      <p class="skeleton-text">
        <span class="spinner-sm"></span>
        AI đang phân tích góc khai thác và xây dựng gợi ý sáng tạo mới...
      </p>
    </div>

    <!-- Section: Kết quả phân tích (Hiển thị khi đã có analysisResult) -->
    <div v-if="analysisResult && !isAnalyzing" class="results-container">
      <!-- Result Top Bar -->
      <div class="results-header-bar">
        <div class="results-header-title">
          <AppIcon name="sparkles" size="22" class="sparkle-gold" />
          <span>Kết Quả Phân Tích & Đề Xuất Sáng Tạo</span>
        </div>
        <button
          class="btn btn-secondary btn-copy-all"
          @click="copyAllAnalysis"
        >
          <AppIcon :name="copiedAll ? 'check' : 'copy'" size="16" />
          <span>{{ copiedAll ? 'Đã sao chép!' : 'Sao Chép Toàn Bộ' }}</span>
        </button>
      </div>

      <!-- 1. Tóm Tắt & Góc Tiếp Cận -->
      <div class="card result-card">
        <div class="result-section-title">
          <span class="section-badge">1</span>
          <h3>Tóm Tắt & Góc Khai Thác Nội Dung</h3>
        </div>
        <div class="angle-grid">
          <div class="angle-box">
            <span class="box-label">Tóm tắt chủ đề video</span>
            <p class="box-content">{{ analysisResult.summary }}</p>
          </div>
          <div class="angle-box">
            <span class="box-label">Góc tiếp cận của đối thủ</span>
            <p class="box-content">{{ analysisResult.content_angle }}</p>
          </div>
        </div>
      </div>

      <!-- 2. Yếu Tố Thu Hút Người Xem -->
      <div class="card result-card">
        <div class="result-section-title">
          <span class="section-badge">2</span>
          <h3>Điểm Thu Hút Có Thể Nhìn Thấy</h3>
        </div>
        <ul class="attention-list">
          <li
            v-for="(item, idx) in analysisResult.why_it_may_attract_attention"
            :key="idx"
            class="attention-item"
          >
            <AppIcon name="check-circle" size="18" class="check-icon" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>

      <!-- 3. 5 Đề Xuất Tiêu Đề Mới -->
      <div class="card result-card">
        <div class="result-section-title">
          <span class="section-badge">3</span>
          <h3>5 Đề Xuất Tiêu Đề Mới (Phái sinh & Độc lập)</h3>
        </div>
        <div class="titles-list">
          <div
            v-for="(t, idx) in analysisResult.title_ideas"
            :key="idx"
            class="title-idea-item"
          >
            <div class="title-idea-left">
              <span class="title-num">{{ idx + 1 }}</span>
              <span class="title-text">{{ t }}</span>
            </div>
            <button
              class="btn btn-sm btn-copy-item"
              @click="copySingleItem(t, `title-${idx}`)"
              :title="copiedItems[`title-${idx}`] ? 'Đã sao chép' : 'Sao chép tiêu đề'"
            >
              <AppIcon :name="copiedItems[`title-${idx}`] ? 'check' : 'copy'" size="14" />
              <span>{{ copiedItems[`title-${idx}`] ? 'Đã chép' : 'Sao chép' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 4. 3 Concept Thumbnail Gợi Ý -->
      <div class="card result-card">
        <div class="result-section-title">
          <span class="section-badge">4</span>
          <h3>3 Concept Thumbnail Gợi Ý</h3>
        </div>
        <div class="thumbnail-concepts-grid">
          <div
            v-for="(thumb, idx) in analysisResult.thumbnail_concepts"
            :key="idx"
            class="thumb-concept-card"
          >
            <div class="thumb-concept-header">
              <span class="thumb-badge">Concept {{ idx + 1 }}</span>
              <h4 class="thumb-title">{{ thumb.concept }}</h4>
            </div>
            <div class="thumb-concept-body">
              <div class="thumb-field">
                <span class="field-label">Trọng tâm hình ảnh:</span>
                <p class="field-text">{{ thumb.visual_focus }}</p>
              </div>
              <div class="thumb-overlay-box">
                <span class="overlay-label">Chữ trên ảnh (Overlay):</span>
                <span class="overlay-text">{{ thumb.text_overlay || 'Không có chữ' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. 3 Hook Mở Đầu Video -->
      <div class="card result-card">
        <div class="result-section-title">
          <span class="section-badge">5</span>
          <h3>3 Hook Mở Đầu Video (0–5 Giây Đầu)</h3>
        </div>
        <div class="hooks-grid">
          <div
            v-for="(hook, idx) in analysisResult.hook_ideas"
            :key="idx"
            class="hook-card"
          >
            <div class="hook-header">
              <span class="hook-badge">Kịch bản Hook {{ idx + 1 }}</span>
              <button
                class="btn btn-sm btn-copy-item"
                @click="copySingleItem(hook, `hook-${idx}`)"
              >
                <AppIcon :name="copiedItems[`hook-${idx}`] ? 'check' : 'copy'" size="14" />
                <span>{{ copiedItems[`hook-${idx}`] ? 'Đã chép' : 'Sao chép' }}</span>
              </button>
            </div>
            <blockquote class="hook-quote">
              “{{ hook }}”
            </blockquote>
          </div>
        </div>
      </div>

      <!-- 6. Lưu Ý Về Tính Nguyên Bản -->
      <div class="card originality-card">
        <div class="originality-header">
          <AppIcon name="alert" size="20" class="originality-icon" />
          <h4 class="originality-title">Nguyên Tắc Tính Nguyên Bản (Originality)</h4>
        </div>
        <p class="originality-text">
          {{ analysisResult.originality_note }}
        </p>
      </div>

      <!-- Bottom Copy All Button -->
      <div class="bottom-actions">
        <button class="btn btn-secondary btn-copy-all" @click="copyAllAnalysis">
          <AppIcon :name="copiedAll ? 'check' : 'copy'" size="16" />
          <span>{{ copiedAll ? 'Đã sao chép toàn bộ!' : 'Sao Chép Toàn Bộ Nội Dung' }}</span>
        </button>
      </div>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import AccessKeyPromptModal from '@/components/ui/AccessKeyPromptModal.vue';
import {
  aiContentService,
  setStoredAccessKey,
  getStoredAccessKey,
  AccessKeyRequiredError,
} from '@/services/ai-content-service';
import type { AiContentAnalysis, AiVideoOption } from '@/types/ai-content';

const route = useRoute();

// States
const videoOptions = ref<AiVideoOption[]>([]);
const isLoadingOptions = ref(false);
const searchQuery = ref('');
const selectedVideoId = ref('');
const selectedVideo = ref<AiVideoOption | null>(null);

const isAnalyzing = ref(false);
const analysisResult = ref<AiContentAnalysis | null>(null);
const pageError = ref<string | null>(null);
const copyToast = ref<string | null>(null);

// Access key modal
const showAccessKeyModal = ref(false);
const accessKeyError = ref<string | null>(null);
let pendingKeyRetry: ((key: string) => Promise<void>) | null = null;

// Copy tracking
const copiedAll = ref(false);
const copiedItems = ref<Record<string, boolean>>({});

// Filtered video options
const filteredVideoOptions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return videoOptions.value;
  return videoOptions.value.filter(
    v => v.title.toLowerCase().includes(q) || v.channel_name.toLowerCase().includes(q)
  );
});

onMounted(async () => {
  document.title = 'Trợ Lý Nội Dung AI — Bắt Bài Đối Thủ';
  await loadVideoOptions();
  checkRouteQueryParam();
});

watch(
  () => route.query.video,
  () => {
    checkRouteQueryParam();
  }
);

async function loadVideoOptions() {
  isLoadingOptions.value = true;
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
  const qVideoId = route.query.video as string | undefined;
  if (qVideoId && typeof qVideoId === 'string') {
    selectedVideoId.value = qVideoId;
    await selectVideoById(qVideoId);
  }
}

async function onVideoSelectChange() {
  if (selectedVideoId.value) {
    await selectVideoById(selectedVideoId.value);
  } else {
    selectedVideo.value = null;
    analysisResult.value = null;
  }
}

async function selectVideoById(id: string) {
  // Reset previous result when switching video
  analysisResult.value = null;
  pageError.value = null;

  // Lấy chi tiết kèm delta
  const detail = await aiContentService.fetchVideoContext(id);
  if (detail) {
    selectedVideo.value = detail;
  } else {
    const fallback = videoOptions.value.find(v => v.id === id);
    selectedVideo.value = fallback || null;
  }
}

async function handleAnalyzeClick() {
  if (!selectedVideo.value) return;
  pageError.value = null;

  const key = getStoredAccessKey();
  if (!key) {
    promptForAccessKey();
    return;
  }

  await runAnalysis(key);
}

function promptForAccessKey() {
  accessKeyError.value = null;
  pendingKeyRetry = async (key: string) => {
    await runAnalysis(key);
  };
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

  isAnalyzing.value = true;
  pageError.value = null;

  try {
    const result = await aiContentService.analyzeVideoContent(selectedVideo.value.id, key);
    analysisResult.value = result;
  } catch (err: any) {
    if (err instanceof AccessKeyRequiredError) {
      accessKeyError.value = err.message;
      pendingKeyRetry = async (k: string) => {
        await runAnalysis(k);
      };
      showAccessKeyModal.value = true;
    } else {
      pageError.value = err.message || 'Đã xảy ra lỗi khi phân tích nội dung.';
    }
  } finally {
    isAnalyzing.value = false;
  }
}

function copySingleItem(text: string, key: string) {
  navigator.clipboard.writeText(text);
  copiedItems.value[key] = true;
  showToast('Đã sao chép vào bộ nhớ tạm!');
  setTimeout(() => {
    copiedItems.value[key] = false;
  }, 2000);
}

function copyAllAnalysis() {
  if (!analysisResult.value || !selectedVideo.value) return;
  const fullText = aiContentService.formatAnalysisToPlainText(
    analysisResult.value,
    selectedVideo.value.title,
    selectedVideo.value.channel_name
  );
  navigator.clipboard.writeText(fullText);
  copiedAll.value = true;
  showToast('Đã sao chép toàn bộ nội dung phân tích!');
  setTimeout(() => {
    copiedAll.value = false;
  }, 2500);
}

function showToast(msg: string) {
  copyToast.value = msg;
  setTimeout(() => {
    if (copyToast.value === msg) {
      copyToast.value = null;
    }
  }, 3000);
}

function truncate(str: string, maxLen: number) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

function formatVphBadge(vph: number | null) {
  if (vph === null || vph === undefined) return '(Chưa đủ dữ liệu)';
  return `(${vph.toLocaleString('vi-VN')} VPH)`;
}

function getVphClass(vph: number | null, threshold: number) {
  if (vph === null || vph === undefined) return 'text-muted';
  if (vph >= threshold) return 'text-alert-vph';
  return 'text-growth';
}

function formatDate(iso: string | null) {
  if (!iso) return 'Không rõ';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function onThumbError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60';
}
</script>

<style scoped>
.ai-content-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 60px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.title-icon {
  color: #fbbf24;
}

.page-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* Alert & Toast Banners */
.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 8px;
  font-size: 14px;
}

.error-banner {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.toast-banner {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
  background-color: #10b981;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  font-weight: 500;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Cards */
.card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
}

/* Selector Card */
.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.video-count-badge {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-elevated);
  padding: 2px 8px;
  border-radius: 12px;
}

.selector-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-tertiary);
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: var(--color-primary);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 2px;
}

.video-dropdown {
  width: 100%;
  padding: 10px 14px;
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.video-dropdown:focus {
  border-color: var(--color-primary);
}

.selector-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 10px;
}

/* Context Card */
.context-card {
  border-left: 4px solid var(--color-primary);
}

.context-card-inner {
  display: flex;
  gap: 20px;
}

.context-thumbnail-col {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.context-thumbnail {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 8px;
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
}

.yt-link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 6px 10px;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  transition: all 0.2s;
}

.yt-link-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.context-info-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.context-channel-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.context-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
}

.title-link {
  color: var(--text-primary);
  text-decoration: none;
}

.title-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.context-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  padding: 12px;
  background-color: var(--bg-base);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.metric-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.text-growth {
  color: #3b82f6;
}

.text-alert-vph {
  color: #10b981;
}

.text-green {
  color: #10b981;
}

.text-muted {
  color: var(--text-tertiary);
}

.font-normal {
  font-weight: 400;
}

.context-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.btn-analyze {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-analyze:hover:not(:disabled) {
  opacity: 0.92;
}

.btn-analyze:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-detail {
  padding: 9px 16px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}

/* Empty State Card */
.empty-state-card {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon {
  color: #fbbf24;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 500px;
  margin: 0;
  line-height: 1.5;
}

/* Loading Skeleton Card */
.loading-skeleton-card {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.skeleton-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 16px;
  background: var(--bg-elevated);
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.title-line {
  width: 40%;
  height: 20px;
}

.sub-line {
  width: 65%;
}

.skeleton-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.skeleton-box {
  height: 90px;
  background: var(--bg-elevated);
  border-radius: 8px;
  animation: pulse 1.5s infinite;
}

.skeleton-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  margin: 8px 0 0 0;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

/* Results Container */
.results-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.results-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.results-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.sparkle-gold {
  color: #fbbf24;
}

.btn-copy-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  cursor: pointer;
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-section-title h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}

/* Section 1: Angle Grid */
.angle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.angle-box {
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.box-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.box-content {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.5;
}

/* Section 2: Attention list */
.attention-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attention-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.4;
}

.check-icon {
  color: #10b981;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Section 3: Titles list */
.titles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-idea-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  gap: 12px;
}

.title-idea-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.title-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-tertiary);
  width: 20px;
}

.title-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.btn-copy-item {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid var(--border-subtle);
  background-color: var(--bg-surface);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-copy-item:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

/* Section 4: Thumbnail Concepts */
.thumbnail-concepts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.thumb-concept-card {
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thumb-concept-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.thumb-badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6366f1;
}

.thumb-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.thumb-concept-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.thumb-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.field-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.thumb-overlay-box {
  background-color: var(--bg-elevated);
  padding: 8px 10px;
  border-radius: 6px;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.overlay-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.overlay-text {
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
}

/* Section 5: Hooks Grid */
.hooks-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.hook-card {
  background-color: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hook-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hook-badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #10b981;
}

.hook-quote {
  font-size: 14px;
  font-style: italic;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.5;
  border-left: 3px solid #10b981;
  padding-left: 10px;
}

/* Section 6: Originality Note Card */
.originality-card {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.originality-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.originality-icon {
  color: #f59e0b;
}

.originality-title {
  font-size: 14px;
  font-weight: 600;
  color: #f59e0b;
  margin: 0;
}

.originality-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

/* Responsive Styles */
@media (max-width: 900px) {
  .thumbnail-concepts-grid,
  .hooks-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .context-card-inner {
    flex-direction: column;
  }
  .context-thumbnail-col {
    width: 100%;
  }
  .angle-grid {
    grid-template-columns: 1fr;
  }
  .skeleton-body {
    grid-template-columns: 1fr;
  }
  .title-idea-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .btn-copy-item {
    align-self: flex-end;
  }
}
</style>
