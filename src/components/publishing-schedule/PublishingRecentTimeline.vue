<template>
  <div class="publishing-recent-timeline card">
    <div class="timeline-header">
      <div>
        <h3 class="timeline-title">{{ groupedByDate ? 'DÒNG THỜI GIAN XUẤT BẢN THEO NGÀY' : 'VIDEO MỚI XUẤT BẢN GẦN ĐÂY' }}</h3>
        <p class="timeline-sub">
          {{ groupedByDate
            ? 'Lịch sử phát hành video được phân nhóm theo từng ngày thực tế (Giờ Việt Nam UTC+7).'
            : 'Danh sách video mới nhất trong khoảng thời gian đã chọn.' }}
        </p>
      </div>
      <span class="count-badge mono">{{ displayVideos.length }} video</span>
    </div>

    <!-- Empty Videos -->
    <div v-if="displayVideos.length === 0" class="timeline-empty">
      <AppIcon name="inbox" :size="36" class="empty-icon" />
      <p>Không có video nào trong khoảng thời gian đã chọn.</p>
    </div>

    <!-- 1. Grouped Day By Day Timeline Mode -->
    <div v-else-if="groupedByDate" class="grouped-timeline-wrap">
      <div
        v-for="group in dateGroups"
        :key="group.dateKey"
        class="date-group-block"
      >
        <div class="group-sticky-header">
          <div class="date-badge-wrap">
            <span class="date-label-main">{{ group.label }}</span>
            <span class="date-sub-str mono">{{ group.dateStr }}</span>
          </div>
          <span class="group-count-tag mono">{{ group.videos.length }} video</span>
        </div>

        <div class="group-videos-list">
          <div
            v-for="v in group.videos"
            :key="v.id"
            class="timeline-video-row"
          >
            <!-- Thumbnail using VideoThumbnail.vue -->
            <div class="thumb-col">
              <VideoThumbnail
                :src="v.thumbnailUrl"
                :alt="v.title"
                :youtube-video-id="v.youtubeVideoId"
                :detail-url="`/videos/${v.id}`"
                ratio="16-9"
              />
            </div>

            <!-- Video Info -->
            <div class="info-col">
              <router-link :to="`/videos/${v.id}`" class="video-row-title" :title="v.title">
                {{ v.title }}
              </router-link>

              <div class="video-row-meta">
                <!-- Channel Info -->
                <router-link
                  v-if="v.channelId"
                  :to="`/kenh-theo-doi/${v.channelId}`"
                  class="channel-pill-link"
                >
                  <img
                    v-if="v.channelAvatarUrl && !avatarErrors[v.channelId]"
                    :src="v.channelAvatarUrl"
                    :alt="v.channelName"
                    class="row-ch-avatar"
                    @error="avatarErrors[v.channelId] = true"
                  />
                  <div
                    v-else
                    class="row-avatar-fallback"
                    :style="{ backgroundColor: getAvatarColor(v.channelName) }"
                  >
                    {{ v.channelName.charAt(0).toUpperCase() }}
                  </div>
                  <span class="row-ch-name">{{ v.channelName }}</span>
                </router-link>
                <span v-else class="row-ch-name text-muted">{{ v.channelName }}</span>

                <span class="meta-dot">·</span>
                <span class="row-time mono">{{ v.vnFormatted }}</span>
                <span class="meta-dot">·</span>
                <span class="row-relative text-muted">{{ formatRelativeTime(v.publishedAt) }}</span>
              </div>
            </div>

            <!-- Action Button -->
            <div class="action-col">
              <a
                v-if="v.youtubeVideoId"
                :href="`https://www.youtube.com/watch?v=${v.youtubeVideoId}`"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-yt-link"
                title="Mở trên YouTube"
              >
                <span>YouTube</span>
                <AppIcon name="external" :size="12" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Flat List Mode (Calendar Overview) -->
    <div v-else class="flat-timeline-list">
      <div
        v-for="v in displayVideos"
        :key="v.id"
        class="timeline-video-row"
      >
        <!-- Thumbnail using VideoThumbnail.vue -->
        <div class="thumb-col">
          <VideoThumbnail
            :src="v.thumbnailUrl"
            :alt="v.title"
            :youtube-video-id="v.youtubeVideoId"
            :detail-url="`/videos/${v.id}`"
            ratio="16-9"
          />
        </div>

        <!-- Video Info -->
        <div class="info-col">
          <router-link :to="`/videos/${v.id}`" class="video-row-title" :title="v.title">
            {{ v.title }}
          </router-link>

          <div class="video-row-meta">
            <!-- Channel Info -->
            <router-link
              v-if="v.channelId"
              :to="`/kenh-theo-doi/${v.channelId}`"
              class="channel-pill-link"
            >
              <img
                v-if="v.channelAvatarUrl && !avatarErrors[v.channelId]"
                :src="v.channelAvatarUrl"
                :alt="v.channelName"
                class="row-ch-avatar"
                @error="avatarErrors[v.channelId] = true"
              />
              <div
                v-else
                class="row-avatar-fallback"
                :style="{ backgroundColor: getAvatarColor(v.channelName) }"
              >
                {{ v.channelName.charAt(0).toUpperCase() }}
              </div>
              <span class="row-ch-name">{{ v.channelName }}</span>
            </router-link>
            <span v-else class="row-ch-name text-muted">{{ v.channelName }}</span>

            <span class="meta-dot">·</span>
            <span class="row-time mono">{{ v.vnFormatted }}</span>
            <span class="meta-dot">·</span>
            <span class="row-relative text-muted">{{ formatRelativeTime(v.publishedAt) }}</span>
          </div>
        </div>

        <!-- Action Button -->
        <div class="action-col">
          <a
            v-if="v.youtubeVideoId"
            :href="`https://www.youtube.com/watch?v=${v.youtubeVideoId}`"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-yt-link"
            title="Mở trên YouTube"
          >
            <span>YouTube</span>
            <AppIcon name="external" :size="12" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import VideoThumbnail from '@/components/videos/VideoThumbnail.vue';
