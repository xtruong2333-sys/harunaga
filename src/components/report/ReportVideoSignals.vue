<template>
  <div class="video-signals-container">
    <!-- 1. Video Mới Đang Tăng -->
    <section class="signal-section" aria-labelledby="rising-videos-title">
      <div class="section-header">
        <div class="header-text">
          <div class="section-kicker">TÍN HIỆU TĂNG TRƯỞNG</div>
          <h2 id="rising-videos-title" class="section-title">Video Mới Đang Tăng</h2>
          <p class="section-desc">
            Tối đa 10 video xuất bản trong khoảng có tốc độ tăng trưởng đo được (VPH &gt; 0), xếp theo VPH cao nhất.
          </p>
        </div>
        <div v-if="maxCurrentVph !== null" class="peak-vph-pill">
          <AppIcon name="zap" :size="14" />
          <span class="peak-label">VPH đỉnh hiện tại:</span>
          <strong class="peak-value">{{ formatVph(maxCurrentVph) }}</strong>
        </div>
      </div>

      <div v-if="risingVideos.length === 0" class="empty-signal-box">
        <AppIcon name="trending-up" :size="28" />
        <p>Không có video mới nào có tốc độ tăng trưởng đo được (VPH &gt; 0) trong khoảng thời gian này.</p>
      </div>

      <div v-else class="video-grid">
        <article
          v-for="v in risingVideos"
          :key="v.id"
          class="video-card"
        >
          <div class="card-thumb-wrap">
            <VideoThumbnail
              :src="v.thumbnailUrl"
              :alt="v.title"
              :detail-url="`/videos/${v.id}`"
              :youtube-video-id="v.youtubeVideoId || undefined"
              :vph-badge="v.latestMeasuredVph"
            />
          </div>

          <div class="card-body">
            <div class="channel-row">
              <img
                v-if="v.channelAvatarUrl && !avatarErrors[v.channelId]"
                :src="v.channelAvatarUrl"
                :alt="v.channelName"
                class="channel-avatar"
                loading="lazy"
                @error="handleAvatarError(v.channelId)"
              />
              <div v-else class="channel-avatar-fallback">
                {{ v.channelName.slice(0, 1) }}
              </div>
              <router-link
                :to="`/kenh-theo-doi/${v.channelId}`"
                class="channel-name"
                :title="v.channelName"
              >
                {{ v.channelName }}
              </router-link>
            </div>

            <h3 class="video-title">
              <router-link
                :to="`/videos/${v.id}`"
                class="video-link"
                :title="v.title"
              >
                {{ v.title }}
              </router-link>
            </h3>

            <div class="meta-row">
              <span class="meta-item" :title="formatVietnamDateTime(v.publishedAt)">
                <AppIcon name="clock" :size="12" />
                <span>{{ formatRelativeTime(v.publishedAt) }}</span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <AppIcon name="eye" :size="12" />
                <span>{{ formatNullableNumber(v.latestViewCount) }} lượt xem</span>
              </span>
            </div>

            <div class="card-footer">
              <div class="vph-info">
                <span class="vph-label">VPH đo được</span>
                <span class="vph-val font-mono">{{ formatVph(v.latestMeasuredVph) }}</span>
              </div>
              <div class="card-actions">
                <router-link :to="`/videos/${v.id}`" class="action-btn">
                  Chi tiết
                </router-link>
                <a
                  v-if="v.youtubeVideoId"
                  :href="`https://www.youtube.com/watch?v=${v.youtubeVideoId}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="action-btn is-yt"
                  title="Xem trên YouTube"
                >
                  YouTube ↗
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- 2. Video Mới Xuất Bản -->
    <section class="signal-section" aria-labelledby="recent-videos-title">
      <div class="section-header">
        <div class="header-text">
          <div class="section-kicker">HOẠT ĐỘNG XUẤT BẢN</div>
          <h2 id="recent-videos-title" class="section-title">Video Mới Xuất Bản</h2>
          <p class="section-desc">
            Tối đa 20 video mới nhất xuất bản trong {{ range === '24h' ? '24 giờ' : '7 ngày' }} qua.
          </p>
        </div>
      </div>

      <div v-if="newVideos.length === 0" class="empty-signal-box">
        <AppIcon name="video" :size="28" />
        <p>Chưa có video mới nào xuất bản trong khoảng thời gian này.</p>
      </div>

      <div v-else class="video-grid">
        <article
          v-for="v in newVideos"
          :key="v.id"
          class="video-card"
        >
          <div class="card-thumb-wrap">
            <VideoThumbnail
              :src="v.thumbnailUrl"
              :alt="v.title"
              :detail-url="`/videos/${v.id}`"
              :youtube-video-id="v.youtubeVideoId || undefined"
              :vph-badge="v.latestMeasuredVph"
            />
            <span v-if="v.hasAlert" class="alert-indicator" title="Video đã phát sinh cảnh báo VPH">
              <AppIcon name="bell" :size="10" />
              <span>Cảnh báo</span>
            </span>
          </div>

          <div class="card-body">
            <div class="channel-row">
              <img
                v-if="v.channelAvatarUrl && !avatarErrors[v.channelId]"
                :src="v.channelAvatarUrl"
                :alt="v.channelName"
                class="channel-avatar"
                loading="lazy"
                @error="handleAvatarError(v.channelId)"
              />
              <div v-else class="channel-avatar-fallback">
                {{ v.channelName.slice(0, 1) }}
              </div>
              <router-link
                :to="`/kenh-theo-doi/${v.channelId}`"
                class="channel-name"
                :title="v.channelName"
              >
                {{ v.channelName }}
              </router-link>
            </div>

            <h3 class="video-title">
              <router-link
                :to="`/videos/${v.id}`"
                class="video-link"
                :title="v.title"
              >
                {{ v.title }}
              </router-link>
            </h3>

            <div class="meta-row">
              <span class="meta-item" :title="formatVietnamDateTime(v.publishedAt)">
                <AppIcon name="clock" :size="12" />
                <span>{{ formatRelativeTime(v.publishedAt) }}</span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <AppIcon name="eye" :size="12" />
                <span>{{ formatNullableNumber(v.latestViewCount) }} lượt xem</span>
              </span>
            </div>

            <div class="card-footer">
              <div class="vph-info">
                <span class="vph-label">VPH đo được</span>
                <span class="vph-val font-mono">{{ formatVph(v.latestMeasuredVph) }}</span>
              </div>
              <div class="card-actions">
                <router-link :to="`/videos/${v.id}`" class="action-btn">
                  Chi tiết
                </router-link>
                <a
                  v-if="v.youtubeVideoId"
                  :href="`https://www.youtube.com/watch?v=${v.youtubeVideoId}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="action-btn is-yt"
                  title="Xem trên YouTube"
                >
                  YouTube ↗
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import type { ReportVideo, ReportRange } from '@/types/report';
import {
  formatVph,
  formatRelativeTime,
  formatVietnamDateTime,
  formatNullableNumber,
} from '@/services/report-service';

