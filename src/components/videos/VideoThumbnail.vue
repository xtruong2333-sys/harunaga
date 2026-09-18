<template>
  <div
    class="video-thumbnail-container"
    :class="[`ratio-${ratio || '16-9'}`]"
  >
    <!-- Actual Image -->
    <img
      v-if="src && !hasError"
      :src="src"
      :alt="alt || 'Video thumbnail'"
      :loading="loading || 'lazy'"
      class="thumbnail-image"
      :class="imgClass"
      @error="hasError = true"
    />

    <!-- Fallback Placeholder when image is missing or errors -->
    <div v-else class="thumbnail-fallback">
      <div class="fallback-icon-wrap">
        <AppIcon name="video" :size="ratio === '1-1' ? 22 : 28" />
      </div>
      <span class="fallback-label">Thumbnail</span>
    </div>

    <!-- Fresh Badge Overlay (Top-Left) -->
    <div v-if="freshBadge" class="badge-slot-top-left">
      <span
        class="fresh-pill"
        :class="freshBadge === 'Vừa đăng' ? 'is-just-now' : 'is-recent'"
      >
        <span class="pulse-point" v-if="freshBadge === 'Vừa đăng'"></span>
        {{ freshBadge }}
      </span>
    </div>

    <!-- VPH Badge Overlay (Top-Right, Neutral Display) -->
    <div v-if="vphBadge !== undefined && vphBadge !== null" class="badge-slot-top-right">
      <span class="vph-overlay-badge">
        <AppIcon name="zap" size="11" />
        <span>{{ formattedVphBadge }}</span>
      </span>
    </div>

    <!-- Hover Overlay with Quick Action Buttons -->
    <div v-if="showOverlayActions" class="thumbnail-hover-overlay">
      <div class="overlay-actions">
        <router-link
          v-if="detailUrl"
          :to="detailUrl"
          class="overlay-btn overlay-btn-primary"
          title="Xem chi tiết video"
        >
          <AppIcon name="info" size="13" />
          <span>Chi tiết</span>
        </router-link>

        <a
          v-if="youtubeVideoId"
          :href="`https://www.youtube.com/watch?v=${youtubeVideoId}`"
          target="_blank"
          rel="noopener noreferrer"
          class="overlay-btn overlay-btn-yt"
          title="Mở video trên YouTube"
          @click.stop
        >
          <AppIcon name="external" size="13" />
          <span>YouTube</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = withDefaults(
  defineProps<{
    src?: string | null;
    alt?: string;
    ratio?: '16-9' | '4-3' | '1-1';
    loading?: 'lazy' | 'eager';
    detailUrl?: string;
    youtubeVideoId?: string;
    freshBadge?: string | null;
    vphBadge?: string | number | null;
    showOverlayActions?: boolean;
    imgClass?: string;
  }>(),
  {
    ratio: '16-9',
    loading: 'lazy',
    showOverlayActions: true,
  }
);

const hasError = ref(false);

const formattedVphBadge = computed(() => {
  if (typeof props.vphBadge === 'number') {
    if (props.vphBadge === 0) return '0 VPH';
    if (props.vphBadge >= 1000) {
      return `${(props.vphBadge / 1000).toFixed(1).replace(/\.0$/, '')}K VPH`;
    }
    return `${props.vphBadge} VPH`;
  }
  return props.vphBadge || '';
});
</script>

<style scoped>
.video-thumbnail-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--bg-inset, #EEF4F8);
  border-radius: 10px;
  display: block;
  user-select: none;
}

.ratio-16-9 {
  aspect-ratio: 16 / 9;
}

.ratio-4-3 {
  aspect-ratio: 4 / 3;
}

.ratio-1-1 {
  aspect-ratio: 1 / 1;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.video-thumbnail-container:hover .thumbnail-image {
  transform: scale(1.03);
}

.thumbnail-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #EEF4F8 0%, #E2E8F0 100%);
  color: var(--text-muted, #94A3B8);
}

[data-theme="dark"] .thumbnail-fallback {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  color: #64748B;
}

.fallback-icon-wrap {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  color: var(--text-secondary, #64748B);
}

[data-theme="dark"] .fallback-icon-wrap {
  background: rgba(255, 255, 255, 0.06);
  color: #94A3B8;
}

.fallback-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Badge slots */
.badge-slot-top-left {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  pointer-events: none;
}

.fresh-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.is-just-now {
  background: #059669;
  color: #FFFFFF;
}

.is-recent {
  background: #2563EB;
  color: #FFFFFF;
}

.pulse-point {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #A7F3D0;
  box-shadow: 0 0 8px #34D399;
}

.badge-slot-top-right {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  pointer-events: none;
}

.vph-overlay-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(15, 23, 42, 0.82);
  color: #38BDF8;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(56, 189, 248, 0.25);
}

/* Hover Overlay */
.thumbnail-hover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.25) 60%, rgba(15, 23, 42, 0.1) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 3;
}

.video-thumbnail-container:hover .thumbnail-hover-overlay,
.video-thumbnail-container:focus-within .thumbnail-hover-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
}

.overlay-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
}

.overlay-btn-primary {
  background: #2563EB;
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.overlay-btn-primary:hover {
  background: #1D4ED8;
  transform: translateY(-1px);
}

.overlay-btn-yt {
  background: rgba(255, 255, 255, 0.9);
  color: #0F172A;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.overlay-btn-yt:hover {
  background: #FFFFFF;
  color: #DC2626;
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .thumbnail-image {
    transition: none !important;
  }
  .video-thumbnail-container:hover .thumbnail-image {
    transform: none !important;
  }
  .thumbnail-hover-overlay {
    transition: none !important;
  }
}
</style>
