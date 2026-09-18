// src/types/ai-content.ts
// Các kiểu dữ liệu dành cho tính năng Trợ Lý Nội Dung AI

export interface ThumbnailConcept {
  concept: string;
  visual_focus: string;
  text_overlay: string;
}

export interface AiContentAnalysis {
  summary: string;
  content_angle: string;
  why_it_may_attract_attention: string[];
  title_ideas: string[];
  thumbnail_concepts: ThumbnailConcept[];
  hook_ideas: string[];
  originality_note: string;
}

export interface AiAnalysisRequest {
  accessKey: string;
  videoId: string;
}

export interface AiAnalysisResponse {
  success: boolean;
  data?: AiContentAnalysis;
  error?: string;
}

export interface AiVideoOption {
  id: string;
  youtube_video_id: string | null;
  title: string;
  channel_id: string;
  channel_name: string;
  published_at: string | null;
  latest_view_count: number | null;
  latest_measured_vph: number | null;
  alert_vph_threshold: number | null;
  thumbnail_url: string | null;
  view_delta?: number | null;
}

export type AiOutputMode = 'titles' | 'thumbnails' | 'hooks';

export const AI_OUTPUT_MODES: { id: AiOutputMode; label: string }[] = [
  { id: 'titles', label: 'Tiêu đề' },
  { id: 'thumbnails', label: 'Thumbnail' },
  { id: 'hooks', label: 'Hook mở đầu' },
];

export const AI_CONTENT_OUTPUT_MODE_STORAGE_KEY = 'bbdt_ai_content_output_mode';
