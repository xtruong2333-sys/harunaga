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
        <router-link to="/kenh-theo-doi" class="nav-item" active-class="nav-item-active">
          <AppIcon name="tv" size="18" />
          <span>Kênh Theo Dõi</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="version-tag">Phiên bản 1.0</div>
      </div>
    </aside>

    <!-- Mobile Topbar -->
    <header class="mobile-topbar">
      <div class="brand-mobile">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#38BDF8">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
        <span class="brand-mobile-title">BẮT BÀI ĐỐI THỦ</span>
      </div>
      <nav class="mobile-nav">
        <router-link to="/kenh-theo-doi" class="mobile-nav-link" active-class="mobile-nav-link-active">
          Kênh Theo Dõi
        </router-link>
      </nav>
    </header>

    <!-- Main Content Area -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-main);
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
  padding: 24px 20px;
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
  border: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
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
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.15s ease;
}

.nav-item:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-elevated);
}

.nav-item-active {
  color: var(--accent);
  background-color: var(--accent-subtle);
  font-weight: 600;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
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
  padding: 32px 40px;
  max-width: 1400px;
}

@media (max-width: 900px) {
  .sidebar {
    display: none;
  }
  .mobile-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .brand-mobile {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand-mobile-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .mobile-nav-link {
    font-size: 13px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 6px;
    color: var(--text-secondary);
  }
  .mobile-nav-link-active {
    color: var(--accent);
    background-color: var(--accent-subtle);
  }
  .main-content {
    margin-left: 0;
    padding: 20px 16px;
  }
}
</style>
