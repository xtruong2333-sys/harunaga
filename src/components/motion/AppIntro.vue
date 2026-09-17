<template>
  <div
    class="app-intro-overlay"
    :class="{ 'intro-exiting': isExiting }"
    role="dialog"
    aria-modal="true"
    aria-label="Màn hình mở đầu Bắt Bài Đối Thủ"
  >
    <!-- Ambient Radial Glow -->
    <div class="ambient-glow" aria-hidden="true"></div>

    <!-- Intro Card Container -->
    <div class="intro-content">
      <!-- Radar / Orbital Rings & Center Logo -->
      <div class="radar-container" aria-hidden="true">
        <div class="orbital-ring ring-outer"></div>
        <div class="orbital-ring ring-middle"></div>
        <div class="orbital-ring ring-inner"></div>

        <div class="logo-shield">
          <svg viewBox="0 0 24 24" class="logo-svg" fill="none" stroke="currentColor">
            <defs>
              <linearGradient id="introLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#38BDF8" />
                <stop offset="100%" stop-color="#0284C7" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" stroke="url(#introLogoGrad)" stroke-width="1.8" />
            <polygon points="10,8 16,12 10,16" fill="url(#introLogoGrad)" />
          </svg>
        </div>
      </div>

      <!-- Sequence Typography -->
      <div class="text-sequence">
        <h1 class="brand-title">BẮT BÀI ĐỐI THỦ</h1>
        <p class="brand-tagline">Theo dõi đối thủ • Phát hiện video tăng nhanh</p>
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span class="status-text">Hệ thống sẵn sàng</span>
        </div>
      </div>

      <!-- Primary Entry CTA -->
      <div class="cta-wrap">
        <button
          ref="enterButtonRef"
          class="entry-cta-btn"
          type="button"
          :disabled="isExiting"
          @click="triggerEnter"
          @keydown.enter.prevent="triggerEnter"
          @keydown.space.prevent="triggerEnter"
        >
          <span class="btn-shimmer" aria-hidden="true"></span>
          <span class="btn-text">Vào Bảng Điều Khiển</span>
          <svg
            class="btn-arrow"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const emit = defineEmits<{
  (e: 'enter'): void;
}>();

const isExiting = ref(false);
const enterButtonRef = ref<HTMLButtonElement | null>(null);

function triggerEnter() {
  if (isExiting.value) return;
  isExiting.value = true;
  // Let the CSS exit animation play (360ms) before emitting enter
  setTimeout(() => {
    emit('enter');
  }, 360);
}

onMounted(() => {
  // Focus CTA button on mount for instant keyboard accessibility
  if (enterButtonRef.value) {
    enterButtonRef.value.focus();
  }
});
</script>

<style scoped>
.app-intro-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background-color: #07090D;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
  transition: opacity 0.36s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.36s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.36s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.app-intro-overlay.intro-exiting {
  opacity: 0;
  transform: scale(1.04);
  filter: blur(8px);
  pointer-events: none;
}

/* Ambient Radial Glow in background */
.ambient-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(14, 165, 233, 0.04) 45%, transparent 70%);
  pointer-events: none;
  filter: blur(40px);
}

.intro-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 480px;
  width: 100%;
}

/* Radar & Rings */
.radar-container {
  position: relative;
  width: 130px;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}

.orbital-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(56, 189, 248, 0.18);
  pointer-events: none;
}

.ring-outer {
  width: 126px;
  height: 126px;
  border-top-color: rgba(56, 189, 248, 0.6);
  border-right-color: transparent;
  animation: radar-spin 12s linear infinite;
}

.ring-middle {
  width: 96px;
  height: 96px;
  border-bottom-color: rgba(56, 189, 248, 0.5);
  border-left-color: transparent;
  animation: radar-spin-reverse 8s linear infinite;
}

.ring-inner {
  width: 68px;
  height: 68px;
  border: 1px dashed rgba(56, 189, 248, 0.35);
  animation: radar-pulse 3s ease-in-out infinite;
}

.logo-shield {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  animation: shield-glow 4s ease-in-out infinite alternate;
}

.logo-svg {
  width: 28px;
  height: 28px;
}

/* Sequencing Animations */
@keyframes radar-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes radar-spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes radar-pulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.08); opacity: 0.8; }
}

@keyframes shield-glow {
  0% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
  100% { box-shadow: 0 0 35px rgba(56, 189, 248, 0.45); }
}

/* Typography */
.text-sequence {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.brand-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #FFFFFF;
  background: linear-gradient(180deg, #FFFFFF 30%, #BAE6FD 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  animation: fade-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.brand-tagline {
  font-size: 13.5px;
  color: #94A3B8;
  font-weight: 400;
  margin: 0;
  letter-spacing: 0.02em;
  animation: fade-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.1s;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.15);
  animation: fade-slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.2s;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #22C55E;
  box-shadow: 0 0 8px #22C55E;
}

.status-text {
  font-size: 11.5px;
  color: #CBD5E1;
  font-weight: 500;
  letter-spacing: 0.04em;
}

/* CTA Button */
.cta-wrap {
  margin-top: 32px;
  width: 100%;
  max-width: 280px;
  animation: fade-slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.3s;
}

.entry-cta-btn {
  position: relative;
  width: 100%;
  height: 52px;
  border-radius: 12px;
  background: linear-gradient(180deg, #16202E 0%, #0D1520 100%);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #F0F6FC;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.15);
  overflow: hidden;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}

.entry-cta-btn:hover:not(:disabled) {
  border-color: #38BDF8;
  background: linear-gradient(180deg, #1E2D42 0%, #121E2F 100%);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.35);
  transform: translateY(-2px) scale(1.01);
}

.entry-cta-btn:focus-visible {
  border-color: #38BDF8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.4), 0 0 30px rgba(56, 189, 248, 0.3);
}

.entry-cta-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.btn-arrow {
  color: #38BDF8;
  transition: transform 0.2s ease;
}

.entry-cta-btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(4px);
}

/* Subtle Shimmer Sweep */
.btn-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  animation: shimmer-sweep 3.5s infinite;
  pointer-events: none;
}

@keyframes shimmer-sweep {
  0% { left: -100%; }
  40%, 100% { left: 100%; }
}

@keyframes fade-slide-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .app-intro-overlay {
    transition: opacity 0.15s ease;
  }
  .app-intro-overlay.intro-exiting {
    transform: none;
    filter: none;
  }
  .ring-outer,
  .ring-middle,
  .ring-inner,
  .logo-shield,
  .btn-shimmer {
    animation: none !important;
  }
  .brand-title,
  .brand-tagline,
  .status-indicator,
  .cta-wrap {
    animation: none !important;
    opacity: 1;
    transform: none;
  }
}
</style>
