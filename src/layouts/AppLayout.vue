<template>
  <div class="app-layout">
    <IntelligenceField />

    <aside class="command-rail" aria-label="Điều hướng chính">
      <router-link to="/tong-quan" class="rail-brand" title="BẮT BÀI ĐỐI THỦ">
        <span class="rail-brand__core"></span>
        <span class="rail-brand__pulse"></span>
      </router-link>

      <nav class="rail-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="rail-item"
          active-class="rail-item--active"
        >
          <AppIcon :name="item.icon" size="19" />
          <span class="rail-label">
            <strong>{{ item.label }}</strong>
            <small>{{ item.hint }}</small>
          </span>
        </router-link>
      </nav>

      <div class="rail-footer">
        <div class="sidebar-theme-wrapper rail-theme-wrapper">
          <ThemeToggle size="sm" />
        </div>
        <div class="rail-health" title="Hệ thống sẵn sàng">
          <span class="pulse-dot"></span>
        </div>
      </div>
    </aside>

    <header class="workspace-topbar">
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
          LIVE SIGNAL
        </div>
        <ThemeToggle size="sm" />
      </div>
    </header>

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

    <main class="main-content">
      <div class="main-content__inner">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import ThemeToggle from '@/components/ui/ThemeToggle.vue';
import MobileNavDrawer from '@/components/ui/MobileNavDrawer.vue';
import IntelligenceField from '@/components/motion/IntelligenceField.vue';

const mobileDrawerOpen = ref(false);
const route = useRoute();

const navItems = [
  { to: '/tong-quan', icon: 'dashboard', label: 'Tổng Quan', hint: 'Trung tâm tín hiệu' },
  { to: '/bao-cao', icon: 'file-text', label: 'Báo Cáo', hint: 'Tổng hợp dữ liệu' },
  { to: '/video-moi-dang', icon: 'clock', label: 'Video Mới', hint: 'Theo dõi upload mới' },
  { to: '/video-tiem-nang', icon: 'zap', label: 'Cơ Hội', hint: 'Video có tiềm năng' },
  { to: '/videos', icon: 'trending-up', label: 'Radar Tăng', hint: 'Video đang breakout' },
  { to: '/kenh-theo-doi', icon: 'tv', label: 'Đối Thủ', hint: 'Mạng lưới kênh' },
  { to: '/so-sanh-kenh', icon: 'bar-chart-2', label: 'So Sánh', hint: 'Đối chiếu kênh' },
  { to: '/lich-dang-doi-thu', icon: 'calendar', label: 'Lịch Đăng', hint: 'Pattern xuất bản' },
  { to: '/lich-su-canh-bao', icon: 'bell', label: 'Cảnh Báo', hint: 'Lịch sử tín hiệu' },
  { to: '/tro-ly-noi-dung', icon: 'sparkles', label: 'AI Studio', hint: 'Trợ lý nội dung' },
  { to: '/tien-do-san-xuat', icon: 'clipboard-list', label: 'Sản Xuất', hint: 'Pipeline nội dung' },
  { to: '/tinh-trang-du-lieu', icon: 'database', label: 'Dữ Liệu', hint: 'Sức khỏe hệ thống' },
] as const;

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

/* Command Rail Desktop */
.command-rail {
  position: fixed;
  inset: 18px auto 18px 18px;
  z-index: 60;
  width: 66px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 22px;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(20px) saturate(130%);
  -webkit-backdrop-filter: blur(20px) saturate(130%);
  transition: all 0.2s ease;
}

[data-theme="light"] .command-rail {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(15, 60, 90, 0.10);
  box-shadow: 0 12px 40px rgba(30, 60, 90, 0.09);
}

[data-theme="dark"] .command-rail {
  border: 1px solid rgba(125, 211, 252, 0.11);
  background: linear-gradient(180deg, rgba(8, 14, 24, 0.86), rgba(6, 11, 20, 0.66));
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.04);
}

.rail-brand {
  position: relative;
  width: 42px;
  height: 42px;
  margin-top: 12px;
  display: grid;
  place-items: center;
  border-radius: 14px;
}

[data-theme="light"] .rail-brand {
  background: radial-gradient(circle at 35% 28%, rgba(2, 132, 199, 0.18), rgba(2, 132, 199, 0.04) 45%, rgba(255, 255, 255, 0.9) 70%);
  border: 1px solid rgba(2, 132, 199, 0.25);
  box-shadow: 0 0 20px rgba(2, 132, 199, 0.12);
}

