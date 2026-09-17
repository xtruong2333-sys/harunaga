<template>
  <button
    type="button"
    role="switch"
    :aria-checked="isDark"
    :aria-label="isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'"
    :title="isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'"
    class="theme-toggle"
    :class="[
      `theme-toggle--${size}`,
      { 'theme-toggle--dark': isDark, 'theme-toggle--light': !isDark }
    ]"
    @click="toggleTheme"
    @keydown.space.prevent="toggleTheme"
    @keydown.enter.prevent="toggleTheme"
  >
    <!-- Background track with icons -->
    <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
      <AppIcon name="sun" :size="iconSize" />
    </span>
    
    <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
      <AppIcon name="moon" :size="iconSize" />
    </span>

    <!-- Sliding Knob -->
    <span class="theme-toggle__knob" aria-hidden="true">
      <AppIcon :name="isDark ? 'moon' : 'sun'" :size="knobIconSize" class="theme-toggle__knob-icon" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../../composables/useTheme';
import AppIcon from './AppIcon.vue';

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md';
  }>(),
  {
    size: 'md',
  }
);

const { isDark, toggleTheme } = useTheme();

const iconSize = computed(() => (props.size === 'sm' ? 12 : 13));
const knobIconSize = computed(() => (props.size === 'sm' ? 11 : 12));
</script>

<style scoped>
.theme-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 9999px;
  background-color: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  outline: none;
  user-select: none;
  padding: 2px;
  box-sizing: border-box;
  transition:
    background-color var(--duration-normal, 240ms) var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
    border-color var(--duration-normal, 240ms) var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
    box-shadow var(--duration-normal, 240ms) var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
}

.theme-toggle:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow, rgba(56, 189, 248, 0.3));
}

.theme-toggle:hover {
  border-color: var(--border-strong);
}

/* Sizing */
.theme-toggle--md {
  width: 58px;
  height: 30px;
}

.theme-toggle--sm {
  width: 50px;
  height: 26px;
}

/* Track Icons */
.theme-toggle__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: color var(--duration-normal, 240ms) ease, opacity var(--duration-normal, 240ms) ease;
  pointer-events: none;
}

.theme-toggle--md .theme-toggle__icon {
  width: 24px;
  height: 24px;
}

.theme-toggle--sm .theme-toggle__icon {
  width: 20px;
  height: 20px;
}

.theme-toggle__icon--sun {
  color: #F59E0B;
  opacity: 0.6;
}

.theme-toggle__icon--moon {
  color: #38BDF8;
  opacity: 0.6;
}

.theme-toggle--light .theme-toggle__icon--sun {
  opacity: 0.9;
}

.theme-toggle--dark .theme-toggle__icon--moon {
  opacity: 0.9;
}

/* Sliding Knob */
.theme-toggle__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 2;
  transition:
    transform var(--duration-normal, 240ms) var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
    background-color var(--duration-normal, 240ms) ease,
    border-color var(--duration-normal, 240ms) ease;
}

.theme-toggle--md .theme-toggle__knob {
  width: 24px;
  height: 24px;
}

.theme-toggle--sm .theme-toggle__knob {
  width: 20px;
  height: 20px;
}

/* Knob Positions */
.theme-toggle--light .theme-toggle__knob {
  transform: translateX(0);
  color: #D97706;
}

.theme-toggle--dark.theme-toggle--md .theme-toggle__knob {
  transform: translateX(28px);
  color: #38BDF8;
}

.theme-toggle--dark.theme-toggle--sm .theme-toggle__knob {
  transform: translateX(24px);
  color: #38BDF8;
}

.theme-toggle__knob-icon {
  transition: transform var(--duration-normal, 240ms) ease;
}

.theme-toggle:hover .theme-toggle__knob-icon {
  transform: rotate(15deg);
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle,
  .theme-toggle__knob,
  .theme-toggle__icon,
  .theme-toggle__knob-icon {
    transition: none !important;
  }
}
</style>
