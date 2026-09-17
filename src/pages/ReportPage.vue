<template>
  <div class="report-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Báo Cáo</h1>
        <p class="page-subtitle">
          Tóm tắt hoạt động của các kênh theo dõi trong 24 giờ hoặc 7 ngày gần nhất.
        </p>
        <div class="timezone-notice" v-if="reportData">
          <AppIcon name="clock" size="14" />
          <span>Cập nhật báo cáo: <strong>{{ formattedGeneratedAt }}</strong> (Múi giờ Việt Nam)</span>
        </div>
      </div>

      <div class="header-actions">
        <!-- Range Switch Buttons -->
        <div class="range-switch-group">
          <button
            class="range-btn"
            :class="{ active: currentRange === '24h' }"
            :disabled="loading"
            @click="setRange('24h')"
          >
            24 Giờ
          </button>
          <button
            class="range-btn"
            :class="{ active: currentRange === '7d' }"
            :disabled="loading"
            @click="setRange('7d')"
          >
            7 Ngày
          </button>
        </div>

        <!-- Copy Summary Button -->
        <button
          class="btn btn-secondary btn-copy"
          :disabled="loading || !reportData"
          @click="copySummary"
          title="Sao chép tóm tắt số liệu báo cáo"
        >
          <AppIcon :name="copied ? 'check' : 'copy'" size="15" />
          <span>{{ copied ? 'Đã Sao Chép!' : 'Sao Chép Tóm Tắt' }}</span>
        </button>

        <!-- Refresh Button -->
        <button
          class="btn btn-primary btn-refresh"
          :disabled="loading"
          @click="loadReport"
          title="Tải lại dữ liệu báo cáo mới nhất"
        >
          <AppIcon name="refresh" size="15" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner">
      <div class="error-banner-content">
        <AppIcon name="alert-triangle" size="18" />
        <div>
          <div class="error-title">Không thể tải Báo Cáo.</div>
          <div class="error-desc">{{ error }}</div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" @click="loadReport">
        <AppIcon name="refresh" size="14" />
        <span>Thử Lại</span>
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading && !reportData" class="skeleton-container">
      <div class="skeleton-grid">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </div>
      <div class="skeleton-section"></div>
      <div class="skeleton-section"></div>
    </div>

    <!-- Main Content -->
    <div v-else-if="reportData" class="report-content">
      <!-- 1. Summary — 6 Cards -->
      <section class="summary-cards-grid">
        <div class="stat-card">
          <div class="stat-icon-wrap icon-blue">
            <AppIcon name="clock" size="20" />
          </div>
          <div class="stat-body">
            <div class="stat-label">Video mới</div>
            <div class="stat-value">{{ reportData.summary.newVideosCount }}</div>
            <div class="stat-hint">Xuất bản trong {{ currentRange === '24h' ? '24 giờ' : '7 ngày' }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap icon-indigo">
            <AppIcon name="tv" size="20" />
          </div>
          <div class="stat-body">
            <div class="stat-label">Kênh có video mới</div>
            <div class="stat-value">{{ reportData.summary.channelsWithNewVideosCount }}</div>
            <div class="stat-hint">Kênh đối thủ vừa đăng</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap icon-emerald">
            <AppIcon name="trending-up" size="20" />
          </div>
          <div class="stat-body">
            <div class="stat-label">Video mới đang tăng</div>
            <div class="stat-value">{{ reportData.summary.risingNewVideosCount }}</div>
            <div class="stat-hint">VPH đo được hiện tại &gt; 0</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap icon-amber">
            <AppIcon name="bell" size="20" />
          </div>
          <div class="stat-body">
            <div class="stat-label">Cảnh báo phát sinh</div>
            <div class="stat-value">{{ reportData.summary.alertsCount }}</div>
            <div class="stat-hint">Vượt ngưỡng VPH quy định</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap icon-cyan">
            <AppIcon name="database" size="20" />
          </div>
          <div class="stat-body">
            <div class="stat-label">Snapshot đã ghi nhận</div>
            <div class="stat-value">{{ formatNumber(reportData.summary.snapshotsCount) }}</div>
            <div class="stat-hint">Điểm dữ liệu thu thập</div>
          </div>
        </div>

        <div class="stat-card" :class="{ 'card-attention': reportData.summary.attentionScansCount > 0 }">
          <div class="stat-icon-wrap" :class="reportData.summary.attentionScansCount > 0 ? 'icon-rose' : 'icon-gray'">
            <AppIcon name="alert-circle" size="20" />
          </div>
          <div class="stat-body">
            <div class="stat-label">Lần quét cần chú ý</div>
            <div class="stat-value">{{ reportData.summary.attentionScansCount }}</div>
            <div class="stat-hint">Thất bại hoặc một phần</div>
          </div>
        </div>
      </section>

      <!-- 2. Section: Video Mới Đang Tăng -->
      <section class="report-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Video Mới Đang Tăng</h2>
            <p class="section-subtitle">
              Tối đa 10 video xuất bản trong khoảng có VPH đo được lớn hơn 0, xếp theo VPH đo được hiện tại
            </p>
          </div>
          <div class="peak-vph-badge">
            <span class="peak-label">VPH cao nhất hiện tại trong nhóm video mới:</span>
            <span class="peak-val">
              {{ reportData.summary.maxCurrentVph !== null ? formatVph(reportData.summary.maxCurrentVph) : '—' }}
            </span>
          </div>
        </div>

        <div v-if="reportData.risingVideos.length === 0" class="empty-box">
          <AppIcon name="trending-up" size="28" />
          <p>Không có video mới nào đang tăng trong khoảng thời gian này.</p>
        </div>

        <div v-else class="video-grid">
          <div
            v-for="v in reportData.risingVideos"
            :key="v.id"
            class="video-card"
          >
            <div class="video-thumb-wrap">
              <img
                v-if="v.thumbnailUrl"
                :src="v.thumbnailUrl"
                :alt="v.title"
                class="video-thumb"
                loading="lazy"
              />
              <div v-else class="video-thumb-placeholder">
                <AppIcon name="video" size="24" />
              </div>
              <span class="vph-tag">
                {{ formatVph(v.latestMeasuredVph) }}
              </span>
            </div>

            <div class="video-info">
              <div class="video-channel-row">
                <img
                  v-if="v.channelAvatarUrl"
                  :src="v.channelAvatarUrl"
                  :alt="v.channelName"
                  class="channel-mini-avatar"
                />
                <router-link :to="`/kenh-theo-doi/${v.channelId}`" class="channel-name-link" :title="v.channelName">
                  {{ v.channelName }}
                </router-link>
              </div>

              <h3 class="video-title" :title="v.title">
                <router-link :to="`/videos/${v.id}`" class="video-title-link">
                  {{ v.title }}
                </router-link>
              </h3>

              <div class="video-meta-row">
                <span class="meta-item" :title="formatVietnamDateTime(v.publishedAt)">
                  <AppIcon name="clock" size="12" />
                  {{ formatRelativeTime(v.publishedAt) }}
                </span>
                <span class="meta-item">
                  <AppIcon name="eye" size="12" />
                  {{ formatNumber(v.latestViewCount) }} lượt xem
                </span>
              </div>

              <div class="video-card-footer">
                <div class="vph-measured-label">
                  <span class="vph-subtext">VPH đo được hiện tại</span>
                  <span class="vph-highlight">{{ formatVph(v.latestMeasuredVph) }}</span>
                </div>
                <div class="video-action-links">
                  <router-link :to="`/videos/${v.id}`" class="btn-link">
                    Chi tiết
                  </router-link>
                  <a
                    v-if="v.youtubeVideoId"
                    :href="`https://www.youtube.com/watch?v=${v.youtubeVideoId}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-link btn-yt"
                    title="Xem trên YouTube"
                  >
                    YouTube ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Section: Video Mới Trong Khoảng -->
      <section class="report-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Video Mới Trong Khoảng</h2>
            <p class="section-subtitle">20 video mới nhất xuất bản trong {{ currentRange === '24h' ? '24 giờ' : '7 ngày' }} qua</p>
          </div>
        </div>

        <div v-if="reportData.newVideos.length === 0" class="empty-box">
          <AppIcon name="clock" size="28" />
          <p>Chưa có video mới trong khoảng thời gian này.</p>
        </div>

        <div v-else class="video-grid">
          <div
            v-for="v in reportData.newVideos"
            :key="v.id"
            class="video-card"
          >
            <div class="video-thumb-wrap">
              <img
                v-if="v.thumbnailUrl"
                :src="v.thumbnailUrl"
                :alt="v.title"
                class="video-thumb"
                loading="lazy"
              />
              <div v-else class="video-thumb-placeholder">
                <AppIcon name="video" size="24" />
              </div>
              <span v-if="v.hasAlert" class="alert-badge-on-thumb">
                <AppIcon name="bell" size="11" />
                Cảnh báo
              </span>
            </div>

            <div class="video-info">
              <div class="video-channel-row">
                <img
                  v-if="v.channelAvatarUrl"
                  :src="v.channelAvatarUrl"
                  :alt="v.channelName"
                  class="channel-mini-avatar"
                />
                <router-link :to="`/kenh-theo-doi/${v.channelId}`" class="channel-name-link" :title="v.channelName">
                  {{ v.channelName }}
                </router-link>
              </div>

              <h3 class="video-title" :title="v.title">
                <router-link :to="`/videos/${v.id}`" class="video-title-link">
                  {{ v.title }}
                </router-link>
              </h3>

              <div class="video-meta-row">
                <span class="meta-item" :title="formatVietnamDateTime(v.publishedAt)">
                  <AppIcon name="clock" size="12" />
                  {{ formatRelativeTime(v.publishedAt) }}
                </span>
                <span class="meta-item">
                  <AppIcon name="eye" size="12" />
                  {{ formatNumber(v.latestViewCount) }} lượt xem
                </span>
              </div>

              <div class="video-card-footer">
                <div class="vph-measured-label">
                  <span class="vph-subtext">VPH đo được hiện tại</span>
                  <span class="vph-highlight">{{ formatVph(v.latestMeasuredVph) }}</span>
                </div>
                <div class="video-action-links">
                  <router-link :to="`/videos/${v.id}`" class="btn-link">
                    Chi tiết
                  </router-link>
                  <a
                    v-if="v.youtubeVideoId"
                    :href="`https://www.youtube.com/watch?v=${v.youtubeVideoId}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-link btn-yt"
                    title="Xem trên YouTube"
                  >
                    YouTube ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Section: Kênh Có Video Mới -->
      <section class="report-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Kênh Có Video Mới</h2>
            <p class="section-subtitle">
              Thống kê số lượng và nhịp đăng của từng kênh đối thủ trong khoảng thời gian đã chọn
            </p>
          </div>
        </div>

        <div v-if="reportData.channelActivities.length === 0" class="empty-box">
          <AppIcon name="tv" size="28" />
          <p>Chưa có kênh nào đăng video trong khoảng thời gian này.</p>
        </div>

        <div v-else class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th>Kênh</th>
                <th class="text-center">Số video mới</th>
                <th>Video gần nhất</th>
                <th class="text-right">VPH cao nhất hiện tại</th>
                <th class="text-center">Video đang tăng</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ch in reportData.channelActivities" :key="ch.channelId">
                <td>
                  <div class="channel-cell">
                    <img
                      v-if="ch.channelAvatarUrl"
                      :src="ch.channelAvatarUrl"
                      :alt="ch.channelName"
                      class="channel-table-avatar"
                    />
                    <div class="channel-cell-text">
                      <router-link :to="`/kenh-theo-doi/${ch.channelId}`" class="channel-table-name">
                        {{ ch.channelName }}
                      </router-link>
                      <span v-if="ch.channelHandle" class="channel-table-handle">{{ ch.channelHandle }}</span>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <span class="count-badge">{{ ch.newVideosCount }}</span>
                </td>
                <td>
                  <div class="latest-video-cell">
                    <div class="latest-video-title" :title="ch.latestVideoTitle">{{ ch.latestVideoTitle }}</div>
                    <div class="latest-video-time">{{ formatRelativeTime(ch.latestPublishedAt) }}</div>
                  </div>
                </td>
                <td class="text-right font-mono">
                  {{ ch.maxCurrentVph !== null ? formatVph(ch.maxCurrentVph) : '—' }}
                </td>
                <td class="text-center">
                  <span class="rising-badge" :class="{ 'has-rising': ch.risingCount > 0 }">
                    {{ ch.risingCount }} video
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 5. Section: Cảnh Báo Trong Khoảng -->
      <section class="report-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Cảnh Báo Trong Khoảng</h2>
            <p class="section-subtitle">
              Lịch sử cảnh báo VPH phát sinh từ thời điểm bắt đầu khoảng thời gian đã chọn
            </p>
          </div>
          <router-link to="/lich-su-canh-bao" class="btn-link">
            Xem toàn bộ lịch sử ↗
          </router-link>
        </div>

        <div v-if="reportData.recentAlerts.length === 0" class="empty-box">
          <AppIcon name="bell" size="28" />
          <p>Không có cảnh báo phát sinh trong khoảng thời gian này.</p>
        </div>

        <div v-else class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th>Video & Kênh</th>
                <th class="text-right">VPH lúc cảnh báo</th>
                <th class="text-right">Ngưỡng lúc cảnh báo</th>
                <th class="text-center">Trạng thái</th>
                <th>Thời điểm tạo</th>
                <th class="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="alt in reportData.recentAlerts" :key="alt.id">
                <td>
                  <div class="alert-video-cell">
                    <img
                      v-if="alt.videoThumbnailUrl"
                      :src="alt.videoThumbnailUrl"
                      :alt="alt.videoTitle"
                      class="alert-thumb"
                    />
                    <div class="alert-video-info">
                      <div class="alert-v-title" :title="alt.videoTitle">{{ alt.videoTitle }}</div>
                      <div class="alert-v-channel">{{ alt.channelName }}</div>
                    </div>
                  </div>
                </td>
                <td class="text-right font-mono text-emerald">
                  {{ formatVph(alt.measuredVph) }}
                </td>
                <td class="text-right font-mono">
                  {{ formatVph(alt.thresholdVph) }}
                </td>
                <td class="text-center">
                  <span class="status-pill" :class="`pill-${alt.status}`">
                    {{ alt.statusLabel }}
                  </span>
                </td>
                <td class="text-muted">
                  {{ formatVietnamDateTime(alt.createdAt) }}
                </td>
                <td class="text-right">
                  <router-link :to="`/lich-su-canh-bao?video=${alt.videoId}`" class="btn-link">
                    Chi tiết
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 6. Section: Hoạt Động Thu Thập -->
      <section class="report-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Hoạt Động Thu Thập</h2>
            <p class="section-subtitle">
              Lịch sử các phiên quét bot chạy định kỳ và snapshot ghi nhận trong khoảng
            </p>
          </div>
          <router-link to="/tinh-trang-du-lieu" class="btn-link">
            Xem Tình Trạng Dữ Liệu ↗
          </router-link>
        </div>

        <!-- Scan Summary Bar -->
        <div class="scan-summary-bar">
          <div class="scan-bar-item">
            <span class="sbi-label">Tổng lần quét:</span>
            <strong class="sbi-val">{{ reportData.scanSummary.totalScans }}</strong>
          </div>
          <div class="scan-bar-item">
            <span class="sbi-label">Thành công:</span>
            <strong class="sbi-val text-emerald">{{ reportData.scanSummary.successScans }}</strong>
          </div>
          <div class="scan-bar-item">
            <span class="sbi-label">Một phần:</span>
            <strong class="sbi-val text-amber">{{ reportData.scanSummary.partialScans }}</strong>
          </div>
          <div class="scan-bar-item">
            <span class="sbi-label">Thất bại:</span>
            <strong class="sbi-val text-rose">{{ reportData.scanSummary.failedScans }}</strong>
          </div>
          <div class="scan-bar-item">
            <span class="sbi-label">Tổng snapshot:</span>
            <strong class="sbi-val text-cyan">{{ formatNumber(reportData.scanSummary.totalSnapshots) }}</strong>
          </div>
        </div>

        <div v-if="reportData.recentScans.length === 0" class="empty-box">
          <AppIcon name="database" size="28" />
          <p>Chưa có lần thu thập dữ liệu nào trong khoảng thời gian này.</p>
        </div>

        <div v-else class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Nguồn</th>
                <th class="text-center">Trạng thái</th>
                <th class="text-center">Kênh thành công / tổng</th>
                <th class="text-right">Video tìm thấy</th>
                <th class="text-right">Snapshot tạo mới</th>
                <th class="text-center">Cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="scan in reportData.recentScans" :key="scan.id">
                <tr>
                  <td>{{ formatVietnamDateTime(scan.startedAt) }}</td>
                  <td>{{ formatVietnamDateTime(scan.finishedAt) }}</td>
                  <td>
                    <span class="source-tag" :class="scan.triggerSource">
                      {{ scan.triggerLabel }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="status-pill" :class="`pill-${scan.status}`">
                      {{ scan.statusLabel }}
                    </span>
                    <button
                      v-if="(scan.status === 'partial' || scan.status === 'failed') && scan.sanitizedError"
                      class="btn-inline-error"
                      @click="toggleErrorView(scan.id)"
                      title="Xem thông tin lỗi (đã khử dữ liệu nhạy cảm)"
                    >
                      {{ activeErrorScanId === scan.id ? 'Đóng lỗi' : 'Xem lỗi' }}
                    </button>
                  </td>
                  <td class="text-center font-mono">
                    {{ scan.channelsSuccess }} / {{ scan.channelsTotal }}
                  </td>
                  <td class="text-right font-mono">{{ formatNumber(scan.videosFound) }}</td>
                  <td class="text-right font-mono text-cyan">{{ formatNumber(scan.snapshotsCreated) }}</td>
                  <td class="text-center font-mono">
                    <span v-if="scan.alertsSent > 0" class="text-emerald">{{ scan.alertsSent }} gửi</span>
                    <span v-else class="text-muted">0</span>
                    <span v-if="scan.alertsFailed > 0" class="text-rose"> ({{ scan.alertsFailed }} lỗi)</span>
                  </td>
                </tr>

                <!-- Error Detail Accordion -->
                <tr v-if="activeErrorScanId === scan.id" class="error-detail-row">
                  <td colspan="8">
                    <div class="scan-error-box">
                      <div class="error-box-header">
                        <AppIcon name="alert-triangle" size="14" />
                        <span>Chi tiết lỗi (Đã loại bỏ mã bí mật và webhook):</span>
                      </div>
                      <pre class="error-box-pre">{{ scan.sanitizedError }}</pre>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ReportRange, ReportData } from '@/types/report';
import {
  fetchReportData,
  parseReportRange,
  formatVietnamDateTime,
  formatNumber,
  formatVph,
  formatRelativeTime,
  buildReportCopyText,
} from '@/services/report-service';

const route = useRoute();
const router = useRouter();

const currentRange = ref<ReportRange>('24h');
const loading = ref(false);
const error = ref<string | null>(null);
const reportData = ref<ReportData | null>(null);
const copied = ref(false);
const activeErrorScanId = ref<string | null>(null);

const formattedGeneratedAt = computed(() => {
  if (!reportData.value) return '—';
  return formatVietnamDateTime(reportData.value.generatedAtIso);
});

async function loadReport() {
  loading.value = true;
  error.value = null;
  try {
    const data = await fetchReportData(currentRange.value);
    reportData.value = data;
  } catch (err: any) {
    error.value = err?.message || 'Lỗi không xác định khi tải dữ liệu báo cáo.';
  } finally {
    loading.value = false;
  }
}

function setRange(newRange: ReportRange) {
  if (currentRange.value === newRange && reportData.value) return;
  currentRange.value = newRange;
  router.replace({
    query: {
      ...route.query,
      range: newRange === '24h' ? undefined : newRange,
    },
  });
  loadReport();
}

function toggleErrorView(scanId: string) {
  if (activeErrorScanId.value === scanId) {
    activeErrorScanId.value = null;
  } else {
    activeErrorScanId.value = scanId;
  }
}

async function copySummary() {
  if (!reportData.value) return;
  const text = buildReportCopyText(
    reportData.value.summary,
    reportData.value.range,
    new Date(reportData.value.generatedAtIso).getTime()
  );
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2500);
  } catch (e) {
    console.error('Không thể sao chép tóm tắt', e);
  }
}