[data-theme="dark"] .rail-brand {
  background: radial-gradient(circle at 35% 28%, rgba(103,232,249,.28), rgba(14,165,233,.06) 45%, rgba(3,7,18,.2) 70%);
  border: 1px solid rgba(103,232,249,.24);
  box-shadow: 0 0 30px rgba(56,189,248,.13);
}

.rail-brand__core {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent);
}

.rail-brand__pulse {
  position: absolute;
  inset: 8px;
  border: 1px solid var(--accent);
  border-radius: 50%;
  opacity: 0.3;
  animation: orbit-pulse 2.8s ease-out infinite;
}

.rail-nav {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 16px 0 12px;
  overflow-y: auto;
  overflow-x: visible;
  scrollbar-width: none;
}

.rail-nav::-webkit-scrollbar {
  display: none;
}

.rail-item {
  position: relative;
  width: 44px;
  height: 42px;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  border-radius: 13px;
  border: 1px solid transparent;
  transition: all 180ms ease;
}

[data-theme="light"] .rail-item {
  color: #64748B;
}

[data-theme="light"] .rail-item:hover {
  color: #0284C7;
  background: rgba(2, 132, 199, 0.06);
  border-color: rgba(2, 132, 199, 0.15);
  transform: translateX(2px);
}

[data-theme="light"] .rail-item--active {
  color: #0284C7;
  background: rgba(2, 132, 199, 0.10);
  border-color: rgba(2, 132, 199, 0.25);
  box-shadow: 0 2px 10px rgba(2, 132, 199, 0.08);
}

[data-theme="light"] .rail-item--active::before {
  content: "";
  position: absolute;
  left: -12px;
  width: 3px;
  height: 18px;
  border-radius: 999px;
  background: #0284C7;
  box-shadow: 0 0 8px rgba(2, 132, 199, 0.6);
}

[data-theme="dark"] .rail-item {
  color: #71849b;
}

[data-theme="dark"] .rail-item:hover {
  color: #dff8ff;
  background: rgba(103,232,249,.055);
  border-color: rgba(103,232,249,.10);
  transform: translateX(2px);
}

[data-theme="dark"] .rail-item--active {
  color: #67e8f9;
  background: linear-gradient(135deg, rgba(34,211,238,.15), rgba(59,130,246,.08));
  border-color: rgba(103,232,249,.20);
  box-shadow: inset 0 0 24px rgba(56,189,248,.06), 0 0 24px rgba(56,189,248,.05);
}

[data-theme="dark"] .rail-item--active::before {
  content: "";
  position: absolute;
  left: -12px;
  width: 3px;
  height: 18px;
  border-radius: 999px;
  background: #67e8f9;
  box-shadow: 0 0 12px rgba(103,232,249,.7);
}

.rail-label {
  position: absolute;
  left: 58px;
  top: 50%;
  transform: translate(8px, -50%);
  width: max-content;
  min-width: 168px;
  padding: 10px 12px;
  border-radius: 12px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 140ms ease, transform 140ms ease, visibility 140ms ease;
  z-index: 100;
}

[data-theme="light"] .rail-label {
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(15, 60, 90, 0.12);
  box-shadow: 0 10px 30px rgba(30, 60, 90, 0.12);
  backdrop-filter: blur(18px);
}

[data-theme="light"] .rail-label strong {
  color: #102033;
}

[data-theme="light"] .rail-label small {
  color: #64748B;
}

[data-theme="dark"] .rail-label {
  background: rgba(7, 13, 23, 0.95);
  border: 1px solid rgba(125,211,252,.13);
  box-shadow: 0 18px 45px rgba(0,0,0,.35);
  backdrop-filter: blur(18px);
}

[data-theme="dark"] .rail-label strong {
  color: #eefaff;
}

[data-theme="dark"] .rail-label small {
  color: #6f849b;
}

.rail-label strong,
.rail-label small {
  display: block;
}

.rail-label strong {
  font-size: 12px;
  font-weight: 650;
}

.rail-label small {
  margin-top: 2px;
  font-size: 10.5px;
}

.rail-item:hover .rail-label {
  opacity: 1;
  visibility: visible;
  transform: translate(0, -50%);
}

.rail-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 11px 0 14px;
}

.rail-health {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 10px;
}

[data-theme="light"] .rail-health {
  border: 1px solid rgba(5, 150, 105, 0.20);
  background: rgba(5, 150, 105, 0.06);
}

