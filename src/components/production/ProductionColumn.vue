<template>
  <div class="production-column" :class="`col-status-${status}`">
    <!-- Column Header -->
    <div class="column-header">
      <div class="column-title-group">
        <span class="status-dot" :class="`dot-${status}`"></span>
        <h2 class="column-title">{{ title }}</h2>
      </div>
      <span class="column-count-badge font-mono">{{ items.length }}</span>
    </div>

    <!-- Column Scrollable Body -->
    <div class="column-body">
      <div v-if="items.length === 0" class="column-empty-state">
        <AppIcon name="inbox" :size="24" class="empty-icon" />
        <span class="empty-text">Chưa có nội dung</span>
      </div>

      <div v-else class="column-cards-list">
        <ProductionCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          :is-busy="busyItemIds.has(item.id)"
          :any-mutation-busy="anyMutationBusy"
          @change-status="$emit('change-status', $event)"
          @edit="$emit('edit', $event)"
          @archive="$emit('archive', $event)"
          @restore="$emit('restore', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductionItem, ProductionStatus } from '@/types/production';
import ProductionCard from './ProductionCard.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  status: ProductionStatus;
  title: string;
  items: ProductionItem[];
  busyItemIds: Set<string>;
  anyMutationBusy: boolean;
}>();

defineEmits<{
  (e: 'change-status', payload: { id: string; status: ProductionStatus }): void;
  (e: 'edit', item: ProductionItem): void;
  (e: 'archive', id: string): void;
  (e: 'restore', id: string): void;
  (e: 'delete', item: ProductionItem): void;
}>();
</script>

<style scoped>
.production-column {
  display: flex;
  flex-direction: column;
  flex: 0 0 320px;
  width: 320px;
  max-width: 330px;
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  overflow: hidden;
  max-height: calc(100vh - 270px);
  min-height: 480px;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface, #ffffff);
  border-bottom: 1px solid var(--border, #e2e8f0);
  position: sticky;
  top: 0;
  z-index: 5;
}

.column-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-idea { background: #f59e0b; }
.dot-research { background: #3b82f6; }
.dot-script { background: #6366f1; }
.dot-thumbnail { background: #ec4899; }
.dot-production { background: #9333ea; }
.dot-editing { background: #06b6d4; }
.dot-published { background: #10b981; }
.dot-archived { background: #64748b; }

.column-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary, #0f1f35);
  margin: 0;
}

.column-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary, #64748b);
  background: var(--bg-inset, #f1f5f9);
  border-radius: 11px;
}

.column-body {
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.column-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 180px;
  color: var(--text-tertiary, #94a3b8);
  gap: 8px;
  border: 1px dashed var(--border, #cbd5e1);
  border-radius: 10px;
  margin: 6px 0;
}

.empty-icon {
  opacity: 0.5;
}

.empty-text {
  font-size: 0.8125rem;
}
</style>
