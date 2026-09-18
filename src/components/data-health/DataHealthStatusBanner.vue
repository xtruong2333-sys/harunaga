<template>
  <div class="status-banner" :class="`banner-tone-${status.tone}`">
    <div class="banner-icon-slot">
      <div class="tone-icon-bubble">
        <AppIcon v-if="status.code === 'normal'" name="shield-check" size="24" />
        <AppIcon v-else-if="status.code === 'running'" name="clock" size="24" class="pulse-icon" />
        <AppIcon v-else name="alert" size="24" />
      </div>
    </div>

    <div class="banner-content">
      <div class="banner-header-row">
        <div class="title-with-badge">
          <h2 class="status-headline">{{ status.label }}</h2>
          <span v-if="status.isStuckRunning" class="stuck-warning-badge">
            <AppIcon name="alert" size="12" />
            Lần quét này đã chạy hơn 30 phút
          </span>
        </div>
        <div class="status-meta">
          <span class="pulse-indicator" :class="`pulse-${status.tone}`"></span>
          <span class="status-tone-label">{{ toneLabel }}</span>
        </div>
      </div>
      <p class="status-description">{{ status.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { SystemStatus } from '@/types/data-health';

const props = defineProps<{
  status: SystemStatus;
}>();

const toneLabel = computed(() => {
  switch (props.status.tone) {
    case 'success':
      return 'Hệ Thống Ổn Định';
    case 'warning':
      return 'Cần Lưu Ý';
    case 'danger':
      return 'Sự Cố Hệ Thống';
    case 'info':
      return 'Đang Xử Lý';
    default:
      return 'Giám Sát';
  }
});
</script>

<style scoped>
.status-banner {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid transparent;
  transition: all 0.2s ease;
  overflow: hidden;
}

/* Tone Variants */
.banner-tone-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%);
  border-color: rgba(16, 185, 129, 0.25);
  color: var(--text-primary, #0F172A);
}
.banner-tone-success .tone-icon-bubble {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

.banner-tone-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(245, 158, 11, 0.02) 100%);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--text-primary, #0F172A);
}
.banner-tone-warning .tone-icon-bubble {
  background: rgba(245, 158, 11, 0.18);
  color: #D97706;
}

.banner-tone-danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.09) 0%, rgba(239, 68, 68, 0.02) 100%);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--text-primary, #0F172A);
}
.banner-tone-danger .tone-icon-bubble {
  background: rgba(239, 68, 68, 0.16);
  color: #DC2626;
}

.banner-tone-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.09) 0%, rgba(59, 130, 246, 0.02) 100%);
  border-color: rgba(59, 130, 246, 0.3);
  color: var(--text-primary, #0F172A);
}
.banner-tone-info .tone-icon-bubble {
  background: rgba(59, 130, 246, 0.16);
  color: #2563EB;
}

[data-theme="dark"] .banner-tone-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%);
  border-color: rgba(16, 185, 129, 0.3);
}
[data-theme="dark"] .banner-tone-success .tone-icon-bubble {
  color: #34D399;
}

[data-theme="dark"] .banner-tone-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.03) 100%);
  border-color: rgba(245, 158, 11, 0.35);
}
[data-theme="dark"] .banner-tone-warning .tone-icon-bubble {
  color: #FBBF24;
}

[data-theme="dark"] .banner-tone-danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(239, 68, 68, 0.04) 100%);
  border-color: rgba(239, 68, 68, 0.35);
}
[data-theme="dark"] .banner-tone-danger .tone-icon-bubble {
  color: #F87171;
}

[data-theme="dark"] .banner-tone-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.03) 100%);
  border-color: rgba(59, 130, 246, 0.35);
}
[data-theme="dark"] .banner-tone-info .tone-icon-bubble {
  color: #60A5FA;
}

.banner-icon-slot {
  flex-shrink: 0;
}

.tone-icon-bubble {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-icon {
  animation: spinSlow 8s linear infinite;
}

@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.banner-content {
  flex: 1;
  min-width: 0;
}

.banner-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-headline {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.stuck-warning-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #DC2626;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
}

[data-theme="dark"] .stuck-warning-badge {
  background: rgba(239, 68, 68, 0.25);
  color: #FCA5A5;
}

.status-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.85;
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.pulse-success { background: #10B981; box-shadow: 0 0 6px #10B981; }
.pulse-warning { background: #F59E0B; box-shadow: 0 0 6px #F59E0B; }
.pulse-danger { background: #EF4444; box-shadow: 0 0 6px #EF4444; }
.pulse-info { background: #3B82F6; box-shadow: 0 0 6px #3B82F6; }

.status-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary, #475569);
  line-height: 1.5;
}

[data-theme="dark"] .status-description {
  color: #94A3B8;
}

@media (max-width: 640px) {
  .status-banner {
    flex-direction: column;
    padding: 16px;
    gap: 12px;
  }
}
</style>
