<template>
  <div class="app-layout" :class="{ 'is-sidebar-collapsed': sidebarCollapsed }">
    <IntelligenceField />

    <!-- Desktop Sidebar (260px -> 72px) -->
    <aside
      class="app-sidebar command-rail"
      :class="{ 'sidebar-collapsed': sidebarCollapsed }"
      aria-label="Điều hướng chính"
    >
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <router-link to="/tong-quan" class="sidebar-brand rail-brand" title="BẮT BÀI ĐỐI THỦ">
          <div class="brand-logo-mark">
            <span class="rail-brand__core"></span>
            <span class="rail-brand__pulse"></span>
          </div>
          <div v-if="!sidebarCollapsed" class="brand-info">
            <div class="brand-name">BẮT BÀI ĐỐI THỦ</div>
            <div class="brand-tagline">YouTube Intelligence OS</div>
          </div>
        </router-link>

        <button
          type="button"
          class="sidebar-collapse-btn"
          :title="sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'"
          :aria-label="sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'"
          @click="toggleSidebar"
        >
          <AppIcon
            :name="sidebarCollapsed ? 'chevron-right' : 'chevron-left'"
            size="16"
          />
        </button>
      </div>

      <!-- Navigation Body -->
      <nav class="sidebar-nav rail-nav">
        <div v-for="group in navGroups" :key="group.title" class="nav-group">
          <div v-if="!sidebarCollapsed" class="nav-group-title">{{ group.title }}</div>
          <div class="nav-group-items">
            <router-link
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="sidebar-item rail-item"
              active-class="sidebar-item--active rail-item--active"
              :title="sidebarCollapsed ? item.label : undefined"
            >
              <div class="item-icon-wrap">
                <AppIcon :name="item.icon" size="18" />
              </div>
              <span v-if="!sidebarCollapsed" class="item-label-wrap rail-label">
                <strong class="item-title">{{ item.label }}</strong>
                <small v-if="item.hint" class="item-hint">{{ item.hint }}</small>
              </span>

              <!-- Hover Tooltip when Collapsed -->
              <div v-if="sidebarCollapsed" class="sidebar-tooltip">
                <div class="tooltip-title">{{ item.label }}</div>
                <div v-if="item.hint" class="tooltip-hint">{{ item.hint }}</div>
              </div>
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer rail-footer">
        <div class="sidebar-theme-wrapper rail-theme-wrapper">
          <ThemeToggle size="sm" />
        </div>
        <div
          v-if="!sidebarCollapsed"
          class="rail-health system-status-indicator"
          title="Hệ thống sẵn sàng"
        >
          <span class="pulse-dot"></span>
          <span class="status-text">Hệ thống sẵn sàng</span>
        </div>
        <div
          v-else
          class="rail-health compact-health"
          title="Hệ thống sẵn sàng"
        >
          <span class="pulse-dot"></span>
        </div>
      </div>
    </aside>

    <!-- Desktop Topbar -->
    <header
      class="workspace-topbar"
      :class="{ 'topbar-collapsed': sidebarCollapsed }"
    >
      <div class="workspace-context">
        <div class="workspace-eyebrow">
          <span class="signal-dot"></span>
          INTELLIGENCE OS
        </div>
        <div class="workspace-title">{{ currentTitle }}</div>
      </div>

      <div class="workspace-actions">
        <div class="live-pill">
          <span class="live-pill__dot"></span>
          <span>LIVE SIGNAL</span>
        </div>
        <ThemeToggle size="sm" />
      </div>
    </header>

    <!-- Mobile Topbar -->
    <header class="mobile-topbar">
      <div class="brand-mobile">
        <span class="brand-mobile-core"></span>
        <div>
          <div class="brand-mobile-title">BẮT BÀI ĐỐI THỦ</div>
          <div class="brand-mobile-subtitle">YouTube Intelligence</div>
        </div>
      </div>

      <div class="mobile-topbar-actions">
        <ThemeToggle size="sm" />
        <button
          class="mobile-menu-btn"
          type="button"
          aria-label="Mở menu điều hướng"
          @click="mobileDrawerOpen = true"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="7" x2="20" y2="7"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="17" x2="20" y2="17"></line>
          </svg>
        </button>
      </div>
    </header>

    <MobileNavDrawer v-model="mobileDrawerOpen" />

    <!-- Main Content Area -->
    <main
      class="main-content"
      :class="{ 'content-collapsed': sidebarCollapsed }"
    >
      <div class="main-content__inner">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import ThemeToggle from '@/components/ui/ThemeToggle.vue';
