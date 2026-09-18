<template>
  <div class="publishing-filter-bar card">
    <div class="filter-controls-wrap">
      <!-- 1. Range Filter Buttons -->
      <div class="filter-group">
        <span class="group-label">Khoảng thời gian:</span>
        <div class="range-buttons-row">
          <button
            v-for="opt in rangeOptions"
            :key="opt.value"
            type="button"
            class="range-pill"
            :class="{ 'is-active': range === opt.value }"
            @click="$emit('update:range', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 2. Channel Selector -->
      <div class="filter-group">
        <span class="group-label">Kênh đối thủ:</span>
        <div class="select-wrap">
          <select
            :value="channelId || ''"
            class="filter-select channel-select"
            @change="onChannelChange($event)"
          >
            <option value="">Tất cả kênh ({{ channels.length }})</option>
            <option
              v-for="ch in channels"
              :key="ch.id"
              :value="ch.id"
            >
              {{ ch.name }}
            </option>
          </select>
          <AppIcon name="chevron-down" :size="14" class="select-icon" />
        </div>
      </div>

      <!-- 3. Weekday Filter -->
      <div class="filter-group">
        <span class="group-label">Thứ trong tuần:</span>
        <div class="select-wrap">
          <select
            :value="weekday === null ? '' : String(weekday)"
            class="filter-select weekday-select"
            @change="onWeekdayChange($event)"
          >
            <option value="">Tất cả các ngày</option>
            <option
              v-for="(wName, idx) in WEEKDAY_NAMES"
              :key="idx"
              :value="String(idx)"
            >
              {{ wName }}
            </option>
          </select>
          <AppIcon name="chevron-down" :size="14" class="select-icon" />
        </div>
      </div>
    </div>

    <!-- Active Filters & Reset -->
    <div v-if="hasActiveFilters" class="filter-actions">
      <span class="active-tag">Đang lọc</span>
      <button type="button" class="btn-clear-filters" @click="$emit('reset')">
        <AppIcon name="x" :size="13" />
        <span>Xóa bộ lọc</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { PublishingRange } from '@/types/publishing-schedule';
import { WEEKDAY_NAMES } from '@/services/publishing-schedule-service';

const props = defineProps<{
  range: PublishingRange;
  channelId: string | null;
  weekday: number | null;
  channels: Array<{ id: string; name: string }>;
}>();

const emit = defineEmits<{
  (e: 'update:range', val: PublishingRange): void;
  (e: 'update:channelId', val: string | null): void;
  (e: 'update:weekday', val: number | null): void;
  (e: 'reset'): void;
}>();

const rangeOptions: { value: PublishingRange; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: 'all', label: 'Tất cả lịch sử' },
];

const hasActiveFilters = computed(() => {
  return props.range !== '30d' || props.channelId !== null || props.weekday !== null;
});

function onChannelChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  const val = target.value.trim();
  emit('update:channelId', val ? val : null);
}

function onWeekdayChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  const val = target.value.trim();
  if (!val) {
    emit('update:weekday', null);
  } else {
    const num = parseInt(val, 10);
    emit('update:weekday', isNaN(num) ? null : num);
  }
}
</script>

<style scoped>
.publishing-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.filter-controls-wrap {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.range-buttons-row {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
}

.range-pill {
  border: none;
  background: transparent;
  padding: 5px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.range-pill:hover {
  color: #0f172a;
}

.range-pill.is-active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.filter-select {
  appearance: none;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 6px 32px 6px 12px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s ease;
}

.filter-select:hover {
  border-color: #94a3b8;
}

.filter-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.channel-select {
  min-width: 190px;
  max-width: 260px;
}

.weekday-select {
  min-width: 140px;
}

.select-icon {
  position: absolute;
  right: 10px;
  color: #64748b;
  pointer-events: none;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.active-tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
}

.btn-clear-filters {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px dashed #cbd5e1;
  background: transparent;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-clear-filters:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #ef4444;
}

@media (max-width: 768px) {
  .publishing-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-controls-wrap {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .range-buttons-row {
    overflow-x: auto;
  }
  .channel-select,
  .weekday-select {
    width: 100%;
    max-width: none;
  }
}
</style>
