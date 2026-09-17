import { ref, computed } from 'vue';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'bbdt_theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage might be unavailable or throw in strict environments
  }
  return 'dark';
}

// Global reactive state shared across all components
const currentTheme = ref<Theme>(getInitialTheme());

function applyThemeToDom(theme: Theme): void {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Ensure DOM has initial theme attribute
if (typeof document !== 'undefined') {
  applyThemeToDom(currentTheme.value);
}

export function useTheme() {
  if (typeof document !== 'undefined' && document.documentElement && !document.documentElement.getAttribute('data-theme')) {
    applyThemeToDom(currentTheme.value);
  }

  const theme = computed(() => currentTheme.value);
  const isDark = computed(() => currentTheme.value === 'dark');

  const setTheme = (newTheme: Theme): void => {
    if (newTheme !== 'dark' && newTheme !== 'light') {
      newTheme = 'dark';
    }
    currentTheme.value = newTheme;
    applyThemeToDom(newTheme);

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      }
    } catch {
      // Ignore localStorage write errors
    }
  };

  const toggleTheme = (): void => {
    const nextTheme: Theme = currentTheme.value === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const initTheme = (): void => {
    const initial = getInitialTheme();
    setTheme(initial);
  };

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  };
}