import MobileNavDrawer from '@/components/ui/MobileNavDrawer.vue';
import IntelligenceField from '@/components/motion/IntelligenceField.vue';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  hint?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const mobileDrawerOpen = ref(false);
const sidebarCollapsed = ref(false);
const route = useRoute();

const navGroups: NavGroup[] = [
  {
    title: 'TỔNG QUAN',
    items: [
      { to: '/tong-quan', icon: 'dashboard', label: 'Tổng Quan', hint: 'Trung tâm tín hiệu' },
      { to: '/bao-cao', icon: 'file-text', label: 'Báo Cáo', hint: 'Tổng hợp dữ liệu' },
    ],
  },
  {
    title: 'THEO DÕI VIDEO',
    items: [
      { to: '/video-moi-dang', icon: 'clock', label: 'Video Mới', hint: 'Upload gần nhất' },
      { to: '/video-tiem-nang', icon: 'zap', label: 'Cơ Hội', hint: 'Video tiềm năng' },
      { to: '/videos', icon: 'trending-up', label: 'Radar Tăng', hint: 'Video breakout' },
    ],
  },
  {
    title: 'ĐỐI THỦ & LỊCH',
    items: [
      { to: '/kenh-theo-doi', icon: 'tv', label: 'Đối Thủ', hint: 'Mạng lưới kênh' },
      { to: '/so-sanh-kenh', icon: 'bar-chart-2', label: 'So Sánh', hint: 'Đối chiếu kênh' },
      { to: '/lich-dang-doi-thu', icon: 'calendar', label: 'Lịch Đăng', hint: 'Pattern xuất bản' },
    ],
  },
  {
    title: 'HỆ THỐNG & AI',
    items: [
      { to: '/lich-su-canh-bao', icon: 'bell', label: 'Cảnh Báo', hint: 'Lịch sử tín hiệu' },
      { to: '/tro-ly-noi-dung', icon: 'sparkles', label: 'AI Studio', hint: 'Trợ lý nội dung' },
      { to: '/tien-do-san-xuat', icon: 'clipboard-list', label: 'Sản Xuất', hint: 'Pipeline nội dung' },
      { to: '/tinh-trang-du-lieu', icon: 'database', label: 'Dữ Liệu', hint: 'Sức khỏe hệ thống' },
    ],
  },
];

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('bbdt_sidebar_collapsed', String(sidebarCollapsed.value));
    } catch {
      // Ignore localStorage write error
    }
  }
}

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('bbdt_sidebar_collapsed');
      if (saved !== null) {
        sidebarCollapsed.value = saved === 'true';
      }
    } catch {
      // Ignore localStorage read error
    }
  }
});

const currentTitle = computed(() => {
  const title = typeof route.meta.title === 'string' ? route.meta.title : 'Bắt Bài Đối Thủ';
  return title.replace(' — Bắt Bài Đối Thủ', '');
});
</script>

<style scoped>
.app-layout {
  position: relative;
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: clip;
  background: transparent;
}

/* ==========================================================================
   Desktop Sidebar (260px -> 72px)
   ========================================================================== */
.app-sidebar,
.command-rail {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  width: 260px;
  display: flex;
  flex-direction: column;
  transition: width 0.25s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
}

.sidebar-collapsed {
  width: 72px;
}

