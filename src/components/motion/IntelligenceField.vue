<template>
  <div ref="host" class="intelligence-field" aria-hidden="true">
    <div class="intelligence-field__vignette"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { useTheme } from '@/composables/useTheme';

const host = ref<HTMLDivElement | null>(null);
const { isDark } = useTheme();

let renderer: any = null;
let scene: any = null;
let camera: any = null;
let rootGroup: any = null;
let orbMaterial: any = null;
let haloMaterial: any = null;
let particlesMaterial: any = null;
let gridHelper: any = null;
let glowLight: any = null;
let frame = 0;
let resizeObserver: ResizeObserver | null = null;
let pointerX = 0;
let pointerY = 0;
let targetX = 0;
let targetY = 0;
let isVisible = true;
let reducedMotion = false;

function applyThemeVisuals(dark: boolean) {
  if (!scene) return;

  if (dark) {
    // Dark Mode Theme Visuals
    scene.fog.color.setHex(0x05070d);
    scene.fog.density = 0.055;

    if (orbMaterial) {
      orbMaterial.color.setHex(0x38bdf8);
      orbMaterial.opacity = 0.12;
    }

    if (haloMaterial) {
      haloMaterial.color.setHex(0x60a5fa);
      haloMaterial.opacity = 0.20;
    }

    if (particlesMaterial) {
      particlesMaterial.color.setHex(0x7dd3fc);
      particlesMaterial.opacity = 0.58;
      particlesMaterial.size = 0.035;
      particlesMaterial.blending = THREE.AdditiveBlending;
    }

    if (glowLight) {
      glowLight.color.setHex(0x38bdf8);
      glowLight.intensity = 7;
    }

    if (gridHelper) {
      const gridMaterials = Array.isArray(gridHelper.material) ? gridHelper.material : [gridHelper.material];
      gridMaterials.forEach((material: any) => {
        material.color.setHex(0x0ea5e9);
        material.opacity = 0.055;
      });
    }
  } else {
    // Light Mode Theme Visuals (Bright Intelligence UI: airy, clean, icy blue)
    scene.fog.color.setHex(0xf5f8fc);
    scene.fog.density = 0.04;

    if (orbMaterial) {
      orbMaterial.color.setHex(0x0284c7);
      orbMaterial.opacity = 0.08;
    }

    if (haloMaterial) {
      haloMaterial.color.setHex(0x38bdf8);
      haloMaterial.opacity = 0.09;
    }

    if (particlesMaterial) {
      particlesMaterial.color.setHex(0x0ea5e9);
      particlesMaterial.opacity = 0.18;
      particlesMaterial.size = 0.028;
      particlesMaterial.blending = THREE.NormalBlending;
    }

    if (glowLight) {
      glowLight.color.setHex(0x38bdf8);
      glowLight.intensity = 2.5;
    }

    if (gridHelper) {
      const gridMaterials = Array.isArray(gridHelper.material) ? gridHelper.material : [gridHelper.material];
      gridMaterials.forEach((material: any) => {
        material.color.setHex(0xcbd5e1);
        material.opacity = 0.038;
      });
    }
  }
}

watch(isDark, (newVal) => {
  applyThemeVisuals(newVal);
});

function onPointerMove(event: PointerEvent) {
  targetX = (event.clientX / window.innerWidth - 0.5) * 2;
  targetY = (event.clientY / window.innerHeight - 0.5) * 2;
}

function onVisibilityChange() {
  isVisible = !document.hidden;
}

function resize() {
  if (!host.value || !renderer || !camera) return;
  const width = host.value.clientWidth || window.innerWidth;
  const height = host.value.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}

