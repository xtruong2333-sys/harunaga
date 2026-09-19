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
          :class="{ 'btn-collapsed': sidebarCollapsed }"
          :title="sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'"
          :aria-label="sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'"
          @click="toggleSidebar"
        >
          <AppIcon
            :name="sidebarCollapsed ? 'chevron-right' : 'chevron-left'"
            size="15"
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
              @mouseenter="showTooltip($event, item)"
              @mouseleave="hideTooltip"
              @focus="showTooltip($event, item)"
              @blur="hideTooltip"
            >
              <div class="item-icon-wrap">
                <AppIcon :name="item.icon" size="18" />
              </div>
              <span v-if="!sidebarCollapsed" class="item-label-wrap rail-label">
                <strong class="item-title">{{ item.label }}</strong>
                <small v-if="item.hint" class="item-hint">{{ item.hint }}</small>
              </span>
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer rail-footer">
        <div class="sidebar-theme-wrapper rail-theme-wrapper">
          <ThemeToggle size="sm" />
        </div>
      </div>
    </aside>

    <!-- Floating Portal Tooltip for Collapsed Sidebar -->
    <teleport to="body">
      <div
        v-if="sidebarCollapsed && activeTooltip"
        class="sidebar-portal-tooltip"
        :style="{
          top: `${activeTooltip.top}px`,
          left: `${activeTooltip.left}px`,
        }"
        role="tooltip"
      >
        <div class="tooltip-title">{{ activeTooltip.label }}</div>
        <div v-if="activeTooltip.hint" class="tooltip-hint">{{ activeTooltip.hint }}</div>
      </div>
    </teleport>

    <!-- Desktop Topbar -->
    <header
      class="workspace-topbar"
      :class="{ 'topbar-collapsed': sidebarCollapsed }"
    >
      <div class="workspace-context">
        <div class="workspace-eyebrow">
          <span class="signal-dot"></span>
          BẮT BÀI ĐỐI THỦ · INTELLIGENCE OS
        </div>
      </div>

      <div class="workspace-actions">
        <div class="workspace-mode-badge">
          <span>INTELLIGENCE WORKSPACE</span>
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
import { ref, onMounted } from 'vue';
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

const activeTooltip = ref<{
  label: string;
  hint?: string;
  top: number;
  left: number;
} | null>(null);

function showTooltip(e: Event, item: NavItem) {
  if (!sidebarCollapsed.value) return;
  const target = e.currentTarget as HTMLElement | null;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  activeTooltip.value = {
    label: item.label,
    hint: item.hint,
    top: rect.top + rect.height / 2,
    left: rect.right + 10,
  };
}

function hideTooltip() {
  activeTooltip.value = null;
}

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
  hideTooltip();
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

</script>

<style scoped>
.app-layout {
  position: relative;
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: clip;
  background: transparent;
}

.app-sidebar,
.command-rail {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;
  width: 236px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #0B1323 0%, #0D1728 55%, #0A1220 100%);
  border-right: 1px solid rgba(148,163,184,.14);
  box-shadow: 8px 0 28px rgba(6,15,28,.12);
  transition: width .22s cubic-bezier(.16,1,.3,1);
}

.sidebar-collapsed {
  width: 72px;
}

.sidebar-header {
  min-height: 70px;
  padding: 15px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(148,163,184,.13);
}

.sidebar-collapsed .sidebar-header {
  padding: 14px 8px;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.sidebar-brand,
.rail-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  text-decoration: none;
}

.brand-logo-mark {
  position: relative;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(59,130,246,.25), rgba(37,99,235,.08));
  border: 1px solid rgba(96,165,250,.32);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 8px 18px rgba(37,99,235,.12);
}

.rail-brand__core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #60A5FA;
  box-shadow: 0 0 12px rgba(96,165,250,.9);
}

.rail-brand__pulse {
  position: absolute;
  inset: 7px;
  border: 1px solid rgba(96,165,250,.5);
  border-radius: 50%;
  opacity: .55;
  animation: orbit-pulse 2.8s ease-out infinite;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.brand-name {
  color: #F6F9FC;
  font-size: 14px;
  font-weight: 760;
  letter-spacing: -.01em;
  white-space: nowrap;
}

.brand-tagline {
  color: #8FA4BD;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.sidebar-collapse-btn {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  padding: 0;
  border-radius: 9px;
  border: 1px solid rgba(148,163,184,.16);
  background: rgba(255,255,255,.055);
  color: #A9B9CA;
  cursor: pointer;
}

.sidebar-collapse-btn:hover {
  background: rgba(59,130,246,.16);
  color: #DBEAFE;
  border-color: rgba(96,165,250,.28);
}

.sidebar-nav,
.rail-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 18px 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(148,163,184,.24) transparent;
}

.sidebar-collapsed .sidebar-nav {
  padding: 14px 6px;
  gap: 10px;
  align-items: center;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}

.nav-group-title {
  padding: 0 10px 6px;
  color: #647A93;
  font-size: 10.5px;
  font-weight: 750;
  letter-spacing: .10em;
  text-transform: uppercase;
}

.nav-group-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sidebar-item,
.rail-item {
  min-height: 44px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 11px;
  border: 1px solid transparent;
  color: #AEBCCD;
  text-decoration: none;
  transition: background .15s ease, border-color .15s ease, color .15s ease, transform .15s ease;
}

.sidebar-collapsed .sidebar-item {
  width: 44px;
  height: 42px;
  padding: 8px;
  justify-content: center;
  margin: 0 auto;
}

