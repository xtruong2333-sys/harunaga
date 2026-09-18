<template>
  <div class="production-board-container" aria-label="Bảng quy trình sản xuất">
    <div class="board-horizontal-track">
      <!-- When status === 'all', display 7 active workflow columns -->
      <template v-if="selectedStatus === 'all'">
        <ProductionColumn
          v-for="st in ACTIVE_WORKFLOW_STATUSES"
          :key="st"
          :status="st"
          :title="STATUS_LABELS[st]"
          :items="itemsByStatus[st] || []"
          :busy-item-ids="busyItemIds"
          :any-mutation-busy="isLocked"
          :interactions-locked="isLocked"
          @change-status="$emit('change-status', $event)"
          @edit="$emit('edit', $event)"
          @archive="$emit('archive', $event)"
          @restore="$emit('restore', $event)"
          @delete="$emit('delete', $event)"
        />
      </template>

      <!-- When status is specific (including archived), display focused column -->
      <template v-else>
        <div class="focused-column-wrap">
          <ProductionColumn
            :status="selectedStatus"
            :title="STATUS_LABELS[selectedStatus]"
            :items="itemsByStatus[selectedStatus] || []"
            :busy-item-ids="busyItemIds"
            :any-mutation-busy="isLocked"
            :interactions-locked="isLocked"
            class="focused-column"
            @change-status="$emit('change-status', $event)"
            @edit="$emit('edit', $event)"
            @archive="$emit('archive', $event)"
            @restore="$emit('restore', $event)"
            @delete="$emit('delete', $event)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProductionItem, ProductionStatus } from '@/types/production';
import { STATUS_LABELS, ACTIVE_WORKFLOW_STATUSES } from '@/types/production';
import ProductionColumn from './ProductionColumn.vue';

const props = defineProps<{
  items: ProductionItem[];
  selectedStatus: 'all' | ProductionStatus;
  busyItemIds: Set<string>;
  anyMutationBusy?: boolean;
  interactionsLocked?: boolean;
}>();

const isLocked = computed(() => !!(props.interactionsLocked || props.anyMutationBusy));

defineEmits<{
  (e: 'change-status', payload: { id: string; status: ProductionStatus }): void;
  (e: 'edit', item: ProductionItem): void;
  (e: 'archive', id: string): void;
  (e: 'restore', id: string): void;
  (e: 'delete', item: ProductionItem): void;
}>();

const itemsByStatus = computed(() => {
  const map: Partial<Record<ProductionStatus, ProductionItem[]>> = {};
  for (const item of props.items) {
    if (!map[item.status]) {
      map[item.status] = [];
    }
    map[item.status]!.push(item);
  }
  return map;
});
</script>

<style scoped>
.production-board-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 16px;
  -webkit-overflow-scrolling: touch;
}

.board-horizontal-track {
  display: flex;
  gap: 16px;
  min-width: min-content;
  align-items: flex-start;
}

.focused-column-wrap {
  width: 100%;
  max-width: 520px;
}

.focused-column {
  width: 100%;
  max-width: 520px;
}

@media (max-width: 768px) {
  .board-horizontal-track {
    scroll-snap-type: x mandatory;
  }

  .production-column {
    scroll-snap-align: start;
    width: 290px;
    flex-basis: 290px;
  }
}
</style>
