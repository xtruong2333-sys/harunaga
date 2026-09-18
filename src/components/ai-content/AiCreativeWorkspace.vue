<template>
  <div class="creative-workspace-card">
    <!-- Segmented Tabs Header -->
    <div class="workspace-tabs-header">
      <div class="tabs-nav" role="tablist">
        <button
          v-for="mode in AI_OUTPUT_MODES"
          :key="mode.id"
          type="button"
          role="tab"
          :aria-selected="activeMode === mode.id"
          class="tab-btn"
          :class="{ 'is-active': activeMode === mode.id }"
          @click="$emit('update:activeMode', mode.id)"
        >
          <span>{{ mode.label }}</span>
        </button>
      </div>
    </div>

    <!-- TAB 1: TIÊU ĐỀ -->
    <div v-if="activeMode === 'titles'" class="tab-pane titles-pane">
      <div class="titles-list">
        <div
          v-for="(title, idx) in titleIdeas"
          :key="idx"
          class="title-row"
        >
          <span class="title-index">{{ idx + 1 }}</span>
          <p class="title-content">{{ title }}</p>
          <button
            type="button"
            class="btn-copy-item"
            :class="{ 'is-copied': copiedKey === 'title-' + idx }"
            title="Sao chép tiêu đề"
            @click="$emit('copy-item', title, 'title-' + idx)"
          >
            <AppIcon :name="copiedKey === 'title-' + idx ? 'check' : 'copy'" :size="14" />
            <span>{{ copiedKey === 'title-' + idx ? 'Đã chép' : 'Sao chép' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 2: THUMBNAIL CONCEPTS -->
    <div v-else-if="activeMode === 'thumbnails'" class="tab-pane thumbnails-pane">
      <div class="concepts-grid">
        <div
          v-for="(concept, idx) in thumbnailConcepts"
          :key="idx"
          class="concept-panel"
        >
          <div class="concept-header">
            <span class="concept-badge">Concept {{ idx + 1 }}</span>
            <h4 class="concept-title">{{ concept.concept }}</h4>
          </div>

          <!-- Wireframe mockup representation (strictly layout, no fake images) -->
          <div class="concept-wireframe-frame">
            <div class="wireframe-inner">
              <AppIcon name="image" :size="24" class="wireframe-icon" />
              <span class="wireframe-tag">Concept thumbnail</span>
              <span class="wireframe-note">Bản phác thảo ý tưởng</span>
            </div>
          </div>

          <div class="concept-fields">
            <div class="field-item">
              <span class="field-label">Trọng tâm hình ảnh:</span>
              <p class="field-text">{{ concept.visual_focus }}</p>
            </div>

            <div class="field-item">
              <span class="field-label">Chữ overlay:</span>
              <p class="field-text font-mono font-medium">{{ concept.text_overlay || 'Không có chữ' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: HOOK MỞ ĐẦU -->
    <div v-else-if="activeMode === 'hooks'" class="tab-pane hooks-pane">
      <div class="hooks-grid">
        <div
          v-for="(hook, idx) in hookIdeas"
          :key="idx"
          class="hook-card"
        >
          <div class="hook-card-header">
            <span class="hook-badge">Hook {{ idx + 1 }}</span>
            <button
              type="button"
              class="btn-copy-item"
              :class="{ 'is-copied': copiedKey === 'hook-' + idx }"
              title="Sao chép kịch bản hook"
              @click="$emit('copy-item', hook, 'hook-' + idx)"
            >
              <AppIcon :name="copiedKey === 'hook-' + idx ? 'check' : 'copy'" :size="14" />
              <span>{{ copiedKey === 'hook-' + idx ? 'Đã chép' : 'Sao chép' }}</span>
            </button>
          </div>

          <blockquote class="hook-quote">
            “{{ hook }}”
          </blockquote>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import {
  type ThumbnailConcept,
  type AiOutputMode,
  AI_OUTPUT_MODES,
} from '@/types/ai-content';

defineProps<{
  titleIdeas: string[];
  thumbnailConcepts: ThumbnailConcept[];
  hookIdeas: string[];
  activeMode: AiOutputMode;
  copiedKey: string | null;
}>();

defineEmits<{
  (e: 'update:activeMode', mode: AiOutputMode): void;
  (e: 'copy-item', text: string, id: string): void;
}>();
</script>

<style scoped>
.creative-workspace-card {
  margin-top: 16px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .creative-workspace-card {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.7);
}

.workspace-tabs-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  background: var(--bg-inset, #f8fafc);
}

[data-theme="dark"] .workspace-tabs-header {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.7);
}

.tabs-nav {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary, #0f172a);
  background: rgba(241, 245, 249, 0.8);
}

[data-theme="dark"] .tab-btn:hover {
  background: rgba(30, 41, 59, 0.6);
  color: #f8fafc;
}

.tab-btn.is-active {
  background: var(--surface, #ffffff);
  border-color: var(--border, #cbd5e1);
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

[data-theme="dark"] .tab-btn.is-active {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(71, 85, 105, 0.9);
  color: #60a5fa;
}

.tab-pane {
  padding: 20px 24px;
}

/* Titles Tab */
.titles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

[data-theme="dark"] .title-row {
  background: rgba(15, 23, 42, 0.3);
  border-color: rgba(51, 65, 85, 0.6);
}

.title-row:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] .title-row:hover {
  background: rgba(30, 41, 59, 0.5);
}

.title-index {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

[data-theme="dark"] .title-index {
  background: rgba(37, 99, 235, 0.2);
  color: #60a5fa;
}

.title-content {
  flex: 1;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  line-height: 1.4;
  margin: 0;
}

.btn-copy-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--border, #cbd5e1);
  background: var(--surface, #ffffff);
  color: var(--text-secondary, #475569);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

[data-theme="dark"] .btn-copy-item {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(71, 85, 105, 0.8);
  color: #cbd5e1;
}

.btn-copy-item:hover {
  color: var(--text-primary, #0f172a);
  border-color: #94a3b8;
}

.btn-copy-item.is-copied {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.4);
  color: #059669;
}

/* Thumbnails Tab */
.concepts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .concepts-grid {
    grid-template-columns: 1fr;
  }
}

.concept-panel {
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

[data-theme="dark"] .concept-panel {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.7);
}

.concept-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.concept-badge {
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

[data-theme="dark"] .concept-badge {
  color: #60a5fa;
}

.concept-title {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.concept-wireframe-frame {
  aspect-ratio: 16 / 9;
  background: rgba(226, 232, 240, 0.6);
  border: 1px dashed var(--border, #cbd5e1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

[data-theme="dark"] .concept-wireframe-frame {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(71, 85, 105, 0.7);
}

.wireframe-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-muted, #94a3b8);
}

.wireframe-icon {
  opacity: 0.6;
}

.wireframe-tag {
  font-size: 11.5px;
  font-weight: 600;
}

.wireframe-note {
  font-size: 10px;
  opacity: 0.8;
}

.concept-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
}

.field-text {
  font-size: 13px;
  line-height: 1.45;
  color: var(--text-primary, #0f172a);
  margin: 0;
}

/* Hooks Tab */
.hooks-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hook-card {
  background: var(--bg-inset, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 16px 20px;
}

[data-theme="dark"] .hook-card {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(51, 65, 85, 0.7);
}

.hook-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.hook-badge {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

[data-theme="dark"] .hook-badge {
  color: #60a5fa;
}

.hook-quote {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--text-primary, #0f172a);
  font-style: normal;
}

@media (prefers-reduced-motion: reduce) {
  .title-row {
    transform: none !important;
    transition: none !important;
  }
}
</style>
