<template>
  <div ref="menuRef" class="channel-actions-menu">
    <button
      type="button"
      class="btn-dots"
      aria-label="Tùy chọn thao tác kênh"
      :aria-expanded="isOpen"
      @click.stop="toggleMenu"
    >
      <AppIcon name="more-vertical" size="15" />
    </button>

    <div v-if="isOpen" class="menu-dropdown surface-card" @click.stop>
      <router-link
        :to="'/kenh-theo-doi/' + channel.id"
        class="menu-item"
        @click="closeMenu"
      >
        <AppIcon name="bar-chart-2" size="14" />
        <span>Xem phân tích chi tiết</span>
      </router-link>

      <a
        v-if="channel.url"
        :href="channel.url"
        target="_blank"
        rel="noopener noreferrer"
        class="menu-item"
        @click="closeMenu"
      >
        <AppIcon name="external" size="14" />
        <span>Mở trên YouTube</span>
      </a>

      <button type="button" class="menu-item" @click="handleEdit">
        <AppIcon name="settings" size="14" />
        <span>Chỉnh thiết lập</span>
      </button>

      <div class="menu-divider"></div>

      <button
        v-if="channel.status === 'active'"
        type="button"
        class="menu-item"
        @click="handlePause"
      >
        <AppIcon name="pause" size="14" />
        <span>Tạm dừng theo dõi</span>
      </button>

      <button
        v-else-if="channel.status === 'paused'"
        type="button"
        class="menu-item text-positive"
        @click="handleResume"
      >
        <AppIcon name="play" size="14" />
        <span>Tiếp tục theo dõi</span>
      </button>

      <button
        v-if="channel.status === 'archived'"
        type="button"
        class="menu-item text-positive"
        @click="handleRestore"
      >
        <AppIcon name="rotate-ccw" size="14" />
        <span>Khôi phục theo dõi</span>
      </button>

      <button
        v-else
        type="button"
        class="menu-item text-danger"
        @click="handleArchive"
      >
        <AppIcon name="archive" size="14" />
        <span>Ngừng theo dõi</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Channel } from '@/types/channel';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
  channel: Channel;
}>();

const emit = defineEmits<{
  (e: 'edit', channel: Channel): void;
  (e: 'pause', id: string): void;
  (e: 'resume', id: string): void;
  (e: 'archive', id: string): void;
  (e: 'restore', id: string): void;
}>();

const isOpen = ref(false);
const menuRef = ref<HTMLDivElement | null>(null);

function toggleMenu() {
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
}

function handleEdit() {
  closeMenu();
  emit('edit', props.channel);
}

function handlePause() {
  closeMenu();
  emit('pause', props.channel.id);
}

function handleResume() {
  closeMenu();
  emit('resume', props.channel.id);
}

function handleArchive() {
  closeMenu();
  emit('archive', props.channel.id);
}

function handleRestore() {
  closeMenu();
  emit('restore', props.channel.id);
}

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    closeMenu();
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    closeMenu();
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
  }
});

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
  }
});
</script>

<style scoped>
.channel-actions-menu {
  position: relative;
  display: inline-flex;
}

.btn-dots {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-tertiary, #64748B);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-dots:hover,
.btn-dots[aria-expanded="true"] {
  background: var(--bg-surface-secondary, #F1F5F9);
  color: var(--text-primary, #0F172A);
  border-color: var(--border, #E2E8F0);
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  min-width: 190px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05);
  padding: 0.375rem;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.625rem;
  border-radius: var(--radius-sm, 6px);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #334155);
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.12s ease;
}

.menu-item:hover {
  background: var(--bg-surface-secondary, #F1F5F9);
  color: var(--brand-primary, #2563EB);
}

.menu-item.text-danger:hover {
  background: var(--color-danger-bg, #FEF2F2);
  color: var(--color-danger-text, #DC2626);
}

.menu-item.text-positive:hover {
  background: var(--color-success-bg, #ECFDF5);
  color: var(--color-success-text, #059669);
}

.menu-divider {
  height: 1px;
  background: var(--border, #E2E8F0);
  margin: 0.25rem 0;
}
</style>
