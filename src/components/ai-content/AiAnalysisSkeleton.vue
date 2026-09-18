<template>
  <div class="analysis-skeleton-card" role="status" aria-label="Đang phân tích nội dung">
    <!-- Header Status -->
    <div class="skeleton-header-bar">
      <div class="skeleton-indicator">
        <span class="spinner-blue"></span>
        <span class="indicator-text">Đang phân tích nội dung từ video đã chọn…</span>
      </div>
    </div>

    <!-- Skeleton Content Blocks -->
    <div class="skeleton-body">
      <!-- 2 column editorial brief -->
      <div class="skeleton-brief-grid">
        <div class="skeleton-box">
          <div class="skeleton-line sm mb-3"></div>
          <div class="skeleton-line full mb-2"></div>
          <div class="skeleton-line full mb-2"></div>
          <div class="skeleton-line md"></div>
        </div>
        <div class="skeleton-box">
          <div class="skeleton-line sm mb-3"></div>
          <div class="skeleton-line full mb-2"></div>
          <div class="skeleton-line full mb-2"></div>
          <div class="skeleton-line md"></div>
        </div>
      </div>

      <!-- Signals block -->
      <div class="skeleton-signals-box">
        <div class="skeleton-line sm mb-4"></div>
        <div class="skeleton-line full mb-2"></div>
        <div class="skeleton-line full mb-2"></div>
        <div class="skeleton-line lg"></div>
      </div>

      <!-- Tabs & output skeleton -->
      <div class="skeleton-output-box">
        <div class="skeleton-tabs-row">
          <div class="skeleton-pill"></div>
          <div class="skeleton-pill"></div>
          <div class="skeleton-pill"></div>
        </div>
        <div class="skeleton-line full mb-2"></div>
        <div class="skeleton-line full mb-2"></div>
        <div class="skeleton-line md"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Skeleton loading component
</script>

<style scoped>
.analysis-skeleton-card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .analysis-skeleton-card {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.7);
}

.skeleton-header-bar {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border, #e2e8f0);
}

[data-theme="dark"] .skeleton-header-bar {
  border-color: rgba(51, 65, 85, 0.7);
}

.skeleton-indicator {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(37, 99, 235, 0.08);
  padding: 8px 14px;
  border-radius: 8px;
}

[data-theme="dark"] .skeleton-indicator {
  background: rgba(37, 99, 235, 0.18);
}

.spinner-blue {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(37, 99, 235, 0.2);
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.indicator-text {
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
}

[data-theme="dark"] .indicator-text {
  color: #60a5fa;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-brief-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 700px) {
  .skeleton-brief-grid {
    grid-template-columns: 1fr;
  }
}

.skeleton-box, .skeleton-signals-box, .skeleton-output-box {
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  padding: 16px;
}

[data-theme="dark"] .skeleton-box,
[data-theme="dark"] .skeleton-signals-box,
[data-theme="dark"] .skeleton-output-box {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.7);
}

.skeleton-tabs-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.skeleton-pill {
  width: 90px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

[data-theme="dark"] .skeleton-pill {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

[data-theme="dark"] .skeleton-line {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
}

.skeleton-line.sm { width: 30%; }
.skeleton-line.md { width: 60%; }
.skeleton-line.lg { width: 80%; }
.skeleton-line.full { width: 100%; }

.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line, .skeleton-pill {
    animation: none !important;
  }
}
</style>
