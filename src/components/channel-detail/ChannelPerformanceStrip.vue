<template>
  <div class="channel-perf-strip">
    <!-- Top 4 Primary Metric Cards -->
    <div class="metrics-grid">
      <div class="metric-card surface-card">
        <div class="metric-top">
          <span class="m-lbl">TỔNG VIDEO</span>
          <AppIcon name="video" size="18" class="m-icon" />
        </div>
        <div class="m-val mono">{{ analysis.totalVideos }}</div>
        <div class="m-sub">Video trong cơ sở dữ liệu</div>
      </div>

      <div class="metric-card surface-card">
        <div class="metric-top">
          <span class="m-lbl">VIDEO ĐANG TĂNG</span>
          <AppIcon name="trending-up" size="18" class="m-icon text-accent" />
        </div>
        <div class="m-val mono text-accent">{{ analysis.risingVideos }}</div>
        <div class="m-sub">Video có VPH đo được > 0</div>
      </div>

      <div class="metric-card surface-card focal-card">
        <div class="metric-top">
          <span class="m-lbl">VPH CAO NHẤT</span>
          <AppIcon name="zap" size="18" class="m-icon text-accent" />
        </div>
        <div class="m-val mono text-accent">
          {{ analysis.maxVph !== null && analysis.maxVph > 0 ? analysis.maxVph.toLocaleString('vi-VN') + ' VPH' : '—' }}
        </div>
        <div class="m-sub">Tốc độ tăng cao nhất hiện tại</div>
      </div>

      <div class="metric-card surface-card">
        <div class="metric-top">
          <span class="m-lbl">TỔNG CẢNH BÁO</span>
          <AppIcon name="bell" size="18" class="m-icon" />
        </div>
        <div class="m-val mono">{{ analysis.alertSummary.total }}</div>
        <div class="m-sub">{{ analysis.alertSummary.sent }} đã phát tín hiệu</div>
      </div>
    </div>

    <!-- Segmented Distribution Rail (Contract-preserving) -->
    <div class="distribution-card surface-card">
      <div class="dist-header">
        <div class="dist-title-wrap">
          <h3 class="dist-title">TÌNH TRẠNG PHÂN BỐ TĂNG TRƯỞNG</h3>
          <span class="dist-subtitle">Phân loại {{ analysis.totalVideos }} video theo mức độ tăng trưởng VPH đo được thực tế</span>
        </div>
      </div>

      <div class="distribution-rail-wrap">
        <div class="distribution-rail-track">
          <div
            v-if="analysis.distribution.overThresholdCount > 0"
            class="rail-segment seg-threshold"
            :style="{ flex: analysis.distribution.overThresholdCount }"
            :title="`Vượt ngưỡng: ${analysis.distribution.overThresholdCount} video`"
          ></div>
          <div
            v-if="risingBelowThresholdCount > 0"
            class="rail-segment seg-rising"
            :style="{ flex: risingBelowThresholdCount }"
            :title="`Đang tăng dưới ngưỡng: ${risingBelowThresholdCount} video`"
          ></div>
          <div
            v-if="analysis.distribution.zeroCount > 0"
            class="rail-segment seg-zero"
            :style="{ flex: analysis.distribution.zeroCount }"
            :title="`Không tăng: ${analysis.distribution.zeroCount} video`"
          ></div>
          <div
            v-if="analysis.distribution.nullCount > 0"
            class="rail-segment seg-null"
            :style="{ flex: analysis.distribution.nullCount }"
            :title="`Chưa đủ dữ liệu: ${analysis.distribution.nullCount} video`"
          ></div>
        </div>
      </div>

      <div class="dist-grid">
        <div class="dist-box box-threshold">
          <div class="dist-lbl">
            Vượt ngưỡng {{ analysis.channel.alertVphThreshold ? `(≥ ${analysis.channel.alertVphThreshold.toLocaleString('vi-VN')} VPH)` : '(Chưa thiết lập)' }}
          </div>
          <div class="dist-val mono text-threshold">{{ analysis.distribution.overThresholdCount }}</div>
          <div class="dist-sub">Video kích hoạt cảnh báo</div>
        </div>

        <div class="dist-box box-rising">
          <div class="dist-lbl">Đang tăng dưới ngưỡng</div>
          <div class="dist-val mono text-accent">{{ risingBelowThresholdCount }}</div>
          <div class="dist-sub">Đang có lượt xem mới</div>
        </div>

        <div class="dist-box">
          <div class="dist-lbl">Không tăng (0 VPH)</div>
          <div class="dist-val mono text-muted">{{ analysis.distribution.zeroCount }}</div>
          <div class="dist-sub">Lượt xem không đổi</div>
        </div>

        <div class="dist-box">
          <div class="dist-lbl">Chưa đủ dữ liệu</div>
          <div class="dist-val mono text-muted">{{ analysis.distribution.nullCount }}</div>
          <div class="dist-sub">Cần thêm snapshot đo</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ChannelAnalysis } from '@/types/channel-analysis';

const props = defineProps<{
  analysis: ChannelAnalysis;
}>();

const risingBelowThresholdCount = computed(() => {
  return Math.max(
    0,
    props.analysis.distribution.risingCount - props.analysis.distribution.overThresholdCount
  );
});
</script>

<style scoped>
.channel-perf-strip {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  padding: 18px 20px;
  border-radius: 14px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: 0 1px 4px rgba(30, 60, 90, 0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.focal-card {
  border-color: #BFDBFE;
  background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-lbl {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted, #64748B);
  text-transform: uppercase;
}

.m-icon {
  color: var(--text-muted, #94A3B8);
}

.m-val {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary, #0F172A);
  letter-spacing: -0.02em;
}

.m-sub {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
}

.distribution-card {
  padding: 20px 24px;
  border-radius: 14px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  box-shadow: 0 1px 4px rgba(30, 60, 90, 0.04);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dist-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary, #0F172A);
  margin: 0;
  text-transform: uppercase;
}

.dist-subtitle {
  font-size: 12.5px;
  color: var(--text-secondary, #64748B);
}

.distribution-rail-wrap {
  width: 100%;
}

.distribution-rail-track {
  height: 12px;
  border-radius: 999px;
  background: #E2E8F0;
  display: flex;
  overflow: hidden;
  gap: 2px;
}

.rail-segment {
  height: 100%;
  transition: flex 0.3s ease;
}

.seg-threshold { background: #DC2626; }
.seg-rising { background: #2563EB; }
.seg-zero { background: #94A3B8; }
.seg-null { background: #CBD5E1; }

.dist-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.dist-box {
  padding: 12px 14px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.box-threshold {
  border-color: #FECACA;
  background: #FEF2F2;
}

.box-rising {
  border-color: #BFDBFE;
  background: #EFF6FF;
}

.dist-lbl {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
}

.dist-val {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary, #0F172A);
}

.dist-sub {
  font-size: 11px;
  color: var(--text-muted, #64748B);
}

.text-threshold { color: #DC2626; }
.text-accent { color: #2563EB; }

@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dist-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .dist-grid {
    grid-template-columns: 1fr;
  }
}
</style>