function animate() {
  frame = requestAnimationFrame(animate);
  if (!renderer || !scene || !camera || !rootGroup || !isVisible) return;

  pointerX += (targetX - pointerX) * 0.025;
  pointerY += (targetY - pointerY) * 0.025;

  if (!reducedMotion) {
    rootGroup.rotation.y += 0.00055;
    rootGroup.rotation.x += 0.00016;
  }

  rootGroup.rotation.y += pointerX * 0.00032;
  rootGroup.rotation.x += pointerY * 0.00022;

  camera.position.x += ((pointerX * 0.55) - camera.position.x) * 0.02;
  camera.position.y += ((-pointerY * 0.32) - camera.position.y) * 0.02;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

onMounted(() => {
  if (!host.value) return;

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070d, 0.055);

  camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !reducedMotion,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.value.prepend(renderer.domElement);
  } catch {
    // WebGL unsupported or in headless test environment
    return;
  }

  rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const orbGeometry = new THREE.IcosahedronGeometry(2.1, 2);
  orbMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const orb = new THREE.Mesh(orbGeometry, orbMaterial);
  orb.position.set(3.2, -0.2, -2.2);
  rootGroup.add(orb);

  const haloGeometry = new THREE.TorusGeometry(2.85, 0.012, 8, 180);
  haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.2,
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.position.copy(orb.position);
  halo.rotation.set(1.08, 0.34, 0.12);
  rootGroup.add(halo);

  const particleCount = reducedMotion ? 280 : 720;
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i += 1) {
    const radius = 4.5 + Math.random() * 9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.72;
    positions[i * 3 + 2] = Math.cos(phi) * radius - 4;
    sizes[i] = 0.45 + Math.random() * 1.25;
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  particlesMaterial = new THREE.PointsMaterial({
    color: 0x7dd3fc,
    size: 0.035,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  rootGroup.add(particles);

  gridHelper = new THREE.GridHelper(34, 34, 0x0ea5e9, 0x164e63);
  const gridMaterials = Array.isArray(gridHelper.material) ? gridHelper.material : [gridHelper.material];
  gridMaterials.forEach((material: any) => {
    material.transparent = true;
    material.opacity = 0.055;
  });
  gridHelper.position.set(0, -5.4, -4);
  gridHelper.rotation.x = Math.PI * 0.06;
  rootGroup.add(gridHelper);

  glowLight = new THREE.PointLight(0x38bdf8, 7, 20, 2);
  glowLight.position.set(3.2, -0.2, 2);
  scene.add(glowLight);

  // Apply initial theme visuals based on current theme
  applyThemeVisuals(isDark.value);

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host.value);
  resize();

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  animate();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
  window.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('visibilitychange', onVisibilityChange);

  if (scene) {
    scene.traverse((object: any) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) {
        object.material.forEach((material: any) => material?.dispose?.());
      } else {
        object.material?.dispose?.();
      }
    });
  }

  renderer?.dispose?.();
  renderer?.domElement?.remove?.();
});
</script>

<style scoped>
.intelligence-field {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(circle at 78% 18%, rgba(14, 165, 233, 0.10), transparent 27%),
    radial-gradient(circle at 18% 76%, rgba(59, 130, 246, 0.06), transparent 34%);
  transition: background 0.3s ease;
}

.intelligence-field :deep(canvas) {
  width: 100%;
  height: 100%;
  opacity: 0.95;
  filter: saturate(1.08);
  transition: opacity 0.3s ease;
}

.intelligence-field__vignette {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(5, 7, 13, 0.72) 0%, rgba(5, 7, 13, 0.24) 32%, rgba(5, 7, 13, 0.08) 66%, rgba(5, 7, 13, 0.32) 100%),
    radial-gradient(ellipse at center, transparent 30%, rgba(2, 4, 8, 0.54) 100%);
  transition: background 0.3s ease;
}

[data-theme="light"] .intelligence-field {
  background:
    radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.08), transparent 30%),
    radial-gradient(circle at 15% 75%, rgba(99, 102, 241, 0.03), transparent 35%);
  opacity: 1;
}

[data-theme="light"] .intelligence-field :deep(canvas) {
  opacity: 0.85;
}

[data-theme="light"] .intelligence-field__vignette {
  background:
    linear-gradient(90deg, rgba(245, 248, 252, 0.75) 0%, rgba(245, 248, 252, 0.25) 32%, rgba(245, 248, 252, 0.06) 66%, rgba(245, 248, 252, 0.35) 100%),
    radial-gradient(ellipse at center, transparent 40%, rgba(235, 242, 250, 0.5) 100%);
}

@media (max-width: 900px) {
  .intelligence-field {
    opacity: 0.6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .intelligence-field :deep(canvas) {
    opacity: 0.42;
  }
}
</style>

