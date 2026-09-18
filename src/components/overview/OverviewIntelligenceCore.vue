<template>
  <div ref="containerRef" class="overview-intelligence-core" aria-hidden="true">
    <canvas ref="canvasRef" class="core-canvas"></canvas>
    <div
      class="core-ambient-glow"
      :class="{ 'is-scanning-glow': scanStatus === 'running' }"
      :style="glowStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';

const props = withDefaults(
  defineProps<{
    activeChannels?: number;
    risingVideos?: number;
    maxVph?: number | null;
    scanStatus?: string | null;
  }>(),
  {
    activeChannels: 0,
    risingVideos: 0,
    maxVph: null,
    scanStatus: null,
  }
);

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: any = null;
let scene: any = null;
let camera: any = null;
let animId: number | null = null;
let clock: any = null;
let resizeObserver: ResizeObserver | null = null;
let themeObserver: MutationObserver | null = null;
let isPaused = false;

// Three objects
let coreGroup: any = null;
let wireMesh: any = null;
let solidMesh: any = null;
let ringMesh1: any = null;
let ringMesh2: any = null;
let signalPoints: any = null;

let isDark = false;

function checkTheme() {
  if (typeof document !== 'undefined') {
    isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  }
}

// Reactive Ambient Glow Style driven by maxVph & scanStatus
const glowStyle = computed(() => {
  const maxVphVal = props.maxVph || 0;
  const vphFactor = maxVphVal > 0 ? Math.min(1.5, 0.9 + Math.log10(Math.max(10, maxVphVal)) * 0.12) : 1.0;
  const isScanning = props.scanStatus === 'running';

  const scale = (isScanning ? 1.3 : 1.0) * vphFactor;
  const opacity = (isScanning ? 0.95 : 0.75) * (maxVphVal > 5000 ? 1.15 : 1.0);

  return {
    transform: `scale(${scale.toFixed(2)})`,
    opacity: Math.min(1, opacity).toFixed(2),
  };
});

function rebuildSignalNodes() {
  if (!coreGroup) return;

  if (signalPoints) {
    coreGroup.remove(signalPoints);
    if (signalPoints.geometry) signalPoints.geometry.dispose();
    if (signalPoints.material) signalPoints.material.dispose();
    signalPoints = null;
  }

  const baseChannels = props.activeChannels || 1;
  const rising = props.risingVideos || 0;
  const pointCount = Math.max(16, Math.min(120, Math.round(baseChannels * 3 + rising * 6)));
  const pointPositions: number[] = [];

  for (let i = 0; i < pointCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 1.35 + Math.random() * 0.75;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    pointPositions.push(x, y, z);
  }

  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));

  const cyanColor = isDark ? 0x67e8f9 : 0x0ea5e9;
  const baseSize = 0.055 + Math.min(rising, 15) * 0.003;
  const pointOpacity = Math.min(0.95, (isDark ? 0.7 : 0.6) + Math.min(rising, 10) * 0.035);

  const pointsMat = new THREE.PointsMaterial({
    color: cyanColor,
    size: baseSize,
    transparent: true,
    opacity: pointOpacity,
  });

  signalPoints = new THREE.Points(pointsGeo, pointsMat);
  coreGroup.add(signalPoints);
}

function updateMaterials() {
  checkTheme();
  const primaryColor = isDark ? 0x38bdf8 : 0x2563eb;
  const cyanColor = isDark ? 0x67e8f9 : 0x0ea5e9;
  const solidColor = isDark ? 0x090e18 : 0xf0f7ff;

  const maxVphVal = props.maxVph || 0;
  const vphBoost = maxVphVal > 0 ? Math.min(1.5, 1.0 + Math.log10(Math.max(10, maxVphVal)) * 0.1) : 1.0;

  if (wireMesh && wireMesh.material) {
    wireMesh.material.color.setHex(cyanColor);
    wireMesh.material.opacity = Math.min(0.85, (isDark ? 0.45 : 0.35) * vphBoost);
  }

  if (solidMesh && solidMesh.material) {
    solidMesh.material.color.setHex(solidColor);
    solidMesh.material.opacity = isDark ? 0.35 : 0.6;
  }

  if (ringMesh1 && ringMesh1.material) {
    ringMesh1.material.color.setHex(primaryColor);
    ringMesh1.material.opacity = isDark ? 0.55 : 0.45;
  }

  if (ringMesh2 && ringMesh2.material) {
    ringMesh2.material.color.setHex(cyanColor);
    ringMesh2.material.opacity = isDark ? 0.4 : 0.3;
  }

  if (signalPoints && signalPoints.material) {
    signalPoints.material.color.setHex(cyanColor);
    const rising = props.risingVideos || 0;
    signalPoints.material.size = 0.055 + Math.min(rising, 15) * 0.003;
    signalPoints.material.opacity = Math.min(0.95, (isDark ? 0.7 : 0.6) + Math.min(rising, 10) * 0.035);
  }
}