.sidebar-item:hover,
.rail-item:hover {
  color: #F4F8FC;
  background: rgba(255,255,255,.055);
  border-color: rgba(148,163,184,.10);
}

.sidebar-item--active,
.rail-item--active {
  color: #FFFFFF;
  background: linear-gradient(135deg, rgba(37,99,235,.96), rgba(29,78,216,.88));
  border-color: rgba(96,165,250,.45);
  box-shadow: 0 8px 20px rgba(37,99,235,.23), inset 0 1px 0 rgba(255,255,255,.14);
}

.item-icon-wrap {
  width: 22px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.item-label-wrap,
.rail-label {
  min-width: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.item-title {
  color: inherit;
  font-size: 13.5px;
  font-weight: 650;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-hint {
  color: #778CA5;
  font-size: 10.8px;
  line-height: 1.25;
}

.sidebar-item--active .item-hint {
  color: rgba(255,255,255,.72);
}

.sidebar-footer,
.rail-footer {
  padding: 12px 14px;
  border-top: 1px solid rgba(148,163,184,.12);
  background: rgba(0,0,0,.10);
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.sidebar-collapsed .sidebar-footer {
  padding: 12px 6px;
  justify-content: center;
}

.workspace-topbar {
  margin-left: 236px;
  height: 54px;
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: rgba(255,255,255,.94);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 0 rgba(15,31,53,.02);
  backdrop-filter: blur(10px);
  transition: margin-left .22s cubic-bezier(.16,1,.3,1);
}

[data-theme="dark"] .workspace-topbar {
  background: rgba(15,26,43,.94);
}

.topbar-collapsed {
  margin-left: 72px;
}

.workspace-context {
  display: flex;
  align-items: center;
}

.workspace-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.signal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2563EB;
  box-shadow: 0 0 0 4px rgba(37,99,235,.10);
}

.workspace-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.workspace-mode-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .04em;
}

.main-content {
  margin-left: 236px;
  width: calc(100% - 236px);
  min-height: calc(100vh - 54px);
  padding: 28px 30px 48px;
  box-sizing: border-box;
  transition: margin-left .22s cubic-bezier(.16,1,.3,1), width .22s cubic-bezier(.16,1,.3,1);
}

.content-collapsed {
  margin-left: 72px;
  width: calc(100% - 72px);
}

.main-content__inner {
  width: 100%;
  max-width: 1580px;
  margin: 0 auto;
}

.mobile-topbar {
  display: none;
}

@keyframes orbit-pulse {
  0% { transform: scale(.75); opacity: 0; }
  35% { opacity: .65; }
  100% { transform: scale(1.45); opacity: 0; }
}

@media (max-width: 1180px) {
  .app-sidebar,
  .command-rail { width: 220px; }
  .workspace-topbar,
  .main-content { margin-left: 220px; }
  .main-content { width: calc(100% - 220px); padding: 24px 22px 40px; }
  .sidebar-collapsed { width: 72px; }
  .topbar-collapsed,
  .content-collapsed { margin-left: 72px; }
  .content-collapsed { width: calc(100% - 72px); }
}

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
    min-height: 58px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: rgba(255,255,255,.96);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 4px 14px rgba(15,31,53,.05);
    backdrop-filter: blur(10px);
  }

  [data-theme="dark"] .mobile-topbar {
    background: rgba(15,26,43,.96);
  }

  .brand-mobile {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .brand-mobile-core {
    width: 31px;
    height: 31px;
    border-radius: 10px;
    border: 1px solid #BDD0F4;
    background: radial-gradient(circle, #2563EB 0 25%, rgba(37,99,235,.10) 100%);
  }

  .brand-mobile-title {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 760;
  }

  .brand-mobile-subtitle {
    color: var(--text-muted);
    font-size: 10.5px;
  }

  .mobile-topbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-menu-btn {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    padding: 0;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-primary);
  }

  .main-content,
  .content-collapsed {
    margin-left: 0 !important;
    width: 100% !important;
    padding: 20px 16px 36px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rail-brand__pulse { animation: none; }
  .sidebar-item,
  .rail-item,
  .app-sidebar,
  .workspace-topbar,
  .main-content { transition: none !important; }
}
</style>

<style>
/* Global Portal Tooltip Styling */
.sidebar-portal-tooltip {
  position: fixed;
  transform: translateY(-50%);
  pointer-events: none;
  background: #0F1F35;
  color: #FFFFFF;
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
  border: 1px solid #D2E0EB;
  box-shadow: 0 10px 28px rgba(57, 88, 119, 0.14);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 1px;
  animation: tooltip-fade-in 0.15s ease-out;
}

[data-theme="dark"] .sidebar-portal-tooltip {
  background: #0B132B;
  border: 1px solid rgba(125, 211, 252, 0.25);
  color: #F8FAFC;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.sidebar-portal-tooltip::before {
  content: "";
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: transparent #FFFFFF transparent transparent;
}

[data-theme="dark"] .sidebar-portal-tooltip::before {
  border-color: transparent #0B132B transparent transparent;
}

.sidebar-portal-tooltip .tooltip-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.sidebar-portal-tooltip .tooltip-hint {
  font-size: 10.5px;
  color: #94A3B8;
  line-height: 1.2;
}

@keyframes tooltip-fade-in {
  from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
  to { opacity: 1; transform: translateY(-50%) translateX(0); }
}
</style>
