<template>
  <teleport to="body">
    <transition name="drawer-fade">
      <div
        v-if="modelValue"
        class="drawer-backdrop"
        @click="handleBackdropClick"
      >
        <div
          class="drawer-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          @click.stop
        >
          <!-- Drawer Header -->
          <div class="drawer-header">
            <div class="brand">
              <div class="brand-logo-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#38BDF8">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
              <div class="brand-text">
                <div class="brand-title">BẮT BÀI ĐỐI THỦ</div>
                <div class="brand-subtitle">Theo dõi đối thủ YouTube</div>
              </div>
            </div>

            <button
              class="close-btn"
              type="button"
              aria-label="Đóng menu"
              @click="close"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Navigation Links -->
          <nav class="drawer-nav">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="drawer-nav-item"
              active-class="drawer-nav-item-active"
              @click="close"
            >
              <AppIcon :name="item.icon" size="18" />
              <span>{{ item.label }}</span>
            </router-link>
          </nav>

          <!-- Drawer Footer -->
          <div class="drawer-footer">
            <div class="footer-status">
              <span class="status-dot"></span>
              <span>Hệ thống sẵn sàng</span>
            </div>
            <div class="footer-version">Phiên bản 1.0</div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const navItems = [
  { path: '/tong-quan', label: 'Tổng Quan', icon: 'dashboard' },
  { path: '/bao-cao', label: 'Báo Cáo', icon: 'file-text' },
  { path: '/video-moi-dang', label: 'Video Mới Đăng', icon: 'clock' },
  { path: '/video-tiem-nang', label: 'Video Tiềm Năng', icon: 'zap' },
  { path: '/videos', label: 'Video Đang Tăng', icon: 'trending-up' },
  { path: '/kenh-theo-doi', label: 'Kênh Theo Dõi', icon: 'tv' },
  { path: '/so-sanh-kenh', label: 'So Sánh Kênh', icon: 'bar-chart-2' },
  { path: '/lich-dang-doi-thu', label: 'Lịch Đăng Của Đối Thủ', icon: 'calendar' },
  { path: '/lich-su-canh-bao', label: 'Lịch Sử Cảnh Báo', icon: 'bell' },
  { path: '/tro-ly-noi-dung', label: 'Trợ Lý Nội Dung AI', icon: 'sparkles' },
  { path: '/tien-do-san-xuat', label: 'Tiến Độ Sản Xuất', icon: 'clipboard-list' },
  { path: '/tinh-trang-du-lieu', label: 'Tình Trạng Dữ Liệu', icon: 'database' },
];

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function handleBackdropClick() {
  close();
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    close();
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (typeof document !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown);
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(3, 7, 13, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
}

.drawer-panel {
  width: 280px;
  max-width: 85vw;
  height: 100%;
  background-color: #0E131A;
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-header {
  padding: 18px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.brand-subtitle {
  font-size: 10.5px;
  color: var(--text-secondary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.close-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-elevated);
}

.drawer-nav {
  flex: 1;
  overflow-y: auto;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
}

.drawer-nav-item:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-elevated);
}

.drawer-nav-item-active {
  color: var(--accent);
  background: rgba(56, 189, 248, 0.1);
  font-weight: 600;
  border-left: 3px solid var(--accent);
}

.drawer-footer {
  padding: 14px 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-muted);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--status-active);
  box-shadow: 0 0 6px var(--status-active);
}

.footer-version {
  font-size: 11px;
  color: var(--text-muted);
}

/* Transitions */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.28s ease;
}

.drawer-fade-enter-active .drawer-panel,
.drawer-fade-leave-active .drawer-panel {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-enter-from .drawer-panel,
.drawer-fade-leave-to .drawer-panel {
  transform: translateX(-100%);
}
</style>