function startAnimationLoop() {
  if (animId !== null || isPaused || !renderer || !scene || !camera) return;
  if (!clock) clock = new THREE.Clock();
  else if (typeof clock.start === 'function') clock.start();

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animate = () => {
    if (isPaused) {
      animId = null;
      return;
    }
    animId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const isScanning = props.scanStatus === 'running';
    const speedMult = prefersReducedMotion ? 0.1 : (isScanning ? 2.2 : 1.0);

    if (coreGroup) {
      coreGroup.rotation.y += delta * 0.28 * speedMult;
      coreGroup.rotation.x += delta * 0.14 * speedMult;
    }

    if (ringMesh1) {
      ringMesh1.rotation.z -= delta * 0.35 * speedMult;
    }
    if (ringMesh2) {
      ringMesh2.rotation.z += delta * 0.22 * speedMult;
    }

    // Dynamic pulse of signal nodes based on scan status & rising videos
    if (signalPoints && signalPoints.material) {
      const time = clock.getElapsedTime();
      const pulseRate = isScanning ? 4.5 : 2.0;
      const pulse = (Math.sin(time * pulseRate) + 1) / 2;
      const baseSize = 0.055 + Math.min(props.risingVideos || 0, 15) * 0.003;
      signalPoints.material.size = baseSize + pulse * (isScanning ? 0.025 : 0.012);
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };

  animId = requestAnimationFrame(animate);
}

function stopAnimationLoop() {
  if (animId !== null && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(animId);
    animId = null;
  }
  if (clock && typeof clock.stop === 'function') {
    clock.stop();
  }
}

function initThree() {
  if (!canvasRef.value || !containerRef.value) return;

  try {
    checkTheme();
    const width = containerRef.value.clientWidth || 280;
    const height = containerRef.value.clientHeight || 280;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.8;

    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Inner core icosahedron (solid)
    const solidGeo = new THREE.IcosahedronGeometry(1.0, 1);
    const solidMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x090e18 : 0xf0f7ff,
      transparent: true,
      opacity: isDark ? 0.35 : 0.6,
      wireframe: false,
    });
    solidMesh = new THREE.Mesh(solidGeo, solidMat);
    coreGroup.add(solidMesh);

    // 2. Outer wireframe icosahedron
    const wireGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x67e8f9 : 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.45 : 0.35,
    });
    wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    // 3. Orbit Ring 1 (Horizontal tilt)
    const ringGeo1 = new THREE.BufferGeometry();
    const ringPoints1: number[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      ringPoints1.push(Math.cos(theta) * 1.6, Math.sin(theta) * 1.6, 0);
    }
    ringGeo1.setAttribute('position', new THREE.Float32BufferAttribute(ringPoints1, 3));
    const ringMat1 = new THREE.LineBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x2563eb,
      transparent: true,
      opacity: isDark ? 0.55 : 0.45,
    });
    ringMesh1 = new THREE.LineLoop(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 3;
    ringMesh1.rotation.y = Math.PI / 6;
    coreGroup.add(ringMesh1);

    // 4. Orbit Ring 2 (Vertical tilt)
    const ringGeo2 = new THREE.BufferGeometry();
    const ringPoints2: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      ringPoints2.push(Math.cos(theta) * 1.85, Math.sin(theta) * 1.85, 0);
    }
    ringGeo2.setAttribute('position', new THREE.Float32BufferAttribute(ringPoints2, 3));
    const ringMat2 = new THREE.LineBasicMaterial({
      color: isDark ? 0x67e8f9 : 0x0ea5e9,
      transparent: true,
      opacity: isDark ? 0.4 : 0.3,
    });
    ringMesh2 = new THREE.LineLoop(ringGeo2, ringMat2);
    ringMesh2.rotation.x = -Math.PI / 4;
    ringMesh2.rotation.z = Math.PI / 4;
    coreGroup.add(ringMesh2);

    // 5. Signal Nodes (Reactive)
    rebuildSignalNodes();

    // Start clean animation loop
    startAnimationLoop();

    // Resize Observer
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0 && renderer && camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }
        }
      });
      resizeObserver.observe(containerRef.value);
    }

  } catch (err) {
    // Graceful fallback for test or un-accelerated environments
    console.warn('Three.js IntelligenceCore fallback:', err);
  }
}