[data-theme="light"] .app-sidebar,
[data-theme="light"] .command-rail {
  background: rgba(255, 255, 255, 0.95);
  border-right: 1px solid var(--border, #E3EBF3);
  box-shadow: var(--shadow-sm, 0 4px 14px rgba(30, 60, 90, 0.05));
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
}

[data-theme="dark"] .app-sidebar,
[data-theme="dark"] .command-rail {
  background: linear-gradient(180deg, rgba(9, 14, 24, 0.92), rgba(6, 11, 20, 0.84));
  border-right: 1px solid rgba(125, 211, 252, 0.10);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(20px) saturate(130%);
  -webkit-backdrop-filter: blur(20px) saturate(130%);
}

/* Sidebar Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--border-line, rgba(15, 60, 90, 0.06));
  position: relative;
}

.sidebar-collapsed .sidebar-header {
  padding: 16px 12px;
  justify-content: center;
}

.sidebar-brand,
.rail-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  min-width: 0;
}

.brand-logo-mark {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

[data-theme="light"] .brand-logo-mark {
  background: radial-gradient(circle at 35% 28%, rgba(37, 99, 235, 0.15), rgba(14, 165, 233, 0.06) 60%, rgba(255, 255, 255, 0.9) 100%);
  border: 1px solid rgba(37, 99, 235, 0.20);
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.12);
}

[data-theme="dark"] .brand-logo-mark {
  background: radial-gradient(circle at 35% 28%, rgba(103, 232, 249, 0.28), rgba(14, 165, 233, 0.06) 60%, rgba(3, 7, 18, 0.2) 100%);
  border: 1px solid rgba(103, 232, 249, 0.24);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
}

.rail-brand__core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary, #2563EB);
  box-shadow: 0 0 10px var(--primary, #2563EB);
}

[data-theme="dark"] .rail-brand__core {
  background: #38BDF8;
  box-shadow: 0 0 10px #38BDF8;
}

.rail-brand__pulse {
  position: absolute;
  inset: 5px;
  border: 1px solid var(--primary, #2563EB);
  border-radius: 50%;
  opacity: 0.35;
  animation: orbit-pulse 2.8s ease-out infinite;
}

[data-theme="dark"] .rail-brand__pulse {
  border-color: #38BDF8;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
}

.brand-name {
  font-size: 13.5px;
  font-weight: 750;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  white-space: nowrap;
}

.brand-tagline {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Sidebar Collapse Button */
.sidebar-collapse-btn {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--border, #E3EBF3);
  background: var(--surface-muted, #F7FAFD);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.sidebar-collapse-btn:hover {
  background: var(--primary-soft, #EFF6FF);
  color: var(--primary, #2563EB);
  border-color: #BFDBFE;
}

.sidebar-collapsed .sidebar-collapse-btn {
  display: none;
}

/* Sidebar Nav */
.sidebar-nav,
.rail-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: thin;
}

.sidebar-collapsed .sidebar-nav {
  padding: 14px 8px;
  gap: 8px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 4px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-group-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 0 10px 4px;
  text-transform: uppercase;
}

.nav-group-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-item,
.rail-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.sidebar-collapsed .sidebar-item {
  padding: 8px;
  justify-content: center;
  width: 44px;
  height: 40px;
  margin: 0 auto;
}

[data-theme="light"] .sidebar-item,
[data-theme="light"] .rail-item {
  color: #475569;
}

[data-theme="light"] .sidebar-item:hover,
[data-theme="light"] .rail-item:hover {
  color: var(--primary, #2563EB);
  background: #F3F7FB;
  border-color: #E3EBF3;
}

[data-theme="light"] .sidebar-item--active,
[data-theme="light"] .rail-item--active {
  color: #1D4ED8;
  background: #EFF6FF;
  border-color: #BFDBFE;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.06);
}

[data-theme="dark"] .sidebar-item,
[data-theme="dark"] .rail-item {
  color: #94A3B8;
}

[data-theme="dark"] .sidebar-item:hover,
[data-theme="dark"] .rail-item:hover {
  color: #38BDF8;
  background: rgba(14, 165, 233, 0.08);
  border-color: rgba(125, 211, 252, 0.15);
}

[data-theme="dark"] .sidebar-item--active,
[data-theme="dark"] .rail-item--active {
  color: #38BDF8;
  background: rgba(14, 165, 233, 0.14);
  border-color: rgba(56, 189, 248, 0.3);
  font-weight: 600;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.12);
}

.item-icon-wrap {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 22px;
}

.item-label-wrap,
.rail-label {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.item-title {
  font-size: 13px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-hint {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.2;
}

/* Floating Tooltip when Collapsed */
.sidebar-tooltip {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%) translateX(-4px);
  opacity: 0;
  pointer-events: none;
  background: #0F1F35;
  color: #FFFFFF;
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  z-index: 999;
  transition: opacity 0.15s ease, transform 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

[data-theme="dark"] .sidebar-tooltip {
  background: #111827;
  border: 1px solid rgba(125, 211, 252, 0.2);
  color: #F8FAFC;
}

.sidebar-tooltip::before {
  content: "";
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: transparent #0F1F35 transparent transparent;
}

[data-theme="dark"] .sidebar-tooltip::before {
  border-color: transparent #111827 transparent transparent;
}

.sidebar-item:hover .sidebar-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.tooltip-title {
  font-size: 12px;
  font-weight: 600;
}

.tooltip-hint {
  font-size: 10px;
  color: #94A3B8;
}

/* Sidebar Footer */
.sidebar-footer,
.rail-footer {
  padding: 12px 14px;
  border-top: 1px solid var(--border-line, rgba(15, 60, 90, 0.06));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sidebar-collapsed .sidebar-footer {
  padding: 12px 6px;
  flex-direction: column;
  gap: 10px;
}

.sidebar-theme-wrapper,
.rail-theme-wrapper {
  display: flex;
  align-items: center;
}

.system-status-indicator,
.rail-health {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.compact-health {
  justify-content: center;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  animation: signal-pulse 2s infinite ease-in-out;
}

/* ==========================================================================
   Desktop Topbar
   ========================================================================== */
.workspace-topbar {
  margin-left: 260px;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 2vw, 32px);
  backdrop-filter: blur(18px) saturate(130%);
  -webkit-backdrop-filter: blur(18px) saturate(130%);
  transition: margin-left 0.25s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
}

.topbar-collapsed {
  margin-left: 72px;
}

[data-theme="light"] .workspace-topbar {
  background: rgba(245, 248, 252, 0.84);
  border-bottom: 1px solid var(--border, #E3EBF3);
}

[data-theme="dark"] .workspace-topbar {
  background: rgba(5, 7, 13, 0.78);
  border-bottom: 1px solid rgba(125, 211, 252, 0.08);
}

.workspace-context {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.workspace-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--primary, #2563EB);
  text-transform: uppercase;
}

[data-theme="dark"] .workspace-eyebrow {
  color: #38BDF8;
}

.signal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.workspace-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.workspace-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

[data-theme="light"] .live-pill {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
}

[data-theme="dark"] .live-pill {
  background: rgba(34, 197, 94, 0.12);
  color: #34D399;
  border: 1px solid rgba(34, 197, 94, 0.28);
}

.live-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: signal-pulse 2s infinite ease-in-out;
}

/* ==========================================================================
   Main Content Area
   ========================================================================== */
.main-content {
  margin-left: 260px;
  width: calc(100% - 260px);
  max-width: none;
  padding: clamp(20px, 2vw, 32px);
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
  transition: margin-left 0.25s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
              width 0.25s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
}

.content-collapsed {
  margin-left: 72px;
  width: calc(100% - 72px);
}

.main-content__inner {
  width: 100%;
  max-width: none;
  margin: 0 auto;
}

.mobile-topbar {
  display: none;
}

/* Keyframe Animations */
@keyframes orbit-pulse {
  0% { transform: scale(0.75); opacity: 0; }
  35% { opacity: 0.65; }
  100% { transform: scale(1.45); opacity: 0; }
}

@keyframes signal-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.8); }
}

/* ==========================================================================
   Mobile Responsive (< 1024px)
   ========================================================================== */
@media (max-width: 1024px) {
  .app-sidebar,
  .command-rail,
  .workspace-topbar {
    display: none !important;
  }

  .mobile-topbar {
    position: sticky;
    top: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px 16px;
    backdrop-filter: blur(18px);
    transition: all 0.2s ease;
  }

  [data-theme="light"] .mobile-topbar {
    background: rgba(255, 255, 255, 0.92);
    border-bottom: 1px solid var(--border, #E3EBF3);
    box-shadow: 0 2px 8px rgba(30, 60, 90, 0.04);
  }

  [data-theme="dark"] .mobile-topbar {
    background: rgba(6, 11, 20, 0.88);
    border-bottom: 1px solid rgba(125, 211, 252, 0.10);
  }

  .brand-mobile {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-mobile-core {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    border: 1px solid var(--border-strong, #CBD9E6);
    background: radial-gradient(circle, var(--primary, #2563EB) 0 25%, rgba(37, 99, 235, 0.1) 100%);
    box-shadow: 0 2px 10px rgba(37, 99, 235, 0.15);
  }

  [data-theme="dark"] .brand-mobile-core {
    background: radial-gradient(circle, #38BDF8 0 25%, rgba(56, 189, 248, 0.1) 100%);
    border-color: rgba(103, 232, 249, 0.3);
  }

  .brand-mobile-title {
    font-size: 13px;
    font-weight: 750;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }

  .brand-mobile-subtitle {
    color: var(--text-muted);
    font-size: 10px;
  }

  .mobile-topbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-menu-btn {
    display: grid;
    place-items: center;
    min-width: 38px;
    height: 38px;
    padding: 0;
    border: 1px solid var(--border, #E3EBF3);
    border-radius: 10px;
    color: var(--text-primary);
    background: var(--surface, #FFFFFF);
    cursor: pointer;
  }

  .main-content {
    margin-left: 0 !important;
    width: 100% !important;
    padding: 16px;
    min-height: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rail-brand__pulse,
  .live-pill__dot,
  .pulse-dot {
    animation: none;
  }
}
</style>
