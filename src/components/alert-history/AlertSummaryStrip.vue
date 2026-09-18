<template>
  <div class="alert-summary-strip">
    <div class="summary-scope-bar" v-if="hasActiveFilter">
      <span class="scope-pill">
        <AppIcon name="filter" size="12" />
        Dữ liệu theo bộ lọc hiện tại
      </span>
    </div>

    <div class="summary-grid">
      <!-- 1. TỔNG CẢNH BÁO -->
      <div class="summary-card">
        <div class="card-icon icon-total">
          <AppIcon name="bell" size="18" />
        </div>
        <div class="card-content">
          <span class="card-label">TỔNG CẢNH BÁO</span>
          <div v-if="loading" class="skeleton-val"></div>
          <div v-else class="card-value mono">{{ summary.total.toLocaleString('vi-VN') }}</div>
          <span class="card-hint">Ghi nhận trong phạm vi</span>
        </div>
      </div>

      <!-- 2. ĐÃ CẢNH BÁO -->
      <div class="summary-card is-sent">
        <div class="card-icon icon-sent">
          <AppIcon name="check-circle" size="18" />
        </div>
        <div class="card-content">
          <span class="card-label">ĐÃ CẢNH BÁO</span>
          <div v-if="loading" class="skeleton-val"></div>
          <div v-else class="card-value mono">{{ summary.sent.toLocaleString('vi-VN') }}</div>
          <span class="card-hint">Đã gửi Discord thành công</span>
        </div>
      </div>

      <!-- 3. CHỜ / ĐANG GỬI -->
      <div class="summary-card is-waiting">
        <div class="card-icon icon-waiting">
          <AppIcon name="clock" size="18" />
        </div>
        <div class="card-content">
          <div class="label-with-badge">
            <span class="card-label">CHỜ / ĐANG GỬI</span>
            <span v-if="!loading && (summary.stuckCount ?? 0) > 0" class="stuck-count-badge" title="Cảnh báo sending > 15 phút">
              {{ summary.stuckCount }} gửi lâu
            </span>
          </div>
          <div v-if="loading" class="skeleton-val"></div>
          <div v-else class="card-value mono">{{ summary.waiting.toLocaleString('vi-VN') }}</div>
          <span class="card-hint">Đang xếp hàng hoặc gửi</span>
        </div>
      </div>

      <!-- 4. GỬI LỖI -->
      <div class="summary-card is-failed" :class="{ 'has-errors': summary.failed > 0 }">
        <div class="card-icon icon-failed">
          <AppIcon name="alert" size="18" />
        </div>
        <div class="card-content">
          <span class="card-label">GỬI LỖI</span>
          <div v-if="loading" class="skeleton-val"></div>
          <div v-else class="card-value mono">{{ summary.failed.toLocaleString('vi-VN') }}</div>
          <span class="card-hint">Cần kiểm tra sự cố</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import type { AlertHistorySummary } from '@/types/alert-history';

defineProps<{
  summary: AlertHistorySummary;
  loading?: boolean;
  hasActiveFilter?: boolean;
}>();
</script>

<style scoped>
.alert-summary-strip {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-scope-bar {
  display: flex;
  align-items: center;
}

.scope-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: var(--accent-subtle, #f0f9ff);
  color: var(--accent, #0284c7);
  border: 1px solid rgba(2, 132, 199, 0.2);
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 500;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}

.icon-total {
  background: #f1f5f9;
  color: #475569;
}

.icon-sent {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.icon-waiting {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

.icon-failed {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.label-with-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.card-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.04em;
}

.stuck-count-badge {
  font-size: 10px;
  font-weight: 600;
  color: #ea580c;
  background: rgba(249, 115, 22, 0.12);
  padding: 1px 6px;
  border-radius: 9999px;
  border: 1px solid rgba(249, 115, 22, 0.25);
  white-space: nowrap;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.summary-card.is-sent .card-value {
  color: #16a34a;
}

.summary-card.is-waiting .card-value {
  color: #d97706;
}

.summary-card.is-failed.has-errors .card-value {
  color: #dc2626;
}

.card-hint {
  font-size: 11.5px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skeleton-val {
  height: 28px;
  width: 60px;
  background: #e2e8f0;
  border-radius: 6px;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@media (max-width: 1024px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
