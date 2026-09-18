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
              <div class="brand-logo-mark">
                <span class="brand-core"></span>
              </div>
              <div class="brand-text">
                <div class="brand-title">BẮT BÀI ĐỐI THỦ</div>
                <div class="brand-subtitle">YouTube Intelligence OS</div>
              </div>
            </div>

            <button
              class="close-btn"
              type="button"
              aria-label="Đóng menu"
              @click="close"
            >
              <AppIcon name="x" size="18" />
            </button>
          </div>

          <!-- Navigation Links Grouped -->
          <nav class="drawer-nav">
            <div v-for="group in navGroups" :key="group.title" class="drawer-group">
              <div class="drawer-group-title">{{ group.title }}</div>
              <div class="drawer-group-items">
                <router-link
                  v-for="item in group.items"
                  :key="item.path"
                  :to="item.path"
                  class="drawer-nav-item"
                  active-class="drawer-nav-item-active"
                  @click="close"
                >
                  <AppIcon :name="item.icon" size="17" class="drawer-item-icon" />
                  <span class="drawer-item-label">{{ item.label }}</span>
                </router-link>
              </div>
            </div>
          </nav>

          <!-- Drawer Footer -->
          <div class="drawer-footer">
            <div class="footer-status">
              <span class="pulse-dot"></span>
              <span>Hệ thống sẵn sàng</span>
            </div>
            <div class="footer-version">v1.1 Live</div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const navGroups: NavGroup[] = [
  {
    title: 'TỔNG QUAN',
    items: [
      { path: '/tong-quan', label: 'Tổng Quan', icon: 'dashboard' },
      { path: '/bao-cao', label: 'Báo Cáo', icon: 'file-text' },
    ],
  },
  {
    title: 'THEO DÕI VIDEO',
    items: [
      { path: '/video-moi-dang', label: 'Video Mới Đăng', icon: 'clock' },
      { path: '/video-tiem-nang', label: 'Cơ Hội Tăng Trưởng', icon: 'zap' },
      { path: '/videos', label: 'Radar Tốc Độ', icon: 'trending-up' },
    ],
  },
  {
    title: 'ĐỐI THỦ & LỊCH',
    items: [
      { path: '/kenh-theo-doi', label: 'Mạng Lưới Kênh', icon: 'tv' },
      { path: '/so-sanh-kenh', label: 'So Sánh Kênh', icon: 'bar-chart-2' },
      { path: '/lich-dang-doi-thu', label: 'Lịch Đăng Đối Thủ', icon: 'calendar' },
    ],
  },
  {
    title: 'HỆ THỐNG & AI',
    items: [
      { path: '/lich-su-canh-bao', label: 'Cảnh Báo Discord', icon: 'bell' },
      { path: '/tro-ly-noi-dung', label: 'Trợ Lý AI Studio', icon: 'sparkles' },
      { path: '/tien-do-san-xuat', label: 'Tiến Độ Sản Xuất', icon: 'clipboard-list' },
      { path: '/tinh-trang-du-lieu', label: 'Sức Khỏe Dữ Liệu', icon: 'database' },
    ],
  },
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
  background-color: rgba(15, 31, 53, 0.45);
  backdrop-filter: blur(6px);
  display: flex;
}

[data-theme="dark"] .drawer-backdrop {
  background-color: rgba(3, 7, 13, 0.75);
}

.drawer-panel {
  width: 290px;
  max-width: 85vw;
  height: 100%;
  background-color: var(--surface, #FFFFFF);
  border-right: 1px solid var(--border, #E3EBF3);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg, 0 20px 55px rgba(30, 60, 90, 0.12));
}

[data-theme="dark"] .drawer-panel {
  background-color: #090E18;
  border-color: rgba(125, 211, 252, 0.12);
}

.drawer-header {
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border, #E3EBF3);
}

[data-theme="dark"] .drawer-header {
  border-color: rgba(125, 211, 252, 0.10);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo-mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: radial-gradient(circle at 35% 28%, rgba(37, 99, 235, 0.15), rgba(14, 165, 233, 0.06) 60%, rgba(255, 255, 255, 0.9) 100%);
  border: 1px solid rgba(37, 99, 235, 0.20);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

[data-theme="dark"] .brand-logo-mark {
  background: radial-gradient(circle at 35% 28%, rgba(103, 232, 249, 0.28), rgba(14, 165, 233, 0.06) 60%, rgba(3, 7, 18, 0.2) 100%);
  border-color: rgba(103, 232, 249, 0.24);
}

.brand-core {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--primary, #2563EB);
  box-shadow: 0 0 8px var(--primary, #2563EB);
}

[data-theme="dark"] .brand-core {
  background: #38BDF8;
  box-shadow: 0 0 8px #38BDF8;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 13.5px;
  font-weight: 750;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.brand-subtitle {
  font-size: 10px;
  color: var(--text-muted);
}

.close-btn {
  background: transparent;
  border: 1px solid var(--border, #E3EBF3);
  color: var(--text-secondary);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}

.close-btn:hover {
  color: var(--text-primary);
  background-color: var(--surface-hover, #F3F7FB);
}

.drawer-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.drawer-group-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 0 10px 4px;
  text-transform: uppercase;
}

.drawer-group-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.drawer-nav-item:hover {
  color: var(--primary, #2563EB);
  background-color: var(--surface-hover, #F3F7FB);
}

.drawer-nav-item-active {
  color: #1D4ED8;
  background: #EFF6FF;
  border-color: #BFDBFE;
  font-weight: 600;
}

[data-theme="dark"] .drawer-nav-item:hover {
  color: #38BDF8;
  background-color: rgba(14, 165, 233, 0.08);
}

[data-theme="dark"] .drawer-nav-item-active {
  color: #38BDF8;
  background: rgba(14, 165, 233, 0.14);
  border-color: rgba(56, 189, 248, 0.3);
}

.drawer-footer {
  padding: 14px 18px;
  border-top: 1px solid var(--border, #E3EBF3);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

[data-theme="dark"] .drawer-footer {
  border-color: rgba(125, 211, 252, 0.10);
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.footer-version {
  font-size: 10.5px;
  color: var(--text-muted);
}

/* Transitions */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-fade-enter-active .drawer-panel,
.drawer-fade-leave-active .drawer-panel {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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
