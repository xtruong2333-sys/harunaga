<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" :style="zIndex ? { zIndex } : {}" @click="handleBackdrop">
        <div class="modal-container" :style="{ maxWidth: maxWidth || '520px' }" @click.stop>
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ title }}</h3>
              <p v-if="description" class="modal-description">{{ description }}</p>
            </div>
            <button class="modal-close-btn" @click="close" aria-label="Đóng">
              <AppIcon name="x" size="18" />
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    description?: string;
    maxWidth?: string;
    closeOnBackdrop?: boolean;
    zIndex?: number;
  }>(),
  {
    closeOnBackdrop: true,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

function close() {
  emit('update:modelValue', false);
}

function handleBackdrop() {
  if (props.closeOnBackdrop) {
    close();
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5,12,24,.54);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 999;
}

.modal-container {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 18px;
  box-shadow: 0 26px 70px rgba(4,11,22,.28);
  overflow: hidden;
}

.modal-header {
  padding: 20px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 740;
  color: var(--text-primary);
}

.modal-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.45;
}

.modal-close-btn {
  width: 34px;
  height: 34px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  border-radius: 10px;
  display: grid;
  place-items: center;
}

.modal-close-btn:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.modal-body {
  padding: 22px;
  max-height: calc(85vh - 140px);
  overflow-y: auto;
}

.modal-footer {
  padding: 15px 22px;
  border-top: 1px solid var(--border);
  background: var(--surface-muted);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity .18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
