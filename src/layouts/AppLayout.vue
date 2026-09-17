<template>
  <div class="app-layout">
    <!-- Desktop Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#38BDF8">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
        </div>
        <div class="brand-text">
          <div class="brand-title">BẮT BÀI ĐỐI THỦ</div>
          <div class="brand-subtitle">Theo dõi đối thủ YouTube</div>
        </div>
      </div>

      <nav class="nav-menu">
        <router-link to="/tong-quan" class="nav-item" active-class="nav-item-active">
          <AppIcon name="dashboard" size="18" />
          <span>Tổng Quan</span>
        </router-link>
        <router-link to="/bao-cao" class="nav-item" active-class="nav-item-active">
          <AppIcon name="file-text" size="18" />
          <span>Báo Cáo</span>
        </router-link>
        <router-link to="/video-moi-dang" class="nav-item" active-class="nav-item-active">
          <AppIcon name="clock" size="18" />
          <span>Video Mới Đăng</span>
        </router-link>
        <router-link to="/video-tiem-nang" class="nav-item" active-class="nav-item-active">
          <AppIcon name="zap" size="18" />
          <span>Video Tiềm Năng</span>
        </router-link>
        <router-link to="/videos" class="nav-item" active-class="nav-item-active">
          <AppIcon name="trending-up" size="18" />
          <span>Video Đang Tăng</span>
        </router-link>
        <router-link to="/kenh-theo-doi" class="nav-item" active-class="nav-item-active">
          <AppIcon name="tv" size="18" />
          <span>Kênh Theo Dõi</span>
        </router-link>
        <router-link to="/so-sanh-kenh" class="nav-item" active-class="nav-item-active">
          <AppIcon name="bar-chart-2" size="18" />
          <span>So Sánh Kênh</span>
        </router-link>
        <router-link to="/lich-dang-doi-thu" class="nav-item" active-class="nav-item-active">
          <AppIcon name="calendar" size="18" />
          <span>Lịch Đăng Của Đối Thủ</span>
        </router-link>
        <router-link to="/lich-su-canh-bao" class="nav-item" active-class="nav-item-active">
          <AppIcon name="bell" size="18" />
          <span>Lịch Sử Cảnh Báo</span>
        </router-link>
        <router-link to="/tro-ly-noi-dung" class="nav-item" active-class="nav-item-active">
          <AppIcon name="sparkles" size="18" />
          <span>Trợ Lý Nội Dung AI</span>
        </router-link>
        <router-link to="/tien-do-san-xuat" class="nav-item" active-class="nav-item-active">
          <AppIcon name="clipboard-list" size="18" />
          <span>Tiến Độ Sản Xuất</span>
        </router-link>
        <router-link to="/tinh-trang-du-lieu" class="nav-item" active-class="nav-item-active">
          <AppIcon name="database" size="18" />
          <span>Tình Trạng Dữ Liệu</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-theme-wrapper">
          <span class="theme-label">Giao diện</span>
          <ThemeToggle size="md" />
        </div>
        <div class="footer-status-pill">
          <span class="pulse-dot"></span>
          <span>Hệ thống sẵn sàng</span>
        </div>
        <div class="version-tag">Phiên bản 1.0</div>
      </div>
    </aside>

    <!-- Mobile Topbar with Hamburger Menu -->
    <header class="mobile-topbar">
      <div class="brand-mobile">
        <div class="brand-mobile-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#38BDF8">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
        </div>
        <span class="brand-mobile-title">BẮT BÀI ĐỐI THỦ</span>
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
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </header>

    <!-- Mobile Drawer -->
    <MobileNavDrawer v-model="mobileDrawerOpen" />

    <!-- Main Content Area -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ThemeToggle from '@/components/ui/ThemeToggle.vue';
import MobileNavDrawer from '@/components/ui/MobileNavDrawer.vue';

const mobileDrawerOpen = ref(false);
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-main);
  max-width: 100vw;
  overflow-x: hidden;
}

.sidebar {
  width: 260px;
  background-color: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
}

.brand {
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.brand-logo-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background-color: var(--accent-subtle);
  border: 1px solid rgba(56, 189, 248, 0.25);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.15);
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
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--text-primary);
}

.brand-subtitle {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 1px;
}

.nav-menu {
  padding: 16px 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 13.5px;
  transition: all var(--duration-normal) var(--ease-out-expo);
  text-decoration: none;
  position: relative;
}

.nav-item:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-elevated);
}

.nav-item-active {
  color: var(--accent);
  background-color: var(--accent-subtle);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--accent);
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-theme-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.theme-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.footer-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  color: var(--text-secondary);
}

.version-tag {
  font-size: 11px;
  color: var(--text-muted);
}

.mobile-topbar {
  display: none;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  padding: clamp(20px, 2vw, 32px);
  width: calc(100% - 260px);
  max-width: none;
  min-width: 0;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .app-layout {
    flex-direction: column;
  }
  .sidebar {
    display: none;
  }
  .mobile-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    position: sticky;
    top: 0;
    z-index: 50;
    max-width: 100vw;
    box-sizing: border-box;
  }
  .brand-mobile {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand-mobile-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--accent-subtle);
    border: 1px solid rgba(56, 189, 248, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .brand-mobile-title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.02em;
  }
  .mobile-topbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .mobile-menu-btn {
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-primary);
    padding: 6px 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  .mobile-menu-btn:hover {
    border-color: var(--border-strong);
    background-color: var(--bg-surface-elevated);
  }
  .main-content {
    margin-left: 0;
    padding: 20px 16px;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
}
</style>