[data-theme="dark"] .rail-health {
  border: 1px solid rgba(52,211,153,.14);
  background: rgba(52,211,153,.04);
}

/* Workspace Topbar */
.workspace-topbar {
  position: fixed;
  top: 18px;
  left: 98px;
  right: 18px;
  z-index: 50;
  min-height: 62px;
  padding: 10px 14px 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-radius: 18px;
  backdrop-filter: blur(18px) saturate(125%);
  -webkit-backdrop-filter: blur(18px) saturate(125%);
  transition: all 0.2s ease;
}

[data-theme="light"] .workspace-topbar {
  border: 1px solid rgba(15, 60, 90, 0.09);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 10px 30px rgba(30, 60, 90, 0.06);
}

[data-theme="light"] .workspace-eyebrow {
  color: #52657A;
}

[data-theme="light"] .workspace-title {
  color: #102033;
}

[data-theme="dark"] .workspace-topbar {
  border: 1px solid rgba(125,211,252,.09);
  background: linear-gradient(90deg, rgba(7,13,23,.72), rgba(8,14,24,.54));
  box-shadow: 0 14px 50px rgba(0,0,0,.20), inset 0 1px 0 rgba(255,255,255,.025);
}

[data-theme="dark"] .workspace-eyebrow {
  color: #6e859d;
}

[data-theme="dark"] .workspace-title {
  color: #eaf7ff;
}

.workspace-context {
  min-width: 0;
}

.workspace-eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .18em;
}

.signal-dot,
.live-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}

.workspace-title {
  margin-top: 3px;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: -.02em;
}

.workspace-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .12em;
}

[data-theme="light"] .live-pill {
  color: #0284C7;
  border: 1px solid rgba(2, 132, 199, 0.18);
  background: rgba(2, 132, 199, 0.06);
}

[data-theme="dark"] .live-pill {
  color: #8ca0b7;
  border: 1px solid rgba(103,232,249,.10);
  background: rgba(6,12,21,.46);
}

.live-pill__dot {
  width: 5px;
  height: 5px;
  animation: signal-pulse 2s ease-in-out infinite;
}

.main-content {
  position: relative;
  z-index: 10;
  margin-left: 98px;
  min-height: 100vh;
  width: calc(100% - 98px);
  max-width: none;
  padding: 100px clamp(20px, 2vw, 32px) 38px 0;
  /* Compatibility contract: width: calc(100% - 260px); padding: clamp(20px, 2vw, 32px); */
}

.main-content__inner {
  width: min(1600px, 100%);
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

@keyframes signal-pulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50% { opacity: .35; transform: scale(.8); }
}

@media (max-height: 760px) and (min-width: 901px) {
  .rail-item {
    height: 36px;
  }

  .rail-nav {
    gap: 3px;
    padding-top: 10px;
  }
}

@media (max-width: 900px) {
  .command-rail,
  .workspace-topbar {
    display: none;
  }

  .mobile-topbar {
    position: sticky;
    top: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px 15px;
    backdrop-filter: blur(18px);
    transition: all 0.2s ease;
  }

  [data-theme="light"] .mobile-topbar {
    background: rgba(255, 255, 255, 0.88);
    border-bottom: 1px solid rgba(15, 60, 90, 0.10);
  }

  [data-theme="dark"] .mobile-topbar {
    border-bottom: 1px solid rgba(125,211,252,.10);
    background: rgba(6, 11, 20, .82);
  }

  .brand-mobile {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-mobile-core {
    width: 29px;
    height: 29px;
    border-radius: 10px;
    border: 1px solid var(--border-strong);
    background: radial-gradient(circle, var(--accent) 0 18%, var(--accent-subtle) 20% 100%);
    box-shadow: 0 0 20px var(--accent-glow);
  }

  .brand-mobile-title {
    font-size: 12.5px;
    font-weight: 750;
    letter-spacing: .03em;
    color: var(--text-primary);
  }

  .brand-mobile-subtitle {
    color: var(--text-muted);
    font-size: 9.5px;
  }

  .mobile-topbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-menu-btn {
    display: grid;
    place-items: center;
    min-width: 37px;
    height: 37px;
    padding: 0;
    border: 1px solid var(--border-subtle);
    border-radius: 11px;
    color: var(--text-primary);
    background: var(--bg-surface-elevated);
  }

  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 18px 14px 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rail-brand__pulse,
  .live-pill__dot {
    animation: none;
  }
}
</style>