// Watch URL query params to sync range safely
watch(
  () => route.query.range,
  (newVal) => {
    const parsed = parseReportRange(newVal);
    if (parsed !== currentRange.value) {
      currentRange.value = parsed;
      loadReport();
    }
  }
);

onMounted(() => {
  currentRange.value = parseReportRange(route.query.range);
  loadReport();
});
</script>

<style scoped>
.report-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.35rem;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.925rem;
  color: #94a3b8;
  margin: 0 0 0.5rem;
}

.timezone-notice {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 6px;
  font-size: 0.825rem;
  color: #38bdf8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Range Switch Buttons */
.range-switch-group {
  display: inline-flex;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 3px;
}

.range-btn {
  padding: 0.45rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.range-btn:hover:not(:disabled) {
  color: #f1f5f9;
}

.range-btn.active {
  background: #0284c7;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.range-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: #0284c7;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #0369a1;
}

.btn-secondary {
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid #334155;
}

.btn-secondary:hover:not(:disabled) {
  background: #334155;
  border-color: #475569;
}

.btn:disabled {
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

/* Error Banner */
.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(225, 29, 72, 0.12);
  border: 1px solid rgba(225, 29, 72, 0.3);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  color: #fda4af;
}

.error-banner-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-title {
  font-weight: 600;
  color: #f43f5e;
}

.error-desc {
  font-size: 0.85rem;
}

/* Skeleton Loading */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  height: 100px;
  background: #1e293b;
  border-radius: 10px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-section {
  height: 250px;
  background: #1e293b;
  border-radius: 10px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

/* Summary Cards Grid */
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.15rem;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
}

.stat-card.card-attention {
  border-color: rgba(244, 63, 94, 0.4);
  background: rgba(244, 63, 94, 0.05);
}

.stat-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.icon-indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.icon-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.icon-cyan { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
.icon-rose { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
.icon-gray { background: rgba(148, 163, 184, 0.12); color: #94a3b8; }

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.825rem;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.stat-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.35rem;
}

/* Report Section */
.report-section {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.25rem;
}

.section-subtitle {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

.peak-vph-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
}

.peak-label {
  font-size: 0.825rem;
  color: #94a3b8;
}

.peak-val {
  font-size: 0.95rem;
  font-weight: 700;
  color: #34d399;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Empty Box */
.empty-box {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-box p {
  margin: 0;
  font-size: 0.925rem;
}

/* Video Grid */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.video-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.video-card:hover {
  border-color: #475569;
}

.video-thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0f172a;
}

.video-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.vph-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  backdrop-filter: blur(4px);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.alert-badge-on-thumb {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(245, 158, 11, 0.9);
  color: #0f172a;
  font-weight: 700;
  font-size: 0.725rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.video-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.video-channel-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.channel-mini-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.channel-name-link {
  font-size: 0.8rem;
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-name-link:hover {
  color: #38bdf8;
}

.video-title {
  font-size: 0.925rem;
  font-weight: 600;
  line-height: 1.35;
  margin: 0 0 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.45rem;
}

.video-title-link {
  color: #f1f5f9;
  text-decoration: none;
}

.video-title-link:hover {
  color: #38bdf8;
}

.video-meta-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.775rem;
  color: #64748b;
  margin-bottom: 0.85rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.video-card-footer {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vph-measured-label {
  display: flex;
  flex-direction: column;
}

.vph-subtext {
  font-size: 0.7rem;
  color: #64748b;
}

.vph-highlight {
  font-size: 0.85rem;
  font-weight: 700;
  color: #34d399;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.video-action-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-link {
  font-size: 0.8rem;
  color: #38bdf8;
  text-decoration: none;
  font-weight: 500;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-yt {
  color: #f43f5e;
}

/* Tables */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.report-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.775rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8;
  border-bottom: 1px solid #334155;
  letter-spacing: 0.03em;
}

.report-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #1e293b;
  color: #cbd5e1;
  vertical-align: middle;
}

.report-table tr:hover td {
  background: rgba(30, 41, 59, 0.4);
}

.text-center { text-align: center !important; }
.text-right { text-align: right !important; }
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

.text-emerald { color: #34d399 !important; }
.text-amber { color: #fbbf24 !important; }
.text-rose { color: #fb7185 !important; }
.text-cyan { color: #22d3ee !important; }
.text-muted { color: #64748b !important; }

/* Channel Table Cell */
.channel-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.channel-table-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.channel-cell-text {
  display: flex;
  flex-direction: column;
}

.channel-table-name {
  font-weight: 600;
  color: #f1f5f9;
  text-decoration: none;
}

.channel-table-name:hover {
  color: #38bdf8;
}

.channel-table-handle {
  font-size: 0.75rem;
  color: #64748b;
}

.count-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 9999px;
  font-weight: 700;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.latest-video-cell {
  max-width: 320px;
}

.latest-video-title {
  font-size: 0.85rem;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.latest-video-time {
  font-size: 0.75rem;
  color: #64748b;
}

.rising-badge {
  display: inline-block;
  font-size: 0.775rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: #1e293b;
  color: #64748b;
}

.rising-badge.has-rising {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  font-weight: 600;
}

/* Alert Table */
.alert-video-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alert-thumb {
  width: 56px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.alert-video-info {
  max-width: 300px;
}

.alert-v-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-v-channel {
  font-size: 0.75rem;
  color: #64748b;
}

/* Status Pills */
.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.pill-sent, .pill-success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.pill-pending, .pill-running {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.pill-sending, .pill-partial {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.pill-failed {
  background: rgba(244, 63, 94, 0.15);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.3);
}

.source-tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.source-tag.manual {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

.source-tag.schedule {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
}

.btn-inline-error {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.4rem;
  font-size: 0.7rem;
  background: #334155;
  color: #f1f5f9;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-inline-error:hover {
  background: #475569;
}

.error-detail-row td {
  padding: 0;
  border-bottom: 1px solid #334155;
}

.scan-error-box {
  background: #0b0f19;
  border-left: 3px solid #f43f5e;
  padding: 0.85rem 1.25rem;
  margin: 0.5rem 1rem;
  border-radius: 4px;
}

.error-box-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.775rem;
  font-weight: 600;
  color: #fb7185;
  margin-bottom: 0.45rem;
}

.error-box-pre {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.775rem;
  color: #cbd5e1;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Scan Summary Bar */
.scan-summary-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #1e293b;
  border: 1px solid #334155;
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.scan-bar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.sbi-label {
  color: #94a3b8;
}

.sbi-val {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Responsive */
@media (max-width: 1200px) {
  .summary-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .report-page {
    padding: 1rem;
  }

  .summary-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    padding: 0.85rem;
  }

  .stat-value {
    font-size: 1.35rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .range-switch-group {
    width: 100%;
    display: flex;
  }

  .range-btn {
    flex: 1;
    text-align: center;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .peak-vph-badge {
    width: 100%;
    justify-content: space-between;
  }

  .video-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .summary-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