defineProps<{
  risingVideos: ReportVideo[];
  newVideos: ReportVideo[];
  maxCurrentVph: number | null;
  range: ReportRange;
}>();

const avatarErrors = ref<Record<string, boolean>>({});

function handleAvatarError(channelId: string) {
  avatarErrors.value[channelId] = true;
}
</script>

<style scoped>
.video-signals-container {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.signal-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #2563eb;
  margin-bottom: 2px;
}

[data-theme="dark"] .section-kicker {
  color: #38bdf8;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0 0 4px;
}

.section-desc {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  margin: 0;
  max-width: 720px;
}

.peak-vph-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 9999px;
  color: #1d4ed8;
  font-size: 12.5px;
}

[data-theme="dark"] .peak-vph-pill {
  background: rgba(37, 99, 235, 0.15);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.peak-label {
  font-weight: 500;
}

.peak-value {
  font-weight: 700;
}

.empty-signal-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  background: var(--surface, #ffffff);
  border: 1px dashed var(--border, #cbd5e1);
  border-radius: 12px;
  color: var(--text-muted, #94a3b8);
  font-size: 13.5px;
  text-align: center;
}

[data-theme="dark"] .empty-signal-box {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.6);
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.video-card {
  display: flex;
  flex-direction: column;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

[data-theme="dark"] .video-card {
  background: rgba(15, 23, 42, 0.7);
  border-color: rgba(51, 65, 85, 0.7);
}

.video-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

[data-theme="dark"] .video-card:hover {
  border-color: rgba(56, 189, 248, 0.4);
}

.card-thumb-wrap {
  position: relative;
  width: 100%;
}

.alert-indicator {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  background: rgba(239, 68, 68, 0.9);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
  backdrop-filter: blur(4px);
  z-index: 2;
}

.card-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.channel-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.channel-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.channel-avatar-fallback {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.channel-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-name:hover {
  color: #2563eb;
}

.video-title {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.8em;
}

.video-link {
  color: var(--text-primary, #0f172a);
  text-decoration: none;
}

.video-link:hover {
  color: #2563eb;
}

[data-theme="dark"] .video-link:hover {
  color: #38bdf8;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-muted, #94a3b8);
  margin-bottom: 12px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-dot {
  opacity: 0.5;
}

.card-footer {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--border, #f1f5f9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

[data-theme="dark"] .card-footer {
  border-top-color: rgba(51, 65, 85, 0.5);
}

.vph-info {
  display: flex;
  flex-direction: column;
}

.vph-label {
  font-size: 10.5px;
  color: var(--text-muted, #94a3b8);
}

.vph-val {
  font-size: 13px;
  font-weight: 700;
  color: #059669;
}

[data-theme="dark"] .vph-val {
  color: #34d399;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--bg-inset, #f1f5f9);
  color: var(--text-secondary, #475569);
  text-decoration: none;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: #e2e8f0;
  color: var(--text-primary, #0f172a);
}

.action-btn.is-yt:hover {
  color: #dc2626;
}

[data-theme="dark"] .action-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

[data-theme="dark"] .action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}
</style>
