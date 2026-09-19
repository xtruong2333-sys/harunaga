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
            <div class="footer-brand">Bắt Bài Đối Thủ</div>
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
  display: flex;
  background: rgba(5,12,24,.56);
  backdrop-filter: blur(7px);
}

.drawer-panel {
  width: 300px;
  max-width: 88vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #0B1323 0%, #0D1728 58%, #0A1220 100%);
  border-right: 1px solid rgba(148,163,184,.14);
  box-shadow: 18px 0 42px rgba(4,11,22,.26);
}

.drawer-header {
  padding: 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148,163,184,.13);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(145deg, rgba(59,130,246,.25), rgba(37,99,235,.08));
  border: 1px solid rgba(96,165,250,.32);
  display: grid;
  place-items: center;
}

.brand-core {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #60A5FA;
  box-shadow: 0 0 10px rgba(96,165,250,.85);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  color: #F6F9FC;
  font-size: 13.5px;
  font-weight: 760;
  letter-spacing: -.01em;
}

.brand-subtitle {
  color: #8297AF;
  font-size: 10.5px;
}

.close-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(148,163,184,.16);
  background: rgba(255,255,255,.05);
  color: #A9B9CA;
  cursor: pointer;
}

.close-btn:hover {
  color: #FFF;
  background: rgba(255,255,255,.09);
}

.drawer-nav {
  flex: 1;
  overflow-y: auto;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.drawer-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-group-title {
  padding: 0 10px 6px;
  color: #647A93;
  font-size: 10.5px;
  font-weight: 750;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.drawer-group-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.drawer-nav-item {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 11px;
  color: #AEBCCD;
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}

.drawer-nav-item:hover {
  color: #F4F8FC;
  background: rgba(255,255,255,.055);
  border-color: rgba(148,163,184,.10);
}

.drawer-nav-item-active {
  color: #FFF;
  background: linear-gradient(135deg, rgba(37,99,235,.96), rgba(29,78,216,.88));
  border-color: rgba(96,165,250,.45);
  box-shadow: 0 8px 20px rgba(37,99,235,.22);
}

.drawer-footer {
  padding: 14px 18px;
  border-top: 1px solid rgba(148,163,184,.12);
}

.footer-brand {
  color: #71859E;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity .22s ease;
}

.drawer-fade-enter-active .drawer-panel,
.drawer-fade-leave-active .drawer-panel {
  transition: transform .22s cubic-bezier(.16,1,.3,1);
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
