<template>
  <div class="video-channel-context surface-card">
    <div class="context-header">
      <h3 class="context-title">THÔNG TIN KÊNH ĐỐI THỦ</h3>
      <a
        :href="channel.url"
        target="_blank"
        rel="noopener noreferrer"
        class="external-yt-link"
        title="Xem kênh trên YouTube"
      >
        <span>Kênh YouTube</span>
        <AppIcon name="external" size="12" />
      </a>
    </div>

    <div class="channel-profile-box">
      <div class="avatar-wrap">
        <img
          v-if="channel.avatarUrl && !avatarError"
          :src="channel.avatarUrl"
          :alt="channel.name"
          class="avatar-img"
          loading="lazy"
          @error="avatarError = true"
        />
        <div v-else class="avatar-char">
          {{ (channel.name || 'C').charAt(0).toUpperCase() }}
        </div>
      </div>

      <div class="channel-name-meta">
        <router-link :to="'/kenh-theo-doi/' + channel.id" class="name-anchor">
          {{ channel.name }}
        </router-link>
        <span v-if="channel.handle" class="handle-txt">{{ channel.handle }}</span>
      </div>
    </div>

    <div class="config-grid">
      <div class="config-item">
        <span class="cfg-lbl">Trạng thái</span>
        <span class="status-chip" :class="`status-${channel.status}`">
          {{ channel.status === 'active' ? 'Đang theo dõi' : channel.status === 'paused' ? 'Tạm dừng' : 'Lưu trữ' }}
        </span>
      </div>

      <div class="config-item">
        <span class="cfg-lbl">Giới hạn quét</span>
        <span class="cfg-val mono">{{ channel.scanLimit !== null && channel.scanLimit !== undefined ? `${channel.scanLimit} video mới nhất` : '—' }}</span>
      </div>

      <div class="config-item">
        <span class="cfg-lbl">Ngưỡng cảnh báo</span>
        <span class="cfg-val mono">{{ channel.alertVphThreshold ? channel.alertVphThreshold.toLocaleString('vi-VN') + ' VPH' : '—' }}</span>
      </div>
    </div>

    <div class="context-action-footer">
      <router-link
        :to="'/kenh-theo-doi/' + channel.id"
        class="btn-channel-detail"
      >
        <span>Xem Phân Tích Kênh</span>
        <AppIcon name="arrow-right" size="13" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { VideoDetailChannelMeta } from '@/types/video';

defineProps<{
  channel: VideoDetailChannelMeta;
}>();

const avatarError = ref(false);
</script>

<style scoped>
.video-channel-context {
  padding: 22px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.context-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border, #E3EBF3);
}

.context-title {
  font-size: 13.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-primary, #0F172A);
  margin: 0;
}

.external-yt-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #64748B);
  text-decoration: none;
}

.external-yt-link:hover {
  color: var(--primary, #2563EB);
}

.channel-profile-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-char {
  width: 100%;
  height: 100%;
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  font-weight: 700;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-name-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-anchor {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
  text-decoration: none;
}

.name-anchor:hover {
  color: var(--primary, #2563EB);
}

.handle-txt {
  font-size: 12px;
  color: var(--text-muted, #64748B);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 12px;
  background: var(--bg-inset, #F8FAFC);
  border: 1px solid var(--border, #E3EBF3);
  border-radius: 10px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cfg-lbl {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #64748B);
}

.cfg-val {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary, #0F172A);
}

.status-chip {
  font-size: 11.5px;
  font-weight: 700;
  color: #059669;
}

.context-action-footer {
  padding-top: 4px;
}

.btn-channel-detail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E3EBF3);
  color: var(--text-primary, #0F172A);
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-channel-detail:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

@media (max-width: 640px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