function handleVisibility() {
  if (typeof document !== 'undefined' && document.hidden) {
    isPaused = true;
    stopAnimationLoop();
  } else {
    isPaused = false;
    startAnimationLoop();
  }
}

// Full reactivity watcher: rebuild nodes and update materials / glows
watch(
  () => [props.activeChannels, props.risingVideos],
  () => {
    rebuildSignalNodes();
    updateMaterials();
  }
);

watch(
  () => [props.maxVph, props.scanStatus],
  () => {
    updateMaterials();
  }
);

onMounted(() => {
  initThree();
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility);

    // Watch for theme attribute changes
    themeObserver = new MutationObserver(() => {
      updateMaterials();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }
});

onBeforeUnmount(() => {
  stopAnimationLoop();
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibility);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }

  if (renderer) {
    renderer.dispose();
    if (typeof renderer.forceContextLoss === 'function') {
      renderer.forceContextLoss();
    }
  }
  if (solidMesh) {
    if (solidMesh.geometry) solidMesh.geometry.dispose();
    if (solidMesh.material) solidMesh.material.dispose();
  }
  if (wireMesh) {
    if (wireMesh.geometry) wireMesh.geometry.dispose();
    if (wireMesh.material) wireMesh.material.dispose();
  }
  if (ringMesh1) {
    if (ringMesh1.geometry) ringMesh1.geometry.dispose();
    if (ringMesh1.material) ringMesh1.material.dispose();
  }
  if (ringMesh2) {
    if (ringMesh2.geometry) ringMesh2.geometry.dispose();
    if (ringMesh2.material) ringMesh2.material.dispose();
  }
  if (signalPoints) {
    if (signalPoints.geometry) signalPoints.geometry.dispose();
    if (signalPoints.material) signalPoints.material.dispose();
  }
});
</script>

<style scoped>
.overview-intelligence-core {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.core-canvas {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  display: block;
  z-index: 1;
}

.core-ambient-glow {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(14, 165, 233, 0.06) 50%, transparent 70%);
  filter: blur(20px);
  pointer-events: none;
  z-index: 0;
  transition: transform 0.5s ease, opacity 0.5s ease;
  animation: pulse-glow 6s ease-in-out infinite alternate;
}

.core-ambient-glow.is-scanning-glow {
  background: radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 75%);
  animation: pulse-glow-fast 2s ease-in-out infinite alternate;
}

:root[data-theme="dark"] .core-ambient-glow {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(37, 99, 235, 0.09) 50%, transparent 70%);
}

:root[data-theme="dark"] .core-ambient-glow.is-scanning-glow {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.32) 0%, rgba(14, 165, 233, 0.18) 50%, transparent 75%);
}

@keyframes pulse-glow {
  0% { transform: scale(0.85); opacity: 0.6; }
  100% { transform: scale(1.15); opacity: 0.9; }
}

@keyframes pulse-glow-fast {
  0% { transform: scale(0.95); opacity: 0.75; }
  100% { transform: scale(1.3); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .core-ambient-glow {
    animation: none;
  }
}
</style>