import type { PublishingVideo } from '@/types/publishing-schedule';
import { formatRelativeTime, toVietnamDateParts } from '@/services/publishing-schedule-service';

const props = withDefaults(
  defineProps<{
    videos: PublishingVideo[];
    groupedByDate?: boolean;
    limit?: number;
  }>(),
  {
    groupedByDate: false,
    limit: 50,
  }
);

const avatarErrors = ref<Record<string, boolean>>({});

const avatarColors = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#4f46e5'];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

const displayVideos = computed(() => {
  return props.videos.slice(0, props.limit);
});

// Group by Date for Timeline View
interface DateGroup {
  dateKey: string;
  label: string;
  dateStr: string;
  videos: PublishingVideo[];
}

const dateGroups = computed<DateGroup[]>(() => {
  const groupsMap = new Map<string, PublishingVideo[]>();
  for (const v of displayVideos.value) {
    const key = v.vnDate || 'unknown';
    const list = groupsMap.get(key) || [];
    list.push(v);
    groupsMap.set(key, list);
  }

  const nowMs = Date.now();
  const todayVn = toVietnamDateParts(new Date(nowMs).toISOString()).dateStr;
  const yesterdayVn = toVietnamDateParts(new Date(nowMs - 86400000).toISOString()).dateStr;

  const result: DateGroup[] = [];
  for (const [dateKey, list] of groupsMap.entries()) {
    let label = dateKey;
    if (dateKey === todayVn) {
      label = 'HÔM NAY';
    } else if (dateKey === yesterdayVn) {
      label = 'HÔM QUA';
    } else if (list.length > 0) {
      label = list[0].vnWeekdayName;
    }

    // Format display date: DD/MM/YYYY
    const parts = dateKey.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateKey;

    result.push({
      dateKey,
      label,
      dateStr: formattedDate,
      videos: list,
    });
  }

  // Sort groups descending by dateKey
  return result.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
});
</script>

<style scoped>
.publishing-recent-timeline {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.timeline-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.timeline-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.timeline-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.count-badge {
  font-size: 0.8rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 9px;
  border-radius: 6px;
}

.timeline-empty {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
}

/* Timeline Row */
.flat-timeline-list,
.group-videos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-video-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.15s ease;
}

.timeline-video-row:hover {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border-color: #cbd5e1;
}

.thumb-col {
  width: 140px;
  border-radius: 6px;
  overflow: hidden;
}

.info-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.video-row-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  text-decoration: none;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-row-title:hover {
  color: #2563eb;
}

.video-row-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #64748b;
  flex-wrap: wrap;
}

.channel-pill-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #1e293b;
  font-weight: 600;
}

.channel-pill-link:hover {
  color: #2563eb;
}

.row-ch-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
}

.row-avatar-fallback {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
}

.row-ch-name {
  font-weight: 600;
}

.meta-dot {
  color: #cbd5e1;
}

.row-time {
  font-weight: 600;
  color: #334155;
}

.action-col {
  display: flex;
  align-items: center;
}

.btn-yt-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-yt-link:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #ef4444;
}

/* Grouped Day By Day Timeline Mode */
.grouped-timeline-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.date-group-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-sticky-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.date-badge-wrap {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.date-label-main {
  font-size: 0.92rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.04em;
}

.date-sub-str {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.group-count-tag {
  font-size: 0.75rem;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .timeline-video-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .thumb-col {
    width: 100%;
  }
  .action-col {
    justify-content: flex-end;
  }
}
</style>
